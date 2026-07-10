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

export default function Dashboard({ user, token, darkMode }) {
  const h = useDashboard({ user, token });

  if (h.loading && !h.analytics) {
    return <ReactLoader size="lg" text="Loading Dashboard Operational Data..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">

      <DashboardTopBar
        recentUrgentTickets={h.recentUrgentTickets}
        myOverdueTicketsCount={h.myOverdueTicketsCount}
        expiringSoon={h.expiringSoon}
      />

      {/* Header & Company Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight">Main Dashboard</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">
            IT support operational status and SLA compliance for MRA Group.
          </p>
        </div>
        {user.role !== 'USER' && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-sm">
            <Building2 className="w-4 h-4 text-gray-400" />
            <select
              value={h.selectedCompanyId}
              onChange={(e) => h.setSelectedCompanyId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-700 dark:text-slate-200 focus:outline-none pr-4 cursor-pointer"
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
        <>
          <DashboardPerformancePanel
            timeframedLeaderboard={h.timeframedLeaderboard}
            perfLoading={h.perfLoading}
            selectedMonth={h.selectedMonth} setSelectedMonth={h.setSelectedMonth}
            selectedYear={h.selectedYear} setSelectedYear={h.setSelectedYear}
            darkMode={darkMode}
          />

          <DashboardKpiCards analytics={h.analytics} />

          <DashboardTrendChart analytics={h.analytics} darkMode={darkMode} />

          {/* Main Visual Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardStatusChart analytics={h.analytics} darkMode={darkMode} />
                <DashboardCategoryChart analytics={h.analytics} />
              </div>
              <DashboardPriorityGrid analytics={h.analytics} />
            </div>
            <div className="space-y-6">
              <DashboardUrgentPanel recentUrgentTickets={h.recentUrgentTickets} />
            </div>
          </div>
        </>
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
