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
  Trash2
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
            className="flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/15 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Ticket</span>
          </Link>
        )}
      </div>

      {/* Main Tabs: Active vs History */}
      <div className="flex border-b border-gray-200 dark:border-slate-800/60">
        <button
          type="button"
          onClick={() => {
            setActiveTab('ACTIVE');
            setStatusFilter('ALL_ACTIVE');
            setLimit(100);
            setMonthFilter('ALL');
          }}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'ACTIVE'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
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
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'HISTORY'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          Ticket History
        </button>
      </div>

      {/* Filter Options Panel */}
      <div className="glass-card p-4 rounded-2xl border border-gray-200/50 dark:border-slate-800/30 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Tab Status Filters */}
        <div className="flex flex-wrap gap-1 w-full md:w-auto">
          {activeTab === 'ACTIVE' ? (
            <>
              {[
                { label: 'All Active', value: 'ALL_ACTIVE' },
                { label: 'Open', value: 'OPEN' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'Pending', value: 'PENDING' }
              ].map(status => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setStatusFilter(status.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === status.value
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100/50 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-slate-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </>
          ) : (
            <>
              {[
                { label: 'All History', value: 'ALL_HISTORY' },
                { label: 'Resolved', value: 'RESOLVED' },
                { label: 'Closed', value: 'CLOSED' }
              ].map(status => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setStatusFilter(status.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === status.value
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100/50 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-slate-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Search & Priority Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Month Filter (History Tab Only) */}
          {activeTab === 'HISTORY' && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <select
                value={monthFilter}
                onChange={(e) => {
                  setMonthFilter(e.target.value);
                  setLimit(100); // Reset limit to 100 on filter change
                }}
                className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Time</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="LAST_MONTH">Last Month</option>
                <option value="LAST_3_MONTHS">Last 3 Months</option>
              </select>
            </div>
          )}

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setLimit(100); // Reset limit to 105 on filter change
              }}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* Search box */}
          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              setLimit(100); 
              fetchTickets(); 
            }}
            className="flex-1 md:w-64 relative"
          >
            <input
              type="text"
              placeholder="Search tickets..."
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
          <ReactLoader size="md" text="Loading ticket registry..." />
        ) : displayTickets.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-slate-500">
            No tickets found matching the filter criteria.
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
        />
      )}

    </div>
  );
}
