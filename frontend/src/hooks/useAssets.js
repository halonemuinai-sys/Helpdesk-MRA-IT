import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { API_URL } from '../components/assets/constants';

const isSmartphone = (asset) => {
  const brand = (asset.brand || '').toLowerCase();
  const model = (asset.model || '').toLowerCase();
  const os = (asset.os || '').toLowerCase();
  const ram = (asset.ram || '').toLowerCase();
  return (brand === 'apple' && model.includes('iphone')) ||
         os.includes('ios') || os.includes('android') ||
         brand === 'samsung' || brand === 'oppo' || brand === 'vivo' ||
         brand === 'xiaomi' || brand === 'realme' || brand === 'infinix' ||
         brand === 'iqoo' || parseInt(ram, 10) === 4;
};

const isPrinter = (asset) => {
  const brand = (asset.brand || '').toLowerCase();
  const model = (asset.model || '').toLowerCase();
  const os = (asset.os || '').toLowerCase();
  const deviceRef = (asset.deviceRef || '').toLowerCase();
  return os === 'printer os' || deviceRef.startsWith('prn') || model.includes('printer') || brand.includes('epson') || brand.includes('canon') || brand.includes('fuji') || brand.includes('brother') || brand.includes('hp laserjet') || brand.includes('smart tank');
};

export default function useAssets({ token, user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const formatNumberForInput = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const raw = value.toString().replace(/\D/g, '');
    if (!raw) return '';
    return parseInt(raw, 10).toLocaleString('id-ID');
  };

  // Master data
  const [assets, setAssets] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyMasters, setCompanyMasters] = useState([]);
  const [users, setUsers] = useState([]);

  // User dropdown (searchable)
  const [userSearchText, setUserSearchText] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCompanyMasterId, setSelectedCompanyMasterId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Manual-load flag
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  // Sort — defaults assetTag asc
  const [sortConfig, setSortConfig] = useState({ key: 'assetTag', direction: 'asc' });

  // KPI stats
  const [kpiStats, setKpiStats] = useState({
    totalAssets: 0, assignedCount: 0, availableCount: 0, maintenanceCount: 0,
    totalMonthlyRental: 0, expiredLeasesCount: 0, nearExpiryLeasesCount: 0,
    rentalCount: 0, ownedCount: 0
  });

  // UI state
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [viewingAsset, setViewingAsset] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form fields
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
  const [formVendor, setFormVendor] = useState('');
  const [formCompanyId, setFormCompanyId] = useState('');
  const [formCompanyMasterId, setFormCompanyMasterId] = useState('');
  const [formOwnershipType, setFormOwnershipType] = useState('RENTAL');
  const [formDeviceCategory, setFormDeviceCategory] = useState('LAPTOP');

  // BAST state
  const [isBastModalOpen, setIsBastModalOpen] = useState(false);
  const [bastAsset, setBastAsset] = useState(null);
  const [bastDocNum, setBastDocNum] = useState('');
  const [bastAgentName, setBastAgentName] = useState('');
  const [bastNotes, setBastNotes] = useState('');

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId) return;
    setSearchParams({}, { replace: true });
    fetch(`${API_URL}/assets/${openId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(asset => { if (asset) { setViewingAsset(asset); setIsViewDrawerOpen(true); } })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownRef]);

  // ── Fetchers ───────────────────────────────────────────────────────────────

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/assets/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setKpiStats(await res.json());
    } catch (err) {
      console.error('Gagal memuat statistik KPI:', err);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const r = await fetch(`${API_URL}/companies/master`, { headers });
        if (r.ok) setCompanyMasters(await r.json());
      } catch (e) { console.error('Gagal memuat data perusahaan induk:', e); }

      try {
        const r = await fetch(`${API_URL}/companies`, { headers });
        if (r.ok) setCompanies(await r.json());
      } catch (e) { console.error('Gagal memuat data kantor cabang:', e); }

      try {
        const r = await fetch(`${API_URL}/users`, { headers });
        if (r.ok) setUsers(await r.json());
      } catch (e) { console.error('Gagal memuat data karyawan:', e); }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async (currentSearch = searchQuery, { silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const headers = { Authorization: `Bearer ${token}` };
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedCompanyMasterId) params.append('companyMasterId', selectedCompanyMasterId);
      if (currentSearch) params.append('search', currentSearch);
      if (selectedCategory) params.append('category', selectedCategory);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_URL}/assets${qs}`, { headers });
      if (!res.ok) throw new Error('Gagal memuat data inventaris aset.');
      setAssets(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
      setAssetsLoaded(true);
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRefreshData = async ({ silent = false } = {}) => {
    await Promise.all([fetchStats(), fetchAssets(searchQuery, { silent })]);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedCompanyMasterId('');
    setSelectedCategory('');
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setFormId('');
    setFormAssetTag(`AST-MRA-${Math.floor(1000 + Math.random() * 9000)}`);
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
    const twoYears = new Date();
    twoYears.setFullYear(twoYears.getFullYear() + 2);
    setFormRentalEnd(twoYears.toISOString().split('T')[0]);
    setFormNotes('');
    setFormUpdateJourney('');
    setFormUserId('');
    setFormVendor('');
    setUserSearchText('');
    setIsUserDropdownOpen(false);
    setFormCompanyId(companies[0]?.id || '');
    setFormCompanyMasterId(companyMasters[0]?.id || '');
    setFormOwnershipType('RENTAL');
    setFormDeviceCategory('LAPTOP');
    setFormError(null);
    setIsModalOpen(true);
  };

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
    setFormRentalCost(formatNumberForInput(asset.rentalCost));
    setFormRentalStart(asset.rentalStart.split('T')[0]);
    setFormRentalEnd(asset.rentalEnd.split('T')[0]);
    setFormNotes(asset.notes || '');
    setFormUpdateJourney('');
    setFormUserId(asset.userId || '');
    setFormVendor(asset.vendor || '');
    setUserSearchText('');
    setIsUserDropdownOpen(false);
    setFormCompanyId(asset.companyId || '');
    setFormCompanyMasterId(asset.companyMasterId || '');
    if (isPrinter(asset)) {
      setFormDeviceCategory('PRINTER');
    } else if (isSmartphone(asset)) {
      setFormDeviceCategory('SMARTPHONE');
    } else {
      setFormDeviceCategory('LAPTOP');
    }
    setFormOwnershipType(asset.ownershipType || 'RENTAL');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenViewDrawer = (asset) => {
    setViewingAsset(asset);
    setIsViewDrawerOpen(true);
  };

  const handleOpenBastModal = (asset) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    setBastAsset(asset);
    setBastDocNum(`BAST/MRA/${year}/${month}/${rand}`);
    setBastAgentName(user ? user.name : 'IT Support Specialist');
    setBastNotes(asset.notes || '');
    setIsBastModalOpen(true);
  };

  const handlePrintBast = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await fetch(`${API_URL}/assets/${bastAsset.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          notes: bastNotes,
          updateJourney: `Dicetak BAST (${bastDocNum}) oleh IT Agent: ${bastAgentName}. Kelengkapan: ${bastNotes || '-'}`
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal menyimpan catatan BAST ke database.');
      }
      const updatedAsset = await res.json();
      setBastAsset(prev => prev ? { ...prev, notes: updatedAsset.notes, journey: updatedAsset.journey } : null);
      await handleRefreshData();
      window.print();
    } catch (error) {
      console.error('Failed to save BAST details to database:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Catatan',
        text: error.message || 'Terjadi kesalahan saat menyimpan catatan BAST ke database. BAST tetap dapat dicetak.',
        confirmButtonColor: '#f43f5e',
      }).then(() => { window.print(); });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    let finalAssetTag = formAssetTag;
    let finalRentalStart = formRentalStart;
    let finalRentalEnd = formRentalEnd;
    let finalDeviceRef = formDeviceRef ? formDeviceRef.trim() : null;

    if (formDeviceCategory === 'PRINTER' && finalDeviceRef && !finalDeviceRef.toUpperCase().startsWith('PRN')) {
      finalDeviceRef = 'PRN-' + finalDeviceRef;
    }

    if (formOwnershipType === 'OWNED') {
      if (!formAssetTag || !formBrand || !formModel || !formRentalStart || formRentalCost === '') {
        setFormError('Kolom bertanda bintang (*) wajib diisi.');
        setSubmitting(false);
        return;
      }
      finalRentalEnd = formRentalStart;
    } else {
      if (!finalDeviceRef || !formBrand || !formModel || formRentalCost === '' || !formRentalStart || !formRentalEnd) {
        setFormError('Kolom bertanda bintang (*) wajib diisi.');
        setSubmitting(false);
        return;
      }
      finalAssetTag = finalDeviceRef;
      if (new Date(formRentalStart) > new Date(formRentalEnd)) {
        setFormError('Tanggal Sewa Berakhir harus setelah Tanggal Sewa Dimulai.');
        setSubmitting(false);
        return;
      }
    }

    try {
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const payload = {
        assetTag: finalAssetTag.trim(),
        deviceRef: finalDeviceRef,
        vendorRef: formOwnershipType === 'RENTAL' ? (formVendorRef || null) : 'Milik Sendiri',
        brand: formBrand, model: formModel,
        processor: formDeviceCategory === 'PRINTER' ? 'None' : (formProcessor || null),
        ram: formDeviceCategory === 'PRINTER' ? 'None' : (formRam || null),
        storage: formDeviceCategory === 'PRINTER' ? 'None' : (formStorage || null),
        os: formDeviceCategory === 'PRINTER' ? 'Printer OS' : (formOs || null),
        office: formDeviceCategory === 'LAPTOP' ? (formOffice || null) : 'None',
        ownershipType: formOwnershipType, status: formStatus,
        rentalCost: parseFloat(formRentalCost.toString().replace(/\./g, '')) || 0,
        rentalStart: new Date(finalRentalStart).toISOString(),
        rentalEnd: new Date(finalRentalEnd).toISOString(),
        notes: formNotes || null,
        userId: formUserId || null,
        companyId: formCompanyId ? parseInt(formCompanyId) : null,
        companyMasterId: formCompanyMasterId ? parseInt(formCompanyMasterId) : null,
        vendor: formVendor || null,
        updateJourney: formUpdateJourney || null
      };

      const url = isEditMode ? `${API_URL}/assets/${formId}` : `${API_URL}/assets`;
      const res = await fetch(url, { method: isEditMode ? 'PUT' : 'POST', headers, body: JSON.stringify(payload) });
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
      handleRefreshData({ silent: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Gagal menghapus aset.');
          }
          Swal.fire({ icon: 'success', title: 'Dihapus!', text: 'Data aset berhasil dihapus dari inventaris.', confirmButtonColor: '#f43f5e', timer: 1500 });
          handleRefreshData();
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Gagal!', text: err.message, confirmButtonColor: '#f43f5e' });
        }
      }
    });
  };

  // ── Formatters ─────────────────────────────────────────────────────────────

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
      return `${parts[0].slice(-2)}/${parts[1]}/${parts[2]}`;
    } catch (e) { return '-'; }
  };

  const formatIndonesianDate = (date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const d = new Date(date);
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

    // ── Computed ───────────────────────────────────────────────────────────────

  const filteredAssets = assets.filter(asset => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      asset.brand.toLowerCase().includes(q) ||
      asset.model.toLowerCase().includes(q) ||
      asset.assetTag.toLowerCase().includes(q) ||
      (asset.deviceRef && asset.deviceRef.toLowerCase().includes(q)) ||
      (asset.vendorRef && asset.vendorRef.toLowerCase().includes(q)) ||
      (asset.vendor && asset.vendor.toLowerCase().includes(q)) ||
      (asset.user && asset.user.name.toLowerCase().includes(q)) ||
      (asset.notes && asset.notes.toLowerCase().includes(q));
    const matchesStatus = selectedStatus === '' || asset.status === selectedStatus;
    const matchesMaster = selectedCompanyMasterId === '' || asset.companyMasterId === parseInt(selectedCompanyMasterId);
    const matchesCategory = selectedCategory === '' || 
      (selectedCategory === 'SMARTPHONE' && isSmartphone(asset)) ||
      (selectedCategory === 'PRINTER' && isPrinter(asset)) ||
      (selectedCategory === 'LAPTOP' && !isSmartphone(asset) && !isPrinter(asset));
    return matchesSearch && matchesStatus && matchesMaster && matchesCategory;
  });

  const sortValueGetters = {
    assetTag: (a) => a.assetTag || '',
    model: (a) => `${a.brand || ''} ${a.model || ''}`.trim(),
    companyMaster: (a) => a.companyMaster?.name || '',
    user: (a) => a.user?.name || '',
    rentalCost: (a) => a.rentalCost || 0,
    rentalEnd: (a) => a.rentalEnd ? new Date(a.rentalEnd).getTime() : 0,
    status: (a) => a.status || ''
  };

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    const getValue = sortValueGetters[sortConfig.key];
    if (!getValue) return 0;
    const valA = getValue(a);
    const valB = getValue(b);
    const comparison = typeof valA === 'number' && typeof valB === 'number'
      ? valA - valB
      : String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  return {
    // data
    assets, companies, companyMasters, users,
    // loading
    loading, error,
    // filters
    searchQuery, setSearchQuery,
    selectedStatus, setSelectedStatus,
    selectedCompanyMasterId, setSelectedCompanyMasterId,
    selectedCategory, setSelectedCategory,
    assetsLoaded,
    // sort
    sortConfig, handleSort,
    // kpi
    kpiStats,
    // computed
    filteredAssets, sortedAssets, isSmartphone,
    // ui
    isViewDrawerOpen, setIsViewDrawerOpen,
    viewingAsset, setViewingAsset,
    isModalOpen, setIsModalOpen,
    isEditMode, submitting, formError,
    // form fields
    formId, formAssetTag, setFormAssetTag,
    formDeviceRef, setFormDeviceRef,
    formVendorRef, setFormVendorRef,
    formBrand, setFormBrand,
    formModel, setFormModel,
    formProcessor, setFormProcessor,
    formRam, setFormRam,
    formStorage, setFormStorage,
    formOs, setFormOs,
    formOffice, setFormOffice,
    formStatus, setFormStatus,
    formRentalCost, setFormRentalCost,
    formRentalStart, setFormRentalStart,
    formRentalEnd, setFormRentalEnd,
    formNotes, setFormNotes,
    formUpdateJourney, setFormUpdateJourney,
    formUserId, setFormUserId,
    formVendor, setFormVendor,
    formCompanyId, setFormCompanyId,
    formCompanyMasterId, setFormCompanyMasterId,
    formOwnershipType, setFormOwnershipType,
    formDeviceCategory, setFormDeviceCategory,
    // user dropdown
    userSearchText, setUserSearchText,
    isUserDropdownOpen, setIsUserDropdownOpen,
    userDropdownRef,
    // bast
    isBastModalOpen, setIsBastModalOpen,
    bastAsset, bastDocNum, setBastDocNum,
    bastAgentName, setBastAgentName,
    bastNotes, setBastNotes,
    // handlers
    handleRefreshData, handleResetFilters,
    handleOpenAddModal, handleOpenEditModal, handleOpenViewDrawer,
    handleOpenBastModal, handlePrintBast,
    handleSubmit, handleDelete,
    // formatters
    formatRupiah, formatDateYYMMDD, formatIndonesianDate, formatNumberForInput,
  };
}
