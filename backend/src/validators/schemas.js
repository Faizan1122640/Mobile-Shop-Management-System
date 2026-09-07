import { z } from 'zod';

// Phone number: exactly 11 digits numeric (e.g., 03001234567)
export const phoneSchema = z.string()
  .trim()
  .regex(/^\d{11}$/, { message: 'Phone number must be exactly 11 numeric digits (e.g. 03001234567)' });

// Optional phone number (if provided, must be 11 digits)
export const optionalPhoneSchema = z.string()
  .trim()
  .optional()
  .refine(val => !val || /^\d{11}$/.test(val), {
    message: 'Phone number must be exactly 11 numeric digits'
  });

// IMEI: exactly 15 digits numeric
export const imeiSchema = z.string()
  .trim()
  .regex(/^\d{15}$/, { message: 'IMEI must be exactly 15 numeric digits' });

// Optional IMEI 2 (for dual SIM devices)
export const optionalImeiSchema = z.string()
  .trim()
  .optional()
  .refine(val => !val || /^\d{15}$/.test(val), {
    message: 'IMEI 2 must be exactly 15 numeric digits'
  });

// CNIC: exactly 13 digits (with or without dashes)
export const cnicSchema = z.string()
  .trim()
  .refine(val => {
    const digitsOnly = val.replace(/\D/g, '');
    return digitsOnly.length === 13;
  }, { message: 'CNIC must be exactly 13 digits (e.g. 35201-1234567-1)' });

// Customer Schema
export const customerSchema = z.object({
  name: z.string().trim().min(2, { message: 'Customer name must be at least 2 characters' }),
  phone: phoneSchema,
  address: z.string().trim().optional().nullable()
});

// Supplier Schema
export const supplierSchema = z.object({
  company_name: z.string().trim().min(2, { message: 'Company name must be at least 2 characters' }),
  contact_person: z.string().trim().optional().nullable(),
  phone: phoneSchema
});

// Product Schema
export const productSchema = z.object({
  category_id: z.union([z.number(), z.string()]),
  supplier_id: z.union([z.number(), z.string()]).optional().nullable(),
  brand: z.string().trim().min(1, { message: 'Brand is required' }),
  model: z.string().trim().min(1, { message: 'Model is required' }),
  imei_1: optionalImeiSchema,
  imei_2: optionalImeiSchema,
  imei_barcode: z.string().trim().min(1, { message: 'IMEI or Barcode is required' }),
  purchase_price: z.coerce.number().positive({ message: 'Purchase price must be greater than 0' }),
  selling_price: z.coerce.number().positive({ message: 'Selling price must be greater than 0' }),
  stock_quantity: z.coerce.number().min(0, { message: 'Stock quantity cannot be negative' }),
  status: z.enum(['In Stock', 'Sold', 'Out of Stock']).default('In Stock')
});

// Old Phone Purchase Schema
export const oldPhonePurchaseSchema = z.object({
  seller_name: z.string().trim().min(2, { message: 'Seller name must be at least 2 characters' }),
  phone: phoneSchema,
  cnic_number: cnicSchema,
  address: z.string().trim().optional().nullable(),
  brand: z.string().trim().min(1, { message: 'Phone brand is required' }),
  model: z.string().trim().min(1, { message: 'Phone model is required' }),
  imei_1: imeiSchema,
  imei_2: optionalImeiSchema,
  purchase_price: z.coerce.number().positive({ message: 'Purchase price must be greater than 0' }),
  selling_price: z.coerce.number().positive({ message: 'Selling price must be greater than 0' }),
  cnic_front_pic: z.string().optional().nullable(),
  cnic_back_pic: z.string().optional().nullable(),
  person_pic: z.string().optional().nullable()
});

// Repair Schema
export const repairSchema = z.object({
  device_model: z.string().trim().min(1, { message: 'Device model is required' }),
  imei: optionalImeiSchema,
  issue: z.string().trim().min(2, { message: 'Issue description is required' }),
  cost: z.coerce.number().min(0, { message: 'Cost cannot be negative' }).default(0),
  status: z.enum(['Pending', 'In Process', 'Repaired', 'Delivered']).default('Pending'),
  customer_id: z.union([z.number(), z.string()]).optional().nullable(),
  customer_name: z.string().trim().optional().nullable(),
  customer_phone: optionalPhoneSchema
});

// Expense Schema
export const expenseSchema = z.object({
  title: z.string().trim().min(2, { message: 'Expense title must be at least 2 characters' }),
  category: z.string().trim().default('General'),
  amount: z.coerce.number().positive({ message: 'Amount must be greater than 0' }),
  payment_method: z.string().default('Cash'),
  notes: z.string().trim().optional().nullable()
});
