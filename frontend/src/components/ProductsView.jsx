import React, { useState } from 'react';
import { Box, Plus, Search, Filter, Edit3, Trash2, X } from 'lucide-react';
import { updateProduct, deleteProduct } from '../services/api';

export default function ProductsView({
  products = [],
  categories = [],
  onOpenAddProduct,
  onProductUpdated,
  onDeleteProduct,
  onRefresh
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const filtered = products.filter(p => {
    const matchesSearch =
      p.brand?.toLowerCase().includes(search.toLowerCase()) ||
      p.model?.toLowerCase().includes(search.toLowerCase()) ||
      p.imei_barcode?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || String(p.category_id) === String(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setEditForm({
      brand: p.brand || '',
      model: p.model || '',
      imei_barcode: p.imei_barcode || '',
      purchase_price: p.purchase_price || '',
      selling_price: p.selling_price || '',
      stock_quantity: p.stock_quantity ?? 1,
      status: p.status || 'In Stock',
      category_id: p.category_id || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const updated = await updateProduct(editingProduct.product_id, editForm);
      setEditingProduct(null);
      if (onProductUpdated) onProductUpdated(updated);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to update product: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
      return;
    }
    try {
      if (onDeleteProduct) onDeleteProduct(productId);
      await deleteProduct(productId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to delete product: ' + err.message);
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="content-body">
      <div className="dashboard-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Product Master & Inventory</h3>
            <p className="card-subtitle">Manage Serialized (IMEI) and Bulk Mobile Accessories</p>
          </div>
          <button className="btn-primary-teal" onClick={onOpenAddProduct}>
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
          <div className="input-with-icon" style={{ flex: 1, maxWidth: 380 }}>
            <Search className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by Brand, Model or IMEI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#64748b" />
            <select
              className="form-input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ paddingLeft: '0.75rem', width: '200px' }}
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>BRAND & MODEL</th>
                <th>CATEGORY</th>
                <th>IMEI / BARCODE</th>
                <th style={{ textAlign: 'right' }}>PURCHASE</th>
                <th style={{ textAlign: 'right' }}>SELLING</th>
                <th style={{ textAlign: 'center' }}>STOCK</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'center', width: 100 }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No products match the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.product_id}>
                    <td>
                      <div className="table-item-name">{p.brand} {p.model}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.color || 'Standard'}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: 6 }}>
                        {p.categories?.name || 'General'}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        const isMob = p.categories?.track_type === 'Serialized' ||
                          p.categories?.name?.toLowerCase().includes('phone') ||
                          p.categories?.name?.toLowerCase().includes('mobile');
                        return (
                          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: isMob ? '#0f766e' : '#64748b' }}>
                              {isMob ? (p.imei_barcode?.includes(',') ? 'DUAL IMEI' : 'IMEI') : 'BARCODE'}
                            </span>
                            <code style={{ fontSize: '0.78rem', background: '#f8fafc', padding: '0.2rem 0.4rem', borderRadius: 4, border: '1px solid #e2e8f0', color: '#0f172a' }}>
                              {p.imei_barcode || 'N/A'}
                            </code>
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ textAlign: 'right', color: '#64748b' }}>
                      Rs {Number(p.purchase_price || 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#00897b' }}>
                      Rs {Number(p.selling_price || 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: 20,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: p.stock_quantity > 0 ? '#e0f2f1' : '#fee2e2',
                        color: p.stock_quantity > 0 ? '#00838f' : '#dc2626'
                      }}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-status ${p.status === 'In Stock' ? 'repaired' : p.status === 'Sold' ? 'delivered' : 'pending'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="table-action-btn edit"
                          title="Edit Product"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="table-action-btn delete"
                          title="Delete Product"
                          onClick={() => handleDelete(p.product_id, `${p.brand} ${p.model}`)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Edit3 size={20} color="#00838f" />
                <h3 className="modal-title">Edit Product</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setEditingProduct(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={editForm.brand}
                      onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={editForm.model}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">IMEI / Barcode</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.imei_barcode}
                    onChange={(e) => setEditForm({ ...editForm, imei_barcode: e.target.value })}
                    style={{ paddingLeft: '0.75rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Purchase Price (Rs)</label>
                    <input
                      type="number"
                      required
                      className="form-input"
                      value={editForm.purchase_price}
                      onChange={(e) => setEditForm({ ...editForm, purchase_price: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Selling Price (Rs)</label>
                    <input
                      type="number"
                      required
                      className="form-input"
                      value={editForm.selling_price}
                      onChange={(e) => setEditForm({ ...editForm, selling_price: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editForm.stock_quantity}
                      onChange={(e) => setEditForm({ ...editForm, stock_quantity: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-input"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Sold">Sold</option>
                      <option value="Reserved">Reserved</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingProduct(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-teal" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
