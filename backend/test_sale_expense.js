async function testSaleAndExpense() {
  const BASE = 'http://localhost:5000/api';
  console.log('--- TESTING POS SALE ITEMS & DAILY EXPENSES ---');

  // 1. Fetch products
  const products = await (await fetch(BASE + '/products')).json();
  console.log('1. Current Inventory Products:', products.length);

  // 2. Fetch customers
  const customers = await (await fetch(BASE + '/customers')).json();
  console.log('2. Current Customers:', customers.length);

  // 3. Test POS Sale if products exist
  if (products.length > 0) {
    const prod = products[0];
    const salePayload = {
      customer_id: customers[0]?.customer_id || null,
      customer_name: 'Test POS Customer',
      customer_phone: '03001234567',
      items: [{
        product_id: prod.product_id,
        brand: prod.brand,
        model: prod.model,
        imei_barcode: prod.imei_barcode,
        sale_price: Number(prod.selling_price || 1000),
        selling_price: Number(prod.selling_price || 1000),
        price: Number(prod.selling_price || 1000),
        quantity: 1
      }],
      total_amount: Number(prod.selling_price || 1000)
    };

    const saleRes = await fetch(BASE + '/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(salePayload)
    });
    const saleData = await saleRes.json();
    console.log('3. POS Sale Checkout:', saleData.success ? '✅ PASS' : '❌ FAIL', saleData);
  }

  // 4. Test Dashboard Overview
  const overview = await (await fetch(BASE + '/dashboard/overview')).json();
  console.log('4. Dashboard Overview (Top Sold Items):', overview.topSoldItems);
  console.log('   Today Sales:', overview.todaySales);
  console.log('   Today Expenses:', overview.todayExpenses);

  // 5. Test Expense CRUD
  const expRes = await fetch(BASE + '/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Shop Electricity Bill',
      category: 'Shop Utilities',
      amount: 4200,
      payment_method: 'Cash',
      notes: 'September Bill'
    })
  });
  const expData = await expRes.json();
  console.log('5. Create Daily Expense:', expData.expense_id ? '✅ PASS' : '❌ FAIL / Waiting for table in Supabase', expData);
}

testSaleAndExpense().catch(console.error);
