import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UploadCloud, 
  ShieldCheck, 
  ShieldAlert, 
  SlidersHorizontal, 
  Pill, 
  Video, 
  HeartHandshake, 
  Clock, 
  ArrowRight, 
  Check, 
  Sparkles,
  MapPin,
  FileText,
  Filter,
  X,
  Camera
} from 'lucide-react';
import { Medicine, Category, CartItem } from '../types';
import { MEDICINES } from '../data/mockData';
import { MedicineCard } from '../components/MedicineCard';

interface MarketFloorViewProps {
  onSelectMedicine: (medicine: Medicine) => void;
  onAddToCart: (medicine: Medicine) => void;
  onUpdateQuantity: (medicineId: string, delta: number) => void;
  cartItems: CartItem[];
  onOpenUploadQuote: () => void;
  onOpenConsultations: () => void;
  onOpenNurses: () => void;
  onOpenCart: () => void;
  medicines?: Medicine[];
}

const CATEGORIES: { name: Category; count: number }[] = [
  { name: 'All', count: 24 },
  { name: 'Malaria & Fevers', count: 3 },
  { name: 'Infections & Antibiotics', count: 3 },
  { name: 'Hypertension & Cardiac', count: 2 },
  { name: 'Diabetes & Metabolic', count: 2 },
  { name: 'Pain & Anti-inflammatory', count: 2 },
  { name: 'Sickle Cell & Blood Support', count: 2 },
  { name: 'Maternal & Child Health', count: 2 },
  { name: 'Vitamins & Immunity', count: 2 },
  { name: 'Gastrointestinal & Ulcer', count: 2 }
];

export const MarketFloorView: React.FC<MarketFloorViewProps> = ({
  onSelectMedicine,
  onAddToCart,
  onUpdateQuantity,
  cartItems,
  onOpenUploadQuote,
  onOpenConsultations,
  onOpenNurses,
  onOpenCart,
  medicines
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [filterRx, setFilterRx] = useState<'all' | 'otc' | 'rx'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc'>('popular');

  const activeCatalog = medicines && medicines.length > 0 ? medicines : MEDICINES;

  const cartMap = useMemo(() => {
    const map = new Map<string, number>();
    cartItems.forEach(item => map.set(item.medicine.id, item.quantity));
    return map;
  }, [cartItems]);

  const filteredMedicines = useMemo(() => {
    return activeCatalog.filter((med) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !query ||
        med.name.toLowerCase().includes(query) ||
        med.genericName.toLowerCase().includes(query) ||
        med.brand.toLowerCase().includes(query) ||
        med.description.toLowerCase().includes(query) ||
        med.category.toLowerCase().includes(query);

      const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;

      const matchesRx = 
        filterRx === 'all' ? true : 
        filterRx === 'rx' ? med.prescriptionRequired : 
        !med.prescriptionRequired;

      return matchesSearch && matchesCategory && matchesRx;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
    });
  }, [searchQuery, selectedCategory, filterRx, sortBy]);

  const hasRxInCart = cartItems.some(item => item.medicine.prescriptionRequired);

  return (
    <div className="pb-28 lg:pb-16 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4 space-y-4">
      
      {/* Mobile Top Delivery & Trust Strip */}
      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200/80 shadow-xs text-xs">
        <div className="flex items-center space-x-1.5 text-slate-700 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="text-[11px] text-slate-500 font-medium">Deliver to:</span>
          <span className="font-bold text-slate-900 truncate">Lekki & Lagos Mainland</span>
        </div>
        <div className="flex items-center space-x-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold shrink-0">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>PCN Certified</span>
        </div>
      </div>

      {/* Main Search Bar (Sticky-friendly on mobile) */}
      <div className="relative">
        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search 2,500+ authentic medicines (e.g. Coartem, Augmentin, Hydroxyurea)..."
          className="w-full pl-10 sm:pl-11 pr-9 py-3 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs placeholder:text-slate-400"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Action Floor Tiles (Mobile-first shortcut cards) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        
        {/* Tile 1: Upload Drug List / Custom Quote (Hero Action) */}
        <button
          onClick={onOpenUploadQuote}
          className="p-3 rounded-2xl bg-gradient-to-br from-teal-900 to-teal-950 text-white text-left transition-all hover:scale-[1.01] active:scale-98 shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-pointer border border-teal-800"
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold bg-teal-400 text-teal-950 px-1.5 py-0.5 rounded font-mono">
              30m
            </span>
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-white text-[11px] sm:text-xs leading-tight">
              Upload Drug List
            </h4>
            <p className="text-[9px] sm:text-[10px] text-teal-200/80 mt-0.5 leading-snug line-clamp-1">
              Custom doctor slip quote
            </p>
          </div>
        </button>

        {/* Tile 2: Consult Specialist / Pharmacist */}
        <button
          onClick={onOpenConsultations}
          className="p-3 rounded-2xl bg-white border border-slate-200 text-left transition-all hover:border-teal-400 active:scale-98 shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Live
            </span>
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-slate-900 text-[11px] sm:text-xs leading-tight">
              Consult Doctor
            </h4>
            <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 leading-snug line-clamp-1">
              Telehealth from ₦2,500
            </p>
          </div>
        </button>

        {/* Tile 3: Care Nurse */}
        <button
          onClick={onOpenNurses}
          className="p-3 rounded-2xl bg-white border border-slate-200 text-left transition-all hover:border-teal-400 active:scale-98 shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              RN
            </span>
          </div>
          <div className="mt-2">
            <h4 className="font-bold text-slate-900 text-[11px] sm:text-xs leading-tight">
              Hire Care Nurse
            </h4>
            <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 leading-snug line-clamp-1">
              Elderly & sickle cell care
            </p>
          </div>
        </button>
      </div>

      {/* Mandatory Prescription Rule Callout Banner */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 flex items-start space-x-2.5 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-bold text-amber-950">PCN Prescription Protocol:</span> Orders containing prescription drugs (marked <span className="font-bold text-rose-700">Rx</span>) include a mandatory <strong>₦500 teleconference</strong> with a licensed pharmacist before dispatch to ensure clinical safety.
        </div>
      </div>

      {/* Filter and Category Bar */}
      <div className="space-y-2.5 pt-1">
        
        {/* Category horizontal scrolling tabs with badge counts */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{cat.name}</span>
                {cat.name === 'All' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sub-filters: Rx Toggle & Sort */}
        <div className="flex items-center justify-between gap-2 pt-1">
          
          {/* Rx Filter Chips */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-semibold">
            <button
              onClick={() => setFilterRx('all')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                filterRx === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilterRx('otc')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                filterRx === 'otc' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-500'
              }`}
            >
              OTC
            </button>
            <button
              onClick={() => setFilterRx('rx')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                filterRx === 'rx' ? 'bg-white text-rose-800 shadow-xs font-bold' : 'text-slate-500'
              }`}
            >
              Rx Only
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <span className="hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold py-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="popular">Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Count indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-0.5">
        <span>Showing {filteredMedicines.length} verified medications</span>
        <button
          onClick={onOpenUploadQuote}
          className="text-teal-700 font-semibold hover:underline flex items-center text-[11px]"
        >
          <span>Can&apos;t find drug? Request quote</span>
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>

      {/* Main Medication Grid: 2 columns on Mobile, 3 on Tablet, 4 on Desktop */}
      {filteredMedicines.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
          {filteredMedicines.map((medicine) => {
            const qty = cartMap.get(medicine.id) || 0;
            return (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                onAddToCart={onAddToCart}
                onViewDetails={onSelectMedicine}
                isItemInCart={qty > 0}
                cartQuantity={qty}
                onUpdateQuantity={onUpdateQuantity}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <Pill className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No exact match in standard catalog</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Our procurement network stocks over 2,500 medications through certified distributors. Upload your prescription slip for a 30-min price quote.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setFilterRx('all');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              onClick={onOpenUploadQuote}
              className="px-4 py-1.5 rounded-xl bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Get Custom Quote
            </button>
          </div>
        </div>
      )}

      {/* Bottom Floating Cart Bar for Mobile when cart has items */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-4 duration-200">
          <div 
            onClick={onOpenCart}
            className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-teal-500/40 flex items-center justify-between cursor-pointer hover:bg-slate-850 active:scale-98 transition-all backdrop-blur-md"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </div>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">
                  View Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                </span>
                <span className="text-[11px] text-teal-300 font-mono">
                  Total: ₦{cartItems.reduce((acc, i) => acc + (i.medicine.price * i.quantity), 0).toLocaleString()}
                  {hasRxInCart && ' + ₦500 Rx Fee'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
              <span>Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
