
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
    { id: 'reports', label: 'Izvještaji', icon: '📈' },
    { id: 'clients', label: t.clients, icon: '👥' },
    { id: 'audit-log', label: 'Audit Log', icon: '🛡️' },
    { id: 'settings', label: t.settings, icon: '⚙️' },
  ];

  if (role === 'SUPER_ADMIN') {
    menuItems.push({ id: 'tenant-admin', label: 'Tenanti Admin', icon: '🏢' });
  }

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col no-print h-screen shadow-2xl shrink-0 border-r border-white/5">
      <div className="p-8">
        <h2 className="text-2xl font-black tracking-tighter text-blue-500 italic">BH-ERP <span className="text-xs text-gray-500 font-normal not-italic tracking-normal">Cloud</span></h2>
      </div>
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-semibold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-6 mt-auto">
         <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cloud Connected</span>
            </div>
            <p className="text-[9px] text-gray-500 font-medium">Supabase PostgreSQL v15</p>
         </div>
      </div>

      <div className="p-8 text-[10px] text-gray-500 border-t border-gray-800 uppercase tracking-widest font-bold">
        Hosting: Vercel / Netlify
      </div>
    </aside>
  );
};

export default Sidebar;
