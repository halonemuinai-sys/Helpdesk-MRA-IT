import React, { useState } from 'react';
import { Layers, Calendar, User, Clock, ArrowRight } from 'lucide-react';

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

const CATEGORIES = ['Hardware', 'Software', 'Network', 'Access'];

const BAR_STYLES = {
  OPEN: 'bg-blue-500/15 hover:bg-blue-500/25 border-blue-500/20 text-blue-600 dark:text-blue-400',
  IN_PROGRESS: 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/20 text-amber-600 dark:text-amber-400',
  PENDING: 'bg-purple-500/15 hover:bg-purple-500/25 border-purple-500/20 text-purple-600 dark:text-purple-400',
  RESOLVED: 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  CLOSED: 'bg-slate-500/15 hover:bg-slate-500/25 border-slate-500/20 text-slate-500 dark:text-slate-400'
};

const STATUS_LABELS = {
  OPEN: 'Baru (Open)',
  IN_PROGRESS: 'Dikerjakan (In Progress)',
  PENDING: 'Pending',
  RESOLVED: 'Selesai (Resolved)',
  CLOSED: 'Ditutup (Closed)'
};

export default function JournalAgentGantt({ tickets }) {
  const [hoveredTicket, setHoveredTicket] = useState(null);
  const currentYear = new Date().getFullYear();

  // 1. Group tickets by category
  const categoryGroups = {
    Hardware: [],
    Software: [],
    Network: [],
    Access: []
  };

  tickets.forEach(t => {
    const cat = t.category || 'Hardware';
    if (categoryGroups[cat] !== undefined) {
      categoryGroups[cat].push(t);
    } else {
      // Fallback for custom category names
      if (!categoryGroups[cat]) categoryGroups[cat] = [];
      categoryGroups[cat].push(t);
    }
  });

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
      agent: ticket.assignedTo?.name || 'Belum Ditugaskan',
      status: ticket.status,
      start: start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      end: ticket.resolvedAt ? end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Sedang Aktif'
    });
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-sm relative overflow-visible">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-rose-500" />
            Gantt Chart Manajemen Isu Tiket IT
          </h3>
          <p className="text-[10px] text-gray-405 dark:text-slate-500 font-semibold mt-0.5">
            Jadwal pengerjaan tiket aktif berdasarkan Kategori Sistem & Layanan (Januari - Desember {currentYear})
          </p>
        </div>
        
        {/* Legends */}
        <div className="flex flex-wrap items-center gap-3 text-[9px] font-black uppercase tracking-wider">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500/20 border border-blue-500/20" /> {STATUS_LABELS.OPEN}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/20" /> {STATUS_LABELS.IN_PROGRESS}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple-500/20 border border-purple-500/20" /> {STATUS_LABELS.PENDING}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/20" /> {STATUS_LABELS.RESOLVED}</span>
        </div>
      </div>

      {/* Gantt Grid Container */}
      <div className="w-full overflow-x-auto custom-scroll pb-2">
        <div className="min-w-[900px] space-y-6 relative">
          
          {/* Month Header Grid (15 columns: 3 for Task, 12 for Months) */}
          <div className="grid grid-cols-15 gap-2 items-center text-center font-mono text-[9px] font-black text-gray-405 dark:text-slate-550 border-b border-slate-100 dark:border-slate-800/40 pb-2">
            <div className="col-span-3 text-left pl-2 font-sans text-[9px] uppercase tracking-wider text-gray-400 dark:text-slate-500">Isu & Penanggung Jawab</div>
            {MONTHS_SHORT.map((m, idx) => (
              <div key={idx} className="border-l border-slate-100/30 dark:border-slate-850/30 pt-0.5">
                {m}
              </div>
            ))}
          </div>

          {/* Render by Category */}
          {Object.keys(categoryGroups).map(catName => {
            const catTickets = categoryGroups[catName];
            if (catTickets.length === 0) return null;

            return (
              <div key={catName} className="space-y-2">
                {/* Category Header Separator */}
                <div className="flex items-center gap-2 py-1 px-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200/10">
                  <span className="w-1.5 h-3.5 bg-rose-500 rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                    Kategori: {catName}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 ml-1">
                    ({catTickets.length} Pekerjaan)
                  </span>
                </div>

                {/* Sub-rows for each ticket (project tasks) */}
                <div className="space-y-1">
                  {catTickets.map(ticket => {
                    const start = new Date(ticket.createdAt).getMonth();
                    const end = ticket.resolvedAt ? new Date(ticket.resolvedAt).getMonth() : new Date().getMonth();
                    
                    // coordinate columns (3 columns offset, so months start from col 4 to 15)
                    const startCol = start + 4;
                    const endCol = end + 5; // exclusive span end

                    const barClass = BAR_STYLES[ticket.status] || BAR_STYLES.OPEN;
                    const agentName = ticket.assignedTo?.name || 'Belum Ditugaskan';

                    return (
                      <div key={ticket.id} className="grid grid-cols-15 gap-2 items-center py-1.5 border-b border-slate-50/20 dark:border-slate-900/10 hover:bg-slate-50/10 dark:hover:bg-slate-900/10 rounded-xl transition duration-150">
                        
                        {/* Task Information (Col 1-3) */}
                        <div className="col-span-3 pl-2 flex flex-col justify-center min-w-0 pr-2">
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate leading-tight" title={ticket.title}>
                            {ticket.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 max-w-[100px] truncate`} title={agentName}>
                              👤 {agentName}
                            </span>
                            <span className="text-[8px] font-bold text-gray-400 dark:text-slate-500 truncate max-w-[80px]">
                              {ticket.company?.name || '-'}
                            </span>
                          </div>
                        </div>

                        {/* Month Tracks (Col 4-15) */}
                        <div className="col-span-12 relative min-h-[26px] flex items-center">
                          {/* Grid Background lines */}
                          <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                            {[...Array(12)].map((_, idx) => (
                              <div key={idx} className="border-l border-slate-100/30 dark:border-slate-850/20 h-full first:border-0" />
                            ))}
                          </div>

                          {/* Horizontal Gantt timeline task bar */}
                          <div
                            style={{
                              gridColumnStart: startCol,
                              gridColumnEnd: endCol
                            }}
                            onMouseEnter={(e) => handleMouseEnter(e, ticket)}
                            onMouseLeave={() => setHoveredTicket(null)}
                            className={`w-full border rounded-xl py-1 px-2.5 font-sans font-black text-[9px] truncate transition duration-150 cursor-crosshair flex items-center gap-1 shadow-sm ${barClass}`}
                          >
                            <span className="truncate">{ticket.title}</span>
                            <ArrowRight className="w-2.5 h-2.5 shrink-0 opacity-50" />
                            <span className="shrink-0 text-[8px] font-extrabold opacity-75">
                              {MONTHS_SHORT[start]} - {ticket.resolvedAt ? MONTHS_SHORT[end] : 'Aktif'}
                            </span>
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}

        </div>
      </div>

      {/* Styled inline layout classes for 15-grid column system */}
      <style>{`
        .grid-cols-15 {
          grid-template-columns: repeat(15, minmax(0, 1fr));
        }
      `}</style>

      {/* Hover Tooltip Card */}
      {hoveredTicket && (
        <div
          className="absolute z-50 pointer-events-none bg-slate-900/95 dark:bg-slate-950/98 text-white p-3 rounded-2xl border border-slate-800 shadow-xl text-xs space-y-1.5 animate-scale-up min-w-[200px]"
          style={{
            left: `${hoveredTicket.x - 100}px`,
            top: `${hoveredTicket.y - 130}px`
          }}
        >
          <div className="border-b border-slate-800 pb-1.5">
            <p className="font-bold text-[10px] uppercase tracking-wider text-rose-500 truncate">{hoveredTicket.title}</p>
          </div>
          <div className="space-y-1 text-[11px] font-semibold">
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Pemohon:</span>
              <span className="font-bold text-right truncate max-w-[110px]">{hoveredTicket.requester}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Entitas:</span>
              <span className="font-bold text-right truncate max-w-[110px]">{hoveredTicket.company}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Petugas IT:</span>
              <span className="font-bold text-right text-emerald-450 truncate max-w-[110px]">{hoveredTicket.agent}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Rentang Waktu:</span>
              <span className="font-bold text-amber-450">{hoveredTicket.start} - {hoveredTicket.end}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
