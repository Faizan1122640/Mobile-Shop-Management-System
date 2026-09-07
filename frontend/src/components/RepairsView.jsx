import React, { useState } from 'react';
import { Wrench, Plus, Search, Filter, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { updateRepairStatus } from '../services/api';

export default function RepairsView({ repairs = [], onOpenNewRepair, onRefresh }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = async (repairId, newStatus) => {
    try {
      setUpdatingId(repairId);
      await updateRepairStatus(repairId, newStatus);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = repairs.filter(r => {
    const matchesSearch =
      r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_phone?.includes(search) ||
      r.device_model?.toLowerCase().includes(search.toLowerCase()) ||
      (r.imei && r.imei.toLowerCase().includes(search.toLowerCase())) ||
      r.issue?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = repairs.filter(r => r.status === 'Pending').length;
  const inProcessCount = repairs.filter(r => r.status === 'In Process').length;
  const repairedCount = repairs.filter(r => r.status === 'Repaired').length;
  const deliveredCount = repairs.filter(r => r.status === 'Delivered').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="badge-status pending">⏳ Pending</span>;
      case 'In Process':
        return <span className="badge-status in-process">⚡ In Process</span>;
      case 'Repaired':
        return <span className="badge-status repaired">🔧 Repaired (Ready)</span>;
      case 'Delivered':
        return <span className="badge-status delivered">✅ Delivered</span>;
      default:
        return <span className="badge-status">{status}</span>;
    }
  };

  return (
    <div className="content-body">
      {/* Metrics Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="dashboard-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wrench size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>ALL JOBS</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{repairs.length}</div>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>PENDING</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706' }}>{pendingCount}</div>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e0f2f1', color: '#00838f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>IN PROCESS</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#00838f' }}>{inProcessCount}</div>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>READY</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7c3aed' }}>{repairedCount}</div>
          </div>
        </div>

        <div className="dashboard-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>DELIVERED</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>{deliveredCount}</div>
          </div>
        </div>
      </div>

      {/* Main Repair Tickets Card */}
      <div className="dashboard-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Mobile Repair & Service Tickets</h3>
            <p className="card-subtitle">Track hardware, software, display replacements & job statuses</p>
          </div>
          <button className="btn-primary-teal" onClick={onOpenNewRepair}>
            <Plus size={16} />
            <span>New Repair Job</span>
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="input-with-icon" style={{ flex: 1, minWidth: 260, maxWidth: 420 }}>
            <Search className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by Customer, Phone, Model, IMEI or Issue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#64748b" />
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ paddingLeft: '0.75rem', width: '180px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Process">In Process</option>
              <option value="Repaired">Repaired</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>TICKET #</th>
                <th>CUSTOMER</th>
                <th>DEVICE & IMEI</th>
                <th>ISSUE DESCRIPTION</th>
                <th style={{ textAlign: 'right' }}>EST. COST</th>
                <th>STATUS</th>
                <th>CHANGE STATUS</th>
                <th>RECEIVED AT</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    No repair tickets found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.repair_id}>
                    <td>
                      <strong style={{ color: '#00838f' }}>#REP-{String(r.repair_id).padStart(3, '0')}</strong>
                    </td>
                    <td>
                      <div className="table-item-name">{r.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.customer_phone}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.device_model}</div>
                      {r.imei && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>IMEI: {r.imei}</div>}
                    </td>
                    <td style={{ maxWidth: 220, color: '#334155' }}>
                      {r.issue}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#00897b' }}>
                      Rs {Number(r.cost || 0).toLocaleString()}
                    </td>
                    <td>
                      {getStatusBadge(r.status)}
                    </td>
                    <td>
                      <select
                        disabled={updatingId === r.repair_id}
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.repair_id, e.target.value)}
                        style={{
                          padding: '0.35rem 0.6rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.8rem',
                          background: '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Process">In Process</option>
                        <option value="Repaired">Repaired</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : 'Today'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
