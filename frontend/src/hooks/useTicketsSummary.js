import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getDateRange = (filter) => {
  const now = new Date();
  if (filter === 'THIS_MONTH') {
    return { startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), endDate: null };
  }
  if (filter === 'LAST_MONTH') {
    return {
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
      endDate: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString(),
    };
  }
  if (filter === 'LAST_3_MONTHS') {
    return { startDate: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString(), endDate: null };
  }
  return { startDate: null, endDate: null };
};

export default function useTicketsSummary({ user, token }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('ALL_ACTIVE');
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);

  const [monthFilter, setMonthFilter] = useState('ALL');
  const [slaFilter, setSlaFilter] = useState(false);
  const [offHoursFilter, setOffHoursFilter] = useState(false);
  const [agentFilter, setAgentFilter] = useState('');
  const [limit, setLimit] = useState(100);
  const [hasMore, setHasMore] = useState(false);

  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTickets();
    if (user.role !== 'USER') fetchAgents();
  }, [statusFilter, priorityFilter, monthFilter, limit]);

  // Consume URL params from notification links
  useEffect(() => {
    const openId = searchParams.get('open');
    const slaParam = searchParams.get('sla');
    if (openId || slaParam) {
      if (openId) setSelectedTicketId(openId);
      if (slaParam === 'breached') setSlaFilter(true);
      setSearchParams({}, { replace: true });
    }
  }, []);

  useEffect(() => {
    setSelectedTicketIds([]);
  }, [statusFilter, tickets]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedTicketId) fetchTicketDetails(selectedTicketId);
    else setTicketDetails(null);
  }, [selectedTicketId]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      let query = `?search=${searchQuery}`;
      if (statusFilter !== 'ALL' && statusFilter !== 'ALL_ACTIVE' && statusFilter !== 'ALL_HISTORY') {
        query += `&status=${statusFilter}`;
      }
      if (priorityFilter) query += `&priority=${priorityFilter}`;
      if (monthFilter !== 'ALL') {
        const { startDate, endDate } = getDateRange(monthFilter);
        if (startDate) query += `&startDate=${startDate}`;
        if (endDate) query += `&endDate=${endDate}`;
      }
      query += `&limit=${limit}`;

      const res = await fetch(`${API_URL}/tickets${query}`, { headers });
      if (!res.ok) throw new Error('Failed to load tickets list.');
      const data = await res.json();
      setTickets(data);
      setHasMore(data.length === limit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.filter(u => u.role === 'AGENT' || u.role === 'ADMIN'));
      }
    } catch (_) {}
  };

  const fetchTicketDetails = async (id) => {
    try {
      setDetailsLoading(true);
      const res = await fetch(`${API_URL}/tickets/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat detail tiket.');
      setTicketDetails(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleBulkClose = async (idsToClose) => {
    const ids = idsToClose || selectedTicketIds;
    if (ids.length === 0) return;

    const result = await Swal.fire({
      title: 'Apakah Anda Yakin?',
      text: `Menutup ${ids.length} tiket secara bulk/instan? Tiket yang sudah ditutup tidak dapat diubah statusnya lagi.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Tutup Tiket!',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/tickets/bulk-close`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketIds: ids }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal memproses penutupan tiket bulk.');
      }

      const resData = await res.json();
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: resData.message || `${ids.length} tiket berhasil ditutup.`,
        confirmButtonColor: '#10b981',
        timer: 3000,
      });

      setSelectedTicketIds([]);
      fetchTickets();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, confirmButtonColor: '#10b981' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus, comment = '') => {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, comment }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to change status.'); }
      fetchTickets();
      if (selectedTicketId === ticketId) fetchTicketDetails(ticketId);
    } catch (err) { alert(err.message); }
  };

  const handleAssignAgent = async (ticketId, agentId) => {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ assignedToId: agentId }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to assign agent.'); }
      fetchTickets();
      if (selectedTicketId === ticketId) fetchTicketDetails(ticketId);
    } catch (err) { alert(err.message); }
  };

  const handleSlaOverride = async (ticketId, reason) => {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}/sla-override`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to override SLA.'); }
      fetchTickets();
      if (selectedTicketId === ticketId) fetchTicketDetails(ticketId);
    } catch (err) { alert(err.message); }
  };

  const handleUpdateRespondedAt = async (ticketId, respondedAt, reason) => {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}/responded-at`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ respondedAt, reason }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to update response time.'); }
      fetchTickets();
      if (selectedTicketId === ticketId) fetchTicketDetails(ticketId);
    } catch (err) { alert(err.message); }
  };

  const handleTicketMetaChange = async (ticketId, fields) => {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}/meta`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(fields),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to update ticket.'); }
      fetchTickets();
      if (selectedTicketId === ticketId) fetchTicketDetails(ticketId);
    } catch (err) { alert(err.message); }
  };

  const handleTicketPriorityChange = async (ticketId, newPriority) => {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}/priority`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to update priority.'); }
      fetchTickets();
      if (selectedTicketId === ticketId) fetchTicketDetails(ticketId);
    } catch (err) { alert(err.message); }
  };

  const handleDeleteTicket = async (ticketId) => {
    const isDark = document.documentElement.classList.contains('dark');
    const popupClass = {
      popup: 'rounded-3xl border border-gray-200/50 dark:border-slate-800/40 shadow-2xl p-6 font-sans',
      title: 'text-lg font-extrabold text-gray-800 dark:text-slate-100 mt-2',
      htmlContainer: 'text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-medium',
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:scale-105 transition-all text-white',
      cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:scale-105 transition-all text-white',
    };

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
      customClass: popupClass,
      buttonsStyling: true,
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: 'Deleting...',
        text: 'Please wait while we erase this record.',
        background: isDark ? '#0f172a' : '#ffffff',
        color: isDark ? '#f1f5f9' : '#1e293b',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to delete ticket.'); }

      await Swal.fire({
        title: 'Deleted!',
        text: `Ticket ${ticketId} has been successfully deleted.`,
        icon: 'success',
        confirmButtonColor: '#06b6d4',
        background: isDark ? '#0f172a' : '#ffffff',
        color: isDark ? '#f1f5f9' : '#1e293b',
        iconColor: '#10b981',
        customClass: { ...popupClass, htmlContainer: 'text-xs text-gray-500 dark:text-slate-400 font-medium' },
      });

      if (selectedTicketId === ticketId) setSelectedTicketId(null);
      fetchTickets();
    } catch (err) {
      Swal.fire({
        title: 'Error!', text: err.message, icon: 'error', confirmButtonColor: '#ef4444',
        background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b', iconColor: '#ef4444',
        customClass: { ...popupClass, htmlContainer: 'text-xs text-gray-500 dark:text-slate-400 font-medium' },
      });
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setStatusFilter(tab === 'ACTIVE' ? 'ALL_ACTIVE' : 'ALL_HISTORY');
    setLimit(100);
    setMonthFilter('ALL');
    setSlaFilter(false);
  };

  const handleMonthChange = (val) => { setMonthFilter(val); setLimit(100); };
  const handlePriorityChange = (val) => { setPriorityFilter(val); setLimit(100); };
  const handleSlaFilterToggle = () => setSlaFilter(v => !v);
  const handleOffHoursFilterToggle = () => setOffHoursFilter(v => !v);

  const isOutsideBusinessHours = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    if (day === 0 || day === 6) return true;
    const totalMin = d.getHours() * 60 + d.getMinutes();
    return totalMin < 9 * 60 || totalMin >= 17 * 60;
  };
  const handleSearch = () => { setLimit(100); fetchTickets(); };
  const handleLoadMore = () => setLimit(prev => prev + 100);

  const isTicketSlaBreached = (ticket) => {
    if (ticket.auditLogs?.some(log => log.action === 'SLA_OVERRIDDEN')) return false;
    if (['RESOLVED', 'CLOSED'].includes(ticket.status)) return !!ticket.isSlaBreached;
    const limitTime = new Date(ticket.slaResolutionLimit).getTime();
    let activeLimitTime = limitTime + (ticket.totalPausedMs || 0);
    if (ticket.status === 'PENDING' && ticket.lastPausedAt) {
      activeLimitTime += currentTime.getTime() - new Date(ticket.lastPausedAt).getTime();
    }
    return currentTime.getTime() > activeLimitTime;
  };

  const displayTickets = tickets.filter(t => {
    if (statusFilter === 'ALL_ACTIVE' && !['OPEN', 'IN_PROGRESS', 'PENDING'].includes(t.status)) return false;
    if (statusFilter === 'ALL_HISTORY' && !['RESOLVED', 'CLOSED'].includes(t.status)) return false;
    if (slaFilter && !isTicketSlaBreached(t)) return false;
    if (offHoursFilter && !isOutsideBusinessHours(t.createdAt)) return false;
    if (agentFilter && t.assignedToId !== agentFilter) return false;
    return true;
  });

  const resolvedTickets = displayTickets.filter(t => t.status === 'RESOLVED');
  const isAllSelected = resolvedTickets.length > 0 && resolvedTickets.every(t => selectedTicketIds.includes(t.id));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTicketIds(prev => {
        const newIds = [...prev];
        resolvedTickets.forEach(t => { if (!newIds.includes(t.id)) newIds.push(t.id); });
        return newIds;
      });
    } else {
      setSelectedTicketIds(prev => prev.filter(id => !resolvedTickets.some(t => t.id === id)));
    }
  };

  return {
    tickets, agents, loading, error,
    statusFilter, setStatusFilter,
    activeTab,
    priorityFilter,
    searchQuery, setSearchQuery,
    selectedTicketIds, setSelectedTicketIds,
    monthFilter,
    slaFilter,
    hasMore,
    agentFilter, setAgentFilter,
    selectedTicketId, setSelectedTicketId,
    ticketDetails, detailsLoading,
    currentTime,
    displayTickets,
    resolvedTickets,
    isAllSelected,
    handleSelectAll,
    handleBulkClose,
    handleStatusChange,
    handleAssignAgent,
    handleSlaOverride,
    handleUpdateRespondedAt,
    handleTicketPriorityChange,
    handleTicketMetaChange,
    handleDeleteTicket,
    handleLoadMore,
    switchTab,
    handleMonthChange,
    handlePriorityChange,
    handleSlaFilterToggle,
    offHoursFilter,
    handleOffHoursFilterToggle,
    handleSearch,
  };
}
