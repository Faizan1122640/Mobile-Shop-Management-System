import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DashboardView from '../components/DashboardView';
import ProductsView from '../components/ProductsView';
import OldPhonesView from '../components/OldPhonesView';
import CustomersView from '../components/CustomersView';
import RepairsView from '../components/RepairsView';
import SuppliersView from '../components/SuppliersView';
import ExpensesView from '../components/ExpensesView';
import SalesView from '../components/SalesView';
import SupplierPaymentsView from '../components/SupplierPaymentsView';

// Modals
import POSModal from '../components/POSModal';
import AddProductModal from '../components/AddProductModal';
import OldPhoneModal from '../components/OldPhoneModal';
import RepairsModal from '../components/RepairsModal';
import SettingsModal from '../components/SettingsModal';
import CategoriesModal from '../components/CategoriesModal';
import SupplierPurchaseModal from '../components/SupplierPurchaseModal';
import SupplierPaymentModal from '../components/SupplierPaymentModal';
import SupplierLedgerModal from '../components/SupplierLedgerModal';

import {
  fetchAppContext,
  fetchDashboardOverview,
  fetchProducts,
  fetchCategories,
  fetchSuppliers,
  fetchCustomers,
  fetchOldPhones,
  fetchRepairs,
  fetchExpenses,
  fetchSales,
  fetchSupplierPurchases,
  fetchSupplierPayments,
  fetchSuppliersLedger
} from '../services/api';

export default function DashboardPage({ user, onLogout }) {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [oldPhones, setOldPhones] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);

  // Supplier Purchases & Ledger State
  const [supplierPurchases, setSupplierPurchases] = useState([]);
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [suppliersLedger, setSuppliersLedger] = useState([]);

  const [loadingContext, setLoadingContext] = useState(true);

  // Modal open states
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isOldPhoneOpen, setIsOldPhoneOpen] = useState(false);
  const [isRepairsOpen, setIsRepairsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isSupplierPurchaseOpen, setIsSupplierPurchaseOpen] = useState(false);
  const [isSupplierPaymentOpen, setIsSupplierPaymentOpen] = useState(false);
  const [isSupplierLedgerOpen, setIsSupplierLedgerOpen] = useState(false);

  // Selected entities for modals
  const [selectedPaymentSupplier, setSelectedPaymentSupplier] = useState(null);
  const [selectedLedgerSupplier, setSelectedLedgerSupplier] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 1. Single Unified Bootstrap: loads entire application in 1 single API call
  const loadFullContext = useCallback(async () => {
    try {
      setLoadingContext(true);
      const data = await fetchAppContext();
      if (data) {
        if (data.overview) setDashboardData(data.overview);
        if (data.products) setProducts(data.products);
        if (data.categories) setCategories(data.categories);
        if (data.suppliers) setSuppliers(data.suppliers);
        if (data.customers) setCustomers(data.customers);
        if (data.oldPhones) setOldPhones(data.oldPhones);
        if (data.repairs) setRepairs(data.repairs);
        if (data.expenses) setExpenses(data.expenses);
        if (data.sales) setSales(data.sales);
        if (data.supplierPurchases) setSupplierPurchases(data.supplierPurchases);
        if (data.supplierPayments) setSupplierPayments(data.supplierPayments);
        if (data.suppliersLedger) setSuppliersLedger(data.suppliersLedger);
      }
    } catch (err) {
      console.error('Failed to load shop context:', err);
    } finally {
      setLoadingContext(false);
    }
  }, []);

  // Individual slice loaders (for targeted post-mutation updates)
  const loadOverview = useCallback(async () => {
    try {
      const data = await fetchDashboardOverview();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load overview:', err);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const data = await fetchProducts();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }, []);

  const loadSales = useCallback(async () => {
    try {
      const data = await fetchSales();
      setSales(data || []);
    } catch (err) {
      console.error('Failed to load sales:', err);
    }
  }, []);

  const loadCategoriesAndSuppliers = useCallback(async () => {
    try {
      const [cats, supps] = await Promise.all([
        fetchCategories().catch(() => []),
        fetchSuppliers().catch(() => [])
      ]);
      setCategories(cats || []);
      setSuppliers(supps || []);
    } catch (err) {
      console.error('Failed to load categories/suppliers:', err);
    }
  }, []);

  const loadSuppliers = useCallback(async () => {
    try {
      const data = await fetchSuppliers();
      setSuppliers(data || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const data = await fetchCustomers();
      setCustomers(data || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  }, []);

  const loadOldPhones = useCallback(async () => {
    try {
      const data = await fetchOldPhones();
      setOldPhones(data || []);
    } catch (err) {
      console.error('Failed to load old phones:', err);
    }
  }, []);

  const loadRepairs = useCallback(async () => {
    try {
      const data = await fetchRepairs();
      setRepairs(data || []);
    } catch (err) {
      console.error('Failed to load repairs:', err);
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    try {
      const data = await fetchExpenses();
      setExpenses(data || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    }
  }, []);

  const loadSupplierLedgerData = useCallback(async () => {
    try {
      const [purchasesRes, paymentsRes, ledgerRes] = await Promise.all([
        fetchSupplierPurchases().catch(() => []),
        fetchSupplierPayments().catch(() => []),
        fetchSuppliersLedger().catch(() => ({ ledger: [] }))
      ]);
      setSupplierPurchases(purchasesRes || []);
      setSupplierPayments(paymentsRes || []);
      setSuppliersLedger(ledgerRes?.ledger || []);
    } catch (err) {
      console.error('Failed to load supplier ledger data:', err);
    }
  }, []);

  // Single Bootstrap on Mount
  useEffect(() => {
    loadFullContext();
  }, [loadFullContext]);

  // Optimistic Mutation Handlers
  const handleProductAdded = (newProd) => {
    if (newProd && newProd.product_id) {
      setProducts(prev => [newProd, ...prev]);
    } else {
      loadProducts();
    }
    loadOverview();
  };

  const handleProductUpdated = (updated) => {
    if (updated && updated.product_id) {
      setProducts(prev => prev.map(p => p.product_id === updated.product_id ? updated : p));
    } else {
      loadProducts();
    }
    loadOverview();
  };

  const handleDeleteProduct = (productId) => {
    setProducts(prev => prev.filter(p => p.product_id !== productId));
    loadOverview();
  };

  const handleCustomerAdded = (newCust) => {
    if (newCust && newCust.customer_id) {
      setCustomers(prev => [newCust, ...prev]);
    } else {
      loadCustomers();
    }
  };

  const handleCustomerUpdated = (updated) => {
    if (updated && updated.customer_id) {
      setCustomers(prev => prev.map(c => c.customer_id === updated.customer_id ? updated : c));
    } else {
      loadCustomers();
    }
  };

  const handleDeleteCustomer = (customerId) => {
    setCustomers(prev => prev.filter(c => c.customer_id !== customerId));
  };

  const handleSupplierAdded = (newSup) => {
    if (newSup && newSup.supplier_id) {
      setSuppliers(prev => [newSup, ...prev]);
    } else {
      loadSuppliers();
    }
    loadSupplierLedgerData();
  };

  const handleSupplierUpdated = (updated) => {
    if (updated && updated.supplier_id) {
      setSuppliers(prev => prev.map(s => s.supplier_id === updated.supplier_id ? updated : s));
    } else {
      loadSuppliers();
    }
    loadSupplierLedgerData();
  };

  const handleDeleteSupplier = (supplierId) => {
    setSuppliers(prev => prev.filter(s => s.supplier_id !== supplierId));
    loadSupplierLedgerData();
  };

  const handleOldPhoneAdded = (res) => {
    if (res?.purchase) {
      setOldPhones(prev => [res.purchase, ...prev]);
    } else {
      loadOldPhones();
    }
    if (res?.product) {
      setProducts(prev => [res.product, ...prev]);
    } else {
      loadProducts();
    }
    loadOverview();
  };

  const handleDeleteOldPhone = (purchaseId) => {
    setOldPhones(prev => prev.filter(p => p.purchase_id !== purchaseId));
    loadOverview();
  };

  const handleRepairsUpdated = () => {
    loadRepairs();
    loadOverview();
  };

  const handleExpenseAdded = (newExp) => {
    if (newExp && newExp.expense_id) {
      setExpenses(prev => [newExp, ...prev]);
    } else {
      loadExpenses();
    }
    loadOverview();
  };

  const handleDeleteExpense = (expenseId) => {
    setExpenses(prev => prev.filter(e => e.expense_id !== expenseId));
    loadOverview();
  };

  const handleDeleteSale = (saleId) => {
    setSales(prev => prev.filter(s => s.sale_id !== saleId));
    loadOverview();
    loadProducts();
  };

  const handleSaleCompleted = (soldItems, totalAmount) => {
    if (soldItems && soldItems.length > 0) {
      setProducts(prevProducts => {
        return prevProducts.map(prod => {
          const sold = soldItems.find(s => s.product_id === prod.product_id);
          if (sold) {
            const newQty = Math.max(0, (prod.stock_quantity || 1) - (sold.quantity || 1));
            return {
              ...prod,
              stock_quantity: newQty,
              status: newQty === 0 ? 'Sold' : 'In Stock'
            };
          }
          return prod;
        });
      });
    }

    if (totalAmount && totalAmount > 0) {
      setDashboardData(prev => ({
        ...prev,
        todaySales: {
          amount: (Number(prev?.todaySales?.amount) || 0) + Number(totalAmount),
          count: (Number(prev?.todaySales?.count) || 0) + 1
        },
        monthTotal: (Number(prev?.monthTotal) || 0) + Number(totalAmount),
        todaySalesTotal: (Number(prev?.todaySalesTotal) || 0) + Number(totalAmount),
        todaySalesInvoices: (Number(prev?.todaySalesInvoices) || 0) + 1,
        totalSalesCount: (Number(prev?.totalSalesCount) || 0) + 1,
        monthlySalesTotal: (Number(prev?.monthlySalesTotal) || 0) + Number(totalAmount)
      }));
    }

    loadSales();
    loadProducts();
    loadCustomers();
    loadOverview();
  };

  const handleSupplierPurchaseCompleted = (res) => {
    loadProducts();
    loadSupplierLedgerData();
    loadOverview();
    if (res?.message) {
      alert(`✅ ${res.message}`);
    }
  };

  const handleSupplierPaymentRecorded = (res) => {
    loadSupplierLedgerData();
    loadOverview();
    if (res?.message) {
      alert(`✅ ${res.message}`);
    }
  };

  return (
    <div className="app-container">
      {/* Dark Sidebar with Active Submenu Tracking */}
      <Sidebar
        onOpenPos={() => setIsPosOpen(true)}
        onOpenAddProduct={() => setIsAddProductOpen(true)}
        onOpenCategories={() => setIsCategoriesOpen(true)}
        onOpenOldPhone={() => setIsOldPhoneOpen(true)}
        onOpenInwardStock={() => setIsSupplierPurchaseOpen(true)}
        onOpenMakePayment={() => {
          setSelectedPaymentSupplier(null);
          setIsSupplierPaymentOpen(true);
        }}
        onOpenRepairs={() => setIsRepairsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content with Route-Based Views */}
      <div className="main-wrapper">
        <Header
          user={user}
          onLogout={onLogout}
          onOpenPos={() => setIsPosOpen(true)}
          onOpenOldPhone={() => setIsOldPhoneOpen(true)}
          onOpenRepairs={() => setIsRepairsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <Routes>
          <Route
            path="/"
            element={
              <DashboardView
                dashboardData={dashboardData}
                onOpenPos={() => setIsPosOpen(true)}
                onOpenRepairs={() => setIsRepairsOpen(true)}
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              <DashboardView
                dashboardData={dashboardData}
                onOpenPos={() => setIsPosOpen(true)}
                onOpenRepairs={() => setIsRepairsOpen(true)}
              />
            }
          />
          <Route
            path="/customers"
            element={
              <CustomersView
                customers={customers}
                sales={sales}
                oldPhones={oldPhones}
                onCustomerAdded={handleCustomerAdded}
                onCustomerUpdated={handleCustomerUpdated}
                onDeleteCustomer={handleDeleteCustomer}
                onRefresh={loadOverview}
              />
            }
          />
          <Route
            path="/suppliers"
            element={
              <SuppliersView
                suppliers={suppliers}
                onSupplierAdded={handleSupplierAdded}
                onSupplierUpdated={handleSupplierUpdated}
                onDeleteSupplier={handleDeleteSupplier}
              />
            }
          />
          <Route
            path="/products"
            element={
              <ProductsView
                products={products}
                categories={categories}
                onOpenAddProduct={() => setIsAddProductOpen(true)}
                onProductUpdated={handleProductUpdated}
                onDeleteProduct={handleDeleteProduct}
                onRefresh={loadProducts}
              />
            }
          />
          <Route
            path="/sales"
            element={
              <SalesView
                sales={sales}
                onOpenPos={() => setIsPosOpen(true)}
                onRefresh={loadSales}
                onDeleteSale={handleDeleteSale}
              />
            }
          />
          <Route
            path="/purchases"
            element={
              <OldPhonesView
                oldPhones={oldPhones}
                onOpenOldPhone={() => setIsOldPhoneOpen(true)}
                onRefresh={handleOldPhoneAdded}
                onDeletePurchase={handleDeleteOldPhone}
              />
            }
          />
          <Route
            path="/old-phones"
            element={
              <OldPhonesView
                oldPhones={oldPhones}
                onOpenOldPhone={() => setIsOldPhoneOpen(true)}
                onRefresh={handleOldPhoneAdded}
                onDeletePurchase={handleDeleteOldPhone}
              />
            }
          />
          <Route
            path="/supplier-ledger"
            element={
              <SupplierPaymentsView
                ledgerData={suppliersLedger}
                purchases={supplierPurchases}
                payments={supplierPayments}
                suppliers={suppliers}
                onOpenInwardStock={() => setIsSupplierPurchaseOpen(true)}
                onOpenMakePayment={(sup) => {
                  setSelectedPaymentSupplier(sup || null);
                  setIsSupplierPaymentOpen(true);
                }}
                onOpenLedger={(sup) => {
                  setSelectedLedgerSupplier(sup);
                  setIsSupplierLedgerOpen(true);
                }}
                onOpenAddSupplier={() => navigate('/suppliers')}
              />
            }
          />
          <Route
            path="/expenses"
            element={
              <ExpensesView
                expenses={expenses}
                onExpenseAdded={handleExpenseAdded}
                onDeleteExpense={handleDeleteExpense}
              />
            }
          />
          <Route
            path="/repairs"
            element={
              <RepairsView
                repairs={repairs}
                onOpenNewRepair={() => setIsRepairsOpen(true)}
                onRefresh={handleRepairsUpdated}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* POS Billing Modal */}
      <POSModal
        isOpen={isPosOpen}
        onClose={() => setIsPosOpen(false)}
        products={products}
        customers={customers}
        onSaleCompleted={handleSaleCompleted}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        categories={categories}
        suppliers={suppliers}
        onProductAdded={handleProductAdded}
      />

      {/* Old Phone / CNIC Purchase Modal */}
      <OldPhoneModal
        isOpen={isOldPhoneOpen}
        onClose={() => setIsOldPhoneOpen(false)}
        onPurchaseComplete={handleOldPhoneAdded}
      />

      {/* Categories Management Modal */}
      <CategoriesModal
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        categories={categories}
        onCategoryChanged={() => {
          loadCategoriesAndSuppliers();
          loadProducts();
        }}
      />

      {/* Repairs Intake Modal */}
      <RepairsModal
        isOpen={isRepairsOpen}
        onClose={() => setIsRepairsOpen(false)}
        repairs={repairs}
        customers={customers}
        onRefresh={handleRepairsUpdated}
        onRepairCreated={handleRepairsUpdated}
      />

      {/* Supplier Stock Inward Purchase Modal (Auto-Inventory) */}
      <SupplierPurchaseModal
        isOpen={isSupplierPurchaseOpen}
        onClose={() => setIsSupplierPurchaseOpen(false)}
        suppliers={suppliers}
        categories={categories}
        onPurchaseCompleted={handleSupplierPurchaseCompleted}
        onOpenAddSupplier={() => {
          setIsSupplierPurchaseOpen(false);
          navigate('/suppliers');
        }}
      />

      {/* Supplier Payment Modal */}
      <SupplierPaymentModal
        isOpen={isSupplierPaymentOpen}
        onClose={() => setIsSupplierPaymentOpen(false)}
        supplier={selectedPaymentSupplier}
        suppliers={suppliersLedger.length > 0 ? suppliersLedger : suppliers}
        onPaymentRecorded={handleSupplierPaymentRecorded}
      />

      {/* Supplier Statement Ledger Modal */}
      <SupplierLedgerModal
        isOpen={isSupplierLedgerOpen}
        onClose={() => setIsSupplierLedgerOpen(false)}
        supplier={selectedLedgerSupplier}
        onOpenPayment={(sup) => {
          setSelectedPaymentSupplier(sup);
          setIsSupplierPaymentOpen(true);
        }}
      />

      {/* System Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
