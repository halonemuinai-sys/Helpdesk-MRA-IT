import React, { useState, useEffect } from 'react';
import { 
  Award, 
  AlertTriangle, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  Building2 
} from 'lucide-react';
import ReactLoader from '../components/ReactLoader';
import Select from 'react-select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AgentPerformance({ user, token, darkMode }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timeframe states (initialized to current month/year)
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSlaBadgeColor = (rate) => {
    if (rate >= 90) return 'text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400';
    if (rate >= 75) return 'text-amber-650 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400';
    return 'text-red-650 bg-red-50 dark:bg-red-950/20 dark:text-red-400';
  };

  if (loading && leaderboard.length === 0) {
    return (
      <ReactLoader size="lg" text="Analyzing Agent Performance & KPIs..." />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Award className="w-8 h-8 text-brand-500 animate-pulse" />
            Agent Performance & KPI
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">
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
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <ReactLoader size="md" text="Syncing rankings..." />
      ) : leaderboard.length === 0 ? (
        <div className="glass-card py-16 text-center text-gray-500 dark:text-slate-500 rounded-3xl border border-gray-200/50 dark:border-slate-800/30">
          No IT agents performance data registered for this period.
        </div>
      ) : (
        <>
          {/* Top 3 Agents Highlight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {leaderboard.slice(0, 3).map((agent, index) => {
              const ranks = [
                { 
                  color: 'border-amber-500/35 bg-gradient-to-br from-amber-500/5 to-amber-500/10 dark:from-amber-950/10 dark:to-amber-950/20 hover:shadow-amber-500/10 text-amber-500', 
                  label: '1st Rank',
                  trophyColor: 'text-amber-500'
                },
                { 
                  color: 'border-blue-500/25 bg-gradient-to-br from-blue-500/5 to-blue-500/10 dark:from-blue-950/10 dark:to-blue-950/20 hover:shadow-blue-500/10 text-blue-500', 
                  label: '2nd Rank',
                  trophyColor: 'text-slate-400 dark:text-slate-300'
                },
                { 
                  color: 'border-indigo-500/25 bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 dark:from-indigo-950/10 dark:to-indigo-950/20 hover:shadow-indigo-500/10 text-indigo-500', 
                  label: '3rd Rank',
                  trophyColor: 'text-amber-700'
                }
              ];
              
              const staggerClasses = ['stagger-1', 'stagger-2', 'stagger-3'];
              
              return (
                <div 
                  key={agent.id}
                  className={`group ${staggerClasses[index]} glass-card p-6 rounded-3xl border ${ranks[index].color} relative flex flex-col justify-between overflow-hidden hover:-translate-y-1.5 transition-all duration-300 hover:shadow-lg`}
                >
                  {/* Ranking Trophy Corner Indicator */}
                  <div className="absolute top-4 right-4 flex flex-col items-end">
                    <div className="animate-float">
                      <Trophy className={`w-9 h-9 transition-transform duration-300 group-hover:scale-115 ${ranks[index].trophyColor}`} />
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest mt-1.5 text-gray-400 dark:text-slate-500">{ranks[index].label}</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-extrabold text-lg text-gray-800 dark:text-slate-200 truncate pr-16 group-hover:text-brand-500 transition-colors">
                        {agent.name}
                      </h4>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate font-semibold">{agent.jobPosition}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{agent.companyName}</p>
                    </div>

                    {/* Primary SLA percentage */}
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-3xl font-black text-gray-800 dark:text-white transition-transform group-hover:scale-105 duration-300">
                        {agent.metrics.complianceRate}%
                      </h3>
                      <span className="text-xs font-bold text-gray-400">SLA Met</span>
                    </div>
                  </div>

                  {/* Sub KPI Speeds */}
                  <div className="grid grid-cols-2 gap-4 border-t border-gray-200/40 dark:border-slate-800/40 pt-4 mt-6 text-xs font-semibold">
                    <div>
                      <p className="text-gray-400 font-medium">Avg Response</p>
                      <p className="font-bold text-gray-700 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-brand-500" />
                        <span>{agent.metrics.avgResponseMin} mins</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Avg Resolution</p>
                      <p className="font-bold text-gray-700 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{agent.metrics.avgResolutionHour} hrs</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Complete Leaderboard Grid List */}
          <div className="group stagger-3 glass-card rounded-3xl border border-gray-200/50 dark:border-slate-800/30 overflow-hidden mt-8 hover:shadow-lg transition-all duration-300">
            <div className="p-6 border-b border-gray-200/50 dark:border-slate-800/50 flex items-center justify-between">
              <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-500" />
                <span>Activity Rankings & KPI for IT Agents</span>
              </h4>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 dark:bg-slate-900/50 dark:text-slate-500 px-2.5 py-1 rounded-md border border-gray-200/10">
                {leaderboard.length} Agents Active
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-200/50 dark:border-slate-800/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-6 text-center w-16">Rank</th>
                    <th className="py-4 px-6">Agent Name</th>
                    <th className="py-4 px-6 text-center">Tickets Handled</th>
                    <th className="py-4 px-6 text-center">SLA Met</th>
                    <th className="py-4 px-6 text-center">SLA Breached</th>
                    <th className="py-4 px-6 text-center">SLA Compliance Rate</th>
                    <th className="py-4 px-6 text-center">Avg Response</th>
                    <th className="py-4 px-6 text-center">Avg Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-xs font-semibold">
                  {leaderboard.map((agent, index) => (
                    <tr key={agent.id} className="hover:bg-gray-50/30 dark:hover:bg-slate-900/10 transition-colors group/row">
                      <td className="py-4 px-6 text-center font-bold text-gray-400 group-hover/row:text-brand-500 group-hover/row:scale-110 transition-all">
                        #{index + 1}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-800 dark:text-slate-200 group-hover/row:text-brand-550 transition-colors">{agent.name}</div>
                        <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                          {agent.jobPosition} • {agent.companyName}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-extrabold text-gray-700 dark:text-slate-300">
                        {agent.metrics.totalAssigned}
                      </td>
                      <td className="py-4 px-6 text-center text-emerald-600 dark:text-emerald-450 font-extrabold">
                        {agent.metrics.slaMet}
                      </td>
                      <td className="py-4 px-6 text-center text-red-500 font-extrabold">
                        {agent.metrics.slaBreached}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full inline-block transition-transform duration-300 group-hover/row:scale-105 ${getSlaBadgeColor(agent.metrics.complianceRate)}`}>
                          {agent.metrics.complianceRate}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-gray-600 dark:text-slate-400">
                        {agent.metrics.avgResponseMin} m
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-gray-600 dark:text-slate-400">
                        {agent.metrics.avgResolutionHour} h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
