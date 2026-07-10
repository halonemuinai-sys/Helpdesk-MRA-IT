import React from 'react';
import { ArrowUpRight, Building2 } from 'lucide-react';
import { MONTH_NAMES } from './constants';

export default function RentalMonthlyTable({ companyStats, monthlyTotals, formatNumber, formatCurrency, onOpenBreakdown }) {
  return (
    <div className="glass-card rounded-3xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Matriks Anggaran Bulanan</h3>
          <p className="text-[10px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">Detail biaya bulanan per badan usaha dalam Rupiah (IDR)</p>
        </div>
        <span className="text-[9px] text-rose-500 font-black px-2.5 py-1 bg-rose-500/10 rounded-xl uppercase tracking-wider">Unit: Rupiah</span>
      </div>
      <div className="overflow-x-auto custom-scroll">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-gray-500 dark:text-slate-450 border-b border-slate-100 dark:border-slate-850 font-black uppercase tracking-wider text-[9px]">
              <th className="py-4.5 px-5 min-w-[240px]">Unit Bisnis</th>
              {MONTH_NAMES.map(m => (
                <th key={m} className="py-4.5 px-3 text-right">{m}</th>
              ))}
              <th className="py-4.5 px-5 text-right bg-rose-500/[0.02] dark:bg-rose-500/[0.01]">Total Proyeksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60">
            {companyStats.map(comp => (
              <tr key={comp.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors duration-150">
                <td className="py-4 px-5 font-bold">
                  <button
                    onClick={() => onOpenBreakdown(comp)}
                    className="hover:text-rose-500 text-left focus:outline-none flex items-center gap-2 group"
                    title="Lihat Detail Aset Sewa"
                  >
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-rose-500/10 group-hover:text-rose-500 transition duration-150">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[12px] text-slate-800 dark:text-slate-200 font-bold tracking-tight">{comp.name}</span>
                    <ArrowUpRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition duration-150" />
                  </button>
                </td>
                {comp.monthlyCosts.map((cost, idx) => (
                  <td key={idx} className="py-4 px-3 text-right font-mono font-bold text-slate-600 dark:text-slate-350">
                    {cost > 0 ? formatNumber(cost) : <span className="text-gray-300 dark:text-slate-800">-</span>}
                  </td>
                ))}
                <td className="py-4 px-5 text-right font-black text-slate-800 dark:text-slate-100 font-mono text-[12px] bg-rose-500/[0.02] dark:bg-rose-500/[0.01]">
                  {formatCurrency(comp.totalCost)}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50/50 dark:bg-slate-950/20 font-bold border-t-2 border-slate-200 dark:border-slate-800">
              <td className="py-4 px-5 font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[10px]">TOTAL BULANAN</td>
              {monthlyTotals.map((tot, idx) => (
                <td key={idx} className="py-4 px-3 text-right font-extrabold text-slate-800 dark:text-slate-100 font-mono text-[12px]">
                  {tot > 0 ? formatNumber(tot) : '-'}
                </td>
              ))}
              <td className="py-4 px-5 text-right font-black text-rose-500 text-sm font-mono bg-rose-500/5 dark:bg-rose-500/10">
                {formatCurrency(companyStats.reduce((sum, c) => sum + c.totalCost, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
