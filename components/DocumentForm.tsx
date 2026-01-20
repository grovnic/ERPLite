import React, { useState } from 'react';
import { DocType, ERPDocument, Company, Client, DocItem, Language, InventoryItem, PaymentMethod } from '../types';
import { TRANSLATIONS, VAT_RATE_BH, VAT_CATEGORIES } from '../constants';
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
  const tBS = TRANSLATIONS['BS'];
  const tEN = TRANSLATIONS['EN'];

  const [doc, setDoc] = useState<ERPDocument>(initialDoc || {
    id: crypto.randomUUID(),
    type,
    number: `${type.substring(0,2)}-${new Date().getFullYear()}-${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`,
    dateCreated: new Date().toISOString().split('T')[0],
    dateDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateDelivery: new Date().toISOString().split('T')[0],
    taxPeriod: new Date().toISOString().substring(0, 7),
    placeOfIssue: company.defaultPlaceOfIssue,
    paymentMethod: 'Virman',
    paymentStatus: 'NEPLAĆENO',
    client: clients[0] || { id: '', name: '', address: '', city: '', jib: '' },
    items: [],
    note: '',
    language: company.defaultLanguage || lang,
    currency: 'BAM',
    createdBy: '',
    isDualLanguage: false
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
      vatRate: VAT_RATE_BH,
      vatCategory: 17
    };
    setDoc({ ...doc, items: [...doc.items, newItem] });
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

  const totalsByVat = doc.items.reduce((acc: Record<number, { sub: number, vat: number }>, i) => {
    const sub = calculateSubtotal(i);
    const rate = i.vatRate || 0;
    if (!acc[rate]) acc[rate] = { sub: 0, vat: 0 };
    acc[rate].sub += sub;
    acc[rate].vat += (sub * (rate / 100));
    return acc;
  }, {} as Record<number, { sub: number, vat: number }>);

  // Fix: Explicitly cast Object.values to avoid 'unknown' type errors in the reduce accumulator
  const totalBeforeVat = (Object.values(totalsByVat) as { sub: number, vat: number }[]).reduce((acc: number, curr) => acc + curr.sub, 0);
  const totalVat = (Object.values(totalsByVat) as { sub: number, vat: number }[]).reduce((acc: number, curr) => acc + curr.vat, 0);
  const grandTotal = totalBeforeVat + totalVat;

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    const summary = `Doc: ${doc.number}, Total: ${grandTotal} BAM. Items: ${doc.items.length}. BH VAT Check.`;
    const analysis = await geminiService.analyzeDocument(summary);
    setAiAnalysis(analysis || 'Analysis failed.');
    setIsAnalyzing(false);
  };

  const getAutomaticNote = () => {
    const hasExempt = doc.items.some(i => i.vatRate === 0);
    if (hasExempt) {
      return "Oslobođeno plaćanja PDV-a po članu 24. i 25. Zakona o PDV-u BiH. / VAT Exempt as per BH Law.";
    }
    return "";
  };

  const renderLabel = (bsLabel: string, enLabel: string) => {
    if (doc.isDualLanguage) return `${bsLabel} / ${enLabel}`;
    return lang === 'BS' ? bsLabel : enLabel;
  };

  return (
    <div className="bg-white p-4 md:p-10 rounded-3xl shadow-2xl border border-gray-100 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-10 no-print sticky top-0 bg-white/80 backdrop-blur-md z-10 py-4 border-b">
        <div className="flex items-center gap-6">
           <button onClick={onCancel} className="text-gray-500 hover:text-gray-900 transition flex items-center gap-2 font-bold text-sm">
             ← {t.back}
           </button>
           <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
              <input type="checkbox" checked={doc.isDualLanguage} onChange={e => setDoc({...doc, isDualLanguage: e.target.checked})} className="w-4 h-4 accent-blue-600" />
              <span className="text-[10px] font-black uppercase text-blue-600">{t.dualLanguage}</span>
           </label>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAiAnalysis} disabled={isAnalyzing} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg">
            {isAnalyzing ? '...' : '✨ AI KONTROLA'}
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
              <div className="h-20 w-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-6 shadow-xl">ERP</div>
            )}
            <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 leading-none">
               {renderLabel(tBS.docTypeNames[type], tEN.docTypeNames[type])}
            </h1>
            <p className="text-xl font-bold text-blue-600 tracking-tight">{renderLabel('Broj', 'No')}: {doc.number}</p>
          </div>
          <div className="text-right text-[11px] leading-relaxed w-1/2">
            <p className="font-black text-base text-gray-900 uppercase mb-1">{company.name}</p>
            <p className="text-gray-600 font-medium">{company.address}, {company.zip} {company.city}</p>
            <p className="text-gray-600 font-medium">JIB: {company.jib} | PDV: {company.pdvNumber}</p>
            <p className="text-gray-600 font-medium">{company.email} | {company.phone}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-8">
          <div className="p-6 border-l-4 border-blue-600 bg-gray-50/50 rounded-r-xl">
            <p className="text-[9px] font-black uppercase text-blue-400 mb-4 tracking-widest">{renderLabel('PRIMALAC', 'RECIPIENT')}</p>
            <select className="w-full bg-transparent font-black text-lg outline-none no-print mb-4 border-b border-blue-100" value={doc.client.id} onChange={(e) => setDoc({ ...doc, client: clients.find(c => c.id === e.target.value) || doc.client })}>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="text-sm">
              <p className="font-black text-gray-900 uppercase mb-1 text-base">{doc.client.name}</p>
              <p className="text-gray-700 font-medium">{doc.client.address}</p>
              <p className="text-gray-700 font-medium">{doc.client.zip} {doc.client.city}</p>
              <div className="mt-4 grid grid-cols-2 gap-x-4 text-[11px] font-bold text-gray-600">
                <p>JIB / ID: <span className="text-gray-900">{doc.client.jib}</span></p>
                {doc.client.pdvNumber && <p>PDV / VAT: <span className="text-gray-900">{doc.client.pdvNumber}</span></p>}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-right text-[11px] font-medium self-end">
            <div><p className="font-bold text-gray-400 uppercase tracking-widest mb-1">{renderLabel('Datum izdavanja', 'Issue Date')}</p><p className="font-black text-gray-900">{doc.dateCreated}</p></div>
            <div><p className="font-bold text-gray-400 uppercase tracking-widest mb-1">{renderLabel('Datum dospijeća', 'Due Date')}</p><p className="font-black text-blue-600">{doc.dateDue}</p></div>
            <div><p className="font-bold text-gray-400 uppercase tracking-widest mb-1">{renderLabel('Datum prometa', 'Delivery Date')}</p><p className="font-black text-gray-900">{doc.dateDelivery}</p></div>
            <div><p className="font-bold text-gray-400 uppercase tracking-widest mb-1">{renderLabel('Porezni period', 'Tax Period')}</p><input type="month" className="font-black text-gray-900 no-print border-b outline-none text-right" value={doc.taxPeriod} onChange={e => setDoc({...doc, taxPeriod: e.target.value})} /><span className="print-only font-black">{doc.taxPeriod}</span></div>
          </div>
        </div>

        <div className="mb-4 no-print flex gap-2">
           <button onClick={addItem} className="px-4 py-2 bg-blue-50 text-blue-600 font-black rounded-lg text-[10px] uppercase hover:bg-blue-100">+ Dodaj slobodnu stavku</button>
           <div className="relative group">
              <button className="px-4 py-2 bg-gray-50 text-gray-600 font-black rounded-lg text-[10px] uppercase hover:bg-gray-100">Dodaj iz šifrarnika ▼</button>
              <div className="absolute top-full left-0 hidden group-hover:block bg-white border shadow-xl rounded-xl p-2 z-50 w-64 max-h-60 overflow-y-auto">
                 {inventory.map(inv => (
                    <button key={inv.id} onClick={() => { updateItem(crypto.randomUUID(), 'description', inv.name); }} className="w-full text-left p-2 text-xs hover:bg-gray-100 rounded-lg">{inv.name} ({inv.salePrice} KM)</button>
                 ))}
              </div>
           </div>
        </div>

        <table className="w-full mb-10 border-collapse">
          <thead>
            <tr className="bg-gray-100 text-[9px] font-black uppercase text-gray-500 tracking-widest border-t-2 border-b-2 border-gray-900">
              <th className="py-3 pl-3 text-left">RB</th>
              <th className="py-3 text-left">{renderLabel('Naziv i opis', 'Description')}</th>
              <th className="py-3 text-center">{renderLabel('Kol.', 'Qty')}</th>
              <th className="py-3 text-right">{renderLabel('Cijena', 'Price')}</th>
              <th className="py-3 text-center">Pop.%</th>
              <th className="py-3 text-center">PDV / VAT %</th>
              <th className="py-3 text-right pr-3">{renderLabel('Ukupno', 'Total')}</th>
            </tr>
          </thead>
          <tbody className="text-[11px]">
            {doc.items.map((item, idx) => {
              const rowSub = calculateSubtotal(item);
              const rowTotal = rowSub * (1 + (item.vatRate || 0)/100);
              return (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-4 pl-3 font-bold text-gray-400">{idx + 1}.</td>
                  <td className="py-4 pr-4">
                     <input className="w-full font-bold text-gray-900 no-print outline-none bg-transparent" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                     <span className="print-only font-bold text-gray-900">{item.description}</span>
                  </td>
                  <td className="py-4 text-center">
                     <input type="number" className="w-10 text-center font-black no-print outline-none" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                     <span className="print-only font-black">{item.quantity}</span>
                  </td>
                  <td className="py-4 text-right">
                     <input type="number" className="w-16 text-right no-print outline-none" value={item.pricePerUnit} onChange={e => updateItem(item.id, 'pricePerUnit', parseFloat(e.target.value) || 0)} />
                     <span className="print-only">{item.pricePerUnit.toFixed(2)}</span>
                  </td>
                  <td className="py-4 text-center">
                     <input type="number" className="w-8 text-center no-print outline-none text-blue-600" value={item.discount} onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)} />
                     <span className="print-only">{item.discount}%</span>
                  </td>
                  <td className="py-4 text-center">
                     <select className="no-print text-[9px] font-bold border rounded p-1" value={item.vatRate} onChange={e => updateItem(item.id, 'vatRate', parseInt(e.target.value))}>
                        {VAT_CATEGORIES.map(v => <option key={v.label} value={v.value}>{v.label}</option>)}
                     </select>
                     <span className="print-only">{item.vatRate}%</span>
                  </td>
                  <td className="py-4 text-right font-black pr-3">{rowTotal.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-end mb-20">
          <div className="w-80 p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm">
             <div className="space-y-2">
               {Object.entries(totalsByVat).map(([rate, data]: [string, any]) => (
                 <div key={rate} className="text-[10px] font-bold text-gray-500">
                    <div className="flex justify-between"><span>{renderLabel('Osnovica', 'Subtotal')} ({rate}%):</span><span className="text-gray-900">{data.sub.toFixed(2)} KM</span></div>
                    {parseInt(rate) > 0 && <div className="flex justify-between border-b pb-2"><span>PDV / VAT {rate}%:</span><span className="text-gray-900">{data.vat.toFixed(2)} KM</span></div>}
                 </div>
               ))}
               <div className="pt-3">
                 <div className="flex justify-between items-center">
                   <span className="text-[11px] font-black text-blue-600 uppercase">{renderLabel('ZA UPLATU', 'GRAND TOTAL')}:</span>
                   <span className="text-3xl font-black text-blue-600 tracking-tighter">{grandTotal.toFixed(2)} KM</span>
                 </div>
               </div>
             </div>
          </div>
        </div>

        <div className="border-t-2 border-gray-900 pt-8 grid grid-cols-2 gap-12 text-[10px]">
           <div>
             <h4 className="font-black text-gray-900 uppercase mb-3 leading-none">{renderLabel('Žiro računi', 'Bank Accounts')}:</h4>
             {company.bankAccounts.map(acc => (
               <div key={acc.id} className="mb-1 font-bold">
                  {acc.bankName}: <span className="text-blue-600">{acc.accountNumber}</span>
               </div>
             ))}
             <div className="mt-4 pt-4 border-t">
               <h4 className="font-black text-gray-900 uppercase mb-2">{renderLabel('Napomena', 'Note')}:</h4>
               <textarea className="w-full no-print border rounded p-2 text-[10px]" rows={3} value={doc.note} onChange={e => setDoc({...doc, note: e.target.value})} placeholder={getAutomaticNote() || "Unesite napomenu..."} />
               <p className="print-only whitespace-pre-wrap font-medium">{doc.note || getAutomaticNote() || 'U skladu sa Zakonom o PDV-u BiH.'}</p>
             </div>
           </div>
           
           <div className="flex flex-col justify-between items-center pl-10">
              <div className="w-full h-24 flex items-end justify-between px-6">
                <div className="text-center w-40 border-t border-gray-900 pt-2 uppercase font-black text-gray-900">{renderLabel('Potpis primio', 'Received by')}</div>
                <div className="text-center w-40 border-t border-gray-900 pt-2 uppercase font-black text-gray-900">{renderLabel('Potpis izdao', 'Issued by')}</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentForm;