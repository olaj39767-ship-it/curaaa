import React, { useState, useEffect, useRef } from 'react';
import {
  Pill,
  Video,
  UploadCloud,
  Send,
  ShieldCheck,
  PhoneCall,
  HeartHandshake,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
  FileText,
  CheckCircle2,
  Stethoscope,
  User,
  Store,
  Warehouse,
} from 'lucide-react';
import { ChatBubble, ChatAction } from '../components/chat/ChatBubble';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { PrescriptionUploadCard } from '../components/chat/PrescriptionUploadCard';
import { Medicine } from '../types';

interface ChatLandingViewProps {
  onNavigateToMarket: () => void;
  onNavigateToConsultations: () => void;
  onNavigateToUploadQuote: () => void;
  onNavigateToNurses: () => void;
  medicines?: Medicine[];
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
  timestamp: string;
  action?: ChatAction | null;
  source?: 'gemini' | 'gemini-raw' | 'fallback' | 'system' | 'local';
}

type CustomerType = 'individual' | 'retailer' | 'wholesaler';

interface CustomerTypeOption {
  id: CustomerType;
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CUSTOMER_TYPE_OPTIONS: CustomerTypeOption[] = [
  { id: 'individual', label: "I'm a patient", detail: 'Order medicine or see a doctor', icon: User },
  { id: 'retailer', label: "I'm a retailer", detail: 'Pharmacy or store restocking', icon: Store },
  { id: 'wholesaler', label: "I'm a wholesaler", detail: 'Supplying or sourcing stock', icon: Warehouse },
];

const GREETINGS: Record<CustomerType, string> = {
  individual:
    'Hello! Welcome to Curadeck. 👋\n\nI can check real-time medication stock, help you upload a prescription slip for pharmacist review, or connect you with a licensed doctor.',
  retailer:
    "Hello! Welcome to Curadeck Wholesale. 👋\n\nI can check bulk stock availability, take your restock order list, and get you trade pricing for your pharmacy or store.",
  wholesaler:
    'Hello! Welcome to Curadeck Sourcing. 👋\n\nShare your available product or price list and our sourcing team will reach out if it fits our current supply needs.',
};

const SUGGESTED_PROMPTS: Record<CustomerType, string[]> = {
  individual: [
    'Is Coartem in stock?',
    'Check Augmentin 625mg stock',
    'Book a doctor teleconsultation',
    'Upload doctor prescription',
    'How fast is Lagos delivery?',
  ],
  retailer: [
    'Check bulk stock for Coartem',
    'Get trade pricing',
    'Upload my restock list',
    'Lagos wholesale delivery times',
  ],
  wholesaler: [
    'Upload my product list',
    'What are you currently sourcing?',
    'Share our pricing sheet',
    'Speak to the sourcing team',
  ],
};

const getQuickActions = (customerType: CustomerType) => {
  const all = [
    { id: 'buy' as const, label: 'Buy medicines', detail: '2,500+ items · Lagos in 2–4h', icon: Pill },
    { id: 'consult' as const, label: 'Book a doctor', detail: 'Video call · from ₦2,500', icon: Video },
    {
      id: 'upload' as const,
      label: customerType === 'individual' ? 'Upload prescription' : 'Upload prescription / list',
      detail: customerType === 'individual' ? 'Pharmacist review · 30 min' : 'Patients, retailers & wholesalers · 30 min',
      icon: UploadCloud,
    },
    { id: 'nurse' as const, label: 'Hire a care nurse', detail: 'Home visits · from ₦12,000', icon: HeartHandshake },
  ];

  // Retailers/wholesalers are here for bulk stock and list uploads first —
  // doctor consults and home-care nursing aren't relevant to that flow, so
  // put "upload" first and drop those two rather than clutter the grid.
  if (customerType !== 'individual') {
    return [all[0], all[2]];
  }
  return all;
};

export const ChatLandingView: React.FC<ChatLandingViewProps> = ({
  onNavigateToMarket,
  onNavigateToConsultations,
  onNavigateToUploadQuote,
  onNavigateToNurses,
  medicines = [],
}) => {
  const [customerType, setCustomerType] = useState<CustomerType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPrimaryOptions, setShowPrimaryOptions] = useState<boolean>(true);
  const [showUploadCard, setShowUploadCard] = useState<boolean>(false);
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(SUGGESTED_PROMPTS.individual);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Chat only starts once the person has told us what they are — this
  // replaces the old mount-triggered greeting.
  const handleSelectCustomerType = (type: CustomerType) => {
    setCustomerType(type);
    setSuggestedPrompts(SUGGESTED_PROMPTS[type]);
    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
      setMessages([
        {
          id: 'greeting-1',
          sender: 'bot',
          text: GREETINGS[type],
          timestamp: getTimestamp(),
          source: 'system',
        },
      ]);
    }, 500);
    return () => clearTimeout(timer);
  };

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom('smooth'), 40);
    return () => clearTimeout(timer);
  }, [messages, isTyping, showUploadCard, customerType]);

  // Keep the pinned input row above the on-screen keyboard on mobile by
  // scrolling it into view when the field gains focus (iOS/Android Safari
  // resize the viewport late, after the focus event, so a short delay helps).
  const handleInputFocus = () => {
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }, 250);
  };

  const handleActionClick = (actionType: 'BUY_MEDICINES' | 'BOOK_CONSULTATION' | 'UPLOAD_PRESCRIPTION' | 'CARE_NURSES') => {
    switch (actionType) {
      case 'BUY_MEDICINES':
        handleSelectBuyMedicines();
        break;
      case 'BOOK_CONSULTATION':
        handleSelectConsultation();
        break;
      case 'UPLOAD_PRESCRIPTION':
        handleSelectUploadPrescription();
        break;
      case 'CARE_NURSES':
        handleSelectCareNurses();
        break;
      default:
        onNavigateToMarket();
    }
  };

  const handleSelectBuyMedicines = () => {
    setMessages((prev) => [
      ...prev,
      { id: 'usr_' + Date.now(), sender: 'user', text: 'Buy medicines', timestamp: getTimestamp() },
    ]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_' + Date.now(),
          sender: 'bot',
          text: "Opening the Market Floor — 2,500+ NAFDAC-registered medications. Anything marked prescription-only will need a doctor's slip or pharmacist verification before it ships.",
          timestamp: getTimestamp(),
          source: 'system',
        },
      ]);
      setTimeout(() => onNavigateToMarket(), 650);
    }, 400);
  };

  const handleSelectConsultation = () => {
    setMessages((prev) => [
      ...prev,
      { id: 'usr_' + Date.now(), sender: 'user', text: 'Book a consultation', timestamp: getTimestamp() },
    ]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_' + Date.now(),
          sender: 'bot',
          text: 'Connecting you with an MDCN-registered doctor. Video sessions start at ₦2,500.',
          timestamp: getTimestamp(),
          source: 'system',
        },
      ]);
      setTimeout(() => onNavigateToConsultations(), 650);
    }, 400);
  };

  const handleSelectUploadPrescription = () => {
    const isB2B = customerType !== 'individual';
    setMessages((prev) => [
      ...prev,
      {
        id: 'usr_' + Date.now(),
        sender: 'user',
        text: isB2B ? 'Upload my list' : 'Upload prescription',
        timestamp: getTimestamp(),
      },
    ]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setShowUploadCard(true);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_' + Date.now(),
          sender: 'bot',
          text: isB2B
            ? 'Add your order or product list below — as a file or typed in — and our team will review it within 30 minutes.'
            : 'Add a photo of your prescription slip below, or type it in. A licensed pharmacist will verify it and send itemized pricing within 30 minutes.',
          timestamp: getTimestamp(),
          source: 'system',
        },
      ]);
    }, 400);
  };

  const handleSelectCareNurses = () => {
    setMessages((prev) => [
      ...prev,
      { id: 'usr_' + Date.now(), sender: 'user', text: 'Hire a care nurse', timestamp: getTimestamp() },
    ]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_' + Date.now(),
          sender: 'bot',
          text: 'Opening the Care Nurses directory — every nurse is a Registered Nurse accredited for in-home post-op and elderly care.',
          timestamp: getTimestamp(),
          source: 'system',
        },
      ]);
      setTimeout(() => onNavigateToNurses(), 650);
    }, 400);
  };

  const handleQuickAction = (id: 'buy' | 'consult' | 'upload' | 'nurse') => {
    if (id === 'buy') handleSelectBuyMedicines();
    if (id === 'consult') handleSelectConsultation();
    if (id === 'upload') handleSelectUploadPrescription();
    if (id === 'nurse') handleSelectCareNurses();
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    setInputValue('');
    setMessages((prev) => [...prev, { id: 'usr_' + Date.now(), sender: 'user', text, timestamp: getTimestamp() }]);
    setIsTyping(true);

    try {
      const historyPayload = messages
        .filter((m) => m.text && m.sender)
        .map((m) => ({ role: m.sender === 'user' ? ('user' as const) : ('model' as const), text: m.text || '' }));

      const inventoryPayload = (medicines || []).map((m) => ({
        id: m.id,
        name: m.name,
        genericName: m.genericName,
        category: m.category,
        price: m.price,
        inStock: m.inStock,
        stockCount: m.stockCount !== undefined ? m.stockCount : m.inStock ? 50 : 0,
        unit: m.unit,
        prescriptionRequired: m.prescriptionRequired,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          inventory: inventoryPayload,
          customerType: customerType || 'individual',
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setIsTyping(false);

      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_' + Date.now(),
          sender: 'bot',
          text: data.reply,
          timestamp: getTimestamp(),
          source: data.source || 'gemini',
          action: data.recommendedAction
            ? { type: data.recommendedAction, label: data.actionLabel || 'Proceed to service', detail: data.actionDetail || undefined }
            : null,
        },
      ]);

      if (Array.isArray(data.suggestedPrompts) && data.suggestedPrompts.length > 0) {
        setSuggestedPrompts(data.suggestedPrompts);
      }
    } catch (err) {
      console.warn('Chat API error:', err);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_' + Date.now(),
          sender: 'bot',
          text: 'I can help connect you with a licensed doctor, submit a prescription for pharmacist review, or find genuine, NAFDAC-approved medications. What would you like to do?',
          timestamp: getTimestamp(),
          source: 'fallback',
          action: { type: 'BOOK_CONSULTATION', label: 'Consult a licensed doctor', detail: 'Video session from ₦2,500' },
        },
      ]);
    }
  };

  const handleResetChat = () => {
    setShowUploadCard(false);
    setShowPrimaryOptions(true);
    setCustomerType(null);
    setMessages([]);
    setIsTyping(false);
    setSuggestedPrompts(SUGGESTED_PROMPTS.individual);
  };

  const quickActions = getQuickActions(customerType || 'individual');

  return (
    // Full-bleed, app-like on phones (edge-to-edge, real viewport height that
    // accounts for mobile browser chrome via `dvh`); reverts to the boxed
    // widget on tablet/desktop.
    <div className="w-full h-[100dvh] sm:h-auto sm:max-w-2xl sm:mx-auto sm:px-4 sm:py-2">
      <div className="w-full h-full sm:h-[680px] md:h-[720px] flex flex-col bg-white sm:rounded-2xl border-0 sm:border sm:border-[#E4DFD3] sm:shadow-sm overflow-hidden relative">
        {/* Top bar */}
        <div
          className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 bg-white border-b border-[#E4DFD3]"
          style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))', paddingBottom: '0.5rem' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0B5D52] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0B5D52]" />
            </span>
            <span className="font-bold text-[#16231F] text-[13px] truncate">Curadeck Concierge</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <a
              href="tel:+2348002872332"
              className="flex items-center justify-center gap-1 w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-lg text-[#0B5D52] bg-[#EAF3F0] active:bg-[#DDEDE7] transition-colors"
              aria-label="Call Curadeck support"
              title="Call support"
            >
              <PhoneCall className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline text-[11px] font-bold">0800-CURADECK</span>
            </a>
            <button
              onClick={() => setShowSafetyModal(true)}
              className="flex items-center justify-center gap-1 w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-lg text-[#8A6A1F] bg-[#FBF1DE] active:bg-[#F5E6C4] border border-[#EBD9A8] transition-colors"
              title="Licensing & compliance"
              aria-label="Licensing and compliance information"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline text-[11px] font-semibold">PCN #LA/8892</span>
            </button>
            <button
              onClick={handleResetChat}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-[#8A8175] active:text-[#16231F] active:bg-[#F0ECE2] transition-colors"
              title="Start a new conversation"
              aria-label="Reset conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {customerType === null ? (
          /* ---- Gate: find out who we're talking to before anything else ---- */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 bg-[#FBF9F4] text-center gap-6">
            <div className="space-y-1.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0B5D52] text-white flex items-center justify-center">
                <Pill className="w-6 h-6 -rotate-45" />
              </div>
              <h2 className="text-base font-bold text-[#16231F]">Welcome to Curadeck</h2>
              <p className="text-xs text-[#6B6157] max-w-xs">
                Quick question first, so I can point you in the right direction — which one are you?
              </p>
            </div>

            <div className="w-full max-w-sm space-y-2.5">
              {CUSTOMER_TYPE_OPTIONS.map(({ id, label, detail, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectCustomerType(id)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#E4DFD3] active:border-[#0B5D52]/50 active:bg-[#EAF3F0] text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#EAF3F0] text-[#0B5D52] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#16231F] text-[13px]">{label}</p>
                    <p className="text-[11px] text-[#6B6157]">{detail}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Scrollable chat container */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto min-h-0 bg-[#FBF9F4]"
              style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
            >
              {/* Quick actions */}
              <div className="sticky top-0 z-20 bg-[#FBF9F4] border-b border-[#E4DFD3] px-3 sm:px-4 py-2">
                <button
                  type="button"
                  onClick={() => setShowPrimaryOptions(!showPrimaryOptions)}
                  className="w-full flex items-center justify-between py-1 -my-1"
                >
                  <p className="text-[11px] font-bold text-[#6B6157]">Quick actions</p>
                  {showPrimaryOptions ? (
                    <ChevronUp className="w-4 h-4 text-[#6B6157]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#6B6157]" />
                  )}
                </button>

                {showPrimaryOptions && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {quickActions.map(({ id, label, detail, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleQuickAction(id)}
                        className="flex items-center gap-2 p-2.5 min-h-[52px] rounded-xl bg-white active:bg-[#EAF3F0] border border-[#E4DFD3] active:border-[#0B5D52]/40 text-left transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#EAF3F0] text-[#0B5D52] flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[#16231F] text-[12.5px] leading-snug truncate">{label}</p>
                          <p className="text-[10.5px] text-[#6B6157] truncate">{detail}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 sm:p-4 space-y-3.5">
                {/* Compact compliance notice — tap for full detail, instead of a
                    permanent paragraph competing with the conversation for space */}
                <button
                  type="button"
                  onClick={() => setShowSafetyModal(true)}
                  className="w-full flex items-start gap-2 p-2.5 bg-[#FBF1DE] border border-[#EBD9A8] rounded-xl text-left"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#8A6A1F] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#5C4415] leading-relaxed">
                    Concierge helps you navigate and check stock — it doesn't diagnose or advise on treatment.{' '}
                    <span className="font-bold underline underline-offset-2">Learn more</span>
                  </p>
                </button>

                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    sender={msg.sender}
                    message={msg.text}
                    timestamp={msg.timestamp}
                    action={msg.action}
                    onActionClick={handleActionClick}
                    source={msg.source}
                  />
                ))}

                {isTyping && (
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#0B5D52] text-white flex items-center justify-center shrink-0">
                      <Pill className="w-4 h-4 -rotate-45" />
                    </div>
                    <TypingIndicator />
                  </div>
                )}

                {showUploadCard && (
                  <div className="pt-1">
                    <PrescriptionUploadCard
                      defaultCustomerType={customerType}
                      onCancel={() => setShowUploadCard(false)}
                      onContinueToWebQuote={() => onNavigateToUploadQuote()}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Pinned input area */}
            <div
              className="shrink-0 border-t border-[#E4DFD3] bg-white px-2.5 sm:px-3 pt-2.5 sm:pt-3 space-y-2"
              style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[11px] font-medium text-[#16231F] bg-[#F0ECE2] active:bg-[#EAF3F0] active:text-[#0B5D52] border border-transparent active:border-[#0B5D52]/30 rounded-full px-2.5 py-1.5 whitespace-nowrap transition-colors shrink-0"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="relative bg-white border border-[#E4DFD3] rounded-xl p-1 flex items-center gap-2 focus-within:border-[#0B5D52] focus-within:ring-2 focus-within:ring-[#0B5D52]/15 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={handleInputFocus}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask about stock, doctor sessions, delivery..."
                  autoComplete="off"
                  enterKeyHint="send"
                  className="flex-1 min-w-0 bg-transparent px-3 py-2 text-base text-[#16231F] placeholder:text-[#8A8175] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    inputValue.trim() && !isTyping
                      ? 'bg-[#0B5D52] text-white active:bg-[#0E6E60]'
                      : 'bg-[#F0ECE2] text-[#B5AEA0]'
                  }`}
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[10px] text-[#8A8175] text-center">
                In an emergency, go to the nearest hospital — Curadeck is not an emergency service.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Safety & compliance modal — bottom sheet on mobile, centered dialog on desktop */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 bg-[#16231F]/60 flex items-end sm:items-center justify-center">
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl border border-[#E4DFD3] space-y-4 overflow-y-auto"
            style={{ maxHeight: '85dvh', paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
          >
            {/* Drag-handle affordance, mobile only */}
            <div className="sm:hidden w-9 h-1 bg-[#E4DFD3] rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex items-center justify-between pb-3 border-b border-[#EEEAE0]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#FBF1DE] border border-[#EBD9A8] flex items-center justify-center text-[#8A6A1F] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#16231F] truncate">Medical & compliance standards</h3>
                  <p className="text-xs text-[#6B6157] truncate">PCN & MDCN regulatory safeguards</p>
                </div>
              </div>
              <button
                onClick={() => setShowSafetyModal(false)}
                className="w-9 h-9 rounded-full bg-[#F0ECE2] active:bg-[#E4DFD3] text-[#6B6157] flex items-center justify-center transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-[#4A443B] leading-relaxed">
              <div className="p-3 bg-[#FBF1DE] border border-[#EBD9A8] rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-[#8A6A1F] shrink-0 mt-0.5" />
                <p className="text-[#5C4415] font-medium">
                  Curadeck Concierge is a navigation and logistics assistant. It does not diagnose, prescribe, or calculate dosages.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#16231F] text-xs flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-[#0B5D52]" />
                  Clinical care comes from licensed physicians
                </h4>
                <p>Diagnosis and prescriptions are handled only by MDCN-registered doctors, over secure video sessions.</p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#16231F] text-xs flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-[#0B5D52]" />
                  Every prescription is pharmacist-verified
                </h4>
                <p>
                  Under PCN license #LA/8892, no prescription-only medication ships without review by a registered duty pharmacist, checked for interactions and contraindications.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#16231F] text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0B5D52]" />
                  Genuine, cold-chain medication
                </h4>
                <p>Everything in the Curadeck catalog is NAFDAC-registered and stored under regulated cold-chain conditions.</p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#16231F] text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#0B5D52]" />
                  Not for emergencies
                </h4>
                <p>For acute chest pain, difficulty breathing, severe trauma, or any critical symptom, go straight to a hospital.</p>
              </div>
            </div>

            <button
              onClick={() => setShowSafetyModal(false)}
              className="w-full py-3 px-4 rounded-xl bg-[#0B5D52] active:bg-[#0E6E60] text-white font-bold text-xs transition-colors"
            >
              I understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
};