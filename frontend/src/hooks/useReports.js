import { useState, useEffect } from 'react';
import { MONTHS } from '../components/reports/constants';
import { handleExportExcel } from '../components/reports/reportExport';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function useReports({ token }) {
  const [data, setData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    fetchReportData();
  }, [selectedCompanyId, selectedMonth, selectedYear]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const yearNum = parseInt(selectedYear);

      let startDate, endDate;
      if (selectedMonth === 'ALL') {
        startDate = new Date(yearNum, 0, 1).toISOString();
        endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999).toISOString();
      } else {
        const monthIdx = parseInt(selectedMonth) - 1;
        startDate = new Date(yearNum, monthIdx, 1).toISOString();
        endDate = new Date(yearNum, monthIdx + 1, 0, 23, 59, 59, 999).toISOString();
      }

      const res = await fetch(
        `${API_URL}/reports?companyId=${selectedCompanyId}&startDate=${startDate}&endDate=${endDate}`,
        { headers }
      );
      if (!res.ok) throw new Error('Failed to fetch analytical reports.');
      setData(await res.json());

      if (companies.length === 0) {
        const compRes = await fetch(`${API_URL}/companies`, { headers });
        if (compRes.ok) {
          const compData = await compRes.json();
          const uniqueComps = [];
          const map = new Map();
          for (const item of compData) {
            if (!map.has(item.name)) {
              map.set(item.name, true);
              uniqueComps.push(item);
            }
          }
          setCompanies(uniqueComps);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onExportExcel = () =>
    handleExportExcel(data, MONTHS, selectedMonth, selectedYear, companies, selectedCompanyId);

  return {
    data,
    companies,
    selectedCompanyId, setSelectedCompanyId,
    loading,
    error,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    onExportExcel,
  };
}
