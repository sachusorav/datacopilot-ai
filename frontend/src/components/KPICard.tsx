import React from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Users, FileText } from 'lucide-react';
import { KPICardData } from '../lib/api';

interface KPICardProps {
  card: KPICardData;
}

export const KPICard: React.FC<KPICardProps> = ({ card }) => {
  const getIcon = () => {
    const t = card.title.toLowerCase();
    if (t.includes('revenue') || t.includes('sales') || t.includes('price')) return <DollarSign className="w-5 h-5 text-emerald-500" />;
    if (t.includes('order') || t.includes('bag')) return <ShoppingBag className="w-5 h-5 text-blue-500" />;
    if (t.includes('customer') || t.includes('user')) return <Users className="w-5 h-5 text-indigo-500" />;
    if (t.includes('average') || t.includes('value')) return <TrendingUp className="w-5 h-5 text-amber-500" />;
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {card.title}
        </span>
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {getIcon()}
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {card.value}
        </h3>
        {card.change && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {card.change}
          </span>
        )}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
        {card.subtext}
      </p>
    </div>
  );
};
