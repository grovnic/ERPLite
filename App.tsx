
import React, { useState, useEffect } from 'react';
import { DocType, ERPDocument, Company, Language, Client, InventoryItem, User, Tenant } from './types';
import { TRANSLATIONS } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DocumentList from './components/DocumentList';
import DocumentForm from './components/DocumentForm';
import CalculationForm from './components/CalculationForm';
import Settings from './components/Settings';
import ClientList from './components/ClientList';
import InventoryList from './components/InventoryList';
import Reports from './components/Reports';
import Login from './components/Login';
import TenantManagement from './components/TenantManagement';
import AuditLog from './components/AuditLog';
import { backendService } from './services/backendService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | DocType | 'clients' | 'inventory' | 'reports' | 'settings' | 'tenant-admin' | 'audit-log'>('dashboard');
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
        const tenants = await backendService.getTenants();
        const myTenant = tenants.find(t => t.id === currentUser.tenantId);
        if (myTenant) setActiveTenant(myTenant);

        const [docs, cls, inv] = await Promise.all([
          backendService.getData<ERPDocument>(currentUser.tenantId, 'documents'),
          backendService.getData<Client>(currentUser.tenantId, 'clients'),
          backendService.getData<InventoryItem>(currentUser.tenantId, 'inventory')
        ]);
        
        setDocuments(docs);
        setClients(cls);
        setInventory(inv);
        setIsLoading(false);
      };
      loadTenantData();
    }
  }, [currentUser]);

  const handleLogin = async (email: string, password?: string) => {
    const result = await backendService.login(email, password);
    if (result.user) {
      setCurrentUser(result.user);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTenant(null);
    setActiveTab('dashboard');
  };

  const handleSaveDoc = async (doc: ERPDocument) => {
    let updatedDocs;
    let actionType: any = editingDoc ? 'UPDATE' : 'CREATE';
    let details = `${editingDoc ? 'Ažuriran' : 'Kreiran'} dokument ${doc.number} za klijenta ${doc.client.name}`;

    if (editingDoc) {
      updatedDocs = documents.map(d => d.id === doc.id ? doc : d);
    } else {
      updatedDocs = [doc, ...documents];
    }
    
    setDocuments(updatedDocs);
    await backendService.saveData(currentUser!, 'documents', updatedDocs, actionType, details);

    if (doc.type === DocType.INVOICE && !editingDoc) {
      const updatedInv = inventory.map(inv => {
        const totalSold = doc.items.filter(i => i.inventoryItemId === inv.id).reduce((acc, c) => acc + c.quantity, 0);
        return totalSold > 0 ? { ...inv, quantity: inv.quantity - totalSold } : inv;
      });
      setInventory(updatedInv);
      await backendService.saveData(currentUser!, 'inventory', updatedInv, 'UPDATE', `Smanjena zaliha artikala nakon izdavanja računa ${doc.number}`);
    }

    setEditingDoc(null);
    setActiveTab(doc.type);
  };

  if (!currentUser) return <Login onLogin={handleLogin} />;

  const t = TRANSLATIONS[lang];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setEditingDoc(null); }} lang={lang} role={currentUser.role}/>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
             <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <header className="flex justify-between items-center mb-8 no-print">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {activeTab === 'dashboard' ? t.dashboard : 
               activeTab === 'audit-log' ? 'Audit Log' : 
               t.docTypeNames[activeTab as DocType] || activeTab}
            </h1>
            <p className="text-sm text-gray-500">{activeTenant?.company.name} | <span className="text-blue-600 font-bold uppercase text-[10px]">{currentUser.role}</span></p>
          </div>
          <div className="flex items-center gap-4">
             <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className="bg-white border rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm">
                <option value="BS">BS</option>
                <option value="EN">EN</option>
             </select>
             <button onClick={handleLogout} className="text-xs font-bold text-red-500 hover:underline">Odjava</button>
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
            onDelete={async (id) => {
              const updated = documents.filter(d => d.id !== id);
              setDocuments(updated);
              await backendService.saveData(currentUser, 'documents', updated, 'DELETE', `Obrisan dokument ID: ${id}`);
            }}
            lang={lang}
          />
        )}

        {(activeTab === DocType.INVOICE || activeTab === DocType.OFFER || activeTab === DocType.PURCHASE_ORDER) && editingDoc !== undefined && (
          <DocumentForm 
            initialDoc={editingDoc} 
            type={activeTab as DocType}
            company={activeTenant!.company}
            clients={clients}
            inventory={inventory}
            onSave={handleSaveDoc}
            onCancel={() => setEditingDoc(null)}
            lang={lang}
          />
        )}

        {activeTab === 'clients' && <ClientList clients={clients} setClients={setClients as any} lang={lang} tenantId={currentUser.tenantId} />}
        {activeTab === 'inventory' && <InventoryList inventory={inventory} setInventory={setInventory as any} lang={lang} tenantId={currentUser.tenantId} />}
        {activeTab === 'reports' && <Reports documents={documents} lang={lang} />}
        
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
