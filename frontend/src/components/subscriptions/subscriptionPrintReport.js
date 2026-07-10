import Swal from 'sweetalert2';
import { BILLING_DIVISORS } from './constants';

const formatIDR = (val) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

const monthlyEquivalent = (sub) => sub.cost / (BILLING_DIVISORS[sub.billingCycle] || 1);

export function printSubscriptionReport({ filteredSubs, now }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    Swal.fire({
      icon: 'error',
      title: 'Pop-up Blocker Aktif',
      text: 'Silakan izinkan pop-up untuk mencetak laporan PDF.',
    });
    return;
  }

  const totalCount = filteredSubs.length;
  const activeCount = filteredSubs.filter(s => s.status === 'ACTIVE' && new Date(s.expiryDate) >= now).length;
  const expiredCountVal = filteredSubs.filter(s => s.status === 'EXPIRED' || (s.status === 'ACTIVE' && new Date(s.expiryDate) < now)).length;
  const nearExpiryCountVal = filteredSubs.filter(s => {
    if (s.status !== 'ACTIVE') return false;
    const diffDays = Math.ceil((new Date(s.expiryDate) - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const monthlyBudget = filteredSubs.filter(s => s.status === 'ACTIVE').reduce((acc, s) => acc + monthlyEquivalent(s), 0);
  const annualBudget = monthlyBudget * 12;

  const categoryBreakdown = {};
  const companyBreakdown = {};
  filteredSubs.forEach(sub => {
    if (!categoryBreakdown[sub.category]) categoryBreakdown[sub.category] = { count: 0, cost: 0 };
    categoryBreakdown[sub.category].count += 1;
    if (sub.status === 'ACTIVE') categoryBreakdown[sub.category].cost += monthlyEquivalent(sub);

    const coName = sub.companyMaster?.name || 'Unassigned';
    if (!companyBreakdown[coName]) companyBreakdown[coName] = { count: 0, cost: 0 };
    companyBreakdown[coName].count += 1;
    if (sub.status === 'ACTIVE') companyBreakdown[coName].cost += monthlyEquivalent(sub);
  });

  const logoUrl = `${window.location.origin}/mra_logo.jpg`;
  const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Laporan Eksekutif Subskripsi IT - MRA Group</title>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Outfit', 'Inter', sans-serif; color: #0f172a; font-size: 10px; line-height: 1.5; background: #fff; margin: 0; padding: 0; }
    .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 20px; }
    .logo-box { display: flex; align-items: center; gap: 12px; }
    .header-logo { height: 48px; width: auto; }
    .header-title { font-size: 16px; font-weight: 800; color: #f43f5e; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .header-subtitle { font-size: 10px; color: #64748b; margin: 3px 0 0 0; font-weight: 600; }
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
    .metric-card.critical { border-color: #fca5a5; background: #fef2f2; }
    .metric-card.success { border-color: #a7f3d0; background: #ecfdf5; }
    .metric-title { font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .metric-val { font-size: 16px; font-weight: 800; color: #1e293b; margin-top: 4px; }
    .metric-card.critical .metric-val { color: #dc2626; }
    .metric-card.success .metric-val { color: #059669; }
    .section-title { font-size: 11px; font-weight: 800; color: #1e293b; margin: 20px 0 8px 0; border-left: 3px solid #f43f5e; padding-left: 8px; text-transform: uppercase; }
    .tables-row { display: grid; grid-template-columns: 1fr 1.2fr; gap: 16px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th { background: #f1f5f9; color: #475569; font-weight: 700; padding: 6px 8px; border: 1px solid #e2e8f0; text-align: left; text-transform: uppercase; font-size: 8px; }
    td { padding: 6px 8px; border: 1px solid #e2e8f0; color: #334155; }
    tr:nth-child(even) td { background: #fafafa; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 700; text-transform: uppercase; }
    .badge-active { background: #d1fae5; color: #065f46; }
    .badge-expired { background: #fee2e2; color: #991b1b; }
    .badge-inactive { background: #f1f5f9; color: #475569; }
    .row-expired { background-color: #fff1f2 !important; }
    .row-expiring { background-color: #fffbeb !important; }
    .page-break { page-break-before: always; }
    .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 8px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="logo-box">
      <img src="${logoUrl}" class="header-logo" alt="MRA Group Logo" onerror="this.style.display='none'">
      <div>
        <h1 class="header-title">IT Subscriptions & Renewals</h1>
        <p class="header-subtitle">MRA Group Executive Report</p>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-weight:700;font-size:10px;color:#1e293b;">Laporan Dokumen Resmi</div>
      <div style="color:#64748b;margin-top:2px;font-size:9px;">Dicetak: ${todayStr}</div>
    </div>
  </div>

  <div class="metrics-grid">
    <div class="metric-card"><div class="metric-title">Total Kontrak</div><div class="metric-val">${totalCount} Layanan</div></div>
    <div class="metric-card success"><div class="metric-title">Kontrak Aktif</div><div class="metric-val">${activeCount} Aktif</div></div>
    <div class="metric-card critical"><div class="metric-title">Kadaluwarsa</div><div class="metric-val">${expiredCountVal} Kontrak</div></div>
    <div class="metric-card"><div class="metric-title">Anggaran Bulanan</div><div class="metric-val" style="color:#0369a1;">${formatIDR(monthlyBudget)}</div></div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;padding:0 4px;">
    <div>
      <span style="font-weight:600;color:#64748b;font-size:8px;text-transform:uppercase;">Proyeksi Anggaran Tahunan</span>
      <div style="font-size:18px;font-weight:900;color:#0f172a;margin-top:2px;">${formatIDR(annualBudget)}</div>
    </div>
    <div style="text-align:right;display:flex;flex-direction:column;justify-content:center;">
      <div style="font-size:9px;color:#64748b;font-weight:600;">Kontrak Segera Habis (&lt;30 hari): <span style="color:#d97706;font-weight:800;">${nearExpiryCountVal}</span></div>
    </div>
  </div>

  <div class="tables-row">
    <div>
      <div class="section-title">Anggaran per Kategori</div>
      <table>
        <thead><tr><th>Kategori</th><th style="text-align:center;">Jumlah</th><th style="text-align:right;">Estimasi Bulanan (IDR)</th></tr></thead>
        <tbody>
          ${Object.entries(categoryBreakdown).map(([cat, val]) => `
            <tr><td style="font-weight:700;">${cat}</td><td style="text-align:center;">${val.count}</td><td style="text-align:right;font-weight:700;font-family:monospace;">${formatIDR(val.cost)}</td></tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div>
      <div class="section-title">Anggaran per Anak Perusahaan (PT)</div>
      <table>
        <thead><tr><th>Perusahaan Master</th><th style="text-align:center;">Jumlah</th><th style="text-align:right;">Estimasi Bulanan (IDR)</th></tr></thead>
        <tbody>
          ${Object.entries(companyBreakdown).map(([co, val]) => `
            <tr><td style="font-weight:700;">${co}</td><td style="text-align:center;">${val.count}</td><td style="text-align:right;font-weight:700;font-family:monospace;">${formatIDR(val.cost)}</td></tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="page-break"></div>
  <div class="section-title">Daftar Inventaris Detail Kontrak</div>
  <table>
    <thead>
      <tr>
        <th style="width:25px;text-align:center;">No</th>
        <th>Nama Layanan / Domain</th>
        <th>Entitas MRA</th>
        <th>Kategori</th>
        <th>Siklus</th>
        <th style="text-align:right;">Biaya (IDR)</th>
        <th>Tgl Habis</th>
        <th style="text-align:center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${filteredSubs.map((sub, index) => {
        const isExpired = new Date(sub.expiryDate) < now && sub.status === 'ACTIVE';
        const isExpiredActual = sub.status === 'EXPIRED' || isExpired;
        const diffDays = Math.ceil((new Date(sub.expiryDate) - now) / (1000 * 60 * 60 * 24));
        const isExpiringSoon = sub.status === 'ACTIVE' && diffDays >= 0 && diffDays <= 30;
        const rowClass = isExpiredActual ? 'row-expired' : isExpiringSoon ? 'row-expiring' : '';
        const statusText = isExpiredActual ? 'EXPIRED' : sub.status;
        const statusBadge = isExpiredActual ? 'badge-expired' : sub.status === 'INACTIVE' ? 'badge-inactive' : 'badge-active';
        return `
          <tr class="${rowClass}" style="page-break-inside:avoid;">
            <td style="text-align:center;">${index + 1}</td>
            <td><div style="font-weight:700;">${sub.name}</div><div style="font-size:8px;color:#64748b;">Vendor: ${sub.vendor}</div></td>
            <td style="font-weight:600;">${sub.companyMaster?.name || '-'}</td>
            <td>${sub.category}</td>
            <td>${sub.billingCycle}</td>
            <td style="text-align:right;font-weight:700;font-family:monospace;">${formatIDR(sub.cost)}</td>
            <td>${new Date(sub.expiryDate).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })}</td>
            <td style="text-align:center;"><span class="badge ${statusBadge}">${statusText}</span></td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
  <div class="footer">Laporan IT Subscriptions MRA Group - Halaman dicetak secara otomatis.</div>
</body>
</html>`;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);
}
