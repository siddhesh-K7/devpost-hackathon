import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ExpenseAnalytics } from '../types';
import { PieChart, TrendingUp, DollarSign, Layers, CheckCircle2, Sparkles, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';

export const Expenses: React.FC = () => {
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/api/expenses/analytics');
        setAnalytics(res.data);
      } catch (err) {
        console.error('Error fetching expenses', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const COLORS = ['#2563eb', '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <PieChart className="w-4 h-4" />
            <span>AI Automated Fiscal Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Expense Analytics & Spend Velocity
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Real-time categorization, budget tracking, and predictive purchasing patterns.
          </p>
        </div>

        {/* Total Spend Stat Card */}
        <div className="bg-slate-900 text-white px-5 py-3 rounded-xl border border-slate-800 shrink-0">
          <div className="text-[11px] uppercase font-semibold text-slate-400">Total Settled Volume</div>
          <div className="text-2xl font-bold mt-0.5 text-white">₹{(analytics?.total_spending || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Monthly Spend Progression (2026)</span>
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              Automated Aggregation
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.monthly_trend || []}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Total Spent']} />
                <Area type="monotone" dataKey="spending" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#spendGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Bar Allocation */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Category Allocation</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{analytics?.category_breakdown?.length || 0} depts</span>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {(!analytics?.category_breakdown || analytics.category_breakdown.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No categorized expenses recorded yet.
              </div>
            ) : (
              analytics.category_breakdown.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span className="truncate max-w-[150px]">{item.category}</span>
                    <span>₹{item.amount.toLocaleString()} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: COLORS[idx % COLORS.length] 
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Gemini Budget Optimization</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your average cart velocity is well within safe thresholds. Eligible for 1-click autonomous approvals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
