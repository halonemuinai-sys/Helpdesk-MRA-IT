import React from 'react';
import { X, Wallet, Save } from 'lucide-react';

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Realisasi Riil (Rp)
              </label>
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-bold text-xs">
                Dihitung otomatis dari transaksi yang di-tag
              </div>
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
