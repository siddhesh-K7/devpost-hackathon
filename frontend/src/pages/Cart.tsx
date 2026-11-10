import React, { useState } from 'react';
import { useCart } from '../context/useCart';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Trash2, Plus, Minus, ShoppingBag, CreditCard, 
  ShieldCheck, ArrowRight, CheckCircle2, ChevronRight, Sparkles, Tag, ArrowLeft
} from 'lucide-react';

export const Cart: React.FC = () => {
  const { cart, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Your Cart is Currently Empty</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Discover thousands of verified products across 28 departments or chat with the Gemini AI Shopping Assistant.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-2xl shadow-md transition cursor-pointer"
          >
            Explore 28 Departments
          </button>
          <button
            onClick={() => navigate('/assistant')}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold rounded-2xl transition cursor-pointer"
          >
            Ask AI Assistant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <ShoppingBag className="w-4 h-4" />
            <span>Synchronized MongoDB Shopping Cart</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Shopping Cart ({cart.item_count} {cart.item_count === 1 ? 'item' : 'items'})
          </h1>
        </div>

        <Link
          to="/products"
          className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.item_id || item.product_id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={item.image_url}
                  alt={item.product_name}
                  className="w-20 h-20 object-cover rounded-2xl bg-slate-100 shrink-0"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=300';
                  }}
                />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    {item.category || 'Retail Product'}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-0.5 truncate" title={item.product_name}>
                    {item.product_name}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Unit Price: <span className="font-semibold text-slate-700">₹{item.unit_price.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 text-sm font-black text-slate-900">
                    Subtotal: ₹{item.line_total.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Quantity Controls & Delete */}
              <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                  <button
                    onClick={() => updateQuantity(item.item_id, Math.max(1, item.quantity - 1))}
                    disabled={item.quantity <= 1}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-600 disabled:opacity-40 transition cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-black text-slate-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.item_id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  title="Remove product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary & Checkout Action */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
            <h3 className="font-black text-slate-900 text-lg pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">GST 18% Compliant</span>
            </h3>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-bold text-slate-900">₹{cart.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated GST (18%):</span>
                <span className="font-bold text-slate-900">₹{cart.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping & Handling:</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-between text-base font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-blue-600 text-xl font-bold">₹{cart.total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition cursor-pointer text-base flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="space-y-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Supports UPI Dynamic QR, VPA Collect, Cards & PayPal Sandbox</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Real-time inventory and pricing verified before payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
