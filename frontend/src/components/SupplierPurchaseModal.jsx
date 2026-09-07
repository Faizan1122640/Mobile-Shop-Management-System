import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShoppingBag, DollarSign, Calculator, CheckCircle2, AlertCircle, Barcode, Smartphone, Layers } from 'lucide-react';
import { createSupplierPurchase } from '../services/api';

export default function SupplierPurchaseModal({
  isOpen,
  onClose,
  suppliers = [],
  categories = [],
  onPurchaseCompleted,
  onOpenAddSupplier
}) {
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Multi-Line Items
  const [items, setItems] = useState([
    {
      id: 1,
      brand: '',
      model: '',
      category_id: '',
      track_type: 'Serialized',
      quantity: 1,
      imei_input: '',
      unit_cost: '',
      selling_price: ''
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      setInvoiceNo(`INV-SUP-${Date.now().toString().slice(-6)}`);
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      if (suppliers.length > 0 && !supplierId) {
        setSupplierId(suppliers[0].supplier_id);
      }
      if (categories.length > 0) {
        setItems(prev => prev.map(item => ({
          ...item,
          category_id: item.category_id || categories[0].category_id
        })));
      }
    }
  }, [isOpen, suppliers, categories]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        brand: '',
        model: '',
        category_id: categories[0]?.category_id || '',
        track_type: 'Serialized',
        quantity: 1,
        imei_input: '',
        unit_cost: '',
        selling_price: ''
      }
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };

      // If user inputs IMEIs, automatically sync quantity for Serialized products
      if (field === 'imei_input' && item.track_type === 'Serialized') {
        const count = value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).length;
        if (count > 0) updated.quantity = count;
      }

      // Auto-suggest selling price at 15% margin if blank or calculated
      if (field === 'unit_cost' && Number(value) > 0 && (!item.selling_price || Number(item.selling_price) === Number(item.unit_cost) * 1.15)) {
        updated.selling_price = Math.round(Number(value) * 1.15);
      }

      return updated;
    }));
  };

  // Calculate invoice totals
  const totalAmount = items.reduce((sum, item) => {
    const qty = Number(item.quantity || 1);
    const cost = Number(item.unit_cost || 0);
    return sum + (qty * cost);
  }, 0);

  const pendingBalance = Math.max(0, totalAmount - Number(paidAmount || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      alert('Please select a supplier');
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.brand.trim() || !it.model.trim()) {
        alert(`Please provide Brand and Model for item #${i + 1}`);
        return;
      }
      if (!it.unit_cost || Number(it.unit_cost) <= 0) {
        alert(`Please provide a valid Unit Cost for item #${i + 1}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        supplier_id: supplierId,
        invoice_no: invoiceNo,
        purchase_date: purchaseDate,
        paid_amount: Number(paidAmount || 0),
        payment_method: paymentMethod,
        notes,
        items: items.map(it => ({
          brand: it.brand.trim(),
          model: it.model.trim(),
          category_id: it.category_id || categories[0]?.category_id,
          track_type: it.track_type,
          quantity: Number(it.quantity || 1),
          imei_list: it.track_type === 'Serialized' ? it.imei_input : null,
          unit_cost: Number(it.unit_cost),
          selling_price: Number(it.selling_price || (Number(it.unit_cost) * 1.15)),
          total_cost: Number(it.quantity || 1) * Number(it.unit_cost)
        }))
      };

      const res = await createSupplierPurchase(payload);
      if (onPurchaseCompleted) onPurchaseCompleted(res);
      onClose();
    } catch (err) {
      alert('Failed to save purchase: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 940, maxHeight: '92vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#e0f2f1', color: '#00838f', padding: '0.5rem', borderRadius: 8 }}>
              <ShoppingBag size={22} />
            </div>
            <div>
              <h3 className="modal-title">Supplier Inward Stock Purchase</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Purchased products are automatically injected into inventory stock and IMEI master
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Purchase Meta Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
              gap: '0.85rem',
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: 10,
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <label className="form-label">Select Supplier *</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <select
                    className="form-input"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    required
                    style={{ paddingLeft: '0.75rem' }}
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.supplier_id} value={s.supplier_id}>
                        {s.company_name} ({s.phone || 'No phone'})
                      </option>
                    ))}
                  </select>
                  {onOpenAddSupplier && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={onOpenAddSupplier}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                      title="Add New Supplier"
                    >
                      + New
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label">Invoice / Bill #</label>
                <input
                  type="text"
                  className="form-input"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="e.g. INV-1002"
                  style={{ paddingLeft: '0.75rem' }}
                />
              </div>

              <div>
                <label className="form-label">Purchase Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  style={{ paddingLeft: '0.75rem' }}
                />
              </div>

              <div>
                <label className="form-label">Payment Method</label>
                <select
                  className="form-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ paddingLeft: '0.75rem' }}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Online">Online / EasyPaisa</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* Line Items Builder */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} color="#00838f" />
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Purchased Stock Items ({items.length})</h4>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleAddItem}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Plus size={15} />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      padding: '0.9rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#00838f', background: '#e0f2f1', padding: '2px 8px', borderRadius: 6 }}>
                        Item #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem' }}
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1.2fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Brand *</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="e.g. Apple / Samsung"
                          value={item.brand}
                          onChange={(e) => handleItemChange(item.id, 'brand', e.target.value)}
                          style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Model / Product Name *</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="e.g. iPhone 15 Pro 128GB"
                          value={item.model}
                          onChange={(e) => handleItemChange(item.id, 'model', e.target.value)}
                          style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Category</label>
                        <select
                          className="form-input"
                          value={item.category_id}
                          onChange={(e) => handleItemChange(item.id, 'category_id', e.target.value)}
                          style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                        >
                          {categories.map(c => (
                            <option key={c.category_id} value={c.category_id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Track Type</label>
                        <select
                          className="form-input"
                          value={item.track_type}
                          onChange={(e) => handleItemChange(item.id, 'track_type', e.target.value)}
                          style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                        >
                          <option value="Serialized">Phones (IMEI)</option>
                          <option value="Bulk">Bulk (Accessories)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr', gap: '0.6rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>
                          Quantity {item.track_type === 'Serialized' ? '(Auto from IMEIs)' : ''}
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          className="form-input"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Unit Purchase Cost (Rs.) *</label>
                        <input
                          type="number"
                          min="0"
                          required
                          className="form-input"
                          placeholder="Cost per unit"
                          value={item.unit_cost}
                          onChange={(e) => handleItemChange(item.id, 'unit_cost', e.target.value)}
                          style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Selling Price (Rs.)</label>
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          placeholder="Retail price"
                          value={item.selling_price}
                          onChange={(e) => handleItemChange(item.id, 'selling_price', e.target.value)}
                          style={{ padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Item Subtotal:</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#00838f' }}>
                          Rs. {(Number(item.quantity || 1) * Number(item.unit_cost || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Serialized IMEI input */}
                    {item.track_type === 'Serialized' && (
                      <div style={{ marginTop: '0.6rem', background: '#f0fdf4', padding: '0.6rem', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                          <Barcode size={15} color="#16a34a" />
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534' }}>
                            Scan or Paste 15-Digit IMEIs (Separated by comma or new line)
                          </label>
                        </div>
                        <textarea
                          rows={2}
                          className="form-input"
                          placeholder="e.g. 354890123456781, 354890123456782"
                          value={item.imei_input}
                          onChange={(e) => handleItemChange(item.id, 'imei_input', e.target.value)}
                          style={{ padding: '0.45rem', fontSize: '0.78rem', fontFamily: 'monospace' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Ledger Calculation Summary */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 12,
              padding: '1rem',
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr',
              gap: '1rem',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Purchase Bill</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  Rs. {totalAmount.toLocaleString()}
                </h3>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '0.2rem' }}>Paid Amount Now (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  className="form-input"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  style={{ padding: '0.45rem 0.65rem', fontWeight: 700 }}
                />
                <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem' }}>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(totalAmount)}
                    style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', fontSize: '0.68rem', padding: '2px 6px', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Full (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(Math.round(totalAmount / 2))}
                    style={{ background: '#fef9c3', border: '1px solid #fde047', color: '#854d0e', fontSize: '0.68rem', padding: '2px 6px', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Half (50%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(0)}
                    style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: '0.68rem', padding: '2px 6px', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Unpaid (Rs 0)
                  </button>
                </div>
              </div>

              <div style={{
                background: pendingBalance > 0 ? '#fff1f2' : '#f0fdf4',
                padding: '0.75rem',
                borderRadius: 8,
                border: `1px solid ${pendingBalance > 0 ? '#fecdd3' : '#bbf7d0'}`
              }}>
                <span style={{ fontSize: '0.75rem', color: pendingBalance > 0 ? '#be123c' : '#15803d', fontWeight: 600 }}>
                  Remaining Supplier Debt:
                </span>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: pendingBalance > 0 ? '#e11d48' : '#16a34a' }}>
                  Rs. {pendingBalance.toLocaleString()}
                </h4>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {pendingBalance === 0 ? '✓ Fully Paid' : '⏳ Added to Supplier Ledger'}
                </span>
              </div>
            </div>

            <div>
              <label className="form-label">Notes / Remarks (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Batch received via TCS courier"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ padding: '0.45rem 0.75rem' }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.9rem 1.25rem', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              💡 Products will be automatically available in Inventory & POS
            </span>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary-teal" disabled={submitting || totalAmount <= 0}>
                <span>{submitting ? 'Saving & Injecting Stock...' : 'Save Purchase & Inject Stock'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
