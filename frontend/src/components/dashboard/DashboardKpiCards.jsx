import React from 'react';
import { Ticket, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getSlaColor } from './constants';

export default function DashboardKpiCards({ analytics }) {
  const slaRate = analytics.sla.complianceRate;
  const ringCircumference = 2 * Math.PI * 22;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

      <div className="group stagger-1 bg-gradient-to-br from-white to-brand-50/20 dark:from-slate-900/60 dark:to-brand-950/15 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-1 hover-glow-brand hover:shadow-md transition-all duration-300 cursor-pointer">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Tickets</p>
          <h3 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 mt-2">{analytics.totalTickets}</h3>
        </div>
        <div className="w-12 h-12 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-xl flex items-center justify-center shadow-inner transition-all duration-300 group-hover:bg-brand-500 group-hover:text-white group-hover:scale-105">
          <Ticket className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
        </div>
      </div>

      <div className="group stagger-2 bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-900/60 dark:to-blue-950/15 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-1 hover-glow-blue hover:shadow-md transition-all duration-300 cursor-pointer">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Tickets</p>
          <h3 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 mt-2">
            {analytics.status.OPEN + analytics.status.IN_PROGRESS + analytics.status.PENDING}
          </h3>
        </div>
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shadow-inner transition-all duration-300 group-hover:bg-blue-500 group-hover:text-white group-hover:scale-105">
          <Activity className="w-6 h-6 animate-pulse transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>

      <div className="group stagger-3 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900/60 dark:to-emerald-950/15 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-1 hover-glow-emerald hover:shadow-md transition-all duration-300 cursor-pointer">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resolved Tickets</p>
          <h3 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 mt-2">
            {analytics.status.RESOLVED + analytics.status.CLOSED}
          </h3>
        </div>
        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 rounded-xl flex items-center justify-center shadow-inner transition-all duration-300 group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-105">
          <CheckCircle2 className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
        </div>
      </div>

      <div className="group stagger-4 bg-gradient-to-br from-white to-cyan-50/20 dark:from-slate-900/60 dark:to-cyan-950/15 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-1 hover-glow-cyan hover:shadow-md transition-all duration-300 cursor-pointer">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">SLA Compliance</p>
          <h3 className={`text-3xl font-extrabold mt-2 ${getSlaColor(slaRate)}`}>{slaRate}%</h3>
        </div>
        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="28" cy="28" r="22" className="stroke-slate-100 dark:stroke-slate-800/60" strokeWidth="4.5" fill="transparent" />
            <circle
              cx="28" cy="28" r="22"
              stroke="currentColor" strokeWidth="4.5" fill="transparent"
              className={getSlaColor(slaRate)}
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringCircumference - (slaRate / 100) * ringCircumference}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          </svg>
          <div className="absolute flex items-center justify-center">
            <ShieldAlert className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${getSlaColor(slaRate)}`} />
          </div>
        </div>
      </div>

    </div>
  );
}
