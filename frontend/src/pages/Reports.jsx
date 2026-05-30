import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  Building2, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  Ticket,
  Users,
  Cpu,
  Mail,
  MessageSquare,
  Phone,
  User,
  ShieldAlert,
  Briefcase,
  Layers,
  FileText,
  HelpCircle
} from 'lucide-react';
import ReactLoader from '../components/ReactLoader';
import Select from 'react-select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getSourceIcon = (sourceName) => {
  switch (sourceName.toLowerCase()) {
    case 'whatsapp':
    case 'instant messaging':
    case 'telegram':
      return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
    case 'email':
      return <Mail className="w-3.5 h-3.5 text-blue-500" />;
    case 'phone call':
    case 'phone':
      return <Phone className="w-3.5 h-3.5 text-teal-500" />;
    case 'walk-in':
    case 'walkin':
      return <User className="w-3.5 h-3.5 text-amber-500" />;
    case 'system alert':
    case 'system':
      return <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />;
    case 'on-site visit':
    case 'visit':
      return <Briefcase className="w-3.5 h-3.5 text-indigo-500" />;
    default:
      return <Ticket className="w-3.5 h-3.5 text-purple-500" />;
  }
};

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

  // SLA compliance
  const slaRate = data?.sla?.complianceRate ?? 100;
  const metTickets = data?.sla?.met ?? 0;
  const breachedTickets = data?.sla?.breached ?? 0;

  const getSlaColor = (rate) => {
    if (rate >= 90) return 'text-emerald-500';
    if (rate >= 75) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      
      {/* Title Header Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-brand-500 animate-pulse" />
            Analysis Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-semibold">
            Metrik kepatuhan SLA mendalam, distribusi prioritas, jenis media pelaporan, dan performa divisi.
          </p>
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto z-20">
          
          {/* Company Filter Selector (Agents & Admins) */}
          {user.role !== 'USER' && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-slate-800/80 px-3 py-1.5 rounded-xl shadow-sm">
              <Building2 className="w-4 h-4 text-gray-400" />
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none pr-4 cursor-pointer"
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
        <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {data && (
        <div className="space-y-8">
          
          {/* 1. TOP SUMMARY HUD CARD GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* HUD 1: Total Tickets */}
            <div className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-white to-blue-50/10 dark:from-slate-900/70 dark:to-slate-950/40 border border-gray-250 dark:border-slate-800/80 shadow-md flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Tiket Masuk</p>
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100">{data.totalTickets}</h3>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">Insiden terdata di sistem</p>
              </div>
              <div className="p-3.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shadow-inner">
                <Ticket className="w-6 h-6" />
              </div>
            </div>

            {/* HUD 2: SLA compliance Met Rate */}
            <div className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-white to-emerald-50/10 dark:from-slate-900/70 dark:to-slate-950/40 border border-gray-250 dark:border-slate-800/80 shadow-md flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Kepatuhan SLA</p>
                <h3 className={`text-3xl font-extrabold ${getSlaColor(slaRate)}`}>{slaRate}%</h3>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">{metTickets} Met / {breachedTickets} Breached</p>
              </div>
              <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            {/* HUD 3: Average Response Time */}
            <div className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-white to-teal-50/10 dark:from-slate-900/70 dark:to-slate-950/40 border border-gray-200/50 dark:border-slate-800/80 shadow-md flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Rata Waktu Respon</p>
                <h3 className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">
                  {data.sla.avgResponseHours} <span className="text-xs font-bold text-gray-450">Jam</span>
                </h3>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">Durasi respon pertama agen</p>
              </div>
              <div className="p-3.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl shadow-inner">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            {/* HUD 4: Average Resolution Time */}
            <div className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-white to-indigo-50/10 dark:from-slate-900/70 dark:to-slate-950/40 border border-gray-200/50 dark:border-slate-800/80 shadow-md flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Rata Waktu Resolusi</p>
                <h3 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {data.sla.avgResolutionHours} <span className="text-xs font-bold text-gray-450">Jam</span>
                </h3>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">Durasi penyelesaian bersih</p>
              </div>
              <div className="p-3.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* 2. GRID ROW 1: STATUS, PRIORITY & CATEGORIES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Box A: Status Breakdown */}
            <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between min-h-[340px]">
              <div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-500" />
                  <span>Ticket Status Distribution</span>
                </h4>
                <div className="space-y-3.5">
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
                      <div key={statusKey} className="text-xs font-semibold space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-500 dark:text-slate-450 font-bold">{statusKey}</span>
                          <span className={colors[statusKey].split(' ')[1]}>{count} tickets ({percent}%)</span>
                        </div>
                        {/* Progress Bar Container */}
                        <div className="h-2.5 bg-gray-100 dark:bg-slate-800/50 rounded-full overflow-hidden relative border border-gray-200/10">
                          <div 
                            className={`h-full ${colors[statusKey].split(' ')[0]} rounded-full transition-all duration-1000`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Box B: Priority Breakdown */}
            <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between min-h-[340px]">
              <div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-brand-500" />
                  <span>Ticket Priority Breakdown</span>
                </h4>
                <div className="space-y-4">
                  {Object.entries(data.priorities).map(([priorityKey, count]) => {
                    const total = data.totalTickets || 1;
                    const percent = Math.round((count / total) * 100);

                    const barColors = {
                      LOW: 'bg-emerald-500',
                      MEDIUM: 'bg-amber-500',
                      HIGH: 'bg-rose-500',
                      CRITICAL: 'bg-red-650 animate-pulse'
                    };

                    const textColors = {
                      LOW: 'text-emerald-600 dark:text-emerald-450',
                      MEDIUM: 'text-amber-600 dark:text-amber-450',
                      HIGH: 'text-rose-600 dark:text-rose-455',
                      CRITICAL: 'text-red-600 dark:text-red-400 font-extrabold'
                    };

                    return (
                      <div key={priorityKey} className="text-xs font-semibold space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-500 dark:text-slate-450 font-bold">{priorityKey}</span>
                          <span className={textColors[priorityKey]}>{count} tickets ({percent}%)</span>
                        </div>
                        {/* Progress Bar Container */}
                        <div className="h-2.5 bg-gray-100 dark:bg-slate-800/50 rounded-full overflow-hidden relative border border-gray-200/10">
                          <div 
                            className={`h-full ${barColors[priorityKey] || 'bg-gray-400'} rounded-full transition-all duration-1000`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Box C: Category (Issue Type) Breakdown */}
            <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between min-h-[340px]">
              <div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-500" />
                  <span>Issue Type Distribution (Categories)</span>
                </h4>
                <div className="space-y-4">
                  {Object.entries(data.categories).map(([catKey, count]) => {
                    const total = data.totalTickets || 1;
                    const percent = Math.round((count / total) * 100);

                    return (
                      <div key={catKey} className="text-xs font-semibold space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-500 dark:text-slate-450 font-bold">{catKey}</span>
                          <span className="text-brand-600 dark:text-brand-400">{count} tickets ({percent}%)</span>
                        </div>
                        {/* Progress Bar Container */}
                        <div className="h-2.5 bg-gray-100 dark:bg-slate-800/50 rounded-full overflow-hidden relative border border-gray-200/10">
                          <div 
                            className="h-full bg-brand-500 rounded-full transition-all duration-1000"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* 3. GRID ROW 2: DETAILED VARIABLES (DEPARTMENTS, SUB-CATEGORIES, SOURCES) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Box D: Departments Breakdown */}
            <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between lg:col-span-1 min-h-[360px]">
              <div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-500" />
                  <span>Top Requester Departments</span>
                </h4>
                {Object.keys(data.departments || {}).length === 0 ? (
                  <p className="text-xs text-gray-400 py-12 text-center">No department data recorded.</p>
                ) : (
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {Object.entries(data.departments)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5) // Top 5
                      .map(([deptName, count]) => {
                        const total = data.totalTickets || 1;
                        const percent = Math.round((count / total) * 100);

                        return (
                          <div key={deptName} className="text-xs font-semibold space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-gray-700 dark:text-slate-300 font-bold truncate max-w-[170px]">{deptName}</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{count} ({percent}%)</span>
                            </div>
                            <div className="h-2 bg-gray-150 dark:bg-slate-800/50 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Box E: Top Sub-Categories */}
            <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between lg:col-span-1 min-h-[360px]">
              <div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-500" />
                  <span>Frequent Issue Sub-categories</span>
                </h4>
                {Object.keys(data.subCategories || {}).length === 0 ? (
                  <p className="text-xs text-gray-400 py-12 text-center">No sub-category data recorded.</p>
                ) : (
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {Object.entries(data.subCategories)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5) // Top 5
                      .map(([subCatName, count]) => {
                        const total = data.totalTickets || 1;
                        const percent = Math.round((count / total) * 100);

                        return (
                          <div key={subCatName} className="text-xs font-semibold space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-gray-700 dark:text-slate-300 font-bold truncate max-w-[170px]">{subCatName === '-' ? 'General/Other' : subCatName}</span>
                              <span className="text-amber-600 dark:text-amber-400 font-bold">{count} ({percent}%)</span>
                            </div>
                            <div className="h-2 bg-gray-150 dark:bg-slate-800/50 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Box F: Ticket Sources */}
            <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between lg:col-span-1 min-h-[360px]">
              <div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-500" />
                  <span>Report Media (Ticket Sources)</span>
                </h4>
                {Object.keys(data.sources || {}).length === 0 ? (
                  <p className="text-xs text-gray-400 py-12 text-center">No ticket source data recorded.</p>
                ) : (
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {Object.entries(data.sources)
                      .sort((a, b) => b[1] - a[1])
                      .map(([srcName, count]) => {
                        const total = data.totalTickets || 1;
                        const percent = Math.round((count / total) * 100);

                        return (
                          <div key={srcName} className="text-xs font-semibold space-y-1">
                            <div className="flex justify-between text-[11px] items-center">
                              <span className="text-gray-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                                {getSourceIcon(srcName)}
                                {srcName}
                              </span>
                              <span className="text-teal-600 dark:text-teal-400 font-bold">{count} ({percent}%)</span>
                            </div>
                            <div className="h-2 bg-gray-150 dark:bg-slate-800/50 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 4. SUBSIDIARY COMPANY VOLUMES TABLE */}
          <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55">
            <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
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
                    <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider text-[10px]">
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
                            <td className="py-3 px-4 font-bold text-gray-800 dark:text-slate-200">{name}</td>
                            <td className="py-3 px-4 text-center text-brand-600 dark:text-brand-400 font-extrabold text-sm">{count}</td>
                            <td className="py-3 px-4 w-1/2">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-brand-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="w-8 text-right text-[10px] font-bold text-gray-500">{pct}%</span>
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
