import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import FileUploader from './components/FileUploader';
import AuthPage from './pages/AuthPage';
import OverviewPage from './pages/OverviewPage';
import DashboardPage from './pages/DashboardPage';
import PredictionsPage from './pages/PredictionsPage';
import ChatPage from './pages/ChatPage';
import ChartBuilderPage from './pages/ChartBuilderPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import { uploadAPI, authAPI } from './lib/api';
import { X, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [datasets, setDatasets] = useState([]);
  const [activeDatasetId, setActiveDatasetId] = useState(null);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('datacopilot_theme') || 'system');
  const [toast, setToast] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Apply Theme Mode (Dark/Light/System)
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    localStorage.setItem('datacopilot_theme', theme);
  }, [theme]);

  // Check auth user status on load
  useEffect(() => {
    authAPI.getMe()
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0] || null;

  const showToastNotification = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    try {
      const res = await uploadAPI.uploadFile(file);
      const newDataset = {
        id: res.data.dataset_id,
        filename: res.data.filename,
        total_rows: res.data.total_rows,
        total_columns: res.data.total_columns,
        columns_info: res.data.columns_info,
      };
      setDatasets((prev) => [newDataset, ...prev]);
      setActiveDatasetId(newDataset.id);
      setShowUploadModal(false);
      showToastNotification(`Successfully ingested ${file.filename}!`, 'success');
    } catch (err) {
      showToastNotification(err.response?.data?.detail || 'Failed to upload dataset.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDataset = (id) => {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    if (activeDatasetId === id) {
      setActiveDatasetId(null);
    }
    showToastNotification('Dataset removed.', 'info');
  };

  const handleLogout = () => {
    localStorage.removeItem('datacopilot_token');
    setUser(null);
    showToastNotification('Signed out.', 'info');
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage dataset={activeDataset} />;
      case 'dashboard':
        return <DashboardPage dataset={activeDataset} />;
      case 'predictions':
        return <PredictionsPage dataset={activeDataset} />;
      case 'chat':
        return <ChatPage dataset={activeDataset} />;
      case 'chart-builder':
        return <ChartBuilderPage dataset={activeDataset} />;
      case 'reports':
        return <ReportsPage dataset={activeDataset} />;
      case 'settings':
        return (
          <SettingsPage
            theme={theme}
            onThemeChange={setTheme}
            activeDataset={activeDataset}
            datasets={datasets}
            onDeleteDataset={handleDeleteDataset}
          />
        );
      default:
        return <OverviewPage dataset={activeDataset} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeDataset={activeDataset}
        datasets={datasets}
        onSelectDataset={setActiveDatasetId}
        onNewUpload={() => setShowUploadModal(true)}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          pageTitle={activeTab.replace('-', ' ').toUpperCase()}
          activeDataset={activeDataset}
          theme={theme}
          onThemeChange={setTheme}
          onNewUpload={() => setShowUploadModal(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {renderActiveTabContent()}
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Upload New Business Dataset
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <FileUploader onFileUpload={handleFileUpload} isLoading={uploading} />
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
