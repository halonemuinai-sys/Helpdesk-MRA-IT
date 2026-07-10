import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function TicketsSummaryBulkBar({
  user, resolvedTickets, selectedTicketIds, setSelectedTicketIds, onBulkClose,
}) {
  if (user.role !== 'ADMIN') return null;
  if (resolvedTickets.length === 0 && selectedTicketIds.length === 0) return null;

  return (
    <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/30 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-slide-up shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
        <CheckCircle2 className="w-4 h-4 text-emerald-550 dark:text-emerald-400 animate-pulse" />
        {selectedTicketIds.length > 0 ? (
          <span>Terpilih <strong className="text-emerald-700 dark:text-emerald-200">{selectedTicketIds.length}</strong> tiket berstatus RESOLVED.</span>
        ) : (
          <span>Terdapat <strong className="text-emerald-700 dark:text-emerald-200">{resolvedTickets.length}</strong> tiket berstatus RESOLVED yang belum ditutup.</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {selectedTicketIds.length > 0 ? (
          <>
            <button
              type="button"
              onClick={() => onBulkClose()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-750 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              Close Terpilih
            </button>
            <button
              type="button"
              onClick={() => setSelectedTicketIds([])}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl transition"
            >
              Batal
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onBulkClose(resolvedTickets.map(t => t.id))}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-750 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            <span>Close Semua Resolved ({resolvedTickets.length})</span>
          </button>
        )}
      </div>
    </div>
  );
}
