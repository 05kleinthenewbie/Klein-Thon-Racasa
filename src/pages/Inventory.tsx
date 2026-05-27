import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Package, MapPin, Tag, Info, AlertTriangle, Search, Info as TrashIcon, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InventoryItem {
  id: number;
  asset_tag: string;
  item_name: string;
  description: string;
  category: string;
  status: 'functional' | 'defective' | 'under_repair' | 'disposed';
  damage_price: number;
  location: string;
  property_number: string;
  brand: string;
  model: string;
  serial_number: string;
  condition: string;
}

export default function Inventory() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Advanced form fields mapping server/db.ts changes
  const [formData, setFormData] = useState({
    asset_tag: '',
    item_name: '',
    description: '',
    category: 'Computer',
    status: 'functional' as const,
    damage_price: 0,
    location: '',
    property_number: '',
    brand: '',
    model: '',
    serial_number: '',
    condition: 'Good'
  });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory');
      setItems(response.data);
    } catch (err) {
      console.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory', formData);
      setShowModal(false);
      setFormData({
        asset_tag: '',
        item_name: '',
        description: '',
        category: 'Computer',
        status: 'functional',
        damage_price: 0,
        location: '',
        property_number: '',
        brand: '',
        model: '',
        serial_number: '',
        condition: 'Good'
      });
      fetchInventory();
    } catch (err) {
      alert('Failed to add asset to physical registry');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'functional': return 'bg-green-50 text-green-700 border-green-200';
      case 'defective': return 'bg-red-50 text-red-700 border-red-200';
      case 'under_repair': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'disposed': return 'bg-slate-50 text-slate-650 text-slate-600 border-slate-200';
      default: return '';
    }
  };

  const filteredItems = items.filter(item => {
    const term = search.toLowerCase();
    return (
      item.item_name?.toLowerCase().includes(term) ||
      item.asset_tag?.toLowerCase().includes(term) ||
      item.property_number?.toLowerCase().includes(term) ||
      item.location?.toLowerCase().includes(term) ||
      item.brand?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">ICT Asset Inventory</h2>
          <p className="text-sm text-slate-500">Track properties, registration keys, physical positions, and defects across USTP Campus computers.</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setShowModal(true)}
            className="self-start sm:self-auto h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shrink-0"
          >
            <Plus className="w-5 h-5" />
            Add New Asset Item
          </button>
        )}
      </div>

      {/* Control panel & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search assets by tag, property number, model, brand, position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-450 font-semibold flex flex-col items-center gap-3">
          <Plus className="w-8 h-8 text-blue-600 animate-pulse" />
          <span>Filing asset lists...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
          <h3 className="font-bold text-lg text-slate-800">No assets matches found</h3>
          <p className="text-sm text-slate-400 mt-1">Refine your search tags or register another item using the Add Asset switch.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="p-4">Property info</th>
                  <th className="p-4">Asset Tag / S/N</th>
                  <th className="p-4">Equipment Specs</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Grade Condition</th>
                  <th className="p-4 text-center">Operational Status</th>
                  <th className="p-4 text-right">Replacement Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="p-4">
                      {item.property_number ? (
                        <p className="font-bold text-blue-700 font-mono">{item.property_number}</p>
                      ) : (
                        <span className="text-slate-400 italic">No prop #</span>
                      )}
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider mt-0.5">{item.category}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800 font-mono">{item.asset_tag}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">S/N: {item.serial_number || 'N/A'}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{item.item_name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.brand} {item.model} &bull; {item.description || 'No descriptor'}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-slate-550">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.location}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-xs">
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-650">
                        {item.condition || 'Good'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-lg uppercase border ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800 text-xs md:text-sm whitespace-nowrap">
                      ₱{item.damage_price.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
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
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl relative z-10 p-6 md:p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                Enroll ICT Physical Asset
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-550 text-slate-505 uppercase tracking-wide mb-1.5">Asset Tag # *</label>
                    <input 
                      type="text" 
                      value={formData.asset_tag}
                      onChange={(e) => setFormData({...formData, asset_tag: e.target.value})}
                      required
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. USTP-BAL-2024-001"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-550 text-slate-505 uppercase tracking-wide mb-1.5">Property Registration Number</label>
                    <input 
                      type="text" 
                      value={formData.property_number}
                      onChange={(e) => setFormData({...formData, property_number: e.target.value})}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 21-12-00512-C"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-550 text-slate-505 uppercase tracking-wide mb-1.5">Item Name *</label>
                    <input 
                      type="text" 
                      value={formData.item_name}
                      onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                      required
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      placeholder="e.g. Dell Core i5 Host Computer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-550 text-slate-505 uppercase tracking-wide mb-1.5">Category *</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="Computer">Computer</option>
                      <option value="Peripheral">Peripheral & Accessories</option>
                      <option value="Networking">Networking Device (Switch, AP)</option>
                      <option value="AVR Equipment">AVR Equipment / Projector</option>
                      <option value="Lab Equipment">Lab Equipment</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1">Brand</label>
                    <input 
                      type="text" 
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      placeholder="e.g. Dell, Epson"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1">Model Name</label>
                    <input 
                      type="text" 
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      placeholder="e.g. Optiplex 3020"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1">Serial Number</label>
                    <input 
                      type="text" 
                      value={formData.serial_number}
                      onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      placeholder="S/N registration code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Grade Condition</label>
                    <select 
                      value={formData.condition}
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                      className="w-full h-10 px-3 bg-slate-50"
                    >
                      <option value="Excellent">New / Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair / Operational</option>
                      <option value="Poor">Poor / Under Check</option>
                      <option value="Defective">Defective</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-555 uppercase mb-1">Operational status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full h-10 px-3 bg-slate-50"
                    >
                      <option value="functional">Functional</option>
                      <option value="defective">Defective</option>
                      <option value="under_repair">Under Repair</option>
                      <option value="disposed">Decommissioned</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-555 uppercase mb-1">Asset Value / Replacement Price</label>
                    <input 
                      type="number" 
                      value={formData.damage_price}
                      onChange={(e) => setFormData({...formData, damage_price: parseFloat(e.target.value) || 0})}
                      className="w-full h-10 px-3 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-slate-555 uppercase tracking-wide mb-1.5 font-sans">Location *</label>
                    <input 
                      type="text" 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      required
                      className="w-full h-10 px-3 bg-slate-50"
                      placeholder="e.g. ComLab 1 Station 12"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-555 uppercase tracking-wide mb-1.5">Brief description / specifications note</label>
                    <input 
                      type="text" 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full h-10 px-3 bg-slate-50"
                      placeholder="e.g. Core i5, 8GB RAM, 240GB SSD"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-11 border border-slate-200 rounded-xl font-bold text-slate-650 text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 h-11 bg-blue-600 font-bold hover:bg-blue-700 text-white rounded-xl shadow-md"
                  >
                    Save Asset Item
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
