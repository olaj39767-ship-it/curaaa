import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  ShieldCheck, 
  FileCheck2, 
  MessageSquare, 
  Sparkles, 
  User, 
  CheckCircle2, 
  Clock,
  Send
} from 'lucide-react';
import { QuoteRequest } from '../types';

interface TeleconferenceRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: QuoteRequest | null;
  onClearPrescription: (quoteId: string) => void;
  isPharmacistUser?: boolean;
}

export const TeleconferenceRoomModal: React.FC<TeleconferenceRoomModalProps> = ({
  isOpen,
  onClose,
  quote,
  onClearPrescription,
  isPharmacistUser = false
}) => {
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [callDuration, setCallDuration] = useState(14);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'Pharm. Dr. Idris Danjuma', text: 'Good day! I have reviewed your uploaded prescription for Augmentin and Amlodipine. Have you taken these before?', time: 'Just now' },
    { sender: 'You', text: 'Yes, this is my routine refill for blood pressure, plus the antibiotic prescribed at the clinic today.', time: 'Just now' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !quote) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { sender: 'You', text: inputMessage, time: 'Just now' }
    ]);
    setInputMessage('');
    
    // Pharmacist simulated response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { 
          sender: 'Pharm. Dr. Idris Danjuma', 
          text: 'Understood. Ensure you take Augmentin with food to prevent GI upset. I am clearing your prescription for immediate dispensing and dispatch now.',
          time: 'Just now'
        }
      ]);
    }, 1200);
  };

  const handleApproveAndEnd = () => {
    setIsClearing(true);
    setTimeout(() => {
      setIsClearing(false);
      onClearPrescription(quote.id);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl max-w-4xl w-full h-[90vh] max-h-[720px] flex flex-col overflow-hidden border border-slate-700">
        
        {/* Call Top Bar */}
        <div className="bg-slate-950/90 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-emerald-950/80 border border-emerald-700/60 px-2.5 py-1 rounded-full text-xs text-emerald-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Encrypted Pharmacist Teleconference</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Duration: {formatTimer(callDuration)}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Ref: {quote.referenceNo}</span>
            <span className="bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded-md font-mono text-[10px]">
              ₦500 Consultation Cleared
            </span>
          </div>
        </div>

        {/* Video & Consultation Screen */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 min-h-0 bg-slate-900">
          
          {/* Main Video Tile: The Pharmacist */}
          <div className="lg:col-span-2 flex flex-col gap-3 h-full">
            <div className="relative flex-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              {/* Doctor Video Feed */}
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=900&auto=format&fit=crop&q=80"
                alt="Pharmacist on video"
                className="w-full h-full object-cover object-top"
              />

              {/* Status Badge in Video */}
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <div>
                  <p className="text-xs font-bold text-white leading-tight">
                    {quote.assignedPharmacist?.name || 'Pharm. Dr. Idris Danjuma (FPSN)'}
                  </p>
                  <p className="text-[10px] text-teal-300 leading-tight">
                    Clinical Pharmacist • PCN #48910
                  </p>
                </div>
              </div>

              {/* Patient Self-View PiP */}
              <div className="absolute bottom-4 right-4 w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden bg-slate-800 border-2 border-teal-500/80 shadow-lg">
                {videoActive ? (
                  <img
                    src="https://images.unsplash.com/photo-1594824813581-2292f7e7766b?w=400&auto=format&fit=crop&q=80"
                    alt="Patient self feed"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400 text-xs">
                    Camera Off
                  </div>
                )}
                <div className="absolute bottom-1 left-2 text-[10px] font-semibold bg-slate-950/70 px-1.5 rounded text-white">
                  You
                </div>
              </div>
            </div>

            {/* In-call Action Bar */}
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setMicActive(!micActive)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    micActive ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-500/20 text-rose-400 border border-rose-500'
                  }`}
                  title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setVideoActive(!videoActive)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    videoActive ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-500/20 text-rose-400 border border-rose-500'
                  }`}
                  title={videoActive ? 'Turn off camera' : 'Turn on camera'}
                >
                  {videoActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
              </div>

              {/* Clearance button */}
              <button
                onClick={handleApproveAndEnd}
                disabled={isClearing}
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 cursor-pointer transition-all"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>
                  {isClearing ? 'Signing PCN Clearance...' : 'Complete & Approve Prescription'}
                </span>
              </button>

              <button
                onClick={onClose}
                className="p-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors"
                title="End Consultation"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Panel: Prescription Checklist & Live Pharmacist Chat */}
          <div className="flex flex-col h-full bg-slate-950/70 rounded-2xl border border-slate-800 overflow-hidden">
            
            {/* Tab/Header */}
            <div className="p-3 border-b border-slate-800 bg-slate-950">
              <h4 className="text-xs font-bold text-white flex items-center">
                <FileCheck2 className="w-4 h-4 mr-1.5 text-teal-400" />
                Prescription Clearance Checklist
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Pharmacists Council of Nigeria protocol check
              </p>
            </div>

            {/* Prescribed Items Under Review */}
            <div className="p-3 bg-slate-900/50 border-b border-slate-800 space-y-1.5 text-xs max-h-36 overflow-y-auto">
              {quote.itemsQuoted.length > 0 ? (
                quote.itemsQuoted.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-800/60">
                    <div>
                      <span className="font-semibold text-slate-200">{item.name}</span>
                      <span className="text-[10px] text-slate-400 block">{item.dosage}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      Verified
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-2 text-[11px] text-slate-400">
                  Checking handwritten text items: &quot;Augmentin 1g, Paracetamol, Amlodipine&quot;
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-3 space-y-2.5 overflow-y-auto text-xs min-h-36">
              {chatMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`p-2 rounded-xl text-[11px] ${
                    msg.sender === 'You'
                      ? 'bg-teal-700/80 text-white ml-6 rounded-tr-xs'
                      : 'bg-slate-800 text-slate-200 mr-6 rounded-tl-xs border border-slate-700'
                  }`}
                >
                  <p className="text-[9px] font-bold text-slate-400 mb-0.5">{msg.sender}</p>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-800 bg-slate-950 flex items-center space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask pharmacist a question..."
                className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
