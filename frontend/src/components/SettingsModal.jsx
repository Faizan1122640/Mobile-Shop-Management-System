import React, { useState, useEffect } from 'react';
import { X, Database, ShieldCheck, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { fetchSettings, updateSettings } from '../services/api';

export default function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    shop_name: 'Chaudhry Mobile Shop',
    tagline: 'Run your mobile shop with clarity.',
    currency: 'Rs',
    phone: '0300-1234567',
    address: 'Shop # 14, Chaudhry Plaza, Mobile Market',
    supabase_url: '',
    supabase_anon_key: ''
  });
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings().then(data => {
        if (data) setSettings(prev => ({ ...prev, ...data }));
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Database size={20} color="#00838f" />
            <h3 className="modal-title">Settings & Database Configuration</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            {/* Supabase Status Banner */}
            <div
              style={{
                background: settings.hasSupabaseEnv ? '#e0f2f1' : '#f8fafc',
                border: `1px solid ${settings.hasSupabaseEnv ? '#80cbc4' : '#cbd5e1'}`,
                borderRadius: 12,
                padding: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}
            >
              {settings.hasSupabaseEnv ? (
                <CheckCircle2 size={24} color="#00897b" />
              ) : (
                <ShieldCheck size={24} color="#00838f" />
              )}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                  {settings.hasSupabaseEnv ? 'Supabase Connected' : 'Supabase Ready (Local Active Mode)'}
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem', lineHeight: 1.4 }}>
                  {settings.hasSupabaseEnv
                    ? 'Your application is connected to your live Supabase cloud database instance.'
                    : 'The application is running with active persistent seed storage. All 8 schema tables are fully configured in backend/schema.sql ready for Supabase.'}
                </p>
              </div>
            </div>

            {/* Shop Details */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: '0.5rem' }}>
              Shop Details & Branding
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Shop Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.shop_name}
                  onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
                  style={{ paddingLeft: '0.75rem' }}
                />
              </div>
              <div>
                <label className="form-label">Currency Symbol</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  style={{ paddingLeft: '0.75rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
              <div>
                <label className="form-label">Shop Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  style={{ paddingLeft: '0.75rem' }}
                />
              </div>
              <div>
                <label className="form-label">Shop Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  style={{ paddingLeft: '0.75rem' }}
                />
              </div>
            </div>

            {/* Supabase Keys Input */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: '1rem' }}>
              Supabase Cloud Connection (.env)
            </h4>
            <div>
              <label className="form-label">Supabase Project URL</label>
              <input
                type="text"
                placeholder="https://your-project-id.supabase.co"
                className="form-input"
                value={settings.supabase_url || ''}
                onChange={(e) => setSettings({ ...settings, supabase_url: e.target.value })}
                style={{ paddingLeft: '0.75rem' }}
              />
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <label className="form-label">Supabase Anon Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="form-input"
                value={settings.supabase_anon_key || ''}
                onChange={(e) => setSettings({ ...settings, supabase_anon_key: e.target.value })}
                style={{ paddingLeft: '0.75rem' }}
              />
            </div>
          </div>

          <div className="modal-footer">
            {saved && (
              <span style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: 600, marginRight: 'auto' }}>
                ✓ Settings saved successfully
              </span>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn-primary-teal" disabled={loading}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
