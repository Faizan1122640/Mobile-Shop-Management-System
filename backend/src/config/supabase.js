import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { AppError } from '../errors/AppError.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Critical Error: SUPABASE_URL or SUPABASE_ANON_KEY is missing in backend/.env');
}

/**
 * Base Supabase client instance (Anon)
 */
export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false
      }
    })
  : null;

/**
 * Utility helper to ensure database client is active.
 */
export const getSupabaseClient = (tokenOrReq = null) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new AppError(
      'Database connection failed: Supabase credentials are missing or invalid in backend/.env',
      500
    );
  }

  return supabase;
};

export default supabase;

