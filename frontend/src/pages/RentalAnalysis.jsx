import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Building2, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Users, 
  Info, 
  DollarSign, 
  X, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import ReactLoader from '../components/ReactLoader';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function RentalAnalysis({ user, token, darkMode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // ALL, LAPTOP, SMARTPHONE
  
  // Collapse state for employee details per company master
  const [expandedCompanyId, setExpandedCompanyId] = useState(null);
  
  // Edit budget modal states
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingUserBudget, setEditingUserBudget] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);
  
  // Edit company budget distribution modal states
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editingCompanyBudget, setEditingCompanyBudget] = useState('');

  const YEARS = ['2026', '2025', '2024'];
  const CATEGORIES = [
    { value: 'ALL', label: 'Semua Kategori' },
    { value: 'LAPTOP', label: 'Laptop / PC' },
    { value: 'SMARTPHONE', label: 'Smartphone' }
  ];
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/reports/rental-analysis?year=${selectedYear}&category=${selectedCategory}`, { headers });
      if (!res.ok) throw new Error('Gagal mengambil data analisa biaya sewa.');
      const result = await res.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [selectedYear, selectedCategory]);

  // Format currency with standard dot separator
  const formatNumber = (num) => {
    return Math.round(num).toLocaleString('id-ID');
  };

  const formatCurrency = (num) => {
    return `Rp ${formatNumber(num)}`;
  };

  // Handle individual user budget edit submit
  const handleUserBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      setSavingBudget(true);
      const res = await fetch(`${API_URL}/reports/rental-budget/user`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          userId: editingUser.id,
          yearlyBudget: parseFloat(editingUserBudget)
        })
      });
      
      if (!res.ok) throw new Error('Gagal memperbarui budget karyawan.');
      
      setIsEditUserModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Budget Diperbarui',
        text: `Budget untuk ${editingUser.name} berhasil diperbarui.`,
        timer: 1500,
        showConfirmButton: false
      });
      
      fetchAnalysisData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.message
      });
    } finally {
      setSavingBudget(false);
    }
  };

  // Handle company budget distribution submit
  const handleCompanyBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!editingCompany) return;
    
    try {
      setSavingBudget(true);
      const res = await fetch(`${API_URL}/reports/rental-budget/company`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          companyMasterId: editingCompany.id,
          totalBudget: parseFloat(editingCompanyBudget)
        })
      });
      
      if (!res.ok) throw new Error('Gagal mendistribusikan budget perusahaan.');
      
      setIsEditCompanyModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Budget Didistribusikan',
        text: `Budget tahunan ${editingCompany.name} berhasil diperbarui.`,
        timer: 1500,
        showConfirmButton: false
      });
      
      fetchAnalysisData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.message
      });
    } finally {
      setSavingBudget(false);
    }
  };

  if (loading && !data) {
    return <ReactLoader />;
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 flex items-center gap-3 text-xs">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <div>
          <p className="font-bold">Error Terjadi</p>
          <p className="text-[11px]">{error}</p>
        </div>
      </div>
    );
  }

  const { monthlyTotals, companyStats } = data;
  
  // Calculate grand totals for validation table
  const grandTotalDevices = companyStats.reduce((sum, c) => sum + c.totalDevices, 0);
  const grandTotalBudget = companyStats.reduce((sum, c) => sum + c.yearlyBudget, 0);
  const grandTotalCost = companyStats.reduce((sum, c) => sum + c.totalCost, 0);
  const grandTotalDifference = grandTotalBudget - grandTotalCost;
  const grandTotalUtilization = grandTotalBudget > 0 ? (grandTotalCost / grandTotalBudget) * 100 : 0;

  // Custom SVG Chart Scaling Params
  const maxMonthlyVal = Math.max(...monthlyTotals, 1000000); // Guard division by zero
  const gridLevels = 5;
  const chartHeight = 220;
  const chartWidth = 920;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 30;
  const totalChartWidth = chartWidth + padLeft + padRight;
  const totalChartHeight = chartHeight + padTop + padBottom;

  // Generate chart data coordinates
  const points = monthlyTotals.map((val, idx) => {
    const x = padLeft + (idx * (chartWidth / 11));
    const y = padTop + chartHeight - ((val / maxMonthlyVal) * chartHeight);
    return { x, y, value: val, month: MONTH_NAMES[idx] };
  });

  // SVG Line path string
  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  // SVG Area path string (goes down to closing bottom axis)
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${padTop + chartHeight} L ${points[0].x} ${padTop + chartHeight} Z`
    : '';

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-rose-500" />
            Analisa Biaya Sewa
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold mt-1">
            Proyeksi pengeluaran bulanan aset sewa <span className="text-rose-500 font-bold">(Global)</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider">Kategori:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none cursor-pointer hover:border-rose-500 transition shadow-sm"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider">Periode:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none cursor-pointer hover:border-rose-500 transition shadow-sm"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 1. Line Chart Section */}
      <div className="glass-panel p-5 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Grafik Proyeksi Pengeluaran Bulanan</h3>
        
        {/* Custom SVG Line Chart */}
        <div className="w-full overflow-x-auto">
          <svg 
            viewBox={`0 0 ${totalChartWidth} ${totalChartHeight}`} 
            className="w-full min-w-[750px] overflow-visible"
          >
            <defs>
              {/* Fade Area Gradient */}
              <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
              {/* Line Stroke Gradient */}
              <linearGradient id="chartLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {Array.from({ length: gridLevels }).map((_, idx) => {
              const fraction = idx / (gridLevels - 1);
              const val = maxMonthlyVal * fraction;
              const y = padTop + chartHeight - (fraction * chartHeight);
              return (
                <g key={idx} className="opacity-40">
                  <line 
                    x1={padLeft} 
                    y1={y} 
                    x2={padLeft + chartWidth} 
                    y2={y} 
                    stroke="currentColor" 
                    strokeDasharray="4 4"
                    className="text-gray-200 dark:text-slate-800"
                  />
                  <text 
                    x={padLeft - 10} 
                    y={y + 4} 
                    textAnchor="end" 
                    className="text-[9px] font-bold fill-gray-400 dark:fill-slate-500 font-mono"
                  >
                    {val >= 1000000 ? `${(val / 1000000).toFixed(0)} Jt` : formatNumber(val)}
                  </text>
                </g>
              );
            })}

            {/* Area Path */}
            {areaPath && (
              <path d={areaPath} fill="url(#chartAreaGradient)" />
            )}

            {/* Line Path */}
            {linePath && (
              <path 
                d={linePath} 
                fill="none" 
                stroke="url(#chartLineGradient)" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            )}

            {/* Data Dots and X-axis Labels */}
            {points.map((p, idx) => (
              <g key={idx} className="group cursor-pointer">
                {/* Highlight Hover Circle */}
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="7" 
                  fill="#f43f5e" 
                  className="opacity-0 group-hover:opacity-30 transition-opacity duration-150" 
                />
                {/* Point dot */}
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="4" 
                  fill="#ffffff" 
                  stroke="#f43f5e" 
                  strokeWidth="2.5" 
                />
                {/* Tooltip value */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {/* Tooltip Card Background */}
                  <rect 
                    x={p.x - 70} 
                    y={p.y - 32} 
                    width="140" 
                    height="22" 
                    rx="6" 
                    fill="#1e293b" 
                    className="shadow-md"
                  />
                  <text 
                    x={p.x} 
                    y={p.y - 17} 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    className="text-[9px] font-bold font-sans"
                  >
                    {p.month}: {formatCurrency(p.value)}
                  </text>
                </g>
                {/* X Axis Month Name */}
                <text 
                  x={p.x} 
                  y={padTop + chartHeight + 20} 
                  textAnchor="middle" 
                  className="text-[9px] font-extrabold fill-gray-400 dark:fill-slate-400"
                >
                  {p.month}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* 2. Monthly Cost Table Section */}
      <div className="glass-panel rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-150 dark:border-slate-850 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Breakdown Biaya Bulanan</h3>
          <span className="text-[10px] text-gray-500 font-bold px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded-md">IDR (Rupiah)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-950/20 text-gray-500 dark:text-slate-450 border-b border-gray-150 dark:border-slate-850 font-bold uppercase tracking-wider text-[9px]">
                <th className="py-3 px-4 min-w-[200px]">Unit Bisnis</th>
                {MONTH_NAMES.map(m => (
                  <th key={m} className="py-3 px-3 text-right">{m}</th>
                ))}
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-slate-850">
              {companyStats.map(comp => (
                <tr key={comp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-brand-600 dark:text-brand-400">
                    {comp.name}
                  </td>
                  {comp.monthlyCosts.map((cost, idx) => (
                    <td key={idx} className="py-3 px-3 text-right font-semibold text-gray-700 dark:text-slate-350">
                      {cost > 0 ? formatNumber(cost) : '-'}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-right font-black text-slate-800 dark:text-slate-200">
                    {formatNumber(comp.totalCost)}
                  </td>
                </tr>
              ))}
              
              {/* Table Total Row */}
              <tr className="bg-slate-50/50 dark:bg-slate-950/10 border-t-2 border-gray-200 dark:border-slate-800 font-bold">
                <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  TOTAL BULANAN
                </td>
                {monthlyTotals.map((tot, idx) => (
                  <td key={idx} className="py-3.5 px-3 text-right font-extrabold text-slate-800 dark:text-slate-200">
                    {tot > 0 ? formatNumber(tot) : '-'}
                  </td>
                ))}
                <td className="py-3.5 px-4 text-right font-black text-rose-600 dark:text-rose-455 text-sm">
                  {formatNumber(companyStats.reduce((sum, c) => sum + c.totalCost, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Validation Table & Budgets */}
      <div className="glass-panel rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-150 dark:border-slate-850">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Validasi Tahunan vs Budget</h3>
          <p className="text-[10px] text-gray-500 font-semibold mt-1">Berdasarkan akumulasi budget tahunan karyawan per Unit Bisnis</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-950/20 text-gray-500 dark:text-slate-450 border-b border-gray-150 dark:border-slate-850 font-bold uppercase tracking-wider text-[9px]">
                <th className="py-3 px-4">Unit Bisnis</th>
                <th className="py-3 px-3 text-center">Total Device</th>
                <th className="py-3 px-3 text-right">Budget Tahunan</th>
                <th className="py-3 px-3 text-right">Proyeksi Biaya Sewa</th>
                <th className="py-3 px-3 text-right">Sisa / Selisih</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 min-w-[200px]">Beban Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-slate-850">
              {companyStats.map(comp => {
                const diff = comp.yearlyBudget - comp.totalCost;
                const util = comp.yearlyBudget > 0 ? (comp.totalCost / comp.yearlyBudget) * 100 : 0;
                const isUnderBudget = diff >= 0;
                
                // Color formatting for progress bar
                let progressColor = 'bg-emerald-500';
                if (util > 100) progressColor = 'bg-rose-500';
                else if (util > 80) progressColor = 'bg-amber-500';

                const isExpanded = expandedCompanyId === comp.id;

                return (
                  <React.Fragment key={comp.id}>
                    {/* Main Company Row */}
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedCompanyId(isExpanded ? null : comp.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-800 dark:hover:text-slate-200 rounded-md transition"
                            title="Tampilkan Detail Karyawan"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <span>{comp.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-600 dark:text-slate-350">{comp.totalDevices} Unit</td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{formatCurrency(comp.yearlyBudget)}</span>
                          <button
                            onClick={() => {
                              setEditingCompany(comp);
                              setEditingCompanyBudget(comp.yearlyBudget.toString());
                              setIsEditCompanyModalOpen(true);
                            }}
                            className="p-1 text-gray-400 hover:text-rose-500 rounded transition"
                            title="Distribusikan Budget Perusahaan"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-800 dark:text-slate-200">{formatCurrency(comp.totalCost)}</td>
                      <td className={`py-3 px-3 text-right font-bold ${isUnderBudget ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isUnderBudget ? '+ ' : '- '}{formatCurrency(Math.abs(diff))}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isUnderBudget ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                          {isUnderBudget ? 'Aman' : 'Over Budget'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${Math.min(util, 100)}%` }}></div>
                          </div>
                          <span className="font-extrabold text-slate-600 dark:text-slate-350 min-w-[32px] text-right font-mono">{Math.round(util)}%</span>
                        </div>
                      </td>
                    </tr>

                    {/* Collapsible Employee Budget Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="7" className="bg-slate-50/50 dark:bg-slate-950/15 px-4 py-3 border-l-4 border-l-rose-500">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-2">
                              <Users className="w-3.5 h-3.5 text-rose-500" />
                              Detail Budget Karyawan ({comp.name})
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {comp.users.map(u => (
                                <div key={u.id} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-xl p-3 flex justify-between items-center shadow-sm">
                                  <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{u.name}</p>
                                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">NIP: {u.id}</p>
                                  </div>
                                  <div className="text-right flex items-center gap-2">
                                    <div>
                                      <p className="font-black text-rose-600 dark:text-rose-455 font-mono text-[11px]">{formatCurrency(u.yearlyBudget)}</p>
                                      <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Per Tahun</p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setEditingUser(u);
                                        setEditingUserBudget(u.yearlyBudget.toString());
                                        setIsEditUserModalOpen(true);
                                      }}
                                      className="p-1 hover:bg-gray-50 dark:hover:bg-slate-850 border border-gray-150 dark:border-slate-800 text-gray-400 hover:text-rose-500 rounded-lg transition"
                                      title="Edit Budget Karyawan"
                                    >
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
              
              {/* Grand Total Row */}
              <tr className="bg-slate-50 dark:bg-slate-950/20 border-t-2 border-gray-200 dark:border-slate-800 font-bold">
                <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  GRAND TOTAL
                </td>
                <td className="py-3.5 px-3 text-center font-extrabold text-slate-700 dark:text-slate-300">{grandTotalDevices} Unit</td>
                <td className="py-3.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">{formatCurrency(grandTotalBudget)}</td>
                <td className="py-3.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">{formatCurrency(grandTotalCost)}</td>
                <td className={`py-3.5 px-3 text-right font-black ${grandTotalDifference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {grandTotalDifference >= 0 ? '+ ' : '- '}{formatCurrency(Math.abs(grandTotalDifference))}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${grandTotalDifference >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                    {grandTotalDifference >= 0 ? 'Aman' : 'Over Budget'}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${grandTotalUtilization > 100 ? 'bg-rose-500' : grandTotalUtilization > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(grandTotalUtilization, 100)}%` }}
                      ></div>
                    </div>
                    <span className="font-extrabold text-slate-700 dark:text-slate-200 min-w-[32px] text-right font-mono text-xs">{Math.round(grandTotalUtilization)}% Used</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Budget Modal */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-250 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-gray-150 dark:border-slate-850 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-500" />
                Edit Budget Karyawan
              </h3>
              <button 
                onClick={() => setIsEditUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 rounded-lg p-1 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleUserBudgetSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider block mb-1">Nama Karyawan</label>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{editingUser.name}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">NIP: {editingUser.id}</p>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Budget Tahunan (IDR) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 font-sans">Rp</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editingUserBudget}
                      onChange={(e) => setEditingUserBudget(e.target.value)}
                      placeholder="e.g. 5000000"
                      className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1">Isi dengan nominal Rupiah tanpa tanda titik atau koma.</p>
                </div>
              </div>
              
              <div className="flex justify-end items-center gap-3 p-5 border-t border-gray-150 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-4 py-2 border border-gray-250 dark:border-slate-850 hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-655 dark:text-slate-300 text-xs font-bold rounded-xl transition"
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
        </div>
      )}

      {/* Edit Company Budget Distribution Modal */}
      {isEditCompanyModalOpen && editingCompany && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-250 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-gray-150 dark:border-slate-850 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-500" />
                Atur Total Budget Unit Bisnis
              </h3>
              <button 
                onClick={() => setIsEditCompanyModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 rounded-lg p-1 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCompanyBudgetSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider block mb-1">Nama Unit Bisnis</label>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{editingCompany.name}</p>
                </div>
                
                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-slate-950/40 border border-blue-100 dark:border-slate-800/80 text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2.5">
                  <Info className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Info Distribusi:</span> Nominal budget baru akan didistribusikan secara merata kepada seluruh karyawan yang terdaftar di bawah unit bisnis ini ({editingCompany.users.length} karyawan).
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Total Budget Unit Bisnis (IDR) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 font-sans">Rp</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editingCompanyBudget}
                      onChange={(e) => setEditingCompanyBudget(e.target.value)}
                      placeholder="e.g. 50000000"
                      className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1">Rata-rata per karyawan: {editingCompanyBudget ? formatCurrency(parseFloat(editingCompanyBudget) / editingCompany.users.length) : '-'}</p>
                </div>
              </div>
              
              <div className="flex justify-end items-center gap-3 p-5 border-t border-gray-150 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsEditCompanyModalOpen(false)}
                  className="px-4 py-2 border border-gray-250 dark:border-slate-850 hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-655 dark:text-slate-350 text-xs font-bold rounded-xl transition"
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
                  <span>Distribusikan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
