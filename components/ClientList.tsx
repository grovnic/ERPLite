import React, { useState } from 'react';
import { Client, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface ClientListProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  lang: Language;
  tenantId: string;
}

const ClientList: React.FC<ClientListProps> = ({ clients, setClients, lang, tenantId }) => {
  const t = TRANSLATIONS[lang];
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({ 
    name: '', address: '', city: '', zip: '', municipality: '', canton: '', country: 'Bosna i Hercegovina', jib: '', pdvNumber: '', email: '', phone: '', web: '', bankAccount: '', contactPerson: '' 
  });

  const addClient = () => {
    if (!newClient.name || !newClient.jib) {
      alert("Naziv i JIB su obavezni!");
      return;
    }
    // Fix: Included missing tenantId to satisfy the Client interface
    const clientToAdd: Client = {
      id: crypto.randomUUID(),
      tenantId: tenantId,
      name: newClient.name!,
      address: newClient.address || '',
      city: newClient.city || '',
      zip: newClient.zip,
      municipality: newClient.municipality,
      canton: newClient.canton,
      country: newClient.country,
      jib: newClient.jib!,
      pdvNumber: newClient.pdvNumber,
      email: newClient.email,
      phone: newClient.phone,
      web: newClient.web,
      bankAccount: newClient.bankAccount,
      contactPerson: newClient.contactPerson
    };
    setClients([clientToAdd, ...clients]);
    setNewClient({ name: '', address: '', city: '', zip: '', municipality: '', canton: '', country: 'Bosna i Hercegovina', jib: '', pdvNumber: '', email: '', phone: '', web: '', bankAccount: '', contactPerson: '' });
    setShowAdd(false);
  };

  const removeClient = (id: string) => {
    if (window.confirm('Da li ste sigurni da želite obrisati klijenta?')) {
      setClients(clients.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Baza Klijenata (Registri)</h2>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition shadow-lg ${showAdd ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'}`}
        >
          {showAdd ? 'Zatvori formu' : '+ Novi Klijent'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-50 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sekcija 1: Osnovni podaci */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b pb-2">Identifikacija</h4>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Puni naziv klijenta *</label>
                <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">JIB (13 cifara) *</label>
                  <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none" value={newClient.jib} onChange={e => setNewClient({...newClient, jib: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">PDV Broj (12 cifara)</label>
                  <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none" value={newClient.pdvNumber} onChange={e => setNewClient({...newClient, pdvNumber: e.target.value})}/>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Glavni Žiro Račun</label>
                <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-2 text-sm font-mono" value={newClient.bankAccount} onChange={e => setNewClient({...newClient, bankAccount: e.target.value})}/>
              </div>
            </div>

            {/* Sekcija 2: Lokacija */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b pb-2">Lokacija i Sjedište</h4>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Adresa</label>
                <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none" value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">Grad / Mjesto</label>
                  <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none" value={newClient.city} onChange={e => setNewClient({...newClient, city: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">Poštanski broj</label>
                  <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none" value={newClient.zip} onChange={e => setNewClient({...newClient, zip: e.target.value})}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">Općina</label>
                  <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none" value={newClient.municipality} onChange={e => setNewClient({...newClient, municipality: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">Kanton</label>
                  <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none" value={newClient.canton} onChange={e => setNewClient({...newClient, canton: e.target.value})}/>
                </div>
              </div>
            </div>

            {/* Sekcija 3: Kontakt */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b pb-2">Kontakt podaci</h4>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Kontakt osoba</label>
                <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none" value={newClient.contactPerson} onChange={e => setNewClient({...newClient, contactPerson: e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">E-mail</label>
                  <input type="email" className="w-full border-2 border-gray-50 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">Telefon</label>
                  <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})}/>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Web stranica</label>
                <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none" placeholder="https://..." value={newClient.web} onChange={e => setNewClient({...newClient, web: e.target.value})}/>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t flex justify-end">
            <button onClick={addClient} className="bg-blue-600 text-white px-12 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition shadow-xl shadow-blue-200">
              Spremi Klijenta u bazu
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black tracking-widest">
               <tr>
                 <th className="px-8 py-5">Naziv i JIB</th>
                 <th className="px-8 py-5">Lokacija / Kanton</th>
                 <th className="px-8 py-5">Kontakt</th>
                 <th className="px-8 py-5 text-right">Akcija</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {clients.map(c => (
                 <tr key={c.id} className="hover:bg-blue-50/20 transition group">
                   <td className="px-8 py-5">
                      <p className="font-black text-gray-900 uppercase text-sm">{c.name}</p>
                      <p className="text-[10px] font-bold text-blue-400 mt-1">JIB: {c.jib}</p>
                   </td>
                   <td className="px-8 py-5">
                      <p className="text-xs font-bold text-gray-700">{c.address}, {c.city}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase mt-1">{c.municipality} | {c.canton}</p>
                   </td>
                   <td className="px-8 py-5">
                      <p className="text-xs font-medium text-gray-600">{c.email || '-'}</p>
                      <p className="text-xs font-medium text-gray-600">{c.phone || '-'}</p>
                   </td>
                   <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => removeClient(c.id)} className="text-red-400 hover:text-red-600 font-bold text-xs uppercase underline">Ukloni</button>
                   </td>
                 </tr>
               ))}
               {clients.length === 0 && (
                 <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic">Baza klijenata je trenutno prazna.</td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};

export default ClientList;