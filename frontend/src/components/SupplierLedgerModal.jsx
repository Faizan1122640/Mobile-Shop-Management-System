import React, { useState } from 'react';
import { X, FileText, ShoppingBag, CreditCard, Printer, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SupplierLedgerModal({
  isOpen,
  onClose,
  supplier = null,
  onOpenPayment
}) {
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' or 'payments'

  if (!isOpen || !supplier) return null;

  const purchases = supplier.purchases || [];
  const payments = supplier.payments || [];
  const totalBilled = Number(supplier.total_billed || 0);
  const totalPaid = Number(supplier.total_paid || 0);
  const pendingDebt = Number(supplier.pending_balance || 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 840, maxHeight: '90vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: '#e0f2f1', color: '#00838f', padding: '0.5rem', borderRadius: 8 }}>
              <FileText size={22} />
            </div>
            <div>
              <h3 className="modal-title">{supplier.company_name} - Supplier Ledger</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Contact: {supplier.contact_person || 'N/A'} | Phone: {supplier.phone || 'N/A'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handlePrint}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Printer size={15} />
              <span>Print Statement</span>
            </button>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top Balance Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Inward Purchases</span>
              <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                Rs. {totalBilled.toLocaleString()}
              </h4>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{purchases.length} invoices recorded</span>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Total Payments Cleared</span>
              <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>
                Rs. {totalPaid.toLocaleString()}
              </h4>
              <span style={{ fontSize: '0.7rem', color: '#16a34a' }}>{payments.length} transactions</span>
            </div>

            <div style={{ background: pendingDebt > 0 ? '#fff1f2' : '#f8fafc', border: `1px solid ${pendingDebt > 0 ? '#fecdd3' : '#e2e8f0'}`, borderRadius: 10, padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: pendingDebt > 0 ? '#be123c' : '#64748b', fontWeight: 600 }}>Outstanding Debt</span>
              <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: pendingDebt > 0 ? '#e11d48' : '#00838f', marginTop: '0.2rem' }}>
                Rs. {pendingDebt.toLocaleString()}
              </h4>
              <span style={{ fontSize: '0.7rem', color: pendingDebt > 0 ? '#e11d48' : '#16a34a', fontWeight: 600 }}>
                {pendingDebt === 0 ? '✓ Account Settled' : '⚠️ Balance Due'}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'invoices' ? '2px solid #00838f' : '2px solid transparent',
                padding: '0.5rem 0',
                fontWeight: activeTab === 'invoices' ? 700 : 500,
                color: activeTab === 'invoices' ? '#00838f' : '#64748b',
                cursor: 'pointer',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '-2px'
              }}
            >
              <ShoppingBag size={16} />
              <span>Purchase Invoices ({purchases.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'payments' ? '2px solid #00838f' : '2px solid transparent',
                padding: '0.5rem 0',
                fontWeight: activeTab === 'payments' ? 700 : 500,
                color: activeTab === 'payments' ? '#00838f' : '#64748b',
                cursor: 'pointer',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '-2px'
              }}
            >
              <CreditCard size={16} />
              <span>Payment History ({payments.length})</span>
            </button>
          </div>

          {/* Invoices List */}
          {activeTab === 'invoices' && (
            <div>
              {purchases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No purchases recorded from this supplier yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Date</th>
                        <th>Total Bill</th>
                        <th>Paid</th>
                        <th>Pending</th>
                        <th>Status</th>
                        <th>Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map(p => (
                        <tr key={p.purchase_id}>
                          <td style={{ fontWeight: 600 }}>{p.invoice_no}</td>
                          <td>{new Date(p.purchase_date).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 700 }}>Rs. {Number(p.total_amount).toLocaleString()}</td>
                          <td style={{ color: '#16a34a' }}>Rs. {Number(p.paid_amount).toLocaleString()}</td>
                          <td style={{ color: Number(p.pending_balance) > 0 ? '#e11d48' : '#64748b', fontWeight: 600 }}>
                            Rs. {Number(p.pending_balance).toLocaleString()}
                          </td>
                          <td>
                            <span className={`status-badge ${p.payment_status === 'Paid' ? 'completed' : p.payment_status === 'Partial' ? 'process' : 'pending'}`}>
                              {p.payment_status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{p.payment_method || 'Cash'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Payments List */}
          {activeTab === 'payments' && (
            <div>
              {payments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No payment transactions recorded yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reference / Receipt #</th>
                        <th>Amount Paid</th>
                        <th>Payment Mode</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(pay => (
                        <tr key={pay.payment_id}>
                          <td>{new Date(pay.payment_date).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 600 }}>{pay.reference_no || `PAY-${pay.payment_id}`}</td>
                          <td style={{ fontWeight: 700, color: '#16a34a' }}>
                            Rs. {Number(pay.amount_paid).toLocaleString()}
                          </td>
                          <td>
                            <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                              {pay.payment_method || 'Cash'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{pay.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {pendingDebt > 0 && onOpenPayment && (
            <button
              type="button"
              className="btn-primary-teal"
              onClick={() => {
                onClose();
                onOpenPayment(supplier);
              }}
            >
              <CreditCard size={16} />
              <span>Make Payment (Rs. {pendingDebt.toLocaleString()})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
