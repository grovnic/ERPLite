
import { Tenant, User, ERPDocument, Client, InventoryItem, AuditEntry, AuditAction, UserRole, TenantStatus } from '../types.ts';

// Config
const SB_URL = 'https://zbzuvrwvpmnqrlunpujf.supabase.co';
// Fix: Explicitly type SB_KEY as string to avoid type narrowing to literal causing 'never' type in comparison
const SB_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpienV2cnd2cG1ucXJsdW5wdWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjgwNjcsImV4cCI6MjA4NDUwNDA2N30.CuxkcablhF0u2b6ho5kwuCAMe7HARYcjoL5TlKwEH8A'; 

const isSupabaseConfigured = SB_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpienV2cnd2cG1ucXJsdW5wdWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjgwNjcsImV4cCI6MjA4NDUwNDA2N30.CuxkcablhF0u2b6ho5kwuCAMe7HARYcjoL5TlKwEH8A' && SB_KEY.length > 20;

const headers = {
  'apikey': SB_KEY,
  'Authorization': `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const sbFetch = async (endpoint: string, options: RequestInit = {}) => {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured. Using LocalStorage fallback.");
  
  const response = await fetch(`${SB_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Greška u komunikaciji sa bazom.' }));
    throw new Error(err.message || "Baza podataka je vratila grešku.");
  }
  return response.json();
};

// Fallback logic for local development/demo
const getLocal = (key: string) => JSON.parse(localStorage.getItem(`erp_${key}`) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(`erp_${key}`, JSON.stringify(data));

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
    
    if (isSupabaseConfigured) {
      try {
        await sbFetch('audit_log', { method: 'POST', body: JSON.stringify(entry) });
      } catch (e) { console.error("Cloud logging failed", e); }
    } else {
      const logs = getLocal('audit_log');
      setLocal('audit_log', [entry, ...logs]);
    }
  },

  async login(email: string, password?: string): Promise<{ user: User | null; error?: string }> {
    try {
      if (isSupabaseConfigured) {
        const users = await sbFetch(`users?email=eq.${email.toLowerCase()}&select=*`);
        const user = users[0];
        if (!user || (password && user.password !== password)) return { user: null, error: 'Pogrešan email ili lozinka.' };
        
        const tenants = await sbFetch(`tenants?id=eq.${user.tenant_id}&select=status`);
        if (tenants[0]?.status === 'PENDING') return { user: null, error: 'Vaš nalog čeka odobrenje.' };

        const formattedUser: User = { id: user.id, email: user.email, username: user.username, role: user.role, tenantId: user.tenant_id };
        await this._log(formattedUser, 'LOGIN', 'System', `Uspješna prijava.`);
        return { user: formattedUser };
      } else {
        // Mock login for demo
        const users = getLocal('users');
        const user = users.find((u: any) => u.email === email.toLowerCase());
        
        // If no users at all, create a superadmin demo
        if (users.length === 0 && email === 'admin@demo.ba') {
            const demoUser: User = { id: 'u_demo', email: 'admin@demo.ba', username: 'Demo Admin', role: 'SUPER_ADMIN', tenantId: 't_demo' };
            setLocal('users', [demoUser]);
            return { user: demoUser };
        }

        if (!user) return { user: null, error: 'Demo nalog nije pronađen. Koristite admin@demo.ba' };
        return { user };
      }
    } catch (e: any) {
      return { user: null, error: e.message || "Konekcija sa bazom nije uspjela." };
    }
  },

  async register(userData: Partial<User>, companyData: any): Promise<{ success: boolean; error?: string }> {
    const tenantId = `t_${crypto.randomUUID()}`;
    const userId = `u_${crypto.randomUUID()}`;

    const newTenant = {
      id: tenantId,
      status: isSupabaseConfigured ? 'PENDING' : 'APPROVED',
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

    if (isSupabaseConfigured) {
      await sbFetch('tenants', { method: 'POST', body: JSON.stringify(newTenant) });
      await sbFetch('users', { method: 'POST', body: JSON.stringify(newUser) });
    } else {
      setLocal('tenants', [...getLocal('tenants'), newTenant]);
      setLocal('users', [...getLocal('users'), newUser]);
    }

    return { success: true };
  },

  async getTenants(): Promise<Tenant[]> {
    if (isSupabaseConfigured) {
      const raw = await sbFetch('tenants?select=*');
      return raw.map((r: any) => ({
        id: r.id, status: r.status, createdAt: r.created_at, company: r.company, securityPolicy: r.security_policy
      }));
    } else {
      const raw = getLocal('tenants');
      // Ensure at least one demo tenant exists
      if (raw.length === 0) {
        const demo = { id: 't_demo', status: 'APPROVED', createdAt: new Date().toISOString(), company: { name: 'Demo Firma d.o.o.', address: 'Glavna 1', city: 'Sarajevo', zip: '71000', jib: '4200000000001', bankAccounts: [], email: 'demo@firma.ba', phone: '033123456', defaultPlaceOfIssue: 'Sarajevo', defaultLanguage: 'BS' }, securityPolicy: { sessionTimeoutMinutes: 60 } };
        setLocal('tenants', [demo]);
        return [demo as any];
      }
      return raw;
    }
  },

  // Fix: Added missing updateTenantStatus method to fix error in TenantManagement.tsx
  async updateTenantStatus(user: User, tenantId: string, status: TenantStatus): Promise<void> {
    if (isSupabaseConfigured) {
      await sbFetch(`tenants?id=eq.${tenantId}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ status }) 
      });
    } else {
      const tenants = getLocal('tenants');
      const updated = tenants.map((t: any) => t.id === tenantId ? { ...t, status } : t);
      setLocal('tenants', updated);
    }
    await this._log(user, status === 'APPROVED' ? 'APPROVE' : 'REJECT', 'Tenant', `Promijenjen status tenanta ${tenantId} u ${status}`);
  },

  async getData<T>(tenantId: string, resource: string): Promise<T[]> {
    if (isSupabaseConfigured) {
      try {
        const raw = await sbFetch(`${resource}?tenant_id=eq.${tenantId}&select=*`);
        return raw.map((r: any) => ({ id: r.id, tenantId: r.tenant_id, ...r.data }));
      } catch (e) { return []; }
    } else {
      return getLocal(resource).filter((i: any) => i.tenantId === tenantId);
    }
  },

  async saveData<T extends { id: string, tenantId: string }>(user: User, resource: string, data: T[], action: AuditAction = 'UPDATE', details?: string): Promise<void> {
    if (isSupabaseConfigured) {
      const payload = data.map(item => {
        const { id, tenantId, ...rest } = item as any;
        return {
          id, tenant_id: tenantId, data: rest,
          ...(rest.type ? { type: rest.type } : {}),
          ...(rest.number ? { number: rest.number } : {}),
          ...(rest.code ? { code: rest.code } : {}),
          ...(rest.name ? { name: rest.name } : {})
        };
      });
      await sbFetch(resource, { method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates' }, body: JSON.stringify(payload) });
    } else {
      // For local storage, we usually replace the whole set for that tenant or merge
      const all = getLocal(resource);
      const filtered = all.filter((i: any) => i.tenantId !== user.tenantId);
      setLocal(resource, [...filtered, ...data]);
    }
    await this._log(user, action, resource, details || `Sinhronizacija podataka.`);
  },

  async getAuditLogs(tenantId: string | 'ALL'): Promise<AuditEntry[]> {
    if (isSupabaseConfigured) {
      const query = tenantId === 'ALL' ? 'audit_log?select=*&order=timestamp.desc' : `audit_log?tenant_id=eq.${tenantId}&select=*&order=timestamp.desc`;
      const raw = await sbFetch(query);
      return raw.map((r: any) => ({
        id: r.id, timestamp: r.timestamp, userId: r.user_id, username: r.username, tenantId: r.tenant_id, action: r.action, resource: r.resource, details: r.details
      }));
    } else {
      const all = getLocal('audit_log');
      return tenantId === 'ALL' ? all : all.filter((l: any) => l.tenant_id === tenantId);
    }
  },

  async exportFullBackup(): Promise<any> {
    const backup: any = {};
    const stores = ['tenants', 'users', 'documents', 'clients', 'inventory', 'audit_log'];
    if (isSupabaseConfigured) {
      for (const store of stores) backup[store] = await sbFetch(`${store}?select=*`);
    } else {
      for (const store of stores) backup[store] = getLocal(store);
    }
    return backup;
  },

  async importFullBackup(user: User, backupData: any): Promise<void> {
    const stores = ['tenants', 'users', 'documents', 'clients', 'inventory', 'audit_log'];
    for (const store of stores) {
      if (backupData[store] && Array.isArray(backupData[store])) {
        if (isSupabaseConfigured) {
          await sbFetch(store, { method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates' }, body: JSON.stringify(backupData[store]) });
        } else {
          setLocal(store, backupData[store]);
        }
      }
    }
  }
};
