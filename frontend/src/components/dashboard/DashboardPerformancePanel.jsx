import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import { Award, Clock, Building2, Activity, Info, X, Gauge, Timer, BarChart2 } from 'lucide-react';
import ReactLoader from '../ReactLoader';
import { MONTHS, YEARS, getSlaColor, buildSelectStyles } from './constants';

const yearOptions = YEARS.map(y => ({ value: y, label: y }));

export default function DashboardPerformancePanel({
  timeframedLeaderboard, prevMonthLeaderboard = [], perfLoading,
  selectedMonth, setSelectedMonth,
  selectedYear, setSelectedYear,
  darkMode,
}) {
  const selectStyles = buildSelectStyles(darkMode);

  const totalResolved = timeframedLeaderboard.reduce((acc, a) => acc + a.metrics.resolvedTickets, 0);
  const totalAssigned = timeframedLeaderboard.reduce((acc, a) => acc + (a.metrics.totalTickets || a.metrics.resolvedTickets), 0);
  const prevTotal = prevMonthLeaderboard.reduce((acc, a) => acc + (a.metrics.totalTickets || a.metrics.resolvedTickets), 0);
  const curTotal = totalAssigned > 0 ? totalAssigned : totalResolved;
  const diffPercent = prevTotal > 0 ? Math.round(((curTotal - prevTotal) / prevTotal) * 100) : 0;
  const totalSlaMet = timeframedLeaderboard.reduce((acc, a) => acc + a.metrics.slaMet, 0);
  const teamComplianceRate = totalResolved > 0 ? Math.round((totalSlaMet / totalResolved) * 100) : 100;

  const totalResponseSlaMet = timeframedLeaderboard.reduce((acc, a) => acc + (a.metrics.responseSlaMet || 0), 0);
  const totalResponseSlaTotal = timeframedLeaderboard.reduce((acc, a) => acc + (a.metrics.responseSlaTotal || 0), 0);
  const teamResponseComplianceRate = totalResponseSlaTotal > 0 ? Math.round((totalResponseSlaMet / totalResponseSlaTotal) * 100) : 100;

  const hasRawResponse = timeframedLeaderboard.some(a => a.metrics.respondedCount !== undefined);
  let avgTeamResponse = 0;
  if (hasRawResponse) {
    const totalMs = timeframedLeaderboard.reduce((acc, a) => acc + (a.metrics.totalResponseMs || 0), 0);
    const totalCount = timeframedLeaderboard.reduce((acc, a) => acc + (a.metrics.respondedCount || 0), 0);
    avgTeamResponse = totalCount > 0 ? Math.round(totalMs / totalCount / 1000 / 60) : 0;
  } else {
    const withResponse = timeframedLeaderboard.filter(a => a.metrics.avgResponseMin > 0);
    avgTeamResponse = withResponse.length > 0 ? Math.round(withResponse.reduce((acc, a) => acc + a.metrics.avgResponseMin, 0) / withResponse.length) : 0;
  }

  const hasRawResolution = timeframedLeaderboard.some(a => a.metrics.resolvedCountWithTime !== undefined);
  let avgTeamResolution = 0;
  if (hasRawResolution) {
    const totalMs = timeframedLeaderboard.reduce((acc, a) => acc + (a.metrics.totalResolutionMs || 0), 0);
    const totalCount = timeframedLeaderboard.reduce((acc, a) => acc + (a.metrics.resolvedCountWithTime || 0), 0);
    avgTeamResolution = totalCount > 0 ? parseFloat((totalMs / totalCount / 1000 / 60 / 60).toFixed(1)) : 0;
  } else {
    const withResolution = timeframedLeaderboard.filter(a => a.metrics.avgResolutionHour > 0);
    avgTeamResolution = withResolution.length > 0 ? parseFloat((withResolution.reduce((acc, a) => acc + a.metrics.avgResolutionHour, 0) / withResolution.length).toFixed(1)) : 0;
  }

  const topAgent = timeframedLeaderboard.length > 0 && timeframedLeaderboard[0].metrics.resolvedTickets > 0 ? timeframedLeaderboard[0] : null;

  const [resolutionRulesOpen, setResolutionRulesOpen] = useState(false);
  const [responseRulesOpen, setResponseRulesOpen] = useState(false);

  return (
    <div className="bg-gradient-to-br from-white/90 to-slate-50/50 dark:from-slate-900/70 dark:to-slate-950/20 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-[0_8px_30px_rgb(0,0,0,0.015)] animate-scale-up relative z-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-500" />
            IT Agents Performance Overview (KPI)
          </h4>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Summary of support agent performance metrics and top performer.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
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
        </div>
      </div>

      {perfLoading ? (
        <ReactLoader size="sm" text="Syncing KPI metrics..." />
      ) : timeframedLeaderboard.length === 0 ? (
        <div className="py-10 text-center text-xs text-gray-500 dark:text-slate-500">
          No performance data recorded for this period.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

          <div className="group stagger-1 p-5 bg-white dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex flex-col justify-between shadow-sm hover:scale-[1.01] transition-all duration-300">
            <div>
              <p className="text-[10px] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider">Total Tiket Bulan Ini</p>
              <h4 className="text-2xl font-black text-gray-800 dark:text-slate-100 mt-2 transition-transform duration-300 group-hover:translate-x-1">
                {totalAssigned > 0 ? totalAssigned : totalResolved} <span className="text-xs font-bold text-gray-400">Tiket</span>
              </h4>
            </div>
            <p className="text-[10px] mt-4 font-extrabold flex items-center gap-1.5">
              {diffPercent > 0 ? (
                <span className="text-emerald-500">↑ {diffPercent}%</span>
              ) : diffPercent < 0 ? (
                <span className="text-rose-500">↓ {Math.abs(diffPercent)}%</span>
              ) : (
                <span className="text-gray-400">— 0%</span>
              )}
              <span className="text-gray-400 font-semibold">vs bulan lalu ({prevTotal} tiket)</span>
            </p>
          </div>

          <div className="group stagger-2 p-5 bg-white dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex flex-col justify-between shadow-sm hover:scale-[1.01] transition-all duration-300">
            <div>
              <p className="text-[10px] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider">Team SLA Compliance</p>
              <h4 className={`text-2xl font-black mt-2 transition-transform duration-300 group-hover:translate-x-1 ${getSlaColor(teamComplianceRate)}`}>
                {teamComplianceRate}%
              </h4>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full shimmer-bar ${teamComplianceRate >= 90 ? 'bg-emerald-500' : teamComplianceRate >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${teamComplianceRate}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 font-medium shrink-0">resolved</span>
            </div>
          </div>

          <div
            className="group stagger-3 p-5 bg-white dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex flex-col justify-between shadow-sm hover:scale-[1.01] hover:border-cyan-300/40 dark:hover:border-cyan-800/40 transition-all duration-300 cursor-pointer select-none"
            onClick={() => setResponseRulesOpen(true)}
            title="Klik untuk lihat rules & metric"
          >
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider">Avg Team Response</p>
                <Info className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600 group-hover:text-cyan-400 transition-colors duration-200" />
              </div>
              <h4 className="text-2xl font-black text-gray-800 dark:text-slate-100 mt-2 transition-transform duration-300 group-hover:translate-x-1">
                {avgTeamResponse > 0 ? `${avgTeamResponse} min` : '0 min'}
              </h4>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`text-xs font-bold ${teamResponseComplianceRate >= 90 ? 'text-emerald-600 dark:text-emerald-400' : teamResponseComplianceRate >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                  {teamResponseComplianceRate}% On-Time
                </span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500">({totalResponseSlaMet}/{totalResponseSlaTotal} tiket)</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-4 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 text-brand-500" />
              Response SLA compliance bulan ini
            </p>
          </div>

          {/* Response Rules Popup Modal */}
          {responseRulesOpen && createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
              onClick={() => setResponseRulesOpen(false)}
            >
              <div className="absolute inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-sm" />
              <div
                className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-sm overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-500" />
                    <span className="font-extrabold text-sm text-gray-800 dark:text-slate-100">Avg Team Response</span>
                  </div>
                  <button
                    onClick={() => setResponseRulesOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-5 py-4 space-y-4 text-[11px]">

                  {/* Formula */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Gauge className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      <span className="font-extrabold text-[10px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Formula</span>
                    </div>
                    <p className="text-gray-500 dark:text-slate-400 leading-relaxed">
                      Rata-rata waktu dari tiket dibuat hingga pertama kali direspons oleh agent (field <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">respondedAt</span> diisi).
                    </p>
                    <div className="mt-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg font-mono text-[10px] text-gray-500 dark:text-slate-400">
                      avg( respondedAt − createdAt )
                    </div>
                  </div>

                  {/* Benchmarks */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <BarChart2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      <span className="font-extrabold text-[10px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Target Benchmark</span>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { label: '≤ 15 menit', desc: 'Excellent — Speed Racer', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
                        { label: '15 – 60 menit', desc: 'Good', dot: 'bg-amber-400', text: 'text-amber-600 dark:text-amber-400' },
                        { label: '1 – 4 jam', desc: 'Needs Improvement', dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
                        { label: '> 4 jam', desc: 'Critical', dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
                      ].map(b => (
                        <div key={b.label} className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${b.dot}`} />
                          <span className={`font-bold w-24 shrink-0 ${b.text}`}>{b.label}</span>
                          <span className="text-gray-400 dark:text-slate-500">{b.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SLA Response Limits */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Timer className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      <span className="font-extrabold text-[10px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400">SLA Response Limit per Prioritas</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                      {[
                        { priority: 'CRITICAL', limit: '15 menit', bg: 'bg-red-50 dark:bg-red-950/20', color: 'text-red-600 dark:text-red-400' },
                        { priority: 'HIGH', limit: '1 jam', bg: 'bg-orange-50 dark:bg-orange-950/20', color: 'text-orange-600 dark:text-orange-400' },
                        { priority: 'MEDIUM', limit: '4 jam', bg: 'bg-amber-50 dark:bg-amber-950/20', color: 'text-amber-600 dark:text-amber-400' },
                        { priority: 'LOW', limit: '8 jam', bg: 'bg-slate-50 dark:bg-slate-800/40', color: 'text-slate-500 dark:text-slate-400' },
                      ].map((s, i, arr) => (
                        <div key={s.priority} className={`flex justify-between items-center px-3 py-2 ${s.bg} ${i < arr.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}>
                          <span className={`font-extrabold ${s.color}`}>{s.priority}</span>
                          <span className="text-gray-500 dark:text-slate-400 font-medium">{s.limit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KPI Weight */}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-cyan-50 dark:bg-cyan-950/20 rounded-xl border border-cyan-100 dark:border-cyan-900/40">
                    <span className="text-gray-500 dark:text-slate-400 font-medium">Bobot KPI Score</span>
                    <span className="font-extrabold text-cyan-600 dark:text-cyan-400">Response SLA = 25%</span>
                  </div>

                </div>
              </div>
            </div>,
            document.body
          )}

          <div
            className="group stagger-4 p-5 bg-white dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex flex-col justify-between shadow-sm hover:scale-[1.01] hover:border-indigo-300/40 dark:hover:border-indigo-800/40 transition-all duration-300 cursor-pointer select-none"
            onClick={() => setResolutionRulesOpen(true)}
            title="Klik untuk lihat rules & metric"
          >
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-gray-450 dark:text-slate-400 uppercase tracking-wider">Avg Team Resolution</p>
                <Info className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors duration-200" />
              </div>
              <h4 className="text-2xl font-black text-gray-800 dark:text-slate-100 mt-2 transition-transform duration-300 group-hover:translate-x-1">
                {avgTeamResolution > 0 ? `${avgTeamResolution} hrs` : '0 hrs'}
              </h4>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`text-xs font-bold ${teamComplianceRate >= 90 ? 'text-emerald-600 dark:text-emerald-400' : teamComplianceRate >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                  {teamComplianceRate}% On-Time
                </span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500">({totalSlaMet}/{totalResolved} tiket)</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-4 font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110 text-indigo-500 animate-pulse" />
              SLA compliance bulan ini
            </p>
          </div>

          {/* Resolution Rules Popup Modal */}
          {resolutionRulesOpen && createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
              onClick={() => setResolutionRulesOpen(false)}
            >
              <div className="absolute inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-sm" />
              <div
                className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-sm overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    <span className="font-extrabold text-sm text-gray-800 dark:text-slate-100">Avg Team Resolution</span>
                  </div>
                  <button
                    onClick={() => setResolutionRulesOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-5 py-4 space-y-4 text-[11px]">

                  {/* Formula */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Gauge className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="font-extrabold text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Formula</span>
                    </div>
                    <p className="text-gray-500 dark:text-slate-400 leading-relaxed">
                      Rata-rata waktu aktif penyelesaian tiket RESOLVED/CLOSED. Waktu jeda status PENDING dikurangi otomatis.
                    </p>
                    <div className="mt-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg font-mono text-[10px] text-gray-500 dark:text-slate-400">
                      avg( resolvedAt − createdAt − pausedMs )
                    </div>
                  </div>

                  {/* Benchmarks */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <BarChart2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="font-extrabold text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Target Benchmark</span>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { label: '≤ 4 jam', desc: 'Excellent — Rapid Closer', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
                        { label: '4 – 8 jam', desc: 'Good', dot: 'bg-amber-400', text: 'text-amber-600 dark:text-amber-400' },
                        { label: '8 – 24 jam', desc: 'Needs Improvement', dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
                        { label: '> 24 jam', desc: 'Critical', dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
                      ].map(b => (
                        <div key={b.label} className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${b.dot}`} />
                          <span className={`font-bold w-20 shrink-0 ${b.text}`}>{b.label}</span>
                          <span className="text-gray-400 dark:text-slate-500">{b.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SLA Limits */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Timer className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="font-extrabold text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">SLA Resolution Limit per Prioritas</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                      {[
                        { priority: 'CRITICAL', limit: '4 jam', bg: 'bg-red-50 dark:bg-red-950/20', color: 'text-red-600 dark:text-red-400' },
                        { priority: 'HIGH', limit: '1 hari kerja', bg: 'bg-orange-50 dark:bg-orange-950/20', color: 'text-orange-600 dark:text-orange-400' },
                        { priority: 'MEDIUM', limit: '3 hari kerja', bg: 'bg-amber-50 dark:bg-amber-950/20', color: 'text-amber-600 dark:text-amber-400' },
                        { priority: 'LOW', limit: '5 hari kerja', bg: 'bg-slate-50 dark:bg-slate-800/40', color: 'text-slate-500 dark:text-slate-400' },
                      ].map((s, i, arr) => (
                        <div key={s.priority} className={`flex justify-between items-center px-3 py-2 ${s.bg} ${i < arr.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}>
                          <span className={`font-extrabold ${s.color}`}>{s.priority}</span>
                          <span className="text-gray-500 dark:text-slate-400 font-medium">{s.limit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KPI Weight */}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                    <span className="text-gray-500 dark:text-slate-400 font-medium">Bobot KPI Score</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">Resolution SLA = 35%</span>
                  </div>

                </div>
              </div>
            </div>,
            document.body
          )}

          <div className="group stagger-5 p-5 bg-gradient-to-br from-brand-50/50 to-brand-100/20 dark:from-brand-950/20 dark:to-brand-900/10 border border-brand-200/35 dark:border-brand-900/30 rounded-2xl flex flex-col justify-between shadow-sm hover:scale-[1.01] transition-all duration-300">
            <div>
              <p className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="inline-block animate-float text-sm">🏆</span>
                Spotlight Agent
              </p>
              {topAgent ? (
                <div className="flex items-center gap-2.5 mt-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-brand-500/20 shrink-0">
                    {topAgent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-gray-850 dark:text-slate-100 truncate">{topAgent.name}</h4>
                    <p className="text-[9px] text-gray-400 dark:text-slate-400 truncate mt-0.5">{topAgent.companyName}</p>
                  </div>
                </div>
              ) : (
                <h4 className="text-xs italic text-gray-500 mt-3">No active performer</h4>
              )}
            </div>
            {topAgent && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold mt-4 flex items-center gap-1">
                <span className="animate-ping w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {topAgent.metrics.complianceRate}% SLA ({topAgent.metrics.resolvedTickets} tix)
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
