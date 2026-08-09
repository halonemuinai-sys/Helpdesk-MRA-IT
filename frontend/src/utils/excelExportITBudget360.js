/**
 * Luxury & Analytical Excel Exporter for IT Budget 360
 * Designed using ExcelJS with exact styling inspired by BVLGARI Retail BI Reports:
 * - Georgia & Arial Typography hierarchy
 * - Navy (1E3A5F) & Slate Blue (475569) brand palette
 * - Custom Currency (Rp #,##0;[Red](Rp #,##0);"-") & Percentage formatting
 * - Zebra row striping (F8FAFC) & Subtotal accents (EFF6FF / E8F0FE)
 * - Conditional status badges (AMAN / OVER BUDGET)
 * - Multi-sheet structure (12Bln Cost Matrix, Quarterly Q1-Q4, Executive KPI Summary)
 */
export async function exportITBudget360ToExcel({
  selectedYear = '2026',
  companyName = 'Semua Perusahaan MRA',
  reportData = null,
  opexCategories = [],
  capexCategories = [],
  opexBudgetTotal = 0,
  opexMonthsTotal = [],
  opexYtdTotal = 0,
  opexVarianceTotal = 0,
  capexBudgetTotal = 0,
  capexMonthsTotal = [],
  capexYtdTotal = 0,
  capexVarianceTotal = 0,
  grandBudgetTotal = 0,
  grandMonthsTotal = [],
  grandYtdTotal = 0,
  grandVarianceTotal = 0,
  grandUtilPct = '0'
}) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'System IT Budget 360 MRA';
  wb.created = new Date();

  // ── Color Palette Definitions ──────────────────────────────────────────
  const C = {
    navyBg:     '1E3A5F',
    navyText:   'FFFFFF',
    slateBg:    '475569',
    slateText:  'FFFFFF',
    opexBg:     '1D4ED8', // Royal Blue
    capexBg:    'B45309', // Warm Amber/Bronze
    altRow:     'F8FAFC', // Zebra light gray
    subtotalBg: 'EFF6FF', // Light blue accent for subtotals
    totalBg:    'E8F0FE', // Soft navy accent for grand totals
    border:     'CBD5E1', // Thin border gray
    greenText:  '059669', // Emerald for AMAN
    redText:    'DC2626', // Crimson for OVER BUDGET
    grayText:   '64748B',
  };

  const thinBorder = (color) => ({ style: 'thin', color: { argb: 'FF' + color } });
  const allBorders = (color = C.border) => ({
    top: thinBorder(color),
    bottom: thinBorder(color),
    left: thinBorder(color),
    right: thinBorder(color),
  });

  const numFmt = 'Rp #,##0;[Red](Rp #,##0);"-"';
  const pctFmt = '0.0%';

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

  const getQuarterSum = (arr, qIdx) => {
    const start = qIdx * 3;
    return arr.slice(start, start + 3).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
  };

  const downloadBlob = (buffer, filename) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper to style section title row
  const addSectionHeaderRow = (ws, titleText, lastColLetter) => {
    const rIdx = ws.rowCount + 1;
    ws.mergeCells(`A${rIdx}:${lastColLetter}${rIdx}`);
    const cell = ws.getCell(`A${rIdx}`);
    cell.value = titleText;
    cell.font = { name: 'Arial', bold: true, size: 10.5, color: { argb: 'FF' + C.navyBg } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getRow(rIdx).height = 26;
  };

  // Helper to style table header row
  const styleHeaderRow = (row, bgHex, fontHex) => {
    row.height = 26;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgHex } };
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FF' + fontHex }, size: 9.5 };
      cell.border = allBorders(bgHex);
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
  };

  // ═════════════════════════════════════════════════════════════════════════
  // SHEET 1: Matriks Cost Overview (12 Bulan Full Year)
  // ═════════════════════════════════════════════════════════════════════════
  const ws1 = wb.addWorksheet('Cost Overview 12Bln', { views: [{ state: 'frozen', ySplit: 5, showGridLines: true }] });

  ws1.columns = [
    { width: 30 }, // Account Type
    { width: 14 }, // Klasifikasi
    { width: 22 }, // Pagu
    ...Array(12).fill({ width: 16 }), // Jan-Des
    { width: 22 }, // Total YTD
    { width: 24 }, // Sisa Budget
    { width: 14 }, // % Serapan
    { width: 18 }, // Status
  ];

  // Title Row A1:R1
  ws1.mergeCells('A1:R1');
  const t1 = ws1.getCell('A1');
  t1.value = 'MRA GROUP — IT BUDGET 360 REPORT';
  t1.font = { name: 'Georgia', bold: true, size: 15, color: { argb: 'FF' + C.navyBg } };
  t1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(1).height = 36;

  // Subtitle Row A2:R2
  ws1.mergeCells('A2:R2');
  const st1 = ws1.getCell('A2');
  st1.value = `Rekapitulasi Pagu Anggaran vs Realisasi Biaya IT (OPEX & CAPEX) — Tahun Fiskal ${selectedYear} (${companyName})`;
  st1.font = { name: 'Arial', italic: true, size: 9.5, color: { argb: 'FF' + C.grayText } };
  st1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(2).height = 18;

  ws1.addRow([]); // Blank row 3

  // Section Header Row 4
  addSectionHeaderRow(ws1, 'I. MATRIKS COST OVERVIEW ALOKASI 12 BULAN (OPEX & CAPEX)', 'R');

  // Header Row 5
  const hdr1 = ws1.addRow([
    'Kategori Akun IT', 'Klasifikasi', 'Pagu Anggaran (IDR)',
    ...monthNames,
    'Total YTD (IDR)', 'Sisa Budget (IDR)', '% Serapan', 'Status Varian'
  ]);
  styleHeaderRow(hdr1, C.navyBg, C.navyText);
  hdr1.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

  // OPEX Banner
  const opexBanner1 = ws1.addRow(['--- BIAYA OPERASIONAL (OPEX) ---']);
  ws1.mergeCells(`A${ws1.rowCount}:R${ws1.rowCount}`);
  opexBanner1.height = 22;
  opexBanner1.getCell(1).font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FFFFFFFF' } };
  opexBanner1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.opexBg } };

  opexCategories.forEach((cat, idx) => {
    const isAlt = idx % 2 === 1;
    const r = ws1.addRow([
      cat.name,
      cat.type,
      cat.budget,
      ...cat.months,
      cat.ytdActual,
      cat.variance,
      cat.budget > 0 ? (cat.ytdActual / cat.budget) : 0,
      cat.variance < 0 ? 'OVER BUDGET' : 'AMAN'
    ]);
    r.height = 20;
    r.eachCell({ includeEmpty: true }, (cell, colIdx) => {
      cell.border = allBorders();
      cell.font = { name: 'Arial', size: 9.5 };
      if (isAlt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.altRow } };

      if (colIdx === 1) {
        cell.font = { name: 'Arial', bold: true, size: 9.5 };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else if (colIdx === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colIdx >= 3 && colIdx <= 17) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = numFmt;
      } else if (colIdx === 18) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = pctFmt;
      } else if (colIdx === 19) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + (cat.variance < 0 ? C.redText : C.greenText) } };
      }
    });
  });

  // Subtotal OPEX Row
  const subOpex1 = ws1.addRow([
    'SUBTOTAL OPEX', 'OPEX', opexBudgetTotal, ...opexMonthsTotal, opexYtdTotal, opexVarianceTotal,
    opexBudgetTotal > 0 ? opexYtdTotal / opexBudgetTotal : 0,
    opexVarianceTotal < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);
  subOpex1.height = 22;
  subOpex1.eachCell({ includeEmpty: true }, (cell, colIdx) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.subtotalBg } };
    cell.font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + C.navyBg } };
    cell.border = allBorders(C.slateBg);
    if (colIdx === 1) cell.alignment = { vertical: 'middle', horizontal: 'left' };
    else if (colIdx === 2) cell.alignment = { vertical: 'middle', horizontal: 'center' };
    else if (colIdx >= 3 && colIdx <= 17) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = numFmt; }
    else if (colIdx === 18) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = pctFmt; }
    else if (colIdx === 19) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + (opexVarianceTotal < 0 ? C.redText : C.greenText) } };
    }
  });

  ws1.addRow([]); // Blank row

  // CAPEX Banner
  const capexBanner1 = ws1.addRow(['--- INVESTASI & BELANJA MODAL (CAPEX) ---']);
  ws1.mergeCells(`A${ws1.rowCount}:R${ws1.rowCount}`);
  capexBanner1.height = 22;
  capexBanner1.getCell(1).font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FFFFFFFF' } };
  capexBanner1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.capexBg } };

  capexCategories.forEach((cat, idx) => {
    const isAlt = idx % 2 === 1;
    const r = ws1.addRow([
      cat.name,
      cat.type,
      cat.budget,
      ...cat.months,
      cat.ytdActual,
      cat.variance,
      cat.budget > 0 ? (cat.ytdActual / cat.budget) : 0,
      cat.variance < 0 ? 'OVER BUDGET' : 'AMAN'
    ]);
    r.height = 20;
    r.eachCell({ includeEmpty: true }, (cell, colIdx) => {
      cell.border = allBorders();
      cell.font = { name: 'Arial', size: 9.5 };
      if (isAlt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.altRow } };

      if (colIdx === 1) {
        cell.font = { name: 'Arial', bold: true, size: 9.5 };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else if (colIdx === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colIdx >= 3 && colIdx <= 17) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = numFmt;
      } else if (colIdx === 18) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = pctFmt;
      } else if (colIdx === 19) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + (cat.variance < 0 ? C.redText : C.greenText) } };
      }
    });
  });

  // Subtotal CAPEX Row
  const subCapex1 = ws1.addRow([
    'SUBTOTAL CAPEX', 'CAPEX', capexBudgetTotal, ...capexMonthsTotal, capexYtdTotal, capexVarianceTotal,
    capexBudgetTotal > 0 ? capexYtdTotal / capexBudgetTotal : 0,
    capexVarianceTotal < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);
  subCapex1.height = 22;
  subCapex1.eachCell({ includeEmpty: true }, (cell, colIdx) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.subtotalBg } };
    cell.font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + C.navyBg } };
    cell.border = allBorders(C.slateBg);
    if (colIdx === 1) cell.alignment = { vertical: 'middle', horizontal: 'left' };
    else if (colIdx === 2) cell.alignment = { vertical: 'middle', horizontal: 'center' };
    else if (colIdx >= 3 && colIdx <= 17) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = numFmt; }
    else if (colIdx === 18) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = pctFmt; }
    else if (colIdx === 19) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + (capexVarianceTotal < 0 ? C.redText : C.greenText) } };
    }
  });

  ws1.addRow([]); // Blank row

  // Grand Total Row
  const grandTot1 = ws1.addRow([
    'GRAND TOTAL BIAYA IT', 'TOTAL', grandBudgetTotal, ...grandMonthsTotal, grandYtdTotal, grandVarianceTotal,
    grandBudgetTotal > 0 ? grandYtdTotal / grandBudgetTotal : 0,
    grandVarianceTotal < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);
  grandTot1.height = 24;
  grandTot1.eachCell({ includeEmpty: true }, (cell, colIdx) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.totalBg } };
    cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FF' + C.navyBg } };
    cell.border = {
      top: thinBorder(C.navyBg),
      bottom: { style: 'double', color: { argb: 'FF' + C.navyBg } },
      left: thinBorder(C.navyBg),
      right: thinBorder(C.navyBg),
    };
    if (colIdx === 1) cell.alignment = { vertical: 'middle', horizontal: 'left' };
    else if (colIdx === 2) cell.alignment = { vertical: 'middle', horizontal: 'center' };
    else if (colIdx >= 3 && colIdx <= 17) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = numFmt; }
    else if (colIdx === 18) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = pctFmt; }
    else if (colIdx === 19) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FF' + (grandVarianceTotal < 0 ? C.redText : C.greenText) } };
    }
  });


  // ═════════════════════════════════════════════════════════════════════════
  // SHEET 2: Analisis Kuartalan (Q1, Q2, Q3, Q4)
  // ═════════════════════════════════════════════════════════════════════════
  const ws2 = wb.addWorksheet('Analisis Kuartalan (Q1-Q4)', { views: [{ state: 'frozen', ySplit: 5, showGridLines: true }] });

  ws2.columns = [
    { width: 30 }, { width: 14 }, { width: 22 },
    { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 },
    { width: 22 }, { width: 24 }, { width: 14 }, { width: 18 }
  ];

  // Title Row A1:K1
  ws2.mergeCells('A1:K1');
  const t2 = ws2.getCell('A1');
  t2.value = 'MRA GROUP — LAPORAN ANALISIS KUARTALAN (QUARTERLY REPORT)';
  t2.font = { name: 'Georgia', bold: true, size: 15, color: { argb: 'FF' + C.navyBg } };
  t2.alignment = { horizontal: 'center', vertical: 'middle' };
  ws2.getRow(1).height = 36;

  // Subtitle Row A2:K2
  ws2.mergeCells('A2:K2');
  const st2 = ws2.getCell('A2');
  st2.value = `Rekapitulasi Anggaran IT per Kuartal (Q1, Q2, Q3, Q4) — Tahun Fiskal ${selectedYear} (${companyName})`;
  st2.font = { name: 'Arial', italic: true, size: 9.5, color: { argb: 'FF' + C.grayText } };
  st2.alignment = { horizontal: 'center', vertical: 'middle' };
  ws2.getRow(2).height = 18;

  ws2.addRow([]); // Blank row 3

  addSectionHeaderRow(ws2, 'II. REKAPITULASI PENYERAPAN ANGGARAN IT PER KUARTAL', 'K');

  // Header Row 5
  const hdr2 = ws2.addRow([
    'Kategori Akun IT', 'Klasifikasi', 'Pagu Anggaran (IDR)',
    'Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Okt-Des)',
    'Total YTD (IDR)', 'Sisa Budget (IDR)', '% Serapan YTD', 'Status Varian'
  ]);
  styleHeaderRow(hdr2, C.navyBg, C.navyText);
  hdr2.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

  // OPEX Banner
  const opexBanner2 = ws2.addRow(['--- BIAYA OPERASIONAL (OPEX) ---']);
  ws2.mergeCells(`A${ws2.rowCount}:K${ws2.rowCount}`);
  opexBanner2.height = 22;
  opexBanner2.getCell(1).font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FFFFFFFF' } };
  opexBanner2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.opexBg } };

  opexCategories.forEach((cat, idx) => {
    const isAlt = idx % 2 === 1;
    const q1 = getQuarterSum(cat.months, 0);
    const q2 = getQuarterSum(cat.months, 1);
    const q3 = getQuarterSum(cat.months, 2);
    const q4 = getQuarterSum(cat.months, 3);
    const r = ws2.addRow([
      cat.name, cat.type, cat.budget,
      q1, q2, q3, q4,
      cat.ytdActual, cat.variance,
      cat.budget > 0 ? (cat.ytdActual / cat.budget) : 0,
      cat.variance < 0 ? 'OVER BUDGET' : 'AMAN'
    ]);
    r.height = 20;
    r.eachCell({ includeEmpty: true }, (cell, colIdx) => {
      cell.border = allBorders();
      cell.font = { name: 'Arial', size: 9.5 };
      if (isAlt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.altRow } };

      if (colIdx === 1) { cell.font = { name: 'Arial', bold: true, size: 9.5 }; cell.alignment = { vertical: 'middle', horizontal: 'left' }; }
      else if (colIdx === 2) cell.alignment = { vertical: 'middle', horizontal: 'center' };
      else if (colIdx >= 3 && colIdx <= 9) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = numFmt; }
      else if (colIdx === 10) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = pctFmt; }
      else if (colIdx === 11) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + (cat.variance < 0 ? C.redText : C.greenText) } };
      }
    });
  });

  const opexQ1 = getQuarterSum(opexMonthsTotal, 0);
  const opexQ2 = getQuarterSum(opexMonthsTotal, 1);
  const opexQ3 = getQuarterSum(opexMonthsTotal, 2);
  const opexQ4 = getQuarterSum(opexMonthsTotal, 3);

  const subOpex2 = ws2.addRow([
    'SUBTOTAL OPEX', 'OPEX', opexBudgetTotal,
    opexQ1, opexQ2, opexQ3, opexQ4,
    opexYtdTotal, opexVarianceTotal,
    opexBudgetTotal > 0 ? opexYtdTotal / opexBudgetTotal : 0,
    opexVarianceTotal < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);
  subOpex2.height = 22;
  subOpex2.eachCell({ includeEmpty: true }, (cell, colIdx) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.subtotalBg } };
    cell.font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + C.navyBg } };
    cell.border = allBorders(C.slateBg);
    if (colIdx === 1) cell.alignment = { vertical: 'middle', horizontal: 'left' };
    else if (colIdx === 2) cell.alignment = { vertical: 'middle', horizontal: 'center' };
    else if (colIdx >= 3 && colIdx <= 9) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = numFmt; }
    else if (colIdx === 10) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = pctFmt; }
    else if (colIdx === 11) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + (opexVarianceTotal < 0 ? C.redText : C.greenText) } };
    }
  });

  ws2.addRow([]); // Blank row

  // CAPEX Banner
  const capexBanner2 = ws2.addRow(['--- INVESTASI & BELANJA MODAL (CAPEX) ---']);
  ws2.mergeCells(`A${ws2.rowCount}:K${ws2.rowCount}`);
  capexBanner2.height = 22;
  capexBanner2.getCell(1).font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FFFFFFFF' } };
  capexBanner2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.capexBg } };

  capexCategories.forEach((cat, idx) => {
    const isAlt = idx % 2 === 1;
    const q1 = getQuarterSum(cat.months, 0);
    const q2 = getQuarterSum(cat.months, 1);
    const q3 = getQuarterSum(cat.months, 2);
    const q4 = getQuarterSum(cat.months, 3);
    const r = ws2.addRow([
      cat.name, cat.type, cat.budget,
      q1, q2, q3, q4,
      cat.ytdActual, cat.variance,
      cat.budget > 0 ? (cat.ytdActual / cat.budget) : 0,
      cat.variance < 0 ? 'OVER BUDGET' : 'AMAN'
    ]);
    r.height = 20;
    r.eachCell({ includeEmpty: true }, (cell, colIdx) => {
      cell.border = allBorders();
      cell.font = { name: 'Arial', size: 9.5 };
      if (isAlt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.altRow } };

      if (colIdx === 1) { cell.font = { name: 'Arial', bold: true, size: 9.5 }; cell.alignment = { vertical: 'middle', horizontal: 'left' }; }
      else if (colIdx === 2) cell.alignment = { vertical: 'middle', horizontal: 'center' };
      else if (colIdx >= 3 && colIdx <= 9) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = numFmt; }
      else if (colIdx === 10) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = pctFmt; }
      else if (colIdx === 11) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + (cat.variance < 0 ? C.redText : C.greenText) } };
      }
    });
  });

  const capexQ1 = getQuarterSum(capexMonthsTotal, 0);
  const capexQ2 = getQuarterSum(capexMonthsTotal, 1);
  const capexQ3 = getQuarterSum(capexMonthsTotal, 2);
  const capexQ4 = getQuarterSum(capexMonthsTotal, 3);

  const subCapex2 = ws2.addRow([
    'SUBTOTAL CAPEX', 'CAPEX', capexBudgetTotal,
    capexQ1, capexQ2, capexQ3, capexQ4,
    capexYtdTotal, capexVarianceTotal,
    capexBudgetTotal > 0 ? capexYtdTotal / capexBudgetTotal : 0,
    capexVarianceTotal < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);
  subCapex2.height = 22;
  subCapex2.eachCell({ includeEmpty: true }, (cell, colIdx) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.subtotalBg } };
    cell.font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + C.navyBg } };
    cell.border = allBorders(C.slateBg);
    if (colIdx === 1) cell.alignment = { vertical: 'middle', horizontal: 'left' };
    else if (colIdx === 2) cell.alignment = { vertical: 'middle', horizontal: 'center' };
    else if (colIdx >= 3 && colIdx <= 9) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = numFmt; }
    else if (colIdx === 10) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = pctFmt; }
    else if (colIdx === 11) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + (capexVarianceTotal < 0 ? C.redText : C.greenText) } };
    }
  });

  ws2.addRow([]); // Blank row

  const grandQ1 = getQuarterSum(grandMonthsTotal, 0);
  const grandQ2 = getQuarterSum(grandMonthsTotal, 1);
  const grandQ3 = getQuarterSum(grandMonthsTotal, 2);
  const grandQ4 = getQuarterSum(grandMonthsTotal, 3);

  const grandTot2 = ws2.addRow([
    'GRAND TOTAL BIAYA IT', 'TOTAL', grandBudgetTotal,
    grandQ1, grandQ2, grandQ3, grandQ4,
    grandYtdTotal, grandVarianceTotal,
    grandBudgetTotal > 0 ? grandYtdTotal / grandBudgetTotal : 0,
    grandVarianceTotal < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);
  grandTot2.height = 24;
  grandTot2.eachCell({ includeEmpty: true }, (cell, colIdx) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.totalBg } };
    cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FF' + C.navyBg } };
    cell.border = {
      top: thinBorder(C.navyBg),
      bottom: { style: 'double', color: { argb: 'FF' + C.navyBg } },
      left: thinBorder(C.navyBg),
      right: thinBorder(C.navyBg),
    };
    if (colIdx === 1) cell.alignment = { vertical: 'middle', horizontal: 'left' };
    else if (colIdx === 2) cell.alignment = { vertical: 'middle', horizontal: 'center' };
    else if (colIdx >= 3 && colIdx <= 9) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = numFmt; }
    else if (colIdx === 10) { cell.alignment = { vertical: 'middle', horizontal: 'right' }; cell.numFmt = pctFmt; }
    else if (colIdx === 11) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FF' + (grandVarianceTotal < 0 ? C.redText : C.greenText) } };
    }
  });


  // ═════════════════════════════════════════════════════════════════════════
  // SHEET 3: KPI & Executive Summary
  // ═════════════════════════════════════════════════════════════════════════
  const ws3 = wb.addWorksheet('KPI & Executive Summary', { views: [{ state: 'frozen', ySplit: 4, showGridLines: true }] });

  ws3.columns = [
    { width: 38 },
    { width: 26 },
    { width: 55 }
  ];

  // Title Row A1:C1
  ws3.mergeCells('A1:C1');
  const t3 = ws3.getCell('A1');
  t3.value = `RINGKASAN EKSEKUTIF & ANALISIS KESEHATAN BUDGET IT ${selectedYear}`;
  t3.font = { name: 'Georgia', bold: true, size: 15, color: { argb: 'FF' + C.navyBg } };
  t3.alignment = { horizontal: 'center', vertical: 'middle' };
  ws3.getRow(1).height = 36;

  // Subtitle Row A2:C2
  ws3.mergeCells('A2:C2');
  const st3 = ws3.getCell('A2');
  st3.value = `Entitas Perusahaan: ${companyName} | Disiapkan oleh: System IT Budget 360 MRA`;
  st3.font = { name: 'Arial', italic: true, size: 9.5, color: { argb: 'FF' + C.grayText } };
  st3.alignment = { horizontal: 'center', vertical: 'middle' };
  ws3.getRow(2).height = 18;

  ws3.addRow([]); // Blank row 3

  const hdr3 = ws3.addRow(['Key Performance Indicator (KPI)', 'Nilai (IDR / %)', 'Keterangan Analitis Eksekutif']);
  styleHeaderRow(hdr3, C.navyBg, C.navyText);
  hdr3.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
  hdr3.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };

  const summaryItems = [
    { label: 'Total Pagu Budget IT (Full Year)', val: grandBudgetTotal, type: 'currency', note: 'Akumulasi Pagu Anggaran OPEX & CAPEX disetujui' },
    { label: 'Realisasi YTD (12 Bulan)', val: grandYtdTotal, type: 'currency', note: 'Total pengeluaran riil ter-tag dan sewa aset' },
    { label: 'Realisasi Kuartal 1 (Q1 Jan-Mar)', val: grandQ1, type: 'currency', note: `Penyerapan Q1 (${grandBudgetTotal > 0 ? ((grandQ1/grandBudgetTotal)*100).toFixed(1) : 0}%)` },
    { label: 'Realisasi Kuartal 2 (Q2 Apr-Jun)', val: grandQ2, type: 'currency', note: `Penyerapan Q2 (${grandBudgetTotal > 0 ? ((grandQ2/grandBudgetTotal)*100).toFixed(1) : 0}%)` },
    { label: 'Realisasi Kuartal 3 (Q3 Jul-Sep)', val: grandQ3, type: 'currency', note: `Penyerapan Q3 (${grandBudgetTotal > 0 ? ((grandQ3/grandBudgetTotal)*100).toFixed(1) : 0}%)` },
    { label: 'Realisasi Kuartal 4 (Q4 Okt-Des)', val: grandQ4, type: 'currency', note: `Penyerapan Q4 (${grandBudgetTotal > 0 ? ((grandQ4/grandBudgetTotal)*100).toFixed(1) : 0}%)` },
    { label: 'Sisa Pagu Budget (Varian)', val: grandVarianceTotal, type: 'currency', note: grandVarianceTotal < 0 ? 'STATUS: OVER BUDGET' : 'STATUS: AMAN DALAM PAGU' },
    { label: 'Persentase Penyerapan Budget YTD', val: grandBudgetTotal > 0 ? (grandYtdTotal / grandBudgetTotal) : 0, type: 'percent', note: `Penyerapan YTD rata-rata (${grandUtilPct}%)` },
    { label: 'Total Biaya Operasional (OPEX)', val: opexYtdTotal, type: 'currency', note: 'Sewa Device, Subskripsi & Internet ISP' },
    { label: 'Total Biaya Inovasi (CAPEX)', val: capexYtdTotal, type: 'currency', note: 'Investasi Proyek & Modernisasi Sistem' },
    { label: 'Eliminasi Transaksi Intercompany', val: reportData?.intercompanyElimination?.eliminationAmount || 0, type: 'currency', note: 'Sewa internal antar anak perusahaan MRA Group' },
    { label: 'Kas Keluar Netto (Net Cash Outflow)', val: reportData?.intercompanyElimination?.netCashOutflow || grandYtdTotal, type: 'currency', note: 'Total kas keluar bersih setelah eliminasi intercompany' },
  ];

  summaryItems.forEach((item, idx) => {
    const isAlt = idx % 2 === 1;
    const r = ws3.addRow([item.label, item.val, item.note]);
    r.height = 22;
    r.eachCell({ includeEmpty: true }, (cell, colIdx) => {
      cell.border = allBorders();
      cell.font = { name: 'Arial', size: 9.5 };
      if (isAlt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.altRow } };

      if (colIdx === 1) {
        cell.font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + C.navyBg } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else if (colIdx === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (item.type === 'currency') cell.numFmt = numFmt;
        else if (item.type === 'percent') cell.numFmt = pctFmt;
        cell.font = { name: 'Arial', bold: true, size: 9.5 };
      } else if (colIdx === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        if (item.label.includes('Varian')) {
          cell.font = { name: 'Arial', bold: true, size: 9.5, color: { argb: 'FF' + (grandVarianceTotal < 0 ? C.redText : C.greenText) } };
        }
      }
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // GENERATE WORKBOOK BUFFER & TRIGGER DOWNLOAD
  // ═════════════════════════════════════════════════════════════════════════
  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(buffer, `MRA_IT_Budget_360_Executive_Report_${selectedYear}.xlsx`);
}
