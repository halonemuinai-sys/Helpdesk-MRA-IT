import React from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Building2, History, AlertTriangle, X, Loader2, CheckCircle2 } from 'lucide-react';
import { CATEGORIES, BILLING_CYCLES, MRA_BRANDS } from './constants';

export default function SubscriptionFormDrawer({
  isOpen, onClose,
  isEditMode, isReplacementMode,
  submitting, formError,
  companies, onSubmit, formatNumberForInput,
  formCompanyId, setFormCompanyId,
  formAuthorizedCompanyId, setFormAuthorizedCompanyId,
  formCategory, setFormCategory,
  formVendor, setFormVendor,
  formName, setFormName,
  formBrand, setFormBrand,
  formLocation, setFormLocation,
  formContractNumber, setFormContractNumber,
  formBillingCycle, setFormBillingCycle,
  formCost, setFormCost,
  formStartDate, setFormStartDate,
  formExpiryDate, setFormExpiryDate,
  formStatus, setFormStatus,
  formEvidenceLink, setFormEvidenceLink,
  formNotes, setFormNotes,
  formUpdateJourney, setFormUpdateJourney,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-gray-150 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-slide-left overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-150 dark:border-slate-850">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                {isEditMode ? 'Perbarui Layanan / Kontrak' : isReplacementMode ? 'Buat Kontrak Baru (Pengganti)' : 'Tambah Layanan Baru'}
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                {isEditMode
                  ? 'Edit rincian data subskripsi atau log perpanjangan kontrak.'
                  : isReplacementMode
                  ? 'Hubungkan kontrak baru yang menggantikan kontrak aktif sebelumnya.'
                  : 'Daftarkan subskripsi billing, ISP, VPN, atau domain baru.'}
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
        <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800 text-red-755 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Company (PT Name) */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Anak Perusahaan / Entitas PT MRA *
                </label>
                <div className="relative group">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                  <select
                    value={formCompanyId}
                    onChange={(e) => setFormCompanyId(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                    required
                  >
                    {companies.map(comp => (
                      <option key={comp.id} value={comp.id}>{comp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Brand MRA (Clean Brand Dropdown + Manual Input) */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Brand / Merek Business Unit MRA (Bvlgari, Cosmopolitan, Hard Rock FM, dll)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={MRA_BRANDS.includes(formBrand) ? formBrand : (formBrand ? 'CUSTOM' : '')}
                    onChange={(e) => {
                      if (e.target.value !== 'CUSTOM') {
                        setFormBrand(e.target.value);
                      }
                    }}
                    className="w-full sm:w-1/2 px-3 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                  >
                    <option value="">-- Pilih Brand MRA --</option>
                    {MRA_BRANDS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="CUSTOM">-- Ketik Custom --</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Atau ketik nama brand di sini..."
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full sm:w-1/2 px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Kategori Layanan *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Kategori --</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* Vendor */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Vendor / Provider *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Google, Niagahoster, Biznet"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  required
                />
              </div>

              {/* Name */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Nama Layanan / Domain *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Google Workspace, example.com"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  required
                />
              </div>



              {/* Lokasi / Cabang */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Lokasi Fisik / Cabang / Gedung (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: HQ Wisma MRA Lt. 6, Butik Plaza Indonesia, Cloud Server"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                />
              </div>

              {/* No Kontrak / Billing ID (Highlight jika kategori ISP) */}
              <div className={`space-y-1 md:col-span-2 transition-all ${formCategory === 'ISP' ? 'p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30' : ''}`}>
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Nomor Kontrak / ID Pelanggan Billing / Circuit ID</span>
                  {formCategory === 'ISP' && (
                    <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide">
                      Kontrak ISP / Billing ID
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder={formCategory === 'ISP' ? "Ex: Customer ID Biznet: 123456, SID Astinet: 0012398" : "Ex: No Kontrak Billing, Customer ID, Circuit ID ISP"}
                  value={formContractNumber}
                  onChange={(e) => setFormContractNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>

              {/* Billing Cycle */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Siklus Penagihan *
                </label>
                <select
                  value={formBillingCycle}
                  onChange={(e) => setFormBillingCycle(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                  required
                >
                  {BILLING_CYCLES.map(cycle => <option key={cycle} value={cycle}>{cycle}</option>)}
                </select>
              </div>

              {/* Cost */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Biaya (Rp) *
                </label>
                <input
                  type="text"
                  placeholder="Ex: 150.000"
                  value={formCost}
                  onChange={(e) => setFormCost(formatNumberForInput(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  required
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Tanggal Mulai *
                </label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                  required
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Tanggal Kedaluwarsa *
                </label>
                <input
                  type="date"
                  value={formExpiryDate}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                  required
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Status *
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-755 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                  required
                >
                  <option value="ACTIVE">Aktif</option>
                  <option value="EXPIRED">Kedaluwarsa</option>
                  <option value="INACTIVE">Arsip / Inaktif</option>
                </select>
              </div>

              {/* Evidence Link */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Evidence / Tautan Dokumen Kontrak
                </label>
                <input
                  type="text"
                  placeholder="Ex: https://drive.google.com/..."
                  value={formEvidenceLink}
                  onChange={(e) => setFormEvidenceLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Catatan Tambahan (IP, Link Account, Admin Credentials)
                </label>
                <textarea
                  rows="2"
                  placeholder="Ex: Linked account admin@domain.com, IP: 192.168.1.1"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                />
              </div>

              {/* Journey (edit mode only) */}
              {isEditMode && (
                <div className="p-4 rounded-2xl bg-brand-50/20 dark:bg-brand-950/10 border border-brand-200/40 dark:border-brand-900/30 space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider flex items-center gap-1">
                    <History className="w-3.5 h-3.5 animate-spin-slow" />
                    Update Journey / Perpanjangan Kontrak
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Isi jika Anda baru saja memperpanjang. Contoh: Diperpanjang 2 tahun per 6 bulan (Rp 300rb)"
                    value={formUpdateJourney}
                    onChange={(e) => setFormUpdateJourney(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950/50 border border-brand-200/60 dark:border-brand-900/50 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  />
                </div>
              )}

            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-150 dark:border-slate-850 flex justify-end gap-3 bg-gray-50/50 dark:bg-slate-900/35">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100/50 dark:hover:bg-slate-800/60 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isEditMode ? 'Simpan Pembaruan' : isReplacementMode ? 'Simpan Kontrak Baru' : 'Simpan Layanan'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
