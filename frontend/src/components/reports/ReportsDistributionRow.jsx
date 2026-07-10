import React from 'react';
import { AlertTriangle, Layers, Cpu } from 'lucide-react';

const STATUS_BAR = {
  OPEN: 'bg-blue-500',
  IN_PROGRESS: 'bg-amber-500',
  PENDING: 'bg-slate-400',
  RESOLVED: 'bg-emerald-500',
  CLOSED: 'bg-gray-500',
};

const STATUS_TEXT = {
  OPEN: 'text-blue-500 dark:text-blue-400',
  IN_PROGRESS: 'text-amber-500 dark:text-amber-400',
  PENDING: 'text-slate-400 dark:text-slate-350',
  RESOLVED: 'text-emerald-500 dark:text-emerald-400',
  CLOSED: 'text-gray-500 dark:text-gray-400',
};

const PRIORITY_BAR = {
  LOW: 'bg-emerald-500',
  MEDIUM: 'bg-amber-500',
  HIGH: 'bg-rose-500',
  CRITICAL: 'bg-red-650 animate-pulse',
};

const PRIORITY_TEXT = {
  LOW: 'text-emerald-600 dark:text-emerald-450',
  MEDIUM: 'text-amber-600 dark:text-amber-450',
  HIGH: 'text-rose-600 dark:text-rose-455',
  CRITICAL: 'text-red-600 dark:text-red-400 font-extrabold',
};

export default function ReportsDistributionRow({ data }) {
  const total = data.totalTickets || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Box A: Status Breakdown */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between min-h-[340px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up-fade delay-5 opacity-0">
        <div>
          <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-500" />
            <span>Ticket Status Distribution</span>
          </h4>
          <div className="space-y-3.5">
            {Object.entries(data.status).map(([statusKey, count]) => {
              const percent = Math.round((count / total) * 100);
              return (
                <div key={statusKey} className="text-xs font-semibold space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500 dark:text-slate-450 font-bold">{statusKey}</span>
                    <span className={STATUS_TEXT[statusKey] || 'text-gray-500'}>{count} tickets ({percent}%)</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-slate-800/50 rounded-full overflow-hidden relative border border-gray-200/10">
                    <div
                      className={`h-full ${STATUS_BAR[statusKey] || 'bg-gray-400'} rounded-full animate-grow-width`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Box B: Priority Breakdown */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between min-h-[340px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up-fade delay-6 opacity-0">
        <div>
          <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-brand-500" />
            <span>Ticket Priority Breakdown</span>
          </h4>
          <div className="space-y-4">
            {Object.entries(data.priorities).map(([priorityKey, count]) => {
              const percent = Math.round((count / total) * 100);
              return (
                <div key={priorityKey} className="text-xs font-semibold space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500 dark:text-slate-450 font-bold">{priorityKey}</span>
                    <span className={PRIORITY_TEXT[priorityKey]}>{count} tickets ({percent}%)</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-slate-800/50 rounded-full overflow-hidden relative border border-gray-200/10">
                    <div
                      className={`h-full ${PRIORITY_BAR[priorityKey] || 'bg-gray-400'} rounded-full animate-grow-width`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Box C: Category Breakdown */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between min-h-[340px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up-fade delay-7 opacity-0">
        <div>
          <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand-500" />
            <span>Issue Type Distribution (Categories)</span>
          </h4>
          <div className="space-y-4">
            {Object.entries(data.categories).map(([catKey, count]) => {
              const percent = Math.round((count / total) * 100);
              return (
                <div key={catKey} className="text-xs font-semibold space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500 dark:text-slate-450 font-bold">{catKey}</span>
                    <span className="text-brand-600 dark:text-brand-400">{count} tickets ({percent}%)</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-slate-800/50 rounded-full overflow-hidden relative border border-gray-200/10">
                    <div className="h-full bg-brand-500 rounded-full animate-grow-width" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
