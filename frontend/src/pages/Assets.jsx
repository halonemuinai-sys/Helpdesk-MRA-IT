import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Laptop, 
  Smartphone,
  Plus, 
  Search, 
  Building2, 
  Calendar, 
  Trash2, 
  Edit2, 
  Loader2, 
  AlertTriangle,
  History,
  CheckCircle2,
  X,
  Clock,
  User,
  ShieldAlert,
  Cpu,
  FileText,
  DollarSign
} from 'lucide-react';
import ReactLoader from '../components/ReactLoader';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Tersedia (Ready)', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', dot: 'bg-emerald-500' },
  { value: 'ASSIGNED', label: 'Dipakai Karyawan', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', dot: 'bg-blue-500' },
  { value: 'MAINTENANCE', label: 'Dalam Servis', color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400', dot: 'bg-amber-500' },
  { value: 'DISPOSED', label: 'Pensiun (Disposed)', color: 'bg-slate-150 text-slate-600 dark:bg-slate-800 dark:text-slate-400', dot: 'bg-slate-500' }
];

export default function Assets({ user, token }) {
  const [assets, setAssets] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyMasters, setCompanyMasters] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCompanyMasterId, setSelectedCompanyMasterId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [hasProcessed, setHasProcessed] = useState(false);

  // UI state
  const [expandedRows, setExpandedRows] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formAssetTag, setFormAssetTag] = useState('');
  const [formDeviceRef, setFormDeviceRef] = useState('');
  const [formVendorRef, setFormVendorRef] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formProcessor, setFormProcessor] = useState('');
  const [formRam, setFormRam] = useState('');
  const [formStorage, setFormStorage] = useState('');
  const [formOs, setFormOs] = useState('');
  const [formOffice, setFormOffice] = useState('');
  const [formStatus, setFormStatus] = useState('AVAILABLE');
  const [formRentalCost, setFormRentalCost] = useState('');
  const [formRentalStart, setFormRentalStart] = useState('');
  const [formRentalEnd, setFormRentalEnd] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formUpdateJourney, setFormUpdateJourney] = useState('');
  const [formUserId, setFormUserId] = useState('');
  const [formCompanyId, setFormCompanyId] = useState('');
  const [formCompanyMasterId, setFormCompanyMasterId] = useState('');
  const [formOwnershipType, setFormOwnershipType] = useState('RENTAL');
  const [formDeviceCategory, setFormDeviceCategory] = useState('LAPTOP');

  // BAST Modal State
  const [isBastModalOpen, setIsBastModalOpen] = useState(false);
  const [bastAsset, setBastAsset] = useState(null);
  const [bastDocNum, setBastDocNum] = useState('');
  const [bastAgentName, setBastAgentName] = useState('');
  const [bastNotes, setBastNotes] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

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

      // 3. Fetch Users (Employees)
      const usersRes = await fetch(`${API_URL}/users`, { headers });
      if (!usersRes.ok) throw new Error('Gagal memuat data karyawan.');
      const usersData = await usersRes.json();
      setUsers(usersData);

      // 4. Do not load assets automatically anymore (just set loading to false)
      // fetchAssets will be called on demand
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };

      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedCompanyMasterId) params.append('companyMasterId', selectedCompanyMasterId);
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`${API_URL}/assets${queryString}`, { headers });
      if (!res.ok) throw new Error('Gagal memuat data inventaris aset.');
      const data = await res.json();
      setAssets(data);
      setHasProcessed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    await fetchAssets();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedCompanyMasterId('');
    setSelectedCategory('');
    setAssets([]);
    setHasProcessed(false);
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Open modal to add new Asset
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setFormId('');
    
    // Auto-generate a clean asset tag suggestion based on current timestamp
    const suggestionNum = Math.floor(1000 + Math.random() * 9000);
    setFormAssetTag(`AST-MRA-${suggestionNum}`);
    
    setFormDeviceRef('');
    setFormVendorRef('');
    setFormBrand('');
    setFormModel('');
    setFormProcessor('');
    setFormRam('');
    setFormStorage('');
    setFormOs('');
    setFormOffice('');
    setFormStatus('AVAILABLE');
    setFormRentalCost('');
    
    const today = new Date().toISOString().split('T')[0];
    setFormRentalStart(today);
    
    // Expiry suggest 2 years
    const twoYearsLater = new Date();
    twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);
    setFormRentalEnd(twoYearsLater.toISOString().split('T')[0]);
    
    setFormNotes('');
    setFormUpdateJourney('');
    setFormUserId('');
    setFormCompanyId(companies[0]?.id || '');
    setFormCompanyMasterId(companyMasters[0]?.id || '');
    setFormOwnershipType('RENTAL');
    setFormDeviceCategory('LAPTOP');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal to Edit existing Asset
  const handleOpenEditModal = (asset) => {
    setIsEditMode(true);
    setFormId(asset.id);
    setFormAssetTag(asset.assetTag);
    setFormDeviceRef(asset.deviceRef || '');
    setFormVendorRef(asset.vendorRef || '');
    setFormBrand(asset.brand);
    setFormModel(asset.model);
    setFormProcessor(asset.processor || '');
    setFormRam(asset.ram || '');
    setFormStorage(asset.storage || '');
    setFormOs(asset.os || '');
    setFormOffice(asset.office || '');
    setFormStatus(asset.status);
    setFormRentalCost(asset.rentalCost.toString());
    setFormRentalStart(asset.rentalStart.split('T')[0]);
    setFormRentalEnd(asset.rentalEnd.split('T')[0]);
    setFormNotes(asset.notes || '');
    setFormUpdateJourney('');
    setFormUserId(asset.userId || '');
    setFormCompanyId(asset.companyId || '');
    setFormCompanyMasterId(asset.companyMasterId || '');
    
    // Auto detect category
    const isPhone = (asset.brand && asset.brand.toLowerCase() === 'apple' && asset.model && asset.model.toLowerCase().includes('iphone')) || 
                    (asset.os && asset.os.toLowerCase().includes('ios')) || 
                    (asset.ram && (asset.ram.toLowerCase().includes('4 gb') || asset.ram.toLowerCase().includes('4gb')));
    setFormDeviceCategory(isPhone ? 'SMARTPHONE' : 'LAPTOP');
    setFormOwnershipType(asset.ownershipType || 'RENTAL');
    
    setFormError(null);
    setIsModalOpen(true);
  };

  // Helper for Indonesian dates formatting
  const formatIndonesianDate = (date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const d = new Date(date);
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const handleOpenBastModal = (asset) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    
    setBastAsset(asset);
    setBastDocNum(`BAST/MRA/${year}/${month}/${rand}`);
    setBastAgentName(user ? user.name : 'IT Support Specialist');
    setBastNotes('');
    setIsBastModalOpen(true);
  };

  const handlePrintBast = () => {
    window.print();
  };

  // Submit Asset Form (POST / PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    let finalAssetTag = formAssetTag;
    let finalRentalStart = formRentalStart;
    let finalRentalEnd = formRentalEnd;
    let finalRentalCost = formRentalCost;

    if (formOwnershipType === 'OWNED') {
      if (!formAssetTag || !formBrand || !formModel || !formRentalStart || formRentalCost === '') {
        setFormError('Kolom bertanda bintang (*) wajib diisi.');
        setSubmitting(false);
        return;
      }
      finalRentalEnd = formRentalStart; // owned doesn't expire, link end to start date
    } else { // RENTAL
      if (!formDeviceRef || !formBrand || !formModel || formRentalCost === '' || !formRentalStart || !formRentalEnd) {
        setFormError('Kolom bertanda bintang (*) wajib diisi.');
        setSubmitting(false);
        return;
      }
      finalAssetTag = `RENT-${formDeviceRef.trim()}`;
      if (new Date(formRentalStart) > new Date(formRentalEnd)) {
        setFormError('Tanggal Sewa Berakhir harus setelah Tanggal Sewa Dimulai.');
        setSubmitting(false);
        return;
      }
    }

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const payload = {
        assetTag: finalAssetTag,
        deviceRef: formDeviceRef || null,
        vendorRef: formOwnershipType === 'RENTAL' ? (formVendorRef || null) : 'Milik Sendiri',
        brand: formBrand,
        model: formModel,
        processor: formProcessor || null,
        ram: formRam || null,
        storage: formStorage || null,
        os: formOs || null,
        office: formDeviceCategory === 'LAPTOP' ? (formOffice || null) : 'None',
        ownershipType: formOwnershipType,
        status: formStatus,
        rentalCost: parseFloat(finalRentalCost || 0),
        rentalStart: new Date(finalRentalStart).toISOString(),
        rentalEnd: new Date(finalRentalEnd).toISOString(),
        notes: formNotes || null,
        userId: formUserId || null,
        companyId: formCompanyId ? parseInt(formCompanyId) : null,
        companyMasterId: formCompanyMasterId ? parseInt(formCompanyMasterId) : null,
        updateJourney: formUpdateJourney || null
      };

      let res;
      if (isEditMode) {
        res = await fetch(`${API_URL}/assets/${formId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/assets`, {
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
        title: isEditMode ? 'Aset Diperbarui!' : 'Aset Terdaftar!',
        text: `Aset ${formBrand} ${formModel} berhasil disimpan.`,
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

  // Delete Asset
  const handleDelete = (asset) => {
    Swal.fire({
      title: 'Apakah Anda Yakin?',
      text: `Menghapus aset ${asset.brand} ${asset.model} (Tag: ${asset.assetTag}) dari database? Tindakan ini tidak bisa dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${API_URL}/assets/${asset.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Gagal menghapus aset.');
          }

          Swal.fire({
            icon: 'success',
            title: 'Dihapus!',
            text: 'Data aset berhasil dihapus dari inventaris.',
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

  // Calculate HUD Stats
const totalAssets = assets.length;
  const assignedCount = assets.filter(a => a.status === 'ASSIGNED').length;
  const availableCount = assets.filter(a => a.status === 'AVAILABLE').length;
  const maintenanceCount = assets.filter(a => a.status === 'MAINTENANCE').length;
  
  // Total Monthly Rental Cost Estimate (Only for RENTAL ownership type)
  const totalMonthlyRental = assets
    .filter(a => a.ownershipType === 'RENTAL')
    .reduce((acc, curr) => acc + (curr.rentalCost || 0), 0);

  const formatRupiah = (value) => {
    if (value === undefined || value === null) return 'Rp 0';
    return 'Rp ' + Number(value).toLocaleString('id-ID');
  };

  const formatDateYYMMDD = (value) => {
    if (!value) return '-';
    try {
      const dateStr = typeof value === 'string' ? value.split('T')[0] : new Date(value).toISOString().split('T')[0];
      const parts = dateStr.split('-');
      if (parts.length !== 3) return '-';
      const yy = parts[0].slice(-2);
      const mm = parts[1];
      const dd = parts[2];
      return `${yy}/${mm}/${dd}`;
    } catch (e) {
      return '-';
    }
  };

  const isSmartphone = (asset) => {
    const brand = (asset.brand || '').toLowerCase();
    const model = (asset.model || '').toLowerCase();
    const os = (asset.os || '').toLowerCase();
    const ram = (asset.ram || '').toLowerCase();

    return (brand === 'apple' && model.includes('iphone')) ||
           os.includes('ios') ||
           os.includes('android') ||
           brand === 'samsung' ||
           brand === 'oppo' ||
           brand === 'vivo' ||
           brand === 'xiaomi' ||
           brand === 'realme' ||
           brand === 'infinix' ||
           brand === 'iqoo' ||
           ram.includes('4 gb') ||
           ram.includes('4gb');
  };

  // Apply filters
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.deviceRef && asset.deviceRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (asset.vendorRef && asset.vendorRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (asset.user && asset.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (asset.notes && asset.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === '' || asset.status === selectedStatus;
    const matchesMaster = selectedCompanyMasterId === '' || asset.companyMasterId === parseInt(selectedCompanyMasterId);
    const matchesCategory = selectedCategory === '' || (
      selectedCategory === 'SMARTPHONE' ? isSmartphone(asset) : !isSmartphone(asset)
    );

    return matchesSearch && matchesStatus && matchesMaster && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white font-outfit">
            Asset Management
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-400 font-semibold mt-0.5 max-w-xl">
            Kelola inventarisasi perangkat IT sewa (rentals) maupun milik sendiri (owned), spesifikasi hardware, status, serta serah terima unit karyawan MRA Group.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
        >
          <Plus className="w-4 h-4" />
          Daftarkan Aset Baru
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats HUD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Stat 1: Total Assets */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Aset IT</p>
            <h3 className="text-xl font-black text-gray-800 dark:text-slate-100 mt-1">{totalAssets} Unit</h3>
            <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">
              ({assets.filter(a => a.ownershipType === 'RENTAL').length} Sewa, {assets.filter(a => a.ownershipType === 'OWNED').length} Milik)
            </p>
          </div>
          <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-xl flex items-center justify-center">
            <Laptop className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 2: Assigned */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Dipakai Karyawan</p>
            <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{assignedCount} Unit</h3>
          </div>
          <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 3: Available */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Tersedia (Ready)</p>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{availableCount} Unit</h3>
          </div>
          <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 4: Under Repair */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Dalam Servis</p>
            <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{maintenanceCount} Unit</h3>
          </div>
          <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 5: Budget */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Anggaran Sewa Bulanan</p>
            <h3 className="text-md font-black text-rose-500 dark:text-rose-400 mt-1.5 truncate max-w-[140px]">{formatRupiah(totalMonthlyRental)}</h3>
            <p className="text-[9px] text-gray-450 dark:text-slate-500 font-semibold mt-0.5">Khusus perangkat Sewa</p>
          </div>
          <div className="w-9 h-9 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-450 rounded-xl flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
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
              placeholder="Cari Brand, Model, Tag Aset, NIP, LP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
            />
          </div>

          {/* Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex gap-3 w-full lg:w-auto">
            {/* Device Category Selector */}
            <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 px-3 py-2.5 rounded-xl w-full lg:w-40">
              <Laptop className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
              >
                <option value="">Semua Kategori</option>
                <option value="LAPTOP">Laptop / PC</option>
                <option value="SMARTPHONE">Smartphone</option>
              </select>
            </div>

            {/* Master Company Selector */}
            <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 px-3 py-2.5 rounded-xl w-full lg:w-56">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={selectedCompanyMasterId}
                onChange={(e) => setSelectedCompanyMasterId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
              >
                <option value="">Semua Perusahaan Induk</option>
                {companyMasters.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Status Selector */}
            <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 px-3 py-2.5 rounded-xl w-full lg:w-48">
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
        <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-150 dark:border-slate-850/60">
          {(searchQuery || selectedStatus || selectedCompanyMasterId || selectedCategory) && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-gray-250 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-350 text-xs font-bold rounded-xl transition"
            >
              Clear Filters
            </button>
          )}

          <button
            type="button"
            onClick={fetchAssets}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-500/10 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Process & Load Assets</span>
          </button>
        </div>
      </div>

      {/* Main Asset List */}
      <div className="glass-panel rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            <span className="text-xs text-gray-500 font-semibold">Memuat Inventaris Aset...</span>
          </div>
        ) : !hasProcessed ? (
          <div className="p-12 text-center max-w-2xl mx-auto space-y-6 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-rose-50/50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
              <Laptop className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-gray-800 dark:text-slate-100">Ready to Process Assets</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                Sistem IT MRA Group melacak inventaris perangkat laptop, PC, dan smartphone sewa maupun milik sendiri. Silakan sesuaikan kriteria filter di atas dan klik <strong>"Process & Load Assets"</strong> untuk menampilkan data.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchAssets}
              disabled={loading}
              className="mx-auto flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-rose-500/15 disabled:opacity-50 hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              <span>Process & Load Assets</span>
            </button>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Tidak ada aset IT ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-6">Model Perangkat</th>
                  <th className="py-4 px-6">Tag Aset / Ref</th>
                  <th className="py-4 px-6">Entitas (Master)</th>
                  <th className="py-4 px-6">Karyawan / Pengguna</th>
                  <th className="py-4 px-6">Biaya Sewa / Harga Beli</th>
                  <th className="py-4 px-6">Selesai Sewa / Milik</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-700 dark:text-slate-300">
                {filteredAssets.map((asset) => {
                  const isExpanded = !!expandedRows[asset.id];
                  const statusObj = STATUS_OPTIONS.find(o => o.value === asset.status) || STATUS_OPTIONS[0];
                  
                  // Calculate remaining lease days
                  const leaseEnd = new Date(asset.rentalEnd);
                  const today = new Date();
                  const remainingDays = Math.ceil((leaseEnd - today) / (1000 * 60 * 60 * 24));
                  const isLeaseNearExpiry = remainingDays >= 0 && remainingDays <= 90; // Warn under 3 months
                  const isLeaseExpired = remainingDays < 0;

                  const isPhone = (asset.brand && asset.brand.toLowerCase() === 'apple' && asset.model && asset.model.toLowerCase().includes('iphone')) || 
                                  (asset.os && asset.os.toLowerCase().includes('ios')) || 
                                  (asset.ram && (asset.ram.toLowerCase().includes('4 gb') || asset.ram.toLowerCase().includes('4gb')));

                  return (
                    <React.Fragment key={asset.id}>
                      <tr 
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer" 
                        onClick={() => toggleRow(asset.id)}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg shrink-0 ${isPhone ? 'bg-indigo-500/10 text-indigo-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              {isPhone ? <Smartphone className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="font-bold text-gray-800 dark:text-slate-100 text-xs truncate max-w-[220px] flex items-center gap-1.5">
                                <span>{asset.brand} {asset.model}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 ${
                                  asset.ownershipType === 'OWNED' 
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-455'
                                }`}>
                                  {asset.ownershipType === 'OWNED' ? 'Milik' : 'Sewa'}
                                </span>
                              </h4>
                              <p className="text-[10px] text-gray-400 font-medium truncate">
                                CPU: {asset.processor || '-'} | OS: {asset.os || '-'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>{asset.assetTag}</div>
                          {asset.deviceRef && (
                            <div className="text-[10px] text-rose-500 font-semibold font-mono">
                              Ref: {asset.deviceRef}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 font-bold text-gray-750 dark:text-slate-350">
                          {asset.companyMaster?.name || '-'}
                        </td>
                        <td className="py-4 px-6">
                          {asset.user ? (
                            <div>
                              <div className="font-bold text-gray-800 dark:text-slate-200">{asset.user.name}</div>
                              <div className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">
                                {asset.user.department}
                              </div>
                            </div>
                          ) : asset.company ? (
                            <div>
                              <div className="font-bold text-slate-700 dark:text-slate-300">Shared / Cabang</div>
                              <div className="text-[10px] text-gray-405 dark:text-slate-400 font-semibold truncate max-w-[150px]">
                                {asset.company.location}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic font-medium">Tersedia di IT</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-mono text-gray-850 dark:text-slate-100 font-bold">
                          <div>{formatRupiah(asset.rentalCost)}</div>
                          <div className="text-[8px] font-semibold uppercase tracking-wider mt-0.5">
                            {asset.ownershipType === 'OWNED' 
                              ? <span className="text-emerald-500">Harga Beli</span> 
                              : <span className="text-gray-450">/ bulan</span>}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono">
                          {asset.ownershipType === 'OWNED' ? (
                            <span className="text-gray-400 font-semibold italic text-[10px]">N/A (Milik)</span>
                          ) : (
                            <>
                              <div>{formatDateYYMMDD(asset.rentalEnd)}</div>
                              {isLeaseExpired ? (
                                <span className="text-[9px] font-black text-red-500 block">Sewa Habis!</span>
                              ) : isLeaseNearExpiry ? (
                                <span className="text-[9px] font-bold text-amber-500 block">{remainingDays} hari sisa sewa</span>
                              ) : (
                                <span className="text-[9px] text-slate-400 block">{remainingDays} hari sisa sewa</span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${statusObj.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`} />
                            {statusObj.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {asset.status === 'ASSIGNED' && (
                              <button
                                onClick={() => handleOpenBastModal(asset)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-indigo-500 rounded-lg transition"
                                title="Cetak BAST (Serah Terima)"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEditModal(asset)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-rose-500 rounded-lg transition"
                              title="Edit Detail Aset"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(asset)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-red-555 rounded-lg transition"
                              title="Hapus Aset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Specification Details & Journey */}
                      {isExpanded && (
                        <tr className="bg-slate-50/30 dark:bg-slate-900/15">
                          <td colSpan="8" className="p-5 border-t border-gray-100 dark:border-slate-850">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                              
                              {/* Specs */}
                              <div className="space-y-4">
                                <h5 className="font-extrabold text-[10px] uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                                  <Cpu className="w-3.5 h-3.5 text-rose-500" />
                                  Spesifikasi Perangkat
                                </h5>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-white/80 dark:bg-slate-955/40 p-4 rounded-xl border border-gray-150 dark:border-slate-850/60 text-xs text-gray-700 dark:text-slate-300">
                                  <div>
                                    <span className="text-[10px] text-gray-400 block font-semibold">BRAND & MODEL:</span>
                                    <span className="font-bold">{asset.brand} {asset.model}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 block font-semibold">PROCESSOR:</span>
                                    <span className="font-bold">{asset.processor || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 block font-semibold">RAM (MEMORY):</span>
                                    <span className="font-bold">{asset.ram || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 block font-semibold">STORAGE:</span>
                                    <span className="font-bold">{asset.storage || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 block font-semibold">OPERATING SYSTEM (OS):</span>
                                    <span className="font-bold">{asset.os || '-'}</span>
                                  </div>
                                  {!isPhone && (
                                    <div>
                                      <span className="text-[10px] text-gray-400 block font-semibold">MICROSOFT OFFICE:</span>
                                      <span className="font-bold">{asset.office || '-'}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-1.5 text-xs">
                                  {asset.vendorRef && (
                                    <div>
                                      <span className="text-[10px] text-gray-450 font-bold uppercase">
                                        {asset.ownershipType === 'OWNED' ? 'NO. INVOICE / PO:' : 'NO. KONTRAK VENDOR (BILLING):'}
                                      </span>
                                      <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-600 dark:text-slate-300 ml-1">
                                        {asset.vendorRef}
                                      </code>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <span className="text-[10px] text-gray-455 font-bold uppercase">
                                      {asset.ownershipType === 'OWNED' ? 'TANGGAL PEMBELIAN:' : 'PERIODE KONTRAK SEWA:'}
                                    </span>
                                    <span className="font-bold text-gray-700 dark:text-slate-300 ml-1.5">
                                      {formatDateYYMMDD(asset.rentalStart)}
                                      {asset.ownershipType !== 'OWNED' && ` s/d ${formatDateYYMMDD(asset.rentalEnd)}`}
                                    </span>
                                  </div>

                                  {asset.company && (
                                    <div>
                                      <span className="text-[10px] text-gray-455 font-bold uppercase">LOKASI KANTOR (FISIK):</span>
                                      <span className="font-bold text-gray-700 dark:text-slate-300 ml-1.5">
                                        {asset.company.name} ({asset.company.location})
                                      </span>
                                    </div>
                                  )}

                                  {asset.notes && (
                                    <div className="pt-2">
                                      <span className="text-[10px] text-gray-400 block font-semibold">CATATAN TAMBAHAN:</span>
                                      <p className="text-gray-500 dark:text-slate-400 bg-white/50 dark:bg-slate-955/20 p-2.5 rounded-lg border border-gray-150/50 dark:border-slate-855/50 whitespace-pre-wrap">
                                        {asset.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>

                              </div>

                              {/* Journey / Timeline Log */}
                              <div className="space-y-4">
                                <h5 className="font-extrabold text-[10px] uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                                  <History className="w-3.5 h-3.5 text-rose-500" />
                                  Riwayat Aset & Serah Terima (Journey)
                                </h5>

                                <div className="max-h-52 overflow-y-auto pr-2">
                                  {(!asset.journey || !asset.journey.trim()) ? (
                                    <p className="text-xs text-gray-400 italic py-2">Belum ada riwayat aktivitas tercatat.</p>
                                  ) : (
                                    <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-3 py-1 text-xs">
                                      {asset.journey.split('\n').filter(Boolean).map((line, idx) => (
                                        <div key={idx} className="relative">
                                          <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" />
                                          <div className="font-semibold text-gray-700 dark:text-slate-350">{line}</div>
                                        </div>
                                      ))}
                                    </div>
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
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {isEditMode 
                        ? `Pembaruan Data ${formOwnershipType === 'RENTAL' ? 'Aset Sewa' : 'Aset Milik'}` 
                        : `Daftarkan ${formOwnershipType === 'RENTAL' ? 'Aset Sewa' : 'Aset Milik'} Baru`}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                      {isEditMode 
                        ? 'Edit detail unit spesifikasi hardware, nomor seri, atau log riwayat serah terima.' 
                        : `Daftarkan unit ${formDeviceCategory === 'LAPTOP' ? 'laptop/PC' : 'smartphone'} baru lengkap dengan spesifikasi hardware.`}
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
                    <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800 text-red-750 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}
                  {/* Selectors for Type of Asset and Category */}
                  <div className="p-4 bg-gray-50/50 dark:bg-slate-900/35 rounded-2xl border border-gray-150 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    
                    {/* Ownership Selection */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Skema Kepemilikan Aset *</label>
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => setFormOwnershipType('RENTAL')}
                          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition ${formOwnershipType === 'RENTAL' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/10' : 'bg-white dark:bg-slate-955/40 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-350 hover:bg-slate-50/80 dark:hover:bg-slate-850/50'}`}
                        >
                          Sewa (Rental)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormOwnershipType('OWNED')}
                          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition ${formOwnershipType === 'OWNED' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/10' : 'bg-white dark:bg-slate-955/40 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-350 hover:bg-slate-50/80 dark:hover:bg-slate-850/50'}`}
                        >
                          Milik Sendiri
                        </button>
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Kategori Perangkat *</label>
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFormDeviceCategory('LAPTOP');
                            if (formOs === 'iOS 17' || formOs === 'iOS') setFormOs('Windows 11 Pro');
                          }}
                          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition ${formDeviceCategory === 'LAPTOP' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'bg-white dark:bg-slate-955/40 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-350 hover:bg-slate-50/80 dark:hover:bg-slate-850/50'}`}
                        >
                          Laptop / PC
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormDeviceCategory('SMARTPHONE');
                            setFormOs('iOS 17');
                            setFormOffice('None');
                          }}
                          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition ${formDeviceCategory === 'SMARTPHONE' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'bg-white dark:bg-slate-955/40 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-350 hover:bg-slate-50/80 dark:hover:bg-slate-850/50'}`}
                        >
                          Smartphone / Mobile
                        </button>
                      </div>
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Left Column: Specs */}
                    <div className="space-y-3.5">
                      <h4 className="text-[11px] font-extrabold text-rose-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5" />
                        Identitas & Spesifikasi Perangkat
                      </h4>

                      {/* Tag Aset (Suggested / Manual) */}
                      {formOwnershipType === 'OWNED' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">
                            Kode Tag Aset *
                          </label>
                          <input
                            type="text"
                            value={formAssetTag}
                            onChange={(e) => setFormAssetTag(e.target.value)}
                            placeholder="e.g. AST-MRA-1001"
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                            required={formOwnershipType === 'OWNED'}
                          />
                        </div>
                      )}

                      {/* Brand & Model */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">
                            Brand *
                          </label>
                          <input
                            type="text"
                            value={formBrand}
                            onChange={(e) => setFormBrand(e.target.value)}
                            placeholder="e.g. Lenovo, Dell, Apple"
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">
                            Model Unit *
                          </label>
                          <input
                            type="text"
                            value={formModel}
                            onChange={(e) => setFormModel(e.target.value)}
                            placeholder={formDeviceCategory === 'LAPTOP' ? 'e.g. ThinkPad L14 Gen 2' : 'e.g. iPhone 15 Pro'}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                            required
                          />
                        </div>
                      </div>

                      {/* Processor & OS */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            Tipe Processor
                          </label>
                          <input
                            type="text"
                            value={formProcessor}
                            onChange={(e) => setFormProcessor(e.target.value)}
                            placeholder={formDeviceCategory === 'LAPTOP' ? 'e.g. Intel Core i5 / Apple M3' : 'e.g. A16 Bionic / Snapdragon'}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            Sistem Operasi (OS)
                          </label>
                          <input
                            type="text"
                            value={formOs}
                            onChange={(e) => setFormOs(e.target.value)}
                            placeholder={formDeviceCategory === 'LAPTOP' ? 'e.g. Windows 11 Pro / macOS' : 'e.g. iOS 17 / Android 14'}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                          />
                        </div>
                      </div>

                      {/* RAM & Storage */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            Kapasitas RAM
                          </label>
                          <input
                            type="text"
                            value={formRam}
                            onChange={(e) => setFormRam(e.target.value)}
                            placeholder={formDeviceCategory === 'LAPTOP' ? 'e.g. 8GB / 16GB DDR4' : 'e.g. 6GB / 8GB RAM'}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            Penyimpanan (Storage)
                          </label>
                          <input
                            type="text"
                            value={formStorage}
                            onChange={(e) => setFormStorage(e.target.value)}
                            placeholder={formDeviceCategory === 'LAPTOP' ? 'e.g. 256GB SSD / 512GB NVMe' : 'e.g. 128GB / 256GB NVMe'}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                          />
                        </div>
                      </div>

                      {/* Office License & Notes */}
                      <div className="space-y-3.5">
                        {formDeviceCategory === 'LAPTOP' && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                              Lisensi MS Office
                            </label>
                            <input
                              type="text"
                              value={formOffice}
                              onChange={(e) => setFormOffice(e.target.value)}
                              placeholder="e.g. Office 2021 H&B / None"
                              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            Catatan Tambahan (Hardware Spec/SN)
                          </label>
                          <textarea
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            placeholder="Tulis SN, tipe layar, charger, atau kelengkapan fisik di sini..."
                            rows="3"
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition font-sans"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Rental & Entity Tagging */}
                    <div className="space-y-3.5">
                      
                      <h4 className="text-[11px] font-extrabold text-rose-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {formOwnershipType === 'RENTAL' ? 'Kontrak Sewa & Pengikatan' : 'Detail Pembelian & Pengikatan'}
                      </h4>

                      {/* Device Ref & Vendor Ref */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">
                            {formOwnershipType === 'RENTAL' 
                              ? (formDeviceCategory === 'LAPTOP' ? 'Device Ref Number (LP)*' : 'IMEI / Serial Number*')
                              : 'Serial Number (SN)'}
                          </label>
                          <input
                            type="text"
                            value={formDeviceRef}
                            onChange={(e) => setFormDeviceRef(e.target.value)}
                            placeholder={formOwnershipType === 'RENTAL' 
                              ? (formDeviceCategory === 'LAPTOP' ? 'e.g. LP10682' : 'e.g. IMEI / Serial')
                              : 'e.g. SN12345678 (Opsional)'}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition font-mono"
                            required={formOwnershipType === 'RENTAL'}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            {formOwnershipType === 'RENTAL' ? 'Vendor Billing Ref' : 'Invoice / PO Ref'}
                          </label>
                          <input
                            type="text"
                            value={formVendorRef}
                            onChange={(e) => setFormVendorRef(e.target.value)}
                            placeholder={formOwnershipType === 'RENTAL' ? 'e.g. ASN/20240318/1621/0001' : 'e.g. INV/2026/001 (Opsional)'}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                          />
                        </div>
                      </div>

                      {/* Rental Cost & Status */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">
                            {formOwnershipType === 'RENTAL' ? 'Biaya Sewa Bulanan (IDR) *' : 'Harga Pembelian (IDR) *'}
                          </label>
                          <input
                            type="number"
                            value={formRentalCost}
                            onChange={(e) => setFormRentalCost(e.target.value)}
                            placeholder={formOwnershipType === 'RENTAL' ? 'e.g. 450000' : 'e.g. 15000000'}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">
                            Status Aset *
                          </label>
                          <select
                            value={formStatus}
                            onChange={(e) => {
                              const nextStatus = e.target.value;
                              setFormStatus(nextStatus);
                              // If changed from ASSIGNED to AVAILABLE, auto reset Employee select
                              if (nextStatus !== 'ASSIGNED') {
                                setFormUserId('');
                              }
                            }}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                            required
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Lease Period (Start & End) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">
                            {formOwnershipType === 'RENTAL' ? 'Mulai Sewa *' : 'Tanggal Pembelian *'}
                          </label>
                          <input
                            type="date"
                            value={formRentalStart}
                            onChange={(e) => setFormRentalStart(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                            required
                          />
                        </div>

                        {formOwnershipType === 'RENTAL' ? (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider">
                              Selesai Sewa *
                            </label>
                            <input
                              type="date"
                              value={formRentalEnd}
                              onChange={(e) => setFormRentalEnd(e.target.value)}
                              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                              required={formOwnershipType === 'RENTAL'}
                            />
                          </div>
                        ) : (
                          <div className="space-y-1 opacity-50 select-none pointer-events-none">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-wider">
                              Selesai Sewa (N/A)
                            </label>
                            <input
                              type="text"
                              disabled
                              value="Milik Sendiri"
                              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-500"
                            />
                          </div>
                        )}
                      </div>

                      {/* Employee Assignee */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          Karyawan Pengguna {formStatus === 'ASSIGNED' && <span className="text-red-500 font-bold">*</span>}
                        </label>
                        <select
                          value={formUserId}
                          onChange={(e) => {
                            setFormUserId(e.target.value);
                            // If user is selected, auto set status to ASSIGNED
                            if (e.target.value) {
                              setFormStatus('ASSIGNED');
                            } else {
                              setFormStatus('AVAILABLE');
                            }
                          }}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                          required={formStatus === 'ASSIGNED'}
                        >
                          <option value="">-- Tanpa Karyawan (Simpan di Inventory IT) --</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} (NIP: {u.id} - {u.department})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Company Master & Branch */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            Entitas Perusahaan Induk
                          </label>
                          <select
                            value={formCompanyMasterId}
                            onChange={(e) => setFormCompanyMasterId(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                          >
                            <option value="">-- Pilih Entitas --</option>
                            {companyMasters.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            Lokasi Kantor Cabang
                          </label>
                          <select
                            value={formCompanyId}
                            onChange={(e) => setFormCompanyId(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                          >
                            <option value="">-- Pilih Cabang --</option>
                            {companies.map(c => (
                              <option key={c.id} value={c.id}>{c.name} - {c.location}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Timeline journey logs logger when edit */}
                      {isEditMode && (
                        <div className="space-y-1 pt-1.5 border-t border-gray-100 dark:border-slate-800">
                          <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                            <History className="w-3.5 h-3.5" />
                            Log Perubahan Riwayat (Journey)
                          </label>
                          <input
                            type="text"
                            value={formUpdateJourney}
                            onChange={(e) => setFormUpdateJourney(e.target.value)}
                            placeholder="e.g. Upgrade RAM jadi 16GB / LCD bergaris dikirim servis..."
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                          />
                        </div>
                      )}

                    </div>

                  </div>

                </div>

                {/* Footer buttons */}
                <div className="flex justify-end items-center gap-3 p-5 border-t border-gray-150 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-250 dark:border-slate-850 hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-655 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-500/10 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{isEditMode ? 'Simpan Perubahan' : 'Daftarkan Aset'}</span>
                  </button>
                </div>

              </form>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* BAST Print Preview Modal */}
      {isBastModalOpen && bastAsset && createPortal(
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 overflow-y-auto no-print">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-250 dark:border-slate-800/80 shadow-2xl w-full max-w-5xl overflow-hidden animate-slide-up flex flex-col md:flex-row print-modal-content">
              
              {/* Left Panel: Configuration (no-print) */}
              <div className="w-full md:w-80 bg-gray-50/50 dark:bg-slate-950/20 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-800 flex flex-col justify-between gap-5 no-print">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">BAST Generator</h3>
                      <p className="text-[10px] text-gray-400 font-semibold">Kustomisasi Dokumen Serah Terima</p>
                    </div>
                  </div>

                  <hr className="border-gray-200 dark:border-slate-800" />

                  {/* Inputs */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider block">No. BAST *</label>
                      <input
                        type="text"
                        value={bastDocNum}
                        onChange={(e) => setBastDocNum(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-955/40 border border-gray-250 dark:border-slate-800/80 text-gray-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider block">Yang Menyerahkan (IT Agent) *</label>
                      <input
                        type="text"
                        value={bastAgentName}
                        onChange={(e) => setBastAgentName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-955/40 border border-gray-250 dark:border-slate-800/80 text-gray-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-455 dark:text-slate-500 uppercase tracking-wider block">Catatan Kelengkapan Unit</label>
                      <textarea
                        value={bastNotes}
                        onChange={(e) => setBastNotes(e.target.value)}
                        placeholder="e.g. Kondisi mulus, kelengkapan: Charger Adaptor, Tas Laptop, Mouse wireless..."
                        rows="4"
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-955/40 border border-gray-250 dark:border-slate-800/80 text-gray-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handlePrintBast}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-500/10"
                    style={{ backgroundColor: '#f43f5e', color: '#ffffff' }}
                  >
                    Cetak BAST (Print)
                  </button>
                  <button
                    onClick={() => setIsBastModalOpen(false)}
                    className="w-full py-2 border border-gray-250 dark:border-slate-850 hover:bg-gray-100 dark:hover:bg-slate-800/50 text-gray-655 dark:text-slate-350 text-xs font-bold rounded-xl transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              {/* Right Panel: A4 Paper Preview Container */}
              <div className="flex-1 bg-gray-100/70 dark:bg-slate-950/10 p-6 overflow-y-auto max-h-[85vh] flex justify-center items-start print-preview-container">
                
                {/* Print area styles injected dynamically */}
                <style dangerouslySetInnerHTML={{ __html: `
                  @media print {
                    body {
                      background: white !important;
                      color: black !important;
                    }
                    /* Hide all web components when printing */
                    .no-print, .no-print * {
                      display: none !important;
                      visibility: hidden !important;
                    }
                    #root {
                      display: none !important;
                    }
                    /* Reset modal wrapper absolute/fixed positioning for pure print output */
                    .print-modal-wrapper {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      height: auto !important;
                      background: white !important;
                      z-index: 9999 !important;
                      overflow: visible !important;
                      display: block !important;
                      padding: 0 !important;
                      margin: 0 !important;
                      box-shadow: none !important;
                      border: none !important;
                    }
                    .print-modal-content {
                      border: none !important;
                      box-shadow: none !important;
                      width: 100% !important;
                      max-width: 100% !important;
                      background: white !important;
                      display: block !important;
                    }
                    .print-preview-container {
                      background: white !important;
                      padding: 0 !important;
                      margin: 0 !important;
                      max-height: none !important;
                      overflow: visible !important;
                      display: block !important;
                      width: 100% !important;
                    }
                    #bast-print-area {
                      display: block !important;
                      visibility: visible !important;
                      width: 100% !important;
                      max-width: 100% !important;
                      margin: 0 !important;
                      padding: 30px !important;
                      box-shadow: none !important;
                      border: none !important;
                      background: white !important;
                      color: black !important;
                      font-size: 11pt !important;
                      line-height: 1.4 !important;
                    }
                  }
                `}} />

                {/* BAST Print Preview Canvas */}
                <div 
                  id="bast-print-area" 
                  className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-800 p-8 md:p-12 shadow-md rounded-lg border border-gray-200 text-left font-sans leading-relaxed relative flex flex-col justify-between"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                      <div className="flex items-center gap-3">
                        <img 
                          src="/mra_logo.png" 
                          alt="MRA Group Logo" 
                          className="h-10 w-auto object-contain"
                        />
                        <div>
                          <h2 className="text-sm font-black tracking-tight text-black uppercase">{bastAsset.companyMaster?.name || 'PT MUGI REKSO ABADI'}</h2>
                          <p className="text-[10px] text-gray-600 font-semibold tracking-wider uppercase">IT Infrastructure & Support</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">IT Helpdesk Department</h4>
                        <p className="text-[9px] text-gray-500 font-semibold mt-0.5">Wisma MRA, Cilandak, Jakarta</p>
                      </div>
                    </div>

                    {/* Document Title */}
                    <div className="text-center space-y-1.5 my-6">
                      <h1 className="text-base font-black tracking-wide uppercase border-b border-slate-900 inline-block px-4 pb-0.5 text-black">
                        BERITA ACARA SERAH TERIMA PERANGKAT IT
                      </h1>
                      <p className="text-xs font-semibold text-gray-800">
                        Nomor: <span className="font-mono">{bastDocNum}</span>
                      </p>
                    </div>

                    {/* Intro Statement */}
                    <p className="text-xs text-justify mb-5 leading-relaxed text-black">
                      Pada hari ini, <span className="font-bold">{formatIndonesianDate(new Date())}</span>, kami yang bertanda tangan di bawah ini telah melakukan serah terima perangkat aset IT. Perangkat ini diserahkan untuk dipergunakan menunjang kegiatan operasional kantor MRA Group:
                    </p>

                    {/* Parties Grid */}
                    <div className="grid grid-cols-2 gap-6 text-xs mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <p className="font-extrabold uppercase tracking-wide text-gray-500 text-[9px] border-b border-slate-200 pb-1 mb-2">PIHAK PERTAMA (IT Support)</p>
                        <table className="w-full text-left space-y-1">
                          <tbody>
                            <tr>
                              <td className="w-16 font-semibold text-gray-500">Nama</td>
                              <td className="w-2">:</td>
                              <td className="font-bold text-black">{bastAgentName}</td>
                            </tr>
                            <tr>
                              <td className="font-semibold text-gray-500">Jabatan</td>
                              <td>:</td>
                              <td className="font-medium text-black">IT Infrastructure Support</td>
                            </tr>
                            <tr>
                              <td className="font-semibold text-gray-500">Departemen</td>
                              <td>:</td>
                              <td className="font-medium text-black">IT Department</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div>
                        <p className="font-extrabold uppercase tracking-wide text-gray-500 text-[9px] border-b border-slate-200 pb-1 mb-2">PIHAK KEDUA (Penerima)</p>
                        <table className="w-full text-left space-y-1">
                          <tbody>
                            <tr>
                              <td className="w-16 font-semibold text-gray-500">Nama</td>
                              <td className="w-2">:</td>
                              <td className="font-bold text-black">{bastAsset.user?.name || '-'}</td>
                            </tr>
                            <tr>
                              <td className="font-semibold text-gray-500">NIP / ID</td>
                              <td>:</td>
                              <td className="font-mono font-semibold text-black">{bastAsset.user?.id || '-'}</td>
                            </tr>
                            <tr>
                              <td className="font-semibold text-gray-500">Departemen</td>
                              <td>:</td>
                              <td className="font-medium text-black">{bastAsset.user?.department || '-'}</td>
                            </tr>
                            <tr>
                              <td className="font-semibold text-gray-500">Entitas</td>
                              <td>:</td>
                              <td className="font-bold text-slate-700">{bastAsset.companyMaster?.name || '-'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Hardware Specs Table */}
                    <div className="space-y-2 mb-6">
                      <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider text-black">Detail Perangkat & Spesifikasi:</p>
                      <table className="w-full border-collapse border border-slate-900 text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[9px]">
                            <th className="border border-slate-900 py-1.5 px-3">Komponen Aset</th>
                            <th className="border border-slate-900 py-1.5 px-3">Spesifikasi Detail / Keterangan</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-900 py-1.5 px-3 font-semibold bg-slate-50 text-black">Tipe Perangkat</td>
                            <td className="border border-slate-900 py-1.5 px-3 font-bold uppercase text-black font-mono">
                              {bastAsset.ownershipType === 'RENTAL' ? 'Sewa (Rental Device)' : 'Milik Sendiri (Owned)'}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-slate-900 py-1.5 px-3 font-semibold bg-slate-50 text-black">Brand & Model</td>
                            <td className="border border-slate-900 py-1.5 px-3 font-bold text-black">{bastAsset.brand} {bastAsset.model}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-900 py-1.5 px-3 font-semibold bg-slate-50 text-black">Processor / Chipset</td>
                            <td className="border border-slate-900 py-1.5 px-3 text-black">{bastAsset.processor || '-'}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-900 py-1.5 px-3 font-semibold bg-slate-50 text-black">RAM & Storage</td>
                            <td className="border border-slate-900 py-1.5 px-3 text-black">{bastAsset.ram || '-'} RAM | {bastAsset.storage || '-'} Storage</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-900 py-1.5 px-3 font-semibold bg-slate-50 text-black">Sistem Operasi (OS)</td>
                            <td className="border border-slate-900 py-1.5 px-3 text-black">{bastAsset.os || '-'}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-900 py-1.5 px-3 font-semibold bg-slate-50 text-black">Kode Tag Aset</td>
                            <td className="border border-slate-900 py-1.5 px-3 font-mono font-bold text-black">{bastAsset.assetTag}</td>
                          </tr>
                          {bastAsset.deviceRef && (
                            <tr>
                              <td className="border border-slate-900 py-1.5 px-3 font-semibold bg-slate-50 text-black">
                                {bastAsset.brand.toLowerCase() === 'apple' ? 'IMEI / Serial Number' : 'Device Reference Code'}
                              </td>
                              <td className="border border-slate-900 py-1.5 px-3 font-mono font-bold text-rose-600">{bastAsset.deviceRef}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Terms & Guidelines */}
                    <div className="space-y-1.5 mb-8">
                      <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider text-black">Syarat & Ketentuan Pemakaian:</p>
                      <ol className="list-decimal pl-4 space-y-1 text-[10px] text-gray-700 leading-normal text-justify">
                        <li>Perangkat ini merupakan aset operasional milik/sewa <span className="font-bold">{bastAsset.companyMaster?.name || 'PT Mugi Rekso Abadi'}</span> dan hanya dipergunakan untuk menunjang produktivitas kerja karyawan yang bersangkutan.</li>
                        <li>Pihak Kedua (Karyawan) wajib merawat, menjaga kebersihan, dan bertanggung jawab penuh atas keamanan fisik perangkat dari benturan, cairan, atau suhu ekstrim.</li>
                        <li>Apabila terjadi kehilangan perangkat akibat pencurian atau kelalaian pribadi, Karyawan wajib melampirkan Surat Laporan Kehilangan dari Kepolisian dan bersedia menanggung denda penggantian sesuai dengan kebijakan manajemen.</li>
                        <li>Karyawan wajib mengembalikan perangkat ini secara lengkap (termasuk adaptor charger, tas, dll.) ke departemen IT Support apabila yang bersangkutan mengundurkan diri (resign), mengalami pemutusan hubungan kerja, atau masa kontrak sewa perangkat telah berakhir.</li>
                      </ol>
                    </div>

                    {/* Condition Notes */}
                    {bastNotes && (
                      <div className="mb-8 border border-dashed border-slate-400 p-2.5 rounded-lg bg-slate-50/50 text-[10px] text-black">
                        <span className="font-extrabold uppercase block text-gray-500 tracking-wider mb-1">Catatan Serah Terima / Kelengkapan Tambahan:</span>
                        <p className="italic text-slate-700">{bastNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Signatures Area */}
                  <div>
                    <div className="grid grid-cols-2 gap-12 text-center text-xs mt-8">
                      <div className="flex flex-col items-center">
                        <p className="font-bold text-black">PIHAK PERTAMA</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Yang Menyerahkan,</p>
                        {/* Guaranteed non-collapsing signature spacer */}
                        <div style={{ height: '80px', minHeight: '80px', flexShrink: 0 }} className="w-full flex items-center justify-center">&nbsp;</div>
                        <div className="space-y-1">
                          <p className="font-bold underline text-black">{bastAgentName}</p>
                          <p className="text-[9px] text-gray-500">IT Infrastructure Support</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="font-bold text-black">PIHAK KEDUA</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Yang Menerima,</p>
                        {/* Guaranteed non-collapsing signature spacer */}
                        <div style={{ height: '80px', minHeight: '80px', flexShrink: 0 }} className="w-full flex items-center justify-center">&nbsp;</div>
                        <div className="space-y-1">
                          <p className="font-bold underline text-black">{bastAsset.user?.name || '-'}</p>
                          <p className="text-[9px] text-gray-500">NIP: {bastAsset.user?.id || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-[8px] text-gray-400 mt-12 border-t border-gray-150 pt-2 font-mono">
                      Dicetak secara otomatis melalui Sistem Helpdesk IT MRA Group pada {new Date().toLocaleString('id-ID')}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
