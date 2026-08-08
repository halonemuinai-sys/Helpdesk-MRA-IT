import React, { useState, useEffect } from 'react';
import { X, Tag, Plus, Trash2, ExternalLink, CreditCard, Receipt, AlertCircle, CheckCircle2, DollarSign, Laptop } from 'lucide-react';

export default function BudgetTaggingModal({
  isOpen,
  onClose,
  budget,
  token,
  apiUrl,
  onUpdateBudget,
  formatRupiah
}) {
  const [expenses, setExpenses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State Manual Tag
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formVendor, setFormVendor] = useState('');
  const [formExpenseDate, setFormExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [formReceiptLink, setFormReceiptLink] = useState('');

  // Selected Subscription Quick Tag (multi)
  const [selectedSubIds, setSelectedSubIds] = useState([]);

  // Rental Asset Quick Tag (multi)
  const [rentalAssets, setRentalAssets] = useState([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);

  useEffect(() => {
    if (isOpen && budget) {
      fetchExpenses();
      fetchSubscriptions();
      fetchRentalAssets();
    }
  }, [isOpen, budget]);

  const fetchExpenses = async () => {
    if (!budget) return;
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/budgets/${budget.id}/expenses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    if (!budget) return;
    try {
      const params = new URLSearchParams({ status: 'ACTIVE' });
      if (budget.companyMasterId) params.append('companyMasterId', budget.companyMasterId);
      const res = await fetch(`${apiUrl}/subscriptions?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(Array.isArray(data) ? data : (data.subscriptions || []));
      }
    } catch (err) {
      console.error('Error fetching subscriptions for tagging:', err);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!formDescription || !formAmount) {
      setError('Deskripsi dan nominal transaksi wajib diisi.');
      return;
    }
    setError('');
    try {
      setSubmitting(true);
      const res = await fetch(`${apiUrl}/budgets/${budget.id}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: formDescription,
          amount: parseFloat(formAmount),
          expenseDate: formExpenseDate,
          invoiceNumber: formInvoiceNumber,
          vendor: formVendor,
          receiptLink: formReceiptLink
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal menambahkan transaksi.');
      }

      const updatedBudget = await res.json();
      onUpdateBudget(updatedBudget);
      setExpenses(updatedBudget.expenses || []);
      
      // Reset form
      setFormDescription('');
      setFormAmount('');
      setFormInvoiceNumber('');
      setFormVendor('');
      setFormReceiptLink('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Hapus transaksi realisasi ini dari item anggaran?')) return;
    try {
      const res = await fetch(`${apiUrl}/budgets/${budget.id}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedBudget = await res.json();
        onUpdateBudget(updatedBudget);
        setExpenses(updatedBudget.expenses || []);
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  const fetchRentalAssets = async () => {
    if (!budget) return;
    try {
      const params = new URLSearchParams({ ownershipType: 'RENTAL' });
      if (budget.companyMasterId) params.append('companyMasterId', budget.companyMasterId);
      const res = await fetch(`${apiUrl}/assets?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.assets || []);
        setRentalAssets(list.filter(a => a.ownershipType === 'RENTAL' && a.rentalStatus !== 'EXPIRED'));
      }
    } catch (err) {
      console.error('Error fetching rental assets for tagging:', err);
    }
  };

  const handleQuickTagRental = async () => {
    if (selectedAssetIds.length === 0) return;
    try {
      setSubmitting(true);
      setError('');
      let lastBudget = null;
      for (const assetId of selectedAssetIds) {
        const res = await fetch(`${apiUrl}/budgets/${budget.id}/tag-rental`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ assetId })
        });
        if (res.ok) {
          lastBudget = await res.json();
        } else {
          const errData = await res.json();
          setError(errData.error || 'Gagal me-tag salah satu aset sewa.');
          break;
        }
      }
      if (lastBudget) {
        onUpdateBudget(lastBudget);
        setExpenses(lastBudget.expenses || []);
        setSelectedAssetIds([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickTagSub = async () => {
    if (selectedSubIds.length === 0) return;
    try {
      setSubmitting(true);
      setError('');
      let lastBudget = null;
      for (const subscriptionId of selectedSubIds) {
        const res = await fetch(`${apiUrl}/budgets/${budget.id}/tag-subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ subscriptionId })
        });
        if (res.ok) {
          lastBudget = await res.json();
        } else {
          const errData = await res.json();
          setError(errData.error || 'Gagal me-tag salah satu subskripsi.');
          break;
        }
      }
      if (lastBudget) {
        onUpdateBudget(lastBudget);
        setExpenses(lastBudget.expenses || []);
        setSelectedSubIds([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !budget) return null;

  const totalActual = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const remaining = budget.allocatedBudget - totalActual;
  const usagePercentage = budget.allocatedBudget > 0 ? ((totalActual / budget.allocatedBudget) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl min-h-screen shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 transition-all duration-300">
        
        {/* Header Drawer */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                {budget.projectCode} • {budget.budgetType}
              </div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 line-clamp-1">
                {budget.projectName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Budget Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-lg space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
              <span>Pagu Anggaran Disetujui</span>
              <span className="font-mono text-white text-sm font-black">{formatRupiah(budget.allocatedBudget)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Realisasi Ter-tag</span>
                <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                  {formatRupiah(totalActual)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Sisa Pagu Anggaran</span>
                <div className={`text-base font-black font-mono mt-0.5 ${remaining < 0 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
                  {formatRupiah(remaining)}
                </div>
              </div>
            </div>

            {/* Progress & Badge Status */}
            <div className="pt-2">
              <div className="flex justify-between text-[10px] font-extrabold mb-1">
                <span className="text-slate-400">Status Pemakaian Realisasi:</span>
                <span className={usagePercentage > 100 ? 'text-rose-400' : usagePercentage === 100 ? 'text-emerald-400' : usagePercentage === 0 ? 'text-slate-400' : 'text-blue-400'}>
                  {usagePercentage === 0 ? 'Belum Dipakai' : usagePercentage === 100 ? 'Terpakai Penuh (100%)' : usagePercentage > 100 ? `Over-Budget (${usagePercentage.toFixed(0)}%)` : `${usagePercentage.toFixed(0)}% Terpakai`}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 transition-all duration-500 rounded-full ${
                    usagePercentage > 100 ? 'bg-rose-500' : usagePercentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Tag Subskripsi Aktif */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
            <h3 className="text-xs font-black text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-500" />
              Quick Tag dari Layanan Subskripsi IT MRA
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pilih kontrak subskripsi/ISP yang aktif untuk langsung ditambatkan sebagai realisasi pengeluaran item budget ini.
            </p>
            {subscriptions.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">Tidak ada subskripsi aktif untuk entitas ini.</p>
            ) : (
              <>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                  {subscriptions.map((sub) => {
                    const checked = selectedSubIds.includes(sub.id);
                    return (
                      <label key={sub.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition text-xs ${checked ? 'bg-indigo-50 dark:bg-indigo-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setSelectedSubIds(prev => checked ? prev.filter(id => id !== sub.id) : [...prev, sub.id])}
                          className="accent-indigo-600 w-3.5 h-3.5 shrink-0"
                        />
                        <span className="flex-1 font-semibold text-slate-700 dark:text-slate-200 truncate">
                          <span className="text-indigo-500 font-bold">[{sub.category}]</span> {sub.providerName || sub.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 shrink-0">
                          {formatRupiah(sub.billingCycle === '1 Bulan' ? sub.cost * 12 : sub.cost)}/thn
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {selectedSubIds.length > 0 ? `${selectedSubIds.length} item dipilih` : 'Centang item yang ingin di-tag'}
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickTagSub}
                    disabled={selectedSubIds.length === 0 || submitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-500/10 flex items-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Tag {selectedSubIds.length > 1 ? `${selectedSubIds.length} Subskripsi` : 'Subskripsi'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Quick Tag Aset Sewa Aktif */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-3">
            <h3 className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-amber-500" />
              Quick Tag dari Aset Sewa IT MRA
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pilih aset sewa aktif untuk ditambatkan sebagai realisasi sewa tahunan pada item anggaran ini.
            </p>
            {rentalAssets.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">Tidak ada aset sewa aktif untuk entitas ini.</p>
            ) : (
              <>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                  {rentalAssets.map((asset) => {
                    const checked = selectedAssetIds.includes(asset.id);
                    return (
                      <label key={asset.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition text-xs ${checked ? 'bg-amber-50 dark:bg-amber-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setSelectedAssetIds(prev => checked ? prev.filter(id => id !== asset.id) : [...prev, asset.id])}
                          className="accent-amber-500 w-3.5 h-3.5 shrink-0"
                        />
                        <span className="flex-1 font-semibold text-slate-700 dark:text-slate-200 truncate">
                          <span className="text-amber-600 font-bold">{asset.brand} {asset.model}</span>
                          <span className="text-slate-400 font-normal"> — {asset.assetTag}</span>
                          {asset.vendor && <span className="text-slate-400 font-normal"> ({asset.vendor})</span>}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 shrink-0">
                          {formatRupiah((asset.rentalCost || 0) * 12)}/thn
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {selectedAssetIds.length > 0 ? `${selectedAssetIds.length} aset dipilih` : 'Centang aset yang ingin di-tag'}
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickTagRental}
                    disabled={selectedAssetIds.length === 0 || submitting}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md shadow-amber-500/10 flex items-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Tag {selectedAssetIds.length > 1 ? `${selectedAssetIds.length} Aset Sewa` : 'Aset Sewa'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Form Tambah Transaksi Realisasi Manual */}
          <form onSubmit={handleAddExpense} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-500" />
              Catat Transaksi Realisasi Manual (PO / Invoice / Nota)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Deskripsi Transaksi *</label>
                <input
                  type="text"
                  placeholder="e.g. Pembelian 5 Unit Laptop Dell PO-889"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nominal Transaksi (Rp) *</label>
                <input
                  type="number"
                  placeholder="e.g. 15000000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">No PO / Invoice</label>
                <input
                  type="text"
                  placeholder="e.g. INV/2026/08/990"
                  value={formInvoiceNumber}
                  onChange={(e) => setFormInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Vendor / Supplier</label>
                <input
                  type="text"
                  placeholder="e.g. PT Synnex Metrodata"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Realisasi</label>
                <input
                  type="date"
                  value={formExpenseDate}
                  onChange={(e) => setFormExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tautan Bukti / Link Drive</label>
                <input
                  type="text"
                  placeholder="e.g. https://drive.google.com/..."
                  value={formReceiptLink}
                  onChange={(e) => setFormReceiptLink(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Catat Transaksi Realisasi
              </button>
            </div>
          </form>

          {/* Rincian Transaksi Realisasi Ter-tag */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Daftar Transaksi Realisasi Ter-tag ({expenses.length})</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formatRupiah(totalActual)}</span>
            </h3>

            {loading ? (
              <div className="text-center py-6 text-xs text-slate-400">Loading rincian transaksi...</div>
            ) : expenses.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400 space-y-1">
                <Receipt className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="font-bold">Belum ada transaksi realisasi yang ditambatkan.</p>
                <p className="text-[11px] text-slate-400">Gunakan form di atas untuk mencatat transaksi PO/Invoice atau me-tag subskripsi aktif.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 transition flex justify-between items-center gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        {exp.description}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                        <span>🗓️ {new Date(exp.expenseDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        {exp.vendor && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-semibold text-slate-600 dark:text-slate-300">🏢 {exp.vendor}</span>}
                        {exp.invoiceNumber && <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 px-1.5 py-0.2 rounded font-mono">📄 {exp.invoiceNumber}</span>}
                        {exp.receiptLink && (
                          <a
                            href={exp.receiptLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-500 hover:underline flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-3 h-3" /> Bukti
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(exp.amount)}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        title="Hapus Transaksi Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
