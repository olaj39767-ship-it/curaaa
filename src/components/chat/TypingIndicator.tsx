import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1.5 px-4 py-3 bg-white border border-slate-200/90 rounded-2xl rounded-tl-sm shadow-xs w-fit">
      <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]"></span>
      <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"></span>
    </div>
  );
};
