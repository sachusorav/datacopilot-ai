import React, { useEffect, useState } from 'react';
import { predictAPI } from '../lib/api';
import Plot from 'react-plotly.js';
import KPICard from '../components/KPICard';
import { ChartSkeleton } from '../components/Skeleton';
import { TrendingUp, UserMinus, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function PredictionsPage({ dataset }) {
  const [sales, setSales] = useState(null);
  const [churn, setChurn] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPredictions = async () => {
    if (!dataset) return;
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        predictAPI.getSalesForecast(dataset.id),
        predictAPI.getChurnRisk(dataset.id)
      ]);
      setSales(sRes.data);
      setChurn(cRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [dataset]);

  if (!dataset) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please upload or select a dataset to view Predictive Analytics.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* 1. Sales Forecast Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              14-Period Sales Forecast (Holt-Winters Exponential Smoothing)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Time-series trend projection with 95% confidence intervals (Hold-out Validation).
            </p>
          </div>
          {sales?.status === 'success' && (
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                MAE: {sales.mae}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                MAPE: {sales.mape}%
              </span>
            </div>
          )}
        </div>

        {sales?.status === 'success' ? (
          <div className="w-full h-80">
            <Plot
              data={[
                {
                  x: sales.historical_data.map((d) => d.date),
                  y: sales.historical_data.map((d) => d.value),
                  type: 'scatter',
                  mode: 'lines+markers',
                  name: 'Historical Sales',
                  line: { color: '#6366f1', width: 2.5 },
                },
                {
                  x: sales.forecast_data.map((d) => d.date),
                  y: sales.forecast_data.map((d) => d.value),
                  type: 'scatter',
                  mode: 'lines+markers',
                  name: 'Projected Forecast',
                  line: { color: '#10b981', width: 2.5, dash: 'dot' },
                },
                {
                  x: sales.forecast_data.map((d) => d.date).concat(sales.forecast_data.map((d) => d.date).reverse()),
                  y: sales.forecast_data.map((d) => d.upper_bound).concat(sales.forecast_data.map((d) => d.lower_bound).reverse()),
                  fill: 'toself',
                  fillcolor: 'rgba(16, 185, 129, 0.15)',
                  line: { color: 'transparent' },
                  name: '95% Confidence Interval',
                  showlegend: true,
                },
              ]}
              layout={{
                autosize: true,
                margin: { l: 40, r: 20, t: 20, b: 40 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { family: 'Inter, sans-serif', color: '#64748b' },
                hovermode: 'x unified',
              }}
              useResizeHandler={true}
              style={{ width: '100%', height: '100%' }}
              config={{ responsive: true }}
            />
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
            {sales?.message || 'Time-series forecasting unavailable for this dataset.'}
          </div>
        )}
      </div>

      {/* 2. Customer Churn Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <UserMinus className="w-4 h-4 text-rose-500" />
              Customer Churn Risk Analysis (Random Forest RFM Model)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Predicts customer churn likelihood without data leakage.
            </p>
          </div>
          {churn?.status === 'success' && (
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Precision: {churn.precision}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Recall: {churn.recall}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                ROC-AUC: {churn.roc_auc}
              </span>
            </div>
          )}
        </div>

        {churn?.status === 'success' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Customer ID</th>
                  <th className="p-3">Frequency</th>
                  <th className="p-3">Total Spend</th>
                  <th className="p-3">Churn Probability</th>
                  <th className="p-3">Risk Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {churn.risk_table.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{row.customer_id}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{row.frequency} orders</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">${row.total_spend.toLocaleString()}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {(row.churn_probability * 100).toFixed(0)}%
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold ${
                          row.risk_tier === 'High'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : row.risk_tier === 'Medium'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {row.risk_tier} Risk
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
            {churn?.message || 'Churn prediction unavailable for this dataset.'}
          </div>
        )}
      </div>
    </div>
  );
}
