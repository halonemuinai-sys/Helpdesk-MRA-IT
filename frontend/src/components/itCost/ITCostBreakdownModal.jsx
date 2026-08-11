import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  Package,
  Laptop,
  CreditCard,
  Wifi,
  Layers,
  Building2,
  Calendar,
  Tag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function ITCostBreakdownModal({
  isOpen,
  onClose,
  breakdownDetails,
  initialTab = 'ALL',
  initialEntityFilter = '',
  formatRupiah,
  periodLabel = '12 Bulan'
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(initialEntityFilter || '');

  if (!isOpen || !breakdownDetails) return null;

  const invoices = breakdownDetails.invoices || [];
  const rentalAssets = breakdownDetails.rentalAssets || [];
  const subscriptions = breakdownDetails.subscriptions || [];
  const isp = breakdownDetails.isp || [];

  // Extract unique entities for filter dropdown
  const allEntities = Array.from(new Set([
    ...invoices.map(i => i.companyName),
    ...rentalAssets.map(r => r.companyName),
    ...subscriptions.map(s => s.companyName),
    ...isp.map(i => i.companyName),
  ])).filter(Boolean).sort();

  // Helper filter function
  const filterItem = (item, textFields) => {
    const matchEntity = !selectedEntity || item.companyName === selectedEntity;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || textFields.some(f => (f || '').toString().toLowerCase().includes(q));
    return matchEntity && matchSearch;
  };

  const filteredInvoices = invoices.filter(i => filterItem(i, [i.invoiceNumber, i.vendor, i.companyName]));
  const filteredRental = rentalAssets.filter(r => filterItem(r, [r.assetTag, r.name, r.model, r.serialNumber, r.companyName, r.userName, r.userDept]));
  const filteredSubs = subscriptions.filter(s => filterItem(s, [s.name, s.vendor, s.category, s.companyName, s.brand]));
  const filteredIsp = isp.filter(i => filterItem(i, [i.name, i.vendor, i.contractNumber, i.bandwidth, i.companyName, i.brand]));

  // Sum calculations
  const totalInvoicesCost = filteredInvoices.reduce((acc, i) => acc + (i.totalCost || 0), 0);
  const totalRentalCost = filteredRental.reduce((acc, r) => acc + (r.rentalCost || 0), 0);
  const totalSubsCost = filteredSubs.reduce((acc, s) => acc + (s.cost || 0), 0);
  const totalIspCost = filteredIsp.reduce((acc, i) => acc + (i.cost || 0), 0);

  const grandTotalFiltered = (
    (activeTab === 'ALL' || activeTab === 'PERIPHERALS' ? totalInvoicesCost : 0) +
    (activeTab === 'ALL' || activeTab === 'RENTAL' ? totalRentalCost : 0) +
    (activeTab === 'ALL' || activeTab === 'SUBSCRIPTION' ? totalSubsCost : 0) +
    (activeTab === 'ALL' || activeTab === 'ISP' ? totalIspCost : 0)
  );

  const TABS = [
    { id: 'ALL', label: 'Semua Transaksi', icon: Layers, count: filteredInvoices.length + filteredRental.length + filteredSubs.length + filteredIsp.length },
    { id: 'PERIPHERALS', label: 'Peripherals', icon: Package, count: filteredInvoices.length },
    { id: 'RENTAL', label: 'Sewa Aset', icon: Laptop, count: filteredRental.length },
    { id: 'SUBSCRIPTION', label: 'Subscription', icon: CreditCard, count: filteredSubs.length },
    { id: 'ISP', label: 'Internet (ISP)', icon: Wifi, count: filteredIsp.length },
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity cursor-pointer animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-up overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Rincian Breakdown Transaksi Riil IT
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold font-mono">
                  {periodLabel}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Daftar lengkap transaksi pengeluaran operasional per entitas &amp; kategori.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-2xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls & Tabs */}
        <div className="p-6 pb-4 space-y-4 border-b border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
                      isActive
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search & Entity Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari item, vendor, PT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-250 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-250 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="">Semua Entitas Induk</option>
                {allEntities.map(ent => (
                  <option key={ent} value={ent}>{ent}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Subtotal Banner */}
          <div className="bg-rose-50/60 dark:bg-rose-950/20 p-3 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between text-xs">
            <span className="font-bold text-rose-700 dark:text-rose-300">
              Total Nilai Transaksi Terfilter ({TABS.find(t => t.id === activeTab)?.label}):
            </span>
            <span className="font-black font-mono text-sm text-rose-600 dark:text-rose-400">
              {formatRupiah(grandTotalFiltered)}
            </span>
          </div>
        </div>

        {/* Content Table List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* 1. PERIPHERALS INVOICES */}
          {(activeTab === 'ALL' || activeTab === 'PERIPHERALS') && filteredInvoices.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                <span>Pembelian Peripherals &amp; Hardware ({filteredInvoices.length})</span>
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs font-semibold border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">No Invoice</th>
                      <th className="py-3 px-4">Entitas PT</th>
                      <th className="py-3 px-4">Vendor / Supplier</th>
                      <th className="py-3 px-4">Tanggal Beli</th>
                      <th className="py-3 px-4 text-right">Total Biaya</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-extrabold font-mono text-slate-800 dark:text-white">{inv.invoiceNumber}</td>
                        <td className="py-3 px-4">{inv.companyName}</td>
                        <td className="py-3 px-4 text-slate-500">{inv.vendor}</td>
                        <td className="py-3 px-4 text-slate-400">{new Date(inv.purchaseDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">{formatRupiah(inv.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. SEWA ASET */}
          {(activeTab === 'ALL' || activeTab === 'RENTAL') && filteredRental.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-amber-500 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Laptop className="w-4 h-4" />
                <span>Sewa Perangkat &amp; Laptop ({filteredRental.length})</span>
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs font-semibold border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Tag &amp; Perangkat</th>
                      <th className="py-3 px-4">Entitas PT</th>
                      <th className="py-3 px-4">User / Departemen</th>
                      <th className="py-3 px-4">Periode Sewa</th>
                      <th className="py-3 px-4 text-right">Biaya Sewa / Bln</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredRental.map(ast => (
                      <tr key={ast.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-800 dark:text-white">{ast.name}</div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">Tag: {ast.assetTag} | {ast.model}</div>
                        </td>
                        <td className="py-3 px-4">{ast.companyName}</td>
                        <td className="py-3 px-4">
                          <div>{ast.userName}</div>
                          <div className="text-[10px] text-slate-400">{ast.userDept}</div>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-400">
                          {new Date(ast.rentalStart).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })} - {new Date(ast.rentalEnd).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">{formatRupiah(ast.rentalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. SUBSCRIPTIONS */}
          {(activeTab === 'ALL' || activeTab === 'SUBSCRIPTION') && filteredSubs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>Subscription, Domain &amp; Lisensi ({filteredSubs.length})</span>
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs font-semibold border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Layanan / Domain</th>
                      <th className="py-3 px-4">Entitas PT &amp; Brand</th>
                      <th className="py-3 px-4">Vendor / Kategori</th>
                      <th className="py-3 px-4">Siklus Penagihan</th>
                      <th className="py-3 px-4 text-right">Biaya Kontrak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredSubs.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-800 dark:text-white">{sub.name}</div>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold">
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>{sub.companyName}</div>
                          {sub.brand && <div className="text-[10px] text-rose-500 font-bold">Brand: {sub.brand}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <div>{sub.vendor}</div>
                          <div className="text-[10px] text-slate-400">{sub.category}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{sub.billingCycle}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(sub.cost)}
                          {sub.currency === 'USD' && sub.costUSD && (
                            <div className="text-[9px] text-blue-500 font-normal">
                              ${sub.costUSD} (@ Rp {sub.exchangeRate ? sub.exchangeRate.toLocaleString('id-ID') : '-'})
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. ISP INTERNET */}
          {(activeTab === 'ALL' || activeTab === 'ISP') && filteredIsp.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wifi className="w-4 h-4" />
                <span>Internet &amp; Sirkuit ISP ({filteredIsp.length})</span>
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs font-semibold border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Nama Layanan ISP</th>
                      <th className="py-3 px-4">Entitas PT &amp; Brand</th>
                      <th className="py-3 px-4">CID / No Kontrak</th>
                      <th className="py-3 px-4">Bandwidth</th>
                      <th className="py-3 px-4 text-right">Biaya ISP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredIsp.map(ispItem => (
                      <tr key={ispItem.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-800 dark:text-white">{ispItem.name}</div>
                          <div className="text-[10px] text-slate-400">Provider: {ispItem.vendor}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div>{ispItem.companyName}</div>
                          {ispItem.brand && <div className="text-[10px] text-rose-500 font-bold">Brand: {ispItem.brand}</div>}
                        </td>
                        <td className="py-3 px-4 font-mono text-amber-600 dark:text-amber-400 font-bold">{ispItem.contractNumber || '-'}</td>
                        <td className="py-3 px-4 text-cyan-600 dark:text-cyan-400 font-bold">{ispItem.bandwidth || '-'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400">{formatRupiah(ispItem.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {grandTotalFiltered === 0 && (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-10 h-10 mx-auto opacity-50 text-rose-500" />
              <p className="text-sm font-semibold">Tidak ada data transaksi yang cocok dengan kriteria filter.</p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-400">
          <span>Menampilkan rincian transaksi riil pembentuk total biaya IT.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
