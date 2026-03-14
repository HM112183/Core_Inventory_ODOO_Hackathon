import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Operation, Product, Warehouse, OperationType, User } from '../types';
import { format } from 'date-fns';

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
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    const [opsRes, prodRes, whRes] = await Promise.all([
      fetch('/api/operations', { headers }),
      fetch('/api/products', { headers }),
      fetch('/api/warehouses', { headers })
    ]);
    const ops = await opsRes.json();
    const prods = await prodRes.json();
    const whs = await whRes.json();
    
    setOperations(type === 'history' ? ops : ops.filter((o: Operation) => o.type === opType));
    setProducts(prods);
    setWarehouses(whs);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('/api/operations', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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
          <h1 className="text-4xl font-bold uppercase tracking-tighter">
            {type === 'history' ? 'Stock Ledger' : `${opType} Operations`}
          </h1>
          <p className="text-sm font-serif italic opacity-50">
            {type === 'history' ? 'Full audit trail of all warehouse movements.' : `Manage ${opType.toLowerCase()} documents and stock validation.`}
          </p>
        </div>
        {type !== 'history' && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-6 py-3 font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-colors shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]"
          >
            <Plus className="w-4 h-4" />
            <span>New {opType}</span>
          </button>
        )}
      </div>

      <div className="bg-white border border-[#141414] shadow-[4px_4px_0px_0px_#141414] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#141414] bg-[#141414]/5">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest opacity-50">Reference</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest opacity-50">Date</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest opacity-50">Type</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest opacity-50">Origin/Dest</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest opacity-50">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest opacity-50 text-right">Items</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center font-mono text-xs opacity-50">Retrieving Ledger Data...</td></tr>
            ) : operations.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center font-mono text-xs opacity-50">No operations recorded.</td></tr>
            ) : operations.map((op) => (
              <tr key={op.id} className="border-b border-[#141414]/10 hover:bg-[#141414]/5 transition-colors">
                <td className="px-6 py-4 font-mono text-xs font-bold uppercase">{op.id.slice(0, 8)}</td>
                <td className="px-6 py-4 text-xs font-medium opacity-60">{format(new Date(op.date), 'MMM dd, HH:mm')}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {op.type === 'Receipt' && <ArrowDownLeft className="w-3 h-3 text-green-600" />}
                    {op.type === 'Delivery' && <ArrowUpRight className="w-3 h-3 text-red-600" />}
                    {op.type === 'Internal' && <ArrowLeftRight className="w-3 h-3 text-blue-600" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{op.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-tight">
                      {op.fromWarehouseId ? warehouses.find(w => w.id === op.fromWarehouseId)?.name : 'EXTERNAL'}
                    </span>
                    <span className="text-[10px] opacity-40">→</span>
                    <span className="text-[10px] font-bold uppercase tracking-tight">
                      {op.toWarehouseId ? warehouses.find(w => w.id === op.toWarehouseId)?.name : 'EXTERNAL'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(op.status)}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{op.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-xs font-bold">
                  {op.items.reduce((acc, i) => acc + i.quantity, 0)} Units
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#E4E3E0] border border-[#141414] shadow-[8px_8px_0px_0px_#141414] w-full max-w-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold uppercase tracking-tighter">New {opType} Document</h2>
              <button onClick={() => setShowModal(false)} className="text-sm font-bold uppercase tracking-widest opacity-50 hover:opacity-100">Close</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {opType !== 'Receipt' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Source Location</label>
                    <select 
                      required
                      value={newOp.fromWarehouseId}
                      onChange={(e) => setNewOp({...newOp, fromWarehouseId: e.target.value})}
                      className="w-full bg-white border border-[#141414] p-3 text-sm font-bold focus:outline-none appearance-none"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                )}
                {opType !== 'Delivery' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Destination Location</label>
                    <select 
                      required
                      value={newOp.toWarehouseId}
                      onChange={(e) => setNewOp({...newOp, toWarehouseId: e.target.value})}
                      className="w-full bg-white border border-[#141414] p-3 text-sm font-bold focus:outline-none appearance-none"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40">Line Items</label>
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
                        className="w-full bg-white border border-[#141414] p-3 text-sm font-bold focus:outline-none appearance-none"
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
                      className="w-full bg-white border border-[#141414] p-3 text-sm font-mono focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Operation Description</label>
                <textarea 
                  value={newOp.description}
                  onChange={(e) => setNewOp({...newOp, description: e.target.value})}
                  className="w-full bg-white border border-[#141414] p-3 text-sm font-serif italic focus:outline-none h-20 resize-none"
                  placeholder="Notes for the warehouse staff..."
                />
              </div>

              <div className="flex justify-end gap-4 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-[#141414] text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/5"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-[#141414] text-[#E4E3E0] text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/90"
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
