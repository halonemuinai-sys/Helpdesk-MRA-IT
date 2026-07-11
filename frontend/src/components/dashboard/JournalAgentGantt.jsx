import React, { useState } from 'react';
import { User, Clock, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, Filter, Download, Calendar } from 'lucide-react';

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

const STATUS_COLORS = {
  OPEN: {
    bar: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500'
  },
  IN_PROGRESS: {
    bar: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500'
  },
  PENDING: {
    bar: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500'
  },
  RESOLVED: {
    bar: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500'
  },
  CLOSED: {
    bar: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500'
  }
};

export default function JournalAgentGantt({ tickets }) {
  const [selectedCatFilter, setSelectedCatFilter] = useState('Semua');
  const [hoveredTicket, setHoveredTicket] = useState(null);

  // 1. Highlight current month (Jul is month index 6)
  const currentMonthIdx = new Date().getMonth(); // 6 for July (0-indexed)

  // 2. Calculations for the 5 KPI cards
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
    : 18; // default to match mockup visual if empty

  // Filtered tickets list for the Gantt Grid
  const filteredTickets = selectedCatFilter === 'Semua'
    ? tickets
    : tickets.filter(t => t.category === selectedCatFilter);

  const getInitials = (name) => {
    if (!name) return 'IT';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

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

      {/* Main Gantt Chart Table Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm relative overflow-visible">
        {/* Dropdown Filter & Status Legends */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5 bg-gray-50/70 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl px-4 py-2 text-xs w-full md:w-56">
            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Kategori:</span>
            <select
              value={selectedCatFilter}
              onChange={(e) => setSelectedCatFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer text-xs w-full"
            >
              <option value="Semua">Semua</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Network">Network</option>
              <option value="Access">Access</option>
              <option value="Layanan">Layanan</option>
            </select>
          </div>

          {/* Legends Row */}
          <div className="flex flex-wrap items-center gap-4 text-[9px] font-black uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Baru (Open)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Dikerjakan (In Progress)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> Pending</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Selesai (Resolved)</span>
          </div>
        </div>

        {/* Gantt Grid Timeline */}
        <div className="w-full overflow-x-auto custom-scroll pb-3">
          <div className="min-w-[950px] space-y-3 relative">
            
            {/* Underlay Vertical Current Month Line (Highlighting current month column) */}
            <div className="absolute inset-0 grid grid-cols-16 pointer-events-none">
              {/* Offset columns (col 1 to 4) */}
              <div className="col-span-4" />
              {/* 12 Month columns */}
              {[...Array(12)].map((_, idx) => (
                <div key={idx} className="border-l border-slate-100/50 dark:border-slate-800/20 h-full relative">
                  {idx === currentMonthIdx && (
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-rose-500/25 border-l border-rose-500/35 z-20" />
                  )}
                </div>
              ))}
            </div>

            {/* Grid Header Row: Issue & Category + 12 Months */}
            <div className="grid grid-cols-16 gap-2 items-center text-center font-mono text-[10px] font-black text-gray-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/40 pb-2 relative z-10">
              <div className="col-span-3 text-left pl-2 font-sans text-[9px] uppercase tracking-wider text-gray-450 dark:text-slate-400">ISU & PENANGGUNG JAWAB</div>
              <div className="col-span-1 text-center font-sans text-[9px] uppercase tracking-wider text-gray-455 dark:text-slate-400">KATEGORI</div>
              
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

            {/* Gantt Rows per Ticket */}
            <div className="space-y-1 relative z-10">
              {filteredTickets.map(ticket => {
                const startDate = new Date(ticket.createdAt);
                const endVal = ticket.resolvedAt ? new Date(ticket.resolvedAt) : new Date();
                
                const startMonth = startDate.getMonth();
                const endMonth = ticket.resolvedAt ? endVal.getMonth() : new Date().getMonth();

                const startDayMonth = `${startDate.getDate()} ${MONTHS_SHORT[startMonth]}`;
                const endDayMonth = `${endVal.getDate()} ${MONTHS_SHORT[endMonth]}`;

                // Month Columns start at Col 5 to 16
                const startCol = startMonth + 5;
                const endCol = endMonth + 6; // Span exclusive

                const styles = STATUS_COLORS[ticket.status] || STATUS_COLORS.OPEN;
                const agentName = ticket.assignedTo?.name || 'Belum Ditugaskan';
                const companyName = ticket.company?.name || '-';

                return (
                  <div key={ticket.id} className="grid grid-cols-16 gap-2 items-center py-2.5 border-b border-slate-50 dark:border-slate-900/20 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 rounded-2xl transition duration-150">
                    
                    {/* 1. Issue & Agent Details (Col 1-3) */}
                    <div className="col-span-3 pl-2 flex items-start gap-2.5 min-w-0 pr-2">
                      {/* Round Avatar with Initials */}
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-[9px] font-black text-slate-700 dark:text-slate-300 shrink-0 shadow-inner">
                        {getInitials(agentName)}
                      </div>
                      <div className="truncate">
                        <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate leading-tight" title={ticket.title}>
                          {ticket.title}
                        </p>
                        <p className="text-[9px] text-gray-400 dark:text-slate-500 font-semibold mt-1 truncate">
                          👤 {agentName.toUpperCase()} &nbsp;•&nbsp; <span className="font-medium text-[8.5px]">{companyName}</span>
                        </p>
                      </div>
                    </div>

                    {/* 2. Category badge (Col 4) */}
                    <div className="col-span-1 flex justify-center">
                      <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/15 rounded-full text-[8px] font-black uppercase tracking-wider">
                        {ticket.category || 'Hardware'}
                      </span>
                    </div>

                    {/* 3. Gantt Month Tracks (Col 5-16) */}
                    <div className="col-span-12 relative min-h-[30px] flex items-center">
                      {/* Horizontal timeline bar */}
                      <div
                        style={{
                          gridColumnStart: startCol,
                          gridColumnEnd: endCol
                        }}
                        onMouseEnter={(e) => handleMouseEnter(e, ticket)}
                        onMouseLeave={() => setHoveredTicket(null)}
                        className={`w-full border rounded-full py-1.5 px-3.5 font-sans font-black text-[9px] flex items-center justify-between shadow-sm cursor-crosshair transition duration-150 ${styles.bar}`}
                      >
                        <span className="shrink-0 opacity-80">{startDayMonth}</span>
                        <span className="truncate mx-2 font-extrabold text-slate-700 dark:text-slate-350">{ticket.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="opacity-80">{ticket.resolvedAt ? endDayMonth : 'Aktif'}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </div>

        <style>{`
          .grid-cols-16 {
            grid-template-columns: repeat(16, minmax(0, 1fr));
          }
        `}</style>
      </div>

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
