import { getSupabaseClient } from '../config/supabase.js';
import { AppError } from '../errors/AppError.js';
import { catchAsync } from '../errors/catchAsync.js';

/**
 * Authentication Middleware:
 * Validates Supabase JWT Access Token from the Authorization header.
 * Attaches the authenticated Supabase user to req.user.
 */
export const requireAuth = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Please provide a valid Bearer token.', 401));
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === 'undefined' || token === 'null') {
    return next(new AppError('Invalid or expired session token. Please log in again.', 401));
  }

  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return next(new AppError('Invalid or expired session token. Please log in again.', 401));
  }

  // Attach authenticated user profile to the request
  req.user = {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    role: user.user_metadata?.role || 'Administrator',
    shop_name: user.user_metadata?.shop_name || 'Chaudhry Mobile Shop',
    avatar_initial: (user.user_metadata?.name || user.email || 'A')[0].toUpperCase(),
    raw: user
  };

  next();
});

/**
 * Optional Auth Middleware:
 * Attaches req.user if a valid token is provided, but allows the request to continue if not.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token !== 'undefined' && token !== 'null') {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            role: user.user_metadata?.role || 'Administrator',
            shop_name: user.user_metadata?.shop_name || 'Chaudhry Mobile Shop',
            avatar_initial: (user.user_metadata?.name || user.email || 'A')[0].toUpperCase()
          };
        }
      }
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next();
};
