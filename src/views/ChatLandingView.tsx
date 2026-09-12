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

const DEFAULT_SUGGESTED_PROMPTS = [
  'Is Coartem in stock?',
  'Check Augmentin 625mg stock',
  'Book a doctor teleconsultation',
  'Upload doctor prescription',
  'How fast is Lagos delivery?',
];

const QUICK_ACTIONS = [
  { id: 'buy', label: 'Buy medicines', detail: '2,500+ items · Lagos in 2–4h', icon: Pill },
  { id: 'consult', label: 'Book a doctor', detail: 'Video call · from ₦2,500', icon: Video },
  { id: 'upload', label: 'Upload prescription', detail: 'Pharmacist review · 30 min', icon: UploadCloud },
  { id: 'nurse', label: 'Hire a care nurse', detail: 'Home visits · from ₦12,000', icon: HeartHandshake },
] as const;

export const ChatLandingView: React.FC<ChatLandingViewProps> = ({
  onNavigateToMarket,
  onNavigateToConsultations,
  onNavigateToUploadQuote,
  onNavigateToNurses,
  medicines = [],
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [showPrimaryOptions, setShowPrimaryOptions] = useState<boolean>(true);
  const [showUploadCard, setShowUploadCard] = useState<boolean>(false);
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(DEFAULT_SUGGESTED_PROMPTS);

  const chatContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(false);
      setMessages([
        {
          id: 'greeting-1',
          sender: 'bot',
          text: 'Hello! Welcome to Curadeck. 👋\n\nI can check real-time medication stock, help you upload a prescription slip for pharmacist review, or connect you with a licensed doctor.',
          timestamp: getTimestamp(),
          source: 'system',
        },
      ]);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom('smooth'), 40);
    return () => clearTimeout(timer);
  }, [messages, isTyping, showUploadCard]);

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
    setMessages((prev) => [
      ...prev,
      { id: 'usr_' + Date.now(), sender: 'user', text: 'Upload prescription', timestamp: getTimestamp() },
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
          text: 'Add a photo of your prescription slip below. A licensed pharmacist will verify it and send itemized pricing within 30 minutes.',
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

  const handleQuickAction = (id: (typeof QUICK_ACTIONS)[number]['id']) => {
    if (id === 'buy') handleSelectBuyMedicines();
    if (id === 'consult') handleSelectConsultation();
    if (id === 'upload') handleSelectUploadPrescription();
    if (id === 'nurse') handleSelectCareNurses();
  };

  // --- This is the function that actually changed ---------------------------
  // It now calls your Express server's /api/chat, which runs the patched
  // generateLocalReply() first (fast, free, handles stock/dosage/malaria/etc.
  // correctly) and only calls Gemini when that genuinely finds no match.
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
        body: JSON.stringify({ message: text, history: historyPayload, inventory: inventoryPayload }),
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
          source: data.source || 'gemini', // 'local' | 'gemini' | 'gemini-raw' | 'fallback'
          action: data.recommendedAction
            ? { type: data.recommendedAction, label: data.actionLabel || 'Proceed to service', detail: data.actionDetail || undefined }
            : null,
        },
      ]);

      if (Array.isArray(data.suggestedPrompts) && data.suggestedPrompts.length > 0) {
        setSuggestedPrompts(data.suggestedPrompts);
      }
    } catch (err) {
      // Server unreachable — rare. Real "smart" logic lives in /api/chat now.
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
  // ---------------------------------------------------------------------------

  const handleResetChat = () => {
    setShowUploadCard(false);
    setSuggestedPrompts(DEFAULT_SUGGESTED_PROMPTS);
    setMessages([
      {
        id: 'msg-reset',
        sender: 'bot',
        text: 'Welcome back to Curadeck! 👋 How can I help direct your healthcare request today?',
        timestamp: getTimestamp(),
        source: 'system',
      },
    ]);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-2">
      <div className="w-full h-[620px] sm:h-[680px] md:h-[720px] flex flex-col bg-white rounded-2xl border border-[#E4DFD3] shadow-sm overflow-hidden relative">
        {/* Top bar — one row, one job each */}
        <div className="shrink-0 flex items-center justify-between gap-2 py-2.5 px-3 sm:px-4 bg-white border-b border-[#E4DFD3]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0B5D52] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0B5D52]" />
            </span>
            <span className="font-bold text-[#16231F] text-xs truncate">Curadeck Concierge</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={() => setShowSafetyModal(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#8A6A1F] bg-[#FBF1DE] hover:bg-[#F5E6C4] border border-[#EBD9A8] px-2 py-1 rounded-lg transition-colors cursor-pointer"
              title="Non-advisory policy and licensing"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PCN #LA/8892</span>
            </button>
            <a
              href="tel:+2348002872332"
              className="hidden xs:flex items-center gap-1 text-[11px] font-bold text-[#0B5D52] bg-[#EAF3F0] hover:bg-[#DDEDE7] px-2 py-1 rounded-lg transition-colors"
            >
              <PhoneCall className="w-3 h-3" />
              <span className="hidden sm:inline">0800-CURADECK</span>
            </a>
            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-lg text-[#8A8175] hover:text-[#16231F] hover:bg-[#F0ECE2] transition-colors cursor-pointer"
              title="Start a new conversation"
              aria-label="Reset conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable chat container — the only scrolling element */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto min-h-0 bg-[#FBF9F4]">
          {/* Quick actions — solid bg, no blur, sits above the message stream */}
          <div className="sticky top-0 z-20 bg-[#FBF9F4] border-b border-[#E4DFD3] px-3 sm:px-4 py-2">
            <button
              type="button"
              onClick={() => setShowPrimaryOptions(!showPrimaryOptions)}
              className="w-full flex items-center justify-between cursor-pointer"
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
                {QUICK_ACTIONS.map(({ id, label, detail, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleQuickAction(id)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-white hover:bg-[#EAF3F0] border border-[#E4DFD3] hover:border-[#0B5D52]/40 text-left transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#EAF3F0] text-[#0B5D52] flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#16231F] text-xs truncate">{label}</p>
                      <p className="text-[10px] text-[#6B6157] truncate">{detail}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 sm:p-4 space-y-3.5">
            {/* One compliance notice, stated once */}
            <div className="p-2.5 bg-[#FBF1DE] border border-[#EBD9A8] rounded-xl flex items-start gap-2 text-[11px] text-[#5C4415] leading-relaxed">
              <AlertTriangle className="w-3.5 h-3.5 text-[#8A6A1F] shrink-0 mt-0.5" />
              <p>
                Curadeck Concierge helps you navigate the platform and check stock — it does not diagnose or advise on treatment. For clinical care, talk to a licensed doctor or pharmacist.
              </p>
            </div>

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
                <PrescriptionUploadCard onCancel={() => setShowUploadCard(false)} onContinueToWebQuote={() => onNavigateToUploadQuote()} />
              </div>
            )}
          </div>
        </div>

        {/* Pinned input area */}
        <div className="shrink-0 border-t border-[#E4DFD3] bg-white p-2.5 sm:p-3 space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="text-[11px] font-medium text-[#16231F] bg-[#F0ECE2] hover:bg-[#EAF3F0] hover:text-[#0B5D52] border border-transparent hover:border-[#0B5D52]/30 rounded-full px-2.5 py-1 whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="relative bg-white border border-[#E4DFD3] rounded-xl p-1 flex items-center gap-2 focus-within:border-[#0B5D52] focus-within:ring-2 focus-within:ring-[#0B5D52]/15 transition-all">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask about stock, doctor sessions, delivery..."
              className="flex-1 bg-transparent px-3 py-1.5 text-base sm:text-xs text-[#16231F] placeholder:text-[#8A8175] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isTyping}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                inputValue.trim() && !isTyping
                  ? 'bg-[#0B5D52] text-white hover:bg-[#0E6E60]'
                  : 'bg-[#F0ECE2] text-[#B5AEA0] cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[10px] text-[#8A8175] text-center">
            In an emergency, go to the nearest hospital — Curadeck is not an emergency service.
          </p>
        </div>
      </div>

      {/* Safety & compliance modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 bg-[#16231F]/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E4DFD3] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEEAE0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FBF1DE] border border-[#EBD9A8] flex items-center justify-center text-[#8A6A1F]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#16231F]">Medical & compliance standards</h3>
                  <p className="text-xs text-[#6B6157]">PCN & MDCN regulatory safeguards</p>
                </div>
              </div>
              <button
                onClick={() => setShowSafetyModal(false)}
                className="w-8 h-8 rounded-full bg-[#F0ECE2] hover:bg-[#E4DFD3] text-[#6B6157] flex items-center justify-center cursor-pointer transition-colors"
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
              className="w-full py-2.5 px-4 rounded-xl bg-[#0B5D52] hover:bg-[#0E6E60] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              I understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
};