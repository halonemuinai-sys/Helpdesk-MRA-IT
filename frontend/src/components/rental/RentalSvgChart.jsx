import React, { useState } from 'react';
import { MONTH_NAMES } from './constants';

const CHART_HEIGHT = 220;
const CHART_WIDTH = 920;
const PAD_LEFT = 70;
const PAD_RIGHT = 30;
const PAD_TOP = 20;
const PAD_BOTTOM = 30;
const GRID_LEVELS = 5;
const TOTAL_W = CHART_WIDTH + PAD_LEFT + PAD_RIGHT;
const TOTAL_H = CHART_HEIGHT + PAD_TOP + PAD_BOTTOM;

export default function RentalSvgChart({ monthlyTotals, selectedYear, formatCurrency, formatNumber }) {
  const [chartType, setChartType] = useState('line');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const maxVal = Math.max(...monthlyTotals, 1000000);
  const maxCost = Math.max(...monthlyTotals);
  const minCost = Math.min(...monthlyTotals);
  const maxCostIdx = monthlyTotals.indexOf(maxCost);
  const minCostIdx = monthlyTotals.indexOf(minCost);
  const avgMonthly = monthlyTotals.reduce((s, v) => s + v, 0) / 12;

  const points = monthlyTotals.map((val, idx) => ({
    x: PAD_LEFT + idx * (CHART_WIDTH / 11),
    y: PAD_TOP + CHART_HEIGHT - (val / maxVal) * CHART_HEIGHT,
    value: val,
    month: MONTH_NAMES[idx],
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${PAD_TOP + CHART_HEIGHT} L ${points[0].x} ${PAD_TOP + CHART_HEIGHT} Z`
    : '';

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-sm relative group/chart">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Proyeksi Arus Kas Pengeluaran Sewa</h3>
          <p className="text-[10px] text-gray-405 dark:text-slate-500 font-semibold mt-0.5">Visualisasi proyeksi biaya bulanan selama tahun {selectedYear}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shadow-inner border border-slate-200/20">
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition duration-150 ${chartType === 'line' ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-sm' : 'text-gray-450 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Line
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition duration-150 ${chartType === 'bar' ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-sm' : 'text-gray-450 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Bar
            </button>
          </div>
          <div className="text-right border-l border-slate-200/50 dark:border-slate-800/80 pl-3">
            <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Total Rata-rata:</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
              {formatCurrency(avgMonthly)}/bln
            </span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto custom-scroll pb-2 relative">
        <svg viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`} className="w-full min-w-[800px] overflow-visible">
          <defs>
            <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="chartLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="chartBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {Array.from({ length: GRID_LEVELS }).map((_, idx) => {
            const fraction = idx / (GRID_LEVELS - 1);
            const val = maxVal * fraction;
            const y = PAD_TOP + CHART_HEIGHT - fraction * CHART_HEIGHT;
            return (
              <g key={idx} className="opacity-60">
                <line x1={PAD_LEFT} y1={y} x2={PAD_LEFT + CHART_WIDTH} y2={y} stroke="currentColor" strokeDasharray="5 5" className="text-slate-100 dark:text-slate-850" />
                <text x={PAD_LEFT - 12} y={y + 4} textAnchor="end" className="text-[9px] font-black fill-gray-400 dark:fill-slate-500 font-mono">
                  {val >= 1000000 ? `${(val / 1000000).toFixed(1)}jt` : formatNumber(val)}
                </text>
              </g>
            );
          })}

          {/* Line chart */}
          {chartType === 'line' && (
            <>
              {areaPath && <path key={`area-${selectedYear}`} d={areaPath} fill="url(#chartAreaGradient)" className="animate-fade-in" />}
              {linePath && <path key={`shadow-${selectedYear}`} d={linePath} fill="none" stroke="#f43f5e" strokeWidth="8" opacity="0.12" strokeLinecap="round" strokeLinejoin="round" className="animate-fade-in" />}
              {linePath && (
                <path key={`line-${selectedYear}`} d={linePath} fill="none" stroke="url(#chartLineGradient)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ strokeDasharray: '2000', strokeDashoffset: '2000', animation: 'drawPath 1.8s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
                />
              )}
              {maxCostIdx !== -1 && (
                <g className="opacity-90 animate-fade-in">
                  <rect x={points[maxCostIdx].x - 20} y={points[maxCostIdx].y - 24} width="40" height="13" rx="4" fill="#f43f5e" />
                  <text x={points[maxCostIdx].x} y={points[maxCostIdx].y - 15} textAnchor="middle" fill="#ffffff" className="text-[7px] font-black uppercase tracking-wider">Puncak</text>
                </g>
              )}
              {minCostIdx !== -1 && minCost > 0 && (
                <g className="opacity-90 animate-fade-in">
                  <rect x={points[minCostIdx].x - 20} y={points[minCostIdx].y - 24} width="40" height="13" rx="4" fill="#0ea5e9" />
                  <text x={points[minCostIdx].x} y={points[minCostIdx].y - 15} textAnchor="middle" fill="#ffffff" className="text-[7px] font-black uppercase tracking-wider">Terendah</text>
                </g>
              )}
            </>
          )}

          {/* Bar chart */}
          {chartType === 'bar' && (
            <g className="animate-fade-in">
              {points.map((p, idx) => {
                const barWidth = 36;
                const colH = (p.value / maxVal) * CHART_HEIGHT;
                const isHov = hoveredIdx === idx;
                return (
                  <rect key={idx} x={p.x - barWidth / 2} y={PAD_TOP + CHART_HEIGHT - colH} width={barWidth} height={colH} rx="7"
                    fill={isHov ? 'url(#chartLineGradient)' : 'url(#chartBarGradient)'} opacity={isHov ? '1' : '0.75'}
                    style={{ transformOrigin: `${p.x}px ${PAD_TOP + CHART_HEIGHT}px`, animation: 'scaleBar 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
                    className="transition-all duration-200"
                  />
                );
              })}
            </g>
          )}

          {/* Hover guide line */}
          {hoveredIdx !== null && (
            <line x1={points[hoveredIdx].x} y1={PAD_TOP} x2={points[hoveredIdx].x} y2={PAD_TOP + CHART_HEIGHT}
              stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.55" className="pointer-events-none animate-fade-in"
            />
          )}

          {/* Line chart dots + month labels */}
          {chartType === 'line' && points.map((p, idx) => {
            const isHov = hoveredIdx === idx;
            return (
              <g key={idx} className="pointer-events-none">
                {isHov && <circle cx={p.x} cy={p.y} r="9.5" fill="#f43f5e" opacity="0.3" className="animate-ping" />}
                <circle cx={p.x} cy={p.y} r={isHov ? '6' : '3.5'} fill={isHov ? '#f43f5e' : '#ffffff'} stroke="#f43f5e" strokeWidth="2.5" className="transition-all duration-150" />
                <text x={p.x} y={PAD_TOP + CHART_HEIGHT + 20} textAnchor="middle"
                  className={`text-[9px] font-black transition-all ${isHov ? 'fill-rose-500' : 'fill-gray-450 dark:fill-slate-450'}`}
                >{p.month}</text>
              </g>
            );
          })}

          {/* Bar month labels */}
          {chartType === 'bar' && points.map((p, idx) => (
            <text key={idx} x={p.x} y={PAD_TOP + CHART_HEIGHT + 20} textAnchor="middle"
              className={`text-[9px] font-black transition-all ${hoveredIdx === idx ? 'fill-rose-500' : 'fill-gray-450 dark:fill-slate-450'}`}
            >{p.month}</text>
          ))}

          {/* Invisible hover capture columns */}
          {points.map((p, idx) => {
            const colWidth = CHART_WIDTH / 11;
            return (
              <rect key={idx} x={p.x - colWidth / 2} y={PAD_TOP} width={colWidth} height={CHART_HEIGHT}
                fill="transparent" className="cursor-pointer pointer-events-auto"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Floating tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute pointer-events-none bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl text-white transition-all duration-150 ease-out z-20 animate-scale-up"
            style={{ left: `${(points[hoveredIdx].x / TOTAL_W) * 100}%`, top: `${(points[hoveredIdx].y / TOTAL_H) * 100}%`, transform: 'translate(-50%, -120%)' }}
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-[9px] font-black uppercase text-rose-450 tracking-wider">{points[hoveredIdx].month} {selectedYear}</span>
            </div>
            <div className="text-xs font-black font-mono mt-1 text-slate-100">{formatCurrency(points[hoveredIdx].value)}</div>
            <div className="border-t border-slate-800/80 mt-1.5 pt-1 flex items-center justify-between gap-4 text-[8px] font-bold text-slate-400">
              <span>Rata-rata:</span>
              <span className={points[hoveredIdx].value > avgMonthly ? 'text-rose-500 font-extrabold' : 'text-emerald-500 font-extrabold'}>
                {points[hoveredIdx].value > avgMonthly
                  ? `▲ +${Math.round((points[hoveredIdx].value / avgMonthly - 1) * 100)}%`
                  : `▼ -${Math.round((1 - points[hoveredIdx].value / avgMonthly) * 100)}%`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
