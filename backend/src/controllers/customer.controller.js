import { catchAsync } from '../errors/catchAsync.js';
import { AppError } from '../errors/AppError.js';
import { getSupabaseClient } from '../config/supabase.js';

/**
 * Pure Supabase Controller for CRM Customer routes
 */

// @desc    Get all CRM customers
// @route   GET /api/crm/customers
export const getCustomers = catchAsync(async (req, res, next) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('registered_at', { ascending: false });

  if (error) {
    return next(new AppError(`Database query failed: ${error.message}`, 500));
  }

  return res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @desc    Get single customer by ID
// @route   GET /api/crm/customers/:id
export const getCustomerById = catchAsync(async (req, res, next) => {
  const customerId = parseInt(req.params.id, 10);

  if (isNaN(customerId)) {
    return next(new AppError('Invalid customer ID supplied. Must be an integer', 400));
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('customer_id', customerId)
    .single();

  if (error || !data) {
    return next(new AppError(`Customer with ID ${customerId} not found`, 404));
  }

  return res.status(200).json({
    success: true,
    data
  });
});

// @desc    Create new customer (Zod-validated)
// @route   POST /api/crm/customers
export const createCustomer = catchAsync(async (req, res, next) => {
  const { name, phone, address, email } = req.body;

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

  if (error) {
    return next(new AppError(`Database insertion failed: ${error.message}`, 400));
  }

  return res.status(201).json({
    success: true,
    message: 'Customer registered successfully in Supabase',
    data
  });
});
