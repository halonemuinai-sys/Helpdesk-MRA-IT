import React from 'react';
import { CreditCard, Loader2, Search, History, RefreshCw, Edit2, Trash2, Link as LinkIcon } from 'lucide-react';

export default function SubscriptionTable({
  filteredSubs, expandedRows, toggleRow, now,
  formatRupiah, onEdit, onDelete, onReplace,
  hasProcessed, loading, onProcess,
}) {
  if (!hasProcessed) {
    return (
      <div className="glass-panel p-12 text-center rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 max-w-2xl mx-auto space-y-6 animate-scale-up mt-6">
        <div className="w-16 h-16 rounded-full bg-rose-50/50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
          <CreditCard className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-extrabold text-gray-800 dark:text-slate-100">Ready to Process Subscriptions</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            Sistem MRA Group melacak beberapa kontrak domain, hosting, dan lisensi IT. Silakan pilih kriteria filter di atas dan klik <strong>&quot;Process &amp; Load Subscriptions&quot;</strong> untuk menampilkan data.
          </p>
        </div>
        <button
          type="button"
          onClick={onProcess}
          disabled={loading}
          className="mx-auto flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-rose-500/15 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          <span>Process &amp; Load Subscriptions</span>
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden">
      {filteredSubs.length === 0 ? (
        <div className="py-16 text-center">
          <CreditCard className="w-12 h-12 text-gray-300 dark:text-slate-750 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Tidak ada layanan kontrak yang ditemukan.</p>
          <p className="text-xs text-gray-400 mt-1">Coba sesuaikan filter pencarian atau buat baru.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6">Layanan / Domain</th>
                <th className="py-4 px-6">Entitas Perusahaan</th>
                <th className="py-4 px-6">Kategori</th>
                <th className="py-4 px-6">Siklus</th>
                <th className="py-4 px-6">Biaya Kontrak</th>
                <th className="py-4 px-6">Tanggal Kedaluwarsa</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-700 dark:text-slate-300">
              {filteredSubs.map((sub) => {
                const isExpired = new Date(sub.expiryDate) < now && sub.status === 'ACTIVE';
                const isExpanded = !!expandedRows[sub.id];

                return (
                  <React.Fragment key={sub.id}>
                    <tr
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer"
                      onClick={() => toggleRow(sub.id)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-gray-800 dark:text-slate-100 text-xs truncate max-w-[200px]">{sub.name}</h4>
                            <p className="text-[10px] text-gray-400 font-medium truncate max-w-[180px]">Provider: {sub.vendor}</p>
                            {sub.contractNumber && (
                              <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold truncate max-w-[180px]">CID/Kontrak: {sub.contractNumber}</p>
                            )}
                            {sub.bandwidth && (
                              <p className="text-[9px] text-cyan-600 dark:text-cyan-400 font-bold truncate max-w-[180px]">⚡ Bandwidth: {sub.bandwidth}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-700 dark:text-slate-350">{sub.companyMaster?.name}</div>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {sub.authorizedCompanyMaster?.name && (
                            <span className="inline-block px-1.5 py-0.2 text-[9px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded">
                              Otorisasi: {sub.authorizedCompanyMaster.name}
                            </span>
                          )}
                          {sub.brand && (
                            <span className="inline-block px-1.5 py-0.2 text-[9px] font-semibold bg-rose-500/10 text-rose-500 rounded">
                              Brand: {sub.brand}
                            </span>
                          )}
                          {sub.location && (
                            <span className="inline-block px-1.5 py-0.2 text-[9px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded">
                              📍 {sub.location}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1">
                          <span className="inline-block bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300">
                            {sub.category}
                          </span>
                          {sub.isBudgeted === false && (
                            <span className="inline-block bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-extrabold" title="Diluar Anggaran Tahunan">
                              Unbudgeted
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400">{sub.billingCycle}</td>
                      <td className="py-4 px-6 font-mono font-bold">
                        <div className="text-gray-850 dark:text-slate-100">{formatRupiah(sub.cost)}</div>
                        {sub.currency === 'USD' && sub.costUSD && (
                          <div className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                            <span className="inline-block bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800/80">
                              ${sub.costUSD} (@ Rp {sub.exchangeRate ? sub.exchangeRate.toLocaleString('id-ID') : '-'})
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono">
                        <div>{new Date(sub.expiryDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                        {sub.status === 'ACTIVE' && (
                          <div className={`text-[9px] font-bold ${isExpired ? 'text-red-500' : 'text-slate-400'}`}>
                            {isExpired
                              ? 'Kadaluwarsa!'
                              : `${Math.ceil((new Date(sub.expiryDate) - now) / (1000 * 60 * 60 * 24))} hari sisa`}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          sub.status === 'ACTIVE' && !isExpired
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : isExpired || sub.status === 'EXPIRED'
                            ? 'bg-red-50 text-red-650 dark:bg-red-950/40 dark:text-red-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'ACTIVE' && !isExpired ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {sub.status === 'ACTIVE' && isExpired ? 'EXPIRED' : sub.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {sub.replacedSubscriptionId && (
                            <div className="p-1 text-cyan-500" title="Menggantikan kontrak lama">
                              <History className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <button
                            onClick={() => onReplace(sub)}
                            className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-600 hover:text-white rounded-md transition text-[9px] font-bold flex items-center gap-0.5"
                            title="Buat Kontrak Baru (Ganti Kontrak)"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            Ganti Kontrak
                          </button>
                          <button
                            onClick={() => onEdit(sub)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-rose-500 rounded-lg transition"
                            title="Perpanjang / Edit Detail"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(sub)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-red-500 rounded-lg transition"
                            title="Hapus Layanan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50/30 dark:bg-slate-900/15">
                        <td colSpan="8" className="p-5 border-t border-gray-100 dark:border-slate-850">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">

                            <div className="space-y-3.5">
                              <h5 className="font-extrabold text-[10px] uppercase text-gray-400 tracking-wider">Detail Konfigurasi</h5>
                              {sub.notes ? (
                                <div className="bg-white/80 dark:bg-slate-950/40 p-3 rounded-xl border border-gray-150 dark:border-slate-850 text-xs font-mono whitespace-pre-line text-slate-600 dark:text-slate-350">
                                  {sub.notes}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">Tidak ada catatan konfigurasi tambahan.</p>
                              )}
                              {sub.evidenceLink && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase">Evidence Kontrak:</span>
                                  <a
                                    href={sub.evidenceLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-bold"
                                  >
                                    <LinkIcon className="w-3.5 h-3.5" />
                                    Buka Tautan Lampiran
                                  </a>
                                </div>
                              )}
                              {sub.replacedSubscription && (
                                <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                                  <History className="w-3.5 h-3.5 text-cyan-500" />
                                  <span>Menggantikan kontrak: </span>
                                  <span className="font-bold text-slate-500">{sub.replacedSubscription.name} ({sub.replacedSubscription.vendor})</span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              <h5 className="font-extrabold text-[10px] uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                                <History className="w-3.5 h-3.5 text-rose-500" />
                                Perjalanan Perpanjangan (Journey)
                              </h5>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {sub.renewals.length === 0 && (!sub.journey || !sub.journey.trim()) ? (
                                  <p className="text-xs text-gray-400 italic py-2">Belum ada riwayat perpanjangan tercatat.</p>
                                ) : (
                                  <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-3.5 py-1">
                                    {sub.journey && sub.journey.split('\n').filter(Boolean).map((line, lIdx) => (
                                      <div key={lIdx} className="text-xs relative">
                                        <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" />
                                        <div className="font-semibold text-gray-700 dark:text-slate-350">{line}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
