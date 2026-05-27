import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, User, Calendar, DollarSign, CheckCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

interface Incident {
  id: number;
  reported_by_admin_id: number;
  liable_user_id: number;
  inventory_id?: number;
  incident_date: string;
  description: string;
  liability_amount: number;
  payment_status: 'pending' | 'settled' | 'not_applicable';
  first_name: string; // From liable user
  last_name: string;
  item_name?: string;
}

export default function Incidents() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const fetchIncidents = async () => {
    try {
      const response = await api.get('/incidents');
      setIncidents(response.data);
    } catch (err) {
      console.error('Failed to fetch incidents');
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Incident & Liability Tracking</h1>
          <p className="text-slate-500">Record ICT-related incidents and monitor user responsibilities.</p>
        </div>
        {user?.role === 'admin' && (
          <button className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-100">
            <AlertTriangle className="w-5 h-5" />
            Record Incident
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2].map((_, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] uppercase font-bold rounded-full border border-amber-100">
                  Pending Settlement
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 line-clamp-1">Monitor Screen Damage</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mt-1">Found cracked screen in ComLab 1 Station 5 after IT121 class.</p>
              </div>
              <div className="space-y-2 pt-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Liable: <strong>John Doe</strong> (2021-3001)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Date: Oct 24, 2024</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span>Amount: <strong>₱2,500.00</strong></span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
               <button className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-xs hover:bg-slate-200 transition-colors">Details</button>
               {user?.role === 'admin' && (
                 <button className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-xs hover:bg-green-700 transition-colors">Mark Settled</button>
               )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
        <Info className="w-6 h-6 text-amber-600 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-bold">Important Notice</p>
          <p className="mt-1">Incidents recorded here are linked to student/faculty clearance. Liabilities must be settled at the ICT office to clear any account blocks.</p>
        </div>
      </div>
    </div>
  );
}
