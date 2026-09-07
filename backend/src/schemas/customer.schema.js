import { z } from 'zod';

/**
 * Zod validation schemas for CRM Customer routes
 */
export const createCustomerSchema = z.object({
  name: z
    .string({ required_error: 'Customer name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .max(20, 'Phone number cannot exceed 20 characters'),
  address: z
    .string()
    .trim()
    .max(255, 'Address cannot exceed 255 characters')
    .optional()
    .nullable(),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .optional()
    .nullable()
});

export const updateCustomerSchema = createCustomerSchema.partial();
