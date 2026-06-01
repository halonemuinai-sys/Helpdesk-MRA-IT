import React, { useState, useEffect } from 'react';
import { Tags, Plus, Trash2, Loader2, AlertCircle, CheckCircle2, Search, FolderTree } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MAIN_CATEGORIES = ['Hardware', 'Software', 'Network', 'Access', 'ERP'];

export default function Categories({ user, token }) {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('Hardware');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [newCategory, setNewCategory] = useState('Hardware');
  const [newSubCategory, setNewSubCategory] = useState('');
  
  // Page states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/tickets/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch category metadata.');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newSubCategory.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_URL}/tickets/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: newCategory,
          subCategory: newSubCategory.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add category mapping.');

      setSuccessMsg(`"${newSubCategory}" successfully added to ${newCategory}!`);
      setNewSubCategory('');
      
      // Update local state by inserting the new category or fetching again
      await fetchCategories();
      
      // Auto switch active tab to where it was added
      setActiveTab(newCategory);

      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id, categoryName, subName) => {
    if (!window.confirm(`Are you sure you want to delete "${subName}" from "${categoryName}"?`)) return;

    setDeletingId(id);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_URL}/tickets/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category mapping.');

      setSuccessMsg(`"${subName}" deleted successfully.`);
      setCategories(prev => prev.filter(c => c.id !== id));

      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter categories by tab and search query
  const filteredSubCategories = categories.filter(item => {
    const matchesTab = item.category === activeTab;
    const matchesSearch = item.subCategory.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-fade-in">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FolderTree className="w-7 h-7 text-brand-500" />
            Category & Sub-Category Settings
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
            Manage ticket detailing categories. Adding items here will update the dropdown choices during ticket creation.
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-3 animate-slide-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Create New Master Option Form */}
        <div className="glass-card p-6 rounded-3xl border border-gray-200/50 dark:border-slate-800/30 space-y-4">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-500" />
            <span>Add New Detailing</span>
          </h3>

          <form onSubmit={handleAddCategory} className="space-y-4">
            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-xl text-gray-850 dark:text-slate-250 focus:outline-none text-xs cursor-pointer font-semibold"
              >
                {MAIN_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sub-Category Name Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                Sub-Category / Issue Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Retailsoft ERP, Printer Epson, Wi-Fi"
                value={newSubCategory}
                onChange={(e) => setNewSubCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 focus:border-brand-500 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none text-xs"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !newSubCategory.trim()}
              className="w-full px-4 py-2.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-brand-500/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding Master Data...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Master Data</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: List & Search Panel */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-gray-200/50 dark:border-slate-800/30 space-y-4">
          
          {/* Tabs Navigation & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-150 dark:border-slate-800/80 pb-3 gap-3">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {MAIN_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === cat
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10 scale-102'
                      : 'bg-gray-100 hover:bg-gray-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-650 dark:text-slate-350'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input Box */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subcategory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50/50 dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-lg text-xs text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* List Content */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 space-y-2">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              <span className="text-xs font-semibold">Loading master data...</span>
            </div>
          ) : (
            <div className="min-h-64">
              {filteredSubCategories.length === 0 ? (
                <div className="py-12 text-center text-gray-450 dark:text-slate-500 text-xs font-medium">
                  {searchQuery 
                    ? `No sub-categories matched "${searchQuery}" in ${activeTab}`
                    : `No sub-categories defined under ${activeTab}.`
                  }
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredSubCategories.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between px-4 py-3 bg-white/70 dark:bg-slate-900/60 border border-gray-150 dark:border-slate-800/40 rounded-2xl hover:border-brand-500/30 dark:hover:border-brand-500/20 hover:bg-brand-50/10 dark:hover:bg-brand-950/10 group transition-all animate-fade-in"
                    >
                      <div className="flex items-center gap-2 overflow-hidden mr-2">
                        <Tags className="w-3.5 h-3.5 text-brand-500/60 shrink-0" />
                        <span className="text-xs font-bold text-gray-850 dark:text-slate-250 truncate">
                          {item.subCategory}
                        </span>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteCategory(item.id, item.category, item.subCategory)}
                        disabled={deletingId === item.id}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 text-gray-400 dark:text-slate-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 shrink-0"
                        title="Delete subcategory"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
