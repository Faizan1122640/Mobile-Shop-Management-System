import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { createSupplierPayment } from '../services/api';

export default function SupplierPaymentModal({
  isOpen,
  onClose,
  supplier = null,
  suppliers = [],
  onPaymentRecorded
}) {
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setSelectedSupplierId(supplier.supplier_id);
        if (supplier.pending_balance > 0) {
          setAmount(supplier.pending_balance);
        }
      } else if (suppliers.length > 0) {
        setSelectedSupplierId(suppliers[0].supplier_id);
      }
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setReferenceNo(`PAY-${Date.now().toString().slice(-6)}`);
    }
  }, [isOpen, supplier, suppliers]);

  if (!isOpen) return null;

  const activeSupplier = suppliers.find(s => s.supplier_id === Number(selectedSupplierId)) || supplier;
  const pendingDebt = activeSupplier?.pending_balance ?? 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!selectedSupplierId) {
      alert('Please select a supplier');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        supplier_id: Number(selectedSupplierId),
        amount_paid: numAmount,
        payment_method: paymentMethod,
        reference_no: referenceNo,
        notes,
        payment_date: paymentDate
      };

      const res = await createSupplierPayment(payload);
      if (onPaymentRecorded) onPaymentRecorded(res);
      onClose();
    } catch (err) {
      alert('Failed to record payment: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.5rem', borderRadius: 8 }}>
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="modal-title">Record Supplier Payment</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Make installment or full payment against supplier ledger</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Supplier Selector */}
            <div className="form-group">
              <label className="form-label">Supplier *</label>
              <select
                className="form-input"
                value={selectedSupplierId}
                onChange={(e) => {
                  setSelectedSupplierId(e.target.value);
                  const s = suppliers.find(sup => sup.supplier_id === Number(e.target.value));
                  if (s && s.pending_balance > 0) {
                    setAmount(s.pending_balance);
                  }
                }}
                required
                style={{ paddingLeft: '0.75rem' }}
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map(s => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.company_name} (Pending: Rs. {(s.pending_balance || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Debt Card */}
            {activeSupplier && (
              <div style={{
                background: pendingDebt > 0 ? '#fff1f2' : '#f0fdf4',
                border: `1px solid ${pendingDebt > 0 ? '#fecdd3' : '#bbf7d0'}`,
                borderRadius: 10,
                padding: '0.85rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Outstanding Balance</span>
                  <strong style={{ fontSize: '1.2rem', color: pendingDebt > 0 ? '#e11d48' : '#16a34a' }}>
                    Rs. {Number(pendingDebt).toLocaleString()}
                  </strong>
                </div>
                {pendingDebt > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(pendingDebt)}
                    style={{
                      background: '#e11d48',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.35rem 0.65rem',
                      cursor: 'pointer'
                    }}
                  >
                    Pay Full Debt
                  </button>
                )}
              </div>
            )}

            {/* Payment Amount */}
            <div className="form-group">
              <label className="form-label">Payment Amount (Rs.) *</label>
              <input
                type="number"
                min="1"
                required
                className="form-input"
                placeholder="e.g. 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00838f', paddingLeft: '0.75rem' }}
              />
            </div>

            {/* Payment Method & Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select
                  className="form-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ paddingLeft: '0.75rem' }}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Online">Online / Mobile Wallet</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  style={{ paddingLeft: '0.75rem' }}
                />
              </div>
            </div>

            {/* Reference & Notes */}
            <div className="form-group">
              <label className="form-label">Reference / Transaction ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Cheque # / Bank Ref"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                style={{ paddingLeft: '0.75rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes / Remarks</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Paid via HBL branch transfer"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ paddingLeft: '0.75rem' }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-teal" disabled={submitting || !amount}>
              <span>{submitting ? 'Recording...' : 'Record Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
