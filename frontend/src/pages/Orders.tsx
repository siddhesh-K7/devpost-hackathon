import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Package, Truck, Download, RotateCcw, CheckCircle2, 
  Clock, AlertCircle, ChevronDown, ChevronUp 
} from 'lucide-react';
import { PurchaseOrder } from '../types';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [processingRefund, setProcessingRefund] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (orderId: string) => {
    if (selectedOrderId === orderId) {
      setSelectedOrderId(null);
      setTrackingData(null);
      return;
    }
    try {
      const res = await api.get(`/api/orders/${orderId}/tracking`);
      setSelectedOrderId(orderId);
      setTrackingData(res.data);
    } catch (err) {
      console.error('Failed to track order:', err);
    }
  };

  const handleRequestRefund = async (orderId: string) => {
    if (!refundReason.trim()) return;
    try {
      setProcessingRefund(true);
      const res = await api.post(`/api/orders/${orderId}/refund`, {
        reason: refundReason
      });
      setMsg(`Refund approved and processed! Refund ID: ${res.data.refund_id}`);
      setRefundOrderId(null);
      setRefundReason('');
      fetchOrders();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Refund failed');
    } finally {
      setProcessingRefund(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            My Orders & Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status tracking, verified tax invoices, and automated refund management.
          </p>
        </div>
      </div>

      {msg && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Loading verified order history from MongoDB Atlas...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 text-center border border-slate-200 rounded-2xl">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">No orders found yet</h3>
          <p className="text-xs text-slate-400 mt-1">Any purchase made via UPI, Card or PayPal will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isCompleted = order.payment_status === 'COMPLETED' || order.order_status === 'CONFIRMED';
            const isRefunded = order.payment_status === 'REFUNDED';
            const isExpanded = selectedOrderId === order.id;

            return (
              <div key={order.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-900">Order #{order.id.slice(-8).toUpperCase()}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isRefunded ? 'bg-amber-100 text-amber-800' :
                        isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isRefunded ? 'REFUNDED' : isCompleted ? 'CONFIRMED & PAID' : 'PENDING PAYMENT'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Placed on {new Date(order.created_at).toLocaleDateString()} &bull; Total: <span className="font-bold text-slate-900">₹{order.total_amount?.toLocaleString()}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <a
                        href={`http://localhost:8000/api/orders/${order.id}/invoice`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Invoice PDF</span>
                      </a>
                    )}
                    <button
                      onClick={() => handleTrack(order.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Order</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {isCompleted && !isRefunded && (
                      <button
                        onClick={() => setRefundOrderId(order.id)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Refund</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Items & Shipping preview */}
                <div className="p-5">
                  <div className="text-xs text-slate-700">
                    <p className="font-semibold text-slate-900">{order.product_name}</p>
                    {order.delivery_address && (
                      <p className="text-slate-500 text-[11px] mt-1">
                        Shipping to: {order.delivery_address.full_name}, {order.delivery_address.street}, {order.delivery_address.city} ({order.delivery_address.pin_code})
                      </p>
                    )}
                  </div>
                </div>

                {/* Expanded Tracking Milestones */}
                {isExpanded && trackingData && (
                  <div className="p-5 bg-slate-50 border-t border-slate-200 text-xs">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                        Carrier: {trackingData.carrier} &bull; AWB: {trackingData.tracking_number}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {trackingData.milestones.map((m: any, mIdx: number) => (
                        <div key={mIdx} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            m.status === 'COMPLETED' ? 'bg-emerald-500 text-white' :
                            m.status === 'IN_PROGRESS' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {m.status === 'COMPLETED' ? '✓' : mIdx + 1}
                          </div>
                          <span className={`font-medium ${m.status === 'COMPLETED' ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                            {m.title}
                          </span>
                          {m.status === 'IN_PROGRESS' && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">
                              Current Stage
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Refund Form Dialog */}
                {refundOrderId === order.id && (
                  <div className="p-5 bg-rose-50/60 border-t border-rose-200 text-xs space-y-3">
                    <h4 className="font-bold text-rose-900">Initiate Gateway Refund Request</h4>
                    <input
                      type="text"
                      placeholder="Reason for return e.g. Defective seal, delayed delivery"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full text-xs p-2.5 border border-rose-300 rounded-xl bg-white outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRefundOrderId(null)}
                        className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRequestRefund(order.id)}
                        disabled={processingRefund || !refundReason.trim()}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold"
                      >
                        {processingRefund ? 'Processing...' : 'Confirm Refund'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

