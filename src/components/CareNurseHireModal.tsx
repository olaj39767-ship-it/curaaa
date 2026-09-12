import React, { useState } from 'react';
import { X, Calendar, MapPin, Heart, ShieldCheck, Clock, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { CareNurse, User } from '../types';
import { formatNaira, NIGERIAN_STATES } from '../data/mockData';

interface CareNurseHireModalProps {
  nurse: CareNurse | null;
  onClose: () => void;
  onHireSuccess: (bookingDetails: {
    nurse: CareNurse;
    shiftType: string;
    daysCount: number;
    startDate: string;
    patientCondition: string;
    locationState: string;
    locationAddress: string;
    totalAmount: number;
  }) => void;
  currentUser: User | null;
}

export const CareNurseHireModal: React.FC<CareNurseHireModalProps> = ({
  nurse,
  onClose,
  onHireSuccess,
  currentUser
}) => {
  const [shiftType, setShiftType] = useState<'day' | 'night' | 'liveIn'>('day');
  const [durationDays, setDurationDays] = useState<number>(3);
  const [startDate, setStartDate] = useState<string>('Tomorrow Morning (8:00 AM)');
  const [patientCondition, setPatientCondition] = useState<string>('Elderly Care & Vitals Monitoring');
  const [locationState, setLocationState] = useState<string>(currentUser?.state || 'Lagos State');
  const [locationAddress, setLocationAddress] = useState<string>(currentUser?.address || 'Admiralty Way, Lekki Phase 1');

  if (!nurse) return null;

  // Rate calculation
  let ratePerUnit = nurse.dailyRate;
  if (shiftType === 'night') {
    ratePerUnit = Math.round(nurse.dailyRate * 1.15); // Night differential
  } else if (shiftType === 'liveIn') {
    ratePerUnit = Math.round(nurse.liveInRate / 7); // Live-in daily rate equivalent
  }

  const subtotal = ratePerUnit * durationDays;
  const adminAndKitFee = 3500; // Clinical nurse kit & PPE
  const totalAmount = subtotal + adminAndKitFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onHireSuccess({
      nurse,
      shiftType: shiftType === 'day' ? 'Day Shift (8am - 5pm)' : shiftType === 'night' ? 'Night Shift (7pm - 7am)' : '24/7 Live-in Care',
      daysCount: durationDays,
      startDate,
      patientCondition,
      locationState,
      locationAddress,
      totalAmount
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">
        
        {/* Header */}
        <div className="bg-teal-900 text-white p-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <img
              src={nurse.avatar}
              alt={nurse.name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-teal-300"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-800 text-teal-200 border border-teal-700">
                  {nurse.qualification}
                </span>
                <span className="text-[10px] text-teal-300 flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Verified License #{nurse.pcnLicenseNo}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">{nurse.name}</h3>
              <p className="text-xs text-teal-200">{nurse.yearsExperience} Years Clinical Nursing Experience</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-teal-200 hover:text-white p-1 rounded-lg hover:bg-teal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          
          {/* Shift Type Selection */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">SELECT NURSING CARE ARRANGEMENT</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setShiftType('day')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  shiftType === 'day'
                    ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span className="font-bold text-xs">Day Shift</span>
                </div>
                <p className="text-[10px] text-slate-500">8:00 AM – 5:00 PM</p>
                <p className="text-xs font-bold text-teal-800 mt-1">{formatNaira(nurse.dailyRate)}/day</p>
              </button>

              <button
                type="button"
                onClick={() => setShiftType('night')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  shiftType === 'night'
                    ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span className="font-bold text-xs">Night Shift</span>
                </div>
                <p className="text-[10px] text-slate-500">7:00 PM – 7:00 AM</p>
                <p className="text-xs font-bold text-teal-800 mt-1">{formatNaira(Math.round(nurse.dailyRate * 1.15))}/night</p>
              </button>

              <button
                type="button"
                onClick={() => setShiftType('liveIn')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  shiftType === 'liveIn'
                    ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <Heart className="w-3.5 h-3.5 text-teal-600" />
                  <span className="font-bold text-xs">24/7 Live-in</span>
                </div>
                <p className="text-[10px] text-slate-500">Continuous Support</p>
                <p className="text-xs font-bold text-teal-800 mt-1">{formatNaira(nurse.liveInRate)}/wk</p>
              </button>
            </div>
          </div>

          {/* Duration in Days */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-bold text-slate-800">CARE DURATION</label>
              <span className="font-bold text-teal-700 text-xs">{durationDays} Days</span>
            </div>
            <div className="flex items-center space-x-2">
              {[1, 3, 7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDurationDays(days)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                    durationDays === days
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {days === 30 ? '1 Month' : `${days} Days`}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Condition / Needs */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">PRIMARY HEALTH CONDITION / FOCUS</label>
            <select
              value={patientCondition}
              onChange={(e) => setPatientCondition(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-xs"
            >
              <option value="Elderly Care & Vitals Monitoring">Elderly Care & Vitals (BP, Blood Glucose)</option>
              <option value="Sickle Cell Disease Care & Pain Crisis Mitigation">Sickle Cell Disease Care & Pain Crisis Management</option>
              <option value="Stroke Recovery & Mobility Support">Stroke Recovery, Range of Motion & Feeding</option>
              <option value="Post-Surgical Wound Dressing & Drain Care">Post-Surgical Wound Dressing & Drain Management</option>
              <option value="Medication Administration (Injections, IV Infusion)">Medication Administration (IV Cannula & Injections)</option>
              <option value="Maternal Postnatal & Newborn Care">Maternal Postnatal & Newborn Assistance</option>
            </select>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">STATE</label>
              <select
                value={locationState}
                onChange={(e) => setLocationState(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
              >
                {NIGERIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">RESIDENCE ADDRESS</label>
              <input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="e.g. Lekki Phase 1, Lagos"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                required
              />
            </div>
          </div>

          {/* Pricing breakdown */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Nurse Fee ({durationDays} days @ {formatNaira(ratePerUnit)}/day)</span>
              <span className="font-semibold text-slate-900">{formatNaira(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Standard PPE & Vitals Diagnostic Kit</span>
              <span className="font-semibold text-slate-900">{formatNaira(adminAndKitFee)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <div>
                <span className="font-bold text-slate-900 text-sm">Total Care Escrow</span>
                <span className="block text-[10px] text-slate-500">Funds released only after care delivery verified</span>
              </div>
              <span className="text-xl font-extrabold text-teal-800 font-display">
                {formatNaira(totalAmount)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Book & Secure with Paystack ({formatNaira(totalAmount)})</span>
          </button>
        </form>
      </div>
    </div>
  );
};
