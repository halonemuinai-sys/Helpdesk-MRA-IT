import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Cpu,
  HardDrive,
  Monitor,
  Search,
  Building2,
  SlidersHorizontal,
  CheckSquare,
  Square,
  ArrowRightLeft,
  X,
  Laptop,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Zap,
  Tag,
  ChevronDown,
  Check
} from 'lucide-react';
import { exportAssetSpecComparisonExcel } from '../../utils/assetSpecExport';

function CustomCompanyMultiSelect({ options, selectedValues, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef(null);
  const searchRef = useRef(null);
  const dropRef = useRef(null);

  const reposition = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({
      top: r.bottom + window.scrollY + 6,
      left: r.left + window.scrollX,
      width: Math.max(r.width, 320),
    });
  };

  const toggleOpen = () => {
    if (!open) reposition();
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) { setQuery(''); return; }
    setTimeout(() => searchRef.current?.focus(), 60);
    const onScroll = () => reposition();
    const onResize = () => reposition();
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

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleToggleOption = (optVal) => {
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
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => String(o.value)));
    }
  };

  const hasSelectedAny = selectedValues.length > 0;
  let labelNode = null;
  if (selectedValues.length === 0) {
    labelNode = 'Semua Perusahaan Induk';
  } else if (selectedValues.length === 1) {
    const match = options.find(o => String(o.value) === String(selectedValues[0]));
    labelNode = match ? match.label : 'Semua Perusahaan Induk';
  } else {
    labelNode = (
      <span className="font-extrabold text-rose-600 dark:text-rose-400">
        {selectedValues.length} Perusahaan Dipilih
      </span>
    );
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border text-left transition-all group shrink-0 ${
          open
            ? 'bg-white dark:bg-slate-900 border-rose-400 dark:border-rose-500/60 shadow-sm'
            : 'bg-slate-50/70 dark:bg-slate-955/30 border-slate-200 dark:border-slate-850/50 hover:border-rose-300'
        }`}
      >
        <Building2 className={`w-3.5 h-3.5 shrink-0 ${hasSelectedAny ? 'text-rose-500' : 'text-slate-400'}`} />
        <span className={`truncate max-w-[170px] ${hasSelectedAny ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
          {labelNode}
        </span>
        {selectedValues.length > 1 && (
          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black text-[9px]">
            {selectedValues.length}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180 text-rose-500' : 'text-slate-400'}`} />
      </button>

      {open && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-xs font-semibold"
        >
          <div className="p-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cari perusahaan..."
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-rose-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={handleSelectAllOrClear}
              className="w-full flex items-center justify-between px-4 py-2 text-left border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <span className="flex items-center gap-2">
                {selectedValues.length === options.length ? (
                  <CheckSquare className="w-4 h-4 text-rose-500" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                )}
                <span>Semua Perusahaan Induk</span>
              </span>
            </button>

            {filtered.map(opt => {
              const optValStr = String(opt.value);
              const isSelected = selectedValues.includes(optValStr);

              return (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => handleToggleOption(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-left transition ${
                    isSelected ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 dark:text-slate-700 shrink-0" />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-955/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 pl-2">
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
        </div>,
        document.body
      )}
    </>
  );
}

export default function SpecComparisonWidget({
  assets = [],
  companyMasters = [],
  formatRupiah,
  onEditAsset,
  onOpenBast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyMasterIds, setSelectedCompanyMasterIds] = useState([]);
  const [selectedOwnershipType, setSelectedOwnershipType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [ramFilter, setRamFilter] = useState(''); // '', '8', '16', '32'
  const [osFilter, setOsFilter] = useState(''); // '', 'win11', 'win10', 'mac'

  // Selected assets for side-by-side comparison
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Filter computers & laptops (exclude purely non-hardware like printers/switches if needed, but include all IT assets with specs)
  const hardwareAssets = useMemo(() => {
    return assets.filter(a => {
      // Keep laptops, desktops, workstations, servers, macs, or any asset with processor/ram/storage/os filled
      const isComputer = !a.deviceCategory || ['LAPTOP', 'PC_DESKTOP', 'WORKSTATION', 'SERVER', 'MAC', 'TABLET'].includes(a.deviceCategory);
      const hasSpecData = a.processor || a.ram || a.storage || a.os;
      return isComputer || hasSpecData;
    });
  }, [assets]);

  // Compute Spec Distribution KPI Statistics
  const specStats = useMemo(() => {
    let intelI3 = 0, intelI5 = 0, intelI7 = 0, intelI9 = 0, intelOther = 0;
    let amdCount = 0, appleCount = 0, otherCpuCount = 0;
    let ram8gbOrLess = 0, ram16gb = 0, ram32gbPlus = 0;
    let win11Count = 0, win10Count = 0, macOsCount = 0, otherOsCount = 0;

    hardwareAssets.forEach(a => {
      const proc = (a.processor || '').toLowerCase();
      if (proc.includes('i3')) intelI3++;
      else if (proc.includes('i5')) intelI5++;
      else if (proc.includes('i7')) intelI7++;
      else if (proc.includes('i9')) intelI9++;
      else if (proc.includes('intel')) intelOther++;
      else if (proc.includes('amd') || proc.includes('ryzen')) amdCount++;
      else if (proc.includes('apple') || proc.includes('m1') || proc.includes('m2') || proc.includes('m3') || proc.includes('m4')) appleCount++;
      else if (proc) otherCpuCount++;

      const ram = (a.ram || '').toLowerCase();
      if (ram.includes('32') || ram.includes('64') || ram.includes('128')) ram32gbPlus++;
      else if (ram.includes('16')) ram16gb++;
      else if (ram.includes('8') || ram.includes('4')) ram8gbOrLess++;

      const os = (a.os || '').toLowerCase();
      if (os.includes('11')) win11Count++;
      else if (os.includes('10')) win10Count++;
      else if (os.includes('mac') || os.includes('osx')) macOsCount++;
      else if (os) otherOsCount++;
    });

    const intelCount = intelI3 + intelI5 + intelI7 + intelI9 + intelOther;

    return {
      total: hardwareAssets.length,
      intelCount, intelI3, intelI5, intelI7, intelI9,
      amdCount, appleCount, otherCpuCount,
      ram8gbOrLess, ram16gb, ram32gbPlus,
      win11Count, win10Count, macOsCount, otherOsCount
    };
  }, [hardwareAssets]);

  // Filtered Assets List
  const filteredAssets = useMemo(() => {
    return hardwareAssets.filter(a => {
      // Company master
      if (selectedCompanyMasterIds.length > 0 && !selectedCompanyMasterIds.includes(String(a.companyMasterId))) {
        return false;
      }
      // Ownership
      if (selectedOwnershipType && a.ownershipType !== selectedOwnershipType) {
        return false;
      }
      // Category
      if (selectedCategory && a.deviceCategory !== selectedCategory) {
        return false;
      }
      // RAM Quick Filter
      if (ramFilter) {
        const ramStr = (a.ram || '').toLowerCase();
        if (ramFilter === '8' && !ramStr.includes('8')) return false;
        if (ramFilter === '16' && !ramStr.includes('16')) return false;
        if (ramFilter === '32' && !ramStr.includes('32') && !ramStr.includes('64')) return false;
      }
      // OS Quick Filter
      if (osFilter) {
        const osStr = (a.os || '').toLowerCase();
        if (osFilter === 'win11' && !osStr.includes('11')) return false;
        if (osFilter === 'win10' && !osStr.includes('10')) return false;
        if (osFilter === 'mac' && !osStr.includes('mac') && !osStr.includes('osx')) return false;
      }
      // Search text
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const searchTarget = [
          a.assetTag, a.name, a.brand, a.model, a.processor, a.ram, a.storage, a.os,
          a.companyMaster?.name, a.user?.name, a.user?.department
        ].filter(Boolean).join(' ').toLowerCase();
        if (!searchTarget.includes(q)) return false;
      }
      return true;
    });
  }, [hardwareAssets, selectedCompanyMasterIds, selectedOwnershipType, selectedCategory, ramFilter, osFilter, searchQuery]);

  // Toggle Asset Checkbox
  const toggleSelectAsset = (id) => {
    setSelectedAssetIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        if (prev.length >= 4) {
          alert("Maksimal 4 perangkat yang dapat dikomparasi sekaligus.");
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const selectedAssets = useMemo(() => {
    return assets.filter(a => selectedAssetIds.includes(a.id));
  }, [assets, selectedAssetIds]);

  return (
    <div className="space-y-6">

      {/* KPI Cards: Spec Distribution Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Devices */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Unit Hardware
            </p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {specStats.total} <span className="text-xs font-semibold text-slate-400">Unit</span>
            </h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
              Spesifikasi Tercatat
            </p>
          </div>
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center">
            <Monitor className="w-5 h-5" />
          </div>
        </div>

        {/* Processor Stats */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Distribusi Processor ({specStats.intelCount} Intel)
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">i5: {specStats.intelI5}</span>
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">i3: {specStats.intelI3}</span>
              <span className="text-sm font-extrabold text-violet-600 dark:text-violet-400">i7: {specStats.intelI7}</span>
              <span className="text-xs font-bold text-rose-500">i9: {specStats.intelI9}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              AMD: {specStats.amdCount} | Apple Silicon: {specStats.appleCount}
            </p>
          </div>
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        {/* RAM Stats */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Kapasitas Memori RAM
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-extrabold text-amber-500">16 GB: {specStats.ram16gb}</span>
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">32GB+: {specStats.ram32gbPlus}</span>
              <span className="text-xs font-bold text-slate-400">8GB: {specStats.ram8gbOrLess}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Standar Kerja IT MRA
            </p>
          </div>
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-2xl flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Operating System Stats */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Sistem Operasi (OS)
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-extrabold text-cyan-600 dark:text-cyan-400">Win 11: {specStats.win11Count}</span>
              <span className="text-sm font-extrabold text-slate-600 dark:text-slate-300">Win 10: {specStats.win10Count}</span>
              <span className="text-xs font-bold text-slate-400">macOS: {specStats.macOsCount}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Standar Keamanan Windows
            </p>
          </div>
          <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-2xl flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-250/60 dark:border-slate-800/60 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari processor (i7, Ryzen), RAM (16GB), Storage (SSD), OS, Tag, User..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl bg-slate-50/70 dark:bg-slate-955/30 border border-slate-200 dark:border-slate-850/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Select Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Entity Multi-Select */}
            <CustomCompanyMultiSelect
              options={companyMasters.map(m => ({ value: String(m.id), label: m.name }))}
              selectedValues={selectedCompanyMasterIds}
              onChange={setSelectedCompanyMasterIds}
            />

            {/* Ownership */}
            <select
              value={selectedOwnershipType}
              onChange={(e) => setSelectedOwnershipType(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50/70 dark:bg-slate-955/30 border border-slate-200 dark:border-slate-850/50 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="">Semua Status Kepemilikan</option>
              <option value="RENTAL">Sewa (Rental)</option>
              <option value="OWNED">Milik Sendiri (Owned)</option>
            </select>

            {/* Quick RAM Filter */}
            <select
              value={ramFilter}
              onChange={(e) => setRamFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50/70 dark:bg-slate-955/30 border border-slate-200 dark:border-slate-850/50 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="">Filter Kapasitas RAM</option>
              <option value="8">RAM 8 GB</option>
              <option value="16">RAM 16 GB</option>
              <option value="32">RAM 32 GB / 64 GB</option>
            </select>

            {/* Quick OS Filter */}
            <select
              value={osFilter}
              onChange={(e) => setOsFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50/70 dark:bg-slate-955/30 border border-slate-200 dark:border-slate-850/50 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="">Filter Windows / OS</option>
              <option value="win11">Windows 11</option>
              <option value="win10">Windows 10</option>
              <option value="mac">macOS</option>
            </select>

            {/* Export Excel */}
            <button
              type="button"
              onClick={() => exportAssetSpecComparisonExcel({ assets: filteredAssets, companyMasters, filterLabel: 'Terfilter' })}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md hover:shadow-lg transition shrink-0"
              title="Ekspor Laporan Matriks Komparasi Hardware ke Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>

        </div>

        {/* Floating Side-by-Side Compare Bar */}
        {selectedAssetIds.length > 0 && (
          <div className="bg-rose-500 text-white p-3 rounded-xl flex items-center justify-between animate-fade-in shadow-lg">
            <div className="flex items-center gap-3">
              <span className="bg-white text-rose-600 font-extrabold px-2.5 py-0.5 rounded-lg text-xs font-mono">
                {selectedAssetIds.length} Perangkat Dipilih
              </span>
              <span className="text-xs font-semibold hidden sm:inline">
                Pilih 2 hingga 4 perangkat untuk membandingkan spesifikasi Processor, RAM, Hardisk, dan OS secara bersandingan.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCompareModalOpen(true)}
                className="flex items-center gap-1.5 bg-white text-rose-600 hover:bg-rose-50 font-extrabold text-xs px-4 py-1.5 rounded-lg shadow transition"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Bandingkan (Komparasi)
              </button>
              <button
                onClick={() => setSelectedAssetIds([])}
                className="p-1 hover:bg-rose-600 text-white rounded-lg transition"
                title="Batal Pilih"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Spec Matrix Table */}
      <div className="glass-panel rounded-3xl border border-slate-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden">
        {filteredAssets.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Laptop className="w-12 h-12 mx-auto opacity-40 text-slate-500" />
            <p className="text-sm font-semibold">Tidak ada perangkat yang cocok dengan kriteria filter spesifikasi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-4 text-center w-10">Pilih</th>
                  <th className="py-4 px-6">Perangkat / Tag Aset</th>
                  <th className="py-4 px-6">Pengguna &amp; Entitas PT</th>
                  <th className="py-4 px-6">⚡ PROCESSOR</th>
                  <th className="py-4 px-6">💾 RAM</th>
                  <th className="py-4 px-6">💽 HARDISK / STORAGE</th>
                  <th className="py-4 px-6">💻 WINDOWS / OS</th>
                  <th className="py-4 px-6">💰 BIAYA SEWA / BLN</th>
                  <th className="py-4 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                {filteredAssets.map(asset => {
                  const isChecked = selectedAssetIds.includes(asset.id);
                  const isRental = asset.ownershipType === 'RENTAL';

                  return (
                    <tr
                      key={asset.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-850/30 transition ${
                        isChecked ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectAsset(asset.id)}
                          className="text-slate-400 hover:text-rose-500 focus:outline-none"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-rose-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                          )}
                        </button>
                      </td>

                      {/* Tag Aset & Brand */}
                      <td className="py-4 px-6">
                        <div className="font-mono font-extrabold text-rose-600 dark:text-rose-400">{asset.assetTag}</div>
                        <div className="font-bold text-slate-800 dark:text-white mt-0.5">{asset.name || `${asset.brand} ${asset.model}`}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            isRental ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}>
                            {isRental ? 'SEWA (RENTAL)' : 'MILIK SENDIRI'}
                          </span>
                          {asset.deviceCategory && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {asset.deviceCategory}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* User & Company */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {asset.user?.name || <span className="text-slate-400 italic">Unassigned (Spare)</span>}
                        </div>
                        {asset.user?.department && (
                          <div className="text-[10px] text-slate-400 font-medium">{asset.user.department}</div>
                        )}
                        <div className="text-[10px] font-bold text-violet-600 dark:text-violet-400 mt-1">
                          {asset.companyMaster?.name || 'Tanpa Entitas'}
                        </div>
                      </td>

                      {/* Processor */}
                      <td className="py-4 px-6">
                        {asset.processor ? (
                          <div className="inline-flex flex-col">
                            <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 font-extrabold text-[11px] font-mono">
                              ⚡ {asset.processor}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* RAM */}
                      <td className="py-4 px-6 font-mono">
                        {asset.ram ? (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50 font-extrabold text-[11px]">
                            💾 {asset.ram}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Storage */}
                      <td className="py-4 px-6 font-mono">
                        {asset.storage ? (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 font-extrabold text-[11px]">
                            💽 {asset.storage}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Windows / OS */}
                      <td className="py-4 px-6">
                        {asset.os ? (
                          <span className="px-2.5 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/50 font-bold text-[11px]">
                            💻 {asset.os}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Biaya Sewa Bulanan */}
                      <td className="py-4 px-6 font-mono font-bold">
                        {isRental ? (
                          <div className="text-amber-600 dark:text-amber-400 font-extrabold text-xs">
                            {formatRupiah(asset.rentalCost)}
                            <span className="text-[9px] text-slate-400 font-semibold block">/ Bulan</span>
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            Milik Sendiri
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          asset.status === 'ASSIGNED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : asset.status === 'MAINTENANCE'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {asset.status === 'ASSIGNED' ? 'Terpakai (In Use)' : asset.status === 'MAINTENANCE' ? 'Perbaikan' : 'Tersedia (Spare)'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity cursor-pointer animate-fade-in"
            onClick={() => setIsCompareModalOpen(false)}
          />

          <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-up overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Matriks Komparasi Spesifikasi Hardware
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Perbandingan bersandingan ({selectedAssets.length} unit dipilih): Processor, RAM, Hardisk, dan OS.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-2xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Grid Table */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3 px-4 font-bold text-slate-400 uppercase tracking-wider text-[10px] w-44">
                        PARAMETER SPESIFIKASI
                      </th>
                      {selectedAssets.map(ast => (
                        <th key={ast.id} className="py-3 px-4 min-w-[200px]">
                          <div className="font-mono font-extrabold text-rose-500 text-xs">{ast.assetTag}</div>
                          <div className="font-black text-slate-900 dark:text-white text-sm mt-0.5">{ast.name || `${ast.brand} ${ast.model}`}</div>
                          <div className="text-[10px] text-violet-600 dark:text-violet-400 font-bold">{ast.companyMaster?.name}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    
                    {/* 1. PROCESSOR */}
                    <tr className="bg-blue-50/30 dark:bg-blue-950/15">
                      <td className="py-3 px-4 font-black text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-blue-500" />
                        <span>PROCESSOR</span>
                      </td>
                      {selectedAssets.map(ast => (
                        <td key={ast.id} className="py-3 px-4 font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                          {ast.processor || '-'}
                        </td>
                      ))}
                    </tr>

                    {/* 2. RAM */}
                    <tr className="bg-amber-50/30 dark:bg-amber-950/15">
                      <td className="py-3 px-4 font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>RAM (MEMORI)</span>
                      </td>
                      {selectedAssets.map(ast => (
                        <td key={ast.id} className="py-3 px-4 font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                          {ast.ram || '-'}
                        </td>
                      ))}
                    </tr>

                    {/* 3. HARDISK / STORAGE */}
                    <tr className="bg-emerald-50/30 dark:bg-emerald-950/15">
                      <td className="py-3 px-4 font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <HardDrive className="w-4 h-4 text-emerald-500" />
                        <span>HARDISK / SSD</span>
                      </td>
                      {selectedAssets.map(ast => (
                        <td key={ast.id} className="py-3 px-4 font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                          {ast.storage || '-'}
                        </td>
                      ))}
                    </tr>

                    {/* 4. WINDOWS / OS */}
                    <tr className="bg-cyan-50/30 dark:bg-cyan-950/15">
                      <td className="py-3 px-4 font-black text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                        <Monitor className="w-4 h-4 text-cyan-500" />
                        <span>WINDOWS / OS</span>
                      </td>
                      {selectedAssets.map(ast => (
                        <td key={ast.id} className="py-3 px-4 font-extrabold text-cyan-600 dark:text-cyan-400">
                          {ast.os || '-'}
                        </td>
                      ))}
                    </tr>

                    {/* 5. BRAND & MODEL */}
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-400">BRAND &amp; MODEL</td>
                      {selectedAssets.map(ast => (
                        <td key={ast.id} className="py-3 px-4 font-semibold">
                          {ast.brand} - {ast.model}
                        </td>
                      ))}
                    </tr>

                    {/* 6. STATUS KEPEMILIKAN */}
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-400">KEPEMILIKAN</td>
                      {selectedAssets.map(ast => (
                        <td key={ast.id} className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            ast.ownershipType === 'RENTAL' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'
                          }`}>
                            {ast.ownershipType === 'RENTAL' ? `Sewa (${formatRupiah(ast.rentalCost)}/bln)` : 'Milik Sendiri'}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* 7. PENGGUNA SAAT INI */}
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-400">PENGGUNA (USER)</td>
                      {selectedAssets.map(ast => (
                        <td key={ast.id} className="py-3 px-4 font-bold">
                          {ast.user?.name || <span className="text-slate-400 italic">Unassigned (Spare)</span>}
                          {ast.user?.department && <div className="text-[10px] text-slate-400 font-normal">{ast.user.department}</div>}
                        </td>
                      ))}
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-400">
              <span>Menampilkan hasil komparasi parameter spesifikasi 4 komponen utama IT.</span>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition"
              >
                Tutup Komparasi
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
