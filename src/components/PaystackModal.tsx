import React, { useState } from 'react';
import { Shield, Lock, CreditCard, Building2, Smartphone, CheckCircle, X, Loader2, ArrowRight } from 'lucide-react';
import { formatNaira } from '../data/mockData';

interface PaystackModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  customerEmail: string;
  customerName: string;
  onSuccess: (paymentReference: string) => void;
  title?: string;
  purpose?: string;
}

export const PaystackModal: React.FC<PaystackModalProps> = ({
  isOpen,
  onClose,
  amount,
  customerEmail,
  customerName,
  onSuccess,
  title = 'Curadeck Healthcare',
  purpose = 'Medication Order & Pharmacist Service'
}) => {
  const [activeChannel, setActiveChannel] = useState<'card' | 'transfer' | 'ussd'>('card');
  const [cardNumber, setCardNumber] = useState('5399 4100 8821 9042');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('419');
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
  const [paymentRef, setPaymentRef] = useState('');

  if (!isOpen) return null;

  const handlePay = () => {
    setIsProcessing(true);
    setStep('processing');
    const generatedRef = 'pstk_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString().slice(-4);
    setPaymentRef(generatedRef);

    setTimeout(() => {
      setIsProcessing(false);
      setStep('success');
      setTimeout(() => {
        onSuccess(generatedRef);
      }, 1400);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Paystack Styled Header */}
        <div className="bg-[#0ba4db] p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-sm">
              P
            </div>
            <div>
              <p className="text-xs font-semibold text-white/90 flex items-center">
                <Lock className="w-3 h-3 mr-1" /> Secured by Paystack
              </p>
              <h3 className="text-sm font-bold text-white">{title}</h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isProcessing}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount & Customer details */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">{customerEmail}</p>
            <p className="text-xs font-medium text-slate-700">{purpose}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Due</p>
            <p className="text-xl font-extrabold text-slate-900 font-display">
              {formatNaira(amount)}
            </p>
          </div>
        </div>

        {step === 'processing' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-teal-50 border-2 border-teal-500 border-t-transparent animate-spin flex items-center justify-center text-teal-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Processing Payment...</h4>
              <p className="text-xs text-slate-500 mt-1">
                Communicating with your Nigerian banking network. Please do not close this window.
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-10 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-lg">Payment Confirmed!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Ref: {paymentRef}
              </p>
              <p className="text-xs text-emerald-700 font-medium mt-2 bg-emerald-50 py-1 px-3 rounded-full inline-block">
                Order sent to Curadeck Central Pharmacy Hub
              </p>
            </div>
          </div>
        )}

        {step === 'input' && (
          <div className="p-6 space-y-5">
            {/* Channel Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveChannel('card')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  activeChannel === 'card' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
              <button
                onClick={() => setActiveChannel('transfer')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  activeChannel === 'transfer' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Bank Transfer</span>
              </button>
              <button
                onClick={() => setActiveChannel('ussd')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  activeChannel === 'ussd' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>USSD</span>
              </button>
            </div>

            {/* Card Form */}
            {activeChannel === 'card' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CARD NUMBER</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full text-sm font-mono tracking-wider p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    placeholder="5399 4100 0000 0000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">EXPIRY</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full text-sm font-mono p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      maxLength={4}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full text-sm font-mono p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500"
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                  <Shield className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Supports Mastercard, Visa, Verve, & Apple Pay</span>
                </div>

                <button
                  onClick={handlePay}
                  className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Pay {formatNaira(amount)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Bank Transfer View */}
            {activeChannel === 'transfer' && (
              <div className="space-y-4">
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                  <p className="font-semibold">Instant Virtual Account Created</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Transfer exactly <strong>{formatNaira(amount)}</strong> to the account below. Your order will be confirmed automatically within 30 seconds.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Bank Name</span>
                    <span className="font-bold text-slate-800">Wema Bank / Titan Trust</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Account Number</span>
                    <span className="font-mono font-bold text-teal-700 text-sm tracking-wide">0192 849 104</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Account Name</span>
                    <span className="font-bold text-slate-800">Curadeck / Paystack Checkout</span>
                  </div>
                </div>

                <button
                  onClick={handlePay}
                  className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>I Have Sent {formatNaira(amount)}</span>
                </button>
              </div>
            )}

            {/* USSD View */}
            {activeChannel === 'ussd' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600">Select your bank to generate the quick USSD code:</p>
                <div className="grid grid-cols-2 gap-2">
                  {['GTBank (*737#)', 'Zenith (*966#)', 'Access (*901#)', 'UBA (*919#)'].map((b) => (
                    <div key={b} className="p-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:border-teal-400 hover:bg-teal-50 cursor-pointer text-center">
                      {b}
                    </div>
                  ))}
                </div>

                <div className="bg-teal-50 p-3 rounded-xl text-center">
                  <p className="text-slate-500 text-[11px]">Dial on your phone:</p>
                  <p className="text-base font-mono font-bold text-teal-800 my-1">*737*50*0192849#</p>
                </div>

                <button
                  onClick={handlePay}
                  className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                >
                  Confirm USSD Payment ({formatNaira(amount)})
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-50 px-6 py-2.5 border-t border-slate-100 text-center text-[10px] text-slate-400">
          Curadeck is a registered healthcare provider. Transactions protected by 256-bit SSL encryption.
        </div>
      </div>
    </div>
  );
};
