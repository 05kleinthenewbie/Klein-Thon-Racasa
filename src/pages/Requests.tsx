import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  User, 
  FileCheck,
  Wrench,
  Download,
  Check,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface ServiceRequest {
  id: number;
  tracking_number: string;
  category: string;
  service_type: string;
  description: string;
  status: 'pending' | 'approved' | 'in_progress' | 'resolved' | 'rejected';
  file_attachment: string | null;
  technician_name: string | null;
  created_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  school_id?: string;
}

export default function Requests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState(initialTab);
  
  // Assign Technician state
  const [assigningReq, setAssigningReq] = useState<ServiceRequest | null>(null);
  const [technicianName, setTechnicianName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/requests');
      setRequests(response.data);
    } catch (err) {
      console.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatusDirect = async (id: number, status: string) => {
    if (!window.confirm(`Are you sure you want to change this request status to ${status}?`)) return;
    try {
      await api.patch(`/requests/${id}/status`, { status });
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleApproveWithTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningReq) return;
    if (!technicianName.trim()) {
      alert('Please specify a technician name or engineering firm.');
      return;
    }

    setAssignLoading(true);
    try {
      // Approve status and assign technician simultaneously
      await api.patch(`/requests/${assigningReq.id}/status`, { 
        status: 'approved',
        technician_name: technicianName,
        remarks: remarks || undefined
      });
      setAssigningReq(null);
      setTechnicianName('');
      setRemarks('');
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve request and assign technician.');
    } finally {
      setAssignLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_progress': return 'bg-purple-50 text-purple-705 border-purple-200 text-purple-700';
      case 'resolved': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const filteredRequests = requests.filter(req => {
    const term = search.toLowerCase();
    const matchesSearch = 
      req.tracking_number?.toLowerCase().includes(term) ||
      req.service_type?.toLowerCase().includes(term) ||
      req.category?.toLowerCase().includes(term) ||
      req.description?.toLowerCase().includes(term) ||
      (req.first_name && `${req.first_name} ${req.last_name}`.toLowerCase().includes(term));

    const matchesTab = 
      tabFilter === 'all' || 
      (tabFilter === 'pending' && req.status === 'pending') ||
      (tabFilter === 'progress' && (req.status === 'approved' || req.status === 'in_progress')) ||
      (tabFilter === 'resolved' && (req.status === 'resolved' || req.status === 'rejected'));

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">ICT Service Tickets</h2>
          <p className="text-sm text-slate-500 font-medium">Verify progress, tracking number diagnostics, and dispatcher notes for active campus jobs.</p>
        </div>
        <button 
          onClick={() => navigate('/submit-request')}
          className="self-start sm:self-auto h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shrink-0"
        >
          <Plus className="w-5 h-5" />
          New Support Ticket
        </button>
      </div>

      {/* Tabs list & Search bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setTabFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                tabFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Tickets
            </button>
            <button
              onClick={() => setTabFilter('pending')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                tabFilter === 'pending' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pending Approval
            </button>
            <button
              onClick={() => setTabFilter('progress')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                tabFilter === 'progress' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ongoing Repairs
            </button>
            <button
              onClick={() => setTabFilter('resolved')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                tabFilter === 'resolved' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Closed / Solved
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search tracking #, service issues, requester..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-semibold flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span>Filing campus support desk logs...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-500">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-slate-800">No support tickets found</h3>
          <p className="text-sm text-slate-400 mt-1">Adjust your tab filters, expand your search terms, or create a new request.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRequests.map((req) => {
            const dateStr = format(new Date(req.created_at), 'MMMM dd, yyyy h:mm a');
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col relative overflow-hidden"
              >
                {/* Visual Status Indicator Line */}
                <span className={`absolute top-0 left-0 w-full h-1.5 ${
                  req.status === 'resolved' ? 'bg-green-500' :
                  req.status === 'rejected' ? 'bg-red-500' :
                  req.status === 'in_progress' ? 'bg-purple-500' :
                  req.status === 'approved' ? 'bg-blue-500' : 'bg-amber-500'
                }`}></span>

                <div className="flex items-start justify-between mb-3 mt-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">{req.category}</span>
                    <h3 className="font-bold text-slate-800 text-sm mt-0.5 leading-snug">{req.service_type}</h3>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-lg uppercase ${getStatusStyle(req.status)}`}>
                    {req.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex-1 text-slate-600 text-xs md:text-sm space-y-2 border-t border-b border-dashed border-slate-100 py-3 my-3">
                  <p className="whitespace-pre-line text-slate-500 leading-relaxed italic">
                    &ldquo;{req.description}&rdquo;
                  </p>
                  
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs pt-1">
                    <p className="text-slate-450"><span className="font-bold text-slate-700">Tracking Code:</span> <span className="font-mono bg-slate-50 px-1 py-0.5 rounded text-blue-600 font-bold">{req.tracking_number}</span></p>
                    <p className="text-slate-450 truncate"><span className="font-bold text-slate-700">Attachment:</span> {req.file_attachment ? <span className="text-green-600 font-semibold truncate hover:underline cursor-pointer flex items-center gap-1"><Download className="w-3 h-3 text-green-500" /> Yes</span> : 'None'}</p>
                    {req.technician_name && (
                      <p className="col-span-2 text-slate-450"><span className="font-bold text-slate-705 text-slate-700">Assigned crew:</span> <span className="font-bold text-slate-800">{req.technician_name}</span></p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-300" />
                    {req.first_name ? `${req.first_name} ${req.last_name}` : 'Operator'}
                  </span>
                  <span>{dateStr}</span>
                </div>

                {/* Admin Actions Panel */}
                {user?.role === 'admin' && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setAssigningReq(req)}
                          className="h-8 px-3 text-blue-600 hover:bg-blue-50 border border-blue-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve & Assign Crew
                        </button>
                        <button
                          onClick={() => updateStatusDirect(req.id, 'rejected')}
                          className="h-8 px-3 text-red-650 hover:bg-red-50 border border-red-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all text-red-600"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    )}

                    {req.status === 'approved' && (
                      <button
                        onClick={() => updateStatusDirect(req.id, 'in_progress')}
                        className="h-8 px-4 text-purple-600 hover:bg-purple-50 border border-purple-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                      >
                        <Wrench className="w-3.5 h-3.5 animate-pulse" />
                        Move to Repair Queue
                      </button>
                    )}

                    {req.status === 'in_progress' && (
                      <button
                        onClick={() => updateStatusDirect(req.id, 'resolved')}
                        className="h-8 px-4 text-green-600 hover:bg-green-50 border border-green-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all animate-bounce"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        Complete Resolution
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal - Approve and Assign Technician */}
      {assigningReq && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                Delegate Ticket Tech Crew
              </h3>
              <button onClick={() => setAssigningReq(null)} className="text-slate-400 hover:text-slate-600 font-bold p-1">
                &times;
              </button>
            </div>

            <form onSubmit={handleApproveWithTechnician} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Selected Ticket</p>
                <p className="font-bold text-slate-800 text-sm mt-1">{assigningReq.service_type}</p>
                <p className="text-[11px] text-slate-500">Tracking Code: {assigningReq.tracking_number}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Assign Technician crew *</label>
                <select
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Select campus engineer...</option>
                  <option value="Engr. J. Balubal (Network head)">Engr. J. Balubal (Network head)</option>
                  <option value="Mr. A. Ramos (Hardware Lab tech)">Mr. A. Ramos (Hardware Lab tech)</option>
                  <option value="Mr. Reymond Diaz (Systems Admin)">Mr. Reymond Diaz (Systems Admin)</option>
                  <option value="USTP Balubal ICT Crew Squad Alpha">USTP Balubal ICT Crew Squad Alpha</option>
                  <option value="General On-Duty Student Technical Assistant">General On-Duty Student Technical Assistant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Dispatch remarks (Optional)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g., Target priority 1 for Lab 1 switches..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningReq(null)}
                  className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="h-10 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-xl"
                >
                  {assignLoading ? 'Approved...' : 'Approve & Dispatch Tool'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
