import React from 'react';
import { Laptop, Smartphone, Trash2, Edit2, Loader2, AlertTriangle, CheckCircle2, Clock, FileText, Eye, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import PendingProcessPlaceholder from '../PendingProcessPlaceholder';
import { STATUS_OPTIONS } from './constants';

export default function AssetTable({
  sortedAssets, filteredAssets, assets, loading, assetsLoaded,
  handleSort, sortConfig,
  handleOpenViewDrawer, handleOpenBastModal, handleOpenEditModal, handleDelete,
  formatRupiah, formatDateYYMMDD, isSmartphone,
  user,
}) {
  const renderSortIcon = (column) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 text-gray-350 dark:text-slate-600" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-3 h-3 text-rose-500" />
      : <ArrowDown className="w-3 h-3 text-rose-500" />;
  };

  if (!assetsLoaded && !loading) {
    return (
      <PendingProcessPlaceholder
        title="Filter & Proses Data Aset"
        description={'Pilih kriteria pencarian dan filter di atas (opsional), lalu klik tombol "Proses / Muat Data" untuk menampilkan data inventaris aset IT.'}
      />
    );
  }

  return (
    <div className="glass-panel rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden">
      {loading && assets.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          <span className="text-xs text-gray-500 font-semibold">Memuat Inventaris Aset...</span>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12 animate-fade-in">
          <p className="text-sm font-semibold text-gray-550 dark:text-slate-400">Tidak ada aset IT ditemukan.</p>
        </div>
      ) : (
        <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <table className="w-full text-left text-xs font-semibold border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6 cursor-pointer hover:text-gray-600 dark:hover:text-slate-300 transition" onClick={() => handleSort('model')}>
                  <span className="flex items-center gap-1">Model Perangkat {renderSortIcon('model')}</span>
                </th>
                <th className="py-4 px-6 cursor-pointer hover:text-gray-600 dark:hover:text-slate-300 transition" onClick={() => handleSort('assetTag')}>
                  <span className="flex items-center gap-1">Tag Aset / Ref {renderSortIcon('assetTag')}</span>
                </th>
                <th className="py-4 px-6 cursor-pointer hover:text-gray-600 dark:hover:text-slate-300 transition" onClick={() => handleSort('companyMaster')}>
                  <span className="flex items-center gap-1">Entitas (Master) {renderSortIcon('companyMaster')}</span>
                </th>
                <th className="py-4 px-6 cursor-pointer hover:text-gray-600 dark:hover:text-slate-300 transition" onClick={() => handleSort('user')}>
                  <span className="flex items-center gap-1">Karyawan / Pengguna {renderSortIcon('user')}</span>
                </th>
                <th className="py-4 px-6 cursor-pointer hover:text-gray-600 dark:hover:text-slate-300 transition" onClick={() => handleSort('rentalCost')}>
                  <span className="flex items-center gap-1">Biaya Sewa / Harga Beli {renderSortIcon('rentalCost')}</span>
                </th>
                <th className="py-4 px-6 cursor-pointer hover:text-gray-600 dark:hover:text-slate-300 transition" onClick={() => handleSort('rentalEnd')}>
                  <span className="flex items-center gap-1">Selesai Sewa / Milik {renderSortIcon('rentalEnd')}</span>
                </th>
                <th className="py-4 px-6 text-center cursor-pointer hover:text-gray-600 dark:hover:text-slate-300 transition" onClick={() => handleSort('status')}>
                  <span className="flex items-center justify-center gap-1">Status {renderSortIcon('status')}</span>
                </th>
                <th className="py-4 px-6 text-center">Sync GA</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-700 dark:text-slate-300">
              {sortedAssets.map((asset) => {
                const statusObj = STATUS_OPTIONS.find(o => o.value === asset.status) || STATUS_OPTIONS[0];
                const leaseEnd = new Date(asset.rentalEnd);
                const today = new Date();
                const remainingDays = Math.ceil((leaseEnd - today) / (1000 * 60 * 60 * 24));
                const isLeaseNearExpiry = remainingDays >= 0 && remainingDays <= 90;
                const isLeaseExpired = remainingDays < 0;
                const isPhone = isSmartphone(asset);

                return (
                  <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg shrink-0 ${isPhone ? 'bg-indigo-500/10 text-indigo-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {isPhone ? <Smartphone className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-gray-800 dark:text-slate-100 text-xs truncate max-w-[220px] flex items-center gap-1.5">
                            <span>{asset.brand} {asset.model}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 ${
                              asset.ownershipType === 'OWNED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-455'
                            }`}>
                              {asset.ownershipType === 'OWNED' ? 'Milik' : 'Sewa'}
                            </span>
                          </h4>
                          <p className="text-[10px] text-gray-400 font-medium truncate">
                            CPU: {asset.processor || '-'} | OS: {asset.os || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>{asset.assetTag}</div>
                      {asset.deviceRef && (
                        <div className="text-[10px] text-rose-500 font-semibold font-mono">Ref: {asset.deviceRef}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-750 dark:text-slate-350">
                      {asset.companyMaster?.name || '-'}
                    </td>
                    <td className="py-4 px-6">
                      {asset.user ? (
                        <div>
                          <div className="font-bold text-gray-800 dark:text-slate-200">{asset.user.name}</div>
                          <div className="text-[10px] text-gray-405 dark:text-slate-400 font-medium truncate max-w-[150px]">{asset.user.department}</div>
                        </div>
                      ) : asset.company ? (
                        <div>
                          <div className="font-bold text-slate-700 dark:text-slate-300">Shared / Cabang</div>
                          <div className="text-[10px] text-gray-405 dark:text-slate-400 font-semibold truncate max-w-[150px]">{asset.company.location}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic font-medium">Tersedia di IT</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono text-gray-850 dark:text-slate-100 font-bold">
                      <div>{formatRupiah(asset.rentalCost)}</div>
                      <div className="text-[8px] font-semibold uppercase tracking-wider mt-0.5">
                        {asset.ownershipType === 'OWNED'
                          ? <span className="text-emerald-500">Harga Beli</span>
                          : <span className="text-gray-450">/ bulan</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono">
                      {asset.ownershipType === 'OWNED' ? (
                        <span className="text-gray-400 font-semibold italic text-[10px]">N/A (Milik)</span>
                      ) : (
                        <>
                          <div>{formatDateYYMMDD(asset.rentalEnd)}</div>
                          {isLeaseExpired ? (
                            <span className="text-[9px] font-black text-red-500 block">Sewa Habis!</span>
                          ) : isLeaseNearExpiry ? (
                            <span className="text-[9px] font-bold text-amber-500 block">{remainingDays} hari sisa sewa</span>
                          ) : (
                            <span className="text-[9px] text-slate-400 block">{remainingDays} hari sisa sewa</span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${statusObj.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`} />
                        {statusObj.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      {asset.ownershipType !== 'RENTAL' ? (
                        <span className="text-[10px] text-gray-350 dark:text-slate-600">-</span>
                      ) : asset.gaSyncStatus === 'SYNCED' ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 cursor-help"
                          title={`Tersinkron ke GA${asset.gaSyncedAt ? ' pada ' + new Date(asset.gaSyncedAt).toLocaleString('id-ID') : ''}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      ) : asset.gaSyncStatus === 'FAILED' ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 cursor-help"
                          title={`Sync GA Gagal: ${asset.gaSyncError || 'Tidak ada detail error.'}`}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-help"
                          title="Belum pernah disinkronkan ke GA.">
                          <Clock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleOpenViewDrawer(asset)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-emerald-500 rounded-lg transition" title="Lihat Detail Aset">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {asset.status === 'ASSIGNED' && (
                          <button onClick={() => handleOpenBastModal(asset)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-indigo-500 rounded-lg transition" title="Cetak BAST (Serah Terima)">
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleOpenEditModal(asset)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-rose-500 rounded-lg transition" title="Edit Detail Aset">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(asset)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-red-555 rounded-lg transition" title="Hapus Aset">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
