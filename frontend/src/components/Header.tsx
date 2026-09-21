import React from 'react';
import { Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

interface HeaderProps {
  filename: string | null;
  datasetId: string | null;
  isCleaned: boolean;
  totalRows: number | null;
  onNavigateToUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  filename,
  datasetId,
  isCleaned,
  totalRows,
  onNavigateToUpload,
}) => {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      <div className="flex items-center gap-4">
        {filename ? (
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
              {filename}
            </span>
            {totalRows !== null && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {totalRows.toLocaleString()} rows
              </span>
            )}
            {isCleaned && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                <CheckCircle2 className="w-3 h-3" />
                Cleaned
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">
            No dataset loaded — Please upload a CSV/Excel file
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {datasetId && (
          <a
            href={api.getReportDownloadUrl(datasetId)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report PDF</span>
          </a>
        )}
        <button
          onClick={onNavigateToUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Upload File</span>
        </button>
      </div>
    </header>
  );
};
