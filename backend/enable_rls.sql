-- =====================================================================
-- Chaudhry Mobile Shop Management System - Row Level Security (RLS)
-- Run this SQL in your Supabase SQL Editor: Dashboard > SQL Editor > New Query
-- =====================================================================

-- 1. Enable Row Level Security (RLS) on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE old_phone_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Authenticated users full access to customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users full access to suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users full access to categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users full access to products" ON products;
DROP POLICY IF EXISTS "Authenticated users full access to old_phone_purchases" ON old_phone_purchases;
DROP POLICY IF EXISTS "Authenticated users full access to sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users full access to sale_items" ON sale_items;
DROP POLICY IF EXISTS "Authenticated users full access to repairs" ON repairs;
DROP POLICY IF EXISTS "Authenticated users full access to expenses" ON expenses;

DROP POLICY IF EXISTS "Enable full access for public" ON customers;
DROP POLICY IF EXISTS "Enable full access for public" ON suppliers;
DROP POLICY IF EXISTS "Enable full access for public" ON categories;
DROP POLICY IF EXISTS "Enable full access for public" ON products;
DROP POLICY IF EXISTS "Enable full access for public" ON old_phone_purchases;
DROP POLICY IF EXISTS "Enable full access for public" ON sales;
DROP POLICY IF EXISTS "Enable full access for public" ON sale_items;
DROP POLICY IF EXISTS "Enable full access for public" ON repairs;
DROP POLICY IF EXISTS "Enable full access for public" ON expenses;

-- 3. Create RLS Policies allowing full CRUD operations for public (anon + authenticated)
CREATE POLICY "Enable full access for public" ON customers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable full access for public" ON suppliers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable full access for public" ON categories FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable full access for public" ON products FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable full access for public" ON old_phone_purchases FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable full access for public" ON sales FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable full access for public" ON sale_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable full access for public" ON repairs FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable full access for public" ON expenses FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. Verification: Check RLS status across all tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public';
