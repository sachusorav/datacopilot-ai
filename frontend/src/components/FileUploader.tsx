import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle, Loader2, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { api, DatasetUploadResponse, CleanResponse } from '../lib/api';
import { CleaningSummaryCard } from './CleaningSummaryCard';

interface FileUploaderProps {
  onDatasetLoaded: (data: DatasetUploadResponse, cleanData?: CleanResponse) => void;
  sampleDatasetPath?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onDatasetLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [uploadedData, setUploadedData] = useState<DatasetUploadResponse | null>(null);
  const [cleanSummary, setCleanSummary] = useState<CleanResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = async (file: File) => {
    setError(null);
    setCleanSummary(null);

    // Client-side validation: file format
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.csv', '.xlsx', '.xls'].includes(ext)) {
      setError(`Invalid file type (${ext}). Please upload a .csv, .xlsx, or .xls file.`);
      return;
    }

    // Client-side validation: file size <= 25MB
    if (file.size > 25 * 1024 * 1024) {
      setError(`File size exceeds 25MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB).`);
      return;
    }

    setIsUploading(true);
    try {
      const resp = await api.uploadFile(file);
      setUploadedData(resp);
      onDatasetLoaded(resp);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload dataset. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCleanData = async () => {
    if (!uploadedData) return;
    setIsCleaning(true);
    try {
      const resp = await api.cleanDataset(uploadedData.dataset_id);
      setCleanSummary(resp);
      onDatasetLoaded(uploadedData, resp);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to clean dataset.');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Upload Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              validateAndUpload(e.target.files[0]);
            }
          }}
        />

        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
          {isUploading ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : (
            <UploadCloud className="w-7 h-7" />
          )}
        </div>

        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
          {isUploading ? 'Parsing & Indexing Dataset...' : 'Upload Business Dataset'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Drag and drop your sales, revenue, or customer dataset here, or click to browse. Accepts <span className="font-semibold text-slate-700 dark:text-slate-300">.csv, .xlsx, .xls</span> (Max 25MB).
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Uploaded Data Preview & Auto-Cleaning trigger */}
      {uploadedData && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-blue-500" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {uploadedData.filename}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {uploadedData.total_rows.toLocaleString()} rows • {uploadedData.total_columns} columns detected
                </p>
              </div>
            </div>

            <button
              onClick={handleCleanData}
              disabled={isCleaning || !!cleanSummary}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all ${
                cleanSummary
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              {isCleaning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cleaning Data...</span>
                </>
              ) : cleanSummary ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Data Cleaned</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Data Cleaning Engine</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>

          {/* Cleaning Summary Card */}
          {cleanSummary && <CleaningSummaryCard summary={cleanSummary.summary} />}

          {/* Table Preview (First 10 Rows) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Dataset Preview (Top 10 Rows)
              </h4>
              <span className="text-xs text-slate-400">Showing first 10 records</span>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg max-h-80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold sticky top-0">
                  <tr>
                    {uploadedData.columns.map((col) => (
                      <th key={col} className="px-3 py-2.5 whitespace-nowrap border-b border-slate-200 dark:border-slate-700">
                        {col}
                        <span className="block text-[10px] font-normal text-slate-400">
                          {uploadedData.column_types[col]}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {uploadedData.preview_data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      {uploadedData.columns.map((col) => (
                        <td key={col} className="px-3 py-2 whitespace-nowrap">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
