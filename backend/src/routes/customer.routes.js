import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer
} from '../controllers/customer.controller.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createCustomerSchema } from '../schemas/customer.schema.js';

const router = express.Router();

/**
 * CRM Customer Routes
 * Validated with Zod schemas and wrapped in async error catchers
 */
router
  .route('/')
  .get(getCustomers)
  .post(validateRequest(createCustomerSchema), createCustomer);

router
  .route('/:id')
  .get(getCustomerById);

export default router;
