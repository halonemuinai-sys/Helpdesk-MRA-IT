import React from 'react';
import { createPortal } from 'react-dom';
import { Building2, X, CheckCircle2, Loader2, Info } from 'lucide-react';

export default function RentalEditCompanyModal({
  isOpen, editingCompany,
  editingCompanyBudget, setEditingCompanyBudget,
  editingCompanySharedBudget, setEditingCompanySharedBudget,
  savingBudget, onClose, onSubmit,
  formatCurrency, formatNumberForInput,
}) {
  if (!isOpen || !editingCompany) return null;

  const empBudgetRaw = parseFloat(editingCompanyBudget.toString().replace(/\./g, '')) || 0;

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
        <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-rose-500" />
            Atur Anggaran Unit Bisnis
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg p-1 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-6 space-y-4">
            <div className="bg-slate-50/50 dark:bg-slate-950/15 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
              <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Badan Usaha</span>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100">{editingCompany.name}</p>
            </div>

            {/* Employee Budget */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-850/80 pt-4">
              <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider block">A. Anggaran Karyawan (Distribusi)</span>

              <div className="p-3 bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/10 dark:border-sky-500/20 rounded-2xl text-[11px] text-sky-700 dark:text-sky-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  Anggaran ini akan dibagi rata untuk seluruh karyawan aktif di unit bisnis ini
                  ({editingCompany.users.length} karyawan).
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Total Anggaran Bulanan Karyawan
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                  <input
                    type="text"
                    required
                    value={editingCompanyBudget}
                    onChange={(e) => setEditingCompanyBudget(formatNumberForInput(e.target.value))}
                    placeholder="e.g. 5.000.000"
                    className="w-full pl-9 pr-4 py-2.5 text-xs font-bold rounded-2xl bg-slate-50/60 dark:bg-slate-955/35 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition shadow-inner"
                  />
                </div>
                {editingCompany.users.length > 0 && (
                  <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-1">
                    Rata-rata alokasi: {formatCurrency(empBudgetRaw / editingCompany.users.length)} / Karyawan
                  </p>
                )}
              </div>
            </div>

            {/* Shared Budget */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-850/80 pt-4">
              <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider block">B. Anggaran Perangkat Bersama (Shared)</span>
              <div>
                <label className="text-[10px] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Anggaran Bulanan Shared / Cabang
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                  <input
                    type="text"
                    required
                    value={editingCompanySharedBudget}
                    onChange={(e) => setEditingCompanySharedBudget(formatNumberForInput(e.target.value))}
                    placeholder="e.g. 1.000.000"
                    className="w-full pl-9 pr-4 py-2.5 text-xs font-bold rounded-2xl bg-slate-50/60 dark:bg-slate-955/35 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition shadow-inner"
                  />
                </div>
                <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-1">
                  Khusus alokasi sewa perangkat bersama di toko/cabang (non-personal).
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 p-5 border-t border-slate-100 dark:border-slate-850">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-250 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-350 text-xs font-bold rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingBudget}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-500/10 disabled:opacity-50"
              style={{ backgroundColor: '#f43f5e', color: '#ffffff' }}
            >
              {savingBudget ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
