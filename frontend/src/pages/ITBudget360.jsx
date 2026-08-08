import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Building2,
  Calendar,
  Layers,
  PieChart,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Laptop,
  Wifi,
  Package,
  ArrowUpRight,
  Filter,
  DollarSign,
  Users,
  ChevronRight,
  Sparkles,
  Sliders,
  Check,
  Edit2,
  Trash2,
  X,
  FileSpreadsheet,
  Save,
  Tag,
  BarChart2
} from 'lucide-react';
import PendingProcessPlaceholder from '../components/PendingProcessPlaceholder';
import BudgetTaggingModal from '../components/budgets/BudgetTaggingModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MRA_BRANDS = [
  'Bvlgari',
  'Wiggle Wiggle',
  'Cosmopolitan',
  "Harper's Bazaar",
  'Her World',
  'Hard Rock FM',
  'Trax FM',
  'iRadio',
  'Brava Radio',
  'Häagen-Dazs',
  'Hard Rock Cafe',
  'Parentalk',
  'MRA Head Office / HQ'
];

const DEPARTMENTS = [
  'Sales Advisor / Store Staff',
  'VIP Sales Bvlgari',
  'Store Operations',
  'Finance & Accounting',
  'General Affairs',
  'IT Department',
  'Marketing & CRM',
  'Executive / Directors'
];

const formatRupiah = (val) => {
  if (val === undefined || val === null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
};

const formatCompactRupiah = (val) => {
  if (val === undefined || val === null || val === 0) return '-';
  const num = Math.abs(val);
  let formatted = '';
  if (num >= 1_000_000_000) {
    formatted = (num / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'M';
  } else if (num >= 1_000_000) {
    formatted = (num / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'Jt';
  } else if (num >= 1_000) {
    formatted = (num / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + 'Rb';
  } else {
    formatted = num.toLocaleString('id-ID');
  }
  return val < 0 ? `-${formatted}` : formatted;
};

export default function ITBudget360() {
  const token = localStorage.getItem('token');

  // Filters & State
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedCompanyMasterId, setSelectedCompanyMasterId] = useState('');
  const [viewMode, setViewMode] = useState('accrual'); // 'accrual' (Prorated) vs 'cash' (Cash Outflow)
  const [activeTab, setActiveTab] = useState('cost-overview'); // 'cost-overview' | 'summary' | 'projects' | 'departmental' | 'consolidation' | 'pillar-recap'

  // Data State
  const [companies, setCompanies] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [projectBudgets, setProjectBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Search & Filter for Projects Tab
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('');

  // Modal / Drawer Form State (Input & Edit Budget)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formProjectName, setFormProjectName] = useState('');
  const [formCategory, setFormCategory] = useState('DIGITAL_TRANSFORMATION');
  const [formCompanyMasterId, setFormCompanyMasterId] = useState('');
  const [formBrand, setFormBrand] = useState('Bvlgari');
  const [formDepartment, setFormDepartment] = useState('Store Operations');
  const [formFiscalYear, setFormFiscalYear] = useState('2026');
  const [formBudgetType, setFormBudgetType] = useState('CAPEX');
  const [formAccountType, setFormAccountType] = useState('Utilities');
  const [formAllocatedBudget, setFormAllocatedBudget] = useState('');
  const [formActualCost, setFormActualCost] = useState('0');
  const [formPriority, setFormPriority] = useState('MEDIUM');
  const [formStatus, setFormStatus] = useState('PROPOSED');
  const [formVendor, setFormVendor] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Expense & Tagging Modal State
  const [isTaggingModalOpen, setIsTaggingModalOpen] = useState(false);
  const [taggingBudget, setTaggingBudget] = useState(null);

  const handleOpenTaggingModal = (budget) => {
    setTaggingBudget(budget);
    setIsTaggingModalOpen(true);
  };

  const handleUpdateBudgetFromTagging = (updatedBudget) => {
    setProjectBudgets((prev) =>
      prev.map((item) => (item.id === updatedBudget.id ? updatedBudget : item))
    );
    setTaggingBudget(updatedBudget);
    handleLoadData();
  };

  useEffect(() => {
    fetchCompanyMasters();
  }, []);

  const fetchCompanyMasters = async () => {
    try {
      const res = await fetch(`${API_URL}/companies/masters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setCompanies(data);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to fetch company masters:', err);
    }
    // Fallback 4 PT MRA Utama (Presisi 100% Sesuai Database)
    setCompanies([
      { id: 14, name: 'PT Mogems Putri International' },
      { id: 15, name: 'PT Permata Landmarq Abadi' },
      { id: 13, name: 'PT Jemma Putri International' },
      { id: 19, name: 'PT Amanda Arumdhani Aishwarya' }
    ]);
  };

  const handleLoadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch IT Budget 360 Report
      const params = new URLSearchParams();
      if (selectedYear) params.append('year', selectedYear);
      if (selectedCompanyMasterId) params.append('companyMasterId', selectedCompanyMasterId);
      if (viewMode) params.append('viewMode', viewMode);

      const repRes = await fetch(`${API_URL}/reports/it-budget-360?${params.toString()}`, { headers });
      if (!repRes.ok) throw new Error('Gagal memuat laporan IT Budget 360.');
      const repJson = await repRes.json();
      setReportData(repJson);

      // 2. Fetch Project Budgets List
      const projParams = new URLSearchParams();
      if (selectedYear) projParams.append('fiscalYear', selectedYear);
      if (selectedCompanyMasterId) projParams.append('companyMasterId', selectedCompanyMasterId);

      const projRes = await fetch(`${API_URL}/budgets?${projParams.toString()}`, { headers });
      if (projRes.ok) {
        const projJson = await projRes.json();
        setProjectBudgets(projJson);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  };

  const handleGenerateBaseline2027 = async () => {
    if (!window.confirm('Generate baseline anggaran rutin 2027 dari kontrak Subskripsi, ISP, dan Rental yang aktif?')) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/budgets/generate-baseline-2027`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        handleLoadData();
      } else {
        throw new Error('Gagal me-generate baseline.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for NEW budget item
  const handleOpenNewModal = () => {
    setEditingId(null);
    setFormProjectName('');
    setFormCategory('DIGITAL_TRANSFORMATION');
    setFormCompanyMasterId(companies.length > 0 ? companies[0].id : '');
    setFormBrand('Bvlgari');
    setFormDepartment('Store Operations');
    setFormFiscalYear(selectedYear || '2026');
    setFormBudgetType('CAPEX');
    setFormAccountType('Utilities');
    setFormAllocatedBudget('');
    setFormActualCost('0');
    setFormPriority('MEDIUM');
    setFormStatus('PROPOSED');
    setFormVendor('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open modal for EDITING budget item
  const handleOpenEditModal = (item) => {
    setEditingId(item.id);
    setFormProjectName(item.projectName);
    setFormCategory(item.category);
    setFormCompanyMasterId(item.companyMasterId || '');
    setFormBrand(item.brand || 'Bvlgari');
    setFormDepartment(item.department || 'Store Operations');
    setFormFiscalYear(String(item.fiscalYear));
    setFormBudgetType(item.budgetType || 'CAPEX');
    setFormAccountType(item.accountType || 'Utilities');
    setFormAllocatedBudget(String(item.allocatedBudget));
    setFormActualCost(String(item.actualCost || 0));
    setFormPriority(item.priority || 'MEDIUM');
    setFormStatus(item.status || 'PROPOSED');
    setFormVendor(item.vendor || '');
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  // Handle Form Submit (CREATE / UPDATE)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formProjectName || !formAllocatedBudget) {
      alert('Nama item proyek dan Pagu Anggaran wajib diisi.');
      return;
    }

    try {
      setFormSubmitting(true);
      const payload = {
        projectName: formProjectName,
        category: formCategory,
        companyMasterId: formCompanyMasterId ? parseInt(formCompanyMasterId) : null,
        brand: formBrand,
        department: formDepartment,
        fiscalYear: parseInt(formFiscalYear),
        budgetType: formBudgetType,
        accountType: formAccountType,
        allocatedBudget: parseFloat(formAllocatedBudget),
        priority: formPriority,
        status: formStatus,
        vendor: formVendor,
        notes: formNotes
      };

      const url = editingId ? `${API_URL}/budgets/${editingId}` : `${API_URL}/budgets`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        handleLoadData();
      } else {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Gagal menyimpan anggaran.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Budget Item
  const handleDeleteBudget = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus item anggaran "${name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/budgets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        handleLoadData();
      } else {
        throw new Error('Gagal menghapus item.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredProjects = projectBudgets.filter(p => {
    const matchSearch = !projectSearch || 
      p.projectName.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.projectCode.toLowerCase().includes(projectSearch.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(projectSearch.toLowerCase()));
    const matchCat = !selectedCategoryFilter || p.category === selectedCategoryFilter;
    const matchDept = !selectedDepartmentFilter || p.department === selectedDepartmentFilter;
    return matchSearch && matchCat && matchDept;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                IT Budget 360 &amp; Innovation Hub
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Input Anggaran Proyek, Evaluasi Pagu vs Realisasi, &amp; Analisis Realisasi 360-Derajat
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Year Selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="2025">Tahun 2025</option>
              <option value="2026">Tahun 2026 (Aktif)</option>
              <option value="2027">Tahun 2027 (Proyeksi)</option>
            </select>
          </div>

          {/* Entity Selector */}
          <div className="relative">
            <select
              value={selectedCompanyMasterId}
              onChange={(e) => setSelectedCompanyMasterId(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 shadow-sm max-w-[200px] truncate"
            >
              <option value="">Semua Entitas Induk MRA</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Toggle Calculation Mode Switch */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setViewMode('accrual')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'accrual'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-gray-500 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Mode Amortisasi Prorated 12 Bulan (Accrual Basis)"
            >
              Accrual (Prorated 12 Bln)
            </button>
            <button
              onClick={() => setViewMode('cash')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'cash'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-gray-500 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Mode Realisasi Kas Keluar (Cash Outflow)"
            >
              Cash Basis (Kas Keluar)
            </button>
          </div>

          {/* Load Button */}
          <button
            onClick={handleLoadData}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Memuat...' : 'Proses Data'}
          </button>

          {/* New Budget Input Button */}
          <button
            onClick={handleOpenNewModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            + Input Anggaran Proyek
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('cost-overview')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'cost-overview'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white/60 dark:bg-slate-900/60 text-gray-500 hover:text-slate-800 dark:hover:text-white border border-slate-200/50 dark:border-slate-800/40'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          IT Cost Overview
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'summary'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white/60 dark:bg-slate-900/60 text-gray-500 hover:text-slate-800 dark:hover:text-white border border-slate-200/50 dark:border-slate-800/40'
          }`}
        >
          <PieChart className="w-4 h-4" />
          360° Executive Summary
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'projects'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white/60 dark:bg-slate-900/60 text-gray-500 hover:text-slate-800 dark:hover:text-white border border-slate-200/50 dark:border-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Tabel Anggaran &amp; Proyek Inovasi ({projectBudgets.length})
        </button>
        <button
          onClick={() => setActiveTab('departmental')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'departmental'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white/60 dark:bg-slate-900/60 text-gray-500 hover:text-slate-800 dark:hover:text-white border border-slate-200/50 dark:border-slate-800/40'
          }`}
        >
          <Users className="w-4 h-4" />
          Departmental Rental Breakdown
        </button>
        <button
          onClick={() => setActiveTab('consolidation')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'consolidation'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white/60 dark:bg-slate-900/60 text-gray-500 hover:text-slate-800 dark:hover:text-white border border-slate-200/50 dark:border-slate-800/40'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Konsolidasi Group &amp; Intercompany
        </button>
        <button
          onClick={() => setActiveTab('pillar-recap')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'pillar-recap'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white/60 dark:bg-slate-900/60 text-gray-500 hover:text-slate-800 dark:hover:text-white border border-slate-200/50 dark:border-slate-800/40'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Budget vs Realisasi
        </button>
      </div>

      {!dataLoaded && !loading ? (
        <PendingProcessPlaceholder
          title="Proses Data IT Budget 360"
          description={'Klik tombol "Proses Data" di atas untuk menampilkan analisis anggaran 360-derajat, alokasi proyek inovasi, dan breakdown departemen.'}
        />
      ) : !reportData ? null : (
        <>
          {/* TAB 0: IT COST OVERVIEW (Rekapitulasi Budget vs Realisasi 1 Tahun per Bulan) */}
          {activeTab === 'cost-overview' && (() => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
            const monthlyTrend = reportData?.monthlyTrend || [];

            // Exact Account Types matching system matrix & user's Rekapitulasi Budget vs Realisasi
            const OPEX_ACCOUNT_TYPES = [
              { id: 'Utilities', name: 'Utilities', type: 'OPEX' },
              { id: 'License & Permit', name: 'License & Permit', type: 'OPEX' },
              { id: 'Repair & Maintenance', name: 'Repair & Maintenance', type: 'OPEX' },
              { id: 'Rental Expenses', name: 'Rental Expenses', type: 'OPEX' },
              { id: 'Telecommunication', name: 'Telecommunication', type: 'OPEX' }
            ];

            const CAPEX_ACCOUNT_TYPES = [
              { id: 'Proyek & Inovasi', name: 'Proyek & Inovasi', type: 'CAPEX' }
            ];

            const buildMonthlyRowForAccountType = (accType, isCapexType) => {
              const months = Array(12).fill(0);

              projectBudgets.forEach(pb => {
                const isMatch = isCapexType
                  ? (pb.budgetType === 'CAPEX' || pb.accountType === 'Proyek & Inovasi')
                  : (pb.budgetType !== 'CAPEX' && (pb.accountType === accType || (!pb.accountType && accType === 'Utilities')));

                if (isMatch) {
                  if (Array.isArray(pb.expenses) && pb.expenses.length > 0) {
                    pb.expenses.forEach(exp => {
                      const d = new Date(exp.expenseDate);
                      if (d.getFullYear() === parseInt(selectedYear)) {
                        const mIdx = d.getMonth();
                        if (mIdx >= 0 && mIdx < 12) months[mIdx] += (parseFloat(exp.amount) || 0);
                      }
                    });
                  } else if (pb.actualCost > 0) {
                    const perMonth = (parseFloat(pb.actualCost) || 0) / 12;
                    for (let i = 0; i < 12; i++) months[i] += perMonth;
                  }
                }
              });

              if (accType === 'Rental Expenses' && months.every(v => v === 0)) {
                monthlyTrend.forEach((m, idx) => { if (idx < 12) months[idx] = m.assetsRental || 0; });
              }
              if (accType === 'License & Permit' && months.every(v => v === 0)) {
                monthlyTrend.forEach((m, idx) => { if (idx < 12) months[idx] = m.subscriptions || 0; });
              }
              if (accType === 'Telecommunication' && months.every(v => v === 0)) {
                monthlyTrend.forEach((m, idx) => { if (idx < 12) months[idx] = m.isp || 0; });
              }

              return months;
            };

            const getPaguForAccountType = (accType, isCapexType) => {
              let sum = 0;
              projectBudgets.forEach(pb => {
                const isMatch = isCapexType
                  ? (pb.budgetType === 'CAPEX' || pb.accountType === 'Proyek & Inovasi')
                  : (pb.budgetType !== 'CAPEX' && (pb.accountType === accType || (!pb.accountType && accType === 'Utilities')));
                if (isMatch) sum += (parseFloat(pb.allocatedBudget) || 0);
              });

              if (accType === 'Rental Expenses' && sum === 0) sum = reportData?.grandTotal?.assetsRental || 0;
              if (accType === 'License & Permit' && sum === 0) sum = reportData?.grandTotal?.subscriptions || 0;
              if (accType === 'Telecommunication' && sum === 0) sum = reportData?.grandTotal?.isp || 0;

              return sum;
            };

            const opexCategories = OPEX_ACCOUNT_TYPES.map(acc => {
              const months = buildMonthlyRowForAccountType(acc.id, false);
              const budget = getPaguForAccountType(acc.id, false);
              const ytdActual = months.reduce((a, b) => a + b, 0);
              const variance = budget - ytdActual;
              const utilPct = budget > 0 ? ((ytdActual / budget) * 100).toFixed(0) : (ytdActual > 0 ? '100' : '0');
              return { ...acc, budget, months, ytdActual, variance, utilPct };
            });

            const capexCategories = CAPEX_ACCOUNT_TYPES.map(acc => {
              const months = buildMonthlyRowForAccountType(acc.id, true);
              const budget = getPaguForAccountType(acc.id, true);
              const ytdActual = months.reduce((a, b) => a + b, 0);
              const variance = budget - ytdActual;
              const utilPct = budget > 0 ? ((ytdActual / budget) * 100).toFixed(0) : (ytdActual > 0 ? '100' : '0');
              return { ...acc, budget, months, ytdActual, variance, utilPct };
            });

            // Subtotals
            const sumMonths = (cats) => {
              const res = Array(12).fill(0);
              cats.forEach(c => c.months.forEach((v, idx) => res[idx] += v));
              return res;
            };

            const opexBudgetTotal = opexCategories.reduce((s, c) => s + c.budget, 0);
            const opexMonthsTotal = sumMonths(opexCategories);
            const opexYtdTotal = opexMonthsTotal.reduce((a, b) => a + b, 0);
            const opexVarianceTotal = opexBudgetTotal - opexYtdTotal;

            const capexBudgetTotal = capexCategories.reduce((s, c) => s + c.budget, 0);
            const capexMonthsTotal = sumMonths(capexCategories);
            const capexYtdTotal = capexMonthsTotal.reduce((a, b) => a + b, 0);
            const capexVarianceTotal = capexBudgetTotal - capexYtdTotal;

            const grandBudgetTotal = opexBudgetTotal + capexBudgetTotal;
            const grandMonthsTotal = opexMonthsTotal.map((v, i) => v + capexMonthsTotal[i]);
            const grandYtdTotal = opexYtdTotal + capexYtdTotal;
            const grandVarianceTotal = grandBudgetTotal - grandYtdTotal;
            const grandUtilPct = grandBudgetTotal > 0 ? ((grandYtdTotal / grandBudgetTotal) * 100).toFixed(0) : '0';

            const maxMonthlyVal = Math.max(...grandMonthsTotal, 1);

            const handleExportCSV = () => {
              const headers = ['Account Type (Kategori Akun)', 'Klasifikasi', 'Pagu Anggaran', ...monthNames, 'Total YTD', 'Selisih', '% Serapan'];
              const rows = [];

              const addRow = (name, type, budget, months, ytd, varVal, pct) => {
                rows.push([
                  `"${name}"`, type, budget, ...months, ytd, varVal, `"${pct}%"`
                ].join(','));
              };

              rows.push('--- OPEX ---');
              opexCategories.forEach(c => addRow(c.name, c.type, c.budget, c.months, c.ytdActual, c.variance, c.utilPct));
              addRow('SUBTOTAL OPEX', 'OPEX', opexBudgetTotal, opexMonthsTotal, opexYtdTotal, opexVarianceTotal, opexBudgetTotal > 0 ? ((opexYtdTotal/opexBudgetTotal)*100).toFixed(0) : '0');

              rows.push('--- CAPEX ---');
              capexCategories.forEach(c => addRow(c.name, c.type, c.budget, c.months, c.ytdActual, c.variance, c.utilPct));
              addRow('SUBTOTAL CAPEX', 'CAPEX', capexBudgetTotal, capexMonthsTotal, capexYtdTotal, capexVarianceTotal, capexBudgetTotal > 0 ? ((capexYtdTotal/capexBudgetTotal)*100).toFixed(0) : '0');

              rows.push('--- GRAND TOTAL ---');
              addRow('TOTAL', 'TOTAL', grandBudgetTotal, grandMonthsTotal, grandYtdTotal, grandVarianceTotal, grandUtilPct);

              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `IT_Cost_Overview_Matrix_${selectedYear}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            };

            return (
              <div className="space-y-6">
                {/* Header Title & Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm">
                  <div>
                    <h2 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      IT Cost Overview — Rekapitulasi Budget vs Realisasi 1 Tahun
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Matriks perbandingan Pagu Anggaran vs Realisasi per Kategori Akun (OPEX &amp; CAPEX) dari Januari s/d Desember {selectedYear}</p>
                  </div>

                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition flex items-center gap-2 shadow-md shadow-emerald-600/20 shrink-0"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Matriks 12 Bulan (CSV)
                  </button>
                </div>

                {/* KPI Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Pagu Budget */}
                  <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Pagu Budget ({selectedYear})</p>
                      <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-2 truncate">
                      {formatRupiah(grandBudgetTotal)}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">Akumulasi OPEX + CAPEX</p>
                  </div>

                  {/* Card 2: Realisasi YTD */}
                  <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Realisasi YTD (12 Bulan)</p>
                      <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2 truncate">
                      {formatRupiah(grandYtdTotal)}
                    </h3>
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-medium">Penyerapan</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{grandUtilPct}%</span>
                    </div>
                  </div>

                  {/* Card 3: Sisa Pagu */}
                  <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sisa Budget / Varian</p>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        grandVarianceTotal < 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40' : 'bg-teal-50 text-teal-600 dark:bg-teal-950/40'
                      }`}>
                        <Wallet className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className={`text-xl font-black mt-2 truncate ${
                      grandVarianceTotal < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400'
                    }`}>
                      {formatRupiah(grandVarianceTotal)}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">
                      {grandVarianceTotal < 0 ? 'Over Budget' : 'Sisa Pagu Aman'}
                    </p>
                  </div>

                  {/* Card 4: Rasio OPEX vs CAPEX */}
                  <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rasio OPEX vs CAPEX</p>
                      <div className="w-8 h-8 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs font-mono font-bold">
                      <span className="text-blue-600 dark:text-blue-400">OPEX {grandYtdTotal > 0 ? ((opexYtdTotal/grandYtdTotal)*100).toFixed(0) : 0}%</span>
                      <span className="text-purple-600 dark:text-purple-400">CAPEX {grandYtdTotal > 0 ? ((capexYtdTotal/grandYtdTotal)*100).toFixed(0) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden flex">
                      <div
                        className="bg-blue-500 h-full transition-all duration-500"
                        style={{ width: `${grandYtdTotal > 0 ? ((opexYtdTotal/grandYtdTotal)*100) : 50}%` }}
                      />
                      <div
                        className="bg-purple-500 h-full transition-all duration-500"
                        style={{ width: `${grandYtdTotal > 0 ? ((capexYtdTotal/grandYtdTotal)*100) : 50}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tabel Matriks 12 Bulan (Matrix Table 1 Tahun per Bulan) */}
                <div className="bg-white/80 dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Tabel Rekapitulasi Cost Overview 12 Bulan ({selectedYear})
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Perincian Pagu Anggaran &amp; Realisasi Biaya Bulanan per Kategori Akun OPEX &amp; CAPEX</p>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg font-medium">
                      💡 Angka disingkat (Jt/M). Hover kursor pada angka untuk detail nominal lengkap.
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400 bg-slate-50 dark:bg-slate-850">
                          <th className="py-2.5 px-2.5 sticky left-0 bg-slate-50 dark:bg-slate-850 z-10 min-w-[170px]">Kategori Akun IT</th>
                          <th className="py-2.5 px-1.5 font-mono text-right min-w-[70px]">Pagu</th>
                          {monthNames.map(m => (
                            <th key={m} className="py-2.5 px-1 font-mono text-right min-w-[44px]">{m}</th>
                          ))}
                          <th className="py-2.5 px-1.5 font-mono text-right min-w-[75px] bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300">Total YTD</th>
                          <th className="py-2.5 px-1.5 font-mono text-right min-w-[75px]">Sisa Budget</th>
                          <th className="py-2.5 px-1 text-center min-w-[50px]">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[10px]">
                        {/* HEADER SECTION 1: OPEX */}
                        <tr className="bg-blue-50/60 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200 font-black text-[10px] uppercase tracking-wider">
                          <td colSpan={17} className="py-2 px-2.5">
                            📊 Biaya Operasional (OPEX)
                          </td>
                        </tr>
                        {opexCategories.map(cat => (
                          <tr key={cat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <td className="py-2 px-2.5 font-sans font-bold text-slate-800 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
                              {cat.name}
                            </td>
                            <td className="py-2 px-1.5 text-right font-bold text-slate-700 dark:text-slate-200" title={formatRupiah(cat.budget)}>
                              {formatCompactRupiah(cat.budget)}
                            </td>
                            {cat.months.map((val, idx) => (
                              <td key={idx} title={val > 0 ? formatRupiah(val) : 'Rp 0'} className={`py-2 px-1 text-right ${val > 0 ? 'text-slate-800 dark:text-slate-100 font-bold' : 'text-slate-300 dark:text-slate-700'}`}>
                                {formatCompactRupiah(val)}
                              </td>
                            ))}
                            <td className="py-2 px-1.5 text-right font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10" title={formatRupiah(cat.ytdActual)}>
                              {formatCompactRupiah(cat.ytdActual)}
                            </td>
                            <td className={`py-2 px-1.5 text-right font-bold ${cat.variance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`} title={formatRupiah(cat.variance)}>
                              {formatCompactRupiah(cat.variance)}
                            </td>
                            <td className="py-2 px-1 text-center">
                              <span className={`px-1 py-0.5 rounded font-sans text-[9px] font-bold ${
                                parseFloat(cat.utilPct) > 100 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' :
                                parseFloat(cat.utilPct) > 85 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                                'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300'
                              }`}>
                                {cat.utilPct}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        {/* SUBTOTAL OPEX ROW */}
                        <tr className="bg-blue-100/60 dark:bg-blue-950/60 font-black text-blue-900 dark:text-blue-100 border-t border-b border-blue-200 dark:border-blue-900">
                          <td className="py-2 px-2.5 font-sans sticky left-0 bg-blue-100/90 dark:bg-blue-950/90 z-10">
                            SUBTOTAL OPEX
                          </td>
                          <td className="py-2 px-1.5 text-right" title={formatRupiah(opexBudgetTotal)}>{formatCompactRupiah(opexBudgetTotal)}</td>
                          {opexMonthsTotal.map((val, idx) => (
                            <td key={idx} title={val > 0 ? formatRupiah(val) : 'Rp 0'} className="py-2 px-1 text-right">{formatCompactRupiah(val)}</td>
                          ))}
                          <td className="py-2 px-1.5 text-right text-emerald-700 dark:text-emerald-300" title={formatRupiah(opexYtdTotal)}>{formatCompactRupiah(opexYtdTotal)}</td>
                          <td className="py-2 px-1.5 text-right" title={formatRupiah(opexVarianceTotal)}>{formatCompactRupiah(opexVarianceTotal)}</td>
                          <td className="py-2 px-1 text-center font-sans text-[9px]">
                            {opexBudgetTotal > 0 ? ((opexYtdTotal/opexBudgetTotal)*100).toFixed(1) : 0}%
                          </td>
                        </tr>

                        {/* HEADER SECTION 2: CAPEX */}
                        <tr className="bg-purple-50/60 dark:bg-purple-950/30 text-purple-800 dark:text-purple-200 font-black text-[10px] uppercase tracking-wider">
                          <td colSpan={17} className="py-2 px-2.5">
                            🚀 Investasi &amp; Belanja Modal (CAPEX)
                          </td>
                        </tr>
                        {capexCategories.map(cat => (
                          <tr key={cat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <td className="py-2 px-2.5 font-sans font-bold text-slate-800 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
                              {cat.name}
                            </td>
                            <td className="py-2 px-1.5 text-right font-bold text-slate-700 dark:text-slate-200" title={formatRupiah(cat.budget)}>
                              {formatCompactRupiah(cat.budget)}
                            </td>
                            {cat.months.map((val, idx) => (
                              <td key={idx} title={val > 0 ? formatRupiah(val) : 'Rp 0'} className={`py-2 px-1 text-right ${val > 0 ? 'text-slate-800 dark:text-slate-100 font-bold' : 'text-slate-300 dark:text-slate-700'}`}>
                                {formatCompactRupiah(val)}
                              </td>
                            ))}
                            <td className="py-2 px-1.5 text-right font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10" title={formatRupiah(cat.ytdActual)}>
                              {formatCompactRupiah(cat.ytdActual)}
                            </td>
                            <td className={`py-2 px-1.5 text-right font-bold ${cat.variance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`} title={formatRupiah(cat.variance)}>
                              {formatCompactRupiah(cat.variance)}
                            </td>
                            <td className="py-2 px-1 text-center">
                              <span className={`px-1 py-0.5 rounded font-sans text-[9px] font-bold ${
                                parseFloat(cat.utilPct) > 100 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' :
                                parseFloat(cat.utilPct) > 85 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                                'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300'
                              }`}>
                                {cat.utilPct}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        {/* SUBTOTAL CAPEX ROW */}
                        <tr className="bg-purple-100/60 dark:bg-purple-950/60 font-black text-purple-900 dark:text-purple-100 border-t border-b border-purple-200 dark:border-purple-900">
                          <td className="py-2 px-2.5 font-sans sticky left-0 bg-purple-100/90 dark:bg-purple-950/90 z-10">
                            SUBTOTAL CAPEX
                          </td>
                          <td className="py-2 px-1.5 text-right" title={formatRupiah(capexBudgetTotal)}>{formatCompactRupiah(capexBudgetTotal)}</td>
                          {capexMonthsTotal.map((val, idx) => (
                            <td key={idx} title={val > 0 ? formatRupiah(val) : 'Rp 0'} className="py-2 px-1 text-right">{formatCompactRupiah(val)}</td>
                          ))}
                          <td className="py-2 px-1.5 text-right text-emerald-700 dark:text-emerald-300" title={formatRupiah(capexYtdTotal)}>{formatCompactRupiah(capexYtdTotal)}</td>
                          <td className="py-2 px-1.5 text-right" title={formatRupiah(capexVarianceTotal)}>{formatCompactRupiah(capexVarianceTotal)}</td>
                          <td className="py-2 px-1 text-center font-sans text-[9px]">
                            {capexBudgetTotal > 0 ? ((capexYtdTotal/capexBudgetTotal)*100).toFixed(1) : 0}%
                          </td>
                        </tr>

                        {/* GRAND TOTAL ROW */}
                        <tr className="bg-slate-900 text-white font-black text-[11px] border-t-2 border-slate-700">
                          <td className="py-2.5 px-2.5 font-sans sticky left-0 bg-slate-900 z-10">
                            GRAND TOTAL BIAYA IT
                          </td>
                          <td className="py-2.5 px-1.5 text-right text-indigo-300" title={formatRupiah(grandBudgetTotal)}>{formatCompactRupiah(grandBudgetTotal)}</td>
                          {grandMonthsTotal.map((val, idx) => (
                            <td key={idx} title={val > 0 ? formatRupiah(val) : 'Rp 0'} className="py-2 px-1 text-right text-slate-200">{formatCompactRupiah(val)}</td>
                          ))}
                          <td className="py-2.5 px-1.5 text-right text-emerald-400 bg-slate-800" title={formatRupiah(grandYtdTotal)}>{formatCompactRupiah(grandYtdTotal)}</td>
                          <td className={`py-2.5 px-1.5 text-right ${grandVarianceTotal < 0 ? 'text-rose-400' : 'text-teal-300'}`} title={formatRupiah(grandVarianceTotal)}>
                            {formatCompactRupiah(grandVarianceTotal)}
                          </td>
                          <td className="py-2.5 px-1 text-center font-sans text-[9px] text-emerald-400">
                            {grandUtilPct}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 1: EXECUTIVE SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Pagu Budget ({selectedYear})</p>
                    <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-2 truncate">
                    {formatRupiah(reportData.grandTotal.total)}
                  </h3>
                  <p className="text-[9px] text-gray-450 font-semibold mt-1">Akumulasi 5 Pilar IT ({viewMode === 'accrual' ? 'Accrual Prorated' : 'Cash Basis'})</p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Proyek &amp; Inovasi (Plan)</p>
                    <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-450 mt-2 truncate">
                    {formatRupiah(reportData.projectBudgetsSummary.totalPlan)}
                  </h3>
                  <p className="text-[9px] text-gray-450 font-semibold mt-1">CAPEX: {formatRupiah(reportData.projectBudgetsSummary.capexTotal)}</p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sewa Device &amp; ISP (OPEX)</p>
                    <div className="w-8 h-8 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-xl flex items-center justify-center">
                      <Laptop className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-amber-500 dark:text-amber-400 mt-2 truncate">
                    {formatRupiah(reportData.grandTotal.assetsRental + reportData.grandTotal.isp)}
                  </h3>
                  <p className="text-[9px] text-gray-450 font-semibold mt-1">Laptop Rental + Internet Toko/HO</p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kas Keluar Netto Group</p>
                    <div className="w-8 h-8 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-rose-500 dark:text-rose-455 mt-2 truncate">
                    {formatRupiah(reportData.intercompanyElimination.netCashOutflow)}
                  </h3>
                  <p className="text-[9px] text-gray-450 font-semibold mt-1">Setelah Eliminasi Intercompany</p>
                </div>
              </div>

              {/* Industry Benchmark Health Indicator */}
              <div className="glass-panel p-6 rounded-3xl border border-indigo-200/50 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50/50 via-white to-blue-50/50 dark:from-slate-900/90 dark:to-slate-900/90 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-black text-slate-800 dark:text-white">
                      Evaluasi Kesehatan Alokasi Anggaran vs Benchmark Industri Ritel
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${
                    reportData.benchmarks.isHealthy ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {reportData.benchmarks.isHealthy ? '✓ PERFORMA ALOKASI SEHAT (ON TRACK)' : '⚠ WARNING OVER-LIMIT'}
                  </span>
                </div>

                {/* Progress Bars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  <div className="bg-white/70 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/40">
                    <div className="flex justify-between font-bold text-gray-600 dark:text-slate-400 mb-1">
                      <span>OPEX Rutin (Sewa, ISP, Subskripsi)</span>
                      <span>{reportData.benchmarks.opexPct}% (Target 60-70%)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(reportData.benchmarks.opexPct, 100)}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-white/70 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/40">
                    <div className="flex justify-between font-bold text-gray-600 dark:text-slate-400 mb-1">
                      <span>CAPEX / Inovasi &amp; Transformasi</span>
                      <span>{reportData.benchmarks.capexPct}% (Target 25-35%)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(reportData.benchmarks.capexPct, 100)}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-white/70 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/40">
                    <div className="flex justify-between font-bold text-gray-600 dark:text-slate-400 mb-1">
                      <span>Cybersecurity, Audit &amp; Training</span>
                      <span>{reportData.benchmarks.securityPct}% (Target 5-10%)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(reportData.benchmarks.securityPct, 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Detailed Analysis Breakdown & Action Plans */}
                <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-4">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Analisis Kesehatan &amp; Rekomendasi Khusus Ritel MRA:
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column: Alerts */}
                    <div className="space-y-3">
                      {reportData.benchmarks.opexPct > 75 && (
                        <div className="flex gap-3 p-3.5 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-700 dark:text-rose-300">
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                          <div className="text-[11px]">
                            <h5 className="font-bold text-xs mb-0.5">Biaya OPEX Rutin Terlalu Tinggi ({reportData.benchmarks.opexPct}%)</h5>
                            <p className="opacity-90 leading-relaxed">
                              Pengeluaran didominasi oleh <strong>Sewa Perangkat Laptop Bulanan</strong> dan <strong>Internet ISP Toko</strong>. Disarankan mengevaluasi skema sewa perangkat yang sudah jatuh tempo untuk dikonversi menjadi beli putus (CAPEX) guna mereduksi beban bulanan.
                            </p>
                          </div>
                        </div>
                      )}

                      {reportData.benchmarks.capexPct < 15 && (
                        <div className="flex gap-3 p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-700 dark:text-amber-300">
                          <Zap className="w-5 h-5 shrink-0 mt-0.5" />
                          <div className="text-[11px]">
                            <h5 className="font-bold text-xs mb-0.5">Alokasi Inovasi Rendah ({reportData.benchmarks.capexPct}%)</h5>
                            <p className="opacity-90 leading-relaxed">
                              Investasi untuk modernisasi sistem penjualan (POS), sistem inventori toko, dan CRM kustom masih sangat minim. Industri ritel modern menyarankan porsi inovasi &gt; 25% agar bisnis tetap kompetitif.
                            </p>
                          </div>
                        </div>
                      )}

                      {reportData.benchmarks.securityPct < 5 && (
                        <div className="flex gap-3 p-3.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                          <div className="text-[11px]">
                            <h5 className="font-bold text-xs mb-0.5">Proteksi Data Perlu Ditingkatkan ({reportData.benchmarks.securityPct}%)</h5>
                            <p className="opacity-90 leading-relaxed">
                              Alokasi untuk Cybersecurity dan kepatuhan lisensi audit berada di bawah 5%. Penting untuk menyisihkan anggaran khusus lisensi antivirus endpoint (EDR) dan firewall toko ritel guna melindungi data pelanggan VIP.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Strategic Recommendations Checklist */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-700/30 text-[11px] text-slate-600 dark:text-slate-350 space-y-3">
                      <h5 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">
                        Langkah Strategis Efisiensi Anggaran:
                      </h5>
                      <ul className="space-y-2.5">
                        <li className="flex gap-2 items-start">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span><strong>Konsolidasi ISP Group MRA:</strong> Satukan pengadaan bandwidth toko retail di mal yang sama untuk mendapatkan harga sewa diskon korporasi.</span>
                        </li>
                        <li className="flex gap-2 items-start">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span><strong>Reduksi Double Counting Sewa:</strong> Optimalkan eliminasi intercompany atas aset yang disewakan internal (seperti Permata Landmarq ke Mogems).</span>
                        </li>
                        <li className="flex gap-2 items-start">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span><strong>Masa Pakai Fleksibel:</strong> Pastikan durasi sewa laptop selaras dengan masa aktif kontrak kerja karyawan guna menghindari sewa menganggur (idle devices).</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TABEL ANGGARAN & INSPECTOR */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              {/* Table Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari item anggaran / proyek / brand..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="pl-9 pr-4 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white"
                    />
                  </div>

                  <select
                    value={selectedDepartmentFilter}
                    onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white"
                  >
                    <option value="">Semua Departemen</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleOpenNewModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition"
                >
                  <Plus className="w-4 h-4" />
                  + Tambah Item Anggaran Baru
                </button>
              </div>

              {/* Projects & Budget Items Table */}
              <div className="glass-panel rounded-3xl border border-slate-200/50 dark:border-slate-800/40 overflow-hidden bg-white/70 dark:bg-slate-900/60 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Kode &amp; Item Anggaran</th>
                      <th className="py-3.5 px-4">Entitas &amp; Brand</th>
                      <th className="py-3.5 px-4">Departemen</th>
                      <th className="py-3.5 px-4">Tipe Biaya</th>
                      <th className="py-3.5 px-4 text-right">Pagu Budget</th>
                      <th className="py-3.5 px-4 text-right">Realisasi Riil</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/50 text-xs">
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-gray-400 font-semibold">
                          Belum ada item anggaran terdaftar. Klik "+ Tambah Item Anggaran Baru" untuk menginput.
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-mono mr-2">
                              {p.projectCode}
                            </span>
                            {p.projectName}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                            {p.companyMaster?.name || 'Group Wide'} {p.brand ? `(${p.brand})` : ''}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-gray-500">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px]">
                              {p.department || 'Store Operations'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              p.budgetType === 'CAPEX' 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                            }`}>
                              {p.budgetType}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                            {formatRupiah(p.allocatedBudget)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleOpenTaggingModal(p)}
                              className="w-full text-right group cursor-pointer hover:opacity-90 transition"
                              title="Klik untuk lihat / tag rincian transaksi realisasi"
                            >
                              <div className="font-black text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-end gap-1">
                                {formatRupiah(p.actualCost || 0)}
                                <Tag className="w-3 h-3 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="mt-1 flex items-center justify-end gap-1">
                                {p.actualCost === 0 ? (
                                  <span className="inline-block px-1.5 py-0.5 text-[9px] font-black bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 rounded">
                                    Belum Dipakai (0%)
                                  </span>
                                ) : p.actualCost < p.allocatedBudget ? (
                                  <span className="inline-block px-1.5 py-0.5 text-[9px] font-black bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded">
                                    Sebagian ({((p.actualCost / p.allocatedBudget) * 100).toFixed(0)}%)
                                  </span>
                                ) : p.actualCost === p.allocatedBudget ? (
                                  <span className="inline-block px-1.5 py-0.5 text-[9px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 rounded">
                                    Terpakai Penuh
                                  </span>
                                ) : (
                                  <span className="inline-block px-1.5 py-0.5 text-[9px] font-black bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 rounded animate-pulse">
                                    Over-Budget ({((p.actualCost / p.allocatedBudget) * 100).toFixed(0)}%)
                                  </span>
                                )}
                                {p.expenses && p.expenses.length > 0 && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-full">
                                    {p.expenses.length} tx
                                  </span>
                                )}
                              </div>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              p.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : p.status === 'APPROVED'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenTaggingModal(p)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition flex items-center gap-1 text-[11px] font-bold"
                                title="Tag & Catat Realisasi Transaksi"
                              >
                                <Tag className="w-3.5 h-3.5" />
                                {p.expenses?.length ? `(${p.expenses.length})` : ''}
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                                title="Edit Anggaran"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteBudget(p.id, p.projectName)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                                title="Hapus Anggaran"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DEPARTMENTAL RENTAL BREAKDOWN */}
          {activeTab === 'departmental' && (
            <div className="space-y-4">
              <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 bg-white/70 dark:bg-slate-900/60">
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Rincian Biaya Sewa Perangkat (Device Rental) per Departemen
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportData.departmentBreakdown.map((dept, idx) => (
                    <div key={idx} className="bg-white/80 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[180px]">
                          {dept.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                          {dept.unitCount} Unit
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/40 flex justify-between items-baseline">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Biaya Bulanan</span>
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                          {formatRupiah(dept.monthlyCost)}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 text-right font-medium">
                        Tahunan: {formatRupiah(dept.annualCost)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KONSOLIDASI GROUP & INTERCOMPANY */}
          {activeTab === 'consolidation' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 bg-white/70 dark:bg-slate-900/60 space-y-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-500" />
                Laporan Konsolidasi IT Group 4 PT MRA Retail &amp; Eliminasi Intercompany
              </h3>

              <div className="bg-rose-50/60 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 space-y-2">
                <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                  📌 {reportData.intercompanyElimination.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Bruto Group</span>
                    <span className="font-black text-slate-800 dark:text-white">{formatRupiah(reportData.intercompanyElimination.grossTotal)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Eliminasi Intercompany</span>
                    <span className="font-black text-rose-600 dark:text-rose-400">- {formatRupiah(reportData.intercompanyElimination.eliminationAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Beban Kas Keluar Netto</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">{formatRupiah(reportData.intercompanyElimination.netCashOutflow)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BUDGET VS REALISASI — DIKELOMPOKKAN PER ACCOUNT TYPE (OPEX vs CAPEX) */}
          {activeTab === 'pillar-recap' && (() => {
            // Kelompokkan projectBudgets berdasarkan accountType (nilai dari dropdown)
            // CAPEX tanpa accountType spesifik dikelompokkan ke "Proyek & Inovasi"
            const CAPEX_KEY = 'Proyek & Inovasi';

            const groups = {};
            projectBudgets.forEach(pb => {
              const key = pb.budgetType === 'CAPEX' ? CAPEX_KEY : (pb.accountType || 'Lainnya');
              if (!groups[key]) groups[key] = { items: [], totalPagu: 0, totalActual: 0, isCapex: pb.budgetType === 'CAPEX' || key === CAPEX_KEY };
              groups[key].items.push(pb);
              groups[key].totalPagu  += pb.allocatedBudget || 0;
              groups[key].totalActual += pb.actualCost || 0;
            });

            // Urutan tampilan: OPEX types dulu, CAPEX terakhir
            const ORDER = ['Utilities', 'License & Permit', 'Repair & Maintenance', 'Rental Expenses', CAPEX_KEY, 'Lainnya'];
            const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
              const ia = ORDER.indexOf(a); const ib = ORDER.indexOf(b);
              return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
            });

            const GROUP_META = {
              'Utilities':               { icon: Wifi,      color: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400',     badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',     bar: 'bg-cyan-500',    type: 'OPEX'  },
              'License & Permit':        { icon: CreditCard, color: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300', bar: 'bg-violet-500',  type: 'OPEX'  },
              'Repair & Maintenance':    { icon: Package,   color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',       badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',       bar: 'bg-blue-500',    type: 'OPEX'  },
              'Rental Expenses':         { icon: Laptop,    color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',   bar: 'bg-amber-500',   type: 'OPEX'  },
              [CAPEX_KEY]:               { icon: Sparkles,  color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300', bar: 'bg-emerald-500', type: 'CAPEX' },
              'Lainnya':                 { icon: Layers,    color: 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400',  badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300',  bar: 'bg-slate-400',   type: 'OPEX'  },
            };

            const grandPagu     = sortedGroups.reduce((s, [, g]) => s + g.totalPagu, 0);
            const grandActual   = sortedGroups.reduce((s, [, g]) => s + g.totalActual, 0);

            return (
              <div className="space-y-4">
                {/* Summary table per Account Type */}
                <div className="glass-panel rounded-3xl border border-slate-200/50 dark:border-slate-800/40 overflow-hidden bg-white/70 dark:bg-slate-900/60 shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-200/50 dark:border-slate-800/40 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-black text-slate-800 dark:text-white">Rekapitulasi Budget vs Realisasi per Kategori Akun (OPEX & CAPEX)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Account Type (Kategori Akun)</th>
                          <th className="py-3 px-4 text-center">Klasifikasi</th>
                          <th className="py-3 px-4 text-right">Pagu Anggaran</th>
                          <th className="py-3 px-4 text-right">Realisasi</th>
                          <th className="py-3 px-4 text-right">Selisih</th>
                          <th className="py-3 px-4">% Serapan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/50 text-xs">
                        {sortedGroups.map(([key, group]) => {
                          const meta = GROUP_META[key] || GROUP_META['Lainnya'];
                          const IconComp = meta.icon;
                          const selisih = group.totalPagu - group.totalActual;
                          const pct = group.totalPagu > 0 ? Math.round((group.totalActual / group.totalPagu) * 100) : null;
                          const costType = group.isCapex || meta.type === 'CAPEX' ? 'CAPEX' : 'OPEX';
                          return (
                            <tr key={key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                                    <IconComp className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-bold text-slate-800 dark:text-white">{key}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  costType === 'CAPEX'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                }`}>
                                  {costType}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-bold text-slate-700 dark:text-slate-200">{formatRupiah(group.totalPagu)}</td>
                              <td className={`py-3.5 px-4 text-right font-black ${group.totalActual > group.totalPagu ? 'text-rose-500' : 'text-emerald-600'}`}>
                                {formatRupiah(group.totalActual)}
                              </td>
                              <td className="py-3.5 px-4 text-right font-bold">
                                <span className={selisih >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                                  {selisih >= 0 ? '+' : ''}{formatRupiah(selisih)}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                {pct !== null ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                      <div className={`${pct > 100 ? 'bg-rose-500' : pct > 90 ? 'bg-amber-500' : meta.bar} h-full rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                    </div>
                                    <span className={`font-black text-[10px] ${pct > 100 ? 'text-rose-500' : pct > 90 ? 'text-amber-500' : 'text-emerald-600'}`}>{pct}%</span>
                                  </div>
                                ) : <span className="text-gray-400 text-[10px]">N/A</span>}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-t-2 border-slate-300 dark:border-slate-700 text-xs font-black">
                          <td className="py-3.5 px-4 text-slate-800 dark:text-white" colSpan={2}>TOTAL</td>
                          <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-200">{formatRupiah(grandPagu)}</td>
                          <td className={`py-3.5 px-4 text-right ${grandActual > grandPagu ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>{formatRupiah(grandActual)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <span className={grandPagu - grandActual >= 0 ? 'text-emerald-600' : 'text-rose-500'}>{formatRupiah(grandPagu - grandActual)}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            {grandPagu > 0 && <span className="font-black text-[10px] text-indigo-600 dark:text-indigo-400">{Math.round((grandActual / grandPagu) * 100)}%</span>}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Detail per Account Type */}
                {sortedGroups.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm font-semibold">Belum ada item anggaran terdaftar.</div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Tag className="w-4 h-4 text-indigo-500" />
                      <h3 className="text-sm font-black text-slate-800 dark:text-white">Rincian Item per Kategori Akun</h3>
                    </div>
                    {sortedGroups.map(([key, group]) => {
                      const meta = GROUP_META[key] || GROUP_META['Lainnya'];
                      const IconComp = meta.icon;
                      const serapanPct = group.totalPagu > 0 ? Math.round((group.totalActual / group.totalPagu) * 100) : 0;
                      return (
                        <div key={key} className="glass-panel rounded-2xl border border-slate-200/50 dark:border-slate-800/40 overflow-hidden bg-white/70 dark:bg-slate-900/60 shadow-sm">
                          <div className="flex items-center justify-between px-5 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-800/40">
                            <div className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                                <IconComp className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-black text-slate-700 dark:text-slate-200">{key}</span>
                              <span className="text-[10px] text-gray-400 font-semibold">{group.items.length} item</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <div className="text-right hidden sm:block">
                                <div className="text-[10px] text-gray-400">Pagu</div>
                                <div className="font-black text-slate-700 dark:text-slate-200">{formatRupiah(group.totalPagu)}</div>
                              </div>
                              <div className="text-right hidden sm:block">
                                <div className="text-[10px] text-gray-400">Realisasi</div>
                                <div className={`font-black ${group.totalActual > group.totalPagu ? 'text-rose-500' : 'text-emerald-600'}`}>{formatRupiah(group.totalActual)}</div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${serapanPct > 100 ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' : serapanPct > 90 ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'}`}>
                                {serapanPct}% Terserap
                              </span>
                            </div>
                          </div>
                          <div className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
                            {group.items.map(pb => {
                              const pct = pb.allocatedBudget > 0 ? Math.round(((pb.actualCost || 0) / pb.allocatedBudget) * 100) : 0;
                              const statusColor = {
                                'PROPOSED':    'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400',
                                'APPROVED':    'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
                                'IN_PROGRESS': 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
                                'COMPLETED':   'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
                              }[pb.status] || 'bg-slate-100 text-slate-600';
                              return (
                                <div key={pb.id} className="px-5 py-3 flex flex-wrap items-center gap-3 text-xs hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-white truncate">{pb.projectCode} — {pb.projectName}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{pb.companyMaster?.name || '—'} · {pb.budgetType}</p>
                                  </div>
                                  <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-right">
                                      <div className="text-[10px] text-gray-400">Pagu</div>
                                      <div className="font-black text-slate-700 dark:text-slate-200">{formatRupiah(pb.allocatedBudget)}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-[10px] text-gray-400">Realisasi</div>
                                      <div className={`font-black ${(pb.actualCost || 0) > pb.allocatedBudget ? 'text-rose-500' : 'text-emerald-600'}`}>{formatRupiah(pb.actualCost || 0)}</div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                        <div className={`${pct > 100 ? 'bg-rose-500' : pct > 90 ? 'bg-amber-500' : 'bg-emerald-500'} h-full rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                      </div>
                                      <span className={`font-black text-[9px] min-w-[28px] ${pct > 100 ? 'text-rose-500' : pct > 90 ? 'text-amber-500' : 'text-emerald-600'}`}>{pct}%</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${statusColor}`}>{pb.status}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {/* FORM DRAWER / MODAL UNTUK INPUT & EDIT ANGGARAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white">
                    {editingId ? 'Edit Item Anggaran Proyek' : 'Input Anggaran Proyek Baru'}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">Form Alokasi Pagu &amp; Perencanaan Anggaran IT</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Proyek / Item Anggaran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Modernisasi POS & Integration System"
                  value={formProjectName}
                  onChange={(e) => setFormProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Entitas Induk PT MRA *
                  </label>
                  <select
                    value={formCompanyMasterId}
                    onChange={(e) => setFormCompanyMasterId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Brand Business Unit MRA
                  </label>
                  <select
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    {MRA_BRANDS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Departemen Pengguna *
                  </label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tahun Fiskal *
                  </label>
                  <select
                    value={formFiscalYear}
                    onChange={(e) => setFormFiscalYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipe Biaya *
                  </label>
                  <select
                    value={formBudgetType}
                    onChange={(e) => setFormBudgetType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    <option value="CAPEX">CAPEX (Capital Expense / Inovasi &amp; Aset)</option>
                    <option value="OPEX">OPEX (Operational Expense / Biaya Rutin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Type (Kategori Akun)
                  </label>
                  <select
                    value={formAccountType}
                    onChange={(e) => setFormAccountType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    <option value="Utilities">Utilities</option>
                    <option value="License & Permit">License &amp; Permit</option>
                    <option value="Repair & Maintenance">Repair &amp; Maintenance</option>
                    <option value="Rental Expenses">Rental Expenses</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pagu Anggaran (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 45000000"
                    value={formAllocatedBudget}
                    onChange={(e) => setFormAllocatedBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Realisasi Riil (Rp)
                  </label>
                  <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-bold text-xs">
                    Dihitung otomatis dari transaksi yang di-tag
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prioritas
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Approval
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    <option value="PROPOSED">PROPOSED (Usulan)</option>
                    <option value="APPROVED">APPROVED (Disetujui)</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (Berjalan)</option>
                    <option value="COMPLETED">COMPLETED (Selesai)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Keterangan
                </label>
                <textarea
                  rows="2"
                  placeholder="Catatan pendukung atau justifikasi anggaran..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                ></textarea>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Anggaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tagging / Realisasi Expenses Modal */}
      <BudgetTaggingModal
        isOpen={isTaggingModalOpen}
        onClose={() => {
          setIsTaggingModalOpen(false);
          setTaggingBudget(null);
        }}
        budget={taggingBudget}
        token={token}
        apiUrl={API_URL}
        onUpdateBudget={handleUpdateBudgetFromTagging}
        formatRupiah={formatRupiah}
      />
    </div>
  );
}
