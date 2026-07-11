import React, { useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';

const DAYS = [
  { label: 'Minggu', index: 0 },
  { label: 'Senin', index: 1 },
  { label: 'Selasa', index: 2 },
  { label: 'Rabu', index: 3 },
  { label: 'Kamis', index: 4 },
  { label: 'Jumat', index: 5 },
  { label: 'Sabtu', index: 6 }
];

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]; // 08:00 to 17:00

export default function DashboardSlaHeatmap({ analytics }) {
  const [tooltip, setTooltip] = useState(null);

  if (!analytics || !analytics.tickets) {
    return null;
  }

  // 1. Initialize matrix
  const matrix = {};
  DAYS.forEach(d => {
    matrix[d.index] = {};
    HOURS.forEach(h => {
      matrix[d.index][h] = {
        total: 0,
        breached: 0
      };
    });
  });

  // 2. Populate matrix with ticket data
  analytics.tickets.forEach(ticket => {
    const date = new Date(ticket.createdAt);
    const day = date.getDay();
    const hour = date.getHours();

    // Only count if within working hours range
    if (matrix[day] && matrix[day][hour] !== undefined) {
      matrix[day][hour].total++;
      if (ticket.isSlaBreached) {
        matrix[day][hour].breached++;
      }
    }
  });

  // Helper to determine background color based on breach count and intensity
  const getCellColorClass = (cell) => {
    if (cell.total === 0) {
      return 'bg-gray-50/40 dark:bg-slate-900/10 border-gray-100 dark:border-slate-850/20 text-gray-300 dark:text-slate-700';
    }
    if (cell.breached === 0) {
      return 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/10 dark:border-emerald-500/5 text-emerald-500 hover:scale-105';
    }
    if (cell.breached <= 1) {
      return 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/10 dark:border-amber-500/5 text-amber-500 hover:scale-105';
    }
    if (cell.breached <= 3) {
      return 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/10 dark:border-orange-500/5 text-orange-500 hover:scale-105';
    }
    return 'bg-rose-500/25 hover:bg-rose-500/35 border-rose-500/10 dark:border-rose-500/5 text-rose-500 hover:scale-105 active-glow';
  };

  const handleMouseEnter = (e, dayLabel, hour, cell) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const risk = cell.total > 0 ? Math.round((cell.breached / cell.total) * 100) : 0;
    setTooltip({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 8,
      dayLabel,
      hour: `${String(hour).padStart(2, '0')}:00`,
      total: cell.total,
      breached: cell.breached,
      risk
    });
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-sm relative overflow-visible">
      {/* Title */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rose-500" />
            Heatmap Risiko Pelanggaran SLA
          </h3>
          <p className="text-[10px] text-gray-405 dark:text-slate-500 font-semibold mt-0.5">
            Distribusi kepadatan tiket breached berdasarkan hari & jam pembuatan tiket
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-150 dark:bg-slate-900 border border-slate-200/10" /> Kosong</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/15" /> Aman</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500/20" /> Rendah</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-500/25" /> Sedang</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/30 animate-pulse" /> Tinggi</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="w-full overflow-x-auto custom-scroll pb-2">
        <div className="min-w-[700px] space-y-2">
          {/* Hour Headers */}
          <div className="grid grid-cols-11 gap-2 items-center text-center">
            <div className="text-left text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider pl-2">
              Hari / Jam
            </div>
            {HOURS.map(h => (
              <div key={h} className="text-[9px] font-black text-gray-400 dark:text-slate-500 font-mono">
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          {DAYS.map(d => (
            <div key={d.index} className="grid grid-cols-11 gap-2 items-center text-center">
              {/* Day Label */}
              <div className="text-left text-xs font-bold text-slate-700 dark:text-slate-300 pl-2">
                {d.label}
              </div>
              {/* Heatmap cells */}
              {HOURS.map(h => {
                const cell = matrix[d.index][h];
                const colorClass = getCellColorClass(cell);
                return (
                  <div
                    key={h}
                    onMouseEnter={(e) => handleMouseEnter(e, d.label, h, cell)}
                    onMouseLeave={() => setTooltip(null)}
                    className={`h-9 border rounded-xl flex items-center justify-center font-mono font-black text-xs transition-all duration-200 cursor-crosshair ${colorClass}`}
                  >
                    {cell.breached > 0 ? cell.breached : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Tooltip Portal */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-slate-900/95 dark:bg-slate-950/98 text-white p-3 rounded-2xl border border-slate-800 shadow-xl text-xs space-y-1.5 animate-scale-up min-w-[160px]"
          style={{
            left: `${tooltip.x - 80}px`,
            top: `${tooltip.y - 120}px`
          }}
        >
          <div className="border-b border-slate-800 pb-1.5 flex justify-between items-center">
            <span className="font-black text-[10px] uppercase tracking-wider text-rose-500">{tooltip.dayLabel}</span>
            <span className="font-mono text-[10px] font-black text-slate-400">{tooltip.hour}</span>
          </div>
          <div className="space-y-1 text-[11px] font-semibold">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Tiket:</span>
              <span className="font-bold">{tooltip.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Terlanggar SLA:</span>
              <span className="font-bold text-rose-455">{tooltip.breached}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800/50 pt-1.5 font-bold text-xs">
              <span className="text-slate-350">Indeks Risiko:</span>
              <span className={tooltip.risk > 50 ? 'text-rose-500' : tooltip.risk > 0 ? 'text-amber-500' : 'text-emerald-500'}>
                {tooltip.risk}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
