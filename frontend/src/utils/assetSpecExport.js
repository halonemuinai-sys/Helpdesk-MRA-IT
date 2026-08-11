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
  wsData.mergeCells('A1:M1');
  const titleCell = wsData.getCell('A1');
  titleCell.value = 'MRA GROUP — MATRIKS KOMPARASI SPESIFIKASI HARDWARE IT';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: C_TITLE_FONT } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  wsData.mergeCells('A2:M2');
  const subCell = wsData.getCell('A2');
  subCell.value = `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })} | Periode: ${filterLabel}`;
  subCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: '64748B' } };

  wsData.addRow([]); // Blank row 3

  // Headers (Row 4)
  const headers = [
    'No', 'Tag Aset', 'Nama / Model Perangkat', 'Kategori',
    'Entitas PT Induk', 'Pengguna (User)', 'Departemen', 'Kepemilikan',
    'Processor (CPU)', 'Memori (RAM)', 'Storage / Hardisk', 'Windows / OS', 'Status Unit'
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
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '1E40AF' } }; // Blue Processor
      }
      else if (colNum === 10) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'B45309' } }; // Amber RAM
      }
      else if (colNum === 11) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '047857' } }; // Emerald Storage
      }
      else if (colNum === 12) {
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
