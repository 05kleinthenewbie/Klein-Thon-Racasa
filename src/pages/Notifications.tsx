import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Inbox, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../services/api';

interface NotificationObj {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationObj[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error('Failed to dismiss notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error('Failed to clear alerts');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Notifications</h2>
          <p className="text-sm text-slate-500">Get the latest status updates for your service requests, bookings, and repair progress alerts.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="self-start sm:self-auto h-10 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-705 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-semibold flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span>Filing notifications...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-500 max-w-2xl mx-auto shadow-sm">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-slate-800">Your inbox is clear</h3>
          <p className="text-sm text-slate-400 mt-1">There are no operational or warning notification system alerts logged in your account.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm max-w-3xl mx-auto divide-y divide-slate-100">
          {notifications.map((notif, index) => {
            const isIncident = notif.title.toLowerCase().includes('incident');
            return (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                key={notif.id}
                className={`p-5 flex items-start gap-4 transition-colors ${
                  notif.is_read ? 'bg-white' : 'bg-blue-50/25 border-l-4 border-blue-600'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isIncident 
                    ? 'bg-red-50 text-red-600' 
                    : notif.is_read 
                      ? 'bg-slate-105 bg-slate-100 text-slate-500' 
                      : 'bg-blue-50 text-blue-600'
                }`}>
                  {isIncident ? <AlertCircle className="w-4.5 h-4.5" /> : <MessageSquare className="w-4.5 h-4.5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className={`text-sm tracking-tight ${notif.is_read ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      {new Date(notif.created_at).toLocaleDateString()} &bull; {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 mt-1.5 leading-relaxed">{notif.message}</p>
                </div>

                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg shrink-0 transition-all"
                    title="Mark as Read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
