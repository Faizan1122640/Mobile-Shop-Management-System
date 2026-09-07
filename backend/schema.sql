-- Chaudhry Mobile Shop Management System - Database Schema
-- Compatible with Supabase (PostgreSQL)

-- Drop existing tables if re-running (in reverse order of dependencies)
DROP TABLE IF EXISTS repairs CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS old_phone_purchases CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- 1. Customers Table (Must be created first)
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Suppliers Table
CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20)
);

-- 3. Categories Table
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    track_type VARCHAR(50) CHECK (track_type IN ('Serialized', 'Bulk'))
);

-- 4. Products Table (Depends on Categories and Suppliers)
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    category_id INT NOT NULL,
    supplier_id INT NULL, 
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(255) NOT NULL,
    imei_barcode VARCHAR(100) UNIQUE,
    purchase_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'In Stock' CHECK (status IN ('In Stock', 'Sold', 'Reserved')),
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL
);

-- 5. Old Phone Purchases Table (Depends on Products)
CREATE TABLE old_phone_purchases (
    purchase_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    seller_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    cnic_number VARCHAR(50) NOT NULL,
    imei VARCHAR(100) NOT NULL,
    cnic_front_pic VARCHAR(500),
    cnic_back_pic VARCHAR(500),
    person_pic VARCHAR(500),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 6. Sales Table (Depends on Customers)
CREATE TABLE sales (
    sale_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- 7. Sale Items Table (Depends on Sales and Products)
CREATE TABLE sale_items (
    sale_item_id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    sale_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 8. Repairs Table (Depends on Customers)
CREATE TABLE repairs (
    repair_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    device_model VARCHAR(255) NOT NULL,
    imei VARCHAR(100),
    issue TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Process', 'Repaired', 'Delivered')),
    cost DECIMAL(10, 2),
    received_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_date TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- ----------------------------------------------------
-- Row Level Security (RLS) Configuration
-- Disables RLS so your backend API can perform full CRUD operations
-- ----------------------------------------------------
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE old_phone_purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE repairs DISABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- Sample Seed Data for Chaudhry Mobile Shop
-- ----------------------------------------------------

INSERT INTO customers (name, phone, address) VALUES
('Waqas Ahmed', '0300-1234567', 'Main Bazaar, Lahore'),
('Muhammad Ali', '0321-7654321', 'Model Town, Gujranwala'),
('Hamza Tariq', '0333-5551234', 'Satellite Town, Rawalpindi'),
('Usman Chaudhry', '0345-9876543', 'F-10 Markaz, Islamabad');

INSERT INTO suppliers (company_name, contact_person, phone) VALUES
('Falcon Cellular Traders', 'Tariq Mehmood', '0301-4433221'),
('Star Telecom International', 'Babar Azam', '0312-9988776'),
('Prime Mobile Wholesale', 'Kashif Raza', '0322-1122334');

INSERT INTO categories (name, track_type) VALUES
('Smartphones', 'Serialized'),
('Used / Old Phones', 'Serialized'),
('Accessories & Cables', 'Bulk'),
('Audio & Earbuds', 'Bulk'),
('Smart Watches', 'Serialized');

INSERT INTO products (category_id, supplier_id, brand, model, imei_barcode, purchase_price, selling_price, stock_quantity, status) VALUES
(1, 1, 'Apple', 'iPhone 17 Pro Max (Dark Black)', '354890123456781', 345000.00, 365000.00, 2, 'In Stock'),
(1, 1, 'Apple', 'iPhone 17 Pro Max (Black)', '354890123456782', 345000.00, 365000.00, 2, 'In Stock'),
(1, 2, 'Samsung', 'Galaxy S25 Ultra 512GB Titanium', '359920192837461', 285000.00, 305000.00, 4, 'In Stock'),
(1, 2, 'Xiaomi', 'Redmi Note 14 Pro+ 256GB', '864201948572615', 72000.00, 78000.00, 6, 'In Stock'),
(3, 3, 'Anker', '20W Fast Charger Type-C', 'ANK-20W-001', 2200.00, 3200.00, 35, 'In Stock'),
(3, 3, 'Baseus', 'Braided Lightning to Type-C 1m', 'BAS-CL-002', 950.00, 1500.00, 48, 'In Stock'),
(4, 3, 'Apple', 'AirPods Pro 2 USB-C', '359123849102938', 52000.00, 58000.00, 5, 'In Stock');

-- Sample Old Phone Purchase (with CNIC record)
INSERT INTO products (category_id, supplier_id, brand, model, imei_barcode, purchase_price, selling_price, stock_quantity, status) VALUES
(2, NULL, 'Apple', 'iPhone 13 Pro 128GB Sierra Blue', '358201948271039', 115000.00, 130000.00, 1, 'In Stock');

INSERT INTO old_phone_purchases (product_id, seller_name, phone, address, cnic_number, imei, cnic_front_pic, cnic_back_pic, person_pic) VALUES
(8, 'Bilal Sheikh', '0315-9988112', 'Circular Road, Lahore', '35201-1234567-9', '358201948271039', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400');

-- Sample Sales
INSERT INTO sales (customer_id, total_amount, sale_date) VALUES
(1, 62200.00, '2026-08-10 14:30:00');

INSERT INTO sale_items (sale_id, product_id, quantity, sale_price) VALUES
(1, 1, 2, 4100.00);

-- Sample Repairs
INSERT INTO repairs (customer_id, device_model, imei, issue, status, cost, received_date) VALUES
(2, 'Samsung Galaxy S22', '352948172635481', 'Screen replacement and battery health check', 'Pending', 18500.00, '2026-08-11 11:00:00'),
(3, 'iPhone 14', '351948273615482', 'Charging port cleaning & speaker replacement', 'In Process', 6500.00, '2026-08-10 16:20:00');
