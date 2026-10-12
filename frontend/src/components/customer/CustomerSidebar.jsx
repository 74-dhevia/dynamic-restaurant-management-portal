import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../Icon';

export default function CustomerSidebar({ collapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const currentUser = useSelector(s => s.auth?.currentUser);
  const cartCount = useSelector(s => (s.cart?.items || []).reduce((a, i) => a + (i.qty || 1), 0));
  const unreadCount = useSelector(s => (s.notification?.items || []).filter(n => !n.read).length);
  const activeOrdersCount = useSelector(s => (s.order?.orders || []).filter(o => 
    o.status !== 'Delivered' && o.status !== 'Cancelled'
  ).length);
  const activeBookingsCount = useSelector(s => (s.booking?.bookings || []).filter(b => 
    b.status !== 'Cancelled' && b.status !== 'Completed'
  ).length);
  const wishlistCount = useSelector(s => (s.wishlist?.items || []).length);
  const dinePoints = currentUser?.dinePoints ?? 100;
  const voucherCount = useSelector(s => (s.voucher?.vouchers || []).length);

  const handleLogout = () => {
    dispatch(logout());
    if (showToast) showToast('Signed out successfully. See you soon!', 'info');
    navigate('/', { replace: true });
    if (onCloseMobile) onCloseMobile();
  };

  const navSections = [
    {
      title: 'MAIN',
      items: [
        {
          id: 'dashboard',
          label: 'Home / Dashboard',
          to: '/customer',
          exact: true,
          icon: 'home',
        },
        {
          id: 'restaurants',
          label: 'Explore Restaurants',
          to: '/customer/restaurants',
          icon: 'restaurant',
        },
        {
          id: 'menu',
          label: 'Food & Menu',
          to: '/customer/menu',
          icon: 'food',
        },
      ],
    },
    {
      title: 'MY ACTIVITY',
      items: [
        {
          id: 'orders',
          label: 'My Orders',
          to: '/customer/orders',
          icon: 'orders',
          badge: activeOrdersCount > 0 ? activeOrdersCount : null,
          badgeColor: 'var(--accent)',
        },
        {
          id: 'bookings',
          label: 'My Bookings',
          to: '/customer/bookings',
          icon: 'calendar',
          badge: activeBookingsCount > 0 ? activeBookingsCount : null,
          badgeColor: 'var(--success)',
        },
        {
          id: 'cart',
          label: 'Cart',
          to: '/customer/cart',
          icon: 'cart',
          badge: cartCount > 0 ? cartCount : null,
          badgeColor: 'var(--accent)',
        },
        {
          id: 'wishlist',
          label: 'Wishlist',
          to: '/customer/wishlist',
          icon: 'wishlist',
          badge: wishlistCount > 0 ? wishlistCount : null,
        },
        {
          id: 'recently-viewed',
          label: 'Recently Viewed',
          to: '/customer/recently-viewed',
          icon: 'clock',
        },
      ],
    },
    {
      title: 'REWARDS',
      items: [
        {
          id: 'rewards',
          label: 'Rewards',
          to: '/customer/rewards',
          icon: 'rewards',
          badge: `${dinePoints} pts`,
          badgeColor: 'linear-gradient(135deg, #e8542a, #ffb703)',
        },
        {
          id: 'offers',
          label: 'Offers & Vouchers',
          to: '/customer/offers',
          icon: 'offers',
          badge: voucherCount > 0 ? `${voucherCount}` : null,
        },
      ],
    },
    {
      title: 'SERVICES',
      items: [
        {
          id: 'assistant',
          label: 'AI Dining Assistant',
          to: '/customer/assistant',
          icon: 'sparkles',
          badge: 'AI',
          badgeColor: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        },
        {
          id: 'notifications',
          label: 'Notifications',
          to: '/customer/notifications',
          icon: 'notifications',
          badge: unreadCount > 0 ? unreadCount : null,
          badgeColor: 'var(--danger)',
        },
        {
          id: 'addresses',
          label: 'Addresses',
          to: '/customer/addresses',
          icon: 'location',
        },
        {
          id: 'reviews',
          label: 'Reviews & Ratings',
          to: '/customer/reviews',
          icon: 'reviews',
        },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        {
          id: 'profile',
          label: 'Profile',
          to: '/customer/profile',
          icon: 'profile',
        },
        {
          id: 'settings',
          label: 'Settings',
          to: '/customer/settings',
          icon: 'settings',
        },
        {
          id: 'help',
          label: 'Help & Support',
          to: '/customer/help',
          icon: 'support',
        },
      ],
    },
  ];

  const isItemActive = (item) => {
    if (item.exact) {
      return location.pathname === item.to || location.pathname === `${item.to}/dashboard`;
    }
    return location.pathname.startsWith(item.to);
  };

  const displayName = currentUser?.fullName || currentUser?.name || 'Customer';
  const tier = currentUser?.tier || 'Bronze';
  const avatar = currentUser?.avatar;

  return (
    <aside
      className={`customer-sidebar ${collapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
      aria-label="Customer Navigation Sidebar"
    >
      {/* Sidebar Header */}
      <div className="customer-sidebar-header">
        <NavLink
          to="/customer"
          className="customer-sidebar-brand"
          onClick={onCloseMobile}
          title="Customer Portal"
        >
          <div className="customer-brand-icon">
            <Icon name="restaurant" size={20} color="#ffffff" />
          </div>
          {!collapsed && (
            <div className="customer-brand-text">
              <span className="brand-name">ZESTRO</span>
              <span className="brand-badge">CUSTOMER PORTAL</span>
            </div>
          )}
        </NavLink>

        <button
          type="button"
          className="customer-sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={16} />
        </button>
      </div>

      {/* Customer Profile Card */}
      <div className={`customer-profile-card ${collapsed ? 'compact' : ''}`}>
        <div className="customer-profile-avatar-wrap">
          {avatar && avatar.startsWith('http') ? (
            <img src={avatar} alt={displayName} className="customer-profile-avatar" />
          ) : (
            <div className="customer-profile-avatar-fallback">
              <Icon name="profile" size={20} color="var(--accent)" />
            </div>
          )}
          <span className="customer-online-indicator" title="Active" />
        </div>

        {!collapsed && (
          <div className="customer-profile-details">
            <div className="customer-profile-name" title={displayName}>
              {displayName}
            </div>
            <div className="customer-profile-meta">
              <span className="customer-tier-pill">{tier}</span>
              <span className="customer-points-pill">
                <Icon name="rewards" size={11} color="var(--accent)" />
                {dinePoints} pts
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="customer-sidebar-nav" tabIndex={0} aria-label="Customer Portal Navigation">
        {navSections.map((sec, sIdx) => (
          <div key={sec.title || sIdx} className="customer-nav-group">
            {!collapsed && <div className="customer-nav-group-title">{sec.title}</div>}
            <ul className="customer-nav-list">
              {sec.items.map(item => {
                const active = isItemActive(item);
                return (
                  <li key={item.id} className="customer-nav-item">
                    <NavLink
                      to={item.to}
                      className={`customer-nav-link ${active ? 'active' : ''}`}
                      onClick={onCloseMobile}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span className="customer-nav-icon">
                        <Icon name={item.icon} size={18} />
                      </span>
                      {!collapsed && (
                        <>
                          <span className="customer-nav-label">{item.label}</span>
                          {item.badge !== undefined && item.badge !== null && (
                            <span
                              className="customer-nav-badge"
                              style={{
                                background: item.badgeColor || 'var(--bg)',
                                color: item.badgeColor ? '#ffffff' : 'var(--text-muted)',
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Logout Action in sidebar */}
        <div className="customer-nav-group customer-logout-group">
          <ul className="customer-nav-list">
            <li className="customer-nav-item">
              <button
                type="button"
                className="customer-nav-link customer-logout-btn"
                onClick={handleLogout}
                title={collapsed ? 'Logout' : undefined}
              >
                <span className="customer-nav-icon">
                  <Icon name="logout" size={18} color="var(--danger)" />
                </span>
                {!collapsed && (
                  <span className="customer-nav-label" style={{ color: 'var(--danger)' }}>
                    Logout
                  </span>
                )}
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
