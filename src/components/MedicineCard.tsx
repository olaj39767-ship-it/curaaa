import React from 'react';
import { Plus, Minus, ShieldAlert, Check, Eye } from 'lucide-react';
import { Medicine } from '../types';
import { formatNaira } from '../data/mockData';

interface MedicineCardProps {
  medicine: Medicine;
  onAddToCart: (medicine: Medicine) => void;
  onViewDetails: (medicine: Medicine) => void;
  isItemInCart?: boolean;
  cartQuantity?: number;
  onUpdateQuantity?: (medicineId: string, delta: number) => void;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  onAddToCart,
  onViewDetails,
  isItemInCart = false,
  cartQuantity = 0,
  onUpdateQuantity
}) => {
  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-teal-400 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
      
      {/* Top badges */}
      <div className="p-3 sm:p-4 pb-0">
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <span className="text-[10px] sm:text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md truncate max-w-[65%]">
            {medicine.category.split('&')[0].trim()}
          </span>
          {medicine.prescriptionRequired ? (
            <span className="flex items-center text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 shrink-0" title="Prescription Required (₦500 teleconference fee applies)">
              <ShieldAlert className="w-3 h-3 mr-0.5 sm:mr-1 text-rose-600" />
              Rx
            </span>
          ) : (
            <span className="text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              OTC
            </span>
          )}
        </div>

        {/* Image Container with tap to view */}
        <div 
          onClick={() => onViewDetails(medicine)}
          className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-slate-100 cursor-pointer"
        >
          <img
            src={medicine.image}
            alt={medicine.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-slate-900/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none sm:pointer-events-auto">
            <span className="bg-white/95 text-slate-800 text-[11px] font-bold py-1 px-2.5 rounded-full flex items-center shadow-xs">
              <Eye className="w-3 h-3 mr-1 text-teal-600" />
              Details
            </span>
          </div>
          {medicine.popular && (
            <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md shadow-xs">
              Fast-moving
            </span>
          )}
        </div>

        {/* Info */}
        <div className="pt-2 sm:pt-3">
          <p className="text-[11px] text-slate-400 font-medium truncate">{medicine.brand} • {medicine.unit}</p>
          <h3 
            onClick={() => onViewDetails(medicine)}
            className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 group-hover:text-teal-700 transition-colors line-clamp-1 cursor-pointer leading-snug"
          >
            {medicine.name}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
            {medicine.genericName}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-mono truncate">
            NAFDAC: {medicine.nafdacNo}
          </p>
        </div>
      </div>

      {/* Footer / Price & Add Actions */}
      <div className="p-3 sm:p-4 pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 block leading-none">Price</span>
          <span className="text-sm sm:text-base font-extrabold text-slate-900 font-display truncate block">
            {formatNaira(medicine.price)}
          </span>
        </div>

        {/* Add or Quantity Stepper */}
        {isItemInCart && onUpdateQuantity ? (
          <div className="flex items-center space-x-1 bg-teal-50 border border-teal-200 rounded-xl p-0.5">
            <button
              onClick={() => onUpdateQuantity(medicine.id, -1)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-teal-800 flex items-center justify-center hover:bg-teal-100 active:scale-95 transition-transform cursor-pointer shadow-xs"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center font-bold text-xs text-teal-900 font-mono">
              {cartQuantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(medicine.id, 1)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 active:scale-95 transition-transform cursor-pointer shadow-xs"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onAddToCart(medicine)}
            className="min-h-[38px] px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 bg-teal-600 hover:bg-teal-700 text-white shadow-xs active:scale-95"
            aria-label={`Add ${medicine.name} to cart`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        )}
      </div>
    </div>
  );
};
