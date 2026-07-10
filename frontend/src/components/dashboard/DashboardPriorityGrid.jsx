import React from 'react';

const PRIORITY_COLORS = {
  CRITICAL: 'text-red-700 bg-red-50/50 border-red-150 border-l-4 border-l-red-500 hover:bg-red-100/40 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/30 animate-pulse-glow',
  HIGH:     'text-orange-700 bg-orange-50/40 border-orange-150 border-l-4 border-l-orange-500 hover:bg-orange-100/40 dark:bg-orange-950/20 dark:border-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-950/30',
  MEDIUM:   'text-amber-700 bg-amber-50/40 border-amber-150 border-l-4 border-l-amber-500 hover:bg-amber-100/40 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-950/30',
  LOW:      'text-emerald-700 bg-emerald-50/40 border-emerald-150 border-l-4 border-l-emerald-500 hover:bg-emerald-100/40 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-950/30',
};

export default function DashboardPriorityGrid({ analytics }) {
  return (
    <div className="stagger-3 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm hover:shadow-md transition-all duration-300">
      <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-5">Tickets by Priority</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(analytics.priorities).map(([priorityKey, count]) => (
          <div
            key={priorityKey}
            className={`p-3 rounded-xl border text-center transition-all duration-200 hover:scale-[1.03] cursor-pointer ${PRIORITY_COLORS[priorityKey] || 'bg-gray-50'}`}
          >
            <p className="text-[9px] font-black uppercase tracking-wider">{priorityKey}</p>
            <h4 className="text-xl font-black mt-1.5">{count}</h4>
            <p className="text-[8px] mt-0.5 opacity-70">Registered</p>
          </div>
        ))}
      </div>
    </div>
  );
}
