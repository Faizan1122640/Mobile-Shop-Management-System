import React, { useState } from 'react';
import { Truck, Plus, Search, Phone, User, Building2, X, Edit3, Trash2, AlertCircle } from 'lucide-react';
import { createSupplier, updateSupplier, deleteSupplier } from '../services/api';
import { validatePhone, validateRequired } from '../utils/validators';

export default function SuppliersView({
  suppliers = [],
  onSupplierAdded,
  onSupplierUpdated,
  onDeleteSupplier
}) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: ''
  });

  const filtered = suppliers.filter(s =>
    s.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

  const handlePhoneChange = (val, isEdit = false) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 11);
    if (isEdit) {
      setEditForm(prev => ({ ...prev, phone: cleaned }));
      setEditErrors(prev => ({ ...prev, phone: validatePhone(cleaned, false) }));
    } else {
      setFormData(prev => ({ ...prev, phone: cleaned }));
      setErrors(prev => ({ ...prev, phone: validatePhone(cleaned, false) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameErr = validateRequired(formData.company_name, 'Company name');
    const phoneErr = validatePhone(formData.phone, true);

    if (nameErr || phoneErr) {
      setErrors({ company_name: nameErr, phone: phoneErr });
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});
      const newSup = await createSupplier(formData);
      setFormData({ company_name: '', contact_person: '', phone: '' });
      setIsModalOpen(false);
      if (onSupplierAdded) onSupplierAdded(newSup);
    } catch (err) {
      alert(err.message || 'Failed to add supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (s) => {
    setEditingSupplier(s);
    setEditForm({
      company_name: s.company_name || '',
      contact_person: s.contact_person || '',
      phone: s.phone || ''
    });
    setEditErrors({});
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const nameErr = validateRequired(editForm.company_name, 'Company name');
    const phoneErr = validatePhone(editForm.phone, true);

    if (nameErr || phoneErr) {
      setEditErrors({ company_name: nameErr, phone: phoneErr });
      return;
    }

    try {
      setSubmitting(true);
      setEditErrors({});
      const updated = await updateSupplier(editingSupplier.supplier_id, editForm);
      setEditingSupplier(null);
      if (onSupplierUpdated) onSupplierUpdated(updated);
    } catch (err) {
      alert('Failed to update supplier: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (supplierId, name) => {
    if (!window.confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      return;
    }
    try {
      await deleteSupplier(supplierId);
      if (onDeleteSupplier) {
        onDeleteSupplier(supplierId);
      }
    } catch (err) {
      alert('Failed to delete supplier: ' + err.message);
    }
  };

  return (
    <div className="content-body">
      <div className="dashboard-card">
        {/* Header with Title and Add Button */}
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Suppliers Directory</h3>
            <p className="card-subtitle">Manage wholesale mobile distributors, accessories vendors & suppliers</p>
          </div>
          <button className="btn-primary-teal" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Add New Supplier</span>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
          <div className="input-with-icon" style={{ flex: 1, maxWidth: 380 }}>
            <Search className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by Company, Contact Person, or Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>COMPANY NAME</th>
                <th>CONTACT PERSON</th>
                <th>PHONE NUMBER</th>
                <th style={{ textAlign: 'center', width: 140 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    No suppliers found matching "{search}".
                  </td>
                </tr>
              ) : (
                filtered.map((s, idx) => (
                  <tr key={s.supplier_id || idx}>
                    <td className="table-idx">{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: '#e0f2f1',
                          color: '#00838f',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700
                        }}>
                          <Building2 size={16} />
                        </div>
                        <span className="table-item-name" style={{ fontSize: '0.92rem' }}>{s.company_name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#475569' }}>
                        <User size={14} color="#94a3b8" />
                        <span>{s.contact_person || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#00897b', fontWeight: 600 }}>
                        <Phone size={14} color="#00897b" />
                        <span>{s.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {s.phone && (
                          <a
                            href={`tel:${s.phone}`}
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', textDecoration: 'none' }}
                          >
                            Call
                          </a>
                        )}
                        <button
                          className="table-action-btn edit"
                          title="Edit Supplier"
                          onClick={() => handleOpenEdit(s)}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="table-action-btn delete"
                          title="Delete Supplier"
                          onClick={() => handleDelete(s.supplier_id, s.company_name)}
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

      {/* Add New Supplier Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Building2 size={18} color="#00838f" />
                <div>
                  <h3 className="modal-title">Add New Supplier</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Register wholesale vendor for mobile inventory</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Company / Business Name *</label>
                  <input
                    type="text"
                    className={`form-input ${errors.company_name ? 'input-error' : ''}`}
                    placeholder="e.g. Falcon Cellular Traders"
                    value={formData.company_name}
                    onChange={(e) => {
                      setFormData({ ...formData, company_name: e.target.value });
                      if (errors.company_name) setErrors(prev => ({ ...prev, company_name: null }));
                    }}
                    style={{ paddingLeft: '1rem', borderColor: errors.company_name ? '#ef4444' : undefined }}
                  />
                  {errors.company_name && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{errors.company_name}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Person Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Tariq Mehmood"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    style={{ paddingLeft: '1rem' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Phone Number / WhatsApp *</span>
                    <span style={{ fontSize: '0.72rem', color: formData.phone.length === 11 ? '#10b981' : '#64748b' }}>
                      {formData.phone.length}/11 digits
                    </span>
                  </label>
                  <input
                    type="tel"
                    className={`form-input ${errors.phone ? 'input-error' : ''}`}
                    placeholder="03001234567"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    style={{ paddingLeft: '1rem', borderColor: errors.phone ? '#ef4444' : undefined }}
                  />
                  {errors.phone && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{errors.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-teal" disabled={submitting}>
                  <Plus size={16} />
                  <span>{submitting ? 'Saving...' : 'Save Supplier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Edit3 size={18} color="#00838f" />
                <h3 className="modal-title">Edit Supplier</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setEditingSupplier(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Company / Business Name *</label>
                  <input
                    type="text"
                    className={`form-input ${editErrors.company_name ? 'input-error' : ''}`}
                    value={editForm.company_name}
                    onChange={(e) => {
                      setEditForm({ ...editForm, company_name: e.target.value });
                      if (editErrors.company_name) setEditErrors(prev => ({ ...prev, company_name: null }));
                    }}
                    style={{ paddingLeft: '1rem', borderColor: editErrors.company_name ? '#ef4444' : undefined }}
                  />
                  {editErrors.company_name && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{editErrors.company_name}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Person Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.contact_person}
                    onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
                    style={{ paddingLeft: '1rem' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Phone Number *</span>
                    <span style={{ fontSize: '0.72rem', color: (editForm.phone || '').length === 11 ? '#10b981' : '#64748b' }}>
                      {(editForm.phone || '').length}/11 digits
                    </span>
                  </label>
                  <input
                    type="tel"
                    className={`form-input ${editErrors.phone ? 'input-error' : ''}`}
                    value={editForm.phone}
                    onChange={(e) => handlePhoneChange(e.target.value, true)}
                    style={{ paddingLeft: '1rem', borderColor: editErrors.phone ? '#ef4444' : undefined }}
                  />
                  {editErrors.phone && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{editErrors.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingSupplier(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-teal" disabled={submitting}>
                  <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
