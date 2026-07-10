import React from 'react';
import { createPortal } from 'react-dom';
import { Building2, X } from 'lucide-react';

export default function RentalBreakdownModal({ isOpen, company, onClose, formatCurrency, formatDateDMY, selectedYear }) {
  if (!isOpen || !company) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-up">
        <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex items-start justify-between">
          <div>
            <h3 className="text-base font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-rose-500" />
              Breakdown Aset Sewa: {company.name}
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold mt-0.5">
              Daftar rinician unit sewa aktif beserta biaya masing-masing
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg p-1.5 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto max-h-[380px] custom-scroll p-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-950/20 text-gray-500 dark:text-slate-450 border-b border-slate-100 dark:border-slate-850 font-black uppercase tracking-wider text-[9px]">
                <th className="py-3.5 px-4">Nama Perangkat</th>
                <th className="py-3.5 px-4">Nama Karyawan</th>
                <th className="py-3.5 px-4">Vendor Jasa</th>
                <th className="py-3.5 px-4">Periode Kontrak</th>
                <th className="py-3.5 px-4 text-right">Biaya / Bulan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60">
              {company.assets && company.assets.length > 0 ? (
                company.assets.map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{asset.brand} {asset.model}</div>
                      <div className="text-[9px] text-gray-400 dark:text-slate-500 font-mono mt-0.5">
                        ID/Tag: {asset.assetTag || asset.deviceRef || '-'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {asset.user ? (
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{asset.user.name}</span>
                          {asset.user.department && (
                            <span className="text-[9px] text-gray-450 dark:text-slate-500 block font-semibold">({asset.user.department})</span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[9px] font-black uppercase tracking-wider">Shared / Cabang</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-semibold">
                      {asset.vendor || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono font-bold">
                      {formatDateDMY(asset.rentalStart)} s/d {formatDateDMY(asset.rentalEnd)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-850 dark:text-slate-100 font-mono text-[11px]">
                      {formatCurrency(asset.rentalCost)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400 dark:text-slate-500 italic font-semibold">
                    Tidak ada aset sewa aktif yang tercatat untuk unit bisnis ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/15">
          <div className="text-xs text-slate-700 dark:text-slate-300 font-bold">
            Total Proyeksi Tahun {selectedYear}:{' '}
            <span className="font-black text-rose-500 text-sm ml-1">{formatCurrency(company.totalCost)}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-150 hover:bg-slate-250 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-200 text-xs font-bold rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
