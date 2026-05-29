import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, ShieldAlert, Building2, Search, Filter, ShieldCheck, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Users({ user: currentUser, token }) {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, [selectedCompanyId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      let query = '';
      if (selectedCompanyId) query = `?companyId=${selectedCompanyId}`;

      const res = await fetch(`${API_URL}/users${query}`, { headers });
      if (!res.ok) throw new Error('Gagal mengambil daftar pengguna.');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API_URL}/companies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Unique names
        const unique = [];
        const map = new Map();
        for (const item of data) {
          if (!map.has(item.name)) {
            map.set(item.name, true);
            unique.push(item);
          }
        }
        setCompanies(unique);
      }
    } catch (err) {}
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingUserId(userId);
      const res = await fetch(`${API_URL}/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal memperbarui hak akses.');
      }

      // Success, refresh list
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Safe Role check: Admin only page
  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500 animate-bounce" />
        <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200">Akses Ditolak</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 text-center max-w-md">
          Halaman Manajemen Karyawan & Agen IT hanya dapat diakses oleh administrator sistem.
        </p>
      </div>
    );
  }

  // Filter users based on query search
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <UsersIcon className="w-8 h-8 text-brand-500" />
          Manajemen User
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">
          Daftar seluruh karyawan grup MRA, departemen, serta pengaturan hak akses peran (Role).
        </p>
      </div>

      {/* Filter Options Panel */}
      <div className="glass-card p-4 rounded-2xl border border-gray-200/50 dark:border-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Company filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-sm w-full sm:w-auto">
          <Building2 className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none pr-4 cursor-pointer w-full"
          >
            <option value="">Semua Perusahaan</option>
            {companies.map(comp => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search box */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Cari nama, email, atau ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 shadow-sm"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
        </div>

      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Users List Table */}
      <div className="glass-card rounded-3xl border border-gray-200/50 dark:border-slate-800/30 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex justify-center">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-slate-500">
            Tidak ada pengguna yang terdaftar atau cocok dengan kata kunci pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-200/50 dark:border-slate-800/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">ID Karyawan</th>
                  <th className="py-4 px-6">Nama Lengkap</th>
                  <th className="py-4 px-6">Perusahaan / Cabang</th>
                  <th className="py-4 px-6">Departemen / Posisi</th>
                  <th className="py-4 px-6 text-center">Hak Akses (Role)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-sm">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/30 dark:hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-bold text-gray-500">{u.id}</td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-800 dark:text-slate-200">{u.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{u.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-700 dark:text-slate-300 truncate max-w-[160px]">{u.company.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{u.company.location}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-700 dark:text-slate-300">{u.department}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{u.jobPosition}</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {updatingUserId === u.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                        ) : (
                          <>
                            <ShieldCheck className={`w-4 h-4 shrink-0 ${
                              u.role === 'ADMIN' ? 'text-red-500' : u.role === 'AGENT' ? 'text-brand-500' : 'text-slate-400'
                            }`} />
                            <select
                              disabled={u.id === currentUser.id} // Cannot edit own role to prevent lockout
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-xs font-bold text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="USER">USER (Karyawan)</option>
                              <option value="AGENT">AGENT (IT Staff)</option>
                              <option value="ADMIN">ADMIN (Super User)</option>
                            </select>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
