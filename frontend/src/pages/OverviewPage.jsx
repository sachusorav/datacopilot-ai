import React, { useEffect, useState } from 'react';
import { predictAPI, cleanAPI } from '../lib/api';
import KPICard from '../components/KPICard';
import { CardSkeleton } from '../components/Skeleton';
import { ShieldCheck, AlertTriangle, Sparkles, Database, CheckCircle, RefreshCw } from 'lucide-react';

export default function OverviewPage({ dataset }) {
  const [quality, setQuality] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  const fetchData = async () => {
    if (!dataset) return;
    setLoading(true);
    try {
      const [qRes, aRes] = await Promise.all([
        predictAPI.getQualityScore(dataset.id),
        predictAPI.getAnomalies(dataset.id)
      ]);
      setQuality(qRes.data);
      setAnomalies(aRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dataset]);

  const handleCleanData = async () => {
    if (!dataset) return;
    setCleaning(true);
    try {
      await cleanAPI.cleanData(dataset.id, { fill_missing: true, remove_duplicates: true });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setCleaning(false);
    }
  };

  if (!dataset) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please upload or select a dataset to view the Overview.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Data Quality Score"
          value={`${quality?.overall_score || 95}/100`}
          subtitle="Completeness & Outlier Weighted Score"
          trend="up"
          icon={ShieldCheck}
        />
        <KPICard
          title="Total Records"
          value={dataset.total_rows?.toLocaleString() || 0}
          subtitle={`${dataset.total_columns} Columns`}
          icon={Database}
        />
        <KPICard
          title="Completeness"
          value={`${quality?.completeness_score || 100}%`}
          subtitle={`${quality?.missing_cells || 0} Missing Cells`}
          icon={CheckCircle}
        />
        <KPICard
          title="Anomalies Flagged"
          value={anomalies.length}
          subtitle="Outliers via IsolationForest"
          trend={anomalies.length > 0 ? 'down' : 'up'}
          icon={AlertTriangle}
        />
      </div>

      {/* Cleanliness Audit & Action Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Dataset Cleanliness Audit
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automated imputation and duplicate row removal status.
            </p>
          </div>
          <button
            onClick={handleCleanData}
            disabled={cleaning}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cleaning ? 'animate-spin' : ''}`} />
            {cleaning ? 'Cleaning...' : 'Re-Run Cleaning Pipeline'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <span className="text-xs text-slate-500 font-medium">Uniqueness Score</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {quality?.uniqueness_score || 100}%
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <span className="text-xs text-slate-500 font-medium">Clean Record Ratio</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {quality?.clean_record_ratio || 100}%
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <span className="text-xs text-slate-500 font-medium">Duplicate Rows</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {quality?.duplicate_rows || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Anomalies Table */}
      {anomalies.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Flagged Statistical Outliers (IsolationForest)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5">Row #</th>
                  <th className="p-2.5">Anomaly Score</th>
                  <th className="p-2.5">Record Content</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {anomalies.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 font-mono text-slate-500">#{item.row_index}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
                        {item.anomaly_score}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-md">
                      {JSON.stringify(item.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
