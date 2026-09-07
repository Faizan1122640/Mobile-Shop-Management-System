import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Smartphone,
  LayoutDashboard,
  Users,
  Box,
  Receipt,
  ShoppingBag,
  CreditCard,
  Calendar,
  Wrench,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({
  onOpenPos,
  onOpenAddProduct,
  onOpenCategories,
  onOpenOldPhone,
  onOpenInwardStock,
  onOpenMakePayment,
  onOpenRepairs,
  onOpenSettings,
  isCollapsed,
  onToggleCollapse
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Track open dropdowns
  const [openDropdowns, setOpenDropdowns] = useState({
    accounts: true,
    products: false,
    sales: false,
    purchases: false,
    payments: false,
    expense: false,
    repairs: false,
    reports: false
  });

  // Automatically keep parent section open based on current active route
  useEffect(() => {
    if (currentPath === '/customers' || currentPath === '/suppliers') {
      setOpenDropdowns(prev => ({ ...prev, accounts: true }));
    } else if (currentPath === '/products') {
      setOpenDropdowns(prev => ({ ...prev, products: true }));
    } else if (currentPath === '/sales') {
      setOpenDropdowns(prev => ({ ...prev, sales: true }));
    } else if (currentPath === '/purchases' || currentPath === '/old-phones') {
      setOpenDropdowns(prev => ({ ...prev, purchases: true }));
    } else if (currentPath === '/supplier-ledger') {
      setOpenDropdowns(prev => ({ ...prev, payments: true }));
    } else if (currentPath === '/expenses') {
      setOpenDropdowns(prev => ({ ...prev, expense: true }));
    } else if (currentPath === '/repairs') {
      setOpenDropdowns(prev => ({ ...prev, repairs: true }));
    }
  }, [currentPath]);

  const toggleDropdown = (key) => {
    if (isCollapsed && onToggleCollapse) {
      onToggleCollapse();
    }
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNav = (path) => {
    navigate(path);
  };

  // Helper flags
  const isDashboardActive = currentPath === '/' || currentPath === '/dashboard';
  const isAccountsActive = currentPath === '/customers' || currentPath === '/suppliers';
  const isProductsActive = currentPath === '/products';
  const isSalesActive = currentPath === '/sales';
  const isPurchasesActive = currentPath === '/purchases' || currentPath === '/old-phones';
  const isPaymentsActive = currentPath === '/supplier-ledger';
  const isExpensesActive = currentPath === '/expenses';
  const isRepairsActive = currentPath === '/repairs';

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div
          className="sidebar-brand-icon"
          onClick={onToggleCollapse}
          style={{ cursor: 'pointer' }}
          title="Toggle Sidebar"
        >
          <Smartphone size={20} />
        </div>
        {!isCollapsed && (
          <div className="sidebar-brand-text">
            <h2>Chaudhry Mobile Shop</h2>
            <span>MANAGEMENT</span>
          </div>
        )}
        <button
          type="button"
          className="sidebar-collapse-toggle-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav Menu */}
      <div className="sidebar-nav">
        <div>
          {!isCollapsed && <div className="nav-section-title">MAIN</div>}
          <ul className="nav-list">
            {/* Dashboard (Single item) */}
            <li>
              <button
                type="button"
                className={`nav-item-btn ${isDashboardActive ? 'active' : ''}`}
                onClick={() => handleNav('/dashboard')}
                title="Dashboard"
              >
                <div className="nav-item-left">
                  <LayoutDashboard size={18} />
                  {!isCollapsed && <span>Dashboard</span>}
                </div>
              </button>
            </li>

            {/* Accounts (Customers & Suppliers) */}
            <li>
              <button
                type="button"
                className={`nav-item-btn ${isAccountsActive ? 'active' : ''}`}
                onClick={() => toggleDropdown('accounts')}
                title="Accounts"
              >
                <div className="nav-item-left">
                  <Users size={18} />
                  {!isCollapsed && <span>Accounts</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown size={15} className={`nav-chevron ${openDropdowns.accounts ? 'rotated' : ''}`} />
                )}
              </button>
              {!isCollapsed && openDropdowns.accounts && (
                <ul className="submenu-list">
                  <li
                    className={`submenu-item ${currentPath === '/customers' ? 'active-sub' : ''}`}
                    onClick={() => handleNav('/customers')}
                  >
                    Customers List
                  </li>
                  <li
                    className={`submenu-item ${currentPath === '/suppliers' ? 'active-sub' : ''}`}
                    onClick={() => handleNav('/suppliers')}
                  >
                    Suppliers List
                  </li>
                </ul>
              )}
            </li>

            {/* Product Master */}
            <li>
              <button
                type="button"
                className={`nav-item-btn ${isProductsActive ? 'active' : ''}`}
                onClick={() => toggleDropdown('products')}
                title="Product Master"
              >
                <div className="nav-item-left">
                  <Box size={18} />
                  {!isCollapsed && <span>Product Master</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown size={15} className={`nav-chevron ${openDropdowns.products ? 'rotated' : ''}`} />
                )}
              </button>
              {!isCollapsed && openDropdowns.products && (
                <ul className="submenu-list">
                  <li
                    className={`submenu-item ${currentPath === '/products' ? 'active-sub' : ''}`}
                    onClick={() => handleNav('/products')}
                  >
                    Inventory & IMEI
                  </li>
                  <li className="submenu-item" onClick={onOpenAddProduct}>
                    Add New Product
                  </li>
                  <li className="submenu-item" onClick={onOpenCategories}>
                    🏷️ Categories Setup
                  </li>
                </ul>
              )}
            </li>

            {/* Sales */}
            <li>
              <button
                type="button"
                className={`nav-item-btn ${isSalesActive ? 'active' : ''}`}
                onClick={() => toggleDropdown('sales')}
                title="Sales"
              >
                <div className="nav-item-left">
                  <Receipt size={18} />
                  {!isCollapsed && <span>Sales</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown size={15} className={`nav-chevron ${openDropdowns.sales ? 'rotated' : ''}`} />
                )}
              </button>
              {!isCollapsed && openDropdowns.sales && (
                <ul className="submenu-list">
                  <li className="submenu-item" onClick={onOpenPos}>
                    ⚡ Quick POS Billing
                  </li>
                  <li
                    className={`submenu-item ${currentPath === '/sales' ? 'active-sub' : ''}`}
                    onClick={() => handleNav('/sales')}
                  >
                    Sales Invoices
                  </li>
                </ul>
              )}
            </li>

            {/* Purchases */}
            <li>
              <button
                type="button"
                className={`nav-item-btn ${isPurchasesActive ? 'active' : ''}`}
                onClick={() => toggleDropdown('purchases')}
                title="Purchases"
              >
                <div className="nav-item-left">
                  <ShoppingBag size={18} />
                  {!isCollapsed && <span>Purchases</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown size={15} className={`nav-chevron ${openDropdowns.purchases ? 'rotated' : ''}`} />
                )}
              </button>
              {!isCollapsed && openDropdowns.purchases && (
                <ul className="submenu-list">
                  <li className="submenu-item" onClick={onOpenInwardStock}>
                    📦 Inward Stock Purchase
                  </li>
                  <li className="submenu-item" onClick={onOpenOldPhone}>
                    📱 Buy Old Phone (CNIC)
                  </li>
                  <li
                    className={`submenu-item ${currentPath === '/purchases' || currentPath === '/old-phones' ? 'active-sub' : ''}`}
                    onClick={() => handleNav('/purchases')}
                  >
                    Old Phone Records
                  </li>
                </ul>
              )}
            </li>

            {/* Payments */}
            <li>
              <button
                type="button"
                className={`nav-item-btn ${isPaymentsActive ? 'active' : ''}`}
                onClick={() => toggleDropdown('payments')}
                title="Payments"
              >
                <div className="nav-item-left">
                  <CreditCard size={18} />
                  {!isCollapsed && <span>Payments</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown size={15} className={`nav-chevron ${openDropdowns.payments ? 'rotated' : ''}`} />
                )}
              </button>
              {!isCollapsed && openDropdowns.payments && (
                <ul className="submenu-list">
                  <li
                    className={`submenu-item ${currentPath === '/supplier-ledger' ? 'active-sub' : ''}`}
                    onClick={() => handleNav('/supplier-ledger')}
                  >
                    💳 Supplier Payments & Ledger
                  </li>
                  <li className="submenu-item" onClick={onOpenMakePayment}>
                    Make Payment
                  </li>
                </ul>
              )}
            </li>

            {/* Expense */}
            <li>
              <button
                type="button"
                className={`nav-item-btn ${isExpensesActive ? 'active' : ''}`}
                onClick={() => toggleDropdown('expense')}
                title="Expense"
              >
                <div className="nav-item-left">
                  <Calendar size={18} />
                  {!isCollapsed && <span>Expense</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown size={15} className={`nav-chevron ${openDropdowns.expense ? 'rotated' : ''}`} />
                )}
              </button>
              {!isCollapsed && openDropdowns.expense && (
                <ul className="submenu-list">
                  <li
                    className={`submenu-item ${currentPath === '/expenses' ? 'active-sub' : ''}`}
                    onClick={() => handleNav('/expenses')}
                  >
                    Daily Expenses
                  </li>
                </ul>
              )}
            </li>

            {/* Repairs */}
            <li>
              <button
                type="button"
                className={`nav-item-btn ${isRepairsActive ? 'active' : ''}`}
                onClick={() => toggleDropdown('repairs')}
                title="Repairs"
              >
                <div className="nav-item-left">
                  <Wrench size={18} />
                  {!isCollapsed && <span>Repairs</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown size={15} className={`nav-chevron ${openDropdowns.repairs ? 'rotated' : ''}`} />
                )}
              </button>
              {!isCollapsed && openDropdowns.repairs && (
                <ul className="submenu-list">
                  <li
                    className={`submenu-item ${currentPath === '/repairs' ? 'active-sub' : ''}`}
                    onClick={() => handleNav('/repairs')}
                  >
                    All Repair Tickets
                  </li>
                  <li className="submenu-item" onClick={onOpenRepairs}>
                    New Repair Job
                  </li>
                </ul>
              )}
            </li>

            {/* Reports */}
            <li>
              <button
                type="button"
                className="nav-item-btn"
                onClick={() => toggleDropdown('reports')}
                title="Reports"
              >
                <div className="nav-item-left">
                  <BarChart3 size={18} />
                  {!isCollapsed && <span>Reports</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown size={15} className={`nav-chevron ${openDropdowns.reports ? 'rotated' : ''}`} />
                )}
              </button>
              {!isCollapsed && openDropdowns.reports && (
                <ul className="submenu-list">
                  <li className="submenu-item" onClick={() => handleNav('/dashboard')}>
                    Sales Summary
                  </li>
                  <li className="submenu-item" onClick={() => handleNav('/products')}>
                    Stock Value Report
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </div>

        <div>
          {!isCollapsed && <div className="nav-section-title">SYSTEM</div>}
          <ul className="nav-list">
            <li>
              <button
                type="button"
                className="nav-item-btn"
                onClick={onOpenSettings}
                title="Settings"
              >
                <div className="nav-item-left">
                  <Settings size={18} />
                  {!isCollapsed && <span>Settings</span>}
                </div>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
