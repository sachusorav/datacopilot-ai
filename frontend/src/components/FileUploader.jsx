import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, Loader2 } from 'lucide-react';

export default function FileUploader({ onFileUpload, isLoading }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
        isDragging
          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
          : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-900'
      }`}
    >
      <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <UploadCloud className="w-6 h-6" />
        )}
      </div>

      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
        Upload your Business Dataset
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Drag & drop standard CSV or Excel (.xlsx) files up to 50 MB
      </p>

      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm cursor-pointer transition-colors">
        <FileSpreadsheet className="w-4 h-4" />
        Browse Computer
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleChange}
          disabled={isLoading}
          className="hidden"
        />
      </label>
    </div>
  );
}
