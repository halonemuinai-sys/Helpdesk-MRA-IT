import React, { useState, useEffect } from 'react';
import { BarChart3, AlertTriangle, Building2, TrendingUp, ShieldCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Reports({ user, token }) {
  const [data, setData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, [selectedCompanyId]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch report analytics
      const res = await fetch(`${API_URL}/reports?companyId=${selectedCompanyId}`, { headers });
      if (!res.ok) throw new Error('Gagal mengambil laporan statistik.');
      const reportData = await res.json();
      setData(reportData);

      // 2. Fetch companies list for selector
      if (companies.length === 0) {
        const compRes = await fetch(`${API_URL}/companies`, { headers });
        if (compRes.ok) {
          const compData = await compRes.json();
          // get unique company names
          const uniqueComps = [];
          const map = new Map();
          for (const item of compData) {
            if (!map.has(item.name)) {
              map.set(item.name, true);
              uniqueComps.push(item);
            }
          }
          setCompanies(uniqueComps);
        }
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // SLA Gauge Calculations
  const slaRate = data?.sla?.complianceRate ?? 100;
  const strokeDashoffset = 440 - (440 * slaRate) / 100;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-brand-500" />
            Laporan Analisis
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">
            Laporan grafik, kategori gangguan, dan tingkat kepatuhan SLA IT Helpdesk.
          </p>
        </div>

        {/* Company Filter Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-sm">
          <Building2 className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="bg-transparent text-sm font-semibold text-gray-700 dark:text-slate-200 focus:outline-none pr-4 cursor-pointer"
          >
            <option value="">Semua Perusahaan</option>
            {companies.map(comp => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: SLA Compliance Gauge (Premium Circle SVG) */}
          <div className="glass-card p-6 rounded-3xl border border-gray-200/50 dark:border-slate-800/30 flex flex-col items-center justify-between min-h-[380px]">
            <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 self-start">Kepatuhan SLA (KPI Target)</h4>
            
            {/* SVG Circular Progress Gauge */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="70"
                  className="stroke-gray-100 dark:stroke-slate-800 fill-none"
                  strokeWidth="14"
                />
                {/* Foreground indicator */}
                <circle
                  cx="96"
                  cy="96"
                  r="70"
                  className="stroke-brand-500 fill-none transition-all duration-1000 ease-out"
                  strokeWidth="14"
                  strokeDasharray="440"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Inner percentage text */}
              <div className="absolute text-center">
                <h3 className="text-4xl font-extrabold text-gray-800 dark:text-white">{slaRate}%</h3>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-1">SLA Tepat Waktu</p>
              </div>
            </div>

            {/* SLA Info Status */}
            <div className="w-full p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-gray-700 dark:text-slate-200">
                  {slaRate >= 90 ? 'Performa Sangat Baik' : slaRate >= 75 ? 'Performa Rata-rata' : 'Perlu Peningkatan'}
                </p>
                <p className="text-gray-400 mt-0.5">
                  {data.sla.met} tiket tepat waktu, {data.sla.breached} tiket breached.
                </p>
              </div>
            </div>

          </div>

          {/* Column 2 & 3: Detailed bar breakdown */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Status Breakdown Horizontal Charts */}
            <div className="glass-card p-6 rounded-3xl border border-gray-200/50 dark:border-slate-800/30">
              <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-5">Distribusi Status Tiket</h4>
              <div className="space-y-4">
                {Object.entries(data.status).map(([statusKey, count]) => {
                  const total = data.totalTickets || 1;
                  const percent = Math.round((count / total) * 100);

                  const colors = {
                    OPEN: 'bg-blue-500 text-blue-500',
                    IN_PROGRESS: 'bg-amber-500 text-amber-500',
                    PENDING: 'bg-slate-400 text-slate-400',
                    RESOLVED: 'bg-emerald-500 text-emerald-500',
                    CLOSED: 'bg-gray-500 text-gray-500'
                  };

                  return (
                    <div key={statusKey} className="flex items-center gap-4 text-xs font-semibold">
                      <span className="w-24 text-gray-600 dark:text-slate-400">{statusKey}</span>
                      
                      {/* Bar Container */}
                      <div className="flex-1 h-6 bg-gray-100 dark:bg-slate-800/50 rounded-lg overflow-hidden relative flex items-center px-3 border border-gray-200/10">
                        <div 
                          className={`absolute top-0 left-0 bottom-0 ${colors[statusKey].split(' ')[0]} opacity-15 transition-all duration-1000`}
                          style={{ width: `${percent}%` }}
                        ></div>
                        <div 
                          className={`absolute top-0 left-0 bottom-0 ${colors[statusKey].split(' ')[0]} w-1 rounded-l-lg`}
                        ></div>
                        <span className={`z-10 font-bold ${colors[statusKey].split(' ')[1]}`}>{count} tiket ({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Breakdown Horizontal Charts */}
            <div className="glass-card p-6 rounded-3xl border border-gray-200/50 dark:border-slate-800/30">
              <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-5">Distribusi Jenis Gangguan</h4>
              <div className="space-y-4">
                {Object.entries(data.categories).map(([catKey, count]) => {
                  const total = data.totalTickets || 1;
                  const percent = Math.round((count / total) * 100);

                  return (
                    <div key={catKey} className="flex items-center gap-4 text-xs font-semibold">
                      <span className="w-24 text-gray-600 dark:text-slate-400">{catKey}</span>
                      
                      {/* Bar Container */}
                      <div className="flex-1 h-6 bg-gray-100 dark:bg-slate-800/50 rounded-lg overflow-hidden relative flex items-center px-3 border border-gray-200/10">
                        <div 
                          className="absolute top-0 left-0 bottom-0 bg-brand-500 opacity-15 transition-all duration-1000"
                          style={{ width: `${percent}%` }}
                        ></div>
                        <div 
                          className="absolute top-0 left-0 bottom-0 bg-brand-500 w-1 rounded-l-lg"
                        ></div>
                        <span className="z-10 font-bold text-brand-600 dark:text-brand-400">{count} tiket ({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Full Distribution table for child companies */}
          <div className="lg:col-span-3 glass-card p-6 rounded-3xl border border-gray-200/50 dark:border-slate-800/30">
            <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-brand-500" />
              Data Distribusi Perusahaan Klien (MRA Group)
            </h4>
            
            {Object.keys(data.companies).length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500 dark:text-slate-500">
                Belum ada data tiket di perusahaan terdaftar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Anak Perusahaan</th>
                      <th className="py-3 px-4 text-center">Jumlah Tiket Masuk</th>
                      <th className="py-3 px-4">Kontribusi Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-gray-700 dark:text-slate-300">
                    {Object.entries(data.companies)
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, count]) => {
                        const total = data.totalTickets || 1;
                        const pct = Math.round((count / total) * 100);

                        return (
                          <tr key={name}>
                            <td className="py-3.5 px-4 font-bold text-gray-800 dark:text-slate-200">{name}</td>
                            <td className="py-3.5 px-4 text-center text-brand-600 dark:text-brand-400 font-bold">{count}</td>
                            <td className="py-3.5 px-4 w-1/2">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="w-8 text-right text-[10px]">{pct}%</span>
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

        </div>
      )}

    </div>
  );
}
