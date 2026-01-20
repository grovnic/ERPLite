
import React, { useState } from 'react';
import { DocType, CalculationDoc, Company, Language, DocItem } from '../types';
import { TRANSLATIONS, VAT_RATE_BH } from '../constants';

interface CalculationFormProps {
  initialDoc: CalculationDoc | null;
  company: Company;
  onSave: (doc: any) => void;
  onCancel: () => void;
  lang: Language;
}

const CalculationForm: React.FC<CalculationFormProps> = ({ initialDoc, company, onSave, onCancel, lang }) => {
  const t = TRANSLATIONS[lang];
  const [doc, setDoc] = useState<CalculationDoc>(initialDoc || {
    id: crypto.randomUUID(),
    type: DocType.CALCULATION,
    number: `KAL-${new Date().getFullYear()}-${String(Math.floor(Math.random()*1000)).padStart(3, '0')}`,
    dateCreated: new Date().toISOString().split('T')[0],
    dateDue: new Date().toISOString().split('T')[0],
    client: { id: '', name: 'Dobavljač d.o.o.', address: '', city: '', jib: '' },
    items: [],
    language: lang,
    currency: 'BAM',
    supplierInvoiceNumber: '',
    transportCosts: 0,
    customsCosts: 0,
    otherCosts: 0
  });

  const addItem = () => {
    // Fix: Added missing 'discount' property to satisfy DocItem interface on line 33
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

  const removeItem = (id: string) => {
    setDoc({ ...doc, items: doc.items.filter(i => i.id !== id) });
  };

  const totalOtherCosts = doc.transportCosts + doc.customsCosts + doc.otherCosts;
  const totalPurchaseValue = doc.items.reduce((acc, i) => acc + (i.quantity * i.pricePerUnit), 0);
  
  // Distribute costs proportionally based on item value
  const getCostFactor = (itemPrice: number, totalValue: number) => {
    if (totalValue === 0) return 0;
    return (itemPrice * totalOtherCosts) / totalValue;
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
      <div className="flex justify-between items-center mb-8 no-print">
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 transition">← {t.back}</button>
        <div className="flex gap-2">
           <button onClick={() => window.print()} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">{t.print}</button>
           <button onClick={() => onSave(doc)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">{t.save}</button>
        </div>
      </div>

      <div className="printable-area p-6 bg-white border">
        <h1 className="text-2xl font-bold mb-6 text-center border-b pb-4 uppercase">Kalkulacija maloprodajne cijene</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div>
            <p><strong>Firma:</strong> {company.name}</p>
            <p><strong>Broj kalkulacije:</strong> {doc.number}</p>
            <p><strong>Datum:</strong> {doc.dateCreated}</p>
          </div>
          <div className="text-right">
             <p><strong>Dobavljač:</strong> {doc.client.name}</p>
             <p><strong>Faktura dobavljača:</strong> <input value={doc.supplierInvoiceNumber} onChange={e => setDoc({...doc, supplierInvoiceNumber: e.target.value})} className="border-b outline-none no-print"/></p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-8 no-print">
           <h3 className="font-bold mb-4 uppercase text-xs text-gray-500 tracking-wider">Zavisni troškovi</h3>
           <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400">Transport</label>
                <input type="number" className="w-full border rounded p-2" value={doc.transportCosts} onChange={e => setDoc({...doc, transportCosts: parseFloat(e.target.value) || 0})}/>
              </div>
              <div>
                <label className="block text-xs text-gray-400">Carina</label>
                <input type="number" className="w-full border rounded p-2" value={doc.customsCosts} onChange={e => setDoc({...doc, customsCosts: parseFloat(e.target.value) || 0})}/>
              </div>
              <div>
                <label className="block text-xs text-gray-400">Ostalo</label>
                <input type="number" className="w-full border rounded p-2" value={doc.otherCosts} onChange={e => setDoc({...doc, otherCosts: parseFloat(e.target.value) || 0})}/>
              </div>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-2 border">Opis</th>
                <th className="p-2 border">Kol.</th>
                <th className="p-2 border">Fak. Cijena</th>
                <th className="p-2 border">Zav. Troš.</th>
                <th className="p-2 border">Nab. Cijena</th>
                <th className="p-2 border">Marža %</th>
                <th className="p-2 border">Prod. Cijena</th>
                <th className="p-2 border no-print"></th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map(item => {
                const costPerItem = getCostFactor(item.pricePerUnit, totalPurchaseValue / (item.quantity || 1));
                const purchasePrice = item.pricePerUnit + costPerItem;
                const marginPercent = 20; // Example
                const salePrice = purchasePrice * (1 + marginPercent/100);

                return (
                  <tr key={item.id} className="border-b">
                    <td className="p-2 border"><input value={item.description} onChange={e => setDoc({...doc, items: doc.items.map(i => i.id === item.id ? {...i, description: e.target.value} : i)})} className="w-full no-print"/><span className="print-only">{item.description}</span></td>
                    <td className="p-2 border text-center"><input type="number" value={item.quantity} onChange={e => setDoc({...doc, items: doc.items.map(i => i.id === item.id ? {...i, quantity: parseFloat(e.target.value) || 0} : i)})} className="w-12 text-center no-print"/><span className="print-only">{item.quantity}</span></td>
                    <td className="p-2 border text-right"><input type="number" value={item.pricePerUnit} onChange={e => setDoc({...doc, items: doc.items.map(i => i.id === item.id ? {...i, pricePerUnit: parseFloat(e.target.value) || 0} : i)})} className="w-20 text-right no-print"/><span className="print-only">{item.pricePerUnit.toFixed(2)}</span></td>
                    <td className="p-2 border text-right">{costPerItem.toFixed(2)}</td>
                    <td className="p-2 border text-right font-bold">{purchasePrice.toFixed(2)}</td>
                    <td className="p-2 border text-center">20%</td>
                    <td className="p-2 border text-right text-blue-700 font-bold">{salePrice.toFixed(2)}</td>
                    <td className="p-2 border text-center no-print">
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600">✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <button 
          onClick={addItem}
          className="no-print w-full py-2 border-2 border-dashed border-gray-300 text-gray-400 hover:text-blue-500 hover:border-blue-500 rounded-lg transition my-4"
        >
          + Dodaj artikal u kalkulaciju
        </button>

        <div className="mt-8 text-right space-y-1">
           <p className="text-sm">Ukupna faktura dobavljača: <span className="font-bold">{totalPurchaseValue.toFixed(2)} KM</span></p>
           <p className="text-sm">Ukupni zavisni troškovi: <span className="font-bold">{totalOtherCosts.toFixed(2)} KM</span></p>
        </div>
      </div>
    </div>
  );
};

export default CalculationForm;
