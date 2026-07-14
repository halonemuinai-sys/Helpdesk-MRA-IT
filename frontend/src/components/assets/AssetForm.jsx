import React from 'react';
import { createPortal } from 'react-dom';
import { Laptop, AlertTriangle, Loader2, CheckCircle2, X, Search, Building2, History, Cpu, ChevronDown } from 'lucide-react';
import { STATUS_OPTIONS } from './constants';

export default function AssetForm({
  isModalOpen, onClose,
  isEditMode, submitting, formError,
  // ownership / category
  formOwnershipType, setFormOwnershipType,
  formDeviceCategory, setFormDeviceCategory,
  // specs
  formAssetTag, setFormAssetTag,
  formBrand, setFormBrand,
  formModel, setFormModel,
  formProcessor, setFormProcessor,
  formRam, setFormRam,
  formStorage, setFormStorage,
  formOs, setFormOs,
  formOffice, setFormOffice,
  formNotes, setFormNotes,
  // contract
  formDeviceRef, setFormDeviceRef,
  formVendorRef, setFormVendorRef,
  formRentalCost, setFormRentalCost,
  formStatus, setFormStatus,
  formRentalStart, setFormRentalStart,
  formRentalEnd, setFormRentalEnd,
  formVendor, setFormVendor,
  formUserId, setFormUserId,
  formCompanyMasterId, setFormCompanyMasterId,
  formCompanyId, setFormCompanyId,
  formUpdateJourney, setFormUpdateJourney,
  // user dropdown
  userSearchText, setUserSearchText,
  isUserDropdownOpen, setIsUserDropdownOpen,
  userDropdownRef,
  // reference data
  users, companies, companyMasters,
  // handlers
  handleSubmit, formatNumberForInput,
}) {
  if (!isModalOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-250 dark:border-slate-800/80 shadow-2xl w-full max-w-4xl overflow-hidden animate-slide-up">

          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-gray-150 dark:border-slate-850">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                  {isEditMode
                    ? `Pembaruan Data ${formOwnershipType === 'RENTAL' ? 'Aset Sewa' : 'Aset Milik'}`
                    : `Daftarkan ${formOwnershipType === 'RENTAL' ? 'Aset Sewa' : 'Aset Milik'} Baru`}
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                  {isEditMode
                    ? 'Edit detail unit spesifikasi hardware, nomor seri, atau log riwayat serah terima.'
                    : `Daftarkan unit ${formDeviceCategory === 'LAPTOP' ? 'laptop/PC' : 'smartphone'} baru lengkap dengan spesifikasi hardware.`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 rounded-xl transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">

              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800 text-red-750 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Ownership + Category toggles */}
              <div className="p-4 bg-gray-50/50 dark:bg-slate-900/35 rounded-2xl border border-gray-150 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Skema Kepemilikan Aset *</label>
                  <div className="flex gap-2.5">
                    {['RENTAL', 'OWNED'].map(type => (
                      <button key={type} type="button" onClick={() => setFormOwnershipType(type)}
                        className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition ${formOwnershipType === type ? 'bg-rose-500 text-white shadow-md shadow-rose-500/10' : 'bg-white dark:bg-slate-955/40 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-350 hover:bg-slate-50/80 dark:hover:bg-slate-850/50'}`}>
                        {type === 'RENTAL' ? 'Sewa (Rental)' : 'Milik Sendiri'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Kategori Perangkat *</label>
                  <div className="flex gap-2.5">
                    <button type="button"
                      onClick={() => { setFormDeviceCategory('LAPTOP'); if (formOs === 'iOS 17' || formOs === 'iOS') setFormOs('Windows 11 Pro'); }}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition ${formDeviceCategory === 'LAPTOP' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'bg-white dark:bg-slate-955/40 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-350 hover:bg-slate-50/80 dark:hover:bg-slate-850/50'}`}>
                      Laptop / PC
                    </button>
                    <button type="button"
                      onClick={() => { setFormDeviceCategory('SMARTPHONE'); setFormOs('iOS 17'); setFormOffice('None'); }}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition ${formDeviceCategory === 'SMARTPHONE' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'bg-white dark:bg-slate-955/40 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-350 hover:bg-slate-50/80 dark:hover:bg-slate-850/50'}`}>
                      Smartphone
                    </button>
                    <button type="button"
                      onClick={() => { setFormDeviceCategory('PRINTER'); setFormOs('Printer OS'); setFormOffice('None'); }}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition ${formDeviceCategory === 'PRINTER' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'bg-white dark:bg-slate-955/40 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-350 hover:bg-slate-50/80 dark:hover:bg-slate-850/50'}`}>
                      Printer
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left: Specs */}
                <div className="space-y-3.5">
                  <h4 className="text-[11px] font-extrabold text-rose-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" /> Identitas & Spesifikasi Perangkat
                  </h4>

                  {formOwnershipType === 'OWNED' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Kode Tag Aset *</label>
                      <input type="text" value={formAssetTag} onChange={(e) => setFormAssetTag(e.target.value)} placeholder="e.g. AST-MRA-1001"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                        required={formOwnershipType === 'OWNED'} />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Brand *</label>
                      <input type="text" value={formBrand} onChange={(e) => setFormBrand(e.target.value)} placeholder="e.g. Lenovo, Dell, Apple" list="brand-options"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition" required />
                      <datalist id="brand-options">
                        {formDeviceCategory === 'LAPTOP' ? (
                          <><option value="LENOVO" /><option value="DELL" /><option value="APPLE" /><option value="HP" /><option value="ASUS" /></>
                        ) : (
                          <><option value="APPLE" /><option value="SAMSUNG" /><option value="OPPO" /><option value="VIVO" /><option value="XIAOMI" /><option value="REALME" /><option value="INFINIX" /></>
                        )}
                      </datalist>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Model Unit *</label>
                      <input type="text" value={formModel} onChange={(e) => setFormModel(e.target.value)}
                        placeholder={formDeviceCategory === 'LAPTOP' ? 'e.g. ThinkPad L14 Gen 2' : 'e.g. iPhone 15 Pro'}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition" required />
                    </div>
                  </div>

                  {formDeviceCategory !== 'PRINTER' ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Tipe Processor</label>
                          <input type="text" value={formProcessor} onChange={(e) => setFormProcessor(e.target.value)}
                            placeholder={formDeviceCategory === 'LAPTOP' ? 'e.g. Intel Core i5 / Apple M3' : 'e.g. A16 Bionic / Snapdragon'}
                            list="processor-options"
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition" />
                          <datalist id="processor-options">
                            {formDeviceCategory === 'LAPTOP' ? (
                              <><option value="Intel Core i5" /><option value="Intel Core i7" /><option value="Intel Core i3" /><option value="Apple M1" /><option value="Apple M2" /><option value="Apple M3" /><option value="AMD Ryzen 5" /><option value="AMD Ryzen 7" /></>
                            ) : (
                              <><option value="A17 Pro" /><option value="A16 Bionic" /><option value="A15 Bionic" /><option value="Snapdragon 8 Gen 2" /><option value="Snapdragon 7 Gen 1" /><option value="MediaTek Dimensity 9200" /></>
                            )}
                          </datalist>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Sistem Operasi (OS)</label>
                          <input type="text" value={formOs} onChange={(e) => setFormOs(e.target.value)}
                            placeholder={formDeviceCategory === 'LAPTOP' ? 'e.g. Windows 11 Pro / macOS' : 'e.g. iOS 17 / Android 14'}
                            list="os-options"
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition" />
                          <datalist id="os-options">
                            {formDeviceCategory === 'LAPTOP' ? (
                              <><option value="Windows 11 Pro" /><option value="Windows 10 Pro" /><option value="macOS Sonoma" /><option value="macOS Ventura" /><option value="macOS Big Sur" /><option value="macOS Catalina" /><option value="macOS" /><option value="Linux" /><option value="Linux Ubuntu" /></>
                            ) : (
                              <><option value="iOS 17" /><option value="iOS 16" /><option value="Android 14" /><option value="Android 13" /></>
                            )}
                          </datalist>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Kapasitas RAM</label>
                          <input type="text" value={formRam} onChange={(e) => setFormRam(e.target.value)}
                            placeholder={formDeviceCategory === 'LAPTOP' ? 'e.g. 8GB / 16GB DDR4' : 'e.g. 6GB / 8GB RAM'}
                            list="ram-options"
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition" />
                          <datalist id="ram-options">
                            <option value="8GB" /><option value="16GB" /><option value="32GB" /><option value="4GB" /><option value="6GB" /><option value="12GB" />
                          </datalist>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Penyimpanan (Storage)</label>
                          <input type="text" value={formStorage} onChange={(e) => setFormStorage(e.target.value)}
                            placeholder={formDeviceCategory === 'LAPTOP' ? 'e.g. 256GB SSD / 512GB NVMe' : 'e.g. 128GB / 256GB NVMe'}
                            list="storage-options"
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition" />
                          <datalist id="storage-options">
                            {formDeviceCategory === 'LAPTOP' ? (
                              <><option value="256GB SSD" /><option value="512GB SSD" /><option value="512GB NVMe" /><option value="1TB SSD" /><option value="1TB NVMe" /></>
                            ) : (
                              <><option value="128GB" /><option value="256GB" /><option value="512GB" /><option value="64GB" /></>
                            )}
                          </datalist>
                        </div>
                      </div>

                      {formDeviceCategory === 'LAPTOP' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Lisensi MS Office</label>
                          <input type="text" value={formOffice} onChange={(e) => setFormOffice(e.target.value)} placeholder="e.g. Office 2021 H&B / None"
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-3 bg-gray-50 dark:bg-slate-900/35 border border-gray-150 dark:border-slate-800/60 rounded-xl text-center text-gray-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      Spesifikasi OS, RAM, & Storage tidak diperlukan untuk perangkat Printer
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Catatan Tambahan (Hardware Spec/SN)</label>
                    <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Tulis SN, tipe layar, charger, atau kelengkapan fisik di sini..." rows="3"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition font-sans" />
                  </div>
                </div>

                {/* Right: Contract & Entity */}
                <div className="space-y-3.5">
                  <h4 className="text-[11px] font-extrabold text-rose-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {formOwnershipType === 'RENTAL' ? 'Kontrak Sewa & Pengikatan' : 'Detail Pembelian & Pengikatan'}
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">
                        {formOwnershipType === 'RENTAL'
                          ? (formDeviceCategory === 'LAPTOP' ? 'Device Ref Number (LP)*' : (formDeviceCategory === 'PRINTER' ? 'Printer Ref (PRN)*' : 'IMEI / Serial Number*'))
                          : 'Serial Number (SN)'}
                      </label>
                      <input type="text" value={formDeviceRef} onChange={(e) => setFormDeviceRef(e.target.value)}
                        placeholder={formOwnershipType === 'RENTAL' ? (formDeviceCategory === 'LAPTOP' ? 'e.g. LP10682' : (formDeviceCategory === 'PRINTER' ? 'e.g. PRN-001' : 'e.g. IMEI / Serial')) : 'e.g. SN12345678 (Opsional)'}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition font-mono"
                        required={formOwnershipType === 'RENTAL'} />
                      {formOwnershipType === 'RENTAL' && (
                        <p className="text-[9px] text-gray-400 dark:text-slate-500 italic">Nilai ini otomatis dipakai sebagai Tag Aset & kode sync ke GA — pastikan tidak ada spasi/penulisan ganda.</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        {formOwnershipType === 'RENTAL' ? 'Vendor Billing Ref' : 'Invoice / PO Ref'}
                      </label>
                      <input type="text" value={formVendorRef} onChange={(e) => setFormVendorRef(e.target.value)}
                        placeholder={formOwnershipType === 'RENTAL' ? 'e.g. ASN/20240318/1621/0001' : 'e.g. INV/2026/001 (Opsional)'}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">
                        {formOwnershipType === 'RENTAL' ? 'Biaya Sewa Bulanan (IDR) *' : 'Harga Pembelian (IDR) *'}
                      </label>
                      <input type="text" value={formRentalCost} onChange={(e) => setFormRentalCost(formatNumberForInput(e.target.value))}
                        placeholder={formOwnershipType === 'RENTAL' ? 'e.g. 450.000' : 'e.g. 15.000.000'}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Status Aset *</label>
                      <select value={formStatus} onChange={(e) => { setFormStatus(e.target.value); if (e.target.value !== 'ASSIGNED') setFormUserId(''); }}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer" required>
                        {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">
                        {formOwnershipType === 'RENTAL' ? 'Mulai Sewa *' : 'Tanggal Pembelian *'}
                      </label>
                      <input type="date" value={formRentalStart} onChange={(e) => setFormRentalStart(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer" required />
                    </div>
                    {formOwnershipType === 'RENTAL' ? (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Selesai Sewa *</label>
                        <input type="date" value={formRentalEnd} onChange={(e) => setFormRentalEnd(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                          required={formOwnershipType === 'RENTAL'} />
                      </div>
                    ) : (
                      <div className="space-y-1 opacity-50 select-none pointer-events-none">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-wider">Selesai Sewa (N/A)</label>
                        <input type="text" disabled value="Milik Sendiri"
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-500" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Vendor Penyedia / Partner *</label>
                    <input type="text" list="asset-vendor-suggestions" value={formVendor} onChange={(e) => setFormVendor(e.target.value)}
                      placeholder="e.g. PT Teknologi Skoring Nusantara"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                      required={formOwnershipType === 'RENTAL'} />
                    <datalist id="asset-vendor-suggestions">
                      <option value="PT Teknologi Skoring Nusantara" /><option value="PT Permata Landmarq Abadi" /><option value="Javarent" /><option value="Asani" />
                    </datalist>
                  </div>

                  {/* Searchable user dropdown */}
                  <div className="space-y-1" ref={userDropdownRef}>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      Karyawan Pengguna <span className="text-gray-400 normal-case font-normal">(Kosongkan jika Shared / Cabang)</span>
                    </label>
                    <div className="relative">
                      <button type="button" onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer text-left flex justify-between items-center">
                        <span className="truncate pr-4">
                          {formUserId
                            ? (() => { const u = users.find(u => u.id === formUserId); return u ? `${u.name} (NIP: ${u.id} - ${u.department})` : formUserId; })()
                            : '-- Tanpa Karyawan (Simpan di Inventory IT) --'}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                      </button>
                      {isUserDropdownOpen && (
                        <div className="absolute z-50 mt-1 w-full rounded-xl bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 shadow-xl max-h-64 overflow-hidden flex flex-col p-1.5 gap-1.5 animate-fade-in">
                          <div className="relative flex items-center">
                            <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-400" />
                            <input type="text" placeholder="Cari nama, NIP, atau departemen..." value={userSearchText} onChange={(e) => setUserSearchText(e.target.value)} autoFocus
                              className="w-full pl-8 pr-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-50 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500" />
                            {userSearchText && (
                              <button type="button" onClick={() => setUserSearchText('')} className="absolute right-2.5 p-0.5 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 rounded">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="flex flex-col overflow-y-auto max-h-48 gap-0.5 custom-scrollbar">
                            <button type="button" onClick={() => { setFormUserId(''); setUserSearchText(''); setIsUserDropdownOpen(false); }}
                              className={`w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg transition-colors ${!formUserId ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 font-bold' : 'hover:bg-gray-50 dark:hover:bg-slate-955/40 text-gray-750 dark:text-slate-350'}`}>
                              -- Tanpa Karyawan (Simpan di Inventory IT) --
                            </button>
                            {(() => {
                              const q = userSearchText.toLowerCase();
                              const filtered = users.filter(u => u.name.toLowerCase().includes(q) || u.id.toString().toLowerCase().includes(q) || (u.department && u.department.toLowerCase().includes(q)));
                              if (filtered.length === 0) return <div className="text-center py-4 text-xs text-gray-400 dark:text-slate-500 font-medium">Tidak ada karyawan ditemukan</div>;
                              return filtered.map(u => (
                                <button key={u.id} type="button" onClick={() => { setFormUserId(u.id); setFormStatus('ASSIGNED'); setUserSearchText(''); setIsUserDropdownOpen(false); }}
                                  className={`w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg transition-colors ${formUserId === u.id ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 font-bold' : 'hover:bg-gray-50 dark:hover:bg-slate-955/40 text-gray-750 dark:text-slate-350'}`}>
                                  {u.name} (NIP: {u.id} - {u.department})
                                </button>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Entitas Perusahaan Induk</label>
                      <select value={formCompanyMasterId} onChange={(e) => setFormCompanyMasterId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer">
                        <option value="">-- Pilih Entitas --</option>
                        {companyMasters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Lokasi Kantor Cabang</label>
                      <select value={formCompanyId} onChange={(e) => setFormCompanyId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer">
                        <option value="">-- Pilih Cabang --</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name} - {c.location}</option>)}
                      </select>
                    </div>
                  </div>

                  {isEditMode && (
                    <div className="space-y-1 pt-1.5 border-t border-gray-100 dark:border-slate-800">
                      <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                        <History className="w-3.5 h-3.5" /> Log Perubahan Riwayat (Journey)
                      </label>
                      <input type="text" value={formUpdateJourney} onChange={(e) => setFormUpdateJourney(e.target.value)}
                        placeholder="e.g. Upgrade RAM jadi 16GB / LCD bergaris dikirim servis..."
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-3 p-5 border-t border-gray-150 dark:border-slate-850">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-250 dark:border-slate-850 hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-655 dark:text-slate-300 text-xs font-bold rounded-xl transition">
                Batal
              </button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-500/10 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isEditMode ? 'Simpan Perubahan' : 'Daftarkan Aset'}</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>,
    document.body
  );
}
