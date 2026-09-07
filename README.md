# Chaudhry Mobile Shop Management System

A full-stack modern Mobile Shop Management Web Application built with **React.js**, **Node.js (Express)**, and **Supabase (PostgreSQL)**, featuring the exact UI/UX design matching your specifications with fluid animations and responsive workflows.

---

## 📸 Visual Design Highlights
- **Login Screen**: Split-screen design with a dark teal radial gradient, animated glowing floating orbs, pill badge branding, and a clean card with mail/lock inputs and password visibility toggle.
- **Dashboard Screen**: Dark navy sidebar (`#0d1b24`), breadcrumb bar with live date pill and administrator profile menu, 4 KPI metric cards, August 2026 daily sales bar chart, customer recoveries tracker, and top sold items table.
- **POS & Thermal Billing**: Fast billing modal with instant IMEI/Barcode search, customer selector, dynamic discount calculation, and thermal printable receipts.
- **Used Phone Purchases (CNIC Register)**: Dedicated workflow for purchasing old phones with legal seller details (CNIC, phone, address, and picture verification).
- **Repairs Module**: Repair status kanban & list (`Pending` ➔ `In Process` ➔ `Repaired` ➔ `Delivered`).
- **Product Master & IMEI**: Manage Serialized (unique 15-digit IMEI) and Bulk mobile accessories.

---

## 🗄️ Database Schema & Supabase Setup

The database uses the provided 8 tables:
1. `customers`
2. `suppliers`
3. `categories` (with track_type `Serialized` / `Bulk`)
4. `products` (with `imei_barcode` UNIQUE and stock status)
5. `old_phone_purchases` (with seller CNIC, phone, address, and photo attachments)
6. `sales`
7. `sale_items`
8. `repairs` (with status `Pending`, `In Process`, `Repaired`, `Delivered`)

### Connecting to Supabase
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** in Supabase and paste the contents of `backend/schema.sql`.
3. Click **Run** to execute the table creation and insert the seed data.
4. Copy your **Project URL** and **Anon / Service Key** from **Project Settings ➔ API**.
5. Add them to `backend/.env`:
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-or-service-key
```
*(Note: The system automatically includes a persistent local seed storage engine, so the application runs immediately out of the box even before adding your keys).*

---

## 🚀 How to Run Locally

### 1. Start the Backend API (Port 5000)
```bash
cd backend
npm install
node src/server.js
```

### 2. Start the Frontend Application (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

Open your browser at **`http://localhost:3000`**.

### 🔑 Authentication & User Management
- **Supabase Authentication**: Accounts are authenticated securely through Supabase Auth with JWT session tokens and user metadata.
- **Redux State Storage**: Tokens and user profiles are stored in the client-side Redux store (`authSlice`) and persisted in `localStorage` for instant session recovery without unnecessary network roundtrips.
- **Registration**: Create new shop admin and staff accounts directly through the **Create Account** tab on the login screen.
