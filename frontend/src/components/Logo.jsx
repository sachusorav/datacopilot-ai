import React from 'react';

export default function Logo({ size = 'md', showTagline = false }) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2.5 select-none">
        <div className={`relative ${iconSizes[size]} flex-shrink-0 flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20`}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h7a8 8 0 0 1 8 8v0a8 8 0 0 1-8 8H4V4z" />
            <path d="M9 9h.01" />
            <path d="M13 9h.01" />
            <path d="M9 15h6" />
            <path d="M12 12v3" />
          </svg>
        </div>
        <span className={`font-semibold tracking-tight ${textSizes[size]} text-slate-900 dark:text-white`}>
          DataCopilot <span className="text-indigo-600 dark:text-indigo-400 font-bold">AI</span>
        </span>
      </div>
      {showTagline && (
        <span className="mt-1 text-[11px] font-medium tracking-wide uppercase text-slate-500 dark:text-slate-400">
          TURNING DATA INTO DECISIONS
        </span>
      )}
    </div>
  );
}
