import React from 'react';
import { Search, Building2, Clock, Loader2 } from 'lucide-react';
import { CATEGORIES } from './constants';

export default function SubscriptionFilterBar({
  searchQuery, setSearchQuery,
  selectedCategory, setSelectedCategory,
  selectedCompanyMasterId, setSelectedCompanyMasterId,
  selectedStatus, setSelectedStatus,
  companies, loading,
  onProcess, onReset,
}) {
  return (
    <div className="glass-panel p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-gray-250/60 dark:border-slate-800/60 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">

        {/* Search */}
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
          <input
            type="text"
            placeholder="Cari Layanan, Vendor, IP, Akun..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 px-3 py-2.5 rounded-xl w-full md:w-48">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 px-3 py-2.5 rounded-xl w-full md:w-56">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedCompanyMasterId}
              onChange={(e) => setSelectedCompanyMasterId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
            >
              <option value="">Semua Perusahaan</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 px-3 py-2.5 rounded-xl w-full md:w-44">
            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="EXPIRED">Kedaluwarsa</option>
              <option value="INACTIVE">Arsip / Inaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end items-center gap-3 pt-2 border-t border-gray-150 dark:border-slate-850/60">
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 border border-gray-250 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-655 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
        >
          Clear Filters
        </button>
        <button
          type="button"
          onClick={onProcess}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-500/10 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span>Process & Load Subscriptions</span>
        </button>
      </div>
    </div>
  );
}
