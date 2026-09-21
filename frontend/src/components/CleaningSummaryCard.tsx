import React from 'react';
import { CheckCircle, RefreshCw, Layers, Hash } from 'lucide-react';
import { CleaningSummary } from '../lib/api';

interface CleaningSummaryCardProps {
  summary: CleaningSummary;
}

export const CleaningSummaryCard: React.FC<CleaningSummaryCardProps> = ({ summary }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">
            Dataset Cleaning Report
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
          Cleaned & Verified
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
            <span>Exact Duplicates Removed</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {summary.duplicate_rows_removed.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Missing Values Imputed</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {summary.total_nulls_filled.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Hash className="w-3.5 h-3.5 text-indigo-500" />
            <span>Cleaned Rows Remaining</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {summary.rows_after_cleaning.toLocaleString()}
          </p>
        </div>
      </div>

      {Object.keys(summary.null_values_filled).length > 0 && (
        <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700/40">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Nulls imputed per column: </span>
          {Object.entries(summary.null_values_filled)
            .map(([col, count]) => `${col} (${count})`)
            .join(', ')}
        </div>
      )}
    </div>
  );
};
