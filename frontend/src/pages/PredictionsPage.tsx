import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { api, SalesPredictResponse, ChurnPredictResponse } from '../lib/api';
import { PredictionsPanel } from '../components/PredictionsPanel';

interface PredictionsPageProps {
  datasetId: string | null;
  darkMode?: boolean;
  onNavigateToUpload: () => void;
}

export const PredictionsPage: React.FC<PredictionsPageProps> = ({ datasetId, darkMode = false, onNavigateToUpload }) => {
  const [salesData, setSalesData] = useState<SalesPredictResponse | null>(null);
  const [churnData, setChurnData] = useState<ChurnPredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (datasetId) {
      loadPredictions();
    }
  }, [datasetId]);

  const loadPredictions = async () => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);
    try {
      const [sRes, cRes] = await Promise.all([
        api.getSalesPrediction(datasetId),
        api.getChurnPrediction(datasetId),
      ]);
      setSalesData(sRes);
      setChurnData(cRes);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to train machine learning models.');
    } finally {
      setLoading(false);
    }
  };

  if (!datasetId) {
    return (
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-5 my-8 shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <TrendingUp className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            No Active Dataset for ML Training
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Upload your sales and customer data to automatically train time-series regression and RandomForest churn models.
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
          Training Machine Learning models (Scikit-Learn Regression & RandomForest Classifier)...
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
          onClick={loadPredictions}
          className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          Retry Model Training
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Machine Learning Predictions
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Automated sales forecasting and customer churn risk classification.
        </p>
      </div>

      <PredictionsPanel salesData={salesData} churnData={churnData} darkMode={darkMode} />
    </div>
  );
};
