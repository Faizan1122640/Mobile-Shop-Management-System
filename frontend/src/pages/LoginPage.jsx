import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, CheckCircle2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUserThunk, clearAuthError } from '../store/slices/authSlice';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Clear errors on mount
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Navigate if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(loginUserThunk({ email: email.trim(), password }));
    if (loginUserThunk.fulfilled.match(resultAction)) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="login-container">
      {/* Left Hero Split */}
      <div className="login-hero">
        <div className="hero-pill-badge">
          <Smartphone size={14} />
          <span>Chaudhry Mobile Shop</span>
        </div>

        <h1 className="hero-title">
          Run your mobile shop with clarity.
        </h1>

        <p className="hero-subtitle">
          Inventory, sales, customers, and repairs — manage everything from one modern dashboard connected to live Supabase cloud.
        </p>

        <div className="hero-check-list">
          <div className="hero-check-item">
            <div className="hero-check-icon">
              <CheckCircle2 size={19} />
            </div>
            <span>Fast billing & POS checkout</span>
          </div>

          <div className="hero-check-item">
            <div className="hero-check-icon">
              <CheckCircle2 size={19} />
            </div>
            <span>Dual IMEI & Legal CNIC records</span>
          </div>

          <div className="hero-check-item">
            <div className="hero-check-icon">
              <CheckCircle2 size={19} />
            </div>
            <span>Supabase cloud database integration</span>
          </div>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="login-form-area">
        <div className="login-card">
          <div className="login-badge-avatar">
            CMS
          </div>

          <h2 className="login-card-title">Chaudhry Mobile Shop</h2>
          <p className="login-card-subtitle">
            Sign in to access your shop dashboard
          </p>

          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#b91c1c',
              padding: '0.65rem 0.85rem',
              borderRadius: 8,
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
              lineHeight: 1.4
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div className="input-with-icon">
                <Mail className="input-icon" />
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: '2.8rem' }}
                />
                <button
                  type="button"
                  className="input-trailing-icon"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: '1.5rem' }}>
              <span>
                {loading ? 'Signing in...' : 'Sign In'}
              </span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

