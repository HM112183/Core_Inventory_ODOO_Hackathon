// Frontend\src\components\Operations.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, CheckCircle2, Clock, XCircle, Download } from 'lucide-react';
import { Operation, Product, Warehouse, OperationType, User } from '../types';
import { format } from 'date-fns';
import { exportToCSV } from '../utils/export';
import { apiFetch } from '../utils/api';

export default function Operations({ type, user }: { type: string, user: User }) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newOp, setNewOp] = useState<Partial<Operation>>({
    type: 'Receipt',
    status: 'Done',
    items: [{ productId: '', quantity: 0 }],
    description: ''
  });

  const opType: OperationType = 
    type === 'receipts' ? 'Receipt' : 
    type === 'deliveries' ? 'Delivery' : 
    type === 'transfers' ? 'Internal' : 'Adjustment';

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    setLoading(true);
    const [opsRes, prodRes, whRes] = await Promise.all([
      apiFetch('/api/operations'),
      apiFetch('/api/products'),
      apiFetch('/api/warehouses')
    ]);
    const ops = await opsRes.json();
    const prods = await prodRes.json();
    const whs = await whRes.json();
    
    setOperations(type === 'history' ? ops : ops.filter((o: Operation) => o.type === opType));
    setProducts(prods);
    setWarehouses(whs);
    setLoading(false);
  };

  const handleExport = () => {
    const exportData = operations.map(op => ({
      ID: op.id,
      Type: op.type,
      Status: op.status,
      Date: new Date(op.date).toLocaleDateString(),
      From: warehouses.find(w => w.id === op.fromWarehouseId)?.name || '-',
      To: warehouses.find(w => w.id === op.toWarehouseId)?.name || '-',
      Items: op.items.map(i => `${products.find(p => p.id === i.productId)?.name} (${i.quantity})`).join('; '),
      Description: op.description || ''
    }));
    exportToCSV(exportData, `Operations_${type}`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/operations', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...newOp, type: opType })
    });
    if (res.ok) {
      setShowModal(false);
      fetchData();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Done': return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case 'Waiting': return <Clock className="w-3 h-3 text-orange-600" />;
      case 'Canceled': return <XCircle className="w-3 h-3 text-red-600" />;
      default: return <Clock className="w-3 h-3 opacity-40" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            {type === 'history' ? 'Stock Ledger' : `${opType} Operations`}
          </h1>
          <p className="text-slate-500 font-medium">
            {type === 'history' ? 'Full audit trail of all warehouse movements.' : `Manage ${opType.toLowerCase()} documents and stock validation.`}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-sm font-semibold text-slate-600"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          {type !== 'history' && (
            <button 
              onClick={() => setShowModal(true)}
              className="modern-button bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
            >
              <Plus className="w-4 h-4" />
              <span>New {opType}</span>
            </button>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Reference</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Origin/Dest</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Items</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Retrieving Ledger Data...</td></tr>
            ) : operations.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No operations recorded.</td></tr>
            ) : operations.map((op) => (
              <tr key={op.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600 uppercase">{op.id.slice(0, 8)}</td>
                <td className="px-6 py-4 text-xs font-medium text-slate-500">{format(new Date(op.date), 'MMM dd, HH:mm')}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {op.type === 'Receipt' && <ArrowDownLeft className="w-4 h-4 text-emerald-600" />}
                    {op.type === 'Delivery' && <ArrowUpRight className="w-4 h-4 text-rose-600" />}
                    {op.type === 'Internal' && <ArrowLeftRight className="w-4 h-4 text-blue-600" />}
                    <span className="text-xs font-bold text-slate-700 uppercase">{op.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">
                      {op.fromWarehouseId ? warehouses.find(w => w.id === op.fromWarehouseId)?.name : 'EXTERNAL'}
                    </span>
                    <span className="text-[10px] text-slate-400">→</span>
                    <span className="text-xs font-bold text-slate-900">
                      {op.toWarehouseId ? warehouses.find(w => w.id === op.toWarehouseId)?.name : 'EXTERNAL'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(op.status)}
                    <span className="text-xs font-bold text-slate-700 uppercase">{op.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-xs font-bold text-slate-900">
                  {op.items.reduce((acc, i) => acc + i.quantity, 0)} Units
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">New {opType} Document</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {opType !== 'Receipt' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Source Location</label>
                    <select 
                      required
                      value={newOp.fromWarehouseId}
                      onChange={(e) => setNewOp({...newOp, fromWarehouseId: e.target.value})}
                      className="input-field"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                )}
                {opType !== 'Delivery' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Destination Location</label>
                    <select 
                      required
                      value={newOp.toWarehouseId}
                      onChange={(e) => setNewOp({...newOp, toWarehouseId: e.target.value})}
                      className="input-field"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Line Items</label>
                {newOp.items?.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <select 
                        required
                        value={item.productId}
                        onChange={(e) => {
                          const items = [...(newOp.items || [])];
                          items[idx].productId = e.target.value;
                          setNewOp({...newOp, items});
                        }}
                        className="input-field"
                      >
                        <option value="">Select Product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                      </select>
                    </div>
                    <input 
                      required
                      type="number" 
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        const items = [...(newOp.items || [])];
                        items[idx].quantity = parseInt(e.target.value);
                        setNewOp({...newOp, items});
                      }}
                      className="input-field font-mono"
                    />
                  </div>
                ))}
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Operation Description</label>
                <textarea 
                  value={newOp.description}
                  onChange={(e) => setNewOp({...newOp, description: e.target.value})}
                  className="input-field h-20 resize-none"
                  placeholder="Notes for the warehouse staff..."
                />
              </div>

              <div className="flex justify-end gap-4 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="modern-button bg-slate-900 text-white hover:bg-slate-800"
                >
                  Validate & Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
