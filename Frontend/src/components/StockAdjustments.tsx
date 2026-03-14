// Frontend\src\components\StockAdjustments.tsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, CheckCircle2, Download } from 'lucide-react';
import { Stock, Product, Warehouse, User } from '../types';
import { exportToCSV } from '../utils/export';
import { apiFetch } from '../utils/api';

export default function StockAdjustments({ user }: { user: User }) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [newQty, setNewQty] = useState<number>(0);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = () => {
    apiFetch('/api/stock')
      .then(res => res.json())
      .then(data => {
        setStocks(data);
        setLoading(false);
      });
  };

  const handleAdjust = async (stock: Stock) => {
    const res = await apiFetch('/api/operations', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'Adjustment',
        status: 'Done',
        toWarehouseId: stock.warehouseId,
        items: [{ productId: stock.productId, quantity: newQty }],
        description: `Manual adjustment from ${stock.quantity} to ${newQty}`
      })
    });
    if (res.ok) {
      setAdjustingId(null);
      fetchStock();
    }
  };

  const handleExport = () => {
    const exportData = filteredStock.map(s => ({
      Product: s.product?.name,
      SKU: s.product?.sku,
      Warehouse: s.warehouse?.name,
      Quantity: s.quantity
    }));
    exportToCSV(exportData, 'Current_Stock_Report');
  };

  const filteredStock = stocks.filter(s => 
    s.product?.name.toLowerCase().includes(search.toLowerCase()) || 
    s.product?.sku.toLowerCase().includes(search.toLowerCase()) ||
    s.warehouse?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Stock Adjustments</h1>
          <p className="text-slate-500 font-medium">Reconcile physical counts with system records.</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-4 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-900">Critical Operation</p>
          <p className="text-xs text-amber-800/80">Adjustments directly modify the ledger. Ensure physical counts are verified before committing changes.</p>
        </div>
      </div>

      <div className="glass-card p-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by Product or Warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-sm font-semibold text-slate-600"
        >
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Product</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Warehouse</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">System Qty</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Physical Qty</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading Stock Levels...</td></tr>
            ) : filteredStock.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No stock records found.</td></tr>
            ) : filteredStock.map((stock) => (
              <tr key={`${stock.productId}-${stock.warehouseId}`} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{stock.product?.name}</span>
                    <span className="text-xs font-mono text-slate-400">{stock.product?.sku}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{stock.warehouse?.name}</span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-xs font-bold text-slate-900">{stock.quantity}</td>
                <td className="px-6 py-4 text-right">
                  {adjustingId === `${stock.productId}-${stock.warehouseId}` ? (
                    <input 
                      autoFocus
                      type="number"
                      value={newQty}
                      onChange={(e) => setNewQty(parseInt(e.target.value))}
                      className="w-24 input-field text-right font-mono text-xs py-1"
                    />
                  ) : (
                    <span className="font-mono text-xs text-slate-300">---</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {adjustingId === `${stock.productId}-${stock.warehouseId}` ? (
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setAdjustingId(null)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleAdjust(stock)}
                        className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setAdjustingId(`${stock.productId}-${stock.warehouseId}`);
                        setNewQty(stock.quantity);
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                      Adjust
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
