import React, { useEffect, useState } from 'react';
import { llmAPI } from '../lib/api';
import { Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LLMStatusChip() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await llmAPI.getStatus();
      setStatus(res.data);
    } catch (e) {
      setStatus({ online: false, active_provider: 'fallback mode', active_model: 'Deterministic Pandas' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !status) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-500 animate-pulse">
        <Cpu className="w-3.5 h-3.5" />
        Checking LLM...
      </div>
    );
  }

  const isOnline = status.online;

  return (
    <div
      title={`Active Model: ${status.active_model}`}
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ring-1 transition-all ${
        isOnline
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800'
          : 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800'
      }`}
    >
      <Cpu className="w-3.5 h-3.5" />
      <span className="capitalize">{status.active_provider}</span>
      <span className="opacity-60">•</span>
      <span className="truncate max-w-[110px]">{status.active_model}</span>
      {isOnline ? (
        <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-0.5" />
      ) : (
        <AlertCircle className="w-3 h-3 text-amber-500 ml-0.5" />
      )}
    </div>
  );
}
