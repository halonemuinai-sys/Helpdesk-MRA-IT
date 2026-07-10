import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { handleExportExcel } from '../components/rental/rentalExport';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function useRentalAnalysis({ token }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSector, setSelectedSector] = useState('ALL');

  // Breakdown modal
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [breakdownCompany, setBreakdownCompany] = useState(null);

  // Edit user budget modal
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingUserBudget, setEditingUserBudget] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);

  // Edit company budget modal
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editingCompanyBudget, setEditingCompanyBudget] = useState('');
  const [editingCompanySharedBudget, setEditingCompanySharedBudget] = useState('');

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // ── Formatters ─────────────────────────────────────────────────────────────

  const formatDateDMY = (value) => {
    if (!value) return '-';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return '-';
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${d.getDate()} ${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
    } catch (e) {
      return '-';
    }
  };

  const formatNumber = (num) => Math.round(num).toLocaleString('id-ID');

  const formatCurrency = (num) => `Rp ${formatNumber(num)}`;

  const formatNumberForInput = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const raw = value.toString().replace(/\D/g, '');
    if (!raw) return '';
    return parseInt(raw, 10).toLocaleString('id-ID');
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/reports/rental-analysis?year=${selectedYear}&category=${selectedCategory}&sector=${selectedSector}`,
        { headers }
      );
      if (!res.ok) throw new Error('Gagal mengambil data analisa biaya sewa.');
      const result = await res.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [selectedYear, selectedCategory, selectedSector]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const onExportExcel = () => {
    handleExportExcel({ data, selectedYear, selectedCategory, selectedSector });
  };

  const handleOpenBreakdown = (company) => {
    setBreakdownCompany(company);
    setIsBreakdownModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setEditingUserBudget(formatNumberForInput(user.monthlyBudget));
    setIsEditUserModalOpen(true);
  };

  const handleOpenEditCompany = (comp) => {
    setEditingCompany(comp);
    const empTotal = comp.monthlyBudget - comp.sharedBudget;
    setEditingCompanyBudget(formatNumberForInput(empTotal));
    setEditingCompanySharedBudget(formatNumberForInput(comp.sharedBudget));
    setIsEditCompanyModalOpen(true);
  };

  const handleUserBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setSavingBudget(true);
      const res = await fetch(`${API_URL}/reports/rental-budget/user`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          userId: editingUser.id,
          monthlyBudget: parseFloat(editingUserBudget.toString().replace(/\./g, '')) || 0,
        }),
      });
      if (!res.ok) throw new Error('Gagal memperbarui budget karyawan.');
      setIsEditUserModalOpen(false);
      Swal.fire({ icon: 'success', title: 'Budget Diperbarui', text: `Budget untuk ${editingUser.name} berhasil diperbarui.`, timer: 1500, showConfirmButton: false });
      fetchAnalysisData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    } finally {
      setSavingBudget(false);
    }
  };

  const handleCompanyBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!editingCompany) return;
    try {
      setSavingBudget(true);
      const res = await fetch(`${API_URL}/reports/rental-budget/company`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          companyMasterId: editingCompany.id,
          totalBudget: parseFloat(editingCompanyBudget.toString().replace(/\./g, '')) || 0,
          sharedBudget: parseFloat(editingCompanySharedBudget.toString().replace(/\./g, '')) || 0,
        }),
      });
      if (!res.ok) throw new Error('Gagal mendistribusikan budget perusahaan.');
      setIsEditCompanyModalOpen(false);
      Swal.fire({ icon: 'success', title: 'Budget Didistribusikan', text: `Budget bulanan ${editingCompany.name} berhasil diperbarui.`, timer: 1500, showConfirmButton: false });
      fetchAnalysisData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    } finally {
      setSavingBudget(false);
    }
  };

  // ── Computed grand totals ──────────────────────────────────────────────────

  const companyStats = data?.companyStats || [];
  const monthlyTotals = data?.monthlyTotals || Array(12).fill(0);
  const grandTotalDevices = companyStats.reduce((sum, c) => sum + c.totalDevices, 0);
  const grandTotalBudget = companyStats.reduce((sum, c) => sum + c.yearlyBudget, 0);
  const grandTotalCost = companyStats.reduce((sum, c) => sum + c.totalCost, 0);
  const grandTotalDifference = grandTotalBudget - grandTotalCost;
  const grandTotalUtilization = grandTotalBudget > 0 ? (grandTotalCost / grandTotalBudget) * 100 : 0;

  return {
    // loading
    loading, error,
    // data
    data, companyStats, monthlyTotals,
    // filters
    selectedYear, setSelectedYear,
    selectedCategory, setSelectedCategory,
    selectedSector, setSelectedSector,
    // grand totals
    grandTotalDevices, grandTotalBudget, grandTotalCost, grandTotalDifference, grandTotalUtilization,
    // breakdown modal
    isBreakdownModalOpen, setIsBreakdownModalOpen,
    breakdownCompany,
    handleOpenBreakdown,
    // edit user modal
    isEditUserModalOpen, setIsEditUserModalOpen,
    editingUser, editingUserBudget, setEditingUserBudget,
    savingBudget,
    handleOpenEditUser, handleUserBudgetSubmit,
    // edit company modal
    isEditCompanyModalOpen, setIsEditCompanyModalOpen,
    editingCompany,
    editingCompanyBudget, setEditingCompanyBudget,
    editingCompanySharedBudget, setEditingCompanySharedBudget,
    handleOpenEditCompany, handleCompanyBudgetSubmit,
    // export
    onExportExcel,
    // formatters
    formatDateDMY, formatNumber, formatCurrency, formatNumberForInput,
  };
}
