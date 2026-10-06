import React from 'react';
import LLMStatusChip from './LLMStatusChip';
import { Sun, Moon, Monitor, Upload, Database } from 'lucide-react';

export default function Header({
  pageTitle,
  activeDataset,
  theme,
  onThemeChange,
  onNewUpload
}) {
  return (
    <header className="h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
          {pageTitle}
        </h1>
        {activeDataset && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800">
            <Database className="w-3 h-3 text-indigo-500" />
            <span className="truncate max-w-[150px]">{activeDataset.filename}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <LLMStatusChip />

        {/* Theme Manager Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => onThemeChange('light')}
            className={`p-1 rounded ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            title="Light Mode"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onThemeChange('dark')}
            className={`p-1 rounded ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            title="Dark Mode"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onThemeChange('system')}
            className={`p-1 rounded ${theme === 'system' ? 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            title="System Theme"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onNewUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Data
        </button>
      </div>
    </header>
  );
}
