// Frontend\src\components\Settings.tsx
import React, { useState, useEffect } from 'react';
import { Warehouse, Users, Plus, Trash2, Shield, MapPin } from 'lucide-react';
import { Warehouse as WarehouseType, User as UserType, Role } from '../types';
import { apiFetch } from '../utils/api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'warehouses' | 'users'>('warehouses');
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New Warehouse Form
  const [newWH, setNewWH] = useState({ name: '', location: '', parentId: '', type: 'Warehouse' as WarehouseType['type'] });
  const [showWHModal, setShowWHModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'warehouses') {
        const res = await apiFetch('/api/warehouses');
        const data = await res.json();
        setWarehouses(data);
      } else {
        const res = await apiFetch('/api/users');
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      setError('Failed to fetch data');
    }
    setLoading(false);
  };

  const handleCreateWH = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newWH)
    });
    if (res.ok) {
      setShowWHModal(false);
      setNewWH({ name: '', location: '', parentId: '', type: 'Warehouse' });
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to create warehouse');
    }
  };

  const handleDeleteWH = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    const res = await apiFetch(`/api/warehouses/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const getParentName = (parentId?: string) => {
    if (!parentId) return null;
    return warehouses.find(w => w.id === parentId)?.name;
  };

  const handleUpdateRole = async (userId: string, role: Role) => {
    const res = await apiFetch(`/api/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (res.ok) fetchData();
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 font-medium">Configure global infrastructure and access control.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-100">
        <button 
          onClick={() => setActiveTab('warehouses')}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'warehouses' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4" />
            <span>Infrastructure</span>
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'users' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>User Directory</span>
          </div>
        </button>
      </div>

      {activeTab === 'warehouses' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={() => setShowWHModal(true)}
              className="modern-button bg-slate-900 text-white hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" />
              <span>Register Location</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-2 text-center py-12 text-slate-400">Loading Infrastructure...</div>
            ) : warehouses.map(wh => (
              <div key={wh.id} className="glass-card p-6 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <Warehouse className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{wh.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 font-bold uppercase rounded-full">{wh.type || 'Warehouse'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          {wh.location} {getParentName(wh.parentId) && `| Part of ${getParentName(wh.parentId)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteWH(wh.id)}
                    className="p-2 text-rose-600 opacity-0 group-hover:opacity-100 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider">ID: {wh.id.slice(0, 8)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">User Details</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Retrieving User Directory...</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-bold text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value as Role)}
                      className="bg-transparent border-none text-xs font-bold text-slate-600 uppercase tracking-wider focus:ring-0 cursor-pointer"
                    >
                      <option value="Staff">Staff</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-2 text-rose-600 opacity-0 group-hover:opacity-100 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Warehouse Modal */}
      {showWHModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">New Warehouse</h2>
              <button onClick={() => setShowWHModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleCreateWH} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type</label>
                  <select 
                    value={newWH.type}
                    onChange={(e) => setNewWH({...newWH, type: e.target.value as any})}
                    className="input-field"
                  >
                    <option value="Warehouse">Warehouse</option>
                    <option value="Rack">Rack</option>
                    <option value="Bin">Bin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Parent Location</label>
                  <select 
                    value={newWH.parentId}
                    onChange={(e) => setNewWH({...newWH, parentId: e.target.value})}
                    className="input-field"
                  >
                    <option value="">None (Top Level)</option>
                    {warehouses.filter(w => w.type !== 'Bin').map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Name</label>
                <input 
                  required
                  type="text" 
                  value={newWH.name}
                  onChange={(e) => setNewWH({...newWH, name: e.target.value})}
                  className="input-field"
                  placeholder="e.g. Rack A-101"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Location / Zone</label>
                <input 
                  required
                  type="text" 
                  value={newWH.location}
                  onChange={(e) => setNewWH({...newWH, location: e.target.value})}
                  className="input-field"
                  placeholder="e.g. North Wing"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                Register Infrastructure
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
