import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ShieldAlert, ArrowRight } from 'lucide-react';

export default function DashboardUrgentPanel({ recentUrgentTickets }) {
  return (
    <div className="stagger-4 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 border-l-4 border-l-red-500 flex flex-col h-full justify-between hover:shadow-md transition-all duration-300">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-red-500 animate-pulse" />
          <h4 className="font-bold text-base text-gray-800 dark:text-slate-200">Requires Urgent Attention</h4>
        </div>

        {recentUrgentTickets.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <ShieldAlert className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2 opacity-60" />
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">No active high-priority tickets.</p>
            <p className="text-[10px] text-gray-405 dark:text-slate-500 mt-0.5">All SLAs are currently compliant. 👍</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentUrgentTickets.map(ticket => {
              const isOverdue = new Date().getTime() > new Date(ticket.slaResolutionLimit).getTime();
              return (
                <div
                  key={ticket.id}
                  className="p-3 bg-red-50/30 dark:bg-red-950/10 border border-red-500/20 rounded-xl flex flex-col gap-1.5 animate-pulse-glow"
                >
                  <div className="flex justify-between items-start gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span className="font-semibold text-xs text-gray-800 dark:text-slate-200 truncate">{ticket.title}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-slate-400">
                    <span className="truncate max-w-[120px]">{ticket.company.name}</span>
                    <span className={`font-semibold ${isOverdue ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                      {isOverdue ? 'SLA Breached' : 'SLA Active'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Link
        to="/tickets"
        className="mt-6 flex items-center justify-center gap-2 py-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs font-semibold rounded-xl text-gray-700 dark:text-slate-200 border border-slate-200/40 dark:border-slate-800/40 transition-all"
      >
        <span>View All Tickets</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
