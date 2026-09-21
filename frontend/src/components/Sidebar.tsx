import React from 'react';
import { 
  Upload, 
  LayoutDashboard, 
  TrendingUp, 
  MessageSquareText, 
  FileSpreadsheet, 
  Sun, 
  Moon, 
  Sparkles,
  Database
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'upload' | 'dashboard' | 'predictions' | 'chat' | 'reports';
  setActiveTab: (tab: 'upload' | 'dashboard' | 'predictions' | 'chat' | 'reports') => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  datasetId: string | null;
  filename: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  datasetId,
  filename
}) => {
  const navItems = [
    { id: 'upload', label: 'Data Upload', icon: Upload },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'predictions', label: 'ML Predictions', icon: TrendingUp },
    { id: 'chat', label: 'AI Data Chat', icon: MessageSquareText },
    { id: 'reports', label: 'PDF Reports', icon: FileSpreadsheet },
  ] as const;

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between h-screen sticky top-0 z-30 transition-colors">
      <div>
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <img
            src="/logo.png"
            alt="DataCopilot AI"
            className="h-10 w-auto object-contain"
          />
        </div>

        {/* Active Dataset Status Badge */}
        <div className="mx-4 my-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Database className="w-3.5 h-3.5 text-blue-500" />
            <span>Active Dataset</span>
          </div>
          {filename ? (
            <div className="mt-1 font-medium text-xs text-slate-800 dark:text-slate-200 truncate">
              {filename}
            </div>
          ) : (
            <div className="mt-1 text-xs text-slate-400 dark:text-slate-500 italic">
              No dataset loaded
            </div>
          )}
        </div>

        {/* Navigation items */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dark / Light Mode Toggle Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <span className="flex items-center gap-2">
            {darkMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Toggle</span>
        </button>
      </div>
    </aside>
  );
};
