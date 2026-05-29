import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus2, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function InputTicket({ user, token }) {
  const navigate = useNavigate();

  // Master Lists
  const [allCompanies, setAllCompanies] = useState([]); // Raw company data
  const [uniqueCompanyNames, setUniqueCompanyNames] = useState([]); // For Dropdown 1
  const [locations, setLocations] = useState([]); // For Dropdown 2 (Filtered)
  const [employees, setEmployees] = useState([]); // For Dropdown 3 (Fetched)
  
  // Selected values
  const [selectedCompName, setSelectedCompName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // Ticket Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [priority, setPriority] = useState('LOW');

  // Page States
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API_URL}/companies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mengambil daftar perusahaan.');
      const data = await res.json();
      setAllCompanies(data);

      // Get unique company names
      const names = Array.from(new Set(data.map(c => c.name))).sort();
      setUniqueCompanyNames(names);

      // If user is a normal employee (USER), auto-fill their company
      if (user.role === 'USER') {
        const userCompany = data.find(c => c.id === user.companyId);
        if (userCompany) {
          setSelectedCompName(userCompany.name);
          // Trigger effect for locations
          const filteredLocs = data.filter(c => c.name === userCompany.name).sort((a,b) => a.location.localeCompare(b.location));
          setLocations(filteredLocs);
          setSelectedLocation(userCompany.location);
          setSelectedCompanyId(userCompany.id);
          
          // Auto-select themselves as requester
          setEmployees([{
            id: user.id,
            name: user.name,
            department: user.department
          }]);
          setSelectedEmployeeId(user.id);
          setSelectedDepartment(user.department);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Dropdown 1: Handle Company Name selection
  const handleCompanyNameChange = (e) => {
    const compName = e.target.value;
    setSelectedCompName(compName);
    
    // Reset subordinate selections
    setSelectedLocation('');
    setLocations([]);
    setSelectedCompanyId('');
    setSelectedEmployeeId('');
    setEmployees([]);
    setSelectedDepartment('');

    if (compName) {
      // Filter locations under selected company name
      const filtered = allCompanies.filter(c => c.name === compName).sort((a, b) => a.location.localeCompare(b.location));
      setLocations(filtered);
    }
  };

  // Dropdown 2: Handle Location selection
  const handleLocationChange = (e) => {
    const loc = e.target.value;
    setSelectedLocation(loc);
    
    // Reset employee selections
    setSelectedCompanyId('');
    setSelectedEmployeeId('');
    setEmployees([]);
    setSelectedDepartment('');

    if (loc) {
      // Find the specific company record to get companyId
      const compRecord = locations.find(c => c.location === loc);
      if (compRecord) {
        setSelectedCompanyId(compRecord.id);
        fetchEmployees(compRecord.id);
      }
    }
  };

  // Fetch employees for selected companyId (Dropdown 3)
  const fetchEmployees = async (companyId) => {
    try {
      const res = await fetch(`${API_URL}/companies/${companyId}/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mengambil daftar karyawan.');
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Dropdown 3: Handle Employee selection
  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    setSelectedEmployeeId(empId);
    setSelectedDepartment('');

    if (empId) {
      const emp = employees.find(x => x.id === empId);
      if (emp) {
        setSelectedDepartment(emp.department);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !selectedCompanyId || !selectedEmployeeId) {
      setError('Harap lengkapi semua isian formulir.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          companyId: selectedCompanyId,
          requesterId: selectedEmployeeId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan tiket baru.');

      setSuccess(true);
      setTimeout(() => {
        navigate('/tickets');
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <FilePlus2 className="w-8 h-8 text-brand-500" />
          Input Tiket Baru
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">
          Daftarkan laporan kerusakan atau kebutuhan bantuan IT baru.
        </p>
      </div>

      {success ? (
        <div className="glass-card p-8 rounded-3xl border border-emerald-500/20 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200">Tiket Berhasil Dibuat!</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Tiket bantuan Anda telah disimpan dan SLA sudah mulai berjalan. Mengalihkan...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card p-8 rounded-3xl border border-gray-200/50 dark:border-slate-800/30 space-y-6">
          
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Cascade Dropdowns Row 1: Company & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Dropdown 1: Company Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                1. Perusahaan (Company)
              </label>
              <select
                disabled={user.role === 'USER'}
                value={selectedCompName}
                onChange={handleCompanyNameChange}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-sm cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Pilih Perusahaan --</option>
                {uniqueCompanyNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Dropdown 2: Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                2. Lokasi / Cabang (Location)
              </label>
              <select
                disabled={user.role === 'USER' || !selectedCompName}
                value={selectedLocation}
                onChange={handleLocationChange}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-sm cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Pilih Lokasi --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.location}>{loc.location}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Cascade Dropdowns Row 2: Employee & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Dropdown 3: Employee Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                3. Nama Karyawan (Requester)
              </label>
              <select
                disabled={user.role === 'USER' || !selectedLocation}
                value={selectedEmployeeId}
                onChange={handleEmployeeChange}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-sm cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Pilih Karyawan --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            {/* Read-Only: Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                4. Departemen
              </label>
              <input
                type="text"
                readOnly
                value={selectedDepartment}
                placeholder="Otomatis terisi..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-500 dark:text-slate-400 focus:outline-none text-sm cursor-not-allowed"
              />
            </div>

          </div>

          <div className="border-t border-gray-200/50 dark:border-slate-800/50 my-6"></div>

          {/* Ticket Categorization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                Kategori Gangguan
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-sm cursor-pointer"
              >
                <option value="Hardware">Hardware (Perangkat Keras)</option>
                <option value="Software">Software (Perangkat Lunak)</option>
                <option value="Network">Network (Jaringan/Internet)</option>
                <option value="Access">Access / Account (Akun & Sandi)</option>
              </select>
            </div>

            {/* Priority selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                Skala Prioritas (Urgensi)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-sm cursor-pointer"
              >
                <option value="LOW">LOW (Rendah - Penanganan Max 24 Jam)</option>
                <option value="MEDIUM">MEDIUM (Sedang - Penanganan Max 6 Jam)</option>
                <option value="HIGH">HIGH (Tinggi - Penanganan Max 2 Jam)</option>
              </select>
            </div>

          </div>

          {/* Ticket Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
              Subjek / Judul Gangguan
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Mesin POS Kasir Hang / Tidak Bisa Cetak Struk"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-sm"
            />
          </div>

          {/* Ticket Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
              Deskripsi Detail Keluhan
            </label>
            <textarea
              required
              rows={4}
              placeholder="Harap deskripsikan masalah secara mendetail (misal: kode error, langkah kejadian, atau jenis perangkat yang bermasalah)."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-sm"
            ></textarea>
          </div>

          {/* Submit Row */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-brand-500/10 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <span>Kirim Tiket</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
