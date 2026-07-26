import React, { useState } from 'react';
import { Plus, AlertTriangle, Upload } from 'lucide-react';
import useAssets from '../hooks/useAssets';
import AssetKpiStats from '../components/assets/AssetKpiStats';
import AssetFilterBar from '../components/assets/AssetFilterBar';
import AssetTable from '../components/assets/AssetTable';
import AssetForm from '../components/assets/AssetForm';
import AssetBastModal from '../components/assets/AssetBastModal';
import AssetDetailDrawer from '../components/assets/AssetDetailDrawer';
import RentalMonitoringWidget from '../components/assets/RentalMonitoringWidget';
import CompanyBreakdownWidget from '../components/assets/CompanyBreakdownWidget';
import AssetBulkImport from '../components/assets/AssetBulkImport';

export default function Assets({ user, token }) {
  const {
    // data
    assets, companies, companyMasters, users,
    // loading
    loading, error,
    // filters
    searchQuery, setSearchQuery,
    selectedStatus, setSelectedStatus,
    selectedCompanyMasterId, setSelectedCompanyMasterId,
    selectedCategory, setSelectedCategory,
    assetsLoaded,
    // sort
    sortConfig, handleSort,
    // kpi
    kpiStats,
    // computed
    filteredAssets, sortedAssets, isSmartphone,
    // view drawer
    isViewDrawerOpen, viewingAsset, setIsViewDrawerOpen, setViewingAsset,
    // modal
    isModalOpen, setIsModalOpen, isEditMode, submitting, formError,
    // form fields
    formAssetTag, setFormAssetTag,
    formDeviceRef, setFormDeviceRef,
    formVendorRef, setFormVendorRef,
    formBrand, setFormBrand,
    formModel, setFormModel,
    formProcessor, setFormProcessor,
    formRam, setFormRam,
    formStorage, setFormStorage,
    formOs, setFormOs,
    formOffice, setFormOffice,
    formStatus, setFormStatus,
    formRentalCost, setFormRentalCost,
    formRentalStart, setFormRentalStart,
    formRentalEnd, setFormRentalEnd,
    formNotes, setFormNotes,
    formUpdateJourney, setFormUpdateJourney,
    formUserId, setFormUserId,
    formVendor, setFormVendor,
    formCompanyId, setFormCompanyId,
    formCompanyMasterId, setFormCompanyMasterId,
    formOwnershipType, setFormOwnershipType,
    formDeviceCategory, setFormDeviceCategory,
    // user dropdown
    userSearchText, setUserSearchText,
    isUserDropdownOpen, setIsUserDropdownOpen,
    userDropdownRef,
    // bast
    isBastModalOpen, setIsBastModalOpen, bastAsset,
    bastDocNum, setBastDocNum,
    bastAgentName, setBastAgentName,
    bastNotes, setBastNotes,
    // handlers
    handleRefreshData, handleResetFilters,
    handleOpenAddModal, handleOpenEditModal, handleOpenViewDrawer,
    handleOpenBastModal, handlePrintBast,
    handleSubmit, handleDelete,
    // formatters
    formatRupiah, formatDateYYMMDD, formatIndonesianDate, formatNumberForInput,
  } = useAssets({ token, user });
  const [activeTab, setActiveTab] = useState('list');
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white font-outfit">
            Asset Management
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-400 font-semibold mt-0.5 max-w-xl">
            Kelola inventarisasi perangkat IT sewa (rentals) maupun milik sendiri (owned), spesifikasi hardware, status, serta serah terima unit karyawan MRA Group.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBulkImportOpen(true)}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all duration-200"
          >
            <Upload className="w-4 h-4" />
            Bulk Import
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
          >
            <Plus className="w-4 h-4" />
            Daftarkan Aset Baru
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <AssetKpiStats kpiStats={kpiStats} formatRupiah={formatRupiah} />

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/80 gap-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-3 text-xs font-black font-outfit border-b-2 transition duration-150 ${
            activeTab === 'list'
              ? 'border-rose-500 text-rose-500 dark:text-rose-455'
              : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-350'
          }`}
        >
          Daftar Aset
        </button>
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`pb-3 text-xs font-black font-outfit border-b-2 transition duration-150 ${
            activeTab === 'monitoring'
              ? 'border-rose-500 text-rose-500 dark:text-rose-455'
              : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-350'
          }`}
        >
          Monitoring Sewa
        </button>
        <button
          onClick={() => setActiveTab('companyBreakdown')}
          className={`pb-3 text-xs font-black font-outfit border-b-2 transition duration-150 ${
            activeTab === 'companyBreakdown'
              ? 'border-rose-500 text-rose-500 dark:text-rose-455'
              : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-350'
          }`}
        >
          Breakdown Perusahaan
        </button>
      </div>

      {activeTab === 'list' && (
        <>
          <AssetFilterBar
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
            selectedCompanyMasterId={selectedCompanyMasterId} setSelectedCompanyMasterId={setSelectedCompanyMasterId}
            selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
            companyMasters={companyMasters}
            loading={loading}
            handleResetFilters={handleResetFilters}
            handleRefreshData={handleRefreshData}
          />

          <AssetTable
            sortedAssets={sortedAssets}
            filteredAssets={filteredAssets}
            assets={assets}
            loading={loading}
            assetsLoaded={assetsLoaded}
            handleSort={handleSort}
            sortConfig={sortConfig}
            handleOpenViewDrawer={handleOpenViewDrawer}
            handleOpenBastModal={handleOpenBastModal}
            handleOpenEditModal={handleOpenEditModal}
            handleDelete={handleDelete}
            formatRupiah={formatRupiah}
            formatDateYYMMDD={formatDateYYMMDD}
            isSmartphone={isSmartphone}
            user={user}
          />
        </>
      )}

      {activeTab === 'monitoring' && (
        <RentalMonitoringWidget 
          assets={assets} 
          formatRupiah={formatRupiah}
          onEditAsset={handleOpenEditModal}
          onOpenBast={handleOpenBastModal}
        />
      )}

      {activeTab === 'companyBreakdown' && (
        <CompanyBreakdownWidget
          assets={assets}
          companyMasters={companyMasters}
          formatRupiah={formatRupiah}
        />
      )}

      <AssetForm
        isModalOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditMode={isEditMode}
        submitting={submitting}
        formError={formError}
        formAssetTag={formAssetTag} setFormAssetTag={setFormAssetTag}
        formDeviceRef={formDeviceRef} setFormDeviceRef={setFormDeviceRef}
        formVendorRef={formVendorRef} setFormVendorRef={setFormVendorRef}
        formBrand={formBrand} setFormBrand={setFormBrand}
        formModel={formModel} setFormModel={setFormModel}
        formProcessor={formProcessor} setFormProcessor={setFormProcessor}
        formRam={formRam} setFormRam={setFormRam}
        formStorage={formStorage} setFormStorage={setFormStorage}
        formOs={formOs} setFormOs={setFormOs}
        formOffice={formOffice} setFormOffice={setFormOffice}
        formStatus={formStatus} setFormStatus={setFormStatus}
        formRentalCost={formRentalCost} setFormRentalCost={setFormRentalCost}
        formRentalStart={formRentalStart} setFormRentalStart={setFormRentalStart}
        formRentalEnd={formRentalEnd} setFormRentalEnd={setFormRentalEnd}
        formNotes={formNotes} setFormNotes={setFormNotes}
        formUpdateJourney={formUpdateJourney} setFormUpdateJourney={setFormUpdateJourney}
        formUserId={formUserId} setFormUserId={setFormUserId}
        formVendor={formVendor} setFormVendor={setFormVendor}
        formCompanyId={formCompanyId} setFormCompanyId={setFormCompanyId}
        formCompanyMasterId={formCompanyMasterId} setFormCompanyMasterId={setFormCompanyMasterId}
        formOwnershipType={formOwnershipType} setFormOwnershipType={setFormOwnershipType}
        formDeviceCategory={formDeviceCategory} setFormDeviceCategory={setFormDeviceCategory}
        userSearchText={userSearchText} setUserSearchText={setUserSearchText}
        isUserDropdownOpen={isUserDropdownOpen} setIsUserDropdownOpen={setIsUserDropdownOpen}
        userDropdownRef={userDropdownRef}
        users={users}
        companies={companies}
        companyMasters={companyMasters}
        handleSubmit={handleSubmit}
        formatNumberForInput={formatNumberForInput}
      />

      <AssetBastModal
        isBastModalOpen={isBastModalOpen}
        bastAsset={bastAsset}
        onClose={() => { setIsBastModalOpen(false); setBastNotes(''); setBastDocNum(''); setBastAgentName(''); }}
        bastDocNum={bastDocNum} setBastDocNum={setBastDocNum}
        bastAgentName={bastAgentName} setBastAgentName={setBastAgentName}
        bastNotes={bastNotes} setBastNotes={setBastNotes}
        handlePrintBast={handlePrintBast}
        formatIndonesianDate={formatIndonesianDate}
        user={user}
      />

      {bulkImportOpen && (
        <AssetBulkImport
          token={token}
          onClose={() => setBulkImportOpen(false)}
          onDone={handleRefreshData}
        />
      )}

      <AssetDetailDrawer
        isViewDrawerOpen={isViewDrawerOpen}
        viewingAsset={viewingAsset}
        onClose={() => { setIsViewDrawerOpen(false); setViewingAsset(null); }}
        handleOpenBastModal={handleOpenBastModal}
        handleOpenEditModal={handleOpenEditModal}
        formatRupiah={formatRupiah}
        formatDateYYMMDD={formatDateYYMMDD}
        isSmartphone={isSmartphone}
      />

    </div>
  );
}
