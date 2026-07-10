import React from 'react';
import { Users, Cpu, FileText, MessageSquare, Mail, Phone, User, ShieldAlert, Briefcase, Ticket } from 'lucide-react';

const getSourceIcon = (sourceName) => {
  switch (sourceName.toLowerCase()) {
    case 'whatsapp':
    case 'instant messaging':
    case 'telegram':
      return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
    case 'email':
      return <Mail className="w-3.5 h-3.5 text-blue-500" />;
    case 'phone call':
    case 'phone':
      return <Phone className="w-3.5 h-3.5 text-teal-500" />;
    case 'walk-in':
    case 'walkin':
      return <User className="w-3.5 h-3.5 text-amber-500" />;
    case 'system alert':
    case 'system':
      return <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />;
    case 'on-site visit':
    case 'visit':
      return <Briefcase className="w-3.5 h-3.5 text-indigo-500" />;
    default:
      return <Ticket className="w-3.5 h-3.5 text-purple-500" />;
  }
};

export default function ReportsDetailsPanels({ data }) {
  const total = data.totalTickets || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Box D: Departments */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between lg:col-span-1 min-h-[360px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up-fade delay-5 opacity-0">
        <div>
          <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-500" />
            <span>Top Requester Departments</span>
          </h4>
          {Object.keys(data.departments || {}).length === 0 ? (
            <p className="text-xs text-gray-400 py-12 text-center">No department data recorded.</p>
          ) : (
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {Object.entries(data.departments)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([deptName, count]) => {
                  const percent = Math.round((count / total) * 100);
                  return (
                    <div key={deptName} className="text-xs font-semibold space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-700 dark:text-slate-300 font-bold truncate max-w-[170px]">{deptName}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{count} ({percent}%)</span>
                      </div>
                      <div className="h-2 bg-gray-150 dark:bg-slate-800/50 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full animate-grow-width" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Box E: Sub-categories */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between lg:col-span-1 min-h-[360px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up-fade delay-6 opacity-0">
        <div>
          <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand-500" />
            <span>Frequent Issue Sub-categories</span>
          </h4>
          {Object.keys(data.subCategories || {}).length === 0 ? (
            <p className="text-xs text-gray-400 py-12 text-center">No sub-category data recorded.</p>
          ) : (
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {Object.entries(data.subCategories)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([subCatName, count]) => {
                  const percent = Math.round((count / total) * 100);
                  return (
                    <div key={subCatName} className="text-xs font-semibold space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-700 dark:text-slate-300 font-bold truncate max-w-[170px]">
                          {subCatName === '-' ? 'General/Other' : subCatName}
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{count} ({percent}%)</span>
                      </div>
                      <div className="h-2 bg-gray-150 dark:bg-slate-800/50 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full animate-grow-width" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Box F: Ticket Sources */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between lg:col-span-1 min-h-[360px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up-fade delay-7 opacity-0">
        <div>
          <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-500" />
            <span>Report Media (Ticket Sources)</span>
          </h4>
          {Object.keys(data.sources || {}).length === 0 ? (
            <p className="text-xs text-gray-400 py-12 text-center">No ticket source data recorded.</p>
          ) : (
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {Object.entries(data.sources)
                .sort((a, b) => b[1] - a[1])
                .map(([srcName, count]) => {
                  const percent = Math.round((count / total) * 100);
                  return (
                    <div key={srcName} className="text-xs font-semibold space-y-1">
                      <div className="flex justify-between text-[11px] items-center">
                        <span className="text-gray-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                          {getSourceIcon(srcName)}
                          {srcName}
                        </span>
                        <span className="text-teal-600 dark:text-teal-400 font-bold">{count} ({percent}%)</span>
                      </div>
                      <div className="h-2 bg-gray-150 dark:bg-slate-800/50 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full animate-grow-width" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
