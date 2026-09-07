import express from 'express';
import multer from 'multer';
import { getSupabaseClient } from '../config/supabase.js';
import { catchAsync } from '../errors/catchAsync.js';
import { AppError } from '../errors/AppError.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import {
  customerSchema,
  supplierSchema,
  productSchema,
  oldPhonePurchaseSchema,
  repairSchema,
  expenseSchema
} from '../validators/schemas.js';

const router = express.Router();

// Configure Multer for in-memory file buffering
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ====================================================
// 1. Supabase Storage: Image Upload Endpoint
// ====================================================
router.post('/upload', upload.single('image'), catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No image file uploaded', 400));
  }

  const supabase = getSupabaseClient();
  const bucketName = 'shop-uploads';

  const ext = req.file.originalname.split('.').pop() || 'jpg';
  const cleanName = req.file.originalname.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  const fileName = `${Date.now()}_${cleanName}.${ext}`;
  const contentType = req.file.mimetype || 'image/jpeg';

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, req.file.buffer, {
        contentType,
        upsert: true
      });

    if (!uploadError && uploadData) {
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      return res.status(200).json({
        success: true,
        url: publicUrlData.publicUrl,
        filename: fileName
      });
    }

    // Fallback: Convert to Base64 Data URL if bucket permissions are restricted
    const base64Url = `data:${contentType};base64,${req.file.buffer.toString('base64')}`;
    return res.status(200).json({
      success: true,
      url: base64Url,
      filename: fileName,
      note: 'Stored as data URL'
    });
  } catch (err) {
    const base64Url = `data:${contentType};base64,${req.file.buffer.toString('base64')}`;
    return res.status(200).json({
      success: true,
      url: base64Url,
      filename: fileName
    });
  }
}));

// ====================================================
// 2. Dynamic Supabase Authentication
// ====================================================
router.post('/auth/login', catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide both email and password', 400));
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password
  });

  if (error || !data?.user) {
    return next(new AppError(error?.message || 'Invalid email or password', 401));
  }

  const user = data.user;
  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Administrator';
  const userRole = user.user_metadata?.role || 'Administrator';
  const shopName = user.user_metadata?.shop_name || 'Chaudhry Mobile Shop';

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: userName,
      role: userRole,
      shop_name: shopName,
      avatar_initial: userName.charAt(0).toUpperCase()
    },
    token: data.session?.access_token || 'supabase_authenticated_session'
  });
}));

router.post('/auth/register', catchAsync(async (req, res, next) => {
  const { email, password, name, role, shop_name } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  if (password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long', 400));
  }

  const supabase = getSupabaseClient();
  const displayName = name ? name.trim() : email.split('@')[0];
  const userRole = role ? role.trim() : 'Administrator';
  const shop = shop_name ? shop_name.trim() : 'Chaudhry Mobile Shop';

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password,
    options: {
      data: {
        name: displayName,
        role: userRole,
        shop_name: shop
      }
    }
  });

  if (error) {
    return next(new AppError(error.message, 400));
  }

  const user = data.user;
  if (!user) {
    return next(new AppError('User registration failed. Please try again.', 400));
  }

  return res.status(201).json({
    success: true,
    message: data.session ? 'Registration successful' : 'Account created. You can now log in.',
    user: {
      id: user.id,
      email: user.email,
      name: displayName,
      role: userRole,
      shop_name: shop,
      avatar_initial: displayName.charAt(0).toUpperCase()
    },
    token: data.session?.access_token || null
  });
}));

router.get('/auth/me', requireAuth, catchAsync(async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
}));

// ====================================================
// Helper: Calculate Real-Time Dashboard Overview
// ====================================================
async function calculateDashboardOverview(supabase) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      return d.toISOString().split('T')[0] === todayStr || d.toLocaleDateString() === now.toLocaleDateString();
    } catch (e) {
      return false;
    }
  };

  const isThisMonth = (dateStr) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    } catch (e) {
      return false;
    }
  };

  const [
    allSalesRes,
    allPurchasesRes,
    allExpensesRes,
    allRepairsRes,
    saleItemsRes,
    customersRes
  ] = await Promise.all([
    supabase.from('sales').select('sale_id, total_amount, sale_date'),
    supabase.from('old_phone_purchases').select('purchase_id, purchase_date, products (purchase_price)'),
    supabase.from('expenses').select('expense_id, amount, expense_date'),
    supabase.from('repairs').select('repair_id, status, received_date'),
    supabase.from('sale_items').select(`quantity, sale_price, products (product_id, brand, model)`),
    supabase.from('customers').select('customer_id, name, registered_at').order('registered_at', { ascending: false }).limit(5)
  ]);

  const allSales = allSalesRes.data || [];
  const allPurchases = allPurchasesRes.data || [];
  const allExpenses = allExpensesRes.data || [];
  const allRepairs = allRepairsRes.data || [];

  // 1. Today metrics
  const todaySalesList = allSales.filter(s => isToday(s.sale_date));
  const todaySalesAmount = todaySalesList.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
  const todaySalesCount = todaySalesList.length;

  const todayPurchasesList = allPurchases.filter(p => isToday(p.purchase_date));
  const todayPurchasesAmount = todayPurchasesList.reduce((acc, p) => acc + Number(p.products?.purchase_price || 0), 0);
  const todayPurchasesCount = todayPurchasesList.length;

  const todayExpensesList = allExpenses.filter(e => isToday(e.expense_date));
  const todayExpensesAmount = todayExpensesList.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const todayExpensesCount = todayExpensesList.length;

  const pendingRepairs = allRepairs.filter(r => r.status === 'Pending');
  const pendingRepairsCount = pendingRepairs.length;
  const repairsReceivedToday = allRepairs.filter(r => isToday(r.received_date)).length;

  // 2. Month sales & Chart Data
  const monthSalesList = allSales.filter(s => isThisMonth(s.sale_date));
  const monthTotal = monthSalesList.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dailyBuckets = {};
  for (let d = 1; d <= daysInMonth; d++) {
    dailyBuckets[String(d).padStart(2, '0')] = 0;
  }

  monthSalesList.forEach(s => {
    if (s.sale_date) {
      const day = String(new Date(s.sale_date).getDate()).padStart(2, '0');
      if (dailyBuckets[day] !== undefined) {
        dailyBuckets[day] += Number(s.total_amount || 0);
      }
    }
  });

  const chartData = Object.entries(dailyBuckets).map(([day, amount]) => ({ day, amount }));

  // 3. Top Sold Items
  const itemMap = {};
  (saleItemsRes.data || []).forEach(si => {
    if (si.products) {
      const pId = si.products.product_id;
      const itemName = `${si.products.brand} ${si.products.model}`;
      if (!itemMap[pId]) {
        itemMap[pId] = {
          product_id: pId,
          item_name: itemName,
          color: 'Standard',
          qty_sold: 0,
          amount: 0
        };
      }
      itemMap[pId].qty_sold += Number(si.quantity || 1);
      itemMap[pId].amount += Number(si.quantity || 1) * Number(si.sale_price || 0);
    }
  });

  const topSoldItems = Object.values(itemMap)
    .sort((a, b) => b.qty_sold - a.qty_sold)
    .slice(0, 5);

  const recoveries = (customersRes.data || []).map((c) => ({
    id: c.customer_id,
    customer_name: c.name,
    payments_count: 1,
    amount: 0
  }));

  return {
    todaySales: { amount: todaySalesAmount, count: todaySalesCount },
    todayPurchases: { amount: todayPurchasesAmount, count: todayPurchasesCount },
    todayExpenses: { amount: todayExpensesAmount, count: todayExpensesCount },
    repairsPending: { count: pendingRepairsCount, receivedToday: repairsReceivedToday },
    chartData,
    monthTotal,
    recoveries,
    topSoldItems,
    settings: {
      shop_name: 'Chaudhry Mobile Shop',
      currency: 'PKR',
      supabase_connected: true
    }
  };
}

// ====================================================
// 3. Single Unified Bootstrap / Context API (GET /api/context)
// ====================================================
router.get(['/context', '/bootstrap'], catchAsync(async (req, res, next) => {
  const supabase = getSupabaseClient(req);

  const [
    overview,
    categoriesRes,
    suppliersRes,
    customersRes,
    productsRes,
    oldPhonesRes,
    repairsRes,
    expensesRes,
    salesRes,
    supplierPurchasesRes,
    supplierPaymentsRes
  ] = await Promise.all([
    calculateDashboardOverview(supabase),
    supabase.from('categories').select('*').order('name'),
    supabase.from('suppliers').select('*').order('company_name'),
    supabase.from('customers').select('*').order('customer_id', { ascending: false }),
    supabase.from('products').select(`*, categories (category_id, name, track_type), suppliers (supplier_id, company_name, contact_person, phone)`).order('product_id', { ascending: false }),
    supabase.from('old_phone_purchases').select(`*, products (*)`).order('purchase_date', { ascending: false }),
    supabase.from('repairs').select(`*, customers (customer_id, name, phone, address)`).order('received_date', { ascending: false }),
    supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
    supabase.from('sales').select(`*, customers (customer_id, name, phone, address), sale_items (sale_item_id, product_id, quantity, sale_price, products (brand, model, imei_barcode))`).order('sale_id', { ascending: false }),
    supabase.from('supplier_purchases').select(`*, suppliers (supplier_id, company_name, contact_person, phone), supplier_purchase_items (*)`).order('purchase_date', { ascending: false }).then(r => r).catch(() => ({ data: [] })),
    supabase.from('supplier_payments').select(`*, suppliers (supplier_id, company_name, phone)`).order('payment_date', { ascending: false }).then(r => r).catch(() => ({ data: [] }))
  ]);

  const suppliersList = suppliersRes.data || [];
  const purchasesList = supplierPurchasesRes.data || [];
  const paymentsList = supplierPaymentsRes.data || [];

  const ledger = suppliersList.map(sup => {
    const supPurchases = purchasesList.filter(p => p.supplier_id === sup.supplier_id);
    const supPayments = paymentsList.filter(p => p.supplier_id === sup.supplier_id);

    const totalBilled = supPurchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
    const totalPaid = supPayments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
    const pendingBalance = Math.max(0, totalBilled - totalPaid);

    return {
      supplier_id: sup.supplier_id,
      company_name: sup.company_name,
      contact_person: sup.contact_person,
      phone: sup.phone,
      invoices_count: supPurchases.length,
      total_billed: totalBilled,
      total_paid: totalPaid,
      pending_balance: pendingBalance,
      status: pendingBalance === 0 ? 'Settled' : (totalPaid > 0 ? 'Partial' : 'Due'),
      purchases: supPurchases,
      payments: supPayments
    };
  });

  return res.status(200).json({
    success: true,
    overview,
    categories: categoriesRes.data || [],
    suppliers: suppliersList,
    customers: customersRes.data || [],
    products: productsRes.data || [],
    oldPhones: oldPhonesRes.data || [],
    repairs: repairsRes.data || [],
    expenses: expensesRes.data || [],
    sales: salesRes.data || [],
    supplierPurchases: purchasesList,
    supplierPayments: paymentsList,
    suppliersLedger: ledger,
    settings: overview.settings
  });
}));

// ====================================================
// Real-Time Dashboard Overview (Standalone)
// ====================================================
router.get('/dashboard/overview', catchAsync(async (req, res, next) => {
  const supabase = getSupabaseClient();
  const overview = await calculateDashboardOverview(supabase);
  return res.status(200).json({
    success: true,
    ...overview
  });
}));

// ====================================================
// 4. Products & Inventory CRUD
// ====================================================
router.get('/products', catchAsync(async (req, res, next) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (category_id, name, track_type),
      suppliers (supplier_id, company_name, contact_person, phone)
    `)
    .order('product_id', { ascending: false });

  if (error) return next(new AppError(`Failed to fetch products: ${error.message}`, 500));
  return res.status(200).json(data);
}));

router.post('/products', catchAsync(async (req, res, next) => {
  const {
    category_id,
    supplier_id,
    brand,
    model,
    imei_barcode,
    purchase_price,
    selling_price,
    stock_quantity = 1
  } = req.body;

  if (!brand || !model || !purchase_price || !selling_price) {
    return next(new AppError('Missing required product fields (brand, model, purchase_price, selling_price)', 400));
  }

  const supabase = getSupabaseClient();

  let resolvedCategoryId = Number(category_id);
  if (!resolvedCategoryId) {
    const { data: firstCat } = await supabase.from('categories').select('category_id').limit(1).single();
    if (firstCat) {
      resolvedCategoryId = firstCat.category_id;
    } else {
      const { data: newCat } = await supabase.from('categories').insert([{ name: 'Smartphones', track_type: 'Serialized' }]).select().single();
      resolvedCategoryId = newCat?.category_id || 1;
    }
  }

  let resolvedSupplierId = supplier_id ? Number(supplier_id) : null;
  if (resolvedSupplierId) {
    const { data: supExists } = await supabase.from('suppliers').select('supplier_id').eq('supplier_id', resolvedSupplierId).single();
    if (!supExists) resolvedSupplierId = null;
  }

  const { data, error } = await supabase
    .from('products')
    .insert([{
      category_id: resolvedCategoryId,
      supplier_id: resolvedSupplierId,
      brand: brand.trim(),
      model: model.trim(),
      imei_barcode: imei_barcode ? imei_barcode.trim() : null,
      purchase_price: Number(purchase_price),
      selling_price: Number(selling_price),
      stock_quantity: Number(stock_quantity) || 1,
      status: 'In Stock',
      date_added: new Date().toISOString()
    }])
    .select(`
      *,
      categories (category_id, name, track_type),
      suppliers (supplier_id, company_name)
    `)
    .single();

  if (error) {
    if (error.code === '23505' || error.message?.includes('unique constraint') || error.message?.includes('imei_barcode')) {
      return next(new AppError(`A device with IMEI / Barcode "${imei_barcode}" already exists in inventory.`, 400));
    }
    return next(new AppError(`Database insertion failed: ${error.message}`, 400));
  }

  return res.status(201).json(data);
}));

router.put('/products/:id', catchAsync(async (req, res, next) => {
  const productId = parseInt(req.params.id, 10);
  const { brand, model, imei_barcode, purchase_price, selling_price, stock_quantity, status, category_id, supplier_id } = req.body;

  const supabase = getSupabaseClient();
  const updates = {};
  if (brand) updates.brand = brand.trim();
  if (model) updates.model = model.trim();
  if (imei_barcode !== undefined) updates.imei_barcode = imei_barcode ? imei_barcode.trim() : null;
  if (purchase_price !== undefined) updates.purchase_price = Number(purchase_price);
  if (selling_price !== undefined) updates.selling_price = Number(selling_price);
  if (stock_quantity !== undefined) updates.stock_quantity = Number(stock_quantity);
  if (status) updates.status = status;
  if (category_id) updates.category_id = Number(category_id);
  if (supplier_id !== undefined) updates.supplier_id = supplier_id ? Number(supplier_id) : null;

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('product_id', productId)
    .select(`
      *,
      categories (category_id, name, track_type),
      suppliers (supplier_id, company_name)
    `)
    .single();

  if (error) return next(new AppError(`Failed to update product: ${error.message}`, 400));
  return res.status(200).json(data);
}));

router.delete('/products/:id', catchAsync(async (req, res, next) => {
  const productId = parseInt(req.params.id, 10);
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('product_id', productId);

  if (error) return next(new AppError(`Failed to delete product: ${error.message}`, 400));
  return res.status(200).json({ success: true, message: 'Product deleted successfully from inventory' });
}));

// ====================================================
// 5. Categories CRUD
// ====================================================
router.get('/categories', catchAsync(async (req, res, next) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('category_id', { ascending: true });

  if (error) return next(new AppError(`Failed to fetch categories: ${error.message}`, 500));
  return res.status(200).json(data);
}));

router.post('/categories', catchAsync(async (req, res, next) => {
  const { name, track_type = 'Serialized' } = req.body;
  if (!name) return next(new AppError('Category name is required', 400));

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name: name.trim(), track_type }])
    .select()
    .single();

  if (error) return next(new AppError(`Failed to create category: ${error.message}`, 400));
  return res.status(201).json(data);
}));

router.delete('/categories/:id', catchAsync(async (req, res, next) => {
  const categoryId = parseInt(req.params.id, 10);
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('category_id', categoryId);

  if (error) return next(new AppError(`Failed to delete category: ${error.message}`, 400));
  return res.status(200).json({ success: true, message: 'Category deleted successfully' });
}));

// ====================================================
// 6. Suppliers CRUD
// ====================================================
router.get('/suppliers', catchAsync(async (req, res, next) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('supplier_id', { ascending: false });

  if (error) return next(new AppError(`Failed to fetch suppliers: ${error.message}`, 500));
  return res.status(200).json(data);
}));

router.post('/suppliers', validateBody(supplierSchema), catchAsync(async (req, res, next) => {
  const { company_name, contact_person, phone } = req.validatedBody;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('suppliers')
    .insert([{
      company_name: company_name.trim(),
      contact_person: contact_person ? contact_person.trim() : null,
      phone: phone ? phone.trim() : null
    }])
    .select()
    .single();

  if (error) return next(new AppError(`Failed to add supplier: ${error.message}`, 400));
  return res.status(201).json(data);
}));

router.put('/suppliers/:id', validateBody(supplierSchema), catchAsync(async (req, res, next) => {
  const supplierId = parseInt(req.params.id, 10);
  const { company_name, contact_person, phone } = req.validatedBody;

  const supabase = getSupabaseClient();
  const updates = {};
  if (company_name) updates.company_name = company_name.trim();
  if (contact_person !== undefined) updates.contact_person = contact_person ? contact_person.trim() : null;
  if (phone !== undefined) updates.phone = phone ? phone.trim() : null;

  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('supplier_id', supplierId)
    .select()
    .single();

  if (error) return next(new AppError(`Failed to update supplier: ${error.message}`, 400));
  return res.status(200).json(data);
}));

router.delete('/suppliers/:id', catchAsync(async (req, res, next) => {
  const supplierId = parseInt(req.params.id, 10);
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('supplier_id', supplierId);

  if (error) return next(new AppError(`Failed to delete supplier: ${error.message}`, 400));
  return res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
}));

// ====================================================
// 7. Customers / Users CRUD
// ====================================================
router.get('/customers', catchAsync(async (req, res, next) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('customer_id', { ascending: false });

  if (error) return next(new AppError(`Failed to fetch customers: ${error.message}`, 500));
  return res.status(200).json(data);
}));

router.post('/customers', validateBody(customerSchema), catchAsync(async (req, res, next) => {
  const { name, phone, address } = req.validatedBody;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('customers')
    .insert([{
      name: name.trim(),
      phone: phone.trim(),
      address: address ? address.trim() : null,
      registered_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) return next(new AppError(`Failed to create customer: ${error.message}`, 400));
  return res.status(201).json(data);
}));

router.put('/customers/:id', validateBody(customerSchema), catchAsync(async (req, res, next) => {
  const customerId = parseInt(req.params.id, 10);
  const { name, phone, address } = req.validatedBody;

  const supabase = getSupabaseClient();
  const updates = {};
  if (name) updates.name = name.trim();
  if (phone) updates.phone = phone.trim();
  if (address !== undefined) updates.address = address ? address.trim() : null;

  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('customer_id', customerId)
    .select()
    .single();

  if (error) return next(new AppError(`Failed to update customer: ${error.message}`, 400));
  return res.status(200).json(data);
}));

router.delete('/customers/:id', catchAsync(async (req, res, next) => {
  const customerId = parseInt(req.params.id, 10);
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('customer_id', customerId);

  if (error) return next(new AppError(`Failed to delete customer: ${error.message}`, 400));
  return res.status(200).json({ success: true, message: 'Customer deleted successfully' });
}));

// ====================================================
// 8. Sales Invoices & POS CRUD
// ====================================================
router.get('/sales', catchAsync(async (req, res, next) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      customers (customer_id, name, phone, address),
      sale_items (
        sale_item_id,
        product_id,
        quantity,
        sale_price,
        products (brand, model, imei_barcode)
      )
    `)
    .order('sale_id', { ascending: false });

  if (error) return next(new AppError(`Failed to fetch sales: ${error.message}`, 500));
  return res.status(200).json(data);
}));

router.post('/sales', catchAsync(async (req, res, next) => {
  const { customer_id, customer_name, customer_phone, items, total_amount } = req.body;
  if (!items || !items.length) return next(new AppError('Cart must contain at least one item', 400));

  const supabase = getSupabaseClient();

  let finalCustomerId = customer_id ? Number(customer_id) : null;
  if (finalCustomerId) {
    const { data: custExists } = await supabase
      .from('customers')
      .select('customer_id')
      .eq('customer_id', finalCustomerId)
      .maybeSingle();
    if (!custExists) {
      finalCustomerId = null;
    }
  }

  let createdCustomer = null;
  if (!finalCustomerId && customer_name && customer_name.trim() && customer_name !== 'Walk-in Customer') {
    const { customer_address } = req.body;
    const { data: newCust } = await supabase
      .from('customers')
      .insert([{
        name: customer_name.trim(),
        phone: customer_phone ? customer_phone.trim() : '03000000000',
        address: customer_address ? customer_address.trim() : null,
        registered_at: new Date().toISOString()
      }])
      .select()
      .maybeSingle();

    if (newCust) {
      finalCustomerId = newCust.customer_id;
      createdCustomer = newCust;
    }
  }

  const { data: saleData, error: saleErr } = await supabase
    .from('sales')
    .insert([{
      customer_id: finalCustomerId || null,
      total_amount: Number(total_amount),
      sale_date: new Date().toISOString()
    }])
    .select(`
      *,
      customers (customer_id, name, phone, address)
    `)
    .single();

  if (saleErr || !saleData) return next(new AppError(`Failed to record sale: ${saleErr?.message}`, 400));

  // Build resilient sale_items records
  const saleItemsPayload = items.map(item => ({
    sale_id: saleData.sale_id,
    product_id: item.product_id,
    quantity: Number(item.quantity || 1),
    sale_price: Number(item.sale_price ?? item.selling_price ?? item.price ?? 0)
  }));

  // Fetch product stocks & insert sale_items in parallel
  const productIds = items.map(item => item.product_id).filter(Boolean);
  const [itemsInsertRes, productsFetchRes] = await Promise.all([
    supabase.from('sale_items').insert(saleItemsPayload),
    productIds.length ? supabase.from('products').select('product_id, stock_quantity').in('product_id', productIds) : Promise.resolve({ data: [] })
  ]);

  if (itemsInsertRes.error) {
    console.error('Sale items insertion warning:', itemsInsertRes.error);
  }

  const currentProds = productsFetchRes.data || [];
  const prodStockMap = new Map(currentProds.map(p => [p.product_id, Number(p.stock_quantity ?? 1)]));

  // Concurrently update all product stocks
  await Promise.all(
    items.filter(item => item.product_id).map(item => {
      const currentStock = prodStockMap.get(item.product_id) ?? 1;
      const qtySold = Number(item.quantity || 1);
      const remainingStock = Math.max(0, currentStock - qtySold);

      return supabase
        .from('products')
        .update({
          stock_quantity: remainingStock,
          status: remainingStock <= 0 ? 'Sold' : 'In Stock'
        })
        .eq('product_id', item.product_id);
    })
  );

  return res.status(201).json({
    success: true,
    message: 'POS Transaction completed and saved to Supabase',
    sale: saleData,
    customer: createdCustomer || saleData.customers,
    items: saleItemsPayload
  });
}));

router.delete('/sales/:id', catchAsync(async (req, res, next) => {
  const saleId = parseInt(req.params.id, 10);
  const supabase = getSupabaseClient();

  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('product_id, quantity')
    .eq('sale_id', saleId);

  if (saleItems?.length) {
    for (const item of saleItems) {
      if (item.product_id) {
        const { data: currentProd } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('product_id', item.product_id)
          .single();

        const currentStock = Number(currentProd?.stock_quantity ?? 0);
        const restoredStock = currentStock + Number(item.quantity || 1);

        await supabase
          .from('products')
          .update({
            stock_quantity: restoredStock,
            status: 'In Stock'
          })
          .eq('product_id', item.product_id);
      }
    }
  }

  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('sale_id', saleId);

  if (error) return next(new AppError(`Failed to delete sale invoice: ${error.message}`, 400));
  return res.status(200).json({ success: true, message: 'Sale invoice cancelled and stock restored' });
}));

// ====================================================
// 9. Daily Expenses CRUD
// ====================================================
router.get('/expenses', catchAsync(async (req, res, next) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });

  if (error) {
    // If table doesn't exist yet, return empty list gracefully
    return res.status(200).json([]);
  }
  return res.status(200).json(data || []);
}));

router.post('/expenses', catchAsync(async (req, res, next) => {
  const { title, category = 'General', amount, payment_method = 'Cash', notes, expense_date } = req.body;
  if (!title || !amount) {
    return next(new AppError('Expense title and amount are required', 400));
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      title: title.trim(),
      category: category ? category.trim() : 'General',
      amount: Number(amount),
      payment_method: payment_method || 'Cash',
      notes: notes ? notes.trim() : null,
      expense_date: expense_date ? new Date(expense_date).toISOString() : new Date().toISOString()
    }])
    .select()
    .single();

  if (error) return next(new AppError(`Failed to record expense: ${error.message}`, 400));
  return res.status(201).json(data);
}));

router.put('/expenses/:id', catchAsync(async (req, res, next) => {
  const expenseId = parseInt(req.params.id, 10);
  const { title, category, amount, payment_method, notes, expense_date } = req.body;

  const supabase = getSupabaseClient();
  const updates = {};
  if (title) updates.title = title.trim();
  if (category) updates.category = category.trim();
  if (amount !== undefined) updates.amount = Number(amount);
  if (payment_method) updates.payment_method = payment_method;
  if (notes !== undefined) updates.notes = notes ? notes.trim() : null;
  if (expense_date) updates.expense_date = new Date(expense_date).toISOString();

  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('expense_id', expenseId)
    .select()
    .single();

  if (error) return next(new AppError(`Failed to update expense: ${error.message}`, 400));
  return res.status(200).json(data);
}));

router.delete('/expenses/:id', catchAsync(async (req, res, next) => {
  const expenseId = parseInt(req.params.id, 10);
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('expense_id', expenseId);

  if (error) return next(new AppError(`Failed to delete expense: ${error.message}`, 400));
  return res.status(200).json({ success: true, message: 'Expense deleted successfully' });
}));

// ====================================================
// 10. Old Phone Purchases & Legal CNIC Verification CRUD
// ====================================================
router.get('/old-phones', catchAsync(async (req, res, next) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('old_phone_purchases')
    .select(`
      *,
      products (
        product_id,
        brand,
        model,
        imei_barcode,
        purchase_price,
        selling_price,
        status,
        date_added
      )
    `)
    .order('purchase_id', { ascending: false });

  if (error) return next(new AppError(`Failed to fetch old phone records: ${error.message}`, 500));
  return res.status(200).json(data);
}));

router.post('/old-phones', catchAsync(async (req, res, next) => {
  const {
    brand,
    model,
    imei,
    purchase_price,
    expected_selling_price,
    seller_name,
    seller_phone,
    seller_address,
    seller_cnic,
    cnic_front_pic,
    cnic_back_pic,
    person_pic
  } = req.body;

  if (!brand || !model || !imei || !purchase_price || !seller_name || !seller_cnic || !seller_phone) {
    return next(new AppError('Missing required details (Brand, Model, IMEI, Purchase Price, Seller Name, CNIC, Phone)', 400));
  }

  const supabase = getSupabaseClient();

  let categoryId = 1;
  const { data: usedCat } = await supabase
    .from('categories')
    .select('category_id')
    .ilike('name', '%used%')
    .limit(1)
    .single();

  if (usedCat) {
    categoryId = usedCat.category_id;
  } else {
    const { data: firstCat } = await supabase.from('categories').select('category_id').limit(1).single();
    if (firstCat) {
      categoryId = firstCat.category_id;
    } else {
      const { data: newCat } = await supabase.from('categories').insert([{ name: 'Used / Old Phones', track_type: 'Serialized' }]).select().single();
      categoryId = newCat?.category_id || 1;
    }
  }

  const { data: newProd, error: prodErr } = await supabase
    .from('products')
    .insert([{
      category_id: categoryId,
      brand: brand.trim(),
      model: model.trim(),
      imei_barcode: imei.trim(),
      purchase_price: Number(purchase_price),
      selling_price: Number(expected_selling_price || purchase_price * 1.15),
      stock_quantity: 1,
      status: 'In Stock',
      date_added: new Date().toISOString()
    }])
    .select()
    .single();

  if (prodErr || !newProd) {
    if (prodErr?.code === '23505' || prodErr?.message?.includes('imei_barcode')) {
      return next(new AppError(`A phone with IMEI "${imei}" is already registered in inventory. Please verify IMEI.`, 400));
    }
    return next(new AppError(`Failed to create inventory entry: ${prodErr?.message}`, 400));
  }

  const { data: purchaseData, error: purchaseErr } = await supabase
    .from('old_phone_purchases')
    .insert([{
      product_id: newProd.product_id,
      seller_name: seller_name.trim(),
      phone: seller_phone.trim(),
      address: seller_address ? seller_address.trim() : 'N/A',
      cnic_number: seller_cnic.trim(),
      imei: imei.trim(),
      cnic_front_pic: cnic_front_pic || null,
      cnic_back_pic: cnic_back_pic || null,
      person_pic: person_pic || null,
      purchase_date: new Date().toISOString()
    }])
    .select()
    .single();

  if (purchaseErr) {
    return next(new AppError(`Failed to save CNIC purchase record: ${purchaseErr.message}`, 400));
  }

  return res.status(201).json({
    success: true,
    message: 'Old phone purchase and legal CNIC verification saved to Supabase',
    product: newProd,
    purchase: purchaseData
  });
}));

router.put('/old-phones/:id', catchAsync(async (req, res, next) => {
  const purchaseId = parseInt(req.params.id, 10);
  const {
    seller_name,
    phone,
    address,
    cnic_number,
    cnic_front_pic,
    cnic_back_pic,
    person_pic,
    selling_price,
    purchase_price
  } = req.body;

  const supabase = getSupabaseClient();

  const updates = {};
  if (seller_name) updates.seller_name = seller_name.trim();
  if (phone) updates.phone = phone.trim();
  if (address !== undefined) updates.address = address ? address.trim() : null;
  if (cnic_number) updates.cnic_number = cnic_number.trim();
  if (cnic_front_pic !== undefined) updates.cnic_front_pic = cnic_front_pic;
  if (cnic_back_pic !== undefined) updates.cnic_back_pic = cnic_back_pic;
  if (person_pic !== undefined) updates.person_pic = person_pic;

  const { data, error } = await supabase
    .from('old_phone_purchases')
    .update(updates)
    .eq('purchase_id', purchaseId)
    .select(`*, products (*)`)
    .single();

  if (error) return next(new AppError(`Failed to update old phone record: ${error.message}`, 400));

  if (data?.product_id && (selling_price !== undefined || purchase_price !== undefined)) {
    const prodUpdates = {};
    if (selling_price !== undefined) prodUpdates.selling_price = Number(selling_price);
    if (purchase_price !== undefined) prodUpdates.purchase_price = Number(purchase_price);
    await supabase.from('products').update(prodUpdates).eq('product_id', data.product_id);
  }

  return res.status(200).json(data);
}));

router.delete('/old-phones/:id', catchAsync(async (req, res, next) => {
  const purchaseId = parseInt(req.params.id, 10);
  const supabase = getSupabaseClient();

  const { data: rec } = await supabase
    .from('old_phone_purchases')
    .select('product_id')
    .eq('purchase_id', purchaseId)
    .single();

  const { error } = await supabase
    .from('old_phone_purchases')
    .delete()
    .eq('purchase_id', purchaseId);

  if (error) return next(new AppError(`Failed to delete record: ${error.message}`, 400));

  if (rec?.product_id) {
    try {
      await supabase.from('products').delete().eq('product_id', rec.product_id);
    } catch (_) {
      // Ignore if already deleted or referenced
    }
  }

  return res.status(200).json({ success: true, message: 'Old phone record and inventory product deleted successfully' });
}));

// ====================================================
// 11. Mobile Repairs CRUD
// ====================================================
router.get('/repairs', catchAsync(async (req, res, next) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('repairs')
    .select(`*, customers (customer_id, name, phone)`)
    .order('repair_id', { ascending: false });

  if (error) return next(new AppError(`Failed to fetch repair jobs: ${error.message}`, 500));

  const mapped = (data || []).map(r => ({
    ...r,
    customer_name: r.customers?.name || r.customer_name || 'Walk-in Customer',
    customer_phone: r.customers?.phone || r.customer_phone || 'N/A'
  }));

  return res.status(200).json(mapped);
}));

router.post('/repairs', validateBody(repairSchema), catchAsync(async (req, res, next) => {
  const {
    customer_id,
    customer_name,
    customer_phone,
    device_model,
    imei,
    issue,
    cost = 0,
    status = 'Pending'
  } = req.validatedBody;

  if (!device_model || !issue) {
    return next(new AppError('Device model and issue description are required', 400));
  }

  const supabase = getSupabaseClient();

  let resolvedCustId = customer_id;
  if (!resolvedCustId && customer_name) {
    const { data: newCust } = await supabase
      .from('customers')
      .insert([{
        name: customer_name.trim(),
        phone: customer_phone ? customer_phone.trim() : 'N/A',
        registered_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (newCust) resolvedCustId = newCust.customer_id;
  }

  const { data, error } = await supabase
    .from('repairs')
    .insert([{
      customer_id: resolvedCustId || null,
      device_model: device_model.trim(),
      imei: imei ? imei.trim() : null,
      issue: issue.trim(),
      cost: Number(cost || 0),
      status: status || 'Pending',
      received_date: new Date().toISOString()
    }])
    .select(`*, customers (customer_id, name, phone)`)
    .single();

  if (error) return next(new AppError(`Failed to create repair ticket: ${error.message}`, 400));
  return res.status(201).json(data);
}));

router.patch('/repairs/:id/status', catchAsync(async (req, res, next) => {
  const repairId = parseInt(req.params.id, 10);
  const { status } = req.body;
  if (!status) return next(new AppError('New status is required', 400));

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('repairs')
    .update({ status })
    .eq('repair_id', repairId)
    .select()
    .single();

  if (error) return next(new AppError(`Failed to update repair status: ${error.message}`, 400));
  return res.status(200).json(data);
}));

router.delete('/repairs/:id', catchAsync(async (req, res, next) => {
  const repairId = parseInt(req.params.id, 10);
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('repairs')
    .delete()
    .eq('repair_id', repairId);

  if (error) return next(new AppError(`Failed to delete repair ticket: ${error.message}`, 400));
  return res.status(200).json({ success: true, message: 'Repair ticket deleted successfully' });
}));

// ====================================================
// 12. System Settings
// ====================================================
router.get('/settings', catchAsync(async (req, res, next) => {
  return res.status(200).json({
    shop_name: 'Chaudhry Mobile Shop',
    address: 'Shop # 14, Chaudhry Plaza, Mobile Market',
    supabase_connected: true,
    supabase_url: process.env.SUPABASE_URL || ''
  });
}));

// ====================================================
// 13. Supplier Purchases & Stock Inward (Auto-Inventory)
// ====================================================

// GET all supplier purchases
router.get('/supplier-purchases', catchAsync(async (req, res, next) => {
  const supabase = getSupabaseClient(req);
  try {
    const { data, error } = await supabase
      .from('supplier_purchases')
      .select(`
        *,
        suppliers (supplier_id, company_name, contact_person, phone),
        supplier_purchase_items (*)
      `)
      .order('purchase_date', { ascending: false });

    if (error) {
      // If table doesn't exist yet, return empty list gracefully
      console.warn('supplier_purchases query notice:', error.message);
      return res.status(200).json([]);
    }
    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(200).json([]);
  }
}));

// POST new supplier purchase with automatic inventory injection
router.post('/supplier-purchases', catchAsync(async (req, res, next) => {
  const {
    supplier_id,
    invoice_no,
    purchase_date,
    paid_amount = 0,
    payment_method = 'Cash',
    notes,
    items = []
  } = req.body;

  if (!supplier_id) {
    return next(new AppError('Supplier is required', 400));
  }

  if (!items || items.length === 0) {
    return next(new AppError('At least one product item must be included in the purchase', 400));
  }

  const supabase = getSupabaseClient(req);

  // 1. Calculate totals
  let totalAmount = 0;
  const processedItems = items.map(item => {
    const qty = Number(item.quantity || 1);
    const unitCost = Number(item.unit_cost || 0);
    const lineTotal = Number(item.total_cost || (qty * unitCost));
    totalAmount += lineTotal;
    return {
      ...item,
      quantity: qty,
      unit_cost: unitCost,
      selling_price: Number(item.selling_price || (unitCost * 1.15)),
      total_cost: lineTotal
    };
  });

  const numericPaid = Number(paid_amount || 0);
  const pendingBalance = Math.max(0, totalAmount - numericPaid);
  const paymentStatus = numericPaid >= totalAmount ? 'Paid' : (numericPaid > 0 ? 'Partial' : 'Pending');
  const generatedInvoiceNo = invoice_no ? invoice_no.trim() : `INV-SUP-${Date.now().toString().slice(-6)}`;

  // 2. Insert purchase header
  const { data: purchaseData, error: purchaseError } = await supabase
    .from('supplier_purchases')
    .insert([{
      supplier_id: Number(supplier_id),
      invoice_no: generatedInvoiceNo,
      total_amount: totalAmount,
      paid_amount: numericPaid,
      pending_balance: pendingBalance,
      payment_status: paymentStatus,
      payment_method: payment_method || 'Cash',
      notes: notes ? notes.trim() : null,
      purchase_date: purchase_date || new Date().toISOString()
    }])
    .select()
    .single();

  if (purchaseError) {
    return next(new AppError(`Failed to create supplier purchase invoice: ${purchaseError.message}`, 400));
  }

  const purchaseId = purchaseData.purchase_id;
  let productsCreatedCount = 0;

  // 3. AUTO-INVENTORY INJECTION: Add or increment products in inventory
  for (const item of processedItems) {
    const isSerialized = item.track_type === 'Serialized';
    let rawImeis = [];

    if (isSerialized) {
      if (Array.isArray(item.imei_list)) {
        rawImeis = item.imei_list;
      } else if (typeof item.imei_list === 'string') {
        rawImeis = item.imei_list.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      }

      // If quantity > IMEIs provided, generate missing serial barcodes
      const countNeeded = Math.max(item.quantity, rawImeis.length || 1);
      while (rawImeis.length < countNeeded) {
        rawImeis.push(`SN-${Date.now().toString().slice(-6)}-${rawImeis.length + 1}`);
      }

      // Insert individual products for each IMEI
      for (const imei of rawImeis) {
        const { data: newProd } = await supabase
          .from('products')
          .insert([{
            category_id: item.category_id || 1,
            supplier_id: Number(supplier_id),
            brand: item.brand.trim(),
            model: item.model.trim(),
            imei_barcode: imei.trim(),
            purchase_price: item.unit_cost,
            selling_price: item.selling_price,
            stock_quantity: 1,
            status: 'In Stock',
            date_added: new Date().toISOString()
          }])
          .select()
          .single();

        if (newProd) productsCreatedCount++;
      }
    } else {
      // Bulk product: Check if an existing bulk product exists
      const { data: existingProd } = await supabase
        .from('products')
        .select('*')
        .eq('brand', item.brand.trim())
        .eq('model', item.model.trim())
        .eq('category_id', item.category_id || 1)
        .limit(1)
        .maybeSingle();

      if (existingProd) {
        // Increment stock
        const newQty = (existingProd.stock_quantity || 0) + item.quantity;
        await supabase
          .from('products')
          .update({
            stock_quantity: newQty,
            purchase_price: item.unit_cost,
            selling_price: item.selling_price,
            status: 'In Stock'
          })
          .eq('product_id', existingProd.product_id);

        productsCreatedCount += item.quantity;
      } else {
        // Insert new bulk product
        const bulkBarcode = item.imei_barcode || `BLK-${item.brand.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        await supabase
          .from('products')
          .insert([{
            category_id: item.category_id || 1,
            supplier_id: Number(supplier_id),
            brand: item.brand.trim(),
            model: item.model.trim(),
            imei_barcode: bulkBarcode,
            purchase_price: item.unit_cost,
            selling_price: item.selling_price,
            stock_quantity: item.quantity,
            status: 'In Stock',
            date_added: new Date().toISOString()
          }]);

        productsCreatedCount += item.quantity;
      }
    }

    // 4. Record line item in supplier_purchase_items
    await supabase
      .from('supplier_purchase_items')
      .insert([{
        purchase_id: purchaseId,
        brand: item.brand.trim(),
        model: item.model.trim(),
        category_id: item.category_id || 1,
        track_type: item.track_type || 'Serialized',
        imei_list: isSerialized ? rawImeis.join(', ') : null,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        selling_price: item.selling_price,
        total_cost: item.total_cost
      }]);
  }

  // 5. If initial payment was made, record in supplier_payments
  if (numericPaid > 0) {
    await supabase
      .from('supplier_payments')
      .insert([{
        supplier_id: Number(supplier_id),
        purchase_id: purchaseId,
        amount_paid: numericPaid,
        payment_method: payment_method || 'Cash',
        reference_no: generatedInvoiceNo,
        notes: `Initial payment on purchase invoice ${generatedInvoiceNo}`,
        payment_date: purchase_date || new Date().toISOString()
      }]);
  }

  return res.status(201).json({
    success: true,
    message: `Stock inward recorded successfully! ${productsCreatedCount} units automatically added to inventory.`,
    purchase: purchaseData,
    products_created: productsCreatedCount
  });
}));

// ====================================================
// 14. Supplier Payments & Ledger
// ====================================================

// GET all supplier payments
router.get('/supplier-payments', catchAsync(async (req, res, next) => {
  const supabase = getSupabaseClient(req);
  try {
    const { data, error } = await supabase
      .from('supplier_payments')
      .select(`
        *,
        suppliers (supplier_id, company_name, contact_person, phone),
        supplier_purchases (purchase_id, invoice_no, total_amount, pending_balance)
      `)
      .order('payment_date', { ascending: false });

    if (error) {
      console.warn('supplier_payments query notice:', error.message);
      return res.status(200).json([]);
    }
    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(200).json([]);
  }
}));

// POST new supplier payment (reduces supplier debt)
router.post('/supplier-payments', catchAsync(async (req, res, next) => {
  const {
    supplier_id,
    purchase_id,
    amount_paid,
    payment_method = 'Cash',
    reference_no,
    notes,
    payment_date
  } = req.body;

  const numericAmount = Number(amount_paid);
  if (!supplier_id || !numericAmount || numericAmount <= 0) {
    return next(new AppError('Supplier and a valid payment amount (> 0) are required', 400));
  }

  const supabase = getSupabaseClient(req);

  // 1. Record the payment
  const { data: paymentData, error: payError } = await supabase
    .from('supplier_payments')
    .insert([{
      supplier_id: Number(supplier_id),
      purchase_id: purchase_id ? Number(purchase_id) : null,
      amount_paid: numericAmount,
      payment_method: payment_method || 'Cash',
      reference_no: reference_no ? reference_no.trim() : null,
      notes: notes ? notes.trim() : null,
      payment_date: payment_date || new Date().toISOString()
    }])
    .select(`*, suppliers (supplier_id, company_name, phone)`)
    .single();

  if (payError) {
    return next(new AppError(`Failed to record payment: ${payError.message}`, 400));
  }

  // 2. If paid against a specific purchase invoice, update invoice pending balance
  if (purchase_id) {
    const { data: targetPurchase } = await supabase
      .from('supplier_purchases')
      .select('*')
      .eq('purchase_id', Number(purchase_id))
      .single();

    if (targetPurchase) {
      const newPaid = Number(targetPurchase.paid_amount || 0) + numericAmount;
      const newBalance = Math.max(0, Number(targetPurchase.total_amount || 0) - newPaid);
      const newStatus = newBalance === 0 ? 'Paid' : (newPaid > 0 ? 'Partial' : 'Pending');

      await supabase
        .from('supplier_purchases')
        .update({
          paid_amount: newPaid,
          pending_balance: newBalance,
          payment_status: newStatus
        })
        .eq('purchase_id', Number(purchase_id));
    }
  } else {
    // If general payment to supplier without specific invoice, apply to oldest pending invoices
    const { data: pendingInvoices } = await supabase
      .from('supplier_purchases')
      .select('*')
      .eq('supplier_id', Number(supplier_id))
      .gt('pending_balance', 0)
      .order('purchase_date', { ascending: true });

    let remainingToDistribute = numericAmount;
    if (pendingInvoices && pendingInvoices.length > 0) {
      for (const inv of pendingInvoices) {
        if (remainingToDistribute <= 0) break;
        const currentBal = Number(inv.pending_balance || 0);
        const applyAmt = Math.min(remainingToDistribute, currentBal);
        const updatedPaid = Number(inv.paid_amount || 0) + applyAmt;
        const updatedBal = currentBal - applyAmt;
        const updatedStatus = updatedBal === 0 ? 'Paid' : 'Partial';

        await supabase
          .from('supplier_purchases')
          .update({
            paid_amount: updatedPaid,
            pending_balance: updatedBal,
            payment_status: updatedStatus
          })
          .eq('purchase_id', inv.purchase_id);

        remainingToDistribute -= applyAmt;
      }
    }
  }

  return res.status(201).json({
    success: true,
    message: `Payment of Rs. ${numericAmount.toLocaleString()} recorded successfully.`,
    payment: paymentData
  });
}));

// GET Supplier Ledger summary per supplier
router.get('/suppliers-ledger', catchAsync(async (req, res, next) => {
  const supabase = getSupabaseClient(req);

  const [suppliersRes, purchasesRes, paymentsRes] = await Promise.all([
    supabase.from('suppliers').select('*').order('company_name'),
    supabase.from('supplier_purchases').select('*'),
    supabase.from('supplier_payments').select('*')
  ]);

  const suppliers = suppliersRes.data || [];
  const purchases = purchasesRes.data || [];
  const payments = paymentsRes.data || [];

  const ledger = suppliers.map(sup => {
    const supPurchases = purchases.filter(p => p.supplier_id === sup.supplier_id);
    const supPayments = payments.filter(p => p.supplier_id === sup.supplier_id);

    const totalBilled = supPurchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
    const totalPaid = supPayments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
    const pendingBalance = Math.max(0, totalBilled - totalPaid);

    return {
      supplier_id: sup.supplier_id,
      company_name: sup.company_name,
      contact_person: sup.contact_person,
      phone: sup.phone,
      invoices_count: supPurchases.length,
      total_billed: totalBilled,
      total_paid: totalPaid,
      pending_balance: pendingBalance,
      status: pendingBalance === 0 ? 'Settled' : (totalPaid > 0 ? 'Partial' : 'Due'),
      purchases: supPurchases,
      payments: supPayments
    };
  });

  const grandTotalPurchases = ledger.reduce((sum, l) => sum + l.total_billed, 0);
  const grandTotalPaid = ledger.reduce((sum, l) => sum + l.total_paid, 0);
  const grandTotalPending = ledger.reduce((sum, l) => sum + l.pending_balance, 0);

  return res.status(200).json({
    success: true,
    summary: {
      total_purchases: grandTotalPurchases,
      total_paid: grandTotalPaid,
      total_pending: grandTotalPending,
      suppliers_count: suppliers.length
    },
    ledger
  });
}));

export default router;
