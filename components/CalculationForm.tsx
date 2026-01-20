import React, { useState, useMemo } from 'react';
import { DocType, CalculationDoc, Company, Language, DocItem } from '../types';
import { TRANSLATIONS, VAT_RATE_BH } from '../constants';

interface CalculationFormProps {
  initialDoc: CalculationDoc | null;
  company: Company;
  onSave: (doc: any) => void;
  onCancel: () => void;
  lang: Language;
  tenantId: string;
}

const CalculationForm: React.FC<CalculationFormProps> = ({ initialDoc, company, onSave, onCancel, lang, tenantId }) => {
  const t = TRANSLATIONS[lang];
  
  const [doc, setDoc] = useState<CalculationDoc>(initialDoc || {
    id: crypto.randomUUID(),
    tenantId: tenantId,
    type: DocType.CALCULATION,
    number: `KAL-${new Date().getFullYear()}-${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`,
    dateCreated: new Date().toISOString().split('T')[0],
    dateDue: new Date().toISOString().split('T')[0],
    dateDelivery: new Date().toISOString().split('T')[0],
    placeOfIssue: company.defaultPlaceOfIssue || '',
    paymentMethod: 'Virman',
    createdBy: '',
    client: { id: '', tenantId: tenantId, name: 'Dobavljač d.o.o.', address: '', city: '', jib: '' },
    items: [],
    language: lang,
    currency: 'BAM',
    supplierInvoiceNumber: '',
    transportCosts: 0,
    customsCosts: 0,
    otherCosts: 0
  });

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

  const updateItem = (id: string, field: string, value: any) => {
    setDoc({ ...doc, items: doc.items.map(i => i.id === id ? { ...i, [field]: value } : i) });
  };

  const removeItem = (id: string) => {
    setDoc({ ...doc, items: doc.items.filter(i => i.id !== id) });
  };

  const totalOtherCosts = doc.transportCosts + doc.customsCosts + doc.otherCosts;
  const totalPurchaseValue = useMemo(() => doc.items.reduce((acc, i) => acc + (i.quantity * i.pricePerUnit), 0), [doc.items]);
  
  const calculatedItems = useMemo(() => {
    return doc.items.map(item => {
      const linePurchaseValue = item.quantity * item.pricePerUnit;
      const weight = totalPurchaseValue > 0 ? linePurchaseValue / totalPurchaseValue : 0;
      const attributedCost = weight * totalOtherCosts;
      const purchasePriceWithCosts = item.quantity > 0 ? (linePurchaseValue + attributedCost) / item.quantity : 0;
      
      // Default margin 20% if not specified, usually in BH this is a result of (MPC - Costs)
      const marginPercent = 20; 
      const priceBeforeVat = purchasePriceWithCosts * (1 + marginPercent/100);
      const vatAmount = priceBeforeVat * (item.vatRate / 100);
      const retailPrice = priceBeforeVat + vatAmount;

      return {
        ...item,
        attributedCost,
        purchasePriceWithCosts,
        priceBeforeVat,
        retailPrice,
        vatAmount
      };
    });
  }, [doc.items, totalOtherCosts, totalPurchaseValue]);

  return (
    <div className="bg-white p-4 md:p-8 rounded-3xl shadow-2xl border border-gray-100 animate-fade-in max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10 no-print border-b pb-6">
        <button onClick={onCancel} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition">← {t.back}</button>
        <div className="flex gap-4">
           <button onClick={() => window.print()} className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100">🖨️ {t.print}</button>
           <button onClick={() => onSave(doc)} className="px-10 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-200 transition">💾 {t.save}</button>
        </div>
      </div>

      <div className="printable-area p-10 bg-white border-2 border-gray-900 min-h-[1100px]">
        <header className="text-center mb-12 relative">
           <div className="absolute top-0 left-0 text-left text-[10px] font-black uppercase text-gray-400">
              {company.name}<br/>{company.address}, {company.city}
           </div>
           <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900 mb-2">KALKULACIJA BR. {doc.number}</h1>
           <p className="text-sm font-bold text-blue-600 tracking-widest uppercase">Zapisnik o prijemu robe i formiranju cijena</p>
        </header>
        
        <div className="grid grid-cols-2 gap-12 mb-10 text-xs">
          <div className="p-6 bg-gray-50 rounded-2xl border">
            <h4 className="font-black text-gray-400 uppercase mb-4 tracking-widest">Podaci o dobavljaču</h4>
            <p className="text-lg font-black text-gray-900 uppercase mb-1">{doc.client.name}</p>
            <p className="font-bold text-gray-600">JIB: {doc.client.jib}</p>
            <div className="mt-4 flex gap-4 no-print">
               <input placeholder="Broj fakture dobavljača" className="flex-1 border-b bg-transparent outline-none font-bold" value={doc.supplierInvoiceNumber} onChange={e => setDoc({...doc, supplierInvoiceNumber: e.target.value})} />
            </div>
            <p className="print-only font-bold mt-2">Faktura dobavljača br: {doc.supplierInvoiceNumber}</p>
          </div>
          <div className="text-right self-center">
             <div className="space-y-1">
                <p className="font-bold text-gray-400">Datum dokumenta: <span className="text-gray-900">{doc.dateCreated}</span></p>
                <p className="font-bold text-gray-400">Mjesto izdavanja: <span className="text-gray-900">{doc.placeOfIssue}</span></p>
             </div>
          </div>
        </div>

        <div className="bg-blue-50/50 p-6 rounded-2xl mb-10 border border-blue-100 no-print">
           <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-6">Zavisni troškovi (Transport, Carina, Manipulacija)</h3>
           <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Transportni troškovi (KM)</label>
                <input type="number" className="w-full border-2 border-white rounded-xl px-4 py-2.5 text-sm shadow-sm" value={doc.transportCosts} onChange={e => setDoc({...doc, transportCosts: parseFloat(e.target.value) || 0})}/>
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Carinski troškovi (KM)</label>
                <input type="number" className="w-full border-2 border-white rounded-xl px-4 py-2.5 text-sm shadow-sm" value={doc.customsCosts} onChange={e => setDoc({...doc, customsCosts: parseFloat(e.target.value) || 0})}/>
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Ostali zavisni troškovi (KM)</label>
                <input type="number" className="w-full border-2 border-white rounded-xl px-4 py-2.5 text-sm shadow-sm" value={doc.otherCosts} onChange={e => setDoc({...doc, otherCosts: parseFloat(e.target.value) || 0})}/>
              </div>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[10px] text-left border-collapse border-2 border-gray-900">
            <thead className="bg-gray-100">
              <tr className="uppercase font-black text-gray-700">
                <th className="p-2 border border-gray-900">Naziv artikla</th>
                <th className="p-2 border border-gray-900 text-center">Kol.</th>
                <th className="p-2 border border-gray-900 text-right">Fak. Cijena</th>
                <th className="p-2 border border-gray-900 text-right">Troškovi</th>
                <th className="p-2 border border-gray-900 text-right">Nab. Vrij.</th>
                <th className="p-2 border border-gray-900 text-right">Marža%</th>
                <th className="p-2 border border-gray-900 text-right">Prod. bez PDV</th>
                <th className="p-2 border border-gray-900 text-right">Maloprod. Cena</th>
                <th className="p-2 border border-gray-900 text-center no-print"></th>
              </tr>
            </thead>
            <tbody>
              {calculatedItems.map(item => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="p-2 border border-gray-900">
                    <input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} className="w-full no-print outline-none font-bold"/>
                    <span className="print-only font-bold">{item.description}</span>
                  </td>
                  <td className="p-2 border border-gray-900 text-center">
                    <input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-10 text-center no-print outline-none"/>
                    <span className="print-only">{item.quantity}</span>
                  </td>
                  <td className="p-2 border border-gray-900 text-right font-mono">
                    <input type="number" value={item.pricePerUnit} onChange={e => updateItem(item.id, 'pricePerUnit', parseFloat(e.target.value) || 0)} className="w-16 text-right no-print outline-none"/>
                    <span className="print-only">{item.pricePerUnit.toFixed(2)}</span>
                  </td>
                  <td className="p-2 border border-gray-900 text-right font-mono bg-yellow-50/30">{(item.attributedCost / (item.quantity || 1)).toFixed(2)}</td>
                  <td className="p-2 border border-gray-900 text-right font-black font-mono">{item.purchasePriceWithCosts.toFixed(2)}</td>
                  <td className="p-2 border border-gray-900 text-right">20%</td>
                  <td className="p-2 border border-gray-900 text-right font-mono">{item.priceBeforeVat.toFixed(2)}</td>
                  <td className="p-2 border border-gray-900 text-right font-black text-blue-600 font-mono bg-blue-50/30">{item.retailPrice.toFixed(2)}</td>
                  <td className="p-2 border border-gray-900 text-center no-print">
                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition">✕</button>
                  </td>
                </tr>
              ))}
              {doc.items.length === 0 && (
                <tr><td colSpan={9} className="py-10 text-center text-gray-400 italic">Nema stavki u kalkulaciji.</td></tr>
              )}
            </tbody>
            <tfoot className="bg-gray-100 font-black">
               <tr>
                  <td colSpan={2} className="p-2 border border-gray-900 text-right uppercase">Ukupno:</td>
                  <td className="p-2 border border-gray-900 text-right font-mono">{totalPurchaseValue.toFixed(2)}</td>
                  <td className="p-2 border border-gray-900 text-right font-mono">{totalOtherCosts.toFixed(2)}</td>
                  <td className="p-2 border border-gray-900 text-right font-mono">{(totalPurchaseValue + totalOtherCosts).toFixed(2)}</td>
                  <td className="p-2 border border-gray-900"></td>
                  <td className="p-2 border border-gray-900 text-right font-mono">{calculatedItems.reduce((acc, i) => acc + (i.priceBeforeVat * i.quantity), 0).toFixed(2)}</td>
                  <td className="p-2 border border-gray-900 text-right font-mono bg-blue-100">{(calculatedItems.reduce((acc, i) => acc + (i.retailPrice * i.quantity), 0)).toFixed(2)}</td>
                  <td className="p-2 border border-gray-900 no-print"></td>
               </tr>
            </tfoot>
          </table>
        </div>
        
        <button onClick={addItem} className="no-print w-full py-4 border-2 border-dashed border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-500 rounded-2xl transition mt-6 font-bold uppercase text-xs tracking-widest">+ Dodaj novi artikal</button>

        <div className="mt-20 flex justify-between items-end border-t-2 border-gray-900 pt-10">
           <div className="space-y-4">
              <div className="w-64 h-px bg-gray-900 mb-2"></div>
              <p className="text-[10px] font-black uppercase text-gray-900">Komisija za prijem robe</p>
           </div>
           <div className="text-right space-y-1">
              <p className="text-sm font-black text-gray-900">UKUPNA VRIJEDNOST PO MPC:</p>
              <p className="text-4xl font-black text-blue-600 tracking-tighter italic">{(calculatedItems.reduce((acc, i) => acc + (i.retailPrice * i.quantity), 0)).toFixed(2)} KM</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CalculationForm;