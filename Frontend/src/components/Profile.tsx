import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Key } from 'lucide-react';
import { User as UserType } from '../types';

export default function Profile() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', avatarUrl: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setEditForm({ name: parsedUser.name, avatarUrl: parsedUser.avatarUrl || '' });
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setIsEditing(false);
        // Dispatch event to update App state if needed
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-tighter">My Profile</h1>
          <p className="text-sm font-serif italic opacity-50">Manage your personal account information and security.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 border border-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white border border-[#141414] shadow-[4px_4px_0px_0px_#141414] p-8 space-y-8">
        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-[#141414] flex items-center justify-center overflow-hidden border border-[#141414]">
                {editForm.avatarUrl ? (
                  <img src={editForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-[#E4E3E0] text-3xl font-bold">{user.name[0]}</span>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Avatar URL</label>
                <input 
                  type="url"
                  value={editForm.avatarUrl}
                  onChange={(e) => setEditForm({...editForm, avatarUrl: e.target.value})}
                  className="w-full bg-[#E4E3E0]/20 border border-[#141414] p-2 text-sm focus:outline-none"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Full Name</label>
              <input 
                required
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="w-full bg-[#E4E3E0]/20 border border-[#141414] p-3 text-sm font-bold focus:outline-none"
              />
            </div>
            <div className="flex gap-4">
              <button 
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#141414] text-[#E4E3E0] text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/90 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 border border-[#141414] text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/5"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-[#141414] flex items-center justify-center overflow-hidden border border-[#141414]">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-[#E4E3E0] text-3xl font-bold">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold uppercase tracking-tight">{user.name}</h2>
                <p className="text-sm font-mono opacity-50 uppercase">{user.role}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#141414]/10">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Email Address</label>
                  <div className="flex items-center gap-3 p-3 bg-[#E4E3E0]/20 border border-[#141414]/10">
                    <Mail className="w-4 h-4 opacity-30" />
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">System Role</label>
                  <div className="flex items-center gap-3 p-3 bg-[#E4E3E0]/20 border border-[#141414]/10">
                    <Shield className="w-4 h-4 opacity-30" />
                    <span className="text-sm font-medium uppercase">{user.role}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Account ID</label>
                  <div className="flex items-center gap-3 p-3 bg-[#E4E3E0]/20 border border-[#141414]/10">
                    <User className="w-4 h-4 opacity-30" />
                    <span className="text-xs font-mono">{user.id}</span>
                  </div>
                </div>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-[#141414] text-xs font-bold uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all">
                  <Key className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
