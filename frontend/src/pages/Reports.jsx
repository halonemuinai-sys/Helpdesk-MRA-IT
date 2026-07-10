import React from 'react';
import { AlertTriangle } from 'lucide-react';
import ReactLoader from '../components/ReactLoader';
import useReports from '../hooks/useReports';
import ReportsFilterBar from '../components/reports/ReportsFilterBar';
import ReportsKpiCards from '../components/reports/ReportsKpiCards';
import ReportsDistributionRow from '../components/reports/ReportsDistributionRow';
import ReportsDetailsPanels from '../components/reports/ReportsDetailsPanels';
import ReportsCompanyTable from '../components/reports/ReportsCompanyTable';

export default function Reports({ user, token, darkMode }) {
  const h = useReports({ token });

  if (h.loading && !h.data) {
    return <ReactLoader size="lg" text="Generating SLA Analysis Reports..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      <style>{`
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes growWidth { from { width: 0%; } }
        .animate-slide-up-fade { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-grow-width { animation: growWidth 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .delay-1 { animation-delay: 40ms; } .delay-2 { animation-delay: 80ms; }
        .delay-3 { animation-delay: 120ms; } .delay-4 { animation-delay: 160ms; }
        .delay-5 { animation-delay: 200ms; } .delay-6 { animation-delay: 240ms; }
        .delay-7 { animation-delay: 280ms; } .delay-8 { animation-delay: 320ms; }
      `}</style>

      <ReportsFilterBar
        user={user}
        companies={h.companies}
        selectedCompanyId={h.selectedCompanyId}
        setSelectedCompanyId={h.setSelectedCompanyId}
        selectedMonth={h.selectedMonth}
        setSelectedMonth={h.setSelectedMonth}
        selectedYear={h.selectedYear}
        setSelectedYear={h.setSelectedYear}
        darkMode={darkMode}
        hasData={!!h.data}
        onExport={h.onExportExcel}
      />

      {h.error && (
        <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>{h.error}</span>
        </div>
      )}

      {h.data && (
        <div key={`${h.selectedCompanyId}-${h.selectedMonth}-${h.selectedYear}`} className="space-y-8">
          <ReportsKpiCards data={h.data} />
          <ReportsDistributionRow data={h.data} />
          <ReportsDetailsPanels data={h.data} />
          <ReportsCompanyTable data={h.data} />
        </div>
      )}
    </div>
  );
}
