import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Building2, 
  Calendar, 
  Trash2, 
  Edit2, 
  Loader2, 
  AlertTriangle,
  Link as LinkIcon,
  FileText,
  Clock,
  History,
  CheckCircle2,
  X,
  RefreshCw,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import ReactLoader from '../components/ReactLoader';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CATEGORIES = ['Hosting', 'Domain', 'VPN', 'ISP', 'Subscription', 'Security', 'Others'];
const BILLING_CYCLES = ['1 Bulan', '3 Bulan', '6 Bulan', '1 Tahun', '2 Tahun', '3 Tahun'];

export default function Subscriptions({ user, token }) {
  const formatNumberForInput = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const raw = value.toString().replace(/\D/g, '');
    if (!raw) return '';
    return parseInt(raw, 10).toLocaleString('id-ID');
  };

  const [subscriptions, setSubscriptions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCompanyMasterId, setSelectedCompanyMasterId] = useState('');

  // UI state
  const [expandedRows, setExpandedRows] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isReplacementMode, setIsReplacementMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form fields
  const [formId, setFormId] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formVendor, setFormVendor] = useState('');
  const [formName, setFormName] = useState('');
  const [formBillingCycle, setFormBillingCycle] = useState('1 Tahun');
  const [formCost, setFormCost] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formEvidenceLink, setFormEvidenceLink] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formUpdateJourney, setFormUpdateJourney] = useState('');
  const [formCompanyId, setFormCompanyId] = useState('');
  const [replacedSubscriptionId, setReplacedSubscriptionId] = useState(null);

  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch Companies (Master entities)
      const compRes = await fetch(`${API_URL}/companies/master`, { headers });
      if (!compRes.ok) throw new Error('Gagal memuat data perusahaan.');
      const compData = await compRes.json();
      setCompanies(compData);
      setFormCompanyId(compData[0]?.id || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };

      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedCompanyMasterId) params.append('companyMasterId', selectedCompanyMasterId);
      if (searchQuery) params.append('search', searchQuery);

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const subRes = await fetch(`${API_URL}/subscriptions${queryString}`, { headers });
      if (!subRes.ok) throw new Error('Gagal memuat data subskripsi IT.');
      const subData = await subRes.json();
      setSubscriptions(subData);
      setHasProcessed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    await fetchSubscriptions();
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedStatus('');
    setSelectedCompanyMasterId('');
    setSearchQuery('');
    setSubscriptions([]);
    setHasProcessed(false);
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      Swal.fire({
        icon: 'error',
        title: 'Pop-up Blocker Aktif',
        text: 'Silakan izinkan pop-up untuk mencetak laporan PDF.'
      });
      return;
    }

    const totalCount = filteredSubs.length;
    const activeCount = filteredSubs.filter(s => s.status === 'ACTIVE' && new Date(s.expiryDate) >= now).length;
    const expiredCountVal = filteredSubs.filter(s => s.status === 'EXPIRED' || (s.status === 'ACTIVE' && new Date(s.expiryDate) < now)).length;
    const nearExpiryCountVal = filteredSubs.filter(s => {
      if (s.status !== 'ACTIVE') return false;
      const expiry = new Date(s.expiryDate);
      const diffTime = expiry - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).length;

    const monthlyBudget = filteredSubs.filter(s => s.status === 'ACTIVE').reduce((acc, sub) => {
      let divisor = 1;
      if (sub.billingCycle === '1 Bulan') divisor = 1;
      else if (sub.billingCycle === '3 Bulan') divisor = 3;
      else if (sub.billingCycle === '6 Bulan') divisor = 6;
      else if (sub.billingCycle === '1 Tahun') divisor = 12;
      else if (sub.billingCycle === '2 Tahun') divisor = 24;
      else if (sub.billingCycle === '3 Tahun') divisor = 36;
      return acc + (sub.cost / divisor);
    }, 0);

    const annualBudget = monthlyBudget * 12;

    // Breakdown per Category
    const categoryBreakdown = {};
    filteredSubs.forEach(sub => {
      if (!categoryBreakdown[sub.category]) {
        categoryBreakdown[sub.category] = { count: 0, cost: 0 };
      }
      categoryBreakdown[sub.category].count += 1;
      if (sub.status === 'ACTIVE') {
        let divisor = 1;
        if (sub.billingCycle === '1 Bulan') divisor = 1;
        else if (sub.billingCycle === '3 Bulan') divisor = 3;
        else if (sub.billingCycle === '6 Bulan') divisor = 6;
        else if (sub.billingCycle === '1 Tahun') divisor = 12;
        else if (sub.billingCycle === '2 Tahun') divisor = 24;
        else if (sub.billingCycle === '3 Tahun') divisor = 36;
        categoryBreakdown[sub.category].cost += (sub.cost / divisor);
      }
    });

    // Breakdown per Company Master
    const companyBreakdown = {};
    filteredSubs.forEach(sub => {
      const coName = sub.companyMaster?.name || 'Unassigned';
      if (!companyBreakdown[coName]) {
        companyBreakdown[coName] = { count: 0, cost: 0 };
      }
      companyBreakdown[coName].count += 1;
      if (sub.status === 'ACTIVE') {
        let divisor = 1;
        if (sub.billingCycle === '1 Bulan') divisor = 1;
        else if (sub.billingCycle === '3 Bulan') divisor = 3;
        else if (sub.billingCycle === '6 Bulan') divisor = 6;
        else if (sub.billingCycle === '1 Tahun') divisor = 12;
        else if (sub.billingCycle === '2 Tahun') divisor = 24;
        else if (sub.billingCycle === '3 Tahun') divisor = 36;
        companyBreakdown[coName].cost += (sub.cost / divisor);
      }
    });

    const formatIDR = (val) => {
      return 'Rp ' + Math.round(val).toLocaleString('id-ID');
    };

    const logoUrl = `${window.location.origin}/mra_logo.jpg`;
    const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Eksekutif Subskripsi IT - MRA Group</title>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            font-family: 'Outfit', 'Inter', sans-serif;
            color: #0f172a;
            font-size: 10px;
            line-height: 1.5;
            background: #fff;
            margin: 0;
            padding: 0;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .logo-box {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .header-logo {
            height: 48px;
            width: auto;
          }
          .header-info {
            text-align: right;
          }
          .header-title {
            font-size: 16px;
            font-weight: 800;
            color: #f43f5e;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header-subtitle {
            font-size: 10px;
            color: #64748b;
            margin: 3px 0 0 0;
            font-weight: 600;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .metric-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px;
            text-align: left;
          }
          .metric-card.critical {
            border-color: #fca5a5;
            background: #fef2f2;
          }
          .metric-card.success {
            border-color: #a7f3d0;
            background: #ecfdf5;
          }
          .metric-title {
            font-size: 8px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .metric-val {
            font-size: 16px;
            font-weight: 800;
            color: #1e293b;
            margin-top: 4px;
          }
          .metric-card.critical .metric-val {
            color: #dc2626;
          }
          .metric-card.success .metric-val {
            color: #059669;
          }
          
          .section-title {
            font-size: 11px;
            font-weight: 800;
            color: #1e293b;
            margin: 20px 0 8px 0;
            border-left: 3px solid #f43f5e;
            padding-left: 8px;
            text-transform: uppercase;
          }
          
          .tables-row {
            display: grid;
            grid-template-columns: 1fr 1.2fr;
            gap: 16px;
            margin-bottom: 20px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
          }
          th {
            background: #f1f5f9;
            color: #475569;
            font-weight: 700;
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
            text-align: left;
            text-transform: uppercase;
            font-size: 8px;
          }
          td {
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
            color: #334155;
          }
          tr:nth-child(even) td {
            background: #fafafa;
          }
          
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .badge-active {
            background: #d1fae5;
            color: #065f46;
          }
          .badge-expired {
            background: #fee2e2;
            color: #991b1b;
          }
          .badge-inactive {
            background: #f1f5f9;
            color: #475569;
          }
          
          .row-expired {
            background-color: #fff1f2 !important;
          }
          .row-expiring {
            background-color: #fffbeb !important;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .footer {
            margin-top: 30px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            text-align: center;
            font-size: 8px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="logo-box">
            <img src="${logoUrl}" class="header-logo" alt="MRA Group Logo" onerror="this.style.display='none'">
            <div>
              <h1 class="header-title">IT Subscriptions & Renewals</h1>
              <p class="header-subtitle">MRA Group Executive Report</p>
            </div>
          </div>
          <div class="header-info">
            <div style="font-weight: 700; font-size: 10px; color: #1e293b;">Laporan Dokumen Resmi</div>
            <div style="color: #64748b; margin-top: 2px; font-size: 9px;">Dicetak: ${todayStr}</div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-title">Total Kontrak</div>
            <div class="metric-val">${totalCount} Layanan</div>
          </div>
          <div class="metric-card success">
            <div class="metric-title">Kontrak Aktif</div>
            <div class="metric-val">${activeCount} Aktif</div>
          </div>
          <div class="metric-card critical">
            <div class="metric-title">Kadaluwarsa</div>
            <div class="metric-val">${expiredCountVal} Kontrak</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Anggaran Bulanan</div>
            <div class="metric-val" style="color: #0369a1;">${formatIDR(monthlyBudget)}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px; padding: 0 4px;">
          <div>
            <span style="font-weight: 600; color: #64748b; font-size: 8px; text-transform: uppercase;">Proyeksi Anggaran Tahunan</span>
            <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 2px;">${formatIDR(annualBudget)}</div>
          </div>
          <div style="text-align: right; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 9px; color: #64748b; font-weight: 600;">Kontrak Segera Habis (&lt;30 hari): <span style="color: #d97706; font-weight: 800;">${nearExpiryCountVal}</span></div>
          </div>
        </div>

        <div class="tables-row">
          <div>
            <div class="section-title">Anggaran per Kategori</div>
            <table>
              <thead>
                <tr>
                  <th>Kategori</th>
                  <th style="text-align: center;">Jumlah</th>
                  <th style="text-align: right;">Estimasi Bulanan (IDR)</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(categoryBreakdown).map(([cat, val]) => `
                  <tr>
                    <td style="font-weight: 700;">${cat}</td>
                    <td style="text-align: center;">${val.count}</td>
                    <td style="text-align: right; font-weight: 700; font-family: monospace;">${formatIDR(val.cost)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div>
            <div class="section-title">Anggaran per Anak Perusahaan (PT)</div>
            <table>
              <thead>
                <tr>
                  <th>Perusahaan Master</th>
                  <th style="text-align: center;">Jumlah</th>
                  <th style="text-align: right;">Estimasi Bulanan (IDR)</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(companyBreakdown).map(([co, val]) => `
                  <tr>
                    <td style="font-weight: 700;">${co}</td>
                    <td style="text-align: center;">${val.count}</td>
                    <td style="text-align: right; font-weight: 700; font-family: monospace;">${formatIDR(val.cost)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="page-break"></div>

        <div class="section-title">Daftar Inventaris Detail Kontrak</div>
        <table>
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">No</th>
              <th>Nama Layanan / Domain</th>
              <th>Entitas MRA</th>
              <th>Kategori</th>
              <th>Siklus</th>
              <th style="text-align: right;">Biaya (IDR)</th>
              <th>Tgl Habis</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredSubs.map((sub, index) => {
              const isExpired = new Date(sub.expiryDate) < now && sub.status === 'ACTIVE';
              const isExpiredActual = sub.status === 'EXPIRED' || isExpired;
              
              const expiry = new Date(sub.expiryDate);
              const diffTime = expiry - now;
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const isExpiringSoon = sub.status === 'ACTIVE' && diffDays >= 0 && diffDays <= 30;

              let rowClass = '';
              if (isExpiredActual) rowClass = 'row-expired';
              else if (isExpiringSoon) rowClass = 'row-expiring';

              let statusText = sub.status;
              let statusBadge = 'badge-active';
              if (isExpiredActual) {
                statusText = 'EXPIRED';
                statusBadge = 'badge-expired';
              } else if (sub.status === 'INACTIVE') {
                statusBadge = 'badge-inactive';
              }

              return `
                <tr class="${rowClass}" style="page-break-inside: avoid;">
                  <td style="text-align: center;">${index + 1}</td>
                  <td>
                    <div style="font-weight: 700;">${sub.name}</div>
                    <div style="font-size: 8px; color: #64748b;">Vendor: ${sub.vendor}</div>
                  </td>
                  <td style="font-weight: 600;">${sub.companyMaster?.name || '-'}</td>
                  <td>${sub.category}</td>
                  <td>${sub.billingCycle}</td>
                  <td style="text-align: right; font-weight: 700; font-family: monospace;">${formatIDR(sub.cost)}</td>
                  <td>${new Date(sub.expiryDate).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })}</td>
                  <td style="text-align: center;">
                    <span class="badge ${statusBadge}">${statusText}</span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          Laporan IT Subscriptions MRA Group - Halaman dicetak secara otomatis.
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  const formatRupiah = (value) => {
    if (value === undefined || value === null) return 'Rp 0';
    return 'Rp ' + Number(value).toLocaleString('id-ID');
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Open modal for new service
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setIsReplacementMode(false);
    setFormId('');
    setFormCategory('');
    setFormVendor('');
    setFormName('');
    setFormBillingCycle('1 Tahun');
    setFormCost('');
    
    const today = new Date().toISOString().split('T')[0];
    setFormStartDate(today);
    
    // Default expiry 1 year from now
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    setFormExpiryDate(oneYearLater.toISOString().split('T')[0]);
    
    setFormStatus('ACTIVE');
    setFormEvidenceLink('');
    setFormNotes('');
    setFormUpdateJourney('');
    setFormCompanyId(companies[0]?.id || '');
    setReplacedSubscriptionId(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing existing
  const handleOpenEditModal = (sub) => {
    setIsEditMode(true);
    setIsReplacementMode(false);
    setFormId(sub.id);
    setFormCategory(sub.category);
    setFormVendor(sub.vendor);
    setFormName(sub.name);
    setFormBillingCycle(sub.billingCycle);
    setFormCost(formatNumberForInput(sub.cost));
    setFormStartDate(sub.startDate.split('T')[0]);
    setFormExpiryDate(sub.expiryDate.split('T')[0]);
    setFormStatus(sub.status);
    setFormEvidenceLink(sub.evidenceLink || '');
    setFormNotes(sub.notes || '');
    setFormUpdateJourney('');
    setFormCompanyId(sub.companyMasterId || '');
    setReplacedSubscriptionId(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for starting a New Contract based on an expired/existing one (Replacement Chain)
  const handleOpenReplacementModal = (sub) => {
    setIsEditMode(false);
    setIsReplacementMode(true);
    setFormId('');
    setFormCategory(sub.category);
    setFormVendor(sub.vendor);
    setFormName(sub.name + ' (Baru)');
    setFormBillingCycle(sub.billingCycle);
    setFormCost(formatNumberForInput(sub.cost));
    
    // New start date is the day after the old expiry date
    const oldExpiry = new Date(sub.expiryDate);
    const newStart = new Date(oldExpiry.getTime() + 24 * 60 * 60 * 1000);
    setFormStartDate(newStart.toISOString().split('T')[0]);
    
    // Expiry date calculated based on billing cycle
    const newExpiry = new Date(newStart);
    if (sub.billingCycle.includes('Tahun')) {
      const years = parseInt(sub.billingCycle);
      newExpiry.setFullYear(newExpiry.getFullYear() + years);
    } else {
      const months = parseInt(sub.billingCycle);
      newExpiry.setMonth(newExpiry.getMonth() + months);
    }
    setFormExpiryDate(newExpiry.toISOString().split('T')[0]);
    
    setFormStatus('ACTIVE');
    setFormEvidenceLink('');
    setFormNotes(`Menggantikan kontrak lama: ID ${sub.id.substring(0,8)}`);
    setFormUpdateJourney(`Kontrak baru dibuat menggantikan ID ${sub.id.substring(0,8)}`);
    setFormCompanyId(sub.companyMasterId || '');
    setReplacedSubscriptionId(sub.id);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    if (!formCategory || !formVendor || !formName || !formBillingCycle || !formCost || !formStartDate || !formExpiryDate || !formCompanyId) {
      setFormError('Semua kolom bertanda bintang (*) wajib diisi.');
      setSubmitting(false);
      return;
    }

    if (new Date(formStartDate) > new Date(formExpiryDate)) {
      setFormError('Tanggal Kedaluwarsa harus setelah Tanggal Mulai.');
      setSubmitting(false);
      return;
    }

    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const payload = {
        category: formCategory,
        vendor: formVendor,
        name: formName,
        billingCycle: formBillingCycle,
        cost: parseFloat(formCost.toString().replace(/\./g, '')) || 0,
        startDate: new Date(formStartDate).toISOString(),
        expiryDate: new Date(formExpiryDate).toISOString(),
        status: formStatus,
        evidenceLink: formEvidenceLink || null,
        notes: formNotes || null,
        companyMasterId: parseInt(formCompanyId),
        replacedSubscriptionId: replacedSubscriptionId,
        updateJourney: formUpdateJourney || null
      };

      let res;
      if (isEditMode) {
        res = await fetch(`${API_URL}/subscriptions/${formId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/subscriptions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal menyimpan data.');

      setIsModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: isEditMode ? 'Data Diperbarui!' : isReplacementMode ? 'Kontrak Baru Aktif!' : 'Layanan Terdaftar!',
        text: `Layanan ${formName} berhasil disimpan.`,
        confirmButtonColor: '#f43f5e',
        timer: 2000
      });

      handleRefreshData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (sub) => {
    Swal.fire({
      title: 'Apakah Anda Yakin?',
      text: `Menghapus kontrak ${sub.name} dari database. Semua riwayat perpanjangan terkait akan dihapus!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${API_URL}/subscriptions/${sub.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Gagal menghapus layanan.');
          }

          Swal.fire({
            icon: 'success',
            title: 'Dihapus!',
            text: 'Data layanan berhasil dihapus.',
            confirmButtonColor: '#f43f5e',
            timer: 1500
          });
          handleRefreshData();
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: err.message,
            confirmButtonColor: '#f43f5e'
          });
        }
      }
    });
  };

  // Calculations for stats
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE');
  const now = new Date();
  
  const expiredCount = subscriptions.filter(s => {
    return s.status === 'ACTIVE' && new Date(s.expiryDate) < now;
  }).length;

  const nearExpiryCount = subscriptions.filter(s => {
    if (s.status !== 'ACTIVE') return false;
    const expiry = new Date(s.expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  // Monthly Budget Estimation (converts all billing cycles to monthly equivalent)
  const estMonthlyBudget = activeSubs.reduce((acc, sub) => {
    let divisor = 1;
    if (sub.billingCycle === '1 Bulan') divisor = 1;
    else if (sub.billingCycle === '3 Bulan') divisor = 3;
    else if (sub.billingCycle === '6 Bulan') divisor = 6;
    else if (sub.billingCycle === '1 Tahun') divisor = 12;
    else if (sub.billingCycle === '2 Tahun') divisor = 24;
    else if (sub.billingCycle === '3 Tahun') divisor = 36;
    return acc + (sub.cost / divisor);
  }, 0);

  // Filters application
  const filteredSubs = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.notes && sub.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === '' || sub.category === selectedCategory;
    const matchesCompanyMaster = selectedCompanyMasterId === '' || sub.companyMasterId === parseInt(selectedCompanyMasterId, 10);

    // Status filter
    let matchesStatus = true;
    if (selectedStatus === 'ACTIVE') {
      matchesStatus = sub.status === 'ACTIVE' && new Date(sub.expiryDate) >= now;
    } else if (selectedStatus === 'EXPIRED') {
      matchesStatus = sub.status === 'EXPIRED' || (sub.status === 'ACTIVE' && new Date(sub.expiryDate) < now);
    } else if (selectedStatus === 'INACTIVE') {
      matchesStatus = sub.status === 'INACTIVE';
    }

    return matchesSearch && matchesCategory && matchesCompanyMaster && matchesStatus;
  });

  if (loading) {
    return <ReactLoader size="lg" text="Loading Subscriptions Database..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-rose-500 animate-pulse" />
            IT Subscriptions & Renewals
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-semibold">
            Pantau siklus pembiayaan, tanggal kadaluarsa domain, hosting, VPN, dan subskripsi infrastruktur IT MRA Group.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasProcessed && filteredSubs.length > 0 && (
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-1.5 bg-slate-500 hover:bg-slate-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-slate-500/10 hover:shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
            >
              <FileText className="w-4 h-4" />
              Cetak PDF Laporan
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 duration-200"
          >
            <Plus className="w-4 h-4" />
            Tambah Layanan Baru
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Active */}
        <div className="group bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900/60 dark:to-emerald-950/15 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-400/40 transition duration-300">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Layanan Aktif</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{activeSubs.length} Kontrak</h3>
          </div>
          <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Near Expiry */}
        <div className={`group bg-gradient-to-br from-white to-amber-50/20 dark:from-slate-900/60 dark:to-amber-950/15 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition duration-300 ${nearExpiryCount > 0 ? 'border-amber-300/60 dark:border-amber-800/60' : ''}`}>
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Segera Habis (&lt;30 Hari)</p>
            <h3 className={`text-2xl font-extrabold mt-2 ${nearExpiryCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-slate-350'}`}>
              {nearExpiryCount} Layanan
            </h3>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${nearExpiryCount > 0 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500 animate-pulse' : 'bg-gray-50 dark:bg-slate-800/40 text-gray-400'}`}>
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Expired */}
        <div className={`group bg-gradient-to-br from-white to-red-50/20 dark:from-slate-900/60 dark:to-red-950/15 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition duration-300 ${expiredCount > 0 ? 'border-red-300/60 dark:border-red-800/60' : ''}`}>
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Kadaluwarsa</p>
            <h3 className={`text-2xl font-extrabold mt-2 ${expiredCount > 0 ? 'text-red-650 dark:text-red-400' : 'text-gray-600 dark:text-slate-350'}`}>
              {expiredCount} Kontrak
            </h3>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${expiredCount > 0 ? 'bg-red-50 dark:bg-red-950/40 text-red-500 animate-bounce' : 'bg-gray-50 dark:bg-slate-800/40 text-gray-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Estimated Budget */}
        <div className="group bg-gradient-to-br from-white to-cyan-50/20 dark:from-slate-900/60 dark:to-cyan-950/15 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md hover:border-cyan-400/40 transition duration-300">
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Estimasi Anggaran Bulanan</p>
            <h3 className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-2">{formatRupiah(Math.round(estMonthlyBudget))}</h3>
          </div>
          <div className="w-11 h-11 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Control Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-gray-250/60 dark:border-slate-800/60 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
          
          {/* Search */}
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
            <input
              type="text"
              placeholder="Cari Layanan, Vendor, IP, Akun..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
            />
          </div>

          {/* Category & Status Filters */}
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Category Selector */}
            <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 px-3 py-2.5 rounded-xl w-full md:w-48">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
              >
                <option value="">Semua Kategori</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Company Master Selector */}
            <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 px-3 py-2.5 rounded-xl w-full md:w-56">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={selectedCompanyMasterId}
                onChange={(e) => setSelectedCompanyMasterId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
              >
                <option value="">Semua Perusahaan</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Status Selector */}
            <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-slate-950/30 border border-gray-200 dark:border-slate-850/50 px-3 py-2.5 rounded-xl w-full md:w-44">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
              >
                <option value="">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="EXPIRED">Kedaluwarsa</option>
                <option value="INACTIVE">Arsip / Inaktif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex justify-end items-center gap-3 pt-2 border-t border-gray-150 dark:border-slate-850/60">
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 border border-gray-250 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-655 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
          >
            Clear Filters
          </button>
          
          <button
            type="button"
            onClick={fetchSubscriptions}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-500/10 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Process & Load Subscriptions</span>
          </button>
        </div>
      </div>

      {!hasProcessed ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 max-w-2xl mx-auto space-y-6 animate-scale-up mt-6">
          <div className="w-16 h-16 rounded-full bg-rose-50/50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-gray-800 dark:text-slate-100">Ready to Process Subscriptions</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              Sistem MRA Group melacak beberapa kontrak domain, hosting, dan lisensi IT. Silakan pilih kriteria filter di atas dan klik <strong>"Process & Load Subscriptions"</strong> untuk menampilkan data.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchSubscriptions}
            disabled={loading}
            className="mx-auto flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-rose-500/15 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            <span>Process & Load Subscriptions</span>
          </button>
        </div>
      ) : (
        /* Main Subscriptions List */
        <div className="glass-panel rounded-3xl border border-gray-250/60 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/55 overflow-hidden">
        {filteredSubs.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 dark:text-slate-750 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Tidak ada layanan kontrak yang ditemukan.</p>
            <p className="text-xs text-gray-400 mt-1">Coba sesuaikan filter pencarian atau buat baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-6">Layanan / Domain</th>
                  <th className="py-4 px-6">Entitas Perusahaan</th>
                  <th className="py-4 px-6">Kategori</th>
                  <th className="py-4 px-6">Siklus</th>
                  <th className="py-4 px-6">Biaya Kontrak</th>
                  <th className="py-4 px-6">Tanggal Kedaluwarsa</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-700 dark:text-slate-300">
                {filteredSubs.map((sub) => {
                  const isExpired = new Date(sub.expiryDate) < now && sub.status === 'ACTIVE';
                  const isExpanded = !!expandedRows[sub.id];
                  
                  return (
                    <React.Fragment key={sub.id}>
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer" onClick={() => toggleRow(sub.id)}>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
                              <CreditCard className="w-3.5 h-3.5" />
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="font-bold text-gray-800 dark:text-slate-100 text-xs truncate max-w-[200px]">{sub.name}</h4>
                              <p className="text-[10px] text-gray-400 font-medium truncate max-w-[180px]">Provider: {sub.vendor}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-gray-700 dark:text-slate-350">
                          {sub.companyMaster?.name}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-block bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300">
                            {sub.category}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                          {sub.billingCycle}
                        </td>
                        <td className="py-4 px-6 font-mono text-gray-850 dark:text-slate-100 font-bold">
                          {formatRupiah(sub.cost)}
                        </td>
                        <td className="py-4 px-6 font-mono">
                          <div>{new Date(sub.expiryDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                          {sub.status === 'ACTIVE' && (
                            <div className={`text-[9px] font-bold ${
                              isExpired ? 'text-red-500' : 'text-slate-400'
                            }`}>
                              {isExpired 
                                ? 'Kadaluwarsa!' 
                                : `${Math.ceil((new Date(sub.expiryDate) - now) / (1000 * 60 * 60 * 24))} hari sisa`
                              }
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            sub.status === 'ACTIVE' && !isExpired
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : isExpired || sub.status === 'EXPIRED'
                              ? 'bg-red-50 text-red-650 dark:bg-red-950/40 dark:text-red-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              sub.status === 'ACTIVE' && !isExpired
                                ? 'bg-emerald-500'
                                : 'bg-red-500'
                            }`} />
                            {sub.status === 'ACTIVE' && isExpired ? 'EXPIRED' : sub.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Contract lineage icon indicator */}
                            {sub.replacedSubscriptionId && (
                              <div className="p-1 text-cyan-500" title="Menggantikan kontrak lama">
                                <History className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <button
                              onClick={() => handleOpenReplacementModal(sub)}
                              className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-600 hover:text-white rounded-md transition text-[9px] font-bold flex items-center gap-0.5"
                              title="Buat Kontrak Baru (Ganti Kontrak)"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              Ganti Kontrak
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(sub)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-rose-500 rounded-lg transition"
                              title="Perpanjang / Edit Detail"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(sub)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-red-500 rounded-lg transition"
                              title="Hapus Layanan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expansion: Journey and Details logs */}
                      {isExpanded && (
                        <tr className="bg-slate-50/30 dark:bg-slate-900/15">
                          <td colSpan="8" className="p-5 border-t border-gray-100 dark:border-slate-850">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                              
                              {/* Left Side: Specific Notes & Files */}
                              <div className="space-y-3.5">
                                <h5 className="font-extrabold text-[10px] uppercase text-gray-400 tracking-wider">Detail Konfigurasi</h5>
                                
                                {sub.notes ? (
                                  <div className="bg-white/80 dark:bg-slate-950/40 p-3 rounded-xl border border-gray-150 dark:border-slate-850 text-xs font-mono whitespace-pre-line text-slate-600 dark:text-slate-350">
                                    {sub.notes}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 italic">Tidak ada catatan konfigurasi tambahan.</p>
                                )}

                                {sub.evidenceLink && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Evidence Kontrak:</span>
                                    <a
                                      href={sub.evidenceLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-bold"
                                    >
                                      <LinkIcon className="w-3.5 h-3.5" />
                                      Buka Tautan Lampiran
                                    </a>
                                  </div>
                                )}

                                {/* Lineage Chain representation */}
                                {sub.replacedSubscription && (
                                  <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                                    <History className="w-3.5 h-3.5 text-cyan-500" />
                                    <span>Menggantikan kontrak: </span>
                                    <span className="font-bold text-slate-500">{sub.replacedSubscription.name} ({sub.replacedSubscription.vendor})</span>
                                  </div>
                                )}
                              </div>

                              {/* Right Side: Renewal Journey Timeline */}
                              <div className="space-y-3">
                                <h5 className="font-extrabold text-[10px] uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                                  <History className="w-3.5 h-3.5 text-rose-500" />
                                  Perjalanan Perpanjangan (Journey)
                                </h5>

                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                  {sub.renewals.length === 0 && (!sub.journey || !sub.journey.trim()) ? (
                                    <p className="text-xs text-gray-400 italic py-2">Belum ada riwayat perpanjangan tercatat.</p>
                                  ) : (
                                    <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-3.5 py-1">
                                      {/* Subscriptions text journey parser */}
                                      {sub.journey && sub.journey.split('\n').filter(Boolean).map((line, lIdx) => (
                                        <div key={lIdx} className="text-xs relative">
                                          <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" />
                                          <div className="font-semibold text-gray-700 dark:text-slate-350">{line}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* CRUD Form Modal (Side Drawer) */}
      {isModalOpen && createPortal((
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-gray-150 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-slide-left overflow-hidden">
              
              {/* Header */}
              <div className="flex justify-between items-center p-5 border-b border-gray-150 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {isEditMode ? 'Perbarui Layanan / Kontrak' : isReplacementMode ? 'Buat Kontrak Baru (Pengganti)' : 'Tambah Layanan Baru'}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                      {isEditMode 
                        ? 'Edit rincian data subskripsi atau log perpanjangan kontrak.' 
                        : isReplacementMode 
                        ? 'Hubungkan kontrak baru yang menggantikan kontrak aktif sebelumnya.' 
                        : 'Daftarkan subskripsi billing, ISP, VPN, atau domain baru.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                
                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800 text-red-755 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Company Tagging */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Anak Perusahaan / Entitas MRA *
                    </label>
                    <div className="relative group">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                      <select
                        value={formCompanyId}
                        onChange={(e) => setFormCompanyId(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                        required
                      >
                        {companies.map(comp => (
                          <option key={comp.id} value={comp.id}>
                            {comp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Kategori Layanan *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                      required
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Vendor/Provider */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Vendor / Provider *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Google, Niagahoster, Biznet"
                      value={formVendor}
                      onChange={(e) => setFormVendor(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                      required
                    />
                  </div>

                  {/* Service Name */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Nama Layanan / Domain *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Google Workspace, example.com"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                      required
                    />
                  </div>

                  {/* Billing Cycle */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Siklus Penagihan *
                    </label>
                    <select
                      value={formBillingCycle}
                      onChange={(e) => setFormBillingCycle(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-750 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                      required
                    >
                      {BILLING_CYCLES.map(cycle => (
                        <option key={cycle} value={cycle}>{cycle}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cost Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Biaya (Rp) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 150.000"
                      value={formCost}
                      onChange={(e) => setFormCost(formatNumberForInput(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                      required
                    />
                  </div>

                  {/* Start Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Tanggal Mulai *
                    </label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                      required
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Tanggal Kedaluwarsa *
                    </label>
                    <input
                      type="date"
                      value={formExpiryDate}
                      onChange={(e) => setFormExpiryDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                      required
                    />
                  </div>

                  {/* Status Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Status *
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-755 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition cursor-pointer"
                      required
                    >
                      <option value="ACTIVE">Aktif</option>
                      <option value="EXPIRED">Kedaluwarsa</option>
                      <option value="INACTIVE">Arsip / Inaktif</option>
                    </select>
                  </div>

                  {/* Evidence Attachment Link */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Evidence / Tautan Dokumen Kontrak
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: https://drive.google.com/..."
                      value={formEvidenceLink}
                      onChange={(e) => setFormEvidenceLink(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                    />
                  </div>

                  {/* Additional Notes Textarea */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Catatan Tambahan (IP, Link Account, Admin Credentials)
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Ex: Linked account admin@domain.com, IP: 192.168.1.1"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-50/70 dark:bg-slate-950/30 border border-gray-250 dark:border-slate-800/80 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                    />
                  </div>

                  {/* Update Journey Textarea (Only for Edit/Renew modes) */}
                  {isEditMode && (
                    <div className="p-4 rounded-2xl bg-brand-50/20 dark:bg-brand-950/10 border border-brand-200/40 dark:border-brand-900/30 space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider flex items-center gap-1">
                        <History className="w-3.5 h-3.5 animate-spin-slow" />
                        Update Journey / Perpanjangan Kontrak
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Isi jika Anda baru saja memperpanjang. Contoh: Diperpanjang 2 tahun per 6 bulan (Rp 300rb)"
                        value={formUpdateJourney}
                        onChange={(e) => setFormUpdateJourney(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950/50 border border-brand-200/60 dark:border-brand-900/50 text-gray-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                      />
                    </div>
                  )}

                </div>

              </div>

              {/* Action Buttons */}
              <div className="p-5 border-t border-gray-150 dark:border-slate-850 flex justify-end gap-3 bg-gray-50/50 dark:bg-slate-900/35">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100/50 dark:hover:bg-slate-800/60 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isEditMode ? 'Simpan Pembaruan' : isReplacementMode ? 'Simpan Kontrak Baru' : 'Simpan Layanan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      ), document.body)}

    </div>
  );
}
