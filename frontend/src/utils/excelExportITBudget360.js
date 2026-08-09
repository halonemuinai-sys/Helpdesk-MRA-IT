import * as XLSX from 'xlsx';

/**
 * Professional & Analytical Excel Exporter for IT Budget 360 using SheetJS (xlsx)
 * Generates formatted multi-sheet Excel (.xlsx) workbook with MRA Group branding,
 * OPEX/CAPEX breakdown, YTD variance analysis, and KPI Executive summary.
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

  // ==========================================
  // SHEET 1: Matriks Cost Overview (12 Bulan)
  // ==========================================
  const matrixData = [
    ['MRA GROUP — IT BUDGET 360 REPORT'],
    [`Rekapitulasi Pagu Anggaran vs Realisasi Biaya IT (OPEX & CAPEX) — Tahun Fiskal ${selectedYear} (${companyName})`],
    [`Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} | Disiapkan oleh: System IT Budget 360 MRA`],
    [],
    ['Kategori Akun IT', 'Klasifikasi', 'Pagu Anggaran (IDR)', ...monthNames, 'Total YTD (IDR)', 'Sisa Budget / Varian (IDR)', '% Serapan', 'Status Varian'],
    ['--- BIAYA OPERASIONAL (OPEX) ---']
  ];

  opexCategories.forEach((cat) => {
    matrixData.push([
      cat.name,
      cat.type,
      cat.budget,
      ...cat.months,
      cat.ytdActual,
      cat.variance,
      `${cat.utilPct}%`,
      cat.variance < 0 ? 'OVER BUDGET' : 'AMAN'
    ]);
  });

  matrixData.push([
    'SUBTOTAL OPEX',
    'OPEX',
    opexBudgetTotal,
    ...opexMonthsTotal,
    opexYtdTotal,
    opexVarianceTotal,
    `${opexBudgetTotal > 0 ? ((opexYtdTotal / opexBudgetTotal) * 100).toFixed(1) : 0}%`,
    opexVarianceTotal < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);

  matrixData.push([]);
  matrixData.push(['--- INVESTASI & BELANJA MODAL (CAPEX) ---']);

  capexCategories.forEach((cat) => {
    matrixData.push([
      cat.name,
      cat.type,
      cat.budget,
      ...cat.months,
      cat.ytdActual,
      cat.variance,
      `${cat.utilPct}%`,
      cat.variance < 0 ? 'OVER BUDGET' : 'AMAN'
    ]);
  });

  matrixData.push([
    'SUBTOTAL CAPEX',
    'CAPEX',
    capexBudgetTotal,
    ...capexMonthsTotal,
    capexYtdTotal,
    capexVarianceTotal,
    `${capexBudgetTotal > 0 ? ((capexYtdTotal / capexBudgetTotal) * 100).toFixed(1) : 0}%`,
    capexVarianceTotal < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);

  matrixData.push([]);
  matrixData.push([
    'GRAND TOTAL BIAYA IT',
    'TOTAL',
    grandBudgetTotal,
    ...grandMonthsTotal,
    grandYtdTotal,
    grandVarianceTotal,
    `${grandUtilPct}%`,
    grandVarianceTotal < 0 ? 'OVER BUDGET' : 'AMAN'
  ]);

  const wsMatrix = XLSX.utils.aoa_to_sheet(matrixData);

  // Set column widths
  wsMatrix['!cols'] = [
    { wch: 28 }, // Kategori Akun
    { wch: 14 }, // Klasifikasi
    { wch: 22 }, // Pagu Anggaran
    ...Array(12).fill({ wch: 14 }), // Jan-Des
    { wch: 22 }, // Total YTD
    { wch: 22 }, // Sisa Budget
    { wch: 14 }, // % Serapan
    { wch: 18 }  // Status Varian
  ];

  // ==========================================
  // SHEET 2: Ringkasan KPI & Analisis Executive
  // ==========================================
  const summaryData = [
    [`RINGKASAN EKSEKUTIF & ANALISIS KESEHATAN BUDGET IT ${selectedYear}`],
    [`Entitas Perusahaan: ${companyName}`],
    [],
    ['Key Performance Indicator (KPI)', 'Nilai (IDR)', 'Keterangan Analitis'],
    ['Total Pagu Budget IT', grandBudgetTotal, 'Akumulasi Pagu Anggaran OPEX & CAPEX'],
    ['Realisasi YTD (12 Bulan)', grandYtdTotal, 'Total pengeluaran riil ter-tag dan sewa aset'],
    ['Sisa Pagu Budget (Varian)', grandVarianceTotal, grandVarianceTotal < 0 ? 'STATUS: OVER BUDGET' : 'STATUS: AMAN'],
    ['Persentase Penyerapan Budget', `${grandUtilPct}%`, `Rata-rata penyerapan budget (${grandUtilPct}%)`],
    ['Total OPEX Rutin', opexYtdTotal, 'Sewa Device, Subskripsi & Internet ISP'],
    ['Total CAPEX Inovasi', capexYtdTotal, 'Investasi Proyek & Modernisasi Sistem'],
    ['Eliminasi Intercompany', reportData?.intercompanyElimination?.eliminationAmount || 0, 'Sewa internal antar anak perusahaan MRA Group'],
    ['Kas Keluar Netto (Net Outflow)', reportData?.intercompanyElimination?.netCashOutflow || grandYtdTotal, 'Total kas keluar bersih setelah eliminasi']
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 35 },
    { wch: 26 },
    { wch: 45 }
  ];

  // ==========================================
  // CREATE WORKBOOK & TRIGGER DOWNLOAD
  // ==========================================
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Matriks Cost Overview 12Bln');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan KPI & Analisis');

  XLSX.writeFile(wb, `MRA_IT_Budget_360_Matrix_${selectedYear}.xlsx`);
}
