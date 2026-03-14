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
  ArrowLeft
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User as UserType, Role } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Operations from './components/Operations';
import StockAdjustments from './components/StockAdjustments';
import Settings from './components/Settings';
import Profile from './components/Profile';

type View = 'dashboard' | 'products' | 'receipts' | 'deliveries' | 'transfers' | 'adjustments' | 'history' | 'settings' | 'profile';
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
    const res = await fetch('/api/auth/login', {
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
    const res = await fetch('/api/auth/signup', {
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
    const res = await fetch('/api/auth/reset-request', {
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
    const res = await fetch('/api/auth/reset-verify', {
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
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white border border-[#141414] shadow-[4px_4px_0px_0px_#141414] p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#141414] uppercase tracking-tight">StockFlow IMS</h1>
            <p className="text-sm text-[#141414]/60 italic font-serif">
              {authMode === 'login' && 'Enter credentials to access the system'}
              {authMode === 'signup' && 'Create a new staff account'}
              {authMode === 'reset-request' && 'Enter email to receive OTP'}
              {authMode === 'reset-verify' && 'Enter OTP and new password'}
            </p>
          </div>

          {error && <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold uppercase tracking-wider">{error}</div>}
          {message && <div className="mb-4 p-2 bg-green-50 border border-green-200 text-green-600 text-[10px] font-bold uppercase tracking-wider">{message}</div>}

          {authMode === 'login' && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold mb-1 opacity-50">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#E4E3E0]/30 border border-[#141414] p-2 focus:outline-none focus:bg-white transition-colors" required />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold mb-1 opacity-50">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#E4E3E0]/30 border border-[#141414] p-2 focus:outline-none focus:bg-white transition-colors" required />
              </div>
              <button type="submit" className="w-full bg-[#141414] text-[#E4E3E0] py-3 font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-colors">Login to System</button>
              <div className="flex justify-between items-center">
                <button type="button" onClick={() => setAuthMode('signup')} className="text-[11px] uppercase tracking-wider font-bold opacity-50 hover:opacity-100">Create Account</button>
                <button type="button" onClick={() => setAuthMode('reset-request')} className="text-[11px] uppercase tracking-wider font-bold opacity-50 hover:opacity-100">Forgot Password?</button>
              </div>
            </form>
          )}

          {authMode === 'signup' && (
            <form className="space-y-4" onSubmit={handleSignup}>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold mb-1 opacity-50">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#E4E3E0]/30 border border-[#141414] p-2 focus:outline-none focus:bg-white transition-colors" required />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold mb-1 opacity-50">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#E4E3E0]/30 border border-[#141414] p-2 focus:outline-none focus:bg-white transition-colors" required />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold mb-1 opacity-50">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#E4E3E0]/30 border border-[#141414] p-2 focus:outline-none focus:bg-white transition-colors" required />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold mb-1 opacity-50">System Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full bg-[#E4E3E0]/30 border border-[#141414] p-2 focus:outline-none focus:bg-white transition-colors">
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-[#141414] text-[#E4E3E0] py-3 font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-colors">Register Account</button>
              <button type="button" onClick={() => setAuthMode('login')} className="w-full text-[11px] uppercase tracking-wider font-bold opacity-50 hover:opacity-100 flex items-center justify-center gap-2"><ArrowLeft className="w-3 h-3" /> Back to Login</button>
            </form>
          )}

          {authMode === 'reset-request' && (
            <form className="space-y-4" onSubmit={handleResetRequest}>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold mb-1 opacity-50">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#E4E3E0]/30 border border-[#141414] p-2 focus:outline-none focus:bg-white transition-colors" required />
              </div>
              <button type="submit" className="w-full bg-[#141414] text-[#E4E3E0] py-3 font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-colors">Request OTP</button>
              <button type="button" onClick={() => setAuthMode('login')} className="w-full text-[11px] uppercase tracking-wider font-bold opacity-50 hover:opacity-100 flex items-center justify-center gap-2"><ArrowLeft className="w-3 h-3" /> Back to Login</button>
            </form>
          )}

          {authMode === 'reset-verify' && (
            <form className="space-y-4" onSubmit={handleResetVerify}>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold mb-1 opacity-50">OTP Code</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-[#E4E3E0]/30 border border-[#141414] p-2 focus:outline-none focus:bg-white transition-colors font-mono tracking-[0.5em] text-center" maxLength={6} required />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold mb-1 opacity-50">New Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#E4E3E0]/30 border border-[#141414] p-2 focus:outline-none focus:bg-white transition-colors" required />
              </div>
              <button type="submit" className="w-full bg-[#141414] text-[#E4E3E0] py-3 font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-colors">Reset Password</button>
              <button type="button" onClick={() => setAuthMode('login')} className="w-full text-[11px] uppercase tracking-wider font-bold opacity-50 hover:opacity-100 flex items-center justify-center gap-2"><ArrowLeft className="w-3 h-3" /> Back to Login</button>
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
    { id: 'settings', label: 'Settings', icon: SettingsIcon, roles: ['Admin'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex font-sans text-[#141414]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#141414] flex flex-col bg-white">
        <div className="p-6 border-bottom border-[#141414]">
          <h1 className="text-xl font-bold uppercase tracking-tighter">StockFlow</h1>
          <p className="text-[10px] opacity-50 uppercase font-mono">v1.0.4-stable</p>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all group",
                currentView === item.id 
                  ? "bg-[#141414] text-[#E4E3E0]" 
                  : "hover:bg-[#141414]/5"
              )}
            >
              <item.icon className={cn("w-4 h-4", currentView === item.id ? "text-[#E4E3E0]" : "opacity-50 group-hover:opacity-100")} />
              <span className="uppercase tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#141414] space-y-2">
          <button 
            onClick={() => setCurrentView('profile')}
            className={cn(
              "w-full px-4 py-2 text-left transition-all hover:bg-[#141414]/5 group",
              currentView === 'profile' && "bg-[#141414]/5"
            )}
          >
            <p className="text-[9px] uppercase font-bold opacity-30">Logged in as</p>
            <p className="text-xs font-bold uppercase truncate group-hover:text-[#141414]">{user.name}</p>
            <p className="text-[9px] font-mono opacity-50">{user.role}</p>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="uppercase tracking-wide">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#141414] bg-white flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest opacity-50">
              {currentView === 'profile' ? 'My Profile' : navItems.find(n => n.id === currentView)?.label}
            </h2>
            <div className="h-4 w-[1px] bg-[#141414]/20" />
            <p className="text-[11px] font-serif italic opacity-40">System Status: Operational</p>
          </div>
          <button 
            onClick={() => setCurrentView('profile')}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity"
          >
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-bold uppercase tracking-wider">{user.name}</span>
              <span className="text-[9px] opacity-50 uppercase font-mono">{user.role}</span>
            </div>
            <div className="w-8 h-8 bg-[#141414] flex items-center justify-center text-[#E4E3E0] font-bold text-xs">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'products' && <Products user={user} />}
          {(currentView === 'receipts' || currentView === 'deliveries' || currentView === 'transfers' || currentView === 'history') && (
            <Operations type={currentView} user={user} />
          )}
          {currentView === 'adjustments' && <StockAdjustments user={user} />}
          {currentView === 'settings' && user.role === 'Admin' && <Settings />}
          {currentView === 'profile' && <Profile />}
        </div>
      </main>
    </div>
  );
}
