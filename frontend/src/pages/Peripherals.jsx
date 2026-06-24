import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Package, 
  Plus, 
  Search, 
  Building2, 
  Calendar, 
  Trash2, 
  Edit2, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Clock, 
  Cpu, 
  FileText, 
  DollarSign, 
  ShieldAlert, 
  Wrench, 
  Tag,
  ChevronDown,
  ChevronUp,
  Receipt,
  TrendingUp,
  Download,
  Eye
} from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_OPTIONS = [
  { value: 'STOCK', label: 'Tersedia (Stok)', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', dot: 'bg-emerald-500' },
  { value: 'IN_USE', label: 'Terpasang (Aktif)', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', dot: 'bg-blue-500' },
  { value: 'DAMAGED', label: 'Rusak', color: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400', dot: 'bg-red-500' },
  { value: 'RETIRED', label: 'Pensiun / Dibuang', color: 'bg-slate-50 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400', dot: 'bg-slate-500' }
];

const DEFAULT_CATEGORIES = ['CCTV', 'NVR', 'HDD', 'Storage / HDD', 'UPS / Power', 'Network Switch', 'Printer', 'Access Control'];
const DEFAULT_BRANDS = [
  'Hikvision', 'Dahua', 'Seagate', 'Western Digital', 'Toshiba',
  'Transcend', 'Kingston', 'SanDisk', 'Samsung', 'TP-Link',
  'Cisco', 'APC', 'Epson', 'Canon', 'HP'
];

export default function Peripherals({ user, token }) {
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices', 'items', or 'analysis'
  const [peripherals, setPeripherals] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyMasters, setCompanyMasters] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState({
    expensesByCategory: [],
    expensesByCompany: [],
    expensesBySupplier: [],
    monthlyTrend: []
  });
  const [exporting, setExporting] = useState(false);
  const [viewingAsset, setViewingAsset] = useState(null);

  // Stats state
  const [stats, setStats] = useState({
    totalCount: 0,
    totalQuantity: 0,
    totalBudget: 0,
    stockQuantity: 0,
    inUseQuantity: 0,
    damagedQuantity: 0,
    categories: [],
    totalInvoices: 0,
    totalInvoiceBudget: 0,
    totalServiceBudget: 0
  });

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCompanyMasterId, setSelectedCompanyMasterId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Tracks whether each tab's data has been explicitly loaded at least once
  // (data only loads on demand via the "Proses / Muat Data" button, never automatically)
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [analysisLoaded, setAnalysisLoaded] = useState(false);

  // UI state
  const [expandedRows, setExpandedRows] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form Fields (Invoice Header)
  const [formId, setFormId] = useState('');
  const [formInvoiceRef, setFormInvoiceRef] = useState('');
  const [formPoRef, setFormPoRef] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formServiceItems, setFormServiceItems] = useState([{ description: '', cost: '' }]);
  const [formDeliveryCost, setFormDeliveryCost] = useState('');
  const [formTaxCost, setFormTaxCost] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCompanyMasterId, setFormCompanyMasterId] = useState('');
  const [formFileLink, setFormFileLink] = useState('');

  // Form Fields (Invoice Child Items)
  const [formItems, setFormItems] = useState([
    { name: '', category: '', brand: '', model: '', serialNumber: '', purchaseCost: '', quantity: '1', status: 'STOCK', companyId: '' }
  ]);

  const activeCategories = dbCategories.length > 0 ? dbCategories.map(c => c.name) : DEFAULT_CATEGORIES;
  const allFormCategories = Array.from(new Set([...activeCategories, ...stats.categories]));

  // Data is loaded strictly on demand via the "Proses / Muat Data" button — opening the
  // page, switching tabs, and changing filters never auto-fetch the invoice/items/analysis data.
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchStats = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${API_URL}/peripherals/stats`, { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Gagal memuat statistik KPI periferal:", err);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch Master Companies (non-blocking: a transient failure here must not
      // prevent the main invoice/items table from loading below)
      try {
        const masterRes = await fetch(`${API_URL}/companies/master`, { headers });
        if (masterRes.ok) {
          setCompanyMasters(await masterRes.json());
        }
      } catch (masterErr) {
        console.error("Gagal memuat data perusahaan induk:", masterErr);
      }

      // 2. Fetch Companies (Branch locations)
      try {
        const branchRes = await fetch(`${API_URL}/companies`, { headers });
        if (branchRes.ok) {
          setCompanies(await branchRes.json());
        }
      } catch (branchErr) {
        console.error("Gagal memuat data kantor cabang:", branchErr);
      }

      // 3. Fetch Peripheral Category Metadata
      try {
        const catRes = await fetch(`${API_URL}/peripherals/categories`, { headers });
        if (catRes.ok) {
          const catData = await catRes.json();
          setDbCategories(catData);
        }
      } catch (catErr) {
        console.error("Gagal memuat kategori dari database:", catErr);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };

      const params = new URLSearchParams();
      if (selectedCompanyMasterId) params.append('companyMasterId', selectedCompanyMasterId);
      if (searchQuery && searchQuery.trim() !== '') params.append('search', searchQuery.trim());

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_URL}/peripherals/invoices${queryString}`, { headers });
      if (!res.ok) throw new Error('Gagal memuat data invoice.');
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setInvoicesLoaded(true);
    }
  };

  const fetchPeripherals = async (currentSearch = searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };

      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedCompanyMasterId) params.append('companyMasterId', selectedCompanyMasterId);
      if (currentSearch && currentSearch.trim() !== '') params.append('search', currentSearch.trim());
      if (selectedCategory) params.append('category', selectedCategory);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`${API_URL}/peripherals${queryString}`, { headers });
      if (!res.ok) throw new Error('Gagal memuat data individual periferal.');
      const data = await res.json();
      setPeripherals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setItemsLoaded(true);
    }
  };

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${API_URL}/peripherals/analysis`, { headers });
      if (!res.ok) throw new Error('Gagal memuat analisa biaya.');
      const data = await res.json();
      setAnalysisData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setAnalysisLoaded(true);
    }
  };

  const handleRefreshData = async () => {
    await fetchStats();
    if (activeTab === 'invoices') {
      await fetchInvoices();
    } else if (activeTab === 'items') {
      await fetchPeripherals();
    } else if (activeTab === 'analysis') {
      await fetchAnalysis();
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedCompanyMasterId('');
    setSelectedCategory('');
  };

  const escapeXml = (str) => {
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [invRes, assetRes] = await Promise.all([
        fetch(`${API_URL}/peripherals/invoices?limit=100000`, { headers }),
        fetch(`${API_URL}/peripherals?limit=100000`, { headers })
      ]);

      if (!invRes.ok || !assetRes.ok) throw new Error('Gagal memuat data untuk ekspor.');

      const exportInvoices = await invRes.json();
      const exportAssets = await assetRes.json();

      let xml = `<?xml version="1.0" encoding="utf-8"?>
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
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#1E293B"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#E11D48" ss:Pattern="Solid"/>
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

      // SHEET 1: RINGKASAN INVOICE
      xml += `
 <Worksheet ss:Name="Ringkasan Invoice">
  <Table x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="100" ss:DefaultRowHeight="20">
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="150"/>
   <Column ss:Width="95"/>
   <Column ss:Width="180"/>
   <Column ss:Width="70"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="110"/>
   <Column ss:Width="200"/>

   <Row ss:Height="25">
    <Cell ss:MergeAcross="10" ss:StyleID="Title"><Data ss:Type="String">LAPORAN BIAYA PEMBELIAN IT PERIPHERALS</Data></Cell>
   </Row>
   <Row ss:Height="15"><Cell/></Row>

   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">No. Invoice</Data></Cell>
    <Cell><Data ss:Type="String">No. PO</Data></Cell>
    <Cell><Data ss:Type="String">Supplier/Vendor</Data></Cell>
    <Cell><Data ss:Type="String">Tanggal Invoice</Data></Cell>
    <Cell><Data ss:Type="String">Entitas Pembayar</Data></Cell>
    <Cell><Data ss:Type="String">Jml Item</Data></Cell>
    <Cell><Data ss:Type="String">Biaya Jasa</Data></Cell>
    <Cell><Data ss:Type="String">Ongkos Kirim</Data></Cell>
    <Cell><Data ss:Type="String">Pajak</Data></Cell>
    <Cell><Data ss:Type="String">Total Invoice</Data></Cell>
    <Cell><Data ss:Type="String">Catatan</Data></Cell>
   </Row>
`;

      let totalInvoicesCost = 0;
      let totalServicesCost = 0;
      let totalDeliveryCost = 0;
      let totalTaxCost = 0;
      let totalItemQty = 0;

      exportInvoices.forEach(inv => {
        totalInvoicesCost += inv.totalCost || 0;
        totalServicesCost += inv.serviceCost || 0;
        totalDeliveryCost += inv.deliveryCost || 0;
        totalTaxCost += inv.taxCost || 0;
        totalItemQty += inv._count?.items || 0;

        xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(inv.invoiceRef)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(inv.poRef || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(inv.supplier)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(formatDate(inv.purchaseDate))}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(inv.companyMaster?.name || '-')}</Data></Cell>
    <Cell><Data ss:Type="Number">${inv._count?.items || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${inv.serviceCost || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${inv.deliveryCost || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${inv.taxCost || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${inv.totalCost || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(inv.notes || '')}</Data></Cell>
   </Row>`;
      });

      xml += `
   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">TOTAL KESELURUHAN</Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="Number">${totalItemQty}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${totalServicesCost}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${totalDeliveryCost}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${totalTaxCost}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${totalInvoicesCost}</Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
   </Row>
  </Table>
 </Worksheet>
`;

      // SHEET 2: DETIL ASET
      xml += `
 <Worksheet ss:Name="Daftar Aset Fisik">
  <Table x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="100" ss:DefaultRowHeight="20">
   <Column ss:Width="180"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="60"/>
   <Column ss:Width="100"/>
   <Column ss:Width="110"/>
   <Column ss:Width="180"/>
   <Column ss:Width="180"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="150"/>
   <Column ss:Width="95"/>

   <Row ss:Height="25">
    <Cell ss:MergeAcross="13" ss:StyleID="Title"><Data ss:Type="String">LAPORAN INVENTORI ASET FISIK IT PERIPHERALS</Data></Cell>
   </Row>
   <Row ss:Height="15"><Cell/></Row>

   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">Nama Perangkat</Data></Cell>
    <Cell><Data ss:Type="String">Kategori</Data></Cell>
    <Cell><Data ss:Type="String">Brand</Data></Cell>
    <Cell><Data ss:Type="String">Model</Data></Cell>
    <Cell><Data ss:Type="String">Serial Number</Data></Cell>
    <Cell><Data ss:Type="String">Kuantitas</Data></Cell>
    <Cell><Data ss:Type="String">Harga Unit</Data></Cell>
    <Cell><Data ss:Type="String">Total Biaya</Data></Cell>
    <Cell><Data ss:Type="String">Entitas Induk</Data></Cell>
    <Cell><Data ss:Type="String">Lokasi Penempatan</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">No. Invoice</Data></Cell>
    <Cell><Data ss:Type="String">Supplier/Vendor</Data></Cell>
    <Cell><Data ss:Type="String">Tanggal Beli</Data></Cell>
   </Row>
`;

      let totalAssetsQty = 0;
      let totalAssetsCost = 0;

      exportAssets.forEach(p => {
        totalAssetsQty += p.quantity || 0;
        totalAssetsCost += p.totalCost || 0;

        const statusLabel = STATUS_OPTIONS.find(o => o.value === p.status)?.label || p.status;

        xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(p.name)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.category)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.brand)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.model || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.serialNumber || '')}</Data></Cell>
    <Cell><Data ss:Type="Number">${p.quantity || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${p.purchaseCost || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${p.totalCost || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.companyMaster?.name || '-')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.company ? `${p.company.name} (${p.company.location})` : '-')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(statusLabel)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.peripheralInvoice?.invoiceRef || p.invoiceRef || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.peripheralInvoice?.supplier || p.supplier || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(formatDate(p.peripheralInvoice?.purchaseDate || p.purchaseDate))}</Data></Cell>
   </Row>`;
      });

      xml += `
   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">TOTAL KESELURUHAN</Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="Number">${totalAssetsQty}</Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${totalAssetsCost}</Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
   </Row>
  </Table>
 </Worksheet>
`;

      xml += `</Workbook>`;

      const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IT_Peripherals_Report_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Ekspor Gagal',
        text: err.message,
        confirmButtonColor: '#f43f5e'
      });
    } finally {
      setExporting(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper formatting values
  const formatRupiah = (value) => {
    if (value === undefined || value === null) return 'Rp 0';
    return 'Rp ' + Number(value).toLocaleString('id-ID');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
      return '-';
    }
  };

  // Auto format price input with dots helper
  const formatCostDigits = (val) => {
    const rawDigits = val.toString().replace(/\D/g, '');
    if (!rawDigits) return '';
    return parseInt(rawDigits, 10).toLocaleString('id-ID');
  };

  // Form item row helpers
  const handleAddItemRow = () => {
    setFormItems(prev => [
      ...prev,
      { name: '', category: '', brand: '', model: '', serialNumber: '', purchaseCost: '', quantity: '1', status: 'STOCK', companyId: '' }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (formItems.length === 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Minimal 1 Item',
        text: 'Sebuah invoice wajib memiliki minimal 1 item barang periferal.',
        confirmButtonColor: '#f43f5e'
      });
      return;
    }
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemField = (index, field, value) => {
    setFormItems(prev => {
      const next = [...prev];
      next[index][field] = value;
      return next;
    });
  };

  const handleItemPriceChange = (index, val) => {
    const formatted = formatCostDigits(val);
    handleUpdateItemField(index, 'purchaseCost', formatted);
  };

  // Form service row helpers (a single invoice can have multiple service/labor charges)
  const handleAddServiceRow = () => {
    setFormServiceItems(prev => [...prev, { description: '', cost: '' }]);
  };

  const handleRemoveServiceRow = (index) => {
    setFormServiceItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateServiceField = (index, field, value) => {
    setFormServiceItems(prev => {
      const next = [...prev];
      next[index][field] = value;
      return next;
    });
  };

  const handleServiceCostChange = (index, val) => {
    handleUpdateServiceField(index, 'cost', formatCostDigits(val));
  };

  // Dynamic cost calculation in Form Drawer
  const calculateTotalInvoiceCost = () => {
    let itemsCost = 0;
    formItems.forEach(item => {
      const cost = parseFloat(item.purchaseCost.toString().replace(/\./g, '')) || 0;
      const qty = parseInt(item.quantity) || 1;
      itemsCost += cost * qty;
    });
    const service = formServiceItems.reduce((sum, svc) => sum + (parseFloat(svc.cost.toString().replace(/\./g, '')) || 0), 0);
    const delivery = parseFloat(formDeliveryCost.toString().replace(/\./g, '')) || 0;
    const tax = parseFloat(formTaxCost.toString().replace(/\./g, '')) || 0;
    return itemsCost + service + delivery + tax;
  };

  // Open modal/drawer for creating a new invoice purchase
  const handleOpenAddModal = () => {
    setFormId('');
    setFormInvoiceRef('');
    setFormPoRef('');
    setFormSupplier('');
    setFormPurchaseDate('');
    setFormServiceItems([{ description: '', cost: '' }]);
    setFormDeliveryCost('');
    setFormTaxCost('');
    setFormNotes('');
    setFormCompanyMasterId('');
    setFormFileLink('');
    setFormItems([
      { name: '', category: '', brand: '', model: '', serialNumber: '', purchaseCost: '', quantity: '1', status: 'STOCK', companyId: '' }
    ]);
    setFormError(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Open modal/drawer for editing an invoice
  const handleOpenEditModal = async (invoiceId) => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${API_URL}/peripherals/invoices/${invoiceId}`, { headers });
      if (!res.ok) throw new Error('Gagal memuat detail invoice.');
      const invoice = await res.json();

      setFormId(invoice.id);
      setFormInvoiceRef(invoice.invoiceRef);
      setFormPoRef(invoice.poRef || '');
      setFormSupplier(invoice.supplier);
      setFormPurchaseDate(invoice.purchaseDate ? invoice.purchaseDate.split('T')[0] : '');
      
      if (Array.isArray(invoice.serviceCostBreakdown) && invoice.serviceCostBreakdown.length > 0) {
        setFormServiceItems(invoice.serviceCostBreakdown.map(svc => ({
          description: svc.description || '',
          cost: svc.cost ? parseInt(svc.cost, 10).toLocaleString('id-ID') : ''
        })));
      } else if (invoice.serviceCost) {
        // Legacy invoice: only a lump total was stored, no itemized breakdown
        setFormServiceItems([{ description: 'Biaya Jasa', cost: parseInt(invoice.serviceCost, 10).toLocaleString('id-ID') }]);
      } else {
        setFormServiceItems([{ description: '', cost: '' }]);
      }
      setFormDeliveryCost(invoice.deliveryCost ? parseInt(invoice.deliveryCost, 10).toLocaleString('id-ID') : '');
      setFormTaxCost(invoice.taxCost ? parseInt(invoice.taxCost, 10).toLocaleString('id-ID') : '');
      
      setFormNotes(invoice.notes || '');
      setFormCompanyMasterId(invoice.companyMasterId ? invoice.companyMasterId.toString() : '');
      setFormFileLink(invoice.fileLink || '');

      // Load items
      const loadedItems = invoice.items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        brand: item.brand,
        model: item.model || '',
        serialNumber: item.serialNumber || '',
        purchaseCost: item.purchaseCost ? parseInt(item.purchaseCost, 10).toLocaleString('id-ID') : '',
        quantity: item.quantity.toString(),
        status: item.status,
        companyId: item.companyId ? item.companyId.toString() : ''
      }));
      setFormItems(loadedItems);

      setFormError(null);
      setIsEditMode(true);
      setIsModalOpen(true);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: err.message,
        confirmButtonColor: '#f43f5e'
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    if (!formInvoiceRef || !formSupplier || !formPurchaseDate || !formCompanyMasterId) {
      setFormError('Harap lengkapi semua field header invoice yang wajib (*)');
      setSubmitting(false);
      return;
    }

    // Validate and format items
    const validatedItems = [];
    for (let i = 0; i < formItems.length; i++) {
      const item = formItems[i];
      if (!item.name || !item.category || !item.brand || !item.purchaseCost || !item.quantity) {
        setFormError(`Harap lengkapi field wajib pada item baris ke-${i + 1}`);
        setSubmitting(false);
        return;
      }
      const unitCost = parseFloat(item.purchaseCost.toString().replace(/\./g, ''));
      const qty = parseInt(item.quantity, 10);
      if (isNaN(unitCost) || unitCost < 0 || isNaN(qty) || qty <= 0) {
        setFormError(`Harga unit atau kuantitas pada item baris ke-${i + 1} tidak valid.`);
        setSubmitting(false);
        return;
      }

      validatedItems.push({
        id: item.id || undefined, // keep existing id for updates
        name: item.name.trim(),
        category: item.category.trim(),
        brand: item.brand.trim(),
        model: item.model ? item.model.trim() : null,
        serialNumber: item.serialNumber ? item.serialNumber.trim() : null,
        purchaseCost: unitCost,
        quantity: qty,
        status: item.status,
        companyId: item.companyId ? parseInt(item.companyId, 10) : null
      });
    }

    // Validate and format service cost rows (description required only if a row has any content)
    const validatedServiceItems = [];
    for (let i = 0; i < formServiceItems.length; i++) {
      const svc = formServiceItems[i];
      if (!svc.description && !svc.cost) continue; // skip fully empty rows

      if (!svc.description || !svc.cost) {
        setFormError(`Harap lengkapi deskripsi dan biaya pada baris jasa ke-${i + 1}`);
        setSubmitting(false);
        return;
      }
      const cost = parseFloat(svc.cost.toString().replace(/\./g, ''));
      if (isNaN(cost) || cost < 0) {
        setFormError(`Biaya pada baris jasa ke-${i + 1} tidak valid.`);
        setSubmitting(false);
        return;
      }
      validatedServiceItems.push({ description: svc.description.trim(), cost });
    }

    const serviceCostNum = validatedServiceItems.reduce((sum, svc) => sum + svc.cost, 0);
    const deliveryCostNum = parseFloat(formDeliveryCost.toString().replace(/\./g, '')) || 0;
    const taxCostNum = parseFloat(formTaxCost.toString().replace(/\./g, '')) || 0;

    const payload = {
      invoiceRef: formInvoiceRef.trim(),
      poRef: formPoRef ? formPoRef.trim() : null,
      supplier: formSupplier.trim(),
      purchaseDate: formPurchaseDate,
      serviceCost: serviceCostNum,
      serviceCostBreakdown: validatedServiceItems,
      deliveryCost: deliveryCostNum,
      taxCost: taxCostNum,
      notes: formNotes ? formNotes.trim() : null,
      fileLink: formFileLink ? formFileLink.trim() : null,
      companyMasterId: parseInt(formCompanyMasterId, 10),
      items: validatedItems
    };

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      let res;
      if (isEditMode) {
        res = await fetch(`${API_URL}/peripherals/invoices/${formId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/peripherals/invoices`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal menyimpan data.');

      setIsModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: isEditMode ? 'Invoice Diperbarui!' : 'Invoice Terdaftar!',
        text: `Invoice ${formInvoiceRef} berhasil disimpan dengan ${validatedItems.length} item.`,
        confirmButtonColor: '#f43f5e',
        timer: 2000
      });

      handleRefreshData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Entire Invoice (Admin Only)
  const handleDeleteInvoice = (invoice) => {
    Swal.fire({
      title: 'Apakah Anda Yakin?',
      text: `Menghapus Invoice "${invoice.invoiceRef}" dari ${invoice.supplier} beserta seluruh barang di dalamnya? Tindakan ini tidak bisa dibatalkan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus Semua!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${API_URL}/peripherals/invoices/${invoice.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Gagal menghapus data.');
          }

          Swal.fire({
            icon: 'success',
            title: 'Dihapus!',
            text: 'Invoice dan seluruh item terkait berhasil dihapus.',
            confirmButtonColor: '#f43f5e',
            timer: 1500
          });
          handleRefreshData();
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: err.message,
            confirmButtonColor: '#f43f5e'
          });
        }
      }
    });
  };

  // Request deletion of a single item inside invoice (for agents) or direct delete (for admin)
  const handleDeleteSingleItem = (p) => {
    Swal.fire({
      title: 'Hapus Item Periferal?',
      text: `Menghapus data item ${p.brand} ${p.model || ''} (${p.name})? Tindakan ini akan memperbarui total biaya invoice.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (user.role === 'ADMIN') {
          try {
            const res = await fetch(`${API_URL}/peripherals/${p.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || 'Gagal menghapus data.');
            }

            Swal.fire({
              icon: 'success',
              title: 'Dihapus!',
              text: 'Item periferal berhasil dihapus dari database.',
              confirmButtonColor: '#f43f5e',
              timer: 1500
            });
            handleRefreshData();
          } catch (err) {
            Swal.fire({
              icon: 'error',
              title: 'Gagal!',
              text: err.message,
              confirmButtonColor: '#f43f5e'
            });
          }
        } else {
          // AGENT: request deletion reason
          Swal.fire({
            title: 'Alasan Penghapusan',
            text: 'Tuliskan alasan mengapa item periferal ini perlu dihapus:',
            input: 'textarea',
            inputPlaceholder: 'Tulis alasan di sini...',
            showCancelButton: true,
            confirmButtonText: 'Ajukan Hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#f43f5e',
            preConfirm: (text) => {
              if (!text || text.trim().length === 0) {
                Swal.showValidationMessage('Alasan penghapusan wajib diisi.');
              }
              return text;
            }
          }).then(async (reasonResult) => {
            if (reasonResult.isConfirmed) {
              try {
                const res = await fetch(`${API_URL}/peripherals/${p.id}`, {
                  method: 'DELETE',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                  },
                  body: JSON.stringify({ reason: reasonResult.value })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Gagal mengajukan penghapusan.');

                Swal.fire({
                  icon: 'info',
                  title: 'Diajukan!',
                  text: 'Permintaan penghapusan item telah diajukan ke Admin.',
                  confirmButtonColor: '#3b82f6'
                });
                handleRefreshData();
              } catch (err) {
                Swal.fire({
                  icon: 'error',
                  title: 'Gagal!',
                  text: err.message,
                  confirmButtonColor: '#f43f5e'
                });
              }
            }
          });
        }
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white font-outfit">
            IT Peripherals Purchase
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-400 font-semibold mt-0.5 max-w-xl">
            Kelola pembelian dan penempatan perangkat periferal IT operasional seperti NVR, CCTV Camera, Harddisk/Storage, Power/UPS, dan Network Switches di lingkungan MRA Group.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-1.5 border border-emerald-500 hover:bg-emerald-55/10 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 duration-200 disabled:opacity-50 cursor-pointer"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Excel
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Daftarkan Pembelian Periferal
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Stat 1: Total Invoices */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Invoice</p>
            <h3 className="text-xl font-black text-gray-800 dark:text-slate-100 mt-1">{stats.totalInvoices || 0} Invoice</h3>
            <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">
              Dari vendor/supplier
            </p>
          </div>
          <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-xl flex items-center justify-center font-outfit">
            <Receipt className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 2: Total Cost */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Pengeluaran</p>
            <h3 className="text-md font-black text-rose-500 dark:text-rose-455 mt-1.5 truncate max-w-[140px]">{formatRupiah(stats.totalInvoiceBudget)}</h3>
            <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">Termasuk Jasa & Pajak</p>
          </div>
          <div className="w-9 h-9 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-455 rounded-xl flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 3: Total Service Costs */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Biaya Jasa</p>
            <h3 className="text-md font-black text-amber-500 dark:text-amber-400 mt-1.5 truncate max-w-[140px]">{formatRupiah(stats.totalServiceBudget)}</h3>
            <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">Jasa Instalasi & Setting</p>
          </div>
          <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-455 rounded-xl flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 4: Total Items */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Unit Item</p>
            <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.totalQuantity} Unit</h3>
            <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">Stok & Terpasang</p>
          </div>
          <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-455 rounded-xl flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 5: Ready Stock */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Stok Gudang (Ready)</p>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-450 mt-1">{stats.stockQuantity} Unit</h3>
            <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">Siap Dialokasikan</p>
          </div>
          <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-455 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-gray-200 dark:border-slate-800">
        <button
          onClick={() => { setActiveTab('invoices'); handleResetFilters(); }}
          className={`py-3 px-6 text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-[2px] ${
            activeTab === 'invoices' 
              ? 'border-rose-500 text-rose-500' 
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-slate-350'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Pembelian & Biaya (Invoice Expenses)</span>
        </button>
        <button
          onClick={() => { setActiveTab('items'); handleResetFilters(); }}
          className={`py-3 px-6 text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-[2px] ${
            activeTab === 'items' 
              ? 'border-rose-500 text-rose-500' 
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-slate-350'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Stok & Aset Fisik (Inventory Stock)</span>
        </button>
        <button
          onClick={() => { setActiveTab('analysis'); handleResetFilters(); }}
          className={`py-3 px-6 text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-[2px] ${
            activeTab === 'analysis' 
              ? 'border-rose-500 text-rose-500' 
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-slate-350'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Analisa Biaya (Cost Analysis)</span>
        </button>
      </div>

      {/* Control Filter Bar */}
      <div className="glass-panel p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-gray-250/60 dark:border-slate-800/60 space-y-4">

        {activeTab !== 'analysis' && (
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:w-80 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
              <input
                type="text"
                placeholder={activeTab === 'invoices' ? "Cari No. Invoice, Supplier, Catatan..." : "Cari Nama, Brand, Invoice, Supplier, S/N..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-200 dark:border-slate-850/50 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
              />
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex gap-3 w-full lg:w-auto">

              {/* Category Selector (Items Only) */}
              {activeTab === 'items' && (
                <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-955/30 border border-gray-200 dark:border-slate-850/50 px-3 py-2.5 rounded-xl w-full lg:w-48">
                  <Tag className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
                  >
                    <option value="">Semua Kategori</option>
                    {allFormCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Master Company Selector */}
              <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-955/30 border border-gray-200 dark:border-slate-850/50 px-3 py-2.5 rounded-xl w-full lg:w-56">
                <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                <select
                  value={selectedCompanyMasterId}
                  onChange={(e) => setSelectedCompanyMasterId(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
                >
                  <option value="">Semua Entitas Induk</option>
                  {companyMasters.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Selector (Items Only) */}
              {activeTab === 'items' && (
                <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-955/30 border border-gray-200 dark:border-slate-850/50 px-3 py-2.5 rounded-xl w-full lg:w-48">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
                  >
                    <option value="">Semua Status</option>
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Action Button Row */}
        <div className={`flex justify-end items-center gap-3 ${activeTab !== 'analysis' ? 'pt-3 border-t border-gray-150 dark:border-slate-800/60' : ''}`}>
          {(searchQuery || selectedStatus || selectedCompanyMasterId || selectedCategory) && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-gray-255 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/55 text-gray-655 dark:text-slate-350 text-xs font-bold rounded-xl transition"
            >
              Reset Filter
            </button>
          )}
          <button
            onClick={handleRefreshData}
            disabled={loading}
            className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
            Proses / Muat Data
          </button>
        </div>
      </div>

      {/* Main Content Area (Tab Invoices or Tab Items) */}
      {activeTab === 'invoices' ? (
        /* ==================== TAB 1: INVOICES ==================== */
        !invoicesLoaded && !loading ? (
          <PendingProcessPlaceholder
            title="Filter & Proses Data Invoice"
            description={'Pilih kriteria pencarian dan filter di atas (opsional), lalu klik tombol "Proses / Muat Data" untuk menampilkan data invoice pembelian periferal.'}
          />
        ) : (
        <div className="glass-panel rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden">
          {loading && invoices.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
              <span className="text-xs text-gray-500 font-semibold">Memuat Data Invoice...</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-16 px-6 animate-fade-in flex flex-col items-center justify-center gap-3">
              <Receipt className="w-8 h-8 text-rose-500/80" />
              <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold max-w-md">
                {searchQuery || selectedCompanyMasterId
                  ? 'Tidak ada data invoice yang cocok dengan kriteria pencarian atau filter Anda.'
                  : 'Belum ada data transaksi invoice terdaftar di sistem MRA Group.'}
              </p>
            </div>
          ) : (
            <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <table className="w-full text-left text-xs font-semibold border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-6 w-10"></th>
                    <th className="py-4 px-6">No. Invoice & PO</th>
                    <th className="py-4 px-6">Supplier</th>
                    <th className="py-4 px-6">Tanggal Pembelian</th>
                    <th className="py-4 px-6">Entitas (Pembayar)</th>
                    <th className="py-4 px-6 text-right">Biaya Jasa</th>
                    <th className="py-4 px-6 text-center">Items</th>
                    <th className="py-4 px-6 text-right font-extrabold text-rose-500">Total Invoice</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-700 dark:text-slate-300">
                  {invoices.map((inv) => {
                    const isExpanded = !!expandedRows[inv.id];

                    return (
                      <React.Fragment key={inv.id}>
                        <tr 
                          onClick={() => toggleRow(inv.id)}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/25 transition cursor-pointer border-b border-gray-100 dark:border-slate-850/30 ${isExpanded ? 'bg-slate-50/30 dark:bg-slate-900/15' : ''}`}
                        >
                          <td className="py-4 px-6 text-center">
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-rose-500" /> : <ChevronDown className="w-4 h-4 text-gray-450" />}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-extrabold text-gray-900 dark:text-white text-xs flex items-center gap-1.5">
                              <span>{inv.invoiceRef}</span>
                              {inv.fileLink && (
                                <a 
                                  href={inv.fileLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-emerald-500 hover:text-emerald-600 transition shrink-0"
                                  title="Lihat Bukti Fisik / Attachment Invoice"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            {inv.poRef && <div className="text-[10px] text-gray-455 font-mono mt-0.5">PO: {inv.poRef}</div>}
                          </td>
                          <td className="py-4 px-6 font-bold text-gray-805 dark:text-slate-205">{inv.supplier}</td>
                          <td className="py-4 px-6">{formatDate(inv.purchaseDate)}</td>
                          <td className="py-4 px-6 font-bold text-gray-800 dark:text-slate-200">{inv.companyMaster?.name || '-'}</td>
                          <td className="py-4 px-6 text-right font-medium text-slate-500">{formatRupiah(inv.serviceCost)}</td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-655 dark:text-slate-300">
                              {inv._count?.items || 0} Item
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right font-black text-rose-500 dark:text-rose-455">{formatRupiah(inv.totalCost)}</td>
                          <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditModal(inv.id)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-rose-500 rounded-lg transition"
                                title="Edit Invoice"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {user.role === 'ADMIN' && (
                                <button
                                  onClick={() => handleDeleteInvoice(inv)}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-red-500 rounded-lg transition"
                                  title="Hapus Invoice"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable row: Invoice Child Items Subtable */}
                        {isExpanded && (
                          <tr>
                            <td colSpan="9" className="p-6 bg-slate-50/40 dark:bg-slate-900/20 border-t border-gray-150 dark:border-slate-850">
                              <div className="space-y-4">
                                <h5 className="font-extrabold text-[10px] uppercase text-gray-455 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                                  <Package className="w-3.5 h-3.5 text-rose-500" />
                                  Barang Pembelian Terdaftar di Dalam Invoice
                                </h5>

                                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-955 shadow-inner">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="bg-gray-50 dark:bg-slate-900/60 border-b border-gray-200 dark:border-slate-800 text-gray-450 uppercase text-[9px] font-extrabold tracking-wider">
                                        <th className="py-2.5 px-4">Nama Barang</th>
                                        <th className="py-2.5 px-4">Kategori</th>
                                        <th className="py-2.5 px-4">Brand / Model</th>
                                        <th className="py-2.5 px-4">Serial Number</th>
                                        <th className="py-2.5 px-4 text-center">Qty</th>
                                        <th className="py-2.5 px-4 text-right">Harga Satuan</th>
                                        <th className="py-2.5 px-4 text-right">Total</th>
                                        <th className="py-2.5 px-4 text-center">Status</th>
                                        <th className="py-2.5 px-4 text-right">Aksi</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-850/50 text-gray-700 dark:text-slate-350">
                                      <InvoiceItemsSubtable 
                                        invoiceId={inv.id} 
                                        token={token} 
                                        formatRupiah={formatRupiah} 
                                        statusOptions={STATUS_OPTIONS} 
                                        onDeleteItem={handleDeleteSingleItem} 
                                        onViewItem={(item) => setViewingAsset(item)}
                                        user={user} 
                                      />
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )
      ) : activeTab === 'items' ? (
        /* ==================== TAB 2: INVENTORY STOCK ITEMS ==================== */
        !itemsLoaded && !loading ? (
          <PendingProcessPlaceholder
            title="Filter & Proses Data Aset"
            description={'Pilih kriteria pencarian dan filter di atas (opsional), lalu klik tombol "Proses / Muat Data" untuk menampilkan data aset/stok periferal.'}
          />
        ) : (
        <div className="glass-panel rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden">
          {loading && peripherals.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
              <span className="text-xs text-gray-500 font-semibold">Memuat Aset Periferal...</span>
            </div>
          ) : peripherals.length === 0 ? (
            <div className="text-center py-16 px-6 animate-fade-in flex flex-col items-center justify-center gap-3">
              <Package className="w-8 h-8 text-rose-500/80" />
              <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold max-w-md">
                Tidak ada barang periferal yang cocok dengan kriteria pencarian stok Anda.
              </p>
            </div>
          ) : (
            <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <table className="w-full text-left text-xs font-semibold border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-6">Nama Alat & Spesifikasi</th>
                    <th className="py-4 px-6">Kategori</th>
                    <th className="py-4 px-6">Lokasi Penempatan</th>
                    <th className="py-4 px-6">Kuantitas</th>
                    <th className="py-4 px-6 text-right">Harga Unit</th>
                    <th className="py-4 px-6 text-right">Total Biaya</th>
                    <th className="py-4 px-6">Link Invoice</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-700 dark:text-slate-300">
                  {peripherals.map((p) => {
                    const statusObj = STATUS_OPTIONS.find(o => o.value === p.status) || STATUS_OPTIONS[0];

                    return (
                      <tr 
                        key={p.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-850/25 transition border-b border-gray-100 dark:border-slate-850/30"
                      >
                        <td className="py-4 px-6">
                          <div className="font-extrabold text-gray-900 dark:text-white text-xs">{p.name}</div>
                          <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                            {p.brand} {p.model || '-'} {p.serialNumber ? `| SN: ${p.serialNumber}` : ''}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[10px]">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-655 dark:text-slate-300 font-bold uppercase tracking-wider">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-gray-800 dark:text-slate-200">{p.company?.name || 'Shared / Cabang'}</div>
                          <div className="text-[10px] text-gray-400 font-semibold mt-0.5">{p.company?.location || '-'}</div>
                        </td>
                        <td className="py-4 px-6 font-bold text-gray-950 dark:text-slate-100">{p.quantity} Unit</td>
                        <td className="py-4 px-6 text-right text-slate-500">{formatRupiah(p.purchaseCost)}</td>
                        <td className="py-4 px-6 text-right font-extrabold text-gray-900 dark:text-white">{formatRupiah(p.totalCost)}</td>
                        <td className="py-4 px-6">
                          {p.peripheralInvoice ? (
                            <button
                              onClick={() => handleOpenEditModal(p.peripheralInvoice.id)}
                              className="text-rose-500 hover:text-rose-600 dark:text-rose-455 font-bold hover:underline text-left cursor-pointer"
                              title="Tampilkan data Invoice pembelian"
                            >
                              {p.peripheralInvoice.invoiceRef}
                            </button>
                          ) : (
                            <span className="text-gray-400 font-mono text-[10px]">{p.invoiceRef || '-'}</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${statusObj.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`} />
                            {statusObj.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingAsset(p)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-blue-500 rounded-lg transition cursor-pointer"
                              title="Lihat Detail & Riwayat (Journey)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {p.peripheralInvoiceId && (
                              <button
                                onClick={() => handleOpenEditModal(p.peripheralInvoiceId)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-rose-500 rounded-lg transition"
                                title="Edit Detail Invoice (Peralatan)"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteSingleItem(p)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-red-500 rounded-lg transition"
                              title="Hapus Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
        )
      ) : (
        /* ==================== TAB 3: COST ANALYSIS ==================== */
        !analysisLoaded && !loading ? (
          <PendingProcessPlaceholder
            title="Proses Analisa Biaya"
            description={'Klik tombol "Proses / Muat Data" di atas untuk menampilkan analisa biaya pembelian periferal.'}
          />
        ) : !analysisLoaded ? (
          <div className="glass-panel rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            <span className="text-xs text-gray-500 font-semibold">Memuat Analisa Biaya...</span>
          </div>
        ) : (
        <div className="space-y-6">
          {/* Analysis KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* average cost per invoice */}
            <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 hover:shadow-md transition">
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Rata-rata Biaya Invoice</p>
              <h3 className="text-lg font-black text-rose-500 mt-1 truncate">
                {formatRupiah(stats.totalInvoices > 0 ? Math.round(stats.totalInvoiceBudget / stats.totalInvoices) : 0)}
              </h3>
              <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-1">
                Total dari {stats.totalInvoices || 0} invoice terdaftar
              </p>
            </div>

            {/* most expensive category */}
            <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 hover:shadow-md transition">
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Kategori Pengeluaran Terbesar</p>
              <h3 className="text-lg font-black text-gray-800 dark:text-slate-100 mt-1 truncate">
                {analysisData.expensesByCategory?.[0]?.name || '-'}
              </h3>
              <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-1">
                Total: <span className="font-bold text-rose-500">{formatRupiah(analysisData.expensesByCategory?.[0]?.totalCost || 0)}</span>
              </p>
            </div>

            {/* top spending company */}
            <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 hover:shadow-md transition">
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Entitas Pembayar Terbesar</p>
              <h3 className="text-lg font-black text-gray-800 dark:text-slate-100 mt-1 truncate">
                {analysisData.expensesByCompany?.[0]?.name || '-'}
              </h3>
              <p className="text-[9px] text-gray-455 dark:text-slate-500 font-semibold mt-1">
                Total: <span className="font-bold text-rose-500">{formatRupiah(analysisData.expensesByCompany?.[0]?.totalCost || 0)}</span>
              </p>
            </div>

            {/* top supplier */}
            <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 hover:shadow-md transition">
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Supplier/Vendor Terbesar</p>
              <h3 className="text-lg font-black text-gray-800 dark:text-slate-100 mt-1 truncate">
                {analysisData.expensesBySupplier?.[0]?.name || '-'}
              </h3>
              <p className="text-[9px] text-gray-455 dark:text-slate-500 font-semibold mt-1">
                Total: <span className="font-bold text-rose-500">{formatRupiah(analysisData.expensesBySupplier?.[0]?.totalCost || 0)}</span>
              </p>
            </div>
          </div>

          {/* Monthly Trend Chart */}
          {analysisData.monthlyTrend && analysisData.monthlyTrend.length > 0 ? (
            <div className="flex flex-col items-stretch bg-white/80 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-rose-500" />
                  <span>Tren Pengeluaran Bulanan</span>
                </h3>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Hover batang untuk rincian detail
                </span>
              </div>

              {/* Chart container */}
              <div className="relative h-64 flex items-end justify-between gap-2 pt-6 border-b border-gray-200 dark:border-slate-800 pb-1">
                {analysisData.monthlyTrend.map((item) => {
                  const maxCost = analysisData.monthlyTrend.reduce((max, x) => Math.max(max, x.totalCost), 0) || 1;
                  const heightPct = (item.totalCost / maxCost) * 90; // scale to 90% max height
                  
                  const [yr, mo] = item.yearMonth.split('-');
                  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
                  const formattedLabel = `${monthNames[parseInt(mo, 10) - 1]} ${yr.slice(2)}`;

                  return (
                    <div key={item.yearMonth} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                      {/* Tooltip Card */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-955 text-white dark:bg-white dark:text-slate-955 p-3 rounded-xl shadow-xl border border-slate-800 dark:border-gray-200 text-[10px] space-y-1 z-30 w-44 font-semibold -translate-x-1/2 left-1/2 animate-fade-in pointer-events-none">
                        <div className="font-extrabold border-b border-slate-800 dark:border-gray-150 pb-1 text-center text-xs text-rose-500">
                          {formattedLabel}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-400 dark:text-gray-500">Total Pengeluaran:</span>
                          <span className="font-bold">{formatRupiah(item.totalCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 dark:text-gray-500">Biaya Jasa/Instalasi:</span>
                          <span className="font-bold text-amber-500">{formatRupiah(item.serviceCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 dark:text-gray-500">Jumlah Unit Beli:</span>
                          <span className="font-bold text-blue-500">{item.quantity} Unit</span>
                        </div>
                      </div>

                      {/* Visual Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-t-lg h-48 flex items-end overflow-hidden">
                        <div 
                          className="w-full bg-gradient-to-t from-rose-600 to-rose-400 hover:from-rose-500 hover:to-rose-300 rounded-t-lg transition-all duration-300 shadow-lg group-hover:shadow-rose-500/20"
                          style={{ height: `${Math.max(heightPct, 4)}%` }}
                        />
                      </div>

                      {/* Label */}
                      <span className="text-[10px] font-bold text-gray-450 dark:text-slate-500 mt-2 block whitespace-nowrap">
                        {formattedLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/55 dark:border-slate-800/40 text-center text-xs text-gray-450 font-semibold italic">
              Belum ada data tren bulanan yang tercatat.
            </div>
          )}

          {/* Grid for breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. Category Breakdown */}
            <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 space-y-4">
              <h3 className="font-bold text-xs text-gray-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-slate-800">
                <Tag className="w-4 h-4 text-rose-500" />
                <span>Pengeluaran per Kategori</span>
              </h3>
              
              {analysisData.expensesByCategory && analysisData.expensesByCategory.length > 0 ? (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {(() => {
                    const totalCategoryCost = analysisData.expensesByCategory.reduce((sum, item) => sum + item.totalCost, 0) || 1;
                    return analysisData.expensesByCategory.map((item) => {
                      const pct = (item.totalCost / totalCategoryCost) * 100;
                      return (
                        <div key={item.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-gray-700 dark:text-slate-200">{item.name} ({item.quantity} Unit)</span>
                            <span className="text-gray-900 dark:text-white font-extrabold">{formatRupiah(item.totalCost)}</span>
                          </div>
                          <div className="w-full bg-gray-150 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <p className="text-center text-xs text-gray-455 italic py-6">Tidak ada data kategori.</p>
              )}
            </div>

            {/* 2. Company Breakdown */}
            <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 space-y-4">
              <h3 className="font-bold text-xs text-gray-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-slate-800">
                <Building2 className="w-4 h-4 text-rose-500" />
                <span>Pengeluaran per Entitas</span>
              </h3>
              
              {analysisData.expensesByCompany && analysisData.expensesByCompany.length > 0 ? (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {(() => {
                    const totalCompanyCost = analysisData.expensesByCompany.reduce((sum, item) => sum + item.totalCost, 0) || 1;
                    return analysisData.expensesByCompany.map((item) => {
                      const pct = (item.totalCost / totalCompanyCost) * 100;
                      return (
                        <div key={item.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-gray-700 dark:text-slate-200">{item.name} ({item.invoicesCount} Invoice)</span>
                            <span className="text-gray-900 dark:text-white font-extrabold">{formatRupiah(item.totalCost)}</span>
                          </div>
                          <div className="w-full bg-gray-150 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <p className="text-center text-xs text-gray-455 italic py-6">Tidak ada data entitas.</p>
              )}
            </div>

            {/* 3. Supplier Breakdown */}
            <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 space-y-4">
              <h3 className="font-bold text-xs text-gray-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-slate-800">
                <Receipt className="w-4 h-4 text-rose-500" />
                <span>Pengeluaran per Supplier</span>
              </h3>
              
              {analysisData.expensesBySupplier && analysisData.expensesBySupplier.length > 0 ? (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {(() => {
                    const totalSupplierCost = analysisData.expensesBySupplier.reduce((sum, item) => sum + item.totalCost, 0) || 1;
                    return analysisData.expensesBySupplier.map((item) => {
                      const pct = (item.totalCost / totalSupplierCost) * 100;
                      return (
                        <div key={item.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-gray-700 dark:text-slate-200">{item.name} ({item.invoicesCount} Invoice)</span>
                            <span className="text-gray-900 dark:text-white font-extrabold">{formatRupiah(item.totalCost)}</span>
                          </div>
                          <div className="w-full bg-gray-150 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <p className="text-center text-xs text-gray-455 italic py-6">Tidak ada data supplier.</p>
              )}
            </div>

          </div>
        </div>
        )
      )}

      {/* CRUD Form Modal (Side Drawer) */}
      {isModalOpen && createPortal((
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-slate-955/60 backdrop-blur-sm transition-opacity cursor-pointer animate-fade-in"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-7xl lg:max-w-[90vw] bg-white dark:bg-slate-900 border-l border-gray-150 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-slide-left overflow-hidden">
              
              {/* Header */}
              <div className="flex justify-between items-center p-5 border-b border-gray-150 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {isEditMode ? 'Perbarui Transaksi Invoice Periferal' : 'Daftarkan Transaksi Pembelian Periferal'}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5 font-outfit">
                      Catat aset pendukung IT non-karyawan lengkap dengan kuantitas, harga unit, garansi, serta nota invoice.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 space-y-6 overflow-y-auto flex-1 font-semibold text-xs">
                  
                  {formError && (
                    <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800 text-red-755 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Section 1: Invoice Metadata Header */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                      <FileText className="w-3.5 h-3.5 text-rose-500" />
                      1. Detail Ringkasan Invoice & Vendor
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      
                      {/* Invoice Ref */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Nomor Nota / Invoice *</label>
                        <input
                          type="text"
                          value={formInvoiceRef}
                          onChange={(e) => setFormInvoiceRef(e.target.value)}
                          placeholder="e.g. INV-1002348"
                          required
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition font-mono"
                        />
                      </div>

                      {/* PO Ref */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Nomor PO (Purchase Order)</label>
                        <input
                          type="text"
                          value={formPoRef}
                          onChange={(e) => setFormPoRef(e.target.value)}
                          placeholder="e.g. PO-MRA-2026-004"
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition font-mono"
                        />
                      </div>

                      {/* Supplier */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Supplier / Toko Penjual *</label>
                        <input
                          type="text"
                          value={formSupplier}
                          onChange={(e) => setFormSupplier(e.target.value)}
                          placeholder="e.g. PT Vendor Jaya"
                          required
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                        />
                      </div>

                      {/* Purchase Date */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Tanggal Invoice *</label>
                        <input
                          type="date"
                          value={formPurchaseDate}
                          onChange={(e) => setFormPurchaseDate(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                        />
                      </div>

                      {/* Master Company Cost Center */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Entitas Pembayar (Cost Center) *</label>
                        <select
                          value={formCompanyMasterId}
                          onChange={(e) => setFormCompanyMasterId(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                        >
                          <option value="">Pilih Perusahaan Induk</option>
                          {companyMasters.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Notes / Remarks */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Catatan Invoice</label>
                        <input
                          type="text"
                          value={formNotes}
                          onChange={(e) => setFormNotes(e.target.value)}
                          placeholder="e.g. Pembelian CCTV untuk operasional pos sekuriti"
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                        />
                      </div>

                      {/* File Link / Bukti Fisik Attachment */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Link Bukti Fisik / Attachment Invoice (Optional)</label>
                        <input
                          type="text"
                          value={formFileLink}
                          onChange={(e) => setFormFileLink(e.target.value)}
                          placeholder="e.g. https://drive.google.com/drive/folders/... atau link berkas"
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                        />
                      </div>

                    </div>
                  </div>

                  {/* Section 2: Non-Inventory Costs (Service, Delivery, Tax) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-2">
                      <DollarSign className="w-3.5 h-3.5 text-rose-500" />
                      2. Biaya Tambahan Jasa & Pengiriman (Expense Non-Inventory)
                    </h4>

                    {/* Service / Labor Cost (multiple rows allowed, e.g. instalasi + setting + training) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Biaya Jasa / Instalasi (Rp)</label>
                        <button
                          type="button"
                          onClick={handleAddServiceRow}
                          className="flex items-center gap-1 px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] rounded-lg shadow-sm transition"
                        >
                          <Plus className="w-3 h-3" />
                          Tambah Jasa
                        </button>
                      </div>

                      {formServiceItems.length === 0 ? (
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 italic py-1">Tidak ada biaya jasa pada invoice ini.</p>
                      ) : (
                        <div className="space-y-2">
                          {formServiceItems.map((svc, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={svc.description}
                                onChange={(e) => handleUpdateServiceField(index, 'description', e.target.value)}
                                placeholder="e.g. Jasa Instalasi CCTV"
                                className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                              />
                              <div className="relative w-44 shrink-0">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400">Rp</span>
                                <input
                                  type="text"
                                  value={svc.cost}
                                  onChange={(e) => handleServiceCostChange(index, e.target.value)}
                                  placeholder="0"
                                  className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveServiceRow(index)}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-lg transition shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* Delivery Cost */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Ongkos Kirim (Rp)</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400">Rp</span>
                          <input
                            type="text"
                            value={formDeliveryCost}
                            onChange={(e) => setFormDeliveryCost(formatCostDigits(e.target.value))}
                            placeholder="0"
                            className="w-full pl-9 pr-4 py-2 text-xs font-bold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                          />
                        </div>
                      </div>

                      {/* Tax Cost */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">Pajak / PPN / PPh (Rp)</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400">Rp</span>
                          <input
                            type="text"
                            value={formTaxCost}
                            onChange={(e) => setFormTaxCost(formatCostDigits(e.target.value))}
                            placeholder="0"
                            className="w-full pl-9 pr-4 py-2 text-xs font-bold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Section 3: Physical Items Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                      <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-rose-500" />
                        3. Daftar Barang Fisik Periferal (Inventory Stock)
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddItemRow}
                        className="flex items-center gap-1 px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] rounded-lg shadow-sm transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Baris Item
                      </button>
                    </div>

                    {/* Table of items */}
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-950/20">
                      <table className="w-full text-left text-xs min-w-[1000px]">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 text-[10px] font-black uppercase text-gray-450 tracking-wider">
                            <th className="py-2.5 px-4 w-8 text-center">No</th>
                            <th className="py-2.5 px-4 w-48">Nama Barang *</th>
                            <th className="py-2.5 px-4 w-32">Kategori *</th>
                            <th className="py-2.5 px-4 w-32">Brand / Model</th>
                            <th className="py-2.5 px-4 w-32">Serial Number</th>
                            <th className="py-2.5 px-4 w-32 text-right">Harga Unit (Rp) *</th>
                            <th className="py-2.5 px-4 w-16 text-center">Qty *</th>
                            <th className="py-2.5 px-4 w-28 text-center">Status *</th>
                            <th className="py-2.5 px-4 w-40">Lokasi Penempatan</th>
                            <th className="py-2.5 px-4 w-12 text-center">Hapus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150 dark:divide-slate-850/50">
                          {formItems.map((item, index) => (
                            <tr key={index} className="bg-white dark:bg-slate-900/60 hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                              
                              {/* Row Number */}
                              <td className="py-2.5 px-4 text-center font-bold text-gray-400">{index + 1}</td>
                              
                              {/* Item Name */}
                              <td className="py-2.5 px-4">
                                <input
                                  type="text"
                                  required
                                  value={item.name}
                                  onChange={(e) => handleUpdateItemField(index, 'name', e.target.value)}
                                  placeholder="e.g. CCTV Dome 4MP"
                                  className="w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-gray-50/70 dark:bg-slate-950/40 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                                />
                              </td>

                              {/* Category */}
                              <td className="py-2.5 px-4">
                                <select
                                  required
                                  value={item.category}
                                  onChange={(e) => handleUpdateItemField(index, 'category', e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-gray-50/70 dark:bg-slate-950/40 border border-gray-250 dark:border-slate-800/80 text-gray-755 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                                >
                                  <option value="">Pilih Kategori</option>
                                  {allFormCategories.filter(c => c !== '__NEW__').map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </td>

                              {/* Brand / Model */}
                              <td className="py-2.5 px-4 space-y-1">
                                <input
                                  type="text"
                                  required
                                  value={item.brand}
                                  onChange={(e) => handleUpdateItemField(index, 'brand', e.target.value)}
                                  placeholder="Brand (e.g. Dell)"
                                  className="w-full px-2 py-1 text-xs font-semibold rounded-lg bg-gray-50/70 dark:bg-slate-955/40 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                                />
                                <input
                                  type="text"
                                  value={item.model}
                                  onChange={(e) => handleUpdateItemField(index, 'model', e.target.value)}
                                  placeholder="Model (e.g. L14)"
                                  className="w-full px-2 py-1 text-xs font-semibold rounded-lg bg-gray-50/70 dark:bg-slate-955/40 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                                />
                              </td>

                              {/* Serial Number */}
                              <td className="py-2.5 px-4">
                                <input
                                  type="text"
                                  value={item.serialNumber}
                                  onChange={(e) => handleUpdateItemField(index, 'serialNumber', e.target.value)}
                                  placeholder="S/N / Range"
                                  className="w-full px-2 py-1.5 text-xs font-mono rounded-lg bg-gray-50/70 dark:bg-slate-955/40 border border-gray-250 dark:border-slate-855/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                                />
                              </td>

                              {/* Cost per Unit */}
                              <td className="py-2.5 px-4">
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">Rp</span>
                                  <input
                                    type="text"
                                    required
                                    value={item.purchaseCost}
                                    onChange={(e) => handleItemPriceChange(index, e.target.value)}
                                    placeholder="500.000"
                                    className="w-full pl-6 pr-2 py-1.5 text-xs font-bold rounded-lg bg-gray-50/70 dark:bg-slate-955/40 border border-gray-250 dark:border-slate-855/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition text-right"
                                  />
                                </div>
                              </td>

                              {/* Quantity */}
                              <td className="py-2.5 px-4 text-center">
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItemField(index, 'quantity', e.target.value)}
                                  className="w-full px-1.5 py-1.5 text-xs font-bold rounded-lg bg-gray-50/70 dark:bg-slate-955/40 border border-gray-250 dark:border-slate-855/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 text-center"
                                />
                              </td>

                              {/* Status */}
                              <td className="py-2.5 px-4">
                                <select
                                  required
                                  value={item.status}
                                  onChange={(e) => handleUpdateItemField(index, 'status', e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs font-bold rounded-lg bg-gray-50/70 dark:bg-slate-955/40 border border-gray-250 dark:border-slate-805/85 text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                                >
                                  {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </td>

                              {/* Location Company */}
                              <td className="py-2.5 px-4">
                                <select
                                  value={item.companyId}
                                  onChange={(e) => handleUpdateItemField(index, 'companyId', e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-gray-50/70 dark:bg-slate-955/40 border border-gray-200 dark:border-slate-805/85 text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                                >
                                  <option value="">Pilih Kantor Cabang</option>
                                  {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.location})</option>
                                  ))}
                                </select>
                              </td>

                              {/* Action Delete */}
                              <td className="py-2.5 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemRow(index)}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-lg transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* Footer Dynamic Total HUD and Submit buttons */}
                <div className="flex flex-col md:flex-row justify-between items-center p-5 border-t border-gray-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 gap-4">
                  {/* Dynamic Total Price HUD */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Estimasi Total Pengeluaran:</span>
                    <span className="text-base font-black text-rose-500 dark:text-rose-455 font-outfit">
                      {formatRupiah(calculateTotalInvoiceCost())}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2.5 border border-gray-250 dark:border-slate-855 hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-655 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-500/10 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>{isEditMode ? 'Simpan Perubahan' : 'Daftarkan Invoice'}</span>
                    </button>
                  </div>
                </div>

              </form>

            </div>
          </div>
      ), document.body)}

      {/* Drawer Detail & Timeline (Journey) Aset Periferal */}
      {viewingAsset && createPortal((
        <div className="fixed inset-0 z-[999] flex justify-end">
          {/* Overlay */}
          <div 
            onClick={() => setViewingAsset(null)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col animate-slide-in">
            {/* Header */}
            <div className="p-5 border-b border-gray-150 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-955/20">
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider font-outfit">
                  Detail & Timeline Periferal
                </h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                  ID: {viewingAsset.id}
                </p>
              </div>
              <button
                onClick={() => setViewingAsset(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-450 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Specification Card */}
              <div className="p-5 rounded-2xl border border-gray-150 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-150 dark:border-slate-800 pb-3">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900 dark:text-white">{viewingAsset.name}</h4>
                    <span className="text-[9px] font-extrabold uppercase bg-gray-100 dark:bg-slate-800 text-gray-500 px-2 py-0.5 rounded mt-1 inline-block">
                      {viewingAsset.category}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Brand</span>
                    <span className="font-bold text-gray-800 dark:text-slate-200 mt-0.5 block">{viewingAsset.brand}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Model / Tipe</span>
                    <span className="font-bold text-gray-800 dark:text-slate-200 mt-0.5 block">{viewingAsset.model || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Serial Number (S/N)</span>
                    <span className="font-mono text-gray-850 dark:text-slate-200 mt-0.5 block break-all">{viewingAsset.serialNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Kuantitas</span>
                    <span className="font-bold text-gray-850 dark:text-slate-200 mt-0.5 block">{viewingAsset.quantity} Unit</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Status Saat Ini</span>
                    <span className="mt-1 block">
                      {(() => {
                        const statusObj = STATUS_OPTIONS.find(o => o.value === viewingAsset.status) || STATUS_OPTIONS[0];
                        return (
                          <span className={`inline-flex items-center gap-1.5 text-[8px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${statusObj.color}`}>
                            <span className={`w-1 h-1 rounded-full ${statusObj.dot}`} />
                            {statusObj.label}
                          </span>
                        );
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Lokasi Cabang</span>
                    <span className="font-bold text-gray-805 dark:text-slate-200 mt-0.5 block">
                      {viewingAsset.company?.name || 'STOCK (Gudang IT MRA)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Entitas Pembayar</span>
                    <span className="font-bold text-gray-805 dark:text-slate-200 mt-0.5 block">
                      {companyMasters.find(c => c.id === viewingAsset.companyMasterId)?.name || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Harga Unit</span>
                    <span className="font-bold text-gray-850 dark:text-slate-200 mt-0.5 block">{formatRupiah(viewingAsset.purchaseCost)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Total Harga Pembelian</span>
                    <span className="font-bold text-rose-500 dark:text-rose-455 mt-0.5 block">{formatRupiah(viewingAsset.totalCost)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">No. Invoice Ref</span>
                    <span className="font-bold text-gray-850 dark:text-slate-200 mt-0.5 block">{viewingAsset.invoiceRef || '-'}</span>
                  </div>
                  {viewingAsset.notes && (
                    <div className="col-span-2">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Catatan Tambahan</span>
                      <span className="font-semibold text-gray-700 dark:text-slate-350 mt-0.5 block">{viewingAsset.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Journey Logs */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-150 dark:border-slate-800 pb-2">
                  <Clock className="w-4 h-4 text-rose-500" />
                  Riwayat & Pergerakan Aset (Journey)
                </h4>
                
                {(!viewingAsset.journey || !viewingAsset.journey.trim()) ? (
                  <div className="p-8 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-xs text-gray-400 font-semibold italic">
                    Belum ada riwayat tercatat untuk perangkat periferal ini.
                  </div>
                ) : (
                  <div className="relative border-l border-gray-200 dark:border-slate-800 ml-3 pl-5 space-y-6 py-2">
                    {viewingAsset.journey.split('\n').filter(Boolean).map((line, idx) => (
                      <div key={idx} className="relative">
                        {/* Timeline Bullet */}
                        <div className="absolute -left-[26px] top-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white dark:border-slate-900 shadow-sm" />
                        <p className="text-xs font-semibold text-gray-700 dark:text-slate-350 leading-relaxed font-mono">
                          {line}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-150 dark:border-slate-800 flex justify-end bg-gray-50/30 dark:bg-slate-955/10">
              <button
                type="button"
                onClick={() => setViewingAsset(null)}
                className="px-4 py-2 border border-gray-250 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      ), document.body)}

    </div>
  );
}

// Subcomponent to fetch and render invoice items inside expanded row on demand
function InvoiceItemsSubtable({ invoiceId, token, formatRupiah, statusOptions, onDeleteItem, onViewItem, user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch(`${API_URL}/peripherals/invoices/${invoiceId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch (err) {
        console.error("Gagal memuat barang invoice:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [invoiceId, token]);

  if (loading) {
    return (
      <tr>
        <td colSpan="9" className="py-4 text-center text-xs text-gray-400 font-semibold italic">
          Memuat daftar barang...
        </td>
      </tr>
    );
  }

  if (items.length === 0) {
    return (
      <tr>
        <td colSpan="9" className="py-4 text-center text-xs text-gray-400 font-semibold italic">
          Tidak ada barang fisik terdaftar.
        </td>
      </tr>
    );
  }

  return (
    <>
      {items.map((item) => {
        const statusObj = statusOptions.find(o => o.value === item.status) || statusOptions[0];
        return (
          <tr key={item.id} className="border-b border-gray-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
            <td className="py-2.5 px-4 font-bold text-gray-900 dark:text-white">{item.name}</td>
            <td className="py-2.5 px-4">
              <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-[9px] uppercase tracking-wider text-gray-500">
                {item.category}
              </span>
            </td>
            <td className="py-2.5 px-4 text-gray-600 dark:text-slate-400">{item.brand} {item.model || '-'}</td>
            <td className="py-2.5 px-4 font-mono text-gray-505">{item.serialNumber || '-'}</td>
            <td className="py-2.5 px-4 text-center font-bold">{item.quantity} Unit</td>
            <td className="py-2.5 px-4 text-right text-slate-500">{formatRupiah(item.purchaseCost)}</td>
            <td className="py-2.5 px-4 text-right font-bold text-gray-900 dark:text-white">{formatRupiah(item.totalCost)}</td>
            <td className="py-2.5 px-4 text-center">
              <span className={`inline-flex items-center gap-1 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusObj.color}`}>
                {statusObj.label}
              </span>
            </td>
            <td className="py-2.5 px-4 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => onViewItem(item)}
                  className="p-1 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-500 rounded text-gray-400 transition"
                  title="Lihat Detail & Riwayat (Journey)"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {user.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/25 hover:text-red-500 rounded text-gray-400 transition"
                    title="Hapus Barang"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}

// Idle/searching radar animation shown in a tab before "Proses / Muat Data" has been clicked
function SearchingRadarAnimation() {
  return (
    <div className="relative w-44 h-44 flex items-center justify-center select-none pointer-events-none mb-3">
      {/* Background Pulse Rings */}
      <motion.div
        className="absolute w-32 h-32 rounded-full border border-rose-500/20 dark:border-rose-400/10 bg-rose-500/5 dark:bg-rose-400/5"
        animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-40 h-40 rounded-full border border-amber-500/15 dark:border-amber-400/5"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Rotating Radar Sweep Ring */}
      <motion.div
        className="absolute w-36 h-36 rounded-full border border-dashed border-rose-500/30 dark:border-rose-400/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Rotating sweep gradient */}
      <div className="absolute w-36 h-36 overflow-hidden rounded-full pointer-events-none z-10">
        <motion.div
          className="w-full h-full bg-gradient-to-tr from-transparent via-transparent to-rose-500/10 origin-center"
          style={{ transformOrigin: '50% 50%' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Animated Floating Nodes */}
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-rose-500 top-10 left-14 shadow-lg shadow-rose-500/50"
        animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <motion.div
        className="absolute w-1.5 h-1.5 rounded-full bg-amber-500 bottom-14 right-10 shadow-lg shadow-amber-500/50"
        animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
      <motion.div
        className="absolute w-1.5 h-1.5 rounded-full bg-emerald-500 top-16 right-14 shadow-lg shadow-emerald-500/50"
        animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      />

      {/* Center Icon: floating Package outline */}
      <motion.div
        className="relative z-20 w-14 h-14 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-900/5 dark:shadow-black/40"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          className="w-7 h-7 text-rose-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
          <motion.polyline
            points="3.27 6.96 12 12.01 20.73 6.96"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.3 }}
          />
          <motion.line
            x1="12"
            y1="22.08"
            x2="12"
            y2="12"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.6 }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

// Wrapper card for the "not yet loaded" placeholder shown before "Proses / Muat Data" is clicked
function PendingProcessPlaceholder({ title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative bg-white/60 dark:bg-slate-900/55 border border-gray-250/60 dark:border-slate-800/50 rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[380px] overflow-hidden"
    >
      {/* Floating abstract backdrop blur circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
        <motion.div
          className="absolute w-40 h-40 rounded-full bg-rose-500/5 -top-12 -left-12 blur-2xl"
          animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-44 h-44 rounded-full bg-amber-500/5 -bottom-16 -right-16 blur-2xl"
          animate={{ x: [0, -20, 0], y: [0, -15, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <SearchingRadarAnimation />

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-sm font-black text-gray-800 dark:text-white relative z-10"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.4 }}
        className="text-gray-500 dark:text-slate-400 text-xs max-w-sm mt-3 leading-relaxed relative z-10"
      >
        {description}
      </motion.p>
    </motion.div>
  );
}
