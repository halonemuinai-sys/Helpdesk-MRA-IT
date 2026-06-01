import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout Components
import Sidebar from './components/Sidebar';
import ReactLoader from './components/ReactLoader';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InputTicket from './pages/InputTicket';
import TicketsSummary from './pages/TicketsSummary';
import Reports from './pages/Reports';
import AgentPerformance from './pages/AgentPerformance';
import Users from './pages/Users';
import ResetPassword from './pages/ResetPassword';
import Guideline from './pages/Guideline';
import Categories from './pages/Categories';
import WifiAps from './pages/WifiAps';
import Subscriptions from './pages/Subscriptions';
import Assets from './pages/Assets';
import RentalAnalysis from './pages/RentalAnalysis';
import Approvals from './pages/Approvals';
import AuditTrail from './pages/AuditTrail';

function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'AUDITOR' ? '/approvals' : '/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check auth and theme on load
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedTheme = localStorage.getItem('theme');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (jwtToken, loggedInUser) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setToken(jwtToken);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (loading) {
    return (
      <ReactLoader size="lg" text="MRA IT Helpdesk" fullscreen={true} />
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 flex transition-colors duration-200">
        {/* Render Sidebar if user is logged in */}
        {user && (
          <Sidebar
            user={user}
            onLogout={handleLogout}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
        )}

        {/* Content Area */}
        <main className={`flex-1 ${user ? 'p-8 overflow-y-auto max-h-screen' : ''}`}>
          <Routes>
            {/* Authenticated Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute user={user} allowedRoles={['AGENT', 'ADMIN']}>
                  <Dashboard user={user} token={token} darkMode={darkMode} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/input-ticket"
              element={
                <ProtectedRoute user={user} allowedRoles={['AGENT', 'ADMIN']}>
                  <InputTicket user={user} token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets"
              element={
                <ProtectedRoute user={user} allowedRoles={['AGENT', 'ADMIN']}>
                  <TicketsSummary user={user} token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                  <Reports user={user} token={token} darkMode={darkMode} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/performance"
              element={
                <ProtectedRoute user={user} allowedRoles={['AGENT', 'ADMIN']}>
                  <AgentPerformance user={user} token={token} darkMode={darkMode} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute user={user} allowedRoles={['ADMIN', 'AGENT']}>
                  <Users user={user} token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute user={user} allowedRoles={['AGENT', 'ADMIN']}>
                  <Categories user={user} token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wifi-aps"
              element={
                <ProtectedRoute user={user} allowedRoles={['AGENT', 'ADMIN']}>
                  <WifiAps user={user} token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions"
              element={
                <ProtectedRoute user={user} allowedRoles={['AGENT', 'ADMIN']}>
                  <Subscriptions user={user} token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets"
              element={
                <ProtectedRoute user={user} allowedRoles={['AGENT', 'ADMIN']}>
                  <Assets user={user} token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rental-analysis"
              element={
                <ProtectedRoute user={user} allowedRoles={['AGENT', 'ADMIN']}>
                  <RentalAnalysis user={user} token={token} darkMode={darkMode} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals"
              element={
                <ProtectedRoute user={user} allowedRoles={['AGENT', 'ADMIN', 'AUDITOR']}>
                  <Approvals user={user} token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-trail"
              element={
                <ProtectedRoute user={user} allowedRoles={['AGENT', 'ADMIN', 'AUDITOR']}>
                  <AuditTrail user={user} token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/guideline"
              element={
                <ProtectedRoute user={user} allowedRoles={['AGENT', 'ADMIN']}>
                  <Guideline user={user} token={token} />
                </ProtectedRoute>
              }
            />

            {/* Unauthenticated Route */}
            <Route
              path="/login"
              element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.role === 'AUDITOR' ? '/approvals' : '/dashboard'} replace />}
            />
            <Route
              path="/reset-password"
              element={!user ? <ResetPassword /> : <Navigate to={user.role === 'AUDITOR' ? '/approvals' : '/dashboard'} replace />}
            />

            {/* Catch All Redirect */}
            <Route
              path="*"
              element={<Navigate to={user ? (user.role === 'AUDITOR' ? '/approvals' : '/dashboard') : '/login'} replace />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
