import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus2, CheckCircle2, AlertCircle, Loader2, ArrowRight, Clock, ChevronDown, Search, X } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';

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
  
  // Custom date/time for retroactive ticket creation (Backdate)
  const [customCreatedAt, setCustomCreatedAt] = useState(null);

  // Ticket Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [subCategory, setSubCategory] = useState('');
  const [priority, setPriority] = useState('LOW');
  const [source, setSource] = useState('Walk-in');

  // Categories Metadata States
  const [categoriesMetadata, setCategoriesMetadata] = useState([]);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [subSearch, setSubSearch] = useState('');
  const subRef = useRef(null);

  // Page States
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all companies & categories on mount
  useEffect(() => {
    fetchCompanies();
    fetchCategoriesMetadata();
  }, []);

  // Handle click outside sub-category dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (subRef.current && !subRef.current.contains(event.target)) {
        setIsSubOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategoriesMetadata = async () => {
    try {
      const res = await fetch(`${API_URL}/tickets/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch categories metadata.');
      const data = await res.json();
      setCategoriesMetadata(data);
    } catch (err) {
      console.error('Error fetching category metadata:', err.message);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API_URL}/companies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch companies.');
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
  const handleCompanyNameChange = (val) => {
    const compName = typeof val === 'object' && val?.target ? val.target.value : val;
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
  const handleLocationChange = (val) => {
    const loc = typeof val === 'object' && val?.target ? val.target.value : val;
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
      if (!res.ok) throw new Error('Failed to fetch employees.');
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Dropdown 3: Handle Employee selection
  const handleEmployeeChange = (val) => {
    const empId = typeof val === 'object' && val?.target ? val.target.value : val;
    setSelectedEmployeeId(empId);
    setSelectedDepartment('');

    if (empId) {
      const emp = employees.find(x => x.id === empId);
      if (emp) {
        setSelectedDepartment(emp.department);
      }
    }
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setSubCategory('');
    setSubSearch('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !selectedCompanyId || !selectedEmployeeId || !subCategory) {
      setError('Please complete all form fields, including Sub-Category / Detailing.');
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
          subCategory,
          priority,
          source,
          companyId: selectedCompanyId,
          requesterId: selectedEmployeeId,
          createdAt: customCreatedAt ? customCreatedAt.toISOString() : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit new ticket.');

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
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <FilePlus2 className="w-7 h-7 text-brand-500" />
          Create New Ticket
        </h1>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
          Register a new damage report or IT assistance request.
        </p>
      </div>

      {success ? (
        <div className="glass-card p-8 rounded-3xl border border-emerald-500/20 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200">Ticket Created Successfully!</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Your ticket has been submitted. SLA countdown is active. Redirecting...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* Left Column: Reporter Information & Metadata */}
          <div className="glass-card p-6 rounded-3xl border border-gray-200/50 dark:border-slate-800/30 space-y-4 flex flex-col justify-between">
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center text-xs font-black">1</span>
                <span>Reporter & Metadata</span>
              </h3>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Company Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-350 uppercase tracking-wider block">
                  Company
                </label>
                <SearchableSelect
                  disabled={user.role === 'USER'}
                  value={selectedCompName}
                  onChange={handleCompanyNameChange}
                  options={uniqueCompanyNames}
                  placeholder="-- Select Company --"
                />
              </div>

              {/* Location Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-350 uppercase tracking-wider block">
                  Location / Branch
                </label>
                <SearchableSelect
                  disabled={user.role === 'USER' || !selectedCompName}
                  value={selectedLocation}
                  onChange={handleLocationChange}
                  options={locations}
                  labelKey="location"
                  valueKey="location"
                  placeholder="-- Select Location --"
                />
              </div>

              {/* Employee Requester Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-350 uppercase tracking-wider block">
                  Employee Name (Requester)
                </label>
                <SearchableSelect
                  disabled={user.role === 'USER' || !selectedLocation}
                  value={selectedEmployeeId}
                  onChange={handleEmployeeChange}
                  options={employees}
                  labelKey="name"
                  valueKey="id"
                  placeholder="-- Select Employee --"
                />
              </div>

              {/* Read-Only Department field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-350 uppercase tracking-wider block">
                  Department
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedDepartment}
                  placeholder="Auto-filled..."
                  className="w-full px-4 py-2.5 bg-gray-55/60 dark:bg-slate-950/60 border border-gray-250/60 dark:border-slate-800/80 rounded-xl text-gray-550 dark:text-slate-400 focus:outline-none text-xs cursor-not-allowed"
                />
              </div>

              {/* Incident Date & Time (Retroactive / Backdate) */}
              {['AGENT', 'ADMIN'].includes(user.role) && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-350 uppercase tracking-wider block">
                    Incident Date & Time (Retroactive)
                  </label>
                  <div className="flex items-center gap-2">
                    <Flatpickr
                      data-enable-time
                      value={customCreatedAt}
                      onChange={([date]) => setCustomCreatedAt(date)}
                      options={{
                        maxDate: new Date(),
                        dateFormat: "Y-m-d H:i",
                        time_24hr: true
                      }}
                      className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs cursor-pointer shadow-sm"
                      placeholder="Current Time (Now)"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomCreatedAt(new Date())}
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors shadow-sm shrink-0 flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5 text-brand-500" />
                      <span>Now</span>
                    </button>
                    {customCreatedAt && (
                      <button
                        type="button"
                        onClick={() => setCustomCreatedAt(null)}
                        className="px-2.5 py-2 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-xl text-[10px] font-black transition-colors shrink-0"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-450 dark:text-slate-500 font-medium leading-relaxed mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/40">
              💡 SLA response and resolution target deadlines will automatically be calculated relative to this ticket's creation timestamp.
            </p>
          </div>

          {/* Right Column: Issue Details & Subject */}
          <div className="glass-card p-6 rounded-3xl border border-gray-200/50 dark:border-slate-800/30 space-y-4 flex flex-col justify-between">
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center text-xs font-black">2</span>
                <span>Issue & Classification</span>
              </h3>

              {/* Subject / Issue Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-350 uppercase tracking-wider block">
                  Subject / Issue Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Example: POS Cashier machine froze / cannot print receipt"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 focus:border-brand-500 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none text-xs"
                />
              </div>

              {/* Categorization & Priority Grid (3 columns for layout compacting) */}
              <div className="grid grid-cols-3 gap-3">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={handleCategoryChange}
                    className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-xl text-gray-850 dark:text-slate-250 focus:outline-none text-xs cursor-pointer font-semibold"
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Network">Network</option>
                    <option value="Access">Access</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-xl text-gray-850 dark:text-slate-250 focus:outline-none text-xs cursor-pointer font-semibold"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                {/* Source */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                    Source
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-xl text-gray-850 dark:text-slate-250 focus:outline-none text-xs cursor-pointer font-semibold"
                  >
                    <option value="Walk-in">Walk-in</option>
                    <option value="Email">Email</option>
                    <option value="Phone Call">Phone</option>
                    <option value="Instant Messaging">IM</option>
                    <option value="Direct Instruction">Direct</option>
                    <option value="On-site Visit">On-site</option>
                    <option value="System Alert">Alert</option>
                  </select>
                </div>
              </div>

              {/* Sub-Category Detail */}
              <div className="space-y-1.5" ref={subRef}>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-350 uppercase tracking-wider block">
                  Sub-Category / Detailing
                </label>
                
                <div className="relative w-full">
                  {/* Select Trigger */}
                  <div
                    className={`w-full flex items-center justify-between border border-gray-250 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs overflow-hidden px-4 py-2.5 cursor-pointer shadow-sm focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all hover:border-gray-300 dark:hover:border-slate-700`}
                    onClick={() => setIsSubOpen(!isSubOpen)}
                  >
                    <span className={`truncate mr-2 ${subCategory ? 'text-gray-800 dark:text-slate-200 font-semibold' : 'text-gray-400 dark:text-slate-500'}`}>
                      {subCategory || '-- Select Sub-Category --'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isSubOpen ? 'transform rotate-180' : ''}`} />
                  </div>

                  {/* Dropdown Menu */}
                  {isSubOpen && (
                    <div className="absolute z-30 w-full mt-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl max-h-64 flex flex-col overflow-hidden animate-fade-in">
                      {/* Search box */}
                      <div className="flex items-center border-b border-gray-100 dark:border-slate-800 px-3 py-2 gap-2 bg-gray-50/50 dark:bg-slate-900/50">
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search or type to add custom..."
                          value={subSearch}
                          onChange={(e) => setSubSearch(e.target.value)}
                          className="w-full bg-transparent border-none text-xs text-gray-800 dark:text-slate-200 focus:outline-none placeholder-gray-400 py-1"
                        />
                        {subSearch && (
                          <button
                            type="button"
                            onClick={() => setSubSearch('')}
                            className="p-0.5 hover:bg-gray-200 dark:hover:bg-slate-800 rounded"
                          >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        )}
                      </div>

                      {/* Options list */}
                      <div className="overflow-y-auto flex-1 max-h-48 divide-y divide-gray-50 dark:divide-slate-800/30 text-xs">
                        {/* Custom "Add new" option if search does not match existing options */}
                        {subSearch.trim() && !categoriesMetadata
                          .filter(item => item.category === category)
                          .some(item => item.subCategory.toLowerCase() === subSearch.trim().toLowerCase()) && (
                          <div
                            onClick={() => {
                              setSubCategory(subSearch.trim());
                              setSubSearch('');
                              setIsSubOpen(false);
                            }}
                            className="px-4 py-3 cursor-pointer bg-brand-50/30 dark:bg-slate-850/40 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800 font-bold transition-colors truncate"
                          >
                            + Add "{subSearch.trim()}" as new detailing
                          </div>
                        )}

                        {categoriesMetadata.filter(item => item.category === category).length === 0 && !subSearch.trim() ? (
                          <div className="p-4 text-center text-gray-450 dark:text-slate-500 font-medium">
                            No options under this category. Type to add custom.
                          </div>
                        ) : (
                          categoriesMetadata
                            .filter(item => item.category === category)
                            .filter(item => item.subCategory.toLowerCase().includes(subSearch.toLowerCase()))
                            .map((opt, i) => {
                              const isSelected = opt.subCategory === subCategory;
                              return (
                                <div
                                  key={i}
                                  onClick={() => {
                                    setSubCategory(opt.subCategory);
                                    setSubSearch('');
                                    setIsSubOpen(false);
                                  }}
                                  className={`px-4 py-3 cursor-pointer hover:bg-brand-50 dark:hover:bg-slate-800/60 hover:text-brand-600 dark:hover:text-brand-400 font-semibold transition-colors truncate ${
                                    isSelected
                                      ? 'bg-brand-50/70 text-brand-600 dark:bg-slate-800/80 dark:text-brand-400'
                                      : 'text-gray-700 dark:text-slate-350'
                                  }`}
                                >
                                  {opt.subCategory}
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-350 uppercase tracking-wider block">
                  Detailed Description
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe error codes, steps to reproduce, or device type..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-255 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                ></textarea>
              </div>

              {/* Priority SLA Description Guide */}
              <p className="text-[10px] text-gray-450 dark:text-slate-500 font-medium leading-relaxed mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/40">
                💡 <b>Priority SLA Targets:</b><br />
                • <b>CRITICAL:</b> Max 30 minutes response / 3 hours resolution.<br />
                • <b>HIGH:</b> Max 30 minutes response / 5 hours resolution.<br />
                • <b>MEDIUM:</b> Max 2 hours response / 8 hours resolution.<br />
                • <b>LOW:</b> Max 4 hours response / 24 hours resolution.
              </p>
            </div>

            {/* Submit Action Row */}
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800/40 mt-4">
              <button
                type="button"
                onClick={() => navigate('/tickets')}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-brand-500/10 flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Ticket</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

          </div>

        </form>
      )}

    </div>
  );
}
