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
  Plus,
  Trash2,
  Circle,
  PauseCircle,
  XCircle,
  Grid,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import TicketDetailsModal from '../components/TicketDetailsModal';
import ReactLoader from '../components/ReactLoader';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function TicketsSummary({ user, token }) {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('ALL_ACTIVE');
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' or 'HISTORY'
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Date range and pagination limits
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [limit, setLimit] = useState(100);
  const [hasMore, setHasMore] = useState(false);

  const getDateRange = (filter) => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    if (filter === 'THIS_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (filter === 'LAST_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
    } else if (filter === 'LAST_3_MONTHS') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    }

    return { startDate, endDate };
  };

  const handleLoadMore = () => {
    setLimit(prev => prev + 100);
  };

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
  }, [statusFilter, priorityFilter, monthFilter, limit]);

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
      // Exclude ALL_ACTIVE and ALL_HISTORY from backend status query so we get all to filter on frontend
      if (statusFilter !== 'ALL' && statusFilter !== 'ALL_ACTIVE' && statusFilter !== 'ALL_HISTORY') {
        query += `&status=${statusFilter}`;
      }
      if (priorityFilter) query += `&priority=${priorityFilter}`;

      // Date ranges for History tab
      if (activeTab === 'HISTORY' && monthFilter !== 'ALL') {
        const { startDate, endDate } = getDateRange(monthFilter);
        if (startDate) query += `&startDate=${startDate}`;
        if (endDate) query += `&endDate=${endDate}`;
      }

      // Pagination Limit
      query += `&limit=${limit}`;

      const res = await fetch(`${API_URL}/tickets${query}`, { headers });
      if (!res.ok) throw new Error('Failed to load tickets list.');
      const data = await res.json();
      setTickets(data);

      // Determine if there are potentially more records
      if (data.length === limit) {
        setHasMore(true);
      } else {
        setHasMore(false);
      }
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
  const handleStatusChange = async (ticketId, newStatus, comment = '') => {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, comment })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to change status.');
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
        throw new Error(data.error || 'Failed to assign agent.');
      }

      fetchTickets();
      if (selectedTicketId === ticketId) {
        fetchTicketDetails(ticketId);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSlaOverride = async (ticketId, reason) => {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}/sla-override`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to override SLA.');
      }

      fetchTickets();
      if (selectedTicketId === ticketId) {
        fetchTicketDetails(ticketId);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateRespondedAt = async (ticketId, respondedAt, reason) => {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}/responded-at`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ respondedAt, reason })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update response time.');
      }

      fetchTickets();
      if (selectedTicketId === ticketId) {
        fetchTicketDetails(ticketId);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    const isDark = document.documentElement.classList.contains('dark');
    
    const result = await Swal.fire({
      title: 'Delete Ticket?',
      text: `Are you sure you want to permanently delete ticket ${ticketId}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete It',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#f1f5f9' : '#1e293b',
      iconColor: '#f59e0b',
      customClass: {
        popup: 'rounded-3xl border border-gray-200/50 dark:border-slate-800/40 shadow-2xl p-6 font-sans',
        title: 'text-lg font-extrabold text-gray-800 dark:text-slate-100 mt-2',
        htmlContainer: 'text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-medium',
        confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:scale-105 transition-all text-white',
        cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:scale-105 transition-all text-white'
      },
      buttonsStyling: true
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: 'Deleting...',
        text: 'Please wait while we erase this record.',
        background: isDark ? '#0f172a' : '#ffffff',
        color: isDark ? '#f1f5f9' : '#1e293b',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete ticket.');
      }

      await Swal.fire({
        title: 'Deleted!',
        text: `Ticket ${ticketId} has been successfully deleted.`,
        icon: 'success',
        confirmButtonColor: '#06b6d4',
        background: isDark ? '#0f172a' : '#ffffff',
        color: isDark ? '#f1f5f9' : '#1e293b',
        iconColor: '#10b981',
        customClass: {
          popup: 'rounded-3xl border border-gray-200/50 dark:border-slate-800/40 shadow-2xl p-6 font-sans',
          title: 'text-lg font-extrabold text-gray-800 dark:text-slate-100 mt-2',
          htmlContainer: 'text-xs text-gray-500 dark:text-slate-400 font-medium',
          confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs text-white'
        }
      });
      
      if (selectedTicketId === ticketId) {
        setSelectedTicketId(null);
      }
      
      fetchTickets();
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        background: isDark ? '#0f172a' : '#ffffff',
        color: isDark ? '#f1f5f9' : '#1e293b',
        iconColor: '#ef4444',
        customClass: {
          popup: 'rounded-3xl border border-gray-200/50 dark:border-slate-800/40 shadow-2xl p-6 font-sans',
          title: 'text-lg font-extrabold text-gray-800 dark:text-slate-100 mt-2',
          htmlContainer: 'text-xs text-gray-500 dark:text-slate-400 font-medium',
          confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs text-white'
        }
      });
    }
  };

  // SLA Time Counter Calculation
  const renderSlaStatus = (ticket) => {
    const isBypassed = ticket.auditLogs?.some(log => log.action === 'SLA_OVERRIDDEN');
    if (isBypassed) {
      return (
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-750 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/10">
          SLA Bypassed
        </span>
      );
    }

    if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      return (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          ticket.isSlaBreached 
            ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
        }`}>
          {ticket.isSlaBreached ? 'Breached (Late)' : 'SLA Met (On Time)'}
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
      timeString = `${diffHours} hr ${mins} min`;
    } else {
      timeString = `${mins} min`;
    }

    if (ticket.status === 'PENDING') {
      return (
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1.5 w-fit">
          <Pause className="w-3 h-3 fill-current" />
          Paused ({timeString} left)
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
        {timeString} left
      </span>
    );
  };

  const getPriorityBadge = (prio) => {
    const classes = {
      CRITICAL: 'bg-rose-700 text-white shadow-rose-700/20 border border-rose-500 animate-pulse',
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

  const displayTickets = tickets.filter(t => {
    if (statusFilter === 'ALL_ACTIVE') {
      return ['OPEN', 'IN_PROGRESS', 'PENDING'].includes(t.status);
    }
    if (statusFilter === 'ALL_HISTORY') {
      return ['RESOLVED', 'CLOSED'].includes(t.status);
    }
    return true; // Already filtered by backend for specific statuses
  });

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight">
            Helpdesk Tickets List
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">
            Monitor issues, work status, and SLA calculations live.
          </p>
        </div>

        {/* Create Ticket Button (USER / ADMIN) */}
        {['USER', 'ADMIN'].includes(user.role) && (
          <Link
            to="/input-ticket"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-750 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Ticket</span>
          </Link>
        )}
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800/60">
        <button
          type="button"
          onClick={() => {
            setActiveTab('ACTIVE');
            setStatusFilter('ALL_ACTIVE');
            setLimit(100);
            setMonthFilter('ALL');
          }}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all duration-200 ${
            activeTab === 'ACTIVE'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-450 dark:border-emerald-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          Active Tickets
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('HISTORY');
            setStatusFilter('ALL_HISTORY');
            setLimit(100);
            setMonthFilter('ALL');
          }}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all duration-200 ${
            activeTab === 'HISTORY'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-450 dark:border-emerald-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          Ticket History
        </button>
      </div>

      {/* Filter Options Panel */}
      <div className="bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Tab Status Filters */}
        <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
          {activeTab === 'ACTIVE' ? (
            <>
              {[
                { label: 'All Active', value: 'ALL_ACTIVE', icon: Grid },
                { label: 'Open', value: 'OPEN', icon: Circle },
                { label: 'In Progress', value: 'IN_PROGRESS', icon: Clock },
                { label: 'Pending', value: 'PENDING', icon: PauseCircle }
              ].map(status => {
                const Icon = status.icon;
                const isSelected = statusFilter === status.value;
                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => setStatusFilter(status.value)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                      isSelected
                        ? 'bg-emerald-50/80 text-emerald-700 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40 shadow-sm shadow-emerald-500/5'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-650 dark:text-emerald-400' : 'text-emerald-500'}`} />
                    <span>{status.label}</span>
                  </button>
                );
              })}
            </>
          ) : (
            <>
              {[
                { label: 'All History', value: 'ALL_HISTORY', icon: Grid },
                { label: 'Resolved', value: 'RESOLVED', icon: CheckCircle2 },
                { label: 'Closed', value: 'CLOSED', icon: XCircle }
              ].map(status => {
                const Icon = status.icon;
                const isSelected = statusFilter === status.value;
                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => setStatusFilter(status.value)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                      isSelected
                        ? 'bg-emerald-50/80 text-emerald-700 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40 shadow-sm shadow-emerald-500/5'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-650 dark:text-emerald-400' : 'text-emerald-500'}`} />
                    <span>{status.label}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Search & Priority Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Month Filter (History Tab Only) */}
          {activeTab === 'HISTORY' && (
            <div className="relative flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl shadow-sm pr-9 group hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-200">
              <Clock className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors shrink-0" />
              <select
                value={monthFilter}
                onChange={(e) => {
                  setMonthFilter(e.target.value);
                  setLimit(100); // Reset limit to 100 on filter change
                }}
                className="appearance-none bg-transparent text-xs font-bold text-slate-705 dark:text-slate-200 focus:outline-none cursor-pointer w-full"
              >
                <option value="ALL">All Time</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="LAST_MONTH">Last Month</option>
                <option value="LAST_3_MONTHS">Last 3 Months</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none group-hover:text-emerald-500 transition-colors" />
            </div>
          )}

          {/* Priority Filter */}
          <div className="relative flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl shadow-sm pr-9 group hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-200">
            <Filter className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors shrink-0" />
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setLimit(100); // Reset limit on filter change
              }}
              className="appearance-none bg-transparent text-xs font-bold text-slate-705 dark:text-slate-200 focus:outline-none cursor-pointer w-full"
            >
              <option value="">All Priorities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none group-hover:text-emerald-500 transition-colors" />
          </div>

          {/* Search box */}
          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              setLimit(100); 
              fetchTickets(); 
            }}
            className="flex-1 lg:w-64 relative group"
          >
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 shadow-sm transition-all duration-200 hover:border-slate-350 dark:hover:border-slate-700"
            />
            <button type="submit" className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <Search className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 hover:text-emerald-500 transition-colors" />
            </button>
          </form>
        </div>

      </div>

      {/* Main Table List */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 overflow-hidden shadow-sm">
        {loading ? (
          <ReactLoader size="md" text="Loading ticket registry..." />
        ) : displayTickets.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center animate-fade-in">
            {/* Inline Animation styles for empty state scene */}
            <style>{`
              @keyframes planeFloat {
                0%, 100% {
                  transform: translate(220px, 48px) rotate(-10deg) scale(1);
                }
                50% {
                  transform: translate(226px, 35px) rotate(-5deg) scale(1.05);
                }
              }
              @keyframes dashFlow {
                to {
                  stroke-dashoffset: -20;
                }
              }
              @keyframes swayLeft {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(-3deg); }
              }
              @keyframes swayRight {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(3deg); }
              }
              @keyframes cloudFloatLeft {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(-4px); }
              }
              @keyframes cloudFloatRight {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(4px); }
              }
              .animate-plane-float {
                animation: planeFloat 4s ease-in-out infinite;
              }
              .animate-dash-flow {
                animation: dashFlow 1.2s linear infinite;
              }
              .animate-sway-left {
                animation: swayLeft 6s ease-in-out infinite;
              }
              .animate-sway-right {
                animation: swayRight 6s ease-in-out infinite;
              }
              .animate-cloud-left {
                animation: cloudFloatLeft 8s ease-in-out infinite;
              }
              .animate-cloud-right {
                animation: cloudFloatRight 10s ease-in-out infinite;
              }
            `}</style>

            {/* Animated Illustration Container */}
            <div className="relative w-full max-w-sm h-48 flex items-center justify-center mb-4">
              <svg className="w-80 h-48" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Clouds */}
                <g className="animate-cloud-left">
                  <path d="M50 45C50 39.5 54.5 35 60 35C65.5 35 70 39.5 70 45C70 42.5 73.5 40 77 43C80.5 46 79 52 75 52H55C51 52 50 48.5 50 45Z" fill="#e2e8f0" fillOpacity="0.45" className="dark:fill-slate-800 dark:fill-opacity-40" />
                </g>
                <g className="animate-cloud-right">
                  <path d="M230 65C230 59.5 234.5 55 240 55C245.5 55 250 59.5 250 65C250 62.5 253.5 60 257 63C260.5 66 259 72 255 72H235C231 72 230 68.5 230 65Z" fill="#e2e8f0" fillOpacity="0.45" className="dark:fill-slate-800 dark:fill-opacity-40" />
                </g>

                {/* Swaying Plants Left */}
                <g className="animate-sway-left origin-bottom" style={{ transformOrigin: '95px 150px' }}>
                  {/* Stem */}
                  <path d="M 95,150 Q 80,120 75,95" fill="none" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" className="dark:stroke-emerald-950/30" />
                  {/* Leaves */}
                  <path d="M 75,95 C 70,85 78,75 83,85 C 88,95 80,100 75,95 Z" fill="#d1fae5" className="dark:fill-emerald-900/30" />
                  <path d="M 78,110 C 65,105 68,93 76,100 C 84,107 82,112 78,110 Z" fill="#d1fae5" fillOpacity="0.8" className="dark:fill-emerald-900/20" />
                  <path d="M 85,115 C 95,110 95,98 87,105 C 79,112 81,117 85,115 Z" fill="#d1fae5" fillOpacity="0.8" className="dark:fill-emerald-900/20" />
                  <path d="M 83,130 C 70,128 72,115 80,120 C 88,125 86,132 83,130 Z" fill="#d1fae5" fillOpacity="0.6" className="dark:fill-emerald-900/10" />
                  <path d="M 90,135 C 100,133 98,120 90,125 C 82,130 85,137 90,135 Z" fill="#d1fae5" fillOpacity="0.6" className="dark:fill-emerald-900/10" />
                </g>

                {/* Swaying Plants Right */}
                <g className="animate-sway-right origin-bottom" style={{ transformOrigin: '225px 150px' }}>
                  {/* Stem */}
                  <path d="M 225,150 Q 240,120 245,95" fill="none" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" className="dark:stroke-emerald-950/30" />
                  {/* Leaves */}
                  <path d="M 245,95 C 250,85 242,75 237,85 C 232,95 240,100 245,95 Z" fill="#d1fae5" className="dark:fill-emerald-900/30" />
                  <path d="M 242,110 C 255,105 252,93 244,100 C 236,107 238,112 242,110 Z" fill="#d1fae5" fillOpacity="0.8" className="dark:fill-emerald-900/20" />
                  <path d="M 235,115 C 225,110 225,98 233,105 C 241,112 239,117 235,115 Z" fill="#d1fae5" fillOpacity="0.8" className="dark:fill-emerald-900/20" />
                  <path d="M 237,130 C 250,128 248,115 240,120 C 232,125 234,132 237,130 Z" fill="#d1fae5" fillOpacity="0.6" className="dark:fill-emerald-900/10" />
                  <path d="M 230,135 C 220,133 222,120 230,125 C 238,130 235,137 230,135 Z" fill="#d1fae5" fillOpacity="0.6" className="dark:fill-emerald-900/10" />
                </g>

                {/* Inside of Box (Back plate) */}
                <path d="M 125,130 L 195,130 L 203,150 L 117,150 Z" fill="#a7f3d0" className="dark:fill-emerald-950/40" />

                {/* Dashed Flight Path (Wind trail) */}
                <path d="M 160,125 C 135,105 160,85 180,95 C 200,105 210,65 220,53" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" strokeDashoffset="0" className="animate-dash-flow text-emerald-500" />

                {/* Box Front Cover with U-Cutout */}
                <path d="M 117,150 
                         L 142,150 
                         C 145,150 147,152 148,155 
                         L 151,163 
                         C 153,167 156,169 159,169 
                         C 162,169 165,167 167,163 
                         L 170,155 
                         C 171,152 173,150 176,150 
                         L 203,150 
                         L 196,176 
                         C 195,179 191,182 187,182 
                         L 133,182 
                         C 129,182 125,179 124,176 
                         Z" 
                      fill="#d1fae5" 
                      stroke="#34d399" 
                      strokeWidth="1.5" 
                      className="dark:fill-emerald-900/50 dark:stroke-emerald-500/20" />

                {/* 3D Animated Paper Plane Group */}
                <g className="animate-plane-float">
                  {/* Main Wing Left */}
                  <path d="M -12,4 L 16,-10 L 0,10 Z" fill="#10b981" className="dark:fill-emerald-400" />
                  {/* Under Fold */}
                  <path d="M -12,4 L 0,10 L -4,18 Z" fill="#047857" className="dark:fill-emerald-600" />
                  {/* Wing Right */}
                  <path d="M 16,-10 L 0,10 L 6,-3 Z" fill="#34d399" className="dark:fill-emerald-300" />
                </g>
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200">No tickets found</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mt-2 leading-relaxed font-medium">
              No tickets match your current filter criteria.<br />Try adjusting your filters or create a new ticket.
            </p>

            {/* Create ticket in the middle */}
            {['USER', 'ADMIN'].includes(user.role) && (
              <Link
                to="/input-ticket"
                className="mt-6 flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Ticket</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-200/50 dark:border-slate-800/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Ticket</th>
                  <th className="py-4 px-6">Company / Location</th>
                  <th className="py-4 px-6">Priority</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">SLA Target</th>
                  <th className="py-4 px-6">Assigned Agent</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-sm">
                {displayTickets.map(ticket => (
                  <tr 
                    key={ticket.id} 
                    className="hover:bg-gray-50/30 dark:hover:bg-slate-900/10 cursor-pointer transition-colors"
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-semibold text-gray-800 dark:text-slate-200 truncate">{ticket.title}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span>ID: {ticket.id.startsWith('MRA-') ? ticket.id : ticket.id.substring(0,8)}</span>
                        <span>•</span>
                        <span>{ticket.requester.name} ({ticket.category}{ticket.subCategory && ticket.subCategory !== '-' ? ` - ${ticket.subCategory}` : ''} • {ticket.source || 'Walk-in'})</span>
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
                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {user.role === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="p-1.5 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 rounded-lg text-gray-405 hover:scale-105 transition-all"
                            title="Delete Ticket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <ChevronRight 
                          className="w-5 h-5 text-gray-400 cursor-pointer hover:text-brand-500 transition-colors" 
                          onClick={() => setSelectedTicketId(ticket.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            className="px-6 py-2.5 bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 border border-gray-200 dark:border-slate-800 text-xs font-bold text-gray-700 dark:text-slate-200 rounded-xl transition-all shadow-sm hover:shadow"
          >
            Load More (Muat Lebih Banyak)
          </button>
        </div>
      )}

      {/* Ticket Details Modular Modal (Kotak Tengah) */}
      {selectedTicketId && (
        <TicketDetailsModal
          user={user}
          token={token}
          ticketDetails={ticketDetails}
          detailsLoading={detailsLoading}
          agents={agents}
          currentTime={currentTime}
          onClose={() => setSelectedTicketId(null)}
          handleStatusChange={handleStatusChange}
          handleAssignAgent={handleAssignAgent}
          handleSlaOverride={handleSlaOverride}
          handleUpdateRespondedAt={handleUpdateRespondedAt}
        />
      )}

    </div>
  );
}
