import React from 'react';
import Icon from '../Icon';

export default function AdminSidebar({
  activeSection,
  onSelectSection,
  collapsed,
  mobileOpen = false,
  onToggleCollapse,
  counts = {},
  onLogout,
}) {
  const navSections = [
    {
      title: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'home' },
        { id: 'orders', label: 'Orders', icon: 'orders', badge: counts.activeOrders || 0, badgeColor: 'var(--accent)' },
        { id: 'bookings', label: 'Table Bookings', icon: 'calendar', badge: counts.activeBookings || 0, badgeColor: 'var(--success)' },
        { id: 'booking-history', label: 'Booking History', icon: 'clock' },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'restaurants', label: 'Restaurants', icon: 'restaurant', badge: counts.restaurants || 0 },
        { id: 'food', label: 'Food / Menu', icon: 'food', badge: counts.foods || 0 },
        { id: 'chefs', label: 'Chefs', icon: 'chef', badge: counts.chefs || 0 },
        { id: 'tables', label: 'Tables', icon: 'table', badge: counts.tables || 0 },
        { id: 'delivery', label: 'Delivery Partners', icon: 'delivery', badge: counts.riders || 0 },
        { id: 'customers', label: 'Customers', icon: 'users', badge: counts.customers || 0 },
      ],
    },
    {
      title: 'CUSTOMER EXPERIENCE',
      items: [
        { id: 'reviews', label: 'Reviews & Ratings', icon: 'reviews' },
        { id: 'issues', label: 'Customer Issues', icon: 'issues', badge: counts.openIssues || 0, badgeColor: 'var(--danger)' },
        { id: 'vouchers', label: 'Offers & Vouchers', icon: 'offers' },
        { id: 'notifications', label: 'Notifications', icon: 'notifications', badge: counts.notifications || 0, badgeColor: 'var(--danger)' },
        { id: 'recently-accessed', label: 'Recently Accessed', icon: 'clock' },
      ],
    },
    {
      title: 'FINANCE',
      items: [
        { id: 'payments', label: 'Payments', icon: 'credit-card' },
        { id: 'refunds', label: 'Refunds', icon: 'refund', badge: counts.refunds || 0, badgeColor: '#fb8500' },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        { id: 'analytics', label: 'Analytics', icon: 'analytics' },
        { id: 'reports', label: 'Reports', icon: 'reports' },
        { id: 'admin-insights', label: 'Admin Insights', icon: 'sparkles' },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'profile', label: 'Profile', icon: 'profile' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
        { id: 'activity-log', label: 'Activity Log', icon: 'pulse' },
      ],
    },
  ];

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-brand" onClick={() => onSelectSection('dashboard')}>
          <div className="admin-brand-icon">
            <Icon name="admin" size={22} color="#ffffff" />
          </div>
          {!collapsed && (
            <div className="admin-brand-text">
              <span className="brand-name">ZESTRO</span>
              <span className="brand-badge">CONTROL CENTER</span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="admin-sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={16} />
        </button>
      </div>

      <nav className="admin-sidebar-nav" tabIndex={0} aria-label="Admin Navigation">
        {navSections.map((sec, sIdx) => (
          <div key={sec.title || sIdx} className="admin-nav-group">
            {!collapsed && <div className="admin-nav-group-title">{sec.title}</div>}
            <ul className="admin-nav-list">
              {sec.items.map(item => {
                const isActive = activeSection === item.id || 
                  (item.id === 'table-bookings' && activeSection === 'bookings') || 
                  (item.id === 'bookings' && activeSection === 'table-bookings') ||
                  (item.id === 'food' && activeSection === 'menu') ||
                  (item.id === 'activity-log' && activeSection === 'activity');
                return (
                  <li key={item.id} className="admin-nav-item">
                    <button
                      type="button"
                      className={`admin-nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => onSelectSection(item.id)}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="admin-nav-icon">
                        <Icon name={item.icon} size={18} />
                      </span>
                      {!collapsed && (
                        <>
                          <span className="admin-nav-label">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span
                              className="admin-nav-badge"
                              style={{
                                background: item.badgeColor || 'var(--bg-elevated)',
                                color: item.badgeColor ? '#ffffff' : 'var(--text-muted)',
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="admin-nav-group logout-group" style={{ marginTop: 'auto', paddingTop: 16 }}>
          <ul className="admin-nav-list">
            <li className="admin-nav-item">
              <button
                type="button"
                className="admin-nav-link logout-link"
                onClick={onLogout}
                title={collapsed ? 'Logout' : undefined}
              >
                <span className="admin-nav-icon">
                  <Icon name="logout" size={18} color="var(--danger)" />
                </span>
                {!collapsed && <span className="admin-nav-label" style={{ color: 'var(--danger)' }}>Logout</span>}
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
