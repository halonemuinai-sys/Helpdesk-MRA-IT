import { useState, useEffect } from 'react';
import { MONTHS } from '../components/dashboard/constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function useDashboard({ user, token }) {
  const [analytics, setAnalytics] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [recentUrgentTickets, setRecentUrgentTickets] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState({ total: 0, expiredCount: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [agentPerformance, setAgentPerformance] = useState(null);
  const [myActiveTicketsCount, setMyActiveTicketsCount] = useState(0);
  const [myOverdueTicketsCount, setMyOverdueTicketsCount] = useState(0);
  const [showPerformanceReminder, setShowPerformanceReminder] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [timeframedLeaderboard, setTimeframedLeaderboard] = useState([]);
  const [perfLoading, setPerfLoading] = useState(false);

  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchPerformanceData = async () => {
    try {
      setPerfLoading(true);
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
      const res = await fetch(`${API_URL}/performance?startDate=${startDate}&endDate=${endDate}`, { headers });
      if (res.ok) setTimeframedLeaderboard(await res.json());
    } catch (err) {
      console.error('Failed to load performance metrics:', err);
    } finally {
      setPerfLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      const reportRes = await fetch(`${API_URL}/reports?companyId=${selectedCompanyId}`, { headers });
      if (!reportRes.ok) throw new Error('Failed to load analytical reports.');
      setAnalytics(await reportRes.json());

      if (companies.length === 0 && user.role !== 'USER') {
        const compRes = await fetch(`${API_URL}/companies`, { headers });
        if (compRes.ok) {
          const compData = await compRes.json();
          const uniqueComps = [];
          const map = new Map();
          for (const item of compData) {
            if (!map.has(item.name)) { map.set(item.name, true); uniqueComps.push(item); }
          }
          setCompanies(uniqueComps);
        }
      }

      const ticketRes = await fetch(`${API_URL}/tickets`, { headers });
      if (ticketRes.ok) {
        const ticketData = await ticketRes.json();
        setRecentUrgentTickets(
          ticketData
            .filter(t => ['CRITICAL', 'HIGH'].includes(t.priority) && ['OPEN', 'IN_PROGRESS'].includes(t.status))
            .slice(0, 4)
        );
      }

      if (user.role !== 'USER') {
        try {
          const expiryRes = await fetch(`${API_URL}/reports/expiring-soon`, { headers });
          if (expiryRes.ok) setExpiringSoon(await expiryRes.json());
        } catch (e) { console.error('Failed to fetch expiring-soon report:', e); }

        try {
          const perfRes = await fetch(`${API_URL}/performance`, { headers });
          if (perfRes.ok) {
            const perfData = await perfRes.json();
            const myPerf = perfData.find(ag => ag.id === user.id);
            if (myPerf) setAgentPerformance(myPerf);
          }
        } catch (e) { console.error('Failed to fetch performance leaderboard:', e); }

        try {
          const myTicketsRes = await fetch(`${API_URL}/tickets`, { headers });
          if (myTicketsRes.ok) {
            const tickets = await myTicketsRes.json();
            const nowMs = new Date().getTime();
            const myActive = tickets.filter(t => t.assignedToId === user.id && ['OPEN', 'IN_PROGRESS', 'PENDING'].includes(t.status));
            setMyActiveTicketsCount(myActive.length);
            setMyOverdueTicketsCount(myActive.filter(t => nowMs > new Date(t.slaResolutionLimit).getTime()).length);
          }
        } catch (e) { console.error('Failed to fetch agent tickets for reminder:', e); }

        if (!sessionStorage.getItem('perf_reminder_shown')) {
          setShowPerformanceReminder(true);
          sessionStorage.setItem('perf_reminder_shown', 'true');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPerformanceData(); }, [selectedMonth, selectedYear]);
  useEffect(() => { fetchInitialData(); }, [selectedCompanyId]);

  return {
    analytics, companies, loading, error,
    selectedCompanyId, setSelectedCompanyId,
    recentUrgentTickets,
    expiringSoon,
    agentPerformance,
    myActiveTicketsCount, myOverdueTicketsCount,
    showPerformanceReminder, setShowPerformanceReminder,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    timeframedLeaderboard, perfLoading,
  };
}
