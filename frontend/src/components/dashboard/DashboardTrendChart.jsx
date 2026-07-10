import React, { useState } from 'react';
import { Activity } from 'lucide-react';

const getTrendData = (analytics, trendMode) => {
  if (!analytics || !analytics.tickets) return [];
  const now = new Date();

  if (trendMode === 'daily') {
    const days = [];
    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      days.push({
        label: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        key: d.toISOString().split('T')[0],
        count: 0,
      });
    }
    analytics.tickets.forEach(ticket => {
      const key = new Date(ticket.createdAt).toISOString().split('T')[0];
      const found = days.find(d => d.key === key);
      if (found) found.count++;
    });
    return days;
  }

  const currentYear = now.getFullYear();
  const months = [
    { label: 'Jan', key: 0, count: 0 }, { label: 'Feb', key: 1, count: 0 },
    { label: 'Mar', key: 2, count: 0 }, { label: 'Apr', key: 3, count: 0 },
    { label: 'May', key: 4, count: 0 }, { label: 'Jun', key: 5, count: 0 },
    { label: 'Jul', key: 6, count: 0 }, { label: 'Aug', key: 7, count: 0 },
    { label: 'Sep', key: 8, count: 0 }, { label: 'Oct', key: 9, count: 0 },
    { label: 'Nov', key: 10, count: 0 }, { label: 'Dec', key: 11, count: 0 },
  ];
  analytics.tickets.forEach(ticket => {
    const d = new Date(ticket.createdAt);
    if (d.getFullYear() === currentYear) {
      const found = months.find(m => m.key === d.getMonth());
      if (found) found.count++;
    }
  });
  return months;
};

export default function DashboardTrendChart({ analytics, darkMode }) {
  const [trendMode, setTrendMode] = useState('daily');

  const data = getTrendData(analytics, trendMode);
  if (data.length === 0) return null;

  const width = 600;
  const height = 180;
  const pL = 35, pR = 15, pT = 20, pB = 25;
  const maxVal = Math.max(...data.map(d => d.count), 5);

  const points = data.map((d, i) => ({
    x: pL + (i / (data.length - 1)) * (width - pL - pR),
    y: height - pB - (d.count / maxVal) * (height - pT - pB),
    label: d.label,
    count: d.count,
  }));

  const pathD = points.reduce((acc, p, i) => acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y} `, '');
  const areaD = pathD + `L ${points[points.length - 1].x} ${height - pB} L ${points[0].x} ${height - pB} Z`;

  const gridLines = [];
  for (let i = 0; i <= 3; i++) {
    const y = pT + (i / 3) * (height - pT - pB);
    gridLines.push({ y, value: Math.round(maxVal - (i / 3) * maxVal) });
  }

  return (
    <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm hover:shadow-md transition-all duration-300 mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#06b6d4]" />
            Ticket Volume Trend
          </h4>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Daily and monthly trends of incoming IT support requests.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          {['daily', 'monthly'].map(mode => (
            <button
              key={mode}
              onClick={() => setTrendMode(mode)}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                trendMode === mode
                  ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
            >
              {mode === 'daily' ? 'Harian (15 Hari)' : 'Bulanan (Tahun Ini)'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full">
        <style>{`
          @keyframes drawLine { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
          @keyframes fadeInArea { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scaleUpDot { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          .animate-draw-line { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawLine 1.6s cubic-bezier(0.4,0,0.2,1) forwards; }
          .animate-fade-in-area { animation: fadeInArea 0.8s ease-out 0.8s forwards; }
        `}</style>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {gridLines.map((line, idx) => (
            <g key={idx} className="opacity-30">
              <line x1={pL} y1={line.y} x2={width - pR} y2={line.y} stroke={darkMode ? '#334155' : '#e2e8f0'} strokeWidth="1" strokeDasharray="4 4" />
              <text x={pL - 8} y={line.y + 3} textAnchor="end" className="text-[8px] font-bold fill-gray-400 dark:fill-slate-500">{line.value}</text>
            </g>
          ))}

          <path d={areaD} fill="url(#areaGradient)" className="opacity-0 animate-fade-in-area" />
          <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength="1000" className="animate-draw-line" />

          {points.map((p, i) => (
            <g key={i} className="group/dot cursor-pointer">
              <circle
                cx={p.x} cy={p.y} r="3.5"
                fill={darkMode ? '#0f172a' : '#ffffff'} stroke="#06b6d4" strokeWidth="2"
                className="transition-all duration-150 hover:r-5"
                style={{ transformOrigin: `${p.x}px ${p.y}px`, opacity: 0, animation: 'scaleUpDot 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards', animationDelay: `${0.8 + i * 0.04}s` }}
              />
              <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150 pointer-events-none">
                <rect x={p.x - 25} y={p.y - 28} width="50" height="18" rx="4" fill={darkMode ? '#1e293b' : '#334155'} />
                <text x={p.x} y={p.y - 16} textAnchor="middle" className="text-[8px] font-bold fill-white">{p.count} tix</text>
              </g>
              {(trendMode === 'monthly' || i % 2 === 0 || i === points.length - 1) && (
                <text x={p.x} y={height - 5} textAnchor="middle" className="text-[8px] font-bold fill-gray-400 dark:fill-slate-500">{p.label}</text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
