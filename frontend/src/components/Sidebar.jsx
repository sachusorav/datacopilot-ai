import React from 'react';
import Logo from './Logo';
import {
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  MessageSquareText,
  FileBarChart,
  Settings as SettingsIcon,
  BarChart2,
  FolderOpen,
  PlusCircle,
  LogOut,
  UserCheck
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onTabChange,
  activeDataset,
  datasets = [],
  onSelectDataset,
  onNewUpload,
  user,
  onLogout
}) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
    { id: 'chat', label: 'Ask Data', icon: MessageSquareText },
    { id: 'chart-builder', label: 'Chart Builder', icon: Sparkles },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-60 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between h-screen sticky top-0 z-30">
      <div className="p-4 space-y-6">
        <div className="px-2">
          <Logo size="md" showTagline={true} />
        </div>

        {/* Dataset Switcher */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 px-2">
            <span>Datasets</span>
            <button
              onClick={onNewUpload}
              title="Upload New Dataset"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
          {datasets.length > 0 ? (
            <select
              value={activeDataset?.id || ''}
              onChange={(e) => onSelectDataset(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename}
                </option>
              ))}
            </select>
          ) : (
            <button
              onClick={onNewUpload}
              className="w-full text-left px-2.5 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg font-medium flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Upload Dataset
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer User Info */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        {user ? (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <UserCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{user.email}</span>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-500 transition-colors p-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-medium">Guest Mode (Local)</div>
        )}
      </div>
    </aside>
  );
}
