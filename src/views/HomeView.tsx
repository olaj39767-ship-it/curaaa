import React, { useState } from 'react';
import { 
  Pill, 
  UploadCloud, 
  Clock, 
  ShieldCheck, 
  Video, 
  HeartHandshake, 
  ArrowRight, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  AlertCircle,
  Stethoscope,
  Activity,
  Award,
  ChevronRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { Medicine } from '../types';
import { MEDICINES, formatNaira } from '../data/mockData';

interface HomeViewProps {
  setActiveTab: (tab: string) => void;
  onSelectMedicine: (med: Medicine) => void;
  onAddToCart: (med: Medicine) => void;
  cartItemIds: string[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  setActiveTab,
  onSelectMedicine,
  onAddToCart,
  cartItemIds
}) => {
  const [heroSearchQuery, setHeroSearchQuery] = useState('');

  const featuredMeds = MEDICINES.slice(0, 4);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab('shop');
  };

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-950 via-slate-900 to-slate-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-teal-900/40">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-teal-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Trust Badge */}
              <div className="inline-flex items-center space-x-2 bg-teal-900/60 border border-teal-500/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-teal-300 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Licensed by Pharmacists Council of Nigeria (PCN)</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-white leading-[1.1]">
                Medication Procurement, <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-200 to-emerald-300">
                  Verified by Pharmacists.
                </span>
              </h1>

              {/* Value proposition paragraph */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
                Nigeria&apos;s digital healthcare gateway. Buy fixed-price authentic medications, upload custom doctor prescriptions for <strong>30-minute quotes</strong>, consult clinical pharmacists, and hire vetted home care nurses.
              </p>

              {/* Prescription Rule Highlight Box */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-teal-500/30 backdrop-blur-md max-w-xl flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-teal-300">Curadeck Prescription Protocol:</span>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">
                    Custom lists containing prescription medications include a mandatory <strong>₦500 teleconference</strong> with our licensed clinical pharmacist to review dosage and contraindications before dispatch.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
                <button
                  onClick={() => setActiveTab('upload-quote')}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center space-x-2.5 cursor-pointer group"
                >
                  <UploadCloud className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Upload Drug List (Get Quote)</span>
                  <span className="text-[10px] uppercase tracking-wider bg-slate-950/20 px-2 py-0.5 rounded font-mono">
                    30 Min
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('shop')}
                  className="px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Pill className="w-4 h-4 text-teal-400" />
                  <span>Browse Fixed-Price Catalog</span>
                </button>
              </div>

              {/* Nigerian Cities Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-teal-400 mr-1" />
                  Same-day delivery in Lagos (Lekki, Ikeja, Yaba) & Abuja FCT
                </span>
                <span>•</span>
                <span>Interstate cold-chain dispatch across all 36 states</span>
              </div>
            </div>

            {/* Right Card: Interactive Quote Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5 backdrop-blur-xl">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Live Quote Engine
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                    Average Response: 24 mins
                  </span>
                </div>

                {/* Upload drag drop teaser box */}
                <div 
                  onClick={() => setActiveTab('upload-quote')}
                  className="border-2 border-dashed border-teal-500/40 hover:border-teal-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-950/40 hover:bg-teal-950/20 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Have a handwritten hospital prescription?</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Take a picture or paste the drug names. Our pharmacists will source and quote the best prices.
                  </p>
                  <span className="mt-3 inline-flex items-center text-xs text-teal-300 font-semibold group-hover:text-teal-200">
                    Upload File or Type List <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>

                {/* Quick Service Cards Row */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => setActiveTab('consultations')}
                    className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-all cursor-pointer group"
                  >
                    <Video className="w-5 h-5 text-teal-400 mb-2 group-hover:scale-110 transition-transform" />
                    <h5 className="text-xs font-bold text-white">Doctor / Pharmacist</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">Teleconsult from ₦2,500</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('care-nurses')}
                    className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-all cursor-pointer group"
                  >
                    <HeartHandshake className="w-5 h-5 text-teal-400 mb-2 group-hover:scale-110 transition-transform" />
                    <h5 className="text-xs font-bold text-white">Hire Care Nurse</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">Vetted RNs for elderly care</p>
                  </button>
                </div>

                {/* Security footer */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
                  <span className="flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                    NAFDAC Inspected
                  </span>
                  <span>Paystack 256-bit SSL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Counters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center sm:text-left sm:border-r border-slate-100 sm:pr-4">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-display">18,500+</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Orders Dispensed</p>
          </div>
          <div className="text-center sm:text-left md:border-r border-slate-100 sm:pr-4">
            <p className="text-2xl sm:text-3xl font-black text-teal-700 font-display">30 Mins</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Average Quote Turnaround</p>
          </div>
          <div className="text-center sm:text-left sm:border-r border-slate-100 sm:pr-4">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-display">₦500</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Mandatory Teleconference Fee</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 font-display">100%</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">NAFDAC Reg Compliance</p>
          </div>
        </div>
      </section>

      {/* How Curadeck Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-teal-700 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full">
            Transparent Workflow
          </span>
          <h2 className="text-3xl font-black text-slate-900 font-display mt-3">
            How Curadeck Procurement Works
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Designed for convenience, safety, and strict regulatory compliance with Nigerian pharmaceutical law.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center font-display">
              01
            </div>
            <h3 className="font-bold text-slate-900 text-base">Select or Upload List</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Order directly from our fixed-price inventory or snap a photo of any handwritten clinic drug list.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center font-display">
              02
            </div>
            <h3 className="font-bold text-slate-900 text-base">Rapid Quote (30-120 mins)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our clinical pharmacists calculate itemized pricing from certified distributors and send you a transparent quote.
            </p>
          </div>

          <div className="bg-teal-50/70 p-6 rounded-2xl border border-teal-200 space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white font-black text-sm flex items-center justify-center font-display shadow-xs">
              03
            </div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-bold text-teal-950 text-base">₦500 Teleconference</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">Rx Rule</span>
            </div>
            <p className="text-xs text-teal-900 leading-relaxed">
              If prescription drugs are detected, a mandatory ₦500 teleconference with our registered pharmacist ensures clinical safety.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center font-display">
              04
            </div>
            <h3 className="font-bold text-slate-900 text-base">Cold-Chain Dispatch</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dispatched with tamper-evident holograms and thermal packs to your home or office in Lagos & nationwide.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Fixed-Price Medications */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-full">
              In-Stock Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display mt-2">
              Fixed-Price Daily Medications
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Standard-priced drugs verified by NAFDAC and ready for instant checkout.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('shop')}
            className="inline-flex items-center text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-4 py-2.5 rounded-xl transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>View All Medications</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredMeds.map((med) => {
            const inCart = cartItemIds.includes(med.id);
            return (
              <div 
                key={med.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-100 mb-3 cursor-pointer" onClick={() => onSelectMedicine(med)}>
                    <img src={med.image} alt={med.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                    {med.category}
                  </span>
                  <h4 
                    onClick={() => onSelectMedicine(med)}
                    className="font-bold text-slate-900 text-sm mt-1.5 hover:text-teal-700 cursor-pointer truncate"
                  >
                    {med.name}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{med.genericName}</p>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-base font-display">
                    {formatNaira(med.price)}
                  </span>
                  <button
                    onClick={() => onAddToCart(med)}
                    className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    {inCart ? 'In Cart' : '+ Add'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Specialty Programs (Sickle Cell & Chronic Diseases) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="text-xs font-bold text-teal-300 uppercase tracking-widest bg-teal-900/80 px-3 py-1 rounded-full border border-teal-700">
              Nigeria Chronic Care Focus
            </span>
            <h3 className="text-2xl sm:text-3xl font-black font-display text-white">
              Sickle Cell Warrior & Elderly Care Refill Support
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Never run out of essential hydroxyurea, folic acid, insulin, or blood pressure medication. We provide automated recurring delivery, specialist nurse visits for pain crisis management, and dedicated clinical pharmacist checks.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('care-nurses')}
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Hire Sickle Cell / Elderly Nurse
              </button>
              <button
                onClick={() => setActiveTab('upload-quote')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
              >
                Upload Refill Prescription
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Patient & Doctor Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl font-black text-slate-900 font-display">
            Trusted by Nigerian Families & Doctors
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real feedback from patients across Lagos, Abuja, and Port Harcourt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex text-amber-400 text-xs">★★★★★</div>
            <p className="text-xs text-slate-700 italic leading-relaxed">
              &quot;I uploaded a handwritten list from my mother&apos;s cardiologist in Ikeja. In 25 minutes, Curadeck had the entire quote with prices. The ₦500 teleconference with Pharm. Idris was thorough and caught a dosage overlap!&quot;
            </p>
            <div className="pt-2 border-t border-slate-100">
              <p className="font-bold text-slate-900 text-xs">Engr. Tunde Adeleke</p>
              <p className="text-[11px] text-slate-500">Ikeja GRA, Lagos</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex text-amber-400 text-xs">★★★★★</div>
            <p className="text-xs text-slate-700 italic leading-relaxed">
              &quot;Hiring Nurse Folake for my father who had a mild stroke in Lekki was seamless. She monitors his blood pressure daily and administers his insulin with so much care. Curadeck is a lifesaver.&quot;
            </p>
            <div className="pt-2 border-t border-slate-100">
              <p className="font-bold text-slate-900 text-xs">Mrs. Aisha Dantata</p>
              <p className="text-[11px] text-slate-500">Lekki Phase 1, Lagos</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex text-amber-400 text-xs">★★★★★</div>
            <p className="text-xs text-slate-700 italic leading-relaxed">
              &quot;Finding authentic Hydroxyurea for my sickle cell routine was always difficult before Curadeck. Knowing every batch is NAFDAC verified and sealed gives me total peace of mind.&quot;
            </p>
            <div className="pt-2 border-t border-slate-100">
              <p className="font-bold text-slate-900 text-xs">Chinedu Eze</p>
              <p className="text-[11px] text-slate-500">Wuse 2, Abuja FCT</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
