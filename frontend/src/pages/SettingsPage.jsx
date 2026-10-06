import React, { useEffect, useState } from 'react';
import { llmAPI } from '../lib/api';
import LLMStatusChip from '../components/LLMStatusChip';
import { Settings as SettingsIcon, Sun, Moon, Monitor, Cpu, Trash2, Database, ShieldCheck } from 'lucide-react';

export default function SettingsPage({ theme, onThemeChange, activeDataset, datasets = [], onDeleteDataset }) {
  const [llmDetails, setLlmDetails] = useState(null);

  useEffect(() => {
    llmAPI.getStatus().then((res) => setLlmDetails(res.data)).catch(console.error);
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* 1. Theme Preferences */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-indigo-500" />
          Appearance & Design Theme
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Customize UI theme tokens persisted to local storage.
        </p>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => onThemeChange('light')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-all ${
              theme === 'light'
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            Light Mode
          </button>
          <button
            onClick={() => onThemeChange('dark')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-all ${
              theme === 'dark'
                ? 'border-indigo-600 bg-indigo-950/40 text-indigo-200 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            Dark Mode
          </button>
          <button
            onClick={() => onThemeChange('system')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-all ${
              theme === 'system'
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Monitor className="w-5 h-5 text-slate-500" />
            System Default
          </button>
        </div>
      </div>

      {/* 2. LLM Provider Status & Failover Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-500" />
            LLM Provider & Failover Engine Status
          </h3>
          <LLMStatusChip />
        </div>

        {llmDetails?.providers && (
          <div className="space-y-2 pt-2">
            {llmDetails.providers.map((p, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold capitalize text-slate-900 dark:text-white">{p.provider}</span>
                  <span className="text-slate-400 ml-2 font-mono">({p.model})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{p.latency_ms} ms</span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${p.reachable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {p.reachable ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Multi-Dataset Manager */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-500" />
          Uploaded Datasets Manager
        </h3>

        {datasets.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {datasets.map((d) => (
              <div key={d.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{d.filename}</div>
                  <div className="text-slate-400 text-[11px]">{d.total_rows?.toLocaleString()} rows • {d.total_columns} cols</div>
                </div>
                <button
                  onClick={() => onDeleteDataset(d.id)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                  title="Delete Dataset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400">No active datasets uploaded yet.</div>
        )}
      </div>
    </div>
  );
}
