import React from 'react';
import { Building2, TrendingUp, AlertCircle, ShieldAlert, Laptop, CheckCircle2 } from 'lucide-react';

export default function CompanyBreakdownWidget({ assets, companyMasters, formatRupiah }) {
  // 1. Ambil semua unit sewa aktif — gunakan rentalStatus dari backend (bukan hitung ulang)
  const activeRentalAssets = assets.filter(a => {
    return a.ownershipType === 'RENTAL' && a.rentalStatus !== 'EXPIRED';
  });

  // 2. Lakukan pengelompokkan (grouping) berdasarkan CompanyMaster
  const breakdownData = companyMasters.map(master => {
    const companyAssets = activeRentalAssets.filter(a => a.companyMasterId === master.id);
    const totalCount = companyAssets.length;
    const assignedCount = companyAssets.filter(a => a.status === 'ASSIGNED').length;
    const idleCount = companyAssets.filter(a => a.status === 'AVAILABLE').length;
    const maintenanceCount = companyAssets.filter(a => a.status === 'MAINTENANCE').length;
    
    const monthlyCost = companyAssets.reduce((sum, a) => sum + (a.rentalCost || 0), 0);
    const utilizationRate = totalCount > 0 ? Math.round((assignedCount / totalCount) * 100) : 0;

    return {
      id: master.id,
      name: master.name,
      sector: master.sector || 'N/A',
      totalCount,
      assignedCount,
      idleCount,
      maintenanceCount,
      monthlyCost,
      utilizationRate
    };
  }).filter(data => data.totalCount > 0); // Hanya tampilkan perusahaan yang memiliki unit sewa aktif

  // Hitung grup "Lainnya / Tanpa Perusahaan Induk" jika ada aset sewa aktif tanpa CompanyMasterId
  const unassignedAssets = activeRentalAssets.filter(a => !a.companyMasterId);
  if (unassignedAssets.length > 0) {
    const totalCount = unassignedAssets.length;
    const assignedCount = unassignedAssets.filter(a => a.status === 'ASSIGNED').length;
    const idleCount = unassignedAssets.filter(a => a.status === 'AVAILABLE').length;
    const maintenanceCount = unassignedAssets.filter(a => a.status === 'MAINTENANCE').length;
    
    const monthlyCost = unassignedAssets.reduce((sum, a) => sum + (a.rentalCost || 0), 0);
    const utilizationRate = totalCount > 0 ? Math.round((assignedCount / totalCount) * 100) : 0;

    breakdownData.push({
      id: 'unassigned',
      name: 'Perusahaan Belum Ditentukan',
      sector: 'N/A',
      totalCount,
      assignedCount,
      idleCount,
      maintenanceCount,
      monthlyCost,
      utilizationRate
    });
  }

  // 3. Urutkan berdasarkan total perangkat terbanyak secara default
  breakdownData.sort((a, b) => b.totalCount - a.totalCount);

  // 4. Hitung akumulasi Grand Total untuk baris terbawah tabel
  const grandTotal = breakdownData.reduce((acc, cur) => ({
    totalCount: acc.totalCount + cur.totalCount,
    assignedCount: acc.assignedCount + cur.assignedCount,
    idleCount: acc.idleCount + cur.idleCount,
    maintenanceCount: acc.maintenanceCount + cur.maintenanceCount,
    monthlyCost: acc.monthlyCost + cur.monthlyCost
  }), { totalCount: 0, assignedCount: 0, idleCount: 0, maintenanceCount: 0, monthlyCost: 0 });

  const grandUtilizationRate = grandTotal.totalCount > 0
    ? Math.round((grandTotal.assignedCount / grandTotal.totalCount) * 100)
    : 0;

  // Helper warna progress bar
  const getProgressBarColor = (rate) => {
    if (rate >= 80) return 'bg-emerald-500';
    if (rate >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getProgressBgColor = (rate) => {
    if (rate >= 80) return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400';
    if (rate >= 50) return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400';
    return 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455';
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/40">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-rose-500" />
          <h3 className="text-sm font-black text-gray-800 dark:text-slate-250 font-outfit">
            Breakdown Utilisasi Sewa Per Perusahaan
          </h3>
        </div>
        <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium mt-1">
          Analisis alokasi unit sewa aktif (tidak menghitung kontrak sewa kadaluarsa) serta estimasi biaya sewa bulanan per masing-masing entitas perusahaan.
        </p>
      </div>

      {breakdownData.length === 0 ? (
        <div className="py-16 text-center">
          <Laptop className="w-10 h-10 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-xs text-gray-500 dark:text-slate-400 font-bold">Tidak ada unit sewa aktif ditemukan.</p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Daftarkan aset sewa baru terlebih dahulu.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-850/40 border-b border-slate-100 dark:border-slate-800/40">
                <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider pl-6">Perusahaan</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider text-center">Total Sewa Aktif</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider text-center">Dipakai (Assigned)</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider text-center">Menganggur (Idle)</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider text-center">Servis</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Tingkat Utilisasi</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider text-right pr-6">Pengeluaran Sewa / Bln</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {breakdownData.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20 transition-all duration-150 group">
                  {/* Nama Perusahaan */}
                  <td className="p-4 pl-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-gray-800 dark:text-slate-200 group-hover:text-rose-500 transition duration-150 font-outfit">
                        {row.name}
                      </span>
                      <span className="text-[9px] text-gray-400 dark:text-slate-550 font-extrabold uppercase mt-0.5 tracking-wide">
                        Sektor: {row.sector}
                      </span>
                    </div>
                  </td>
                  
                  {/* Total Aset */}
                  <td className="p-4 text-center font-bold text-xs text-gray-700 dark:text-slate-300 font-outfit">
                    {row.totalCount} Unit
                  </td>

                  {/* Terpakai (Assigned) */}
                  <td className="p-4 text-center font-bold text-xs text-blue-600 dark:text-blue-400 font-outfit">
                    {row.assignedCount} Unit
                  </td>

                  {/* Menganggur (Idle) */}
                  <td className="p-4 text-center">
                    <span className={`inline-block text-[10.5px] font-bold px-2 py-0.5 rounded-lg ${row.idleCount > 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-outfit' : 'text-slate-400 dark:text-slate-550'}`}>
                      {row.idleCount} Unit
                    </span>
                  </td>

                  {/* Servis */}
                  <td className="p-4 text-center">
                    <span className={`inline-block text-[10.5px] font-bold px-2 py-0.5 rounded-lg ${row.maintenanceCount > 0 ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-outfit' : 'text-slate-400 dark:text-slate-550'}`}>
                      {row.maintenanceCount} Unit
                    </span>
                  </td>

                  {/* Progress Bar & Rate */}
                  <td className="p-4 w-60">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex-shrink-0">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(row.utilizationRate)}`}
                          style={{ width: `${row.utilizationRate}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md font-outfit ${getProgressBgColor(row.utilizationRate)}`}>
                        {row.utilizationRate}%
                      </span>
                    </div>
                  </td>

                  {/* Biaya Sewa Bulanan */}
                  <td className="p-4 text-right pr-6 font-black text-xs text-rose-500 dark:text-rose-455 font-outfit">
                    {formatRupiah(row.monthlyCost)}
                  </td>
                </tr>
              ))}

              {/* Baris Grand Total */}
              <tr className="bg-slate-55/70 dark:bg-slate-850/65 font-bold border-t-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
                <td className="p-4 pl-6 text-xs font-black font-outfit">
                  GRAND TOTAL
                </td>
                <td className="p-4 text-center text-xs font-black font-outfit">
                  {grandTotal.totalCount} Unit
                </td>
                <td className="p-4 text-center text-xs font-black font-outfit text-blue-600 dark:text-blue-450">
                  {grandTotal.assignedCount} Unit
                </td>
                <td className="p-4 text-center text-xs font-black font-outfit text-emerald-600 dark:text-emerald-400">
                  {grandTotal.idleCount} Unit
                </td>
                <td className="p-4 text-center text-xs font-black font-outfit text-amber-600 dark:text-amber-400">
                  {grandTotal.maintenanceCount} Unit
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex-shrink-0">
                      <div 
                        className={`h-full rounded-full ${getProgressBarColor(grandUtilizationRate)}`}
                        style={{ width: `${grandUtilizationRate}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md font-outfit ${getProgressBgColor(grandUtilizationRate)}`}>
                      {grandUtilizationRate}%
                    </span>
                  </div>
                </td>
                <td className="p-4 text-right pr-6 text-xs font-black text-rose-600 dark:text-rose-455 font-outfit">
                  {formatRupiah(grandTotal.monthlyCost)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
