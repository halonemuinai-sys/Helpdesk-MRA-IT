import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { DEFAULT_CATEGORIES } from '../components/peripherals/constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EMPTY_SERVICE_ROW = () => ({
  description: '', cost: '', isSubscription: false,
  category: 'Subscription', billingCycle: '1 Tahun', subscriptionId: null,
});

const EMPTY_ITEM_ROW = () => ({
  name: '', category: '', brand: '', model: '',
  serialNumber: '', purchaseCost: '', quantity: '1',
  status: 'STOCK', companyId: '',
});

export default function usePeripherals({ token, user }) {
  // ── Tab & data ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('invoices');
  const [peripherals, setPeripherals] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyMasters, setCompanyMasters] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [viewingAsset, setViewingAsset] = useState(null);
  const [analysisData, setAnalysisData] = useState({
    expensesByCategory: [], expensesByCompany: [],
    expensesBySupplier: [], monthlyTrend: [],
  });
  const [stats, setStats] = useState({
    totalCount: 0, totalQuantity: 0, totalBudget: 0,
    stockQuantity: 0, inUseQuantity: 0, damagedQuantity: 0,
    categories: [], totalInvoices: 0, totalInvoiceBudget: 0, totalServiceBudget: 0,
  });

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCompanyMasterId, setSelectedCompanyMasterId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // ── Load flags (manual-load pattern) ────────────────────────────────────────
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [analysisLoaded, setAnalysisLoaded] = useState(false);

  // ── UI ──────────────────────────────────────────────────────────────────────
  const [expandedRows, setExpandedRows] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // ── Form: invoice header ─────────────────────────────────────────────────────
  const [formId, setFormId] = useState('');
  const [formInvoiceRef, setFormInvoiceRef] = useState('');
  const [formPoRef, setFormPoRef] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCompanyMasterId, setFormCompanyMasterId] = useState('');
  const [formFileLink, setFormFileLink] = useState('');

  // ── Form: costs ──────────────────────────────────────────────────────────────
  const [formServiceItems, setFormServiceItems] = useState([EMPTY_SERVICE_ROW()]);
  const [formDeliveryCost, setFormDeliveryCost] = useState('');
  const [formTaxCost, setFormTaxCost] = useState('');

  // ── Form: item rows ──────────────────────────────────────────────────────────
  const [formItems, setFormItems] = useState([EMPTY_ITEM_ROW()]);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const activeCategories = dbCategories.length > 0 ? dbCategories.map(c => c.name) : DEFAULT_CATEGORIES;
  const allFormCategories = Array.from(new Set([...activeCategories, ...stats.categories]));

  // ── Formatters ───────────────────────────────────────────────────────────────
  const formatRupiah = (value) => {
    if (value === undefined || value === null) return 'Rp 0';
    return 'Rp ' + Number(value).toLocaleString('id-ID');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return '-';
    }
  };

  const formatCostDigits = (val) => {
    const raw = val.toString().replace(/\D/g, '');
    if (!raw) return '';
    return parseInt(raw, 10).toLocaleString('id-ID');
  };

  // ── Initial data (non-blocking, meta only) ───────────────────────────────────
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };

      await Promise.allSettled([
        fetch(`${API_URL}/companies/master`, { headers })
          .then(r => r.ok && r.json()).then(d => d && setCompanyMasters(d)),
        fetch(`${API_URL}/companies`, { headers })
          .then(r => r.ok && r.json()).then(d => d && setCompanies(d)),
        fetch(`${API_URL}/peripherals/categories`, { headers })
          .then(r => r.ok && r.json()).then(d => d && setDbCategories(d)),
        fetch(`${API_URL}/peripherals/stats`, { headers })
          .then(r => r.ok && r.json()).then(d => d && setStats(d)),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/peripherals/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error('Gagal memuat statistik KPI periferal:', err);
    }
  };

  // ── Tab data fetchers ────────────────────────────────────────────────────────
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedCompanyMasterId) params.append('companyMasterId', selectedCompanyMasterId);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      const qs = params.toString() ? `?${params}` : '';
      const res = await fetch(`${API_URL}/peripherals/invoices${qs}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal memuat data invoice.');
      setInvoices(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setInvoicesLoaded(true);
    }
  };

  const fetchPeripherals = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedCompanyMasterId) params.append('companyMasterId', selectedCompanyMasterId);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedCategory) params.append('category', selectedCategory);
      const qs = params.toString() ? `?${params}` : '';
      const res = await fetch(`${API_URL}/peripherals${qs}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal memuat data individual periferal.');
      setPeripherals(await res.json());
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
      const res = await fetch(`${API_URL}/peripherals/analysis`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal memuat analisa biaya.');
      setAnalysisData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setAnalysisLoaded(true);
    }
  };

  const handleRefreshData = async () => {
    await fetchStats();
    if (activeTab === 'invoices') await fetchInvoices();
    else if (activeTab === 'items') await fetchPeripherals();
    else if (activeTab === 'analysis') await fetchAnalysis();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedCompanyMasterId('');
    setSelectedCategory('');
  };

  // ── Export ───────────────────────────────────────────────────────────────────
  const escapeXml = (str) => {
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const [invRes, assetRes] = await Promise.all([
        fetch(`${API_URL}/peripherals/invoices?limit=100000`, { headers }),
        fetch(`${API_URL}/peripherals?limit=100000`, { headers }),
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
  <Style ss:ID="Default"><Font ss:FontName="Segoe UI" x:CharSet="1" ss:Size="10" ss:Color="#374151"/></Style>
  <Style ss:ID="Title"><Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#1E293B"/><Alignment ss:Horizontal="Left" ss:Vertical="Center"/></Style>
  <Style ss:ID="Header"><Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#E11D48" ss:Pattern="Solid"/></Style>
  <Style ss:ID="TableHeaderRow"><Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/><Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#475569"/></Style>
  <Style ss:ID="Currency"><NumberFormat ss:Format="&quot;Rp&quot;\\ #,##0"/></Style>
  <Style ss:ID="BoldCurrency"><Font ss:Bold="1"/><NumberFormat ss:Format="&quot;Rp&quot;\\ #,##0"/></Style>
 </Styles>
`;

      // Sheet 1: Invoices
      xml += ` <Worksheet ss:Name="Ringkasan Invoice">
  <Table ss:DefaultColumnWidth="100" ss:DefaultRowHeight="20">
   <Column ss:Width="120"/><Column ss:Width="120"/><Column ss:Width="150"/>
   <Column ss:Width="95"/><Column ss:Width="180"/><Column ss:Width="70"/>
   <Column ss:Width="100"/><Column ss:Width="100"/><Column ss:Width="100"/>
   <Column ss:Width="110"/><Column ss:Width="200"/>
   <Row ss:Height="25"><Cell ss:MergeAcross="10" ss:StyleID="Title"><Data ss:Type="String">LAPORAN BIAYA PEMBELIAN IT PERIPHERALS</Data></Cell></Row>
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
      let totInv = 0, totSvc = 0, totDel = 0, totTax = 0, totQty = 0;
      exportInvoices.forEach(inv => {
        totInv += inv.totalCost || 0; totSvc += inv.serviceCost || 0;
        totDel += inv.deliveryCost || 0; totTax += inv.taxCost || 0;
        totQty += inv._count?.items || 0;
        xml += `   <Row>
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
      xml += `   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">TOTAL KESELURUHAN</Data></Cell>
    <Cell/><Cell/><Cell/><Cell/>
    <Cell><Data ss:Type="Number">${totQty}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${totSvc}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${totDel}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${totTax}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${totInv}</Data></Cell>
    <Cell/>
   </Row>
  </Table>
 </Worksheet>
`;

      // Sheet 2: Assets
      xml += ` <Worksheet ss:Name="Daftar Aset Fisik">
  <Table ss:DefaultColumnWidth="100" ss:DefaultRowHeight="20">
   <Column ss:Width="180"/><Column ss:Width="100"/><Column ss:Width="100"/>
   <Column ss:Width="100"/><Column ss:Width="120"/><Column ss:Width="60"/>
   <Column ss:Width="100"/><Column ss:Width="110"/><Column ss:Width="180"/>
   <Column ss:Width="180"/><Column ss:Width="110"/><Column ss:Width="110"/>
   <Column ss:Width="150"/><Column ss:Width="95"/>
   <Row ss:Height="25"><Cell ss:MergeAcross="13" ss:StyleID="Title"><Data ss:Type="String">LAPORAN INVENTORI ASET FISIK IT PERIPHERALS</Data></Cell></Row>
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
      let totAQty = 0, totACost = 0;
      exportAssets.forEach(p => {
        totAQty += p.quantity || 0; totACost += p.totalCost || 0;
        xml += `   <Row>
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
    <Cell><Data ss:Type="String">${escapeXml(p.status)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.peripheralInvoice?.invoiceRef || p.invoiceRef || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.peripheralInvoice?.supplier || p.supplier || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(formatDate(p.peripheralInvoice?.purchaseDate || p.purchaseDate))}</Data></Cell>
   </Row>`;
      });
      xml += `   <Row ss:StyleID="TableHeaderRow">
    <Cell><Data ss:Type="String">TOTAL KESELURUHAN</Data></Cell>
    <Cell/><Cell/><Cell/><Cell/>
    <Cell><Data ss:Type="Number">${totAQty}</Data></Cell>
    <Cell/><Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${totACost}</Data></Cell>
    <Cell/><Cell/><Cell/><Cell/><Cell/><Cell/>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

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
      Swal.fire({ icon: 'error', title: 'Ekspor Gagal', text: err.message, confirmButtonColor: '#f43f5e' });
    } finally {
      setExporting(false);
    }
  };

  // ── Row expand ───────────────────────────────────────────────────────────────
  const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Item row handlers ────────────────────────────────────────────────────────
  const handleAddItemRow = () => setFormItems(prev => [...prev, EMPTY_ITEM_ROW()]);

  const handleRemoveItemRow = (index) => {
    if (formItems.length === 1) {
      Swal.fire({ icon: 'warning', title: 'Minimal 1 Item', text: 'Sebuah invoice wajib memiliki minimal 1 item barang periferal.', confirmButtonColor: '#f43f5e' });
      return;
    }
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemField = (index, field, value) =>
    setFormItems(prev => { const next = [...prev]; next[index][field] = value; return next; });

  const handleItemPriceChange = (index, val) =>
    handleUpdateItemField(index, 'purchaseCost', formatCostDigits(val));

  // ── Service row handlers ─────────────────────────────────────────────────────
  const handleAddServiceRow = () => setFormServiceItems(prev => [...prev, EMPTY_SERVICE_ROW()]);
  const handleRemoveServiceRow = (index) => setFormServiceItems(prev => prev.filter((_, i) => i !== index));

  const handleUpdateServiceField = (index, field, value) =>
    setFormServiceItems(prev => { const next = [...prev]; next[index][field] = value; return next; });

  const handleServiceCostChange = (index, val) =>
    handleUpdateServiceField(index, 'cost', formatCostDigits(val));

  // ── Total calculator ─────────────────────────────────────────────────────────
  const calculateTotalInvoiceCost = () => {
    const itemsCost = formItems.reduce((sum, item) => {
      return sum + (parseFloat(item.purchaseCost.toString().replace(/\./g, '')) || 0) * (parseInt(item.quantity) || 1);
    }, 0);
    const service = formServiceItems.reduce((sum, svc) => sum + (parseFloat(svc.cost.toString().replace(/\./g, '')) || 0), 0);
    const delivery = parseFloat(formDeliveryCost.toString().replace(/\./g, '')) || 0;
    const tax = parseFloat(formTaxCost.toString().replace(/\./g, '')) || 0;
    return itemsCost + service + delivery + tax;
  };

  // ── Modal open helpers ───────────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setFormId(''); setFormInvoiceRef(''); setFormPoRef(''); setFormSupplier('');
    setFormPurchaseDate(''); setFormNotes(''); setFormCompanyMasterId(''); setFormFileLink('');
    setFormServiceItems([EMPTY_SERVICE_ROW()]);
    setFormDeliveryCost(''); setFormTaxCost('');
    setFormItems([EMPTY_ITEM_ROW()]);
    setFormError(null); setIsEditMode(false); setIsModalOpen(true);
  };

  const handleOpenEditModal = async (invoiceId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/peripherals/invoices/${invoiceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal memuat detail invoice.');
      const invoice = await res.json();

      setFormId(invoice.id);
      setFormInvoiceRef(invoice.invoiceRef);
      setFormPoRef(invoice.poRef || '');
      setFormSupplier(invoice.supplier);
      setFormPurchaseDate(invoice.purchaseDate ? invoice.purchaseDate.split('T')[0] : '');
      setFormNotes(invoice.notes || '');
      setFormCompanyMasterId(invoice.companyMasterId ? invoice.companyMasterId.toString() : '');
      setFormFileLink(invoice.fileLink || '');
      setFormDeliveryCost(invoice.deliveryCost ? parseInt(invoice.deliveryCost, 10).toLocaleString('id-ID') : '');
      setFormTaxCost(invoice.taxCost ? parseInt(invoice.taxCost, 10).toLocaleString('id-ID') : '');

      if (Array.isArray(invoice.serviceCostBreakdown) && invoice.serviceCostBreakdown.length > 0) {
        setFormServiceItems(invoice.serviceCostBreakdown.map(svc => ({
          description: svc.description || '',
          cost: svc.cost ? parseInt(svc.cost, 10).toLocaleString('id-ID') : '',
          isSubscription: !!svc.subscriptionId,
          category: svc.category || 'Subscription',
          billingCycle: svc.billingCycle || '1 Tahun',
          subscriptionId: svc.subscriptionId || null,
        })));
      } else if (invoice.serviceCost) {
        setFormServiceItems([{
          description: 'Biaya Jasa', cost: parseInt(invoice.serviceCost, 10).toLocaleString('id-ID'),
          isSubscription: false, category: 'Subscription', billingCycle: '1 Tahun', subscriptionId: null,
        }]);
      } else {
        setFormServiceItems([EMPTY_SERVICE_ROW()]);
      }

      setFormItems(invoice.items.map(item => ({
        id: item.id,
        name: item.name, category: item.category, brand: item.brand,
        model: item.model || '', serialNumber: item.serialNumber || '',
        purchaseCost: item.purchaseCost ? parseInt(item.purchaseCost, 10).toLocaleString('id-ID') : '',
        quantity: item.quantity.toString(), status: item.status,
        companyId: item.companyId ? item.companyId.toString() : '',
      })));

      setFormError(null); setIsEditMode(true); setIsModalOpen(true);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal!', text: err.message, confirmButtonColor: '#f43f5e' });
    } finally {
      setLoading(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    if (!formInvoiceRef || !formSupplier || !formPurchaseDate || !formCompanyMasterId) {
      setFormError('Harap lengkapi semua field header invoice yang wajib (*)');
      setSubmitting(false);
      return;
    }

    const validatedItems = [];
    for (let i = 0; i < formItems.length; i++) {
      const item = formItems[i];
      if (!item.name || !item.category || !item.brand || !item.purchaseCost || !item.quantity) {
        setFormError(`Harap lengkapi field wajib pada item baris ke-${i + 1}`);
        setSubmitting(false); return;
      }
      const unitCost = parseFloat(item.purchaseCost.toString().replace(/\./g, ''));
      const qty = parseInt(item.quantity, 10);
      if (isNaN(unitCost) || unitCost < 0 || isNaN(qty) || qty <= 0) {
        setFormError(`Harga unit atau kuantitas pada item baris ke-${i + 1} tidak valid.`);
        setSubmitting(false); return;
      }
      validatedItems.push({
        id: item.id || undefined,
        name: item.name.trim(), category: item.category.trim(), brand: item.brand.trim(),
        model: item.model ? item.model.trim() : null,
        serialNumber: item.serialNumber ? item.serialNumber.trim() : null,
        purchaseCost: unitCost, quantity: qty, status: item.status,
        companyId: item.companyId ? parseInt(item.companyId, 10) : null,
      });
    }

    const validatedServiceItems = [];
    for (let i = 0; i < formServiceItems.length; i++) {
      const svc = formServiceItems[i];
      if (!svc.description && !svc.cost) continue;
      if (!svc.description || !svc.cost) {
        setFormError(`Harap lengkapi deskripsi dan biaya pada baris jasa ke-${i + 1}`);
        setSubmitting(false); return;
      }
      const cost = parseFloat(svc.cost.toString().replace(/\./g, ''));
      if (isNaN(cost) || cost < 0) {
        setFormError(`Biaya pada baris jasa ke-${i + 1} tidak valid.`);
        setSubmitting(false); return;
      }
      validatedServiceItems.push({
        description: svc.description.trim(), cost,
        isSubscription: !!svc.isSubscription,
        category: svc.category || 'Subscription',
        billingCycle: svc.billingCycle || '1 Tahun',
        subscriptionId: svc.subscriptionId || null,
      });
    }

    const serviceCostNum = validatedServiceItems.reduce((sum, s) => sum + s.cost, 0);
    const payload = {
      invoiceRef: formInvoiceRef.trim(),
      poRef: formPoRef ? formPoRef.trim() : null,
      supplier: formSupplier.trim(),
      purchaseDate: formPurchaseDate,
      serviceCost: serviceCostNum,
      serviceCostBreakdown: validatedServiceItems,
      deliveryCost: parseFloat(formDeliveryCost.toString().replace(/\./g, '')) || 0,
      taxCost: parseFloat(formTaxCost.toString().replace(/\./g, '')) || 0,
      notes: formNotes ? formNotes.trim() : null,
      fileLink: formFileLink ? formFileLink.trim() : null,
      companyMasterId: parseInt(formCompanyMasterId, 10),
      items: validatedItems,
    };

    try {
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const res = isEditMode
        ? await fetch(`${API_URL}/peripherals/invoices/${formId}`, { method: 'PUT', headers, body: JSON.stringify(payload) })
        : await fetch(`${API_URL}/peripherals/invoices`, { method: 'POST', headers, body: JSON.stringify(payload) });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal menyimpan data.');

      const newSubCount = validatedServiceItems.filter(s => s.isSubscription && !s.subscriptionId).length;
      setIsModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: isEditMode ? 'Invoice Diperbarui!' : 'Invoice Terdaftar!',
        text: `Invoice ${formInvoiceRef} berhasil disimpan dengan ${validatedItems.length} item.` +
          (newSubCount > 0 ? ` ${newSubCount} biaya jasa otomatis dibuat sebagai Subscription baru.` : ''),
        confirmButtonColor: '#f43f5e',
        timer: newSubCount > 0 ? 3500 : 2000,
      });
      handleRefreshData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete invoice ───────────────────────────────────────────────────────────
  const handleDeleteInvoice = (invoice) => {
    Swal.fire({
      title: 'Apakah Anda Yakin?',
      text: `Menghapus Invoice "${invoice.invoiceRef}" dari ${invoice.supplier} beserta seluruh barang di dalamnya?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus Semua!', cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await fetch(`${API_URL}/peripherals/invoices/${invoice.id}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Gagal menghapus data.'); }
        Swal.fire({ icon: 'success', title: 'Dihapus!', text: 'Invoice dan seluruh item terkait berhasil dihapus.', confirmButtonColor: '#f43f5e', timer: 1500 });
        handleRefreshData();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal!', text: err.message, confirmButtonColor: '#f43f5e' });
      }
    });
  };

  // ── Delete single item ───────────────────────────────────────────────────────
  const handleDeleteSingleItem = (p) => {
    Swal.fire({
      title: 'Hapus Item Periferal?',
      text: `Menghapus data item ${p.brand} ${p.model || ''} (${p.name})?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      if (user.role === 'ADMIN') {
        try {
          const res = await fetch(`${API_URL}/peripherals/${p.id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Gagal menghapus data.'); }
          Swal.fire({ icon: 'success', title: 'Dihapus!', text: 'Item periferal berhasil dihapus.', confirmButtonColor: '#f43f5e', timer: 1500 });
          handleRefreshData();
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Gagal!', text: err.message, confirmButtonColor: '#f43f5e' });
        }
      } else {
        Swal.fire({
          title: 'Alasan Penghapusan', text: 'Tuliskan alasan mengapa item ini perlu dihapus:',
          input: 'textarea', inputPlaceholder: 'Tulis alasan di sini...',
          showCancelButton: true, confirmButtonText: 'Ajukan Hapus', cancelButtonText: 'Batal',
          confirmButtonColor: '#f43f5e',
          preConfirm: (text) => { if (!text?.trim()) Swal.showValidationMessage('Alasan wajib diisi.'); return text; },
        }).then(async (rr) => {
          if (!rr.isConfirmed) return;
          try {
            const res = await fetch(`${API_URL}/peripherals/${p.id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ reason: rr.value }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error || 'Gagal mengajukan penghapusan.');
            Swal.fire({ icon: 'info', title: 'Diajukan!', text: 'Permintaan penghapusan item telah diajukan ke Admin.', confirmButtonColor: '#3b82f6' });
            handleRefreshData();
          } catch (err) {
            Swal.fire({ icon: 'error', title: 'Gagal!', text: err.message, confirmButtonColor: '#f43f5e' });
          }
        });
      }
    });
  };

  return {
    // state
    activeTab, setActiveTab,
    peripherals, invoices, companies, companyMasters, dbCategories,
    loading, error, analysisData, exporting,
    viewingAsset, setViewingAsset,
    stats,
    searchQuery, setSearchQuery,
    selectedStatus, setSelectedStatus,
    selectedCompanyMasterId, setSelectedCompanyMasterId,
    selectedCategory, setSelectedCategory,
    invoicesLoaded, itemsLoaded, analysisLoaded,
    expandedRows,
    isModalOpen, setIsModalOpen,
    isEditMode, submitting, formError,
    // form
    formId, formInvoiceRef, setFormInvoiceRef,
    formPoRef, setFormPoRef,
    formSupplier, setFormSupplier,
    formPurchaseDate, setFormPurchaseDate,
    formNotes, setFormNotes,
    formCompanyMasterId, setFormCompanyMasterId,
    formFileLink, setFormFileLink,
    formServiceItems, setFormServiceItems,
    formDeliveryCost, setFormDeliveryCost,
    formTaxCost, setFormTaxCost,
    formItems, setFormItems,
    // handlers
    handleRefreshData, handleResetFilters, handleExportExcel,
    toggleRow,
    handleAddItemRow, handleRemoveItemRow, handleUpdateItemField, handleItemPriceChange,
    handleAddServiceRow, handleRemoveServiceRow, handleUpdateServiceField, handleServiceCostChange,
    calculateTotalInvoiceCost,
    handleOpenAddModal, handleOpenEditModal,
    handleSubmit, handleDeleteInvoice, handleDeleteSingleItem,
    // formatters
    formatRupiah, formatDate, formatCostDigits,
    // computed
    allFormCategories,
  };
}
