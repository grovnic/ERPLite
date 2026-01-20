
import { Tenant, User, ERPDocument, Client, InventoryItem, AuditEntry, AuditAction, UserRole, TenantStatus } from '../types';

/**
 * VAŽNO: 
 * Za rad u browseru OBAVEZNO koristi "anon public" ključ iz Supabase Dashboard-a.
 * (Settings -> API -> Project API keys -> anon public)
 * NEMOJ koristiti "service_role" ključ jer će Supabase blokirati zahtjeve.
 */
const SB_URL = 'https://zbzuvrwvpmnqrlunpujf.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpienV2cnd2cG1ucXJsdW5wdWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjgwNjcsImV4cCI6MjA4NDUwNDA2N30.CuxkcablhF0u2b6ho5kwuCAMe7HARYcjoL5TlKwEH8A'; 

const headers = {
  'apikey': SB_KEY,
  'Authorization': `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const sbFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${SB_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Greška u komunikaciji sa bazom.' }));
    // Ako dobijete "Forbidden", to znači da i dalje koristite secret key u browseru.
    throw new Error(err.message || "Baza podataka je vratila grešku.");
  }
  return response.json();
};

export const backendService = {
  async _log(user: User, action: AuditAction, resource: string, details: string) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      user_id: user.id,
      username: user.username,
      tenant_id: user.tenantId,
      action,
      resource,
      details
    };
    try {
      await sbFetch('audit_log', {
        method: 'POST',
        body: JSON.stringify(entry)
      });
    } catch (e) {
      console.error("Audit log failed", e);
    }
  },

  async login(email: string, password?: string): Promise<{ user: User | null; error?: string }> {
    try {
      const users = await sbFetch(`users?email=eq.${email.toLowerCase()}&select=*`);
      const user = users[0];
      
      if (!user || (password && user.password !== password)) {
        return { user: null, error: 'Pogrešan email ili lozinka.' };
      }

      const tenants = await sbFetch(`tenants?id=eq.${user.tenant_id}&select=status`);
      const tenant = tenants[0];

      if (tenant?.status === 'PENDING') return { user: null, error: 'Vaš nalog čeka odobrenje.' };
      if (tenant?.status === 'REJECTED') return { user: null, error: 'Nalog je odbijen.' };

      const formattedUser: User = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        tenantId: user.tenant_id
      };

      await this._log(formattedUser, 'LOGIN', 'System', `Uspješna prijava.`);
      return { user: formattedUser };
    } catch (e: any) {
      return { user: null, error: e.message || "Konekcija sa bazom nije uspjela." };
    }
  },

  async register(userData: Partial<User>, companyData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const tenantId = `t_${crypto.randomUUID()}`;
      const userId = `u_${crypto.randomUUID()}`;

      const newTenant = {
        id: tenantId,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        company: companyData,
        security_policy: { sessionTimeoutMinutes: 60 }
      };

      const newUser = {
        id: userId,
        email: userData.email!.toLowerCase(),
        password: userData.password!,
        username: userData.email!.split('@')[0],
        role: 'USER',
        tenant_id: tenantId
      };

      await sbFetch('tenants', { method: 'POST', body: JSON.stringify(newTenant) });
      await sbFetch('users', { method: 'POST', body: JSON.stringify(newUser) });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateTenantStatus(adminUser: User, tenantId: string, status: TenantStatus): Promise<void> {
    await sbFetch(`tenants?id=eq.${tenantId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    await this._log(adminUser, status === 'APPROVED' ? 'APPROVE' : 'REJECT', 'Tenant', `Promjena statusa u: ${status}`);
  },

  async getTenants(): Promise<Tenant[]> {
    const raw = await sbFetch('tenants?select=*');
    return raw.map((r: any) => ({
      id: r.id,
      status: r.status,
      createdAt: r.created_at,
      company: r.company,
      securityPolicy: r.security_policy
    }));
  },

  async getData<T>(tenantId: string, resource: string): Promise<T[]> {
    try {
      const raw = await sbFetch(`${resource}?tenant_id=eq.${tenantId}&select=*`);
      return raw.map((r: any) => ({
        id: r.id,
        tenantId: r.tenant_id,
        ...r.data
      }));
    } catch (e) {
      console.error(`Greška pri učitavanju: ${resource}`, e);
      return [];
    }
  },

  async saveData<T extends { id: string, tenantId: string }>(user: User, resource: string, data: T[], action: AuditAction = 'UPDATE', details?: string): Promise<void> {
    if (data.length === 0) return;

    const payload = data.map(item => {
      const { id, tenantId, ...rest } = item as any;
      return {
        id,
        tenant_id: tenantId,
        data: rest,
        ...(rest.type ? { type: rest.type } : {}),
        ...(rest.number ? { number: rest.number } : {}),
        ...(rest.code ? { code: rest.code } : {}),
        ...(rest.name ? { name: rest.name } : {})
      };
    });

    await sbFetch(resource, {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload)
    });

    await this._log(user, action, resource, details || `Sinhronizacija podataka.`);
  },

  async getAuditLogs(tenantId: string | 'ALL'): Promise<AuditEntry[]> {
    const query = tenantId === 'ALL' ? 'audit_log?select=*&order=timestamp.desc' : `audit_log?tenant_id=eq.${tenantId}&select=*&order=timestamp.desc`;
    const raw = await sbFetch(query);
    return raw.map((r: any) => ({
      id: r.id,
      timestamp: r.timestamp,
      userId: r.user_id,
      username: r.username,
      tenantId: r.tenant_id,
      action: r.action,
      resource: r.resource,
      details: r.details
    }));
  },

  async exportFullBackup(): Promise<any> {
    const backup: any = {};
    const stores = ['tenants', 'users', 'documents', 'clients', 'inventory', 'audit_log'];
    for (const store of stores) {
      backup[store] = await sbFetch(`${store}?select=*`);
    }
    return backup;
  },

  async importFullBackup(user: User, backupData: any): Promise<void> {
    const stores = ['tenants', 'users', 'documents', 'clients', 'inventory', 'audit_log'];
    for (const store of stores) {
      if (backupData[store] && Array.isArray(backupData[store])) {
        await sbFetch(store, {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify(backupData[store])
        });
      }
    }
    await this._log(user, 'UPDATE', 'System', 'Uvoz backupa u Cloud.');
  }
};
