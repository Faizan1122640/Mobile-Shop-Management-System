import React, { useState } from 'react';
import {
  ShoppingBag,
  CreditCard,
  Plus,
  Search,
  Filter,
  DollarSign,
  ArrowUpRight,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Eye
} from 'lucide-react';

export default function SupplierPaymentsView({
  ledgerData = [],
  purchases = [],
  payments = [],
  suppliers = [],
  onOpenInwardStock,
  onOpenMakePayment,
  onOpenLedger,
  onOpenAddSupplier
}) {
  const [activeTab, setActiveTab] = useState('balances'); // 'balances', 'invoices', 'payments'
  const [search, setSearch] = useState('');

  // Calculate Top KPI Metrics
  const totalPurchases = ledgerData.reduce((sum, l) => sum + Number(l.total_billed || 0), 0);
  const totalPaid = ledgerData.reduce((sum, l) => sum + Number(l.total_paid || 0), 0);
  const totalPending = ledgerData.reduce((sum, l) => sum + Number(l.pending_balance || 0), 0);

  const filteredLedger = ledgerData.filter(l =>
    l.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPurchases = purchases.filter(p =>
    p.invoice_no?.toLowerCase().includes(search.toLowerCase()) ||
    p.suppliers?.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPayments = payments.filter(pay =>
    pay.reference_no?.toLowerCase().includes(search.toLowerCase()) ||
    pay.suppliers?.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="content-body">
      {/* 1. Top KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="dashboard-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e0f2f1', color: '#00838f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>TOTAL PURCHASES</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>Rs. {totalPurchases.toLocaleString()}</div>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>TOTAL PAID</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>
              Rs. {totalPaid.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: totalPending > 0 ? '#fff1f2' : '#ecfdf5', color: totalPending > 0 ? '#e11d48' : '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>PENDING SUPPLIER DEBT</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: totalPending > 0 ? '#e11d48' : '#059669' }}>
              Rs. {totalPending.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>ACTIVE SUPPLIERS</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              {suppliers.length} Vendors
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Card with Tabs */}
      <div className="dashboard-card">
        {/* Header Actions */}
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Supplier Purchases & Payments Ledger</h3>
            <p className="card-subtitle">Manage bulk stock inwards, auto-inventory injection, and supplier debts</p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button className="btn-secondary" onClick={onOpenMakePayment}>
              <CreditCard size={16} />
              <span>Make Payment</span>
            </button>
            <button className="btn-primary-teal" onClick={onOpenInwardStock}>
              <ShoppingBag size={16} />
              <span>Inward Stock Purchase</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '1.5rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('balances')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'balances' ? '2px solid #00838f' : '2px solid transparent',
              padding: '0.6rem 0',
              fontWeight: activeTab === 'balances' ? 700 : 500,
              color: activeTab === 'balances' ? '#00838f' : '#64748b',
              cursor: 'pointer',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '-2px'
            }}
          >
            <DollarSign size={16} />
            <span>Supplier Balances & Ledger ({ledgerData.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'invoices' ? '2px solid #00838f' : '2px solid transparent',
              padding: '0.6rem 0',
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
            <span>Inward Purchase Invoices ({purchases.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'payments' ? '2px solid #00838f' : '2px solid transparent',
              padding: '0.6rem 0',
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

        {/* Search Filter */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
          <div className="input-with-icon" style={{ flex: 1, maxWidth: 380 }}>
            <Search className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder={activeTab === 'balances' ? 'Search supplier or contact...' : 'Search invoice or supplier...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* 3. Tab Content */}

        {/* TAB 1: Balances & Ledger */}
        {activeTab === 'balances' && (
          <div className="table-responsive">
            {filteredLedger.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <ShoppingBag size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>No supplier ledger records found. Click "+ Inward Stock Purchase" to record purchases.</p>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Supplier Company</th>
                    <th>Contact Info</th>
                    <th>Invoices</th>
                    <th>Total Purchases</th>
                    <th>Total Paid</th>
                    <th>Pending Balance</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.map(l => (
                    <tr key={l.supplier_id}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{l.company_name}</td>
                      <td>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{l.contact_person || '—'}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{l.phone || 'No phone'}</div>
                      </td>
                      <td>
                        <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: '0.78rem', fontWeight: 600 }}>
                          {l.invoices_count || 0} Bills
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>Rs. {Number(l.total_billed || 0).toLocaleString()}</td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>Rs. {Number(l.total_paid || 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 800, color: Number(l.pending_balance) > 0 ? '#e11d48' : '#00838f' }}>
                        Rs. {Number(l.pending_balance || 0).toLocaleString()}
                      </td>
                      <td>
                        <span className={`status-badge ${l.status === 'Settled' ? 'completed' : l.status === 'Partial' ? 'process' : 'pending'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn-secondary"
                            onClick={() => onOpenLedger(l)}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            title="View Statement"
                          >
                            <FileText size={14} />
                            <span>Statement</span>
                          </button>
                          {Number(l.pending_balance) > 0 && (
                            <button
                              className="btn-primary-teal"
                              onClick={() => onOpenMakePayment(l)}
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <CreditCard size={14} />
                              <span>Pay</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: Purchase Invoices */}
        {activeTab === 'invoices' && (
          <div className="table-responsive">
            {filteredPurchases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <FileText size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>No inward stock invoices recorded yet.</p>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Items Breakdown</th>
                    <th>Total Bill</th>
                    <th>Paid</th>
                    <th>Pending Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map(p => (
                    <tr key={p.purchase_id}>
                      <td style={{ fontWeight: 700, color: '#00838f' }}>{p.invoice_no}</td>
                      <td>{new Date(p.purchase_date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>{p.suppliers?.company_name || 'Vendor'}</td>
                      <td>
                        <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                          {(p.supplier_purchase_items || []).map((it, idx) => (
                            <span key={idx} style={{ display: 'inline-block', marginRight: '0.4rem' }}>
                              {it.brand} {it.model} ({it.quantity}x)
                            </span>
                          ))}
                          {(!p.supplier_purchase_items || p.supplier_purchase_items.length === 0) && 'Stock Items'}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700 }}>Rs. {Number(p.total_amount).toLocaleString()}</td>
                      <td style={{ color: '#16a34a' }}>Rs. {Number(p.paid_amount).toLocaleString()}</td>
                      <td style={{ color: Number(p.pending_balance) > 0 ? '#e11d48' : '#64748b', fontWeight: 700 }}>
                        Rs. {Number(p.pending_balance).toLocaleString()}
                      </td>
                      <td>
                        <span className={`status-badge ${p.payment_status === 'Paid' ? 'completed' : p.payment_status === 'Partial' ? 'process' : 'pending'}`}>
                          {p.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: Payment Transactions */}
        {activeTab === 'payments' && (
          <div className="table-responsive">
            {filteredPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <CreditCard size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>No payment transactions recorded yet.</p>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Amount Paid</th>
                    <th>Payment Mode</th>
                    <th>Reference / Cheque #</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(pay => (
                    <tr key={pay.payment_id}>
                      <td>{new Date(pay.payment_date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 700 }}>{pay.suppliers?.company_name || 'Vendor'}</td>
                      <td style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.95rem' }}>
                        Rs. {Number(pay.amount_paid).toLocaleString()}
                      </td>
                      <td>
                        <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                          {pay.payment_method || 'Cash'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#64748b' }}>{pay.reference_no || `PAY-${pay.payment_id}`}</td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{pay.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
