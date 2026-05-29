import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export default function SearchableSelect({ 
  options = [], 
  value, 
  onChange, 
  placeholder = '-- Pilih --', 
  disabled = false, 
  labelKey = 'name', 
  valueKey = 'id' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find currently selected option
  const selectedOption = options.find(opt => {
    if (typeof opt === 'string') return opt === value;
    return String(opt[valueKey]) === String(value);
  });

  const displayValue = selectedOption 
    ? (typeof selectedOption === 'string' ? selectedOption : selectedOption[labelKey]) 
    : '';

  // Filter options based on search query
  const filteredOptions = options.filter(opt => {
    const text = typeof opt === 'string' ? opt : opt[labelKey];
    return String(text).toLowerCase().includes(search.toLowerCase());
  });

  const handleSelect = (opt) => {
    const val = typeof opt === 'string' ? opt : opt[valueKey];
    onChange(val);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Clickable Select Field */}
      <div
        className={`w-full flex items-center justify-between border border-gray-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-sm overflow-hidden px-4 py-3 cursor-pointer shadow-sm focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-slate-950' : 'hover:border-gray-300 dark:hover:border-slate-700'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`truncate mr-2 ${displayValue ? 'text-gray-800 dark:text-slate-200 font-medium' : 'text-gray-400'}`}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </div>

      {/* Floating Options Panel */}
      {isOpen && (
        <div className="absolute z-30 w-full mt-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl max-h-64 flex flex-col overflow-hidden animate-fade-in">
          
          {/* Search Input Box */}
          <div className="flex items-center border-b border-gray-100 dark:border-slate-800 px-3 py-2.5 gap-2 bg-gray-50/50 dark:bg-slate-900/50">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Type to search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-gray-800 dark:text-slate-200 focus:outline-none placeholder-gray-400"
            />
            {search && (
              <button 
                type="button" 
                onClick={() => setSearch('')}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-slate-800 rounded"
              >
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300" />
              </button>
            )}
          </div>

          {/* List Options */}
          <div className="overflow-y-auto flex-1 max-h-48 divide-y divide-gray-50 dark:divide-slate-800/30 text-xs">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-400 dark:text-slate-500 font-medium">
                No results found.
              </div>
            ) : (
              filteredOptions.map((opt, i) => {
                const label = typeof opt === 'string' ? opt : opt[labelKey];
                const optVal = typeof opt === 'string' ? opt : opt[valueKey];
                const isSelected = String(optVal) === String(value);

                return (
                  <div
                    key={i}
                    onClick={() => handleSelect(opt)}
                    className={`px-4 py-3 cursor-pointer hover:bg-brand-50 dark:hover:bg-slate-800/60 hover:text-brand-600 dark:hover:text-brand-400 font-semibold transition-colors truncate ${
                      isSelected 
                        ? 'bg-brand-50/70 text-brand-600 dark:bg-slate-800/80 dark:text-brand-400' 
                        : 'text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}
    </div>
  );
}
