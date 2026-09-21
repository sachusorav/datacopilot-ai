import React from 'react';
import { FileUploader } from '../components/FileUploader';
import { DatasetUploadResponse, CleanResponse } from '../lib/api';

interface UploadPageProps {
  onDatasetLoaded: (data: DatasetUploadResponse, cleanData?: CleanResponse) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onDatasetLoaded }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Data Upload & Automated Cleaning
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload your business CSV or Excel file to automatically clean duplicates, fill missing values, and build interactive intelligence.
        </p>
      </div>

      <FileUploader onDatasetLoaded={onDatasetLoaded} />
    </div>
  );
};
