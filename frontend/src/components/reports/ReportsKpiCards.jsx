import React from 'react';
import { Ticket, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { getSlaColor } from './constants';

export default function ReportsKpiCards({ data }) {
  const slaRate = data.sla.complianceRate ?? 100;
  const slaHoverGlow = slaRate >= 90
    ? 'hover:shadow-[0_0_20px_5px_rgba(16,185,129,0.18)]'
    : slaRate >= 75
    ? 'hover:shadow-[0_0_20px_5px_rgba(245,158,11,0.18)]'
    : 'hover:shadow-[0_0_20px_5px_rgba(239,68,68,0.18)]';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

      <div className="group glass-panel p-5 rounded-2xl bg-gradient-to-br from-white to-blue-50/10 dark:from-slate-900/70 dark:to-slate-950/40 border border-gray-250 dark:border-slate-800/80 shadow-md flex items-center justify-between hover:shadow-[0_0_20px_5px_rgba(59,130,246,0.15)] hover:-translate-y-1 transition-all duration-300 animate-slide-up-fade delay-1 opacity-0">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Tiket Masuk</p>
          <h3 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100">{data.totalTickets}</h3>
          <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">Insiden terdata di sistem</p>
        </div>
        <div className="p-3.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
          <Ticket className="w-6 h-6" />
        </div>
      </div>

      <div className={`group glass-panel p-5 rounded-2xl bg-gradient-to-br from-white to-emerald-50/10 dark:from-slate-900/70 dark:to-slate-950/40 border border-gray-250 dark:border-slate-800/80 shadow-md flex items-center justify-between hover:-translate-y-1 transition-all duration-300 animate-slide-up-fade delay-2 opacity-0 ${slaHoverGlow}`}>
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Kepatuhan SLA</p>
          <h3 className={`text-3xl font-extrabold ${getSlaColor(slaRate)}`}>{slaRate}%</h3>
          <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">
            {data.sla.met} Met / {data.sla.breached} Breached
          </p>
        </div>
        <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
          <ShieldCheck className="w-6 h-6" />
        </div>
      </div>

      <div className="group glass-panel p-5 rounded-2xl bg-gradient-to-br from-white to-teal-50/10 dark:from-slate-900/70 dark:to-slate-950/40 border border-gray-200/50 dark:border-slate-800/80 shadow-md flex items-center justify-between hover:shadow-[0_0_20px_5px_rgba(20,184,166,0.15)] hover:-translate-y-1 transition-all duration-300 animate-slide-up-fade delay-3 opacity-0">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Rata Waktu Respon</p>
          <h3 className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">
            {data.sla.avgResponseHours} <span className="text-xs font-bold text-gray-450">Jam</span>
          </h3>
          <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">Durasi respon pertama agen</p>
        </div>
        <div className="p-3.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      <div className="group glass-panel p-5 rounded-2xl bg-gradient-to-br from-white to-indigo-50/10 dark:from-slate-900/70 dark:to-slate-950/40 border border-gray-200/50 dark:border-slate-800/80 shadow-md flex items-center justify-between hover:shadow-[0_0_20px_5px_rgba(99,102,241,0.15)] hover:-translate-y-1 transition-all duration-300 animate-slide-up-fade delay-4 opacity-0">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Rata Waktu Resolusi</p>
          <h3 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {data.sla.avgResolutionHours} <span className="text-xs font-bold text-gray-450">Jam</span>
          </h3>
          <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">Durasi penyelesaian bersih</p>
        </div>
        <div className="p-3.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
          <Sparkles className="w-6 h-6" />
        </div>
      </div>

    </div>
  );
}
