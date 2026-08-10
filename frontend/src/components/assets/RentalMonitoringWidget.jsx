import React, { useState } from 'react';
import { 
  Percent, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  UserCheck, 
  Clock, 
  ArrowRight,
  Laptop,
  HelpCircle,
  FileText
} from 'lucide-react';

export default function RentalMonitoringWidget({ assets, formatRupiah, onEditAsset, onOpenBast }) {
  const [showAllIdle, setShowAllIdle] = useState(false);
  const [showAllExpired, setShowAllExpired] = useState(false);

  const now = new Date();

  // 1. Filter semua aset bertipe RENTAL yang belum pensiun/diakhiri
  const rentalAssets = assets.filter(a => a.ownershipType === 'RENTAL' && a.status !== 'DISPOSED');

  // 2 & 3. Gunakan rentalStatus dari backend — tidak hitung ulang di frontend
  const activeRentals  = rentalAssets.filter(a => a.rentalStatus !== 'EXPIRED');
  const expiredRentals = rentalAssets.filter(a => a.rentalStatus === 'EXPIRED');

  // 4. Hitung status di antara sewa aktif
  const assignedActive = activeRentals.filter(a => a.status === 'ASSIGNED');
  const idleActive = activeRentals.filter(a => a.status === 'AVAILABLE');
  const maintenanceActive = activeRentals.filter(a => a.status === 'MAINTENANCE');

  const totalActive = activeRentals.length;
  const assignedActiveCount = assignedActive.length;
  
  // Persentase utilisasi sewa aktif
  const utilizationRate = totalActive > 0 
    ? Math.round((assignedActiveCount / totalActive) * 100) 
    : 0;

  // Format tanggal untuk visualisasi
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // Hitung jumlah hari keterlambatan kontrak habis
  const getDaysExpired = (dateStr) => {
    if (!dateStr) return 0;
    const diffTime = Math.abs(now - new Date(dateStr));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Batasi daftar yang ditampilkan demi kerapian UI
  const displayedIdle = showAllIdle ? idleActive : idleActive.slice(0, 5);
  const displayedExpired = showAllExpired ? expiredRentals : expiredRentals.slice(0, 5);

  // Helper warna progress ring
  const getProgressColorClass = (rate) => {
    if (rate >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (rate >= 50) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dasbor Ringkasan Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card Ring Utilizasi Bulat */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-black text-gray-700 dark:text-slate-300 font-outfit mb-4">
            Utilisasi Sewa Aktif
          </h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-slate-100 dark:text-slate-850 stroke-current"
                strokeWidth="10"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <circle
                className={`stroke-current transition-all duration-1000 ease-out ${getProgressColorClass(utilizationRate)}`}
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - utilizationRate / 100)}`}
                strokeLinecap="round"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-800 dark:text-slate-100 font-outfit">
                {utilizationRate}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                Utilized
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850/50 px-3 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800/20">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10.5px] font-bold text-gray-500 dark:text-slate-400 font-outfit">
              {assignedActiveCount} dari {totalActive} unit aktif terpakai
            </span>
          </div>
          
          <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
            * Tidak menghitung {expiredRentals.length} unit sewa yang masa kontraknya habis
          </p>
        </div>

        {/* Card Breakdowns Status Aktif */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-gray-700 dark:text-slate-300 font-outfit mb-3">
              Rincian Alokasi Perangkat Aktif
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">
              Status pembagian perangkat IT dengan durasi sewa yang masih sah (belum expired).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Status Assigned */}
            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 p-4 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Dipakai Karyawan
                </span>
                <UserCheck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-black text-blue-700 dark:text-blue-300 font-outfit">
                  {assignedActiveCount} <span className="text-xs font-semibold text-blue-500">Unit</span>
                </h4>
                <p className="text-[9.5px] text-blue-550 dark:text-blue-400/80 font-medium mt-1">
                  Sedang aktif digunakan operasional
                </p>
              </div>
            </div>

            {/* Status Idle/Available */}
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 p-4 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Menganggur (Ready)
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-outfit">
                  {idleActive.length} <span className="text-xs font-semibold text-emerald-500">Unit</span>
                </h4>
                <p className="text-[9.5px] text-emerald-550 dark:text-emerald-400/80 font-medium mt-1">
                  Siap didistribusikan ke karyawan
                </p>
              </div>
            </div>

            {/* Status Maintenance */}
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 p-4 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Dalam Perbaikan
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-black text-amber-700 dark:text-amber-300 font-outfit">
                  {maintenanceActive.length} <span className="text-xs font-semibold text-amber-500">Unit</span>
                </h4>
                <p className="text-[9.5px] text-amber-550 dark:text-amber-400/80 font-medium mt-1">
                  Perbaikan / penggantian hardware
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Grid Utama: Daftar Aset Menganggur & Kontrak Expired */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Aset Sewa Aktif Menganggur */}
        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-black text-gray-800 dark:text-slate-200 font-outfit">
                  Aset Sewa Aktif Menganggur ({idleActive.length})
                </h3>
                <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">
                  Aset siap pakai yang terus memakan biaya bulanan sewa. Segera manfaatkan.
                </p>
              </div>
              <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-outfit">
                Optimasi Cost
              </span>
            </div>

            {idleActive.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mb-2" />
                <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">Semua unit sewa aktif sudah terpakai!</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 font-medium">Utilisasi perangkat sewa berjalan 100%.</p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {displayedIdle.map(asset => (
                  <div key={asset.id} className="p-3 bg-slate-50 dark:bg-slate-850/50 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-center justify-between hover:border-blue-500/20 transition duration-150">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-800 dark:text-slate-200 font-outfit">{asset.assetTag}</span>
                          <span className="text-[8px] font-extrabold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-1 rounded font-outfit">
                            {asset.deviceRef || 'N/A'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-slate-550 font-semibold">
                          {asset.brand} {asset.model} • {asset.companyMaster?.name || 'MRA Group'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-[10.5px] font-black text-rose-500 dark:text-rose-455 font-outfit">
                        {formatRupiah(asset.rentalCost)}/bln
                      </span>
                      <button
                        onClick={() => onEditAsset(asset)}
                        className="text-[9.5px] font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline"
                      >
                        Tugaskan <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {idleActive.length > 5 && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40 text-center">
              <button 
                onClick={() => setShowAllIdle(!showAllIdle)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline transition"
              >
                {showAllIdle ? 'Sembunyikan' : `Tampilkan semua (${idleActive.length})`}
              </button>
            </div>
          )}
        </div>

        {/* Panel 2: Aset Sewa Kadaluarsa */}
        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-black text-gray-800 dark:text-slate-200 font-outfit">
                  Kontrak Sewa Kadaluarsa ({expiredRentals.length})
                </h3>
                <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">
                  Aset sewa yang tanggal batas sewanya telah lewat. Perlu perpanjangan atau pengembalian.
                </p>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg font-outfit ${expiredRentals.length > 0 ? 'bg-red-50 dark:bg-red-950/30 text-red-500' : 'bg-slate-50 dark:bg-slate-850/50 text-slate-400'}`}>
                Perlu Tindakan
              </span>
            </div>

            {expiredRentals.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mb-2" />
                <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">Hebat! Tidak ada kontrak sewa kadaluarsa.</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 font-medium">Semua sewa berada dalam batas masa aktif.</p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {displayedExpired.map(asset => (
                  <div key={asset.id} className="p-3 bg-red-50/10 dark:bg-red-950/5 rounded-2xl border border-red-200/10 dark:border-red-800/10 flex items-center justify-between hover:border-red-500/20 transition duration-150">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-800 dark:text-slate-200 font-outfit">{asset.assetTag}</span>
                          <span className="text-[8.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-outfit">
                            {asset.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-slate-550 font-semibold">
                          {asset.brand} {asset.model} • Habis: <span className="text-red-555 font-bold">{formatDate(asset.rentalEnd)}</span>
                        </p>
                        {asset.user && (
                          <p className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium">
                            Pemakai: <span className="text-slate-700 dark:text-slate-350 font-semibold">{asset.user.name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-[9px] font-black bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-455 px-2 py-0.5 rounded border border-rose-100 dark:border-rose-900/25 font-outfit">
                        Lewat {getDaysExpired(asset.rentalEnd)} Hari
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEditAsset(asset)}
                          className="text-[9.5px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Edit
                        </button>
                        {asset.status === 'ASSIGNED' && (
                          <button
                            onClick={() => onOpenBast(asset)}
                            className="text-[9.5px] font-extrabold text-gray-500 dark:text-slate-450 hover:underline flex items-center gap-0.5"
                          >
                            <FileText className="w-3 h-3" /> BAST
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {expiredRentals.length > 5 && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40 text-center">
              <button 
                onClick={() => setShowAllExpired(!showAllExpired)}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline transition"
              >
                {showAllExpired ? 'Sembunyikan' : `Tampilkan semua (${expiredRentals.length})`}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
