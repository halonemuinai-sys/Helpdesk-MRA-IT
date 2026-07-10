import Swal from 'sweetalert2';

export const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export const generateExcelXml = ({ data, selectedYear, selectedCategory, selectedSector }) => {
  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" x:CharSet="1" x:Family="Swiss" ss:Size="10" ss:Color="#374151"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Segoe UI" ss:Size="16" ss:Bold="1" ss:Color="#1E293B"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#F43F5E" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TableHeaderRow">
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#475569"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="&quot;Rp&quot;\ #,##0"/>
  </Style>
  <Style ss:ID="BoldText">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1"/>
  </Style>
  <Style ss:ID="BoldCurrency">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1"/>
   <NumberFormat ss:Format="&quot;Rp&quot;\ #,##0"/>
  </Style>
 </Styles>
`;

  // SHEET 1: REKAPITULASI ANGGARAN
  xml += `
 <Worksheet ss:Name="Rekap Anggaran">
  <Table x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="100" ss:DefaultRowHeight="20">
   <Column ss:Width="250"/>
   <Column ss:Width="80"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="95"/><Column ss:Width="95"/><Column ss:Width="95"/><Column ss:Width="95"/>
   <Column ss:Width="95"/><Column ss:Width="95"/><Column ss:Width="95"/><Column ss:Width="95"/>
   <Column ss:Width="95"/><Column ss:Width="95"/><Column ss:Width="95"/><Column ss:Width="95"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="80"/>

   <Row ss:Height="30">
    <Cell ss:MergeAcross="18" ss:StyleID="Title"><Data ss:Type="String">REKAPITULASI ANGGARAN &amp; REALISASI BIAYA SEWA IT - TAHUN ${selectedYear}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="18"><Data ss:Type="String">Filter Kategori: ${selectedCategory} | Grup: ${selectedSector}</Data></Cell>
   </Row>
   <Row ss:Height="15"><Cell/></Row>

   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">Nama Perusahaan Induk</Data></Cell>
    <Cell><Data ss:Type="String">Grup MRA</Data></Cell>
    <Cell><Data ss:Type="String">Budget Bulanan</Data></Cell>
    <Cell><Data ss:Type="String">Budget Tahunan</Data></Cell>
    <Cell><Data ss:Type="String">Realisasi Jan</Data></Cell>
    <Cell><Data ss:Type="String">Realisasi Feb</Data></Cell>
    <Cell><Data ss:Type="String">Realisasi Mar</Data></Cell>
    <Cell><Data ss:Type="String">Realisasi Apr</Data></Cell>
    <Cell><Data ss:Type="String">Realisasi Mei</Data></Cell>
    <Cell><Data ss:Type="String">Realisasi Jun</Data></Cell>
    <Cell><Data ss:Type="String">Realisasi Jul</Data></Cell>
    <Cell><Data ss:Type="String">Realisasi Agt</Data></Cell>
    <Cell><Data ss:Type="String">Realisasi Sep</Data></Cell>
    <Cell><Data ss:Type="String">Realisasi Okt</Data></Cell>
    <Cell><Data ss:Type="String">Realisasi Nov</Data></Cell>
    <Cell><Data ss:Type="String">Realisasi Des</Data></Cell>
    <Cell><Data ss:Type="String">Total Realisasi</Data></Cell>
    <Cell><Data ss:Type="String">Deviasi / Sisa</Data></Cell>
    <Cell><Data ss:Type="String">Jml Device</Data></Cell>
   </Row>
`;

  if (data && data.companyStats) {
    data.companyStats.forEach(c => {
      const deviation = c.yearlyBudget - c.totalCost;
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(c.name)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(c.sector || 'GENERAL')}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.monthlyBudget || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.yearlyBudget || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.monthlyCosts[0] || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.monthlyCosts[1] || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.monthlyCosts[2] || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.monthlyCosts[3] || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.monthlyCosts[4] || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.monthlyCosts[5] || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.monthlyCosts[6] || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.monthlyCosts[7] || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.monthlyCosts[8] || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.monthlyCosts[9] || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.monthlyCosts[10] || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.monthlyCosts[11] || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.totalCost || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${deviation}</Data></Cell>
    <Cell><Data ss:Type="Number">${c.totalDevices || 0}</Data></Cell>
   </Row>`;
    });

    const grandTotalBudget = data.companyStats.reduce((sum, c) => sum + (c.yearlyBudget || 0), 0);
    const grandTotalCost = data.companyStats.reduce((sum, c) => sum + (c.totalCost || 0), 0);
    const grandTotalMonthly = Array(12).fill(0);
    data.companyStats.forEach(c => {
      for (let i = 0; i < 12; i++) grandTotalMonthly[i] += (c.monthlyCosts[i] || 0);
    });
    const grandTotalDevices = data.companyStats.reduce((sum, c) => sum + (c.totalDevices || 0), 0);

    xml += `
   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">TOTAL KESELURUHAN</Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalBudget / 12}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalBudget}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalMonthly[0]}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalMonthly[1]}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalMonthly[2]}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalMonthly[3]}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalMonthly[4]}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalMonthly[5]}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalMonthly[6]}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalMonthly[7]}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalMonthly[8]}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalMonthly[9]}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalMonthly[10]}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalMonthly[11]}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalCost}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${grandTotalBudget - grandTotalCost}</Data></Cell>
    <Cell ss:StyleID="BoldText"><Data ss:Type="Number">${grandTotalDevices}</Data></Cell>
   </Row>`;
  }

  xml += `
  </Table>
 </Worksheet>
`;

  // SHEET 2: DETIL ASET SEWA
  xml += `
 <Worksheet ss:Name="Detil Aset Sewa">
  <Table x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="120" ss:DefaultRowHeight="20">
   <Column ss:Width="160"/>
   <Column ss:Width="110"/>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="200"/>
   <Column ss:Width="150"/>
   <Column ss:Width="150"/>
   <Column ss:Width="220"/>
   <Column ss:Width="110"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="180"/>

   <Row ss:Height="30">
    <Cell ss:MergeAcross="12" ss:StyleID="Title"><Data ss:Type="String">DAFTAR DETAIL PERANGKAT SEWA IT</Data></Cell>
   </Row>
   <Row ss:Height="15"><Cell/></Row>

   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">No. Kontrak Vendor (Billing)</Data></Cell>
    <Cell><Data ss:Type="String">Asset Tag</Data></Cell>
    <Cell><Data ss:Type="String">Device Ref</Data></Cell>
    <Cell><Data ss:Type="String">Brand</Data></Cell>
    <Cell><Data ss:Type="String">Model Perangkat</Data></Cell>
    <Cell><Data ss:Type="String">Pengguna</Data></Cell>
    <Cell><Data ss:Type="String">Departemen</Data></Cell>
    <Cell><Data ss:Type="String">Perusahaan Induk</Data></Cell>
    <Cell><Data ss:Type="String">Biaya Bulanan</Data></Cell>
    <Cell><Data ss:Type="String">Mulai Sewa</Data></Cell>
    <Cell><Data ss:Type="String">Akhir Sewa</Data></Cell>
    <Cell><Data ss:Type="String">Status Aset</Data></Cell>
    <Cell><Data ss:Type="String">Vendor Penyedia</Data></Cell>
   </Row>
`;

  if (data && data.companyStats) {
    data.companyStats.forEach(c => {
      if (c.assets && c.assets.length > 0) {
        c.assets.forEach(a => {
          const rentalStart = a.rentalStart ? new Date(a.rentalStart).toLocaleDateString('id-ID') : '-';
          const rentalEnd = a.rentalEnd ? new Date(a.rentalEnd).toLocaleDateString('id-ID') : '-';
          xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(a.vendorRef || 'N/A')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.assetTag)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.deviceRef || 'N/A')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.brand)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.model)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.user?.name || 'Shared / Cabang')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.user?.department || 'N/A')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(c.name)}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${a.rentalCost || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(rentalStart)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(rentalEnd)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.status)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.vendor || 'N/A')}</Data></Cell>
   </Row>`;
        });
      }
    });
  }

  xml += `
  </Table>
 </Worksheet>
</Workbook>
`;

  return xml;
};

export const handleExportExcel = ({ data, selectedYear, selectedCategory, selectedSector }) => {
  try {
    const xmlContent = generateExcelXml({ data, selectedYear, selectedCategory, selectedSector });
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IT_Rentals_Cost_Analysis_${selectedCategory}_${selectedSector}_${selectedYear}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Ekspor Gagal', text: err.message });
  }
};
