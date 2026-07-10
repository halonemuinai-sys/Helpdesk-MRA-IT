import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

export default function SubscriptionKpiStats({ activeSubs, nearExpiryCount, expiredCount, estMonthlyBudget, formatRupiah }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

      <div className="group bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900/60 dark:to-emerald-950/15 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-400/40 transition duration-300">
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Layanan Aktif</p>
          <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{activeSubs.length} Kontrak</h3>
        </div>
        <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      <div className={`group bg-gradient-to-br from-white to-amber-50/20 dark:from-slate-900/60 dark:to-amber-950/15 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition duration-300 ${nearExpiryCount > 0 ? 'border-amber-300/60 dark:border-amber-800/60' : ''}`}>
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Segera Habis (&lt;30 Hari)</p>
          <h3 className={`text-2xl font-extrabold mt-2 ${nearExpiryCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-slate-350'}`}>
            {nearExpiryCount} Layanan
          </h3>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${nearExpiryCount > 0 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500 animate-pulse' : 'bg-gray-50 dark:bg-slate-800/40 text-gray-400'}`}>
          <Clock className="w-5 h-5" />
        </div>
      </div>

      <div className={`group bg-gradient-to-br from-white to-red-50/20 dark:from-slate-900/60 dark:to-red-950/15 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition duration-300 ${expiredCount > 0 ? 'border-red-300/60 dark:border-red-800/60' : ''}`}>
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Kadaluwarsa</p>
          <h3 className={`text-2xl font-extrabold mt-2 ${expiredCount > 0 ? 'text-red-650 dark:text-red-400' : 'text-gray-600 dark:text-slate-350'}`}>
            {expiredCount} Kontrak
          </h3>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${expiredCount > 0 ? 'bg-red-50 dark:bg-red-950/40 text-red-500 animate-bounce' : 'bg-gray-50 dark:bg-slate-800/40 text-gray-400'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      <div className="group bg-gradient-to-br from-white to-cyan-50/20 dark:from-slate-900/60 dark:to-cyan-950/15 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md hover:border-cyan-400/40 transition duration-300">
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Estimasi Anggaran Bulanan</p>
          <h3 className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-2">{formatRupiah(Math.round(estMonthlyBudget))}</h3>
        </div>
        <div className="w-11 h-11 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

    </div>
  );
}
