import React, { useState } from 'react';
import { 
  Video, 
  Star, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Award, 
  Languages, 
  Phone, 
  MessageSquare,
  CheckCircle2,
  Stethoscope,
  Filter
} from 'lucide-react';
import { ConsultationSpecialist } from '../types';
import { CONSULTATION_SPECIALISTS, formatNaira } from '../data/mockData';

interface ConsultationsViewProps {
  onSelectSpecialist: (specialist: ConsultationSpecialist) => void;
}

export const ConsultationsView: React.FC<ConsultationsViewProps> = ({
  onSelectSpecialist
}) => {
  const [selectedType, setSelectedType] = useState<string>('All');

  const filteredSpecialists = CONSULTATION_SPECIALISTS.filter(spec => 
    selectedType === 'All' ? true : spec.type === selectedType
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 bg-teal-800/80 border border-teal-600/50 px-3 py-1 rounded-full text-xs font-semibold text-teal-200">
            <Video className="w-3.5 h-3.5 text-teal-300" />
            <span>Encrypted Telehealth & Pharmacotherapy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-white">
            Consult Licensed Nigerian Specialists
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
            Speak directly with certified clinical pharmacists and medical doctors for prescription clearances, chronic illness management, drug interaction screening, and pediatric guidance.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-xs text-teal-200">
            <span className="flex items-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1.5" />
              MDCN & PCN Licensed Only
            </span>
            <span className="flex items-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1.5" />
              Direct Electronic Prescriptions Issued
            </span>
            <span className="flex items-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1.5" />
              Starting from {formatNaira(2500)}
            </span>
          </div>
        </div>
      </div>

      {/* Specialty Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {['All', 'Pharmacist', 'General Physician', 'Pediatrician'].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedType === type
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {type === 'All' ? 'All Specialists' : type}
          </button>
        ))}
      </div>

      {/* Specialists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSpecialists.map((specialist) => (
          <div
            key={specialist.id}
            className="bg-white rounded-3xl border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all p-6 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-4">
              
              {/* Top row: Avatar & Credentials */}
              <div className="flex items-start space-x-4">
                <img
                  src={specialist.avatar}
                  alt={specialist.name}
                  className="w-18 h-18 rounded-2xl object-cover border-2 border-teal-500/30 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      {specialist.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {specialist.pcnOrMdcNo}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1 truncate">
                    {specialist.name}
                  </h3>
                  <p className="text-xs text-teal-700 font-medium">
                    {specialist.specialty}
                  </p>
                  
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                    <div className="flex items-center text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                      {specialist.rating}
                    </div>
                    <span>•</span>
                    <span>{specialist.reviewsCount} Consultations</span>
                    <span>•</span>
                    <span>{specialist.experienceYears} Yrs Exp</span>
                  </div>
                </div>
              </div>

              {/* Bio & Clinical Focus */}
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {specialist.bio}
              </p>

              {/* Languages & Slots */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-1 text-slate-500">
                  <Languages className="w-3.5 h-3.5 text-teal-600 mr-1" />
                  <span>{specialist.languages.join(', ')}</span>
                </div>
                <div className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>Next Slot: {specialist.availableSlots[0]}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions & Fee */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block leading-none">Consultation Fee</span>
                <span className="text-lg font-black text-slate-900 font-display">
                  {formatNaira(specialist.sessionPrice)}
                </span>
              </div>

              <button
                onClick={() => onSelectSpecialist(specialist)}
                className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Book Teleconsult</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-1">
        <div className="flex items-center space-x-1.5 font-bold text-slate-800">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Telehealth Standard of Practice</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          All consultations are conducted over secure, end-to-end encrypted WebRTC audio/video streams. In emergency situations requiring immediate hospital admission, our clinicians directly coordinate with Lagos State EMS (112 / 767) and certified ambulance partners.
        </p>
      </div>
    </div>
  );
};
