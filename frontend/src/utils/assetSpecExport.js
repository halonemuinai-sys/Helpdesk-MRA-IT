export const exportAssetSpecComparisonExcel = async ({
  assets = [],
  companyMasters = [],
  filterLabel = 'Keseluruhan Aset IT'
}) => {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MRA IT Management System';
  wb.created = new Date();

  // Color Palette
  const C_HEADER_FILL = '1E293B'; // Dark Slate
  const C_HEADER_FONT = 'FFFFFF';
  const C_TITLE_FONT = '991B1B'; // Rose 800
  const C_BORDER = 'CBD5E1';

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 1: DATA RINCIAN SPESIFIKASI HARDWARE
  // ─────────────────────────────────────────────────────────────────────────────
  const wsData = wb.addWorksheet('Data Spesifikasi Hardware', {
    views: [{ showGridLines: true }]
  });

  // Title Block
  wsData.mergeCells('A1:N1');
  const titleCell = wsData.getCell('A1');
  titleCell.value = 'MRA GROUP — MATRIKS KOMPARASI SPESIFIKASI & BIAYA SEWA HARDWARE IT';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: C_TITLE_FONT } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  wsData.mergeCells('A2:N2');
  const subCell = wsData.getCell('A2');
  subCell.value = `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })} | Periode: ${filterLabel}`;
  subCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: '64748B' } };

  wsData.addRow([]); // Blank row 3

  // Headers (Row 4)
  const headers = [
    'No', 'Tag Aset', 'Nama / Model Perangkat', 'Kategori',
    'Entitas PT Induk', 'Pengguna (User)', 'Departemen', 'Kepemilikan',
    'Biaya Sewa / Bln (Rp)', 'Processor (CPU)', 'Memori (RAM)', 'Storage / Hardisk', 'Windows / OS', 'Status Unit'
  ];

  const headerRow = wsData.addRow(headers);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_HEADER_FILL } };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: C_HEADER_FONT } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: C_BORDER } },
      bottom: { style: 'medium', color: { argb: '0F172A' } },
      left: { style: 'thin', color: { argb: C_BORDER } },
      right: { style: 'thin', color: { argb: C_BORDER } }
    };
  });

  // Data Rows
  assets.forEach((ast, idx) => {
    const row = wsData.addRow([
      idx + 1,
      ast.assetTag || '-',
      ast.name || `${ast.brand || ''} ${ast.model || ''}`.trim() || '-',
      ast.deviceCategory || 'LAPTOP',
      ast.companyMaster?.name || 'Tanpa Entitas',
      ast.user?.name || 'Unassigned (Spare)',
      ast.user?.department || '-',
      ast.ownershipType === 'RENTAL' ? 'Sewa (Rental)' : 'Milik Sendiri (Owned)',
      ast.ownershipType === 'RENTAL' ? (ast.rentalCost || 0) : 0,
      ast.processor || '-',
      ast.ram || '-',
      ast.storage || '-',
      ast.os || '-',
      ast.status === 'ASSIGNED' ? 'Terpakai (In Use)' : ast.status === 'MAINTENANCE' ? 'Perbaikan' : 'Tersedia (Spare)'
    ]);

    row.height = 20;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: C_BORDER } },
        bottom: { style: 'thin', color: { argb: C_BORDER } },
        left: { style: 'thin', color: { argb: C_BORDER } },
        right: { style: 'thin', color: { argb: C_BORDER } }
      };

      // Alignment & Column formatting
      if (colNum === 1) cell.alignment = { horizontal: 'center' };
      else if (colNum === 2) {
        cell.alignment = { horizontal: 'center' };
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '991B1B' } };
      }
      else if (colNum === 9) {
        cell.numFmt = 'Rp #,##0;[Red](Rp #,##0);"-"';
        cell.alignment = { horizontal: 'right' };
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'D97706' } }; // Amber Rental Cost
      }
      else if (colNum === 10) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '1E40AF' } }; // Blue Processor
      }
      else if (colNum === 11) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'B45309' } }; // Amber RAM
      }
      else if (colNum === 12) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '047857' } }; // Emerald Storage
      }
      else if (colNum === 13) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '0E7490' } }; // Cyan OS
      }
    });
  });

  // Adjust Column Widths
  wsData.columns.forEach((col, idx) => {
    let maxLen = headers[idx] ? headers[idx].length : 12;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const val = cell.value ? cell.value.toString() : '';
      if (val.length > maxLen && val.length < 50) maxLen = val.length;
    });
    col.width = Math.max(maxLen + 3, 12);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 2: RINGKASAN & ANALISA HARDWARE
  // ─────────────────────────────────────────────────────────────────────────────
  const wsAnalysis = wb.addWorksheet('Ringkasan & Analisa Spek', {
    views: [{ showGridLines: true }]
  });

  wsAnalysis.mergeCells('A1:F1');
  const aTitle = wsAnalysis.getCell('A1');
  aTitle.value = 'MRA GROUP — EXECUTIVE SUMMARY & ANALISA SPESIFIKASI IT';
  aTitle.font = { name: 'Arial', size: 14, bold: true, color: { argb: C_TITLE_FONT } };

  // Calculate statistics
  let intelI3 = 0, intelI5 = 0, intelI7 = 0, intelI9 = 0, intelOther = 0;
  let amd = 0, apple = 0, otherCpu = 0;
  let ram8 = 0, ram16 = 0, ram32 = 0;
  let win11 = 0, win10 = 0, macOs = 0, otherOs = 0;

  assets.forEach(a => {
    const p = (a.processor || '').toLowerCase();
    if (p.includes('i3')) intelI3++;
    else if (p.includes('i5')) intelI5++;
    else if (p.includes('i7')) intelI7++;
    else if (p.includes('i9')) intelI9++;
    else if (p.includes('intel') || p.includes('celeror') || p.includes('pentium') || p.includes('xeon')) intelOther++;
    else if (p.includes('amd') || p.includes('ryzen')) amd++;
    else if (p.includes('apple') || p.includes('m1') || p.includes('m2') || p.includes('m3') || p.includes('m4')) apple++;
    else if (p) otherCpu++;

    const r = (a.ram || '').toLowerCase();
    if (r.includes('32') || r.includes('64') || r.includes('128')) ram32++;
    else if (r.includes('16')) ram16++;
    else if (r.includes('8') || r.includes('4')) ram8++;

    const o = (a.os || '').toLowerCase();
    if (o.includes('11')) win11++;
    else if (o.includes('10')) win10++;
    else if (o.includes('mac') || o.includes('osx')) macOs++;
    else if (o) otherOs++;
  });

  const totalIntel = intelI3 + intelI5 + intelI7 + intelI9 + intelOther;
  const totalUnits = assets.length || 1;

  // Add Summary Tables
  wsAnalysis.addRow([]);
  wsAnalysis.addRow(['1. DISTRIBUSI PROCESSOR (CPU)', 'JUMLAH UNIT', 'PERSENTASE (%)']);
  const cpuRow = wsAnalysis.lastRow;
  cpuRow.font = { bold: true };

  wsAnalysis.addRow(['TOTAL INTEL CORE SERIES', totalIntel, `${((totalIntel / totalUnits) * 100).toFixed(1)}%`]);
  wsAnalysis.lastRow.font = { bold: true, color: { argb: '1E40AF' } };

  wsAnalysis.addRow(['  ↳ Intel Core i5 Series (Mainstream Standard)', intelI5, `${((intelI5 / totalUnits) * 100).toFixed(1)}%`]);
  wsAnalysis.addRow(['  ↳ Intel Core i3 Series (Basic / Light Office)', intelI3, `${((intelI3 / totalUnits) * 100).toFixed(1)}%`]);
  wsAnalysis.addRow(['  ↳ Intel Core i7 Series (High Performance)', intelI7, `${((intelI7 / totalUnits) * 100).toFixed(1)}%`]);
  wsAnalysis.addRow(['  ↳ Intel Core i9 Series (Flagship Workstation)', intelI9, `${((intelI9 / totalUnits) * 100).toFixed(1)}%`]);
  if (intelOther > 0) {
    wsAnalysis.addRow(['  ↳ Intel Other (Celeron/Pentium/Xeon)', intelOther, `${((intelOther / totalUnits) * 100).toFixed(1)}%`]);
  }

  wsAnalysis.addRow(['AMD Ryzen Series', amd, `${((amd / totalUnits) * 100).toFixed(1)}%`]);
  wsAnalysis.addRow(['Apple Silicon (M1/M2/M3/M4)', apple, `${((apple / totalUnits) * 100).toFixed(1)}%`]);
  wsAnalysis.addRow(['Lainnya / Perangkat Seluler / Unspecified', otherCpu, `${((otherCpu / totalUnits) * 100).toFixed(1)}%`]);

  wsAnalysis.addRow([]);
  wsAnalysis.addRow(['2. DISTRIBUSI MEMORI (RAM)', 'JUMLAH UNIT', 'PERSENTASE (%)']);
  wsAnalysis.addRow(['RAM 16 GB (Standar Produktivitas MRA)', ram16, `${((ram16 / totalUnits) * 100).toFixed(1)}%`]);
  wsAnalysis.addRow(['RAM 32 GB / 64 GB (High Performance)', ram32, `${((ram32 / totalUnits) * 100).toFixed(1)}%`]);
  wsAnalysis.addRow(['RAM 8 GB atau Kurang (Basic / Legacy)', ram8, `${((ram8 / totalUnits) * 100).toFixed(1)}%`]);

  wsAnalysis.addRow([]);
  wsAnalysis.addRow(['3. DISTRIBUSI WINDOWS & OS', 'JUMLAH UNIT', 'PERSENTASE (%)']);
  wsAnalysis.addRow(['Windows 11 Pro 64-bit (Standar Terbaru)', win11, `${((win11 / totalUnits) * 100).toFixed(1)}%`]);
  wsAnalysis.addRow(['Windows 10 Pro (Legacy Stable)', win10, `${((win10 / totalUnits) * 100).toFixed(1)}%`]);
  wsAnalysis.addRow(['macOS (Apple Mac Workstations)', macOs, `${((macOs / totalUnits) * 100).toFixed(1)}%`]);

  wsAnalysis.columns.forEach(col => col.width = 35);

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 3: ANALISA KONTRAK SEWA & ESTIMASI BIAYA HARDWARE (COST & DURASI)
  // ─────────────────────────────────────────────────────────────────────────────
  const wsContract = wb.addWorksheet('Analisa Kontrak & Cost', {
    views: [{ showGridLines: true }]
  });

  // Title Block
  wsContract.mergeCells('A1:F1');
  const cTitle = wsContract.getCell('A1');
  cTitle.value = 'MRA GROUP — ANALISA DURASI KONTRAK & RATA-RATA BIAYA SEWA HARDWARE';
  cTitle.font = { name: 'Arial', size: 14, bold: true, color: { argb: C_TITLE_FONT } };

  wsContract.mergeCells('A2:F2');
  const cSub = wsContract.getCell('A2');
  cSub.value = `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })} | Periode: ${filterLabel}`;
  cSub.font = { name: 'Arial', size: 9, italic: true, color: { argb: '64748B' } };

  wsContract.addRow([]); // Blank row 3

  // Helper for contract calculations
  const calculateAssetContract = (ast) => {
    let durationMonths = 0;
    if (ast.rentalStart && ast.rentalEnd) {
      const s = new Date(ast.rentalStart);
      const e = new Date(ast.rentalEnd);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        durationMonths = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24 * 30.4375)));
      }
    }
    const costPerMonth = ast.ownershipType === 'RENTAL' ? (ast.rentalCost || 0) : 0;
    const lifetimeValue = costPerMonth * durationMonths;
    return { durationMonths, costPerMonth, lifetimeValue };
  };

  // Group assets by Contract Duration Clusters (12, 24, 36, and others)
  const contractClusters = {
    'Kontrak 12 Bulan (1 Tahun)': { units: 0, totalMonthlyCost: 0, totalLifetimeVal: 0 },
    'Kontrak 24 Bulan (2 Tahun)': { units: 0, totalMonthlyCost: 0, totalLifetimeVal: 0 },
    'Kontrak 36 Bulan (3 Tahun)': { units: 0, totalMonthlyCost: 0, totalLifetimeVal: 0 },
    'Kontrak >36 Bulan / Fleksibel / Lainnya': { units: 0, totalMonthlyCost: 0, totalLifetimeVal: 0 },
  };

  // Group assets by CPU categories
  const cpuGroups = {
    'Intel Core i5 Series': { units: 0, totalMonths: 0, totalMonthlyCost: 0, totalLifetimeVal: 0 },
    'Intel Core i3 Series': { units: 0, totalMonths: 0, totalMonthlyCost: 0, totalLifetimeVal: 0 },
    'Intel Core i7 Series': { units: 0, totalMonths: 0, totalMonthlyCost: 0, totalLifetimeVal: 0 },
    'Intel Core i9 Series': { units: 0, totalMonths: 0, totalMonthlyCost: 0, totalLifetimeVal: 0 },
    'AMD Ryzen Series': { units: 0, totalMonths: 0, totalMonthlyCost: 0, totalLifetimeVal: 0 },
    'Apple Silicon (M1/M2/M3/M4)': { units: 0, totalMonths: 0, totalMonthlyCost: 0, totalLifetimeVal: 0 },
  };

  // Group assets by RAM categories
  const ramGroups = {
    'RAM 16 GB (Standar Utama)': { units: 0, totalMonths: 0, totalMonthlyCost: 0, totalLifetimeVal: 0 },
    'RAM 32 GB / 64 GB (High Spec)': { units: 0, totalMonths: 0, totalMonthlyCost: 0, totalLifetimeVal: 0 },
    'RAM 8 GB atau Kurang (Basic)': { units: 0, totalMonths: 0, totalMonthlyCost: 0, totalLifetimeVal: 0 },
  };

  let totalRentalUnitsCount = 0;

  assets.forEach(a => {
    if (a.ownershipType !== 'RENTAL') return; // Analyze rental contracts
    const { durationMonths, costPerMonth, lifetimeValue } = calculateAssetContract(a);

    totalRentalUnitsCount += 1;

    // Duration Cluster Grouping
    let clusterKey = 'Kontrak >36 Bulan / Fleksibel / Lainnya';
    if (durationMonths >= 11 && durationMonths <= 13) clusterKey = 'Kontrak 12 Bulan (1 Tahun)';
    else if (durationMonths >= 23 && durationMonths <= 25) clusterKey = 'Kontrak 24 Bulan (2 Tahun)';
    else if (durationMonths >= 35 && durationMonths <= 37) clusterKey = 'Kontrak 36 Bulan (3 Tahun)';

    contractClusters[clusterKey].units += 1;
    contractClusters[clusterKey].totalMonthlyCost += costPerMonth;
    contractClusters[clusterKey].totalLifetimeVal += lifetimeValue;

    // CPU Grouping
    const p = (a.processor || '').toLowerCase();
    let cpuKey = null;
    if (p.includes('i5')) cpuKey = 'Intel Core i5 Series';
    else if (p.includes('i3')) cpuKey = 'Intel Core i3 Series';
    else if (p.includes('i7')) cpuKey = 'Intel Core i7 Series';
    else if (p.includes('i9')) cpuKey = 'Intel Core i9 Series';
    else if (p.includes('amd') || p.includes('ryzen')) cpuKey = 'AMD Ryzen Series';
    else if (p.includes('apple') || p.includes('m1') || p.includes('m2') || p.includes('m3') || p.includes('m4')) cpuKey = 'Apple Silicon (M1/M2/M3/M4)';

    if (cpuKey && cpuGroups[cpuKey]) {
      cpuGroups[cpuKey].units += 1;
      cpuGroups[cpuKey].totalMonths += durationMonths;
      cpuGroups[cpuKey].totalMonthlyCost += costPerMonth;
      cpuGroups[cpuKey].totalLifetimeVal += lifetimeValue;
    }

    // RAM Grouping
    const r = (a.ram || '').toLowerCase();
    let ramKey = null;
    if (r.includes('32') || r.includes('64') || r.includes('128')) ramKey = 'RAM 32 GB / 64 GB (High Spec)';
    else if (r.includes('16')) ramKey = 'RAM 16 GB (Standar Utama)';
    else if (r.includes('8') || r.includes('4')) ramKey = 'RAM 8 GB atau Kurang (Basic)';

    if (ramKey && ramGroups[ramKey]) {
      ramGroups[ramKey].units += 1;
      ramGroups[ramKey].totalMonths += durationMonths;
      ramGroups[ramKey].totalMonthlyCost += costPerMonth;
      ramGroups[ramKey].totalLifetimeVal += lifetimeValue;
    }
  });

  // Render Table 1: CLUSTER DURASI KONTRAK SEWA (12, 24, 36 BULAN & LAINNYA)
  wsContract.addRow(['1. CLUSTER DURASI KONTRAK SEWA (12 BULAN, 24 BULAN, 36 BULAN, LAINNYA)']);
  wsContract.lastRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: C_TITLE_FONT } };

  const tableClusterHeaders = [
    'Cluster Masa Kontrak', 'Jumlah Unit', 'Persentase (%)',
    'Avg Biaya Sewa / Bln (Rp)', 'Total Biaya Sewa / Bln (Rp)', 'Estimasi Lifetime Contract (Rp)'
  ];

  const tClustHdrRow = wsContract.addRow(tableClusterHeaders);
  tClustHdrRow.height = 22;
  tClustHdrRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_HEADER_FILL } };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: C_HEADER_FONT } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  let grandClusterUnits = 0, grandClusterMonthly = 0, grandClusterLifetime = 0;

  Object.entries(contractClusters).forEach(([cName, data]) => {
    const pct = totalRentalUnitsCount > 0 ? ((data.units / totalRentalUnitsCount) * 100).toFixed(1) + '%' : '0%';
    const avgMonthlyCost = data.units > 0 ? Math.round(data.totalMonthlyCost / data.units) : 0;

    grandClusterUnits += data.units;
    grandClusterMonthly += data.totalMonthlyCost;
    grandClusterLifetime += data.totalLifetimeVal;

    const row = wsContract.addRow([
      cName,
      data.units,
      pct,
      avgMonthlyCost,
      data.totalMonthlyCost,
      data.totalLifetimeVal
    ]);

    row.height = 20;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: C_BORDER } },
        bottom: { style: 'thin', color: { argb: C_BORDER } },
        left: { style: 'thin', color: { argb: C_BORDER } },
        right: { style: 'thin', color: { argb: C_BORDER } }
      };
      if (colNum === 2 || colNum === 3) cell.alignment = { horizontal: 'center' };
      if (colNum >= 4) {
        cell.numFmt = 'Rp #,##0;[Red](Rp #,##0);"-"';
        cell.alignment = { horizontal: 'right' };
      }
      if (colNum === 4) cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '047857' } }; // Emerald Avg Cluster
    });
  });

  // Table 1 Total Row
  const tClustTotal = wsContract.addRow([
    'TOTAL CLUSTER KONTRAK SEWA',
    grandClusterUnits,
    '100.0%',
    grandClusterUnits > 0 ? Math.round(grandClusterMonthly / grandClusterUnits) : 0,
    grandClusterMonthly,
    grandClusterLifetime
  ]);
  tClustTotal.height = 22;
  tClustTotal.eachCell((cell, colNum) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: '0F172A' } };
    cell.border = {
      top: { style: 'medium', color: { argb: '0F172A' } },
      bottom: { style: 'medium', color: { argb: '0F172A' } },
      left: { style: 'thin', color: { argb: C_BORDER } },
      right: { style: 'thin', color: { argb: C_BORDER } }
    };
    if (colNum === 2 || colNum === 3) cell.alignment = { horizontal: 'center' };
    if (colNum >= 4) {
      cell.numFmt = 'Rp #,##0;[Red](Rp #,##0);"-"';
      cell.alignment = { horizontal: 'right' };
    }
  });

  wsContract.addRow([]); // Blank row

  // Render Table 2: Rata-Rata Biaya & Durasi Kontrak per Intel/CPU
  wsContract.addRow(['2. ANALISA RATA-RATA BIAYA SEWA & DURASI KONTRAK PER PROCESSOR']);
  wsContract.lastRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: C_TITLE_FONT } };

  const table1Headers = [
    'Kategori Processor', 'Unit Sewa', 'Avg Masa Kontrak (Bulan)',
    'Avg Biaya Sewa / Bln (Rp)', 'Total Biaya Sewa / Bln (Rp)', 'Estimasi Lifetime Contract (Rp)'
  ];

  const t1HdrRow = wsContract.addRow(table1Headers);
  t1HdrRow.height = 22;
  t1HdrRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_HEADER_FILL } };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: C_HEADER_FONT } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  let grandCpuUnits = 0, grandCpuMonthly = 0, grandCpuLifetime = 0;

  Object.entries(cpuGroups).forEach(([catName, data]) => {
    const avgMonths = data.units > 0 ? Math.round(data.totalMonths / data.units) : 0;
    const avgMonthlyCost = data.units > 0 ? Math.round(data.totalMonthlyCost / data.units) : 0;

    grandCpuUnits += data.units;
    grandCpuMonthly += data.totalMonthlyCost;
    grandCpuLifetime += data.totalLifetimeVal;

    const row = wsContract.addRow([
      catName,
      data.units,
      avgMonths > 0 ? `${avgMonths} Bulan` : '-',
      avgMonthlyCost,
      data.totalMonthlyCost,
      data.totalLifetimeVal
    ]);

    row.height = 20;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: C_BORDER } },
        bottom: { style: 'thin', color: { argb: C_BORDER } },
        left: { style: 'thin', color: { argb: C_BORDER } },
        right: { style: 'thin', color: { argb: C_BORDER } }
      };
      if (colNum === 2 || colNum === 3) cell.alignment = { horizontal: 'center' };
      if (colNum >= 4) {
        cell.numFmt = 'Rp #,##0;[Red](Rp #,##0);"-"';
        cell.alignment = { horizontal: 'right' };
      }
      if (colNum === 4) cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '1E40AF' } }; // Blue Avg
    });
  });

  // Table 1 Total Row
  const t1Total = wsContract.addRow([
    'TOTAL / RATA-RATA PROCESSOR SEWA',
    grandCpuUnits,
    '-',
    grandCpuUnits > 0 ? Math.round(grandCpuMonthly / grandCpuUnits) : 0,
    grandCpuMonthly,
    grandCpuLifetime
  ]);
  t1Total.height = 22;
  t1Total.eachCell((cell, colNum) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: '0F172A' } };
    cell.border = {
      top: { style: 'medium', color: { argb: '0F172A' } },
      bottom: { style: 'medium', color: { argb: '0F172A' } },
      left: { style: 'thin', color: { argb: C_BORDER } },
      right: { style: 'thin', color: { argb: C_BORDER } }
    };
    if (colNum === 2) cell.alignment = { horizontal: 'center' };
    if (colNum >= 4) {
      cell.numFmt = 'Rp #,##0;[Red](Rp #,##0);"-"';
      cell.alignment = { horizontal: 'right' };
    }
  });

  wsContract.addRow([]); // Blank row

  // Render Table 2: Rata-Rata Biaya & Durasi Kontrak per RAM
  wsContract.addRow(['2. ANALISA RATA-RATA BIAYA SEWA & DURASI KONTRAK PER MEMORI (RAM)']);
  wsContract.lastRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: C_TITLE_FONT } };

  const table2Headers = [
    'Kategori Memori (RAM)', 'Unit Sewa', 'Avg Masa Kontrak (Bulan)',
    'Avg Biaya Sewa / Bln (Rp)', 'Total Biaya Sewa / Bln (Rp)', 'Estimasi Lifetime Contract (Rp)'
  ];

  const t2HdrRow = wsContract.addRow(table2Headers);
  t2HdrRow.height = 22;
  t2HdrRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C_HEADER_FILL } };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: C_HEADER_FONT } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  let grandRamUnits = 0, grandRamMonthly = 0, grandRamLifetime = 0;

  Object.entries(ramGroups).forEach(([catName, data]) => {
    const avgMonths = data.units > 0 ? Math.round(data.totalMonths / data.units) : 0;
    const avgMonthlyCost = data.units > 0 ? Math.round(data.totalMonthlyCost / data.units) : 0;

    grandRamUnits += data.units;
    grandRamMonthly += data.totalMonthlyCost;
    grandRamLifetime += data.totalLifetimeVal;

    const row = wsContract.addRow([
      catName,
      data.units,
      avgMonths > 0 ? `${avgMonths} Bulan` : '-',
      avgMonthlyCost,
      data.totalMonthlyCost,
      data.totalLifetimeVal
    ]);

    row.height = 20;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: C_BORDER } },
        bottom: { style: 'thin', color: { argb: C_BORDER } },
        left: { style: 'thin', color: { argb: C_BORDER } },
        right: { style: 'thin', color: { argb: C_BORDER } }
      };
      if (colNum === 2 || colNum === 3) cell.alignment = { horizontal: 'center' };
      if (colNum >= 4) {
        cell.numFmt = 'Rp #,##0;[Red](Rp #,##0);"-"';
        cell.alignment = { horizontal: 'right' };
      }
      if (colNum === 4) cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'B45309' } }; // Amber Avg RAM
    });
  });

  // Table 2 Total Row
  const t2Total = wsContract.addRow([
    'TOTAL / RATA-RATA RAM SEWA',
    grandRamUnits,
    '-',
    grandRamUnits > 0 ? Math.round(grandRamMonthly / grandRamUnits) : 0,
    grandRamMonthly,
    grandRamLifetime
  ]);
  t2Total.height = 22;
  t2Total.eachCell((cell, colNum) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: '0F172A' } };
    cell.border = {
      top: { style: 'medium', color: { argb: '0F172A' } },
      bottom: { style: 'medium', color: { argb: '0F172A' } },
      left: { style: 'thin', color: { argb: C_BORDER } },
      right: { style: 'thin', color: { argb: C_BORDER } }
    };
    if (colNum === 2) cell.alignment = { horizontal: 'center' };
    if (colNum >= 4) {
      cell.numFmt = 'Rp #,##0;[Red](Rp #,##0);"-"';
      cell.alignment = { horizontal: 'right' };
    }
  });

  wsContract.columns.forEach(col => col.width = 32);

  // Generate workbook buffer & trigger native browser download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MRA_Komparasi_Spesifikasi_Hardware_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
