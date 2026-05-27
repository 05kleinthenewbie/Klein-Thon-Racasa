import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Wrench, 
  Calendar, 
  User, 
  CheckCircle, 
  Play, 
  Clock, 
  Edit3, 
  RefreshCw, 
  Search,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import api from '../services/api';

interface JobOrder {
  id: number;
  service_request_id: number;
  assigned_admin_id: number | null;
  task_details: string;
  status: 'open' | 'in_progress' | 'completed';
  resolution_remarks: string | null;
  completion_date: string | null;
  created_at: string;
  updated_at: string;
  category: string;
  service_type: string;
  description: string;
  tracking_number: string;
  technician_name: string | null;
  requester_first_name: string;
  requester_last_name: string;
  user_id: number;
}

export default function JobOrders() {
  const { user } = useAuth();
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Edit modal states
  const [editingJob, setEditingJob] = useState<JobOrder | null>(null);
  const [status, setStatus] = useState<'open' | 'in_progress' | 'completed'>('open');
  const [remarks, setRemarks] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchJobOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/job-orders');
      setJobOrders(response.data);
    } catch (err) {
      console.error('Failed to fetch job orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobOrders();
  }, []);

  const handleOpenEditModal = (job: JobOrder) => {
    setEditingJob(job);
    setStatus(job.status);
    setRemarks(job.resolution_remarks || '');
    setCompletionDate(job.completion_date || new Date().toISOString().split('T')[0]);
    setFeedbackMsg('');
  };

  const handleUpdateJobOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    setModalLoading(true);
    try {
      await api.patch(`/job-orders/${editingJob.id}`, {
        status,
        resolution_remarks: remarks,
        completion_date: status === 'completed' ? completionDate : null
      });

      setEditingJob(null);
      fetchJobOrders();
    } catch (err: any) {
      setFeedbackMsg(err.response?.data?.error || 'Failed to update job order');
    } finally {
      setModalLoading(false);
    }
  };

  // Filters
  const filteredJobs = jobOrders.filter(job => {
    const term = search.toLowerCase();
    const matchesSearch = 
      job.tracking_number?.toLowerCase().includes(term) ||
      job.service_type?.toLowerCase().includes(term) ||
      job.task_details?.toLowerCase().includes(term) ||
      `${job.requester_first_name} ${job.requester_last_name}`.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">ICT Job Orders</h2>
          <p className="text-sm text-slate-500">Track and manage technicians, repair resolutions, diagnostic tasks, and delivery schedules.</p>
        </div>
        <button 
          onClick={fetchJobOrders} 
          className="self-start sm:self-auto h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search tracking number, service type, or requester name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-44 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          >
            <option value="all">All Job Statuses</option>
            <option value="open">Open / Pending</option>
            <option value="in_progress">Ongoing / In Progress</option>
            <option value="completed">Completed / Solved</option>
          </select>
        </div>
      </div>

      {/* Main List Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 font-semibold flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span>Filing service log sheets...</span>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-lg">No job orders found</p>
          <p className="text-sm text-slate-400 mt-1">Try relaxing your search terms or wait for service request approvals.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden"
            >
              {/* Corner Accent for Priority / State */}
              <div className={`absolute top-0 left-0 w-full h-1.5 ${
                job.status === 'completed' ? 'bg-green-500' :
                job.status === 'in_progress' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>

              <div className="flex items-start justify-between mb-3 mt-1">
                <span className="text-xs font-bold text-slate-400 tracking-wider font-mono">{job.tracking_number}</span>
                <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-lg uppercase flex items-center gap-1 ${
                  job.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                  job.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 
                  'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {job.status === 'completed' && <Check className="w-3 h-3" />}
                  {job.status === 'in_progress' && <Clock className="w-3 h-3 animate-pulse" />}
                  {job.status === 'open' && <AlertCircle className="w-3 h-3" />}
                  {job.status === 'completed' ? 'Completed' : job.status === 'in_progress' ? 'Ongoing' : 'Pending'}
                </span>
              </div>

              <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1">{job.service_type}</h4>
              <p className="text-xs text-slate-400 mt-1">{job.category}</p>

              <div className="border-t border-b border-slate-100 py-3 my-3 text-xs text-slate-600 space-y-2 flex-1">
                <p className="line-clamp-2"><span className="font-bold text-slate-700">Task Details:</span> {job.task_details}</p>
                {job.technician_name && (
                  <p className="flex items-center gap-1.5"><span className="font-bold text-slate-700">Technician:</span> {job.technician_name}</p>
                )}
                {job.resolution_remarks && (
                  <p className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-500 italic">
                    &ldquo;{job.resolution_remarks}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-300" />
                  <span>{job.requester_first_name} {job.requester_last_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-300" />
                  <span>{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {user?.role === 'admin' && (
                <button
                  onClick={() => handleOpenEditModal(job)}
                  className="w-full mt-4 h-9 border border-blue-200 hover:bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Update Job Progress
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Status Modal */}
      {editingJob && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                Update Job #{editingJob.id}
              </h3>
              <button onClick={() => setEditingJob(null)} className="text-slate-400 hover:text-slate-600 p-1">
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateJobOrder} className="p-6 space-y-4">
              {feedbackMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {feedbackMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Assign Maintenance Stage</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('open')}
                    className={`h-10 border rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
                      status === 'open' 
                        ? 'border-red-500 bg-red-50 text-red-600' 
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('in_progress')}
                    className={`h-10 border rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
                      status === 'in_progress' 
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-600' 
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 animate-pulse" />
                    Ongoing
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('completed')}
                    className={`h-10 border rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
                      status === 'completed' 
                        ? 'border-green-500 bg-green-50 text-green-600' 
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Completed
                  </button>
                </div>
              </div>

              {status === 'completed' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Actual Date of Completion</label>
                  <input
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Resolution remarks / Diagnostics outcome</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Record what repair actions were taken, which components were swapped, etc..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="h-10 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {modalLoading ? 'Confirming...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
