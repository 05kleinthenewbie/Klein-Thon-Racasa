import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ClipboardList, 
  Package, 
  Calendar, 
  ShieldAlert, 
  Wrench, 
  Clock, 
  CheckCircle,
  TrendingUp,
  Server,
  Bell,
  Activity,
  PlusCircle,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface StatsMap {
  totalRequests: number;
  pendingRequests: number;
  activeJobOrders: number;
  completedRequests: number;
  defectiveAssets: number;
  totalBookings: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsMap>({
    totalRequests: 0,
    pendingRequests: 0,
    activeJobOrders: 0,
    completedRequests: 0,
    defectiveAssets: 0,
    totalBookings: 0
  });

  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({
    'Network Services': 0,
    'Hardware Services': 0,
    'Software Services': 0,
    'Information System Services': 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Load requests
        const reqResponse = await api.get('/requests');
        const reqs = reqResponse.data;

        // Load inventory 
        const invResponse = await api.get('/inventory');
        const inv = invResponse.data;

        // Load Bookings
        const bookResponse = await api.get('/bookings');
        const bookings = bookResponse.data;

        // Load Job Orders
        const jobsResponse = await api.get('/job-orders');
        const jobs = jobsResponse.data;

        // Aggregate statistics
        const totalReq = reqs.length;
        const pendingReq = reqs.filter((r: any) => r.status === 'pending').length;
        const activeJobs = jobs.filter((j: any) => j.status === 'in_progress').length;
        const completedReq = reqs.filter((r: any) => r.status === 'resolved' || r.status === 'approved').length;
        const defective = inv.filter((i: any) => i.status === 'defective' || i.status === 'under_repair').length;
        const totalBooks = bookings.length;

        setStats({
          totalRequests: totalReq,
          pendingRequests: pendingReq,
          activeJobOrders: activeJobs,
          completedRequests: completedReq,
          defectiveAssets: defective,
          totalBookings: totalBooks
        });

        // Get recent requests (slice first 4)
        setRecentRequests(reqs.slice(0, 4));

        // Group category loads
        const catMap: any = {
          'Network Services': 0,
          'Hardware Services': 0,
          'Software Services': 0,
          'Information System Services': 0
        };
        reqs.forEach((r: any) => {
          if (catMap[r.category] !== undefined) {
            catMap[r.category]++;
          }
        });
        setCategoryCounts(catMap);

      } catch (err) {
        console.error('Failed to aggregate dashboard records');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handcrafted Beautiful SVG Chart Math
  const maxCategoryCount = Math.max(...Object.values(categoryCounts), 1);
  const chartCategories = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    count: categoryCounts[cat],
    percentage: (categoryCounts[cat] / maxCategoryCount) * 100
  }));

  const widgets = [
    { label: 'Pending Requests', value: stats.pendingRequests, icon: Clock, color: 'bg-orange-50 border-orange-200 text-orange-600', link: '/requests?tab=pending' },
    { label: 'Ongoing Job Orders', value: stats.activeJobOrders, icon: Wrench, color: 'bg-blue-50 border-blue-200 text-blue-600', link: '/job-orders' },
    { label: 'Completed Requests', value: stats.completedRequests, icon: CheckCircle, color: 'bg-green-50 border-green-200 text-green-600', link: '/requests' },
    { label: 'Defective Equipment', value: stats.defectiveAssets, icon: ShieldAlert, color: 'bg-red-50 border-red-200 text-red-600', link: '/defective' },
  ];

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 font-semibold flex flex-col items-center gap-3">
        <Clock className="w-8 h-8 text-blue-600 animate-spin" />
        <span>Aggregating Balubal ICT live registers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner with University Branding */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 tracking-wider uppercase rounded-md border border-blue-200">
              USTP Balubal ICT Campus Portal
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Hi, {user?.first_name} {user?.last_name}!
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Configure, track, and submit academic ICT facilities bookings and task resolutions securely.
          </p>
        </div>

        {user?.role === 'admin' ? (
          <div className="flex gap-4">
            <Link 
              to="/inventory" 
              className="h-11 px-5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs"
            >
              <Package className="w-4 h-4" />
              Manage Inventory
            </Link>
          </div>
        ) : (
          <Link 
            to="/submit-request" 
            className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            Submit Job Request
          </Link>
        )}
      </motion.div>

      {/* Stats Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.map((wd, i) => (
          <Link key={wd.label} to={wd.link}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between shadow-xs cursor-pointer group hover:shadow-md`}
            >
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{wd.label}</p>
                <p className="text-3xl font-black text-slate-800 mt-1">{wd.value}</p>
              </div>
              <div className={`p-3 rounded-xl border ${wd.color} group-hover:scale-110 transition-transform`}>
                <wd.icon className="w-5 h-5" />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Service Requests panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Recent Service Tickets
            </h2>
            <Link to="/requests" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {recentRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No tickets recently created.
              </div>
            ) : (
              recentRequests.map((req, i) => {
                const isPending = req.status === 'pending';
                const isResolved = req.status === 'resolved' || req.status === 'approved';
                return (
                  <div 
                    key={req.id || i} 
                    className={`p-4 flex items-center justify-between hover:bg-slate-50/50 transition-all ${
                      i !== recentRequests.length - 1 ? 'border-b border-slate-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 bg-slate-105 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                        <ClipboardList className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-xs md:text-sm truncate">{req.service_type}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate uppercase font-mono font-medium">
                          #{req.tracking_number} &bull; {req.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg uppercase whitespace-nowrap ${
                        isResolved ? 'bg-green-50 text-green-700 border border-green-200' :
                        isPending ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Visual Category Demands hand-crafted SVG Bars */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
              Service Requests by Category Area
            </h3>

            <div className="space-y-4">
              {chartCategories.map((cat, i) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{cat.name}</span>
                    <span className="font-bold text-slate-400 uppercase font-mono">{cat.count} ticket{cat.count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-2.5 bg-slate-50 border border-slate-150 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percentage}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className={`h-full rounded-full ${
                        i === 0 ? 'bg-blue-600' :
                        i === 1 ? 'bg-amber-55 bg-amber-500' :
                        i === 2 ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                    ></motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Status sidebar */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            ICT Infrastructure Desk
          </h2>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-755 text-slate-700">ComLab 1 Connectivity</span>
              <span className="px-2 py-0.5 text-[10px] font-bold text-green-700 bg-green-50 rounded uppercase border border-green-200">Online</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-755 text-slate-700">ComLab 2 Router Load</span>
              <span className="px-2 py-0.5 text-[10px] font-bold text-green-700 bg-green-50 rounded uppercase border border-green-200">Stable</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-705 text-slate-700">Active Campus Bookings</span>
              <span className="font-bold text-blue-600 font-mono text-[13px]">{stats.totalBookings} Active</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-705 text-slate-700">Main Server Load</span>
              <span className="font-bold text-slate-500 font-mono">14% Load</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
              <span>Last Polled: Just now</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                Active Gateway
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-2xl p-6 text-white text-center space-y-2 relative overflow-hidden shadow-md">
            <div className="absolute -right-6 -bottom-6 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
            <p className="text-blue-105 text-xs text-blue-100 font-semibold uppercase tracking-wider">Operational SLA Info</p>
            <h3 className="text-base font-bold text-white tracking-wide">Campus ICT Support System</h3>
            <p className="text-xs text-blue-100 mt-2 leading-relaxed">
              USTP Balubal integrates computer networks and software resources to preserve academic service performance.
            </p>
            <div className="pt-3">
              <Link 
                to={user?.role === 'admin' ? '/requests' : '/submit-request'} 
                className="inline-flex h-9 bg-white text-blue-600 px-5 items-center rounded-xl font-bold text-xs shadow-lg shadow-black/5 hover:bg-blue-50 transition-colors"
              >
                Go to Ticket Hub
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
