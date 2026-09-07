import React, { useState } from 'react';
import { ShoppingCart, Plus, Search, Eye, Printer, Trash2, Calendar, User, Phone, CheckCircle2, DollarSign, Package, X } from 'lucide-react';
import { deleteSale } from '../services/api';

export default function SalesView({ sales = [], onOpenPos, onRefresh, onDeleteSale }) {
  const [search, setSearch] = useState('');
  const [viewInvoice, setViewInvoice] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const filteredSales = sales.filter(s => {
    const q = search.toLowerCase();
    const invId = `inv-${s.sale_id}`.toLowerCase();
    const rawId = String(s.sale_id || '');
    const custName = (s.customers?.name || s.customer_name || 'Walk-in Customer').toLowerCase();
    const custPhone = (s.customers?.phone || s.customer_phone || '').toLowerCase();
    const itemsMatch = s.sale_items?.some(item =>
      item.products?.model?.toLowerCase().includes(q) ||
      item.products?.brand?.toLowerCase().includes(q)
    );

    return invId.includes(q) || rawId.includes(q) || custName.includes(q) || custPhone.includes(q) || itemsMatch;
  });

  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.sale_date && s.sale_date.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);

  const handleDelete = async (saleId) => {
    if (!window.confirm(`Are you sure you want to cancel / delete Sale Invoice #INV-${String(saleId).padStart(4, '0')}?`)) {
      return;
    }
    try {
      setDeletingId(saleId);
      await deleteSale(saleId);
      if (onDeleteSale) onDeleteSale(saleId);
      else if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to delete sale: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="content-body">
      {/* Metric Cards Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="dashboard-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingCart size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>TOTAL INVOICES</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{sales.length} Invoices</div>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e0f2f1', color: '#00838f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>TODAY'S SALES</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#00838f' }}>
              Rs. {todayRevenue.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>TOTAL GROSS REVENUE</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7c3aed' }}>
              Rs. {totalRevenue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        {/* Header */}
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Sales Invoices & Transactions</h3>
            <p className="card-subtitle">Complete sales register, customer receipts, itemized billing records</p>
          </div>
          <button className="btn-primary-teal" onClick={onOpenPos}>
            <Plus size={16} />
            <span>New Sale (POS)</span>
          </button>
        </div>

        {/* Search & Stats Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
          <div className="input-with-icon" style={{ flex: 1, maxWidth: 420 }}>
            <Search className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by Invoice #, Customer Name, Phone, or Item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
            Showing {filteredSales.length} of {sales.length} Invoices
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>INVOICE #</th>
                <th>CUSTOMER</th>
                <th>ITEMS SOLD</th>
                <th>DATE & TIME</th>
                <th>TOTAL AMOUNT</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <ShoppingCart size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                    <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>No sales invoice records found.</p>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Complete a sale through the POS billing terminal to record transactions.</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const custName = s.customers?.name || s.customer_name || 'Walk-in Customer';
                  const custPhone = s.customers?.phone || s.customer_phone || '';
                  const itemsCount = s.sale_items?.length || 0;
                  const totalUnits = s.sale_items?.reduce((acc, item) => acc + Number(item.quantity || 1), 0) || 0;
                  const dateFormatted = s.sale_date ? new Date(s.sale_date).toLocaleString() : 'N/A';

                  return (
                    <tr key={s.sale_id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#00838f', fontSize: '0.92rem' }}>
                          #INV-{String(s.sale_id).padStart(4, '0')}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' }}>
                            {custName}
                          </div>
                          {custPhone && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              📞 {custPhone}
                            </div>
                          )}
                          {!custPhone && (
                            <span style={{ fontSize: '0.7rem', background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: 4, color: '#64748b' }}>
                              Counter Cash
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: 260 }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                            {itemsCount} {itemsCount === 1 ? 'Product' : 'Products'} ({totalUnits} {totalUnits === 1 ? 'unit' : 'units'})
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                            {s.sale_items?.slice(0, 3).map((item, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '0.7rem',
                                  background: '#e0f2fe',
                                  color: '#0369a1',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: 4,
                                  fontWeight: 500
                                }}
                              >
                                {item.products?.brand} {item.products?.model || 'Item'} (x{item.quantity})
                              </span>
                            ))}
                            {itemsCount > 3 && (
                              <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#64748b', padding: '0.1rem 0.3rem', borderRadius: 4 }}>
                                +{itemsCount - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                          {dateFormatted}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f766e', fontSize: '0.95rem' }}>
                          Rs {Number(s.total_amount || 0).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: 20,
                          background: '#dcfce7',
                          color: '#15803d'
                        }}>
                          ✅ Paid
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            title="View / Print Receipt"
                            onClick={() => setViewInvoice(s)}
                            style={{
                              padding: '0.4rem 0.65rem',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              borderRadius: 6,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#00838f'
                            }}
                          >
                            <Eye size={13} />
                            <span>Receipt</span>
                          </button>
                          <button
                            title="Delete Invoice"
                            disabled={deletingId === s.sale_id}
                            onClick={() => handleDelete(s.sale_id)}
                            style={{
                              padding: '0.4rem 0.5rem',
                              border: '1px solid #fee2e2',
                              background: '#fff5f5',
                              borderRadius: 6,
                              cursor: 'pointer',
                              color: '#ef4444'
                            }}
                          >
                            <Trash2 size={13} />
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

      {/* Printable Receipt Modal */}
      {viewInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={18} color="#00838f" />
                <h3 className="modal-title">Sales Receipt #INV-{String(viewInvoice.sale_id).padStart(4, '0')}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setViewInvoice(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem' }}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px dashed #94a3b8',
                  padding: '1.25rem',
                  borderRadius: 8,
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  color: '#0f172a'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Chaudhry Mobile Shop
                  </h4>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Main Market, Mobile Plaza, Lahore</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Ph: 0300-1234567 • POS Terminal 1</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem', color: '#00838f' }}>
                    INVOICE #INV-{String(viewInvoice.sale_id).padStart(4, '0')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {viewInvoice.sale_date ? new Date(viewInvoice.sale_date).toLocaleString() : new Date().toLocaleString()}
                  </div>
                </div>

                {/* Customer Details */}
                <div style={{ marginBottom: '0.75rem', fontSize: '0.75rem', borderBottom: '1px dotted #cbd5e1', paddingBottom: '0.5rem' }}>
                  <div>Customer: <strong>{viewInvoice.customers?.name || viewInvoice.customer_name || 'Walk-in Customer'}</strong></div>
                  <div>Phone: {viewInvoice.customers?.phone || viewInvoice.customer_phone || 'Counter Cash'}</div>
                </div>

                {/* Line Items */}
                <div style={{ marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr', fontWeight: 700, borderBottom: '1px solid #cbd5e1', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>
                    <span>ITEM</span>
                    <span style={{ textAlign: 'center' }}>QTY</span>
                    <span style={{ textAlign: 'right' }}>PRICE</span>
                  </div>

                  {(viewInvoice.sale_items || []).map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr', padding: '0.2rem 0', fontSize: '0.75rem' }}>
                      <div>
                        <div>{item.products?.brand} {item.products?.model || 'Product'}</div>
                        {item.products?.imei_barcode && (
                          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                            {item.products.imei_barcode.includes(',') ? 'Dual IMEI' : 'Code'}: {item.products.imei_barcode}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'center' }}>{item.quantity}</div>
                      <div style={{ textAlign: 'right' }}>Rs {(Number(item.sale_price) * Number(item.quantity)).toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontWeight: 600 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, borderTop: '1px solid #0f172a', paddingTop: '0.4rem' }}>
                    <span>NET TOTAL:</span>
                    <span style={{ color: '#0f766e' }}>Rs {Number(viewInvoice.total_amount).toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px dotted #cbd5e1', fontSize: '0.7rem', color: '#64748b' }}>
                  Thank you for shopping with us!<br />
                  Warranty valid only with official receipt.
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setViewInvoice(null)}>
                  Close
                </button>
                <button type="button" className="btn-primary-teal" onClick={handlePrint}>
                  <Printer size={15} />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
