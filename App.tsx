import React, { useState, useEffect } from 'react';
import { DocType, ERPDocument, Language, Client, InventoryItem, User, Tenant, CalculationDoc } from './types.ts';
import { TRANSLATIONS } from './constants.tsx';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import DocumentList from './components/DocumentList.tsx';
import DocumentForm from './components/DocumentForm.tsx';
import CalculationForm from './components/CalculationForm.tsx';
import Settings from './components/Settings.tsx';
import ClientList from './components/ClientList.tsx';
import InventoryList from './components/InventoryList.tsx';
import Reports from './components/Reports.tsx';
import KirkurReports from './components/KirkurReports.tsx';
import Login from './components/Login.tsx';
import TenantManagement from './components/TenantManagement.tsx';
import AuditLog from './components/AuditLog.tsx';
import { backendService } from './services/backendService.ts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | DocType | 'clients' | 'inventory' | 'reports' | 'accounting' | 'settings' | 'tenant-admin' | 'audit-log'>('dashboard');
  const [lang, setLang] = useState<Language>('BS');
  const [documents, setDocuments] = useState<ERPDocument[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [editingDoc, setEditingDoc] = useState<ERPDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const loadTenantData = async () => {
        setIsLoading(true);
        try {
          const tenants = await backendService.getTenants();
          const myTenant = tenants.find(t => t.id === currentUser.tenantId);
          if (myTenant) {
             setActiveTenant(myTenant);
             setLang(myTenant.company.defaultLanguage || 'BS');
          }

          const [docs, cls, inv] = await Promise.all([
            backendService.getData<ERPDocument>(currentUser.tenantId, 'documents'),
            backendService.getData<Client>(currentUser.tenantId, 'clients'),
            backendService.getData<InventoryItem>(currentUser.tenantId, 'inventory')
          ]);
          
          setDocuments(docs || []);
          setClients(cls || []);
          setInventory(inv || []);
        } catch (e) {
          console.error("Data load failed", e);
        } finally {
          setIsLoading(false);
        }
      };
      loadTenantData();
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTenant(null);
    setActiveTab('dashboard');
  };

  const handleSaveDoc = async (doc: ERPDocument) => {
    let updatedDocs: ERPDocument[] = [];
    const isEditing = !!editingDoc;
    const actionType = isEditing ? 'UPDATE' : 'CREATE';
    const details = `${isEditing ? 'Ažuriran' : 'Kreiran'} dokument ${doc.number}`;

    if (isEditing) {
      updatedDocs = documents.map(d => d.id === doc.id ? doc : d);
    } else {
      updatedDocs = [doc, ...documents];
    }
    
    setDocuments(updatedDocs);
    if (currentUser) {
      await backendService.saveData(currentUser, 'documents', updatedDocs, actionType, details);
    }

    setEditingDoc(null);
    setActiveTab(doc.type);
  };

  const handleCloneDoc = (doc: ERPDocument) => {
    const cloned: ERPDocument = {
      ...doc,
      id: crypto.randomUUID(),
      number: `KOP-` + doc.number,
      dateCreated: new Date().toISOString().split('T')[0],
      dateDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    setEditingDoc(cloned);
  };

  const handleConvertToInvoice = (offer: ERPDocument) => {
    const invoice: ERPDocument = {
      ...offer,
      id: crypto.randomUUID(),
      type: DocType.INVOICE,
      number: `RN-${new Date().getFullYear()}-${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`,
      dateCreated: new Date().toISOString().split('T')[0],
      dateDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    setEditingDoc(invoice);
    setActiveTab(DocType.INVOICE);
  };

  if (!currentUser) return <Login onLogin={(email, pass) => backendService.login(email, pass).then(res => res.user && handleLogin(res.user))} />;

  const t = TRANSLATIONS[lang];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setEditingDoc(null); }} lang={lang} role={currentUser.role}/>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
             <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Sinhronizacija...</p>
          </div>
        )}

        <header className="flex justify-between items-center mb-10 no-print">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              {activeTab === 'dashboard' ? t.dashboard : 
               activeTab === 'accounting' ? t.accounting :
               activeTab === 'audit-log' ? 'Audit Log' : 
               t.docTypeNames[activeTab as DocType] || activeTab}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{activeTenant?.company.name}</p>
          </div>
          <div className="flex items-center gap-6">
             <div className="bg-white shadow-sm border px-3 py-1.5 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-[9px] font-black text-slate-500 uppercase">{currentUser.username}</span>
             </div>
             <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className="bg-white border rounded-xl px-4 py-2 text-xs font-bold shadow-sm outline-none">
                <option value="BS">BS</option>
                <option value="EN">EN</option>
             </select>
             <button onClick={handleLogout} className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 tracking-widest transition">Odjava</button>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard documents={documents} lang={lang} setActiveTab={setActiveTab} />}
        {activeTab === 'audit-log' && <AuditLog user={currentUser} />}

        {Object.values(DocType).includes(activeTab as DocType) && !editingDoc && (
          <DocumentList 
            type={activeTab as DocType} 
            documents={documents.filter(d => d.type === activeTab)} 
            onEdit={setEditingDoc}
            onNew={() => setEditingDoc(null)}
            onClone={handleCloneDoc}
            onConvertToInvoice={activeTab === DocType.OFFER ? handleConvertToInvoice : undefined}
            onDelete={async (id) => {
              const updated = documents.filter(d => d.id !== id);
              setDocuments(updated);
              await backendService.saveData(currentUser, 'documents', updated, 'DELETE', `Obrisan dokument ID: ${id}`);
            }}
            lang={lang}
          />
        )}

        {(activeTab === DocType.INVOICE || activeTab === DocType.OFFER || activeTab === DocType.PURCHASE_ORDER) && editingDoc !== null && (
          <DocumentForm 
            initialDoc={editingDoc} 
            type={editingDoc.type}
            company={activeTenant!.company}
            clients={clients}
            inventory={inventory}
            onSave={handleSaveDoc}
            onCancel={() => setEditingDoc(null)}
            lang={lang}
            tenantId={currentUser.tenantId}
          />
        )}

        {activeTab === DocType.CALCULATION && editingDoc !== null && (
          <CalculationForm 
            initialDoc={editingDoc as CalculationDoc}
            company={activeTenant!.company}
            onSave={handleSaveDoc}
            onCancel={() => setEditingDoc(null)}
            lang={lang}
            tenantId={currentUser.tenantId}
          />
        )}

        {activeTab === 'clients' && <ClientList clients={clients} setClients={setClients as any} lang={lang} tenantId={currentUser.tenantId} />}
        {activeTab === 'inventory' && <InventoryList inventory={inventory} setInventory={setInventory as any} lang={lang} tenantId={currentUser.tenantId} />}
        {activeTab === 'reports' && <Reports documents={documents} lang={lang} />}
        {activeTab === 'accounting' && <KirkurReports documents={documents} lang={lang} />}
        
        {activeTab === 'tenant-admin' && currentUser.role === 'SUPER_ADMIN' && (
          <TenantManagement currentUser={currentUser} onImpersonate={(tenantId) => { setCurrentUser({...currentUser, tenantId}); setActiveTab('dashboard'); }} />
        )}

        {activeTab === 'settings' && activeTenant && (
          <Settings company={activeTenant.company} setCompany={(newC) => setActiveTenant({...activeTenant, company: newC as any})} lang={lang} currentUser={currentUser} />
        )}
      </main>
    </div>
  );
};

export default App;