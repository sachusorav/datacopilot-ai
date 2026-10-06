import React, { useState } from 'react';
import { reportAPI } from '../lib/api';
import { FileText, Download, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ReportsPage({ dataset }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadPDF = async () => {
    if (!dataset) return;
    setDownloading(true);
    setDownloaded(false);
    try {
      const res = await reportAPI.generatePDF(dataset.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DataCopilot_Report_${dataset.id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setDownloaded(true);
    } catch (e) {
      console.error('PDF report download error:', e);
    } finally {
      setDownloading(false);
    }
  };

  if (!dataset) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please upload or select a dataset to generate Executive Reports.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
          <FileText className="w-7 h-7" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Export Executive PDF Business Intelligence Report
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Includes automated data quality score, clean dataset metrics, time-series sales forecast, customer churn risk matrix, statistical anomalies, and Llama executive recommendations.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-500/20 inline-flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Asynchronous Report...
              </>
            ) : downloaded ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Downloaded PDF Report!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF Executive Summary
              </>
            )}
          </button>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-6 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            ReportLab High-Res Engine
          </span>
          <span>•</span>
          <span>Includes Vector Charts</span>
          <span>•</span>
          <span>100% Client Protected</span>
        </div>
      </div>
    </div>
  );
}
