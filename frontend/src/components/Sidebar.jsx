import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus2,
  Ticket,
  BarChart3,
  Award,
  Users,
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function Sidebar({ user, onLogout, darkMode, toggleDarkMode }) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  // Navigation schema based on Roles
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['USER', 'AGENT', 'ADMIN']
    },
    {
      label: 'Input Ticket',
      path: '/input-ticket',
      icon: FilePlus2,
      roles: ['USER', 'ADMIN'] // Users can request, Admins can do anything. Agents usually process, but can also request if needed. Let's allow ADMIN/USER.
    },
    {
      label: 'Tickets List',
      path: '/tickets',
      icon: Ticket,
      roles: ['USER', 'AGENT', 'ADMIN']
    },
    {
      label: 'Laporan Analisis',
      path: '/reports',
      icon: BarChart3,
      roles: ['ADMIN'] // Admin only
    },
    {
      label: 'Performa Agent (KPI)',
      path: '/performance',
      icon: Award,
      roles: ['AGENT', 'ADMIN'] // Agents and Admins
    },
    {
      label: 'Manajemen User',
      path: '/users',
      icon: Users,
      roles: ['ADMIN'] // Admin only
    }
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <aside className="w-64 min-h-screen glass-panel flex flex-col justify-between border-r border-gray-200 dark:border-slate-800 transition-colors duration-200">
      <div className="flex flex-col">
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200/50 dark:border-slate-800/50 gap-2">
          <Building2 className="w-6 h-6 text-brand-500" />
          <span className="font-extrabold text-lg bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
            MRA Helpdesk
          </span>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 my-4 bg-white/50 dark:bg-slate-900/40 rounded-2xl border border-gray-200/50 dark:border-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center font-bold text-brand-700 dark:text-brand-300">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm text-gray-800 dark:text-slate-200 truncate">
                {user.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                {user.department}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2.5 py-1 rounded-lg w-fit">
            <ShieldCheck className="w-3.5 h-3.5" />
            {user.role}
          </div>
          <div className="mt-2 text-[10px] text-gray-400 dark:text-slate-500 font-medium truncate">
            {user.companyName || (user.company && user.company.name)}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-4 space-y-1">
          {filteredNavItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100/50 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls */}
      <div className="p-4 border-t border-gray-200/50 dark:border-slate-800/50 space-y-2">
        {/* Theme Switcher Button */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100/50 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-slate-200 transition-colors"
        >
          {darkMode ? (
            <>
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 text-brand-600" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
