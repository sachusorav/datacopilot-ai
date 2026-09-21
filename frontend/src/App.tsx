import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { UploadPage } from './pages/UploadPage';
import { DashboardPage } from './pages/DashboardPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { ChatPage } from './pages/ChatPage';
import { ReportsPage } from './pages/ReportsPage';
import { DatasetUploadResponse, CleanResponse } from './lib/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard' | 'predictions' | 'chat' | 'reports'>('upload');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [isCleaned, setIsCleaned] = useState<boolean>(false);
  const [totalRows, setTotalRows] = useState<number | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleDatasetLoaded = (data: DatasetUploadResponse, cleanData?: CleanResponse) => {
    setDatasetId(data.dataset_id);
    setFilename(data.filename);
    setTotalRows(data.total_rows);
    if (cleanData) {
      setIsCleaned(cleanData.is_cleaned);
      if (cleanData.summary) {
        setTotalRows(cleanData.summary.rows_after_cleaning);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        datasetId={datasetId}
        filename={filename}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          filename={filename}
          datasetId={datasetId}
          isCleaned={isCleaned}
          totalRows={totalRows}
          onNavigateToUpload={() => setActiveTab('upload')}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'upload' && (
            <UploadPage onDatasetLoaded={handleDatasetLoaded} />
          )}

          {activeTab === 'dashboard' && (
            <DashboardPage
              datasetId={datasetId}
              darkMode={darkMode}
              onNavigateToUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'predictions' && (
            <PredictionsPage
              datasetId={datasetId}
              darkMode={darkMode}
              onNavigateToUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'chat' && (
            <ChatPage datasetId={datasetId} filename={filename} />
          )}

          {activeTab === 'reports' && (
            <ReportsPage datasetId={datasetId} filename={filename} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
