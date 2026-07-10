import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { BILLING_DIVISORS } from '../components/subscriptions/constants';
import { printSubscriptionReport } from '../components/subscriptions/subscriptionPrintReport';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function useSubscriptions({ token }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCompanyMasterId, setSelectedCompanyMasterId] = useState('');

  // UI
  const [expandedRows, setExpandedRows] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isReplacementMode, setIsReplacementMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  // Form fields
  const [formId, setFormId] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formVendor, setFormVendor] = useState('');
  const [formName, setFormName] = useState('');
  const [formBillingCycle, setFormBillingCycle] = useState('1 Tahun');
  const [formCost, setFormCost] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formEvidenceLink, setFormEvidenceLink] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formUpdateJourney, setFormUpdateJourney] = useState('');
  const [formCompanyId, setFormCompanyId] = useState('');
  const [replacedSubscriptionId, setReplacedSubscriptionId] = useState(null);

  const headers = { 'Authorization': `Bearer ${token}` };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // ── Formatters ────────────────────────────────────────────────────────────

  const formatNumberForInput = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const raw = value.toString().replace(/\D/g, '');
    if (!raw) return '';
    return parseInt(raw, 10).toLocaleString('id-ID');
  };

  const formatRupiah = (value) => {
    if (value === undefined || value === null) return 'Rp 0';
    return 'Rp ' + Number(value).toLocaleString('id-ID');
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/companies/master`, { headers });
      if (!res.ok) throw new Error('Gagal memuat data perusahaan.');
      const data = await res.json();
      setCompanies(data);
      setFormCompanyId(data[0]?.id || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedCompanyMasterId) params.append('companyMasterId', selectedCompanyMasterId);
      if (searchQuery) params.append('search', searchQuery);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_URL}/subscriptions${qs}`, { headers });
      if (!res.ok) throw new Error('Gagal memuat data subskripsi IT.');
      const data = await res.json();
      setSubscriptions(data);
      setHasProcessed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedStatus('');
    setSelectedCompanyMasterId('');
    setSearchQuery('');
    setSubscriptions([]);
    setHasProcessed(false);
  };

  const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Modal openers ─────────────────────────────────────────────────────────

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setIsReplacementMode(false);
    setFormId('');
    setFormCategory('');
    setFormVendor('');
    setFormName('');
    setFormBillingCycle('1 Tahun');
    setFormCost('');
    const today = new Date().toISOString().split('T')[0];
    setFormStartDate(today);
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    setFormExpiryDate(oneYearLater.toISOString().split('T')[0]);
    setFormStatus('ACTIVE');
    setFormEvidenceLink('');
    setFormNotes('');
    setFormUpdateJourney('');
    setFormCompanyId(companies[0]?.id || '');
    setReplacedSubscriptionId(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sub) => {
    setIsEditMode(true);
    setIsReplacementMode(false);
    setFormId(sub.id);
    setFormCategory(sub.category);
    setFormVendor(sub.vendor);
    setFormName(sub.name);
    setFormBillingCycle(sub.billingCycle);
    setFormCost(formatNumberForInput(sub.cost));
    setFormStartDate(sub.startDate.split('T')[0]);
    setFormExpiryDate(sub.expiryDate.split('T')[0]);
    setFormStatus(sub.status);
    setFormEvidenceLink(sub.evidenceLink || '');
    setFormNotes(sub.notes || '');
    setFormUpdateJourney('');
    setFormCompanyId(sub.companyMasterId || '');
    setReplacedSubscriptionId(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenReplacementModal = (sub) => {
    setIsEditMode(false);
    setIsReplacementMode(true);
    setFormId('');
    setFormCategory(sub.category);
    setFormVendor(sub.vendor);
    setFormName(sub.name + ' (Baru)');
    setFormBillingCycle(sub.billingCycle);
    setFormCost(formatNumberForInput(sub.cost));
    const oldExpiry = new Date(sub.expiryDate);
    const newStart = new Date(oldExpiry.getTime() + 24 * 60 * 60 * 1000);
    setFormStartDate(newStart.toISOString().split('T')[0]);
    const newExpiry = new Date(newStart);
    if (sub.billingCycle.includes('Tahun')) {
      newExpiry.setFullYear(newExpiry.getFullYear() + parseInt(sub.billingCycle));
    } else {
      newExpiry.setMonth(newExpiry.getMonth() + parseInt(sub.billingCycle));
    }
    setFormExpiryDate(newExpiry.toISOString().split('T')[0]);
    setFormStatus('ACTIVE');
    setFormEvidenceLink('');
    setFormNotes(`Menggantikan kontrak lama: ID ${sub.id.substring(0, 8)}`);
    setFormUpdateJourney(`Kontrak baru dibuat menggantikan ID ${sub.id.substring(0, 8)}`);
    setFormCompanyId(sub.companyMasterId || '');
    setReplacedSubscriptionId(sub.id);
    setFormError(null);
    setIsModalOpen(true);
  };

  // ── Submit / Delete ───────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    if (!formCategory || !formVendor || !formName || !formBillingCycle || !formCost || !formStartDate || !formExpiryDate || !formCompanyId) {
      setFormError('Semua kolom bertanda bintang (*) wajib diisi.');
      setSubmitting(false);
      return;
    }
    if (new Date(formStartDate) > new Date(formExpiryDate)) {
      setFormError('Tanggal Kedaluwarsa harus setelah Tanggal Mulai.');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        category: formCategory,
        vendor: formVendor,
        name: formName,
        billingCycle: formBillingCycle,
        cost: parseFloat(formCost.toString().replace(/\./g, '')) || 0,
        startDate: new Date(formStartDate).toISOString(),
        expiryDate: new Date(formExpiryDate).toISOString(),
        status: formStatus,
        evidenceLink: formEvidenceLink || null,
        notes: formNotes || null,
        companyMasterId: parseInt(formCompanyId),
        replacedSubscriptionId,
        updateJourney: formUpdateJourney || null,
      };

      const fullHeaders = { ...headers, 'Content-Type': 'application/json' };
      const res = isEditMode
        ? await fetch(`${API_URL}/subscriptions/${formId}`, { method: 'PUT', headers: fullHeaders, body: JSON.stringify(payload) })
        : await fetch(`${API_URL}/subscriptions`, { method: 'POST', headers: fullHeaders, body: JSON.stringify(payload) });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal menyimpan data.');

      setIsModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: isEditMode ? 'Data Diperbarui!' : isReplacementMode ? 'Kontrak Baru Aktif!' : 'Layanan Terdaftar!',
        text: `Layanan ${formName} berhasil disimpan.`,
        confirmButtonColor: '#f43f5e',
        timer: 2000,
      });
      fetchSubscriptions();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (sub) => {
    Swal.fire({
      title: 'Apakah Anda Yakin?',
      text: `Menghapus kontrak ${sub.name} dari database. Semua riwayat perpanjangan terkait akan dihapus!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await fetch(`${API_URL}/subscriptions/${sub.id}`, { method: 'DELETE', headers });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Gagal menghapus layanan.');
        }
        Swal.fire({ icon: 'success', title: 'Dihapus!', text: 'Data layanan berhasil dihapus.', confirmButtonColor: '#f43f5e', timer: 1500 });
        fetchSubscriptions();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal!', text: err.message, confirmButtonColor: '#f43f5e' });
      }
    });
  };

  // ── Computed ──────────────────────────────────────────────────────────────

  const now = new Date();
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE');

  const expiredCount = subscriptions.filter(s => s.status === 'ACTIVE' && new Date(s.expiryDate) < now).length;

  const nearExpiryCount = subscriptions.filter(s => {
    if (s.status !== 'ACTIVE') return false;
    const diffDays = Math.ceil((new Date(s.expiryDate) - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const estMonthlyBudget = activeSubs.reduce((acc, sub) => acc + sub.cost / (BILLING_DIVISORS[sub.billingCycle] || 1), 0);

  const filteredSubs = subscriptions.filter(sub => {
    const matchesSearch =
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.notes && sub.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || sub.category === selectedCategory;
    const matchesCompany = !selectedCompanyMasterId || sub.companyMasterId === parseInt(selectedCompanyMasterId, 10);
    let matchesStatus = true;
    if (selectedStatus === 'ACTIVE') matchesStatus = sub.status === 'ACTIVE' && new Date(sub.expiryDate) >= now;
    else if (selectedStatus === 'EXPIRED') matchesStatus = sub.status === 'EXPIRED' || (sub.status === 'ACTIVE' && new Date(sub.expiryDate) < now);
    else if (selectedStatus === 'INACTIVE') matchesStatus = sub.status === 'INACTIVE';
    return matchesSearch && matchesCategory && matchesCompany && matchesStatus;
  });

  const handlePrintReport = () => printSubscriptionReport({ filteredSubs, now });

  return {
    // data
    subscriptions, companies, loading, error,
    // filters
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    selectedStatus, setSelectedStatus,
    selectedCompanyMasterId, setSelectedCompanyMasterId,
    // ui
    expandedRows, hasProcessed,
    isModalOpen, setIsModalOpen,
    isEditMode, isReplacementMode,
    submitting, formError,
    // form fields
    formId, formCategory, setFormCategory,
    formVendor, setFormVendor,
    formName, setFormName,
    formBillingCycle, setFormBillingCycle,
    formCost, setFormCost,
    formStartDate, setFormStartDate,
    formExpiryDate, setFormExpiryDate,
    formStatus, setFormStatus,
    formEvidenceLink, setFormEvidenceLink,
    formNotes, setFormNotes,
    formUpdateJourney, setFormUpdateJourney,
    formCompanyId, setFormCompanyId,
    // handlers
    fetchSubscriptions, handleResetFilters, toggleRow,
    handleOpenAddModal, handleOpenEditModal, handleOpenReplacementModal,
    handleSubmit, handleDelete, handlePrintReport,
    // formatters
    formatRupiah, formatNumberForInput,
    // computed
    now, activeSubs, expiredCount, nearExpiryCount, estMonthlyBudget, filteredSubs,
  };
}
