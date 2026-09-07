import React, { useState } from 'react';
import { ShieldCheck, Plus, Search, Eye, Edit3, Trash2, X, Phone, MapPin, Smartphone, User, FileText, CheckCircle2, Upload } from 'lucide-react';
import { updateOldPhone, deleteOldPhone, uploadImage } from '../services/api';

export default function OldPhonesView({ oldPhones = [], onOpenOldPhone, onRefresh, onDeleteOldPhone }) {
  const [search, setSearch] = useState('');
  const [viewRecord, setViewRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [activeImageZoom, setActiveImageZoom] = useState(null);

  const filtered = oldPhones.filter(op => {
    const q = search.toLowerCase();
    return (
      op.seller_name?.toLowerCase().includes(q) ||
      op.cnic_number?.includes(q) ||
      op.phone?.includes(q) ||
      op.imei?.includes(q) ||
      op.products?.model?.toLowerCase().includes(q) ||
      op.products?.brand?.toLowerCase().includes(q)
    );
  });

  const handleOpenEdit = (op) => {
    setEditRecord(op);
    setEditForm({
      seller_name: op.seller_name || '',
      phone: op.phone || '',
      address: op.address || '',
      cnic_number: op.cnic_number || '',
      purchase_price: op.products?.purchase_price || '',
      selling_price: op.products?.selling_price || '',
      cnic_front_pic: op.cnic_front_pic || '',
      cnic_back_pic: op.cnic_back_pic || '',
      person_pic: op.person_pic || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await updateOldPhone(editRecord.purchase_id, editForm);
      setEditRecord(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to update record: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (purchaseId) => {
    if (!window.confirm('Are you sure you want to delete this purchase record? The product will also be removed from inventory.')) {
      return;
    }
    try {
      await deleteOldPhone(purchaseId);
      if (onDeleteOldPhone) onDeleteOldPhone(purchaseId);
      else if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to delete record: ' + err.message);
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadImage(file);
      if (res?.url) {
        setEditForm(prev => ({ ...prev, [field]: res.url }));
      }
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    }
  };

  return (
    <div className="content-body">
      <div className="dashboard-card">
        {/* Header */}
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Old Phone Purchases (Legal CNIC Register)</h3>
            <p className="card-subtitle">Complete legal seller verification, CNIC archives, and used phone inventory</p>
          </div>
          <button className="btn-primary-teal" onClick={onOpenOldPhone}>
            <Plus size={16} />
            <span>Buy Old Phone (CNIC Record)</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
          <div className="input-with-icon" style={{ flex: 1, maxWidth: 420 }}>
            <Search className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by Seller Name, CNIC, Phone, Model, or IMEI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            Total Records: {filtered.length}
          </div>
        </div>

        {/* Records Table */}
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>PHONE MODEL & IMEI</th>
                <th>SELLER NAME</th>
                <th>CNIC NUMBER</th>
                <th>PHONE & ADDRESS</th>
                <th>VERIFICATION PICS</th>
                <th style={{ textAlign: 'right' }}>PURCHASE PRICE</th>
                <th style={{ textAlign: 'center', width: 140 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    No old phone purchase records found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((op, idx) => {
                  const prod = op.products || {};
                  return (
                    <tr key={op.purchase_id || idx}>
                      <td className="table-idx">{idx + 1}</td>
                      <td>
                        <div className="table-item-name">{prod.brand} {prod.model || 'Used Device'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#00838f', fontWeight: 600 }}>
                          IMEI: {op.imei}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={14} color="#64748b" />
                          <span>{op.seller_name}</span>
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.82rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: 4, color: '#334155', fontWeight: 600 }}>
                          {op.cnic_number}
                        </code>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 500 }}>{op.phone}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{op.address || 'N/A'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          {op.cnic_front_pic && (
                            <img
                              src={op.cnic_front_pic}
                              title="CNIC Front (Click to view)"
                              alt="CNIC Front"
                              style={{ width: '32px', height: '24px', objectFit: 'cover', borderRadius: 4, border: '1px solid #cbd5e1', cursor: 'pointer' }}
                              onClick={() => setActiveImageZoom(op.cnic_front_pic)}
                            />
                          )}
                          {op.cnic_back_pic && (
                            <img
                              src={op.cnic_back_pic}
                              title="CNIC Back (Click to view)"
                              alt="CNIC Back"
                              style={{ width: '32px', height: '24px', objectFit: 'cover', borderRadius: 4, border: '1px solid #cbd5e1', cursor: 'pointer' }}
                              onClick={() => setActiveImageZoom(op.cnic_back_pic)}
                            />
                          )}
                          {op.person_pic && (
                            <img
                              src={op.person_pic}
                              title="Seller Photo (Click to view)"
                              alt="Seller"
                              style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '50%', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                              onClick={() => setActiveImageZoom(op.person_pic)}
                            />
                          )}
                          {!op.cnic_front_pic && !op.person_pic && (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No pics</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#00897b' }}>
                        Rs {Number(prod.purchase_price || 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            title="View Full Seller Dossier"
                            onClick={() => setViewRecord(op)}
                            style={{ padding: '0.35rem 0.5rem', background: '#e0f2f1', border: 'none', borderRadius: 6, color: '#00838f', cursor: 'pointer' }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            title="Edit Record"
                            onClick={() => handleOpenEdit(op)}
                            style={{ padding: '0.35rem 0.5rem', background: '#f1f5f9', border: 'none', borderRadius: 6, color: '#475569', cursor: 'pointer' }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            title="Delete Record"
                            onClick={() => handleDelete(op.purchase_id)}
                            style={{ padding: '0.35rem 0.5rem', background: '#fee2e2', border: 'none', borderRadius: 6, color: '#dc2626', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. VIEW SELLER DOSSIER MODAL */}
      {viewRecord && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldCheck size={22} color="#00838f" />
                <div>
                  <h3 className="modal-title">Seller Legal Record & Verification Dossier</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Record ID: #{viewRecord.purchase_id} • Purchased on {new Date(viewRecord.purchase_date).toLocaleDateString()}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setViewRecord(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {/* Phone Info */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Device Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div><strong>Brand & Model:</strong> {viewRecord.products?.brand} {viewRecord.products?.model}</div>
                  <div><strong>IMEI:</strong> <code style={{ color: '#00838f', fontWeight: 700 }}>{viewRecord.imei}</code></div>
                  <div><strong>Purchase Price:</strong> Rs {Number(viewRecord.products?.purchase_price || 0).toLocaleString()}</div>
                  <div><strong>Expected Selling Price:</strong> Rs {Number(viewRecord.products?.selling_price || 0).toLocaleString()}</div>
                </div>
              </div>

              {/* Seller Identity */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Seller Contact & CNIC</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div><strong>Full Name:</strong> {viewRecord.seller_name}</div>
                  <div><strong>CNIC Number:</strong> <code style={{ background: '#e2e8f0', padding: '0.15rem 0.4rem', borderRadius: 4 }}>{viewRecord.cnic_number}</code></div>
                  <div><strong>Phone:</strong> {viewRecord.phone}</div>
                  <div><strong>Address:</strong> {viewRecord.address || 'N/A'}</div>
                </div>
              </div>

              {/* Photos Gallery */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Attached Documents & Photos</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ textAlign: 'center', background: '#f8fafc', padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>CNIC Front</div>
                    {viewRecord.cnic_front_pic ? (
                      <img
                        src={viewRecord.cnic_front_pic}
                        alt="CNIC Front"
                        style={{ width: '100%', height: '110px', objectFit: 'contain', borderRadius: 4, cursor: 'pointer', background: '#fff' }}
                        onClick={() => setActiveImageZoom(viewRecord.cnic_front_pic)}
                      />
                    ) : <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>No Image</div>}
                  </div>

                  <div style={{ textAlign: 'center', background: '#f8fafc', padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>CNIC Back</div>
                    {viewRecord.cnic_back_pic ? (
                      <img
                        src={viewRecord.cnic_back_pic}
                        alt="CNIC Back"
                        style={{ width: '100%', height: '110px', objectFit: 'contain', borderRadius: 4, cursor: 'pointer', background: '#fff' }}
                        onClick={() => setActiveImageZoom(viewRecord.cnic_back_pic)}
                      />
                    ) : <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>No Image</div>}
                  </div>

                  <div style={{ textAlign: 'center', background: '#f8fafc', padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>Seller Photo</div>
                    {viewRecord.person_pic ? (
                      <img
                        src={viewRecord.person_pic}
                        alt="Seller"
                        style={{ width: '100%', height: '110px', objectFit: 'contain', borderRadius: 4, cursor: 'pointer', background: '#fff' }}
                        onClick={() => setActiveImageZoom(viewRecord.person_pic)}
                      />
                    ) : <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>No Image</div>}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewRecord(null)}>
                Close
              </button>
              <button
                className="btn-primary-teal"
                onClick={() => {
                  window.print();
                }}
              >
                <FileText size={16} />
                <span>Print Legal Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT SELLER MODAL */}
      {editRecord && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Edit3 size={20} color="#00838f" />
                <h3 className="modal-title">Edit Old Phone & Seller Record</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setEditRecord(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Seller Full Name</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={editForm.seller_name}
                      onChange={(e) => setEditForm({ ...editForm, seller_name: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CNIC Number</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={editForm.cnic_number}
                      onChange={(e) => setEditForm({ ...editForm, cnic_number: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    />
                  </div>
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
                    <label className="form-label">Expected Selling Price (Rs)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editForm.selling_price}
                      onChange={(e) => setEditForm({ ...editForm, selling_price: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    />
                  </div>
                </div>

                {/* Uploads replacement */}
                <div style={{ marginTop: '0.75rem' }}>
                  <label className="form-label">Replace Verification Photos</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <div style={{ border: '1px dashed #cbd5e1', padding: '0.5rem', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>CNIC Front</div>
                      <label style={{ fontSize: '0.7rem', color: '#00838f', cursor: 'pointer', display: 'block', marginTop: 4 }}>
                        Upload New
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'cnic_front_pic')} />
                      </label>
                    </div>

                    <div style={{ border: '1px dashed #cbd5e1', padding: '0.5rem', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>CNIC Back</div>
                      <label style={{ fontSize: '0.7rem', color: '#00838f', cursor: 'pointer', display: 'block', marginTop: 4 }}>
                        Upload New
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'cnic_back_pic')} />
                      </label>
                    </div>

                    <div style={{ border: '1px dashed #cbd5e1', padding: '0.5rem', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>Seller Photo</div>
                      <label style={{ fontSize: '0.7rem', color: '#00838f', cursor: 'pointer', display: 'block', marginTop: 4 }}>
                        Upload New
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'person_pic')} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditRecord(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-teal" disabled={submitting}>
                  {submitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. FULL RESOLUTION IMAGE ZOOM MODAL */}
      {activeImageZoom && (
        <div
          className="modal-overlay"
          style={{ zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setActiveImageZoom(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setActiveImageZoom(null)}
              style={{
                position: 'absolute',
                top: -40,
                right: 0,
                background: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
            <img
              src={activeImageZoom}
              alt="Zoomed document"
              style={{ maxWidth: '85vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
