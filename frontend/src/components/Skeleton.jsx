import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
      <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/2"></div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-80 flex flex-col justify-between animate-pulse">
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
      <div className="h-48 bg-slate-100 dark:bg-slate-800/60 rounded w-full"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
    </div>
  );
}
