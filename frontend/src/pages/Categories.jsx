import React, { useState, useEffect } from 'react';
import { Tags, Plus, Trash2, Loader2, AlertCircle, CheckCircle2, Search, FolderTree, Wrench, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MAIN_CATEGORIES = ['Hardware', 'Software', 'Network', 'Access', 'ERP', 'IT Peripheral'];

export default function Categories({ user, token }) {
  const [categories, setCategories] = useState([]);
  const [peripheralCategories, setPeripheralCategories] = useState([]);
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

  // Brands modal states
  const [isBrandsModalOpen, setIsBrandsModalOpen] = useState(false);
  const [selectedCategoryObj, setSelectedCategoryObj] = useState(null);
  const [tempBrands, setTempBrands] = useState([]);
  const [newBrandInput, setNewBrandInput] = useState('');
  const [savingBrands, setSavingBrands] = useState(false);

  const handleOpenBrandsModal = (item) => {
    setSelectedCategoryObj(item);
    setTempBrands(item.brands || []);
    setNewBrandInput('');
    setIsBrandsModalOpen(true);
  };

  const handleAddTempBrand = (e) => {
    e.preventDefault();
    const cleanBrand = newBrandInput.trim();
    if (!cleanBrand) return;
    if (tempBrands.includes(cleanBrand)) {
      setNewBrandInput('');
      return;
    }
    setTempBrands([...tempBrands, cleanBrand]);
    setNewBrandInput('');
  };

  const handleRemoveTempBrand = (brandToRemove) => {
    setTempBrands(tempBrands.filter(b => b !== brandToRemove));
  };

  const handleSaveBrands = async () => {
    if (!selectedCategoryObj) return;
    setSavingBrands(true);
    setError(null);
    setSuccessMsg(null);

    const isPeripheral = selectedCategoryObj.category === 'IT Peripheral';
    const endpoint = isPeripheral
      ? `${API_URL}/peripherals/categories/${selectedCategoryObj.id}`
      : `${API_URL}/tickets/categories/${selectedCategoryObj.id}`;

    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ brands: tempBrands })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update associated brands.');

      const subName = isPeripheral ? selectedCategoryObj.name : selectedCategoryObj.subCategory;
      setSuccessMsg(`Brands for "${subName}" successfully updated.`);
      
      // Update local categories state
      if (isPeripheral) {
        setPeripheralCategories(prev => prev.map(c => c.id === selectedCategoryObj.id ? { ...c, brands: tempBrands } : c));
      } else {
        setCategories(prev => prev.map(c => c.id === selectedCategoryObj.id ? { ...c, brands: tempBrands } : c));
      }
      setIsBrandsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingBrands(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketRes, peripheralRes] = await Promise.all([
        fetch(`${API_URL}/tickets/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/peripherals/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!ticketRes.ok) throw new Error('Failed to fetch ticket category metadata.');
      if (!peripheralRes.ok) throw new Error('Failed to fetch peripheral category metadata.');

      const ticketData = await ticketRes.json();
      const peripheralData = await peripheralRes.json();

      setCategories(ticketData);
      setPeripheralCategories(peripheralData);
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

    const isPeripheral = newCategory === 'IT Peripheral';
    const endpoint = isPeripheral
      ? `${API_URL}/peripherals/categories`
      : `${API_URL}/tickets/categories`;

    const body = isPeripheral
      ? { name: newSubCategory.trim() }
      : { category: newCategory, subCategory: newSubCategory.trim() };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
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

    const isPeripheral = categoryName === 'IT Peripheral';
    const endpoint = isPeripheral
      ? `${API_URL}/peripherals/categories/${id}`
      : `${API_URL}/tickets/categories/${id}`;

    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category mapping.');

      setSuccessMsg(`"${subName}" deleted successfully.`);
      if (isPeripheral) {
        setPeripheralCategories(prev => prev.filter(c => c.id !== id));
      } else {
        setCategories(prev => prev.filter(c => c.id !== id));
      }

      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter categories by tab and search query
  const isPeripheralTab = activeTab === 'IT Peripheral';

  const filteredSubCategories = isPeripheralTab
    ? peripheralCategories.filter(item => {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : categories.filter(item => {
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredSubCategories.map((item) => (
                    <div 
                      key={item.id}
                      className="flex flex-col justify-between p-4 bg-white/70 dark:bg-slate-900/60 border border-gray-150 dark:border-slate-800/40 rounded-2xl hover:border-brand-500/30 dark:hover:border-brand-500/20 hover:bg-brand-50/10 dark:hover:bg-brand-950/10 group transition-all animate-fade-in relative min-h-[90px]"
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <Tags className="w-3.5 h-3.5 text-brand-500/60 shrink-0" />
                          <span className="text-xs font-bold text-gray-850 dark:text-slate-250 truncate">
                            {isPeripheralTab ? item.name : item.subCategory}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          {/* Manage Brands Button */}
                          <button
                            onClick={() => handleOpenBrandsModal(isPeripheralTab ? { ...item, category: 'IT Peripheral' } : item)}
                            className="p-1.5 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:text-brand-500 text-gray-400 dark:text-slate-500 rounded-lg transition-colors"
                            title="Manage Brands"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteCategory(item.id, isPeripheralTab ? 'IT Peripheral' : item.category, isPeripheralTab ? item.name : item.subCategory)}
                            disabled={deletingId === item.id}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 text-gray-400 dark:text-slate-500 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete subcategory"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Associated Brands List */}
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {item.brands && item.brands.length > 0 ? (
                          item.brands.map(brand => (
                            <span 
                              key={brand} 
                              className="px-2 py-0.5 bg-gray-150 dark:bg-slate-800 text-gray-700 dark:text-slate-350 text-[9px] font-bold rounded-md"
                            >
                              {brand}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] text-gray-400 italic">No brands set</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
      {/* Brands Manager Modal */}
      {isBrandsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-250 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-150 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-500/10 text-brand-500 rounded-xl">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                    Manage Brands
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                    Category: {selectedCategoryObj?.category} &rarr; {selectedCategoryObj?.subCategory || selectedCategoryObj?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBrandsModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Add Brand Form */}
              <form onSubmit={handleAddTempBrand} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type brand name (e.g. Hikvision)"
                  value={newBrandInput}
                  onChange={(e) => setNewBrandInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-955/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                />
                <button
                  type="submit"
                  disabled={!newBrandInput.trim()}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  Add
                </button>
              </form>

              {/* Brands Tags Area */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-450 dark:text-slate-500 uppercase tracking-wider">
                  Associated Brands
                </label>
                <div className="min-h-[100px] max-h-[180px] overflow-y-auto p-3 bg-gray-50/50 dark:bg-slate-955/20 border border-gray-200 dark:border-slate-850 rounded-2xl flex flex-wrap gap-1.5 content-start">
                  {tempBrands.length === 0 ? (
                    <span className="text-xs text-gray-400 italic font-medium m-auto">No brands added yet. Type above to add.</span>
                  ) : (
                    tempBrands.map(b => (
                      <span
                        key={b}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-55 dark:bg-slate-800 text-brand-600 dark:text-slate-300 text-xs font-extrabold rounded-lg"
                      >
                        {b}
                        <button
                          type="button"
                          onClick={() => handleRemoveTempBrand(b)}
                          className="hover:text-red-500 text-gray-400 dark:text-slate-500 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-3 p-5 border-t border-gray-150 dark:border-slate-850">
              <button
                type="button"
                onClick={() => setIsBrandsModalOpen(false)}
                className="px-4 py-2 border border-gray-250 dark:border-slate-855 hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-655 dark:text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveBrands}
                disabled={savingBrands}
                className="flex items-center gap-1.5 px-5 py-2 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-brand-500/10 disabled:opacity-50"
              >
                {savingBrands ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Simpan</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
