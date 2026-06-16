import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  FolderKanban, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import ReactLoader from '../components/ReactLoader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SECTORS = [
  { value: 'GENERAL', label: 'GENERAL (Holding)' },
  { value: 'RETAIL', label: 'RETAIL' },
  { value: 'FB', label: 'FB (F&B)' },
  { value: 'MEDIA', label: 'MEDIA' },
  { value: 'RADIO', label: 'RADIO' }
];

export default function SetupCompany({ user, token }) {
  const [activeTab, setActiveTab] = useState('masters'); // masters | branches
  const [masters, setMasters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and filter states
  const [masterSearch, setMasterSearch] = useState('');
  const [masterSectorFilter, setMasterSectorFilter] = useState('ALL');
  const [branchSearch, setBranchSearch] = useState('');
  const [branchSectorFilter, setBranchSectorFilter] = useState('ALL');

  // Master modal states
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [editingMaster, setEditingMaster] = useState(null);
  const [masterName, setMasterName] = useState('');
  const [masterSector, setMasterSector] = useState('GENERAL');
  const [masterBudget, setMasterBudget] = useState('');

  // Branch modal states
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchName, setBranchName] = useState('');
  const [branchLocation, setBranchLocation] = useState('');
  const [branchSector, setBranchSector] = useState('GENERAL');
  const [branchMasterId, setBranchMasterId] = useState('');

  const [saving, setSaving] = useState(false);

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resMasters, resBranches] = await Promise.all([
        fetch(`${API_URL}/companies/master`, { headers }),
        fetch(`${API_URL}/companies`, { headers })
      ]);

      if (!resMasters.ok || !resBranches.ok) {
        throw new Error('Gagal mengambil data perusahaan.');
      }

      const mastersData = await resMasters.json();
      const branchesData = await resBranches.json();

      setMasters(mastersData);
      setBranches(branchesData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatNumber = (num) => {
    return Math.round(num).toLocaleString('id-ID');
  };

  const formatCurrency = (num) => {
    return `Rp ${formatNumber(num)}`;
  };

  const formatNumberForInput = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const raw = value.toString().replace(/\D/g, '');
    if (!raw) return '';
    return parseInt(raw, 10).toLocaleString('id-ID');
  };

  // Master CRUD Operations
  const openMasterModal = (master = null) => {
    if (master) {
      setEditingMaster(master);
      setMasterName(master.name);
      setMasterSector(master.sector);
      setMasterBudget(master.sharedBudget ? formatNumberForInput(master.sharedBudget) : '');
    } else {
      setEditingMaster(null);
      setMasterName('');
      setMasterSector('GENERAL');
      setMasterBudget('');
    }
    setIsMasterModalOpen(true);
  };

  const handleMasterSubmit = async (e) => {
    e.preventDefault();
    if (!masterName.trim()) return;

    try {
      setSaving(true);
      const url = editingMaster 
        ? `${API_URL}/companies/master/${editingMaster.id}`
        : `${API_URL}/companies/master`;
      const method = editingMaster ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          name: masterName.trim(),
          sector: masterSector,
          sharedBudget: parseFloat(masterBudget.replace(/\./g, '')) || 0
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Terjadi kesalahan saat menyimpan master company.');
      }

      setIsMasterModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: editingMaster ? 'Grup Diperbarui' : 'Grup Dibuat',
        text: `Grup ${masterName} berhasil disimpan.`,
        timer: 1500,
        showConfirmButton: false
      });
      fetchData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.message
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteMaster = async (master) => {
    const confirm = await Swal.fire({
      title: 'Hapus Grup Entitas?',
      html: `Apakah Anda yakin ingin menghapus <b>${master.name}</b>?<br><small class="text-rose-500">Tindakan ini tidak bisa dibatalkan.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/companies/master/${master.id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal menghapus master company.');
      }

      Swal.fire({
        icon: 'success',
        title: 'Terhapus!',
        text: 'Master company berhasil dihapus.',
        timer: 1500,
        showConfirmButton: false
      });
      fetchData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: err.message
      });
    }
  };

  // Branch CRUD Operations
  const openBranchModal = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchName(branch.name);
      setBranchLocation(branch.location);
      setBranchSector(branch.sector);
      setBranchMasterId(branch.companyMasterId || '');
    } else {
      setEditingBranch(null);
      setBranchName('');
      setBranchLocation('');
      setBranchSector('GENERAL');
      setBranchMasterId('');
    }
    setIsBranchModalOpen(true);
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    if (!branchName.trim() || !branchLocation.trim()) return;

    try {
      setSaving(true);
      const url = editingBranch 
        ? `${API_URL}/companies/${editingBranch.id}`
        : `${API_URL}/companies`;
      const method = editingBranch ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          name: branchName.trim(),
          location: branchLocation.trim(),
          sector: branchSector,
          companyMasterId: branchMasterId ? parseInt(branchMasterId) : null
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Terjadi kesalahan saat menyimpan cabang.');
      }

      setIsBranchModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: editingBranch ? 'Cabang Diperbarui' : 'Cabang Dibuat',
        text: `Cabang ${branchName} - ${branchLocation} berhasil disimpan.`,
        timer: 1500,
        showConfirmButton: false
      });
      fetchData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.message
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteBranch = async (branch) => {
    const confirm = await Swal.fire({
      title: 'Hapus Cabang?',
      html: `Apakah Anda yakin ingin menghapus cabang <b>${branch.name} (${branch.location})</b>?<br><small class="text-rose-500">Tindakan ini tidak bisa dibatalkan.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/companies/${branch.id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal menghapus cabang.');
      }

      Swal.fire({
        icon: 'success',
        title: 'Terhapus!',
        text: 'Cabang berhasil dihapus.',
        timer: 1500,
        showConfirmButton: false
      });
      fetchData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: err.message
      });
    }
  };

  // Filter Master list
  const filteredMasters = masters.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(masterSearch.toLowerCase()) ||
                        m.sector.toLowerCase().includes(masterSearch.toLowerCase());
    const matchSector = masterSectorFilter === 'ALL' || m.sector === masterSectorFilter;
    return matchSearch && matchSector;
  });

  // Filter Branch list
  const filteredBranches = branches.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
                        b.location.toLowerCase().includes(branchSearch.toLowerCase()) ||
                        b.sector.toLowerCase().includes(branchSearch.toLowerCase());
    const matchSector = branchSectorFilter === 'ALL' || b.sector === branchSectorFilter;
    
    // Find parent master details to display if needed
    const masterObj = masters.find(m => m.id === b.companyMasterId);
    b.parentName = masterObj ? masterObj.name : 'N/A';

    return matchSearch && matchSector;
  });

  if (loading && masters.length === 0) {
    return <ReactLoader message="Memuat data setup perusahaan..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen pb-12">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-rose-500" />
            Setup Company & Entitas
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-1">
            Manajemen legalitas perusahaan induk, pengelompokan grup usaha, dan pemetaan lokasi cabang fisik.
          </p>
        </div>

        <button
          onClick={() => activeTab === 'masters' ? openMasterModal() : openBranchModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-rose-500/20 transition-all duration-150 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'masters' ? 'Tambah Master Company' : 'Tambah Cabang Baru'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200/60 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('masters')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition relative ${
            activeTab === 'masters' 
              ? 'text-rose-500' 
              : 'text-gray-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Grup Entitas Induk ({masters.length})
          {activeTab === 'masters' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition relative ${
            activeTab === 'branches' 
              ? 'text-rose-500' 
              : 'text-gray-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Cabang & Lokasi Fisik ({branches.length})
          {activeTab === 'branches' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Tabs Content */}
      {activeTab === 'masters' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama legalitas perusahaan atau sektor..."
                value={masterSearch}
                onChange={(e) => setMasterSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
              />
            </div>
            
            <select
              value={masterSectorFilter}
              onChange={(e) => setMasterSectorFilter(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="ALL">Semua Sektor</option>
              {SECTORS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="glass-card glow-border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/60 dark:border-slate-850">
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">Nama Entitas Induk</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">Sektor/Grup MRA</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">Budget Sewa Cabang</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredMasters.length > 0 ? (
                    filteredMasters.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="p-4 text-xs font-bold text-slate-800 dark:text-slate-200">{m.name}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            m.sector === 'RETAIL' ? 'bg-amber-500/10 text-amber-500' :
                            m.sector === 'FB' ? 'bg-emerald-500/10 text-emerald-500' :
                            m.sector === 'MEDIA' ? 'bg-rose-500/10 text-rose-500' :
                            m.sector === 'RADIO' ? 'bg-indigo-500/10 text-indigo-500' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>
                            {m.sector}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-mono font-bold text-slate-700 dark:text-slate-350">
                          {formatCurrency(m.sharedBudget || 0)}
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => openMasterModal(m)}
                            className="p-1.5 text-slate-400 hover:text-slate-655 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Edit Master Company"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMaster(m)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 rounded-lg transition"
                            title="Hapus Master Company"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-xs font-medium text-gray-400 dark:text-slate-500">
                        Tidak ada grup entitas induk yang ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama perusahaan, cabang/lokasi, atau sektor..."
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
              />
            </div>
            
            <select
              value={branchSectorFilter}
              onChange={(e) => setBranchSectorFilter(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="ALL">Semua Sektor</option>
              {SECTORS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="glass-card glow-border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/60 dark:border-slate-850">
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">Nama Perusahaan</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">Lokasi / Cabang</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">Sektor/Grup MRA</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">Entitas Induk</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredBranches.length > 0 ? (
                    filteredBranches.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="p-4 text-xs font-bold text-slate-800 dark:text-slate-200">{b.name}</td>
                        <td className="p-4 text-xs text-slate-600 dark:text-slate-400 font-medium">{b.location}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            b.sector === 'RETAIL' ? 'bg-amber-500/10 text-amber-500' :
                            b.sector === 'FB' ? 'bg-emerald-500/10 text-emerald-500' :
                            b.sector === 'MEDIA' ? 'bg-rose-500/10 text-rose-500' :
                            b.sector === 'RADIO' ? 'bg-indigo-500/10 text-indigo-500' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>
                            {b.sector}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
                          {b.parentName}
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => openBranchModal(b)}
                            className="p-1.5 text-slate-400 hover:text-slate-655 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Edit Cabang"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteBranch(b)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 rounded-lg transition"
                            title="Hapus Cabang"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-xs font-medium text-gray-400 dark:text-slate-500">
                        Tidak ada data cabang/lokasi fisik yang ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Master Company Setup */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-rose-500" />
                {editingMaster ? 'Ubah Master Company' : 'Tambah Master Company'}
              </h3>
              <button
                onClick={() => setIsMasterModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-450 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMasterSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Nama Legalitas Perusahaan (Master)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Mugi Rekso Abadi"
                  value={masterName}
                  onChange={(e) => setMasterName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Sektor / Grup Bisnis MRA
                </label>
                <select
                  value={masterSector}
                  onChange={(e) => setMasterSector(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition cursor-pointer"
                >
                  {SECTORS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Shared Budget Sewa Bulanan (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    placeholder="0"
                    value={masterBudget}
                    onChange={(e) => setMasterBudget(formatNumberForInput(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition"
                  />
                </div>
                <p className="text-[9px] text-gray-400 mt-1">
                  Budget bersama untuk biaya sewa perangkat non-karyawan (kantor pusat/shared).
                </p>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsMasterModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || !masterName.trim()}
                  className="flex-1 py-2 text-xs font-black bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/10 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Branch Location Setup */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-500" />
                {editingBranch ? 'Ubah Cabang / Lokasi Fisik' : 'Tambah Cabang / Lokasi Fisik'}
              </h3>
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-450 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBranchSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Hourlogy Indah Perkasa"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Lokasi / Cabang Fisik
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Butik Omega Plaza Indonesia atau HQ"
                  value={branchLocation}
                  onChange={(e) => setBranchLocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Sektor / Grup Bisnis MRA
                </label>
                <select
                  value={branchSector}
                  onChange={(e) => setBranchSector(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition cursor-pointer"
                >
                  {SECTORS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Link ke Legalitas Induk (Master Company)
                </label>
                <select
                  value={branchMasterId}
                  onChange={(e) => setBranchMasterId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition cursor-pointer"
                >
                  <option value="">-- Tanpa Relasi Induk --</option>
                  {masters.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <p className="text-[9px] text-gray-400 mt-1">
                  Menghubungkan cabang fisik ini dengan entitas kontrak/legal induk untuk rekap budget.
                </p>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold border border-slate-250 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || !branchName.trim() || !branchLocation.trim()}
                  className="flex-1 py-2 text-xs font-black bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/10 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
