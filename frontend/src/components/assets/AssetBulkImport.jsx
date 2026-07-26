import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  AlertCircle, Download, ChevronRight, ChevronLeft, Loader2,
  RefreshCw, SkipForward, Pencil,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TEMPLATE_COLUMNS = [
  'Asset Tag', 'Device Ref', 'Brand', 'Model', 'Processor',
  'RAM', 'Storage', 'OS', 'Office', 'Ownership Type',
  'Rental Cost', 'Rental Start', 'Rental End',
  'Vendor', 'Vendor Ref', 'Notes',
];

const TEMPLATE_EXAMPLE = [
  'AST-MRA-0001', 'LP10001', 'Lenovo', 'ThinkPad L14 Gen 2', 'Intel Core i5-1135G7',
  '16GB', '512GB SSD', 'Windows 11 Pro', 'M365',  'RENTAL',
  850000, '2024-01-01', '2026-12-31',
  'PT Javarent', 'ASN/2024/001', '',
];

const STATUS_CONFIG = {
  new:       { label: 'Baru',      bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/30', dot: 'bg-emerald-500' },
  duplicate: { label: 'Duplikat', bg: 'bg-amber-50 dark:bg-amber-950/20',   text: 'text-amber-700 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-900/30',   dot: 'bg-amber-500'   },
  error:     { label: 'Error',     bg: 'bg-red-50 dark:bg-red-950/20',       text: 'text-red-700 dark:text-red-400',       border: 'border-red-200 dark:border-red-900/30',       dot: 'bg-red-500'     },
};

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS, TEMPLATE_EXAMPLE]);

  // Column widths
  ws['!cols'] = TEMPLATE_COLUMNS.map((_, i) =>
    ({ wch: i === 3 ? 24 : i === 12 || i === 13 ? 20 : 14 })
  );

  XLSX.utils.book_append_sheet(wb, ws, 'Asset Import');
  XLSX.writeFile(wb, 'template_asset_import.xlsx');
}

export default function AssetBulkImport({ token, onClose, onDone }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [summary, setSummary] = useState(null);
  const [dupeMode, setDupeMode] = useState('skip'); // skip | overwrite
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileRef = useRef();

  const headers = { Authorization: `Bearer ${token}` };

  // ── Client-side parse for instant preview ─────────────────────────────────
  const parseFile = useCallback(async (f) => {
    if (!f) return;
    setParsing(true);
    setParseError('');
    setFile(f);

    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (!rows.length) { setParseError('File kosong atau kolom tidak sesuai template.'); setParsing(false); return; }

      // Send to backend dry-run to get duplicate info
      const formData = new FormData();
      formData.append('file', f);

      const res = await fetch(`${API_URL}/assets/bulk-import?dryRun=true`, {
        method: 'POST', headers, body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setParseError(data.error || 'Gagal parse file.'); setParsing(false); return; }

      setPreview(data.preview);
      setSummary(data.summary);
      setStep(2);
    } catch (e) {
      setParseError('Gagal membaca file. Pastikan format .xlsx dan gunakan template yang disediakan.');
    } finally {
      setParsing(false);
    }
  }, [token]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) parseFile(f);
  }, [parseFile]);

  const handleImport = async () => {
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/assets/bulk-import?mode=${dupeMode}`, {
        method: 'POST', headers, body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import gagal.');
      setResult(data.results);
      setStep(3);
    } catch (e) {
      setParseError(e.message);
    } finally {
      setImporting(false);
    }
  };

  const newCount  = preview.filter(r => r.status === 'new').length;
  const dupeCount = preview.filter(r => r.status === 'duplicate').length;
  const errCount  = preview.filter(r => r.status === 'error').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              Bulk Import Asset
            </h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Import massal dari file Excel · deteksi duplikasi otomatis</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step bar */}
        <div className="px-7 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            {[{ n: 1, label: 'Upload File' }, { n: 2, label: 'Preview & Cek' }, { n: 3, label: 'Selesai' }].map(({ n, label }, idx) => {
              const done = step > n, active = step === n;
              return (
                <React.Fragment key={n}>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${done ? 'bg-emerald-500 text-white' : active ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}>
                      {done ? '✓' : n}
                    </div>
                    <span className={`text-xs font-semibold ${active ? 'text-slate-800 dark:text-slate-200' : done ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</span>
                  </div>
                  {idx < 2 && <div className={`flex-1 h-px ${done ? 'bg-emerald-300' : 'bg-gray-200 dark:bg-slate-800'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6">

          {/* ── Step 1: Upload ── */}
          {step === 1 && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-emerald-400 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Template Excel
              </button>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                  dragOver
                    ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10'
                    : 'border-gray-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-gray-50/50 dark:hover:bg-slate-800/30'
                }`}
              >
                {parsing ? (
                  <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                ) : (
                  <Upload className="w-10 h-10 text-gray-300 dark:text-slate-600" />
                )}
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-600 dark:text-slate-300">
                    {parsing ? 'Memproses file...' : 'Drag & drop file Excel di sini'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">atau klik untuk pilih file · format .xlsx</p>
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { if (e.target.files[0]) parseFile(e.target.files[0]); }} />

              {parseError && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-red-600 dark:text-red-400">{parseError}</span>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Preview ── */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Summary chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: `${summary?.total || 0} Total Baris`, color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
                  { label: `${newCount} Baru`, color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30' },
                  { label: `${dupeCount} Duplikat`, color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30' },
                  { label: `${errCount} Error`, color: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30' },
                ].map(c => (
                  <span key={c.label} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${c.color}`}>{c.label}</span>
                ))}
              </div>

              {/* Duplicate mode selector */}
              {dupeCount > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/20 rounded-2xl">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex-1">
                    Ditemukan <span className="font-black">{dupeCount}</span> Asset Tag yang sudah ada. Pilih aksi:
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDupeMode('skip')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${dupeMode === 'skip' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'}`}
                    >
                      <SkipForward className="w-3 h-3" /> Skip
                    </button>
                    <button
                      type="button"
                      onClick={() => setDupeMode('overwrite')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${dupeMode === 'overwrite' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'}`}
                    >
                      <Pencil className="w-3 h-3" /> Overwrite
                    </button>
                  </div>
                </div>
              )}

              {/* Preview table */}
              <div className="rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-800/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-4 py-3">Row</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Asset Tag</th>
                        <th className="px-4 py-3">Brand</th>
                        <th className="px-4 py-3">Model</th>
                        <th className="px-4 py-3">Ownership</th>
                        <th className="px-4 py-3">Rental Cost</th>
                        <th className="px-4 py-3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {preview.map((row) => {
                        const cfg = STATUS_CONFIG[row.status];
                        return (
                          <tr key={row._row} className={`${row.status === 'error' ? 'bg-red-50/30 dark:bg-red-950/10' : row.status === 'duplicate' ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}>
                            <td className="px-4 py-2.5 text-gray-400 font-mono">{row._row}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono font-bold text-gray-800 dark:text-slate-200">{row.assetTag || '—'}</td>
                            <td className="px-4 py-2.5 text-gray-600 dark:text-slate-400">{row.brand || '—'}</td>
                            <td className="px-4 py-2.5 text-gray-600 dark:text-slate-400 max-w-[140px] truncate">{row.model || '—'}</td>
                            <td className="px-4 py-2.5 text-gray-600 dark:text-slate-400">{row.ownershipType}</td>
                            <td className="px-4 py-2.5 text-gray-600 dark:text-slate-400 font-mono">
                              {row.rentalCost ? `Rp ${Number(row.rentalCost).toLocaleString('id-ID')}` : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-red-500 dark:text-red-400 text-[10px]">
                              {row._errors?.join(', ') || ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {parseError && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-red-600 dark:text-red-400">{parseError}</span>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && result && (
            <div className="flex flex-col items-center justify-center py-8 gap-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">Import Selesai!</h3>
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Data asset berhasil diproses.</p>
              </div>
              <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                {[
                  { label: 'Dibuat',   value: result.created, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Diupdate', value: result.updated, color: 'text-amber-600 dark:text-amber-400'   },
                  { label: 'Di-skip',  value: result.skipped, color: 'text-slate-600 dark:text-slate-400'   },
                ].map(c => (
                  <div key={c.label} className="text-center p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
                    <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{c.label}</p>
                  </div>
                ))}
              </div>
              {result.errors > 0 && (
                <p className="text-xs text-red-500 dark:text-red-400 font-semibold">
                  {result.errors} baris dilewati karena error validasi.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div>
            {step === 2 && (
              <button
                type="button"
                onClick={() => { setStep(1); setPreview([]); setSummary(null); setFile(null); setParseError(''); }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Ganti File
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === 3 ? (
              <>
                <button
                  type="button"
                  onClick={() => { setStep(1); setPreview([]); setSummary(null); setFile(null); setResult(null); setParseError(''); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Import Lagi
                </button>
                <button
                  type="button"
                  onClick={() => { onDone?.(); onClose(); }}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors"
                >
                  Selesai & Refresh <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : step === 2 ? (
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || newCount + (dupeMode === 'overwrite' ? dupeCount : 0) === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? 'Mengimport...' : `Import ${newCount + (dupeMode === 'overwrite' ? dupeCount : 0)} Asset`}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
