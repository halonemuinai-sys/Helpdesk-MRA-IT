import React from 'react';
import { DollarSign, ShieldCheck, Wallet, Activity } from 'lucide-react';

export default function RentalKpiStats({
  grandTotalCost, grandTotalBudget, grandTotalDifference,
  grandTotalDevices, grandTotalUtilization,
  formatCurrency, formatNumber,
  className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
}) {
  return (
    <div className={className}>

      <div className="glass-card glow-border rounded-3xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider">Total Biaya (Proyeksi)</span>
          <div className="p-2 bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 rounded-xl">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-black text-slate-850 dark:text-slate-100 font-mono tracking-tight">
            {formatCurrency(grandTotalCost)}
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase mt-1">12 Bulan Proyeksi</p>
        </div>
      </div>

      <div className="glass-card glow-border rounded-3xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-455 dark:text-slate-400 uppercase tracking-wider">Batas Anggaran (Budget)</span>
          <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 rounded-xl">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-black text-slate-850 dark:text-slate-100 font-mono tracking-tight">
            {formatCurrency(grandTotalBudget)}
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase mt-1">
            Rp {formatNumber(grandTotalBudget / 12)} / Bulan
          </p>
        </div>
      </div>

      <div className="glass-card glow-border rounded-3xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-455 dark:text-slate-400 uppercase tracking-wider">Sisa Anggaran</span>
          <div className={`p-2 rounded-xl ${grandTotalDifference >= 0 ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-500'}`}>
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className={`text-xl font-black font-mono tracking-tight ${grandTotalDifference >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-455'}`}>
            {grandTotalDifference >= 0 ? '+' : '-'}{formatCurrency(Math.abs(grandTotalDifference))}
          </h3>
          <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mt-1.5 ${grandTotalDifference >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
            {grandTotalDifference >= 0 ? 'Hemat / Under' : 'Over Budget'}
          </span>
        </div>
      </div>

      <div className="glass-card glow-border rounded-3xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-455 dark:text-slate-400 uppercase tracking-wider">Kepadatan Perangkat</span>
          <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 rounded-xl">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl font-black text-slate-850 dark:text-slate-100 font-mono tracking-tight">
            {grandTotalDevices} Perangkat
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase mt-1">
            {Math.round(grandTotalUtilization)}% Utilitas Budget
          </p>
        </div>
      </div>

    </div>
  );
}
