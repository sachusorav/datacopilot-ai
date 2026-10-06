import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../lib/api';
import Plot from 'react-plotly.js';
import KPICard from '../components/KPICard';
import { ChartSkeleton } from '../components/Skeleton';
import { BarChart3, Download, RefreshCw } from 'lucide-react';

export default function DashboardPage({ dataset }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    if (!dataset) return;
    setLoading(true);
    try {
      const res = await dashboardAPI.getDashboard(dataset.id);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [dataset]);

  if (!dataset) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please upload or select a dataset to view the Dashboard.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* KPI Row */}
      {data?.kpis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(data.kpis).map(([k, v], idx) => (
            <KPICard
              key={idx}
              title={k.replace(/_/g, ' ')}
              value={typeof v === 'number' ? v.toLocaleString() : v}
              icon={BarChart3}
            />
          ))}
        </div>
      )}

      {/* Plotly Visualizations */}
      {data?.charts && data.charts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.charts.map((chart, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {chart.layout?.title?.text || `Visualization ${idx + 1}`}
                </h4>
              </div>
              <div className="w-full h-72">
                <Plot
                  data={chart.data}
                  layout={{
                    ...chart.layout,
                    autosize: true,
                    margin: { l: 40, r: 20, t: 30, b: 40 },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    font: { family: 'Inter, sans-serif', color: '#64748b' },
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true, displayModeBar: true, toImageButtonOptions: { format: 'png' } }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          No auto-generated charts available for this dataset layout.
        </div>
      )}
    </div>
  );
}
