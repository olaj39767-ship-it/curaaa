import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ShieldAlert, 
  Truck, 
  Lock, 
  ArrowRight,
  Info
} from 'lucide-react';
import { CartItem, User } from '../types';
import { formatNaira, NIGERIAN_STATES } from '../data/mockData';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (medicineId: string, delta: number) => void;
  onRemoveItem: (medicineId: string) => void;
  onProceedToCheckout: (orderDetails: {
    deliveryState: string;
    deliveryAddress: string;
    deliverySpeed: 'standard' | 'express';
    subtotal: number;
    teleconferenceFee: number;
    deliveryFee: number;
    total: number;
  }) => void;
  currentUser: User | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  currentUser
}) => {
  const [deliveryState, setDeliveryState] = useState<string>(currentUser?.state || 'Lagos State');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(currentUser?.address || 'Admiralty Way, Lekki Phase 1');
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express'>('standard');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + (item.medicine.price * item.quantity), 0);
  
  // Check if ANY drug requires prescription
  const hasPrescriptionMed = cartItems.some(item => item.medicine.prescriptionRequired);
  const teleconferenceFee = hasPrescriptionMed ? 500 : 0;
  
  // Delivery calculation based on state and speed
  const baseDelivery = deliveryState.includes('Lagos') ? 1500 : 2500;
  const deliveryFee = deliverySpeed === 'express' ? baseDelivery + 1000 : baseDelivery;
  
  const total = subtotal + teleconferenceFee + deliveryFee;

  const handleCheckoutClick = () => {
    if (!deliveryAddress.trim()) {
      alert('Please provide a delivery address.');
      return;
    }
    onProceedToCheckout({
      deliveryState,
      deliveryAddress,
      deliverySpeed,
      subtotal,
      teleconferenceFee,
      deliveryFee,
      total
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-teal-600" />
              <h2 className="font-bold text-slate-900 text-base">Your Medication Cart</h2>
              <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Your cart is currently empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Browse our catalog of genuine fixed-price medications or upload your handwritten prescription list.
                </p>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="divide-y divide-slate-100">
                  {cartItems.map(({ medicine, quantity }) => (
                    <div key={medicine.id} className="py-3.5 flex items-center justify-between gap-3">
                      <img
                        src={medicine.image}
                        alt={medicine.name}
                        className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {medicine.name}
                          </h4>
                          {medicine.prescriptionRequired && (
                            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              Rx
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{medicine.genericName}</p>
                        <p className="text-xs font-bold text-teal-700 mt-1">
                          {formatNaira(medicine.price)}
                        </p>
                      </div>

                      {/* Quantity buttons */}
                      <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
                        <button
                          onClick={() => onUpdateQuantity(medicine.id, -1)}
                          className="p-1 rounded text-slate-600 hover:bg-white hover:text-slate-900 transition-all cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-slate-800 px-1.5 min-w-5 text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(medicine.id, 1)}
                          className="p-1 rounded text-slate-600 hover:bg-white hover:text-slate-900 transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(medicine.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Prescription Rule Alert Banner */}
                {hasPrescriptionMed && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                      <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Prescription Rule Applied (+₦500)</span>
                    </div>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      Your cart contains prescription items. In accordance with Pharmacists Council of Nigeria (PCN) guidelines, a <strong>₦500 teleconference fee</strong> is included for a licensed clinical pharmacist to review and approve your dosage before dispensing.
                    </p>
                  </div>
                )}

                {/* Delivery Information Accordion */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-3 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                    <Truck className="w-4 h-4 text-teal-600" />
                    <span>Delivery Details</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      DELIVERY DESTINATION
                    </label>
                    <select
                      value={deliveryState}
                      onChange={(e) => setDeliveryState(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-medium"
                    >
                      {NIGERIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      STREET ADDRESS
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. 14 Victoria Island, Lagos"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="pt-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                      DISPATCH SPEED
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliverySpeed('standard')}
                        className={`p-2 rounded-lg text-left border cursor-pointer transition-all ${
                          deliverySpeed === 'standard' 
                            ? 'bg-teal-50 border-teal-500 text-teal-900 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <p className="font-bold text-[11px]">Standard</p>
                        <p className="text-[10px] text-slate-500">24 - 48 Hours</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliverySpeed('express')}
                        className={`p-2 rounded-lg text-left border cursor-pointer transition-all ${
                          deliverySpeed === 'express' 
                            ? 'bg-teal-50 border-teal-500 text-teal-900 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <p className="font-bold text-[11px]">⚡ Express (Lagos)</p>
                        <p className="text-[10px] text-slate-500">2 - 4 Hours (+₦1,000)</p>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer & Checkout button */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Medications Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatNaira(subtotal)}</span>
                </div>
                {hasPrescriptionMed && (
                  <div className="flex justify-between text-amber-800">
                    <span>Pharmacist Teleconference (Mandatory)</span>
                    <span className="font-bold text-amber-700">{formatNaira(teleconferenceFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery ({deliveryState})</span>
                  <span className="font-semibold text-slate-900">{formatNaira(deliveryFee)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm">Total Due</span>
                    <span className="block text-[10px] text-slate-500">Includes PCN pharmacist audit</span>
                  </div>
                  <span className="text-xl font-black text-slate-900 font-display">
                    {formatNaira(total)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Pay via Paystack ({formatNaira(total)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
