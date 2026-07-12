import React from 'react';
import { Search, Filter, Clock, Grid, Circle, PauseCircle, CheckCircle2, XCircle, ChevronDown, AlertTriangle, MoonStar } from 'lucide-react';

const ACTIVE_STATUSES = [
  { label: 'All Active', value: 'ALL_ACTIVE', icon: Grid },
  { label: 'Open', value: 'OPEN', icon: Circle },
  { label: 'In Progress', value: 'IN_PROGRESS', icon: Clock },
  { label: 'Pending', value: 'PENDING', icon: PauseCircle },
];

const HISTORY_STATUSES = [
  { label: 'All History', value: 'ALL_HISTORY', icon: Grid },
  { label: 'Resolved', value: 'RESOLVED', icon: CheckCircle2 },
  { label: 'Closed', value: 'CLOSED', icon: XCircle },
];

export default function TicketsSummaryFilterBar({
  activeTab, statusFilter, setStatusFilter,
  priorityFilter, onPriorityChange,
  searchQuery, setSearchQuery,
  monthFilter, onMonthChange,
  slaFilter, onSlaFilterToggle,
  offHoursFilter, onOffHoursFilterToggle,
  onSearch,
}) {
  const statuses = activeTab === 'ACTIVE' ? ACTIVE_STATUSES : HISTORY_STATUSES;

  return (
    <div className="bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col lg:flex-row items-center justify-between gap-4">

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
        {statuses.map(status => {
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
      </div>

      {/* Search + Dropdowns */}
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        <div className="relative flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl shadow-sm pr-9 group hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-200">
          <Clock className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors shrink-0" />
          <select
            value={monthFilter}
            onChange={(e) => onMonthChange(e.target.value)}
            className="appearance-none bg-transparent text-xs font-bold text-slate-705 dark:text-slate-200 focus:outline-none cursor-pointer w-full"
          >
            <option value="ALL">All Time</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="LAST_3_MONTHS">Last 3 Months</option>
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none group-hover:text-emerald-500 transition-colors" />
        </div>

        <div className="relative flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl shadow-sm pr-9 group hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-200">
          <Filter className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors shrink-0" />
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
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

        <button
          type="button"
          onClick={onSlaFilterToggle}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 whitespace-nowrap shadow-sm ${
            slaFilter
              ? 'bg-red-50 text-red-600 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 shadow-red-100 dark:shadow-red-950/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-red-200 dark:hover:border-red-900/50 hover:text-red-500 dark:hover:text-red-400'
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${slaFilter ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`} />
          SLA Breached
          {slaFilter && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
        </button>

        <button
          type="button"
          onClick={onOffHoursFilterToggle}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 whitespace-nowrap shadow-sm ${
            offHoursFilter
              ? 'bg-violet-50 text-violet-600 border-violet-300 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/50'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-violet-200 dark:hover:border-violet-900/50 hover:text-violet-500 dark:hover:text-violet-400'
          }`}
        >
          <MoonStar className={`w-3.5 h-3.5 ${offHoursFilter ? 'text-violet-500 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}`} />
          Luar Jam Kerja
          {offHoursFilter && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />}
        </button>

        <form
          onSubmit={(e) => { e.preventDefault(); onSearch(); }}
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
  );
}
