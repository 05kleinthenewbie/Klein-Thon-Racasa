import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ClipboardList, AlertCircle, FileUp, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';

const SERVICE_TYPES: Record<string, string[]> = {
  'Network Services': [
    'Wi-Fi Connection Issues',
    'LAN Port Troubleshooting',
    'IP Address Configuration',
    'Firewall & Traffic Request',
    'Network Cable Installation'
  ],
  'Hardware Services': [
    'Desktop PC Repair/Upgrade',
    'Printer Maintenance & Ink Refill',
    'AVR/Projector Setup',
    'Monitor, Keyboard, Mouse Replacement',
    'Device Diagnostic/Cleaning'
  ],
  'Software Services': [
    'Operating System Installation',
    'Microsoft Office Activation',
    'Antivirus Software Setup',
    'General Software Crash/Fix',
    'Driver Updates'
  ],
  'Information System Services': [
    'USTP Portal Password Reset',
    'System Access Credentials Reset',
    'Portal / Mobile App Bug Reporting',
    'Website Update Request',
    'General Data Request'
  ]
};

export default function SubmitRequest() {
  const [category, setCategory] = useState('Network Services');
  const [serviceType, setServiceType] = useState(SERVICE_TYPES['Network Services'][0]);
  const [description, setDescription] = useState('');
  const [fileAttachment, setFileAttachment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);

  // Drag and drop upload state
  const [dragActive, setDragActive] = useState(false);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCategory(value);
    setServiceType(SERVICE_TYPES[value][0]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileAttachment(`Attached: ${file.name} (${Math.round(file.size / 1024)} KB)`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setMessage({ type: 'error', text: 'Please fill in the problem description.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/requests', {
        category,
        service_type: serviceType,
        description,
        file_attachment: fileAttachment || null
      });

      setTrackingNumber(response.data.tracking_number);
      setMessage({ type: 'success', text: 'Your request was successfully submitted!' });
      setDescription('');
      setFileAttachment('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to submit service request.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">ICT Job Request Form</h2>
        <p className="text-sm text-slate-500">Submit a digital request to the Balubal Campus ICT Office for rapid tech support and repair.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Container */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Request Specification
            </h3>

            {message?.type === 'error' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p>{message.text}</p>
              </div>
            )}

            {message?.type === 'success' && trackingNumber && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm"
              >
                <div className="flex gap-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-green-900">Request Successfully Lodged!</h4>
                    <p className="text-green-700 mt-1">Our technical crew has logged this request. Use the tracking code below to reference this request.</p>
                  </div>
                </div>
                <div className="mt-4 bg-white border border-green-200 rounded-lg p-3 text-center flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">Tracking Number</span>
                  <span className="font-mono text-base font-bold text-blue-700 tracking-wide select-all bg-blue-50 px-3 py-1 rounded">
                    {trackingNumber}
                  </span>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Service Category</label>
                <select
                  value={category}
                  onChange={handleCategoryChange}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                >
                  <option value="Network Services">Network Services</option>
                  <option value="Hardware Services">Hardware Services</option>
                  <option value="Software Services">Software Services</option>
                  <option value="Information System Services">Information System Services</option>
                </select>
              </div>

              {/* Specific Sub Type */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Service type / Problem Area</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                >
                  {SERVICE_TYPES[category].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Problem Description & Symptoms</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue with clarity as well as any steps to reproduce, device names, or port ID..."
                rows={5}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              ></textarea>
            </div>

            {/* Simulated Drag & Drop File Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Optional Attachment (Log, Spec Sheet, Screenshot)</label>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : fileAttachment 
                      ? 'border-green-300 bg-green-50/20' 
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileUp className={`w-8 h-8 mx-auto mb-2 ${fileAttachment ? 'text-green-600 animate-bounce' : 'text-slate-400'}`} />
                {fileAttachment ? (
                  <div>
                    <p className="text-sm font-semibold text-green-700">{fileAttachment}</p>
                    <button 
                      type="button" 
                      onClick={() => setFileAttachment('')}
                      className="text-xs text-red-600 hover:underline mt-1"
                    >
                      Remove attachment
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="cursor-pointer">
                      <span className="text-blue-600 font-semibold text-sm hover:underline">Click to upload file</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFileAttachment(`Attached: ${e.target.files[0].name} (${Math.round(e.target.files[0].size / 1024)} KB)`);
                          }
                        }}
                      />
                    </label>
                    <p className="text-xs text-slate-500 mt-1">or drag and drop attachments here (PDF, JPG, PNG up to 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Direct text attachment indicator */}
            <div className="flex gap-2 text-xs text-slate-400">
              <span className="font-bold">Note:</span>
              <span>Attachments are stored inside our system databases and linked to the Job Ticket.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full pb-4 pt-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              {loading ? 'Submitting request...' : 'Lodging Ticket'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Side Panel: Services Reference */}
        <div className="space-y-6">
          <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Supported ICT SLA Info</h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="text-blue-600 font-bold font-mono">1.</span>
                <div>
                  <h5 className="font-bold text-xs text-slate-700 leading-none">Category & Queue Routing</h5>
                  <p className="text-xs text-slate-500 mt-1">Requests are auto-routed directly to technical engineers to minimize repair queue bottlenecks.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-blue-600 font-bold font-mono">2.</span>
                <div>
                  <h5 className="font-bold text-xs text-slate-700 leading-none">Diagnostic Job Generation</h5>
                  <p className="text-xs text-slate-500 mt-1">Approval of hardware or software request instantly spawns a repair job assigned to technicians.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-blue-600 font-bold font-mono">3.</span>
                <div>
                  <h5 className="font-bold text-xs text-slate-700 leading-none">Audited System Logging</h5>
                  <p className="text-xs text-slate-500 mt-1">Every state, reassignment, remark, and status transition is written to the SEC Audited System Log.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">Campus Service Desk Hours</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-600">
                <span>Monday - Friday</span>
                <span className="font-semibold text-slate-800">8:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-600">
                <span>Saturday</span>
                <span className="font-semibold text-slate-800">8:00 AM - 12:00 PM</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Sunday & Holidays</span>
                <span className="font-bold text-red-600">Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
