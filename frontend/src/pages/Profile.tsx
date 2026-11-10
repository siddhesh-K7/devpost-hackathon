import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  User, Mail, Phone, MapPin, CreditCard, ShieldCheck, 
  Sparkles, Save, CheckCircle2, Package, Clock, Award, Key, Wallet, Plus
} from 'lucide-react';
import { UserAddress, PurchaseOrder } from '../types';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferred_currency || 'INR');
  const [preferredPayment, setPreferredPayment] = useState(user?.preferred_payment_method || 'UPI');
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [recentOrders, setRecentOrders] = useState<PurchaseOrder[]>([]);
  const [wallet, setWallet] = useState<{ balance: number; currency: string } | null>(null);
  const [topupAmount, setTopupAmount] = useState('10000');
  const [topupLoading, setTopupLoading] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setPreferredCurrency(user.preferred_currency || 'INR');
      setPreferredPayment(user.preferred_payment_method || 'UPI');
    }
  }, [user]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [addrRes, ordRes, walRes] = await Promise.all([
          api.get('/api/users/addresses'),
          api.get('/api/orders'),
          api.get('/api/wallet')
        ]);
        setAddresses(addrRes.data || []);
        setRecentOrders(ordRes.data || []);
        setWallet(walRes.data);
      } catch (err) {
        console.error('Error fetching profile secondary data', err);
      }
    };
    fetchUserData();
  }, []);

  const handleTopup = async () => {
    if (!topupAmount || isNaN(Number(topupAmount))) return;
    setTopupLoading(true);
    try {
      const res = await api.post('/api/wallet/topup', { amount: Number(topupAmount) });
      setWallet(res.data);
      setSuccessMsg(`Successfully added ₹${Number(topupAmount).toLocaleString()} to your AI Wallet!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to top up wallet');
    } finally {
      setTopupLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await updateProfile({
        full_name: fullName,
        phone: phone,
        preferred_currency: preferredCurrency,
        preferred_payment_method: preferredPayment
      });
      setSuccessMsg('Profile successfully synchronized to MongoDB!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-400/30 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>MongoDB Verified Account</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{user?.full_name}</h1>
              <p className="text-slate-300 text-xs sm:text-sm flex items-center gap-2 mt-0.5">
                <span>{user?.email}</span>
                <span>•</span>
                <span className="capitalize">{user?.auth_provider || 'Local'} Provider</span>
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-700/60 pt-4 sm:pt-0 sm:pl-6 text-xs text-slate-300">
            <div>Member Since</div>
            <div className="font-bold text-white text-sm">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'November 2026'}
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal Information & Preferences Form */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <h3 className="font-black text-slate-900 text-base">Account & Commerce Preferences</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">MongoDB Synchronized</span>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address (Verified)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Preferred Currency
                </label>
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-slate-900"
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Default 1-Click Payment Method
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'UPI', label: 'UPI / QR' },
                  { id: 'PAYPAL', label: 'PayPal' },
                  { id: 'CARD', label: 'Debit/Credit Card' },
                  { id: 'NET_BANKING', label: 'Net Banking' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPreferredPayment(m.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                      preferredPayment === m.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Synchronizing with MongoDB...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Saved Delivery Addresses & Identity Details */}
        <div className="space-y-6">
          {/* Autonomous AI Wallet Card */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm">PayPilot AI Autonomous Wallet</h4>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-semibold border border-emerald-400/30">
                ACTIVE
              </span>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Available Smart Balance</div>
              <div className="text-3xl font-extrabold text-white mt-0.5">
                ₹{(wallet?.balance || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Pre-funded balance used by the Gemini AI bot to automatically order and settle items for you without manual checkout clicks.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <input
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                placeholder="5000"
                className="w-28 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-bold"
              />
              <button
                type="button"
                onClick={handleTopup}
                disabled={topupLoading}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{topupLoading ? 'Adding...' : 'Add Funds'}</span>
              </button>
            </div>
          </div>

          {/* Delivery Addresses */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h4 className="font-black text-slate-900 text-sm">Saved Delivery Addresses</h4>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                {addresses.length} Saved
              </span>
            </div>

            {addresses.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No delivery addresses added yet. Add one during checkout!
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div key={addr.id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{addr.full_name}</span>
                      {addr.is_default && (
                        <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.2 rounded font-black">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600">{addr.street}, {addr.city}</div>
                    <div className="text-slate-400">{addr.state} - {addr.pin_code}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security & Authentication Info */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-3 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>Authentication & Data Governance</span>
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Stored in MongoDB Atlas / Local collections with SHA-256 / Argon2 protection.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Synchronized with PayPal Sandbox Orders API v2 buyer verification.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

