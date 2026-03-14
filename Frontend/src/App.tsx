// Frontend\src\App.tsx
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Settings as SettingsIcon, 
  User, 
  LogOut,
  AlertTriangle,
  History,
  Plus,
  ArrowLeft,
  Bell
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User as UserType, Role } from './types';
import { apiFetch } from './utils/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Operations from './components/Operations';
import StockAdjustments from './components/StockAdjustments';
import Settings from './components/Settings';
import Profile from './components/Profile';
import Alerts from './components/Alerts';

type View = 'dashboard' | 'products' | 'receipts' | 'deliveries' | 'transfers' | 'adjustments' | 'history' | 'settings' | 'profile' | 'alerts';
type AuthMode = 'login' | 'signup' | 'reset-request' | 'reset-verify';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('Staff');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } else {
      setError(data.error);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await apiFetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role })
    });
    const data = await res.json();
    if (res.ok) {
      setAuthMode('login');
      setMessage('Account created successfully. Please login.');
    } else {
      setError(data.error);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await apiFetch('/api/auth/reset-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (res.ok) {
      setAuthMode('reset-verify');
      setMessage(data.message);
    } else {
      setError(data.error);
    }
  };

  const handleResetVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await apiFetch('/api/auth/reset-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: otp, newPassword: password })
    });
    const data = await res.json();
    if (res.ok) {
      setAuthMode('login');
      setMessage('Password reset successful.');
    } else {
      setError(data.error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setCurrentView('dashboard');
    window.location.reload(); // Force reload to clear all states
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-10">
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">StockFlow</h1>
            <p className="text-slate-500 font-medium">
              {authMode === 'login' && 'Welcome back to the system'}
              {authMode === 'signup' && 'Create your staff account'}
              {authMode === 'reset-request' && 'Password recovery'}
              {authMode === 'reset-verify' && 'Verify your identity'}
            </p>
          </div>

          {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl animate-in fade-in slide-in-from-top-2">{error}</div>}
          {message && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold rounded-xl animate-in fade-in slide-in-from-top-2">{message}</div>}

          {authMode === 'login' && (
            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="name@company.com" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
              </div>
              <button type="submit" className="w-full modern-button py-4 text-sm tracking-wide shadow-lg shadow-emerald-100">Sign In</button>
              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={() => setAuthMode('signup')} className="text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors">Create Account</button>
                <button type="button" onClick={() => setAuthMode('reset-request')} className="text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors">Forgot Password?</button>
              </div>
            </form>
          )}

          {authMode === 'signup' && (
            <form className="space-y-5" onSubmit={handleSignup}>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="John Doe" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="name@company.com" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">System Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="input-field appearance-none">
                  <option value="Staff">Staff Member</option>
                  <option value="Manager">Warehouse Manager</option>
                  <option value="Admin">System Administrator</option>
                </select>
              </div>
              <button type="submit" className="w-full modern-button py-4 text-sm tracking-wide shadow-lg shadow-emerald-100">Create Account</button>
              <button type="button" onClick={() => setAuthMode('login')} className="w-full text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2 pt-2"><ArrowLeft className="w-3 h-3" /> Back to Login</button>
            </form>
          )}

          {authMode === 'reset-request' && (
            <form className="space-y-5" onSubmit={handleResetRequest}>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="name@company.com" required />
              </div>
              <button type="submit" className="w-full modern-button py-4 text-sm tracking-wide shadow-lg shadow-emerald-100">Send Reset Code</button>
              <button type="button" onClick={() => setAuthMode('login')} className="w-full text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2 pt-2"><ArrowLeft className="w-3 h-3" /> Back to Login</button>
            </form>
          )}

          {authMode === 'reset-verify' && (
            <form className="space-y-5" onSubmit={handleResetVerify}>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Verification Code</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="input-field text-center font-mono tracking-[0.5em] text-lg" maxLength={6} placeholder="000000" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
              </div>
              <button type="submit" className="w-full modern-button py-4 text-sm tracking-wide shadow-lg shadow-emerald-100">Update Password</button>
              <button type="button" onClick={() => setAuthMode('login')} className="w-full text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2 pt-2"><ArrowLeft className="w-3 h-3" /> Back to Login</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Staff'] },
    { id: 'products', label: 'Products', icon: Package, roles: ['Admin', 'Manager', 'Staff'] },
    { id: 'receipts', label: 'Receipts', icon: ArrowDownLeft, roles: ['Admin', 'Manager', 'Staff'] },
    { id: 'deliveries', label: 'Deliveries', icon: ArrowUpRight, roles: ['Admin', 'Manager', 'Staff'] },
    { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight, roles: ['Admin', 'Manager', 'Staff'] },
    { id: 'adjustments', label: 'Adjustments', icon: AlertTriangle, roles: ['Admin', 'Manager'] },
    { id: 'history', label: 'Move History', icon: History, roles: ['Admin', 'Manager'] },
    { id: 'alerts', label: 'Alert Center', icon: Bell, roles: ['Admin', 'Manager', 'Staff'] },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, roles: ['Admin'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-200 flex flex-col bg-white/80 backdrop-blur-xl z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/50">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">StockFlow</h1>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Enterprise IMS</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-2xl transition-all group relative overflow-hidden",
                currentView === item.id 
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-4 h-4", currentView === item.id ? "text-emerald-400" : "opacity-60 group-hover:opacity-100 group-hover:text-emerald-600")} />
              <span className="tracking-tight">{item.label}</span>
              {currentView === item.id && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl shadow-slate-300">
            <button 
              onClick={() => setCurrentView('profile')}
              className="w-full flex items-center gap-3 text-left group mb-6"
            >
              <div className="w-12 h-12 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-sm font-bold text-emerald-400">{user.name.split(' ').map(n => n[0]).join('')}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest">{user.role}</p>
              </div>
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-white bg-white/10 rounded-xl hover:bg-white/20 transition-all border border-white/5"
            >
              <LogOut className="w-3.5 h-3.5 text-emerald-400" />
              <span className="uppercase tracking-widest">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white/60 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                {currentView === 'profile' ? 'My Profile' : navItems.find(n => n.id === currentView)?.label}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">System Management</p>
            </div>
            <div className="h-8 w-[1px] bg-slate-100 mx-2" />
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">Live</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-slate-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-[1px] bg-slate-100" />
            <button 
              onClick={() => setCurrentView('profile')}
              className="flex items-center gap-3 pl-2 group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</p>
              </div>
              <div className="w-11 h-11 bg-white rounded-2xl border-2 border-slate-50 shadow-sm overflow-hidden group-hover:border-emerald-200 transition-all">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-emerald-600 bg-emerald-50 font-bold text-sm">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'products' && <Products user={user} />}
            {(currentView === 'receipts' || currentView === 'deliveries' || currentView === 'transfers' || currentView === 'history') && (
              <Operations type={currentView} user={user} />
            )}
            {currentView === 'adjustments' && <StockAdjustments user={user} />}
            {currentView === 'alerts' && <Alerts />}
            {currentView === 'settings' && user.role === 'Admin' && <Settings />}
            {currentView === 'profile' && <Profile />}
          </div>
        </div>
      </main>
    </div>
  );
}
