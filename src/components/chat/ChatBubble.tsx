import React from 'react';
import { Pill, User as UserIcon, Sparkles, ArrowRight, Video, UploadCloud, HeartHandshake, ShieldCheck } from 'lucide-react';

export interface ChatAction {
  type: 'BUY_MEDICINES' | 'BOOK_CONSULTATION' | 'UPLOAD_PRESCRIPTION' | 'CARE_NURSES';
  label: string;
  detail?: string;
}

interface ChatBubbleProps {
  sender: 'bot' | 'user';
  message?: string;
  children?: React.ReactNode;
  timestamp?: string;
  action?: ChatAction | null;
  onActionClick?: (actionType: 'BUY_MEDICINES' | 'BOOK_CONSULTATION' | 'UPLOAD_PRESCRIPTION' | 'CARE_NURSES') => void;
  source?: 'gemini' | 'gemini-raw' | 'fallback' | 'system';
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  sender,
  message,
  children,
  timestamp,
  action,
  onActionClick,
  source
}) => {
  const isBot = sender === 'bot';

  // Helper to render bold text and bullet points nicely
  const formatText = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      // Check if bullet point
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('• ');
      const cleanLine = isBullet ? line.trim().replace(/^[-•]\s*/, '') : line;

      // Handle bold **text**
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIdx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lineIdx} className="flex items-start gap-1.5 ml-1 mt-1">
            <span className="text-teal-600 mt-1 text-xs">•</span>
            <span>{formattedParts}</span>
          </div>
        );
      }

      return (
        <p key={lineIdx} className={lineIdx > 0 ? 'mt-1.5' : ''}>
          {formattedParts}
        </p>
      );
    });
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'BUY_MEDICINES':
        return Pill;
      case 'BOOK_CONSULTATION':
        return Video;
      case 'UPLOAD_PRESCRIPTION':
        return UploadCloud;
      case 'CARE_NURSES':
        return HeartHandshake;
      default:
        return Pill;
    }
  };

  return (
    <div
      className={`flex items-start gap-2.5 sm:gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isBot ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* Bot Avatar */}
      {isBot && (
        <div className="relative shrink-0 mt-0.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-700/20 border border-teal-400/30">
            <Pill className="w-4 h-4 sm:w-5 sm:h-5 -rotate-45" />
          </div>
          {/* Online green indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-50 rounded-full"></span>
        </div>
      )}

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[88%] sm:max-w-[78%] ${isBot ? 'items-start' : 'items-end'}`}>
        {isBot && (
          <div className="flex items-center gap-1.5 ml-1 mb-1 text-[11px] text-slate-400 font-medium">
            <span className="font-bold text-slate-700">Curadeck Health Concierge</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
              PCN Verified
            </span>
            {source?.includes('gemini') && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50/90 border border-teal-200/80 px-1.5 py-0.2 rounded-full">
                <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                Gemini AI
              </span>
            )}
          </div>
        )}

        <div
          className={`p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed transition-all shadow-xs ${
            isBot
              ? 'bg-white text-slate-800 rounded-2xl rounded-tl-xs border border-slate-200/90'
              : 'bg-teal-700 text-white rounded-2xl rounded-tr-xs font-medium'
          }`}
        >
          {message && (
            <div className="break-words">
              {formatText(message)}
            </div>
          )}

          {/* Embedded Interactive Action Card from AI */}
          {action && onActionClick && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => onActionClick(action.type)}
                className="w-full text-left p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-teal-50 to-slate-50 hover:from-teal-100/60 hover:to-teal-50/80 border border-teal-200/90 transition-all flex items-center justify-between gap-2.5 group cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {React.createElement(getActionIcon(action.type), {
                    className: 'w-4 h-4 text-teal-700 shrink-0 group-hover:scale-110 transition-transform'
                  })}
                  <div className="min-w-0">
                    <p className="font-bold text-teal-950 text-xs truncate">
                      {action.label}
                    </p>
                    {action.detail && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {action.detail}
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          )}

          {isBot && (
            <div className="mt-2.5 pt-2 border-t border-slate-100/80 text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-teal-600/80 shrink-0" />
              <span>Platform navigation only • Not medical advice or dosage</span>
            </div>
          )}

          {children}
        </div>

        {timestamp && (
          <span className="text-[10px] text-slate-400 mt-1 px-1">
            {timestamp}
          </span>
        )}
      </div>

      {/* User Avatar */}
      {!isBot && (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
          <UserIcon className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
