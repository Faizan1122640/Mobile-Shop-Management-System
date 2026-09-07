import React, { useState } from 'react';
import { X, Smartphone, ShieldCheck, Upload, CheckCircle2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { createOldPhonePurchase, uploadImage } from '../services/api';
import { validatePhone, validateIMEI, validateCNIC, validatePrice, validateRequired } from '../utils/validators';

export default function OldPhoneModal({ isOpen, onClose, onPurchaseComplete }) {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    imei_1: '',
    imei_2: '',
    purchase_price: '',
    expected_selling_price: '',
    seller_name: '',
    seller_phone: '',
    seller_address: '',
    seller_cnic: '',
    cnic_front_pic: '',
    cnic_back_pic: '',
    person_pic: ''
  });

  const [errors, setErrors] = useState({});

  const [uploading, setUploading] = useState({
    cnic_front: false,
    cnic_back: false,
    person: false
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePhoneChange = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 11);
    setFormData(prev => ({ ...prev, seller_phone: cleaned }));
    setErrors(prev => ({ ...prev, seller_phone: validatePhone(cleaned) }));
  };

  const handleImeiChange = (field, val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 15);
    setFormData(prev => ({ ...prev, [field]: cleaned }));
    if (field === 'imei_1') {
      setErrors(prev => ({ ...prev, imei_1: validateIMEI(cleaned, true, 'IMEI 1') }));
    } else {
      setErrors(prev => ({ ...prev, imei_2: validateIMEI(cleaned, false, 'IMEI 2') }));
    }
  };

  const handleCnicChange = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 13);
    setFormData(prev => ({ ...prev, seller_cnic: cleaned }));
    setErrors(prev => ({ ...prev, seller_cnic: validateCNIC(cleaned) }));
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(prev => ({ ...prev, [field]: true }));
      const res = await uploadImage(file);
      if (res?.url) {
        if (field === 'cnic_front') setFormData(prev => ({ ...prev, cnic_front_pic: res.url }));
        if (field === 'cnic_back') setFormData(prev => ({ ...prev, cnic_back_pic: res.url }));
        if (field === 'person') setFormData(prev => ({ ...prev, person_pic: res.url }));
      }
    } catch (err) {
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    const brandErr = validateRequired(formData.brand, 'Brand');
    if (brandErr) newErrors.brand = brandErr;

    const modelErr = validateRequired(formData.model, 'Model');
    if (modelErr) newErrors.model = modelErr;

    const imei1Err = validateIMEI(formData.imei_1, true, 'IMEI 1');
    if (imei1Err) newErrors.imei_1 = imei1Err;

    if (formData.imei_2) {
      const imei2Err = validateIMEI(formData.imei_2, false, 'IMEI 2');
      if (imei2Err) newErrors.imei_2 = imei2Err;
    }

    const priceErr = validatePrice(formData.purchase_price, 'Purchase price');
    if (priceErr) newErrors.purchase_price = priceErr;

    const sellerNameErr = validateRequired(formData.seller_name, 'Seller name');
    if (sellerNameErr) newErrors.seller_name = sellerNameErr;

    const cnicErr = validateCNIC(formData.seller_cnic);
    if (cnicErr) newErrors.seller_cnic = cnicErr;

    const phoneErr = validatePhone(formData.seller_phone);
    if (phoneErr) newErrors.seller_phone = phoneErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const combinedImei = formData.imei_2
        ? `${formData.imei_1}, ${formData.imei_2}`
        : formData.imei_1;

      const payload = {
        ...formData,
        imei: combinedImei,
        purchase_price: Number(formData.purchase_price),
        expected_selling_price: Number(formData.expected_selling_price || formData.purchase_price * 1.15)
      };

      const res = await createOldPhonePurchase(payload);
      alert('Old phone purchase and legal CNIC record saved to Supabase successfully!');
      if (onPurchaseComplete) onPurchaseComplete(res);
      onClose();
    } catch (err) {
      alert(err.message || 'Error recording purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 740 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#e0f2f1',
              color: '#00838f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="modal-title">Buy Old / Used Phone (Dual IMEI)</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Legal verification with CNIC and seller identity</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {/* Section 1: Phone Information */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Smartphone size={16} color="#00838f" />
                Phone Details & Dual IMEI Verification
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Brand *</label>
                  <input
                    type="text"
                    placeholder="e.g. Apple, Samsung, Vivo"
                    className={`form-input ${errors.brand ? 'input-error' : ''}`}
                    value={formData.brand}
                    onChange={(e) => {
                      setFormData({ ...formData, brand: e.target.value });
                      if (errors.brand) setErrors(prev => ({ ...prev, brand: null }));
                    }}
                    style={{ paddingLeft: '0.75rem', borderColor: errors.brand ? '#ef4444' : undefined }}
                  />
                  {errors.brand && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{errors.brand}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="form-label">Model Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. iPhone 13 Pro 128GB"
                    className={`form-input ${errors.model ? 'input-error' : ''}`}
                    value={formData.model}
                    onChange={(e) => {
                      setFormData({ ...formData, model: e.target.value });
                      if (errors.model) setErrors(prev => ({ ...prev, model: null }));
                    }}
                    style={{ paddingLeft: '0.75rem', borderColor: errors.model ? '#ef4444' : undefined }}
                  />
                  {errors.model && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{errors.model}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dual IMEI inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>IMEI 1 (15 Digits) *</span>
                    <span style={{ fontSize: '0.72rem', color: formData.imei_1.length === 15 ? '#10b981' : '#64748b' }}>
                      {formData.imei_1.length}/15 digits
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 15-digit IMEI 1"
                    className={`form-input ${errors.imei_1 ? 'input-error' : ''}`}
                    value={formData.imei_1}
                    onChange={(e) => handleImeiChange('imei_1', e.target.value)}
                    style={{ paddingLeft: '0.75rem', borderColor: errors.imei_1 ? '#ef4444' : undefined }}
                  />
                  {errors.imei_1 && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{errors.imei_1}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>IMEI 2 (Optional / Dual SIM)</span>
                    <span style={{ fontSize: '0.72rem', color: formData.imei_2.length === 15 ? '#10b981' : '#64748b' }}>
                      {formData.imei_2.length}/15 digits
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 15-digit IMEI 2 (optional)"
                    className={`form-input ${errors.imei_2 ? 'input-error' : ''}`}
                    value={formData.imei_2}
                    onChange={(e) => handleImeiChange('imei_2', e.target.value)}
                    style={{ paddingLeft: '0.75rem', borderColor: errors.imei_2 ? '#ef4444' : undefined }}
                  />
                  {errors.imei_2 && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{errors.imei_2}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <div>
                  <label className="form-label">Purchase / Buying Price (Rs) *</label>
                  <input
                    type="number"
                    placeholder="0"
                    className={`form-input ${errors.purchase_price ? 'input-error' : ''}`}
                    value={formData.purchase_price}
                    onChange={(e) => {
                      setFormData({ ...formData, purchase_price: e.target.value });
                      if (errors.purchase_price) setErrors(prev => ({ ...prev, purchase_price: null }));
                    }}
                    style={{ paddingLeft: '0.75rem', borderColor: errors.purchase_price ? '#ef4444' : undefined }}
                  />
                  {errors.purchase_price && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{errors.purchase_price}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="form-label">Expected Selling Price (Rs)</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="form-input"
                    value={formData.expected_selling_price}
                    onChange={(e) => setFormData({ ...formData, expected_selling_price: e.target.value })}
                    style={{ paddingLeft: '0.75rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Seller Identity & Legal CNIC Record */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                Seller Identity & Legal CNIC Record
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Seller Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Bilal Sheikh"
                    className={`form-input ${errors.seller_name ? 'input-error' : ''}`}
                    value={formData.seller_name}
                    onChange={(e) => {
                      setFormData({ ...formData, seller_name: e.target.value });
                      if (errors.seller_name) setErrors(prev => ({ ...prev, seller_name: null }));
                    }}
                    style={{ paddingLeft: '0.75rem', borderColor: errors.seller_name ? '#ef4444' : undefined }}
                  />
                  {errors.seller_name && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{errors.seller_name}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>CNIC Number (13 Digits) *</span>
                    <span style={{ fontSize: '0.72rem', color: formData.seller_cnic.length === 13 ? '#10b981' : '#64748b' }}>
                      {formData.seller_cnic.length}/13 digits
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3520112345679"
                    className={`form-input ${errors.seller_cnic ? 'input-error' : ''}`}
                    value={formData.seller_cnic}
                    onChange={(e) => handleCnicChange(e.target.value)}
                    style={{ paddingLeft: '0.75rem', borderColor: errors.seller_cnic ? '#ef4444' : undefined }}
                  />
                  {errors.seller_cnic && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{errors.seller_cnic}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Phone Number *</span>
                    <span style={{ fontSize: '0.72rem', color: formData.seller_phone.length === 11 ? '#10b981' : '#64748b' }}>
                      {formData.seller_phone.length}/11 digits
                    </span>
                  </label>
                  <input
                    type="tel"
                    placeholder="03001234567"
                    className={`form-input ${errors.seller_phone ? 'input-error' : ''}`}
                    value={formData.seller_phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    style={{ paddingLeft: '0.75rem', borderColor: errors.seller_phone ? '#ef4444' : undefined }}
                  />
                  {errors.seller_phone && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{errors.seller_phone}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="form-label">Permanent Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Circular Road, Lahore"
                    className="form-input"
                    value={formData.seller_address}
                    onChange={(e) => setFormData({ ...formData, seller_address: e.target.value })}
                    style={{ paddingLeft: '0.75rem' }}
                  />
                </div>
              </div>

              {/* Real Supabase Storage Image Uploads */}
              <div style={{ marginTop: '1rem' }}>
                <label className="form-label">Verification Photos (Stored in Supabase Storage Bucket)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  {/* CNIC Front */}
                  <div style={{
                    border: '1px dashed #cbd5e1',
                    borderRadius: 10,
                    padding: '0.75rem',
                    textAlign: 'center',
                    background: '#ffffff',
                    position: 'relative'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>CNIC Front</div>
                    {formData.cnic_front_pic ? (
                      <div style={{ position: 'relative' }}>
                        <img src={formData.cnic_front_pic} alt="CNIC Front" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: 6 }} />
                        <span style={{ position: 'absolute', top: 4, right: 4, background: '#10b981', color: '#fff', borderRadius: '50%', padding: 2 }}>
                          <CheckCircle2 size={14} />
                        </span>
                      </div>
                    ) : (
                      <div style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: 4 }}>
                        <ImageIcon size={24} />
                        <span style={{ fontSize: '0.7rem' }}>{uploading.cnic_front ? 'Uploading...' : 'No image'}</span>
                      </div>
                    )}
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      marginTop: '0.5rem',
                      padding: '0.35rem 0.65rem',
                      background: '#f1f5f9',
                      borderRadius: 6,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#00838f',
                      cursor: 'pointer'
                    }}>
                      <Upload size={12} />
                      <span>{formData.cnic_front_pic ? 'Change File' : 'Upload Front'}</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'cnic_front')} />
                    </label>
                  </div>

                  {/* CNIC Back */}
                  <div style={{
                    border: '1px dashed #cbd5e1',
                    borderRadius: 10,
                    padding: '0.75rem',
                    textAlign: 'center',
                    background: '#ffffff',
                    position: 'relative'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>CNIC Back</div>
                    {formData.cnic_back_pic ? (
                      <div style={{ position: 'relative' }}>
                        <img src={formData.cnic_back_pic} alt="CNIC Back" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: 6 }} />
                        <span style={{ position: 'absolute', top: 4, right: 4, background: '#10b981', color: '#fff', borderRadius: '50%', padding: 2 }}>
                          <CheckCircle2 size={14} />
                        </span>
                      </div>
                    ) : (
                      <div style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: 4 }}>
                        <ImageIcon size={24} />
                        <span style={{ fontSize: '0.7rem' }}>{uploading.cnic_back ? 'Uploading...' : 'No image'}</span>
                      </div>
                    )}
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      marginTop: '0.5rem',
                      padding: '0.35rem 0.65rem',
                      background: '#f1f5f9',
                      borderRadius: 6,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#00838f',
                      cursor: 'pointer'
                    }}>
                      <Upload size={12} />
                      <span>{formData.cnic_back_pic ? 'Change File' : 'Upload Back'}</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'cnic_back')} />
                    </label>
                  </div>

                  {/* Seller Photo */}
                  <div style={{
                    border: '1px dashed #cbd5e1',
                    borderRadius: 10,
                    padding: '0.75rem',
                    textAlign: 'center',
                    background: '#ffffff',
                    position: 'relative'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>Seller Photo</div>
                    {formData.person_pic ? (
                      <div style={{ position: 'relative' }}>
                        <img src={formData.person_pic} alt="Seller Photo" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: 6 }} />
                        <span style={{ position: 'absolute', top: 4, right: 4, background: '#10b981', color: '#fff', borderRadius: '50%', padding: 2 }}>
                          <CheckCircle2 size={14} />
                        </span>
                      </div>
                    ) : (
                      <div style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: 4 }}>
                        <ImageIcon size={24} />
                        <span style={{ fontSize: '0.7rem' }}>{uploading.person ? 'Uploading...' : 'No image'}</span>
                      </div>
                    )}
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      marginTop: '0.5rem',
                      padding: '0.35rem 0.65rem',
                      background: '#f1f5f9',
                      borderRadius: 6,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#00838f',
                      cursor: 'pointer'
                    }}>
                      <Upload size={12} />
                      <span>{formData.person_pic ? 'Change File' : 'Upload Photo'}</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'person')} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-teal" disabled={loading}>
              {loading ? 'Recording Purchase...' : 'Complete Old Phone Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
