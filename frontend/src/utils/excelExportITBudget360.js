import * as XLSX from 'xlsx';

/**
 * Professional & Analytical Excel Exporter for IT Budget 360
 * Includes Full 12-Month Matrix, Quarterly Breakdown (Q1, Q2, Q3, Q4), and Executive KPI Summary.
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
  const fmtNum = (val) => (typeof val === 'number' ? val : 0);

  const getQuarterSum = (arr, qIdx) => {
    const start = qIdx * 3;
    return arr.slice(start, start + 3).reduce((a, b) => a + fmtNum(b), 0);
  };

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
  // SHEET 2: Rekapitulasi Kuartal (Q1, Q2, Q3, Q4)
  // =========================================================================
  const opexQ1 = getQuarterSum(opexMonthsTotal, 0);
  const opexQ2 = getQuarterSum(opexMonthsTotal, 1);
  const opexQ3 = getQuarterSum(opexMonthsTotal, 2);
  const opexQ4 = getQuarterSum(opexMonthsTotal, 3);

  const capexQ1 = getQuarterSum(capexMonthsTotal, 0);
  const capexQ2 = getQuarterSum(capexMonthsTotal, 1);
  const capexQ3 = getQuarterSum(capexMonthsTotal, 2);
  const capexQ4 = getQuarterSum(capexMonthsTotal, 3);

  const grandQ1 = getQuarterSum(grandMonthsTotal, 0);
  const grandQ2 = getQuarterSum(grandMonthsTotal, 1);
  const grandQ3 = getQuarterSum(grandMonthsTotal, 2);
  const grandQ4 = getQuarterSum(grandMonthsTotal, 3);

  const sheet2Data = [
    ['MRA GROUP — LAPORAN ANALISIS KUARTALAN (QUARTERLY REPORT)'],
    [`Rekapitulasi Anggaran IT per Kuartal (Q1, Q2, Q3, Q4) — Tahun Fiskal ${selectedYear} (${companyName})`],
    [],
    ['Kategori Akun IT', 'Klasifikasi', 'Pagu Anggaran (IDR)', 'Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Okt-Des)', 'Total Realisasi YTD (IDR)', 'Sisa Budget (IDR)', '% Serapan YTD', 'Status Varian'],
    ['--- BIAYA OPERASIONAL (OPEX) ---']
  ];

  opexCategories.forEach((cat) => {
    const q1 = getQuarterSum(cat.months, 0);
    const q2 = getQuarterSum(cat.months, 1);
    const q3 = getQuarterSum(cat.months, 2);
    const q4 = getQuarterSum(cat.months, 3);
    sheet2Data.push([
      cat.name,
      cat.type,
      fmtNum(cat.budget),
      fmtNum(q1),
      fmtNum(q2),
      fmtNum(q3),
      fmtNum(q4),
      fmtNum(cat.ytdActual),
      fmtNum(cat.variance),
      `${cat.utilPct}%`,
      cat.variance < 0 ? 'OVER BUDGET' : 'AMAN'
    ]);
  });

  sheet2Data.push([
    'SUBTOTAL OPEX',
    'OPEX',
    fmtNum(opexBudgetTotal),
    fmtNum(opexQ1),
    fmtNum(opexQ2),
    fmtNum(opexQ3),
    fmtNum(opexQ4),
    fmtNum(opexYtdTotal),
    fmtNum(opexVarianceTotal),
    `${opexBudgetTotal > 0 ? ((opexYtdTotal / opexBudgetTotal) * 100).toFixed(1) : 0}%`,
    opexVarianceTotal < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);

  sheet2Data.push([]);
  sheet2Data.push(['--- INVESTASI & BELANJA MODAL (CAPEX) ---']);

  capexCategories.forEach((cat) => {
    const q1 = getQuarterSum(cat.months, 0);
    const q2 = getQuarterSum(cat.months, 1);
    const q3 = getQuarterSum(cat.months, 2);
    const q4 = getQuarterSum(cat.months, 3);
    sheet2Data.push([
      cat.name,
      cat.type,
      fmtNum(cat.budget),
      fmtNum(q1),
      fmtNum(q2),
      fmtNum(q3),
      fmtNum(q4),
      fmtNum(cat.ytdActual),
      fmtNum(cat.variance),
      `${cat.utilPct}%`,
      cat.variance < 0 ? 'OVER BUDGET' : 'AMAN'
    ]);
  });

  sheet2Data.push([
    'SUBTOTAL CAPEX',
    'CAPEX',
    fmtNum(capexBudgetTotal),
    fmtNum(capexQ1),
    fmtNum(capexQ2),
    fmtNum(capexQ3),
    fmtNum(capexQ4),
    fmtNum(capexYtdTotal),
    fmtNum(capexVarianceTotal),
    `${capexBudgetTotal > 0 ? ((capexYtdTotal / capexBudgetTotal) * 100).toFixed(1) : 0}%`,
    capexVarianceTotal < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);

  sheet2Data.push([]);
  sheet2Data.push([
    'GRAND TOTAL BIAYA IT',
    'TOTAL',
    fmtNum(grandBudgetTotal),
    fmtNum(grandQ1),
    fmtNum(grandQ2),
    fmtNum(grandQ3),
    fmtNum(grandQ4),
    fmtNum(grandYtdTotal),
    fmtNum(grandVarianceTotal),
    `${grandUtilPct}%`,
    grandVarianceTotal < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);

  const wsSheet2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  wsSheet2['!cols'] = [
    { wch: 30 }, { wch: 14 }, { wch: 22 },
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 22 }, { wch: 24 }, { wch: 14 }, { wch: 18 }
  ];
  wsSheet2['!views'] = [{ state: 'frozen', ySplit: 4 }];

  // =========================================================================
  // SHEET 3: KPI & Executive Summary
  // =========================================================================
  const summaryData = [
    [`RINGKASAN EKSEKUTIF & ANALISIS KESEHATAN BUDGET IT ${selectedYear}`],
    [`Entitas Perusahaan: ${companyName}`],
    [],
    ['Key Performance Indicator (KPI)', 'Nilai (IDR)', 'Keterangan Analitis'],
    ['Total Pagu Budget IT (Full Year)', grandBudgetTotal, 'Akumulasi Pagu Anggaran OPEX & CAPEX'],
    ['Realisasi YTD (12 Bulan)', grandYtdTotal, 'Total pengeluaran riil ter-tag dan sewa aset'],
    ['Realisasi Kuartal 1 (Q1 Jan-Mar)', grandQ1, 'Pengeluaran Periode Kuartal Pertama'],
    ['Realisasi Kuartal 2 (Q2 Apr-Jun)', grandQ2, 'Pengeluaran Periode Kuartal Kedua'],
    ['Realisasi Kuartal 3 (Q3 Jul-Sep)', grandQ3, 'Pengeluaran Periode Kuartal Ketiga'],
    ['Realisasi Kuartal 4 (Q4 Okt-Des)', grandQ4, 'Pengeluaran Periode Kuartal Keempat'],
    ['Sisa Pagu Budget (Varian)', grandVarianceTotal, grandVarianceTotal < 0 ? 'STATUS: OVER BUDGET' : 'STATUS: AMAN'],
    ['Persentase Penyerapan Budget YTD', `${grandUtilPct}%`, `Rata-rata penyerapan budget (${grandUtilPct}%)`],
    ['Total OPEX Rutin', opexYtdTotal, 'Sewa Device, Subskripsi & Internet ISP'],
    ['Total CAPEX Inovasi', capexYtdTotal, 'Investasi Proyek & Modernisasi Sistem'],
    ['Eliminasi Intercompany', reportData?.intercompanyElimination?.eliminationAmount || 0, 'Sewa internal antar anak perusahaan MRA Group'],
    ['Kas Keluar Netto (Net Outflow)', reportData?.intercompanyElimination?.netCashOutflow || grandYtdTotal, 'Total kas keluar bersih setelah eliminasi']
  ];

  const wsSheet3 = XLSX.utils.aoa_to_sheet(summaryData);
  wsSheet3['!cols'] = [
    { wch: 38 },
    { wch: 26 },
    { wch: 50 }
  ];

  // =========================================================================
  // BUILD WORKBOOK WITH ALL 3 SHEETS
  // =========================================================================
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSheet1, 'Matriks Cost Overview 12Bln');
  XLSX.utils.book_append_sheet(wb, wsSheet2, 'Rekapitulasi Kuartal (Q1-Q4)');
  XLSX.utils.book_append_sheet(wb, wsSheet3, 'KPI & Executive Summary');

  XLSX.writeFile(wb, `MRA_IT_Budget_360_Quarterly_${selectedYear}.xlsx`);
}
