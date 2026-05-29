import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Activity, 
  CheckCircle2, 
  ShieldAlert, 
  Building2, 
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Dashboard({ user, token }) {
  const [analytics, setAnalytics] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [recentUrgentTickets, setRecentUrgentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [selectedCompanyId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch Analytics Reports
      const reportRes = await fetch(`${API_URL}/reports?companyId=${selectedCompanyId}`, { headers });
      if (!reportRes.ok) throw new Error('Gagal memuat laporan analitik.');
      const reportData = await reportRes.json();
      setAnalytics(reportData);

      // 2. Fetch Companies List (only once or for agents/admins)
      if (companies.length === 0 && user.role !== 'USER') {
        const compRes = await fetch(`${API_URL}/companies`, { headers });
        if (compRes.ok) {
          const compData = await compRes.ok ? await compRes.json() : [];
          // Get unique company names for filtering
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

      // 3. Fetch Recent Urgent Tickets (HIGH priority, OPEN/IN_PROGRESS)
      const ticketRes = await fetch(`${API_URL}/tickets?priority=HIGH`, { headers });
      if (ticketRes.ok) {
        const ticketData = await ticketRes.json();
        // filter for active ones
        const activeUrgent = ticketData
          .filter(t => ['OPEN', 'IN_PROGRESS'].includes(t.status))
          .slice(0, 4);
        setRecentUrgentTickets(activeUrgent);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSlaColor = (rate) => {
    if (rate >= 90) return 'text-emerald-500';
    if (rate >= 75) return 'text-amber-500';
    return 'text-red-500';
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header and Filter Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight">
            Dashboard Utama
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">
            Status operasional bantuan IT dan kepatuhan SLA MRA Group.
          </p>
        </div>

        {/* Company Filter (Agents & Admins Only) */}
        {user.role !== 'USER' && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-sm">
            <Building2 className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-700 dark:text-slate-200 focus:outline-none pr-4 cursor-pointer"
            >
              <option value="">Semua Perusahaan</option>
              {companies.map(comp => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {analytics && (
        <>
          {/* Overview Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Total Tickets */}
            <div className="glass-card p-6 rounded-2xl border border-gray-200/50 dark:border-slate-800/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Tiket</p>
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 mt-2">{analytics.totalTickets}</h3>
              </div>
              <div className="w-12 h-12 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 rounded-xl flex items-center justify-center">
                <Ticket className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Active Tickets */}
            <div className="glass-card p-6 rounded-2xl border border-gray-200/50 dark:border-slate-800/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tiket Aktif</p>
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 mt-2">
                  {analytics.status.OPEN + analytics.status.IN_PROGRESS + analytics.status.PENDING}
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Resolved Tickets */}
            <div className="glass-card p-6 rounded-2xl border border-gray-200/50 dark:border-slate-800/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tiket Selesai</p>
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 mt-2">
                  {analytics.status.RESOLVED + analytics.status.CLOSED}
                </h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: SLA Compliance Rate */}
            <div className="glass-card p-6 rounded-2xl border border-gray-200/50 dark:border-slate-800/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kepatuhan SLA</p>
                <h3 className={`text-3xl font-extrabold mt-2 ${getSlaColor(analytics.sla.complianceRate)}`}>
                  {analytics.sla.complianceRate}%
                </h3>
              </div>
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 rounded-xl flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Main Visual Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Column 1 & 2: Distributions */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Category & Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Tickets by Status */}
                <div className="glass-card p-6 rounded-2xl border border-gray-200/50 dark:border-slate-800/30">
                  <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-5">Distribusi Status</h4>
                  <div className="space-y-4">
                    {Object.entries(analytics.status).map(([statusKey, count]) => {
                      const total = analytics.totalTickets || 1;
                      const percentage = Math.round((count / total) * 100);
                      
                      // Status colors
                      const colors = {
                        OPEN: 'bg-blue-500',
                        IN_PROGRESS: 'bg-amber-500',
                        PENDING: 'bg-slate-400',
                        RESOLVED: 'bg-emerald-500',
                        CLOSED: 'bg-gray-500'
                      };

                      return (
                        <div key={statusKey} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-slate-400">
                            <span>{statusKey}</span>
                            <span>{count} tiket ({percentage}%)</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${colors[statusKey] || 'bg-brand-500'} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tickets by Category */}
                <div className="glass-card p-6 rounded-2xl border border-gray-200/50 dark:border-slate-800/30">
                  <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-5">Kategori Gangguan</h4>
                  <div className="space-y-4">
                    {Object.entries(analytics.categories).map(([catKey, count]) => {
                      const total = analytics.totalTickets || 1;
                      const percentage = Math.round((count / total) * 100);

                      return (
                        <div key={catKey} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-slate-400">
                            <span>{catKey}</span>
                            <span>{count} tiket ({percentage}%)</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-500 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Tickets by Priority & SLA Breakdown */}
              <div className="glass-card p-6 rounded-2xl border border-gray-200/50 dark:border-slate-800/30">
                <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-5">Tiket Berdasarkan Prioritas</h4>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(analytics.priorities).map(([priorityKey, count]) => {
                    const colors = {
                      HIGH: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400',
                      MEDIUM: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400',
                      LOW: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400'
                    };

                    return (
                      <div 
                        key={priorityKey} 
                        className={`p-4 rounded-xl border text-center ${colors[priorityKey] || 'bg-gray-50'}`}
                      >
                        <p className="text-xs font-bold uppercase tracking-wider">{priorityKey}</p>
                        <h4 className="text-2xl font-extrabold mt-2">{count}</h4>
                        <p className="text-[10px] mt-1 opacity-70">Tiket Terdaftar</p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Column 3: Urgent Actions List */}
            <div className="space-y-6">
              
              <div className="glass-card p-6 rounded-2xl border border-gray-200/50 dark:border-slate-800/30 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-red-500" />
                    <h4 className="font-bold text-base text-gray-800 dark:text-slate-200">Perlu Penanganan Segera</h4>
                  </div>
                  
                  {recentUrgentTickets.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500 dark:text-slate-500">
                      Tidak ada tiket prioritas tinggi yang aktif saat ini. 👍
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentUrgentTickets.map(ticket => {
                        const isOverdue = new Date().getTime() > new Date(ticket.slaResolutionLimit).getTime();

                        return (
                          <div 
                            key={ticket.id}
                            className="p-3 bg-red-50/30 dark:bg-red-950/10 border border-red-500/20 rounded-xl flex flex-col gap-1.5"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-semibold text-xs text-gray-800 dark:text-slate-200 truncate flex-1">
                                {ticket.title}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {ticket.status}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-slate-400">
                              <span className="truncate max-w-[120px]">{ticket.company.name}</span>
                              <span className={`font-semibold ${isOverdue ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                                {isOverdue ? 'SLA Breached' : 'SLA Active'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Link
                  to="/tickets"
                  className="mt-6 flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-slate-800/80 hover:bg-gray-200 dark:hover:bg-slate-700/80 text-xs font-semibold rounded-xl text-gray-700 dark:text-slate-200 transition-all"
                >
                  <span>Lihat Semua Tiket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
}
