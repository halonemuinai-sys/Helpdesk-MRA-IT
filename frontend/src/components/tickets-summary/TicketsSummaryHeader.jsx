import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function TicketsSummaryHeader({ user }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight">
          Helpdesk Tickets List
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">
          Monitor issues, work status, and SLA calculations live.
        </p>
      </div>

      {['USER', 'ADMIN'].includes(user.role) && (
        <Link
          to="/input-ticket"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-750 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Ticket</span>
        </Link>
      )}
    </div>
  );
}
