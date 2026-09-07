import React, { useState } from 'react';
import { X, Tag, Plus, Trash2, Edit3 } from 'lucide-react';
import { createCategory, deleteCategory } from '../services/api';

export default function CategoriesModal({ isOpen, onClose, categories = [], onCategoryChanged }) {
  const [name, setName] = useState('');
  const [trackType, setTrackType] = useState('Serialized');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      await createCategory({ name: name.trim(), track_type: trackType });
      setName('');
      if (onCategoryChanged) onCategoryChanged();
    } catch (err) {
      alert('Failed to add category: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId, catName) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      return;
    }
    try {
      await deleteCategory(categoryId);
      if (onCategoryChanged) onCategoryChanged();
    } catch (err) {
      alert('Failed to delete category: ' + err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Tag size={20} color="#00838f" />
            <div>
              <h3 className="modal-title">Category Management</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Create & delete inventory categories</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Add Category Form */}
          <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 90px', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div>
                <label className="form-label" style={{ marginBottom: 4 }}>Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Watches"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '0.75rem' }}
                />
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 4 }}>Track Type</label>
                <select
                  className="form-input"
                  value={trackType}
                  onChange={(e) => setTrackType(e.target.value)}
                  style={{ paddingLeft: '0.5rem' }}
                >
                  <option value="Serialized">Serialized</option>
                  <option value="Bulk">Bulk</option>
                </select>
              </div>
              <button type="submit" className="btn-primary-teal" disabled={submitting} style={{ height: '38px', padding: '0 0.5rem', justifyContent: 'center' }}>
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>
          </form>

          {/* Existing Categories List */}
          <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>Active Categories ({categories.length})</h4>
          <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            {categories.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No categories created yet.</div>
            ) : (
              categories.map(c => (
                <div
                  key={c.category_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.85rem',
                    borderBottom: '1px solid #f1f5f9'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>{c.name}</span>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', background: '#e0f2f1', color: '#00838f', padding: '0.15rem 0.4rem', borderRadius: 4, fontWeight: 700 }}>
                      {c.track_type}
                    </span>
                  </div>
                  <button
                    title="Delete Category"
                    onClick={() => handleDelete(c.category_id, c.name)}
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '0.3rem 0.45rem', cursor: 'pointer' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
