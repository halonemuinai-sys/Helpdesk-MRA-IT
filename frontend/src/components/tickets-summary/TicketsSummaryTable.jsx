import React from 'react';
import { Clock, Pause, AlertTriangle, CheckCircle2, ChevronRight, Trash2, MoonStar } from 'lucide-react';
import ReactLoader from '../ReactLoader';
import TicketsSummaryEmptyState from './TicketsSummaryEmptyState';

const isOutsideBusinessHours = (dateStr) => {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return true;
  const totalMin = d.getHours() * 60 + d.getMinutes();
  return totalMin < 9 * 60 || totalMin >= 17 * 60;
};

const renderSlaStatus = (ticket, currentTime) => {
  const isBypassed = ticket.auditLogs?.some(log => log.action === 'SLA_OVERRIDDEN');
  if (isBypassed) {
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-750 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/10">
        SLA Bypassed
      </span>
    );
  }

  if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
    return (
      <div className="flex flex-col gap-1">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit ${
          ticket.isSlaBreached
            ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
        }`}>
          {ticket.isSlaBreached ? 'Breached (Late)' : 'SLA Met (On Time)'}
        </span>
        {ticket.resolvedAt && (
          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold pl-1">
            Done: {new Date(ticket.resolvedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        )}
      </div>
    );
  }

  const limitTime = new Date(ticket.slaResolutionLimit).getTime();
  const pausedMs = ticket.totalPausedMs || 0;
  let activeLimitTime = limitTime + pausedMs;

  if (ticket.status === 'PENDING' && ticket.lastPausedAt) {
    const currentPause = currentTime.getTime() - new Date(ticket.lastPausedAt).getTime();
    activeLimitTime += currentPause;
  }

  const remainingMs = activeLimitTime - currentTime.getTime();
  const isOverdue = remainingMs < 0;
  const diffMin = Math.abs(Math.round(remainingMs / 1000 / 60));
  const diffHours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  const timeString = diffHours > 0 ? `${diffHours} hr ${mins} min` : `${mins} min`;

  if (ticket.status === 'PENDING') {
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1.5 w-fit">
        <Pause className="w-3 h-3 fill-current" />
        Paused ({timeString} left)
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 flex items-center gap-1.5 w-fit border border-red-500/10">
        <AlertTriangle className="w-3.5 h-3.5" />
        Overdue ({timeString})
      </span>
    );
  }

  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 flex items-center gap-1.5 w-fit border border-amber-500/10">
      <Clock className="w-3.5 h-3.5 animate-pulse" />
      {timeString} left
    </span>
  );
};

const getPriorityBadge = (prio) => {
  const classes = {
    CRITICAL: 'bg-rose-700 text-white shadow-rose-700/20 border border-rose-500 animate-pulse',
    HIGH: 'bg-red-500 text-white shadow-red-500/10',
    MEDIUM: 'bg-amber-500 text-white shadow-amber-500/10',
    LOW: 'bg-emerald-500 text-white shadow-emerald-500/10',
  };
  return (
    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm ${classes[prio] || 'bg-gray-500'}`}>
      {prio}
    </span>
  );
};

const getStatusBadge = (status) => {
  const classes = {
    OPEN: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
    PENDING: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
    CLOSED: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800',
  };
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${classes[status] || 'bg-gray-50'}`}>
      {status}
    </span>
  );
};

export default function TicketsSummaryTable({
  loading, displayTickets, user, currentTime,
  selectedTicketIds, setSelectedTicketIds,
  resolvedTickets, isAllSelected, handleSelectAll,
  setSelectedTicketId, handleDeleteTicket,
}) {
  if (loading) {
    return <ReactLoader size="md" text="Loading ticket registry..." />;
  }

  if (displayTickets.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 overflow-hidden shadow-sm">
        <TicketsSummaryEmptyState user={user} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 overflow-hidden shadow-sm">
      <style>{`
        @keyframes night-glow {
          0%, 100% { box-shadow: 0 0 0 0 transparent; }
          50% { box-shadow: 0 0 7px 2px rgba(96,165,250,0.45); }
        }
        @keyframes moon-twinkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          40% { transform: scale(0.8) rotate(18deg); opacity: 0.55; }
          60% { transform: scale(1.15) rotate(-8deg); opacity: 0.9; }
        }
        .luar-jam-badge {
          animation: night-glow 2.4s ease-in-out infinite;
        }
        .luar-jam-icon {
          animation: moon-twinkle 2.4s ease-in-out infinite;
          display: inline-block;
        }
      `}</style>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-200/50 dark:border-slate-800/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {user.role === 'ADMIN' && (
                <th className="py-4 px-6 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    disabled={resolvedTickets.length === 0}
                    className="w-4 h-4 rounded text-emerald-650 border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-emerald-500 cursor-pointer disabled:opacity-40"
                    title="Select all resolved tickets on this page"
                  />
                </th>
              )}
              <th className="py-4 px-6">Ticket</th>
              <th className="py-4 px-6">Company / Location</th>
              <th className="py-4 px-6">Priority</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">SLA Target</th>
              <th className="py-4 px-6">Assigned Agent</th>
              <th className="py-4 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-sm">
            {displayTickets.map(ticket => {
              const offHours = isOutsideBusinessHours(ticket.createdAt);
              return (
              <tr
                key={ticket.id}
                className="hover:bg-gray-50/30 dark:hover:bg-slate-900/10 cursor-pointer transition-colors"
                style={offHours ? { boxShadow: 'inset 4px 0 0 0 #1e3a8a' } : undefined}
                onClick={() => setSelectedTicketId(ticket.id)}
              >
                {user.role === 'ADMIN' && (
                  <td className="py-4 px-6 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                    {ticket.status === 'RESOLVED' ? (
                      <input
                        type="checkbox"
                        checked={selectedTicketIds.includes(ticket.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTicketIds(prev => [...prev, ticket.id]);
                          } else {
                            setSelectedTicketIds(prev => prev.filter(id => id !== ticket.id));
                          }
                        }}
                        className="w-4 h-4 rounded text-emerald-650 border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-emerald-500 cursor-pointer"
                      />
                    ) : (
                      <span className="w-4 h-4 inline-block">&nbsp;</span>
                    )}
                  </td>
                )}

                <td className="py-4 px-6 max-w-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 dark:text-slate-200 truncate">{ticket.title}</span>
                    {offHours && (
                      <span className="luar-jam-badge inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-950/10 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-900/20 dark:border-blue-800/30 shrink-0">
                        <MoonStar className="luar-jam-icon w-2.5 h-2.5" />
                        Luar Jam
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <span>ID: {ticket.id.startsWith('MRA-') ? ticket.id : ticket.id.substring(0, 8)}</span>
                    <span>•</span>
                    <span>
                      {ticket.requester.name} ({ticket.category}
                      {ticket.subCategory && ticket.subCategory !== '-' ? ` - ${ticket.subCategory}` : ''} • {ticket.source || 'Walk-in'})
                    </span>
                  </div>
                  {['RESOLVED', 'CLOSED'].includes(ticket.status) && ticket.resolvedAt && (
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {ticket.status === 'RESOLVED' ? 'Resolved: ' : 'Closed: '}
                        {new Date(ticket.resolvedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  )}
                </td>

                <td className="py-4 px-6">
                  <div className="font-medium text-gray-700 dark:text-slate-300 truncate max-w-[150px]">{ticket.company.name}</div>
                  <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{ticket.company.location}</div>
                </td>

                <td className="py-4 px-6">{getPriorityBadge(ticket.priority)}</td>
                <td className="py-4 px-6">{getStatusBadge(ticket.status)}</td>
                <td className="py-4 px-6 font-medium">{renderSlaStatus(ticket, currentTime)}</td>

                <td className="py-4 px-6 text-gray-600 dark:text-slate-400">
                  {ticket.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                        {ticket.assignedTo.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{ticket.assignedTo.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Unassigned</span>
                  )}
                </td>

                <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-2">
                    {user.role === 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="p-1.5 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 rounded-lg text-gray-405 hover:scale-105 transition-all"
                        title="Delete Ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronRight
                      className="w-5 h-5 text-gray-400 cursor-pointer hover:text-brand-500 transition-colors"
                      onClick={() => setSelectedTicketId(ticket.id)}
                    />
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
