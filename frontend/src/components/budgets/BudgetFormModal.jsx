import React from 'react';
import { X, Wallet, Save, DollarSign } from 'lucide-react';

const formatRupiah = (val) => {
  if (!val || isNaN(val)) return '';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
};

export default function BudgetFormModal({
  isOpen,
  onClose,
  editingId,
  companies = [],
  brands = [],
  departments = [],
  formProjectName,
  setFormProjectName,
  formCompanyMasterId,
  setFormCompanyMasterId,
  formBrand,
  setFormBrand,
  formDepartment,
  setFormDepartment,
  formFiscalYear,
  setFormFiscalYear,
  formBudgetType,
  setFormBudgetType,
  formAccountType,
  setFormAccountType,
  formAllocatedBudget,
  setFormAllocatedBudget,
  formCurrency = 'IDR',
  setFormCurrency,
  formExchangeRate = '15800',
  setFormExchangeRate,
  formAllocatedBudgetForeign = '',
  setFormAllocatedBudgetForeign,
  formPriority,
  setFormPriority,
  formStatus,
  setFormStatus,
  formNotes,
  setFormNotes,
  formSubmitting,
  onSubmit
}) {
  if (!isOpen) return null;

  const idrEquivalent = formCurrency === 'USD' && formAllocatedBudgetForeign && formExchangeRate
    ? parseFloat(formAllocatedBudgetForeign) * parseFloat(formExchangeRate)
    : null;

  const handleForeignChange = (val) => {
    setFormAllocatedBudgetForeign(val);
    if (val && formExchangeRate) {
      const idr = parseFloat(val) * parseFloat(formExchangeRate);
      setFormAllocatedBudget(isNaN(idr) ? '' : String(Math.round(idr)));
    } else {
      setFormAllocatedBudget('');
    }
  };

  const handleRateChange = (val) => {
    setFormExchangeRate(val);
    if (formAllocatedBudgetForeign && val) {
      const idr = parseFloat(formAllocatedBudgetForeign) * parseFloat(val);
      setFormAllocatedBudget(isNaN(idr) ? '' : String(Math.round(idr)));
    }
  };

  const handleCurrencyToggle = (currency) => {
    setFormCurrency(currency);
    if (currency === 'IDR') {
      setFormAllocatedBudgetForeign('');
    } else {
      setFormAllocatedBudget('');
      setFormAllocatedBudgetForeign('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                {editingId ? 'Edit Item Anggaran Proyek' : 'Input Anggaran Proyek Baru'}
              </h3>
              <p className="text-xs text-gray-500 font-medium">Form Alokasi Pagu &amp; Perencanaan Anggaran IT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Proyek / Item Anggaran *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Modernisasi POS & Integration System"
              value={formProjectName}
              onChange={(e) => setFormProjectName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Entitas Induk PT MRA *
              </label>
              <select
                value={formCompanyMasterId}
                onChange={(e) => setFormCompanyMasterId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Brand Business Unit MRA
              </label>
              <select
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Departemen Pengguna *
              </label>
              <select
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tahun Fiskal *
              </label>
              <select
                value={formFiscalYear}
                onChange={(e) => setFormFiscalYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tipe Biaya *
              </label>
              <select
                value={formBudgetType}
                onChange={(e) => setFormBudgetType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                <option value="CAPEX">CAPEX (Capital Expense / Inovasi &amp; Aset)</option>
                <option value="OPEX">OPEX (Operational Expense / Biaya Rutin)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Type (Kategori Akun)
              </label>
              <select
                value={formAccountType}
                onChange={(e) => setFormAccountType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                <option value="Utilities">Utilities</option>
                <option value="License & Permit">License &amp; Permit</option>
                <option value="Repair & Maintenance">Repair &amp; Maintenance</option>
                <option value="Rental Expenses">Rental Expenses</option>
                <option value="Telecommunication">Telecommunication</option>
                <option value="Proyek & Inovasi">Proyek &amp; Inovasi</option>
              </select>
            </div>
          </div>

          {/* Currency Section */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-bold text-slate-700 dark:text-slate-300">Mata Uang & Pagu Anggaran *</span>
            </div>

            {/* Currency toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleCurrencyToggle('IDR')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs border transition ${
                  formCurrency === 'IDR'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                Rupiah (IDR)
              </button>
              <button
                type="button"
                onClick={() => handleCurrencyToggle('USD')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs border transition ${
                  formCurrency === 'USD'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                }`}
              >
                US Dollar (USD)
              </button>
            </div>

            {formCurrency === 'IDR' ? (
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pagu Anggaran (Rp) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 45000000"
                  value={formAllocatedBudget}
                  onChange={(e) => setFormAllocatedBudget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jumlah (USD) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder="Contoh: 3000"
                      value={formAllocatedBudgetForeign}
                      onChange={(e) => handleForeignChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kurs IDR/USD
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 15800"
                      value={formExchangeRate}
                      onChange={(e) => handleRateChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                    />
                  </div>
                </div>
                {idrEquivalent !== null && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">= {formatRupiah(idrEquivalent)}</span>
                    <span className="text-emerald-600 dark:text-emerald-500 text-xs">(nilai yang disimpan dalam sistem)</span>
                  </div>
                )}
                {!formAllocatedBudgetForeign && (
                  <p className="text-amber-600 dark:text-amber-400 text-xs">Masukkan jumlah USD untuk melihat ekuivalen IDR.</p>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Realisasi Riil (Rp)
            </label>
            <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-bold text-xs">
              Dihitung otomatis dari transaksi yang di-tag
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Prioritas
              </label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Approval
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                <option value="PROPOSED">PROPOSED (Usulan)</option>
                <option value="APPROVED">APPROVED (Disetujui)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Berjalan)</option>
                <option value="COMPLETED">COMPLETED (Selesai)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Keterangan
            </label>
            <textarea
              rows="2"
              placeholder="Catatan pendukung atau justifikasi anggaran..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            ></textarea>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {formSubmitting ? 'Menyimpan...' : 'Simpan Anggaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
