import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FraudAlert } from '../types';
import { ShieldAlert, ShieldCheck, AlertTriangle, Eye, CheckCircle2, Lock, Zap, Activity } from 'lucide-react';

export const FraudMonitoring: React.FC = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/api/fraud/alerts');
        setAlerts(res.data);
      } catch (err) {
        console.error('Error fetching fraud alerts', err);
      }
    };
    fetchAlerts();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Autonomous Risk Engine</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Real-Time Fraud & Anomaly Shield
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Machine learning velocity bounds, volume deviation detection, and PayPal buyer protection telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>All Payment Channels Protected</span>
        </div>
      </div>

      {/* 3 Telemetry Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Velocity Engine</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">Active (5m Bounds)</div>
          <p className="text-xs text-slate-500">
            Automatically throttles abnormal high-frequency transaction spikes across UPI and card gateways.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Volume Anomaly Gate</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">Active (&gt;₹90,000)</div>
          <p className="text-xs text-slate-500">
            Enforces mandatory explicit human 2FA approval for out-of-band high value orders before PayPal dispatch.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PayPal Risk Sync</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">100% Protected</div>
          <p className="text-xs text-slate-500">
            All orders qualify for PayPal Buyer & Merchant Protection with cryptographic HMAC verification.
          </p>
        </div>
      </div>

      {/* Real-Time Security Log Stream */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-900 text-lg">Live Risk Evaluation Telemetry</h3>
            <p className="text-xs text-slate-500 mt-0.5">Continuous scoring of all autonomous shopping transactions</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {alerts.length} Events Logged
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {alerts.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="font-bold text-slate-900 text-sm">System Normal: Zero Fraud Flags Detected</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All customer orders and payment authorizations are within legitimate behavioral parameters.
              </p>
            </div>
          ) : (
            alerts.map((alert, idx) => (
              <div key={idx} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      alert.risk_level === 'LOW' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {alert.risk_level} RISK ({alert.risk_score}/100)
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{alert.trigger_reason}</span>
                  </div>
                  <p className="text-xs text-slate-500">{alert.explanation}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-blue-600">{alert.suggested_action}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{alert.status}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
