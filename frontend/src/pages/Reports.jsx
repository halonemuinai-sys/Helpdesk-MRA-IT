import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  Building2, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Sparkles 
} from 'lucide-react';
import ReactLoader from '../components/ReactLoader';
import Select from 'react-select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Reports({ user, token, darkMode }) {
  const [data, setData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
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
    fetchReportData();
  }, [selectedCompanyId, selectedMonth, selectedYear]);

  const fetchReportData = async () => {
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

      // 1. Fetch report analytics with timeframe support
      const res = await fetch(`${API_URL}/reports?companyId=${selectedCompanyId}&startDate=${startDate}&endDate=${endDate}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch analytical reports.');
      const reportData = await res.json();
      setData(reportData);

      // 2. Fetch companies list for selector
      if (companies.length === 0) {
        const compRes = await fetch(`${API_URL}/companies`, { headers });
        if (compRes.ok) {
          const compData = await compRes.json();
          // get unique company names
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

  if (loading && !data) {
    return (
      <ReactLoader size="lg" text="Generating SLA Analysis Reports..." />
    );
  }

  // SLA Gauge Calculations
  const slaRate = data?.sla?.complianceRate ?? 100;
  const strokeDashoffset = 440 - (440 * slaRate) / 100;

  const getSlaColor = (rate) => {
    if (rate >= 90) return 'text-emerald-500';
    if (rate >= 75) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title Header Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-brand-500 animate-pulse" />
            Analysis Reports
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">
            Graphical charts, issue categories, and SLA compliance rates for the IT Helpdesk.
          </p>
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto z-20">
          
          {/* Company Filter Selector (Agents & Admins) */}
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

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: SLA Compliance Gauge (Premium Circle SVG) */}
          <div className="group stagger-1 glass-card p-6 rounded-3xl border border-gray-200/50 dark:border-slate-800/30 flex flex-col items-center justify-between min-h-[380px] hover-glow-brand transition-all duration-300">
            <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 self-start flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-500" />
              <span>SLA Compliance (KPI Target)</span>
            </h4>
            
            {/* SVG Circular Progress Gauge */}
            <div className="relative w-48 h-48 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="70"
                  className="stroke-gray-100 dark:stroke-slate-800 fill-none"
                  strokeWidth="14"
                />
                {/* Foreground indicator */}
                <circle
                  cx="96"
                  cy="96"
                  r="70"
                  className="stroke-brand-500 fill-none transition-all duration-1000 ease-out"
                  strokeWidth="14"
                  strokeDasharray="440"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Inner percentage text */}
              <div className="absolute text-center">
                <h3 className={`text-4xl font-extrabold transition-all duration-300 ${getSlaColor(slaRate)}`}>{slaRate}%</h3>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-1">SLA Met Rate</p>
              </div>
            </div>

            {/* SLA Info Status */}
            <div className="w-full p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center gap-3 transition-colors group-hover:border-brand-500/35">
              <div className="animate-float">
                <Sparkles className="w-7 h-7 text-brand-500" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-gray-700 dark:text-slate-200">
                  {slaRate >= 90 ? 'Excellent Performance' : slaRate >= 75 ? 'Average Performance' : 'Needs Improvement'}
                </p>
                <p className="text-gray-400 mt-0.5 font-semibold">
                  {data.sla.met} met SLA, {data.sla.breached} breached.
                </p>
              </div>
            </div>

          </div>

          {/* Column 2 & 3: Detailed bar breakdown */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Status Breakdown Horizontal Charts */}
            <div className="group stagger-2 glass-card p-6 rounded-3xl border border-gray-200/50 dark:border-slate-800/30 hover:shadow-lg transition-shadow">
              <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-5">Ticket Status Distribution</h4>
              <div className="space-y-4">
                {Object.entries(data.status).map(([statusKey, count]) => {
                  const total = data.totalTickets || 1;
                  const percent = Math.round((count / total) * 100);

                  const colors = {
                    OPEN: 'bg-blue-500 text-blue-500 dark:text-blue-400',
                    IN_PROGRESS: 'bg-amber-500 text-amber-500 dark:text-amber-400',
                    PENDING: 'bg-slate-400 text-slate-400 dark:text-slate-350',
                    RESOLVED: 'bg-emerald-500 text-emerald-500 dark:text-emerald-400',
                    CLOSED: 'bg-gray-500 text-gray-500 dark:text-gray-400'
                  };

                  return (
                    <div key={statusKey} className="flex items-center gap-4 text-xs font-semibold">
                      <span className="w-24 text-gray-600 dark:text-slate-400 transition-transform duration-300 group-hover:translate-x-1">{statusKey}</span>
                      
                      {/* Bar Container */}
                      <div className="flex-1 h-6 bg-gray-100 dark:bg-slate-800/50 rounded-lg overflow-hidden relative flex items-center px-3 border border-gray-200/10 hover:scale-[1.01] transition-transform">
                        <div 
                          className={`absolute top-0 left-0 bottom-0 ${colors[statusKey].split(' ')[0]} opacity-15 shimmer-bar transition-all duration-1000`}
                          style={{ width: `${percent}%` }}
                        ></div>
                        <div 
                          className={`absolute top-0 left-0 bottom-0 ${colors[statusKey].split(' ')[0]} w-1.5 rounded-l-lg`}
                        ></div>
                        <span className={`z-10 font-extrabold ${colors[statusKey].split(' ')[1]}`}>{count} tickets ({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Breakdown Horizontal Charts */}
            <div className="group stagger-3 glass-card p-6 rounded-3xl border border-gray-200/50 dark:border-slate-800/30 hover:shadow-lg transition-shadow">
              <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-5">Issue Type Distribution</h4>
              <div className="space-y-4">
                {Object.entries(data.categories).map(([catKey, count]) => {
                  const total = data.totalTickets || 1;
                  const percent = Math.round((count / total) * 100);

                  return (
                    <div key={catKey} className="flex items-center gap-4 text-xs font-semibold">
                      <span className="w-24 text-gray-600 dark:text-slate-400 transition-transform duration-300 group-hover:translate-x-1">{catKey}</span>
                      
                      {/* Bar Container */}
                      <div className="flex-1 h-6 bg-gray-100 dark:bg-slate-800/50 rounded-lg overflow-hidden relative flex items-center px-3 border border-gray-200/10 hover:scale-[1.01] transition-transform">
                        <div 
                          className="absolute top-0 left-0 bottom-0 bg-brand-500 opacity-15 shimmer-bar transition-all duration-1000"
                          style={{ width: `${percent}%` }}
                        ></div>
                        <div 
                          className="absolute top-0 left-0 bottom-0 bg-brand-500 w-1.5 rounded-l-lg"
                        ></div>
                        <span className="z-10 font-extrabold text-brand-600 dark:text-brand-400">{count} tickets ({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Full Distribution table for child companies */}
          <div className="group lg:col-span-3 glass-card p-6 rounded-3xl border border-gray-200/50 dark:border-slate-800/30 hover:shadow-lg transition-shadow">
            <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-brand-500 animate-pulse" />
              <span>Client Company Distribution Data (MRA Group)</span>
            </h4>
            
            {Object.keys(data.companies).length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500 dark:text-slate-500">
                No ticket data for registered companies in this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Subsidiary Company</th>
                      <th className="py-3 px-4 text-center">Total Tickets</th>
                      <th className="py-3 px-4">Volume Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-gray-700 dark:text-slate-300">
                    {Object.entries(data.companies)
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, count]) => {
                        const total = data.totalTickets || 1;
                        const pct = Math.round((count / total) * 100);

                        return (
                          <tr key={name} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-gray-800 dark:text-slate-200">{name}</td>
                            <td className="py-3.5 px-4 text-center text-brand-600 dark:text-brand-400 font-bold">{count}</td>
                            <td className="py-3.5 px-4 w-1/2">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-brand-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="w-8 text-right text-[10px]">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
