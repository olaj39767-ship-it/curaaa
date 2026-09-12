import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Video, 
  Lock, 
  ArrowRight, 
  Eye, 
  Sparkles,
  Paperclip,
  Check,
  Send,
  Trash2,
  FileCheck,
  RefreshCw,
  PhoneCall
} from 'lucide-react';
import { QuoteRequest, User } from '../types';
import { formatNaira, NIGERIAN_STATES } from '../data/mockData';

interface UploadQuoteViewProps {
  quotes: QuoteRequest[];
  onSubmitNewQuote: (newQuote: Omit<QuoteRequest, 'id' | 'referenceNo' | 'createdAt'>) => void;
  onOpenTeleconference: (quote: QuoteRequest) => void;
  onPayTeleconference: (quote: QuoteRequest) => void;
  onPayQuoteFull: (quote: QuoteRequest) => void;
  currentUser: User | null;
}

export const UploadQuoteView: React.FC<UploadQuoteViewProps> = ({
  quotes,
  onSubmitNewQuote,
  onOpenTeleconference,
  onPayTeleconference,
  onPayQuoteFull,
  currentUser
}) => {
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'text'>('image');
  const [textList, setTextList] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [deliveryState, setDeliveryState] = useState<string>(currentUser?.state || 'Lagos State');
  const [deliveryCity, setDeliveryCity] = useState<string>(currentUser?.city || 'Lekki Phase 1');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(currentUser?.address || 'Admiralty Way, Lekki');
  const [patientName, setPatientName] = useState<string>(currentUser?.name || '');
  const [patientPhone, setPatientPhone] = useState<string>(currentUser?.phone || '');
  const [patientEmail, setPatientEmail] = useState<string>(currentUser?.email || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter selected quote for detail view
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(quotes[0]?.id || '');

  const activeQuote = quotes.find(q => q.id === selectedQuoteId) || quotes[0];

  // Prescription detection helper for typed text or sample file
  const prescriptionKeywords = ['augmentin', 'amoxicillin', 'amlodipine', 'metformin', 'glucophage', 'ciprotab', 'ciprofloxacin', 'ventolin', 'salbutamol', 'hydroxyurea', 'tramadol', 'codeine', 'antibiotic', 'antihypertensive'];
  
  const textContainsPrescription = prescriptionKeywords.some(keyword => 
    (textList + ' ' + notes + ' ' + fileName).toLowerCase().includes(keyword)
  );

  const handlePreFillPrescriptionSample = () => {
    setUploadMode('text');
    setTextList('1. Augmentin 1000mg tabs - 1 tab bd x 7 days\n2. Amlodipine 10mg - 1 tab daily in morning (refill)\n3. Paracetamol 500mg - 2 tabs prn\n4. Multivitamin syrup - 1 bottle');
    setNotes('Prescribed by Dr. Balogun at Lagos Island General Hospital for acute sinusitis and hypertension checkup.');
    setFileName('General_Hospital_Prescription_Slip.jpg');
    setFileType('image');
  };

  const handlePreFillOTCSample = () => {
    setUploadMode('text');
    setTextList('1. Coartem 80/480mg (6s) - 1 pack\n2. Panadol Extra 24s - 2 packs\n3. Vitamin C 1000mg Effervescent - 1 tube');
    setNotes('Routine malaria treatment and pain relief.');
    setFileName('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileType(file.type.includes('pdf') ? 'pdf' : 'image');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadMode === 'file' && !fileName && !textList) {
      alert('Please select a file or enter your medication list.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const isRx = textContainsPrescription || uploadMode === 'file'; // uploaded prescriptions default to pharmacist safety audit
      
      onSubmitNewQuote({
        patientName,
        patientPhone,
        patientEmail,
        deliveryState,
        deliveryCity,
        deliveryAddress,
        notes,
        fileName: fileName || (uploadMode === 'text' ? 'Text_Drug_List.txt' : 'Hospital_Prescription_Upload.jpg'),
        fileType,
        rawText: textList,
        itemsQuoted: [],
        subtotal: 0,
        teleconferenceFee: isRx ? 500 : 0,
        deliveryFee: deliveryState.includes('Lagos') ? 1500 : 2500,
        total: 0,
        status: 'reviewing',
        containsPrescription: isRx,
        pharmacistTeleconferenceRequired: isRx,
        teleconferencePaid: false,
        teleconferenceCompleted: false,
        estimatedQuoteTimeMinutes: 30,
      });

      setIsSubmitting(false);
      // Reset form
      setTextList('');
      setFileName('');
      setNotes('');
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="max-w-3xl relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 bg-teal-800/80 border border-teal-600/50 px-3 py-1 rounded-full text-xs font-semibold text-teal-200">
            <Clock className="w-3.5 h-3.5 text-teal-300" />
            <span>Guaranteed 30 to 120 Minutes Quote Turnaround</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-white">
            Custom Drug List & Prescription Pricing
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed max-w-2xl">
            Upload any hospital prescription slip, handwritten clinic note, or typed medication list. Our registered clinical pharmacists inspect stock availability, itemize wholesale pricing, and verify safety.
          </p>

          {/* Prescription Rule Highlight */}
          <div className="bg-teal-950/80 border border-teal-500/40 p-3.5 rounded-2xl flex items-start space-x-3 text-xs max-w-2xl mt-4">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-teal-100">
              <span className="font-bold text-white">Mandatory Prescription Rule:</span>
              <p className="mt-0.5 leading-relaxed">
                If your uploaded list contains any prescription-only medication, you must pay a <strong>₦500 teleconference fee</strong> with a licensed pharmacist before dispensing to comply with Nigerian PCN regulations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Form on Left, Active Quotes Tracker on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Upload / Request Form */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 font-display">
                Submit New Drug List
              </h2>
              <p className="text-xs text-slate-500">Provide prescription image or type drug names</p>
            </div>

            {/* Quick Demo Pre-Fill Button for Reviewers */}
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handlePreFillPrescriptionSample}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 cursor-pointer"
                title="Loads Augmentin + Amlodipine to demonstrate the ₦500 Rx rule"
              >
                + Demo Rx List
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Upload Mode Selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl font-bold">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  uploadMode === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Image / PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('text')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  uploadMode === 'text' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Type Drug List</span>
              </button>
            </div>

            {/* File Upload Drop Area */}
            {uploadMode === 'file' && (
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">PRESCRIPTION FILE</label>
                <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center bg-slate-50 hover:bg-teal-50/30 transition-all block">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-2">
                    <Paperclip className="w-6 h-6" />
                  </div>
                  {fileName ? (
                    <div className="space-y-1">
                      <p className="font-bold text-teal-800 text-xs">{fileName}</p>
                      <p className="text-[11px] text-slate-500">File attached. Click to replace.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 text-xs">
                        Drag & Drop or Click to Upload Prescription
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Supports camera photos (JPG, PNG), Doctor PDF notes up to 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            )}

            {/* Text Input Area */}
            {uploadMode === 'text' && (
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">ENTER DRUG NAMES & DOSAGES</label>
                <textarea
                  rows={4}
                  value={textList}
                  onChange={(e) => setTextList(e.target.value)}
                  placeholder="e.g.&#10;1. Augmentin 1g - 14 tabs&#10;2. Amlodipine 10mg - 28 tabs&#10;3. Paracetamol 500mg - 1 pack"
                  className="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>
            )}

            {/* Real-time prescription detection indicator */}
            {textContainsPrescription && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start space-x-2 text-amber-900 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Prescription Medication Detected:</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Your list contains clinical drugs (e.g. antibiotics/cardiac drugs). A <strong>₦500 teleconference fee</strong> with a clinical pharmacist will be included in the quote.
                  </p>
                </div>
              </div>
            )}

            {/* Special Instructions / Notes */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">NOTES FOR THE PHARMACIST</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention allergies (e.g. Penicillin allergy), brand preference, or urgent delivery timeline..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Patient & Delivery Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">PATIENT NAME</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PHONE (FOR SMS/CALL QUOTE)</label>
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">STATE</label>
                <select
                  value={deliveryState}
                  onChange={(e) => setDeliveryState(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                >
                  {NIGERIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">DELIVERY ADDRESS</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Admiralty Way, Lekki"
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Transmitting to Clinical Pharmacist...' : 'Submit Drug List for 30-Min Quote'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Track Incoming Quotes & Teleconference Hub */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 font-display flex items-center">
              <span>Your Active Quotes</span>
              <span className="ml-2 text-xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                {quotes.length}
              </span>
            </h2>
            <span className="text-xs text-slate-500">Live Status Tracker</span>
          </div>

          {/* Quotes Selector Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {quotes.map((q) => (
              <button
                key={q.id}
                onClick={() => setSelectedQuoteId(q.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center space-x-2 border transition-all cursor-pointer ${
                  selectedQuoteId === q.id
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{q.referenceNo}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  q.status === 'pharmacist_approved' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : q.status === 'quote_ready'
                    ? 'bg-teal-100 text-teal-900'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {q.status === 'pharmacist_approved' ? 'Approved' : q.status === 'quote_ready' ? 'Ready' : 'Reviewing'}
                </span>
              </button>
            ))}
          </div>

          {/* Selected Quote Card View */}
          {activeQuote && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
              
              {/* Quote Top Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {activeQuote.referenceNo}
                    </span>
                    <span className="text-xs text-slate-400">• {activeQuote.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Delivery to: {activeQuote.deliveryAddress}, {activeQuote.deliveryState}
                  </p>
                </div>

                {/* Status Pill with Countdown */}
                <div className="text-right">
                  {activeQuote.status === 'reviewing' && (
                    <div className="flex items-center space-x-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full text-xs font-bold">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Pharmacist Reviewing (~{activeQuote.estimatedQuoteTimeMinutes}m)</span>
                    </div>
                  )}

                  {activeQuote.status === 'quote_ready' && (
                    <div className="flex items-center space-x-1.5 bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1.5 rounded-full text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Quote Ready for Review</span>
                    </div>
                  )}

                  {activeQuote.status === 'pharmacist_approved' && (
                    <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Prescription Cleared & Approved</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Uploaded Content Preview */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600 font-semibold">
                  <span>Uploaded Drug List / Source:</span>
                  <span className="font-mono text-teal-800">{activeQuote.fileName || 'Prescription Text'}</span>
                </div>
                {activeQuote.rawText && (
                  <pre className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-mono text-[11px] whitespace-pre-wrap">
                    {activeQuote.rawText}
                  </pre>
                )}
                {activeQuote.notes && (
                  <p className="text-[11px] text-slate-500 italic">
                    Note: &quot;{activeQuote.notes}&quot;
                  </p>
                )}
              </div>

              {/* Itemized Pricing breakdown from Pharmacist */}
              {activeQuote.itemsQuoted.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Itemized Pharmacist Pricing
                  </h4>

                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                    {activeQuote.itemsQuoted.map((item) => (
                      <div key={item.id} className="p-3 bg-white flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-900">{item.name}</span>
                            {item.isPrescription && (
                              <span className="text-[9px] font-bold px-1.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                Rx
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block">{item.dosage}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 font-mono">
                            {formatNaira(item.unitPrice * item.qty)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">Qty: {item.qty}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary math */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Medicines Subtotal</span>
                      <span className="font-semibold text-slate-900">{formatNaira(activeQuote.subtotal)}</span>
                    </div>

                    {activeQuote.containsPrescription && (
                      <div className="flex justify-between text-amber-800 font-medium">
                        <span className="flex items-center">
                          <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          Pharmacist Teleconference (Mandatory)
                        </span>
                        <span>{formatNaira(activeQuote.teleconferenceFee)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600">
                      <span>Cold-Chain Delivery</span>
                      <span className="font-semibold text-slate-900">{formatNaira(activeQuote.deliveryFee)}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                      <span className="font-black text-slate-900 text-sm">Total Quote</span>
                      <span className="text-xl font-black text-teal-800 font-display">
                        {formatNaira(activeQuote.total)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <Clock className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
                  <p className="font-bold text-slate-800 text-xs">
                    Pricing in Progress (~{activeQuote.estimatedQuoteTimeMinutes} Minutes Remaining)
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Our procurement team is verifying batch availability and calculating exact distributor pricing. You will receive an SMS when your quote is ready.
                  </p>
                </div>
              )}

              {/* Action Buttons: ₦500 Teleconference or Final Paystack Pay */}
              {activeQuote.itemsQuoted.length > 0 && (
                <div className="space-y-3 pt-2">
                  
                  {/* If prescription required and teleconference not yet completed */}
                  {activeQuote.containsPrescription && !activeQuote.teleconferenceCompleted && (
                    <div className="bg-gradient-to-r from-amber-50 to-teal-50 border border-amber-300 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start space-x-2.5">
                        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <h5 className="font-bold text-amber-950">Step 1: Pharmacist Teleconference Clearance</h5>
                          <p className="text-amber-800 text-[11px] mt-0.5">
                            Under PCN dispensing guidelines, you must hold a short teleconference with our registered pharmacist to verify allergies and safe dosing.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        {!activeQuote.teleconferencePaid ? (
                          <button
                            onClick={() => onPayTeleconference(activeQuote)}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Pay ₦500 Teleconference Fee (Paystack)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenTeleconference(activeQuote)}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-700/20 flex items-center justify-center space-x-2 cursor-pointer animate-pulse"
                          >
                            <Video className="w-4 h-4" />
                            <span>Join Video Call with Pharmacist (Paid ₦500)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* If cleared or OTC, allow full payment */}
                  {(activeQuote.teleconferenceCompleted || !activeQuote.containsPrescription) && (
                    <div className="space-y-2">
                      {activeQuote.teleconferenceCompleted && (
                        <div className="flex items-center space-x-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Prescription cleared by <strong>{activeQuote.assignedPharmacist?.name || 'Pharm. Dr. Idris'}</strong>
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => onPayQuoteFull(activeQuote)}
                        className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/25 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Pay Total {formatNaira(activeQuote.total)} via Paystack & Dispatch</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
