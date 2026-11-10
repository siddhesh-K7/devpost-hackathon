import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Invoice } from '../types';
import { FileText, Plus, CheckCircle, Clock, Download, ArrowUpRight, CheckCircle2, Building, DollarSign } from 'lucide-react';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/api/invoices');
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/invoices', {
        client_name: clientName,
        client_email: clientEmail,
        amount: parseFloat(amount),
        due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
        notes: notes
      });
      setClientName('');
      setClientEmail('');
      setAmount('');
      setNotes('');
      fetchInvoices();
    } catch (err) {
      alert('Error creating invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Automated Tax Billing</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            B2B Invoices & Digital Tax Receipts
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Generate GST-compliant commercial payment requests, PDF tax receipts, and automated billing notifications.
          </p>
        </div>

        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold shadow-xs">
          Total Invoices: <span className="text-blue-600 font-black">{invoices.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoice Creation Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-900 text-base">Create Business Invoice</h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Client / Company Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                placeholder="Enterprise Tech Labs"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Billing Email
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                required
                placeholder="accounts@enterprisetech.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Total Amount (INR)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="45000"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Invoice Description / Line Items
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Q1 Autonomous payment automation API services"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer text-sm"
            >
              {loading ? 'Generating Document...' : 'Issue Invoice'}
            </button>
          </form>
        </div>

        {/* Invoices List Table */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-black text-slate-900 text-lg">Issued Invoices</h3>
            <span className="text-xs text-slate-400 font-semibold">GST-Compliant Tax Records</span>
          </div>

          <div className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No invoices generated yet. Create your first business invoice using the form on the left.
              </div>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">{inv.client_name}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                        {inv.status || 'ISSUED'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{inv.client_email}</span>
                      <span>•</span>
                      <span>Due: {new Date(inv.due_date).toLocaleDateString()}</span>
                    </div>
                    {inv.notes && <p className="text-xs text-slate-600 italic mt-1">{inv.notes}</p>}
                  </div>

                  <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                    <div className="text-base font-black text-slate-900">
                      ₹{inv.amount.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready for Settlement</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
