import React from 'react';
import { Laptop, User, CheckCircle2, Clock, DollarSign, ShieldAlert } from 'lucide-react';

export default function AssetKpiStats({ kpiStats, formatRupiah }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">

      <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 hover:border-blue-500/30 hover-glow-blue transition-all duration-300 shadow-sm stagger-1">
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Aset IT</p>
          <h3 className="text-xl font-black text-gray-800 dark:text-slate-100 mt-1">{kpiStats.totalAssets} Unit</h3>
          <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">
            ({kpiStats.rentalCount} Sewa, {kpiStats.ownedCount} Milik)
          </p>
        </div>
        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-xl flex items-center justify-center">
          <Laptop className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 hover:border-blue-500/30 hover-glow-blue transition-all duration-300 shadow-sm stagger-2">
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Dipakai Karyawan</p>
          <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{kpiStats.assignedCount} Unit</h3>
        </div>
        <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 hover:border-emerald-500/30 hover-glow-emerald transition-all duration-300 shadow-sm stagger-3">
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Tersedia (Ready)</p>
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{kpiStats.availableCount} Unit</h3>
        </div>
        <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 hover:border-amber-500/30 hover-glow-cyan transition-all duration-300 shadow-sm stagger-4">
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Dalam Servis</p>
          <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{kpiStats.maintenanceCount} Unit</h3>
        </div>
        <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
          <Clock className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 hover:border-rose-500/30 hover-glow-red transition-all duration-300 shadow-sm stagger-5">
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Anggaran Sewa Bulanan</p>
          <h3 className="text-md font-black text-rose-500 dark:text-rose-455 mt-1.5 truncate max-w-[140px]">{formatRupiah(kpiStats.totalMonthlyRental)}</h3>
          <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">Khusus perangkat Sewa</p>
        </div>
        <div className="w-9 h-9 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-455 rounded-xl flex items-center justify-center">
          <DollarSign className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 hover:border-red-500/30 hover-glow-red transition-all duration-300 shadow-sm stagger-6">
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Masa Sewa Habis</p>
          <h3 className="text-xl font-black text-rose-600 dark:text-rose-455 mt-1">{kpiStats.expiredLeasesCount} Unit</h3>
          <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">
            ({kpiStats.nearExpiryLeasesCount} Akan Habis &lt; 30 hari)
          </p>
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpiStats.expiredLeasesCount > 0 ? 'bg-red-50 dark:bg-red-950/40 text-red-655' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'}`}>
          <ShieldAlert className="w-4 h-4" />
        </div>
      </div>

    </div>
  );
}
