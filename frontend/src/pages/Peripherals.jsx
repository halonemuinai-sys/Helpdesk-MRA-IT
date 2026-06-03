import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Tag 
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

export default function Peripherals({ user, token }) {
  const [peripherals, setPeripherals] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyMasters, setCompanyMasters] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeCategories = dbCategories.length > 0 ? dbCategories : DEFAULT_CATEGORIES;

  // Stats state
  const [stats, setStats] = useState({
    totalCount: 0,
    totalQuantity: 0,
    totalBudget: 0,
    stockQuantity: 0,
    inUseQuantity: 0,
    damagedQuantity: 0,
    categories: []
  });

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCompanyMasterId, setSelectedCompanyMasterId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const isMounted = useRef(false);

  // UI state
  const [expandedRows, setExpandedRows] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formSerialNumber, setFormSerialNumber] = useState('');
  const [formPurchaseCost, setFormPurchaseCost] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formWarrantyExpiry, setFormWarrantyExpiry] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formInvoiceRef, setFormInvoiceRef] = useState('');
  const [formPoRef, setFormPoRef] = useState('');
  const [formStatus, setFormStatus] = useState('STOCK');
  const [formNotes, setFormNotes] = useState('');
  const [formCompanyId, setFormCompanyId] = useState('');
  const [formCompanyMasterId, setFormCompanyMasterId] = useState('');

  // Debounce search query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger loading automatically on filter changes
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (debouncedSearchQuery.trim() === '') {
      setPeripherals([]);
    } else {
      fetchPeripherals(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, selectedStatus, selectedCompanyMasterId, selectedCategory]);

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

      // 1. Fetch Master Companies
      const masterRes = await fetch(`${API_URL}/companies/master`, { headers });
      if (!masterRes.ok) throw new Error('Gagal memuat data perusahaan induk.');
      const masterData = await masterRes.json();
      setCompanyMasters(masterData);

      // 2. Fetch Companies (Branch locations)
      const branchRes = await fetch(`${API_URL}/companies`, { headers });
      if (!branchRes.ok) throw new Error('Gagal memuat data kantor cabang.');
      const branchData = await branchRes.json();
      setCompanies(branchData);

      // 3. Fetch Category Metadata
      try {
        const catRes = await fetch(`${API_URL}/tickets/categories`, { headers });
        if (catRes.ok) {
          const catData = await catRes.json();
          const peripheralCats = catData
            .filter(item => item.category === 'IT Peripheral')
            .map(item => item.subCategory);
          setDbCategories(peripheralCats);
        }
      } catch (catErr) {
        console.error("Gagal memuat kategori dari database:", catErr);
      }

      // 4. Load data
      await fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeripherals = async (currentSearch = searchQuery) => {
    if (!currentSearch || currentSearch.trim() === '') {
      setPeripherals([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };

      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedCompanyMasterId) params.append('companyMasterId', selectedCompanyMasterId);
      if (currentSearch) params.append('search', currentSearch);
      if (selectedCategory) params.append('category', selectedCategory);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`${API_URL}/peripherals${queryString}`, { headers });
      if (!res.ok) throw new Error('Gagal memuat data pembelian periferal.');
      const data = await res.json();
      setPeripherals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    await Promise.all([
      fetchStats(),
      fetchPeripherals(debouncedSearchQuery)
    ]);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedCompanyMasterId('');
    setSelectedCategory('');
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Auto format price input with dots
  const handlePriceInputChange = (val) => {
    const rawDigits = val.replace(/\D/g, '');
    if (!rawDigits) {
      setFormPurchaseCost('');
      return;
    }
    const formatted = parseInt(rawDigits, 10).toLocaleString('id-ID');
    setFormPurchaseCost(formatted);
  };

  // Open modal to add new peripheral
  const handleOpenAddModal = () => {
    setFormId('');
    setFormName('');
    setFormCategory('');
    setFormCustomCategory('');
    setFormBrand('');
    setFormModel('');
    setFormSerialNumber('');
    setFormPurchaseCost('');
    setFormQuantity('1');
    setFormPurchaseDate('');
    setFormWarrantyExpiry('');
    setFormSupplier('');
    setFormInvoiceRef('');
    setFormPoRef('');
    setFormStatus('STOCK');
    setFormNotes('');
    setFormCompanyId('');
    setFormCompanyMasterId('');
    setFormError(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Open modal to edit peripheral
  const handleOpenEditModal = (p) => {
    setFormId(p.id);
    setFormName(p.name);
    
    // Check if category is standard or custom
    if (activeCategories.includes(p.category)) {
      setFormCategory(p.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('__NEW__');
      setFormCustomCategory(p.category);
    }

    setFormBrand(p.brand);
    setFormModel(p.model || '');
    setFormSerialNumber(p.serialNumber || '');
    
    // Format initial price
    const formattedPrice = p.purchaseCost ? parseInt(p.purchaseCost, 10).toLocaleString('id-ID') : '';
    setFormPurchaseCost(formattedPrice);

    setFormQuantity(p.quantity.toString());
    
    // Format Dates to YYYY-MM-DD
    setFormPurchaseDate(p.purchaseDate ? p.purchaseDate.split('T')[0] : '');
    setFormWarrantyExpiry(p.warrantyExpiry ? p.warrantyExpiry.split('T')[0] : '');
    
    setFormSupplier(p.supplier || '');
    setFormInvoiceRef(p.invoiceRef || '');
    setFormPoRef(p.poRef || '');
    setFormStatus(p.status);
    setFormNotes(p.notes || '');
    setFormCompanyId(p.companyId ? p.companyId.toString() : '');
    setFormCompanyMasterId(p.companyMasterId ? p.companyMasterId.toString() : '');
    
    setFormError(null);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    // Get final category
    const finalCategory = formCategory === '__NEW__' ? formCustomCategory.trim() : formCategory;

    if (!formName || !finalCategory || !formBrand || !formPurchaseCost || !formQuantity || !formPurchaseDate) {
      setFormError('Harap lengkapi semua field wajib (*)');
      setSubmitting(false);
      return;
    }

    // Strip dots out of price
    const numericCost = parseFloat(formPurchaseCost.replace(/\./g, ''));
    if (isNaN(numericCost) || numericCost < 0) {
      setFormError('Harga unit tidak valid.');
      setSubmitting(false);
      return;
    }

    const payload = {
      name: formName,
      category: finalCategory,
      brand: formBrand,
      model: formModel || null,
      serialNumber: formSerialNumber || null,
      purchaseCost: numericCost,
      quantity: parseInt(formQuantity, 10),
      purchaseDate: formPurchaseDate,
      warrantyExpiry: formWarrantyExpiry || null,
      supplier: formSupplier || null,
      invoiceRef: formInvoiceRef || null,
      poRef: formPoRef || null,
      status: formStatus,
      notes: formNotes || null,
      companyId: formCompanyId ? parseInt(formCompanyId, 10) : null,
      companyMasterId: formCompanyMasterId ? parseInt(formCompanyMasterId, 10) : null
    };

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      let res;
      if (isEditMode) {
        res = await fetch(`${API_URL}/peripherals/${formId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/peripherals`, {
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
        title: isEditMode ? 'Peralatan Diperbarui!' : 'Peralatan Terdaftar!',
        text: `Peralatan ${formBrand} ${formModel || ''} berhasil disimpan.`,
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

  // Delete peripheral
  const handleDelete = (p) => {
    Swal.fire({
      title: 'Apakah Anda Yakin?',
      text: `Menghapus data pembelian periferal ${p.brand} ${p.model || ''} (${p.name}) dari database? Tindakan ini tidak bisa dibatalkan.`,
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
              text: 'Data periferal berhasil dihapus dari database.',
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
            text: 'Tuliskan alasan mengapa data pembelian periferal ini perlu dihapus:',
            input: 'textarea',
            inputPlaceholder: 'Tulis alasan di sini...',
            inputAttributes: { 'aria-label': 'Tulis alasan di sini' },
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
                  text: 'Permintaan penghapusan aset telah diajukan ke Admin.',
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

  // Combine standard and custom categories for the dropdown selector
  const allFormCategories = Array.from(new Set([...activeCategories, ...stats.categories]));

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

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
        >
          <Plus className="w-4 h-4" />
          Daftarkan Pembelian Periferal
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Stat 1: Total Peripherals */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Item Dibeli</p>
            <h3 className="text-xl font-black text-gray-800 dark:text-slate-100 mt-1">{stats.totalQuantity} Unit</h3>
            <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">
              Dari {stats.totalCount} transaksi pembelian
            </p>
          </div>
          <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-xl flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 2: Total Cost */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Pengeluaran</p>
            <h3 className="text-md font-black text-rose-500 dark:text-rose-455 mt-1.5 truncate max-w-[140px]">{formatRupiah(stats.totalBudget)}</h3>
            <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">Seluruh Unit Periferal</p>
          </div>
          <div className="w-9 h-9 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-455 rounded-xl flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 3: Stock */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Stok Cadangan (Ready)</p>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.stockQuantity} Unit</h3>
          </div>
          <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 4: Deployed */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Terpasang & Aktif</p>
            <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.inUseQuantity} Unit</h3>
          </div>
          <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 5: Damaged */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Rusak / Diarsip</p>
            <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.damagedQuantity} Unit</h3>
          </div>
          <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* Control Filter Bar */}
      <div className="glass-panel p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-gray-250/60 dark:border-slate-800/60 space-y-4">
        
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full lg:w-80 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
            <input
              type="text"
              placeholder="Cari Nama, Brand, Invoice, Supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-200 dark:border-slate-850/50 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
            />
          </div>

          {/* Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex gap-3 w-full lg:w-auto">
            
            {/* Category Selector */}
            <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-955/30 border border-gray-200 dark:border-slate-850/50 px-3 py-2.5 rounded-xl w-full lg:w-48">
              <Tag className="w-4 h-4 text-gray-400 shrink-0" />
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

            {/* Status Selector */}
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

          </div>
        </div>

        {/* Action Button Row */}
        {(searchQuery || selectedStatus || selectedCompanyMasterId || selectedCategory) && (
          <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-150 dark:border-slate-800/60">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-gray-250 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-350 text-xs font-bold rounded-xl transition"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Peripherals List */}
      <div className="glass-panel rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden">
        {loading && peripherals.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            <span className="text-xs text-gray-500 font-semibold">Memuat Data Periferal...</span>
          </div>
        ) : searchQuery.trim() === '' ? (
          <div className="text-center py-16 px-6 animate-fade-in flex flex-col items-center justify-center gap-3">
            <Search className="w-8 h-8 text-rose-500/80" />
            <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold max-w-md">
              Silakan masukkan kata kunci pencarian (Nama, Brand, Invoice, Supplier, dsb.) di atas untuk memuat data periferal.
            </p>
          </div>
        ) : peripherals.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-sm font-semibold text-gray-555 dark:text-slate-400">Tidak ada data periferal ditemukan.</p>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <table className="w-full text-left text-xs font-semibold border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-6">Nama Alat & Spesifikasi</th>
                  <th className="py-4 px-6">Kategori</th>
                  <th className="py-4 px-6">Entitas (Pembayar)</th>
                  <th className="py-4 px-6">Jumlah (Qty)</th>
                  <th className="py-4 px-6">Biaya Satuan</th>
                  <th className="py-4 px-6">Total Pengeluaran</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-700 dark:text-slate-300">
                {peripherals.map((p) => {
                  const isExpanded = !!expandedRows[p.id];
                  const statusObj = STATUS_OPTIONS.find(o => o.value === p.status) || STATUS_OPTIONS[0];

                  return (
                    <React.Fragment key={p.id}>
                      <tr 
                        onClick={() => toggleRow(p.id)}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/25 transition cursor-pointer border-b border-gray-100 dark:border-slate-850/30 ${isExpanded ? 'bg-slate-50/30 dark:bg-slate-900/15' : ''}`}
                      >
                        <td className="py-4 px-6">
                          <div className="font-extrabold text-gray-900 dark:text-white text-xs">{p.name}</div>
                          <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                            {p.brand} {p.model || '-'} {p.serialNumber ? `| SN: ${p.serialNumber}` : ''}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[10px]">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-650 dark:text-slate-300 font-bold uppercase tracking-wider">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-gray-800 dark:text-slate-200">{p.companyMaster?.name || '-'}</div>
                          <div className="text-[10px] text-gray-400 font-semibold mt-0.5">{p.company?.name || 'Shared / Cabang'} ({p.company?.location || '-'})</div>
                        </td>
                        <td className="py-4 px-6 font-bold text-gray-950 dark:text-slate-100">{p.quantity} Unit</td>
                        <td className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400">{formatRupiah(p.purchaseCost)}</td>
                        <td className="py-4 px-6 font-extrabold text-gray-900 dark:text-white">{formatRupiah(p.totalCost)}</td>
                        <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${statusObj.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`} />
                            {statusObj.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-rose-500 rounded-lg transition"
                              title="Edit Detail Periferal"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-red-500 rounded-lg transition"
                              title="Hapus Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Specification Details */}
                      {isExpanded && (
                        <tr className="bg-slate-50/30 dark:bg-slate-900/15">
                          <td colSpan="8" className="p-5 border-t border-gray-100 dark:border-slate-850">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                              
                              {/* Purchase Specifications */}
                              <div className="space-y-4">
                                <h5 className="font-extrabold text-[10px] uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                                  <Cpu className="w-3.5 h-3.5 text-rose-500" />
                                  Rincian Administrasi & Pembelian
                                </h5>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-white/80 dark:bg-slate-955/40 p-4 rounded-xl border border-gray-150 dark:border-slate-850/60 text-xs text-gray-700 dark:text-slate-300">
                                  <div>
                                    <span className="text-[10px] text-gray-400 block font-semibold">SUPPLIER / TOKO:</span>
                                    <span className="font-bold">{p.supplier || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 block font-semibold">TANGGAL PEMBELIAN:</span>
                                    <span className="font-bold flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                      {formatDate(p.purchaseDate)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 block font-semibold">REF INVOICE / NOTA:</span>
                                    <span className="font-bold font-mono">{p.invoiceRef || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 block font-semibold">GARANSI HINGGA:</span>
                                    <span className="font-bold flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                      {p.warrantyExpiry ? formatDate(p.warrantyExpiry) : 'Tanpa Garansi'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 block font-semibold">NOMOR PO (PURCHASE ORDER):</span>
                                    <span className="font-bold font-mono">{p.poRef || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 block font-semibold">SERIAL NUMBER / BATCH:</span>
                                    <span className="font-bold font-mono">{p.serialNumber || '-'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Notes */}
                              <div className="space-y-4">
                                <h5 className="font-extrabold text-[10px] uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                                  Keterangan / Catatan Teknis
                                </h5>

                                <div className="bg-white/80 dark:bg-slate-955/40 p-4 rounded-xl border border-gray-150 dark:border-slate-850/60 text-xs text-gray-700 dark:text-slate-300 min-h-[105px]">
                                  {p.notes ? (
                                    <p className="whitespace-pre-line leading-relaxed">{p.notes}</p>
                                  ) : (
                                    <p className="text-gray-400 italic">Tidak ada catatan ditambahkan.</p>
                                  )}
                                </div>
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

      {/* CRUD Form Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-250 dark:border-slate-800/80 shadow-2xl w-full max-w-4xl overflow-hidden animate-slide-up">
              
              {/* Header */}
              <div className="flex justify-between items-center p-5 border-b border-gray-150 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {isEditMode ? 'Pembaruan Data Periferal' : 'Daftarkan Transaksi Pembelian Periferal'}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
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
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                  
                  {formError && (
                    <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800 text-red-755 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Nama Periferal *</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. CCTV Dome Hikvision 4MP"
                        required
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                      />
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Kategori *</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                      >
                        <option value="">Pilih Kategori</option>
                        {allFormCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__NEW__" className="text-rose-500 font-bold">+ Tambah Kategori Baru...</option>
                      </select>
                    </div>

                    {/* Custom Category Input */}
                    {formCategory === '__NEW__' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">Kategori Baru *</label>
                        <input
                          type="text"
                          value={formCustomCategory}
                          onChange={(e) => setFormCustomCategory(e.target.value)}
                          placeholder="Ketik kategori baru (e.g. UPS)"
                          required
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-rose-50/10 dark:bg-rose-950/10 border border-rose-300 dark:border-rose-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                        />
                      </div>
                    )}

                    {/* Brand */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Brand / Merk *</label>
                      <input
                        type="text"
                        value={formBrand}
                        onChange={(e) => setFormBrand(e.target.value)}
                        placeholder="e.g. Hikvision"
                        required
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                        list="brand-suggestions"
                      />
                      <datalist id="brand-suggestions">
                        <option value="Hikvision" />
                        <option value="Dahua" />
                        <option value="Seagate" />
                        <option value="Western Digital" />
                        <option value="Toshiba" />
                        <option value="Transcend" />
                        <option value="Kingston" />
                        <option value="SanDisk" />
                        <option value="Samsung" />
                        <option value="TP-Link" />
                        <option value="Cisco" />
                        <option value="APC" />
                        <option value="Epson" />
                        <option value="Canon" />
                        <option value="HP" />
                      </datalist>
                    </div>

                    {/* Model */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Model / Tipe</label>
                      <input
                        type="text"
                        value={formModel}
                        onChange={(e) => setFormModel(e.target.value)}
                        placeholder="e.g. DS-2CD2143G0-I"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                      />
                    </div>

                    {/* Serial Number */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Serial Number / Batch</label>
                      <input
                        type="text"
                        value={formSerialNumber}
                        onChange={(e) => setFormSerialNumber(e.target.value)}
                        placeholder="e.g. SN-892348A or Batch 5"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                      />
                    </div>

                    {/* Cost per Unit */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Harga Satuan (Rp) *</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400">Rp</span>
                        <input
                          type="text"
                          value={formPurchaseCost}
                          onChange={(e) => handlePriceInputChange(e.target.value)}
                          placeholder="1.000.000"
                          required
                          className="w-full pl-9 pr-4 py-2 text-xs font-bold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                        />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Kuantitas *</label>
                      <input
                        type="number"
                        min="1"
                        value={formQuantity}
                        onChange={(e) => setFormQuantity(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                      />
                    </div>

                    {/* Purchase Date */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Tanggal Pembelian *</label>
                      <input
                        type="date"
                        value={formPurchaseDate}
                        onChange={(e) => setFormPurchaseDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                      />
                    </div>

                    {/* Warranty Expiry */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Tanggal Habis Garansi</label>
                      <input
                        type="date"
                        value={formWarrantyExpiry}
                        onChange={(e) => setFormWarrantyExpiry(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                      />
                    </div>

                    {/* Supplier */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Supplier / Toko Penjual</label>
                      <input
                        type="text"
                        value={formSupplier}
                        onChange={(e) => setFormSupplier(e.target.value)}
                        placeholder="e.g. Tokopedia Jaya"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                      />
                    </div>

                    {/* Invoice Ref */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Nomor Nota / Invoice</label>
                      <input
                        type="text"
                        value={formInvoiceRef}
                        onChange={(e) => setFormInvoiceRef(e.target.value)}
                        placeholder="e.g. INV-1002348"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition font-mono"
                      />
                    </div>

                    {/* PO Ref */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Nomor PO (Purchase Order)</label>
                      <input
                        type="text"
                        value={formPoRef}
                        onChange={(e) => setFormPoRef(e.target.value)}
                        placeholder="e.g. PO-MRA-2026-0045"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition font-mono"
                      />
                    </div>

                    {/* Master Company */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Perusahaan Induk (Penanggung Biaya)</label>
                      <select
                        value={formCompanyMasterId}
                        onChange={(e) => setFormCompanyMasterId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                      >
                        <option value="">Pilih Perusahaan Induk</option>
                        {companyMasters.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Location Branch */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Lokasi Cabang / Penempatan</label>
                      <select
                        value={formCompanyId}
                        onChange={(e) => setFormCompanyId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                      >
                        <option value="">Pilih Kantor Cabang</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.location})</option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Status Perangkat *</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-755 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">Catatan Keterangan / Detail Serial Number</label>
                    <textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Tambahkan keterangan penempatan (misalnya: dipasang di Lobby lantai 1 atau serial number individual untuk masing-masing unit)."
                      rows="3"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                    />
                  </div>

                </div>

                {/* Footer buttons */}
                <div className="flex justify-end items-center gap-3 p-5 border-t border-gray-150 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-250 dark:border-slate-855 hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-655 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-500/10 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{isEditMode ? 'Simpan Perubahan' : 'Daftarkan Periferal'}</span>
                  </button>
                </div>

              </form>

            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
