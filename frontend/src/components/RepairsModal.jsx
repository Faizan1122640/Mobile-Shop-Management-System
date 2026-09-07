import React, { useState } from 'react';
import { X, Wrench, Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { createRepair, updateRepairStatus } from '../services/api';
import { validatePhone, validateIMEI, validateRequired, validatePrice } from '../utils/validators';

export default function RepairsModal({ isOpen, onClose, repairs = [], customers = [], onRefresh, onRepairCreated }) {
  const [activeSubTab, setActiveSubTab] = useState('list');
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    device_model: '',
    imei: '',
    issue: '',
    cost: '2500',
    status: 'Pending'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePhoneChange = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 11);
    setFormData(prev => ({ ...prev, customer_phone: cleaned }));
    setErrors(prev => ({ ...prev, customer_phone: validatePhone(cleaned, false) }));
  };

  const handleImeiChange = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 15);
    setFormData(prev => ({ ...prev, imei: cleaned }));
    setErrors(prev => ({ ...prev, imei: validateIMEI(cleaned, false, 'IMEI') }));
  };

  const handleStatusChange = async (repairId, newStatus) => {
    try {
      await updateRepairStatus(repairId, newStatus);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const newErrors = {};

    const modelErr = validateRequired(formData.device_model, 'Device model');
    if (modelErr) newErrors.device_model = modelErr;

    const issueErr = validateRequired(formData.issue, 'Problem description');
    if (issueErr) newErrors.issue = issueErr;

    if (formData.customer_phone) {
      const phoneErr = validatePhone(formData.customer_phone, false);
      if (phoneErr) newErrors.customer_phone = phoneErr;
    }

    if (formData.imei) {
      const imeiErr = validateIMEI(formData.imei, false, 'IMEI');
      if (imeiErr) newErrors.imei = imeiErr;
    }

    const costErr = validatePrice(formData.cost, 'Repair cost');
    if (costErr) newErrors.cost = costErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      const created = await createRepair({
        ...formData,
        customer_phone: formData.customer_phone || null,
        imei: formData.imei || null,
        cost: Number(formData.cost || 0)
      });
      if (onRepairCreated) onRepairCreated(created);
      else if (onRefresh) onRefresh();

      setActiveSubTab('list');
      setFormData({
        customer_name: '',
        customer_phone: '',
        device_model: '',
        imei: '',
        issue: '',
        cost: '2500',
        status: 'Pending'
      });
    } catch (err) {
      alert('Error creating repair ticket: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 800 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Wrench size={20} color="#00838f" />
            <h3 className="modal-title">Mobile Repair Management</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 1.5rem', background: '#f8fafc' }}>
          <button
            onClick={() => setActiveSubTab('list')}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: 'transparent',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: activeSubTab === 'list' ? '#00838f' : '#64748b',
              borderBottom: activeSubTab === 'list' ? '2px solid #00838f' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Repair Tickets ({repairs.length})
          </button>
          <button
            onClick={() => {
              setActiveSubTab('new');
              setErrors({});
            }}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: 'transparent',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: activeSubTab === 'new' ? '#00838f' : '#64748b',
              borderBottom: activeSubTab === 'new' ? '2px solid #00838f' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Plus size={15} />
            <span>New Repair Ticket</span>
          </button>
        </div>

        <div className="modal-body">
          {activeSubTab === 'list' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
              {repairs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No active repair jobs found.
                </div>
              ) : (
                repairs.map(r => (
                  <div
                    key={r.repair_id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: '1rem',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                          #{r.repair_id ? String(r.repair_id).padStart(4, '0') : 'REP'} - {r.device_model}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 20,
                          background: r.status === 'Repaired' ? '#dcfce7' : r.status === 'In Process' ? '#e0f2fe' : '#fef3c7',
                          color: r.status === 'Repaired' ? '#15803d' : r.status === 'In Process' ? '#0369a1' : '#b45309'
                        }}>
                          {r.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Customer: <strong>{r.customer_name || 'Walk-in'}</strong> ({r.customer_phone || 'N/A'}) {r.imei ? `• IMEI: ${r.imei}` : ''}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.2rem' }}>
                        Issue: {r.issue}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Estimated Cost</div>
                        <div style={{ fontWeight: 700, color: '#00897b', fontSize: '0.95rem' }}>
                          Rs {Number(r.cost || 0).toLocaleString()}
                        </div>
                      </div>

                      <select
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.repair_id, e.target.value)}
                        style={{
                          padding: '0.35rem 0.6rem',
                          borderRadius: 6,
                          border: '1px solid #cbd5e1',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Process">In Process</option>
                        <option value="Repaired">Repaired</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Customer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Usman Ali"
                    className="form-input"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    style={{ paddingLeft: '0.75rem' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Customer Phone</span>
                    <span style={{ fontSize: '0.72rem', color: formData.customer_phone.length === 11 ? '#10b981' : '#64748b' }}>
                      {formData.customer_phone.length}/11 digits
                    </span>
                  </label>
                  <input
                    type="tel"
                    placeholder="03001234567"
                    className={`form-input ${errors.customer_phone ? 'input-error' : ''}`}
                    value={formData.customer_phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    style={{ paddingLeft: '0.75rem', borderColor: errors.customer_phone ? '#ef4444' : undefined }}
                  />
                  {errors.customer_phone && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{errors.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                <div>
                  <label className="form-label">Device Model *</label>
                  <input
                    type="text"
                    placeholder="e.g. Samsung Galaxy S22"
                    className={`form-input ${errors.device_model ? 'input-error' : ''}`}
                    value={formData.device_model}
                    onChange={(e) => {
                      setFormData({ ...formData, device_model: e.target.value });
                      if (errors.device_model) setErrors(prev => ({ ...prev, device_model: null }));
                    }}
                    style={{ paddingLeft: '0.75rem', borderColor: errors.device_model ? '#ef4444' : undefined }}
                  />
                  {errors.device_model && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{errors.device_model}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>IMEI (Optional)</span>
                    <span style={{ fontSize: '0.72rem', color: formData.imei.length === 15 ? '#10b981' : '#64748b' }}>
                      {formData.imei.length}/15 digits
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="15-digit IMEI (optional)"
                    className={`form-input ${errors.imei ? 'input-error' : ''}`}
                    value={formData.imei}
                    onChange={(e) => handleImeiChange(e.target.value)}
                    style={{ paddingLeft: '0.75rem', borderColor: errors.imei ? '#ef4444' : undefined }}
                  />
                  {errors.imei && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{errors.imei}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <label className="form-label">Problem / Issue Description *</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Glass cracked, touch working, speaker buzzing..."
                  className={`form-input ${errors.issue ? 'input-error' : ''}`}
                  value={formData.issue}
                  onChange={(e) => {
                    setFormData({ ...formData, issue: e.target.value });
                    if (errors.issue) setErrors(prev => ({ ...prev, issue: null }));
                  }}
                  style={{ paddingLeft: '0.75rem', resize: 'vertical', borderColor: errors.issue ? '#ef4444' : undefined }}
                />
                {errors.issue && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertCircle size={12} />
                    <span>{errors.issue}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                <div>
                  <label className="form-label">Estimated Repair Cost (Rs) *</label>
                  <input
                    type="number"
                    placeholder="0"
                    className={`form-input ${errors.cost ? 'input-error' : ''}`}
                    value={formData.cost}
                    onChange={(e) => {
                      setFormData({ ...formData, cost: e.target.value });
                      if (errors.cost) setErrors(prev => ({ ...prev, cost: null }));
                    }}
                    style={{ paddingLeft: '0.75rem', borderColor: errors.cost ? '#ef4444' : undefined }}
                  />
                  {errors.cost && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{errors.cost}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="form-label">Initial Status</label>
                  <select
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ paddingLeft: '0.75rem' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Process">In Process</option>
                    <option value="Repaired">Repaired</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setActiveSubTab('list')}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-teal" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Repair Ticket'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
