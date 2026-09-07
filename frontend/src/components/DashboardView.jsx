import React, { useState } from 'react';
import { ShoppingCart, ShoppingBag, Calendar, Wrench, TrendingUp, Users } from 'lucide-react';

export default function DashboardView({ dashboardData, onOpenPos, onOpenRepairs }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  const {
    todaySales = { amount: 0, count: 0 },
    todayPurchases = { amount: 0, count: 0 },
    todayExpenses = { amount: 0, count: 0 },
    repairsPending = { count: 0, receivedToday: 0 },
    chartData = [],
    monthTotal = 0,
    recoveries = [],
    topSoldItems = []
  } = dashboardData || {};

  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculate dynamic max scale for the bar chart
  const maxSaleInMonth = chartData.reduce((max, d) => Math.max(max, d.amount || 0), 0);
  const maxScale = Math.max(50000, Math.ceil((maxSaleInMonth * 1.1) / 10000) * 10000);

  // Grid steps (10 divisions)
  const gridSteps = [];
  const step = maxScale / 10;
  for (let i = 10; i >= 0; i--) {
    gridSteps.push(Math.round(i * step));
  }

  return (
    <div className="content-body">
      {/* 4 Metric Cards */}
      <div className="metrics-grid">
        {/* Today Sales */}
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Today Sales</span>
            <div className="metric-value teal">Rs {Number(todaySales.amount || 0).toLocaleString()}</div>
            <span className="metric-count">{todaySales.count} invoices today</span>
          </div>
          <div className="metric-icon-box icon-bg-teal">
            <ShoppingCart size={20} />
          </div>
        </div>

        {/* Today Purchases */}
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Today Purchases</span>
            <div className="metric-value red">Rs {Number(todayPurchases.amount || 0).toLocaleString()}</div>
            <span className="metric-count">{todayPurchases.count} purchases today</span>
          </div>
          <div className="metric-icon-box icon-bg-pink">
            <ShoppingBag size={20} />
          </div>
        </div>

        {/* Today Expenses */}
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Today Expenses</span>
            <div className="metric-value red">Rs {Number(todayExpenses.amount || 0).toLocaleString()}</div>
            <span className="metric-count">{todayExpenses.count} entries today</span>
          </div>
          <div className="metric-icon-box icon-bg-orange">
            <Calendar size={20} />
          </div>
        </div>

        {/* Repairs Pending */}
        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={onOpenRepairs}>
          <div className="metric-info">
            <span className="metric-label">Repairs Pending</span>
            <div className="metric-value amber">{repairsPending.count}</div>
            <span className="metric-count">
              {repairsPending.receivedToday > 0 ? `${repairsPending.receivedToday} received today` : 'None received today'}
            </span>
          </div>
          <div className="metric-icon-box icon-bg-amber">
            <Wrench size={20} />
          </div>
        </div>
      </div>

      {/* Middle Row: Sale Charts & Top Recoveries */}
      <div className="middle-row-grid">
        {/* Sale Charts Card */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Sale Charts</h3>
              <p className="card-subtitle">Daily sales — {currentMonthName}</p>
            </div>
            <div className="month-total-stat">
              <span className="label">Month total</span>
              <div className="val">Rs {Number(monthTotal || 0).toLocaleString()}</div>
            </div>
          </div>

          {/* Bar Chart Display */}
          <div className="sales-chart-wrapper">
            {/* Horizontal Grid lines */}
            {gridSteps.map((val) => {
              const bottomPercent = (val / maxScale) * 80;
              return (
                <div key={val} className="chart-grid-line" style={{ bottom: `${bottomPercent}%` }}>
                  <span className="chart-grid-label">Rs {val.toLocaleString()}</span>
                </div>
              );
            })}

            {/* Bars */}
            <div className="chart-bars-container">
              {chartData.map((d, index) => {
                const heightPercent = d.amount > 0 ? Math.min(100, Math.max(6, (d.amount / maxScale) * 100)) : 0;
                return (
                  <div key={d.day} className="chart-col">
                    {hoveredBar === index && d.amount > 0 && (
                      <div className="chart-tooltip">
                        Day {d.day}: Rs {d.amount.toLocaleString()}
                      </div>
                    )}
                    <div
                      className="chart-bar-pillar"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: d.amount > 0 ? '#00838f' : 'transparent'
                      }}
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    <span className="chart-x-label">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Recoveries Card */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Top Recoveries</h3>
              <p className="card-subtitle">Customer accounts — {currentMonthName}</p>
            </div>
          </div>

          <div className="recoveries-list">
            {recoveries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                No customer ledger accounts recorded yet.
              </div>
            ) : (
              recoveries.map((item, idx) => (
                <div key={item.id || idx} className="recovery-item">
                  <div className="recovery-left">
                    <div className="recovery-badge">{idx + 1}</div>
                    <div>
                      <div className="recovery-name">{item.customer_name}</div>
                      <div className="recovery-sub">Registered Customer</div>
                    </div>
                  </div>
                  <div className="recovery-amount" style={{ color: '#00897b' }}>Active</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Sold Items Table */}
      <div className="dashboard-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Top Sold Items</h3>
            <p className="card-subtitle">By quantity — {currentMonthName}</p>
          </div>
          <button className="btn-primary-teal" onClick={onOpenPos}>
            <span>+ New Sale (POS)</span>
          </button>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>ITEM</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'center' }}>QTY SOLD</th>
                <th style={{ textAlign: 'right' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {topSoldItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No sales recorded this month. Use <strong>+ New Sale (POS)</strong> to create your first transaction.
                  </td>
                </tr>
              ) : (
                topSoldItems.map((item, index) => (
                  <tr key={item.product_id || index}>
                    <td className="table-idx">{index + 1}</td>
                    <td className="table-item-name">{item.item_name}</td>
                    <td className="table-color">{item.color || 'Standard'}</td>
                    <td className="table-qty" style={{ textAlign: 'center' }}>{item.qty_sold}</td>
                    <td className="table-amount" style={{ textAlign: 'right' }}>Rs {Number(item.amount || 0).toLocaleString()}</td>
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
