import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, ShieldCheck, CreditCard, Sparkles, 
  BarChart3, CheckCircle2, ArrowRight, Zap, 
  Flame, ShoppingBag, Award, Lock, Smartphone
} from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-20 pb-28 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold">
            <span>Built for PayPal AI Hackathon 2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
            Autonomous E-Commerce Powered by <span className="text-blue-400">Gemini & PayPal</span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed">
            PayPilot AI unites Google Gemini multi-agent reasoning, local & Atlas MongoDB real-time catalogs (28 categories, 250+ products), and authentic PayPal Sandbox settlement with automated GST tax invoicing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/assistant"
              className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2.5 text-base"
            >
              <Bot className="w-5 h-5 text-white" />
              <span>Launch AI Shopping Agent</span>
            </Link>
            
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-xl transition flex items-center justify-center gap-2 text-base"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl font-black text-white">28</div>
              <div className="text-xs text-slate-400 mt-0.5">Retail Departments</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl font-black text-cyan-300">254+</div>
              <div className="text-xs text-slate-400 mt-0.5">Verified Products</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl font-black text-emerald-400">0%</div>
              <div className="text-xs text-slate-400 mt-0.5">Unauthorized Debits</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl font-black text-amber-300">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">PayPal Verified</div>
            </div>
          </div>
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      </section>

      {/* 2. ARCHITECTURAL PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Autonomous Multi-Agent Payment Engine
          </h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Not a basic question answering bot. A production-ready orchestration pipeline governing intent parsing, spec benchmarking, and fraud detection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Gemini Flash AI</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Maps complex multi-parameter natural language queries into verified database filters, executes mathematical spec benchmark matrix scoring, and recommends optimal purchases.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Multi-Payment Gateway</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Full support for Dynamic UPI QR Codes, VPA Collect, PCI-compliant tokenized cards, and PayPal Orders API v2 Sandbox with idempotency guarantees.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Human Approval Gate</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Zero autonomous charges without explicit human consent. Built-in fraud velocity anomaly scoring, price-tampering validation, and BlueDart shipment tracking.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
