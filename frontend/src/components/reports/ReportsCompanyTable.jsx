import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function ReportsCompanyTable({ data }) {
  const total = data.totalTickets || 1;

  return (
    <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up-fade delay-8 opacity-0">
      <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
        <TrendingUp className="w-5 h-5 text-brand-500 animate-pulse" />
        <span>Client Company Distribution Data (MRA Group)</span>
      </h4>

      {Object.keys(data.companies).length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-500 dark:text-slate-500">
          No ticket data for registered companies in this period.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Subsidiary Company</th>
                <th className="py-3 px-4 text-center">Total Tickets</th>
                <th className="py-3 px-4">Volume Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-gray-700 dark:text-slate-300">
              {Object.entries(data.companies)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => {
                  const pct = Math.round((count / total) * 100);
                  return (
                    <tr key={name} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-800 dark:text-slate-200">{name}</td>
                      <td className="py-3 px-4 text-center text-brand-600 dark:text-brand-400 font-extrabold text-sm">{count}</td>
                      <td className="py-3 px-4 w-1/2">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full animate-grow-width" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-right text-[10px] font-bold text-gray-500">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
