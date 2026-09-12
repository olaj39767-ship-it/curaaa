import React from 'react';
import { Pill, ShieldCheck, Phone, Mail, MapPin, Award, CheckCircle2, Lock } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Trust Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800/80">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-800/50 flex items-center justify-center text-teal-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">PCN Licensed</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Supervised by registered clinical pharmacists under Pharmacists Council of Nigeria regulations.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-800/50 flex items-center justify-center text-teal-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">100% Genuine NAFDAC Drugs</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Direct procurement from licensed Nigerian manufacturers & authorized importers. Zero counterfeits.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-800/50 flex items-center justify-center text-teal-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">30-120 Min Fast Quotes</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Upload any handwritten hospital drug list or prescription for immediate pricing and pharmacist check.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-800/50 flex items-center justify-center text-teal-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Secured by Paystack</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                PCI-DSS Level 1 compliant card processing, direct instant bank transfers, and USSD.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Company Info */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 py-12 border-b border-slate-800/80">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 shadow-md">
                <Pill className="w-5 h-5 -rotate-45" />
              </div>
              <span className="text-2xl font-black text-white font-display tracking-tight">
                Cura<span className="text-teal-400">deck</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Nigeria&apos;s trusted digital healthcare and medication fulfillment infrastructure. Delivering fixed-price drugs, prescription tele-verification, and verified care nurses to your doorstep.
            </p>
            
            <div className="pt-2 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Headquarters: Plot 12B, Admiralty Way, Lekki Phase 1, Lagos, Nigeria</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Support: +234 800 CURADECK (0800 287 2332) / +234 803 456 7890</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <span>care@curadeck.ng • pharmacy@curadeck.ng</span>
              </div>
            </div>
          </div>

          {/* Quick Services */}
          <div>
            <h5 className="text-white font-bold text-sm mb-4 tracking-wide uppercase text-[11px] text-teal-400">
              Healthcare Services
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => setActiveTab('market')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Direct Medication Market Floor
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('upload-quote')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Upload Custom Drug List (Quote)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('consultations')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Pharmacist & Doctor Telehealth
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('care-nurses')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Hire Vetted Care Nurse (Elderly/Home)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('orders')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Track Dispatched Medication
                </button>
              </li>
            </ul>
          </div>

          {/* Specialty Categories */}
          <div>
            <h5 className="text-white font-bold text-sm mb-4 tracking-wide uppercase text-[11px] text-teal-400">
              Chronic & Specialty Care
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li><span className="text-slate-400">Sickle Cell Disease Care Program</span></li>
              <li><span className="text-slate-400">Hypertension & Cardiac Refills</span></li>
              <li><span className="text-slate-400">Diabetes Blood Sugar Management</span></li>
              <li><span className="text-slate-400">Maternal & Neonatal Support</span></li>
              <li><span className="text-slate-400">Cold-Chain Insulin & Biologics</span></li>
            </ul>
          </div>

          {/* Legal & Regulatory */}
          <div>
            <h5 className="text-white font-bold text-sm mb-4 tracking-wide uppercase text-[11px] text-teal-400">
              Compliance & Safety
            </h5>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <p className="font-semibold text-slate-200">Regulatory Declaration</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Operating in strict compliance with the Pharmacists Council of Nigeria (PCN) Act and National Agency for Food and Drug Administration and Control (NAFDAC).
                </p>
              </div>
              <p className="text-[11px] text-slate-500">
                *Prescription drugs strictly require a valid Nigerian medical prescription and our mandatory ₦500 teleconference consultation before dispensing.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Curadeck Nigeria Technologies Ltd. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span>Privacy Policy</span>
            <span>Terms of Dispensing</span>
            <span>PCN License #PCN/LA/2023/8892</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
