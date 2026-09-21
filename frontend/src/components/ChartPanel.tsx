import React from 'react';
import Plot from 'react-plotly.js';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { ChartSpecData } from '../lib/api';

interface ChartPanelProps {
  chart: ChartSpecData;
  darkMode?: boolean;
}

export const ChartPanel: React.FC<ChartPanelProps> = ({ chart, darkMode = false }) => {
  if (!chart.supported) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[280px] text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">
          {chart.title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
          {chart.message || 'Skipped: Column parameters for this visualization are not present in the current dataset.'}
        </p>
      </div>
    );
  }

  const isDark = darkMode;
  const layout = {
    autosize: true,
    height: 280,
    margin: { l: 40, r: 20, t: 30, b: 40 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      color: isDark ? '#94a3b8' : '#475569',
      family: 'Inter, sans-serif',
      size: 11,
    },
    xaxis: {
      gridcolor: isDark ? '#1e293b' : '#f1f5f9',
      zerolinecolor: isDark ? '#334155' : '#cbd5e1',
    },
    yaxis: {
      gridcolor: isDark ? '#1e293b' : '#f1f5f9',
      zerolinecolor: isDark ? '#334155' : '#cbd5e1',
    },
    showlegend: false,
  };

  const config = {
    responsive: true,
    displayModeBar: false,
  };

  const dataArray = Array.isArray(chart.data) ? chart.data : [chart.data];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
          {chart.title}
        </h4>
        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-400">
          <BarChart3 className="w-4 h-4" />
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <Plot
          data={dataArray}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </div>
    </div>
  );
};
