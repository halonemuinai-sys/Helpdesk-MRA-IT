import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Clock, CalendarDays, AlertTriangle, Laptop, CreditCard, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DashboardTopBar({ recentUrgentTickets, myOverdueTicketsCount, expiringSoon }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifCount = recentUrgentTickets.length + myOverdueTicketsCount + expiringSoon.total;

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });

  return (
    <div className="flex items-center justify-between gap-4 -mb-4">

      {/* Clock */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/80 dark:bg-slate-900/60 border border-gray-200/60 dark:border-slate-800/50 rounded-2xl shadow-sm backdrop-blur-sm">
          <div className="p-1.5 rounded-lg bg-brand-500/10">
            <Clock className="w-4 h-4 text-brand-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black text-gray-900 dark:text-white tabular-nums tracking-tight leading-none font-mono">
              {formattedTime}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CalendarDays className="w-3 h-3 text-gray-400 dark:text-slate-500" />
              <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 tracking-wide">
                {formattedDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setShowNotifDropdown(!showNotifDropdown)}
          className="relative p-2.5 bg-white/80 dark:bg-slate-900/60 border border-gray-200/60 dark:border-slate-800/50 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-500/30 transition-all duration-200 cursor-pointer group backdrop-blur-sm"
          title="Notifikasi"
        >
          <Bell className={`w-5 h-5 transition-colors duration-200 ${
            notifCount > 0
              ? 'text-amber-500 group-hover:text-amber-600'
              : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300'
          }`} />
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[9px] font-black text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse">
              {notifCount}
            </span>
          )}
        </button>

        {showNotifDropdown && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-up">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/30">
              <h4 className="text-xs font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-brand-500" />
                Notifikasi IT Support
              </h4>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/50">
              {myOverdueTicketsCount > 0 && (
                <Link
                  to="/tickets?sla=breached"
                  onClick={() => setShowNotifDropdown(false)}
                  className="px-4 py-3 flex items-start gap-3 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition"
                >
                  <div className="p-1.5 rounded-lg bg-red-500/10 mt-0.5 shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">Tiket Overdue</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                      Anda memiliki <span className="font-extrabold text-red-500">{myOverdueTicketsCount}</span> tiket yang melewati batas waktu SLA.
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                </Link>
              )}

              {expiringSoon.items.slice(0, 5).map(item => (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={item.type === 'ASSET' ? `/devices?open=${item.id}` : '/subscriptions'}
                  onClick={() => setShowNotifDropdown(false)}
                  className={`px-4 py-3 flex items-start gap-3 transition ${item.isExpired ? 'hover:bg-red-50/50 dark:hover:bg-red-950/10' : 'hover:bg-amber-50/50 dark:hover:bg-amber-950/10'}`}
                >
                  <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${item.isExpired ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                    {item.type === 'ASSET'
                      ? <Laptop className={`w-3.5 h-3.5 ${item.isExpired ? 'text-red-500' : 'text-amber-500'}`} />
                      : <CreditCard className={`w-3.5 h-3.5 ${item.isExpired ? 'text-red-500' : 'text-amber-500'}`} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-slate-200 truncate">{item.label}</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                      <span className={`font-extrabold ${item.isExpired ? 'text-red-500' : 'text-amber-500'}`}>
                        {item.isExpired ? `Lewat ${Math.abs(item.diffDays)} hari` : `${item.diffDays} hari lagi`}
                      </span>
                      {item.tag ? ` · ${item.tag}` : ''}
                      {item.entity ? ` · ${item.entity}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
              {expiringSoon.total > 5 && (
                <div className="px-4 py-2 text-center text-[10px] font-semibold text-gray-400 dark:text-slate-500">
                  +{expiringSoon.total - 5} lainnya akan/sudah habis masa berlakunya
                </div>
              )}

              {recentUrgentTickets.length > 0 ? (
                recentUrgentTickets.map(ticket => (
                  <Link
                    key={ticket.id}
                    to={`/tickets?open=${ticket.id}`}
                    onClick={() => setShowNotifDropdown(false)}
                    className="px-4 py-3 flex items-start gap-3 hover:bg-amber-50/50 dark:hover:bg-amber-950/10 transition"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/10 mt-0.5 shrink-0">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-800 dark:text-slate-200 truncate">{ticket.title}</p>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                        <span className={`font-extrabold ${ticket.priority === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`}>{ticket.priority}</span>
                        {' · '}{ticket.status.replace('_', ' ')}
                        {ticket.company?.name ? ` · ${ticket.company.name}` : ''}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  </Link>
                ))
              ) : (
                !myOverdueTicketsCount && expiringSoon.total === 0 && (
                  <div className="px-4 py-8 text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">Tidak ada notifikasi urgent saat ini.</p>
                  </div>
                )
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-950/20">
              <Link
                to="/tickets"
                onClick={() => setShowNotifDropdown(false)}
                className="text-[10px] font-bold text-brand-500 hover:text-brand-600 transition flex items-center justify-center gap-1"
              >
                Lihat Semua Tiket
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
