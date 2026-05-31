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
  Loader2,
  Wallet,
  Activity,
  ArrowUpRight 
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
  
  // Interactive chart hover tracking
  const [hoveredPointIdx, setHoveredPointIdx] = useState(null);
  
  // Toggle between line and bar chart views
  const [chartType, setChartType] = useState('line'); // line | bar
  
  // Breakdown modal states
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [breakdownCompany, setBreakdownCompany] = useState(null);

  const formatDateDMY = (value) => {
    if (!value) return '-';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return '-';
      const day = d.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = monthNames[d.getMonth()];
      const year = String(d.getFullYear()).slice(-2);
      return `${day} ${month} ${year}`;
    } catch (e) {
      return '-';
    }
  };
  
  // Edit budget modal states
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingUserBudget, setEditingUserBudget] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);
  
  // Edit company budget distribution modal states
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editingCompanyBudget, setEditingCompanyBudget] = useState('');
  const [editingCompanySharedBudget, setEditingCompanySharedBudget] = useState('');

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

  const formatNumberForInput = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const raw = value.toString().replace(/\D/g, '');
    if (!raw) return '';
    return parseInt(raw, 10).toLocaleString('id-ID');
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
          monthlyBudget: parseFloat(editingUserBudget.toString().replace(/\./g, '')) || 0
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
          totalBudget: parseFloat(editingCompanyBudget.toString().replace(/\./g, '')) || 0,
          sharedBudget: parseFloat(editingCompanySharedBudget.toString().replace(/\./g, '')) || 0
        })
      });
      
      if (!res.ok) throw new Error('Gagal mendistribusikan budget perusahaan.');
      
      setIsEditCompanyModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Budget Didistribusikan',
        text: `Budget bulanan ${editingCompany.name} berhasil diperbarui.`,
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

  const maxCost = Math.max(...monthlyTotals);
  const minCost = Math.min(...monthlyTotals);
  const maxCostIdx = monthlyTotals.indexOf(maxCost);
  const minCostIdx = monthlyTotals.indexOf(minCost);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Injected Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(244, 63, 94, 0.2); }
          50% { box-shadow: 0 0 20px rgba(244, 63, 94, 0.45); }
        }
        @keyframes drawPath {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes scaleBar {
          from {
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border: 1px border;
          border-color: rgba(226, 232, 240, 0.8);
        }
        .dark .glass-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(12px);
          border-color: rgba(30, 41, 59, 0.8);
        }
        .glow-border:hover {
          border-color: rgba(244, 63, 94, 0.4) !important;
          box-shadow: 0 10px 25px -5px rgba(244, 63, 94, 0.08);
          transform: translateY(-2px);
          transition: all 0.25s ease;
        }
        .active-glow {
          animation: pulseGlow 3s infinite ease-in-out;
        }
        .gradient-text {
          background: linear-gradient(135deg, #f43f5e 0%, #d946ef 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .custom-scroll::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(244, 63, 94, 0.25);
          border-radius: 99px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(244, 63, 94, 0.45);
        }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
                Analisa Biaya Sewa
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold mt-0.5">
                Proyeksi pengeluaran bulanan dan efisiensi anggaran sewa perangkat
              </p>
            </div>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-850 rounded-2xl px-3 py-1.5 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer hover:text-rose-500 transition"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} className="dark:bg-slate-950" value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-850 rounded-2xl px-3 py-1.5 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer hover:text-rose-500 transition"
            >
              {YEARS.map(y => (
                <option key={y} className="dark:bg-slate-950" value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4 Premium Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cost Card */}
        <div className="glass-card glow-border rounded-3xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider">Total Biaya (Proyeksi)</span>
            <div className="p-2 bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-black text-slate-850 dark:text-slate-100 font-mono tracking-tight">
              {formatCurrency(grandTotalCost)}
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase mt-1">12 Bulan Proyeksi</p>
          </div>
        </div>

        {/* Budget Card */}
        <div className="glass-card glow-border rounded-3xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-455 dark:text-slate-400 uppercase tracking-wider">Batas Anggaran (Budget)</span>
            <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-black text-slate-850 dark:text-slate-100 font-mono tracking-tight">
              {formatCurrency(grandTotalBudget)}
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase mt-1">
              Rp {formatNumber(grandTotalBudget / 12)} / Bulan
            </p>
          </div>
        </div>

        {/* Difference Card */}
        <div className={`glass-card glow-border rounded-3xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-455 dark:text-slate-400 uppercase tracking-wider">Sisa Anggaran</span>
            <div className={`p-2 rounded-xl ${grandTotalDifference >= 0 ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-500'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-xl font-black font-mono tracking-tight ${grandTotalDifference >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-455'}`}>
              {grandTotalDifference >= 0 ? '+' : '-'}{formatCurrency(Math.abs(grandTotalDifference))}
            </h3>
            <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mt-1.5 ${grandTotalDifference >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
              {grandTotalDifference >= 0 ? 'Hemat / Under' : 'Over Budget'}
            </span>
          </div>
        </div>

        {/* Devices Density Card */}
        <div className="glass-card glow-border rounded-3xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-455 dark:text-slate-400 uppercase tracking-wider">Kepadatan Perangkat</span>
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-black text-slate-850 dark:text-slate-100 font-mono tracking-tight">
              {grandTotalDevices} Perangkat
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase mt-1">
              {Math.round(grandTotalUtilization)}% Utilitas Budget
            </p>
          </div>
        </div>
      </div>

      {/* SVG & Bar Chart Toggle Section */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-sm relative group/chart">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Proyeksi Arus Kas Pengeluaran Sewa</h3>
            <p className="text-[10px] text-gray-405 dark:text-slate-500 font-semibold mt-0.5">Visualisasi proyeksi biaya bulanan selama tahun {selectedYear}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Chart Type Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shadow-inner border border-slate-200/20">
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition duration-150 ${chartType === 'line' ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-sm' : 'text-gray-450 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Line
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition duration-150 ${chartType === 'bar' ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-sm' : 'text-gray-450 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Bar
              </button>
            </div>

            {/* Live Cost Preview */}
            <div className="text-right border-l border-slate-200/50 dark:border-slate-800/80 pl-3">
              <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Total Rata-rata:</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
                {formatCurrency(monthlyTotals.reduce((s,v)=>s+v,0)/12)}/bln
              </span>
            </div>
          </div>
        </div>

        {/* Chart Viewbox Area */}
        <div className="w-full overflow-x-auto custom-scroll pb-2 relative">
          <svg 
            viewBox={`0 0 ${totalChartWidth} ${totalChartHeight}`} 
            className="w-full min-w-[800px] overflow-visible"
          >
            <defs>
              <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="chartLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="chartBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.25" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {Array.from({ length: gridLevels }).map((_, idx) => {
              const fraction = idx / (gridLevels - 1);
              const val = maxMonthlyVal * fraction;
              const y = padTop + chartHeight - (fraction * chartHeight);
              return (
                <g key={idx} className="opacity-60">
                  <line 
                    x1={padLeft} 
                    y1={y} 
                    x2={padLeft + chartWidth} 
                    y2={y} 
                    stroke="currentColor" 
                    strokeDasharray="5 5"
                    className="text-slate-100 dark:text-slate-850"
                  />
                  <text 
                    x={padLeft - 12} 
                    y={y + 4} 
                    textAnchor="end" 
                    className="text-[9px] font-black fill-gray-400 dark:fill-slate-500 font-mono"
                  >
                    {val >= 1000000 ? `${(val / 1000000).toFixed(1)}jt` : formatNumber(val)}
                  </text>
                </g>
              );
            })}

            {/* LINE CHART GRAPHICS */}
            {chartType === 'line' && (
              <>
                {/* Area Under Path */}
                {areaPath && (
                  <path 
                    key={`area-${selectedYear}-${selectedCategory}`}
                    d={areaPath} 
                    fill="url(#chartAreaGradient)" 
                    className="animate-fade-in"
                  />
                )}

                {/* Glowing Line Shadow */}
                {linePath && (
                  <path 
                    key={`shadow-${selectedYear}-${selectedCategory}`}
                    d={linePath} 
                    fill="none" 
                    stroke="#f43f5e" 
                    strokeWidth="8" 
                    opacity="0.12"
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="animate-fade-in"
                  />
                )}

                {/* Animated Drawing Path */}
                {linePath && (
                  <path 
                    key={`line-${selectedYear}-${selectedCategory}`}
                    d={linePath} 
                    fill="none" 
                    stroke="url(#chartLineGradient)" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    style={{
                      strokeDasharray: '2000',
                      strokeDashoffset: '2000',
                      animation: 'drawPath 1.8s cubic-bezier(0.22, 1, 0.36, 1) forwards'
                    }}
                  />
                )}

                {/* Peak Cost Badge Indicator */}
                {maxCostIdx !== -1 && (
                  <g className="opacity-90 animate-fade-in">
                    <rect
                      x={points[maxCostIdx].x - 20}
                      y={points[maxCostIdx].y - 24}
                      width="40"
                      height="13"
                      rx="4"
                      fill="#f43f5e"
                      className="shadow-sm"
                    />
                    <text
                      x={points[maxCostIdx].x}
                      y={points[maxCostIdx].y - 15}
                      textAnchor="middle"
                      fill="#ffffff"
                      className="text-[7px] font-black uppercase tracking-wider"
                    >
                      Puncak
                    </text>
                  </g>
                )}

                {/* Lowest Cost Badge Indicator */}
                {minCostIdx !== -1 && minCost > 0 && (
                  <g className="opacity-90 animate-fade-in">
                    <rect
                      x={points[minCostIdx].x - 20}
                      y={points[minCostIdx].y - 24}
                      width="40"
                      height="13"
                      rx="4"
                      fill="#0ea5e9"
                      className="shadow-sm"
                    />
                    <text
                      x={points[minCostIdx].x}
                      y={points[minCostIdx].y - 15}
                      textAnchor="middle"
                      fill="#ffffff"
                      className="text-[7px] font-black uppercase tracking-wider"
                    >
                      Terendah
                    </text>
                  </g>
                )}
              </>
            )}

            {/* BAR CHART GRAPHICS */}
            {chartType === 'bar' && (
              <g className="animate-fade-in">
                {points.map((p, idx) => {
                  const barWidth = 36;
                  const colHeight = (p.value / maxMonthlyVal) * chartHeight;
                  const barX = p.x - barWidth / 2;
                  const barY = padTop + chartHeight - colHeight;
                  const isHovered = hoveredPointIdx === idx;
                  return (
                    <rect
                      key={idx}
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={colHeight}
                      rx="7"
                      fill={isHovered ? "url(#chartLineGradient)" : "url(#chartBarGradient)"}
                      opacity={isHovered ? "1" : "0.75"}
                      style={{
                        transformOrigin: `${barX + barWidth/2}px ${padTop + chartHeight}px`,
                        animation: 'scaleBar 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                      }}
                      className="transition-all duration-200"
                    />
                  );
                })}
              </g>
            )}

            {/* Vertical Guide Pointer Line */}
            {hoveredPointIdx !== null && (
              <line
                x1={points[hoveredPointIdx].x}
                y1={padTop}
                x2={points[hoveredPointIdx].x}
                y2={padTop + chartHeight}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.55"
                className="pointer-events-none animate-fade-in"
              />
            )}

            {/* Point indicators for Line Chart */}
            {chartType === 'line' && points.map((p, idx) => {
              const isHovered = hoveredPointIdx === idx;
              return (
                <g key={idx} className="pointer-events-none">
                  {isHovered && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="9.5"
                      fill="#f43f5e"
                      opacity="0.3"
                      className="animate-ping"
                    />
                  )}
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r={isHovered ? "6" : "3.5"} 
                    fill={isHovered ? "#f43f5e" : "#ffffff"} 
                    stroke="#f43f5e" 
                    strokeWidth="2.5" 
                    className="transition-all duration-150"
                  />
                  <text 
                    x={p.x} 
                    y={padTop + chartHeight + 20} 
                    textAnchor="middle" 
                    className={`text-[9px] font-black transition-all ${isHovered ? 'fill-rose-500 font-extrabold scale-110' : 'fill-gray-450 dark:fill-slate-450'}`}
                  >
                    {p.month}
                  </text>
                </g>
              );
            })}

            {/* Month labels for Bar Chart */}
            {chartType === 'bar' && points.map((p, idx) => {
              const isHovered = hoveredPointIdx === idx;
              return (
                <text 
                  key={idx}
                  x={p.x} 
                  y={padTop + chartHeight + 20} 
                  textAnchor="middle" 
                  className={`text-[9px] font-black transition-all ${isHovered ? 'fill-rose-500 font-extrabold scale-110' : 'fill-gray-450 dark:fill-slate-450'}`}
                >
                  {p.month}
                </text>
              );
            })}

            {/* Invisible mouse capture columns */}
            {points.map((p, idx) => {
              const colWidth = chartWidth / 11;
              const colX = p.x - colWidth / 2;
              return (
                <rect
                  key={idx}
                  x={colX}
                  y={padTop}
                  width={colWidth}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer pointer-events-auto"
                  onMouseEnter={() => setHoveredPointIdx(idx)}
                  onMouseLeave={() => setHoveredPointIdx(null)}
                />
              );
            })}
          </svg>

          {/* Premium React-Style Floating HTML Tooltip */}
          {hoveredPointIdx !== null && (
            <div 
              className="absolute pointer-events-none bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl text-white transition-all duration-150 ease-out z-20 animate-scale-up"
              style={{
                left: `${(points[hoveredPointIdx].x / totalChartWidth) * 100}%`,
                top: `${(points[hoveredPointIdx].y / totalChartHeight) * 100}%`,
                transform: 'translate(-50%, -120%)'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span className="text-[9px] font-black uppercase text-rose-450 tracking-wider">
                  {points[hoveredPointIdx].month} {selectedYear}
                </span>
              </div>
              <div className="text-xs font-black font-mono mt-1 text-slate-100">
                {formatCurrency(points[hoveredPointIdx].value)}
              </div>
              <div className="border-t border-slate-800/80 mt-1.5 pt-1 flex items-center justify-between gap-4 text-[8px] font-bold text-slate-400">
                <span>Rata-rata:</span>
                <span className={points[hoveredPointIdx].value > (monthlyTotals.reduce((s,v)=>s+v,0)/12) ? 'text-rose-500 font-extrabold' : 'text-emerald-500 font-extrabold'}>
                  {points[hoveredPointIdx].value > (monthlyTotals.reduce((s,v)=>s+v,0)/12) 
                    ? `▲ +${Math.round((points[hoveredPointIdx].value / (monthlyTotals.reduce((s,v)=>s+v,0)/12) - 1) * 100)}%`
                    : `▼ -${Math.round((1 - points[hoveredPointIdx].value / (monthlyTotals.reduce((s,v)=>s+v,0)/12)) * 100)}%`
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Cost Table Section */}
      <div className="glass-card rounded-3xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Matriks Anggaran Bulanan</h3>
            <p className="text-[10px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">Detail biaya bulanan per badan usaha dalam Rupiah (IDR)</p>
          </div>
          <span className="text-[9px] text-rose-500 font-black px-2.5 py-1 bg-rose-500/10 rounded-xl uppercase tracking-wider">Unit: Rupiah</span>
        </div>
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-gray-500 dark:text-slate-450 border-b border-slate-100 dark:border-slate-850 font-black uppercase tracking-wider text-[9px]">
                <th className="py-4.5 px-5 min-w-[240px]">Unit Bisnis</th>
                {MONTH_NAMES.map(m => (
                  <th key={m} className="py-4.5 px-3 text-right">{m}</th>
                ))}
                <th className="py-4.5 px-5 text-right bg-rose-500/[0.02] dark:bg-rose-500/[0.01]">Total Proyeksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60">
              {companyStats.map(comp => (
                <tr key={comp.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors duration-150">
                  <td className="py-4 px-5 font-bold">
                    <button
                      onClick={() => {
                        setBreakdownCompany(comp);
                        setIsBreakdownModalOpen(true);
                      }}
                      className="hover:text-rose-500 text-left focus:outline-none flex items-center gap-2 group"
                      title="Lihat Detail Aset Sewa"
                    >
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-rose-500/10 group-hover:text-rose-500 transition duration-150">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[12px] text-slate-800 dark:text-slate-200 font-bold tracking-tight">{comp.name}</span>
                      <ArrowUpRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition duration-150" />
                    </button>
                  </td>
                  {comp.monthlyCosts.map((cost, idx) => (
                    <td key={idx} className="py-4 px-3 text-right font-mono font-bold text-slate-600 dark:text-slate-350">
                      {cost > 0 ? formatNumber(cost) : <span className="text-gray-300 dark:text-slate-800">-</span>}
                    </td>
                  ))}
                  <td className="py-4 px-5 text-right font-black text-slate-800 dark:text-slate-100 font-mono text-[12px] bg-rose-500/[0.02] dark:bg-rose-500/[0.01]">
                    {formatCurrency(comp.totalCost)}
                  </td>
                </tr>
              ))}
              
              {/* Grand Total Row */}
              <tr className="bg-slate-50/50 dark:bg-slate-950/20 font-bold border-t-2 border-slate-200 dark:border-slate-800">
                <td className="py-4 px-5 font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[10px]">
                  TOTAL BULANAN
                </td>
                {monthlyTotals.map((tot, idx) => (
                  <td key={idx} className="py-4 px-3 text-right font-extrabold text-slate-800 dark:text-slate-100 font-mono text-[12px]">
                    {tot > 0 ? formatNumber(tot) : '-'}
                  </td>
                ))}
                <td className="py-4 px-5 text-right font-black text-rose-500 text-sm font-mono bg-rose-500/5 dark:bg-rose-500/10">
                  {formatCurrency(companyStats.reduce((sum, c) => sum + c.totalCost, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation vs Budget Table Section */}
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
                const isUnderBudget = diff >= 0;
                
                let progressColor = 'from-emerald-500 to-teal-500';
                let progressGlow = 'rgba(16, 185, 129, 0.2)';
                if (util > 100) {
                  progressColor = 'from-rose-500 to-pink-500';
                  progressGlow = 'rgba(244, 63, 94, 0.2)';
                } else if (util > 80) {
                  progressColor = 'from-amber-500 to-orange-500';
                  progressGlow = 'rgba(245, 158, 11, 0.2)';
                }

                const isExpanded = expandedCompanyId === comp.id;

                return (
                  <React.Fragment key={comp.id}>
                    {/* Main Company Row */}
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
                            onClick={() => {
                              setBreakdownCompany(comp);
                              setIsBreakdownModalOpen(true);
                            }}
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
                            onClick={() => {
                              setEditingCompany(comp);
                              const empTotal = comp.monthlyBudget - comp.sharedBudget;
                              setEditingCompanyBudget(formatNumberForInput(empTotal));
                              setEditingCompanySharedBudget(formatNumberForInput(comp.sharedBudget));
                              setIsEditCompanyModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-lg transition"
                            title="Atur Budget Unit Bisnis"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-4.5 px-3 text-right font-extrabold text-slate-850 dark:text-slate-200 font-mono">{formatCurrency(comp.totalCost)}</td>
                      <td className={`py-4.5 px-3 text-right font-black font-mono ${isUnderBudget ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-455'}`}>
                        {isUnderBudget ? '+' : '-'}{formatCurrency(Math.abs(diff))}
                      </td>
                      <td className="py-4.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isUnderBudget ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isUnderBudget ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {isUnderBudget ? 'Aman' : 'Over Budget'}
                        </span>
                      </td>
                      <td className="py-4.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
                            <div 
                              className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500`} 
                              style={{ width: `${Math.min(util, 100)}%`, boxShadow: `0 0 8px ${progressGlow}` }}
                            ></div>
                          </div>
                          <span className="font-extrabold text-slate-700 dark:text-slate-350 min-w-[34px] text-right font-mono text-[11px]">{Math.round(util)}%</span>
                        </div>
                      </td>
                    </tr>

                    {/* Collapsible Employee Budget Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="7" className="bg-slate-50/30 dark:bg-slate-950/10 px-5 py-4 border-l-4 border-l-rose-500">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-black text-[10px] uppercase tracking-wider mb-1">
                              <Users className="w-3.5 h-3.5 text-rose-500" />
                              Breakdown Alokasi Anggaran ({comp.name})
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Shared/Branch Budget Card */}
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
                                  <button
                                    onClick={() => {
                                      setEditingCompany(comp);
                                      const empTotal = comp.monthlyBudget - comp.sharedBudget;
                                      setEditingCompanyBudget(formatNumberForInput(empTotal));
                                      setEditingCompanySharedBudget(formatNumberForInput(comp.sharedBudget));
                                      setIsEditCompanyModalOpen(true);
                                    }}
                                    className="p-1.5 hover:bg-rose-500/15 border border-slate-200/50 dark:border-slate-800 text-slate-455 hover:text-rose-500 rounded-lg transition"
                                    title="Atur Budget Unit Bisnis"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Employees mapping */}
                              {comp.users.map(u => (
                                <div key={u.id} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:border-rose-500/25 transition duration-200">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center border border-slate-200/20 uppercase">
                                      {u.name ? u.name.split(' ').map(n=>n[0]).slice(0,2).join('') : '?'}
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
                                    <button
                                      onClick={() => {
                                        setEditingUser(u);
                                        setEditingUserBudget(formatNumberForInput(u.monthlyBudget));
                                        setIsEditUserModalOpen(true);
                                      }}
                                      className="p-1.5 hover:bg-rose-500/15 border border-slate-200/50 dark:border-slate-800 text-slate-455 hover:text-rose-500 rounded-lg transition"
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
              <tr className="bg-slate-50 dark:bg-slate-950/20 border-t-2 border-slate-200 dark:border-slate-800 font-bold">
                <td className="py-4.5 px-5 font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">
                  GRAND TOTAL
                </td>
                <td className="py-4.5 px-3 text-center font-extrabold text-slate-700 dark:text-slate-350">{grandTotalDevices} Unit</td>
                <td className="py-4.5 px-3 text-right font-black text-slate-900 dark:text-slate-100 font-mono">{formatCurrency(grandTotalBudget)}</td>
                <td className="py-4.5 px-3 text-right font-black text-slate-900 dark:text-slate-100 font-mono">{formatCurrency(grandTotalCost)}</td>
                <td className={`py-4.5 px-3 text-right font-black font-mono ${grandTotalDifference >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-455'}`}>
                  {grandTotalDifference >= 0 ? '+' : '-'}{formatCurrency(Math.abs(grandTotalDifference))}
                </td>
                <td className="py-4.5 px-3 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${grandTotalDifference >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${grandTotalDifference >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    {grandTotalDifference >= 0 ? 'Aman' : 'Over Budget'}
                  </span>
                </td>
                <td className="py-4.5 px-5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden relative shadow-inner">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${grandTotalUtilization > 100 ? 'from-rose-500 to-pink-500' : grandTotalUtilization > 80 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500'} transition-all duration-500`} 
                        style={{ width: `${Math.min(grandTotalUtilization, 100)}%`, boxShadow: `0 0 8px ${grandTotalUtilization > 100 ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}` }}
                      ></div>
                    </div>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 min-w-[34px] text-right font-mono text-[11px]">{Math.round(grandTotalUtilization)}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Asset Rental Cost Breakdown */}
      {isBreakdownModalOpen && breakdownCompany && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-rose-500" />
                  Breakdown Aset Sewa: {breakdownCompany.name}
                </h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold mt-0.5">
                  Daftar rinician unit sewa aktif beserta biaya masing-masing
                </p>
              </div>
              <button 
                onClick={() => setIsBreakdownModalOpen(false)}
                className="text-gray-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg p-1.5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content Table */}
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
                  {breakdownCompany.assets && breakdownCompany.assets.length > 0 ? (
                    breakdownCompany.assets.map(asset => {
                      const startStr = formatDateDMY(asset.rentalStart);
                      const endStr = formatDateDMY(asset.rentalEnd);
                      
                      return (
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
                            {startStr} s/d {endStr}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-850 dark:text-slate-100 font-mono text-[11px]">
                            {formatCurrency(asset.rentalCost)}
                          </td>
                        </tr>
                      );
                    })
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

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/15">
              <div className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                Total Proyeksi Tahun {selectedYear}: <span className="font-black text-rose-500 text-sm ml-1">{formatCurrency(breakdownCompany.totalCost)}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBreakdownModalOpen(false)}
                className="px-5 py-2 bg-slate-150 hover:bg-slate-250 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-200 text-xs font-bold rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit User Budget */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-rose-500" />
                Atur Anggaran Karyawan
              </h3>
              <button 
                onClick={() => setIsEditUserModalOpen(false)}
                className="text-gray-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg p-1 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleUserBudgetSubmit}>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50/50 dark:bg-slate-950/15 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Karyawan</span>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">{editingUser.name}</p>
                  <p className="text-xs text-gray-405 dark:text-slate-500 font-mono mt-0.5">NIP: {editingUser.id}</p>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider block mb-2">Batas Budget Bulanan (IDR) *</label>
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
                  <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-1">Anggaran diset per bulan untuk tagihan sewa laptop/smartphone user ini.</p>
                </div>
              </div>
              
              <div className="flex justify-end items-center gap-3 p-5 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
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
        </div>
      )}

      {/* Modal 3: Edit Company Budget Distribution */}
      {isEditCompanyModalOpen && editingCompany && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4.5 h-4.5 text-rose-500" />
                Atur Anggaran Unit Bisnis
              </h3>
              <button 
                onClick={() => setIsEditCompanyModalOpen(false)}
                className="text-gray-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg p-1 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCompanyBudgetSubmit}>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50/50 dark:bg-slate-950/15 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Badan Usaha</span>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">{editingCompany.name}</p>
                </div>
                
                {/* Employee Budget Distribution Section */}
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-850/80 pt-4">
                  <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider block">A. Anggaran Karyawan (Distribusi)</span>
                  
                  <div className="p-3 bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/10 dark:border-sky-500/20 rounded-2xl text-[11px] text-sky-700 dark:text-sky-400 flex items-start gap-2">
                    <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      Anggaran ini akan dibagi rata untuk seluruh karyawan aktif di unit bisnis ini (**{editingCompany.users.length} karyawan**).
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Total Anggaran Bulanan Karyawan</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                      <input
                        type="text"
                        required
                        value={editingCompanyBudget}
                        onChange={(e) => setEditingCompanyBudget(formatNumberForInput(e.target.value))}
                        placeholder="e.g. 5.000.000"
                        className="w-full pl-9 pr-4 py-2.5 text-xs font-bold rounded-2xl bg-slate-50/60 dark:bg-slate-955/35 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition shadow-inner"
                      />
                    </div>
                    {editingCompany.users.length > 0 && (
                      <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-1">
                        Rata-rata alokasi: {formatCurrency((parseFloat(editingCompanyBudget.toString().replace(/\./g, '')) || 0) / editingCompany.users.length)} / Karyawan
                      </p>
                    )}
                  </div>
                </div>

                {/* Shared Budget Section */}
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-850/80 pt-4">
                  <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider block">B. Anggaran Perangkat Bersama (Shared)</span>
                  <div>
                    <label className="text-[10px] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Anggaran Bulanan Shared / Cabang</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                      <input
                        type="text"
                        required
                        value={editingCompanySharedBudget}
                        onChange={(e) => setEditingCompanySharedBudget(formatNumberForInput(e.target.value))}
                        placeholder="e.g. 1.000.000"
                        className="w-full pl-9 pr-4 py-2.5 text-xs font-bold rounded-2xl bg-slate-50/60 dark:bg-slate-955/35 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition shadow-inner"
                      />
                    </div>
                    <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-1">Khusus alokasi sewa perangkat bersama di toko/cabang (non-personal).</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end items-center gap-3 p-5 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsEditCompanyModalOpen(false)}
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
        </div>
      )}

    </div>
  );
}
