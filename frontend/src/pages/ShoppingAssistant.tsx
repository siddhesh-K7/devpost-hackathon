import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Bot, Send, Sparkles, CheckCircle2, ShieldCheck, 
  ArrowRight, CreditCard, ChevronRight, Layers, DollarSign 
} from 'lucide-react';
import { ChatResponse, AgentStep, Product, PurchaseCard } from '../types';

export const ShoppingAssistant: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; data?: ChatResponse }>>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activePurchase, setActivePurchase] = useState<PurchaseCard | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<any | null>(null);

  // Default initial greeting
  useEffect(() => {
    setMessages([
      {
        sender: 'assistant',
        text: 'Hello! I am **PayPilot AI**, your autonomous commerce agent. Ask me to research products, compare specs across budgets, and prepare approved PayPal checkout orders.'
      }
    ]);
  }, []);

  const handleSend = async (textToSend?: string) => {
    const message = textToSend || query;
    if (!message.trim() || loading) return;

    // Append user message
    setMessages(prev => [...prev, { sender: 'user', text: message }]);
    setQuery('');
    setLoading(true);
    setPaymentSuccess(null);

    try {
      const res = await api.post<ChatResponse>('/api/ai/chat', {
        session_id: sessionId,
        message: message
      });

      setSessionId(res.data.session_id);
      if (res.data.purchase_confirmation) {
        setActivePurchase(res.data.purchase_confirmation);
      }

      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: res.data.reply,
        data: res.data
      }]);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: 'Your login session expired. Please log in again to chat with PayPilot AI.'
        }]);
      } else {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: 'Sorry, I encountered an issue coordinating with the agent pipeline. Please ensure the backend is running.'
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndPay = async (orderId: string) => {
    setPaymentProcessing(true);
    try {
      // Step 1: Human explicit approval
      await api.post('/api/orders/approve', {
        order_id: orderId,
        approved: true
      });

      // Step 2: Create PayPal Sandbox Order
      const createRes = await api.post('/api/payments/create-order', {
        purchase_order_id: orderId
      });

      const paypalOrderId = createRes.data.paypal_order_id;

      // Step 3: Capture Order
      const captureRes = await api.post('/api/payments/capture', {
        paypal_order_id: paypalOrderId,
        purchase_order_id: orderId
      });

      setPaymentSuccess(captureRes.data);
      setActivePurchase(null);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Payment authorization failed');
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Autonomous Multi-Agent Shopping Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">PayPilot AI Assistant</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gemini-driven intent parsing, specs benchmarking, value scoring, and PayPal Sandbox settlement.
          </p>
        </div>

        {/* Quick prompt buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSend("Find the best laptop for programming under ₹60,000, compare three products, and prepare payment")}
            className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-full font-medium transition"
          >
            "Best laptop for programming under ₹60,000"
          </button>
          <button
            onClick={() => handleSend("Compare Dell Inspiron vs HP 15s for developers")}
            className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-full font-medium transition"
          >
            "Compare Dell vs HP"
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Chat Stream (Left 2 cols) */}
        <div className="lg:col-span-2 flex flex-col h-[75vh] bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Execution Timeline */}
                  {msg.data?.execution_timeline && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>Agent Execution Trace</span>
                      </div>
                      <div className="space-y-1.5">
                        {msg.data.execution_timeline.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2 text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700">
                            <span className="font-semibold text-blue-600">{step.agent}:</span>
                            <span className="truncate">{step.action}</span>
                            <span className="ml-auto text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                              {step.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comparison Matrix Table */}
                  {msg.data?.comparison?.comparison_items && msg.data.comparison.comparison_items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Product Benchmark Matrix
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                          <thead className="bg-slate-100 text-slate-700 font-semibold">
                            <tr>
                              <th className="p-2">Model</th>
                              <th className="p-2">Price</th>
                              <th className="p-2">Key Specs</th>
                              <th className="p-2">Value Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {msg.data.comparison.comparison_items.map((item: any, cIdx) => {
                              const specSummary = item.specs 
                                ? Object.entries(item.specs).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' • ')
                                : (item.ram || item.cpu ? `${item.ram || ''} ${item.cpu || ''}`.trim() : 'Verified Retail Specs');
                              return (
                                <tr key={cIdx} className={item.product_id === msg.data?.comparison?.recommended_product_id ? 'bg-blue-50/60 font-semibold' : ''}>
                                  <td className="p-2 truncate max-w-[180px]" title={item.name}>{item.name}</td>
                                  <td className="p-2 whitespace-nowrap">₹{item.price.toLocaleString()}</td>
                                  <td className="p-2 text-slate-500 truncate max-w-[220px]" title={specSummary}>{specSummary}</td>
                                  <td className="p-2 text-blue-600 font-bold">{item.value_score}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Display Product Cards Carousel / Grid */}
                  {msg.data?.products && msg.data.products.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                        <span>Retrieved Catalog Results ({msg.data.products.length})</span>
                        <span className="text-slate-400 font-normal">Click any product to prepare order</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {msg.data.products.slice(0, 4).map((prod) => (
                          <div 
                            key={prod.id} 
                            onClick={() => {
                              // Select this product for checkout review
                              setActivePurchase({
                                order_id: `ord_${prod.id}_${Date.now()}`,
                                product_id: prod.id,
                                product_name: prod.name,
                                unit_price: prod.price,
                                subtotal: prod.price,
                                tax: Math.round(prod.price * 0.18),
                                shipping: 0,
                                total: Math.round(prod.price * 1.18),
                                currency: prod.currency || 'INR',
                                requires_approval: true,
                                status: 'PENDING_APPROVAL'
                              });
                            }}
                            className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-sm cursor-pointer transition"
                          >
                            <img 
                              src={prod.image_url} 
                              alt={prod.name} 
                              className="w-14 h-14 object-cover rounded-lg bg-slate-100 shrink-0"
                              onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300'; }}
                            />
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-slate-800 truncate" title={prod.name}>{prod.name}</h5>
                              <p className="text-[11px] text-blue-600 font-semibold mt-0.5">₹{prod.price.toLocaleString()}</p>
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                                <span className="text-amber-500 font-bold">★ {prod.rating}</span>
                                <span>•</span>
                                <span className="truncate">{prod.brand || prod.category}</span>
                              </div>
                            </div>
                            <button 
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-[11px] font-semibold shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                api.post('/api/cart/items', { product_id: prod.id, quantity: 1 })
                                  .then(() => alert(`Added "${prod.name}" to cart!`))
                                  .catch((err) => alert(err?.response?.data?.detail || 'Failed to add to cart'));
                              }}
                            >
                              + Cart
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl w-fit text-sm text-slate-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Gemini Multi-Agent Orchestrator reasoning...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask PayPilot e.g. 'Recommend a laptop under ₹60,000 for programming'..."
                className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5 transition shadow-sm"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Sidebar: Autonomous Pre-Purchase & PayPal Checkout */}
        <div className="space-y-6">
          {/* Active Order Card */}
          {activePurchase && (
            <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-blue-500 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  Pre-Payment Order Review
                </span>
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold border border-amber-200">
                  User Approval Required
                </span>
              </div>

              <div className="mt-4">
                <h3 className="font-bold text-slate-900 text-base">{activePurchase.product_name}</h3>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Unit Price:</span>
                    <span className="font-medium text-slate-900">₹{activePurchase.unit_price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (GST 18%):</span>
                    <span className="font-medium text-slate-900">₹{activePurchase.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span className="font-medium text-emerald-600">Free</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 text-base font-extrabold text-slate-900">
                    <span>Total Payable:</span>
                    <span className="text-blue-600">₹{activePurchase.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handleApproveAndPay(activePurchase.order_id)}
                  disabled={paymentProcessing}
                  className="w-full py-3 bg-[#0070ba] hover:bg-[#003087] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>{paymentProcessing ? 'Processing with PayPal...' : 'Approve & Pay with PayPal'}</span>
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Sandbox Order API v2 with Double-Capture & Price Guardrails.
                </p>
              </div>
            </div>
          )}

          {/* Payment Receipt Card */}
          {paymentSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 p-6 rounded-2xl shadow-md animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-800 font-bold mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span className="text-lg">Payment Verified & Settled</span>
              </div>
              <p className="text-xs text-emerald-700 mb-4">
                PayPal capture completed and permanently recorded to MongoDB Atlas.
              </p>

              <div className="space-y-2 text-xs bg-white p-4 rounded-xl border border-emerald-200 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-mono font-bold text-slate-900">{paymentSuccess.receipt_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PayPal Capture ID:</span>
                  <span className="font-mono text-slate-900">{paymentSuccess.paypal_capture_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-slate-900">₹{paymentSuccess.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Fraud Score:</span>
                  <span className="font-semibold text-emerald-600">{paymentSuccess.fraud_assessment?.risk_score}/100 (CLEARED)</span>
                </div>
              </div>
            </div>
          )}

          {/* System Guarantees Card */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">PayPilot Security Guardrails</h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Zero Autonomous Charges: Human authorization gate required before checkout.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Backend Recalculation: Prevents client price tampering or fake totals.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Live Fraud Engine: Real-time velocity and volume anomaly monitoring.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

