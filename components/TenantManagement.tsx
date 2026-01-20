
import React, { useState, useEffect } from 'react';
import { Tenant, User, TenantStatus } from '../types';
import { backendService } from '../services/backendService';

interface TenantManagementProps {
  currentUser: User;
  onImpersonate: (tenantId: string) => void;
}

const TenantManagement: React.FC<TenantManagementProps> = ({ currentUser, onImpersonate }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTab, setActiveTab] = useState<TenantStatus | 'ALL'>('PENDING');

  const loadTenants = async () => {
    const ts = await backendService.getTenants();
    setTenants(ts);
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleUpdateStatus = async (tenantId: string, status: TenantStatus) => {
    if (window.confirm(`Da li ste sigurni da želite ${status === 'APPROVED' ? 'odobriti' : 'odbiti'} ovu firmu?`)) {
      await backendService.updateTenantStatus(currentUser, tenantId, status);
      await loadTenants();
    }
  };

  const filteredTenants = tenants.filter(t => activeTab === 'ALL' || t.status === activeTab);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex gap-4 p-1 bg-gray-200 rounded-2xl w-fit mb-6 no-print">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'PENDING' ? 'Na čekanju' : tab === 'APPROVED' ? 'Aktivni' : tab === 'REJECTED' ? 'Odbijeni' : 'Svi'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 border-b bg-gray-50/50">
          <h2 className="font-black text-gray-900 uppercase tracking-widest text-sm">Upravljanje Firmama (Tenant Administration)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black tracking-widest">
              <tr>
                <th className="px-8 py-5">Firma i Lokacija</th>
                <th className="px-8 py-5">Identifikacija (JIB)</th>
                <th className="px-8 py-5">Registrovano</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTenants.map(t => (
                <tr key={t.id} className="hover:bg-blue-50/20 transition group">
                  <td className="px-8 py-5">
                    <p className="font-black text-gray-900 uppercase text-sm">{t.company.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{t.company.city}, {t.company.address}</p>
                  </td>
                  <td className="px-8 py-5 text-sm font-mono text-gray-600">{t.company.jib}</td>
                  <td className="px-8 py-5 text-xs text-gray-500 font-bold">
                    {new Date(t.createdAt).toLocaleDateString('bs-BA')}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      t.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                      t.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {t.status === 'PENDING' ? 'ČEKA ODOBRENJE' : t.status === 'APPROVED' ? 'AKTIVAN' : 'ODBIJEN'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right space-x-4">
                    {t.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleUpdateStatus(t.id, 'APPROVED')}
                          className="text-green-600 hover:text-green-800 font-bold text-[10px] uppercase tracking-widest underline"
                        >
                          Odobri
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(t.id, 'REJECTED')}
                          className="text-red-500 hover:text-red-700 font-bold text-[10px] uppercase tracking-widest underline"
                        >
                          Odbij
                        </button>
                      </>
                    )}
                    {t.status === 'APPROVED' && (
                      <button 
                        onClick={() => onImpersonate(t.id)}
                        className="text-blue-600 hover:text-blue-800 font-bold text-[10px] uppercase tracking-widest underline"
                      >
                        Pristupi tenantu
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic">Nema zapisa za odabrani filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TenantManagement;
