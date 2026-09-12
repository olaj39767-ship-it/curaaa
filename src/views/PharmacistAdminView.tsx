import React, { useState } from 'react';
import { 
  Stethoscope, 
  Clock, 
  ShieldCheck, 
  FileCheck, 
  DollarSign, 
  Video, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Send,
  User,
  Activity,
  ArrowRight
} from 'lucide-react';
import { QuoteRequest, QuotedItem } from '../types';
import { formatNaira } from '../data/mockData';

interface PharmacistAdminViewProps {
  quotes: QuoteRequest[];
  onUpdateQuote: (quote: QuoteRequest) => void;
  onOpenTeleconference: (quote: QuoteRequest) => void;
}

export const PharmacistAdminView: React.FC<PharmacistAdminViewProps> = ({
  quotes,
  onUpdateQuote,
  onOpenTeleconference
}) => {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(quotes[0]?.id || '');
  const [newItemName, setNewItemName] = useState('');
  const [newItemDosage, setNewItemDosage] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(3500);
  const [newItemIsRx, setNewItemIsRx] = useState(true);

  const activeQuote = quotes.find(q => q.id === selectedQuoteId) || quotes[0];

  const handleAddItemToQuote = () => {
    if (!newItemName.trim() || !activeQuote) return;

    const newItem: QuotedItem = {
      id: 'qi_' + Date.now(),
      name: newItemName,
      dosage: newItemDosage || 'As directed',
      qty: Number(newItemQty),
      unitPrice: Number(newItemPrice),
      available: true,
      isPrescription: newItemIsRx,
    };

    const updatedItems = [...activeQuote.itemsQuoted, newItem];
    const newSubtotal = updatedItems.reduce((acc, i) => acc + (i.unitPrice * i.qty), 0);
    const hasRx = updatedItems.some(i => i.isPrescription);
    const newTeleFee = hasRx ? 500 : 0;
    const newTotal = newSubtotal + newTeleFee + activeQuote.deliveryFee;

    const updated: QuoteRequest = {
      ...activeQuote,
      itemsQuoted: updatedItems,
      subtotal: newSubtotal,
      containsPrescription: hasRx,
      pharmacistTeleconferenceRequired: hasRx,
      teleconferenceFee: newTeleFee,
      total: newTotal,
      status: 'quote_ready',
    };

    onUpdateQuote(updated);
    setNewItemName('');
    setNewItemDosage('');
  };

  const handleRemoveItem = (itemId: string) => {
    if (!activeQuote) return;
    const updatedItems = activeQuote.itemsQuoted.filter(i => i.id !== itemId);
    const newSubtotal = updatedItems.reduce((acc, i) => acc + (i.unitPrice * i.qty), 0);
    const hasRx = updatedItems.some(i => i.isPrescription);
    const newTeleFee = hasRx ? 500 : 0;
    const newTotal = newSubtotal + newTeleFee + activeQuote.deliveryFee;

    onUpdateQuote({
      ...activeQuote,
      itemsQuoted: updatedItems,
      subtotal: newSubtotal,
      containsPrescription: hasRx,
      pharmacistTeleconferenceRequired: hasRx,
      teleconferenceFee: newTeleFee,
      total: newTotal,
    });
  };

  const handleSetStatus = (status: QuoteRequest['status']) => {
    if (!activeQuote) return;
    onUpdateQuote({
      ...activeQuote,
      status,
      teleconferenceCompleted: status === 'pharmacist_approved' ? true : activeQuote.teleconferenceCompleted
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-900 text-indigo-300 border border-indigo-700">
                CLINICAL PORTAL
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Supervising Pharmacist: Pharm. Emeka Eze (FPSN)
              </span>
            </div>
            <h1 className="text-2xl font-black font-display text-white mt-1">
              Prescription Quote Management Console
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Review handwritten prescriptions, price inventory from central hub, and conduct ₦500 teleconferences.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-4 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block">Pending Quotes</span>
            <span className="text-xl font-bold text-amber-400">{quotes.filter(q => q.status === 'reviewing').length}</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block">Rx Verifications</span>
            <span className="text-xl font-bold text-emerald-400">98.4%</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Incoming Queue on Left, Pricing Editor on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Queue of Quotes */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            INCOMING QUOTE REQUESTS ({quotes.length})
          </h3>

          <div className="space-y-2">
            {quotes.map((q) => (
              <div
                key={q.id}
                onClick={() => setSelectedQuoteId(q.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeQuote?.id === q.id
                    ? 'bg-indigo-50/70 border-indigo-500 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900">{q.referenceNo}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    q.status === 'reviewing' ? 'bg-amber-100 text-amber-900' :
                    q.status === 'quote_ready' ? 'bg-teal-100 text-teal-900' :
                    'bg-emerald-100 text-emerald-900'
                  }`}>
                    {q.status}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-800 mt-1">{q.patientName}</p>
                <p className="text-[11px] text-slate-500 truncate">{q.deliveryAddress}, {q.deliveryState}</p>
                
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{q.createdAt}</span>
                  {q.itemsQuoted.length > 0 && (
                    <span className="font-bold text-slate-800">{formatNaira(q.total)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Working Quote Workspace */}
        {activeQuote && (
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
            
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="font-mono font-bold text-slate-900 text-base">
                  {activeQuote.referenceNo}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: <strong>{activeQuote.patientName}</strong> • Phone: {activeQuote.patientPhone}
                </p>
              </div>

              {/* Status Controller */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500">Status:</span>
                <select
                  value={activeQuote.status}
                  onChange={(e) => handleSetStatus(e.target.value as any)}
                  className="text-xs font-bold p-2 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="reviewing">In Review (Calculating)</option>
                  <option value="quote_ready">Quote Ready (Sent to Patient)</option>
                  <option value="pharmacist_approved">Prescription Approved & Cleared</option>
                  <option value="paid">Paid & Dispatched</option>
                </select>
              </div>
            </div>

            {/* Patient Upload Preview */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700">Patient Upload / Submitted List:</span>
              {activeQuote.rawText && (
                <div className="p-3 rounded-xl bg-white border border-slate-200 font-mono text-slate-800 text-[11px] whitespace-pre-wrap">
                  {activeQuote.rawText}
                </div>
              )}
              {activeQuote.notes && (
                <p className="text-slate-600 italic">Patient Note: &quot;{activeQuote.notes}&quot;</p>
              )}
            </div>

            {/* Price Item Adder Form */}
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3 text-xs">
              <span className="font-bold text-indigo-950 flex items-center">
                <Plus className="w-4 h-4 mr-1 text-indigo-700" />
                Add Medication Item to Patient&apos;s Quote
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Drug name (e.g. Augmentin 1g)"
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={newItemDosage}
                    onChange={(e) => setNewItemDosage(e.target.value)}
                    placeholder="Dosage (e.g. 14 tabs)"
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    placeholder="Price in ₦"
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddItemToQuote}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isRxCheck"
                  checked={newItemIsRx}
                  onChange={(e) => setNewItemIsRx(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="isRxCheck" className="text-[11px] text-slate-700 font-medium">
                  Classify as Prescription-only Medication (Triggers ₦500 Teleconference Rule)
                </label>
              </div>
            </div>

            {/* Current Itemized Breakdown Table */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Quoted Items ({activeQuote.itemsQuoted.length})
              </h4>

              {activeQuote.itemsQuoted.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                  No items priced yet. Use the form above to add items from the patient&apos;s prescription.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  {activeQuote.itemsQuoted.map((item) => (
                    <div key={item.id} className="p-3 bg-white flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{item.name}</span>
                        <span className="text-[11px] text-slate-400 block">{item.dosage}</span>
                        {item.isPrescription && (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Prescription Rx
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="font-mono font-bold text-slate-900">{formatNaira(item.unitPrice * item.qty)}</span>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Math Summary */}
              {activeQuote.itemsQuoted.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatNaira(activeQuote.subtotal)}</span>
                  </div>
                  {activeQuote.containsPrescription && (
                    <div className="flex justify-between text-amber-800 font-medium">
                      <span>Mandatory Pharmacist Teleconference Fee</span>
                      <span>{formatNaira(activeQuote.teleconferenceFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee</span>
                    <span>{formatNaira(activeQuote.deliveryFee)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900">Total Quote</span>
                    <span className="text-base font-black text-indigo-900 font-display">
                      {formatNaira(activeQuote.total)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions: Teleconference & Dispatch Clearance */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onOpenTeleconference(activeQuote)}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Launch Patient Teleconference Consultation</span>
              </button>

              <button
                onClick={() => handleSetStatus('pharmacist_approved')}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Sign Off & Clear Prescription for Dispatch</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
