import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Wifi, 
  Plus, 
  Search, 
  Building2, 
  MapPin, 
  Trash2, 
  Edit2, 
  Loader2, 
  AlertTriangle,
  Cpu,
  Info,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import ReactLoader from '../components/ReactLoader';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function WifiAps({ user, token }) {
  const [wifiAPs, setWifiAPs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  // Password visibility maps
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formId, setFormId] = useState('');
  const [formBssid, setFormBssid] = useState('');
  const [formSsid, setFormSsid] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formLocation, setFormLocation] = useState('');
  const [formCompanyId, setFormCompanyId] = useState('');
  const [formIpAddress, setFormIpAddress] = useState('');
  const [formVendor, setFormVendor] = useState('');
  const [formModelName, setFormModelName] = useState('');
  const [formFrequency, setFormFrequency] = useState('5GHz');
  const [formChannel, setFormChannel] = useState('');
  const [formSecurityType, setFormSecurityType] = useState('WPA2-Enterprise');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  
  // Submit loading state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch both API endpoints in parallel to reduce load time
      const [apRes, compRes] = await Promise.all([
        fetch(`${API_URL}/wifi`, { headers }),
        fetch(`${API_URL}/companies`, { headers })
      ]);

      if (!apRes.ok) throw new Error('Failed to load Wi-Fi Access Points.');
      if (!compRes.ok) throw new Error('Failed to load companies.');

      const [apData, compData] = await Promise.all([
        apRes.json(),
        compRes.json()
      ]);

      setWifiAPs(apData);
      setCompanies(compData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const apRes = await fetch(`${API_URL}/wifi`, { headers });
      if (apRes.ok) {
        const apData = await apRes.json();
        setWifiAPs(apData);
      }
    } catch (err) {
      console.error('Error refreshing Wi-Fi data:', err.message);
    }
  };

  // Open modal for Creating
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setFormId('');
    setFormBssid('');
    setFormSsid('');
    setFormPassword('');
    setShowFormPassword(false);
    setFormLocation('');
    setFormCompanyId(companies[0]?.id || '');
    setFormIpAddress('');
    setFormVendor('');
    setFormModelName('');
    setFormFrequency('5GHz');
    setFormChannel('');
    setFormSecurityType('WPA2-Enterprise');
    setFormStatus('ACTIVE');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (ap) => {
    setIsEditMode(true);
    setFormId(ap.id);
    setFormBssid(ap.bssid);
    setFormSsid(ap.ssid);
    setFormPassword(ap.password || '');
    setShowFormPassword(false);
    setFormLocation(ap.location);
    setFormCompanyId(ap.companyId);
    setFormIpAddress(ap.ipAddress || '');
    setFormVendor(ap.vendor || '');
    setFormModelName(ap.modelName || '');
    setFormFrequency(ap.frequency || '5GHz');
    setFormChannel(ap.channel || '');
    setFormSecurityType(ap.securityType || 'WPA2-Enterprise');
    setFormStatus(ap.status || 'ACTIVE');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Form Submit (Create / Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    // Validate fields
    if (!formBssid || !formSsid || !formLocation || !formCompanyId) {
      setFormError('BSSID, SSID, Location, and Company are required.');
      setSubmitting(false);
      return;
    }

    // MAC Address check
    const macRegex = /^([0-9a-f]{2}[:-]){5}([0-9a-f]{2})$/i;
    if (!macRegex.test(formBssid.trim())) {
      setFormError('Invalid MAC Address (BSSID) format. Use xx:xx:xx:xx:xx:xx');
      setSubmitting(false);
      return;
    }

    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const payload = {
        bssid: formBssid,
        ssid: formSsid,
        password: formPassword,
        location: formLocation,
        companyId: parseInt(formCompanyId),
        ipAddress: formIpAddress || null,
        vendor: formVendor || null,
        modelName: formModelName || null,
        frequency: formFrequency,
        channel: formChannel ? parseInt(formChannel) : null,
        securityType: formSecurityType,
        status: formStatus
      };

      let res;
      if (isEditMode) {
        res = await fetch(`${API_URL}/wifi/${formId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/wifi`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save Access Point.');
      }

      setIsModalOpen(false);
      
      Swal.fire({
        icon: 'success',
        title: isEditMode ? 'Access Point Updated!' : 'Access Point Registered!',
        text: `Successfully saved ${formSsid} (${formBssid}).`,
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

  // Delete Access Point
  const handleDelete = (ap) => {
    Swal.fire({
      title: 'Apakah Anda Yakin?',
      text: `Menghapus AP ${ap.ssid} (${ap.bssid}) dari database Wi-Fi!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${API_URL}/wifi/${ap.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to delete AP.');
          }

          Swal.fire({
            icon: 'success',
            title: 'Dihapus!',
            text: 'Data Access Point berhasil dihapus.',
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

  const togglePasswordVisibility = (apId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [apId]: !prev[apId]
    }));
  };

  // Filtered List
  const filteredAPs = wifiAPs.filter(ap => {
    const matchesSearch = 
      ap.ssid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ap.bssid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ap.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ap.ipAddress && ap.ipAddress.includes(searchQuery));
    
    const matchesCompany = selectedCompanyId === '' || ap.companyId === parseInt(selectedCompanyId);

    return matchesSearch && matchesCompany;
  });

  if (loading) {
    return <ReactLoader size="lg" text="Loading Wi-Fi Database..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Wifi className="w-8 h-8 text-rose-500 animate-pulse" />
            WiFi Database
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-semibold">
            Kelola data SSID, BSSID (MAC Address), dan penempatan lokasi Access Point (AP) MRA Group secara manual.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
        >
          <Plus className="w-4 h-4" />
          Add Access Point
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800 text-red-750 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main control filter bar */}
      <div className="glass-panel p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-gray-250/60 dark:border-slate-800/60 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by SSID, MAC Address, or Location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
          />
        </div>

        {/* Company Filter Selector */}
        <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 px-3.5 py-2.5 rounded-xl w-full md:w-72">
          <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
          >
            <option value="">All Subsidiaries / Companies</option>
            {companies.map(comp => (
              <option key={comp.id} value={comp.id}>
                {comp.name} ({comp.location})
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Access Points Table */}
      <div className="glass-panel rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden">
        {filteredAPs.length === 0 ? (
          <div className="py-16 text-center">
            <Wifi className="w-12 h-12 text-gray-300 dark:text-slate-750 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">No Access Points found matching criteria.</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting filters or click "Add Access Point" to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-6">SSID Name</th>
                  <th className="py-4 px-6">MAC Address (BSSID)</th>
                  <th className="py-4 px-6">Wi-Fi Password</th>
                  <th className="py-4 px-6">Company Entity</th>
                  <th className="py-4 px-6">Specific Location</th>
                  <th className="py-4 px-6">Management IP</th>
                  <th className="py-4 px-6 text-center">Specs</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-755 dark:text-slate-305">
                {filteredAPs.map((ap) => (
                  <tr key={ap.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                        <Wifi className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate max-w-[130px]">{ap.ssid}</span>
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] uppercase text-slate-500 dark:text-slate-400">
                      {ap.bssid}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs tracking-wider text-slate-600 dark:text-slate-300">
                          {visiblePasswords[ap.id] ? (ap.password || '-') : '••••••••'}
                        </span>
                        {ap.password && (
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(ap.id)}
                            className="text-gray-400 hover:text-rose-500 transition duration-150 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            title={visiblePasswords[ap.id] ? 'Hide Password' : 'Show Password'}
                          >
                            {visiblePasswords[ap.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-500 dark:text-slate-400">
                      <div className="truncate max-w-[140px] font-bold text-gray-700 dark:text-slate-300">
                        {ap.company?.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        Branch: {ap.company?.location}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-[11px] text-gray-750 dark:text-slate-300">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate max-w-[150px]">{ap.location}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {ap.ipAddress || '-'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-block bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-350 px-2 py-0.5 rounded text-[10px]">
                        {ap.frequency} | Ch.{ap.channel || 'Auto'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ap.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-400'
                          : ap.status === 'MAINTENANCE'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/45 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          ap.status === 'ACTIVE'
                            ? 'bg-emerald-500 animate-pulse'
                            : ap.status === 'MAINTENANCE'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`} />
                        {ap.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(ap)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-rose-500 rounded-lg transition"
                          title="Edit AP details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ap)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-red-500 rounded-lg transition"
                          title="Delete AP"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRUD Form Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-250 dark:border-slate-800/80 shadow-2xl w-full max-w-3xl overflow-hidden animate-slide-up">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center p-5 border-b border-gray-150 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {isEditMode ? 'Edit Access Point' : 'Register Access Point'}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                      {isEditMode ? 'Update existing AP hardware mapping and IP configuration.' : 'Add new Wi-Fi transmitter with localized branch context.'}
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

              {/* Modal Form Body */}
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                
                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800 text-red-755 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Subsidiary Entity */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Subsidiary Entity *
                    </label>
                    <div className="relative group">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                      <select
                        value={formCompanyId}
                        onChange={(e) => setFormCompanyId(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-800/80 text-gray-755 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                        required
                      >
                        {companies.map(comp => (
                          <option key={comp.id} value={comp.id}>
                            {comp.name} ({comp.location})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* SSID Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      SSID (Wi-Fi Name) *
                    </label>
                    <div className="relative group">
                      <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="e.g. MRA-Corporate"
                        value={formSsid}
                        onChange={(e) => setFormSsid(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                        required
                      />
                    </div>
                  </div>

                  {/* Wi-Fi Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Wi-Fi Password / Security Key
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                      <input
                        type={showFormPassword ? 'text' : 'password'}
                        placeholder="e.g. SecretPassword123"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-800/80 text-gray-755 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-450 hover:text-rose-500 transition duration-150"
                      >
                        {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* MAC Address (BSSID) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      MAC Address (BSSID) *
                    </label>
                    <div className="relative group">
                      <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="e.g. 74:ac:b9:2d:11:a4"
                        value={formBssid}
                        onChange={(e) => setFormBssid(e.target.value)}
                        disabled={isEditMode}
                        className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      />
                    </div>
                    {!isEditMode && (
                      <p className="text-[9px] text-gray-400 mt-0.5">Must be unique format `xx:xx:xx:xx:xx:xx`</p>
                    )}
                  </div>

                  {/* Location Detail */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Placement Location *
                    </label>
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="e.g. Gedung Wisma Lantai 4, Ruang Finance"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                        required
                      />
                    </div>
                  </div>

                  {/* IP Address */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Management IP Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 192.168.1.50"
                      value={formIpAddress}
                      onChange={(e) => setFormIpAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                    />
                  </div>

                  {/* AP Hardware Vendor */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      AP Hardware Vendor
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ubiquiti"
                      value={formVendor}
                      onChange={(e) => setFormVendor(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                    />
                  </div>

                  {/* Model Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Hardware Model Serial
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UniFi AP-AC-Pro"
                      value={formModelName}
                      onChange={(e) => setFormModelName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                    />
                  </div>

                  {/* Status Options */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Operation Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>

                  {/* Frequency Band */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Frequency Band
                    </label>
                    <select
                      value={formFrequency}
                      onChange={(e) => setFormFrequency(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                    >
                      <option value="5GHz">5 GHz</option>
                      <option value="2.4GHz">2.4 GHz</option>
                      <option value="6GHz">6 GHz</option>
                      <option value="Dual-Band">Dual-Band</option>
                    </select>
                  </div>

                  {/* Channel */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Channel
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 149"
                      value={formChannel}
                      onChange={(e) => setFormChannel(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                    />
                  </div>

                  {/* Security Protection */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Security Protection
                    </label>
                    <select
                      value={formSecurityType}
                      onChange={(e) => setFormSecurityType(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-800/80 text-gray-755 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                    >
                      <option value="WPA2-Enterprise">WPA2-Enterprise</option>
                      <option value="WPA2-Personal">WPA2-Personal</option>
                      <option value="WPA3-Personal">WPA3-Personal</option>
                      <option value="WPA3-Enterprise">WPA3-Enterprise</option>
                      <option value="Open">Open (No Security)</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="p-5 border-t border-gray-150 dark:border-slate-850 flex justify-end gap-3 bg-gray-50/50 dark:bg-slate-900/35">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100/50 dark:hover:bg-slate-800/60 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isEditMode ? 'Update AP' : 'Register AP'}
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
