import React from 'react';
import { createPortal } from 'react-dom';
import { Users, X, CheckCircle2, Loader2 } from 'lucide-react';

export default function RentalEditUserModal({
  isOpen, editingUser, editingUserBudget, setEditingUserBudget,
  savingBudget, onClose, onSubmit, formatNumberForInput,
}) {
  if (!isOpen || !editingUser) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
        <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-500" />
            Atur Anggaran Karyawan
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg p-1 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-6 space-y-4">
            <div className="bg-slate-50/50 dark:bg-slate-950/15 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
              <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Karyawan</span>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100">{editingUser.name}</p>
              <p className="text-xs text-gray-405 dark:text-slate-500 font-mono mt-0.5">NIP: {editingUser.id}</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Batas Budget Bulanan (IDR) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                <input
                  type="text"
                  required
                  value={editingUserBudget}
                  onChange={(e) => setEditingUserBudget(formatNumberForInput(e.target.value))}
                  placeholder="e.g. 500.000"
                  className="w-full pl-9 pr-4 py-2.5 text-xs font-bold rounded-2xl bg-slate-50/60 dark:bg-slate-955/35 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition shadow-inner"
                />
              </div>
              <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-1">
                Anggaran diset per bulan untuk tagihan sewa laptop/smartphone user ini.
              </p>
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
