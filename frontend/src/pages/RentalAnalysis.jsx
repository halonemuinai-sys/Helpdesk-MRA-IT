import React from 'react';
import { TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import ReactLoader from '../components/ReactLoader';
import useRentalAnalysis from '../hooks/useRentalAnalysis';
import { CATEGORIES, SECTORS } from '../components/rental/constants';
import RentalKpiStats from '../components/rental/RentalKpiStats';
import RentalSvgChart from '../components/rental/RentalSvgChart';
import RentalMonthlyTable from '../components/rental/RentalMonthlyTable';
import RentalBudgetTable from '../components/rental/RentalBudgetTable';
import RentalBreakdownModal from '../components/rental/RentalBreakdownModal';
import RentalEditUserModal from '../components/rental/RentalEditUserModal';
import RentalEditCompanyModal from '../components/rental/RentalEditCompanyModal';

const YEARS = ['2026', '2025', '2024'];

export default function RentalAnalysis({ token }) {
  const {
    loading, error,
    companyStats, monthlyTotals,
    selectedYear, setSelectedYear,
    selectedCategory, setSelectedCategory,
    selectedSector, setSelectedSector,
    grandTotalDevices, grandTotalBudget, grandTotalCost, grandTotalDifference, grandTotalUtilization,
    isBreakdownModalOpen, setIsBreakdownModalOpen, breakdownCompany, handleOpenBreakdown,
    isEditUserModalOpen, setIsEditUserModalOpen,
    editingUser, editingUserBudget, setEditingUserBudget,
    savingBudget, handleOpenEditUser, handleUserBudgetSubmit,
    isEditCompanyModalOpen, setIsEditCompanyModalOpen,
    editingCompany, editingCompanyBudget, setEditingCompanyBudget,
    editingCompanySharedBudget, setEditingCompanySharedBudget,
    handleOpenEditCompany, handleCompanyBudgetSubmit,
    onExportExcel,
    formatDateDMY, formatNumber, formatCurrency, formatNumberForInput,
  } = useRentalAnalysis({ token });

  if (loading && companyStats.length === 0) return <ReactLoader />;

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 flex items-center gap-3 text-xs">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <div>
          <p className="font-bold">Error Terjadi</p>
          <p className="text-[11px]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(244, 63, 94, 0.2); }
          50% { box-shadow: 0 0 20px rgba(244, 63, 94, 0.45); }
        }
        @keyframes drawPath {
          to { stroke-dashoffset: 0; }
        }
        @keyframes scaleBar {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .dark .glass-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(12px);
          border-color: rgba(30, 41, 59, 0.8);
        }
        .glow-border:hover {
          border-color: rgba(244, 63, 94, 0.4) !important;
          box-shadow: 0 10px 25px -5px rgba(244, 63, 94, 0.08);
          transform: translateY(-2px);
          transition: all 0.25s ease;
        }
        .active-glow { animation: pulseGlow 3s infinite ease-in-out; }
        .gradient-text {
          background: linear-gradient(135deg, #f43f5e 0%, #d946ef 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .custom-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(244, 63, 94, 0.25); border-radius: 99px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(244, 63, 94, 0.45); }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Analisa Biaya Sewa</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold mt-0.5">
              Proyeksi pengeluaran bulanan dan efisiensi anggaran sewa perangkat
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-850 rounded-2xl px-3 py-1.5 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Grup:</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer hover:text-rose-500 transition"
            >
              {SECTORS.map(s => (
                <option key={s.value} className="dark:bg-slate-950" value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-850 rounded-2xl px-3 py-1.5 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer hover:text-rose-500 transition"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} className="dark:bg-slate-950" value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-850 rounded-2xl px-3 py-1.5 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer hover:text-rose-500 transition"
            >
              {YEARS.map(y => (
                <option key={y} className="dark:bg-slate-950" value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-sm shadow-emerald-500/10 transition-all duration-150"
            title="Download Laporan Excel"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download Excel</span>
          </button>
        </div>
      </div>

      <RentalKpiStats
        grandTotalCost={grandTotalCost}
        grandTotalBudget={grandTotalBudget}
        grandTotalDifference={grandTotalDifference}
        grandTotalDevices={grandTotalDevices}
        grandTotalUtilization={grandTotalUtilization}
        formatCurrency={formatCurrency}
        formatNumber={formatNumber}
      />

      <RentalSvgChart
        monthlyTotals={monthlyTotals}
        selectedYear={selectedYear}
        formatCurrency={formatCurrency}
        formatNumber={formatNumber}
      />

      <RentalMonthlyTable
        companyStats={companyStats}
        monthlyTotals={monthlyTotals}
        formatNumber={formatNumber}
        formatCurrency={formatCurrency}
        onOpenBreakdown={handleOpenBreakdown}
      />

      <RentalBudgetTable
        companyStats={companyStats}
        grandTotalDevices={grandTotalDevices}
        grandTotalBudget={grandTotalBudget}
        grandTotalCost={grandTotalCost}
        grandTotalDifference={grandTotalDifference}
        grandTotalUtilization={grandTotalUtilization}
        formatCurrency={formatCurrency}
        formatNumber={formatNumber}
        formatNumberForInput={formatNumberForInput}
        onOpenBreakdown={handleOpenBreakdown}
        onEditCompany={handleOpenEditCompany}
        onEditUser={handleOpenEditUser}
      />

      <RentalBreakdownModal
        isOpen={isBreakdownModalOpen}
        company={breakdownCompany}
        onClose={() => setIsBreakdownModalOpen(false)}
        formatCurrency={formatCurrency}
        formatDateDMY={formatDateDMY}
        selectedYear={selectedYear}
      />

      <RentalEditUserModal
        isOpen={isEditUserModalOpen}
        editingUser={editingUser}
        editingUserBudget={editingUserBudget}
        setEditingUserBudget={setEditingUserBudget}
        savingBudget={savingBudget}
        onClose={() => setIsEditUserModalOpen(false)}
        onSubmit={handleUserBudgetSubmit}
        formatNumberForInput={formatNumberForInput}
      />

      <RentalEditCompanyModal
        isOpen={isEditCompanyModalOpen}
        editingCompany={editingCompany}
        editingCompanyBudget={editingCompanyBudget}
        setEditingCompanyBudget={setEditingCompanyBudget}
        editingCompanySharedBudget={editingCompanySharedBudget}
        setEditingCompanySharedBudget={setEditingCompanySharedBudget}
        savingBudget={savingBudget}
        onClose={() => setIsEditCompanyModalOpen(false)}
        onSubmit={handleCompanyBudgetSubmit}
        formatCurrency={formatCurrency}
        formatNumberForInput={formatNumberForInput}
      />
    </div>
  );
}
