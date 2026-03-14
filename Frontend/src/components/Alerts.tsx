// Frontend\src\components\Alerts.tsx
import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, Package, ArrowRight } from 'lucide-react';
import { apiFetch } from '../utils/api';

interface AlertData {
  lowStock: {
    name: string;
    sku: string;
    total: number;
    reorderLevel: number;
  }[];
  pendingOps: {
    id: string;
    type: string;
    date: string;
    description: string;
  }[];
}

export default function Alerts() {
  const [data, setData] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await apiFetch('/api/alerts');
      const alerts = await res.json();
      setData(alerts);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return <div className="text-center py-12 font-mono text-xs opacity-50 uppercase">Scanning for discrepancies...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Alert Center</h1>
        <p className="text-slate-500 font-medium">Real-time notifications for stock levels and pending operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Low Stock Alerts */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-bold text-slate-900">Critical Stock</h2>
          </div>
          <div className="space-y-3">
            {data?.lowStock.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">All inventory levels optimal.</p>
            ) : data?.lowStock.map((item, i) => (
              <div key={i} className="glass-card p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                  <p className="text-xs font-mono text-slate-400">{item.sku}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-rose-600">{item.total} / {item.reorderLevel}</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current / Reorder</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Operations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">Pending Actions</h2>
          </div>
          <div className="space-y-3">
            {data?.pendingOps.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">No pending operations found.</p>
            ) : data?.pendingOps.map((op, i) => (
              <div key={i} className="glass-card p-4 group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] px-2 py-0.5 bg-slate-900 text-white font-bold uppercase rounded-md">{op.type}</span>
                  <span className="text-xs font-mono text-slate-400">{new Date(op.date).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium text-slate-700 mb-3">{op.description || 'No description provided'}</p>
                <button className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-emerald-600 transition-colors uppercase tracking-widest">
                  <span>Review Operation</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
