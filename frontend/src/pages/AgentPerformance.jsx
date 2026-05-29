import React, { useState, useEffect } from 'react';
import { Award, AlertTriangle, Trophy, Clock, CheckCircle2, TrendingUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AgentPerformance({ user, token }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/performance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mengambil data performa agent.');
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSlaBadgeColor = (rate) => {
    if (rate >= 90) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400';
    if (rate >= 75) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400';
    return 'text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Award className="w-8 h-8 text-brand-500" />
          Performa Agent & KPI
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">
          Daftar peringkat performa teknisi IT berdasarkan kecepatan respon dan target kepatuhan SLA.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Top 3 Agents Highlight Cards */}
      {leaderboard.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {leaderboard.slice(0, 3).map((agent, index) => {
            const ranks = [
              { color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-500/20', label: '1st Rank' },
              { color: 'text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-slate-400/20', label: '2nd Rank' },
              { color: 'text-amber-700 bg-amber-50/50 dark:bg-amber-950/20 border-amber-700/10', label: '3rd Rank' }
            ];
            
            return (
              <div 
                key={agent.id}
                className={`glass-card p-6 rounded-3xl border ${ranks[index].color} relative flex flex-col justify-between overflow-hidden`}
              >
                {/* Ranking Trophy Corner Indicator */}
                <div className="absolute top-4 right-4 flex flex-col items-end">
                  <Trophy className="w-8 h-8 opacity-40 shrink-0" />
                  <span className="text-[9px] font-extrabold uppercase tracking-wider mt-1">{ranks[index].label}</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-extrabold text-lg text-gray-800 dark:text-slate-200 truncate pr-12">
                      {agent.name}
                    </h4>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">{agent.jobPosition}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{agent.companyName}</p>
                  </div>

                  {/* Primary SLA percentage */}
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-3xl font-extrabold text-gray-800 dark:text-white">
                      {agent.metrics.complianceRate}%
                    </h3>
                    <span className="text-xs font-semibold text-gray-400">SLA Met</span>
                  </div>
                </div>

                {/* Sub KPI Speeds */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-200/40 dark:border-slate-800/40 pt-4 mt-6 text-xs">
                  <div>
                    <p className="text-gray-400 font-medium">Avg Respon</p>
                    <p className="font-bold text-gray-700 dark:text-slate-200 mt-0.5">
                      {agent.metrics.avgResponseMin} menit
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium">Avg Resolusi</p>
                    <p className="font-bold text-gray-700 dark:text-slate-200 mt-0.5">
                      {agent.metrics.avgResolutionHour} jam
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complete Leaderboard Grid List */}
      <div className="glass-card rounded-3xl border border-gray-200/50 dark:border-slate-800/30 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-200/50 dark:border-slate-800/50">
          <h4 className="font-bold text-base text-gray-800 dark:text-slate-200">Seluruh Peringkat Keaktifan & KPI Agen IT</h4>
        </div>
        
        {leaderboard.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-slate-500">
            Belum ada agen IT yang terdaftar atau menangani tiket.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-200/50 dark:border-slate-800/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6 text-center w-16">Peringkat</th>
                  <th className="py-4 px-6">Nama Agen</th>
                  <th className="py-4 px-6 text-center">Tiket Ditangani</th>
                  <th className="py-4 px-6 text-center">Tepat SLA (Met)</th>
                  <th className="py-4 px-6 text-center">Breached SLA</th>
                  <th className="py-4 px-6 text-center">SLA Compliance Rate</th>
                  <th className="py-4 px-6 text-center">Avg Respon</th>
                  <th className="py-4 px-6 text-center">Avg Resolusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-sm">
                {leaderboard.map((agent, index) => (
                  <tr key={agent.id} className="hover:bg-gray-50/30 dark:hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 px-6 text-center font-bold text-gray-500">
                      #{index + 1}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-800 dark:text-slate-200">{agent.name}</div>
                      <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        {agent.jobPosition} • {agent.companyName}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-gray-700 dark:text-slate-300">
                      {agent.metrics.totalAssigned}
                    </td>
                    <td className="py-4 px-6 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                      {agent.metrics.slaMet}
                    </td>
                    <td className="py-4 px-6 text-center text-red-500 font-bold">
                      {agent.metrics.slaBreached}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${getSlaBadgeColor(agent.metrics.complianceRate)}`}>
                        {agent.metrics.complianceRate}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-gray-600 dark:text-slate-400">
                      {agent.metrics.avgResponseMin} m
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-gray-600 dark:text-slate-400">
                      {agent.metrics.avgResolutionHour} j
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
