
import React, { useState } from 'react';
import { ERPDocument, DocType, Language } from '../types';

interface ReportsProps {
  documents: ERPDocument[];
  lang: Language;
}

const Reports: React.FC<ReportsProps> = ({ documents, lang }) => {
  const [filterType, setFilterType] = useState<DocType | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = documents.filter(doc => {
    const matchType = filterType === 'ALL' || doc.type === filterType;
    const matchFrom = !dateFrom || doc.dateCreated >= dateFrom;
    const matchTo = !dateTo || doc.dateCreated <= dateTo;
    return matchType && matchFrom && matchTo;
  });

  const totals = filtered.reduce((acc, doc) => {
    const subtotal = doc.items.reduce((itemAcc, i) => {
      const base = i.quantity * i.pricePerUnit;
      return itemAcc + (base - (base * (i.discount / 100)));
    }, 0);
    const vat = subtotal * 0.17;
    acc.subtotal += subtotal;
    acc.vat += vat;
    acc.grandTotal += (subtotal + vat);
    return acc;
  }, { subtotal: 0, vat: 0, grandTotal: 0 });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-6">Filteri Izvještaja</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Tip dokumenta</label>
              <select className="w-full border rounded-xl px-4 py-3 text-sm outline-none" value={filterType} onChange={e => setFilterType(e.target.value as any)}>
                 <option value="ALL">Svi dokumenti</option>
                 {Object.values(DocType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
           </div>
           <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Datum od</label>
              <input type="date" className="w-full border rounded-xl px-4 py-3 text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)}/>
           </div>
           <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Datum do</label>
              <input type="date" className="w-full border rounded-xl px-4 py-3 text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)}/>
           </div>
           <div className="flex items-end">
              <button onClick={() => window.print()} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-xs uppercase hover:bg-black transition">Štampaj Izvještaj</button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-200">
            <p className="text-xs font-bold uppercase opacity-60 mb-2 tracking-widest">Ukupna Osnovica</p>
            <p className="text-3xl font-black">{totals.subtotal.toFixed(2)} KM</p>
         </div>
         <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200">
            <p className="text-xs font-bold uppercase opacity-60 mb-2 tracking-widest">Ukupni PDV (17%)</p>
            <p className="text-3xl font-black">{totals.vat.toFixed(2)} KM</p>
         </div>
         <div className="bg-gray-900 p-8 rounded-3xl text-white shadow-xl shadow-gray-200">
            <p className="text-xs font-bold uppercase opacity-60 mb-2 tracking-widest">Sveukupno (Sa PDV-om)</p>
            <p className="text-3xl font-black">{totals.grandTotal.toFixed(2)} KM</p>
         </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
         <table className="w-full text-left">
           <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
             <tr>
               <th className="px-8 py-5">Broj dok.</th>
               <th className="px-8 py-5">Klijent</th>
               <th className="px-8 py-5">Datum</th>
               <th className="px-8 py-5 text-right">Osnovica</th>
               <th className="px-8 py-5 text-right">Ukupno</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-50">
             {filtered.map(doc => {
               const docSubtotal = doc.items.reduce((acc, i) => acc + (i.quantity * i.pricePerUnit * (1 - i.discount/100)), 0);
               return (
                <tr key={doc.id} className="hover:bg-gray-50 transition">
                  <td className="px-8 py-4 font-bold text-gray-900 text-xs">{doc.number}</td>
                  <td className="px-8 py-4 text-xs font-medium text-gray-500 uppercase">{doc.client.name}</td>
                  <td className="px-8 py-4 text-xs text-gray-400 font-bold">{doc.dateCreated}</td>
                  <td className="px-8 py-4 text-right font-medium text-gray-600">{docSubtotal.toFixed(2)}</td>
                  <td className="px-8 py-4 text-right font-black text-blue-600">{(docSubtotal * 1.17).toFixed(2)} KM</td>
                </tr>
               )
             })}
           </tbody>
         </table>
      </div>
    </div>
  );
};

export default Reports;
