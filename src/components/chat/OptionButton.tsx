import React from 'react';
import { LucideIcon, ArrowRight, Sparkles } from 'lucide-react';

interface OptionButtonProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: 'teal' | 'emerald' | 'amber' | 'indigo';
  onClick: () => void;
  accent?: boolean;
}

export const OptionButton: React.FC<OptionButtonProps> = ({
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeColor = 'teal',
  onClick,
  accent = false,
}) => {
  const badgeClasses = {
    teal: 'bg-teal-50 text-teal-800 border-teal-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-900 border-amber-200',
    indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  }[badgeColor];

  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer shadow-xs active:scale-[0.98] ${
        accent
          ? 'bg-gradient-to-r from-teal-900 via-teal-850 to-slate-900 text-white border-teal-700/80 hover:border-teal-500 hover:shadow-md'
          : 'bg-white text-slate-800 border-slate-200/90 hover:border-teal-500 hover:bg-teal-50/20 hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
            accent
              ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
              : 'bg-teal-50 text-teal-700 border border-teal-100'
          }`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`font-bold text-sm sm:text-base leading-snug truncate ${
                accent ? 'text-white' : 'text-slate-900 group-hover:text-teal-900'
              }`}
            >
              {title}
            </span>
            {badge && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  accent
                    ? 'bg-teal-400 text-teal-950 border-teal-300 font-mono'
                    : badgeClasses
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          <p
            className={`text-xs mt-0.5 line-clamp-1 ${
              accent ? 'text-teal-200/80' : 'text-slate-500'
            }`}
          >
            {subtitle}
          </p>
        </div>
      </div>

      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-1 ${
          accent
            ? 'bg-white/10 text-teal-200'
            : 'bg-slate-100 text-slate-400 group-hover:bg-teal-600 group-hover:text-white'
        }`}
      >
        <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );
};
