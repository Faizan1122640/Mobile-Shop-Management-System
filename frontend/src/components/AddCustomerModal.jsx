import React, { useState } from 'react';
import { Users, X, Phone, User, MapPin, AlertCircle } from 'lucide-react';
import { createCustomer } from '../services/api';
import { validatePhone, validateRequired } from '../utils/validators';

export default function AddCustomerModal({
  isOpen,
  onClose,
  onCustomerAdded
}) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePhoneChange = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 11);
    setFormData(prev => ({ ...prev, phone: cleaned }));
    setErrors(prev => ({ ...prev, phone: validatePhone(cleaned, true) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameErr = validateRequired(formData.name, 'Customer name');
    const phoneErr = validatePhone(formData.phone, true);

    if (nameErr || phoneErr) {
      setErrors({ name: nameErr, phone: phoneErr });
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      const created = await createCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim() || 'No address specified'
      });
      setFormData({ name: '', phone: '', address: '' });
      if (onCustomerAdded) onCustomerAdded(created);
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 540 }}>
        {/* Header */}
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
              <Users size={20} color="#00838f" />
            </div>
            <div>
              <h3 className="modal-title">Add New Customer</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Register customer profile for sales invoices, IMEI warranty tracking & history
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Full Name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name *</label>
              <div className="input-with-icon">
                <User className="input-icon" size={16} />
                <input
                  type="text"
                  placeholder="e.g. Muhammad Ali, Tariq Electronics"
                  className={`form-input ${errors.name ? 'input-error' : ''}`}
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                  }}
                  autoFocus
                />
              </div>
              {errors.name && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={12} />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Phone Number (11 Digits) *</label>
                <span style={{ fontSize: '0.72rem', color: formData.phone.length === 11 ? '#10b981' : '#64748b', fontWeight: 600 }}>
                  {formData.phone.length}/11 digits
                </span>
              </div>
              <div className="input-with-icon">
                <Phone className="input-icon" size={16} />
                <input
                  type="text"
                  placeholder="03001234567"
                  className={`form-input ${errors.phone ? 'input-error' : ''}`}
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  maxLength={11}
                />
              </div>
              {errors.phone && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={12} />
                  <span>{errors.phone}</span>
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
                  placeholder="e.g. Shop #12, Hafeez Center, Lahore"
                  className="form-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-teal" disabled={loading}>
              {loading ? 'Saving Customer...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
