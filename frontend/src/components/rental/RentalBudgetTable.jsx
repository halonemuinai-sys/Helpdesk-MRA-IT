import React, { useState } from 'react';
import { Building2, ChevronDown, ChevronUp, Edit3, Users } from 'lucide-react';

export default function RentalBudgetTable({
  companyStats,
  grandTotalDevices, grandTotalBudget, grandTotalCost, grandTotalDifference, grandTotalUtilization,
  formatCurrency, formatNumber, formatNumberForInput,
  onOpenBreakdown, onEditCompany, onEditUser,
}) {
  const [expandedCompanyId, setExpandedCompanyId] = useState(null);

  return (
    <div className="glass-card rounded-3xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Validasi Tahunan vs Anggaran</h3>
          <p className="text-[10px] text-gray-455 dark:text-slate-500 font-semibold mt-0.5">Analisa efisiensi beban biaya sewa tahunan terhadap plafon anggaran teralokasi</p>
        </div>
        <span className="text-[9px] text-slate-455 dark:text-slate-400 font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl">Banding Tahunan</span>
      </div>
      <div className="overflow-x-auto custom-scroll">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-gray-500 dark:text-slate-450 border-b border-slate-100 dark:border-slate-850 font-black uppercase tracking-wider text-[9px]">
              <th className="py-4.5 px-5">Unit Bisnis</th>
              <th className="py-4.5 px-3 text-center">Jumlah Device</th>
              <th className="py-4.5 px-3 text-right">Budget Tahunan</th>
              <th className="py-4.5 px-3 text-right">Biaya Sewa</th>
              <th className="py-4.5 px-3 text-right">Sisa Selisih</th>
              <th className="py-4.5 px-3 text-center">Status Beban</th>
              <th className="py-4.5 px-5 min-w-[200px]">Utilisasi Budget</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60">
            {companyStats.map(comp => {
              const diff = comp.yearlyBudget - comp.totalCost;
              const util = comp.yearlyBudget > 0 ? (comp.totalCost / comp.yearlyBudget) * 100 : 0;
              const isUnder = diff >= 0;
              const progressColor = util > 100 ? 'from-rose-500 to-pink-500' : util > 80 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500';
              const progressGlow = util > 100 ? 'rgba(244,63,94,0.2)' : util > 80 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)';
              const isExpanded = expandedCompanyId === comp.id;

              return (
                <React.Fragment key={comp.id}>
                  <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors duration-150">
                    <td className="py-4.5 px-5 font-bold">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedCompanyId(isExpanded ? null : comp.id)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition"
                          title="Tampilkan Detail Karyawan"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => onOpenBreakdown(comp)}
                          className="hover:text-rose-500 text-left focus:outline-none flex items-center gap-1.5 font-bold tracking-tight"
                          title="Lihat Detail Aset Sewa"
                        >
                          <Building2 className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                          <span className="text-[12px] text-slate-850 dark:text-slate-200 font-bold tracking-tight">{comp.name}</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-4.5 px-3 text-center font-extrabold text-slate-600 dark:text-slate-350">{comp.totalDevices} Unit</td>
                    <td className="py-4.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="text-right">
                          <p className="font-extrabold text-slate-850 dark:text-slate-200 font-mono">{formatCurrency(comp.yearlyBudget)}</p>
                          <p className="text-[9px] text-gray-400 dark:text-slate-500 font-semibold">Rp {formatNumber(comp.monthlyBudget)}/bln</p>
                        </div>
                        <button
                          onClick={() => onEditCompany(comp)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-lg transition"
                          title="Atur Budget Unit Bisnis"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4.5 px-3 text-right font-extrabold text-slate-850 dark:text-slate-200 font-mono">{formatCurrency(comp.totalCost)}</td>
                    <td className={`py-4.5 px-3 text-right font-black font-mono ${isUnder ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-455'}`}>
                      {isUnder ? '+' : '-'}{formatCurrency(Math.abs(diff))}
                    </td>
                    <td className="py-4.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isUnder ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isUnder ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {isUnder ? 'Aman' : 'Over Budget'}
                      </span>
                    </td>
                    <td className="py-4.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
                          <div className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500`}
                            style={{ width: `${Math.min(util, 100)}%`, boxShadow: `0 0 8px ${progressGlow}` }}
                          />
                        </div>
                        <span className="font-extrabold text-slate-700 dark:text-slate-350 min-w-[34px] text-right font-mono text-[11px]">{Math.round(util)}%</span>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable employee breakdown */}
                  {isExpanded && (
                    <tr>
                      <td colSpan="7" className="bg-slate-50/30 dark:bg-slate-950/10 px-5 py-4 border-l-4 border-l-rose-500">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-black text-[10px] uppercase tracking-wider mb-1">
                            <Users className="w-3.5 h-3.5 text-rose-500" />
                            Breakdown Alokasi Anggaran ({comp.name})
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Shared/Branch card */}
                            <div className="bg-rose-500/[0.02] dark:bg-slate-900/40 border border-rose-500/10 dark:border-slate-800/80 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:border-rose-500/35 transition duration-200">
                              <div>
                                <p className="font-bold text-slate-850 dark:text-slate-200 text-xs">Shared / Cabang (Operasional)</p>
                                <p className="text-[9px] text-gray-400 dark:text-slate-500 font-semibold mt-0.5 uppercase tracking-wider">Perangkat Bersama Kantor</p>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <div>
                                  <p className="font-black text-rose-500 font-mono text-[11px]">{formatCurrency(comp.sharedBudget)}</p>
                                  <p className="text-[8px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest">Per Bulan</p>
                                </div>
                                <button onClick={() => onEditCompany(comp)} className="p-1.5 hover:bg-rose-500/15 border border-slate-200/50 dark:border-slate-800 text-slate-455 hover:text-rose-500 rounded-lg transition" title="Atur Budget Unit Bisnis">
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Employee cards */}
                            {comp.users.map(u => (
                              <div key={u.id} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:border-rose-500/25 transition duration-200">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center border border-slate-200/20 uppercase">
                                    {u.name ? u.name.split(' ').map(n => n[0]).slice(0, 2).join('') : '?'}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs tracking-tight">{u.name}</p>
                                    <p className="text-[9px] text-gray-400 dark:text-slate-500 font-mono mt-0.5">NIP: {u.id}</p>
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <div>
                                    <p className="font-black text-slate-850 dark:text-slate-100 font-mono text-[11px]">{formatCurrency(u.monthlyBudget)}</p>
                                    <p className="text-[8px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest">Per Bulan</p>
                                  </div>
                                  <button onClick={() => onEditUser(u)} className="p-1.5 hover:bg-rose-500/15 border border-slate-200/50 dark:border-slate-800 text-slate-455 hover:text-rose-500 rounded-lg transition" title="Edit Budget Karyawan">
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {/* Grand total row */}
            <tr className="bg-slate-50 dark:bg-slate-950/20 border-t-2 border-slate-200 dark:border-slate-800 font-bold">
              <td className="py-4.5 px-5 font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">GRAND TOTAL</td>
              <td className="py-4.5 px-3 text-center font-extrabold text-slate-700 dark:text-slate-350">{grandTotalDevices} Unit</td>
              <td className="py-4.5 px-3 text-right font-black text-slate-900 dark:text-slate-100 font-mono">{formatCurrency(grandTotalBudget)}</td>
              <td className="py-4.5 px-3 text-right font-black text-slate-900 dark:text-slate-100 font-mono">{formatCurrency(grandTotalCost)}</td>
              <td className={`py-4.5 px-3 text-right font-black font-mono ${grandTotalDifference >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-455'}`}>
                {grandTotalDifference >= 0 ? '+' : '-'}{formatCurrency(Math.abs(grandTotalDifference))}
              </td>
              <td className="py-4.5 px-3 text-center">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${grandTotalDifference >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${grandTotalDifference >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {grandTotalDifference >= 0 ? 'Aman' : 'Over Budget'}
                </span>
              </td>
              <td className="py-4.5 px-5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${grandTotalUtilization > 100 ? 'from-rose-500 to-pink-500' : grandTotalUtilization > 80 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500'} transition-all duration-500`}
                      style={{ width: `${Math.min(grandTotalUtilization, 100)}%`, boxShadow: `0 0 8px ${grandTotalUtilization > 100 ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}` }}
                    />
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 min-w-[34px] text-right font-mono text-[11px]">{Math.round(grandTotalUtilization)}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
