import React from 'react';
import { TrendingUp, Tag, Building2, Receipt, Loader2 } from 'lucide-react';
import PendingProcessPlaceholder from '../PendingProcessPlaceholder';

export default function PeripheralAnalysisTab({ analysisData, stats, formatRupiah, analysisLoaded, loading }) {
  if (!analysisLoaded && !loading) {
    return (
      <PendingProcessPlaceholder
        title="Proses Analisa Biaya"
        description={'Klik tombol "Proses / Muat Data" di atas untuk menampilkan analisa biaya pembelian periferal.'}
      />
    );
  }

  if (!analysisLoaded) {
    return (
      <div className="glass-panel rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        <span className="text-xs text-gray-500 font-semibold">Memuat Analisa Biaya...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 hover:shadow-md transition">
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Rata-rata Biaya Invoice</p>
          <h3 className="text-lg font-black text-rose-500 mt-1 truncate">
            {formatRupiah(stats.totalInvoices > 0 ? Math.round(stats.totalInvoiceBudget / stats.totalInvoices) : 0)}
          </h3>
          <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-1">
            Total dari {stats.totalInvoices || 0} invoice terdaftar
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 hover:shadow-md transition">
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Kategori Pengeluaran Terbesar</p>
          <h3 className="text-lg font-black text-gray-800 dark:text-slate-100 mt-1 truncate">
            {analysisData.expensesByCategory?.[0]?.name || '-'}
          </h3>
          <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-1">
            Total: <span className="font-bold text-rose-500">{formatRupiah(analysisData.expensesByCategory?.[0]?.totalCost || 0)}</span>
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 hover:shadow-md transition">
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Entitas Pembayar Terbesar</p>
          <h3 className="text-lg font-black text-gray-800 dark:text-slate-100 mt-1 truncate">
            {analysisData.expensesByCompany?.[0]?.name || '-'}
          </h3>
          <p className="text-[9px] text-gray-455 dark:text-slate-500 font-semibold mt-1">
            Total: <span className="font-bold text-rose-500">{formatRupiah(analysisData.expensesByCompany?.[0]?.totalCost || 0)}</span>
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 hover:shadow-md transition">
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Supplier/Vendor Terbesar</p>
          <h3 className="text-lg font-black text-gray-800 dark:text-slate-100 mt-1 truncate">
            {analysisData.expensesBySupplier?.[0]?.name || '-'}
          </h3>
          <p className="text-[9px] text-gray-455 dark:text-slate-500 font-semibold mt-1">
            Total: <span className="font-bold text-rose-500">{formatRupiah(analysisData.expensesBySupplier?.[0]?.totalCost || 0)}</span>
          </p>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      {analysisData.monthlyTrend && analysisData.monthlyTrend.length > 0 ? (
        <div className="flex flex-col items-stretch bg-white/80 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-rose-500" />
              <span>Tren Pengeluaran Bulanan</span>
            </h3>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Hover batang untuk rincian detail
            </span>
          </div>

          <div className="relative h-64 flex items-end justify-between gap-2 pt-6 border-b border-gray-200 dark:border-slate-800 pb-1">
            {analysisData.monthlyTrend.map((item) => {
              const maxCost = analysisData.monthlyTrend.reduce((max, x) => Math.max(max, x.totalCost), 0) || 1;
              const heightPct = (item.totalCost / maxCost) * 90;
              const [yr, mo] = item.yearMonth.split('-');
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
              const formattedLabel = `${monthNames[parseInt(mo, 10) - 1]} ${yr.slice(2)}`;

              return (
                <div key={item.yearMonth} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-955 text-white dark:bg-white dark:text-slate-955 p-3 rounded-xl shadow-xl border border-slate-800 dark:border-gray-200 text-[10px] space-y-1 z-30 w-44 font-semibold -translate-x-1/2 left-1/2 animate-fade-in pointer-events-none">
                    <div className="font-extrabold border-b border-slate-800 dark:border-gray-150 pb-1 text-center text-xs text-rose-500">
                      {formattedLabel}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-400 dark:text-gray-500">Total Pengeluaran:</span>
                      <span className="font-bold">{formatRupiah(item.totalCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-gray-500">Biaya Jasa/Instalasi:</span>
                      <span className="font-bold text-amber-500">{formatRupiah(item.serviceCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-gray-500">Jumlah Unit Beli:</span>
                      <span className="font-bold text-blue-500">{item.quantity} Unit</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-t-lg h-48 flex items-end overflow-hidden">
                    <div
                      className="w-full bg-gradient-to-t from-rose-600 to-rose-400 hover:from-rose-500 hover:to-rose-300 rounded-t-lg transition-all duration-300 shadow-lg group-hover:shadow-rose-500/20"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-gray-450 dark:text-slate-500 mt-2 block whitespace-nowrap">
                    {formattedLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/55 dark:border-slate-800/40 text-center text-xs text-gray-450 font-semibold italic">
          Belum ada data tren bulanan yang tercatat.
        </div>
      )}

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Category Breakdown */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 space-y-4">
          <h3 className="font-bold text-xs text-gray-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-slate-800">
            <Tag className="w-4 h-4 text-rose-500" />
            <span>Pengeluaran per Kategori</span>
          </h3>
          {analysisData.expensesByCategory && analysisData.expensesByCategory.length > 0 ? (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {(() => {
                const total = analysisData.expensesByCategory.reduce((s, i) => s + i.totalCost, 0) || 1;
                return analysisData.expensesByCategory.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700 dark:text-slate-200">{item.name} ({item.quantity} Unit)</span>
                      <span className="text-gray-900 dark:text-white font-extrabold">{formatRupiah(item.totalCost)}</span>
                    </div>
                    <div className="w-full bg-gray-150 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${(item.totalCost / total) * 100}%` }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <p className="text-center text-xs text-gray-455 italic py-6">Tidak ada data kategori.</p>
          )}
        </div>

        {/* Company Breakdown */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 space-y-4">
          <h3 className="font-bold text-xs text-gray-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-slate-800">
            <Building2 className="w-4 h-4 text-rose-500" />
            <span>Pengeluaran per Entitas</span>
          </h3>
          {analysisData.expensesByCompany && analysisData.expensesByCompany.length > 0 ? (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {(() => {
                const total = analysisData.expensesByCompany.reduce((s, i) => s + i.totalCost, 0) || 1;
                return analysisData.expensesByCompany.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700 dark:text-slate-200">{item.name} ({item.invoicesCount} Invoice)</span>
                      <span className="text-gray-900 dark:text-white font-extrabold">{formatRupiah(item.totalCost)}</span>
                    </div>
                    <div className="w-full bg-gray-150 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${(item.totalCost / total) * 100}%` }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <p className="text-center text-xs text-gray-455 italic py-6">Tidak ada data entitas.</p>
          )}
        </div>

        {/* Supplier Breakdown */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 space-y-4">
          <h3 className="font-bold text-xs text-gray-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-slate-800">
            <Receipt className="w-4 h-4 text-rose-500" />
            <span>Pengeluaran per Supplier</span>
          </h3>
          {analysisData.expensesBySupplier && analysisData.expensesBySupplier.length > 0 ? (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {(() => {
                const total = analysisData.expensesBySupplier.reduce((s, i) => s + i.totalCost, 0) || 1;
                return analysisData.expensesBySupplier.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700 dark:text-slate-200">{item.name} ({item.invoicesCount} Invoice)</span>
                      <span className="text-gray-900 dark:text-white font-extrabold">{formatRupiah(item.totalCost)}</span>
                    </div>
                    <div className="w-full bg-gray-150 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${(item.totalCost / total) * 100}%` }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <p className="text-center text-xs text-gray-455 italic py-6">Tidak ada data supplier.</p>
          )}
        </div>

      </div>
    </div>
  );
}
