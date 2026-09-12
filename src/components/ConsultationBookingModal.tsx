import React, { useState } from 'react';
import { X, Calendar, Clock, Video, MessageSquare, Phone, CheckCircle, ShieldCheck, User } from 'lucide-react';
import { ConsultationSpecialist, User as UserType } from '../types';
import { formatNaira } from '../data/mockData';

interface ConsultationBookingModalProps {
  specialist: ConsultationSpecialist | null;
  onClose: () => void;
  onBookSuccess: (bookingDetails: {
    specialist: ConsultationSpecialist;
    slot: string;
    channel: 'video' | 'voice' | 'chat';
    reason: string;
    fee: number;
  }) => void;
  currentUser: UserType | null;
}

export const ConsultationBookingModal: React.FC<ConsultationBookingModalProps> = ({
  specialist,
  onClose,
  onBookSuccess,
  currentUser
}) => {
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [channel, setChannel] = useState<'video' | 'voice' | 'chat'>('video');
  const [symptoms, setSymptoms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!specialist) return null;

  const currentSlot = selectedSlot || specialist.availableSlots[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onBookSuccess({
        specialist,
        slot: currentSlot,
        channel,
        reason: symptoms || 'Routine medical/pharmacotherapy checkup',
        fee: specialist.sessionPrice
      });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={specialist.avatar}
              alt={specialist.name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-teal-400/50"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-900 text-teal-300 border border-teal-700">
                  {specialist.type}
                </span>
                <span className="text-[10px] text-slate-400">
                  License: {specialist.pcnOrMdcNo}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">{specialist.name}</h3>
              <p className="text-xs text-teal-300">{specialist.qualification}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Channel Choice */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">CONSULTATION MODE</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('video')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  channel === 'video'
                    ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Video className="w-4 h-4 text-teal-600" />
                <span>HD Video Call</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('voice')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  channel === 'voice'
                    ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Phone className="w-4 h-4 text-teal-600" />
                <span>Audio Call</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('chat')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  channel === 'chat'
                    ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-teal-600" />
                <span>Live Chat & Rx</span>
              </button>
            </div>
          </div>

          {/* Time Slot Picker */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">SELECT AVAILABLE APPOINTMENT TIME</label>
            <div className="grid grid-cols-2 gap-2">
              {specialist.availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 text-xs font-semibold transition-all cursor-pointer ${
                    currentSlot === slot
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{slot}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Health Concern / Symptoms */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              REASON FOR CONSULTATION / MEDICAL CONCERN
            </label>
            <textarea
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. Uncontrolled blood pressure readings, malaria relapse, or prescription dosage review..."
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Patient Details Preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500">Patient</p>
              <p className="font-bold text-slate-800">{currentUser.name}</p>
              <p className="text-[11px] text-slate-500">{currentUser.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-500">Session Fee</p>
              <p className="text-base font-extrabold text-teal-800 font-display">
                {formatNaira(specialist.sessionPrice)}
              </p>
            </div>
          </div>

          {/* Guarantee */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>End-to-end encrypted consultation. Instant digital prescription issued.</span>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Proceed to Pay {formatNaira(specialist.sessionPrice)} via Paystack</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
