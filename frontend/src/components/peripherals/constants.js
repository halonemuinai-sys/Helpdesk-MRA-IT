export const SUBSCRIPTION_CATEGORIES = ['Hosting', 'Domain', 'VPN', 'ISP', 'Subscription', 'Security', 'Sewa Printer', 'Others'];
export const BILLING_CYCLES = ['1 Bulan', '3 Bulan', '6 Bulan', '1 Tahun', '2 Tahun', '3 Tahun'];

export const STATUS_OPTIONS = [
  { value: 'STOCK',   label: 'Tersedia (Stok)',      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', dot: 'bg-emerald-500' },
  { value: 'IN_USE',  label: 'Terpasang (Aktif)',    color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',             dot: 'bg-blue-500'    },
  { value: 'DAMAGED', label: 'Rusak',                color: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',                 dot: 'bg-red-500'     },
  { value: 'RETIRED', label: 'Pensiun / Dibuang',    color: 'bg-slate-50 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400',         dot: 'bg-slate-500'   },
];

export const DEFAULT_CATEGORIES = [
  'CCTV', 'NVR', 'HDD', 'Storage / HDD', 'UPS / Power',
  'Network Switch', 'Printer', 'Access Control',
];

export const DEFAULT_BRANDS = [
  'Hikvision', 'Dahua', 'Seagate', 'Western Digital', 'Toshiba',
  'Transcend', 'Kingston', 'SanDisk', 'Samsung', 'TP-Link',
  'Cisco', 'APC', 'Epson', 'Canon', 'HP',
];
