import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import {
  Wallet,
  Package,
  Laptop,
  CreditCard,
  Loader2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building2,
  Calendar,
  Wifi,
  FileDown,
  FileSpreadsheet,
} from 'lucide-react';
import PendingProcessPlaceholder from '../components/PendingProcessPlaceholder';
import { exportPDF, exportExcel } from '../utils/itCostExport';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

export default function ITCostOverview({ user, token, darkMode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [overview, setOverview] = useState(null);
  const [companyMasters, setCompanyMasters] = useState([]);
  const [selectedCompanyMasterId, setSelectedCompanyMasterId] = useState('');
  const [selectedYear, setSelectedYear] = useState(''); // '' = rolling trailing 12 months (default)
  const [exporting, setExporting] = useState(null); // 'pdf' | 'excel' | null

  // Company master list is just a filter lookup, safe to load on mount (the main
  // cost data itself still only loads via the "Proses / Muat Data" button)
  useEffect(() => {
    const fetchCompanyMasters = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch(`${API_URL}/companies/master`, { headers });
        if (res.ok) {
          setCompanyMasters(await res.json());
        }
      } catch (err) {
        console.error("Gagal memuat data perusahaan induk:", err);
      }
    };
    fetchCompanyMasters();
  }, [token]);

  const formatRupiah = (value) => {
    if (value === undefined || value === null) return 'Rp 0';
    return 'Rp ' + Number(value).toLocaleString('id-ID');
  };

  const formatMonthLabel = (yearMonth) => {
    const [yr, mo] = yearMonth.split('-');
    return `${monthNames[parseInt(mo, 10) - 1]} ${yr.slice(2)}`;
  };

  const handleLoadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };
      const params = new URLSearchParams();
      if (selectedCompanyMasterId) params.append('companyMasterId', selectedCompanyMasterId);
      if (selectedYear) params.append('year', selectedYear);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_URL}/reports/it-cost-overview${queryString}`, { headers });
      if (!res.ok) throw new Error('Gagal memuat ringkasan biaya IT.');
      const data = await res.json();
      setOverview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  };

  const selectedCompanyMasterName = companyMasters.find(m => m.id === selectedCompanyMasterId)?.name || '';

  const handleExportPDF = async () => {
    if (!overview) return;
    setExporting('pdf');
    try {
      exportPDF({ overview, periodLabel, selectedYear, selectedCompanyMasterName });
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (!overview) return;
    setExporting('excel');
    try {
      await exportExcel({ overview, periodLabel, selectedYear, selectedCompanyMasterName });
    } finally {
      setExporting(null);
    }
  };

  const monthlyTrend = overview?.monthlyTrend || [];
  const byEntity = overview?.byEntity || [];
  const periodLabel = monthlyTrend.length > 0
    ? `${formatMonthLabel(monthlyTrend[0].yearMonth)} - ${formatMonthLabel(monthlyTrend[monthlyTrend.length - 1].yearMonth)}`
    : '12 Bulan Terakhir';

  const chartCategories = monthlyTrend.map(m => formatMonthLabel(m.yearMonth));
  const chartSeries = [
    { name: 'Peripherals', type: 'column', data: monthlyTrend.map(m => m.peripherals) },
    { name: 'Sewa Aset', type: 'column', data: monthlyTrend.map(m => m.assetsRental) },
    { name: 'Subscription', type: 'column', data: monthlyTrend.map(m => m.subscriptions) },
    { name: 'Internet (ISP)', type: 'column', data: monthlyTrend.map(m => m.isp || 0) },
    { name: 'Total', type: 'line', data: monthlyTrend.map(m => m.total) }
  ];

  const axisColor = darkMode ? '#94a3b8' : '#94a3b8';
  const gridColor = darkMode ? '#334155' : '#e5e7eb';
  const tooltipTheme = darkMode ? 'dark' : 'light';

  const chartOptions = {
    chart: {
      type: 'line',
      stacked: true,
      toolbar: { show: false },
      fontFamily: 'inherit',
      foreColor: axisColor,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 600,
        animateGradually: { enabled: true, delay: 80 },
        dynamicAnimation: { enabled: true, speed: 350 }
      },
      background: 'transparent'
    },
    theme: { mode: darkMode ? 'dark' : 'light' },
    colors: ['#3b82f6', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e'],
    fill: {
      type: ['gradient', 'gradient', 'gradient', 'gradient', 'solid'],
      gradient: {
        shade: darkMode ? 'dark' : 'light',
        type: 'vertical',
        shadeIntensity: 0.4,
        opacityFrom: 0.95,
        opacityTo: 0.55,
        stops: [0, 100]
      }
    },
    stroke: {
      width: [0, 0, 0, 0, 3],
      curve: 'smooth'
    },
    markers: {
      size: [0, 0, 0, 0, 4],
      colors: ['#f43f5e'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: { size: 6 }
    },
    plotOptions: {
      bar: {
        columnWidth: '55%',
        borderRadius: 6,
        borderRadiusApplication: 'end'
      }
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } }
    },
    xaxis: {
      categories: chartCategories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: '10px', fontWeight: 700 } }
    },
    yaxis: {
      labels: {
        style: { fontSize: '10px', fontWeight: 600 },
        formatter: (val) => {
          if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`;
          if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}rb`;
          return `Rp ${val}`;
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '11px',
      fontWeight: 700,
      markers: { width: 8, height: 8, radius: 4 },
      itemMargin: { horizontal: 10 }
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: tooltipTheme,
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => formatRupiah(Math.round(val))
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white font-outfit">
            IT Cost Overview
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-400 font-semibold mt-0.5 max-w-2xl">
            Ringkasan gabungan pengeluaran IT dari Pembelian Periferal, Sewa Aset, dan Subscription & Renewals selama 12 bulan terakhir.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="glass-panel p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-gray-250/60 dark:border-slate-800/60 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-955/30 border border-gray-200 dark:border-slate-850/50 px-3 py-2.5 rounded-xl w-full sm:w-44">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
            >
              <option value="">12 Bulan Terakhir</option>
              {YEAR_OPTIONS.map(y => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-955/30 border border-gray-200 dark:border-slate-850/50 px-3 py-2.5 rounded-xl w-full sm:w-64">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedCompanyMasterId}
              onChange={(e) => setSelectedCompanyMasterId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
            >
              <option value="">Semua Entitas Induk</option>
              {companyMasters.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {overview && (
            <>
              <button
                onClick={handleExportExcel}
                disabled={!!exporting}
                title="Download Excel"
                className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition"
              >
                {exporting === 'excel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                disabled={!!exporting}
                title="Download PDF"
                className="flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition"
              >
                {exporting === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                PDF
              </button>
            </>
          )}
          <button
            onClick={handleLoadData}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
            Proses / Muat Data
          </button>
        </div>
      </div>

      {!dataLoaded && !loading ? (
        <PendingProcessPlaceholder
          title="Proses Ringkasan Biaya IT"
          description={'Klik tombol "Proses / Muat Data" di atas untuk menampilkan ringkasan gabungan biaya Peripherals, Sewa Aset, dan Subscription.'}
        />
      ) : !overview ? (
        <div className="glass-panel rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          <span className="text-xs text-gray-500 font-semibold">Memuat Ringkasan Biaya IT...</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  {selectedYear ? `Total Biaya (${selectedYear})` : 'Total Bulan Terakhir'}
                </p>
                <h3 className="text-md font-black text-rose-500 dark:text-rose-455 mt-1.5 truncate max-w-[150px]">
                  {formatRupiah(selectedYear ? overview.grandTotal.total : overview.currentMonthSummary.total)}
                </h3>
                <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">
                  {selectedYear ? `Akumulasi 12 Bulan ${selectedYear}` : formatMonthLabel(overview.currentMonthSummary.yearMonth)}
                </p>
              </div>
              <div className="w-9 h-9 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-455 rounded-xl flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  {selectedYear ? `Peripherals (${selectedYear})` : 'Peripherals (Bulan Ini)'}
                </p>
                <h3 className="text-md font-black text-blue-600 dark:text-blue-400 mt-1.5 truncate max-w-[150px]">
                  {formatRupiah(selectedYear ? overview.grandTotal.peripherals : overview.currentMonthSummary.peripherals)}
                </h3>
                <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">
                  {selectedYear ? `Total Periferal ${selectedYear}` : formatMonthLabel(overview.currentMonthSummary.yearMonth)}
                </p>
              </div>
              <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-455 rounded-xl flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  {selectedYear ? `Sewa Aset (${selectedYear})` : 'Sewa Aset (Bulan Ini)'}
                </p>
                <h3 className="text-md font-black text-amber-500 dark:text-amber-400 mt-1.5 truncate max-w-[150px]">
                  {formatRupiah(selectedYear ? overview.grandTotal.assetsRental : overview.currentMonthSummary.assetsRental)}
                </h3>
                <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">
                  {selectedYear ? `Total Sewa Laptop ${selectedYear}` : formatMonthLabel(overview.currentMonthSummary.yearMonth)}
                </p>
              </div>
              <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-455 rounded-xl flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  {selectedYear ? `Subscription (${selectedYear})` : 'Subscription (Bulan Ini)'}
                </p>
                <h3 className="text-md font-black text-emerald-600 dark:text-emerald-450 mt-1.5 truncate max-w-[150px]">
                  {formatRupiah(selectedYear ? overview.grandTotal.subscriptions : overview.currentMonthSummary.subscriptions)}
                </h3>
                <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">
                  {selectedYear ? `Total Subskripsi ${selectedYear}` : formatMonthLabel(overview.currentMonthSummary.yearMonth)}
                </p>
              </div>
              <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-455 rounded-xl flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  {selectedYear ? `Internet ISP (${selectedYear})` : 'Internet ISP (Bulan Ini)'}
                </p>
                <h3 className="text-md font-black text-cyan-600 dark:text-cyan-400 mt-1.5 truncate max-w-[150px]">
                  {formatRupiah(selectedYear ? overview.grandTotal.isp : (overview.currentMonthSummary.isp || 0))}
                </h3>
                <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">
                  {selectedYear ? `Total Biaya ISP ${selectedYear}` : formatMonthLabel(overview.currentMonthSummary.yearMonth)}
                </p>
              </div>
              <div className="w-9 h-9 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center">
                <Wifi className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Monthly Trend Combo Chart (stacked columns + total trend line) */}
          <div className="flex flex-col items-stretch bg-white/80 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-rose-500" />
              <span>Tren Gabungan Biaya IT ({periodLabel})</span>
            </h3>

            <Chart options={chartOptions} series={chartSeries} type="line" height={360} />
          </div>

          {/* Breakdown by Entity */}
          <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 space-y-4">
            <h3 className="font-bold text-xs text-gray-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-slate-800">
              <Building2 className="w-4 h-4 text-rose-500" />
              <span>Pengeluaran per Entitas ({periodLabel})</span>
            </h3>

            {byEntity.length === 0 ? (
              <p className="text-center text-xs text-gray-455 italic py-6">Tidak ada data entitas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Entitas</th>
                      <th className="py-3 px-3 text-right">Peripherals</th>
                      <th className="py-3 px-3 text-right">Sewa Aset</th>
                      <th className="py-3 px-3 text-right">Subscription</th>
                      <th className="py-3 px-3 text-right">Internet (ISP)</th>
                      <th className="py-3 px-3 text-right font-extrabold text-rose-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-700 dark:text-slate-300">
                    {byEntity.map((entity) => (
                      <tr key={entity.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/25 transition">
                        <td className="py-3 px-3 font-extrabold text-gray-900 dark:text-white">{entity.name}</td>
                        <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400">{formatRupiah(entity.peripherals)}</td>
                        <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400">{formatRupiah(entity.assetsRental)}</td>
                        <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">{formatRupiah(entity.subscriptions)}</td>
                        <td className="py-3 px-3 text-right text-cyan-600 dark:text-cyan-400">{formatRupiah(entity.isp || 0)}</td>
                        <td className="py-3 px-3 text-right font-black text-rose-500 dark:text-rose-455">{formatRupiah(entity.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-slate-800 font-black text-gray-900 dark:text-white text-xs">
                      <td className="py-3 px-3">TOTAL KESELURUHAN</td>
                      <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400">{formatRupiah(overview.grandTotal.peripherals)}</td>
                      <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400">{formatRupiah(overview.grandTotal.assetsRental)}</td>
                      <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">{formatRupiah(overview.grandTotal.subscriptions)}</td>
                      <td className="py-3 px-3 text-right text-cyan-600 dark:text-cyan-400">{formatRupiah(overview.grandTotal.isp || 0)}</td>
                      <td className="py-3 px-3 text-right text-rose-500 dark:text-rose-455">{formatRupiah(overview.grandTotal.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
