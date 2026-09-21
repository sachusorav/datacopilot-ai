import React from 'react';
import Plot from 'react-plotly.js';
import { TrendingUp, Users, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SalesPredictResponse, ChurnPredictResponse } from '../lib/api';

interface PredictionsPanelProps {
  salesData: SalesPredictResponse | null;
  churnData: ChurnPredictResponse | null;
  darkMode?: boolean;
}

export const PredictionsPanel: React.FC<PredictionsPanelProps> = ({ salesData, churnData, darkMode = false }) => {
  const isDark = darkMode;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Sales Forecasting Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Time-Series Sales & Revenue Forecast
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Machine Learning regression model (GradientBoosting / Ridge) with 14-period future projection
              </p>
            </div>
          </div>

          {salesData?.supported && (
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <span className="text-slate-400 dark:text-slate-500 font-normal">Model R² Score: </span>
                <span className="font-bold">{salesData.r2_score}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500 font-normal">MAE: </span>
                <span className="font-bold">${salesData.mae?.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {salesData?.supported ? (
          <div className="w-full overflow-hidden">
            <Plot
              data={[
                {
                  x: salesData.forecast_data.filter(p => p.historical_sales !== null).map(p => p.date),
                  y: salesData.forecast_data.filter(p => p.historical_sales !== null).map(p => p.historical_sales),
                  type: 'scatter',
                  mode: 'lines+markers',
                  name: 'Historical Sales',
                  line: { color: '#3b82f6', width: 2.5 },
                  marker: { size: 5 }
                },
                {
                  x: salesData.forecast_data.filter(p => p.forecast_sales !== null).map(p => p.date),
                  y: salesData.forecast_data.filter(p => p.forecast_sales !== null).map(p => p.forecast_sales),
                  type: 'scatter',
                  mode: 'lines+markers',
                  name: 'Predicted Forecast',
                  line: { color: '#10b981', width: 2.5, dash: 'dash' },
                  marker: { size: 6, symbol: 'diamond' }
                }
              ]}
              layout={{
                autosize: true,
                height: 320,
                margin: { l: 50, r: 20, t: 20, b: 40 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { color: isDark ? '#94a3b8' : '#475569', family: 'Inter, sans-serif' },
                xaxis: { gridcolor: isDark ? '#1e293b' : '#f1f5f9' },
                yaxis: { gridcolor: isDark ? '#1e293b' : '#f1f5f9' },
                legend: { orientation: 'h', x: 0, y: 1.1 }
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {salesData?.message || 'Sales prediction unavailable for this dataset format.'}
            </p>
          </div>
        )}
      </div>

      {/* 2. Customer Churn Risk Classification */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Customer Churn Risk Prediction
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                RandomForest Classification model assessing customer recency, purchase frequency, & attrition risk
              </p>
            </div>
          </div>

          {churnData?.supported && (
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                {churnData.high_risk_count} High Risk Customers
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Model Accuracy: {(churnData.accuracy! * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {churnData?.supported ? (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold sticky top-0">
                <tr>
                  <th className="px-4 py-3">Customer ID / Name</th>
                  <th className="px-4 py-3">Recency (Days)</th>
                  <th className="px-4 py-3">Purchase Frequency</th>
                  <th className="px-4 py-3">Churn Probability</th>
                  <th className="px-4 py-3">Risk Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {churnData.risk_table.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {row.customer_name || row.customer_id}
                    </td>
                    <td className="px-4 py-3">{row.recency_days} days</td>
                    <td className="px-4 py-3">{row.purchase_frequency} orders</td>
                    <td className="px-4 py-3 font-medium">
                      {(row.churn_probability * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        row.risk_tier === 'High'
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                          : row.risk_tier === 'Medium'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}>
                        {row.risk_tier} Risk
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {churnData?.message || 'Not enough customer activity fields in this dataset for churn modeling.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
