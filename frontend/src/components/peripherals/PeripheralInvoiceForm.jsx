import React from 'react';
import { createPortal } from 'react-dom';
import {
  X, Receipt, FileText, DollarSign, Package,
  AlertTriangle, CheckCircle2, Loader2, Plus, Trash2, Repeat,
} from 'lucide-react';
import { SUBSCRIPTION_CATEGORIES, BILLING_CYCLES, STATUS_OPTIONS } from './constants';

export default function PeripheralInvoiceForm({
  isModalOpen, onClose,
  isEditMode, formError, submitting,
  // header fields
  formInvoiceRef, setFormInvoiceRef,
  formPoRef, setFormPoRef,
  formSupplier, setFormSupplier,
  formPurchaseDate, setFormPurchaseDate,
  formNotes, setFormNotes,
  formCompanyMasterId, setFormCompanyMasterId,
  formFileLink, setFormFileLink,
  // cost fields
  formServiceItems,
  formDeliveryCost, setFormDeliveryCost,
  formTaxCost, setFormTaxCost,
  // item rows
  formItems,
  // service row handlers
  handleAddServiceRow, handleRemoveServiceRow,
  handleUpdateServiceField, handleServiceCostChange,
  // item row handlers
  handleAddItemRow, handleRemoveItemRow,
  handleUpdateItemField, handleItemPriceChange,
  // submit + calc
  handleSubmit, calculateTotalInvoiceCost,
  // dropdown data
  companyMasters, companies, allFormCategories,
  // formatters
  formatRupiah, formatCostDigits,
}) {
  if (!isModalOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-955/60 backdrop-blur-sm transition-opacity cursor-pointer animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-7xl lg:max-w-[90vw] bg-white dark:bg-slate-900 border-l border-gray-150 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-slide-left overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-150 dark:border-slate-850">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                {isEditMode ? 'Perbarui Transaksi Invoice Periferal' : 'Daftarkan Transaksi Pembelian Periferal'}
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5 font-outfit">
                Catat aset pendukung IT non-karyawan lengkap dengan kuantitas, harga unit, garansi, serta nota invoice.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto flex-1 font-semibold text-xs">

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800 text-red-755 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Section 1: Invoice Header */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                1. Detail Ringkasan Invoice & Vendor
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Nomor Nota / Invoice *</label>
                  <input
                    type="text" value={formInvoiceRef} onChange={(e) => setFormInvoiceRef(e.target.value)}
                    placeholder="e.g. INV-1002348" required
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Nomor PO (Purchase Order)</label>
                  <input
                    type="text" value={formPoRef} onChange={(e) => setFormPoRef(e.target.value)}
                    placeholder="e.g. PO-MRA-2026-004"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Supplier / Toko Penjual *</label>
                  <input
                    type="text" value={formSupplier} onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="e.g. PT Vendor Jaya" required
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Tanggal Invoice *</label>
                  <input
                    type="date" value={formPurchaseDate} onChange={(e) => setFormPurchaseDate(e.target.value)} required
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Entitas Pembayar (Cost Center) *</label>
                  <select
                    value={formCompanyMasterId} onChange={(e) => setFormCompanyMasterId(e.target.value)} required
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                  >
                    <option value="">Pilih Perusahaan Induk</option>
                    {companyMasters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Catatan Invoice</label>
                  <input
                    type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. Pembelian CCTV untuk operasional pos sekuriti"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Link Bukti Fisik / Attachment Invoice (Optional)</label>
                  <input
                    type="text" value={formFileLink} onChange={(e) => setFormFileLink(e.target.value)}
                    placeholder="e.g. https://drive.google.com/drive/folders/..."
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  />
                </div>

              </div>
            </div>

            {/* Section 2: Non-Inventory Costs */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                <DollarSign className="w-3.5 h-3.5 text-rose-500" />
                2. Biaya Tambahan Jasa & Pengiriman (Expense Non-Inventory)
              </h4>

              {/* Service / Labor Cost rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Biaya Jasa / Instalasi (Rp)</label>
                  <button
                    type="button" onClick={handleAddServiceRow}
                    className="flex items-center gap-1 px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] rounded-lg shadow-sm transition"
                  >
                    <Plus className="w-3 h-3" /> Tambah Jasa
                  </button>
                </div>

                {formServiceItems.length === 0 ? (
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 italic py-1">Tidak ada biaya jasa pada invoice ini.</p>
                ) : (
                  <div className="space-y-2">
                    {formServiceItems.map((svc, index) => (
                      <div key={index} className="p-2.5 rounded-xl border border-gray-150 dark:border-slate-800/60 bg-gray-50/40 dark:bg-slate-950/20 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text" value={svc.description}
                            onChange={(e) => handleUpdateServiceField(index, 'description', e.target.value)}
                            placeholder="e.g. Jasa Instalasi CCTV"
                            className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                          />
                          <div className="relative w-44 shrink-0">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400">Rp</span>
                            <input
                              type="text" value={svc.cost}
                              onChange={(e) => handleServiceCostChange(index, e.target.value)}
                              placeholder="0"
                              className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                            />
                          </div>
                          <button
                            type="button" onClick={() => handleRemoveServiceRow(index)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-lg transition shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Recurring toggle */}
                        <div className="flex flex-wrap items-center gap-3 pl-1">
                          <label className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer ${svc.subscriptionId ? 'text-emerald-600 dark:text-emerald-450' : 'text-gray-500 dark:text-slate-400'}`}>
                            <input
                              type="checkbox" checked={svc.isSubscription} disabled={!!svc.subscriptionId}
                              onChange={(e) => handleUpdateServiceField(index, 'isSubscription', e.target.checked)}
                              className="w-3.5 h-3.5 rounded accent-rose-500 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <Repeat className="w-3 h-3" />
                            {svc.subscriptionId ? 'Sudah Terhubung ke Subscription' : 'Jadikan Biaya Berulang (Auto-buat Subscription)'}
                          </label>

                          {svc.isSubscription && (
                            <>
                              <select
                                value={svc.category} disabled={!!svc.subscriptionId}
                                onChange={(e) => handleUpdateServiceField(index, 'category', e.target.value)}
                                className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-white dark:bg-slate-955/40 border border-gray-200 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {SUBSCRIPTION_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                              <select
                                value={svc.billingCycle} disabled={!!svc.subscriptionId}
                                onChange={(e) => handleUpdateServiceField(index, 'billingCycle', e.target.value)}
                                className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-white dark:bg-slate-955/40 border border-gray-200 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {BILLING_CYCLES.map(cycle => <option key={cycle} value={cycle}>{cycle}</option>)}
                              </select>
                              {!svc.subscriptionId && (
                                <span className="text-[9px] text-gray-400 dark:text-slate-500 italic">
                                  Akan otomatis dibuat di "IT Subscriptions & Renewals" saat disimpan.
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery + Tax */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Ongkos Kirim (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400">Rp</span>
                    <input
                      type="text" value={formDeliveryCost}
                      onChange={(e) => setFormDeliveryCost(formatCostDigits(e.target.value))}
                      placeholder="0"
                      className="w-full pl-9 pr-4 py-2 text-xs font-bold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Pajak / PPN / PPh (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400">Rp</span>
                    <input
                      type="text" value={formTaxCost}
                      onChange={(e) => setFormTaxCost(formatCostDigits(e.target.value))}
                      placeholder="0"
                      className="w-full pl-9 pr-4 py-2 text-xs font-bold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Physical Items Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-rose-500" />
                  3. Daftar Barang Fisik Periferal (Inventory Stock)
                </h4>
                <button
                  type="button" onClick={handleAddItemRow}
                  className="flex items-center gap-1 px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] rounded-lg shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Baris Item
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-950/20">
                <table className="w-full text-left text-xs min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 text-[10px] font-black uppercase text-gray-450 tracking-wider">
                      <th className="py-2.5 px-4 w-8 text-center">No</th>
                      <th className="py-2.5 px-4 w-48">Nama Barang *</th>
                      <th className="py-2.5 px-4 w-32">Kategori *</th>
                      <th className="py-2.5 px-4 w-32">Brand / Model</th>
                      <th className="py-2.5 px-4 w-32">Serial Number</th>
                      <th className="py-2.5 px-4 w-32 text-right">Harga Unit (Rp) *</th>
                      <th className="py-2.5 px-4 w-16 text-center">Qty *</th>
                      <th className="py-2.5 px-4 w-28 text-center">Status *</th>
                      <th className="py-2.5 px-4 w-40">Lokasi Penempatan</th>
                      <th className="py-2.5 px-4 w-12 text-center">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-slate-850/50">
                    {formItems.map((item, index) => (
                      <tr key={index} className="bg-white dark:bg-slate-900/60 hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                        <td className="py-2.5 px-4 text-center font-bold text-gray-400">{index + 1}</td>
                        <td className="py-2.5 px-4">
                          <input
                            type="text" required value={item.name}
                            onChange={(e) => handleUpdateItemField(index, 'name', e.target.value)}
                            placeholder="e.g. CCTV Dome 4MP"
                            className="w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-gray-50/70 dark:bg-slate-950/40 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <select
                            required value={item.category}
                            onChange={(e) => handleUpdateItemField(index, 'category', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-gray-50/70 dark:bg-slate-950/40 border border-gray-250 dark:border-slate-800/80 text-gray-755 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                          >
                            <option value="">Pilih Kategori</option>
                            {allFormCategories.filter(c => c !== '__NEW__').map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-4 space-y-1">
                          <input
                            type="text" required value={item.brand}
                            onChange={(e) => handleUpdateItemField(index, 'brand', e.target.value)}
                            placeholder="Brand (e.g. Dell)"
                            className="w-full px-2 py-1 text-xs font-semibold rounded-lg bg-gray-50/70 dark:bg-slate-955/40 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                          />
                          <input
                            type="text" value={item.model}
                            onChange={(e) => handleUpdateItemField(index, 'model', e.target.value)}
                            placeholder="Model (e.g. L14)"
                            className="w-full px-2 py-1 text-xs font-semibold rounded-lg bg-gray-50/70 dark:bg-slate-955/40 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <input
                            type="text" value={item.serialNumber}
                            onChange={(e) => handleUpdateItemField(index, 'serialNumber', e.target.value)}
                            placeholder="S/N / Range"
                            className="w-full px-2 py-1.5 text-xs font-mono rounded-lg bg-gray-50/70 dark:bg-slate-955/40 border border-gray-250 dark:border-slate-855/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">Rp</span>
                            <input
                              type="text" required value={item.purchaseCost}
                              onChange={(e) => handleItemPriceChange(index, e.target.value)}
                              placeholder="500.000"
                              className="w-full pl-6 pr-2 py-1.5 text-xs font-bold rounded-lg bg-gray-50/70 dark:bg-slate-955/40 border border-gray-250 dark:border-slate-855/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition text-right"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number" required min="1" value={item.quantity}
                            onChange={(e) => handleUpdateItemField(index, 'quantity', e.target.value)}
                            className="w-full px-1.5 py-1.5 text-xs font-bold rounded-lg bg-gray-50/70 dark:bg-slate-955/40 border border-gray-250 dark:border-slate-855/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 text-center"
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <select
                            required value={item.status}
                            onChange={(e) => handleUpdateItemField(index, 'status', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs font-bold rounded-lg bg-gray-50/70 dark:bg-slate-955/40 border border-gray-250 dark:border-slate-805/85 text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                          >
                            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </td>
                        <td className="py-2.5 px-4">
                          <select
                            value={item.companyId}
                            onChange={(e) => handleUpdateItemField(index, 'companyId', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-gray-50/70 dark:bg-slate-955/40 border border-gray-200 dark:border-slate-805/85 text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                          >
                            <option value="">Pilih Kantor Cabang</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.location})</option>)}
                          </select>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button" onClick={() => handleRemoveItemRow(index)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center p-5 border-t border-gray-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Estimasi Total Pengeluaran:</span>
              <span className="text-base font-black text-rose-500 dark:text-rose-455 font-outfit">
                {formatRupiah(calculateTotalInvoiceCost())}
              </span>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                type="button" onClick={onClose}
                className="px-4 py-2.5 border border-gray-250 dark:border-slate-855 hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-655 dark:text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit" disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-500/10 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isEditMode ? 'Simpan Perubahan' : 'Daftarkan Invoice'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
