import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Search, ShieldAlert, ArrowRight, User, Building2, CheckCircle2, ChevronRight, Ban } from 'lucide-react';
import ReactLoader from '../components/ReactLoader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_BADGES = {
  OPEN: { label: 'Open', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-500/10 text-amber-650 dark:text-amber-400 border-amber-500/20' },
  PENDING: { label: 'Pending', color: 'bg-purple-500/10 text-purple-650 dark:text-purple-400 border-purple-500/20' },
  RESOLVED: { label: 'Resolved', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  CLOSED: { label: 'Closed', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' }
};

export default function SlaMonitor({ token, user }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  
  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [activeTab, setActiveTab] = useState('all_breached'); // all_breached, response_breached, resolution_breached
  
  const MONTH_NAMES = [
    { value: '0', label: 'Januari' },
    { value: '1', label: 'Februari' },
    { value: '2', label: 'Maret' },
    { value: '3', label: 'April' },
    { value: '4', label: 'Mei' },
    { value: '5', label: 'Juni' },
    { value: '6', label: 'Juli' },
    { value: '7', label: 'Agustus' },
    { value: '8', label: 'September' },
    { value: '9', label: 'Oktober' },
    { value: '10', label: 'November' },
    { value: '11', label: 'Desember' }
  ];

  const headers = { 'Authorization': `Bearer ${token}` };
  const now = new Date();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/tickets`, { headers });
      if (!res.ok) throw new Error('Gagal memuat data tiket dari server.');
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTicket = async (ticketId) => {
    if (!user || !user.id) return;
    try {
      setProcessingId(ticketId);
      const res = await fetch(`${API_URL}/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ agentId: user.id })
      });
      if (!res.ok) throw new Error('Gagal mengklaim tiket.');
      await fetchTickets();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleEscalateTicket = async (ticketId) => {
    try {
      setProcessingId(ticketId);
      const res = await fetch(`${API_URL}/tickets/${ticketId}/priority`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priority: 'CRITICAL' })
      });
      if (!res.ok) throw new Error('Gagal mengeskalasi prioritas tiket.');
      await fetchTickets();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Helper kalkulasi SLA Response (Batas: 15 menit)
  const getResponseStats = (ticket) => {
    const created = new Date(ticket.createdAt);
    const responded = ticket.respondedAt ? new Date(ticket.respondedAt) : null;
    
    // Jika belum direspon, hitung sampai waktu sekarang (kecuali sudah resolved/closed)
    const end = responded || (['RESOLVED', 'CLOSED'].includes(ticket.status) ? new Date(ticket.resolvedAt || ticket.updatedAt) : now);
    const diffMs = end - created - (ticket.totalPausedMs || 0);
    const minutes = Math.max(0, Math.round(diffMs / (60 * 1000)));
    
    const isBreached = minutes > 15;
    const excessMinutes = isBreached ? minutes - 15 : 0;
    
    return { minutes, isBreached, excessMinutes, hasResponded: !!responded };
  };

  // Helper kalkulasi SLA Penyelesaian (Batas: 4 hari = 96 jam)
  const getResolutionStats = (ticket) => {
    const created = new Date(ticket.createdAt);
    const resolved = ticket.resolvedAt ? new Date(ticket.resolvedAt) : null;
    
    // Jika belum diselesaikan, hitung sampai waktu sekarang (kecuali closed)
    const end = resolved || (ticket.status === 'CLOSED' ? new Date(ticket.updatedAt) : now);
    const diffMs = end - created - (ticket.totalPausedMs || 0);
    const hours = Math.max(0, Math.round(diffMs / (60 * 60 * 1000)));
    const days = (hours / 24).toFixed(1);
    
    const isBreached = hours > 96; // 4 hari * 24 jam
    const excessHours = isBreached ? hours - 96 : 0;
    const excessDays = (excessHours / 24).toFixed(1);
    
    return { hours, days, isBreached, excessHours, excessDays, hasResolved: !!resolved };
  };

  // Memetakan tiket dengan data kalkulasi SLA
  const processedTickets = tickets.map(t => {
    const response = getResponseStats(t);
    const resolution = getResolutionStats(t);
    return {
      ...t,
      response,
      resolution,
      isAnyBreached: response.isBreached || resolution.isBreached
    };
  });

  // Filter berdasarkan bulan dan tahun terlebih dahulu sebelum menghitung KPI
  const dateFilteredTickets = processedTickets.filter(t => {
    const ticketDate = new Date(t.createdAt);
    const matchesMonth = selectedMonth ? ticketDate.getMonth() === parseInt(selectedMonth) : true;
    const matchesYear = selectedYear ? ticketDate.getFullYear() === parseInt(selectedYear) : true;
    return matchesMonth && matchesYear;
  });

  // Ekstrak tahun unik secara dinamis dari seluruh tiket
  const uniqueYears = Array.from(new Set(tickets.map(t => new Date(t.createdAt).getFullYear()))).sort((a, b) => b - a);

  // Filter berdasarkan Tab aktif
  const tabFiltered = dateFilteredTickets.filter(t => {
    if (activeTab === 'all_breached') return t.isAnyBreached;
    if (activeTab === 'response_breached') return t.response.isBreached;
    if (activeTab === 'resolution_breached') return t.resolution.isBreached;
    return true;
  });

  // Filter berdasarkan input search & status
  const finalFiltered = tabFiltered.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.requester.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.assignedTo && t.assignedTo.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStatus = selectedStatus ? t.status === selectedStatus : true;
    
    return matchesSearch && matchesStatus;
  });

  // Hitung Metrik Utama (Dashboard Atas)
  const totalBreached = dateFilteredTickets.filter(t => t.isAnyBreached).length;
  const totalResponseBreached = dateFilteredTickets.filter(t => t.response.isBreached).length;
  const totalResolutionBreached = dateFilteredTickets.filter(t => t.resolution.isBreached).length;
  const totalBothBreached = dateFilteredTickets.filter(t => t.response.isBreached && t.resolution.isBreached).length;

  if (loading) {
    return <ReactLoader text="Memuat analisis SLA tiket..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 font-outfit">
              SLA Outlier Monitor
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-1">
            Pemantauan kepatuhan layanan IT: Respon cepat awal (&le; 15 menit) dan penyelesaian kasus (&le; 4 hari).
          </p>
        </div>
        <button
          onClick={fetchTickets}
          className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition duration-150"
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Metrik KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metrik 1: Total Pelanggaran */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Total Outliers</span>
            <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-outfit">{totalBreached}</span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Tiket Bermasalah</span>
          </div>
        </div>

        {/* Metrik 2: Respon > 15m */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Respon Lambat (&gt;15m)</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-outfit">{totalResponseBreached}</span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Tiket</span>
          </div>
        </div>

        {/* Metrik 3: Resolusi > 4d */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Penyelesaian Lambat (&gt;4d)</span>
            <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-500">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-outfit">{totalResolutionBreached}</span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Tiket</span>
          </div>
        </div>

        {/* Metrik 4: Double Breach */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Pelanggaran Ganda</span>
            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-650 dark:text-red-400 font-outfit">{totalBothBreached}</span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Melanggar Keduanya</span>
          </div>
        </div>
      </div>

      {/* Filter Bar & Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl shadow-sm overflow-hidden p-6 space-y-5">
        
        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800/80 gap-6">
          <button
            onClick={() => setActiveTab('all_breached')}
            className={`pb-3 text-xs font-black font-outfit border-b-2 transition duration-150 ${
              activeTab === 'all_breached'
                ? 'border-rose-500 text-rose-500 dark:text-rose-455'
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600'
            }`}
          >
            Semua Outliers ({totalBreached})
          </button>
          <button
            onClick={() => setActiveTab('response_breached')}
            className={`pb-3 text-xs font-black font-outfit border-b-2 transition duration-150 ${
              activeTab === 'response_breached'
                ? 'border-rose-500 text-rose-500 dark:text-rose-455'
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600'
            }`}
          >
            Respon Lambat &gt; 15m ({totalResponseBreached})
          </button>
          <button
            onClick={() => setActiveTab('resolution_breached')}
            className={`pb-3 text-xs font-black font-outfit border-b-2 transition duration-150 ${
              activeTab === 'resolution_breached'
                ? 'border-rose-500 text-rose-500 dark:text-rose-455'
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600'
            }`}
          >
            Penyelesaian Lambat &gt; 4 Hari ({totalResolutionBreached})
          </button>
        </div>

        {/* Input Pencarian & Dropdown Status */}
        <div className="flex flex-col xl:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari ID tiket, judul, pemohon, atau agen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-rose-500 dark:focus:border-rose-500 transition"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 sm:flex-initial sm:w-36 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-rose-500 transition"
            >
              <option value="">Semua Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 sm:flex-initial sm:w-36 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-rose-500 transition"
            >
              <option value="">Semua Bulan</option>
              {MONTH_NAMES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="flex-1 sm:flex-initial sm:w-32 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-rose-500 transition"
            >
              <option value="">Semua Tahun</option>
              {uniqueYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabel/Daftar Tiket Bermasalah */}
        <div>
          {finalFiltered.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-xs text-gray-800 dark:text-slate-350 font-bold">Hebat! Tidak ada tiket bermasalah.</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Seluruh tiket memenuhi standar SLA respon & penyelesaian.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP VIEW: Tabel Lebar */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-850/40 border-b border-slate-100 dark:border-slate-800/40">
                      <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider pl-6">ID & Judul Tiket</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Pemohon / Cabang</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Agen IT</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider text-center">Waktu Respon</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider text-center">Waktu Penyelesaian</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider text-center">Status</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider text-center pr-6">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {finalFiltered.map(t => {
                      const badge = STATUS_BADGES[t.status] || { label: t.status, color: 'bg-slate-100 text-slate-600' };
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20 transition duration-150">
                          {/* ID & Judul */}
                          <td className="p-4 pl-6">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-rose-500 dark:text-rose-455 font-outfit uppercase tracking-wider">
                                {t.id.slice(0, 8)}...
                              </span>
                              <span className="text-xs font-bold text-gray-800 dark:text-slate-200 mt-0.5 line-clamp-1 max-w-xs">
                                {t.title}
                              </span>
                              <span className="text-[9px] text-gray-400 dark:text-slate-500 font-medium mt-0.5">
                                Dibuat: {new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>

                          {/* Pemohon & Cabang */}
                          <td className="p-4">
                            <div className="flex flex-col text-xs font-semibold">
                              <span className="text-gray-800 dark:text-slate-350">{t.requester.name}</span>
                              <span className="text-[9.5px] text-gray-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {t.company.name} ({t.company.location})
                              </span>
                            </div>
                          </td>

                          {/* Agen IT */}
                          <td className="p-4">
                            {t.assignedTo ? (
                              <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-slate-300 font-semibold">
                                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-[10px] font-black text-rose-500">
                                  {t.assignedTo.name.charAt(0).toUpperCase()}
                                </div>
                                <span>{t.assignedTo.name}</span>
                              </div>
                            ) : (
                              <span className="text-[10.5px] text-slate-400 dark:text-slate-550 font-bold italic">Belum Di-assign</span>
                            )}
                          </td>

                          {/* Waktu Respon */}
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-xs font-extrabold font-outfit ${t.response.isBreached ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {t.response.minutes} Menit
                              </span>
                              {t.response.isBreached ? (
                                <span className="text-[9px] text-rose-500/80 font-medium mt-0.5 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded">
                                  Terlambat {t.response.excessMinutes}m
                                </span>
                              ) : (
                                <span className="text-[8.5px] text-gray-400 dark:text-slate-500 font-medium mt-0.5">Sesuai SLA</span>
                              )}
                            </div>
                          </td>

                          {/* Waktu Penyelesaian */}
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-xs font-extrabold font-outfit ${t.resolution.isBreached ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {t.resolution.days} Hari
                              </span>
                              {t.resolution.isBreached ? (
                                <span className="text-[9px] text-rose-500/80 font-medium mt-0.5 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded">
                                  Terlambat {t.resolution.excessDays}d
                                </span>
                              ) : (
                                <span className="text-[8.5px] text-gray-400 dark:text-slate-500 font-medium mt-0.5">Sesuai SLA</span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-4 text-center">
                            <span className={`inline-block text-[10.5px] font-black px-2.5 py-1 border rounded-lg uppercase tracking-wide font-outfit ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="p-4 pr-6 text-center">
                            {['RESOLVED', 'CLOSED'].includes(t.status) ? (
                              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold italic">Selesai</span>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                {processingId === t.id ? (
                                  <span className="text-[10px] text-rose-500 font-bold animate-pulse">Memproses...</span>
                                ) : (
                                  <>
                                    {!t.assignedToId && (
                                      <button
                                        onClick={() => handleClaimTicket(t.id)}
                                        className="px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition duration-150 shadow-sm"
                                        title="Ambil / Tangani tiket ini"
                                      >
                                        Ambil
                                      </button>
                                    )}
                                    
                                    {t.priority !== 'CRITICAL' && (
                                      <button
                                        onClick={() => handleEscalateTicket(t.id)}
                                        className="px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition duration-150 shadow-sm"
                                        title="Eskalasi Prioritas ke CRITICAL"
                                      >
                                        Eskalasi
                                      </button>
                                    )}

                                    <a
                                      href={`mailto:${t.requester.email}?subject=IT Helpdesk SLA Alert: ${t.id} - ${encodeURIComponent(t.title)}&body=Halo ${t.requester.name},%0D%0A%0D%0AKami ingin mengonfirmasi mengenai tiket laporan Anda dengan subjek "${encodeURIComponent(t.title)}" yang saat ini sedang dalam penanganan kami.`}
                                      className="px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition duration-150"
                                      title="Hubungi Pemohon lewat Email"
                                    >
                                      Hubungi
                                    </a>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE VIEW: Grid Daftar Kartu */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {finalFiltered.map(t => {
                  const badge = STATUS_BADGES[t.status] || { label: t.status, color: 'bg-slate-100 text-slate-600' };
                  return (
                    <div key={t.id} className="bg-slate-55/60 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-5 space-y-4 shadow-sm animate-fade-in">
                      {/* Kartu Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-rose-500 dark:text-rose-455 font-outfit uppercase tracking-wider">
                          ID: {t.id.slice(0, 8)}...
                        </span>
                        <span className={`inline-block text-[9.5px] font-black px-2 py-0.5 border rounded-md uppercase tracking-wide font-outfit ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Judul Tiket */}
                      <div className="text-xs font-bold text-gray-800 dark:text-slate-200 leading-relaxed">
                        {t.title}
                      </div>

                      {/* Detail Data & Waktu */}
                      <div className="text-[11px] space-y-2 border-t border-slate-100 dark:border-slate-800/40 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 dark:text-slate-500 font-bold">Pemohon:</span>
                          <span className="font-extrabold text-gray-700 dark:text-slate-350">{t.requester.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 dark:text-slate-500 font-bold">Cabang:</span>
                          <span className="font-extrabold text-gray-700 dark:text-slate-350 truncate max-w-[170px]">{t.company.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 dark:text-slate-500 font-bold">Agen IT:</span>
                          <span className="font-extrabold text-gray-700 dark:text-slate-350">
                            {t.assignedTo ? t.assignedTo.name : 'Belum Di-assign'}
                          </span>
                        </div>
                        
                        {/* Waktu Respon & SLA */}
                        <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/20 pt-2">
                          <span className="text-gray-400 dark:text-slate-500 font-bold">Waktu Respon:</span>
                          <div className="flex flex-col items-end">
                            <span className={`font-black font-outfit ${t.response.isBreached ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {t.response.minutes} Menit
                            </span>
                            {t.response.isBreached && (
                              <span className="text-[9px] text-rose-500/80 font-bold mt-0.5 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded">
                                Terlambat {t.response.excessMinutes}m
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Waktu Penyelesaian & SLA */}
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 dark:text-slate-500 font-bold">Waktu Selesai:</span>
                          <div className="flex flex-col items-end">
                            <span className={`font-black font-outfit ${t.resolution.isBreached ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {t.resolution.days} Hari
                            </span>
                            {t.resolution.isBreached && (
                              <span className="text-[9px] text-rose-500/80 font-bold mt-0.5 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded">
                                Terlambat {t.resolution.excessDays}d
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tombol Aksi Cepat (Mobile) */}
                      <div className="border-t border-slate-100 dark:border-slate-800/40 pt-3 flex justify-end gap-2.5">
                        {['RESOLVED', 'CLOSED'].includes(t.status) ? (
                          <span className="text-[11.5px] text-gray-400 dark:text-slate-550 font-bold italic">Selesai</span>
                        ) : (
                          <>
                            {processingId === t.id ? (
                              <span className="text-xs text-rose-500 font-black animate-pulse">Memproses...</span>
                            ) : (
                              <>
                                {!t.assignedToId && (
                                  <button
                                    onClick={() => handleClaimTicket(t.id)}
                                    className="px-3.5 py-1.5 text-[10.5px] font-black uppercase text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-sm"
                                  >
                                    Ambil
                                  </button>
                                )}
                                
                                {t.priority !== 'CRITICAL' && (
                                  <button
                                    onClick={() => handleEscalateTicket(t.id)}
                                    className="px-3.5 py-1.5 text-[10.5px] font-black uppercase text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-sm"
                                  >
                                    Eskalasi
                                  </button>
                                )}

                                <a
                                  href={`mailto:${t.requester.email}?subject=IT Helpdesk SLA Alert: ${t.id} - ${encodeURIComponent(t.title)}&body=Halo ${t.requester.name},%0D%0A%0D%0AKami ingin mengonfirmasi mengenai tiket laporan Anda dengan subjek "${encodeURIComponent(t.title)}" yang saat ini sedang dalam penanganan kami.`}
                                  className="px-3.5 py-1.5 text-[10.5px] font-black uppercase text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-55"
                                >
                                  Hubungi
                                </a>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
