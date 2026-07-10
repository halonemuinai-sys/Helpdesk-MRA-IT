import React from 'react';
import { Search, Laptop, Building2, Clock, Loader2, ChevronDown } from 'lucide-react';
import { STATUS_OPTIONS } from './constants';

export default function AssetFilterBar({
  searchQuery, setSearchQuery,
  selectedCategory, setSelectedCategory,
  selectedCompanyMasterId, setSelectedCompanyMasterId,
  selectedStatus, setSelectedStatus,
  companyMasters,
  loading,
  handleResetFilters,
  handleRefreshData,
}) {
  const hasActiveFilter = searchQuery || selectedStatus || selectedCompanyMasterId || selectedCategory;

  return (
    <div className="glass-panel p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-gray-250/60 dark:border-slate-800/60 space-y-4">

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
          <input
            type="text"
            placeholder="Cari Brand, Model, Tag Aset, NIP, LP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:flex gap-3 w-full md:w-auto">
          {/* Category */}
          <div className="relative flex items-center gap-2 bg-gray-50/70 dark:bg-slate-955/30 border border-gray-200 dark:border-slate-855/50 pl-3 pr-8 py-2.5 rounded-xl w-full md:w-40 group">
            <Laptop className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer appearance-none"
            >
              <option value="">Semua Kategori</option>
              <option value="LAPTOP">Laptop / PC</option>
              <option value="SMARTPHONE">Smartphone</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-455 dark:text-slate-500 absolute right-3 pointer-events-none group-hover:text-rose-500 transition-colors" />
          </div>

          {/* Company Master */}
          <div className="relative flex items-center gap-2 bg-gray-50/70 dark:bg-slate-955/30 border border-gray-200 dark:border-slate-855/50 pl-3 pr-8 py-2.5 rounded-xl w-full md:w-56 group">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedCompanyMasterId}
              onChange={(e) => setSelectedCompanyMasterId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer appearance-none"
            >
              <option value="">Semua Perusahaan Induk</option>
              {companyMasters.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-455 dark:text-slate-500 absolute right-3 pointer-events-none group-hover:text-rose-500 transition-colors" />
          </div>

          {/* Status */}
          <div className="relative flex items-center gap-2 bg-gray-50/70 dark:bg-slate-955/30 border border-gray-200 dark:border-slate-855/50 pl-3 pr-8 py-2.5 rounded-xl w-full md:w-48 group">
            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer appearance-none"
            >
              <option value="">Semua Status</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-455 dark:text-slate-500 absolute right-3 pointer-events-none group-hover:text-rose-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-150 dark:border-slate-800/60">
        {hasActiveFilter && (
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 border border-gray-250 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-350 text-xs font-bold rounded-xl transition"
          >
            Clear Filters
          </button>
        )}
        <button
          onClick={handleRefreshData}
          disabled={loading}
          className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
          Proses / Muat Data
        </button>
      </div>

    </div>
  );
}
