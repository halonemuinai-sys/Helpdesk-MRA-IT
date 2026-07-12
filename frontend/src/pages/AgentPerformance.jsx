import React, { useState, useEffect } from 'react';
import {
  Award,
  AlertTriangle,
  Trophy,
  Clock,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Building2,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingDown,
  Mail,
  Loader2
} from 'lucide-react';
import ReactLoader from '../components/ReactLoader';
import Select from 'react-select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Animated Number Counter Component for count-up numeric feel
function AnimatedNumber({ value, suffix = '', duration = 800 }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(value);
    if (isNaN(end)) {
      setCurrent(0);
      return;
    }
    
    setCurrent(0);
    const startTime = performance.now();
    let animationFrameId;
    
    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // easeOutQuad
      const easedProgress = progress * (2 - progress);
      const val = easedProgress * (end - start) + start;
      
      if (Number.isInteger(end)) {
        setCurrent(Math.round(val));
      } else {
        setCurrent(parseFloat(val.toFixed(1)));
      }
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCurrent(end);
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <span>{current}{suffix}</span>;
}

// Circular SVG Progress Ring Component for SLA gauges in Top 3 Cards
const CircularProgress = ({ value, colorClass, size = 68 }) => {
  const radius = size * 0.4;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0 animate-scale-up" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-gray-100 dark:stroke-slate-800/60"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {/* Percentage Center Text */}
      <div className="absolute flex flex-col items-center justify-center leading-none">
        <span className="font-black text-xs text-gray-800 dark:text-slate-100 leading-none">
          <AnimatedNumber value={value} />
        </span>
        <span className="text-[7px] text-gray-400 font-extrabold uppercase tracking-wide leading-none mt-0.5">SLA</span>
      </div>
    </div>
  );
};

export default function AgentPerformance({ user, token, darkMode }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timeframe states (initialized to current month/year)
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  // Interactive controls state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('totalAssigned');
  const [expandedAgentId, setExpandedAgentId] = useState(null);
  const [sendingReport, setSendingReport] = useState(false);

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

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedMonth, selectedYear]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
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

      // Fetch performance statistics with query parameters
      const res = await fetch(`${API_URL}/performance?startDate=${startDate}&endDate=${endDate}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch agent performance data.');
      const data = await res.json();
      setLeaderboard(data);
      // Reset expanded row on time frame refresh
      setExpandedAgentId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReport = async () => {
    if (sendingReport || leaderboard.length === 0) return;
    const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || 'All Months';
    const periodLabel = selectedMonth === 'ALL' ? `All Months ${selectedYear}` : `${monthLabel} ${selectedYear}`;
    setSendingReport(true);
    try {
      const res = await fetch(`${API_URL}/performance/send-report`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderboard, periodLabel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send report.');
      alert(`✅ ${data.message}`);
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setSendingReport(false);
    }
  };

  const getSlaBadgeColor = (rate) => {
    if (rate >= 90) return 'text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-450';
    if (rate >= 75) return 'text-amber-650 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400';
    return 'text-red-650 bg-red-50 dark:bg-red-950/20 dark:text-red-400';
  };

  // Client-side mapping of global index for rank numbers
  const globalRankMap = new Map();
  leaderboard.forEach((agent, idx) => {
    globalRankMap.set(agent.id, idx + 1);
  });

  // Client-side sorting logic
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === 'totalAssigned') {
      if (b.metrics.totalAssigned !== a.metrics.totalAssigned) {
        return b.metrics.totalAssigned - a.metrics.totalAssigned;
      }
      return b.metrics.complianceRate - a.metrics.complianceRate;
    }
    if (sortBy === 'complianceRate') {
      if (b.metrics.complianceRate !== a.metrics.complianceRate) {
        return b.metrics.complianceRate - a.metrics.complianceRate;
      }
      return b.metrics.totalAssigned - a.metrics.totalAssigned;
    }
    if (sortBy === 'avgResponseMin') {
      const aHas = a.metrics.totalAssigned > 0;
      const bHas = b.metrics.totalAssigned > 0;
      if (aHas !== bHas) return aHas ? -1 : 1;
      
      if (a.metrics.avgResponseMin !== b.metrics.avgResponseMin) {
        return a.metrics.avgResponseMin - b.metrics.avgResponseMin;
      }
      return b.metrics.complianceRate - a.metrics.complianceRate;
    }
    if (sortBy === 'avgResolutionHour') {
      const aHas = a.metrics.totalAssigned > 0;
      const bHas = b.metrics.totalAssigned > 0;
      if (aHas !== bHas) return aHas ? -1 : 1;

      if (a.metrics.avgResolutionHour !== b.metrics.avgResolutionHour) {
        return a.metrics.avgResolutionHour - b.metrics.avgResolutionHour;
      }
      return b.metrics.complianceRate - a.metrics.complianceRate;
    }
    return 0;
  });

  // Client-side filtering logic
  const filteredLeaderboard = sortedLeaderboard.filter(agent => {
    const q = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(q) ||
      agent.jobPosition.toLowerCase().includes(q) ||
      agent.companyName.toLowerCase().includes(q)
    );
  });

  if (loading && leaderboard.length === 0) {
    return (
      <ReactLoader size="lg" text="Analyzing Agent Performance & KPIs..." />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12 relative">
      {/* Floating Aurora Neon Orbs for Premium UI depth */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-float-orb-1" />
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-float-orb-2" />

      {/* Scoped CSS animations and styles */}
      <style>{`
        @keyframes slideUpRow {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .leaderboard-row {
          opacity: 0;
          animation: slideUpRow 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .gold-glow {
          box-shadow: 0 10px 30px -10px rgba(245, 158, 11, 0.15);
        }
        .gold-glow:hover {
          box-shadow: 0 20px 40px -15px rgba(245, 158, 11, 0.3);
          border-color: rgba(245, 158, 11, 0.6) !important;
        }
        .silver-glow {
          box-shadow: 0 10px 30px -10px rgba(148, 163, 184, 0.12);
        }
        .silver-glow:hover {
          box-shadow: 0 20px 40px -15px rgba(148, 163, 184, 0.25);
          border-color: rgba(148, 163, 184, 0.5) !important;
        }
        .bronze-glow {
          box-shadow: 0 10px 30px -10px rgba(217, 119, 6, 0.12);
        }
        .bronze-glow:hover {
          box-shadow: 0 20px 40px -15px rgba(217, 119, 6, 0.25);
          border-color: rgba(217, 119, 6, 0.5) !important;
        }
        .kpi-stat-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Award className="w-8 h-8 text-brand-500 animate-pulse" />
            Agent Performance & KPI
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-semibold">
            IT agent ranking leaderboard based on response speeds and SLA compliance targets.
          </p>
        </div>

        {/* Dynamic Month/Year Selector */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto z-20">
          {/* Month Select */}
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

          {/* Year Select */}
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

          {/* Send Report Button */}
          <button
            type="button"
            onClick={handleSendReport}
            disabled={sendingReport || leaderboard.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent hover:from-cyan-400 hover:to-blue-500 hover:shadow-md hover:shadow-cyan-500/20 active:scale-95"
          >
            {sendingReport ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Mail className="w-3.5 h-3.5" />
            )}
            {sendingReport ? 'Sending...' : 'Send Report'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3 relative z-10">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <ReactLoader size="md" text="Syncing rankings..." />
      ) : leaderboard.length === 0 ? (
        <div className="glass-card py-16 text-center text-gray-500 dark:text-slate-500 rounded-3xl border border-gray-200/50 dark:border-slate-800/30 relative z-10">
          No IT agents performance data registered for this period.
        </div>
      ) : (
        <>
          {/* Top 3 Agents Highlight Cards - Locks to Global Leaders of selected timeframe */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {leaderboard.slice(0, 3).map((agent, index) => {
              const ranks = [
                { 
                  glow: 'gold-glow',
                  color: 'border-amber-500/30 bg-gradient-to-br from-amber-500/[0.07] via-transparent to-amber-500/[0.02] dark:from-amber-950/15 text-amber-500', 
                  label: '1st Rank Gold Medalist',
                  badge: 'bg-gradient-to-r from-amber-500 to-yellow-500 shadow-amber-500/20',
                  trophyColor: 'text-amber-500 animate-bounce',
                  strokeColor: 'stroke-amber-500 dark:stroke-amber-400'
                },
                { 
                  glow: 'silver-glow',
                  color: 'border-slate-300 dark:border-slate-700/80 bg-gradient-to-br from-slate-400/[0.06] via-transparent to-slate-400/[0.01] dark:from-slate-800/10 text-slate-500', 
                  label: '2nd Rank Silver Medalist',
                  badge: 'bg-gradient-to-r from-slate-400 to-slate-350 shadow-slate-450/20',
                  trophyColor: 'text-slate-400 dark:text-slate-300 animate-pulse',
                  strokeColor: 'stroke-slate-400 dark:stroke-slate-350'
                },
                { 
                  glow: 'bronze-glow',
                  color: 'border-orange-500/20 dark:border-orange-550/30 bg-gradient-to-br from-orange-500/[0.05] via-transparent to-orange-500/[0.01] dark:from-orange-950/10 text-orange-500', 
                  label: '3rd Rank Bronze Medalist',
                  badge: 'bg-gradient-to-r from-amber-700 to-orange-600 shadow-amber-750/20',
                  trophyColor: 'text-amber-700',
                  strokeColor: 'stroke-amber-700 dark:stroke-orange-500'
                }
              ];
              
              const delay = `${index * 150}ms`;
              
              return (
                <div 
                  key={agent.id}
                  style={{ animationDelay: delay }}
                  className={`kpi-stat-card leaderboard-row ${ranks[index].glow} glass-card p-6 rounded-3xl border ${ranks[index].color} relative flex flex-col justify-between overflow-hidden hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 group`}
                >
                  {/* Cyber Grid background detail */}
                  <div className={`absolute inset-0 ${darkMode ? 'cyber-grid' : 'cyber-grid-light'} opacity-20 pointer-events-none`} />

                  {/* Ranking Trophy Corner Indicator */}
                  <div className="absolute top-5 right-5 flex flex-col items-end z-10">
                    <div className="animate-float">
                      <Trophy className={`w-9 h-9 transition-transform duration-300 group-hover:scale-115 ${ranks[index].trophyColor}`} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest mt-1.5 text-gray-400 dark:text-slate-500">{ranks[index].label}</span>
                  </div>

                  <div className="space-y-4 z-10">
                    <div>
                      {/* Rank Badge Indicator */}
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold text-white uppercase tracking-wider mb-2.5 shadow-sm ${ranks[index].badge}`}>
                        Rank #{index + 1}
                      </span>
                      <h4 className="font-black text-lg text-gray-800 dark:text-slate-100 truncate pr-16 hover:text-brand-500 transition-colors">
                        {agent.name}
                      </h4>
                      <p className="text-[10px] text-gray-450 dark:text-slate-400 mt-0.5 truncate font-bold uppercase tracking-wider">{agent.jobPosition}</p>
                      <p className="text-[10px] text-gray-400 font-semibold">{agent.companyName}</p>
                    </div>

                    {/* Radial Progress Gauge & Tickets Summary */}
                    <div className="flex items-center gap-4 py-2">
                      <CircularProgress value={agent.metrics.complianceRate} colorClass={ranks[index].strokeColor} size={68} />
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tickets Handled</div>
                        <div className="text-2xl font-black text-gray-800 dark:text-white leading-none">
                          <AnimatedNumber value={agent.metrics.totalAssigned} />
                        </div>
                        <div className="text-[9px] font-semibold text-gray-450 mt-1">
                          {agent.metrics.slaMet} Met • {agent.metrics.slaBreached} Breached
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sub KPI Speeds */}
                  <div className="grid grid-cols-2 gap-4 border-t border-gray-250/20 dark:border-slate-800/25 pt-4 mt-6 text-xs font-bold z-10">
                    <div>
                      <p className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Avg Response</p>
                      <p className="font-black text-gray-750 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span><AnimatedNumber value={agent.metrics.avgResponseMin} /> mins</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Avg Resolution</p>
                      <p className="font-black text-gray-750 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                        <span><AnimatedNumber value={agent.metrics.avgResolutionHour} /> hrs</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search, Filter & Sort Controls Toolbar */}
          <div className="glass-panel p-4 rounded-3xl border border-gray-250/30 dark:border-slate-800/40 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-sm animate-fade-in z-10 relative">
            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search agents by name, role, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-gray-200/50 dark:border-slate-850 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-slate-100 transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort Buttons Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="text-[10px] uppercase text-gray-400 dark:text-slate-500 tracking-wider mr-1">Sort By:</span>
              {[
                { key: 'totalAssigned', label: 'Tickets Handled' },
                { key: 'complianceRate', label: 'SLA Met %' },
                { key: 'avgResponseMin', label: 'Response Speed' },
                { key: 'avgResolutionHour', label: 'Resolution Speed' }
              ].map((pill) => (
                <button
                  key={pill.key}
                  onClick={() => {
                    setSortBy(pill.key);
                    // Close open accordion row to prevent layout mismatches
                    setExpandedAgentId(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] transition-all duration-200 hover-glow-brand ${
                    sortBy === pill.key
                      ? 'bg-gradient-to-r from-brand-500 to-indigo-650 text-white border-brand-550 shadow-md shadow-brand-500/10'
                      : 'bg-white/40 dark:bg-slate-900/40 text-gray-600 dark:text-slate-400 border-gray-200/40 dark:border-slate-800/40 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Complete Leaderboard Grid List */}
          <div className="leaderboard-row glass-card rounded-3xl border border-gray-200/50 dark:border-slate-800/30 overflow-hidden mt-8 hover:shadow-lg transition-all duration-300 relative z-10" style={{ animationDelay: '450ms' }}>
            <div className="p-6 border-b border-gray-200/50 dark:border-slate-800/50 flex items-center justify-between">
              <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-500 animate-pulse" />
                <span>Activity Rankings & KPI for IT Agents</span>
              </h4>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-450 bg-gray-50 dark:bg-slate-900/50 dark:text-slate-500 px-2.5 py-1 rounded-md border border-gray-200/10">
                {filteredLeaderboard.length} Agents Found
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-200/50 dark:border-slate-800/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-6 text-center w-20">Rank</th>
                    <th className="py-4 px-6">Agent Name</th>
                    <th className="py-4 px-6 text-center">Tickets Handled</th>
                    <th className="py-4 px-6 text-center">SLA Met</th>
                    <th className="py-4 px-6 text-center">SLA Breached</th>
                    <th className="py-4 px-6 text-center">SLA Compliance</th>
                    <th className="py-4 px-6 text-center">Avg Response</th>
                    <th className="py-4 px-6 text-center">Avg Resolution</th>
                    <th className="py-4 px-6 text-center w-16">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-xs font-semibold">
                  {filteredLeaderboard.map((agent, index) => {
                    const rankDelay = `${500 + index * 30}ms`;
                    const globalRank = globalRankMap.get(agent.id);
                    
                    // Styled circular medals for top positions
                    const getRankBadge = (rankVal) => {
                      if (rankVal === 1) return <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/20 animate-pulse">1</div>;
                      if (rankVal === 2) return <div className="w-6 h-6 rounded-full bg-gradient-to-r from-slate-400 to-slate-350 text-white flex items-center justify-center font-black text-xs shadow-md shadow-slate-450/20">2</div>;
                      if (rankVal === 3) return <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-700 to-orange-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-amber-750/20">3</div>;
                      return <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 flex items-center justify-center font-semibold text-xs border border-gray-250/20">{rankVal}</div>;
                    };

                    return (
                      <React.Fragment key={`${agent.id}-${sortBy}`}>
                        <tr 
                          style={{ animationDelay: rankDelay }}
                          className={`leaderboard-row hover:bg-gray-50/50 dark:hover:bg-slate-900/20 transition-colors group/row cursor-pointer select-none ${
                            expandedAgentId === agent.id ? 'bg-gray-50/40 dark:bg-slate-900/10' : ''
                          }`}
                          onClick={() => setExpandedAgentId(expandedAgentId === agent.id ? null : agent.id)}
                        >
                          <td className="py-4 px-6 text-center flex items-center justify-center">
                            {getRankBadge(globalRank)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-extrabold text-gray-800 dark:text-slate-200 group-hover/row:text-brand-550 transition-colors">{agent.name}</div>
                            <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                              {agent.jobPosition} • {agent.companyName}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center font-black text-gray-800 dark:text-slate-200">
                            <AnimatedNumber value={agent.metrics.totalAssigned} />
                          </td>
                          <td className="py-4 px-6 text-center text-emerald-600 dark:text-emerald-450 font-extrabold">
                            <AnimatedNumber value={agent.metrics.slaMet} />
                          </td>
                          <td className="py-4 px-6 text-center text-red-500 font-extrabold">
                            <AnimatedNumber value={agent.metrics.slaBreached} />
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3 justify-center">
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full inline-block ${getSlaBadgeColor(agent.metrics.complianceRate)}`}>
                                <AnimatedNumber value={agent.metrics.complianceRate} suffix="%" />
                              </span>
                              <div className="w-16 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden hidden md:block shrink-0">
                                <div 
                                  className={`h-full rounded-full ${
                                    agent.metrics.complianceRate >= 90 ? 'bg-emerald-500' :
                                    agent.metrics.complianceRate >= 75 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${agent.metrics.complianceRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-gray-600 dark:text-slate-400">
                            <AnimatedNumber value={agent.metrics.avgResponseMin} suffix=" m" />
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-gray-600 dark:text-slate-400">
                            <AnimatedNumber value={agent.metrics.avgResolutionHour} suffix=" h" />
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center">
                              {expandedAgentId === agent.id ? (
                                <ChevronUp className="w-4 h-4 text-brand-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400 group-hover/row:text-brand-500 transition-colors" />
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Accordion Expandable Detail row */}
                        {expandedAgentId === agent.id && (
                          <tr className="bg-gray-50/20 dark:bg-slate-900/5">
                            <td colSpan="9" className="p-0 border-t-0">
                              <div className="overflow-hidden px-8 py-6 bg-gray-50/30 dark:bg-slate-950/20 border-y border-gray-200/20 dark:border-slate-800/20 animate-scale-up">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                  {/* Column 1: Performance Summary Breakdown */}
                                  <div className="space-y-3 glass-card p-4 rounded-2xl border border-gray-200/50 dark:border-slate-800/50">
                                    <h5 className="font-extrabold text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                      <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
                                      Ticket Activity Balance
                                    </h5>
                                    <div className="space-y-2 mt-2">
                                      <div className="flex justify-between text-[11px] text-gray-550 dark:text-slate-350">
                                        <span>Active Workload</span>
                                        <span className="font-extrabold text-gray-750 dark:text-slate-200">{agent.metrics.openTickets} tickets</span>
                                      </div>
                                      <div className="flex justify-between text-[11px] text-gray-550 dark:text-slate-350">
                                        <span>Resolved & Closed</span>
                                        <span className="font-extrabold text-gray-750 dark:text-slate-200">{agent.metrics.resolvedTickets} tickets</span>
                                      </div>
                                      
                                      {/* Workload Segmented shimmer-bar */}
                                      <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full flex overflow-hidden mt-1 shadow-inner">
                                        {agent.metrics.totalAssigned > 0 ? (
                                          <>
                                            <div 
                                              className="bg-indigo-500 shimmer-bar"
                                              style={{ width: `${(agent.metrics.openTickets / agent.metrics.totalAssigned) * 100}%` }}
                                              title="Open Tickets"
                                            />
                                            <div 
                                              className="bg-emerald-500 shimmer-bar"
                                              style={{ width: `${(agent.metrics.slaMet / agent.metrics.totalAssigned) * 100}%` }}
                                              title="SLA Met"
                                            />
                                            <div 
                                              className="bg-red-500 shimmer-bar"
                                              style={{ width: `${(agent.metrics.slaBreached / agent.metrics.totalAssigned) * 100}%` }}
                                              title="SLA Breached"
                                            />
                                          </>
                                        ) : (
                                          <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full" />
                                        )}
                                      </div>
                                      <div className="flex gap-3 text-[9px] text-gray-400 font-bold uppercase mt-1">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-indigo-500 rounded-full"></span> Active ({agent.metrics.openTickets})</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Met ({agent.metrics.slaMet})</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Breached ({agent.metrics.slaBreached})</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Column 2: Achievement Badges */}
                                  <div className="space-y-3 glass-card p-4 rounded-2xl border border-gray-200/50 dark:border-slate-800/50">
                                    <h5 className="font-extrabold text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                      <Award className="w-3.5 h-3.5 text-amber-500" />
                                      Agent Badges & Honors
                                    </h5>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {agent.metrics.totalAssigned === 0 ? (
                                        <p className="text-[11px] text-gray-400 dark:text-slate-550 italic mt-1">No badges earned for this period.</p>
                                      ) : (
                                        <>
                                          {agent.metrics.complianceRate >= 90 && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm animate-pulse-glow-subtle">
                                              🏆 SLA Champion
                                            </span>
                                          )}
                                          {agent.metrics.avgResponseMin <= 15 && agent.metrics.avgResponseMin > 0 && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shadow-sm">
                                              ⚡ Speed Racer
                                            </span>
                                          )}
                                          {agent.metrics.totalAssigned >= 15 && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-sm">
                                              📦 Power Handler
                                            </span>
                                          )}
                                          {agent.metrics.avgResolutionHour <= 4 && agent.metrics.avgResolutionHour > 0 && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-gradient-to-r from-indigo-500/10 to-indigo-500/15 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 shadow-sm">
                                              ⏱️ Rapid Closer
                                            </span>
                                          )}
                                          {agent.metrics.complianceRate < 90 && agent.metrics.complianceRate >= 75 && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm">
                                              🤝 Solid Performer
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Column 3: Performance Insights */}
                                  <div className="space-y-3 glass-card p-4 rounded-2xl border border-gray-200/50 dark:border-slate-800/50">
                                    <h5 className="font-extrabold text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                                      Automated KPI Analysis
                                    </h5>
                                    <div className="text-[11px] text-gray-550 dark:text-slate-350 space-y-1.5 leading-relaxed mt-1">
                                      {agent.metrics.totalAssigned === 0 ? (
                                        <p className="italic text-gray-450 dark:text-slate-500">Agent has not handled any tickets during this timeframe.</p>
                                      ) : (
                                        <>
                                          <p>
                                            • SLA compliance is currently at <strong className="text-gray-850 dark:text-slate-100">{agent.metrics.complianceRate}%</strong> with {agent.metrics.slaMet} met and {agent.metrics.slaBreached} breached tickets.
                                          </p>
                                          <p>
                                            {agent.metrics.avgResponseMin <= 10 
                                              ? '• Outstanding initial response speed! The agent addresses incoming alerts almost immediately.' 
                                              : '• Initial response time is moderate. Suggest setting priority alerts for tickets to improve response speed.'}
                                          </p>
                                          <p>
                                            {agent.metrics.avgResolutionHour <= 6 
                                              ? '• Excellent resolution cycle time, resolving issues in under 6 hours on average.'
                                              : '• Long average resolution time. Review complex tickets assigned to this agent for training opportunities.'}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {filteredLeaderboard.length === 0 && (
              <div className="py-12 text-center text-gray-450 dark:text-slate-500 font-medium">
                No agents found matching "{searchQuery}"
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
