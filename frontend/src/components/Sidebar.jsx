import React, { useState } from 'react';
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
  Building2,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  FolderTree
} from 'lucide-react';

export default function Sidebar({ user, onLogout, darkMode, toggleDarkMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  // Navigation schema based on Roles (Only AGENT and ADMIN log in)
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['AGENT', 'ADMIN']
    },
    {
      label: 'Input Ticket',
      path: '/input-ticket',
      icon: FilePlus2,
      roles: ['AGENT', 'ADMIN'] // Agents and Admins can input tickets on behalf of employees
    },
    {
      label: 'Tickets List',
      path: '/tickets',
      icon: Ticket,
      roles: ['AGENT', 'ADMIN']
    },
    {
      label: 'Analysis Reports',
      path: '/reports',
      icon: BarChart3,
      roles: ['ADMIN'] // Admin only
    },
    {
      label: 'Agent Performance (KPI)',
      path: '/performance',
      icon: Award,
      roles: ['AGENT', 'ADMIN'] // Agents and Admins
    },
    {
      label: 'User Management',
      path: '/users',
      icon: Users,
      roles: ['ADMIN'] // Admin only
    },
    {
      label: 'Category Settings',
      path: '/categories',
      icon: FolderTree,
      roles: ['AGENT', 'ADMIN']
    },
    {
      label: 'Guideline',
      path: '/guideline',
      icon: HelpCircle,
      roles: ['AGENT', 'ADMIN']
    }
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <aside 
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } min-h-screen glass-panel flex flex-col justify-between border-r border-slate-200/65 dark:border-slate-800/70 transition-all duration-300 ease-in-out relative`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-md border border-white/20 z-30 transition-transform duration-300 active:scale-90"
        aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <div className="flex flex-col">
        {/* Brand Logo Header */}
        <div className={`h-16 flex items-center border-b border-gray-200/50 dark:border-slate-800/50 gap-2 relative ${
          isCollapsed ? 'justify-center px-2' : 'px-6'
        }`}>
          <Building2 className="w-6 h-6 text-brand-500 shrink-0" />
          {!isCollapsed && (
            <span className="font-extrabold text-lg bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent truncate animate-fade-in">
              MRA Helpdesk
            </span>
          )}
        </div>

        {/* User Card */}
        {!isCollapsed ? (
          <div className="p-4 mx-4 my-4 bg-white/50 dark:bg-slate-900/40 rounded-2xl border border-gray-200/50 dark:border-slate-800/30 transition-all duration-300">
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
        ) : (
          <div className="p-2 mx-auto my-4 bg-white/50 dark:bg-slate-900/40 rounded-full border border-gray-200/50 dark:border-slate-800/30 w-12 h-12 flex items-center justify-center transition-all duration-300 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center font-bold text-brand-700 dark:text-brand-300">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className={`px-4 space-y-2 ${isCollapsed ? 'flex flex-col items-center px-2' : ''}`}>
          {filteredNavItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center text-sm font-medium transition-all duration-200 relative group ${
                  isCollapsed ? 'justify-center p-3 w-12 h-12 rounded-xl animate-fade-in' : 'gap-3 px-4 py-3 w-full'
                } ${
                  isActive
                    ? isCollapsed
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 rounded-xl scale-105 shadow-sm'
                      : 'bg-brand-50/90 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400 border-l-4 border-brand-500 rounded-r-xl rounded-l-none scale-[1.01]'
                    : isCollapsed
                    ? 'text-gray-600 dark:text-slate-400 hover:bg-gray-100/60 dark:hover:bg-slate-800/45 hover:text-gray-900 dark:hover:text-slate-200 rounded-xl hover:scale-110'
                    : 'text-gray-650 dark:text-slate-400 hover:bg-gray-100/50 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-slate-200 border-l-4 border-transparent hover:translate-x-1'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'scale-105' : ''}`} />
                {!isCollapsed && <span>{item.label}</span>}
                
                {/* Tooltip on Collapsed Hover */}
                {isCollapsed && (
                  <span className="absolute left-16 bg-slate-950 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-md whitespace-nowrap z-50">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls */}
      <div className={`p-4 border-t border-gray-200/50 dark:border-slate-800/50 space-y-2 ${isCollapsed ? 'flex flex-col items-center px-2' : ''}`}>
        {/* Theme Switcher Button */}
        <button
          onClick={toggleDarkMode}
          className={`flex items-center rounded-xl text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100/50 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-slate-200 transition-all duration-200 group relative ${
            isCollapsed ? 'justify-center p-3 w-12 h-12 hover:scale-110 animate-fade-in' : 'w-full gap-3 px-4 py-2.5'
          }`}
        >
          {darkMode ? (
            <>
              <Sun className="w-5 h-5 text-amber-500 transition-transform duration-300 group-hover:rotate-45" />
              {!isCollapsed && <span>Light Mode</span>}
              {isCollapsed && (
                <span className="absolute left-16 bg-slate-950 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-md whitespace-nowrap z-50">
                  Light Mode
                </span>
              )}
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 text-brand-600 transition-transform duration-300 group-hover:-rotate-12" />
              {!isCollapsed && <span>Dark Mode</span>}
              {isCollapsed && (
                <span className="absolute left-16 bg-slate-950 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-md whitespace-nowrap z-50">
                  Dark Mode
                </span>
              )}
            </>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogoutClick}
          className={`flex items-center rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 group relative ${
            isCollapsed ? 'justify-center p-3 w-12 h-12 hover:scale-110 animate-fade-in' : 'w-full gap-3 px-4 py-2.5'
          }`}
        >
          <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          {!isCollapsed && <span>Logout</span>}
          {isCollapsed && (
            <span className="absolute left-16 bg-slate-950 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-md whitespace-nowrap z-50">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
