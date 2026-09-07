import React, { useState, useEffect } from 'react';
import { X, Box, Smartphone, QrCode, AlertCircle, Sparkles, Plus, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';
import { createProduct, createCategory } from '../services/api';
import { validateIMEI, validatePrice, validateRequired } from '../utils/validators';

export default function AddProductModal({
  isOpen,
  onClose,
  categories = [],
  suppliers = [],
  onProductAdded
}) {
  // Mode: 'mobile' (Serialized IMEI) vs 'accessory' (Bulk Stock / Barcode)
  const [itemType, setItemType] = useState('mobile');

  const [formData, setFormData] = useState({
    category_id: '',
    supplier_id: '',
    brand: '',
    model: '',
    color: 'Standard',
    imei_1: '',
    imei_2: '',
    barcode: '',
    purchase_price: '',
    selling_price: '',
    stock_quantity: 1,
    status: 'In Stock'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [quickCatOpen, setQuickCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [localCategories, setLocalCategories] = useState(categories);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const isMobile = itemType === 'mobile';

  // Filter categories matching the current mode
  const filteredCategories = localCategories.filter(c => {
    if (isMobile) {
      return c.track_type === 'Serialized' || c.name?.toLowerCase().includes('phone') || c.name?.toLowerCase().includes('mobile');
    } else {
      return c.track_type === 'Bulk' || !c.name?.toLowerCase().includes('phone');
    }
  });

  // Sync default category whenever itemType changes
  useEffect(() => {
    const matching = filteredCategories.length > 0 ? filteredCategories[0] : localCategories[0];
    if (matching) {
      setFormData(prev => ({
        ...prev,
        category_id: matching.category_id,
        stock_quantity: isMobile ? 1 : (prev.stock_quantity > 1 ? prev.stock_quantity : 10)
      }));
    }
  }, [itemType, localCategories]);

  useEffect(() => {
    if (suppliers.length > 0 && !formData.supplier_id) {
      setFormData(prev => ({ ...prev, supplier_id: suppliers[0].supplier_id }));
    }
  }, [suppliers]);

  if (!isOpen) return null;

  // Calculate live profit margin
  const purchaseNum = Number(formData.purchase_price) || 0;
  const sellingNum = Number(formData.selling_price) || 0;
  const profitMargin = sellingNum - purchaseNum;
  const profitPercentage = purchaseNum > 0 ? ((profitMargin / purchaseNum) * 100).toFixed(1) : null;

  const handleGenerateBarcode = () => {
    const randomCode = `SKU-${Date.now().toString().slice(-6)}`;
    setFormData(prev => ({ ...prev, barcode: randomCode }));
    if (errors.barcode) setErrors(prev => ({ ...prev, barcode: null }));
  };

  const handleQuickAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const created = await createCategory({
        name: newCatName.trim(),
        track_type: isMobile ? 'Serialized' : 'Bulk'
      });
      const newCat = {
        category_id: created.category_id || Date.now(),
        name: newCatName.trim(),
        track_type: isMobile ? 'Serialized' : 'Bulk'
      };
      setLocalCategories(prev => [...prev, newCat]);
      setFormData(prev => ({ ...prev, category_id: newCat.category_id }));
      setNewCatName('');
      setQuickCatOpen(false);
    } catch (err) {
      alert('Failed to add category: ' + err.message);
    }
  };

  const handleImeiChange = (field, val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 15);
    setFormData(prev => ({ ...prev, [field]: cleaned }));
    if (field === 'imei_1') {
      setErrors(prev => ({ ...prev, imei_1: validateIMEI(cleaned, true, 'IMEI 1') }));
    } else if (field === 'imei_2') {
      setErrors(prev => ({ ...prev, imei_2: validateIMEI(cleaned, false, 'IMEI 2') }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    const brandErr = validateRequired(formData.brand, 'Brand');
    if (brandErr) newErrors.brand = brandErr;

    const modelErr = validateRequired(formData.model, isMobile ? 'Model name' : 'Product / Item name');
    if (modelErr) newErrors.model = modelErr;

    const purchaseErr = validatePrice(formData.purchase_price, 'Purchase price');
    if (purchaseErr) newErrors.purchase_price = purchaseErr;

    const sellingErr = validatePrice(formData.selling_price, 'Selling price');
    if (sellingErr) newErrors.selling_price = sellingErr;

    if (isMobile) {
      const imei1Err = validateIMEI(formData.imei_1, true, 'IMEI 1');
      if (ime1Err) newErrors.imei_1 = imei1Err;

      if (formData.imei_2) {
        const imei2Err = validateIMEI(formData.imei_2, false, 'IMEI 2');
        if (imei2Err) newErrors.imei_2 = imei2Err;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      let finalBarcode = formData.barcode;
      if (!isMobile && !finalBarcode) {
        finalBarcode = `SKU-${Date.now().toString().slice(-6)}`;
      }

      const imeiBarcodePayload = isMobile
        ? (formData.imei_2 ? `${formData.imei_1}, ${formData.imei_2}` : formData.imei_1)
        : finalBarcode;

      const payload = {
        category_id: formData.category_id || (localCategories[0]?.category_id || 1),
        supplier_id: formData.supplier_id || null,
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        color: formData.color.trim() || 'Standard',
        imei_barcode: imeiBarcodePayload,
        purchase_price: Number(formData.purchase_price),
        selling_price: Number(formData.selling_price),
        stock_quantity: isMobile ? 1 : Number(formData.stock_quantity || 1),
        status: 'In Stock'
      };

      const newProd = await createProduct(payload);
      if (onProductAdded) onProductAdded(newProd);
      onClose();
    } catch (err) {
      alert(err.message || 'Error creating product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 640 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#e0f2f1',
              color: '#00838f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isMobile ? <Smartphone size={22} /> : <Box size={22} />}
            </div>
            <div>
              <h3 className="modal-title">
                {isMobile ? 'Add New Mobile Phone' : 'Add New Accessory / Non-Phone Item'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {isMobile
                  ? 'Individual serialized phone with unique 15-digit Dual IMEI tracking'
                  : 'Bulk accessories, chargers, cables, earbuds & spare parts inventory'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* 1. Mode Switcher (Modern Segmented Pill) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.35rem',
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}
            >
              <button
                type="button"
                onClick={() => setItemType('mobile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: isMobile ? 700 : 500,
                  cursor: 'pointer',
                  background: isMobile ? '#00838f' : 'transparent',
                  color: isMobile ? '#ffffff' : '#64748b',
                  boxShadow: isMobile ? '0 2px 6px rgba(0, 131, 143, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Smartphone size={16} />
                <span>Mobile Phone (Dual IMEI)</span>
              </button>

              <button
                type="button"
                onClick={() => setItemType('accessory')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: !isMobile ? 700 : 500,
                  cursor: 'pointer',
                  background: !isMobile ? '#00838f' : 'transparent',
                  color: !isMobile ? '#ffffff' : '#64748b',
                  boxShadow: !isMobile ? '0 2px 6px rgba(0, 131, 143, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Box size={16} />
                <span>Accessories & Non-Phone</span>
              </button>
            </div>

            {/* 2. Brand & Model Information */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Brand *</label>
                <input
                  type="text"
                  placeholder={isMobile ? 'e.g. Apple, Samsung, Vivo' : 'e.g. Anker, Baseus, Ronin'}
                  className={`form-input ${errors.brand ? 'input-error' : ''}`}
                  value={formData.brand}
                  onChange={(e) => {
                    setFormData({ ...formData, brand: e.target.value });
                    if (errors.brand) setErrors(prev => ({ ...prev, brand: null }));
                  }}
                  autoFocus
                />
                {errors.brand && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertCircle size={12} />
                    <span>{errors.brand}</span>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{isMobile ? 'Model Name / Variant *' : 'Product / Item Name *'}</label>
                <input
                  type="text"
                  placeholder={isMobile ? 'e.g. iPhone 15 Pro 128GB (Natural)' : 'e.g. 65W Fast Charger Type-C Cable'}
                  className={`form-input ${errors.model ? 'input-error' : ''}`}
                  value={formData.model}
                  onChange={(e) => {
                    setFormData({ ...formData, model: e.target.value });
                    if (errors.model) setErrors(prev => ({ ...prev, model: null }));
                  }}
                />
                {errors.model && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertCircle size={12} />
                    <span>{errors.model}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Category & Supplier Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Category *</label>
                  <button
                    type="button"
                    onClick={() => setQuickCatOpen(!quickCatOpen)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#00838f',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <Plus size={12} />
                    <span>Add New</span>
                  </button>
                </div>
                <select
                  className="form-input"
                  value={formData.category_id}
                  onChange={(e) => {
                    const catId = e.target.value;
                    const cat = localCategories.find(c => String(c.category_id) === String(catId));
                    setFormData({ ...formData, category_id: catId });
                    if (cat) {
                      if (cat.track_type === 'Serialized') setItemType('mobile');
                      else setItemType('accessory');
                    }
                  }}
                >
                  {localCategories.map(c => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.name} ({c.track_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Supplier (Optional)</label>
                <select
                  className="form-input"
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                >
                  <option value="">Direct / Self Sourced</option>
                  {suppliers.map(s => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.company_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Add Category inline */}
            {quickCatOpen && (
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  background: '#f8fafc',
                  padding: '0.6rem 0.8rem',
                  borderRadius: 8,
                  border: '1px dashed #cbd5e1',
                  alignItems: 'center'
                }}
              >
                <input
                  type="text"
                  placeholder={`New ${isMobile ? 'phone' : 'accessory'} category name...`}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="form-input"
                  style={{ flex: 1, height: 34, fontSize: '0.82rem' }}
                />
                <button
                  type="button"
                  onClick={handleQuickAddCategory}
                  className="btn-primary-teal"
                  style={{ height: 34, padding: '0 0.85rem', fontSize: '0.8rem' }}
                >
                  Save Category
                </button>
                <button
                  type="button"
                  onClick={() => setQuickCatOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* 4. Serialized IMEI vs Barcode Card */}
            {isMobile ? (
              <div style={{ background: '#f0fdfa', padding: '1rem', borderRadius: 10, border: '1px solid #ccfbf1' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f766e', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Smartphone size={16} />
                  <span>Dual IMEI Serial Number Registration (15 Digits)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label className="form-label" style={{ margin: 0 }}>IMEI 1 (Primary) *</label>
                      <span style={{ fontSize: '0.72rem', color: formData.imei_1.length === 15 ? '#10b981' : '#64748b', fontWeight: 600 }}>
                        {formData.imei_1.length}/15 digits
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="15-digit IMEI 1"
                      className={`form-input ${errors.imei_1 ? 'input-error' : ''}`}
                      value={formData.imei_1}
                      onChange={(e) => handleImeiChange('imei_1', e.target.value)}
                      maxLength={15}
                    />
                    {errors.imei_1 && (
                      <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertCircle size={12} />
                        <span>{errors.imei_1}</span>
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label className="form-label" style={{ margin: 0 }}>IMEI 2 (Optional)</label>
                      <span style={{ fontSize: '0.72rem', color: formData.imei_2.length === 15 ? '#10b981' : '#64748b', fontWeight: 600 }}>
                        {formData.imei_2.length}/15 digits
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="15-digit IMEI 2 (eSIM / SIM 2)"
                      className={`form-input ${errors.imei_2 ? 'input-error' : ''}`}
                      value={formData.imei_2}
                      onChange={(e) => handleImeiChange('imei_2', e.target.value)}
                      maxLength={15}
                    />
                    {errors.imei_2 && (
                      <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertCircle size={12} />
                        <span>{errors.imei_2}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <QrCode size={16} color="#00838f" />
                    <span>Barcode / SKU Code</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#e0f2f1',
                      color: '#00695c',
                      border: '1px solid #b2dfdb',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Generate SKU Code</span>
                  </button>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    placeholder="Scan product barcode, or click 'Generate SKU Code'"
                    className="form-input"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                    Leave blank to automatically assign a unique SKU code upon saving.
                  </p>
                </div>
              </div>
            )}

            {/* 5. Pricing & Stock with Live Profit Margin Estimation */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Purchase Cost (Rs) *</label>
                <input
                  type="number"
                  placeholder="0"
                  className={`form-input ${errors.purchase_price ? 'input-error' : ''}`}
                  value={formData.purchase_price}
                  onChange={(e) => {
                    setFormData({ ...formData, purchase_price: e.target.value });
                    if (errors.purchase_price) setErrors(prev => ({ ...prev, purchase_price: null }));
                  }}
                />
                {errors.purchase_price && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertCircle size={12} />
                    <span>{errors.purchase_price}</span>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Selling Price (Rs) *</label>
                <input
                  type="number"
                  placeholder="0"
                  className={`form-input ${errors.selling_price ? 'input-error' : ''}`}
                  value={formData.selling_price}
                  onChange={(e) => {
                    setFormData({ ...formData, selling_price: e.target.value });
                    if (errors.selling_price) setErrors(prev => ({ ...prev, selling_price: null }));
                  }}
                />
                {errors.selling_price && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertCircle size={12} />
                    <span>{errors.selling_price}</span>
                  </div>
                )}
              </div>

              {!isMobile && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Stock Quantity (Pcs) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="10"
                    className="form-input"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: Math.max(1, Number(e.target.value || 1)) })}
                    style={{ fontWeight: 600 }}
                  />
                </div>
              )}
            </div>

            {/* Profit Margin Preview Pill */}
            {purchaseNum > 0 && sellingNum > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.9rem',
                borderRadius: 8,
                background: profitMargin >= 0 ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${profitMargin >= 0 ? '#bbf7d0' : '#fecaca'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: profitMargin >= 0 ? '#166534' : '#991b1b', fontWeight: 600 }}>
                  <TrendingUp size={15} />
                  <span>Estimated Profit / Unit:</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: profitMargin >= 0 ? '#15803d' : '#dc2626' }}>
                  Rs. {profitMargin.toLocaleString()} {profitPercentage && `(+${profitPercentage}%)`}
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-teal" disabled={loading}>
              {loading ? 'Saving Item...' : (isMobile ? 'Save Mobile Phone' : 'Save Accessory Stock')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
