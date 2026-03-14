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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="animate-pulse font-mono uppercase text-xs opacity-50">Loading System Metrics...</div>;

  const kpis = [
    { label: 'Total Products', value: stats?.totalProducts, icon: Package, color: 'text-blue-600' },
    { label: 'Total Stock', value: stats?.totalStock, icon: Package, color: 'text-green-600' },
    { label: 'Low Stock Items', value: stats?.lowStockItems, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Pending Receipts', value: stats?.pendingReceipts, icon: ArrowDownLeft, color: 'text-orange-600' },
    { label: 'Pending Deliveries', value: stats?.pendingDeliveries, icon: ArrowUpRight, color: 'text-purple-600' },
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
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-tighter">Inventory Overview</h1>
          <p className="text-sm font-serif italic opacity-50">Real-time operational snapshot of global stock movements.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold opacity-40">Last Updated</p>
          <p className="text-xs font-mono">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_#141414] group hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              <span className="text-[10px] uppercase font-bold opacity-30">Metric {idx + 1}</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tighter">{kpi.value}</p>
              <p className="text-[11px] uppercase font-bold opacity-50 tracking-wider">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_#141414]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold uppercase tracking-tight">Weekly Movement Trends</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#141414]" />
                <span className="text-[10px] uppercase font-bold opacity-50">Receipts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#141414]/30" />
                <span className="text-[10px] uppercase font-bold opacity-50">Deliveries</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#14141450' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#14141450' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#14141405' }}
                  contentStyle={{ 
                    backgroundColor: '#141414', 
                    border: 'none', 
                    color: '#E4E3E0',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}
                />
                <Bar dataKey="receipts" fill="#141414" radius={[2, 2, 0, 0]} />
                <Bar dataKey="deliveries" fill="#14141440" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_#141414] flex flex-col">
          <h3 className="text-lg font-bold uppercase tracking-tight mb-6">Recent Alerts</h3>
          <div className="flex-1 space-y-4">
            {[
              { type: 'Low Stock', item: 'Steel Rods', msg: 'Stock below reorder level (20)', time: '2h ago' },
              { type: 'Delayed', item: 'PO-9921', msg: 'Receipt expected 2 days ago', time: '5h ago' },
              { type: 'System', item: 'Backup', msg: 'Daily ledger backup successful', time: '12h ago' },
            ].map((alert, i) => (
              <div key={i} className="border-b border-[#141414]/10 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">{alert.type}</span>
                  <span className="text-[9px] font-mono opacity-40">{alert.time}</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-tight">{alert.item}</p>
                <p className="text-[11px] opacity-60">{alert.msg}</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 border border-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors">
            View All Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
