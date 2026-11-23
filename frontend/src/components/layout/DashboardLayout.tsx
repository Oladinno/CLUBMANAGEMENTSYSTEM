import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import {
  GraduationCap,
  LayoutDashboard,
  Compass,
  Calendar,
  Award,
  Bell,
  LogOut,
  Users,
  FileCheck,
  QrCode,
  Layers,
  ArrowRightLeft,
  PlusCircle,
  BookOpen,
  ClipboardList,
} from 'lucide-react';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getNavLinks = () => {
    if (!user) return [];

    if (user.role === 'admin') {
      return [
        { label: 'Overview', path: '/admin/overview', icon: LayoutDashboard },
        { label: 'Club Management', path: '/admin/clubs', icon: Compass },
        { label: 'Registration Requests', path: '/admin/registrations', icon: FileCheck },
        { label: 'Students Directory', path: '/admin/students', icon: Users },
        { label: 'Leadership Handovers', path: '/admin/leadership', icon: ArrowRightLeft },
        { label: 'Event Monitoring', path: '/admin/events', icon: Calendar },
        { label: 'Academic Sessions', path: '/admin/academic-sessions', icon: BookOpen },
        { label: 'Analytics & Reports', path: '/admin/reports', icon: Layers },
      ];
    }

    if (user.role === 'club_executive') {
      return [
        { label: 'Executive Overview', path: '/executive/overview', icon: LayoutDashboard },
        { label: 'Club Profile & Info', path: '/executive/profile', icon: Compass },
        { label: 'Membership Requests', path: '/executive/membership-requests', icon: Users },
        { label: 'Manage Events', path: '/executive/events', icon: Calendar },
        { label: 'QR Attendance Live', path: '/executive/attendance', icon: QrCode },
        { label: 'Leadership Handover', path: '/executive/handover', icon: ArrowRightLeft },
      ];
    }

    // Default: Student
    return [
      { label: 'Student Overview', path: '/student/overview', icon: LayoutDashboard },
      { label: 'Explore Clubs', path: '/clubs', icon: Compass },
      { label: 'My Enrolled Clubs', path: '/student/my-clubs', icon: Users },
      { label: 'Campus Events', path: '/events', icon: Calendar },
      { label: 'Attendance History', path: '/student/attendance', icon: Award },
      { label: 'Co-Curricular Transcript', path: '/student/transcript', icon: GraduationCap },
      { label: 'Register a Club', path: '/student/register-club', icon: PlusCircle },
      { label: 'Notifications', path: '/student/notifications', icon: Bell },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#002147] text-white flex flex-col justify-between shrink-0 shadow-xl">
        <div>
          {/* Brand */}
          <div className="p-6 border-b border-blue-900/60 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
              AUN
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-none text-white">Student Life</h1>
              <p className="text-xs text-blue-300 mt-1 uppercase font-semibold tracking-wider">AUN Clubs Portal</p>
            </div>
          </div>

          {/* User badge */}
          <div className="px-6 py-4 bg-[#082a54] flex items-center space-x-3 border-b border-blue-900/40">
            <div className="w-9 h-9 rounded-full bg-blue-500/30 border border-blue-400/40 flex items-center justify-center font-semibold text-blue-200">
              {user?.first_name[0]}{user?.last_name[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.first_name} {user?.last_name}</p>
              <span className="inline-block text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-blue-600/50 text-blue-200 mt-0.5">
                {user?.role.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer logout */}
        <div className="p-4 border-t border-blue-900/40">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">American University of Nigeria</span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-medium text-slate-700 capitalize">{user?.role.replace('_', ' ')} Portal</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/student/notifications"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full transition relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
            </Link>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">{user?.first_name} {user?.last_name}</p>
              <p className="text-[11px] text-slate-500">{user?.email}</p>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="p-6 sm:p-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
