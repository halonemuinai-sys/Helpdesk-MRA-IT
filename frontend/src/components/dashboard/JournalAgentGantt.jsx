import React, { useState } from 'react';
import { User, Calendar, Clock, AlertCircle } from 'lucide-react';

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

export default function JournalAgentGantt({ tickets }) {
  const [hoveredTicket, setHoveredTicket] = useState(null);
  const currentYear = new Date().getFullYear();

  // 1. Group tickets by agent
  const agentGroups = {};
  tickets.forEach(t => {
    const agentName = t.assignedTo?.name || 'Belum Ditugaskan';
    if (!agentGroups[agentName]) {
      agentGroups[agentName] = [];
    }
    agentGroups[agentName].push(t);
  });

  const getMonthName = (monthIdx) => MONTHS_SHORT[monthIdx] || '';

  const handleMouseEnter = (e, ticket) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const start = new Date(ticket.createdAt);
    const end = ticket.resolvedAt ? new Date(ticket.resolvedAt) : new Date();

    setHoveredTicket({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 8,
      title: ticket.title,
      requester: ticket.requester?.name || '-',
      company: ticket.company?.name || '-',
      status: ticket.status,
      start: start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      end: ticket.resolvedAt ? end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Sedang Aktif'
    });
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-sm relative overflow-visible">
      {/* Title */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-rose-500" />
            Gantt Chart Aktivitas Kerja Agen IT
          </h3>
          <p className="text-[10px] text-gray-405 dark:text-slate-500 font-semibold mt-0.5">
            Rentang waktu pengerjaan tiket aktif dan selesai per agen (Januari - Desember {currentYear})
          </p>
        </div>
      </div>

      {/* Gantt Grid Container */}
      <div className="w-full overflow-x-auto custom-scroll pb-2">
        <div className="min-w-[850px] space-y-4">
          {/* Header row: Agent column label + 12 Month columns */}
          <div className="grid grid-cols-12 gap-2 items-center text-center pb-2 border-b border-slate-100 dark:border-slate-800/50">
            {/* Agent Column (Takes 2 cols span) */}
            <div className="col-span-2 text-left text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider pl-2">
              Agen IT
            </div>
            {/* 10 columns left inside the 12-grid, wait. If Agent takes 2 cols, we have 10 cols left. But we need 12 months! */}
            {/* Let's design a custom grid or use flexbox. A 14-column grid is perfect: 2 columns for Agent, 12 columns for months! */}
          </div>

          {/* 14-Column Grid Layout */}
          <div className="space-y-4 relative">
            {/* Month Header */}
            <div className="grid grid-cols-14 gap-2 items-center text-center font-mono text-[9px] font-black text-gray-400 dark:text-slate-500">
              <div className="col-span-2 text-left pl-2 font-sans text-[9px] uppercase tracking-wider">Daftar Petugas</div>
              {MONTHS_SHORT.map((m, idx) => (
                <div key={idx} className="border-l border-slate-100/50 dark:border-slate-850/50 pt-1">
                  {m}
                </div>
              ))}
            </div>

            {/* Swimlanes per agent */}
            {Object.keys(agentGroups).map(agentName => {
              const agentTickets = agentGroups[agentName];
              return (
                <div key={agentName} className="grid grid-cols-14 gap-2 items-start py-2 border-b border-slate-50 dark:border-slate-900/40 last:border-0">
                  {/* Agent Profile Block (Col 1-2) */}
                  <div className="col-span-2 flex items-start gap-2 pr-2 mt-1">
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate leading-tight" title={agentName}>
                        {agentName}
                      </p>
                      <p className="text-[9px] text-rose-500 font-extrabold mt-0.5 uppercase tracking-wider">
                        {agentTickets.length} Tiket
                      </p>
                    </div>
                  </div>

                  {/* Months Gantt Tracks (Col 3-14) */}
                  <div className="col-span-12 relative min-h-[40px] pt-1">
                    {/* Underlying Grid lines */}
                    <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                      {[...Array(12)].map((_, idx) => (
                        <div key={idx} className="border-l border-slate-100/30 dark:border-slate-850/20 h-full first:border-0" />
                      ))}
                    </div>

                    {/* Staged Tickets Bars inside swimlane */}
                    <div className="space-y-1.5 relative z-10">
                      {agentTickets.map(ticket => {
                        const start = new Date(ticket.createdAt).getMonth();
                        const end = ticket.resolvedAt ? new Date(ticket.resolvedAt).getMonth() : new Date().getMonth();
                        
                        // We construct column coordinates
                        // gridColumnStart needs 1-based index (1 to 12)
                        const startCol = start + 1;
                        const endCol = end + 2; // Span ends exclusive

                        return (
                          <div
                            key={ticket.id}
                            style={{
                              gridColumnStart: startCol,
                              gridColumnEnd: endCol
                            }}
                            onMouseEnter={(e) => handleMouseEnter(e, ticket)}
                            onMouseLeave={() => setHoveredTicket(null)}
                            className={`grid bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 text-[9px] px-2 py-1 rounded-xl text-rose-600 dark:text-rose-455 font-bold truncate transition duration-150 cursor-crosshair`}
                          >
                            {ticket.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Styled inline layout classes for 14-grid column system */}
      <style>{`
        .grid-cols-14 {
          grid-template-columns: repeat(14, minmax(0, 1fr));
        }
      `}</style>

      {/* Hover Tooltip Card */}
      {hoveredTicket && (
        <div
          className="absolute z-50 pointer-events-none bg-slate-900/95 dark:bg-slate-950/98 text-white p-3 rounded-2xl border border-slate-800 shadow-xl text-xs space-y-1.5 animate-scale-up min-w-[180px]"
          style={{
            left: `${hoveredTicket.x - 90}px`,
            top: `${hoveredTicket.y - 120}px`
          }}
        >
          <div className="border-b border-slate-800 pb-1.5">
            <p className="font-bold text-[10px] uppercase tracking-wider text-rose-500 truncate">{hoveredTicket.title}</p>
          </div>
          <div className="space-y-1 text-[11px] font-semibold">
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Pemohon:</span>
              <span className="font-bold text-right truncate max-w-[100px]">{hoveredTicket.requester}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Entitas:</span>
              <span className="font-bold text-right truncate max-w-[100px]">{hoveredTicket.company}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Durasi:</span>
              <span className="font-bold text-emerald-450">{hoveredTicket.start} - {hoveredTicket.end}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
