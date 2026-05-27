import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  Search, 
  Settings, 
  CheckCircle, 
  Trash2, 
  RefreshCw, 
  AlertOctagon, 
  Building,
  DollarSign
} from 'lucide-react';
import api from '../services/api';

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
  created_at: string;
}

export default function DefectiveEquipment() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Selected item to edit state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [newStatus, setNewStatus] = useState<'functional' | 'defective' | 'under_repair' | 'disposed'>('defective');
  const [newCondition, setNewCondition] = useState('Poor');
  const [damagePrice, setDamagePrice] = useState(0);
  const [editMsg, setEditMsg] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory');
      // Filter out only defective, under_repair or disposed assets
      setItems(response.data);
    } catch (err) {
      console.error('Failed to fetch defective assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setSaveLoading(true);
    setEditMsg('');
    try {
      await api.patch(`/inventory/${selectedItem.id}`, {
        ...selectedItem,
        status: newStatus,
        condition: newCondition,
        damage_price: damagePrice
      });
      setSelectedItem(null);
      fetchInventory();
    } catch (err: any) {
      setEditMsg(err.response?.data?.error || 'Failed to update equipment');
    } finally {
      setSaveLoading(false);
    }
  };

  // Extract non-functional or poorly condition equipment
  const defectiveAssets = items.filter(item => {
    const isDamaged = item.status === 'defective' || item.status === 'under_repair' || item.status === 'disposed' || item.condition === 'Defective' || item.condition === 'Poor';
    const matchesSearch = 
      item.item_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.asset_tag?.toLowerCase().includes(search.toLowerCase()) ||
      item.property_number?.toLowerCase().includes(search.toLowerCase());
    return isDamaged && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Defective Equipment Monitor</h2>
          <p className="text-sm text-slate-500 font-medium">Identify damage-prone computers, printers, network routers, and monitor liability and replacement recommenders.</p>
        </div>
        <button 
          onClick={fetchInventory} 
          className="self-start sm:self-auto h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-705 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Registry
        </button>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-red-500 font-bold uppercase tracking-wide">Total Defective Items</p>
            <p className="text-2xl font-black text-red-800">{items.filter(i => i.status === 'defective').length}</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <p className="text-xs text-yellow-600 font-bold uppercase tracking-wide">Under Repair</p>
            <p className="text-2xl font-black text-yellow-800">{items.filter(i => i.status === 'under_repair').length}</p>
          </div>
        </div>

        <div className="bg-slate-10 text-slate-700 bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Disposed / Decommissioned</p>
            <p className="text-2xl font-black text-slate-800">{items.filter(i => i.status === 'disposed').length}</p>
          </div>
        </div>
      </div>

      {/* Control panel & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search defective property / tag code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Main List Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-semibold">
          <p className="animate-pulse">Consulting deficit reports...</p>
        </div>
      ) : defectiveAssets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3 animate-bounce" />
          <h3 className="font-bold text-lg text-slate-800">No defective equipment detected!</h3>
          <p className="text-sm text-slate-400 mt-1">Excellent! All items in the physical campus inventory are functional and operational.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="p-4">Property Number</th>
                <th className="p-4">Asset Details</th>
                <th className="p-4">Location</th>
                <th className="p-4">Condition</th>
                <th className="p-4">Current Status</th>
                <th className="p-4 text-right">Liability/Cost</th>
                {user?.role === 'admin' && <th className="p-4 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {defectiveAssets.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold font-mono text-blue-700">{item.property_number || item.asset_tag}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Tag: {item.asset_tag}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{item.item_name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.brand} {item.model} &bull; S/N: {item.serial_number || 'N/A'}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.location}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      item.condition === 'Defective' || item.condition === 'Poor' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.condition}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase ${
                      item.status === 'defective' ? 'bg-red-55 text-red-650 bg-red-100 text-red-700 border border-red-200' :
                      item.status === 'under_repair' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                      item.status === 'disposed' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-slate-800">
                    {item.damage_price > 0 ? (
                      <span className="flex items-center justify-end text-red-600 font-mono text-xs">
                        <DollarSign className="w-3 h-3 text-red-400" />
                        ₱{item.damage_price.toLocaleString()}
                      </span>
                    ) : '₱0.00'}
                  </td>
                  {user?.role === 'admin' && (
                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setNewStatus(item.status);
                          setNewCondition(item.condition);
                          setDamagePrice(item.damage_price);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                        title="Configure Repair / Disposal"
                      >
                        <Settings className="w-4 h-4" />
                        Resolve
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resolve modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                Resolve Equipment Issues
              </h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateAsset} className="p-6 space-y-4">
              {editMsg && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs rounded-xl">
                  {editMsg}
                </div>
              )}

              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Selected Asset</p>
                <p className="font-bold text-slate-800 mt-1">{selectedItem.item_name}</p>
                <p className="text-[11px] text-slate-500">Property number: {selectedItem.property_number || selectedItem.asset_tag}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Asset Status</label>
                  <select
                    value={newStatus}
                    onChange={(e: any) => setNewStatus(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="defective">Defective</option>
                    <option value="under_repair">Under Repair</option>
                    <option value="disposed">Decommissioned/Disposed</option>
                    <option value="functional">Functional (Fixed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Condition Rating</label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Poor">Poor</option>
                    <option value="Defective">Defective</option>
                    <option value="Fair">Fair</option>
                    <option value="Good">Good</option>
                    <option value="New">Excellent / New</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Damage / Liability Cost (₱)</label>
                <input
                  type="number"
                  value={damagePrice}
                  onChange={(e) => setDamagePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.00"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="h-10 px-4 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="h-10 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  {saveLoading ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
