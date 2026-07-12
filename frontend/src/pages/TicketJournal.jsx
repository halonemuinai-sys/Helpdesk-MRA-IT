import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Building2, User, Clock, CheckCircle2, AlertTriangle, AlertCircle, Calendar, MessageSquare } from 'lucide-react';
import ReactLoader from '../components/ReactLoader';
import JournalAgentGantt from '../components/dashboard/JournalAgentGantt';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_BADGES = {
  OPEN: { label: 'Terbuka (Open)', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  IN_PROGRESS: { label: 'Diproses (In Progress)', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  PENDING: { label: 'Tertunda (Pending)', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  RESOLVED: { label: 'Selesai (Resolved)', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  CLOSED: { label: 'Ditutup (Closed)', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' }
};

const PRIORITY_BADGES = {
  LOW: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  MEDIUM: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
  HIGH: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400',
  CRITICAL: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
};

export default function TicketJournal({ token, user }) {
  const [tickets, setTickets] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState('feed');
  const [visibleCount, setVisibleCount] = useState(10);

  const headers = { 'Authorization': `Bearer ${token}` };

  useEffect(() => {
    fetchInitialData();
  }, [selectedCompanyId, selectedStatus, selectedCategory]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      setVisibleCount(10);

      // 1. Fetch tickets with filters
      let queryStr = `?search=${encodeURIComponent(searchQuery)}`;
      if (selectedCompanyId) queryStr += `&companyId=${selectedCompanyId}`;
      if (selectedStatus) queryStr += `&status=${selectedStatus}`;

      const res = await fetch(`${API_URL}/tickets${queryStr}`, { headers });
      if (!res.ok) throw new Error('Gagal memuat daftar tiket.');
      let data = await res.json();

      // Filter category on frontend if category filter is active
      if (selectedCategory) {
        data = data.filter(t => t.category === selectedCategory);
      }

      setTickets(data);

      // 2. Fetch companies for the filter dropdown (only once)
      if (companies.length === 0) {
        const compRes = await fetch(`${API_URL}/companies`, { headers });
        if (compRes.ok) {
          const compData = await compRes.json();
          // Filter unique company names
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInitialData();
  };

  const extractComment = (details) => {
    if (!details) return null;
    const match = details.match(/Catatan:\s*"(.+?)"/s);
    return match ? match[1] : null;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .glass-panel {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.6);
        }
        .dark .glass-panel {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border-color: rgba(30, 41, 59, 0.5);
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Jurnal Tiket IT</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold mt-0.5">
              Aliran riwayat kronologis seluruh isu yang ditulis pengguna serta detail penanganannya
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari isu, judul, deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
          />
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-4 h-4" />
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Company Filter */}
          <div className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="bg-transparent font-semibold text-gray-750 dark:text-slate-350 focus:outline-none cursor-pointer text-xs"
            >
              <option value="">Semua Perusahaan</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent font-semibold text-gray-750 dark:text-slate-350 focus:outline-none cursor-pointer text-xs"
            >
              <option value="">Semua Status</option>
              {Object.keys(STATUS_BADGES).map(key => (
                <option key={key} value={key}>{STATUS_BADGES[key].label}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-semibold text-gray-750 dark:text-slate-350 focus:outline-none cursor-pointer text-xs"
            >
              <option value="">Semua Kategori</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Network">Network</option>
              <option value="Access">Access</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200/50 dark:border-slate-800/80 pb-px">
        <div className="flex bg-gray-100/80 dark:bg-slate-900/55 p-1 rounded-2xl border border-gray-200/20 shadow-inner">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'feed'
                ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-sm border border-gray-200/10 dark:border-slate-700/30'
                : 'text-gray-455 hover:text-slate-750 dark:hover:text-slate-300'
            }`}
          >
            Linimasa Jurnal
          </button>
          <button
            onClick={() => setActiveTab('gantt')}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'gantt'
                ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-sm border border-gray-200/10 dark:border-slate-700/30'
                : 'text-gray-455 hover:text-slate-750 dark:hover:text-slate-300'
            }`}
          >
            Gantt Aktivitas Agen
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      {loading ? (
        <ReactLoader text="Memuat aliran Jurnal Tiket..." />
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span>{error}</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass-panel py-12 text-center rounded-2xl text-gray-400 dark:text-slate-500 text-xs font-semibold">
          Tidak ditemukan tiket yang cocok dengan filter pencarian.
        </div>
      ) : (
        <div className="animate-scale-up">
          {activeTab === 'feed' ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Summary Panel */}
              <div className="lg:col-span-1 glass-panel p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Ringkasan Jurnal</h3>
                <div className="space-y-3 font-semibold text-xs">
                  <div className="flex justify-between border-b border-gray-100 dark:border-slate-800/40 pb-2">
                    <span className="text-gray-450">Total Tiket Terbaca:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{tickets.length}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 dark:border-slate-800/40 pb-2">
                    <span className="text-gray-455">SLA Patuh (Met):</span>
                    <span className="font-bold text-emerald-500">{tickets.filter(t => !t.isSlaBreached).length}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 dark:border-slate-800/40 pb-2">
                    <span className="text-gray-455">SLA Terlanggar:</span>
                    <span className="font-bold text-rose-500">{tickets.filter(t => t.isSlaBreached).length}</span>
                  </div>
                </div>
              </div>

              {/* Chronological Journal Stream */}
              <div className="lg:col-span-3 space-y-6">
                {tickets.slice(0, visibleCount).map(ticket => {
                  const badge = STATUS_BADGES[ticket.status] || STATUS_BADGES.OPEN;
                  const prioClass = PRIORITY_BADGES[ticket.priority] || 'bg-slate-100 text-slate-600';
                  return (
                    <div key={ticket.id} className="glass-panel rounded-3xl p-6 shadow-sm border border-slate-200/50 dark:border-slate-800/40 relative hover:shadow-md transition-shadow duration-200 animate-scale-up">
                      {/* Top Metadata */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/50 pb-3 mb-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(ticket.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${prioClass}`}>
                            {ticket.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>

                      {/* Title & Category */}
                      <div className="mb-3">
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[9px] font-extrabold uppercase mr-2.5">
                          {ticket.category}
                        </span>
                        <h3 className="inline text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                          {ticket.title}
                        </h3>
                      </div>

                      {/* Description (Issue) */}
                      <div className="bg-gray-50/70 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-850/50 rounded-2xl p-4 mb-4">
                        <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Isu Permasalahan:</h4>
                        <p className="text-xs text-gray-700 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">
                          {ticket.description}
                        </p>
                      </div>

                      {/* IT Agent Comments from Audit Log */}
                      {(() => {
                        const comments = (ticket.auditLogs || [])
                          .map(log => ({ comment: extractComment(log.details), by: log.performedBy, at: log.createdAt }))
                          .filter(c => c.comment);
                        if (comments.length === 0) return null;
                        return (
                          <div className="mb-4 space-y-2">
                            <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                              <MessageSquare className="w-3 h-3" />
                              Catatan IT ({comments.length})
                            </h4>
                            {comments.map((c, i) => (
                              <div key={i} className="flex gap-2.5">
                                <div className="w-5 h-5 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                  <MessageSquare className="w-2.5 h-2.5 text-brand-500" />
                                </div>
                                <div className="flex-1 bg-brand-50/60 dark:bg-brand-950/10 border border-brand-200/30 dark:border-brand-900/20 rounded-xl px-3 py-2">
                                  <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed">{c.comment}</p>
                                  <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 mt-1">
                                    {c.by} · {formatDate(c.at)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Footer (Requester & Agent Details) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold border-t border-slate-100 dark:border-slate-800/50 pt-4">
                        {/* Requester Info */}
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg mt-0.5">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Pemohon / Pengirim:</p>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{ticket.requester?.name || '-'}</p>
                            <p className="text-[9px] text-gray-405 dark:text-slate-400 font-bold truncate">
                              {ticket.requester?.department || '-'} | {ticket.company?.name || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Agent Handler Info */}
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-gray-405 dark:text-slate-500 uppercase tracking-wider">Penanggung Jawab:</p>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                              {ticket.assignedTo?.name ? (
                                <span className="text-emerald-500">{ticket.assignedTo.name}</span>
                              ) : (
                                <span className="text-gray-400 italic">Belum Ditugaskan</span>
                              )}
                            </p>
                            <p className="text-[9px] text-gray-405 dark:text-slate-400 font-bold">
                              {ticket.assignedTo?.email ? `Email: ${ticket.assignedTo.email}` : 'Hubungi IT Helpdesk'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {tickets.length > visibleCount && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 10)}
                      className="px-6 py-3 bg-white/85 dark:bg-slate-900/85 hover:bg-rose-500/10 active:scale-95 text-rose-500 font-black text-[10px] uppercase tracking-wider rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm transition-all duration-150"
                    >
                      Muat Lebih Banyak (+10 Tiket)
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <JournalAgentGantt tickets={tickets} />
          )}
        </div>
      )}
    </div>
  );
}
