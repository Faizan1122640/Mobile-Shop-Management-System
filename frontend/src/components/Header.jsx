import React, { useState } from 'react';
import { Calendar, ChevronDown, LogOut, Plus, ShoppingCart, Wrench, Shield, Menu } from 'lucide-react';

export default function Header({
  user,
  onLogout,
  onOpenPos,
  onOpenOldPhone,
  onOpenRepairs,
  onOpenSettings,
  isSidebarCollapsed,
  onToggleSidebar
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="top-header">
      {/* Breadcrumb + Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          className="header-toggle-sidebar-btn"
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <Menu size={18} />
        </button>
        <div className="header-breadcrumbs">
          <span className="breadcrumb-tiny">OVERVIEW</span>
          <h1 className="breadcrumb-title">Dashboard</h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="header-right">
        {/* Quick Action POS button */}
        <button className="btn-primary-teal" onClick={onOpenPos}>
          <ShoppingCart size={16} />
          <span>New Sale (POS)</span>
        </button>

        {/* Live Date Pill */}
        <div className="header-date-pill">
          <Calendar size={15} color="#64748b" />
          <span>
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </div>

        {/* User Profile dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="header-user-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="user-avatar-badge">
              {user?.avatar_initial || 'A'}
            </div>
            <div className="user-info-text">
              <div className="user-role-title">{user?.name || 'Administrator'}</div>
              <div className="user-role-sub">{user?.role || 'Administrator'}</div>
            </div>
            <ChevronDown size={14} color="#94a3b8" />
          </button>

          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                top: '115%',
                right: 0,
                width: 200,
                background: '#ffffff',
                borderRadius: 12,
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                padding: '0.5rem',
                zIndex: 60
              }}
            >
              <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.email || 'User Account'}</div>
                <div style={{ fontSize: '0.75rem', color: '#00838f' }}>{user?.shop_name || 'Chaudhry Mobile Shop'}</div>
              </div>
              <button
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  border: 'none',
                  background: 'none',
                  fontSize: '0.82rem',
                  color: '#475569',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
                onClick={onOpenSettings}
              >
                <Shield size={15} />
                <span>Supabase & Settings</span>
              </button>
              <button
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  border: 'none',
                  background: 'none',
                  fontSize: '0.82rem',
                  color: '#ef4444',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
                onClick={onLogout}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
