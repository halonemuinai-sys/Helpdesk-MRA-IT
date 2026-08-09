import * as XLSX from 'xlsx';

/**
 * Professional & Analytical Excel Exporter for IT Budget 360
 * Inspired by Bvlgari Advisor Performance 6-Month / Semester Report Design
 * 
 * Features 4 Structured Worksheets:
 * 1. Matriks Cost Overview 12Bln (Full Year OPEX & CAPEX Matrix)
 * 2. Semester 1 (Jan - Jun) (H1 6-Month Performance Breakdown)
 * 3. Semester 2 (Jul - Des) (H2 6-Month Performance Breakdown)
 * 4. KPI & Executive Summary (Executive Analysis & Intercompany Net Outflow)
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
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const h1Months = monthNames.slice(0, 6);
  const h2Months = monthNames.slice(6, 12);

  // Helper to format currency numbers cleanly
  const fmtNum = (val) => (typeof val === 'number' ? val : 0);

  // =========================================================================
  // SHEET 1: Matriks Cost Overview (12 Bulan Full Year)
  // =========================================================================
  const sheet1Data = [
    ['MRA GROUP — IT BUDGET 360 REPORT'],
    [`Rekapitulasi Pagu Anggaran vs Realisasi Biaya IT (OPEX & CAPEX) — Tahun Fiskal ${selectedYear}`],
    [`Entitas: ${companyName} | Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`],
    [],
    ['Kategori Akun IT', 'Klasifikasi', 'Pagu Anggaran (IDR)', ...monthNames, 'Total YTD (IDR)', 'Sisa Budget / Varian (IDR)', '% Serapan', 'Status Varian'],
    ['--- BIAYA OPERASIONAL (OPEX) ---']
  ];

  opexCategories.forEach((cat) => {
    sheet1Data.push([
      cat.name,
      cat.type,
      fmtNum(cat.budget),
      ...cat.months.map(fmtNum),
      fmtNum(cat.ytdActual),
      fmtNum(cat.variance),
      `${cat.utilPct}%`,
      cat.variance < 0 ? 'OVER BUDGET' : 'AMAN'
    ]);
  });

  sheet1Data.push([
    'SUBTOTAL OPEX',
    'OPEX',
    fmtNum(opexBudgetTotal),
    ...opexMonthsTotal.map(fmtNum),
    fmtNum(opexYtdTotal),
    fmtNum(opexVarianceTotal),
    `${opexBudgetTotal > 0 ? ((opexYtdTotal / opexBudgetTotal) * 100).toFixed(1) : 0}%`,
    opexVarianceTotal < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);

  sheet1Data.push([]);
  sheet1Data.push(['--- INVESTASI & BELANJA MODAL (CAPEX) ---']);

  capexCategories.forEach((cat) => {
    sheet1Data.push([
      cat.name,
      cat.type,
      fmtNum(cat.budget),
      ...cat.months.map(fmtNum),
      fmtNum(cat.ytdActual),
      fmtNum(cat.variance),
      `${cat.utilPct}%`,
      cat.variance < 0 ? 'OVER BUDGET' : 'AMAN'
    ]);
  });

  sheet1Data.push([
    'SUBTOTAL CAPEX',
    'CAPEX',
    fmtNum(capexBudgetTotal),
    ...capexMonthsTotal.map(fmtNum),
    fmtNum(capexYtdTotal),
    fmtNum(capexVarianceTotal),
    `${capexBudgetTotal > 0 ? ((capexYtdTotal / capexBudgetTotal) * 100).toFixed(1) : 0}%`,
    capexVarianceTotal < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);

  sheet1Data.push([]);
  sheet1Data.push([
    'GRAND TOTAL BIAYA IT',
    'TOTAL',
    fmtNum(grandBudgetTotal),
    ...grandMonthsTotal.map(fmtNum),
    fmtNum(grandYtdTotal),
    fmtNum(grandVarianceTotal),
    `${grandUtilPct}%`,
    grandVarianceTotal < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);

  const wsSheet1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  wsSheet1['!cols'] = [
    { wch: 30 }, { wch: 14 }, { wch: 22 },
    ...Array(12).fill({ wch: 15 }),
    { wch: 22 }, { wch: 24 }, { wch: 14 }, { wch: 18 }
  ];
  wsSheet1['!views'] = [{ state: 'frozen', ySplit: 5 }];

  // =========================================================================
  // SHEET 2: Semester 1 (Januari - Juni) Breakdown 6 Bulan
  // =========================================================================
  const opexH1MonthsTotal = opexMonthsTotal.slice(0, 6);
  const opexH1YtdTotal = opexH1MonthsTotal.reduce((a, b) => a + b, 0);
  const capexH1MonthsTotal = capexMonthsTotal.slice(0, 6);
  const capexH1YtdTotal = capexH1MonthsTotal.reduce((a, b) => a + b, 0);
  const grandH1MonthsTotal = grandMonthsTotal.slice(0, 6);
  const grandH1YtdTotal = grandH1MonthsTotal.reduce((a, b) => a + b, 0);

  const sheet2Data = [
    ['MRA GROUP — LAPORAN PERFORMANCE SEMESTER 1 (JAN - JUN)'],
    [`Rekapitulasi Penyerapan Anggaran IT Semester Pertama — Tahun Fiskal ${selectedYear} (${companyName})`],
    [],
    ['Kategori Akun IT', 'Klasifikasi', 'Pagu Anggaran (IDR)', ...h1Months, 'Total Realisasi H1 (IDR)', 'Sisa Budget H1 (IDR)', '% Serapan H1', 'Status H1'],
    ['--- BIAYA OPERASIONAL (OPEX) ---']
  ];

  opexCategories.forEach((cat) => {
    const h1Actual = cat.months.slice(0, 6).reduce((a, b) => a + b, 0);
    const h1BudgetHalf = cat.budget / 2;
    const h1Variance = h1BudgetHalf - h1Actual;
    const h1Util = h1BudgetHalf > 0 ? ((h1Actual / h1BudgetHalf) * 100).toFixed(1) : '0';
    sheet2Data.push([
      cat.name,
      cat.type,
      fmtNum(cat.budget),
      ...cat.months.slice(0, 6).map(fmtNum),
      fmtNum(h1Actual),
      fmtNum(h1Variance),
      `${h1Util}%`,
      h1Variance < 0 ? 'OVER BUDGET' : 'AMAN'
    ]);
  });

  sheet2Data.push([
    'SUBTOTAL OPEX (H1)',
    'OPEX',
    fmtNum(opexBudgetTotal),
    ...opexH1MonthsTotal.map(fmtNum),
    fmtNum(opexH1YtdTotal),
    fmtNum((opexBudgetTotal / 2) - opexH1YtdTotal),
    `${opexBudgetTotal > 0 ? ((opexH1YtdTotal / (opexBudgetTotal / 2)) * 100).toFixed(1) : 0}%`,
    ((opexBudgetTotal / 2) - opexH1YtdTotal) < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);

  sheet2Data.push([]);
  sheet2Data.push(['--- INVESTASI & BELANJA MODAL (CAPEX) ---']);

  capexCategories.forEach((cat) => {
    const h1Actual = cat.months.slice(0, 6).reduce((a, b) => a + b, 0);
    const h1BudgetHalf = cat.budget / 2;
    const h1Variance = h1BudgetHalf - h1Actual;
    const h1Util = h1BudgetHalf > 0 ? ((h1Actual / h1BudgetHalf) * 100).toFixed(1) : '0';
    sheet2Data.push([
      cat.name,
      cat.type,
      fmtNum(cat.budget),
      ...cat.months.slice(0, 6).map(fmtNum),
      fmtNum(h1Actual),
      fmtNum(h1Variance),
      `${h1Util}%`,
      h1Variance < 0 ? 'OVER BUDGET' : 'AMAN'
    ]);
  });

  sheet2Data.push([
    'SUBTOTAL CAPEX (H1)',
    'CAPEX',
    fmtNum(capexBudgetTotal),
    ...capexH1MonthsTotal.map(fmtNum),
    fmtNum(capexH1YtdTotal),
    fmtNum((capexBudgetTotal / 2) - capexH1YtdTotal),
    `${capexBudgetTotal > 0 ? ((capexH1YtdTotal / (capexBudgetTotal / 2)) * 100).toFixed(1) : 0}%`,
    ((capexBudgetTotal / 2) - capexH1YtdTotal) < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);

  sheet2Data.push([]);
  sheet2Data.push([
    'TOTAL BIAYA IT (H1)',
    'TOTAL',
    fmtNum(grandBudgetTotal),
    ...grandH1MonthsTotal.map(fmtNum),
    fmtNum(grandH1YtdTotal),
    fmtNum((grandBudgetTotal / 2) - grandH1YtdTotal),
    `${grandBudgetTotal > 0 ? ((grandH1YtdTotal / (grandBudgetTotal / 2)) * 100).toFixed(1) : 0}%`,
    ((grandBudgetTotal / 2) - grandH1YtdTotal) < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);

  const wsSheet2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  wsSheet2['!cols'] = [
    { wch: 30 }, { wch: 14 }, { wch: 22 },
    ...Array(6).fill({ wch: 15 }),
    { wch: 22 }, { wch: 24 }, { wch: 14 }, { wch: 18 }
  ];
  wsSheet2['!views'] = [{ state: 'frozen', ySplit: 4 }];

  // =========================================================================
  // SHEET 3: Semester 2 (Juli - Desember) Breakdown 6 Bulan
  // =========================================================================
  const opexH2MonthsTotal = opexMonthsTotal.slice(6, 12);
  const opexH2YtdTotal = opexH2MonthsTotal.reduce((a, b) => a + b, 0);
  const capexH2MonthsTotal = capexMonthsTotal.slice(6, 12);
  const capexH2YtdTotal = capexH2MonthsTotal.reduce((a, b) => a + b, 0);
  const grandH2MonthsTotal = grandMonthsTotal.slice(6, 12);
  const grandH2YtdTotal = grandH2MonthsTotal.reduce((a, b) => a + b, 0);

  const sheet3Data = [
    ['MRA GROUP — LAPORAN PERFORMANCE SEMESTER 2 (JUL - DES)'],
    [`Rekapitulasi Penyerapan Anggaran IT Semester Kedua — Tahun Fiskal ${selectedYear} (${companyName})`],
    [],
    ['Kategori Akun IT', 'Klasifikasi', 'Pagu Anggaran (IDR)', ...h2Months, 'Total Realisasi H2 (IDR)', 'Sisa Budget H2 (IDR)', '% Serapan H2', 'Status H2'],
    ['--- BIAYA OPERASIONAL (OPEX) ---']
  ];

  opexCategories.forEach((cat) => {
    const h2Actual = cat.months.slice(6, 12).reduce((a, b) => a + b, 0);
    const h2BudgetHalf = cat.budget / 2;
    const h2Variance = h2BudgetHalf - h2Actual;
    const h2Util = h2BudgetHalf > 0 ? ((h2Actual / h2BudgetHalf) * 100).toFixed(1) : '0';
    sheet3Data.push([
      cat.name,
      cat.type,
      fmtNum(cat.budget),
      ...cat.months.slice(6, 12).map(fmtNum),
      fmtNum(h2Actual),
      fmtNum(h2Variance),
      `${h2Util}%`,
      h2Variance < 0 ? 'OVER BUDGET' : 'AMAN'
    ]);
  });

  sheet3Data.push([
    'SUBTOTAL OPEX (H2)',
    'OPEX',
    fmtNum(opexBudgetTotal),
    ...opexH2MonthsTotal.map(fmtNum),
    fmtNum(opexH2YtdTotal),
    fmtNum((opexBudgetTotal / 2) - opexH2YtdTotal),
    `${opexBudgetTotal > 0 ? ((opexH2YtdTotal / (opexBudgetTotal / 2)) * 100).toFixed(1) : 0}%`,
    ((opexBudgetTotal / 2) - opexH2YtdTotal) < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);

  sheet3Data.push([]);
  sheet3Data.push(['--- INVESTASI & BELANJA MODAL (CAPEX) ---']);

  capexCategories.forEach((cat) => {
    const h2Actual = cat.months.slice(6, 12).reduce((a, b) => a + b, 0);
    const h2BudgetHalf = cat.budget / 2;
    const h2Variance = h2BudgetHalf - h2Actual;
    const h2Util = h2BudgetHalf > 0 ? ((h2Actual / h2BudgetHalf) * 100).toFixed(1) : '0';
    sheet3Data.push([
      cat.name,
      cat.type,
      fmtNum(cat.budget),
      ...cat.months.slice(6, 12).map(fmtNum),
      fmtNum(h2Actual),
      fmtNum(h2Variance),
      `${h2Util}%`,
      h2Variance < 0 ? 'OVER BUDGET' : 'AMAN'
    ]);
  });

  sheet3Data.push([
    'SUBTOTAL CAPEX (H2)',
    'CAPEX',
    fmtNum(capexBudgetTotal),
    ...capexH2MonthsTotal.map(fmtNum),
    fmtNum(capexH2YtdTotal),
    fmtNum((capexBudgetTotal / 2) - capexH2YtdTotal),
    `${capexBudgetTotal > 0 ? ((capexH2YtdTotal / (capexBudgetTotal / 2)) * 100).toFixed(1) : 0}%`,
    ((capexBudgetTotal / 2) - capexH2YtdTotal) < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);

  sheet3Data.push([]);
  sheet3Data.push([
    'TOTAL BIAYA IT (H2)',
    'TOTAL',
    fmtNum(grandBudgetTotal),
    ...grandH2MonthsTotal.map(fmtNum),
    fmtNum(grandH2YtdTotal),
    fmtNum((grandBudgetTotal / 2) - grandH2YtdTotal),
    `${grandBudgetTotal > 0 ? ((grandH2YtdTotal / (grandBudgetTotal / 2)) * 100).toFixed(1) : 0}%`,
    ((grandBudgetTotal / 2) - grandH2YtdTotal) < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);

  const wsSheet3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  wsSheet3['!cols'] = [
    { wch: 30 }, { wch: 14 }, { wch: 22 },
    ...Array(6).fill({ wch: 15 }),
    { wch: 22 }, { wch: 24 }, { wch: 14 }, { wch: 18 }
  ];
  wsSheet3['!views'] = [{ state: 'frozen', ySplit: 4 }];

  // =========================================================================
  // SHEET 4: KPI & Executive Summary (Analisis Kesehatan Budget IT)
  // =========================================================================
  const summaryData = [
    [`RINGKASAN EKSEKUTIF & ANALISIS KESEHATAN BUDGET IT ${selectedYear}`],
    [`Entitas Perusahaan: ${companyName}`],
    [],
    ['Key Performance Indicator (KPI)', 'Nilai (IDR)', 'Keterangan Analitis'],
    ['Total Pagu Budget IT (Full Year)', grandBudgetTotal, 'Akumulasi Pagu Anggaran OPEX & CAPEX'],
    ['Realisasi YTD (12 Bulan)', grandYtdTotal, 'Total pengeluaran riil ter-tag dan sewa aset'],
    ['Realisasi H1 (Semester 1)', grandH1YtdTotal, 'Pengeluaran Periode Januari s/d Juni'],
    ['Realisasi H2 (Semester 2)', grandH2YtdTotal, 'Pengeluaran Periode Juli s/d Desember'],
    ['Sisa Pagu Budget (Varian)', grandVarianceTotal, grandVarianceTotal < 0 ? 'STATUS: OVER BUDGET' : 'STATUS: AMAN'],
    ['Persentase Penyerapan Budget YTD', `${grandUtilPct}%`, `Rata-rata penyerapan budget (${grandUtilPct}%)`],
    ['Total OPEX Rutin', opexYtdTotal, 'Sewa Device, Subskripsi & Internet ISP'],
    ['Total CAPEX Inovasi', capexYtdTotal, 'Investasi Proyek & Modernisasi Sistem'],
    ['Eliminasi Intercompany', reportData?.intercompanyElimination?.eliminationAmount || 0, 'Sewa internal antar anak perusahaan MRA Group'],
    ['Kas Keluar Netto (Net Outflow)', reportData?.intercompanyElimination?.netCashOutflow || grandYtdTotal, 'Total kas keluar bersih setelah eliminasi']
  ];

  const wsSheet4 = XLSX.utils.aoa_to_sheet(summaryData);
  wsSheet4['!cols'] = [
    { wch: 38 },
    { wch: 26 },
    { wch: 50 }
  ];

  // =========================================================================
  // BUILD WORKBOOK WITH ALL 4 SHEETS
  // =========================================================================
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSheet1, 'Matriks Cost Overview 12Bln');
  XLSX.utils.book_append_sheet(wb, wsSheet2, 'Semester 1 (Jan - Jun)');
  XLSX.utils.book_append_sheet(wb, wsSheet3, 'Semester 2 (Jul - Des)');
  XLSX.utils.book_append_sheet(wb, wsSheet4, 'KPI & Executive Summary');

  XLSX.writeFile(wb, `MRA_IT_Budget_360_Report_${selectedYear}.xlsx`);
}
