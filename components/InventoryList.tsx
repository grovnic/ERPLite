import React, { useState } from 'react';
import { InventoryItem, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface InventoryListProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  lang: Language;
  tenantId: string;
}

const InventoryList: React.FC<InventoryListProps> = ({ inventory, setInventory, lang, tenantId }) => {
  const t = TRANSLATIONS[lang];
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ 
    code: '', name: '', category: '', unit: 'kom', costPrice: 0, salePrice: 0, quantity: 0, vatRate: 17 
  });

  const addItem = () => {
    if (!newItem.name || !newItem.code) return;
    // Fix: Included missing tenantId to satisfy the InventoryItem interface
    const itemToAdd: InventoryItem = {
      id: crypto.randomUUID(),
      tenantId: tenantId,
      code: newItem.code!,
      name: newItem.name!,
      category: newItem.category || 'Nekategorisano',
      unit: newItem.unit || 'kom',
      costPrice: newItem.costPrice || 0,
      salePrice: newItem.salePrice || 0,
      quantity: newItem.quantity || 0,
      vatRate: newItem.vatRate || 17
    };
    setInventory([...inventory, itemToAdd]);
    setNewItem({ code: '', name: '', category: '', unit: 'kom', costPrice: 0, salePrice: 0, quantity: 0, vatRate: 17 });
  };

  const updateQuantity = (id: string, delta: number) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, quantity: item.quantity + delta } : item));
  };

  const deleteItem = (id: string) => {
    if(window.confirm('Obrisati artikal sa lagera?')) {
      setInventory(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h3 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-wider">Novi artikal</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <input className="border-2 border-gray-50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" placeholder={t.code} value={newItem.code} onChange={e => setNewItem({...newItem, code: e.target.value})}/>
          <input className="border-2 border-gray-50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none col-span-2" placeholder="Naziv" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}/>
          <input className="border-2 border-gray-50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" placeholder="Kategorija" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}/>
          <input className="border-2 border-gray-50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" placeholder="JM" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})}/>
          <input type="number" className="border-2 border-gray-50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" placeholder="Cijena" value={newItem.salePrice} onChange={e => setNewItem({...newItem, salePrice: parseFloat(e.target.value)})}/>
          <input type="number" className="border-2 border-gray-50 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" placeholder="Zaliha" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})}/>
          <button onClick={addItem} className="bg-blue-600 text-white px-4 py-3 rounded-xl text-xs font-black uppercase hover:bg-blue-700 shadow-lg shadow-blue-200 transition">Dodaj</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
         <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
            <h2 className="font-black text-gray-900 uppercase tracking-widest text-sm">Lager Lista</h2>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-gray-50/80 text-[10px] text-gray-400 uppercase font-black tracking-widest">
               <tr>
                 <th className="px-8 py-5">Šifra</th>
                 <th className="px-8 py-5">Kategorija</th>
                 <th className="px-8 py-5">Naziv</th>
                 <th className="px-8 py-5 text-center">Jed.</th>
                 <th className="px-8 py-5 text-right">Cijena</th>
                 <th className="px-8 py-5 text-center">Zaliha</th>
                 <th className="px-8 py-5 text-right no-print">Akcija</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {inventory.map(item => (
                 <tr key={item.id} className="hover:bg-blue-50/30 transition">
                   <td className="px-8 py-5 font-bold text-gray-400 text-xs">{item.code}</td>
                   <td className="px-8 py-5">
                      <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-600 uppercase">{item.category}</span>
                   </td>
                   <td className="px-8 py-5 font-bold text-gray-800">{item.name}</td>
                   <td className="px-8 py-5 text-center text-gray-500 text-xs">{item.unit}</td>
                   <td className="px-8 py-5 text-right font-black text-blue-600">{item.salePrice.toFixed(2)}</td>
                   <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-3">
                         <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-full border border-gray-200 text-gray-400">-</button>
                         <span className="font-black min-w-[30px]">{item.quantity}</span>
                         <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-full border border-gray-200 text-gray-400">+</button>
                      </div>
                   </td>
                   <td className="px-8 py-5 text-right no-print">
                      <button onClick={() => deleteItem(item.id)} className="text-red-400 font-bold text-xs uppercase hover:underline">Ukloni</button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};

export default InventoryList;