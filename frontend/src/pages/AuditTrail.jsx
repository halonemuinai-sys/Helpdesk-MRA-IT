import React, { useState, useEffect } from 'react';
import { 
  History, Loader2, AlertCircle, Search, Calendar, User, ArrowLeft, ArrowRight, Activity 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ACTION_OPTIONS = [
  { value: 'ALL', label: 'All Actions' },
  // Assets
  { value: 'ASSET_CREATED', label: 'Asset Registration' },
  { value: 'ASSET_UPDATED', label: 'Asset Updated' },
  { value: 'ASSET_DELETE_REQUESTED', label: 'Asset Delete Request' },
  { value: 'ASSET_DELETED', label: 'Asset Deleted' },
  // Subscriptions
  { value: 'SUBSCRIPTION_CREATED', label: 'Subscription Registered' },
  { value: 'SUBSCRIPTION_UPDATED', label: 'Subscription Updated' },
  { value: 'SUBSCRIPTION_DELETE_REQUESTED', label: 'Subscription Delete Request' },
  { value: 'SUBSCRIPTION_DELETED', label: 'Subscription Deleted' },
  // Wifi APs
  { value: 'WIFI_AP_CREATED', label: 'Wifi AP Created' },
  { value: 'WIFI_AP_UPDATED', label: 'Wifi AP Updated' },
  { value: 'WIFI_AP_DELETE_REQUESTED', label: 'Wifi AP Delete Request' },
  { value: 'WIFI_AP_DELETED', label: 'Wifi AP Deleted' },
  // Categories
  { value: 'CATEGORY_DELETED', label: 'Category Deleted' },
  { value: 'CATEGORY_DELETE_REQUESTED', label: 'Category Delete Request' }
];

export default function AuditTrail({ user, token }) {
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_LIMIT = 15;

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, searchQuery, currentPage]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * PAGE_LIMIT;
      let url = `${API_URL}/audit-logs?limit=${PAGE_LIMIT}&skip=${skip}`;
      
      if (actionFilter !== 'ALL') {
        url += `&action=${actionFilter}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch system audit logs.');
      const data = await res.json();
      
      setLogs(data.logs);
      setTotalLogs(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActionFilterChange = (e) => {
    setActionFilter(e.target.value);
    setCurrentPage(1); // Reset page on filter change
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset page on search
  };

  const totalPages = Math.ceil(totalLogs / PAGE_LIMIT) || 1;

  const getActionBadgeStyle = (action) => {
    if (action.includes('CREATED') || action.includes('CREATE')) {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
    }
    if (action.includes('DELETE_REQUESTED') || action.includes('REQUESTED')) {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
    }
    if (action.includes('DELETED')) {
      return 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30';
    }
    return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <History className="w-7 h-7 text-brand-500 animate-pulse" />
          System Audit Trail Explorer
        </h1>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
          Monitor all historical administrative actions, updates, creations, and deletion approvals registered by IT Agents and Administrators.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-3 animate-slide-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main logs explorer block */}
      <div className="glass-card p-6 rounded-3xl border border-gray-200/50 dark:border-slate-800/30 space-y-5">
        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Action types select */}
          <div className="relative w-full sm:w-60">
            <select
              value={actionFilter}
              onChange={handleActionFilterChange}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-xl text-gray-850 dark:text-slate-250 focus:outline-none text-xs cursor-pointer font-semibold"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search text input */}
          <div className="relative w-full flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search description, device tags, or performing user..."
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 focus:border-brand-500 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none text-xs"
            />
          </div>
        </div>

        {/* Logs Timeline Data */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <span className="text-xs font-semibold">Loading system audit trail...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-gray-450 dark:text-slate-500 text-xs font-medium space-y-2">
            <Activity className="w-8 h-8 mx-auto text-gray-300 dark:text-slate-700" />
            <p>No audit trail logs match your query parameters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timeline Wrapper */}
            <div className="relative border-l border-gray-200 dark:border-slate-800 ml-4.5 pl-6 space-y-5">
              {logs.map((log) => (
                <div key={log.id} className="relative group animate-fade-in">
                  {/* Glowing Node Dot */}
                  <span className="absolute -left-[30px] top-1.5 flex items-center justify-center w-3 h-3 rounded-full bg-white dark:bg-slate-950 border border-brand-500 ring-2 ring-brand-100 dark:ring-brand-950/40 z-10 transition-transform group-hover:scale-125 duration-150" />
                  
                  {/* Log details */}
                  <div className="bg-white/50 dark:bg-slate-900/35 border border-gray-150 dark:border-slate-800/40 p-4 rounded-2xl hover:border-brand-500/20 dark:hover:border-brand-500/10 hover:bg-brand-50/5 dark:hover:bg-brand-950/5 transition-all duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg tracking-wider w-fit ${getActionBadgeStyle(log.action)}`}>
                        {log.action}
                      </span>
                      
                      <div className="flex items-center gap-1 text-[10px] text-gray-450 dark:text-slate-500 font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(log.createdAt).toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-800 dark:text-slate-200 font-semibold mt-2.5 leading-relaxed">
                      {log.details}
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-slate-400 font-bold mt-2 bg-gray-50 dark:bg-slate-900/40 px-2 py-1 rounded w-fit">
                      <User className="w-3.5 h-3.5" />
                      <span>{log.performedBy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-150 dark:border-slate-800/80 pt-4 text-xs font-semibold text-gray-600 dark:text-slate-400">
                <span>
                  Showing page {currentPage} of {totalPages} ({totalLogs} logs total)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-2 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-40"
                    title="Previous Page"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-2 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-40"
                    title="Next Page"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
