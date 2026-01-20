
import React from 'react';
import { ERPDocument, DocType, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface DocumentListProps {
  type: DocType;
  documents: ERPDocument[];
  onEdit: (doc: ERPDocument) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClone: (doc: ERPDocument) => void;
  onConvertToInvoice?: (doc: ERPDocument) => void;
  lang: Language;
}

const DocumentList: React.FC<DocumentListProps> = ({ type, documents, onEdit, onNew, onDelete, onClone, onConvertToInvoice, lang }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-lg font-black uppercase tracking-widest text-gray-900">{t.docTypeNames[type]} List</h2>
        <button 
          onClick={onNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-blue-200"
        >
          + {t.newDoc}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black tracking-widest">
            <tr>
              <th className="px-8 py-5">Broj</th>
              <th className="px-8 py-5">{t.clientName}</th>
              <th className="px-8 py-5">{t.date}</th>
              <th className="px-8 py-5 text-right">Akcije</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {documents.map(doc => (
              <tr key={doc.id} className="hover:bg-blue-50/20 transition group">
                <td className="px-8 py-5 font-black text-gray-900 uppercase text-sm">{doc.number}</td>
                <td className="px-8 py-5">
                   <p className="font-bold text-gray-700 text-sm">{doc.client.name}</p>
                   <p className="text-[10px] text-gray-400 font-bold">{doc.client.city}</p>
                </td>
                <td className="px-8 py-5 text-gray-500 text-xs font-bold">{doc.dateCreated}</td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-3 items-center opacity-0 group-hover:opacity-100 transition duration-200">
                    {type === DocType.OFFER && onConvertToInvoice && (
                      <button 
                        onClick={() => onConvertToInvoice(doc)}
                        className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-green-100"
                        title={t.convertToInvoice}
                      >
                        ⚡ Račun
                      </button>
                    )}
                    <button 
                      onClick={() => onClone(doc)}
                      className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-100"
                      title={t.clone}
                    >
                      📋 {t.clone}
                    </button>
                    <button 
                      onClick={() => onEdit(doc)}
                      className="text-blue-600 hover:text-blue-800 font-black text-[10px] uppercase tracking-widest underline"
                    >
                      Pregled
                    </button>
                    <button 
                      onClick={() => { if(window.confirm('Obrisati dokument trajno?')) onDelete(doc.id); }}
                      className="text-red-400 hover:text-red-600 font-black text-[10px] uppercase tracking-widest underline"
                    >
                      Obriši
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic">
                  Nema dokumenata u ovoj kategoriji.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentList;
