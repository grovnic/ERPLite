
import React, { useState, useEffect } from 'react';
import { AuditEntry, User, UserRole } from '../types';
import { backendService } from '../services/backendService';

interface AuditLogProps {
  user: User;
}

const AuditLog: React.FC<AuditLogProps> = ({ user }) => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await backendService.getAuditLogs(user.role === 'SUPER_ADMIN' ? 'ALL' : user.tenantId);
      setLogs(data);
      setIsLoading(false);
    };
    load();
  }, [user]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-700 border-green-200';
      case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
      case 'UPDATE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'LOGIN': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black text-gray-300 uppercase tracking-widest">Učitavanje dnevnika...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-black text-gray-900 uppercase tracking-widest text-sm">Revizorski Trag (Audit Log)</h2>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Ukupno zapisa: {logs.length}</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black tracking-widest">
              <tr>
                <th className="px-8 py-5">Vrijeme</th>
                <th className="px-8 py-5">Korisnik</th>
                <th className="px-8 py-5">Akcija</th>
                <th className="px-8 py-5">Resurs</th>
                <th className="px-8 py-5">Detalji</th>
                {user.role === 'SUPER_ADMIN' && <th className="px-8 py-5">Tenant ID</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition text-sm">
                  <td className="px-8 py-5 whitespace-nowrap font-mono text-gray-400 text-xs">
                    {new Date(log.timestamp).toLocaleString('bs-BA')}
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-bold text-gray-900">{log.username}</p>
                    <p className="text-[10px] text-gray-400">ID: {log.userId}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-black text-gray-400 uppercase text-[10px]">
                    {log.resource}
                  </td>
                  <td className="px-8 py-5 text-gray-600 max-w-md truncate">
                    {log.details}
                  </td>
                  {user.role === 'SUPER_ADMIN' && (
                    <td className="px-8 py-5 font-mono text-blue-500 text-xs">{log.tenantId}</td>
                  )}
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-gray-400 italic">Nema zabilježenih aktivnosti.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
