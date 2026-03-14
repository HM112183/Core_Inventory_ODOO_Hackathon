// Frontend\src\components\Products.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Product, User } from '../types';
import { apiFetch } from '../utils/api';

export default function Products({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: 'Raw Materials',
    uom: 'Units',
    reorderLevel: 0,
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    apiFetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const res = await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      } else {
        const errorText = await res.text();
        alert('Failed to delete product. ' + errorText);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const url = isEditing ? `/api/products/${selectedProduct!.id}` : '/api/products';
    const method = isEditing ? 'PUT' : 'POST';
    const res = await apiFetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newProduct)
    });
    if (res.ok) {
      setShowModal(false);
      fetchProducts();
      setNewProduct({ name: '', sku: '', category: 'Raw Materials', uom: 'Units', reorderLevel: 0, description: '' });
      setIsEditing(false);
      setSelectedProduct(null);
    } else {
      setError(`Failed to ${isEditing ? 'update' : 'create'} product. Please try again.`);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Product Catalog</h1>
          <p className="text-slate-500 font-medium">Manage your master product list and reordering rules.</p>
        </div>
        {user.role !== 'Staff' && (
          <button 
            onClick={() => {
              setShowModal(true);
              setIsEditing(false);
              setSelectedProduct(null);
              setNewProduct({ name: '', sku: '', category: 'Raw Materials', uom: 'Units', reorderLevel: 0, description: '' });
            }}
            className="modern-button bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by SKU or Product Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-600">
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">SKU Code</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Product Name</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">UOM</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Reorder Lvl</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Synchronizing Catalog...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No products found in system.</td></tr>
            ) : filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{product.sku}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{product.name}</span>
                    <span className="text-xs text-slate-400 truncate max-w-[200px]">{product.description}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-500">{product.uom}</td>
                <td className="px-6 py-4 text-right font-mono text-xs font-bold text-slate-900">{product.reorderLevel}</td>
                <td className="px-6 py-4 text-right">
                  {user.role !== 'Staff' && (
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setSelectedProduct(product);
                          setNewProduct(product);
                          setIsEditing(true);
                          setShowModal(true);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                        aria-label="Edit product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors"
                        aria-label="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{isEditing ? 'Edit Product' : 'Register New Product'}</h2>
              <button onClick={() => { setShowModal(false); setIsEditing(false); setSelectedProduct(null); setError(''); }} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close modal">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Product Name</label>
                <input 
                  required
                  type="text" 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="input-field"
                  placeholder="e.g. Industrial Steel Beam"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">SKU Code</label>
                <input 
                  required
                  type="text" 
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                  className="input-field font-mono"
                  placeholder="SKU-XXX-000"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                <select 
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  className="input-field"
                  aria-label="Category"
                >
                  <option>Raw Materials</option>
                  <option>Finished Goods</option>
                  <option>Furniture</option>
                  <option>Electronics</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unit of Measure</label>
                <input 
                  required
                  type="text" 
                  value={newProduct.uom}
                  onChange={(e) => setNewProduct({...newProduct, uom: e.target.value})}
                  className="input-field"
                  placeholder="Units, kg, meters..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reorder Level</label>
                <input 
                  required
                  type="number" 
                  value={newProduct.reorderLevel || ''}
                  onChange={(e) => setNewProduct({...newProduct, reorderLevel: e.target.value === '' ? 0 : parseInt(e.target.value) || 0})}
                  className="input-field font-mono"
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="input-field h-24 resize-none"
                  placeholder="Optional technical specifications..."
                />
              </div>
              <div className="col-span-2 flex justify-end gap-4 mt-4">
                <button 
                  type="button"
                  onClick={() => { setShowModal(false); setIsEditing(false); setSelectedProduct(null); setError(''); }}
                  className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="modern-button bg-slate-900 text-white hover:bg-slate-800"
                >
                  {isEditing ? 'Update Product' : 'Commit to Catalog'}
                </button>
              </div>
              {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
