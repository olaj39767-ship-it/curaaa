import React, { useState } from 'react';
import { 
  Truck, 
  Package, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  FileText, 
  ArrowRight,
  Search,
  Bike
} from 'lucide-react';
import { Order } from '../types';
import { formatNaira } from '../data/mockData';

interface OrderTrackingViewProps {
  orders: Order[];
  onOpenShop: () => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  orders,
  onOpenShop
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [searchCode, setSearchCode] = useState<string>('');

  const activeOrder = orders.find(o => 
    o.id === selectedOrderId || (searchCode && o.orderNumber.toLowerCase() === searchCode.toLowerCase().trim())
  ) || orders[0];

  const getStatusStep = (status: Order['status']) => {
    switch (status) {
      case 'confirmed': return 1;
      case 'pharmacist_check': return 2;
      case 'dispensed': return 3;
      case 'out_for_delivery': return 4;
      case 'delivered': return 5;
      default: return 1;
    }
  };

  const steps = [
    { num: 1, label: 'Order Confirmed', sub: 'Paystack verified' },
    { num: 2, label: 'Pharmacist Safety Check', sub: 'NAFDAC batch audit' },
    { num: 3, label: 'Dispensed & Sealed', sub: 'Tamper hologram applied' },
    { num: 4, label: 'Out for Delivery', sub: 'Curadeck Cold-Chain Rider' },
    { num: 5, label: 'Delivered', sub: 'Signed by recipient' },
  ];

  const currentStep = activeOrder ? getStatusStep(activeOrder.status) : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-0.5 rounded-md">
              Order Fulfillment Center
            </span>
            <span className="text-xs text-slate-400">• Real-Time Cold Chain Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display mt-1">
            Track Medication Delivery
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor the status of your prescribed drugs and pharmacy packages.
          </p>
        </div>

        {/* Search Order Bar */}
        <div className="flex items-center space-x-2 max-w-sm w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="e.g. CURA-78291"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
          <Truck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No orders placed yet</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Order standard medications from our catalog or submit your prescription list to start tracking.
          </p>
          <button
            onClick={onOpenShop}
            className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-md cursor-pointer"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Order Selector List (Left Column) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">YOUR RECENT ORDERS</h3>
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeOrder?.id === order.id
                    ? 'bg-teal-50/50 border-teal-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {order.orderNumber}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    order.status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.status === 'out_for_delivery'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-teal-100 text-teal-900'
                  }`}>
                    {order.status === 'out_for_delivery' ? '⚡ Out for Delivery' : order.status}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-800 mt-2 truncate">
                  {order.items.map(i => i.name).join(', ')}
                </p>

                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                  <span>{order.createdAt}</span>
                  <span className="font-bold text-slate-900">{formatNaira(order.total)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Order Live Tracker Detail (Right Column) */}
          {activeOrder && (
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-8">
              
              {/* Top Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-black font-display text-slate-900">
                      Order #{activeOrder.orderNumber}
                    </span>
                    <span className="text-xs text-slate-400">• {activeOrder.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Paystack Ref: <span className="font-mono text-teal-700">{activeOrder.paymentReference}</span>
                  </p>
                </div>

                <div className="text-right bg-teal-50 px-3.5 py-2 rounded-xl border border-teal-200">
                  <span className="text-[10px] text-teal-800 block font-semibold">ESTIMATED ARRIVAL</span>
                  <span className="text-sm font-extrabold text-teal-950 font-mono">
                    {activeOrder.estimatedDelivery}
                  </span>
                </div>
              </div>

              {/* Live Step Progress Bar */}
              <div className="space-y-6">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  DISPATCH & CLINICAL PIPELINE
                </h4>

                <div className="relative">
                  {/* Step Connector Line */}
                  <div className="hidden sm:block absolute top-5 left-6 right-6 h-0.5 bg-slate-200 -z-0">
                    <div 
                      className="h-full bg-teal-600 transition-all duration-500"
                      style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                    {steps.map((step) => {
                      const isComplete = step.num <= currentStep;
                      const isCurrent = step.num === currentStep;

                      return (
                        <div key={step.num} className="flex sm:flex-col items-center sm:text-center space-x-3 sm:space-x-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            isCurrent
                              ? 'bg-teal-600 text-white ring-4 ring-teal-100 shadow-md scale-105'
                              : isComplete
                              ? 'bg-teal-700 text-white'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            {isComplete ? <CheckCircle2 className="w-5 h-5" /> : step.num}
                          </div>
                          <div className="sm:mt-2">
                            <p className={`text-xs font-bold ${isComplete ? 'text-slate-900' : 'text-slate-400'}`}>
                              {step.label}
                            </p>
                            <p className="text-[10px] text-slate-400">{step.sub}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Rider & Cold-Chain Details (If out for delivery) */}
              {activeOrder.rider && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
                      <Bike className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                        ASSIGNED COLD-CHAIN RIDER
                      </span>
                      <h5 className="font-bold text-slate-900 text-sm">{activeOrder.rider.name}</h5>
                      <p className="text-xs text-slate-500">
                        {activeOrder.rider.bikeModel} • Plate: <strong className="font-mono text-slate-800">{activeOrder.rider.plateNo}</strong>
                      </p>
                    </div>
                  </div>

                  <a
                    href={`tel:${activeOrder.rider.phone}`}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-teal-400 text-slate-800 text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    <span>Call Rider ({activeOrder.rider.phone})</span>
                  </a>
                </div>
              )}

              {/* Pharmacist Note */}
              {activeOrder.pharmacistVerificationNote && (
                <div className="bg-teal-50/70 p-4 rounded-2xl border border-teal-200/80 text-xs space-y-1">
                  <span className="font-bold text-teal-950 flex items-center">
                    <ShieldCheck className="w-4 h-4 text-teal-700 mr-1.5" />
                    Clinical Pharmacist Safety Verification Stamp
                  </span>
                  <p className="text-teal-800 leading-relaxed">
                    {activeOrder.pharmacistVerificationNote}
                  </p>
                </div>
              )}

              {/* Items & Financial Invoice */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  PACKAGE CONTENTS & PAYMENT SUMMARY
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {activeOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatNaira(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatNaira(activeOrder.subtotal)}</span>
                  </div>
                  {activeOrder.teleconferenceFee > 0 && (
                    <div className="flex justify-between text-amber-800">
                      <span>Pharmacist Teleconference Fee</span>
                      <span>{formatNaira(activeOrder.teleconferenceFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee</span>
                    <span>{formatNaira(activeOrder.deliveryFee)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900">Total Paid (Paystack)</span>
                    <span className="text-base font-black text-slate-900 font-display">
                      {formatNaira(activeOrder.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
