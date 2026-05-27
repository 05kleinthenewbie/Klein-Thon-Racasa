import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Calendar, Clock, MapPin, CheckCircle2, XCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface Booking {
  id: number;
  facility_name: string;
  purpose: string;
  start_datetime: string;
  end_datetime: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  first_name: string;
  last_name: string;
}

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    facility_name: 'ComLab 1',
    purpose: '',
    start_datetime: '',
    end_datetime: ''
  });

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (err) {
      console.error('Failed to fetch bookings');
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/bookings', formData);
      setShowModal(false);
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to book facility');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facility Booking</h1>
          <p className="text-slate-500">Reserve ComLabs and AVRs for classes or events.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
          Book Facility
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Reservation List */}
        <div className="xl:col-span-2 space-y-4">
           {bookings.map((booking) => (
             <motion.div 
               layout
               key={booking.id}
               className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-start justify-between"
             >
               <div className="flex items-start gap-4">
                 <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                    <Calendar className="w-6 h-6" />
                 </div>
                 <div className="space-y-1">
                   <h3 className="font-bold text-slate-900">{booking.facility_name}</h3>
                   <p className="text-sm text-slate-600 font-medium">{booking.purpose}</p>
                   <div className="flex flex-wrap gap-4 pt-2">
                     <span className="flex items-center gap-1.5 text-xs text-slate-500">
                       <Clock className="w-3.5 h-3.5" />
                       {format(new Date(booking.start_datetime), 'h:mm a')} - {format(new Date(booking.end_datetime), 'h:mm a')}
                     </span>
                     <span className="flex items-center gap-1.5 text-xs text-slate-500">
                       <Calendar className="w-3.5 h-3.5" />
                       {format(new Date(booking.start_datetime), 'MMM dd, yyyy')}
                     </span>
                     <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Info className="w-3.5 h-3.5" />
                        By {booking.first_name} {booking.last_name}
                     </span>
                   </div>
                 </div>
               </div>
               <div className="flex flex-col items-end gap-2">
                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                   booking.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                   booking.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' :
                   'bg-red-50 text-red-600 border-red-100'
                 }`}>
                   {booking.status}
                 </span>
               </div>
             </motion.div>
           ))}
           {bookings.length === 0 && (
             <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
               No active reservations found.
             </div>
           )}
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="text-lg font-bold mb-4">Facility Rules</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                Book at least 24 hours in advance.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                Maximum of 4 hours per session.
              </li>
              <li className="flex gap-2">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                No food or drinks inside laboratories.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">Facility Reservation</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Facility</label>
                  <select 
                    value={formData.facility_name}
                    onChange={(e) => setFormData({...formData, facility_name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ComLab 1">ComLab 1</option>
                    <option value="ComLab 2">ComLab 2</option>
                    <option value="ComLab 3">ComLab 3</option>
                    <option value="AVR">AVR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purpose / Course</label>
                  <input 
                    type="text" 
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. IT 121 - Database Management"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                    <input 
                      type="datetime-local" 
                      value={formData.start_datetime}
                      onChange={(e) => setFormData({...formData, start_datetime: e.target.value})}
                      required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                    <input 
                      type="datetime-local" 
                      value={formData.end_datetime}
                      onChange={(e) => setFormData({...formData, end_datetime: e.target.value})}
                      required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
