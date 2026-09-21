import React from 'react';
import { FileSpreadsheet, Download, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

interface ReportPanelProps {
  datasetId: string | null;
  filename: string | null;
}

export const ReportPanel: React.FC<ReportPanelProps> = ({ datasetId, filename }) => {
  if (!datasetId) {
    return (
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">
          No Dataset Loaded
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Please upload a business dataset first to generate an executive PDF report.
        </p>
      </div>
    );
  }

  const downloadUrl = api.getReportDownloadUrl(datasetId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
          <FileSpreadsheet className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Generate Executive PDF Intelligence Report
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
            Produces a multi-page PDF containing dataset metrics, KPI cards, ML sales forecasts & churn analytics, plus a Gemini AI written executive overview with strategic recommendations.
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 inline-block text-left text-xs text-slate-600 dark:text-slate-300 space-y-1 font-medium">
          <div><span className="font-bold">Dataset:</span> {filename || 'Active Dataset'}</div>
          <div><span className="font-bold">Report Engine:</span> ReportLab PDF Engine + Gemini 2.0 Flash</div>
          <div><span className="font-bold">Status:</span> Ready for instant download</div>
        </div>

        <div>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
            <Sparkles className="w-4 h-4 ml-1 text-blue-200" />
          </a>
        </div>
      </div>
    </div>
  );
};
