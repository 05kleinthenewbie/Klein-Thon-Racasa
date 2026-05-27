import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Search, Plus, Trash2, Edit2, ShieldAlert, Key, UserCheck, RefreshCw, X } from 'lucide-react';
import api from '../services/api';

interface UserItem {
  id: number;
  school_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'faculty_staff';
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create / Edit Form states
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  
  const [schoolId, setSchoolId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'faculty_staff'>('faculty_staff');
  const [password, setPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setSchoolId('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setRole('faculty_staff');
    setPassword('');
    setErrorMsg('');
    setOpenModal(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user);
    setSchoolId(user.school_id);
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setEmail(user.email);
    setRole(user.role);
    setPassword('');
    setErrorMsg('');
    setOpenModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !firstName || !lastName || !email) {
      setErrorMsg('Please populate all required fields.');
      return;
    }

    if (!editingUser && !password) {
      setErrorMsg('Please specify a password for new users.');
      return;
    }

    setSaveLoading(true);
    setErrorMsg('');
    try {
      if (editingUser) {
        // Edit User
        await api.patch(`/auth/users/${editingUser.id}`, {
          school_id: schoolId,
          first_name: firstName,
          last_name: lastName,
          email,
          role,
          password: password || undefined
        });
      } else {
        // Register new User
        await api.post('/auth/register', {
          school_id: schoolId,
          first_name: firstName,
          last_name: lastName,
          email,
          role,
          password
        });
      }
      setOpenModal(false);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to persist user credentials.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Are you absolutely sure you want to delete this user? This will erase all relevant tickets and logs permanently.')) return;

    try {
      await api.delete(`/auth/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const term = search.toLowerCase();
    return (
      user.school_id?.toLowerCase().includes(term) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Personnel User Management</h2>
          <p className="text-sm text-slate-500 font-medium font-sans">Grant role-based authorization to administrators or faculty staff members who utilize the ICT System.</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="self-start sm:self-auto h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shrink-0"
        >
          <Plus className="w-5 h-5" />
          Add New Personnel
        </button>
      </div>

      {/* Controls & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search credentials, school ID, or names..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-semibold flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span>Syncing campus records...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-slate-850">No users found</h3>
          <p className="text-sm text-slate-400 mt-1">Refine your tags/search parameters, or create a brand new campus user profile above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="p-4">School ID</th>
                <th className="p-4">Full Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">System Role</th>
                <th className="p-4">Enrolled On</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map((person) => (
                <tr key={person.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="p-4 font-mono font-bold text-blue-700">{person.school_id}</td>
                  <td className="p-4 font-semibold text-slate-850">{person.first_name} {person.last_name}</td>
                  <td className="p-4 text-slate-500">{person.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${
                      person.role === 'admin' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {person.role === 'admin' ? 'Campus Admin' : 'Faculty / Staff'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 text-xs">
                    {new Date(person.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(person)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit credentials"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(person.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete user account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal - Create or Edit */}
      {openModal && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {editingUser ? 'Modify Personnel Account' : 'Enroll New Personnel'}
              </h3>
              <button onClick={() => setOpenModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-650" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">School ID *</label>
                  <input
                    type="text"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    placeholder="e.g., 2024-0010"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Access Authorization *</label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="faculty_staff">Faculty / Staff</option>
                    <option value="admin">Campus Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">First name *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Last name *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ustp.edu.ph"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  {editingUser ? 'System Password (leave blank to keep current)' : 'Account Password *'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? 'Unchanged' : 'Password hash code'}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required={!editingUser}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="h-10 px-4 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="h-10 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <UserCheck className="w-4 h-4" />
                  {saveLoading ? 'Enrolling...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
