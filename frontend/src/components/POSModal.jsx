import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Trash2,
  Printer,
  CheckCircle2,
  ShoppingCart,
  UserPlus,
  Users,
  AlertCircle
} from 'lucide-react';
import { createSale } from '../services/api';
import { validatePhone, validateRequired } from '../utils/validators';

export default function POSModal({
  isOpen,
  onClose,
  products = [],
  customers = [],
  onSaleComplete,
  onSaleCompleted
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerMode, setCustomerMode] = useState('existing'); // 'existing' vs 'new'
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [customerErrors, setCustomerErrors] = useState({});

  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customers.length > 0 && !selectedCustomer) {
      setSelectedCustomer(''); // Default to Walk-in or first
    }
  }, [customers]);

  if (!isOpen) return null;

  const filteredProducts = products.filter(p =>
    p.status === 'In Stock' && (
      p.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.imei_barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.product_id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        alert('Stock limit reached for this item');
        return;
      }
      setCart(cart.map(item =>
        item.product_id === product.product_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.product_id,
        brand: product.brand,
        model: product.model,
        imei_barcode: product.imei_barcode,
        sale_price: Number(product.selling_price || product.price || 0),
        selling_price: Number(product.selling_price || product.price || 0),
        price: Number(product.selling_price || product.price || 0),
        quantity: 1,
        max_stock: product.stock_quantity
      }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId, qty) => {
    if (qty <= 0) return removeFromCart(productId);
    setCart(cart.map(item =>
      item.product_id === productId ? { ...item, quantity: qty } : item
    ));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.sale_price * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = async () => {
    if (!cart.length) return;

    // Validate new customer if active
    if (customerMode === 'new') {
      const errs = {};
      const nameErr = validateRequired(newCustomer.name, 'Customer name');
      if (nameErr) errs.name = nameErr;

      if (newCustomer.phone) {
        const phoneErr = validatePhone(newCustomer.phone);
        if (phoneErr) errs.phone = phoneErr;
      }

      if (Object.keys(errs).length > 0) {
        setCustomerErrors(errs);
        return;
      }
    }

    try {
      setLoading(true);
      setCustomerErrors({});

      const salePayload = {
        items: cart,
        total_amount: total
      };

      if (customerMode === 'new' && newCustomer.name.trim()) {
        salePayload.customer_name = newCustomer.name.trim();
        salePayload.customer_phone = newCustomer.phone ? newCustomer.phone.trim() : '03000000000';
        salePayload.customer_address = newCustomer.address ? newCustomer.address.trim() : null;
      } else if (selectedCustomer) {
        salePayload.customer_id = Number(selectedCustomer);
      }

      const res = await createSale(salePayload);

      let matchedCustomer = null;
      if (res.customer) {
        matchedCustomer = res.customer;
      } else if (selectedCustomer) {
        matchedCustomer = customers.find(c => String(c.customer_id) === String(selectedCustomer));
      } else if (newCustomer.name.trim()) {
        matchedCustomer = { name: newCustomer.name, phone: newCustomer.phone };
      } else {
        matchedCustomer = { name: 'Walk-in Customer', phone: 'Cash Counter' };
      }

      setCompletedSale({
        sale: res.sale,
        items: cart,
        customer: matchedCustomer,
        subtotal,
        discount,
        total,
        date: new Date().toLocaleString()
      });
      setIsCompleted(true);

      const notifySaleDone = onSaleCompleted || onSaleComplete;
      if (notifySaleDone) notifySaleDone(cart, total);
    } catch (err) {
      alert('Checkout error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const resetAndClose = () => {
    setCart([]);
    setIsCompleted(false);
    setCompletedSale(null);
    setNewCustomer({ name: '', phone: '', address: '' });
    setCustomerMode('existing');
    const notifySaleDone = onSaleCompleted || onSaleComplete;
    if (notifySaleDone) notifySaleDone();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 880 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingCart size={20} color="#00838f" />
            <h3 className="modal-title">{isCompleted ? 'Invoice & Receipt' : 'Quick POS Billing & Invoice'}</h3>
          </div>
          <button className="modal-close-btn" onClick={resetAndClose}>
            <X size={20} />
          </button>
        </div>

        {isCompleted && completedSale ? (
          <div className="modal-body">
            <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
              <CheckCircle2 size={42} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
              <h4 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 700 }}>Sale Completed Successfully!</h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Transaction saved to Customer Ledger & Supabase Database.</p>
            </div>

            <div className="thermal-receipt">
              <h3>CHAUDHRY MOBILE SHOP</h3>
              <p className="center">Shop # 14, Chaudhry Plaza, Mobile Market<br/>Phone: 0300-1234567</p>
              <div className="receipt-divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span>Invoice: #{completedSale.sale?.sale_id || 'INV-001'}</span>
                <span>Date: {completedSale.date}</span>
              </div>
              <div style={{ fontSize: '0.78rem', margin: '0.2rem 0', fontWeight: 600 }}>
                Customer: {completedSale.customer?.name} ({completedSale.customer?.phone || 'N/A'})
              </div>
              <div className="receipt-divider" />

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px dashed #94a3b8' }}>
                    <th style={{ textAlign: 'left', padding: '4px 0' }}>Item</th>
                    <th style={{ textAlign: 'center', padding: '4px 0' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '4px 0' }}>Price</th>
                    <th style={{ textAlign: 'right', padding: '4px 0' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {completedSale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '4px 0' }}>
                        {item.brand} {item.model}
                        {item.imei_barcode && (
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>IMEI/Code: {item.imei_barcode}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '4px 0' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', padding: '4px 0' }}>Rs {item.sale_price.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '4px 0' }}>Rs {(item.sale_price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="receipt-divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span>Subtotal:</span>
                <span>Rs {completedSale.subtotal.toLocaleString()}</span>
              </div>
              {completedSale.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                  <span>Discount:</span>
                  <span>- Rs {completedSale.discount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', marginTop: '0.4rem' }}>
                <span>Net Total:</span>
                <span>Rs {completedSale.total.toLocaleString()}</span>
              </div>
              <div className="receipt-divider" />
              <p className="center" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                Thank you for shopping at Chaudhry Mobile Shop!<br/>
                No returns without original invoice.
              </p>
            </div>

            <div className="modal-footer" style={{ borderTop: 'none' }}>
              <button className="btn-secondary" onClick={printReceipt}>
                <Printer size={16} />
                <span>Print Invoice</span>
              </button>
              <button className="btn-primary-teal" onClick={resetAndClose}>
                <span>Done & New Sale</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
            {/* Left: Product Picker & IMEI Search */}
            <div>
              <div style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Search In-Stock Products / IMEI / Barcode</label>
                <div className="input-with-icon">
                  <Search className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Scan barcode or type iPhone, Samsung, Anker..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.5rem' }}>
                {filteredProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2.5rem 0', fontSize: '0.85rem' }}>
                    No matching products in stock
                  </div>
                ) : (
                  filteredProducts.map(p => (
                    <div
                      key={p.product_id}
                      onClick={() => addToCart(p)}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #f8fafc',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>
                          {p.brand} {p.model}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {(p.categories?.track_type === 'Serialized' || p.categories?.name?.toLowerCase().includes('phone') || p.categories?.name?.toLowerCase().includes('mobile')) ? 'IMEI' : 'Barcode'}: {p.imei_barcode || 'N/A'} • Stock: {p.stock_quantity}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#00897b', fontSize: '0.88rem' }}>
                        Rs {Number(p.selling_price || 0).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Customer Selection, Cart & Checkout */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
              {/* Customer Area: Existing vs New */}
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: 700, color: '#334155' }}>
                    Customer Details
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setCustomerMode('existing')}
                      style={{
                        padding: '2px 7px',
                        fontSize: '0.72rem',
                        fontWeight: customerMode === 'existing' ? 700 : 500,
                        borderRadius: 4,
                        border: 'none',
                        cursor: 'pointer',
                        background: customerMode === 'existing' ? '#00838f' : '#e2e8f0',
                        color: customerMode === 'existing' ? '#ffffff' : '#475569'
                      }}
                    >
                      Select
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerMode('new')}
                      style={{
                        padding: '2px 7px',
                        fontSize: '0.72rem',
                        fontWeight: customerMode === 'new' ? 700 : 500,
                        borderRadius: 4,
                        border: 'none',
                        cursor: 'pointer',
                        background: customerMode === 'new' ? '#00838f' : '#e2e8f0',
                        color: customerMode === 'new' ? '#ffffff' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <UserPlus size={11} />
                      <span>+ New</span>
                    </button>
                  </div>
                </div>

                {customerMode === 'existing' ? (
                  <select
                    className="form-input"
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    style={{ paddingLeft: '0.75rem', fontSize: '0.82rem' }}
                  >
                    <option value="">Walk-in Customer (Cash Sale)</option>
                    {customers.map(c => (
                      <option key={c.customer_id} value={c.customer_id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="Customer Full Name *"
                      className={`form-input ${customerErrors.name ? 'input-error' : ''}`}
                      value={newCustomer.name}
                      onChange={(e) => {
                        setNewCustomer({ ...newCustomer, name: e.target.value });
                        if (customerErrors.name) setCustomerErrors(prev => ({ ...prev, name: null }));
                      }}
                      style={{ paddingLeft: '0.6rem', height: 32, fontSize: '0.8rem' }}
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number (e.g. 03001234567)"
                      className="form-input"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                      style={{ paddingLeft: '0.6rem', height: 32, fontSize: '0.8rem' }}
                    />
                    <input
                      type="text"
                      placeholder="Address / City (Optional)"
                      className="form-input"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      style={{ paddingLeft: '0.6rem', height: 32, fontSize: '0.8rem' }}
                    />
                    <p style={{ fontSize: '0.68rem', color: '#00838f', margin: 0 }}>
                      ✓ Customer will be automatically registered into Customer Directory & Ledger.
                    </p>
                  </div>
                )}
              </div>

              {/* Cart Items */}
              <div style={{ flex: 1, minHeight: '140px', maxHeight: '160px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.5rem' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem 0', fontSize: '0.82rem' }}>
                    Cart is empty. Click items on the left to add.
                  </div>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.product_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.4rem 0',
                        borderBottom: '1px solid #f1f5f9'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.brand} {item.model}</div>
                        <div style={{ fontSize: '0.72rem', color: '#00897b' }}>Rs {item.sale_price.toLocaleString()}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <input
                          type="number"
                          min="1"
                          max={item.max_stock}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                          style={{ width: '40px', padding: '0.2rem', borderRadius: 6, border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '0.8rem' }}
                        />
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total & Discount Summary */}
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                  <span>Subtotal:</span>
                  <span>Rs {subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Discount (Rs):</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    style={{ width: '75px', padding: '0.15rem 0.4rem', borderRadius: 6, border: '1px solid #cbd5e1', textAlign: 'right', fontSize: '0.8rem' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem', color: '#00838f', marginTop: '0.4rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem' }}>
                  <span>Total Bill:</span>
                  <span>Rs {total.toLocaleString()}</span>
                </div>
              </div>

              <button
                className="btn-primary-teal"
                style={{ width: '100%', padding: '0.75rem' }}
                disabled={cart.length === 0 || loading}
                onClick={handleCheckout}
              >
                {loading ? 'Processing...' : `Complete Sale • Rs ${total.toLocaleString()}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

