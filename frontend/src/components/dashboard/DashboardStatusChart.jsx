import React, { useState } from 'react';

const STATUS_COLORS = {
  OPEN: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  PENDING: '#64748b',
  RESOLVED: '#10b981',
  CLOSED: '#94a3b8',
};

export default function DashboardStatusChart({ analytics, darkMode }) {
  const [hoveredStatus, setHoveredStatus] = useState(null);

  if (!analytics || !analytics.status) return null;

  const statusData = Object.entries(analytics.status).map(([status, count]) => ({
    status, count, color: STATUS_COLORS[status] || '#94a3b8',
  }));

  const total = statusData.reduce((acc, d) => acc + d.count, 0) || 1;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <div className="stagger-2 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all duration-300">
      <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-5">Status Distribution</h4>

      <div className="relative w-full flex flex-col items-center sm:flex-row justify-center gap-6">
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="transparent" stroke={darkMode ? '#1e293b' : '#f1f5f9'} strokeWidth="9" />
            {statusData.map((d) => {
              const percent = (d.count / total) * 100;
              if (percent === 0) return null;
              const strokeDashoffset = circumference - (percent / 100) * circumference;
              const rotation = cumulativePercent * 3.6 - 90;
              cumulativePercent += percent;
              const isHovered = hoveredStatus === d.status;
              return (
                <circle
                  key={d.status}
                  cx="50" cy="50" r={radius}
                  fill="transparent" stroke={d.color}
                  strokeWidth={isHovered ? 11 : 9}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-200 cursor-pointer"
                  style={{ transformOrigin: '50px 50px', transform: `rotate(${rotation}deg)` }}
                  onMouseEnter={() => setHoveredStatus(d.status)}
                  onMouseLeave={() => setHoveredStatus(null)}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
            {hoveredStatus ? (
              <>
                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: STATUS_COLORS[hoveredStatus] || '#94a3b8' }}>
                  {hoveredStatus}
                </span>
                <span className="text-sm font-extrabold text-gray-800 dark:text-slate-100">{analytics.status[hoveredStatus]}</span>
                <span className="text-[9px] text-gray-400 dark:text-slate-500 font-semibold">
                  ({Math.round((analytics.status[hoveredStatus] / total) * 100)}%)
                </span>
              </>
            ) : (
              <>
                <span className="text-[8px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-widest">Total</span>
                <span className="text-lg font-black text-gray-800 dark:text-slate-100">{total}</span>
                <span className="text-[8px] text-gray-400 dark:text-slate-500 font-semibold">tickets</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[120px]">
          {statusData.map(d => {
            const percent = Math.round((d.count / total) * 100);
            return (
              <div
                key={d.status}
                className={`flex items-center justify-between p-1 rounded-lg transition-colors cursor-pointer ${hoveredStatus === d.status ? 'bg-slate-100/60 dark:bg-slate-800/40' : ''}`}
                onMouseEnter={() => setHoveredStatus(d.status)}
                onMouseLeave={() => setHoveredStatus(null)}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 truncate max-w-[80px]">{d.status}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 shrink-0 ml-2">{d.count} ({percent}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
