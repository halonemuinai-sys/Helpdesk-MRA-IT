import React from 'react';
import { CreditCard, Plus, FileText, AlertTriangle } from 'lucide-react';
import ReactLoader from '../components/ReactLoader';
import useSubscriptions from '../hooks/useSubscriptions';
import SubscriptionKpiStats from '../components/subscriptions/SubscriptionKpiStats';
import SubscriptionFilterBar from '../components/subscriptions/SubscriptionFilterBar';
import SubscriptionTable from '../components/subscriptions/SubscriptionTable';
import SubscriptionFormDrawer from '../components/subscriptions/SubscriptionFormDrawer';

export default function Subscriptions({ user, token }) {
  const h = useSubscriptions({ token });

  if (h.loading && h.companies.length === 0) {
    return <ReactLoader size="lg" text="Loading Subscriptions Database..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-rose-500 animate-pulse" />
            IT Subscriptions &amp; Renewals
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-semibold">
            Pantau siklus pembiayaan, tanggal kadaluarsa domain, hosting, VPN, dan subskripsi infrastruktur IT MRA Group.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {h.hasProcessed && h.filteredSubs.length > 0 && (
            <button
              onClick={h.handlePrintReport}
              className="flex items-center gap-1.5 bg-slate-500 hover:bg-slate-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-slate-500/10 hover:shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
            >
              <FileText className="w-4 h-4" />
              Cetak PDF Laporan
            </button>
          )}
          <button
            onClick={h.handleOpenAddModal}
            className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
          >
            <Plus className="w-4 h-4" />
            Tambah Layanan Baru
          </button>
        </div>
      </div>

      {h.error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5" />
          <span>{h.error}</span>
        </div>
      )}

      <SubscriptionKpiStats
        activeSubs={h.activeSubs}
        nearExpiryCount={h.nearExpiryCount}
        expiredCount={h.expiredCount}
        estMonthlyBudget={h.estMonthlyBudget}
        formatRupiah={h.formatRupiah}
      />

      <SubscriptionFilterBar
        searchQuery={h.searchQuery} setSearchQuery={h.setSearchQuery}
        selectedCategory={h.selectedCategory} setSelectedCategory={h.setSelectedCategory}
        selectedCompanyMasterId={h.selectedCompanyMasterId} setSelectedCompanyMasterId={h.setSelectedCompanyMasterId}
        selectedStatus={h.selectedStatus} setSelectedStatus={h.setSelectedStatus}
        companies={h.companies}
        loading={h.loading}
        onProcess={h.fetchSubscriptions}
        onReset={h.handleResetFilters}
      />

      <SubscriptionTable
        filteredSubs={h.filteredSubs}
        expandedRows={h.expandedRows}
        toggleRow={h.toggleRow}
        now={h.now}
        formatRupiah={h.formatRupiah}
        onEdit={h.handleOpenEditModal}
        onDelete={h.handleDelete}
        onReplace={h.handleOpenReplacementModal}
        hasProcessed={h.hasProcessed}
        loading={h.loading}
        onProcess={h.fetchSubscriptions}
      />

      <SubscriptionFormDrawer
        isOpen={h.isModalOpen}
        onClose={() => h.setIsModalOpen(false)}
        isEditMode={h.isEditMode}
        isReplacementMode={h.isReplacementMode}
        submitting={h.submitting}
        formError={h.formError}
        companies={h.companies}
        onSubmit={h.handleSubmit}
        formatNumberForInput={h.formatNumberForInput}
        formCompanyId={h.formCompanyId} setFormCompanyId={h.setFormCompanyId}
        formAuthorizedCompanyId={h.formAuthorizedCompanyId} setFormAuthorizedCompanyId={h.setFormAuthorizedCompanyId}
        formCategory={h.formCategory} setFormCategory={h.setFormCategory}
        formVendor={h.formVendor} setFormVendor={h.setFormVendor}
        formName={h.formName} setFormName={h.setFormName}
        formBrand={h.formBrand} setFormBrand={h.setFormBrand}
        formLocation={h.formLocation} setFormLocation={h.setFormLocation}
        formContractNumber={h.formContractNumber} setFormContractNumber={h.setFormContractNumber}
        formBillingCycle={h.formBillingCycle} setFormBillingCycle={h.setFormBillingCycle}
        formCost={h.formCost} setFormCost={h.setFormCost}
        formStartDate={h.formStartDate} setFormStartDate={h.setFormStartDate}
        formExpiryDate={h.formExpiryDate} setFormExpiryDate={h.setFormExpiryDate}
        formStatus={h.formStatus} setFormStatus={h.setFormStatus}
        formEvidenceLink={h.formEvidenceLink} setFormEvidenceLink={h.setFormEvidenceLink}
        formNotes={h.formNotes} setFormNotes={h.setFormNotes}
        formUpdateJourney={h.formUpdateJourney} setFormUpdateJourney={h.setFormUpdateJourney}
      />
    </div>
  );
}
