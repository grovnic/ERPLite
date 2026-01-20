
import React, { useState } from 'react';
import { DocType, ERPDocument, Company, Client, DocItem, Language, InventoryItem, PaymentMethod } from '../types';
import { TRANSLATIONS, VAT_RATE_BH } from '../constants';
import { geminiService } from '../services/geminiService';

interface DocumentFormProps {
  initialDoc: ERPDocument | null;
  type: DocType;
  company: Company;
  clients: Client[];
  inventory: InventoryItem[];
  onSave: (doc: ERPDocument) => void;
  onCancel: () => void;
  lang: Language;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ initialDoc, type, company, clients, inventory, onSave, onCancel, lang }) => {
  const t = TRANSLATIONS[lang];
  const [doc, setDoc] = useState<ERPDocument>(initialDoc || {
    id: crypto.randomUUID(),
    type,
    number: `${type.substring(0,2)}-${new Date().getFullYear()}-${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`,
    dateCreated: new Date().toISOString().split('T')[0],
    dateDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateDelivery: new Date().toISOString().split('T')[0],
    placeOfIssue: company.defaultPlaceOfIssue,
    paymentMethod: 'Virman',
    paymentStatus: 'NEPLAĆENO',
    client: clients[0] || { id: '', name: '', address: '', city: '', jib: '' },
    items: [],
    note: '',
    language: lang,
    currency: 'BAM'
  });

  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const addItem = () => {
    const newItem: DocItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unit: 'kom',
      pricePerUnit: 0,
      discount: 0,
      vatRate: VAT_RATE_BH
    };
    setDoc({ ...doc, items: [...doc.items, newItem] });
  };

  const addInventoryItem = (inv: InventoryItem) => {
    const newItem: DocItem = {
      id: crypto.randomUUID(),
      inventoryItemId: inv.id,
      code: inv.code,
      description: inv.name,
      quantity: 1,
      unit: inv.unit,
      pricePerUnit: inv.salePrice,
      discount: 0,
      vatRate: inv.vatRate
    };
    setDoc({ ...doc, items: [...doc.items, newItem] });
  };

  const removeItem = (id: string) => {
    setDoc({ ...doc, items: doc.items.filter(i => i.id !== id) });
  };

  const updateItem = (id: string, field: keyof DocItem, value: any) => {
    setDoc({
      ...doc,
      items: doc.items.map(i => i.id === id ? { ...i, [field]: value } : i)
    });
  };

  const calculateSubtotal = (i: DocItem) => {
    const base = i.quantity * i.pricePerUnit;
    const discounted = base - (base * (i.discount / 100));
    return discounted;
  };

  const totalBeforeVat = doc.items.reduce((acc, i) => acc + calculateSubtotal(i), 0);
  const totalVat = doc.items.reduce((acc, i) => acc + (calculateSubtotal(i) * (i.vatRate / 100)), 0);
  const grandTotal = totalBeforeVat + totalVat;

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    const summary = `Doc: ${doc.number}, Total: ${grandTotal} BAM. Items: ${doc.items.length}. Analysis for BH market.`;
    const analysis = await geminiService.analyzeDocument(summary);
    setAiAnalysis(analysis || 'Analysis failed.');
    setIsAnalyzing(false);
  };

  return (
    <div className="bg-white p-4 md:p-10 rounded-3xl shadow-2xl border border-gray-100 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-10 no-print sticky top-0 bg-white/80 backdrop-blur-md z-10 py-4 border-b">
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-900 transition flex items-center gap-2 font-bold text-sm">
          ← {t.back}
        </button>
        <div className="flex gap-3">
          <button onClick={handleAiAnalysis} disabled={isAnalyzing} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg">
            {isAnalyzing ? '...' : '✨ AI CHECK'}
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition">
            {t.print}
          </button>
          <button onClick={() => onSave(doc)} className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-200 transition">
            {t.save}
          </button>
        </div>
      </div>

      <div className="printable-area p-10 bg-white shadow-sm border rounded-lg min-h-[1100px] text-gray-800">
        <div className="flex justify-between mb-12">
          <div className="w-1/2">
            {company.logo ? (
              <img src={company.logo} alt="logo" className="h-24 mb-6 object-contain" />
            ) : (
              <div className="h-24 w-24 bg-gray-50 rounded flex items-center justify-center text-[10px] text-gray-300 mb-6 border-2 border-dashed uppercase font-black">Logo</div>
            )}
            <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 leading-none">{t.docTypeNames[type]}</h1>
            <p className="text-xl font-bold text-blue-600 tracking-tight">Broj: {doc.number}</p>
          </div>
          <div className="text-right text-[11px] leading-relaxed w-1/2">
            <p className="font-black text-base text-gray-900 uppercase mb-1">{company.name}</p>
            <p className="text-gray-600 font-medium">{company.address}, {company.zip} {company.city}</p>
            <p className="text-gray-600 font-medium">JIB: {company.jib} | PDV: {company.pdvNumber}</p>
            <p className="text-gray-600 font-medium">{company.email} | {company.phone}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12">
          <div className="p-6 border-l-4 border-blue-600 bg-gray-50/50 rounded-r-xl">
            <p className="text-[9px] font-black uppercase text-blue-400 mb-4 tracking-widest">KLIJENT / CLIENT</p>
            <select className="w-full bg-transparent font-black text-lg outline-none no-print mb-4 border-b border-blue-100" value={doc.client.id} onChange={(e) => setDoc({ ...doc, client: clients.find(c => c.id === e.target.value) || doc.client })}>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="text-sm">
              <p className="font-black text-gray-900 uppercase mb-1 text-base">{doc.client.name}</p>
              <p className="text-gray-700 font-medium">{doc.client.address}</p>
              <p className="text-gray-700 font-medium">{doc.client.zip} {doc.client.city}</p>
              {doc.client.municipality && <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Općina: {doc.client.municipality} | {doc.client.canton}</p>}
              <div className="mt-4 grid grid-cols-2 gap-x-4 text-[11px] font-bold text-gray-600">
                <p>JIB: <span className="text-gray-900">{doc.client.jib}</span></p>
                {doc.client.pdvNumber && <p>PDV: <span className="text-gray-900">{doc.client.pdvNumber}</span></p>}
              </div>
              {doc.client.email && <p className="text-[10px] text-blue-500 mt-2 font-bold">{doc.client.email}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-right text-[11px] font-medium self-end">
            <div><p className="font-bold text-gray-400 uppercase tracking-widest mb-1">Datum izdavanja</p><p className="font-black text-gray-900">{doc.dateCreated}</p></div>
            <div><p className="font-bold text-gray-400 uppercase tracking-widest mb-1">Datum dospijeća</p><p className="font-black text-blue-600">{doc.dateDue}</p></div>
            <div><p className="font-bold text-gray-400 uppercase tracking-widest mb-1">Datum prometa</p><p className="font-black text-gray-900">{doc.dateDelivery}</p></div>
            <div><p className="font-bold text-gray-400 uppercase tracking-widest mb-1">Mjesto izdavanja</p><p className="font-black text-gray-900">{doc.placeOfIssue}</p></div>
          </div>
        </div>

        <table className="w-full mb-10 border-collapse">
          <thead>
            <tr className="bg-gray-100 text-[9px] font-black uppercase text-gray-500 tracking-widest border-t-2 border-b-2 border-gray-900">
              <th className="py-3 pl-3 text-left">RB</th>
              <th className="py-3 text-left">Šifra</th>
              <th className="py-3 text-left">Naziv i opis</th>
              <th className="py-3 text-center">Kol.</th>
              <th className="py-3 text-right">Cijena</th>
              <th className="py-3 text-center">Pop.%</th>
              <th className="py-3 text-right pr-3">Ukupno</th>
            </tr>
          </thead>
          <tbody className="text-[11px]">
            {doc.items.map((item, idx) => {
              const rowTotal = calculateSubtotal(item) * (1 + item.vatRate/100);
              return (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-4 pl-3 font-bold text-gray-400">{idx + 1}.</td>
                  <td className="py-4 text-gray-400 font-bold">{item.code || '-'}</td>
                  <td className="py-4 font-bold text-gray-900 pr-4">{item.description}</td>
                  <td className="py-4 text-center font-black">{item.quantity}</td>
                  <td className="py-4 text-right">{item.pricePerUnit.toFixed(2)}</td>
                  <td className="py-4 text-center text-blue-600 font-bold">{item.discount}%</td>
                  <td className="py-4 text-right font-black pr-3">{rowTotal.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-end mb-24">
          <div className="w-80 p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm">
             <div className="space-y-3">
               <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest"><span>Osnovica:</span><span className="text-gray-900">{totalBeforeVat.toFixed(2)} KM</span></div>
               <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-3"><span>PDV 17%:</span><span className="text-gray-900">{totalVat.toFixed(2)} KM</span></div>
               <div className="pt-3">
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-[11px] font-black text-blue-600 uppercase">UKUPNO ZA UPLATU:</span>
                   <span className="text-3xl font-black text-blue-600 tracking-tighter leading-none">{grandTotal.toFixed(2)} KM</span>
                 </div>
               </div>
             </div>
          </div>
        </div>

        <div className="border-t-2 border-gray-900 pt-8 grid grid-cols-2 gap-12 text-[10px]">
           <div>
             <h4 className="font-black text-gray-900 uppercase mb-3 leading-none">Žiro računi / Bank accounts:</h4>
             {company.bankAccounts.map(acc => (
               <div key={acc.id} className="mb-1">
                  <span className="font-bold text-gray-500 uppercase">{acc.bankName}:</span> <span className="font-black text-blue-600 text-[11px]">{acc.accountNumber}</span>
               </div>
             ))}
             <div className="mt-4 pt-4 border-t">
               <h4 className="font-black text-gray-900 uppercase mb-2">Napomena / Note:</h4>
               <p className="whitespace-pre-wrap font-medium">{doc.note || 'U skladu sa Zakonom o PDV-u BiH.'}</p>
             </div>
           </div>
           
           <div className="flex flex-col justify-between items-center pl-10">
              <div className="w-full h-24 flex items-end justify-between px-6">
                <div className="text-center w-40 border-t border-gray-900 pt-2 uppercase font-black text-gray-900">Potpis primio</div>
                <div className="text-center w-40 border-t border-gray-900 pt-2 uppercase font-black text-gray-900">Potpis izdao</div>
              </div>
              <div className="text-[8px] text-gray-400 mt-10">Software generated by BH-ERP v3.0</div>
           </div>
        </div>
      </div>

      {aiAnalysis && (
        <div className="mt-8 p-6 bg-indigo-50 border border-indigo-100 rounded-3xl no-print animate-in slide-in-from-top-4 duration-500">
          <h4 className="font-black text-indigo-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">✨ AI Compliance Assistant</h4>
          <p className="text-sm text-indigo-700 whitespace-pre-wrap leading-relaxed font-medium">{aiAnalysis}</p>
        </div>
      )}
    </div>
  );
};

export default DocumentForm;
