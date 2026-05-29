import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  UserPlus, 
  Play, 
  Pause, 
  CheckCircle2, 
  Check, 
  AlertTriangle,
  ChevronRight,
  X,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function TicketsSummary({ user, token }) {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected ticket for modal detail view
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Live ticking state for SLA countdown refresh
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTickets();
    if (user.role !== 'USER') {
      fetchAgents();
    }
  }, [statusFilter, priorityFilter]);

  // SLA countdown timer refresh every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch ticket details when ID changes
  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetails(selectedTicketId);
    } else {
      setTicketDetails(null);
    }
  }, [selectedTicketId]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      let query = `?search=${searchQuery}`;
      if (statusFilter !== 'ALL') query += `&status=${statusFilter}`;
      if (priorityFilter) query += `&priority=${priorityFilter}`;

      const res = await fetch(`${API_URL}/tickets${query}`, { headers });
      if (!res.ok) throw new Error('Gagal memuat daftar tiket.');
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // filter agents or admins
        setAgents(data.filter(u => u.role === 'AGENT' || u.role === 'ADMIN'));
      }
    } catch (err) {}
  };

  const fetchTicketDetails = async (id) => {
    try {
      setDetailsLoading(true);
      const res = await fetch(`${API_URL}/tickets/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal memuat detail tiket.');
      const data = await res.json();
      setTicketDetails(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Status Action Handlers
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mengubah status.');
      }

      // Refresh list and details
      fetchTickets();
      if (selectedTicketId === ticketId) {
        fetchTicketDetails(ticketId);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Agent Assign Handler
  const handleAssignAgent = async (ticketId, agentId) => {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignedToId: agentId })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menugaskan agen.');
      }

      fetchTickets();
      if (selectedTicketId === ticketId) {
        fetchTicketDetails(ticketId);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // SLA Time Counter Calculation
  const renderSlaStatus = (ticket) => {
    if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      return (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          ticket.isSlaBreached 
            ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
        }`}>
          {ticket.isSlaBreached ? 'Breached (Terlambat)' : 'SLA Met (Tepat Waktu)'}
        </span>
      );
    }

    // SLA targets
    const limitTime = new Date(ticket.slaResolutionLimit).getTime();
    const pausedMs = ticket.totalPausedMs || 0;
    
    let activeLimitTime = limitTime + pausedMs;
    // Add current pending interval if currently paused
    if (ticket.status === 'PENDING' && ticket.lastPausedAt) {
      const currentPause = currentTime.getTime() - new Date(ticket.lastPausedAt).getTime();
      activeLimitTime += currentPause;
    }

    const remainingMs = activeLimitTime - currentTime.getTime();
    const isOverdue = remainingMs < 0;
    const diffMin = Math.abs(Math.round(remainingMs / 1000 / 60));
    const diffHours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;

    let timeString = '';
    if (diffHours > 0) {
      timeString = `${diffHours} jam ${mins} menit`;
    } else {
      timeString = `${mins} menit`;
    }

    if (ticket.status === 'PENDING') {
      return (
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1.5 w-fit">
          <Pause className="w-3 h-3 fill-current" />
          Paused ({timeString} sisa)
        </span>
      );
    }

    if (isOverdue) {
      return (
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 flex items-center gap-1.5 w-fit border border-red-500/10">
          <AlertTriangle className="w-3.5 h-3.5" />
          Overdue ({timeString})
        </span>
      );
    }

    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 flex items-center gap-1.5 w-fit border border-amber-500/10">
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        {timeString} sisa
      </span>
    );
  };

  const getPriorityBadge = (prio) => {
    const classes = {
      HIGH: 'bg-red-500 text-white shadow-red-500/10',
      MEDIUM: 'bg-amber-500 text-white shadow-amber-500/10',
      LOW: 'bg-emerald-500 text-white shadow-emerald-500/10'
    };
    return (
      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm ${classes[prio] || 'bg-gray-500'}`}>
        {prio}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const classes = {
      OPEN: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
      IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
      PENDING: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50',
      RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
      CLOSED: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800'
    };
    return (
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${classes[status] || 'bg-gray-50'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight">
            Daftar Tiket Bantuan
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">
            Monitor keluhan, status pengerjaan, dan perhitungan SLA secara langsung.
          </p>
        </div>

        {/* Create Ticket Button (USER / ADMIN) */}
        {['USER', 'ADMIN'].includes(user.role) && (
          <Link
            to="/input-ticket"
            className="flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/15 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Buat Tiket Baru</span>
          </Link>
        )}
      </div>

      {/* Filter Options Panel */}
      <div className="glass-card p-4 rounded-2xl border border-gray-200/50 dark:border-slate-800/30 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Tab Status Filters */}
        <div className="flex flex-wrap gap-1 w-full md:w-auto">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100/50 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search & Priority Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">Semua Prioritas</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>

          {/* Search box */}
          <form 
            onSubmit={(e) => { e.preventDefault(); fetchTickets(); }}
            className="flex-1 md:w-64 relative"
          >
            <input
              type="text"
              placeholder="Cari tiket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 shadow-sm"
            />
            <button type="submit" className="absolute left-3.5 top-2.5">
              <Search className="w-4 h-4 text-gray-400 hover:text-brand-500 transition-colors" />
            </button>
          </form>
        </div>

      </div>

      {/* Main Table List */}
      <div className="glass-card rounded-2xl border border-gray-200/50 dark:border-slate-800/30 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex justify-center">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-slate-500">
            Tidak ada tiket yang ditemukan dengan kriteria filter tersebut.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-200/50 dark:border-slate-800/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Tiket</th>
                  <th className="py-4 px-6">Perusahaan / Lokasi</th>
                  <th className="py-4 px-6">Prioritas</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Target SLA</th>
                  <th className="py-4 px-6">PIC Agent</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-sm">
                {tickets.map(ticket => (
                  <tr 
                    key={ticket.id} 
                    className="hover:bg-gray-50/30 dark:hover:bg-slate-900/10 cursor-pointer transition-colors"
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-semibold text-gray-800 dark:text-slate-200 truncate">{ticket.title}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span>ID: {ticket.id.substring(0,8)}</span>
                        <span>•</span>
                        <span>{ticket.requester.name} ({ticket.category})</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-700 dark:text-slate-300 truncate max-w-[150px]">
                        {ticket.company.name}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{ticket.company.location}</div>
                    </td>
                    <td className="py-4 px-6">{getPriorityBadge(ticket.priority)}</td>
                    <td className="py-4 px-6">{getStatusBadge(ticket.status)}</td>
                    <td className="py-4 px-6 font-medium">{renderSlaStatus(ticket)}</td>
                    <td className="py-4 px-6 text-gray-600 dark:text-slate-400">
                      {ticket.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                            {ticket.assignedTo.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{ticket.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Belum ada</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <ChevronRight className="w-5 h-5 text-gray-400 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details Side-Drawer Panel (Modal) */}
      {selectedTicketId && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex justify-end z-50 animate-fade-in">
          
          {/* Overlay click to close */}
          <div className="absolute inset-0" onClick={() => setSelectedTicketId(null)}></div>

          {/* Drawer Body */}
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 min-h-screen shadow-2xl relative z-10 p-6 flex flex-col justify-between border-l border-gray-200 dark:border-slate-800 overflow-y-auto max-h-screen">
            
            {detailsLoading && !ticketDetails ? (
              <div className="h-full flex items-center justify-center flex-1">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : ticketDetails ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                
                {/* Header Row */}
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detail Tiket Bantuan</span>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 mt-1">{ticketDetails.title}</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedTicketId(null)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-slate-400 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    {getStatusBadge(ticketDetails.status)}
                    {getPriorityBadge(ticketDetails.priority)}
                    <span className="text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                      {ticketDetails.category}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200/50 dark:border-slate-800/50 my-2"></div>

                {/* Info Fields Grid */}
                <div className="space-y-4 flex-1">
                  
                  {/* Requester Info Card */}
                  <div className="p-4 bg-gray-50/50 dark:bg-slate-950/20 border border-gray-200/50 dark:border-slate-800/30 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Karyawan Pelapor</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-gray-400 font-medium">Nama Lengkap</p>
                        <p className="font-semibold text-gray-700 dark:text-slate-200 mt-0.5">{ticketDetails.requester.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">No. Telepon</p>
                        <p className="font-semibold text-gray-700 dark:text-slate-200 mt-0.5">{ticketDetails.requester.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">Perusahaan / Cabang</p>
                        <p className="font-semibold text-gray-700 dark:text-slate-200 mt-0.5">{ticketDetails.company.name}</p>
                        <p className="text-[10px] text-gray-400">{ticketDetails.company.location}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">Departemen / Posisi</p>
                        <p className="font-semibold text-gray-700 dark:text-slate-200 mt-0.5">{ticketDetails.requester.department}</p>
                        <p className="text-[10px] text-gray-400">{ticketDetails.requester.jobPosition}</p>
                      </div>
                    </div>
                  </div>

                  {/* SLA Tracker Card */}
                  <div className="p-4 bg-gray-50/50 dark:bg-slate-950/20 border border-gray-200/50 dark:border-slate-800/30 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Service Level Agreement (SLA)</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-gray-400 font-medium">Sisa Waktu Penyelesaian</p>
                        <div className="mt-1 font-semibold">{renderSlaStatus(ticketDetails)}</div>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">Batas Target Resolusi</p>
                        <p className="font-semibold text-gray-700 dark:text-slate-200 mt-1">
                          {new Date(ticketDetails.slaResolutionLimit).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          {', '}
                          {new Date(ticketDetails.slaResolutionLimit).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detail Keluhan</h4>
                    <div className="p-4 bg-gray-50/20 dark:bg-slate-950/10 border border-gray-200/30 dark:border-slate-800/30 rounded-2xl text-xs leading-relaxed whitespace-pre-line text-gray-700 dark:text-slate-300">
                      {ticketDetails.description}
                    </div>
                  </div>

                  {/* Audit Logs Chronology */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Riwayat Tindakan (Audit Log)</h4>
                    <div className="space-y-2 border-l border-gray-200 dark:border-slate-800 pl-4 py-1 ml-2 text-xs">
                      {ticketDetails.auditLogs.map(log => (
                        <div key={log.id} className="relative mt-2">
                          <div className="absolute w-2 h-2 rounded-full bg-brand-500 -left-[21px] top-1"></div>
                          <p className="font-semibold text-gray-700 dark:text-slate-200">{log.action.replace('_', ' ')}</p>
                          <p className="text-gray-500 dark:text-slate-400 mt-0.5">{log.details}</p>
                          <span className="text-[10px] text-gray-400">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Operations & Agent Actions (Agents/Admins Only) */}
                {user.role !== 'USER' && (
                  <div className="pt-6 border-t border-gray-200 dark:border-slate-800 space-y-4">
                    
                    {/* Assign Agent controls */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-slate-400">
                        <UserPlus className="w-4 h-4 text-gray-400" />
                        <span>Penugasan Agen:</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Assign to Self button */}
                        {!ticketDetails.assignedTo || ticketDetails.assignedTo.id !== user.id ? (
                          <button
                            onClick={() => handleAssignAgent(ticketDetails.id, user.id)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-200 rounded-lg transition-all"
                          >
                            Tugaskan ke Saya
                          </button>
                        ) : null}

                        {/* Dropdown list of all agents */}
                        <select
                          value={ticketDetails.assignedToId || ''}
                          onChange={(e) => handleAssignAgent(ticketDetails.id, e.target.value)}
                          className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Pilih Agen --</option>
                          {agents.map(ag => (
                            <option key={ag.id} value={ag.id}>{ag.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Status transition controls */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {/* 1. Open -> Start Process */}
                      {ticketDetails.status === 'OPEN' && (
                        <button
                          onClick={() => handleStatusChange(ticketDetails.id, 'IN_PROGRESS')}
                          className="w-full col-span-2 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-brand-500/10 transition-colors"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Mulai Proses Penanganan (Start SLA)</span>
                        </button>
                      )}

                      {/* 2. In Progress -> Pause / Resolve */}
                      {ticketDetails.status === 'IN_PROGRESS' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(ticketDetails.id, 'PENDING')}
                            className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Pause className="w-4 h-4 fill-current" />
                            <span>Tunda SLA (Pause)</span>
                          </button>
                          
                          <button
                            onClick={() => handleStatusChange(ticketDetails.id, 'RESOLVED')}
                            className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Selesaikan Tiket</span>
                          </button>
                        </>
                      )}

                      {/* 3. Pending -> Resume Process */}
                      {ticketDetails.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusChange(ticketDetails.id, 'IN_PROGRESS')}
                          className="w-full col-span-2 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Lanjutkan Penanganan (Resume SLA)</span>
                        </button>
                      )}

                      {/* 4. Resolved -> Close Ticket */}
                      {ticketDetails.status === 'RESOLVED' && (
                        <button
                          onClick={() => handleStatusChange(ticketDetails.id, 'CLOSED')}
                          className="w-full col-span-2 py-3 bg-gray-800 hover:bg-gray-900 dark:bg-slate-950 dark:hover:bg-black text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>Tutup Tiket Secara Permanen</span>
                        </button>
                      )}
                    </div>

                  </div>
                )}

              </div>
            ) : null}

          </div>

        </div>
      )}

    </div>
  );
}
