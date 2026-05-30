import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Activity, 
  CheckCircle2, 
  ShieldAlert, 
  Building2, 
  AlertTriangle,
  Clock,
  ArrowRight,
  Award,
  ThumbsUp,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactLoader from '../components/ReactLoader';
import Select from 'react-select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Dashboard({ user, token, darkMode }) {
  const [analytics, setAnalytics] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [recentUrgentTickets, setRecentUrgentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Agent Performance Reminder Pop-up states
  const [agentPerformance, setAgentPerformance] = useState(null);
  const [myActiveTicketsCount, setMyActiveTicketsCount] = useState(0);
  const [myOverdueTicketsCount, setMyOverdueTicketsCount] = useState(0);
  const [showPerformanceReminder, setShowPerformanceReminder] = useState(false);

  // Timeframe Leaderboard states
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [timeframedLeaderboard, setTimeframedLeaderboard] = useState([]);
  const [perfLoading, setPerfLoading] = useState(false);

  const MONTHS = [
    { value: 'ALL', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const YEARS = ['2026', '2025', '2024'];
  const yearOptions = YEARS.map(y => ({ value: y, label: y }));

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: darkMode ? '#0f172a' : '#f9fafb',
      borderColor: state.isFocused 
        ? '#06b6d4'
        : darkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(229, 231, 235, 0.5)',
      borderRadius: '0.75rem',
      padding: '0.05rem 0.25rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      boxShadow: state.isFocused ? '0 0 0 1px #06b6d4' : 'none',
      '&:hover': {
        borderColor: '#06b6d4',
      },
      minHeight: '34px',
      cursor: 'pointer',
      minWidth: '135px',
      borderWidth: '1px',
      transition: 'all 0.2s ease',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: darkMode ? '#0f172a' : '#ffffff',
      borderRadius: '0.75rem',
      border: darkMode ? '1px solid rgba(51, 65, 85, 0.6)' : '1px solid rgba(229, 231, 235, 0.6)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      zIndex: 50,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#06b6d4'
        : state.isFocused
        ? darkMode ? '#1e293b' : '#f3f4f6'
        : 'transparent',
      color: state.isSelected
        ? '#ffffff'
        : darkMode ? '#cbd5e1' : '#374151',
      fontSize: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      padding: '8px 12px',
      transition: 'all 0.15s ease',
      '&:active': {
        backgroundColor: '#06b6d4',
        color: '#ffffff',
      }
    }),
    singleValue: (provided) => ({
      ...provided,
      color: darkMode ? '#e2e8f0' : '#374151',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: darkMode ? '#64748b' : '#9ca3af',
    }),
    input: (provided) => ({
      ...provided,
      color: darkMode ? '#e2e8f0' : '#374151',
      margin: '0px',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0px 6px',
    }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: state.isFocused ? '#06b6d4' : darkMode ? '#475569' : '#9ca3af',
      padding: '4px',
      '&:hover': {
        color: '#06b6d4',
      }
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    })
  };

  const fetchPerformanceData = async () => {
    try {
      setPerfLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const now = new Date();
      const yearNum = parseInt(selectedYear);
      
      let startDate, endDate;
      if (selectedMonth === 'ALL') {
        startDate = new Date(yearNum, 0, 1).toISOString();
        endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999).toISOString();
      } else {
        const monthIdx = parseInt(selectedMonth) - 1;
        startDate = new Date(yearNum, monthIdx, 1).toISOString();
        endDate = new Date(yearNum, monthIdx + 1, 0, 23, 59, 59, 999).toISOString();
      }

      const res = await fetch(`${API_URL}/performance?startDate=${startDate}&endDate=${endDate}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTimeframedLeaderboard(data);
      }
    } catch (err) {
      console.error("Failed to load performance metrics:", err);
    } finally {
      setPerfLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchInitialData();
  }, [selectedCompanyId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch Analytics Reports
      const reportRes = await fetch(`${API_URL}/reports?companyId=${selectedCompanyId}`, { headers });
      if (!reportRes.ok) throw new Error('Failed to load analytical reports.');
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

      // 3. Fetch Recent Urgent Tickets (CRITICAL/HIGH priority, OPEN/IN_PROGRESS)
      const ticketRes = await fetch(`${API_URL}/tickets`, { headers });
      if (ticketRes.ok) {
        const ticketData = await ticketRes.json();
        // filter for active ones
        const activeUrgent = ticketData
          .filter(t => ['CRITICAL', 'HIGH'].includes(t.priority) && ['OPEN', 'IN_PROGRESS'].includes(t.status))
          .slice(0, 4);
        setRecentUrgentTickets(activeUrgent);
      }

      // 4. Fetch Agent specific metrics & active tickets for pop-up reminder
      if (user.role !== 'USER') {
        try {
          const perfRes = await fetch(`${API_URL}/performance`, { headers });
          if (perfRes.ok) {
            const perfData = await perfRes.json();
            const myPerf = perfData.find(ag => ag.id === user.id);
            if (myPerf) {
              setAgentPerformance(myPerf);
            }
          }
        } catch (e) {
          console.error("Failed to fetch performance leaderboard:", e);
        }

        try {
          const myTicketsRes = await fetch(`${API_URL}/tickets`, { headers });
          if (myTicketsRes.ok) {
            const tickets = await myTicketsRes.json();
            const myActive = tickets.filter(t => t.assignedToId === user.id && ['OPEN', 'IN_PROGRESS', 'PENDING'].includes(t.status));
            setMyActiveTicketsCount(myActive.length);
            
            const nowMs = new Date().getTime();
            const myOverdue = myActive.filter(t => nowMs > new Date(t.slaResolutionLimit).getTime());
            setMyOverdueTicketsCount(myOverdue.length);
          }
        } catch (e) {
          console.error("Failed to fetch agent tickets for reminder:", e);
        }

        const reminderShown = sessionStorage.getItem('perf_reminder_shown');
        if (!reminderShown) {
          setShowPerformanceReminder(true);
          sessionStorage.setItem('perf_reminder_shown', 'true');
        }
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
      <ReactLoader size="lg" text="Loading Dashboard Operational Data..." />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header and Filter Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight">
            Main Dashboard
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">
            IT support operational status and SLA compliance for MRA Group.
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
              <option value="">All Companies</option>
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
          {/* IT Agents Performance Overview (KPI Summary) */}
          <div className="bg-gradient-to-br from-white/90 to-slate-50/50 dark:from-slate-900/70 dark:to-slate-950/20 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.015)] mb-8 animate-scale-up relative z-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 flex items-center gap-2">
                  <Award className="w-5 h-5 text-brand-500" />
                  <span>IT Agents Performance Overview (KPI)</span>
                </h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Summary of support agent performance metrics and top performer.
                </p>
              </div>

              {/* Month and Year Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                {/* Month Filter */}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <Select
                    value={MONTHS.find(m => m.value === selectedMonth)}
                    onChange={(opt) => setSelectedMonth(opt ? opt.value : 'ALL')}
                    options={MONTHS}
                    styles={customSelectStyles}
                    isSearchable={false}
                    menuPortalTarget={document.body}
                  />
                </div>

                {/* Year Filter */}
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                  <Select
                    value={yearOptions.find(y => y.value === selectedYear)}
                    onChange={(opt) => setSelectedYear(opt ? opt.value : '2026')}
                    options={yearOptions}
                    styles={customSelectStyles}
                    isSearchable={false}
                    menuPortalTarget={document.body}
                  />
                </div>
              </div>
            </div>

            {perfLoading ? (
              <ReactLoader size="sm" text="Syncing KPI metrics..." />
            ) : timeframedLeaderboard.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-500 dark:text-slate-500">
                No performance data recorded for this period.
              </div>
            ) : (() => {
              const totalResolved = timeframedLeaderboard.reduce((acc, agent) => acc + agent.metrics.resolvedTickets, 0);
              const totalSlaMet = timeframedLeaderboard.reduce((acc, agent) => acc + agent.metrics.slaMet, 0);
              const teamComplianceRate = totalResolved > 0 ? Math.round((totalSlaMet / totalResolved) * 100) : 100;

              const agentsWithResponse = timeframedLeaderboard.filter(agent => agent.metrics.avgResponseMin > 0);
              const totalResponseMin = agentsWithResponse.reduce((acc, agent) => acc + agent.metrics.avgResponseMin, 0);
              const avgTeamResponse = agentsWithResponse.length > 0 ? Math.round(totalResponseMin / agentsWithResponse.length) : 0;

              const agentsWithResolution = timeframedLeaderboard.filter(agent => agent.metrics.avgResolutionHour > 0);
              const totalResolutionHour = agentsWithResolution.reduce((acc, agent) => acc + agent.metrics.avgResolutionHour, 0);
              const avgTeamResolution = agentsWithResolution.length > 0 ? parseFloat((totalResolutionHour / agentsWithResolution.length).toFixed(1)) : 0;

              const topAgent = timeframedLeaderboard.length > 0 && timeframedLeaderboard[0].metrics.resolvedTickets > 0 ? timeframedLeaderboard[0] : null;

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* KPI 1: Overall Compliance */}
                  <div className="group stagger-1 p-5 bg-white dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex flex-col justify-between shadow-sm hover:scale-[1.01] transition-all duration-300 hover:shadow-[0_8px_20px_rgba(70,98,193,0.04)] dark:hover:shadow-none">
                    <div>
                      <p className="text-[10px] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider">Team SLA Compliance</p>
                      <h4 className={`text-2xl font-black mt-2 transition-transform duration-300 group-hover:translate-x-1 ${getSlaColor(teamComplianceRate)}`}>
                        {teamComplianceRate}%
                      </h4>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full shimmer-bar ${
                            teamComplianceRate >= 90 ? 'bg-emerald-500' :
                            teamComplianceRate >= 75 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${teamComplianceRate}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium shrink-0">resolved</span>
                    </div>
                  </div>

                  {/* KPI 2: Response Speed */}
                  <div className="group stagger-2 p-5 bg-white dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex flex-col justify-between shadow-sm hover:scale-[1.01] transition-all duration-300 hover:shadow-[0_8px_20px_rgba(59,130,246,0.04)] dark:hover:shadow-none">
                    <div>
                      <p className="text-[10px] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider">Avg Team Response</p>
                      <h4 className="text-2xl font-black text-gray-800 dark:text-slate-100 mt-2 transition-transform duration-300 group-hover:translate-x-1">
                        {avgTeamResponse > 0 ? `${avgTeamResponse} min` : '0 min'}
                      </h4>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-4 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 text-brand-500" />
                      <span>Speed to first response</span>
                    </p>
                  </div>

                  {/* KPI 3: Resolution Speed */}
                  <div className="group stagger-3 p-5 bg-white dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex flex-col justify-between shadow-sm hover:scale-[1.01] transition-all duration-300 hover:shadow-[0_8px_20px_rgba(99,102,241,0.04)] dark:hover:shadow-none">
                    <div>
                      <p className="text-[10px] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider">Avg Team Resolution</p>
                      <h4 className="text-2xl font-black text-gray-800 dark:text-slate-100 mt-2 transition-transform duration-300 group-hover:translate-x-1">
                        {avgTeamResolution > 0 ? `${avgTeamResolution} hrs` : '0 hrs'}
                      </h4>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-4 font-medium flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110 text-indigo-500 animate-pulse" />
                      <span>Active resolution time</span>
                    </p>
                  </div>

                  {/* KPI 4: Spotlight Performer */}
                  <div className="group stagger-4 p-5 bg-gradient-to-br from-brand-50/50 to-brand-100/20 dark:from-brand-950/20 dark:to-brand-900/10 border border-brand-200/35 dark:border-brand-900/30 rounded-2xl flex flex-col justify-between shadow-sm hover:scale-[1.01] transition-all duration-300 hover:shadow-[0_8px_25px_rgba(70,98,193,0.06)]">
                    <div>
                      <p className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="inline-block animate-float text-sm">🏆</span>
                        <span>Spotlight Agent</span>
                      </p>
                      {topAgent ? (
                        <div className="flex items-center gap-2.5 mt-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-brand-500/20 shrink-0">
                            {topAgent.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-gray-850 dark:text-slate-100 truncate">
                              {topAgent.name}
                            </h4>
                            <p className="text-[9px] text-gray-400 dark:text-slate-400 truncate mt-0.5">
                              {topAgent.companyName}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <h4 className="text-xs italic text-gray-500 mt-3">No active performer</h4>
                      )}
                    </div>
                    {topAgent && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold mt-4 flex items-center gap-1">
                        <span className="animate-ping w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        <span>{topAgent.metrics.complianceRate}% SLA ({topAgent.metrics.resolvedTickets} tix)</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Overview Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Total Tickets */}
            <div className="group stagger-1 bg-gradient-to-br from-white to-brand-50/20 dark:from-slate-900/60 dark:to-brand-950/15 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-1 hover-glow-brand hover:shadow-md transition-all duration-300 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Tickets</p>
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 mt-2">{analytics.totalTickets}</h3>
              </div>
              <div className="w-12 h-12 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-xl flex items-center justify-center shadow-inner transition-all duration-300 group-hover:bg-brand-500 group-hover:text-white group-hover:scale-105">
                <Ticket className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
              </div>
            </div>

            {/* Card 2: Active Tickets */}
            <div className="group stagger-2 bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-900/60 dark:to-blue-950/15 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-1 hover-glow-blue hover:shadow-md transition-all duration-300 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Tickets</p>
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 mt-2">
                  {analytics.status.OPEN + analytics.status.IN_PROGRESS + analytics.status.PENDING}
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shadow-inner transition-all duration-300 group-hover:bg-blue-500 group-hover:text-white group-hover:scale-105">
                <Activity className="w-6 h-6 animate-pulse transition-transform duration-300 group-hover:scale-110" />
              </div>
            </div>

            {/* Card 3: Resolved Tickets */}
            <div className="group stagger-3 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900/60 dark:to-emerald-950/15 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-1 hover-glow-emerald hover:shadow-md transition-all duration-300 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resolved Tickets</p>
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 mt-2">
                  {analytics.status.RESOLVED + analytics.status.CLOSED}
                </h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 rounded-xl flex items-center justify-center shadow-inner transition-all duration-300 group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-105">
                <CheckCircle2 className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
              </div>
            </div>

            {/* Card 4: SLA Compliance Rate (with dynamic SVG Circular Progress Ring) */}
            <div className="group stagger-4 bg-gradient-to-br from-white to-cyan-50/20 dark:from-slate-900/60 dark:to-cyan-950/15 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-1 hover-glow-cyan hover:shadow-md transition-all duration-300 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">SLA Compliance</p>
                <h3 className={`text-3xl font-extrabold mt-2 ${getSlaColor(analytics.sla.complianceRate)}`}>
                  {analytics.sla.complianceRate}%
                </h3>
              </div>
              
              {/* Circular Radial Gauge */}
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    className="stroke-slate-100 dark:stroke-slate-800/60"
                    strokeWidth="4.5"
                    fill="transparent"
                  />
                  {/* Foreground Compliance Ring */}
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    stroke="currentColor"
                    strokeWidth="4.5"
                    fill="transparent"
                    className={getSlaColor(analytics.sla.complianceRate)}
                    strokeDasharray={2 * Math.PI * 22}
                    strokeDashoffset={2 * Math.PI * 22 - (analytics.sla.complianceRate / 100) * (2 * Math.PI * 22)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                  />
                </svg>
                {/* Embedded Shield Icon */}
                <div className="absolute flex items-center justify-center">
                  <ShieldAlert className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${getSlaColor(analytics.sla.complianceRate)}`} />
                </div>
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
                <div className="stagger-2 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all duration-300">
                  <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-5">Status Distribution</h4>
                  <div className="space-y-4">
                    {Object.entries(analytics.status).map(([statusKey, count]) => {
                      const total = analytics.totalTickets || 1;
                      const percentage = Math.round((count / total) * 100);
                      
                      // Status gradient colors
                      const colors = {
                        OPEN: 'bg-gradient-to-r from-blue-400 to-blue-600',
                        IN_PROGRESS: 'bg-gradient-to-r from-amber-400 to-amber-600',
                        PENDING: 'bg-gradient-to-r from-slate-400 to-slate-500',
                        RESOLVED: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
                        CLOSED: 'bg-gradient-to-r from-gray-400 to-gray-500'
                      };

                      return (
                        <div key={statusKey} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-slate-400">
                            <span>{statusKey}</span>
                            <span>{count} tickets ({percentage}%)</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${colors[statusKey] || 'bg-brand-500'} shimmer-bar transition-all duration-700 ease-out`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tickets by Category */}
                <div className="stagger-3 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 border-l-4 border-l-brand-500 shadow-sm hover:shadow-md transition-all duration-300">
                  <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-5">Issue Category</h4>
                  <div className="space-y-4">
                    {Object.entries(analytics.categories).map(([catKey, count]) => {
                      const total = analytics.totalTickets || 1;
                      const percentage = Math.round((count / total) * 100);

                      return (
                        <div key={catKey} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-slate-400">
                            <span>{catKey}</span>
                            <span>{count} tickets ({percentage}%)</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-brand-400 to-brand-600 shimmer-bar transition-all duration-700 ease-out"
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
              <div className="stagger-3 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm hover:shadow-md transition-all duration-300">
                <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-5">Tickets by Priority</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(analytics.priorities).map(([priorityKey, count]) => {
                    const colors = {
                      CRITICAL: 'text-red-700 bg-red-50/50 border-red-150 border-l-4 border-l-red-500 hover:bg-red-100/40 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/30 animate-pulse-glow',
                      HIGH: 'text-orange-700 bg-orange-50/40 border-orange-150 border-l-4 border-l-orange-500 hover:bg-orange-100/40 dark:bg-orange-950/20 dark:border-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-950/30',
                      MEDIUM: 'text-amber-700 bg-amber-50/40 border-amber-150 border-l-4 border-l-amber-500 hover:bg-amber-100/40 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-950/30',
                      LOW: 'text-emerald-700 bg-emerald-50/40 border-emerald-150 border-l-4 border-l-emerald-500 hover:bg-emerald-100/40 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-950/30'
                    };

                    return (
                      <div 
                        key={priorityKey} 
                        className={`p-3 rounded-xl border text-center transition-all duration-200 hover:scale-[1.03] cursor-pointer ${colors[priorityKey] || 'bg-gray-50'}`}
                      >
                        <p className="text-[9px] font-black uppercase tracking-wider">{priorityKey}</p>
                        <h4 className="text-xl font-black mt-1.5">{count}</h4>
                        <p className="text-[8px] mt-0.5 opacity-70">Registered</p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Column 3: Urgent Actions List */}
            <div className="space-y-6">
              
              <div className="stagger-4 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 border-l-4 border-l-red-500 flex flex-col h-full justify-between hover:shadow-md transition-all duration-300">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-red-500 animate-pulse" />
                    <h4 className="font-bold text-base text-gray-800 dark:text-slate-200">Requires Urgent Attention</h4>
                  </div>
                  
                  {recentUrgentTickets.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center">
                      <ShieldAlert className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2 opacity-60" />
                      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">No active high-priority tickets.</p>
                      <p className="text-[10px] text-gray-405 dark:text-slate-500 mt-0.5">All SLAs are currently compliant. 👍</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentUrgentTickets.map(ticket => {
                        const isOverdue = new Date().getTime() > new Date(ticket.slaResolutionLimit).getTime();

                        return (
                          <div 
                            key={ticket.id}
                            className="p-3 bg-red-50/30 dark:bg-red-950/10 border border-red-500/20 rounded-xl flex flex-col gap-1.5 animate-pulse-glow"
                          >
                            <div className="flex justify-between items-start gap-2 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="relative flex h-2 w-2 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <span className="font-semibold text-xs text-gray-800 dark:text-slate-200 truncate">
                                  {ticket.title}
                                </span>
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
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
                  className="mt-6 flex items-center justify-center gap-2 py-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs font-semibold rounded-xl text-gray-700 dark:text-slate-200 border border-slate-200/40 dark:border-slate-800/40 transition-all"
                >
                  <span>View All Tickets</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </div>
        </>
      )}

      {/* SLA Performance Reminder Modal */}
      {showPerformanceReminder && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="absolute inset-0" onClick={() => setShowPerformanceReminder(false)}></div>
          
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 p-6 border border-gray-200 dark:border-slate-800 animate-slide-up">
            
            {/* Header */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">IT Agent Performance Alert</h3>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Welcome back, {user.name}!</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPerformanceReminder(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-t border-gray-100 dark:border-slate-800 my-4"></div>

            {/* Performance Content */}
            <div className="space-y-4">
              
              {/* SLA Compliance Box */}
              <div className="p-4 bg-gray-50 dark:bg-slate-950/30 border border-gray-200/40 dark:border-slate-800/40 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your SLA Compliance</p>
                  <h4 className={`text-2xl font-black mt-1 ${
                    agentPerformance ? getSlaColor(agentPerformance.metrics.complianceRate) : 'text-gray-500'
                  }`}>
                    {agentPerformance ? `${agentPerformance.metrics.complianceRate}%` : 'No Data'}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                    {agentPerformance ? (
                      agentPerformance.metrics.complianceRate >= 90 ? '🌟 Excellent! Keep up the target.' :
                      agentPerformance.metrics.complianceRate >= 75 ? '⚠️ Warning! Close to target threshold.' :
                      '🚨 Critical! Under SLA performance threshold.'
                    ) : (
                      'You have no closed tickets to calculate SLA.'
                    )}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <ThumbsUp className={`w-8 h-8 opacity-90 ${
                    agentPerformance && agentPerformance.metrics.complianceRate >= 75 ? 'text-emerald-500' : 'text-red-500'
                  }`} />
                </div>
              </div>

              {/* Tickets Queue Status */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-200/20 rounded-2xl text-center">
                  <p className="text-gray-400 font-medium text-[10px] uppercase">My Active Tickets</p>
                  <h5 className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{myActiveTicketsCount}</h5>
                  <p className="text-[9px] text-gray-500 mt-0.5">Assigned to you</p>
                </div>
                
                <div className={`p-3.5 border rounded-2xl text-center ${
                  myOverdueTicketsCount > 0 
                    ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200/30' 
                    : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/30'
                }`}>
                  <p className="text-gray-400 font-medium text-[10px] uppercase">Overdue Tickets</p>
                  <h5 className={`text-xl font-bold mt-1 ${
                    myOverdueTicketsCount > 0 ? 'text-red-500' : 'text-emerald-500'
                  }`}>{myOverdueTicketsCount}</h5>
                  <p className="text-[9px] text-gray-500 mt-0.5">
                    {myOverdueTicketsCount > 0 ? 'Action required!' : 'All SLA met! 👍'}
                  </p>
                </div>
              </div>

            </div>

            <div className="border-t border-gray-100 dark:border-slate-800 my-4"></div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPerformanceReminder(false)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-350 text-xs font-semibold rounded-xl hover:bg-gray-55/10 dark:hover:bg-slate-800 transition-colors"
              >
                Keep Monitoring
              </button>
              <Link
                to="/tickets"
                onClick={() => setShowPerformanceReminder(false)}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-500/10 text-center flex items-center justify-center gap-1 transition-colors"
              >
                <span>View My Tickets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
