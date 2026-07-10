import React from 'react';
import { AlertTriangle, Loader2, Receipt, Package, TrendingUp, Plus, Download } from 'lucide-react';
import usePeripherals from '../hooks/usePeripherals';
import { STATUS_OPTIONS } from '../components/peripherals/constants';
import PeripheralKpiStats from '../components/peripherals/PeripheralKpiStats';
import PeripheralFilterBar from '../components/peripherals/PeripheralFilterBar';
import PeripheralInvoiceTable from '../components/peripherals/PeripheralInvoiceTable';
import PeripheralItemsTable from '../components/peripherals/PeripheralItemsTable';
import PeripheralAnalysisTab from '../components/peripherals/PeripheralAnalysisTab';
import PeripheralInvoiceForm from '../components/peripherals/PeripheralInvoiceForm';
import PeripheralAssetDetailDrawer from '../components/peripherals/PeripheralAssetDetailDrawer';

export default function Peripherals({ user, token }) {
  const {
    activeTab, setActiveTab,
    peripherals, invoices, companies, companyMasters,
    loading, error, analysisData, exporting,
    viewingAsset, setViewingAsset,
    stats,
    searchQuery, setSearchQuery,
    selectedStatus, setSelectedStatus,
    selectedCompanyMasterId, setSelectedCompanyMasterId,
    selectedCategory, setSelectedCategory,
    invoicesLoaded, itemsLoaded, analysisLoaded,
    expandedRows,
    isModalOpen, setIsModalOpen,
    isEditMode, submitting, formError,
    formInvoiceRef, setFormInvoiceRef,
    formPoRef, setFormPoRef,
    formSupplier, setFormSupplier,
    formPurchaseDate, setFormPurchaseDate,
    formNotes, setFormNotes,
    formCompanyMasterId, setFormCompanyMasterId,
    formFileLink, setFormFileLink,
    formServiceItems,
    formDeliveryCost, setFormDeliveryCost,
    formTaxCost, setFormTaxCost,
    formItems,
    handleRefreshData, handleResetFilters, handleExportExcel,
    toggleRow,
    handleAddItemRow, handleRemoveItemRow, handleUpdateItemField, handleItemPriceChange,
    handleAddServiceRow, handleRemoveServiceRow, handleUpdateServiceField, handleServiceCostChange,
    calculateTotalInvoiceCost,
    handleOpenAddModal, handleOpenEditModal,
    handleSubmit, handleDeleteInvoice, handleDeleteSingleItem,
    formatRupiah, formatDate, formatCostDigits,
    allFormCategories,
  } = usePeripherals({ token, user });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white font-outfit">
            IT Peripherals Purchase
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-400 font-semibold mt-0.5 max-w-xl">
            Kelola pembelian dan penempatan perangkat periferal IT operasional seperti NVR, CCTV Camera, Harddisk/Storage, Power/UPS, dan Network Switches di lingkungan MRA Group.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-1.5 border border-emerald-500 hover:bg-emerald-55/10 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 duration-200 disabled:opacity-50 cursor-pointer"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Excel
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Daftarkan Pembelian Periferal
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats */}
      <PeripheralKpiStats stats={stats} formatRupiah={formatRupiah} />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800">
        {[
          { key: 'invoices', icon: Receipt, label: 'Pembelian & Biaya (Invoice Expenses)' },
          { key: 'items',    icon: Package, label: 'Stok & Aset Fisik (Inventory Stock)' },
          { key: 'analysis', icon: TrendingUp, label: 'Analisa Biaya (Cost Analysis)' },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); handleResetFilters(); }}
            className={`py-3 px-6 text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-[2px] ${
              activeTab === key
                ? 'border-rose-500 text-rose-500'
                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-slate-350'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <PeripheralFilterBar
        activeTab={activeTab}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
        selectedCompanyMasterId={selectedCompanyMasterId} setSelectedCompanyMasterId={setSelectedCompanyMasterId}
        selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
        companyMasters={companyMasters}
        allFormCategories={allFormCategories}
        statusOptions={STATUS_OPTIONS}
        loading={loading}
        handleResetFilters={handleResetFilters}
        handleRefreshData={handleRefreshData}
      />

      {/* Tab Content */}
      {activeTab === 'invoices' && (
        <PeripheralInvoiceTable
          invoices={invoices} loading={loading} invoicesLoaded={invoicesLoaded}
          formatRupiah={formatRupiah} formatDate={formatDate}
          expandedRows={expandedRows} toggleRow={toggleRow}
          handleOpenEditModal={handleOpenEditModal}
          handleDeleteInvoice={handleDeleteInvoice}
          handleDeleteSingleItem={handleDeleteSingleItem}
          setViewingAsset={setViewingAsset}
          user={user} token={token}
          searchQuery={searchQuery} selectedCompanyMasterId={selectedCompanyMasterId}
        />
      )}

      {activeTab === 'items' && (
        <PeripheralItemsTable
          peripherals={peripherals} loading={loading} itemsLoaded={itemsLoaded}
          formatRupiah={formatRupiah}
          statusOptions={STATUS_OPTIONS}
          handleDeleteSingleItem={handleDeleteSingleItem}
          handleOpenEditModal={handleOpenEditModal}
          setViewingAsset={setViewingAsset}
        />
      )}

      {activeTab === 'analysis' && (
        <PeripheralAnalysisTab
          analysisData={analysisData} stats={stats}
          formatRupiah={formatRupiah}
          analysisLoaded={analysisLoaded} loading={loading}
        />
      )}

      {/* Form Drawer */}
      <PeripheralInvoiceForm
        isModalOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditMode={isEditMode}
        formError={formError}
        submitting={submitting}
        formInvoiceRef={formInvoiceRef} setFormInvoiceRef={setFormInvoiceRef}
        formPoRef={formPoRef} setFormPoRef={setFormPoRef}
        formSupplier={formSupplier} setFormSupplier={setFormSupplier}
        formPurchaseDate={formPurchaseDate} setFormPurchaseDate={setFormPurchaseDate}
        formNotes={formNotes} setFormNotes={setFormNotes}
        formCompanyMasterId={formCompanyMasterId} setFormCompanyMasterId={setFormCompanyMasterId}
        formFileLink={formFileLink} setFormFileLink={setFormFileLink}
        formServiceItems={formServiceItems}
        formDeliveryCost={formDeliveryCost} setFormDeliveryCost={setFormDeliveryCost}
        formTaxCost={formTaxCost} setFormTaxCost={setFormTaxCost}
        formItems={formItems}
        handleAddServiceRow={handleAddServiceRow}
        handleRemoveServiceRow={handleRemoveServiceRow}
        handleUpdateServiceField={handleUpdateServiceField}
        handleServiceCostChange={handleServiceCostChange}
        handleAddItemRow={handleAddItemRow}
        handleRemoveItemRow={handleRemoveItemRow}
        handleUpdateItemField={handleUpdateItemField}
        handleItemPriceChange={handleItemPriceChange}
        handleSubmit={handleSubmit}
        calculateTotalInvoiceCost={calculateTotalInvoiceCost}
        companyMasters={companyMasters}
        companies={companies}
        allFormCategories={allFormCategories}
        formatRupiah={formatRupiah}
        formatCostDigits={formatCostDigits}
      />

      {/* Asset Detail Drawer */}
      <PeripheralAssetDetailDrawer
        viewingAsset={viewingAsset}
        onClose={() => setViewingAsset(null)}
        companyMasters={companyMasters}
        formatRupiah={formatRupiah}
        statusOptions={STATUS_OPTIONS}
      />

    </div>
  );
}
