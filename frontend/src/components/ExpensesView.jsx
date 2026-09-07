import React, { useState } from 'react';
import { Calendar, Plus, Search, Filter, Trash2, Edit3, X, DollarSign, Tag, CreditCard, FileText } from 'lucide-react';
import { createExpense, updateExpense, deleteExpense } from '../services/api';

const EXPENSE_CATEGORIES = [
  'Shop Utilities',
  'Staff & Meals',
  'Shop Rent',
  'Stationery & Printing',
  'Transport & Courier',
  'Maintenance & Repair',
  'General Expense'
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'JazzCash / EasyPaisa'];

export default function ExpensesView({ expenses = [], onExpenseAdded, onRefresh }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'General Expense',
    amount: '',
    payment_method: 'Cash',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [editForm, setEditForm] = useState({});

  // Filter expenses
  const filtered = expenses.filter(e => {
    const matchesSearch =
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.notes?.toLowerCase().includes(search.toLowerCase()) ||
      e.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthPrefix = todayStr.substring(0, 7);

  const todayTotal = expenses
    .filter(e => e.expense_date?.startsWith(todayStr))
    .reduce((acc, e) => acc + Number(e.amount || 0), 0);

  const monthTotal = expenses
    .filter(e => e.expense_date?.startsWith(thisMonthPrefix))
    .reduce((acc, e) => acc + Number(e.amount || 0), 0);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount) {
      alert('Please fill expense title and amount');
      return;
    }

    try {
      setSubmitting(true);
      await createExpense(formData);
      setFormData({
        title: '',
        category: 'General Expense',
        amount: '',
        payment_method: 'Cash',
        expense_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setIsAddOpen(false);
      if (onExpenseAdded) onExpenseAdded();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to add expense: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (exp) => {
    setEditingExpense(exp);
    setEditForm({
      title: exp.title || '',
      category: exp.category || 'General Expense',
      amount: exp.amount || '',
      payment_method: exp.payment_method || 'Cash',
      expense_date: exp.expense_date ? exp.expense_date.split('T')[0] : new Date().toISOString().split('T')[0],
      notes: exp.notes || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await updateExpense(editingExpense.expense_id, editForm);
      setEditingExpense(null);
      if (onRefresh) onRefresh();
      if (onExpenseAdded) onExpenseAdded();
    } catch (err) {
      alert('Failed to update expense: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (expenseId, title) => {
    if (!window.confirm(`Are you sure you want to delete expense "${title}"?`)) {
      return;
    }
    try {
      await deleteExpense(expenseId);
      if (onRefresh) onRefresh();
      if (onExpenseAdded) onExpenseAdded();
    } catch (err) {
      alert('Failed to delete expense: ' + err.message);
    }
  };

  return (
    <div className="content-body">
      {/* 1. Stat Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#fee2e2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Today's Expenses</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              Rs {todayTotal.toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#fff7ed',
            color: '#f97316',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>This Month's Expenses</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              Rs {monthTotal.toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#e0f2f1',
            color: '#00838f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Expense Records</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              {expenses.length}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Expenses Directory Card */}
      <div className="dashboard-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Daily Shop Expenses</h3>
            <p className="card-subtitle">Track shop utilities, staff meals, rent, maintenance & miscellaneous costs</p>
          </div>
          <button className="btn-primary-teal" onClick={() => setIsAddOpen(true)}>
            <Plus size={16} />
            <span>Add New Expense</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
          <div className="input-with-icon" style={{ flex: 1, maxWidth: 380 }}>
            <Search className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by Title, Category or Notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#64748b" />
            <select
              className="form-input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ paddingLeft: '0.75rem', width: '200px' }}
            >
              <option value="ALL">All Categories</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>EXPENSE TITLE & NOTES</th>
                <th>CATEGORY</th>
                <th>PAYMENT METHOD</th>
                <th style={{ textAlign: 'right' }}>AMOUNT</th>
                <th>DATE</th>
                <th style={{ textAlign: 'center', width: 100 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    No expenses recorded yet. Click <strong>+ Add New Expense</strong> to record one.
                  </td>
                </tr>
              ) : (
                filtered.map((exp, idx) => (
                  <tr key={exp.expense_id || idx}>
                    <td className="table-idx">{idx + 1}</td>
                    <td>
                      <div className="table-item-name" style={{ fontSize: '0.92rem' }}>{exp.title}</div>
                      {exp.notes && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                          {exp.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.78rem',
                        background: '#f1f5f9',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 6,
                        color: '#334155',
                        fontWeight: 600
                      }}>
                        {exp.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                        {exp.payment_method || 'Cash'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#ef4444', fontSize: '0.95rem' }}>
                      Rs {Number(exp.amount || 0).toLocaleString()}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {exp.expense_date ? new Date(exp.expense_date).toLocaleDateString() : 'Today'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          title="Edit Expense"
                          onClick={() => handleOpenEdit(exp)}
                          style={{ padding: '0.3rem 0.45rem', background: '#f1f5f9', border: 'none', borderRadius: 6, color: '#475569', cursor: 'pointer' }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          title="Delete Expense"
                          onClick={() => handleDelete(exp.expense_id, exp.title)}
                          style={{ padding: '0.3rem 0.45rem', background: '#fee2e2', border: 'none', borderRadius: 6, color: '#dc2626', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Calendar size={20} color="#00838f" />
                <div>
                  <h3 className="modal-title">Record Daily Expense</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Enter shop expense details</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Expense Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tea & Refreshment, Electricity Bill, Shop Rent"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ paddingLeft: '1rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    >
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount (Rs) *</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      className="form-input"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      style={{ paddingLeft: '1rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-input"
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    >
                      {PAYMENT_METHODS.map(pm => (
                        <option key={pm} value={pm}>{pm}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Details (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Paid to tea vendor for week 1"
                    className="form-input"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{ padding: '0.5rem 0.75rem', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-teal" disabled={submitting}>
                  <Plus size={16} />
                  <span>{submitting ? 'Saving...' : 'Save Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EXPENSE MODAL */}
      {editingExpense && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Edit3 size={18} color="#00838f" />
                <h3 className="modal-title">Edit Expense</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setEditingExpense(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Expense Title *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    style={{ paddingLeft: '1rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    >
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount (Rs) *</label>
                    <input
                      type="number"
                      required
                      className="form-input"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      style={{ paddingLeft: '1rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-input"
                      value={editForm.payment_method}
                      onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    >
                      {PAYMENT_METHODS.map(pm => (
                        <option key={pm} value={pm}>{pm}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editForm.expense_date}
                      onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })}
                      style={{ paddingLeft: '0.75rem' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Details</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    style={{ padding: '0.5rem 0.75rem', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingExpense(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-teal" disabled={submitting}>
                  <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
