import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, ShieldAlert, Building2, Search, Filter, ShieldCheck, Loader2, Plus, X, Key, Mail } from 'lucide-react';
import ReactLoader from '../components/ReactLoader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Users({ user: currentUser, token }) {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [error, setError] = useState(null);

  // Add User Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Password123!');
  const [newPhone, setNewPhone] = useState('');
  const [newCompanyId, setNewCompanyId] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newJobPosition, setNewJobPosition] = useState('');
  const [newRole, setNewRole] = useState('USER');
  const [formError, setFormError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Reset Password states
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetError, setResetError] = useState(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Edit Email states
  const [editEmailUser, setEditEmailUser] = useState(null);
  const [newEditEmail, setNewEditEmail] = useState('');
  const [editEmailError, setEditEmailError] = useState(null);
  const [editEmailSubmitting, setEditEmailSubmitting] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const params = new URLSearchParams();
      if (selectedCompanyId) params.append('companyId', selectedCompanyId);
      if (selectedRole) params.append('role', selectedRole);
      if (selectedDepartment) params.append('department', selectedDepartment);
      if (searchQuery) params.append('search', searchQuery);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`${API_URL}/users${queryString}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch users.');
      const data = await res.json();
      setUsers(data);
      setHasProcessed(true);
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
        setAllCompanies(data);
        
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

  const handleResetFilters = () => {
    setSelectedCompanyId('');
    setSelectedRole('');
    setSelectedDepartment('');
    setSearchQuery('');
    setUsers([]);
    setHasProcessed(false);
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
        throw new Error(data.error || 'Failed to update access role.');
      }

      // Success, refresh list
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setFormError(null);
      setFormSubmitting(true);

      if (!newId || !newName || !newEmail || !newPassword || !newDepartment || !newJobPosition || !newCompanyId || !newRole) {
        throw new Error('All fields except Phone are required.');
      }

      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: newId,
          name: newName,
          email: newEmail,
          password: newPassword,
          phone: newPhone,
          companyId: parseInt(newCompanyId),
          department: newDepartment,
          jobPosition: newJobPosition,
          role: newRole
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create user.');
      }

      // Success! Reset form and refresh list
      setNewId('');
      setNewName('');
      setNewEmail('');
      setNewPassword('Password123!');
      setNewPhone('');
      setNewCompanyId('');
      setNewDepartment('');
      setNewJobPosition('');
      setNewRole('USER');
      setShowAddModal(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    try {
      setResetError(null);
      setResetSubmitting(true);

      if (!newResetPassword || newResetPassword.trim().length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const res = await fetch(`${API_URL}/users/${resetPasswordUser.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newResetPassword })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reset password.');
      }

      // Success
      alert(`Password for ${resetPasswordUser.name} reset successfully!`);
      setResetPasswordUser(null);
      setNewResetPassword('');
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleEditEmail = async (e) => {
    e.preventDefault();
    if (!editEmailUser) return;
    try {
      setEditEmailError(null);
      setEditEmailSubmitting(true);

      const res = await fetch(`${API_URL}/users/${editEmailUser.id}/email`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: newEditEmail })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update email.');
      }

      // Success
      alert(`Email for ${editEmailUser.name} updated successfully to ${newEditEmail}!`);
      setEditEmailUser(null);
      setNewEditEmail('');
      fetchUsers(); // Refresh list
    } catch (err) {
      setEditEmailError(err.message);
    } finally {
      setEditEmailSubmitting(false);
    }
  };

  // Safe Role check: Admin and Agent only page
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'AGENT') {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500 animate-bounce" />
        <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200">Access Denied</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 text-center max-w-md">
          The Employee & IT Agent Management page is only accessible by system administrators and IT agents.
        </p>
      </div>
    );
  }

  // Advanced query results are processed directly from the backend API

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <UsersIcon className="w-8 h-8 text-brand-500" />
            User Management
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">
            List of all MRA group employees, departments, and role access settings.
          </p>
        </div>

        {currentUser.role === 'ADMIN' && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/15 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Add New User</span>
          </button>
        )}
      </div>

      {/* Advanced Filter Options Panel */}
      <div className="glass-card p-6 rounded-2xl border border-gray-200/50 dark:border-slate-800/30 space-y-4 shadow-sm animate-fade-in">
        <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-500" />
          <span>Advanced Search & Filters</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Company filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-gray-450 dark:text-slate-500 uppercase tracking-wider block">Company</label>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-sm">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer w-full"
              >
                <option value="">All Companies</option>
                {companies.map(comp => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-gray-450 dark:text-slate-500 uppercase tracking-wider block">Department</label>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-sm">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="e.g. IT, Finance, HR..."
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full placeholder-gray-450 dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* Role filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-gray-450 dark:text-slate-500 uppercase tracking-wider block">Access Level (Role)</label>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-sm">
              <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer w-full"
              >
                <option value="">All Roles</option>
                <option value="USER">USER (Employee)</option>
                <option value="AGENT">AGENT (IT Staff)</option>
                <option value="ADMIN">ADMIN (Super User)</option>
              </select>
            </div>
          </div>

          {/* Search box */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-gray-450 dark:text-slate-500 uppercase tracking-wider block">Keyword Search</label>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-sm">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full placeholder-gray-450 dark:placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex justify-end items-center gap-3 pt-2 border-t border-gray-100 dark:border-slate-800/40">
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-600 dark:text-slate-350 text-xs font-bold rounded-xl transition-all"
          >
            Clear Filters
          </button>
          
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-brand-500/10 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Process & Load Users</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {!hasProcessed ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-gray-200/50 dark:border-slate-800/30 max-w-2xl mx-auto space-y-6 animate-scale-up mt-4">
          <div className="w-16 h-16 rounded-full bg-brand-50/50 dark:bg-brand-950/30 text-brand-500 flex items-center justify-center mx-auto shadow-inner">
            <UsersIcon className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-gray-800 dark:text-slate-100">Ready to Process Employee List</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              MRA Group contains over 600 employee and agent accounts. Select your filter criteria above and click <strong>"Process & Load Users"</strong> to fetch data efficiently.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="mx-auto flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/15 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            <span>Process & Load All Users</span>
          </button>
        </div>
      ) : (
        /* Users List Table */
        <div className="glass-card rounded-3xl border border-gray-200/50 dark:border-slate-800/30 overflow-hidden">
          {loading ? (
            <ReactLoader size="md" text="Processing query results..." />
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-gray-500 dark:text-slate-500">
              No registered users matched the search query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-200/50 dark:border-slate-800/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Employee ID</th>
                    <th className="py-4 px-6">Full Name</th>
                    <th className="py-4 px-6">Company / Branch</th>
                    <th className="py-4 px-6">Department / Position</th>
                    <th className="py-4 px-6 text-center">Access Level (Role)</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-sm">
                  {users.map(u => (
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
                                disabled={u.id === currentUser.id || currentUser.role !== 'ADMIN'} // Cannot edit own role to prevent lockout; Only Admins can modify roles
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none pr-4 cursor-pointer"
                              >
                                <option value="USER">USER</option>
                                <option value="AGENT">AGENT</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditEmailUser(u);
                              setNewEditEmail(u.email);
                              setEditEmailError(null);
                            }}
                            className="p-1.5 bg-gray-50 hover:bg-gray-150 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-gray-600 dark:text-slate-350 rounded-lg text-xs font-bold transition-all border border-gray-200/50 dark:border-slate-700/50 inline-flex items-center gap-1.5 shadow-sm"
                            title="Edit user email address"
                          >
                            <Mail className="w-3.5 h-3.5 text-brand-500" />
                            <span>Edit Email</span>
                          </button>
                          
                          {currentUser.role === 'ADMIN' && (
                            <button
                              type="button"
                              onClick={() => {
                                setResetPasswordUser(u);
                                setNewResetPassword('');
                                setResetError(null);
                              }}
                              className="p-1.5 bg-gray-50 hover:bg-gray-150 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-gray-600 dark:text-slate-350 rounded-lg text-xs font-bold transition-all border border-gray-200/50 dark:border-slate-700/50 inline-flex items-center gap-1.5 shadow-sm"
                              title="Set new password for this user"
                            >
                              <Key className="w-3.5 h-3.5 text-amber-500" />
                              <span>Set Password</span>
                            </button>
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
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)}></div>
          
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 p-6 border border-gray-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">Add New User</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Register a new employee or IT Agent in the system.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold animate-pulse">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 40822045"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@mragroup.co.id"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Password</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Company & Location</label>
                  <select
                    required
                    value={newCompanyId}
                    onChange={(e) => setNewCompanyId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs cursor-pointer"
                  >
                    <option value="">-- Select Company Branch --</option>
                    {allCompanies.map(comp => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name} ({comp.location})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Department</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IT Department"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Job Position</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IT Support Specialist"
                    value={newJobPosition}
                    onChange={(e) => setNewJobPosition(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Phone Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 0812345678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Access Role</label>
                  <select
                    required
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs cursor-pointer font-bold animate-pulse"
                  >
                    <option value="USER">USER (Employee)</option>
                    <option value="AGENT">AGENT (IT Staff)</option>
                    <option value="ADMIN">ADMIN (Super User)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 text-xs font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-500/10 flex items-center gap-1.5 transition-colors"
                >
                  {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="absolute inset-0" onClick={() => setResetPasswordUser(null)}></div>
          
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 p-6 border border-gray-200 dark:border-slate-800">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Set New Password</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Change password for <strong>{resetPasswordUser.name}</strong> (ID: {resetPasswordUser.id}).
                </p>
              </div>
              <button 
                onClick={() => setResetPasswordUser(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold animate-pulse">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">New Password</label>
                <input
                  type="text"
                  required
                  placeholder="At least 6 characters"
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 text-xs font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-500/10 flex items-center gap-1.5 transition-colors"
                >
                  {resetSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Email Modal */}
      {editEmailUser && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="absolute inset-0" onClick={() => setEditEmailUser(null)}></div>
          
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 p-6 border border-gray-200 dark:border-slate-800">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Edit User Email</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Update email address for <strong>{editEmailUser.name}</strong> (ID: {editEmailUser.id}).
                </p>
              </div>
              <button 
                onClick={() => setEditEmailUser(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editEmailError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold animate-pulse">
                {editEmailError}
              </div>
            )}

            <form onSubmit={handleEditEmail} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">New Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. name@mragroup.co.id"
                  value={newEditEmail}
                  onChange={(e) => setNewEditEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditEmailUser(null)}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 text-xs font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editEmailSubmitting}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-500/10 flex items-center gap-1.5 transition-colors"
                >
                  {editEmailSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
