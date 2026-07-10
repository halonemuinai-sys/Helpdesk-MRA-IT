import React from 'react';
import { Laptop, Code2, Wifi, Lock, Database, Activity } from 'lucide-react';

const CATEGORY_CONFIG = {
  Hardware: { icon: Laptop, color: 'text-blue-600 dark:text-blue-400' },
  Software: { icon: Code2, color: 'text-indigo-650 dark:text-indigo-400' },
  Network:  { icon: Wifi, color: 'text-emerald-600 dark:text-emerald-450' },
  Access:   { icon: Lock, color: 'text-amber-600 dark:text-amber-400' },
  ERP:      { icon: Database, color: 'text-purple-650 dark:text-purple-400' },
};

export default function DashboardCategoryChart({ analytics }) {
  const total = analytics.totalTickets || 1;

  return (
    <div className="stagger-3 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 border-l-4 border-l-brand-500 shadow-sm hover:shadow-md transition-all duration-300">
      <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-4">Issue Category</h4>
      <div className="flex flex-col">
        {Object.entries(analytics.categories).map(([catKey, count], idx, arr) => {
          const percentage = Math.round((count / total) * 100);
          const config = CATEGORY_CONFIG[catKey] || { icon: Activity, color: 'text-slate-500 dark:text-slate-400' };
          const IconComponent = config.icon;
          return (
            <div
              key={catKey}
              className={`flex items-center justify-between py-3 ${idx !== arr.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/40' : ''}`}
            >
              <div className="flex items-center gap-3">
                <IconComponent className={`w-5 h-5 shrink-0 ${config.color}`} />
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{catKey}</span>
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
                {count} tickets ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
