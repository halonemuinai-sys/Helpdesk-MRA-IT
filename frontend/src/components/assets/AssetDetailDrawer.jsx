import React from 'react';
import { createPortal } from 'react-dom';
import { Laptop, Smartphone, X, Cpu, DollarSign, History, FileText, Edit2 } from 'lucide-react';
import { STATUS_OPTIONS } from './constants';

export default function AssetDetailDrawer({
  isViewDrawerOpen, viewingAsset, onClose,
  handleOpenBastModal, handleOpenEditModal,
  formatRupiah, formatDateYYMMDD,
  isSmartphone,
}) {
  if (!isViewDrawerOpen || !viewingAsset) return null;

  const statusObj = STATUS_OPTIONS.find(o => o.value === viewingAsset.status) || STATUS_OPTIONS[0];
  const isPhone = isSmartphone(viewingAsset);

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-955/60 backdrop-blur-sm transition-opacity cursor-pointer animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-gray-150 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-slide-left overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-150 dark:border-slate-850">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isPhone ? 'bg-indigo-500/10 text-indigo-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {isPhone ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <span>{viewingAsset.brand} {viewingAsset.model}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                  viewingAsset.ownershipType === 'OWNED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-455'
                }`}>
                  {viewingAsset.ownershipType === 'OWNED' ? 'Milik' : 'Sewa'}
                </span>
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5 font-mono">
                Tag Aset: {viewingAsset.assetTag}{viewingAsset.deviceRef ? ` | Ref: ${viewingAsset.deviceRef}` : ''}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-semibold text-gray-700 dark:text-slate-350">

          {/* Status Badge */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-955/20 p-3 rounded-xl border border-gray-150 dark:border-slate-850">
            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Status Perangkat:</span>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${statusObj.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`} />
              {statusObj.label}
            </span>
          </div>

          {/* Specs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
              <Cpu className="w-3.5 h-3.5 text-rose-500" />
              Spesifikasi Perangkat
            </h4>
            <div className="grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-955/20 p-4 rounded-xl border border-gray-150/60 dark:border-slate-850/60">
              <div>
                <span className="text-[10px] text-gray-400 block">Brand & Model</span>
                <span className="font-bold text-gray-900 dark:text-white">{viewingAsset.brand} {viewingAsset.model}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">Processor</span>
                <span className="font-bold text-gray-950 dark:text-slate-200">{viewingAsset.processor || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">RAM (Memory)</span>
                <span className="font-bold text-gray-950 dark:text-slate-200">{viewingAsset.ram || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">Storage</span>
                <span className="font-bold text-gray-955 dark:text-slate-200">{viewingAsset.storage || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">Operating System (OS)</span>
                <span className="font-bold text-gray-950 dark:text-slate-200">{viewingAsset.os || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">Microsoft Office</span>
                <span className="font-bold text-gray-955 dark:text-slate-200">{viewingAsset.office || '-'}</span>
              </div>
            </div>
          </div>

          {/* Financials & Lease */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
              <DollarSign className="w-3.5 h-3.5 text-rose-500" />
              Informasi Finansial & Sewa
            </h4>
            <div className="space-y-2 bg-slate-50/50 dark:bg-slate-955/20 p-4 rounded-xl border border-gray-150/60 dark:border-slate-850/60">
              <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-slate-850/40">
                <span className="text-gray-400">Entitas Master:</span>
                <span className="font-bold text-gray-900 dark:text-white">{viewingAsset.companyMaster?.name || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-slate-850/40">
                <span className="text-gray-400">Pengguna / Cabang:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {viewingAsset.user
                    ? `${viewingAsset.user.name} (${viewingAsset.user.department})`
                    : viewingAsset.company
                      ? `Shared / ${viewingAsset.company.location}`
                      : 'Tersedia di IT'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-slate-850/40">
                <span className="text-gray-400">{viewingAsset.ownershipType === 'OWNED' ? 'Harga Pembelian:' : 'Biaya Sewa Bulanan:'}</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatRupiah(viewingAsset.rentalCost)}</span>
              </div>
              {viewingAsset.vendorRef && (
                <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-slate-850/40">
                  <span className="text-gray-400">{viewingAsset.ownershipType === 'OWNED' ? 'No. Invoice / PO:' : 'No. Kontrak Vendor:'}</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{viewingAsset.vendorRef}</span>
                </div>
              )}
              {viewingAsset.ownershipType === 'RENTAL' && (
                <>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-slate-850/40">
                    <span className="text-gray-400">Vendor Penyedia:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{viewingAsset.vendor || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-slate-850/40">
                    <span className="text-gray-400">Periode Kontrak Sewa:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatDateYYMMDD(viewingAsset.rentalStart)} s/d {formatDateYYMMDD(viewingAsset.rentalEnd)}
                    </span>
                  </div>
                </>
              )}
              {viewingAsset.ownershipType === 'OWNED' && (
                <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-slate-850/40">
                  <span className="text-gray-400">Tanggal Pembelian:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatDateYYMMDD(viewingAsset.rentalStart)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {viewingAsset.notes && (
            <div className="space-y-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Catatan Tambahan:</span>
              <p className="text-gray-600 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-955/20 p-3 rounded-lg border border-gray-150 dark:border-slate-855/60 whitespace-pre-wrap">
                {viewingAsset.notes}
              </p>
            </div>
          )}

          {/* Journey Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
              <History className="w-3.5 h-3.5 text-rose-500" />
              Riwayat Aset & Serah Terima (Journey)
            </h4>
            <div className="bg-slate-50/30 dark:bg-slate-955/10 p-4 rounded-xl border border-gray-150 dark:border-slate-855/50 max-h-60 overflow-y-auto">
              {(!viewingAsset.journey || !viewingAsset.journey.trim()) ? (
                <p className="text-gray-400 italic py-2 text-center">Belum ada riwayat aktivitas tercatat.</p>
              ) : (
                <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-4 py-1 text-xs">
                  {viewingAsset.journey.split('\n').filter(Boolean).map((line, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-rose-500 border border-white dark:border-slate-900" />
                      <div className="font-semibold text-gray-700 dark:text-slate-300">{line}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-150 dark:border-slate-855 bg-slate-50/50 dark:bg-slate-955/20 flex justify-end gap-3">
          {viewingAsset.status === 'ASSIGNED' && (
            <button
              onClick={() => { handleOpenBastModal(viewingAsset); onClose(); }}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-250 dark:border-slate-855 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
            >
              <FileText className="w-3.5 h-3.5" />
              Cetak BAST
            </button>
          )}
          <button
            onClick={() => { handleOpenEditModal(viewingAsset); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Aset
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
