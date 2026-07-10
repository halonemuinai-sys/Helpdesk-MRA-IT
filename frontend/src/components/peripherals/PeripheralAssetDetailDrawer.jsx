import React from 'react';
import { createPortal } from 'react-dom';
import { X, Cpu, Clock } from 'lucide-react';

export default function PeripheralAssetDetailDrawer({ viewingAsset, onClose, companyMasters, formatRupiah, statusOptions }) {
  if (!viewingAsset) return null;

  const statusObj = statusOptions.find(o => o.value === viewingAsset.status) || statusOptions[0];

  return createPortal(
    <div className="fixed inset-0 z-[999] flex justify-end">
      {/* Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col animate-slide-in">

        {/* Header */}
        <div className="p-5 border-b border-gray-150 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-955/20">
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider font-outfit">
              Detail & Timeline Periferal
            </h3>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">ID: {viewingAsset.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-450 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Spec Card */}
          <div className="p-5 rounded-2xl border border-gray-150 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-150 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-900 dark:text-white">{viewingAsset.name}</h4>
                <span className="text-[9px] font-extrabold uppercase bg-gray-100 dark:bg-slate-800 text-gray-500 px-2 py-0.5 rounded mt-1 inline-block">
                  {viewingAsset.category}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Brand</span>
                <span className="font-bold text-gray-800 dark:text-slate-200 mt-0.5 block">{viewingAsset.brand}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Model / Tipe</span>
                <span className="font-bold text-gray-800 dark:text-slate-200 mt-0.5 block">{viewingAsset.model || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Serial Number (S/N)</span>
                <span className="font-mono text-gray-850 dark:text-slate-200 mt-0.5 block break-all">{viewingAsset.serialNumber || '-'}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Kuantitas</span>
                <span className="font-bold text-gray-850 dark:text-slate-200 mt-0.5 block">{viewingAsset.quantity} Unit</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Status Saat Ini</span>
                <span className="mt-1 block">
                  <span className={`inline-flex items-center gap-1.5 text-[8px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${statusObj.color}`}>
                    <span className={`w-1 h-1 rounded-full ${statusObj.dot}`} />
                    {statusObj.label}
                  </span>
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Lokasi Cabang</span>
                <span className="font-bold text-gray-805 dark:text-slate-200 mt-0.5 block">
                  {viewingAsset.company?.name || 'STOCK (Gudang IT MRA)'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Entitas Pembayar</span>
                <span className="font-bold text-gray-805 dark:text-slate-200 mt-0.5 block">
                  {companyMasters.find(c => c.id === viewingAsset.companyMasterId)?.name || '-'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Harga Unit</span>
                <span className="font-bold text-gray-850 dark:text-slate-200 mt-0.5 block">{formatRupiah(viewingAsset.purchaseCost)}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Total Harga Pembelian</span>
                <span className="font-bold text-rose-500 dark:text-rose-455 mt-0.5 block">{formatRupiah(viewingAsset.totalCost)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">No. Invoice Ref</span>
                <span className="font-bold text-gray-850 dark:text-slate-200 mt-0.5 block">{viewingAsset.invoiceRef || '-'}</span>
              </div>
              {viewingAsset.notes && (
                <div className="col-span-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Catatan Tambahan</span>
                  <span className="font-semibold text-gray-700 dark:text-slate-350 mt-0.5 block">{viewingAsset.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Journey Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-150 dark:border-slate-800 pb-2">
              <Clock className="w-4 h-4 text-rose-500" />
              Riwayat & Pergerakan Aset (Journey)
            </h4>

            {(!viewingAsset.journey || !viewingAsset.journey.trim()) ? (
              <div className="p-8 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-xs text-gray-400 font-semibold italic">
                Belum ada riwayat tercatat untuk perangkat periferal ini.
              </div>
            ) : (
              <div className="relative border-l border-gray-200 dark:border-slate-800 ml-3 pl-5 space-y-6 py-2">
                {viewingAsset.journey.split('\n').filter(Boolean).map((line, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[26px] top-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white dark:border-slate-900 shadow-sm" />
                    <p className="text-xs font-semibold text-gray-700 dark:text-slate-350 leading-relaxed font-mono">{line}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-150 dark:border-slate-800 flex justify-end bg-gray-50/30 dark:bg-slate-955/10">
          <button
            type="button" onClick={onClose}
            className="px-4 py-2 border border-gray-250 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
