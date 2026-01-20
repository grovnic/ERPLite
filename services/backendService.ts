
import { Tenant, User, ERPDocument, Client, InventoryItem, AuditEntry, AuditAction, UserRole, TenantStatus } from '../types';

// Assuming these are provided via environment variables in Vercel/hosting
const SB_URL = (process.env as any).SUPABASE_URL || '';
const SB_KEY = (process.env as any).SUPABASE_ANON_KEY || '';

const headers = {
  'apikey': SB_KEY,
  'Authorization': `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const sbFetch = async (endpoint: string, options: RequestInit = {}) => {
  if (!SB_URL) throw new Error("Supabase URL is not configured.");
  const response = await fetch(`${SB_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Baza podataka je vratila grešku.");
  }
  return response.json();
};

export const backendService = {
  async _log(user: User, action: AuditAction, resource: string, details: string) {
    const entry: AuditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: user.id,
      username: user.username,
      tenantId: user.tenantId,
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

      if (tenant?.status === 'PENDING') return { user: null, error: 'Nalog čeka odobrenje.' };
      if (tenant?.status === 'REJECTED') return { user: null, error: 'Nalog je odbijen.' };

      const formattedUser: User = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        tenantId: user.tenant_id
      };

      await this._log(formattedUser, 'LOGIN', 'System', `Prijava korisnika u oblak.`);
      return { user: formattedUser };
    } catch (e: any) {
      return { user: null, error: e.message };
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
        security_policy: { sessionTimeoutMinutes: 30 }
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
    await this._log(adminUser, status === 'APPROVED' ? 'APPROVE' : 'REJECT', 'Tenant', `Promjena statusa za ${tenantId}`);
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
    const raw = await sbFetch(`${resource}?tenant_id=eq.${tenantId}&select=*`);
    return raw.map((r: any) => ({
      ...r,
      ...r.data // Extract nested JSON data
    }));
  },

  async saveData<T extends { id: string, tenantId: string }>(user: User, resource: string, data: T[], action: AuditAction = 'UPDATE', details?: string): Promise<void> {
    // Supabase strategy: Upsert each item or delete existing for tenant and insert new
    // For simplicity, we'll upsert using the REST API bulk feature
    for (const item of data) {
      const { id, tenantId, ...rest } = item as any;
      await sbFetch(resource, {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          id,
          tenant_id: tenantId,
          data: rest // Store dynamic properties in a JSONB column
        })
      });
    }
    await this._log(user, action, resource, details || `Sinhronizacija: ${resource}`);
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
    // Exporting from cloud is the same logic as local but fetching all stores
    const backup: any = {};
    const stores = ['tenants', 'users', 'documents', 'clients', 'inventory', 'audit_log'];
    for (const store of stores) {
      backup[store] = await sbFetch(`${store}?select=*`);
    }
    return backup;
  },

  // Fix: Added missing importFullBackup method to restore database state from backup JSON
  async importFullBackup(user: User, backupData: any): Promise<void> {
    const stores = ['tenants', 'users', 'documents', 'clients', 'inventory', 'audit_log'];
    for (const store of stores) {
      if (backupData[store] && Array.isArray(backupData[store])) {
        for (const item of backupData[store]) {
          await sbFetch(store, {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify(item)
          });
        }
      }
    }
    await this._log(user, 'UPDATE', 'System', 'Uvoz cijele baze podataka iz backupa.');
  }
};
