export const escapeXml = (unsafe) => {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export const generateExcelXml = (data, months, selectedMonth, selectedYear, companies, selectedCompanyId) => {
  const monthLabel = months.find(m => m.value === selectedMonth)?.label || 'All';
  const companyLabel = companies.find(c => c.id === parseInt(selectedCompanyId))?.name || 'All Companies';

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
  <Style ss:ID="MetaLabel">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#475569"/>
  </Style>
  <Style ss:ID="MetaVal">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="HeaderCenter">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TableHeaderRow">
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#475569"/>
  </Style>
  <Style ss:ID="BoldText">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1"/>
  </Style>
  <Style ss:ID="MetricVal">
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#1E293B"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetricLabel">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#64748B" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellMet">
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#065F46" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="CellBreached">
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#991B1B" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
 </Styles>
 `;

  // SHEET 1: DASHBOARD SUMMARY
  xml += `
 <Worksheet ss:Name="KPI Summary">
  <Table x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="120" ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="160"/>
   <Column ss:Index="2" ss:Width="120"/>
   <Column ss:Index="3" ss:Width="120"/>
   <Column ss:Index="4" ss:Width="120"/>

   <Row ss:Height="35">
    <Cell ss:MergeAcross="3" ss:StyleID="Title"><Data ss:Type="String">IT Helpdesk KPI Summary Report</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Period:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${monthLabel} ${selectedYear}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Company Filter:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${companyLabel}</Data></Cell>
   </Row>
   <Row ss:Height="20"><Cell/></Row>

   <Row ss:Height="22">
    <Cell ss:MergeAcross="3" ss:StyleID="HeaderCenter"><Data ss:Type="String">Core SLA &amp; Volume Metrics</Data></Cell>
   </Row>
   <Row ss:Height="26">
    <Cell ss:StyleID="MetricVal"><Data ss:Type="Number">${data.totalTickets}</Data></Cell>
    <Cell ss:StyleID="MetricVal"><Data ss:Type="String">${data.sla.complianceRate}%</Data></Cell>
    <Cell ss:StyleID="MetricVal"><Data ss:Type="Number">${data.sla.avgResponseHours}</Data></Cell>
    <Cell ss:StyleID="MetricVal"><Data ss:Type="Number">${data.sla.avgResolutionHours}</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="MetricLabel"><Data ss:Type="String">Total Tickets</Data></Cell>
    <Cell ss:StyleID="MetricLabel"><Data ss:Type="String">SLA Compliance Rate</Data></Cell>
    <Cell ss:StyleID="MetricLabel"><Data ss:Type="String">Avg Response (Hours)</Data></Cell>
    <Cell ss:StyleID="MetricLabel"><Data ss:Type="String">Avg Resolution (Hours)</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell><Data ss:Type="String">Insiden terdaftar</Data></Cell>
    <Cell><Data ss:Type="String">${data.sla.met} Met / ${data.sla.breached} Breached</Data></Cell>
    <Cell><Data ss:Type="String">Waktu respon awal</Data></Cell>
    <Cell><Data ss:Type="String">Waktu penyelesaian</Data></Cell>
   </Row>

   <Row ss:Height="25"><Cell/></Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="2" ss:StyleID="Header"><Data ss:Type="String">Ticket Status Distribution</Data></Cell>
   </Row>
   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Ticket Count</Data></Cell>
    <Cell><Data ss:Type="String">Percentage</Data></Cell>
   </Row>
   `;

  Object.entries(data.status).forEach(([statusKey, count]) => {
    const pct = data.totalTickets > 0 ? Math.round((count / data.totalTickets) * 100) : 0;
    xml += `
   <Row>
    <Cell><Data ss:Type="String">${statusKey}</Data></Cell>
    <Cell><Data ss:Type="Number">${count}</Data></Cell>
    <Cell><Data ss:Type="String">${pct}%</Data></Cell>
   </Row>`;
  });

  xml += `
   <Row ss:Height="25"><Cell/></Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="2" ss:StyleID="Header"><Data ss:Type="String">Ticket Priority Distribution</Data></Cell>
   </Row>
   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">Priority</Data></Cell>
    <Cell><Data ss:Type="String">Ticket Count</Data></Cell>
    <Cell><Data ss:Type="String">Percentage</Data></Cell>
   </Row>
   `;

  Object.entries(data.priorities).forEach(([priorityKey, count]) => {
    const pct = data.totalTickets > 0 ? Math.round((count / data.totalTickets) * 100) : 0;
    xml += `
   <Row>
    <Cell><Data ss:Type="String">${priorityKey}</Data></Cell>
    <Cell><Data ss:Type="Number">${count}</Data></Cell>
    <Cell><Data ss:Type="String">${pct}%</Data></Cell>
   </Row>`;
  });

  xml += `
   <Row ss:Height="25"><Cell/></Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="2" ss:StyleID="Header"><Data ss:Type="String">Issue Type Distribution (Categories)</Data></Cell>
   </Row>
   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">Category</Data></Cell>
    <Cell><Data ss:Type="String">Ticket Count</Data></Cell>
    <Cell><Data ss:Type="String">Percentage</Data></Cell>
   </Row>
   `;

  Object.entries(data.categories).forEach(([catKey, count]) => {
    const pct = data.totalTickets > 0 ? Math.round((count / data.totalTickets) * 100) : 0;
    xml += `
   <Row>
    <Cell><Data ss:Type="String">${catKey}</Data></Cell>
    <Cell><Data ss:Type="Number">${count}</Data></Cell>
    <Cell><Data ss:Type="String">${pct}%</Data></Cell>
   </Row>`;
  });

  xml += `
   <Row ss:Height="25"><Cell/></Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="2" ss:StyleID="Header"><Data ss:Type="String">Report Media (Ticket Sources)</Data></Cell>
   </Row>
   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">Source Channel</Data></Cell>
    <Cell><Data ss:Type="String">Ticket Count</Data></Cell>
    <Cell><Data ss:Type="String">Percentage</Data></Cell>
   </Row>
   `;

  Object.entries(data.sources).forEach(([srcKey, count]) => {
    const pct = data.totalTickets > 0 ? Math.round((count / data.totalTickets) * 100) : 0;
    xml += `
   <Row>
    <Cell><Data ss:Type="String">${srcKey}</Data></Cell>
    <Cell><Data ss:Type="Number">${count}</Data></Cell>
    <Cell><Data ss:Type="String">${pct}%</Data></Cell>
   </Row>`;
  });

  xml += `
  </Table>
 </Worksheet>
 `;

  // SHEET 2: COMPANY & DEPARTMENT DETAILS
  xml += `
 <Worksheet ss:Name="Divisions &amp; Entities">
  <Table x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="120" ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="250"/>
   <Column ss:Index="2" ss:Width="100"/>
   <Column ss:Index="3" ss:Width="100"/>

   <Row ss:Height="30">
    <Cell ss:MergeAcross="2" ss:StyleID="Title"><Data ss:Type="String">IT Helpdesk Division &amp; Company Summary</Data></Cell>
   </Row>
   <Row ss:Height="20"><Cell/></Row>

   <Row ss:Height="22">
    <Cell ss:MergeAcross="2" ss:StyleID="Header"><Data ss:Type="String">Client Company Distribution (MRA Group)</Data></Cell>
   </Row>
   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">Subsidiary Company</Data></Cell>
    <Cell><Data ss:Type="String">Ticket Count</Data></Cell>
    <Cell><Data ss:Type="String">Percentage</Data></Cell>
   </Row>
   `;

  Object.entries(data.companies)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      const pct = data.totalTickets > 0 ? Math.round((count / data.totalTickets) * 100) : 0;
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(name)}</Data></Cell>
    <Cell><Data ss:Type="Number">${count}</Data></Cell>
    <Cell><Data ss:Type="String">${pct}%</Data></Cell>
   </Row>`;
    });

  xml += `
   <Row ss:Height="25"><Cell/></Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="2" ss:StyleID="Header"><Data ss:Type="String">Top Requester Departments</Data></Cell>
   </Row>
   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">Department Name</Data></Cell>
    <Cell><Data ss:Type="String">Ticket Count</Data></Cell>
    <Cell><Data ss:Type="String">Percentage</Data></Cell>
   </Row>
   `;

  Object.entries(data.departments)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      const pct = data.totalTickets > 0 ? Math.round((count / data.totalTickets) * 100) : 0;
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(name)}</Data></Cell>
    <Cell><Data ss:Type="Number">${count}</Data></Cell>
    <Cell><Data ss:Type="String">${pct}%</Data></Cell>
   </Row>`;
    });

  xml += `
   <Row ss:Height="25"><Cell/></Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="2" ss:StyleID="Header"><Data ss:Type="String">Frequent Issue Sub-categories</Data></Cell>
   </Row>
   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">Sub-category Name</Data></Cell>
    <Cell><Data ss:Type="String">Ticket Count</Data></Cell>
    <Cell><Data ss:Type="String">Percentage</Data></Cell>
   </Row>
   `;

  Object.entries(data.subCategories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      const pct = data.totalTickets > 0 ? Math.round((count / data.totalTickets) * 100) : 0;
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${name === '-' ? 'General/Other' : escapeXml(name)}</Data></Cell>
    <Cell><Data ss:Type="Number">${count}</Data></Cell>
    <Cell><Data ss:Type="String">${pct}%</Data></Cell>
   </Row>`;
    });

  xml += `
  </Table>
 </Worksheet>
 `;

  // SHEET 3: RAW TICKETS DATA
  xml += `
 <Worksheet ss:Name="Raw Tickets">
  <Table x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="110" ss:DefaultRowHeight="20">
   <Column ss:Width="250"/>
   <Column ss:Width="100"/>
   <Column ss:Width="180"/>
   <Column ss:Width="150"/>
   <Column ss:Width="200"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="80"/>

   <Row ss:Height="30">
    <Cell ss:MergeAcross="12" ss:StyleID="Title"><Data ss:Type="String">IT Helpdesk - Raw Tickets Log</Data></Cell>
   </Row>
   <Row ss:Height="20"><Cell/></Row>

   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">Ticket ID</Data></Cell>
    <Cell><Data ss:Type="String">Created Date</Data></Cell>
    <Cell><Data ss:Type="String">Reporter Location</Data></Cell>
    <Cell><Data ss:Type="String">Department</Data></Cell>
    <Cell><Data ss:Type="String">Ticket Title</Data></Cell>
    <Cell><Data ss:Type="String">Category</Data></Cell>
    <Cell><Data ss:Type="String">Sub-Category</Data></Cell>
    <Cell><Data ss:Type="String">Channel Source</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Priority</Data></Cell>
    <Cell><Data ss:Type="String">Responded At</Data></Cell>
    <Cell><Data ss:Type="String">Resolved At</Data></Cell>
    <Cell><Data ss:Type="String">SLA Status</Data></Cell>
   </Row>
   `;

  if (data.tickets && data.tickets.length > 0) {
    data.tickets.forEach(t => {
      const createdDate = new Date(t.createdAt).toLocaleDateString();
      const respondedAt = t.respondedAt ? new Date(t.respondedAt).toLocaleString() : 'N/A';
      const resolvedAt = t.resolvedAt ? new Date(t.resolvedAt).toLocaleString() : 'N/A';

      let slaStatus = 'N/A';
      let slaStyle = 'Default';
      if (t.status === 'RESOLVED' || t.status === 'CLOSED') {
        slaStatus = t.isSlaBreached ? 'BREACHED' : 'MET';
        slaStyle = t.isSlaBreached ? 'CellBreached' : 'CellMet';
      }

      xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(t.id)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(createdDate)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(t.company?.name || 'N/A')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(t.requester?.department || 'N/A')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(t.title)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(t.category)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(t.subCategory || '-')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(t.source || 'Walk-in')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(t.status)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(t.priority)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(respondedAt)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(resolvedAt)}</Data></Cell>
    <Cell ss:StyleID="${slaStyle}"><Data ss:Type="String">${escapeXml(slaStatus)}</Data></Cell>
   </Row>`;
    });
  } else {
    xml += `
   <Row>
    <Cell ss:MergeAcross="12"><Data ss:Type="String">No ticket logs found for the selected period.</Data></Cell>
   </Row>`;
  }

  xml += `
  </Table>
 </Worksheet>
 </Workbook>
 `;

  return xml;
};

export const handleExportExcel = (data, months, selectedMonth, selectedYear, companies, selectedCompanyId) => {
  try {
    const xmlContent = generateExcelXml(data, months, selectedMonth, selectedYear, companies, selectedCompanyId);
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const monthLabel = months.find(m => m.value === selectedMonth)?.label || 'All';
    const filename = `IT_Helpdesk_Summary_Report_${monthLabel}_${selectedYear}.xls`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert('Gagal mengekspor laporan: ' + err.message);
  }
};
