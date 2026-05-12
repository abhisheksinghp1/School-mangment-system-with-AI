import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import {
  Home, Users, BookOpen, Calendar, MessageSquare,
  LogOut, User, Bell, BarChart3, Award, DollarSign,
  Menu, X, ChevronRight
} from 'lucide-react';

// Role-specific nav items
const NAV_ITEMS = {
  STUDENT: [
    { name: 'Dashboard',    href: '/student-dashboard',  icon: Home },
    { name: 'Attendance',   href: '/attendance',          icon: Calendar },
    { name: 'Homework',     href: '/homework',            icon: BookOpen },
    { name: 'Marks',        href: '/marks',               icon: Award },
    { name: 'AI Assistant', href: '/ai-chat',             icon: MessageSquare },
  ],
  TEACHER: [
    { name: 'Dashboard',      href: '/teacher-dashboard', icon: Home },
    { name: 'Attendance',     href: '/attendance',         icon: Calendar },
    { name: 'Homework',       href: '/homework',           icon: BookOpen },
    { name: 'Marks',          href: '/marks',              icon: Award },
    { name: 'AI Assistant',   href: '/ai-chat',            icon: MessageSquare },
  ],
  PARENT: [
    { name: 'Dashboard',    href: '/parent-dashboard',   icon: Home },
    { name: 'Attendance',   href: '/attendance',          icon: Calendar },
    { name: 'Homework',     href: '/homework',            icon: BookOpen },
    { name: 'Marks',        href: '/marks',               icon: Award },
    { name: 'AI Assistant', href: '/ai-chat',             icon: MessageSquare },
  ],
  MANAGEMENT: [
    { name: 'Dashboard',  href: '/management-dashboard', icon: Home },
    { name: 'Students',   href: '/students',              icon: Users },
    { name: 'Teachers',   href: '/teachers',              icon: Users },
    { name: 'Attendance', href: '/attendance',            icon: Calendar },
    { name: 'Analytics',  href: '/analytics',             icon: BarChart3 },
    { name: 'Salary',     href: '/salary',                icon: DollarSign },
    { name: 'AI Assistant', href: '/ai-chat',             icon: MessageSquare },
  ],
};

const ROLE_COLORS = {
  STUDENT:    'from-blue-600 to-indigo-700',
  TEACHER:    'from-green-600 to-teal-700',
  PARENT:     'from-purple-600 to-pink-700',
  MANAGEMENT: 'from-indigo-600 to-purple-700',
};

const Layout = ({ children }) => {
  const { user, role, logout } = useAuth();
  const navigate               = useNavigate();
  const location               = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = NAV_ITEMS[role] || [];
  const gradient = ROLE_COLORS[role] || 'from-blue-600 to-indigo-700';

  // Fetch unread notification count
  useEffect(() => {
    notificationsAPI.getUnreadCount()
      .then(res => setUnreadCount(res.data.count || 0))
      .catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`bg-gradient-to-r ${gradient} px-4 py-5`}>
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SE</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">School ERP</h1>
            <p className="text-white/70 text-xs capitalize">{role?.toLowerCase()} portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon    = item.icon;
          const active  = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`mr-3 h-4 w-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              {item.name}
              {active && <ChevronRight className="ml-auto h-3 w-3 text-blue-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className={`w-8 h-8 bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center`}>
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
            <p className="text-xs text-gray-500 capitalize">{role?.toLowerCase()}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:flex-col md:w-60 bg-white border-r border-gray-200 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-60 bg-white border-r border-gray-200 transform transition-transform duration-200 md:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(v => !v)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h2 className="text-base font-semibold text-gray-800">
              {navItems.find(i => i.href === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {/* Notifications bell */}
            <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* AI Chat shortcut */}
            <Link to="/ai-chat" className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="AI Assistant">
              <MessageSquare className="h-5 w-5" />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
