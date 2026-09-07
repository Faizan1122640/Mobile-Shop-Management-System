-- =====================================================================
-- Chaudhry Mobile Shop - Supplier Purchases & Payments Ledger Schema
-- Run this in your Supabase SQL Editor to create the supplier ledger tables
-- =====================================================================

-- 1. Supplier Purchases Table (Inward Stock Invoices)
CREATE TABLE IF NOT EXISTS supplier_purchases (
    purchase_id SERIAL PRIMARY KEY,
    supplier_id INT NOT NULL,
    invoice_no VARCHAR(100) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    pending_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'Pending' CHECK (payment_status IN ('Paid', 'Partial', 'Pending')),
    payment_method VARCHAR(50) DEFAULT 'Cash',
    notes TEXT,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE
);

-- 2. Supplier Purchase Items Table (Line Items Breakdown)
CREATE TABLE IF NOT EXISTS supplier_purchase_items (
    item_id SERIAL PRIMARY KEY,
    purchase_id INT NOT NULL,
    product_id INT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(255) NOT NULL,
    category_id INT NULL,
    track_type VARCHAR(50) DEFAULT 'Serialized' CHECK (track_type IN ('Serialized', 'Bulk')),
    imei_list TEXT,
    quantity INT NOT NULL DEFAULT 1,
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (purchase_id) REFERENCES supplier_purchases(purchase_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

-- 3. Supplier Payments Table (Ledger Transactions)
CREATE TABLE IF NOT EXISTS supplier_payments (
    payment_id SERIAL PRIMARY KEY,
    supplier_id INT NOT NULL,
    purchase_id INT NULL,
    amount_paid DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Online', 'Cheque')),
    reference_no VARCHAR(100),
    notes TEXT,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
    FOREIGN KEY (purchase_id) REFERENCES supplier_purchases(purchase_id) ON DELETE SET NULL
);

-- =====================================================================
-- Enable Row Level Security (RLS) & Full Access Policies
-- =====================================================================
ALTER TABLE supplier_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable full access for public" ON supplier_purchases;
DROP POLICY IF EXISTS "Enable full access for public" ON supplier_purchase_items;
DROP POLICY IF EXISTS "Enable full access for public" ON supplier_payments;

CREATE POLICY "Enable full access for public" ON supplier_purchases FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable full access for public" ON supplier_purchase_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable full access for public" ON supplier_payments FOR ALL TO public USING (true) WITH CHECK (true);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_sup_purchases_supplier_id ON supplier_purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sup_purchase_items_purchase_id ON supplier_purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_sup_payments_supplier_id ON supplier_payments(supplier_id);
