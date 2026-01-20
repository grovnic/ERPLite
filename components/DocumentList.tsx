
import React from 'react';
import { ERPDocument, DocType, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface DocumentListProps {
  type: DocType;
  documents: ERPDocument[];
  onEdit: (doc: ERPDocument) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  lang: Language;
}

const DocumentList: React.FC<DocumentListProps> = ({ type, documents, onEdit, onNew, onDelete, lang }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold">{t.docTypeNames[type]} List</h2>
        <button 
          onClick={onNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + {t.newDoc}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4"># Number</th>
              <th className="px-6 py-4">{t.clientName}</th>
              <th className="px-6 py-4">{t.date}</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.map(doc => (
              <tr key={doc.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">{doc.number}</td>
                <td className="px-6 py-4 text-gray-600">{doc.client.name}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{doc.dateCreated}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button 
                    onClick={() => onEdit(doc)}
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    View / Edit
                  </button>
                  <button 
                    onClick={() => { if(window.confirm('Delete?')) onDelete(doc.id); }}
                    className="text-red-500 hover:underline text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                  No {t.docTypeNames[type]} found. Create your first one!
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
