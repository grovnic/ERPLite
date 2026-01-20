
import React, { useRef } from 'react';
import { Company, Language, BankAccount, User } from '../types';
import { TRANSLATIONS } from '../constants';
import { backendService } from '../services/backendService';

interface SettingsProps {
  company: Company;
  setCompany: React.Dispatch<React.SetStateAction<Company>>;
  lang: Language;
  currentUser?: User; // Passed for logging purposes
}

const Settings: React.FC<SettingsProps> = ({ company, setCompany, lang, currentUser }) => {
  const t = TRANSLATIONS[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof Company, value: any) => {
    setCompany({ ...company, [field]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        update('logo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addBankAccount = () => {
    const newAccount: BankAccount = { id: crypto.randomUUID(), bankName: '', accountNumber: '' };
    update('bankAccounts', [...company.bankAccounts, newAccount]);
  };

  const updateBankAccount = (id: string, field: keyof BankAccount, value: string) => {
    const updated = company.bankAccounts.map(acc => acc.id === id ? { ...acc, [field]: value } : acc);
    update('bankAccounts', updated);
  };

  const removeBankAccount = (id: string) => {
    update('bankAccounts', company.bankAccounts.filter(acc => acc.id !== id));
  };

  const handleExport = async () => {
    try {
      const backupData = await backendService.exportFullBackup();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bh-erp-full-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      if (currentUser) {
        await backendService._log(currentUser, 'EXPORT', 'System', 'Korisnik je izvršio export cijele baze podataka.');
      }
    } catch (error) {
      alert('Greška prilikom exporta podataka.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (window.confirm('UPOZORENJE: Import će prebrisati sve trenutne podatke u bazi. Da li želite nastaviti?')) {
          await backendService.importFullBackup(currentUser!, json);
          alert('Podaci su uspješno uvezeni. Aplikacija će se sada osvježiti.');
          window.location.reload();
        }
      } catch (err) {
        alert('Neispravan backup fajl.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t.companyInfo}</h3>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileImport} 
            accept=".json" 
            className="hidden" 
          />
          <button 
            onClick={handleImportClick}
            className="px-4 py-2 border-2 border-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition"
          >
            Import Backup
          </button>
          <button 
            onClick={handleExport} 
            className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition shadow-lg shadow-green-100"
          >
            Export Backup (JSON)
          </button>
        </div>
      </div>
      
      <div className="space-y-8">
        <div className="flex items-center gap-8 p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="w-24 h-24 bg-white rounded-xl border flex items-center justify-center overflow-hidden shadow-sm">
             {company.logo ? (
               <img src={company.logo} alt="logo" className="w-full h-full object-contain" />
             ) : (
               <span className="text-[10px] text-gray-400 uppercase font-black">Nema loga</span>
             )}
          </div>
          <div className="flex-1">
             <label className="block text-xs font-black text-gray-400 uppercase mb-2">Upload Logotipa</label>
             <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white cursor-pointer"/>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Puni naziv firme</label>
            <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition" value={company.name} onChange={e => update('name', e.target.value)}/>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">JIB</label>
            <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-3" value={company.jib} onChange={e => update('jib', e.target.value)}/>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">PDV Broj</label>
            <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-3" value={company.pdvNumber} onChange={e => update('pdvNumber', e.target.value)}/>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Podrazumijevani jezik dokumenata</label>
            <select className="w-full border-2 border-gray-50 rounded-xl px-4 py-3" value={company.defaultLanguage} onChange={e => update('defaultLanguage', e.target.value as Language)}>
               <option value="BS">Bosanski (BS)</option>
               <option value="EN">Engleski (EN)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Mjesto izdavanja</label>
            <input className="w-full border-2 border-gray-50 rounded-xl px-4 py-3" value={company.defaultPlaceOfIssue} onChange={e => update('defaultPlaceOfIssue', e.target.value)}/>
          </div>
        </div>

        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
           <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Bankovni računi</h4>
              <button onClick={addBankAccount} className="text-[10px] font-bold text-blue-600 hover:underline">+ Dodaj račun</button>
           </div>
           <div className="space-y-4">
              {company.bankAccounts.map((acc, idx) => (
                <div key={acc.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-white p-4 rounded-xl shadow-sm border">
                   <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Naziv banke</label>
                      <input className="w-full border rounded-lg px-3 py-2 text-sm" value={acc.bankName} onChange={e => updateBankAccount(acc.id, 'bankName', e.target.value)}/>
                   </div>
                   <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Broj računa</label>
                        <input className="w-full border rounded-lg px-3 py-2 text-sm font-mono" value={acc.accountNumber} onChange={e => updateBankAccount(acc.id, 'accountNumber', e.target.value)}/>
                      </div>
                      {company.bankAccounts.length > 1 && (
                        <button onClick={() => removeBankAccount(acc.id)} className="p-2 text-red-400 hover:text-red-600">✕</button>
                      )}
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="flex justify-end pt-10 border-t">
          <button className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition shadow-xl shadow-blue-200">
            Sačuvaj postavke
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
