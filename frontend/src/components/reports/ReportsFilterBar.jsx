import React from 'react';
import { BarChart3, Building2, Clock, FileText } from 'lucide-react';
import Select from 'react-select';
import { MONTHS, YEARS, buildSelectStyles } from './constants';

export default function ReportsFilterBar({
  user, companies, selectedCompanyId, setSelectedCompanyId,
  selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,
  darkMode, hasData, onExport,
}) {
  const selectStyles = buildSelectStyles(darkMode);
  const yearOptions = YEARS.map(y => ({ value: y, label: y }));

  return (
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

      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto z-20">
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
                <option key={comp.id} value={comp.id}>{comp.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400 shrink-0" />
          <Select
            value={MONTHS.find(m => m.value === selectedMonth)}
            onChange={(opt) => setSelectedMonth(opt ? opt.value : 'ALL')}
            options={MONTHS}
            styles={selectStyles}
            isSearchable={false}
            menuPortalTarget={document.body}
          />
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
          <Select
            value={yearOptions.find(y => y.value === selectedYear)}
            onChange={(opt) => setSelectedYear(opt ? opt.value : '2026')}
            options={yearOptions}
            styles={selectStyles}
            isSearchable={false}
            menuPortalTarget={document.body}
          />
        </div>

        {hasData && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-[0_0_20px_5px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <FileText className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        )}
      </div>
    </div>
  );
}
