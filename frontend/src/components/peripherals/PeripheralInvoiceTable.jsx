import React from 'react';
import { ChevronDown, ChevronUp, Receipt, FileText, Package, Edit2, Trash2, Loader2 } from 'lucide-react';
import PendingProcessPlaceholder from '../PendingProcessPlaceholder';
import InvoiceItemsSubtable from './InvoiceItemsSubtable';
import { STATUS_OPTIONS } from './constants';

export default function PeripheralInvoiceTable({
  invoices, loading, invoicesLoaded,
  formatRupiah, formatDate,
  expandedRows, toggleRow,
  handleOpenEditModal, handleDeleteInvoice, handleDeleteSingleItem,
  setViewingAsset,
  user, token,
  searchQuery, selectedCompanyMasterId,
}) {
  if (!invoicesLoaded && !loading) {
    return (
      <PendingProcessPlaceholder
        title="Filter & Proses Data Invoice"
        description={'Pilih kriteria pencarian dan filter di atas (opsional), lalu klik tombol "Proses / Muat Data" untuk menampilkan data invoice pembelian periferal.'}
      />
    );
  }

  return (
    <div className="glass-panel rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden">
      {loading && invoices.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          <span className="text-xs text-gray-500 font-semibold">Memuat Data Invoice...</span>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 px-6 animate-fade-in flex flex-col items-center justify-center gap-3">
          <Receipt className="w-8 h-8 text-rose-500/80" />
          <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold max-w-md">
            {searchQuery || selectedCompanyMasterId
              ? 'Tidak ada data invoice yang cocok dengan kriteria pencarian atau filter Anda.'
              : 'Belum ada data transaksi invoice terdaftar di sistem MRA Group.'}
          </p>
        </div>
      ) : (
        <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <table className="w-full text-left text-xs font-semibold border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6 w-10"></th>
                <th className="py-4 px-6">No. Invoice & PO</th>
                <th className="py-4 px-6">Supplier</th>
                <th className="py-4 px-6">Tanggal Pembelian</th>
                <th className="py-4 px-6">Entitas (Pembayar)</th>
                <th className="py-4 px-6 text-right">Biaya Jasa</th>
                <th className="py-4 px-6 text-center">Items</th>
                <th className="py-4 px-6 text-right font-extrabold text-rose-500">Total Invoice</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-700 dark:text-slate-300">
              {invoices.map((inv) => {
                const isExpanded = !!expandedRows[inv.id];
                return (
                  <React.Fragment key={inv.id}>
                    <tr
                      onClick={() => toggleRow(inv.id)}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/25 transition cursor-pointer border-b border-gray-100 dark:border-slate-850/30 ${isExpanded ? 'bg-slate-50/30 dark:bg-slate-900/15' : ''}`}
                    >
                      <td className="py-4 px-6 text-center">
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-rose-500" />
                          : <ChevronDown className="w-4 h-4 text-gray-450" />}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-gray-900 dark:text-white text-xs flex items-center gap-1.5">
                          <span>{inv.invoiceRef}</span>
                          {inv.fileLink && (
                            <a
                              href={inv.fileLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-emerald-500 hover:text-emerald-600 transition shrink-0"
                              title="Lihat Bukti Fisik / Attachment Invoice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        {inv.poRef && <div className="text-[10px] text-gray-455 font-mono mt-0.5">PO: {inv.poRef}</div>}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-805 dark:text-slate-205">{inv.supplier}</td>
                      <td className="py-4 px-6">{formatDate(inv.purchaseDate)}</td>
                      <td className="py-4 px-6 font-bold text-gray-800 dark:text-slate-200">{inv.companyMaster?.name || '-'}</td>
                      <td className="py-4 px-6 text-right font-medium text-slate-500">{formatRupiah(inv.serviceCost)}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-655 dark:text-slate-300">
                          {inv._count?.items || 0} Item
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-black text-rose-500 dark:text-rose-455">{formatRupiah(inv.totalCost)}</td>
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(inv.id)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-rose-500 rounded-lg transition"
                            title="Edit Invoice"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {user.role === 'ADMIN' && (
                            <button
                              onClick={() => handleDeleteInvoice(inv)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-red-500 rounded-lg transition"
                              title="Hapus Invoice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable: child items subtable */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="9" className="p-6 bg-slate-50/40 dark:bg-slate-900/20 border-t border-gray-150 dark:border-slate-850">
                          <div className="space-y-4">
                            <h5 className="font-extrabold text-[10px] uppercase text-gray-455 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-rose-500" />
                              Barang Pembelian Terdaftar di Dalam Invoice
                            </h5>
                            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-955 shadow-inner">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-gray-50 dark:bg-slate-900/60 border-b border-gray-200 dark:border-slate-800 text-gray-450 uppercase text-[9px] font-extrabold tracking-wider">
                                    <th className="py-2.5 px-4">Nama Barang</th>
                                    <th className="py-2.5 px-4">Kategori</th>
                                    <th className="py-2.5 px-4">Brand / Model</th>
                                    <th className="py-2.5 px-4">Serial Number</th>
                                    <th className="py-2.5 px-4 text-center">Qty</th>
                                    <th className="py-2.5 px-4 text-right">Harga Satuan</th>
                                    <th className="py-2.5 px-4 text-right">Total</th>
                                    <th className="py-2.5 px-4 text-center">Status</th>
                                    <th className="py-2.5 px-4 text-right">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-850/50 text-gray-700 dark:text-slate-350">
                                  <InvoiceItemsSubtable
                                    invoiceId={inv.id}
                                    token={token}
                                    formatRupiah={formatRupiah}
                                    statusOptions={STATUS_OPTIONS}
                                    onDeleteItem={handleDeleteSingleItem}
                                    onViewItem={(item) => setViewingAsset(item)}
                                    user={user}
                                  />
                                </tbody>
                              </table>
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
