import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, LayoutDashboard, Sparkles, ArrowRight } from 'lucide-react';
import { api, DashboardResponse } from '../lib/api';
import { KPICard } from '../components/KPICard';
import { ChartPanel } from '../components/ChartPanel';

interface DashboardPageProps {
  datasetId: string | null;
  darkMode?: boolean;
  onNavigateToUpload: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ datasetId, darkMode = false, onNavigateToUpload }) => {
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (datasetId) {
      loadDashboard();
    }
  }, [datasetId]);

  const loadDashboard = async () => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await api.getDashboard(datasetId);
      setDashboardData(resp);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (!datasetId) {
    return (
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-5 my-8 shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <LayoutDashboard className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            No Active Dataset
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Upload your CSV or Excel business data to view automatically calculated KPIs and Plotly charts.
          </p>
        </div>
        <button
          onClick={onNavigateToUpload}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Upload Dataset Now</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Calculating KPIs & rendering Plotly chart specs...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Executive Intelligence Dashboard
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Interactive metrics and Plotly visualizations generated from your active dataset.
        </p>
      </div>

      {/* KPI Cards Grid */}
      {dashboardData?.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {dashboardData.kpis.map((kpi, idx) => (
            <KPICard key={idx} card={kpi} />
          ))}
        </div>
      )}

      {/* Plotly Charts Grid */}
      {dashboardData?.charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboardData.charts.map((chart) => (
            <ChartPanel key={chart.id} chart={chart} darkMode={darkMode} />
          ))}
        </div>
      )}
    </div>
  );
};
