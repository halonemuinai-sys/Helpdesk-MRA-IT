import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

// ─── EXCEL EXPORT (ExcelJS — professional styling) ───────────────────────────

export async function exportExcel({ overview, periodLabel, selectedYear, selectedCompanyMasterName }) {
  const ExcelJS = (await import('exceljs')).default;

  const monthlyTrend = overview.monthlyTrend || [];
  const byEntity     = overview.byEntity     || [];
  const gt           = overview.grandTotal   || {};
  const cms          = overview.currentMonthSummary || {};

  // ── Palette ──────────────────────────────────────────────────────────────
  const C = {
    navy:    '1E3A5F',  // header bg
    rose:    'BE123C',  // accent / total stripe
    altRow:  'F8FAFC',  // zebra
    totalBg: '1E293B',  // grand total row bg
    border:  'CBD5E1',
    gray:    '64748B',
    white:   'FFFFFF',
    blue:    '1D4ED8',  // peripherals
    amber:   'B45309',  // sewa
    green:   '065F46',  // subscription
    cyan:    '0E7490',  // ISP
  };

  const numFmt = 'Rp #,##0;[Red](Rp #,##0);"-"';

  const thin = (hex) => ({ style: 'thin', color: { argb: 'FF' + hex } });
  const borders = (hex = C.border) => ({ top: thin(hex), bottom: thin(hex), left: thin(hex), right: thin(hex) });

  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Helpdesk MRA — IT Cost Overview';
  wb.created  = new Date();

  const entityLabel = selectedCompanyMasterName || 'Semua Entitas MRA';

  // ── Shared helpers ────────────────────────────────────────────────────────
  const styleHeader = (row, bgHex = C.navy) => {
    row.height = 26;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgHex } };
      cell.font   = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + C.white } };
      cell.border = borders(bgHex);
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
  };

  const styleTotalRow = (row) => {
    row.height = 22;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.totalBg } };
      cell.font   = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + C.white } };
      cell.border = borders(C.totalBg);
    });
  };

  const styleDataRow = (row, isAlt, numCols, firstNumCol = 2) => {
    row.height = 20;
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.border = borders();
      cell.font   = { name: 'Arial', size: 9.5 };
      if (isAlt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.altRow } };
      if (col === 1) {
        cell.font      = { name: 'Arial', bold: true, size: 9.5 };
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      } else if (col >= firstNumCol && col <= numCols) {
        cell.numFmt    = numFmt;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    });
  };

  const addTitle = (ws, lastCol, title, subtitle) => {
    ws.mergeCells(`A1:${lastCol}1`);
    const t = ws.getCell('A1');
    t.value     = title;
    t.font      = { name: 'Georgia', bold: true, size: 14, color: { argb: 'FF' + C.navy } };
    t.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 36;

    ws.mergeCells(`A2:${lastCol}2`);
    const s = ws.getCell('A2');
    s.value     = subtitle;
    s.font      = { name: 'Arial', italic: true, size: 9, color: { argb: 'FF' + C.gray } };
    s.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 18;

    ws.mergeCells(`A3:${lastCol}3`);
    ws.getRow(3).height = 6;
  };

  const saveBlob = async () => {
    const buf  = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `IT_Cost_Overview_${periodLabel.replace(/\s/g, '_')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 1 — Ringkasan KPI
  // ════════════════════════════════════════════════════════════════════════════
  const ws1 = wb.addWorksheet('Ringkasan KPI', { views: [{ showGridLines: false }] });
  ws1.columns = [{ width: 32 }, { width: 28 }, { width: 32 }];

  addTitle(ws1, 'C',
    'IT COST OVERVIEW — RINGKASAN PENGELUARAN',
    `Periode: ${periodLabel}  |  Entitas: ${entityLabel}  |  Dibuat: ${nowLabel()}`
  );

  // Section A: Grand Total
  const hdr1a = ws1.addRow(['Kategori Pengeluaran', 'Total Akumulasi (Rp)', 'Keterangan']);
  styleHeader(hdr1a);
  hdr1a.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  const kpiData = [
    { label: 'TOTAL KESELURUHAN', val: gt.total || 0,         note: `Akumulasi ${selectedYear || periodLabel}`, accent: C.rose  },
    { label: 'Peripherals',       val: gt.peripherals || 0,   note: 'Pembelian Hardware & Periferal',           accent: C.blue  },
    { label: 'Sewa Aset Device',  val: gt.assetsRental || 0,  note: 'Biaya Rental Laptop & Perangkat',         accent: C.amber },
    { label: 'Subscription',      val: gt.subscriptions || 0, note: 'Lisensi, Cloud & Software',               accent: C.green },
    { label: 'Internet & ISP',    val: gt.isp || 0,           note: 'Jaringan Internet Toko & HO',             accent: C.cyan  },
  ];

  kpiData.forEach((k, i) => {
    const r = ws1.addRow([k.label, k.val, k.note]);
    r.height = 22;
    const isTotal = i === 0;
    r.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.border = borders();
      if (isTotal) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.totalBg } };
        cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FF' + C.white } };
      } else {
        if (i % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.altRow } };
        cell.font = { name: 'Arial', size: 9.5 };
      }
      if (col === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        if (!isTotal) {
          // Accent left border per category
          cell.border = { ...borders(), left: { style: 'medium', color: { argb: 'FF' + k.accent } } };
        }
      }
      if (col === 2) { cell.numFmt = numFmt; cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
      if (col === 3) { cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }; cell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF' + C.gray } }; }
    });
  });

  // Gap + Section B: Bulan Terakhir
  ws1.addRow([]);
  const hdr1b = ws1.addRow(['Bulan Berjalan', cms.yearMonth ? fmtMonthLabel(cms.yearMonth) : '—', '']);
  ws1.mergeCells(`B${ws1.rowCount}:C${ws1.rowCount}`);
  styleHeader(hdr1b, C.rose);
  hdr1b.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  const cmsData = [
    ['Total Bulan Ini',    cms.total || 0,         ''],
    ['Peripherals',        cms.peripherals || 0,   ''],
    ['Sewa Aset Device',   cms.assetsRental || 0,  ''],
    ['Subscription',       cms.subscriptions || 0, ''],
    ['Internet & ISP',     cms.isp || 0,           ''],
  ];
  cmsData.forEach((row, i) => {
    const r = ws1.addRow(row);
    styleDataRow(r, i % 2 === 0, 2);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 2 — Tren Bulanan
  // ════════════════════════════════════════════════════════════════════════════
  const ws2 = wb.addWorksheet('Tren Bulanan', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: false }]
  });
  ws2.columns = [
    { width: 14 },  // Bulan
    { width: 22 },  // Peripherals
    { width: 22 },  // Sewa Aset
    { width: 22 },  // Subscription
    { width: 22 },  // ISP
    { width: 22 },  // Total
  ];

  addTitle(ws2, 'F',
    'IT COST OVERVIEW — TREN BIAYA BULANAN',
    `Periode: ${periodLabel}  |  Entitas: ${entityLabel}`
  );

  const hdr2 = ws2.addRow(['Bulan', 'Peripherals', 'Sewa Aset Device', 'Subscription & Lisensi', 'Internet & ISP', 'TOTAL']);
  styleHeader(hdr2);
  hdr2.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  monthlyTrend.forEach((m, i) => {
    const r = ws2.addRow([
      fmtMonthLabel(m.yearMonth),
      m.peripherals   || 0,
      m.assetsRental  || 0,
      m.subscriptions || 0,
      m.isp           || 0,
      m.total         || 0,
    ]);
    styleDataRow(r, i % 2 === 1, 6);
    // Bold total column
    r.getCell(6).font = { name: 'Arial', bold: true, size: 9.5 };
  });

  // Grand total row
  const tot2 = ws2.addRow(['TOTAL TAHUNAN', gt.peripherals || 0, gt.assetsRental || 0, gt.subscriptions || 0, gt.isp || 0, gt.total || 0]);
  styleTotalRow(tot2);
  tot2.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col === 1) cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    else { cell.numFmt = numFmt; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
  });

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 3 — Per Entitas
  // ════════════════════════════════════════════════════════════════════════════
  const ws3 = wb.addWorksheet('Per Entitas', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: false }]
  });
  ws3.columns = [
    { width: 40 },  // Entitas
    { width: 22 },  // Peripherals
    { width: 22 },  // Sewa Aset
    { width: 22 },  // Subscription
    { width: 22 },  // ISP
    { width: 22 },  // Total
  ];

  addTitle(ws3, 'F',
    'IT COST OVERVIEW — PENGELUARAN PER ENTITAS',
    `Periode: ${periodLabel}  |  Entitas: ${entityLabel}`
  );

  const hdr3 = ws3.addRow(['Entitas / Perusahaan', 'Peripherals', 'Sewa Aset Device', 'Subscription & Lisensi', 'Internet & ISP', 'TOTAL']);
  styleHeader(hdr3);
  hdr3.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  byEntity.forEach((e, i) => {
    const r = ws3.addRow([
      e.name,
      e.peripherals   || 0,
      e.assetsRental  || 0,
      e.subscriptions || 0,
      e.isp           || 0,
      e.total         || 0,
    ]);
    styleDataRow(r, i % 2 === 1, 6);
    r.getCell(6).font = { name: 'Arial', bold: true, size: 9.5 };
  });

  const tot3 = ws3.addRow(['TOTAL KESELURUHAN', gt.peripherals || 0, gt.assetsRental || 0, gt.subscriptions || 0, gt.isp || 0, gt.total || 0]);
  styleTotalRow(tot3);
  tot3.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col === 1) cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    else { cell.numFmt = numFmt; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
  });

  await saveBlob();
}
