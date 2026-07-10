import React from 'react';
import { Package, Edit2, Eye, Trash2, Loader2 } from 'lucide-react';
import PendingProcessPlaceholder from '../PendingProcessPlaceholder';

export default function PeripheralItemsTable({
  peripherals, loading, itemsLoaded,
  formatRupiah,
  statusOptions,
  handleDeleteSingleItem,
  handleOpenEditModal,
  setViewingAsset,
}) {
  if (!itemsLoaded && !loading) {
    return (
      <PendingProcessPlaceholder
        title="Filter & Proses Data Aset"
        description={'Pilih kriteria pencarian dan filter di atas (opsional), lalu klik tombol "Proses / Muat Data" untuk menampilkan data aset/stok periferal.'}
      />
    );
  }

  return (
    <div className="glass-panel rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden">
      {loading && peripherals.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          <span className="text-xs text-gray-500 font-semibold">Memuat Aset Periferal...</span>
        </div>
      ) : peripherals.length === 0 ? (
        <div className="text-center py-16 px-6 animate-fade-in flex flex-col items-center justify-center gap-3">
          <Package className="w-8 h-8 text-rose-500/80" />
          <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold max-w-md">
            Tidak ada barang periferal yang cocok dengan kriteria pencarian stok Anda.
          </p>
        </div>
      ) : (
        <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <table className="w-full text-left text-xs font-semibold border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6">Nama Alat & Spesifikasi</th>
                <th className="py-4 px-6">Kategori</th>
                <th className="py-4 px-6">Lokasi Penempatan</th>
                <th className="py-4 px-6">Kuantitas</th>
                <th className="py-4 px-6 text-right">Harga Unit</th>
                <th className="py-4 px-6 text-right">Total Biaya</th>
                <th className="py-4 px-6">Link Invoice</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-700 dark:text-slate-300">
              {peripherals.map((p) => {
                const statusObj = statusOptions.find(o => o.value === p.status) || statusOptions[0];
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-850/25 transition border-b border-gray-100 dark:border-slate-850/30"
                  >
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-gray-900 dark:text-white text-xs">{p.name}</div>
                      <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                        {p.brand} {p.model || '-'} {p.serialNumber ? `| SN: ${p.serialNumber}` : ''}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[10px]">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-655 dark:text-slate-300 font-bold uppercase tracking-wider">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-800 dark:text-slate-200">{p.company?.name || 'Shared / Cabang'}</div>
                      <div className="text-[10px] text-gray-400 font-semibold mt-0.5">{p.company?.location || '-'}</div>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-950 dark:text-slate-100">{p.quantity} Unit</td>
                    <td className="py-4 px-6 text-right text-slate-500">{formatRupiah(p.purchaseCost)}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-gray-900 dark:text-white">{formatRupiah(p.totalCost)}</td>
                    <td className="py-4 px-6">
                      {p.peripheralInvoice ? (
                        <button
                          onClick={() => handleOpenEditModal(p.peripheralInvoice.id)}
                          className="text-rose-500 hover:text-rose-600 dark:text-rose-455 font-bold hover:underline text-left cursor-pointer"
                          title="Tampilkan data Invoice pembelian"
                        >
                          {p.peripheralInvoice.invoiceRef}
                        </button>
                      ) : (
                        <span className="text-gray-400 font-mono text-[10px]">{p.invoiceRef || '-'}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${statusObj.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`} />
                        {statusObj.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingAsset(p)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-blue-500 rounded-lg transition cursor-pointer"
                          title="Lihat Detail & Riwayat (Journey)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {p.peripheralInvoiceId && (
                          <button
                            onClick={() => handleOpenEditModal(p.peripheralInvoiceId)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-rose-500 rounded-lg transition"
                            title="Edit Detail Invoice (Peralatan)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSingleItem(p)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-red-500 rounded-lg transition"
                          title="Hapus Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
