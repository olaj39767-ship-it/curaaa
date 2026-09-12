import React, { useState } from 'react';
import { 
  HeartHandshake, 
  ShieldCheck, 
  Star, 
  MapPin, 
  Clock, 
  UserCheck, 
  Activity, 
  Heart, 
  CheckCircle2, 
  PhoneCall, 
  Filter 
} from 'lucide-react';
import { CareNurse } from '../types';
import { CARE_NURSES, formatNaira } from '../data/mockData';

interface CareNursesViewProps {
  onSelectNurse: (nurse: CareNurse) => void;
}

export const CareNursesView: React.FC<CareNursesViewProps> = ({
  onSelectNurse
}) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');

  const specialtiesList = [
    'All',
    'Elderly Care & Companionship',
    'Stroke Rehabilitation & Vitals',
    'Sickle Cell Crisis Home Management',
    'Maternal Postpartum Care'
  ];

  const filteredNurses = CARE_NURSES.filter((nurse) => {
    const matchesSpecialty = 
      selectedSpecialty === 'All' || 
      nurse.specialties.some(s => s.toLowerCase().includes(selectedSpecialty.toLowerCase()));

    const matchesLocation = 
      selectedLocation === 'All' ||
      nurse.location.toLowerCase().includes(selectedLocation.toLowerCase());

    return matchesSpecialty && matchesLocation;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="max-w-3xl relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 bg-teal-800/80 border border-teal-600/50 px-3 py-1 rounded-full text-xs font-semibold text-teal-200">
            <HeartHandshake className="w-3.5 h-3.5 text-teal-300" />
            <span>Vetted Registered Nurses (RN / RM) for Home Care</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-white">
            Hire Certified Home Care Nurses in Nigeria
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
            Ensure your aging parents or loved ones convalescing from surgery, stroke, or sickle cell crises receive compassionate, professional clinical nursing at home. All nurses are background-checked with active Nursing and Midwifery Council of Nigeria (NMCN) licenses.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-xs text-teal-200">
            <span className="flex items-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mr-1.5" />
              100% Criminal & Credential Vetted
            </span>
            <span className="flex items-center">
              <Activity className="w-4 h-4 text-emerald-400 mr-1.5" />
              BP, Sugar & Medication Monitoring
            </span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 text-emerald-400 mr-1.5" />
              Day, Night, or 24/7 Live-in Shifts
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {specialtiesList.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedSpecialty === spec
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0 text-xs">
          <span className="text-slate-500 font-medium">Location:</span>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700"
          >
            <option value="All">All Locations</option>
            <option value="Lagos">Lagos State</option>
            <option value="Abuja">Abuja FCT</option>
          </select>
        </div>
      </div>

      {/* Nurses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredNurses.map((nurse) => (
          <div
            key={nurse.id}
            className="bg-white rounded-3xl border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all p-6 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-4">
              
              {/* Header: Photo, Verified Seal, Rating */}
              <div className="flex items-start space-x-4">
                <img
                  src={nurse.avatar}
                  alt={nurse.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-500/30 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center">
                      <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                      NMCN Verified
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      License #{nurse.pcnLicenseNo}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {nurse.name}
                  </h3>
                  <p className="text-xs text-teal-700 font-medium">
                    {nurse.qualification}
                  </p>

                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                    <div className="flex items-center text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                      {nurse.rating}
                    </div>
                    <span>•</span>
                    <span>{nurse.reviewsCount} Care Assignments</span>
                    <span>•</span>
                    <span>{nurse.yearsExperience} Yrs Exp</span>
                  </div>
                </div>
              </div>

              {/* Location & Availability */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 mr-1" />
                  {nurse.location}
                </span>
                <span className="flex items-center text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-semibold text-[11px]">
                  <Clock className="w-3 h-3 mr-1" />
                  Availability: {nurse.availability}
                </span>
              </div>

              {/* Bio summary */}
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {nurse.bio}
              </p>

              {/* Specialties chips */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                  CLINICAL SPECIALTIES
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {nurse.specialties.map((spec, i) => (
                    <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Rates & Booking Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block leading-none">Standard Shift Rate</span>
                <span className="text-lg font-black text-slate-900 font-display">
                  {formatNaira(nurse.dailyRate)} <span className="text-xs font-normal text-slate-500">/ day</span>
                </span>
                <span className="text-[10px] text-teal-700 block font-medium">
                  Live-in: {formatNaira(nurse.liveInRate)} / week
                </span>
              </div>

              <button
                onClick={() => onSelectNurse(nurse)}
                className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Book Care Nurse</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Trust & Safety Policy Strip */}
      <div className="bg-slate-900 text-slate-300 rounded-2xl p-6 border border-slate-800 space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center">
          <ShieldCheck className="w-4 h-4 mr-2 text-teal-400" />
          Curadeck Caregiver Protection & Quality Assurance Framework
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <div>
            <span className="font-bold text-slate-200 block">Strict Identity Verification</span>
            <p className="mt-0.5">National Identification Number (NIN), hospital references, and police character certificates are verified in person.</p>
          </div>
          <div>
            <span className="font-bold text-slate-200 block">Escrow Protected Payments</span>
            <p className="mt-0.5">Payments are held safely by Paystack and disbursed only upon daily confirmation of nursing attendance.</p>
          </div>
          <div>
            <span className="font-bold text-slate-200 block">Clinical Supervisor Check-ins</span>
            <p className="mt-0.5">Our medical operations lead conducts weekly check-ins with families to review vitals logs and medication compliance.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
