import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Copy, RefreshCw, CheckSquare, Square, AlertTriangle,
  TrendingUp, ChevronRight, Check, Loader2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const fmt = (n) => {
  if (n == null || isNaN(n)) return '-';
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
};

const BUDGET_TYPE_COLOR = {
  OPEX: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  CAPEX: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
};

export default function BudgetRolloverModal({ isOpen, onClose, companies, token, onSuccess }) {
  const [fromYear, setFromYear] = useState('2026');
  const [toYear, setToYear] = useState('2027');
  const [companyFilter, setCompanyFilter] = useState('');
  const [adjPct, setAdjPct] = useState(5);

  const [preview, setPreview] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [customBudgets, setCustomBudgets] = useState({});

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [creating, setCreating] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true);
    setError(null);
    setResult(null);
    try {
      const params = new URLSearchParams({ fromYear, toYear });
      if (companyFilter) params.set('companyMasterId', companyFilter);
      const res = await fetch(`${API_URL}/budgets/rollover-preview?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal memuat preview');
      const data = await res.json();
      setPreview(data.preview || []);

      // Default: OPEX checked, CAPEX unchecked, duplicates unchecked
      const defaultSelected = new Set(
        (data.preview || [])
          .filter(i => i.budgetType === 'OPEX' && !i.isDuplicate)
          .map(i => i.sourceId)
      );
      setSelectedIds(defaultSelected);
      setCustomBudgets({});
      setPreviewLoaded(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingPreview(false);
    }
  }, [fromYear, toYear, companyFilter, token]);

  useEffect(() => {
    if (isOpen) {
      setPreviewLoaded(false);
      setPreview([]);
      setResult(null);
      setError(null);
      setSelectedIds(new Set());
      setCustomBudgets({});
      setAdjPct(5);
    }
  }, [isOpen]);

  const toggleItem = (sourceId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(sourceId) ? next.delete(sourceId) : next.add(sourceId);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(preview.filter(i => !i.isDuplicate).map(i => i.sourceId)));
  const deselectAll = () => setSelectedIds(new Set());
  const selectOpex = () => setSelectedIds(new Set(preview.filter(i => i.budgetType === 'OPEX' && !i.isDuplicate).map(i => i.sourceId)));

  const proposedFor = (item) => {
    if (customBudgets[item.sourceId] !== undefined && customBudgets[item.sourceId] !== '')
      return parseFloat(customBudgets[item.sourceId]) || 0;
    return Math.round(item.proposedBase * (1 + adjPct / 100));
  };

  const selectedCount = preview.filter(i => selectedIds.has(i.sourceId)).length;
  const totalEstimated = preview
    .filter(i => selectedIds.has(i.sourceId))
    .reduce((s, i) => s + proposedFor(i), 0);

  const handleCreate = async () => {
    if (selectedCount === 0) return;
    setCreating(true);
    setError(null);
    try {
      const items = preview.map(i => ({
        sourceId: i.sourceId,
        include: selectedIds.has(i.sourceId),
        customBudget: customBudgets[i.sourceId] !== undefined && customBudgets[i.sourceId] !== ''
          ? parseFloat(customBudgets[i.sourceId])
          : null
      }));
      const res = await fetch(`${API_URL}/budgets/rollover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toYear: parseInt(toYear), adjustmentFactor: 1 + adjPct / 100, items })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat rollover');
      setResult(data);
      onSuccess?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-600 to-violet-600 shrink-0">
          <div className="flex items-center gap-3">
            <Copy className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-sm font-bold text-white">Rollover Anggaran</h2>
              <p className="text-xs text-indigo-200">Estimasi {toYear} dari realisasi {fromYear}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Config bar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Dari Tahun</label>
              <select
                value={fromYear}
                onChange={e => { setFromYear(e.target.value); setPreviewLoaded(false); }}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              >
                {['2025', '2026', '2027'].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Ke Tahun</label>
              <select
                value={toYear}
                onChange={e => { setToYear(e.target.value); setPreviewLoaded(false); }}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              >
                {['2026', '2027', '2028'].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Filter Entitas</label>
              <select
                value={companyFilter}
                onChange={e => { setCompanyFilter(e.target.value); setPreviewLoaded(false); }}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              >
                <option value="">Semua Entitas</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="min-w-[180px]">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Penyesuaian Inflasi / Kenaikan: <span className="text-indigo-600 font-bold">{adjPct > 0 ? '+' : ''}{adjPct}%</span>
              </label>
              <input
                type="range" min="-20" max="50" step="1"
                value={adjPct}
                onChange={e => setAdjPct(parseInt(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <button
              onClick={loadPreview}
              disabled={loadingPreview}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition disabled:opacity-50 shrink-0"
            >
              {loadingPreview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Muat Preview
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {!previewLoaded && !loadingPreview && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
              <Copy className="w-8 h-8 opacity-30" />
              <p className="text-sm">Klik <strong>Muat Preview</strong> untuk melihat estimasi rollover</p>
            </div>
          )}

          {loadingPreview && (
            <div className="flex items-center justify-center h-48 gap-2 text-indigo-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Memuat data...</span>
            </div>
          )}

          {error && (
            <div className="mx-6 mt-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {result && (
            <div className="mx-6 mt-4 px-4 py-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Rollover Berhasil</span>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">{result.message}</p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
              >
                Tutup & Refresh Data
              </button>
            </div>
          )}

          {previewLoaded && !loadingPreview && preview.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <p className="text-sm">Tidak ada data anggaran {fromYear} ditemukan.</p>
            </div>
          )}

          {previewLoaded && !loadingPreview && preview.length > 0 && !result && (
            <div className="px-6 py-4">
              {/* Quick select buttons */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-slate-500">{selectedCount} dari {preview.length} item dipilih</span>
                <button onClick={selectOpex} className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200 transition">OPEX Semua</button>
                <button onClick={selectAll} className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 transition">Pilih Semua</button>
                <button onClick={deselectAll} className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 transition">Hapus Pilihan</button>
                <div className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-200 dark:bg-amber-700/50 border border-amber-400"></span> Sudah ada di {toYear}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      <th className="w-8 px-3 py-2.5 text-center"></th>
                      <th className="px-3 py-2.5 text-left font-semibold">Nama Proyek / Item</th>
                      <th className="px-3 py-2.5 text-left font-semibold">Entitas</th>
                      <th className="px-3 py-2.5 text-center font-semibold">Tipe</th>
                      <th className="px-3 py-2.5 text-left font-semibold">Akun</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Pagu {fromYear}</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Realisasi {fromYear}</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Estimasi {toYear}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((item, idx) => {
                      const isSelected = selectedIds.has(item.sourceId);
                      const estimated = proposedFor(item);
                      const isDup = item.isDuplicate;
                      return (
                        <tr
                          key={item.sourceId}
                          onClick={() => !isDup && toggleItem(item.sourceId)}
                          className={`border-t border-slate-100 dark:border-slate-800 transition cursor-pointer
                            ${isDup ? 'bg-amber-50 dark:bg-amber-900/10 opacity-60' : ''}
                            ${isSelected && !isDup ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                            ${!isSelected && !isDup ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60' : ''}
                          `}
                        >
                          <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                            {isDup ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mx-auto" title="Sudah ada di tahun target" />
                            ) : (
                              <button onClick={() => toggleItem(item.sourceId)}>
                                {isSelected
                                  ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                                  : <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-slate-800 dark:text-slate-200 leading-tight">{item.projectName}</div>
                            <div className="text-slate-400 dark:text-slate-500">{item.projectCode}</div>
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                            <div>{item.company}</div>
                            {item.brand && <div className="text-slate-400">{item.brand}</div>}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${BUDGET_TYPE_COLOR[item.budgetType] || 'bg-slate-100 text-slate-600'}`}>
                              {item.budgetType}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{item.accountType}</td>
                          <td className="px-3 py-2 text-right text-slate-500 dark:text-slate-400 tabular-nums">{fmt(item.fromYearAllocated)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {item.fromYearActual > 0
                              ? <span className="text-emerald-700 dark:text-emerald-400 font-medium">{fmt(item.fromYearActual)}</span>
                              : <span className="text-slate-400 italic">Belum ada</span>}
                          </td>
                          <td className="px-3 py-2 text-right" onClick={e => e.stopPropagation()}>
                            {isDup ? (
                              <span className="text-amber-600 dark:text-amber-400 text-[10px] font-semibold">Sudah ada</span>
                            ) : (
                              <input
                                type="number"
                                value={customBudgets[item.sourceId] !== undefined ? customBudgets[item.sourceId] : estimated}
                                onChange={e => setCustomBudgets(prev => ({ ...prev, [item.sourceId]: e.target.value }))}
                                onFocus={() => { if (!isSelected) toggleItem(item.sourceId); }}
                                className="w-36 text-right px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 focus:outline-none tabular-nums"
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {previewLoaded && !result && preview.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 shrink-0 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-white">{selectedCount} item</span> dipilih ·
              Total estimasi: <span className="font-bold text-indigo-600 dark:text-indigo-400">{fmt(totalEstimated)}</span>
              {adjPct !== 0 && (
                <span className="ml-1 text-slate-400">
                  (termasuk {adjPct > 0 ? '+' : ''}{adjPct}% penyesuaian)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                Batal
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || selectedCount === 0}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-md shadow-indigo-600/20"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                {creating ? 'Membuat...' : `Buat ${selectedCount} Item Anggaran ${toYear}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
