import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Calendar, 
  ClipboardList, 
  AlertTriangle, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  Wrench,
  ShieldAlert,
  History,
  Users,
  User,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';

// Admin Menu
const adminSidebarItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Service Requests', icon: ClipboardList, path: '/requests' },
  { name: 'Job Orders', icon: Wrench, path: '/job-orders' },
  { name: 'Inventory', icon: Package, path: '/inventory' },
  { name: 'Defective Equipment', icon: ShieldAlert, path: '/defective' },
  { name: 'Incident Reports', icon: AlertTriangle, path: '/incidents' },
  { name: 'Facility Booking', icon: Calendar, path: '/bookings' },
  { name: 'Notifications', icon: Bell, path: '/notifications' },
  { name: 'Audit Logs', icon: History, path: '/audit-logs' },
  { name: 'User Management', icon: Users, path: '/users' },
];

// Faculty/Staff Menu
const facultySidebarItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Submit Request', icon: PlusCircle, path: '/submit-request' },
  { name: 'My Requests', icon: ClipboardList, path: '/requests' },
  { name: 'Facility Booking', icon: Calendar, path: '/bookings' },
  { name: 'Notifications', icon: Bell, path: '/notifications' },
  { name: 'Profile', icon: User, path: '/profile' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const menuItems = user?.role === 'admin' ? adminSidebarItems : facultySidebarItems;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        const unread = response.data.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Failed to load notifications count');
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="w-72 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-50 lg:relative h-screen"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white rounded-tr-3xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white text-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-md">
                  U
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-base tracking-tight leading-none">USTP Balubal</span>
                  <span className="text-xs text-blue-100 mt-1">ICT Portal</span>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-blue-700 rounded-md">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm border-l-4 border-blue-600 pl-3' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    {item.name === 'Notifications' && unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                    {isActive && item.name !== 'Notifications' && (
                      <motion.div layoutId="activeInd" className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3 p-2 mb-2">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center border border-blue-200 uppercase font-bold">
                  {user?.first_name ? user.first_name[0] : 'U'}{user?.last_name ? user.last_name[0] : ''}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-slate-500 truncate capitalize font-medium">{user?.role === 'admin' ? 'Campus Admin' : 'Faculty / Staff'}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full h-10 flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all font-semibold text-xs border border-transparent hover:border-red-155"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm md:text-base font-semibold text-slate-800 hidden sm:block">
              Web-Based ICT Management and Information System
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/notifications" className="relative p-2 hover:bg-slate-50 rounded-full text-slate-500 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center border border-white">
                  {unreadCount}
                </span>
              )}
            </Link>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-slate-800">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-slate-400 font-medium capitalize">{user?.role === 'admin' ? 'Administrator' : 'Faculty / Staff'}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50">
          <div className="max-w-6xl mx-auto pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
