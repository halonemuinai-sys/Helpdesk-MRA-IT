import React from 'react';
import { Building2, AlertTriangle } from 'lucide-react';
import ReactLoader from '../components/ReactLoader';
import useDashboard from '../hooks/useDashboard';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import DashboardKpiCards from '../components/dashboard/DashboardKpiCards';
import DashboardPerformancePanel from '../components/dashboard/DashboardPerformancePanel';
import DashboardTrendChart from '../components/dashboard/DashboardTrendChart';
import DashboardStatusChart from '../components/dashboard/DashboardStatusChart';
import DashboardCategoryChart from '../components/dashboard/DashboardCategoryChart';
import DashboardPriorityGrid from '../components/dashboard/DashboardPriorityGrid';
import DashboardUrgentPanel from '../components/dashboard/DashboardUrgentPanel';
import DashboardPerformanceModal from '../components/dashboard/DashboardPerformanceModal';
import DashboardSlaHeatmap from '../components/dashboard/DashboardSlaHeatmap';

export default function Dashboard({ user, token, darkMode }) {
  const h = useDashboard({ user, token });
  const [activeTab, setActiveTab] = React.useState('operational');

  if (h.loading && !h.analytics) {
    return <ReactLoader size="lg" text="Loading Dashboard Operational Data..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <DashboardTopBar
        recentUrgentTickets={h.recentUrgentTickets}
        myOverdueTicketsCount={h.myOverdueTicketsCount}
        expiringSoon={h.expiringSoon}
      />

      {/* Header & Company Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight">Main Dashboard</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium text-xs">
            IT support operational status and SLA compliance for MRA Group.
          </p>
        </div>
        {user.role !== 'USER' && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-sm">
            <Building2 className="w-4 h-4 text-gray-400" />
            <select
              value={h.selectedCompanyId}
              onChange={(e) => h.setSelectedCompanyId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none pr-4 cursor-pointer"
            >
              <option value="">All Companies</option>
              {h.companies.map(comp => <option key={comp.id} value={comp.id}>{comp.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {h.error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>{h.error}</span>
        </div>
      )}

      {h.analytics && (
        <div className="space-y-6">
          {/* Main KPI Cards placed at the top */}
          <DashboardKpiCards analytics={h.analytics} />

          {/* Segmented Tab Switcher */}
          <div className="flex border-b border-gray-250/30 dark:border-slate-800/80 pb-px">
            <div className="flex bg-gray-100/80 dark:bg-slate-900/55 p-1 rounded-2xl border border-gray-200/20 shadow-inner">
              <button
                onClick={() => setActiveTab('operational')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                  activeTab === 'operational'
                    ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-sm border border-gray-200/10 dark:border-slate-700/30'
                    : 'text-gray-450 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
              >
                Operational Desk
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                  activeTab === 'analytics'
                    ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-sm border border-gray-200/10 dark:border-slate-700/30'
                    : 'text-gray-450 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Analytics & Performance
              </button>
            </div>
          </div>

          <div className="animate-scale-up">
            {activeTab === 'operational' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DashboardStatusChart analytics={h.analytics} darkMode={darkMode} />
                    <DashboardCategoryChart analytics={h.analytics} />
                  </div>
                  <DashboardPriorityGrid analytics={h.analytics} />
                </div>
                <div className="lg:col-span-1">
                  <DashboardUrgentPanel recentUrgentTickets={h.recentUrgentTickets} />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <DashboardTrendChart analytics={h.analytics} darkMode={darkMode} />
                <DashboardSlaHeatmap analytics={h.analytics} />
                <DashboardPerformancePanel
                  timeframedLeaderboard={h.timeframedLeaderboard}
                  perfLoading={h.perfLoading}
                  selectedMonth={h.selectedMonth} setSelectedMonth={h.setSelectedMonth}
                  selectedYear={h.selectedYear} setSelectedYear={h.setSelectedYear}
                  darkMode={darkMode}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <DashboardPerformanceModal
        show={h.showPerformanceReminder}
        onClose={() => h.setShowPerformanceReminder(false)}
        user={user}
        agentPerformance={h.agentPerformance}
        myActiveTicketsCount={h.myActiveTicketsCount}
        myOverdueTicketsCount={h.myOverdueTicketsCount}
      />

    </div>
  );
}
