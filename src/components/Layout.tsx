import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { LayoutDashboard, History, PlusCircle, BookOpen, BarChart2, Calendar, Target, Settings, LogOut, Activity, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/add-trade', icon: PlusCircle, label: 'Add Trade' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/journal', icon: BookOpen, label: 'Journal' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/goals', icon: Target, label: 'Goals' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-[#070B14] text-[#F8FAFC] font-sans selection:bg-[#00BFFF]/30">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0F172A] border-b border-white/5 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#00BFFF] to-[#8B5CF6] rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Trade Verse" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            <Activity className="text-white w-5 h-5 hidden" />
          </div>
          <span className="font-bold tracking-tight">Trade Verse</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-[#94A3B8] hover:text-white">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar / Mobile Menu */}
      <aside className={clsx(
        "fixed md:static inset-0 z-40 w-64 border-r border-white/5 bg-[#0F172A] flex flex-col transition-transform duration-300 md:translate-x-0 overflow-hidden",
        mobileMenuOpen ? "translate-x-0 pt-16 md:pt-0" : "-translate-x-full"
      )}>
        <div className="absolute top-0 left-0 w-full h-32 bg-[#00BFFF]/5 blur-3xl"></div>
        
        <div className="p-6 items-center gap-3 relative z-10 hidden md:flex">
          <div className="w-10 h-10 bg-gradient-to-br from-[#00BFFF] to-[#8B5CF6] rounded-xl flex items-center justify-center shadow-lg shadow-[#00BFFF]/20 overflow-hidden">
            <img src="/logo.png" alt="Trade Verse" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            <Activity className="text-white w-6 h-6 hidden" />
          </div>
          <span className="text-xl font-bold tracking-tight">Trade Verse</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto relative z-10">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium group",
                  isActive 
                    ? "bg-white/5 text-[#00BFFF] border border-white/10 shadow-[0_0_15px_rgba(0,191,255,0.1)]" 
                    : "text-[#94A3B8] hover:bg-white/5 hover:text-[#F8FAFC]"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 relative z-10">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#111827] rounded-xl border border-white/5 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#00BFFF] flex items-center justify-center text-sm font-bold overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
              ) : (
                user?.email?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.displayName || 'Trader'}</div>
              <div className="text-xs text-[#94A3B8] truncate">{user?.email}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative md:pt-0 pt-16">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex-1 overflow-y-auto p-8 relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
