const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Get active auth token from localStorage
 */
export function getAuthToken() {
  try {
    return localStorage.getItem('cms_token') || null;
  } catch (err) {
    return null;
  }
}

/**
 * Unified fetch helper with automatic Bearer token injection
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...options.headers };

  const token = getAuthToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers
  });

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const errorJson = await res.json();
      errorMsg = errorJson.message || errorJson.error || errorMsg;
    } catch (e) {
      // Non-JSON response
    }
    const err = new Error(errorMsg);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/**
 * Upload Image to Supabase Storage Bucket
 */
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  return request('/upload', {
    method: 'POST',
    body: formData
  });
}

/**
 * Health & Authentication
 */
export async function fetchHealth() {
  return request('/health');
}

export async function loginUser(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function registerUser(payload) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchCurrentUser() {
  return request('/auth/me');
}

export async function fetchAppContext() {
  return request('/context');
}

export async function fetchDashboardOverview() {
  return request('/dashboard/overview');
}

/**
 * Products CRUD
 */
export async function fetchProducts() {
  return request('/products');
}

export async function createProduct(payload) {
  return request('/products', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateProduct(id, payload) {
  return request(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteProduct(id) {
  return request(`/products/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Categories CRUD
 */
export async function fetchCategories() {
  return request('/categories');
}

export async function createCategory(payload) {
  return request('/categories', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateCategory(id, payload) {
  return request(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteCategory(id) {
  return request(`/categories/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Suppliers CRUD
 */
export async function fetchSuppliers() {
  return request('/suppliers');
}

export async function createSupplier(payload) {
  return request('/suppliers', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateSupplier(id, payload) {
  return request(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteSupplier(id) {
  return request(`/suppliers/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Customers CRUD
 */
export async function fetchCustomers() {
  return request('/customers');
}

export async function createCustomer(payload) {
  return request('/customers', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateCustomer(id, payload) {
  return request(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteCustomer(id) {
  return request(`/customers/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Sales & POS CRUD
 */
export async function fetchSales() {
  return request('/sales');
}

export async function createSale(payload) {
  return request('/sales', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function deleteSale(id) {
  return request(`/sales/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Old Phones / CNIC Legal Purchases CRUD
 */
export async function fetchOldPhones() {
  return request('/old-phones');
}

export async function createOldPhonePurchase(payload) {
  return request('/old-phones', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateOldPhone(id, payload) {
  return request(`/old-phones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteOldPhone(id) {
  return request(`/old-phones/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Repairs CRUD
 */
export async function fetchRepairs() {
  return request('/repairs');
}

export async function createRepair(payload) {
  return request('/repairs', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateRepairStatus(id, status) {
  return request(`/repairs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function deleteRepair(id) {
  return request(`/repairs/${id}`, {
    method: 'DELETE'
  });
}

export async function fetchSettings() {
  return request('/settings');
}

export async function updateSettings(payload) {
  return request('/settings', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Daily Expenses CRUD
 */
export async function fetchExpenses() {
  return request('/expenses');
}

export async function createExpense(payload) {
  return request('/expenses', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateExpense(id, payload) {
  return request(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteExpense(id) {
  return request(`/expenses/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Supplier Purchases & Inward Stock CRUD
 */
export async function fetchSupplierPurchases() {
  return request('/supplier-purchases');
}

export async function createSupplierPurchase(payload) {
  return request('/supplier-purchases', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Supplier Payments & Ledger
 */
export async function fetchSupplierPayments() {
  return request('/supplier-payments');
}

export async function createSupplierPayment(payload) {
  return request('/supplier-payments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchSuppliersLedger() {
  return request('/suppliers-ledger');
}
