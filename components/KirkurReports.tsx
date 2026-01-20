
import React, { useState } from 'react';
import { ERPDocument, DocType, Language } from '../types';

interface KirkurReportsProps {
  documents: ERPDocument[];
  lang: Language;
}

const KirkurReports: React.FC<KirkurReportsProps> = ({ documents, lang }) => {
  const [reportType, setReportType] = useState<'KIR' | 'KUR'>('KIR');
  const [period, setPeriod] = useState(new Date().toISOString().substring(0, 7));

  const filtered = documents.filter(doc => {
    const isPeriod = doc.taxPeriod === period;
    if (reportType === 'KIR') return isPeriod && (doc.type === DocType.INVOICE);
    if (reportType === 'KUR') return isPeriod && (doc.type === DocType.CALCULATION);
    return false;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-xl border border-blue-50 no-print">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex bg-gray-100 p-1 rounded-xl">
             <button onClick={() => setReportType('KIR')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${reportType === 'KIR' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>KIR (Izlazni)</button>
             <button onClick={() => setReportType('KUR')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${reportType === 'KUR' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>KUR (Ulazni)</button>
          </div>
          <div>
             <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Porezni period</label>
             <input type="month" className="border rounded-xl px-4 py-2 text-sm outline-none font-bold" value={period} onChange={e => setPeriod(e.target.value)} />
          </div>
          <button onClick={() => window.print()} className="ml-auto bg-gray-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase">Štampaj knjigu</button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden printable-area p-8">
        <div className="text-center mb-10">
           <h2 className="text-2xl font-black uppercase tracking-tighter">
             {reportType === 'KIR' ? 'KNJIGA IZLAZNIH RAČUNA (KIR)' : 'KNJIGA ULAZNIH RAČUNA (KUR)'}
           </h2>
           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Porezni period: {period}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="bg-gray-50 uppercase font-black text-gray-400 border-t-2 border-b-2 border-gray-900">
                <th className="px-3 py-4 border">Red. br.</th>
                <th className="px-3 py-4 border">Datum</th>
                <th className="px-3 py-4 border">Broj računa</th>
                <th className="px-3 py-4 border">Klijent/Dobavljač</th>
                <th className="px-3 py-4 border">JIB / PDV</th>
                <th className="px-3 py-4 border text-right">Osnovica 17%</th>
                <th className="px-3 py-4 border text-right">Osnovica 0%</th>
                <th className="px-3 py-4 border text-right">Izlazni PDV</th>
                <th className="px-3 py-4 border text-right">Ukupno</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, idx) => {
                const sub17 = doc.items.filter(i => i.vatRate === 17).reduce((acc, i) => acc + (i.quantity * i.pricePerUnit * (1 - i.discount/100)), 0);
                const sub0 = doc.items.filter(i => i.vatRate === 0).reduce((acc, i) => acc + (i.quantity * i.pricePerUnit * (1 - i.discount/100)), 0);
                const vat = sub17 * 0.17;
                return (
                  <tr key={doc.id} className="border-b">
                    <td className="px-3 py-3 border text-center">{idx + 1}</td>
                    <td className="px-3 py-3 border">{doc.dateCreated}</td>
                    <td className="px-3 py-3 border font-bold">{doc.number}</td>
                    <td className="px-3 py-3 border font-bold uppercase">{doc.client.name}</td>
                    <td className="px-3 py-3 border">{doc.client.pdvNumber || doc.client.jib}</td>
                    <td className="px-3 py-3 border text-right font-medium">{sub17.toFixed(2)}</td>
                    <td className="px-3 py-3 border text-right font-medium">{sub0.toFixed(2)}</td>
                    <td className="px-3 py-3 border text-right font-black text-blue-600">{vat.toFixed(2)}</td>
                    <td className="px-3 py-3 border text-right font-black">{(sub17 + sub0 + vat).toFixed(2)}</td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="py-20 text-center text-gray-400 italic">Nema zapisa za ovaj period.</td></tr>
              )}
            </tbody>
            <tfoot className="bg-gray-100 font-black">
               <tr>
                  <td colSpan={5} className="px-3 py-4 text-right uppercase border">Ukupno za period:</td>
                  <td className="px-3 py-4 text-right border">{filtered.reduce((acc, doc) => acc + doc.items.filter(i => i.vatRate === 17).reduce((acc2, i) => acc2 + (i.quantity * i.pricePerUnit * (1-i.discount/100)), 0), 0).toFixed(2)}</td>
                  <td className="px-3 py-4 text-right border">{filtered.reduce((acc, doc) => acc + doc.items.filter(i => i.vatRate === 0).reduce((acc2, i) => acc2 + (i.quantity * i.pricePerUnit * (1-i.discount/100)), 0), 0).toFixed(2)}</td>
                  <td className="px-3 py-4 text-right border text-blue-600">{filtered.reduce((acc, doc) => acc + doc.items.filter(i => i.vatRate === 17).reduce((acc2, i) => acc2 + (i.quantity * i.pricePerUnit * (1-i.discount/100)*0.17), 0), 0).toFixed(2)}</td>
                  <td className="px-3 py-4 text-right border">{filtered.reduce((acc, doc) => acc + (doc.items.reduce((acc2, i) => acc2 + (i.quantity * i.pricePerUnit * (1-i.discount/100) * (1 + i.vatRate/100)), 0)), 0).toFixed(2)}</td>
               </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KirkurReports;
