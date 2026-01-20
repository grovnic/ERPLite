
import React from 'react';
import { DocType, Language, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  lang: Language;
  role: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, lang, role }) => {
  const t = TRANSLATIONS[lang];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: '📊' },
    { id: DocType.INVOICE, label: t.invoices, icon: '📄' },
    { id: DocType.OFFER, label: t.offers, icon: '💡' },
    { id: DocType.CALCULATION, label: t.calculations, icon: '🧮' },
    { id: DocType.PURCHASE_ORDER, label: t.orders, icon: '🛒' },
    { id: 'inventory', label: t.inventory, icon: '📦' },
    { id: 'accounting', label: t.accounting, icon: '🏛️' },
    { id: 'reports', label: t.reports, icon: '📈' },
    { id: 'clients', label: t.clients, icon: '👥' },
    { id: 'audit-log', label: 'Audit Log', icon: '🛡️' },
    { id: 'settings', label: t.settings, icon: '⚙️' },
  ];

  if (role === 'SUPER_ADMIN') {
    menuItems.push({ id: 'tenant-admin', label: 'Admin Panel', icon: '🏢' });
  }

  return (
    <aside className="w-64 bg-[#0f172a] text-white flex flex-col no-print h-screen shadow-2xl shrink-0 border-r border-white/5">
      <div className="p-8">
        <h2 className="text-2xl font-black tracking-tighter text-blue-500 italic leading-none">
          Bratts ERP <br/>
          <span className="text-[10px] text-gray-500 font-normal not-italic tracking-normal uppercase">Lite 1.0</span>
        </h2>
      </div>
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-semibold text-xs uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-6 mt-auto">
         <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Sistem Aktivan</span>
            </div>
            <p className="text-[8px] text-gray-500 font-medium tracking-tighter">Bratts Cloud v3.5.1-FBiH</p>
         </div>
      </div>
    </aside>
  );
};

export default Sidebar;
