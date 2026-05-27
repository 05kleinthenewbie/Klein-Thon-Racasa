import React, { useEffect, useState } from 'react';
import { History, Search, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import api from '../services/api';

interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  details: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string | null;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/logs');
      setLogs(response.data);
    } catch (err) {
      console.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const term = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.details?.toLowerCase().includes(term) ||
      (log.first_name && `${log.first_name} ${log.last_name}`.toLowerCase().includes(term)) ||
      log.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Audit Logs</h2>
          <p className="text-sm text-slate-500">View real-time, tamper-evident security system audit logs compiling operators, actions, endpoints, and asset mutations.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="self-start sm:self-auto h-10 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-705 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Logging
        </button>
      </div>

      {/* Control panel and filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search audit actions, categories, descriptions, or email operators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Audit table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-semibold flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span>Filing secure event streams...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-slate-800">No logs found</h3>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search query or perform actions to populate security events.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold flex items-center gap-1.5 text-blue-700">
              <ShieldCheck className="w-4 h-4" />
              Audited Under ISO-Compliant Access Protocols
            </span>
            <span>Total: {filteredLogs.length} events logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">operator</th>
                  <th className="p-4 w-[50%]">Mutation / Execution log details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px] md:text-xs">
                {filteredLogs.map((log) => {
                  const isSuccess = log.action.includes('LOGIN') || log.action.includes('CREATE');
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 whitespace-nowrap text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase font-sans text-[10px] ${
                          isSuccess ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 font-sans max-w-[150px] truncate">
                        {log.first_name ? (
                          <div>
                            <p className="font-bold text-slate-800 leading-none">{log.first_name} {log.last_name}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{log.email} ({log.role === 'admin' ? 'Admin' : 'Staff'})</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Guest / System</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600 font-mono break-all font-sans leading-relaxed text-slate-500">
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
