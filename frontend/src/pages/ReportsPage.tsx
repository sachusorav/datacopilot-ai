import React from 'react';
import { ReportPanel } from '../components/ReportPanel';

interface ReportsPageProps {
  datasetId: string | null;
  filename: string | null;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ datasetId, filename }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          PDF Intelligence Reports
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Export automated PDF executive summaries with KPIs, Plotly charts, ML metrics, and Gemini AI insights.
        </p>
      </div>

      <ReportPanel datasetId={datasetId} filename={filename} />
    </div>
  );
};
