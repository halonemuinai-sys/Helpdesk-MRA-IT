import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FilePlus2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Clock, 
  ChevronDown, 
  Search, 
  X,
  Building2,
  MapPin,
  User,
  Briefcase,
  Calendar,
  Pencil,
  Cpu,
  Flag,
  UserPlus,
  List,
  FileText,
  Info
} from 'lucide-react';
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

  // Quick Add User States
  const [showQuickUserModal, setShowQuickUserModal] = useState(false);
  const [quickUserId, setQuickUserId] = useState('');
  const [quickUserName, setQuickUserName] = useState('');
  const [quickUserEmail, setQuickUserEmail] = useState('');
  const [quickUserDept, setQuickUserDept] = useState('');
  const [quickUserJob, setQuickUserJob] = useState('');
  const [quickUserPhone, setQuickUserPhone] = useState('');
  const [quickUserError, setQuickUserError] = useState(null);
  const [quickUserSubmitting, setQuickUserSubmitting] = useState(false);

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

  const handleQuickCreateUser = async (e) => {
    e.preventDefault();
    if (!quickUserId || !quickUserName || !quickUserEmail || !quickUserDept || !quickUserJob) {
      setQuickUserError('All fields except Phone are required.');
      return;
    }

    setQuickUserError(null);
    setQuickUserSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: quickUserId,
          name: quickUserName,
          email: quickUserEmail,
          password: '',
          phone: quickUserPhone || null,
          companyId: parseInt(selectedCompanyId),
          department: quickUserDept,
          jobPosition: quickUserJob,
          role: 'USER'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user.');
      }

      // Refetch employees for this company branch
      await fetchEmployees(selectedCompanyId);

      // Auto-select the newly created requester
      setSelectedEmployeeId(quickUserId);
      setSelectedDepartment(quickUserDept);

      // Reset and close modal
      setShowQuickUserModal(false);
      setQuickUserId('');
      setQuickUserName('');
      setQuickUserEmail('');
      setQuickUserDept('');
      setQuickUserJob('');
      setQuickUserPhone('');
    } catch (err) {
      setQuickUserError(err.message);
    } finally {
      setQuickUserSubmitting(false);
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
    <div className="max-w-5xl mx-auto py-4 relative">
      <div className="space-y-6 animate-fade-in">
      {/* Inline styles for custom form animations */}
      <style>{`
        @keyframes slideLeftCard {
          from { opacity: 0; transform: translateY(12px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideRightCard {
          from { opacity: 0; transform: translateY(12px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes borderSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-card-left {
          animation: slideLeftCard 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-card-right {
          animation: slideRightCard 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.08s;
          opacity: 0;
        }
        .animate-border-spin {
          animation: borderSpin 4s linear infinite;
        }
      `}</style>
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center shadow-sm">
          <FilePlus2 className="w-6 h-6 text-rose-600 dark:text-rose-450" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight">
            Create New Ticket
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
            Register a new damage report or IT assistance request.
          </p>
        </div>
      </div>

      {success ? (
        <div className="glass-card max-w-md mx-auto p-8 rounded-3xl border border-emerald-500/20 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200">Ticket Created Successfully!</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Your ticket has been submitted. SLA countdown is active. Redirecting...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* Left Column: Reporter Information & Metadata */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/40 space-y-5 flex flex-col justify-between animate-card-left shadow-sm bg-white dark:bg-slate-900/60">
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/80 pb-3 flex items-center gap-2">
                <span className="w-5.5 h-5.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/35 dark:text-rose-400 flex items-center justify-center text-xs font-black">1</span>
                <span>Reporter & Metadata</span>
              </h3>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Company Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Company
                </label>
                <SearchableSelect
                  disabled={user.role === 'USER'}
                  value={selectedCompName}
                  onChange={handleCompanyNameChange}
                  options={uniqueCompanyNames}
                  placeholder="-- Select Company --"
                  icon={Building2}
                />
              </div>

              {/* Location Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
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
                  icon={MapPin}
                />
              </div>

              {/* Employee Requester Selection */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Employee Name (Requester)
                  </label>
                  {['ADMIN', 'AGENT'].includes(user.role) && selectedLocation && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickUserId('');
                        setQuickUserName('');
                        setQuickUserEmail('');
                        setQuickUserDept('');
                        setQuickUserJob('');
                        setQuickUserPhone('');
                        setQuickUserError(null);
                        setQuickUserSubmitting(false);
                        setShowQuickUserModal(true);
                      }}
                      className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 focus:outline-none"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Quick Add User</span>
                    </button>
                  )}
                </div>
                <SearchableSelect
                  disabled={user.role === 'USER' || !selectedLocation}
                  value={selectedEmployeeId}
                  onChange={handleEmployeeChange}
                  options={employees}
                  labelKey="name"
                  valueKey="id"
                  placeholder="-- Select Employee --"
                  icon={User}
                />
              </div>

              {/* Read-Only Department field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Department
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    readOnly
                    value={selectedDepartment}
                    placeholder="Auto-filled..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-slate-500 dark:text-slate-400 focus:outline-none text-xs cursor-not-allowed font-semibold"
                  />
                  <Briefcase className="w-4 h-4 text-rose-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Incident Date & Time (Retroactive / Backdate) */}
              {['AGENT', 'ADMIN'].includes(user.role) && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Incident Date & Time (Retroactive)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 group">
                      <Flatpickr
                        data-enable-time
                        value={customCreatedAt}
                        onChange={([date]) => setCustomCreatedAt(date)}
                        options={{
                          maxDate: new Date(),
                          dateFormat: "Y-m-d H:i",
                          time_24hr: true
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none text-xs cursor-pointer shadow-sm transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
                        placeholder="Current Time (Now)"
                      />
                      <Calendar className="w-4 h-4 text-rose-550 group-focus-within:text-rose-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomCreatedAt(new Date())}
                      className="px-4 py-2.5 bg-white hover:bg-rose-50/50 dark:bg-slate-900 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs transition-all duration-200 shadow-sm shrink-0 flex items-center gap-1.5 hover:scale-105 active:scale-100"
                    >
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span>Now</span>
                    </button>
                    {customCreatedAt && (
                      <button
                        type="button"
                        onClick={() => setCustomCreatedAt(null)}
                        className="px-3 py-2.5 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-xl text-[10px] font-black transition-colors shrink-0"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SLA Notice Box */}
            <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/70 dark:border-rose-950/20 rounded-2xl p-4 flex gap-3 text-xs text-rose-700 dark:text-rose-355 leading-relaxed font-semibold mt-4 shadow-sm shadow-rose-500/5">
              <Info className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span>SLA response and resolution target deadlines will automatically be calculated relative to this ticket's creation timestamp.</span>
            </div>
          </div>

          {/* Right Column: Issue Details & Subject */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/40 space-y-5 flex flex-col justify-between animate-card-right shadow-sm bg-white dark:bg-slate-900/60">
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/80 pb-3 flex items-center gap-2">
                <span className="w-5.5 h-5.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/35 dark:text-rose-400 flex items-center justify-center text-xs font-black">2</span>
                <span>Issue & Classification</span>
              </h3>

              {/* Subject / Issue Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Subject / Issue Title
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    required
                    placeholder="Example: POS Cashier machine froze / cannot print receipt"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none text-xs font-semibold transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
                  />
                  <Pencil className="w-4 h-4 text-slate-400 group-focus-within:text-rose-550 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200" />
                </div>
              </div>

              {/* Categorization & Priority Grid (3 columns) */}
              <div className="grid grid-cols-3 gap-3">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Category
                  </label>
                  <div className="relative group">
                    <select
                      value={category}
                      onChange={handleCategoryChange}
                      className="appearance-none w-full pl-10 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10 text-xs cursor-pointer font-bold transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="Network">Network</option>
                      <option value="Access">Access</option>
                      <option value="ERP">ERP</option>
                    </select>
                    <Cpu className="w-4 h-4 text-slate-400 group-focus-within:text-rose-550 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200" />
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200" />
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Priority
                  </label>
                  <div className="relative group">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="appearance-none w-full pl-10 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10 text-xs cursor-pointer font-bold transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                    <Flag className="w-4 h-4 text-slate-400 group-focus-within:text-rose-550 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200" />
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Source */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Source
                  </label>
                  <div className="relative group">
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="appearance-none w-full pl-10 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10 text-xs cursor-pointer font-bold transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <option value="Walk-in">Walk-in</option>
                      <option value="Email">Email</option>
                      <option value="Phone Call">Phone Call</option>
                      <option value="Instant Messaging">Instant Messaging (WhatsApp/Telegram)</option>
                      <option value="Direct Instruction">Direct Instruction</option>
                      <option value="On-site Visit">On-site Visit</option>
                      <option value="System Alert">System Alert</option>
                    </select>
                    <UserPlus className="w-4 h-4 text-slate-400 group-focus-within:text-rose-550 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200" />
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Sub-Category Detail */}
              <div className="space-y-1.5" ref={subRef}>
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Sub-Category / Detailing
                </label>
                
                <div className="relative w-full group">
                  {/* Select Trigger */}
                  <div
                    className={`w-full flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs overflow-hidden pl-10 pr-4 py-2.5 cursor-pointer shadow-sm focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500/10 transition-all hover:border-slate-300 dark:hover:border-slate-700`}
                    onClick={() => setIsSubOpen(!isSubOpen)}
                  >
                    <span className={`truncate mr-2 ${subCategory ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                      {subCategory || '-- Select Sub-Category --'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-450 shrink-0 transition-transform duration-200 ${isSubOpen ? 'transform rotate-180' : ''}`} />
                  </div>
                  <List className="w-4 h-4 text-slate-400 group-focus-within:text-rose-550 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200" />

                  {/* Dropdown Menu */}
                  {isSubOpen && (
                    <div className="absolute z-30 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-64 flex flex-col overflow-hidden animate-fade-in">
                      {/* Search box */}
                      <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-3 py-2 gap-2 bg-slate-55/50 dark:bg-slate-900/50">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search or type to add custom..."
                          value={subSearch}
                          onChange={(e) => setSubSearch(e.target.value)}
                          className="w-full bg-transparent border-none text-xs text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400 py-1"
                        />
                        {subSearch && (
                          <button
                            type="button"
                            onClick={() => setSubSearch('')}
                            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                          >
                            <X className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        )}
                      </div>

                      {/* Options list */}
                      <div className="overflow-y-auto flex-1 max-h-48 divide-y divide-slate-50 dark:divide-slate-800/30 text-xs">
                        {/* Custom "Add new" option */}
                        {subSearch.trim() && !categoriesMetadata
                          .filter(item => item.category === category)
                          .some(item => item.subCategory.toLowerCase() === subSearch.trim().toLowerCase()) && (
                          <div
                            onClick={() => {
                              setSubCategory(subSearch.trim());
                              setSubSearch('');
                              setIsSubOpen(false);
                            }}
                            className="px-4 py-3 cursor-pointer bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 font-bold transition-colors truncate"
                          >
                            + Add "{subSearch.trim()}" as new detailing
                          </div>
                        )}

                        {categoriesMetadata.filter(item => item.category === category).length === 0 && !subSearch.trim() ? (
                          <div className="p-4 text-center text-slate-450 dark:text-slate-500 font-medium">
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
                                  className={`px-4 py-3 cursor-pointer hover:bg-rose-50/40 dark:hover:bg-slate-800/60 hover:text-rose-600 dark:hover:text-rose-450 font-semibold transition-colors truncate ${
                                    isSelected
                                      ? 'bg-rose-50/70 text-rose-600 dark:bg-slate-850 dark:text-rose-400'
                                      : 'text-slate-700 dark:text-slate-350'
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
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Detailed Description
                </label>
                <div className="relative group">
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe error codes, steps to reproduce, or device type..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10 rounded-xl text-slate-850 dark:text-slate-200 focus:outline-none text-xs font-medium transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
                  ></textarea>
                  <FileText className="w-4 h-4 text-slate-400 group-focus-within:text-rose-550 absolute left-3.5 top-3.5 pointer-events-none transition-colors duration-200" />
                </div>
              </div>

              {/* Priority SLA Description Guide with Rotating Glow Border */}
              <div className="relative p-[2px] overflow-hidden rounded-2xl mt-4 shadow-sm shadow-rose-500/5">
                {/* Rotating Conic Gradient Beam */}
                <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent_60%,#e11d48_100%)] animate-border-spin" />
                
                {/* Inner Content Box (Solid background prevents animation from showing inside) */}
                <div className="relative bg-rose-50 dark:bg-slate-900 rounded-[14px] p-4 flex gap-3 text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-semibold z-10">
                  <Clock className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <b className="text-gray-800 dark:text-slate-200 block mb-1">Priority SLA Targets:</b>
                    <ul className="space-y-1 text-[11px] list-disc list-inside">
                      <li><b>CRITICAL:</b> Max 30 minutes response / 3 hours resolution.</li>
                      <li><b>HIGH:</b> Max 30 minutes response / 5 hours resolution.</li>
                      <li><b>MEDIUM:</b> Max 2 hours response / 8 hours resolution.</li>
                      <li><b>LOW:</b> Max 4 hours response / 24 hours resolution.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action Row */}
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/40 mt-4">
              <button
                type="button"
                onClick={() => navigate('/tickets')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all duration-200 shadow-md shadow-rose-600/10 hover:shadow-lg hover:shadow-rose-600/20 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5 disabled:opacity-50"
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

      {/* Quick Add User Modal */}
      {showQuickUserModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="absolute inset-0" onClick={() => setShowQuickUserModal(false)}></div>
          
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 p-6 border border-gray-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">Quick Add User</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Add a user on-the-fly for {selectedCompName} ({selectedLocation}).
                </p>
              </div>
              <button 
                onClick={() => setShowQuickUserModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickUserError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold animate-pulse">
                {quickUserError}
              </div>
            )}

            <form onSubmit={handleQuickCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 40822045"
                    value={quickUserId}
                    onChange={(e) => setQuickUserId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={quickUserName}
                    onChange={(e) => setQuickUserName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@mragroup.co.id"
                    value={quickUserEmail}
                    onChange={(e) => setQuickUserEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Department</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Finance"
                    value={quickUserDept}
                    onChange={(e) => setQuickUserDept(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Job Position</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Staff"
                    value={quickUserJob}
                    onChange={(e) => setQuickUserJob(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Phone Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 08123456789"
                    value={quickUserPhone}
                    onChange={(e) => setQuickUserPhone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-850 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setShowQuickUserModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickUserSubmitting}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {quickUserSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create User</span>
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
