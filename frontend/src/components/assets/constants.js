export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Tersedia (Ready)', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', dot: 'bg-emerald-500' },
  { value: 'ASSIGNED', label: 'Dipakai Karyawan', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', dot: 'bg-blue-500' },
  { value: 'MAINTENANCE', label: 'Dalam Servis', color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400', dot: 'bg-amber-500' },
  { value: 'DISPOSED', label: 'Pensiun / Sewa Selesai', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700', dot: 'bg-slate-500' }
];
