import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Award, X, ThumbsUp, ArrowRight } from 'lucide-react';
import { getSlaColor } from './constants';

export default function DashboardPerformanceModal({
  show, onClose, user,
  agentPerformance, myActiveTicketsCount, myOverdueTicketsCount,
}) {
  if (!show) return null;

  const complianceRate = agentPerformance?.metrics.complianceRate;

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 p-6 border border-gray-200 dark:border-slate-800 animate-slide-up">

        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">IT Agent Performance Alert</h3>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Welcome back, {user.name}!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-t border-gray-100 dark:border-slate-800 my-4" />

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-slate-950/30 border border-gray-200/40 dark:border-slate-800/40 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your SLA Compliance</p>
              <h4 className={`text-2xl font-black mt-1 ${complianceRate != null ? getSlaColor(complianceRate) : 'text-gray-500'}`}>
                {complianceRate != null ? `${complianceRate}%` : 'No Data'}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                {complianceRate != null ? (
                  complianceRate >= 90 ? '🌟 Excellent! Keep up the target.' :
                  complianceRate >= 75 ? '⚠️ Warning! Close to target threshold.' :
                  '🚨 Critical! Under SLA performance threshold.'
                ) : 'You have no closed tickets to calculate SLA.'}
              </p>
            </div>
            <ThumbsUp className={`w-8 h-8 opacity-90 flex-shrink-0 ${agentPerformance && complianceRate >= 75 ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-200/20 rounded-2xl text-center">
              <p className="text-gray-400 font-medium text-[10px] uppercase">My Active Tickets</p>
              <h5 className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{myActiveTicketsCount}</h5>
              <p className="text-[9px] text-gray-500 mt-0.5">Assigned to you</p>
            </div>
            <div className={`p-3.5 border rounded-2xl text-center ${myOverdueTicketsCount > 0 ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200/30' : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/30'}`}>
              <p className="text-gray-400 font-medium text-[10px] uppercase">Overdue Tickets</p>
              <h5 className={`text-xl font-bold mt-1 ${myOverdueTicketsCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{myOverdueTicketsCount}</h5>
              <p className="text-[9px] text-gray-500 mt-0.5">{myOverdueTicketsCount > 0 ? 'Action required!' : 'All SLA met! 👍'}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-slate-800 my-4" />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-350 text-xs font-semibold rounded-xl hover:bg-gray-55/10 dark:hover:bg-slate-800 transition-colors"
          >
            Keep Monitoring
          </button>
          <Link
            to="/tickets"
            onClick={onClose}
            className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-500/10 text-center flex items-center justify-center gap-1 transition-colors"
          >
            View My Tickets
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>,
    document.body
  );
}
