import React from 'react';
import { Receipt, DollarSign, Wrench, Package, CheckCircle2 } from 'lucide-react';

export default function PeripheralKpiStats({ stats, formatRupiah }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

      <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Invoice</p>
          <h3 className="text-xl font-black text-gray-800 dark:text-slate-100 mt-1">{stats.totalInvoices || 0} Invoice</h3>
          <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">Dari vendor/supplier</p>
        </div>
        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-xl flex items-center justify-center font-outfit">
          <Receipt className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Pengeluaran</p>
          <h3 className="text-md font-black text-rose-500 dark:text-rose-455 mt-1.5 truncate max-w-[140px]">{formatRupiah(stats.totalInvoiceBudget)}</h3>
          <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">Termasuk Jasa & Pajak</p>
        </div>
        <div className="w-9 h-9 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-455 rounded-xl flex items-center justify-center">
          <DollarSign className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Biaya Jasa</p>
          <h3 className="text-md font-black text-amber-500 dark:text-amber-400 mt-1.5 truncate max-w-[140px]">{formatRupiah(stats.totalServiceBudget)}</h3>
          <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">Jasa Instalasi & Setting</p>
        </div>
        <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-455 rounded-xl flex items-center justify-center">
          <Wrench className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Unit Item</p>
          <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.totalQuantity} Unit</h3>
          <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">Stok & Terpasang</p>
        </div>
        <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-455 rounded-xl flex items-center justify-center">
          <Package className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Stok Gudang (Ready)</p>
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-450 mt-1">{stats.stockQuantity} Unit</h3>
          <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">Siap Dialokasikan</p>
        </div>
        <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-455 rounded-xl flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      </div>

    </div>
  );
}
