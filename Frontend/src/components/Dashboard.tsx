// Frontend\src\components\Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Package, AlertTriangle, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { DashboardStats } from '../types';
import { apiFetch } from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/dashboard')
      .then(async res => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Error ${res.status}: Failed to fetch dashboard stats`);
        }
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="animate-pulse font-mono uppercase text-xs opacity-50 text-[#141414]">Loading System Metrics...</div>;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-8 shadow-[4px_4px_0px_0px_rgba(220,38,38,0.2)]">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-xl font-bold uppercase tracking-tighter">System Error</h2>
        </div>
        <p className="text-sm font-mono text-red-600/80 mb-6">{error}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.reload();
            }}
            className="px-6 py-2 border border-red-600 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-colors"
          >
            Logout & Reset
          </button>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Products', value: stats?.totalProducts ?? 0, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Stock Units', value: stats?.totalStock ?? 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Low Stock Items', value: stats?.lowStockItems ?? 0, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Pending Receipts', value: stats?.pendingReceipts ?? 0, icon: ArrowDownLeft, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Pending Deliveries', value: stats?.pendingDeliveries ?? 0, icon: ArrowUpRight, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  const chartData = [
    { name: 'Mon', receipts: 4, deliveries: 2 },
    { name: 'Tue', receipts: 3, deliveries: 5 },
    { name: 'Wed', receipts: 2, deliveries: 3 },
    { name: 'Thu', receipts: 6, deliveries: 4 },
    { name: 'Fri', receipts: 8, deliveries: 6 },
    { name: 'Sat', receipts: 1, deliveries: 1 },
    { name: 'Sun', receipts: 0, deliveries: 0 },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Inventory Overview</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time operational snapshot of global stock movements.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Updates Enabled</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className={`w-12 h-12 ${kpi.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{kpi.value.toLocaleString()}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Weekly Movement Trends</h3>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receipts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-200 rounded-full" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deliveries</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Bar dataKey="receipts" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="deliveries" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Alerts</h3>
            <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold uppercase rounded-md">3 Active</span>
          </div>
          <div className="flex-1 space-y-6">
            {[
              { type: 'Low Stock', item: 'Steel Rods', msg: 'Stock below reorder level (20)', time: '2h ago', color: 'text-rose-600', bg: 'bg-rose-50' },
              { type: 'Delayed', item: 'PO-9921', msg: 'Receipt expected 2 days ago', time: '5h ago', color: 'text-amber-600', bg: 'bg-amber-50' },
              { type: 'System', item: 'Backup', msg: 'Daily ledger backup successful', time: '12h ago', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map((alert, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 ${alert.bg} ${alert.color} text-[9px] font-bold uppercase rounded-lg tracking-wider`}>{alert.type}</span>
                  <span className="text-[10px] font-medium text-slate-400">{alert.time}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{alert.item}</p>
                <p className="text-xs text-slate-500 mt-0.5">{alert.msg}</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-3 bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">
            View All Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
