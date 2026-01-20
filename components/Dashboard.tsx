
import React from 'react';
import { ERPDocument, DocType, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  documents: ERPDocument[];
  lang: Language;
  setActiveTab: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ documents, lang, setActiveTab }) => {
  const t = TRANSLATIONS[lang];
  
  const invoices = documents.filter(d => d.type === DocType.INVOICE);
  const totalRevenue = invoices.reduce((acc, doc) => {
    const subtotal = doc.items.reduce((itemAcc, item) => itemAcc + (item.quantity * item.pricePerUnit), 0);
    return acc + subtotal * 1.17;
  }, 0);

  const pendingOffers = documents.filter(d => d.type === DocType.OFFER).length;

  const chartData = [
    { name: t.invoices, count: invoices.length },
    { name: t.offers, count: documents.filter(d => d.type === DocType.OFFER).length },
    { name: t.calculations, count: documents.filter(d => d.type === DocType.CALCULATION).length },
    { name: t.orders, count: documents.filter(d => d.type === DocType.PURCHASE_ORDER).length },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-2xl">💰</div>
          <div>
            <p className="text-sm text-gray-500">{t.total} (Invoiced)</p>
            <p className="text-2xl font-bold">{totalRevenue.toFixed(2)} KM</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl">📄</div>
          <div>
            <p className="text-sm text-gray-500">{t.invoices}</p>
            <p className="text-2xl font-bold">{invoices.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-2xl">💡</div>
          <div>
            <p className="text-sm text-gray-500">{t.offers}</p>
            <p className="text-2xl font-bold">{pendingOffers}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Document Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {documents.slice(0, 5).map(doc => (
              <div key={doc.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {doc.type === DocType.INVOICE ? '📄' : doc.type === DocType.OFFER ? '💡' : '📦'}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">{doc.number}</p>
                    <p className="text-xs text-gray-500">{doc.client.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{doc.dateCreated}</p>
                  <p className="text-xs text-gray-400 capitalize">{doc.type.toLowerCase().replace('_', ' ')}</p>
                </div>
              </div>
            ))}
            {documents.length === 0 && <p className="text-center text-gray-400 py-8">No recent documents found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
