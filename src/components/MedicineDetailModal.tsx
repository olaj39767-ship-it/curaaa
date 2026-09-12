import React from 'react';
import { X, ShieldAlert, CheckCircle, Plus, ShoppingBag, Building, ShieldCheck, AlertCircle } from 'lucide-react';
import { Medicine } from '../types';
import { formatNaira } from '../data/mockData';

interface MedicineDetailModalProps {
  medicine: Medicine | null;
  onClose: () => void;
  onAddToCart: (medicine: Medicine) => void;
  isInCart: boolean;
}

export const MedicineDetailModal: React.FC<MedicineDetailModalProps> = ({
  medicine,
  onClose,
  onAddToCart,
  isInCart
}) => {
  if (!medicine) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700">
              {medicine.category}
            </span>
            {medicine.prescriptionRequired && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center">
                <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                Prescription Required
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Image */}
            <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 aspect-square max-h-72">
              <img
                src={medicine.image}
                alt={medicine.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Main Info */}
            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <p className="text-xs text-teal-700 font-bold tracking-wide uppercase">
                  {medicine.brand} • {medicine.unit}
                </p>
                <h2 className="text-xl font-black text-slate-900 font-display mt-0.5">
                  {medicine.name}
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Active Ingredient: <strong className="text-slate-800">{medicine.genericName}</strong>
                </p>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Manufacturer</span>
                    <span className="font-semibold text-slate-800">{medicine.manufacturer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NAFDAC Reg No</span>
                    <span className="font-mono font-bold text-teal-800">{medicine.nafdacNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stock Availability</span>
                    <span className="text-emerald-700 font-semibold flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      In Stock ({medicine.stockCount} packs in hub)
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-xs text-slate-400">Fixed Retail Price</span>
                  <span className="text-2xl font-black text-slate-900 font-display">
                    {formatNaira(medicine.price)}
                  </span>
                </div>

                <button
                  onClick={() => {
                    onAddToCart(medicine);
                    onClose();
                  }}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md ${
                    isInCart
                      ? 'bg-teal-800 text-white shadow-teal-800/20'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isInCart ? 'Added to Cart (Add Another)' : 'Add to Order'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Description & Clinical Information */}
          <div className="space-y-4 pt-2 border-t border-slate-100 text-xs">
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Clinical Indications & Use</h4>
              <p className="text-slate-600 leading-relaxed">{medicine.description}</p>
            </div>

            <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-100">
              <h4 className="font-bold text-teal-900 text-xs mb-1 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-teal-700" />
                Recommended Dosage Regimen
              </h4>
              <p className="text-teal-800 leading-relaxed">{medicine.dosage}</p>
            </div>

            {medicine.prescriptionRequired && (
              <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-200">
                <h4 className="font-bold text-rose-900 text-xs mb-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1.5 text-rose-600" />
                  Prescription Rule Notice
                </h4>
                <p className="text-rose-800 text-[11px] leading-relaxed">
                  As this is a prescription medication, a Nigerian doctor&apos;s prescription is verified prior to fulfillment. If you do not have an active upload, our clinical pharmacist will hold a mandatory ₦500 teleconference to review and confirm safe administration.
                </p>
              </div>
            )}

            <div>
              <h4 className="font-bold text-slate-900 mb-1">Known Common Side Effects</h4>
              <div className="flex flex-wrap gap-1.5">
                {medicine.sideEffects.map((effect, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px]">
                    {effect}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
