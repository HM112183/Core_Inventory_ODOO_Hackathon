import React, { useState, useEffect } from 'react';
import { Warehouse, Users, Plus, Trash2, Shield, MapPin } from 'lucide-react';
import { Warehouse as WarehouseType, User as UserType, Role } from '../types';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'warehouses' | 'users'>('warehouses');
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New Warehouse Form
  const [newWH, setNewWH] = useState({ name: '', location: '', parentId: '', type: 'Warehouse' as WarehouseType['type'] });
  const [showWHModal, setShowWHModal] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'warehouses') {
        const res = await fetch('/api/warehouses', { headers });
        const data = await res.json();
        setWarehouses(data);
      } else {
        const res = await fetch('/api/users', { headers });
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
    const res = await fetch('/api/warehouses', {
      method: 'POST',
      headers,
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
    const res = await fetch(`/api/warehouses/${id}`, { method: 'DELETE', headers });
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
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ role })
    });
    if (res.ok) fetchData();
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers });
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
          <h1 className="text-4xl font-bold uppercase tracking-tighter">System Settings</h1>
          <p className="text-sm font-serif italic opacity-50">Configure global infrastructure and access control.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-[#141414]">
        <button 
          onClick={() => setActiveTab('warehouses')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'warehouses' ? 'bg-[#141414] text-[#E4E3E0]' : 'opacity-40 hover:opacity-100'}`}
        >
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4" />
            <span>Infrastructure</span>
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-[#141414] text-[#E4E3E0]' : 'opacity-40 hover:opacity-100'}`}
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
              className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Location</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-2 text-center py-12 font-mono text-xs opacity-50 uppercase">Loading Infrastructure...</div>
            ) : warehouses.map(wh => (
              <div key={wh.id} className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_#141414] group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#141414]/5 border border-[#141414]/10">
                      <Warehouse className="w-5 h-5 opacity-50" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold uppercase tracking-tight">{wh.name}</h3>
                        <span className="text-[9px] px-1.5 py-0.5 border border-[#141414] font-bold uppercase">{wh.type || 'Warehouse'}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-40">
                        <MapPin className="w-3 h-3" />
                        <span className="text-[10px] uppercase font-bold">
                          {wh.location} {getParentName(wh.parentId) && `| Part of ${getParentName(wh.parentId)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteWH(wh.id)}
                    className="p-2 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="pt-4 border-t border-[#141414]/5 flex justify-between items-center">
                  <span className="text-[10px] font-mono opacity-30 uppercase">ID: {wh.id}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white border border-[#141414] shadow-[4px_4px_0px_0px_#141414] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#141414] bg-[#141414]/5">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest opacity-50">User Details</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest opacity-50">Email</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest opacity-50">Role</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest opacity-50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center font-mono text-xs opacity-50 uppercase">Retrieving User Directory...</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b border-[#141414]/10 hover:bg-[#141414]/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#141414] flex items-center justify-center text-[#E4E3E0] font-bold text-[10px]">
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-bold uppercase tracking-tight">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium opacity-60">{u.email}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value as Role)}
                      className="bg-transparent border-none text-[10px] font-bold uppercase tracking-wider focus:ring-0 cursor-pointer"
                    >
                      <option value="Staff">Staff</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-2 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
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
        <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#E4E3E0] border border-[#141414] shadow-[8px_8px_0px_0px_#141414] w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold uppercase tracking-tighter">New Warehouse</h2>
              <button onClick={() => setShowWHModal(false)} className="text-sm font-bold uppercase tracking-widest opacity-50 hover:opacity-100">Close</button>
            </div>
            <form onSubmit={handleCreateWH} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Type</label>
                  <select 
                    value={newWH.type}
                    onChange={(e) => setNewWH({...newWH, type: e.target.value as any})}
                    className="w-full bg-white border border-[#141414] p-3 text-sm font-bold focus:outline-none"
                  >
                    <option value="Warehouse">Warehouse</option>
                    <option value="Rack">Rack</option>
                    <option value="Bin">Bin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Parent Location</label>
                  <select 
                    value={newWH.parentId}
                    onChange={(e) => setNewWH({...newWH, parentId: e.target.value})}
                    className="w-full bg-white border border-[#141414] p-3 text-sm font-bold focus:outline-none"
                  >
                    <option value="">None (Top Level)</option>
                    {warehouses.filter(w => w.type !== 'Bin').map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Name</label>
                <input 
                  required
                  type="text" 
                  value={newWH.name}
                  onChange={(e) => setNewWH({...newWH, name: e.target.value})}
                  className="w-full bg-white border border-[#141414] p-3 text-sm font-bold focus:outline-none"
                  placeholder="e.g. Rack A-101"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Location / Zone</label>
                <input 
                  required
                  type="text" 
                  value={newWH.location}
                  onChange={(e) => setNewWH({...newWH, location: e.target.value})}
                  className="w-full bg-white border border-[#141414] p-3 text-sm font-bold focus:outline-none"
                  placeholder="e.g. North Wing"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-[#141414] text-[#E4E3E0] text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/90"
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
