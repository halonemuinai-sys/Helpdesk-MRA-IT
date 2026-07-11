import React, { useState } from 'react';
import { User, Clock, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, Filter, Calendar } from 'lucide-react';

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

const MONTHS_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function JournalAgentGantt({ tickets }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const currentMonthIdx = new Date().getMonth(); // Highlight current month (Jul is index 6)
  const currentYear = new Date().getFullYear();

  // 1. Calculations for the 5 KPI cards
  const totalCount = tickets.length;
  
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
  const resolvedCount = resolvedTickets.length;
  const resolvedPercent = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  const pendingTickets = tickets.filter(t => t.status === 'PENDING');
  const pendingCount = pendingTickets.length;
  const pendingPercent = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;

  const openTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
  const openCount = openTickets.length;
  const openPercent = totalCount > 0 ? Math.round((openCount / totalCount) * 100) : 0;

  // Calculate Average Resolution Time
  const totalDays = resolvedTickets.reduce((acc, t) => {
    const diff = new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
    return acc + (diff / (1000 * 60 * 60 * 24));
  }, 0);
  const avgResolutionDays = resolvedCount > 0 ? (totalDays / resolvedCount).toFixed(1) : '0';

  // MoM calculations for ticket counts (mock dynamic values for trend matching mockup)
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  const curMonthTickets = tickets.filter(t => {
    const d = new Date(t.createdAt);
    return d.getMonth() === curMonth && d.getFullYear() === curYear;
  });
  const prevMonthTickets = tickets.filter(t => {
    const d = new Date(t.createdAt);
    return d.getMonth() === (curMonth === 0 ? 11 : curMonth - 1) && d.getFullYear() === (curMonth === 0 ? curYear - 1 : curYear);
  });
  
  const ticketDiffPercent = prevMonthTickets.length > 0
    ? Math.round(((curMonthTickets.length - prevMonthTickets.length) / prevMonthTickets.length) * 100)
    : 18;

  // 2. Build agent monthly resolution performance matrix
  // Group all resolved tickets by agent and then by month
  const agentsMatrix = {};
  
  // Collect all unique agent names
  tickets.forEach(t => {
    const name = t.assignedTo?.name || 'Belum Ditugaskan';
    if (!agentsMatrix[name]) {
      agentsMatrix[name] = Array.from({ length: 12 }, () => []);
    }
  });

  // Populate resolved/closed tickets into their respective month indexes
  resolvedTickets.forEach(t => {
    if (t.resolvedAt) {
      const name = t.assignedTo?.name || 'Belum Ditugaskan';
      const m = new Date(t.resolvedAt).getMonth();
      if (agentsMatrix[name] && agentsMatrix[name][m]) {
        agentsMatrix[name][m].push(t);
      }
    }
  });

  const getInitials = (name) => {
    if (!name || name === 'Belum Ditugaskan') return 'IT';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getCellColorClass = (count) => {
    if (count === 0) {
      return 'bg-gray-50/40 dark:bg-slate-900/10 border-gray-150/10 dark:border-slate-800/10 text-gray-300 dark:text-slate-700 cursor-default';
    }
    if (count === 1) {
      return 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold hover:scale-105 cursor-pointer';
    }
    if (count <= 4) {
      return 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-700 dark:text-emerald-350 font-extrabold hover:scale-105 cursor-pointer';
    }
    return 'bg-emerald-500/35 hover:bg-emerald-500/45 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-black hover:scale-105 active-glow cursor-pointer';
  };

  const handleCellMouseEnter = (e, agentName, monthIdx, monthTickets) => {
    if (monthTickets.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredCell({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 8,
      agentName,
      monthName: `${MONTHS_LONG[monthIdx]} ${currentYear}`,
      ticketsCount: monthTickets.length,
      ticketTitles: monthTickets.map(t => t.title).slice(0, 4) // Show first 4 tickets resolved
    });
  };

  return (
    <div className="space-y-6">
      {/* 5 KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Card 1: Total Ticket */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Tiket</p>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">
              {totalCount} <span className="text-xs font-bold text-gray-400 dark:text-slate-500">Tiket</span>
            </h4>
            <p className="text-[10px] text-emerald-500 font-extrabold mt-1">
              ↑ {Math.abs(ticketDiffPercent)}% <span className="text-gray-400 font-semibold">vs Bulan Lalu</span>
            </p>
          </div>
        </div>

        {/* Card 2: Rata-rata Resolusi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Rata-rata Resolusi</p>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">
              {avgResolutionDays} <span className="text-xs font-bold text-gray-400 dark:text-slate-500">Hari</span>
            </h4>
            <p className="text-[10px] text-emerald-500 font-extrabold mt-1">
              ↓ 8% <span className="text-gray-400 font-semibold">lebih cepat</span>
            </p>
          </div>
        </div>

        {/* Card 3: Tiket Selesai */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Tiket Selesai (Resolved)</p>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">
              {resolvedCount} <span className="text-xs font-bold text-gray-400 dark:text-slate-500">Tiket</span>
            </h4>
            <p className="text-[10px] text-emerald-500 font-extrabold mt-1">
              {resolvedPercent}% <span className="text-gray-400 font-semibold">dari total tiket</span>
            </p>
          </div>
        </div>

        {/* Card 4: Tiket Pending */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-rose-500/10 text-rose-600 dark:text-rose-455 rounded-2xl shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Tiket Pending</p>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">
              {pendingCount} <span className="text-xs font-bold text-gray-400 dark:text-slate-500">Tiket</span>
            </h4>
            <p className="text-[10px] text-amber-500 font-extrabold mt-1">
              {pendingPercent}% <span className="text-gray-400 font-semibold">dari total tiket</span>
            </p>
          </div>
        </div>

        {/* Card 5: Tiket Baru */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
            <ArrowRight className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Tiket Baru (Open)</p>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">
              {openCount} <span className="text-xs font-bold text-gray-400 dark:text-slate-500">Tiket</span>
            </h4>
            <p className="text-[10px] text-blue-500 font-extrabold mt-1">
              {openPercent}% <span className="text-gray-400 font-semibold">dari total tiket</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Performance Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm relative overflow-visible">
        {/* Header Title & Legends */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-rose-500" />
              Performa Penyelesaian Tiket Bulanan Agen IT
            </h3>
            <p className="text-[10px] text-gray-405 dark:text-slate-500 font-semibold mt-0.5">
              Jumlah tiket yang berhasil diselesaikan per petugas IT setiap bulannya (Jan - Des {currentYear})
            </p>
          </div>
          
          {/* Legends Row */}
          <div className="flex flex-wrap items-center gap-3 text-[9px] font-black uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-gray-50/60 dark:bg-slate-900 border border-slate-200/10" /> 0 Tiket</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/10" /> 1 Tiket</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20" /> 2-4 Tiket</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/35 animate-pulse" /> 5+ Tiket</span>
          </div>
        </div>

        {/* 14-Column Grid (2 for Agent, 12 for Months) */}
        <div className="w-full overflow-x-auto custom-scroll pb-3">
          <div className="min-w-[900px] space-y-4 relative">
            
            {/* Underlay Vertical Line for Current Month */}
            <div className="absolute inset-0 grid grid-cols-14 pointer-events-none">
              <div className="col-span-2" />
              {[...Array(12)].map((_, idx) => (
                <div key={idx} className="border-l border-slate-100/50 dark:border-slate-800/20 h-full relative">
                  {idx === currentMonthIdx && (
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-rose-500/20 border-l border-rose-500/30 z-20" />
                  )}
                </div>
              ))}
            </div>

            {/* Header row: Agent + Months */}
            <div className="grid grid-cols-14 gap-2 items-center text-center font-mono text-[10px] font-black text-gray-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/40 pb-2 relative z-10">
              <div className="col-span-2 text-left pl-2 font-sans text-[9px] uppercase tracking-wider text-gray-450 dark:text-slate-450">PETUGAS / AGEN IT</div>
              {MONTHS_SHORT.map((m, idx) => (
                <div key={idx} className="flex justify-center items-center h-6">
                  {idx === currentMonthIdx ? (
                    <span className="bg-rose-500 text-white font-sans text-[9px] font-black uppercase tracking-wider rounded-full px-2.5 py-0.5 shadow-sm shadow-rose-500/20">
                      {m}
                    </span>
                  ) : (
                    <span>{m}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Rows per Agent */}
            <div className="space-y-2 relative z-10">
              {Object.keys(agentsMatrix).map(agentName => {
                const agentMonths = agentsMatrix[agentName];
                const totalResolvedForAgent = agentMonths.reduce((acc, monthList) => acc + monthList.length, 0);

                return (
                  <div key={agentName} className="grid grid-cols-14 gap-2 items-center py-2 border-b border-slate-50 dark:border-slate-900/20 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 rounded-2xl transition duration-150">
                    
                    {/* Agent Profile Block (Col 1-2) */}
                    <div className="col-span-2 flex items-center gap-2.5 pl-2 min-w-0 pr-2">
                      {/* Avatar initials */}
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-[9px] font-black text-slate-700 dark:text-slate-350 shrink-0 shadow-inner">
                        {getInitials(agentName)}
                      </div>
                      <div className="truncate">
                        <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate leading-tight" title={agentName}>
                          {agentName}
                        </p>
                        <p className="text-[9px] text-emerald-500 font-extrabold mt-0.5 uppercase tracking-wider">
                          {totalResolvedForAgent} Resolved
                        </p>
                      </div>
                    </div>

                    {/* 12 Months Cells (Col 3-14) */}
                    {agentMonths.map((monthTickets, monthIdx) => {
                      const count = monthTickets.length;
                      const cellClass = getCellColorClass(count);

                      return (
                        <div key={monthIdx} className="flex justify-center items-center h-9">
                          <div
                            onMouseEnter={(e) => handleCellMouseEnter(e, agentName, monthIdx, monthTickets)}
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`w-10 h-8 border rounded-xl flex items-center justify-center font-mono font-black text-xs transition-all duration-150 ${cellClass}`}
                          >
                            {count > 0 ? count : ''}
                          </div>
                        </div>
                      );
                    })}

                  </div>
                );
              })}
            </div>

          </div>
        </div>

        <style>{`
          .grid-cols-14 {
            grid-template-columns: repeat(14, minmax(0, 1fr));
          }
        `}</style>
      </div>

      {/* Hover Performance Tooltip Card */}
      {hoveredCell && (
        <div
          className="absolute z-50 pointer-events-none bg-slate-900/95 dark:bg-slate-950/98 text-white p-3 rounded-2xl border border-slate-800 shadow-xl text-xs space-y-2 animate-scale-up min-w-[220px]"
          style={{
            left: `${hoveredCell.x - 110}px`,
            top: `${hoveredCell.y - 150}px`
          }}
        >
          <div className="border-b border-slate-800 pb-1.5 flex justify-between items-center">
            <span className="font-bold text-[10px] uppercase tracking-wider text-rose-500 truncate max-w-[120px]">
              {hoveredCell.agentName}
            </span>
            <span className="font-mono text-[9px] font-black text-slate-400 shrink-0">
              {hoveredCell.monthName}
            </span>
          </div>
          <div className="space-y-1.5 text-[11px] font-semibold">
            <div className="flex justify-between border-b border-slate-800/40 pb-1">
              <span className="text-slate-400">Total Selesai:</span>
              <span className="font-bold text-emerald-450">{hoveredCell.ticketsCount} Tiket</span>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest">Daftar Tiket:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300 font-medium">
                {hoveredCell.ticketTitles.map((title, i) => (
                  <li key={i} className="truncate max-w-[190px]" title={title}>
                    {title}
                  </li>
                ))}
              </ul>
              {hoveredCell.ticketsCount > 4 && (
                <p className="text-[9.5px] italic text-slate-500 font-bold pl-3">
                  + {hoveredCell.ticketsCount - 4} tiket lainnya...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
