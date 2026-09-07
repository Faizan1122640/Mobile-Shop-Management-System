import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  User,
  MapPin,
  Calendar,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  FileText
} from 'lucide-react';
import { updateCustomer, deleteCustomer } from '../services/api';
import { validatePhone, validateRequired } from '../utils/validators';
import AddCustomerModal from './AddCustomerModal';

export default function CustomersView({
  customers = [],
  sales = [],
  oldPhones = [],
  onCustomerAdded,
  onCustomerUpdated,
  onDeleteCustomer,
  onRefresh
}) {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' });
  const [editErrors, setEditErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Selected customer for quick statement/ledger modal
  const [selectedStatementCustomer, setSelectedStatementCustomer] = useState(null);

  // Filter customers matching search
  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(search) ||
      c.address?.toLowerCase().includes(q)
    );
  });

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setEditForm({
      name: c.name || '',
      phone: c.phone || '',
      address: c.address || ''
    });
    setEditErrors({});
  };

  const handleEditPhoneChange = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 11);
    setEditForm(prev => ({ ...prev, phone: cleaned }));
    setEditErrors(prev => ({ ...prev, phone: validatePhone(cleaned, true) }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const nameErr = validateRequired(editForm.name, 'Customer name');
    const phoneErr = validatePhone(editForm.phone, true);

    if (nameErr || phoneErr) {
      setEditErrors({ name: nameErr, phone: phoneErr });
      return;
    }

    try {
      setSubmitting(true);
      setEditErrors({});
      const updated = await updateCustomer(editingCustomer.customer_id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        address: editForm.address.trim() || 'No address specified'
      });
      setEditingCustomer(null);
      if (onCustomerUpdated) onCustomerUpdated(updated);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to update customer: ' + (err.message || 'Server error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (customerId, name) => {
    if (!window.confirm(`Are you sure you want to delete customer "${name}"?`)) {
      return;
    }
    try {
      if (onDeleteCustomer) {
        onDeleteCustomer(customerId);
      }
      await deleteCustomer(customerId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to delete customer: ' + (err.message || 'Server error'));
    }
  };

  // Customer sales history helper
  const getCustomerTransactions = (custId, phone) => {
    const custSales = sales.filter(s =>
      (s.customer_id && Number(s.customer_id) === Number(custId)) ||
      (phone && s.customers?.phone && s.customers.phone.trim() === phone.trim())
    );
    const custOldPhones = oldPhones.filter(op =>
      (op.customer_id && Number(op.customer_id) === Number(custId)) ||
      (phone && op.customer_phone && op.customer_phone.trim() === phone.trim())
    );
    return { custSales, custOldPhones };
  };

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Directory Table Card */}
      <div className="dashboard-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Customers Directory</h3>
            <p className="card-subtitle">Manage registered client profiles, contact information, and warranty accounts</p>
          </div>
          <button
            className="btn-primary-teal"
            onClick={() => setIsAddModalOpen(true)}
            type="button"
          >
            <Plus size={16} />
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.25rem 0' }}>
          <div className="input-with-icon" style={{ maxWidth: 400, flex: 1 }}>
            <Search className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by customer name, phone, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
            Total Registered: <strong style={{ color: '#00838f' }}>{customers.length}</strong> Clients
          </div>
        </div>

        {/* Customer Directory Table */}
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>CUSTOMER PROFILE</th>
                <th>PHONE NUMBER</th>
                <th>ADDRESS</th>
                <th>REGISTERED DATE</th>
                <th style={{ textAlign: 'center', width: 140 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                    <Users size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>
                      {search ? `No customers matching "${search}"` : 'No customers registered yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr key={c.customer_id || idx}>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: '#f0fdfa',
                          color: '#00838f',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}>
                          {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            ID: #{c.customer_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00838f', fontWeight: 600, fontSize: '0.86rem' }}>
                        <Phone size={14} />
                        <span>{c.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.84rem' }}>
                        <MapPin size={13} style={{ flexShrink: 0 }} />
                        <span>{c.address || 'No address specified'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.8rem' }}>
                        <Calendar size={13} />
                        <span>{c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Active'}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                        <button
                          className="table-action-btn edit"
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Customer"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="table-action-btn delete"
                          onClick={() => handleDelete(c.customer_id, c.name)}
                          title="Delete Customer"
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

      {/* Add Customer Pop-up Modal */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCustomerAdded={(newCust) => {
          if (onCustomerAdded) onCustomerAdded(newCust);
          if (onRefresh) onRefresh();
        }}
      />

      {/* Edit Customer Pop-up Modal */}
      {editingCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#e0f2f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Edit3 size={18} color="#00838f" />
                </div>
                <div>
                  <h3 className="modal-title">Edit Customer Profile</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Update details for #{editingCustomer.customer_id} - {editingCustomer.name}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setEditingCustomer(null)} type="button">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {/* Full Name */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name *</label>
                  <div className="input-with-icon">
                    <User className="input-icon" size={16} />
                    <input
                      type="text"
                      className={`form-input ${editErrors.name ? 'input-error' : ''}`}
                      value={editForm.name}
                      onChange={(e) => {
                        setEditForm({ ...editForm, name: e.target.value });
                        if (editErrors.name) setEditErrors(prev => ({ ...prev, name: null }));
                      }}
                      autoFocus
                    />
                  </div>
                  {editErrors.name && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{editErrors.name}</span>
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Phone Number (11 Digits) *</label>
                    <span style={{ fontSize: '0.72rem', color: editForm.phone.length === 11 ? '#10b981' : '#64748b', fontWeight: 600 }}>
                      {editForm.phone.length}/11 digits
                    </span>
                  </div>
                  <div className="input-with-icon">
                    <Phone className="input-icon" size={16} />
                    <input
                      type="text"
                      className={`form-input ${editErrors.phone ? 'input-error' : ''}`}
                      value={editForm.phone}
                      onChange={(e) => handleEditPhoneChange(e.target.value)}
                      maxLength={11}
                    />
                  </div>
                  {editErrors.phone && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{editErrors.phone}</span>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Shop / Residential Address</label>
                  <div className="input-with-icon">
                    <MapPin className="input-icon" size={16} />
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingCustomer(null)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-teal" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
