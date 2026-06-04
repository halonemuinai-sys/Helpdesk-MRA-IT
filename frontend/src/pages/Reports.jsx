import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  Building2, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  Ticket,
  Users,
  Cpu,
  Mail,
  MessageSquare,
  Phone,
  User,
  ShieldAlert,
  Briefcase,
  Layers,
  FileText
} from 'lucide-react';
import ReactLoader from '../components/ReactLoader';
import Select from 'react-select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getSourceIcon = (sourceName) => {
  switch (sourceName.toLowerCase()) {
    case 'whatsapp':
    case 'instant messaging':
    case 'telegram':
      return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
    case 'email':
      return <Mail className="w-3.5 h-3.5 text-blue-500" />;
    case 'phone call':
    case 'phone':
      return <Phone className="w-3.5 h-3.5 text-teal-500" />;
    case 'walk-in':
    case 'walkin':
      return <User className="w-3.5 h-3.5 text-amber-500" />;
    case 'system alert':
    case 'system':
      return <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />;
    case 'on-site visit':
    case 'visit':
      return <Briefcase className="w-3.5 h-3.5 text-indigo-500" />;
    default:
      return <Ticket className="w-3.5 h-3.5 text-purple-500" />;
  }
};

export default function Reports({ user, token, darkMode }) {
  const [data, setData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timeframe states (initialized to current month/year)
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  const MONTHS = [
    { value: 'ALL', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const YEARS = ['2026', '2025', '2024'];
  const yearOptions = YEARS.map(y => ({ value: y, label: y }));

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: darkMode ? '#0f172a' : '#f9fafb',
      borderColor: state.isFocused 
        ? '#06b6d4'
        : darkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(229, 231, 235, 0.5)',
      borderRadius: '0.75rem',
      padding: '0.05rem 0.25rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      boxShadow: state.isFocused ? '0 0 0 1px #06b6d4' : 'none',
      '&:hover': {
        borderColor: '#06b6d4',
      },
      minHeight: '34px',
      cursor: 'pointer',
      minWidth: '135px',
      borderWidth: '1px',
      transition: 'all 0.2s ease',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: darkMode ? '#0f172a' : '#ffffff',
      borderRadius: '0.75rem',
      border: darkMode ? '1px solid rgba(51, 65, 85, 0.6)' : '1px solid rgba(229, 231, 235, 0.6)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      zIndex: 50,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#06b6d4'
        : state.isFocused
        ? darkMode ? '#1e293b' : '#f3f4f6'
        : 'transparent',
      color: state.isSelected
        ? '#ffffff'
        : darkMode ? '#cbd5e1' : '#374151',
      fontSize: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      padding: '8px 12px',
      transition: 'all 0.15s ease',
      '&:active': {
        backgroundColor: '#06b6d4',
        color: '#ffffff',
      }
    }),
    singleValue: (provided) => ({
      ...provided,
      color: darkMode ? '#e2e8f0' : '#374151',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: darkMode ? '#64748b' : '#9ca3af',
    }),
    input: (provided) => ({
      ...provided,
      color: darkMode ? '#e2e8f0' : '#374151',
      margin: '0px',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0px 6px',
    }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: state.isFocused ? '#06b6d4' : darkMode ? '#475569' : '#9ca3af',
      padding: '4px',
      '&:hover': {
        color: '#06b6d4',
      }
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    })
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedCompanyId, selectedMonth, selectedYear]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const yearNum = parseInt(selectedYear);
      
      let startDate, endDate;
      if (selectedMonth === 'ALL') {
        startDate = new Date(yearNum, 0, 1).toISOString();
        endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999).toISOString();
      } else {
        const monthIdx = parseInt(selectedMonth) - 1;
        startDate = new Date(yearNum, monthIdx, 1).toISOString();
        endDate = new Date(yearNum, monthIdx + 1, 0, 23, 59, 59, 999).toISOString();
      }

      // 1. Fetch report analytics with timeframe support
      const res = await fetch(`${API_URL}/reports?companyId=${selectedCompanyId}&startDate=${startDate}&endDate=${endDate}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch analytical reports.');
      const reportData = await res.json();
      setData(reportData);

      // 2. Fetch companies list for selector
      if (companies.length === 0) {
        const compRes = await fetch(`${API_URL}/companies`, { headers });
        if (compRes.ok) {
          const compData = await compRes.json();
          // get unique company names
          const uniqueComps = [];
          const map = new Map();
          for (const item of compData) {
            if (!map.has(item.name)) {
              map.set(item.name, true);
              uniqueComps.push(item);
            }
          }
          setCompanies(uniqueComps);
        }
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const escapeXml = (unsafe) => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const generateExcelXml = () => {
    const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || 'All';
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
   
   <!-- SLA Metrics HUD -->
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
   
   <!-- Status Distribution Table -->
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
   
   <!-- Priority Distribution Table -->
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
   
   <!-- Category Distribution Table -->
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
   
   <!-- Report Media Sources Table -->
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
   
   <!-- Client Company Distribution -->
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
   
   <!-- Department Distribution -->
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
   
   <!-- Subcategories Distribution -->
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
   <Column ss:Width="250"/> <!-- ID -->
   <Column ss:Width="100"/> <!-- Date -->
   <Column ss:Width="180"/> <!-- Location -->
   <Column ss:Width="150"/> <!-- Dept -->
   <Column ss:Width="200"/> <!-- Title -->
   <Column ss:Width="100"/> <!-- Category -->
   <Column ss:Width="100"/> <!-- Subcat -->
   <Column ss:Width="90"/>  <!-- Source -->
   <Column ss:Width="80"/>  <!-- Status -->
   <Column ss:Width="80"/>  <!-- Priority -->
   <Column ss:Width="110"/> <!-- Responded At -->
   <Column ss:Width="110"/> <!-- Resolved At -->
   <Column ss:Width="80"/>  <!-- SLA Status -->
   
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

  const handleExportExcel = () => {
    try {
      const xmlContent = generateExcelXml();
      const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || 'All';
      const filename = `IT_Helpdesk_Summary_Report_${monthLabel}_${selectedYear}.xls`;
      
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // clean up
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal mengekspor laporan: " + err.message);
    }
  };

  if (loading && !data) {
    return (
      <ReactLoader size="lg" text="Generating SLA Analysis Reports..." />
    );
  }

  // SLA compliance
  const slaRate = data?.sla?.complianceRate ?? 100;
  const metTickets = data?.sla?.met ?? 0;
  const breachedTickets = data?.sla?.breached ?? 0;

  const getSlaColor = (rate) => {
    if (rate >= 90) return 'text-emerald-500';
    if (rate >= 75) return 'text-amber-500';
    return 'text-red-500';
  };

  const slaHoverGlow = slaRate >= 90 
    ? 'hover:shadow-[0_0_20px_5px_rgba(16,185,129,0.18)]' 
    : slaRate >= 75 
    ? 'hover:shadow-[0_0_20px_5px_rgba(245,158,11,0.18)]' 
    : 'hover:shadow-[0_0_20px_5px_rgba(239,68,68,0.18)]';

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Inline styles for custom premium reports page animations */}
      <style>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes growWidth {
          from {
            width: 0%;
          }
        }
        .animate-slide-up-fade {
          animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-grow-width {
          animation: growWidth 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .delay-1 { animation-delay: 40ms; }
        .delay-2 { animation-delay: 80ms; }
        .delay-3 { animation-delay: 120ms; }
        .delay-4 { animation-delay: 160ms; }
        .delay-5 { animation-delay: 200ms; }
        .delay-6 { animation-delay: 240ms; }
        .delay-7 { animation-delay: 280ms; }
        .delay-8 { animation-delay: 320ms; }
      `}</style>
      
      {/* Title Header Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-brand-500 animate-pulse" />
            Analysis Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-semibold">
            Metrik kepatuhan SLA mendalam, distribusi prioritas, jenis media pelaporan, dan performa divisi.
          </p>
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto z-20">
          
          {/* Company Filter Selector (Agents & Admins) */}
          {user.role !== 'USER' && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-slate-800/80 px-3 py-1.5 rounded-xl shadow-sm">
              <Building2 className="w-4 h-4 text-gray-400" />
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none pr-4 cursor-pointer"
              >
                <option value="">All Companies</option>
                {companies.map(comp => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month Select */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
            <Select
              value={MONTHS.find(m => m.value === selectedMonth)}
              onChange={(opt) => setSelectedMonth(opt ? opt.value : 'ALL')}
              options={MONTHS}
              styles={customSelectStyles}
              isSearchable={false}
              menuPortalTarget={document.body}
            />
          </div>

          {/* Year Select */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            <Select
              value={yearOptions.find(y => y.value === selectedYear)}
              onChange={(opt) => setSelectedYear(opt ? opt.value : '2026')}
              options={yearOptions}
              styles={customSelectStyles}
              isSearchable={false}
              menuPortalTarget={document.body}
            />
          </div>

          {/* Export Excel Button */}
          {data && (
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-[0_0_20px_5px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <FileText className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          )}

        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {data && (
        <div 
          key={`${selectedCompanyId}-${selectedMonth}-${selectedYear}`} 
          className="space-y-8"
        >
          
          {/* 1. TOP SUMMARY HUD CARD GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* HUD 1: Total Tickets */}
            <div className="group glass-panel p-5 rounded-2xl bg-gradient-to-br from-white to-blue-50/10 dark:from-slate-900/70 dark:to-slate-950/40 border border-gray-250 dark:border-slate-800/80 shadow-md flex items-center justify-between hover:shadow-[0_0_20px_5px_rgba(59,130,246,0.15)] hover:-translate-y-1 transition-all duration-300 animate-slide-up-fade delay-1 opacity-0">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Tiket Masuk</p>
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100">{data.totalTickets}</h3>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">Insiden terdata di sistem</p>
              </div>
              <div className="p-3.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Ticket className="w-6 h-6" />
              </div>
            </div>

            {/* HUD 2: SLA compliance Met Rate */}
            <div className={`group glass-panel p-5 rounded-2xl bg-gradient-to-br from-white to-emerald-50/10 dark:from-slate-900/70 dark:to-slate-950/40 border border-gray-250 dark:border-slate-800/80 shadow-md flex items-center justify-between hover:-translate-y-1 transition-all duration-300 animate-slide-up-fade delay-2 opacity-0 ${slaHoverGlow}`}>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Kepatuhan SLA</p>
                <h3 className={`text-3xl font-extrabold ${getSlaColor(slaRate)}`}>{slaRate}%</h3>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">{metTickets} Met / {breachedTickets} Breached</p>
              </div>
              <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            {/* HUD 3: Average Response Time */}
            <div className="group glass-panel p-5 rounded-2xl bg-gradient-to-br from-white to-teal-50/10 dark:from-slate-900/70 dark:to-slate-950/40 border border-gray-200/50 dark:border-slate-800/80 shadow-md flex items-center justify-between hover:shadow-[0_0_20px_5px_rgba(20,184,166,0.15)] hover:-translate-y-1 transition-all duration-300 animate-slide-up-fade delay-3 opacity-0">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Rata Waktu Respon</p>
                <h3 className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">
                  {data.sla.avgResponseHours} <span className="text-xs font-bold text-gray-450">Jam</span>
                </h3>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">Durasi respon pertama agen</p>
              </div>
              <div className="p-3.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            {/* HUD 4: Average Resolution Time */}
            <div className="group glass-panel p-5 rounded-2xl bg-gradient-to-br from-white to-indigo-50/10 dark:from-slate-900/70 dark:to-slate-950/40 border border-gray-200/50 dark:border-slate-800/80 shadow-md flex items-center justify-between hover:shadow-[0_0_20px_5px_rgba(99,102,241,0.15)] hover:-translate-y-1 transition-all duration-300 animate-slide-up-fade delay-4 opacity-0">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Rata Waktu Resolusi</p>
                <h3 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {data.sla.avgResolutionHours} <span className="text-xs font-bold text-gray-450">Jam</span>
                </h3>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">Durasi penyelesaian bersih</p>
              </div>
              <div className="p-3.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* 2. GRID ROW 1: STATUS, PRIORITY & CATEGORIES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Box A: Status Breakdown */}
            <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between min-h-[340px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up-fade delay-5 opacity-0">
              <div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-500" />
                  <span>Ticket Status Distribution</span>
                </h4>
                <div className="space-y-3.5">
                  {Object.entries(data.status).map(([statusKey, count]) => {
                    const total = data.totalTickets || 1;
                    const percent = Math.round((count / total) * 100);

                    const colors = {
                      OPEN: 'bg-blue-500 text-blue-500 dark:text-blue-400',
                      IN_PROGRESS: 'bg-amber-500 text-amber-500 dark:text-amber-400',
                      PENDING: 'bg-slate-400 text-slate-400 dark:text-slate-350',
                      RESOLVED: 'bg-emerald-500 text-emerald-500 dark:text-emerald-400',
                      CLOSED: 'bg-gray-500 text-gray-500 dark:text-gray-400'
                    };

                    return (
                      <div key={statusKey} className="text-xs font-semibold space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-500 dark:text-slate-450 font-bold">{statusKey}</span>
                          <span className={colors[statusKey].split(' ')[1]}>{count} tickets ({percent}%)</span>
                        </div>
                        {/* Progress Bar Container */}
                        <div className="h-2.5 bg-gray-100 dark:bg-slate-800/50 rounded-full overflow-hidden relative border border-gray-200/10">
                          <div 
                            className={`h-full ${colors[statusKey].split(' ')[0]} rounded-full animate-grow-width`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Box B: Priority Breakdown */}
            <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between min-h-[340px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up-fade delay-6 opacity-0">
              <div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-brand-500" />
                  <span>Ticket Priority Breakdown</span>
                </h4>
                <div className="space-y-4">
                  {Object.entries(data.priorities).map(([priorityKey, count]) => {
                    const total = data.totalTickets || 1;
                    const percent = Math.round((count / total) * 100);

                    const barColors = {
                      LOW: 'bg-emerald-500',
                      MEDIUM: 'bg-amber-500',
                      HIGH: 'bg-rose-500',
                      CRITICAL: 'bg-red-650 animate-pulse'
                    };

                    const textColors = {
                      LOW: 'text-emerald-600 dark:text-emerald-450',
                      MEDIUM: 'text-amber-600 dark:text-amber-450',
                      HIGH: 'text-rose-600 dark:text-rose-455',
                      CRITICAL: 'text-red-600 dark:text-red-400 font-extrabold'
                    };

                    return (
                      <div key={priorityKey} className="text-xs font-semibold space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-500 dark:text-slate-450 font-bold">{priorityKey}</span>
                          <span className={textColors[priorityKey]}>{count} tickets ({percent}%)</span>
                        </div>
                        {/* Progress Bar Container */}
                        <div className="h-2.5 bg-gray-100 dark:bg-slate-800/50 rounded-full overflow-hidden relative border border-gray-200/10">
                          <div 
                            className={`h-full ${barColors[priorityKey] || 'bg-gray-400'} rounded-full animate-grow-width`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Box C: Category (Issue Type) Breakdown */}
            <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between min-h-[340px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up-fade delay-7 opacity-0">
              <div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-500" />
                  <span>Issue Type Distribution (Categories)</span>
                </h4>
                <div className="space-y-4">
                  {Object.entries(data.categories).map(([catKey, count]) => {
                    const total = data.totalTickets || 1;
                    const percent = Math.round((count / total) * 100);

                    return (
                      <div key={catKey} className="text-xs font-semibold space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-500 dark:text-slate-450 font-bold">{catKey}</span>
                          <span className="text-brand-600 dark:text-brand-400">{count} tickets ({percent}%)</span>
                        </div>
                        {/* Progress Bar Container */}
                        <div className="h-2.5 bg-gray-100 dark:bg-slate-800/50 rounded-full overflow-hidden relative border border-gray-200/10">
                          <div 
                            className="h-full bg-brand-500 rounded-full animate-grow-width"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* 3. GRID ROW 2: DETAILED VARIABLES (DEPARTMENTS, SUB-CATEGORIES, SOURCES) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Box D: Departments Breakdown */}
            <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between lg:col-span-1 min-h-[360px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up-fade delay-5 opacity-0">
              <div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-500" />
                  <span>Top Requester Departments</span>
                </h4>
                {Object.keys(data.departments || {}).length === 0 ? (
                  <p className="text-xs text-gray-400 py-12 text-center">No department data recorded.</p>
                ) : (
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {Object.entries(data.departments)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5) // Top 5
                      .map(([deptName, count]) => {
                        const total = data.totalTickets || 1;
                        const percent = Math.round((count / total) * 100);

                        return (
                          <div key={deptName} className="text-xs font-semibold space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-gray-700 dark:text-slate-300 font-bold truncate max-w-[170px]">{deptName}</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{count} ({percent}%)</span>
                            </div>
                            <div className="h-2 bg-gray-150 dark:bg-slate-800/50 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full animate-grow-width" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Box E: Top Sub-Categories */}
            <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between lg:col-span-1 min-h-[360px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up-fade delay-6 opacity-0">
              <div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-500" />
                  <span>Frequent Issue Sub-categories</span>
                </h4>
                {Object.keys(data.subCategories || {}).length === 0 ? (
                  <p className="text-xs text-gray-400 py-12 text-center">No sub-category data recorded.</p>
                ) : (
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {Object.entries(data.subCategories)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5) // Top 5
                      .map(([subCatName, count]) => {
                        const total = data.totalTickets || 1;
                        const percent = Math.round((count / total) * 100);

                        return (
                          <div key={subCatName} className="text-xs font-semibold space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-gray-700 dark:text-slate-300 font-bold truncate max-w-[170px]">{subCatName === '-' ? 'General/Other' : subCatName}</span>
                              <span className="text-amber-600 dark:text-amber-400 font-bold">{count} ({percent}%)</span>
                            </div>
                            <div className="h-2 bg-gray-150 dark:bg-slate-800/50 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full animate-grow-width" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Box F: Ticket Sources */}
            <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 flex flex-col justify-between lg:col-span-1 min-h-[360px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up-fade delay-7 opacity-0">
              <div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-500" />
                  <span>Report Media (Ticket Sources)</span>
                </h4>
                {Object.keys(data.sources || {}).length === 0 ? (
                  <p className="text-xs text-gray-400 py-12 text-center">No ticket source data recorded.</p>
                ) : (
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {Object.entries(data.sources)
                      .sort((a, b) => b[1] - a[1])
                      .map(([srcName, count]) => {
                        const total = data.totalTickets || 1;
                        const percent = Math.round((count / total) * 100);

                        return (
                          <div key={srcName} className="text-xs font-semibold space-y-1">
                            <div className="flex justify-between text-[11px] items-center">
                              <span className="text-gray-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                                {getSourceIcon(srcName)}
                                {srcName}
                              </span>
                              <span className="text-teal-600 dark:text-teal-400 font-bold">{count} ({percent}%)</span>
                            </div>
                            <div className="h-2 bg-gray-150 dark:bg-slate-800/50 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full animate-grow-width" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 4. SUBSIDIARY COMPANY VOLUMES TABLE */}
          <div className="glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up-fade delay-8 opacity-0">
            <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-brand-500 animate-pulse" />
              <span>Client Company Distribution Data (MRA Group)</span>
            </h4>
            
            {Object.keys(data.companies).length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500 dark:text-slate-500">
                No ticket data for registered companies in this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Subsidiary Company</th>
                      <th className="py-3 px-4 text-center">Total Tickets</th>
                      <th className="py-3 px-4">Volume Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-gray-700 dark:text-slate-300">
                    {Object.entries(data.companies)
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, count]) => {
                        const total = data.totalTickets || 1;
                        const pct = Math.round((count / total) * 100);

                        return (
                          <tr key={name} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-gray-800 dark:text-slate-200">{name}</td>
                            <td className="py-3 px-4 text-center text-brand-600 dark:text-brand-400 font-extrabold text-sm">{count}</td>
                            <td className="py-3 px-4 w-1/2">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-brand-500 rounded-full animate-grow-width" style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="w-8 text-right text-[10px] font-bold text-gray-500">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
