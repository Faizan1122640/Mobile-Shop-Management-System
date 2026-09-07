import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import apiRouter from './routes/api.js';
import customerRouter from './routes/customer.routes.js';
import { errorHandler } from './errors/errorHandler.js';
import { AppError } from './errors/AppError.js';
import { getSupabaseClient } from './config/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Disable ETag to guarantee 200 OK responses with full JSON payloads
app.set('etag', false);

// 1. HTTP Request Logger (Morgan)
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 2. CORS Setup for cross-origin requests
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', '*'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
  credentials: true
}));

// 3. Body Parsers, Cache-Control & Request Scoped Supabase Client
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  req.supabase = getSupabaseClient(req);
  next();
});

// 4. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    shop: 'Chaudhry Mobile Shop',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 5. CRM Module Routes (Zod-validated)
app.use('/api/crm/customers', customerRouter);

// 6. Existing Mobile Shop Management Routes
app.use('/api', apiRouter);

// 7. Unhandled Route Catch-All (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404));
});

// 8. Centralized Global Error Handler Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Chaudhry Mobile Shop Backend running on port ${PORT}`);
  console.log(`📊 API endpoints available at /api`);
  console.log(`👥 CRM Customer endpoints available at /api/crm/customers`);
});


export default app;

