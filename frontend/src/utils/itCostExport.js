import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ─── Helpers ────────────────────────────────────────────────────────────────

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

function fmtRupiah(val) {
  if (!val) return 'Rp 0';
  return 'Rp ' + Number(val).toLocaleString('id-ID');
}

function fmtMonthLabel(yearMonth) {
  const [yr, mo] = yearMonth.split('-');
  return `${monthNames[parseInt(mo, 10) - 1]} ${yr}`;
}

function nowLabel() {
  return new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
}

// ─── BRAND PALETTE ──────────────────────────────────────────────────────────
const BRAND   = [220, 38, 38];   // rose-600
const SLATE   = [30, 41, 59];    // slate-800
const MUTED   = [100, 116, 139]; // slate-500
const WHITE   = [255, 255, 255];
const LIGHT   = [248, 250, 252]; // slate-50
const RULE    = [226, 232, 240]; // slate-200

// Category stripe colours — hanya untuk aksen visual, bukan teks
const COL_PERIPHERALS   = [59,  130, 246];  // blue-500
const COL_SEWA          = [245, 158,  11];  // amber-500
const COL_SUBSCRIPTION  = [16,  185, 129];  // emerald-500
const COL_ISP           = [6,   182, 212];  // cyan-500
const COL_TOTAL         = [220,  38,  38];  // rose-600

// Monochrome text palette
const TEXT_DARK   = [15,  23,  42];   // slate-900
const TEXT_MED    = [51,  65,  85];   // slate-700
const TEXT_TOTAL  = [15,  23,  42];   // slate-900 bold untuk kolom total

// ─── PDF EXPORT ─────────────────────────────────────────────────────────────

export function exportPDF({ overview, periodLabel, selectedYear, selectedCompanyMasterName }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();   // 297
  const PH = doc.internal.pageSize.getHeight();  // 210

  const monthlyTrend = overview.monthlyTrend || [];
  const byEntity     = overview.byEntity     || [];
  const gt           = overview.grandTotal   || {};

  // ── Cover / Header bar ──────────────────────────────────────────────────
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PW, 22, 'F');

  // Left accent stripe
  doc.setFillColor(255, 255, 255, 0.15);
  doc.rect(0, 0, 3, 22, 'F');

  // Tagline left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...WHITE);
  doc.text('IT COST OVERVIEW', 10, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 200, 200);
  doc.text('Laporan Pengeluaran IT — Helpdesk MRA', 10, 19);

  // Right: period + entity
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text(`Periode: ${periodLabel}`, PW - 10, 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(255, 200, 200);
  const entityText = selectedCompanyMasterName ? `Entitas: ${selectedCompanyMasterName}` : 'Entitas: Semua';
  doc.text(entityText, PW - 10, 16, { align: 'right' });
  doc.text(`Dibuat: ${nowLabel()}`, PW - 10, 21, { align: 'right' });

  let curY = 29;

  // ── Section title helper ─────────────────────────────────────────────────
  function sectionTitle(label, y) {
    doc.setFillColor(...SLATE);
    doc.roundedRect(8, y, PW - 16, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...WHITE);
    doc.text(label, 12, y + 4.8);
    return y + 10;
  }

  // ── KPI Cards row ────────────────────────────────────────────────────────
  curY = sectionTitle('RINGKASAN PENGELUARAN', curY);

  const kpis = [
    { label: 'TOTAL KESELURUHAN',  value: gt.total,         color: COL_TOTAL },
    { label: 'PERIPHERALS',        value: gt.peripherals,   color: COL_PERIPHERALS },
    { label: 'SEWA ASET',          value: gt.assetsRental,  color: COL_SEWA },
    { label: 'SUBSCRIPTION',       value: gt.subscriptions, color: COL_SUBSCRIPTION },
    { label: 'INTERNET (ISP)',      value: gt.isp || 0,      color: COL_ISP },
  ];

  const cardW  = (PW - 16 - 4 * 3) / 5;
  const cardH  = 18;

  kpis.forEach((kpi, i) => {
    const x = 8 + i * (cardW + 3);

    // Card bg
    doc.setFillColor(...LIGHT);
    doc.roundedRect(x, curY, cardW, cardH, 2, 2, 'F');

    // Left accent stripe
    doc.setFillColor(...kpi.color);
    doc.roundedRect(x, curY, 2.5, cardH, 1, 1, 'F');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...MUTED);
    doc.text(kpi.label, x + 5, curY + 5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_DARK);
    doc.text(fmtRupiah(kpi.value), x + 5, curY + 12);

    // Period note
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(...MUTED);
    const note = selectedYear ? `Akumulasi ${selectedYear}` : periodLabel;
    doc.text(note, x + 5, curY + 16.5);
  });

  curY += cardH + 7;

  // ── Monthly Trend Table ──────────────────────────────────────────────────
  curY = sectionTitle('TREN BIAYA BULANAN', curY);

  const trendHead = [['Bulan', 'Peripherals', 'Sewa Aset', 'Subscription', 'Internet (ISP)', 'TOTAL']];
  const trendBody = monthlyTrend.map(m => [
    fmtMonthLabel(m.yearMonth),
    fmtRupiah(m.peripherals),
    fmtRupiah(m.assetsRental),
    fmtRupiah(m.subscriptions),
    fmtRupiah(m.isp || 0),
    fmtRupiah(m.total),
  ]);
  // Grand total row
  trendBody.push([
    'TOTAL',
    fmtRupiah(gt.peripherals),
    fmtRupiah(gt.assetsRental),
    fmtRupiah(gt.subscriptions),
    fmtRupiah(gt.isp || 0),
    fmtRupiah(gt.total),
  ]);

  autoTable(doc, {
    startY: curY,
    head: trendHead,
    body: trendBody,
    margin: { left: 8, right: 8 },
    styles: { fontSize: 6.5, cellPadding: 2.2, font: 'helvetica', overflow: 'linebreak' },
    headStyles: {
      fillColor: SLATE,
      textColor: WHITE,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7,
    },
    columnStyles: {
      0: { halign: 'left',  fontStyle: 'bold', textColor: TEXT_DARK,  cellWidth: 24 },
      1: { halign: 'right', textColor: TEXT_MED },
      2: { halign: 'right', textColor: TEXT_MED },
      3: { halign: 'right', textColor: TEXT_MED },
      4: { halign: 'right', textColor: TEXT_MED },
      5: { halign: 'right', fontStyle: 'bold', textColor: TEXT_TOTAL },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell(data) {
      if (data.row.index === trendBody.length - 1 && data.section === 'body') {
        data.cell.styles.fillColor  = [30, 41, 59];
        data.cell.styles.textColor  = [255, 255, 255];
        data.cell.styles.fontStyle  = 'bold';
      }
    },
  });

  curY = doc.lastAutoTable.finalY + 7;

  // ── By Entity Table — add new page if not enough space ──────────────────
  if (curY + 40 > PH - 15) {
    doc.addPage();
    curY = 14;
  }

  curY = sectionTitle('PENGELUARAN PER ENTITAS', curY);

  const entityHead = [['Entitas', 'Peripherals', 'Sewa Aset', 'Subscription', 'Internet (ISP)', 'TOTAL']];
  const entityBody = byEntity.map(e => [
    e.name,
    fmtRupiah(e.peripherals),
    fmtRupiah(e.assetsRental),
    fmtRupiah(e.subscriptions),
    fmtRupiah(e.isp || 0),
    fmtRupiah(e.total),
  ]);
  entityBody.push([
    'TOTAL KESELURUHAN',
    fmtRupiah(gt.peripherals),
    fmtRupiah(gt.assetsRental),
    fmtRupiah(gt.subscriptions),
    fmtRupiah(gt.isp || 0),
    fmtRupiah(gt.total),
  ]);

  autoTable(doc, {
    startY: curY,
    head: entityHead,
    body: entityBody,
    margin: { left: 8, right: 8 },
    styles: { fontSize: 6.5, cellPadding: 2.2, font: 'helvetica', overflow: 'linebreak' },
    headStyles: {
      fillColor: SLATE,
      textColor: WHITE,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7,
    },
    columnStyles: {
      0: { halign: 'left',  fontStyle: 'bold', textColor: TEXT_DARK,  cellWidth: 55 },
      1: { halign: 'right', textColor: TEXT_MED },
      2: { halign: 'right', textColor: TEXT_MED },
      3: { halign: 'right', textColor: TEXT_MED },
      4: { halign: 'right', textColor: TEXT_MED },
      5: { halign: 'right', fontStyle: 'bold', textColor: TEXT_TOTAL },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell(data) {
      if (data.row.index === entityBody.length - 1 && data.section === 'body') {
        data.cell.styles.fillColor = [30, 41, 59];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // ── Footer on all pages ──────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(8, PH - 9, PW - 8, PH - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...MUTED);
    doc.text('Helpdesk MRA — IT Cost Overview Report', 8, PH - 5);
    doc.text(`Halaman ${p} / ${totalPages}`, PW - 8, PH - 5, { align: 'right' });
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  const safePeriod = periodLabel.replace(/\s/g, '_');
  doc.save(`IT_Cost_Overview_${safePeriod}.pdf`);
}

// ─── EXCEL EXPORT ────────────────────────────────────────────────────────────

export function exportExcel({ overview, periodLabel, selectedYear, selectedCompanyMasterName }) {
  const monthlyTrend = overview.monthlyTrend || [];
  const byEntity     = overview.byEntity     || [];
  const gt           = overview.grandTotal   || {};
  const cms          = overview.currentMonthSummary || {};

  const wb = XLSX.utils.book_new();

  // ── Helper: append rows with gap ─────────────────────────────────────────
  function makeAoA(rows) { return rows; }

  // ── Sheet 1: Ringkasan KPI ───────────────────────────────────────────────
  const kpiRows = makeAoA([
    ['IT COST OVERVIEW — RINGKASAN PENGELUARAN'],
    [`Periode: ${periodLabel}`, '', `Entitas: ${selectedCompanyMasterName || 'Semua'}`],
    [`Dibuat: ${nowLabel()}`],
    [],
    ['Kategori', 'Nilai (Rp)', 'Keterangan'],
    ['Total Keseluruhan',  gt.total || 0,         selectedYear ? `Akumulasi ${selectedYear}` : periodLabel],
    ['Peripherals',        gt.peripherals || 0,   selectedYear ? `Total Periferal ${selectedYear}` : ''],
    ['Sewa Aset',          gt.assetsRental || 0,  selectedYear ? `Total Sewa ${selectedYear}` : ''],
    ['Subscription',       gt.subscriptions || 0, selectedYear ? `Total Subskripsi ${selectedYear}` : ''],
    ['Internet (ISP)',     gt.isp || 0,            selectedYear ? `Total ISP ${selectedYear}` : ''],
    [],
    ['Bulan Terakhir', cms.yearMonth ? fmtMonthLabel(cms.yearMonth) : '-'],
    ['Total Bulan Ini',    cms.total || 0],
    ['Peripherals (Bln)', cms.peripherals || 0],
    ['Sewa Aset (Bln)',   cms.assetsRental || 0],
    ['Subscription (Bln)',cms.subscriptions || 0],
    ['ISP (Bln)',         cms.isp || 0],
  ]);
  const wsKPI = XLSX.utils.aoa_to_sheet(kpiRows);
  wsKPI['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsKPI, 'Ringkasan KPI');

  // ── Sheet 2: Tren Bulanan ────────────────────────────────────────────────
  const trendHeader = ['Bulan', 'Peripherals (Rp)', 'Sewa Aset (Rp)', 'Subscription (Rp)', 'Internet ISP (Rp)', 'Total (Rp)'];
  const trendRows = monthlyTrend.map(m => [
    fmtMonthLabel(m.yearMonth),
    m.peripherals   || 0,
    m.assetsRental  || 0,
    m.subscriptions || 0,
    m.isp           || 0,
    m.total         || 0,
  ]);
  trendRows.push([
    'TOTAL',
    gt.peripherals   || 0,
    gt.assetsRental  || 0,
    gt.subscriptions || 0,
    gt.isp           || 0,
    gt.total         || 0,
  ]);

  const wsTrend = XLSX.utils.aoa_to_sheet([trendHeader, ...trendRows]);
  wsTrend['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsTrend, 'Tren Bulanan');

  // ── Sheet 3: Per Entitas ─────────────────────────────────────────────────
  const entityHeader = ['Entitas', 'Peripherals (Rp)', 'Sewa Aset (Rp)', 'Subscription (Rp)', 'Internet ISP (Rp)', 'Total (Rp)'];
  const entityRows = byEntity.map(e => [
    e.name,
    e.peripherals   || 0,
    e.assetsRental  || 0,
    e.subscriptions || 0,
    e.isp           || 0,
    e.total         || 0,
  ]);
  entityRows.push([
    'TOTAL KESELURUHAN',
    gt.peripherals   || 0,
    gt.assetsRental  || 0,
    gt.subscriptions || 0,
    gt.isp           || 0,
    gt.total         || 0,
  ]);

  const wsEntity = XLSX.utils.aoa_to_sheet([entityHeader, ...entityRows]);
  wsEntity['!cols'] = [{ wch: 40 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsEntity, 'Per Entitas');

  // ── Save ─────────────────────────────────────────────────────────────────
  const safePeriod = periodLabel.replace(/\s/g, '_');
  XLSX.writeFile(wb, `IT_Cost_Overview_${safePeriod}.xlsx`);
}
