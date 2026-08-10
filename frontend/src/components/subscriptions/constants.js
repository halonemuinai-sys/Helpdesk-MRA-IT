export const CATEGORIES = ['Hosting', 'Domain', 'VPN', 'ISP', 'Subscription', 'Security', 'Sewa Printer', 'Others'];
export const BILLING_CYCLES = ['1 Bulan', '3 Bulan', '6 Bulan', '1 Tahun', '2 Tahun', '3 Tahun'];

export const MRA_BRANDS = [
  'Bvlgari',
  'Wiggle Wiggle',
  'Cosmopolitan',
  "Harper's Bazaar",
  'Her World',
  'Hard Rock FM',
  'Trax FM',
  'iRadio',
  'Brava Radio',
  'Häagen-Dazs',
  'Hard Rock Cafe',
  'Parentalk',
  'MRA Head Office / HQ',
];

export const BILLING_DIVISORS = {
  '1 Bulan': 1,
  '3 Bulan': 3,
  '6 Bulan': 6,
  '1 Tahun': 12,
  '2 Tahun': 24,
  '3 Tahun': 36,
};

export const calculateAnnualCost = (cost, billingCycle) => {
  const numericCost = typeof cost === 'number' ? cost : parseFloat((cost || 0).toString().replace(/\./g, '')) || 0;
  const cycle = billingCycle || '1 Tahun';
  const divisor = BILLING_DIVISORS[cycle] || 12;
  return Math.round((numericCost / divisor) * 12);
};
