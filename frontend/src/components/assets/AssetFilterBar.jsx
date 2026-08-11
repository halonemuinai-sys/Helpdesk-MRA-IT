import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Laptop, Building2, Clock, Loader2, ChevronDown, Check, Tag, CheckSquare, Square } from 'lucide-react';
import { STATUS_OPTIONS, OWNERSHIP_OPTIONS } from './constants';

const DROP_ANIM = `
  @keyframes dropIn { from { opacity:0; transform:translateY(-6px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
  .asset-drop-anim { animation: dropIn 0.15s cubic-bezier(0.16,1,0.3,1); }
`;

function CustomSelect({ icon: Icon, placeholder, value, onChange, options, searchable = false, isMulti = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef(null);
  const searchRef = useRef(null);
  const dropRef = useRef(null);

  const selectedValues = isMulti
    ? (Array.isArray(value) ? value.map(String) : value ? [String(value)] : [])
    : [];

  const reposition = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({
      top: r.bottom + window.scrollY + 6,
      left: r.left + window.scrollX,
      width: Math.max(r.width, searchable ? 320 : 220),
    });
  };

  const toggleOpen = () => {
    if (!open) reposition();
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) { setQuery(''); return; }
    if (searchable) setTimeout(() => searchRef.current?.focus(), 60);
    const onScroll = () => { reposition(); };
    const onResize = () => { reposition(); };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current?.contains(e.target) || dropRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = searchable && query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  let labelNode = null;
  if (isMulti) {
    if (selectedValues.length === 0) {
      labelNode = null;
    } else if (selectedValues.length === 1) {
      const match = options.find(o => String(o.value) === String(selectedValues[0]));
      labelNode = match ? match.label : placeholder;
    } else {
      labelNode = (
        <span className="flex items-center gap-1.5 font-extrabold text-rose-600 dark:text-rose-400">
          <span>{selectedValues.length} Perusahaan Dipilih</span>
        </span>
      );
    }
  } else {
    const selected = options.find(o => String(o.value) === String(value));
    labelNode = selected
      ? selected.dot
        ? <span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected.dot}`} />{selected.label}</span>
        : selected.label
      : null;
  }

  const handleToggleOption = (optVal) => {
    if (!isMulti) {
      onChange(String(optVal));
      setOpen(false);
      return;
    }

    const valStr = String(optVal);
    let updated = [];
    if (selectedValues.includes(valStr)) {
      updated = selectedValues.filter(v => v !== valStr);
    } else {
      updated = [...selectedValues, valStr];
    }
    onChange(updated);
  };

  const handleSelectAllOrClear = () => {
    if (isMulti) {
      if (selectedValues.length === options.length) {
        onChange([]);
      } else {
        onChange(options.map(o => String(o.value)));
      }
    } else {
      onChange('');
      setOpen(false);
    }
  };

  const hasSelectedAny = isMulti ? selectedValues.length > 0 : Boolean(value);

  return (
    <>
      <style>{DROP_ANIM}</style>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border text-left transition-all duration-150 group
          ${open
            ? 'bg-white dark:bg-slate-900 border-rose-400 dark:border-rose-500/60 shadow-sm shadow-rose-100 dark:shadow-rose-900/20'
            : 'bg-gray-50/70 dark:bg-slate-955/30 border-gray-200 dark:border-slate-800/60 hover:border-rose-300 dark:hover:border-rose-500/40'
          }`}
      >
        <Icon className={`w-4 h-4 shrink-0 transition-colors ${open || hasSelectedAny ? 'text-rose-500' : 'text-gray-400 group-hover:text-rose-400'}`} />
        <span className={`flex-1 text-xs font-semibold truncate transition-colors ${hasSelectedAny ? 'text-gray-800 dark:text-slate-100' : 'text-gray-400 dark:text-slate-500'}`}>
          {labelNode ?? placeholder}
        </span>
        {isMulti && selectedValues.length > 1 && (
          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black text-[9px]">
            {selectedValues.length}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-all duration-200 ${open ? 'rotate-180 text-rose-500' : 'text-gray-400'}`} />
      </button>

      {open && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="asset-drop-anim bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-black/12 dark:shadow-black/60 overflow-hidden"
        >
          {searchable && (
            <div className="p-2 pb-1.5 border-b border-gray-100 dark:border-slate-800/70">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Cari perusahaan..."
                  className="w-full pl-7 pr-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-rose-400 dark:focus:border-rose-500/60"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto overscroll-contain">
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={handleSelectAllOrClear}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-left transition-colors border-b border-gray-100 dark:border-slate-800/50 ${
                !hasSelectedAny
                  ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-2">
                {isMulti && (
                  selectedValues.length === options.length ? (
                    <CheckSquare className="w-4 h-4 text-rose-500" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-300 dark:text-slate-700" />
                  )
                )}
                <span>Semua Perusahaan</span>
              </span>
              {!hasSelectedAny && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>

            {filtered.length === 0 && (
              <div className="px-4 py-4 text-xs text-gray-400 dark:text-slate-500 text-center">Tidak ditemukan</div>
            )}

            {filtered.map(opt => {
              const optValStr = String(opt.value);
              const isSelected = isMulti
                ? selectedValues.includes(optValStr)
                : String(value) === optValStr;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => handleToggleOption(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-left transition-colors ${
                    isSelected
                      ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    {isMulti && (
                      isSelected ? (
                        <CheckSquare className="w-4 h-4 text-rose-500 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-300 dark:text-slate-700 shrink-0" />
                      )
                    )}
                    {opt.dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${opt.dot}`} />}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {!isMulti && isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {isMulti && (
            <div className="p-2 border-t border-gray-100 dark:border-slate-800/70 bg-gray-50/80 dark:bg-slate-955/80 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 pl-2">
                {selectedValues.length} perusahaan dipilih
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[11px] rounded-lg shadow transition"
              >
                Selesai
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

const CATEGORY_OPTIONS = [
  { value: 'LAPTOP', label: 'Laptop / PC' },
  { value: 'SMARTPHONE', label: 'Smartphone' },
  { value: 'PRINTER', label: 'Printer' },
];

export default function AssetFilterBar({
  searchQuery, setSearchQuery,
  selectedCategory, setSelectedCategory,
  selectedCompanyMasterId, setSelectedCompanyMasterId,
  selectedCompanyMasterIds, setSelectedCompanyMasterIds,
  selectedStatus, setSelectedStatus,
  selectedOwnershipType, setSelectedOwnershipType,
  companyMasters,
  loading,
  handleResetFilters,
  handleRefreshData,
}) {
  const currentCompanyVal = selectedCompanyMasterIds && selectedCompanyMasterIds.length > 0
    ? selectedCompanyMasterIds
    : selectedCompanyMasterId;

  const hasActiveFilter = searchQuery || selectedStatus || (selectedCompanyMasterIds && selectedCompanyMasterIds.length > 0) || selectedCompanyMasterId || selectedCategory || selectedOwnershipType;
  const companyOptions = companyMasters.map(m => ({ value: String(m.id), label: m.name }));

  const handleCompanyChange = (val) => {
    if (setSelectedCompanyMasterIds) {
      setSelectedCompanyMasterIds(Array.isArray(val) ? val : val ? [String(val)] : []);
    } else {
      setSelectedCompanyMasterId(val);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-gray-250/60 dark:border-slate-800/60 space-y-4">

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
          <input
            type="text"
            placeholder="Cari Brand, Model, Tag Aset, NIP, LP..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex gap-3 w-full md:w-auto">
          <div className="md:w-36">
            <CustomSelect icon={Laptop} placeholder="Semua Kategori" value={selectedCategory} onChange={setSelectedCategory} options={CATEGORY_OPTIONS} />
          </div>
          <div className="md:w-44">
            <CustomSelect icon={Tag} placeholder="Kepemilikan" value={selectedOwnershipType} onChange={setSelectedOwnershipType} options={OWNERSHIP_OPTIONS} />
          </div>
          <div className="md:w-56">
            <CustomSelect icon={Building2} placeholder="Semua Perusahaan" value={currentCompanyVal} onChange={handleCompanyChange} options={companyOptions} searchable isMulti />
          </div>
          <div className="md:w-44">
            <CustomSelect icon={Clock} placeholder="Semua Status" value={selectedStatus} onChange={setSelectedStatus} options={STATUS_OPTIONS} />
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-150 dark:border-slate-800/60">
        {hasActiveFilter && (
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 border border-gray-250 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-350 text-xs font-bold rounded-xl transition"
          >
            Clear Filters
          </button>
        )}
        <button
          onClick={handleRefreshData}
          disabled={loading}
          className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
          Proses / Muat Data
        </button>
      </div>

    </div>
  );
}
