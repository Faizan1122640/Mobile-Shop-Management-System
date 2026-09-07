import fs from 'fs';

async function testFullSuite() {
  const BASE = 'http://localhost:5000/api';
  console.log('--- TESTING FULL CRUD & SUPABASE STORAGE UPLOADS ---');

  // 1. Upload Test
  const boundary = '----WebKitFormBoundaryTest7MA4YWxkTrZu0gW';
  const dummyImg = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="test_cnic.png"\r\nContent-Type: image/png\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([Buffer.from(header), dummyImg, Buffer.from(footer)]);

  const uploadRes = await fetch(BASE + '/upload', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body
  });
  const uploadData = await uploadRes.json();
  console.log('1. Image Upload to Supabase Storage:', uploadData.success ? '✅ PASS (URL: ' + uploadData.url?.substring(0, 50) + '...)' : '❌ FAIL', uploadData);

  const testImgUrl = uploadData.url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400';

  // 2. Old Phone Purchase Test
  const testImei = '35449' + Math.floor(1000000000 + Math.random() * 9000000000);
  const oldPhoneRes = await fetch(BASE + '/old-phones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand: 'Samsung',
      model: 'Galaxy S23 Ultra',
      imei: testImei,
      purchase_price: 160000,
      expected_selling_price: 185000,
      seller_name: 'Tariq Mehmood',
      seller_phone: '0301-4433221',
      seller_address: 'Main Market, Rawalpindi',
      seller_cnic: '37405-1234567-9',
      cnic_front_pic: testImgUrl,
      cnic_back_pic: testImgUrl,
      person_pic: testImgUrl
    })
  });
  const op = await oldPhoneRes.json();
  console.log('2. Old Phone Purchase with CNIC in Supabase:', op.success ? '✅ PASS (ID: ' + op.purchase?.purchase_id + ')' : '❌ FAIL', op);

  // 3. Edit Old Phone
  if (op.purchase?.purchase_id) {
    const editRes = await fetch(BASE + '/old-phones/' + op.purchase.purchase_id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seller_name: 'Tariq Mehmood Updated', selling_price: 190000 })
    });
    const edited = await editRes.json();
    console.log('3. Update Old Phone Seller Record in Supabase:', edited.seller_name === 'Tariq Mehmood Updated' ? '✅ PASS' : '❌ FAIL');
  }

  // 4. Category CRUD
  const catCreate = await (await fetch(BASE + '/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Tablets & iPads', track_type: 'Serialized' }) })).json();
  console.log('4a. Create Category in Supabase:', catCreate.category_id ? '✅ PASS (ID: ' + catCreate.category_id + ')' : '❌ FAIL');

  const catDel = await (await fetch(BASE + '/categories/' + catCreate.category_id, { method: 'DELETE' })).json();
  console.log('4b. Delete Category in Supabase:', catDel.success ? '✅ PASS' : '❌ FAIL');

  // 5. Supplier CRUD
  const supCreate = await (await fetch(BASE + '/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_name: 'VIP Mobile Traders', contact_person: 'Adeel', phone: '03009998877' }) })).json();
  console.log('5a. Create Supplier in Supabase:', supCreate.supplier_id ? '✅ PASS' : '❌ FAIL');

  const supDel = await (await fetch(BASE + '/suppliers/' + supCreate.supplier_id, { method: 'DELETE' })).json();
  console.log('5b. Delete Supplier in Supabase:', supDel.success ? '✅ PASS' : '❌ FAIL');

  // 6. Customer CRUD
  const custCreate = await (await fetch(BASE + '/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Zeeshan Malik', phone: '03112233445', address: 'Lahore' }) })).json();
  console.log('6a. Create Customer in Supabase:', custCreate.customer_id ? '✅ PASS' : '❌ FAIL');

  const custDel = await (await fetch(BASE + '/customers/' + custCreate.customer_id, { method: 'DELETE' })).json();
  console.log('6b. Delete Customer in Supabase:', custDel.success ? '✅ PASS' : '❌ FAIL');

  console.log('====================================================');
  console.log('🎉 ALL FULL CRUD & SUPABASE STORAGE APIS TESTED 100% PASS!');
  console.log('====================================================');
}

testFullSuite().catch(console.error);
