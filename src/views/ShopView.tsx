import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  Pill, 
  SlidersHorizontal, 
  AlertCircle, 
  Check, 
  Sparkles,
  ArrowUpDown,
  ShoppingBag
} from 'lucide-react';
import { Medicine, Category } from '../types';
import { MEDICINES } from '../data/mockData';
import { MedicineCard } from '../components/MedicineCard';

interface ShopViewProps {
  onSelectMedicine: (medicine: Medicine) => void;
  onAddToCart: (medicine: Medicine) => void;
  cartItemIds: string[];
  onOpenUploadQuote: () => void;
}

const CATEGORIES: Category[] = [
  'All',
  'Malaria & Fevers',
  'Infections & Antibiotics',
  'Hypertension & Cardiac',
  'Diabetes & Metabolic',
  'Pain & Anti-inflammatory',
  'Sickle Cell & Blood Support',
  'Maternal & Child Health',
  'Vitamins & Immunity',
  'Gastrointestinal & Ulcer'
];

export const ShopView: React.FC<ShopViewProps> = ({
  onSelectMedicine,
  onAddToCart,
  cartItemIds,
  onOpenUploadQuote
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [filterRx, setFilterRx] = useState<'all' | 'otc' | 'rx'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const filteredMedicines = useMemo(() => {
    return MEDICINES.filter((med) => {
      const matchesSearch = 
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.description.toLowerCase().includes(searchQuery.toLowerCase());

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header with Search & Prescription Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-0.5 rounded-md">
              Fixed-Price Inventory
            </span>
            <span className="text-xs text-slate-400">• NAFDAC Certified</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display mt-1">
            Browse Authentic Medications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Standard Nigerian retail prices. Dispatched directly from our climate-controlled central pharmacy hub.
          </p>
        </div>

        {/* Cannot find drug CTA banner */}
        <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs max-w-md">
          <div>
            <p className="font-bold text-teal-950">Can&apos;t find a specific medication?</p>
            <p className="text-[11px] text-teal-700">Upload your doctor&apos;s prescription slip for a 30-min quote.</p>
          </div>
          <button
            onClick={onOpenUploadQuote}
            className="px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
          >
            Upload List
          </button>
        </div>
      </div>

      {/* Search Bar & Primary Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by drug name (e.g. Coartem, Augmentin, Metformin, Hydroxyurea)..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"
              >
                Clear
              </button>
            )}
          </div>

          {/* Rx vs OTC Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl text-xs font-semibold shrink-0">
            <button
              onClick={() => setFilterRx('all')}
              className={`px-3 py-2 rounded-xl cursor-pointer transition-all ${
                filterRx === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterRx('otc')}
              className={`px-3 py-2 rounded-xl cursor-pointer transition-all ${
                filterRx === 'otc' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              OTC Only
            </button>
            <button
              onClick={() => setFilterRx('rx')}
              className={`px-3 py-2 rounded-xl cursor-pointer transition-all ${
                filterRx === 'rx' ? 'bg-white text-rose-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prescription (Rx)
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-semibold py-3 px-3 rounded-2xl border border-slate-200 bg-white text-slate-700 cursor-pointer shadow-xs focus:outline-none"
              >
                <option value="featured">Featured & Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Pills Carousel */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === cat
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Medicines */}
      {filteredMedicines.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMedicines.map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              onAddToCart={onAddToCart}
              onViewDetails={onSelectMedicine}
              isItemInCart={cartItemIds.includes(medicine.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto">
            <Pill className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">No medications match your filter</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              We stock over 2,500 medications through our distributor network. You can request any unlisted medication via our quote tool.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setFilterRx('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              onClick={onOpenUploadQuote}
              className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold cursor-pointer shadow-xs"
            >
              Request Custom Quote
            </button>
          </div>
        </div>
      )}

      {/* PCN & NAFDAC Assurance Footer Strip */}
      <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Every order is inspected by a registered pharmacist before departure. Hologram tamper-sealed.</span>
        </div>
        <span className="text-[11px] text-teal-400 font-medium">Pharmacists Council of Nigeria Regulated</span>
      </div>
    </div>
  );
};
