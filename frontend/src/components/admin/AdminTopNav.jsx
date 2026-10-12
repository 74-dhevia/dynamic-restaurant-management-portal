import React, { useState, useRef, useEffect } from 'react';
import Icon from '../Icon';
import SafeImage from '../SafeImage';

export default function AdminTopNav({
  adminUser,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onNavigate,
  onLogout,
  onSelectSearchResult,
  searchIndex = {},
  onAddTable,
  onAddPartner,
  onToggleSidebar,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const searchRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search results across all 6 groups
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();

    const orders = (searchIndex.orders || [])
      .filter(o => o.id.toLowerCase().includes(q) || (o.restaurantName || '').toLowerCase().includes(q) || (o.userEmail || '').toLowerCase().includes(q))
      .slice(0, 3);

    const rawOrders = searchIndex.orders || [];
    const rawBookings = searchIndex.bookings || [];

    const customers = (searchIndex.customers || [])
      .filter(c => (c.fullName || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.phone || '').includes(q))
      .slice(0, 3)
      .map(c => {
        const orderCount = rawOrders.filter(o =>
          (c.id && o.userId === c.id) ||
          (c.email && (o.userEmail?.toLowerCase() === c.email.toLowerCase() || o.customerEmail?.toLowerCase() === c.email.toLowerCase())) ||
          (c.altEmail && (o.userEmail?.toLowerCase() === c.altEmail.toLowerCase() || o.customerEmail?.toLowerCase() === c.altEmail.toLowerCase()))
        ).length;
        const bookingCount = rawBookings.filter(b =>
          (c.id && b.userId === c.id) ||
          (c.email && (b.userEmail?.toLowerCase() === c.email.toLowerCase() || b.customerEmail?.toLowerCase() === c.email.toLowerCase())) ||
          (c.altEmail && (b.userEmail?.toLowerCase() === c.altEmail.toLowerCase() || b.customerEmail?.toLowerCase() === c.altEmail.toLowerCase()))
        ).length;
        return { ...c, ordersCount: orderCount, bookingsCount: bookingCount };
      });

    const restaurants = (searchIndex.restaurants || [])
      .filter(r => (r.name || '').toLowerCase().includes(q) || (r.area || '').toLowerCase().includes(q) || (r.cuisine || '').toLowerCase().includes(q))
      .slice(0, 3);

    const food = (searchIndex.food || [])
      .filter(f => (f.name || '').toLowerCase().includes(q) || (f.category || '').toLowerCase().includes(q))
      .slice(0, 4);

    const bookings = (searchIndex.bookings || [])
      .filter(b => b.id.toLowerCase().includes(q) || (b.restaurantName || '').toLowerCase().includes(q) || (b.userEmail || '').toLowerCase().includes(q))
      .slice(0, 3);

    const chefs = (searchIndex.chefs || [])
      .filter(ch => (ch.name || '').toLowerCase().includes(q) || (ch.specialization || '').toLowerCase().includes(q) || (ch.restaurantName || '').toLowerCase().includes(q))
      .slice(0, 3);

    const tables = (searchIndex.tables || [])
      .filter(t => (t.label || '').toLowerCase().includes(q) || (t.seatingType || '').toLowerCase().includes(q) || (t.status || '').toLowerCase().includes(q))
      .slice(0, 3);

    const vouchers = (searchIndex.vouchers || [])
      .filter(v => (v.code || '').toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q))
      .slice(0, 3);

    const totalCount = orders.length + customers.length + restaurants.length + food.length + bookings.length + chefs.length + tables.length + vouchers.length;
    return { orders, customers, restaurants, food, bookings, chefs, tables, vouchers, totalCount };
  }, [searchQuery, searchIndex]);

  const handleItemClick = (type, item) => {
    setSearchOpen(false);
    setSearchQuery('');
    if (onSelectSearchResult) {
      onSelectSearchResult(type, item);
    }
  };

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button
          type="button"
          className="admin-mobile-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle Admin Navigation Menu"
          title="Toggle Navigation Menu"
        >
          <Icon name="menu" size={20} color="var(--text)" />
        </button>

        <div className="admin-topbar-brand-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginRight: 16, whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: 900, letterSpacing: '0.5px', color: 'var(--accent)', fontSize: 16 }}>ZESTRO ADMIN</span>
        </div>

        {/* Global Search Bar with Grouped Autocomplete */}
        <div className="admin-global-search" ref={searchRef}>
          <div className="admin-search-input-wrap">
            <span className="search-icon">
              <Icon name="search" size={17} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search orders, customers, food..."
              className="admin-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>

          {/* Grouped Autocomplete Dropdown */}
          {searchOpen && searchResults && (
            <div className="admin-search-results-dropdown">
              {searchResults.totalCount === 0 ? (
                <div className="search-no-results">
                  <Icon name="search" size={20} color="var(--text-muted)" />
                  <p>No matches found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="search-groups-container">
                  {/* 1. Orders */}
                  {searchResults.orders.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-title">
                        <Icon name="orders" size={14} /> Orders ({searchResults.orders.length})
                      </div>
                      {searchResults.orders.map(o => (
                        <div
                          key={o.id}
                          className="search-result-row"
                          onClick={() => handleItemClick('order', o)}
                        >
                          <span className="row-title">{o.id}</span>
                          <span className="row-sub">{o.restaurantName} • ₹{o.grandTotal}</span>
                          <span className="row-tag">{o.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 2. Customers (Requirement 24: Customer 360 top search) */}
                  {searchResults.customers.length > 0 && (
                    <div className="search-group customer-search-group">
                      <div className="search-group-title">
                        <Icon name="users" size={14} /> Customers ({searchResults.customers.length})
                      </div>
                      {searchResults.customers.map(c => (
                        <div
                          key={c.id}
                          className="search-result-row customer-search-card"
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 12px',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleItemClick('customer', c)}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.4px' }}>Customer</span>
                              <strong style={{ fontSize: 13.5 }}>{c.fullName}</strong>
                            </div>
                            <span className="row-sub" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</span>
                            <div style={{ fontSize: 11.5, color: 'var(--text)', marginTop: 4, display: 'flex', gap: 12 }}>
                              <span>Orders: <strong>{c.ordersCount}</strong></span>
                              <span>Bookings: <strong>{c.bookingsCount}</strong></span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            style={{ borderRadius: 6, fontWeight: 700, padding: '5px 12px', fontSize: 11.5 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick('customer', c);
                            }}
                          >
                            View Customer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 3. Restaurants */}
                  {searchResults.restaurants.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-title">
                        <Icon name="restaurant" size={14} /> Restaurants ({searchResults.restaurants.length})
                      </div>
                      {searchResults.restaurants.map(r => (
                        <div
                          key={r.id}
                          className="search-result-row"
                          onClick={() => handleItemClick('restaurant', r)}
                        >
                          <span className="row-title">{r.name}</span>
                          <span className="row-sub">{r.area} • ⭐ {r.rating}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 4. Food */}
                  {searchResults.food.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-title">
                        <Icon name="food" size={14} /> Food Items ({searchResults.food.length})
                      </div>
                      {searchResults.food.map(f => (
                        <div
                          key={f.id}
                          className="search-result-row"
                          onClick={() => handleItemClick('food', f)}
                        >
                          <span className="row-title">{f.name}</span>
                          <span className="row-sub">{f.restaurantName} • ₹{f.price}</span>
                          <span className="row-tag">{f.veg ? 'Veg' : 'Non-Veg'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 5. Bookings */}
                  {searchResults.bookings.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-title">
                        <Icon name="calendar" size={14} /> Table Bookings ({searchResults.bookings.length})
                      </div>
                      {searchResults.bookings.map(b => (
                        <div
                          key={b.id}
                          className="search-result-row"
                          onClick={() => handleItemClick('booking', b)}
                        >
                          <span className="row-title">{b.id}</span>
                          <span className="row-sub">{b.restaurantName} • {b.guests} Guests</span>
                          <span className="row-tag">{b.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 6. Chefs */}
                  {searchResults.chefs.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-title">
                        <Icon name="chef" size={14} /> Chefs ({searchResults.chefs.length})
                      </div>
                      {searchResults.chefs.map(ch => (
                        <div
                          key={ch.id}
                          className="search-result-row"
                          onClick={() => handleItemClick('chef', ch)}
                        >
                          <span className="row-title">{ch.name}</span>
                          <span className="row-sub">{ch.restaurantName} • {ch.specialization}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 7. Tables */}
                  {searchResults.tables && searchResults.tables.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-title">
                        <Icon name="table" size={14} /> Floor Tables ({searchResults.tables.length})
                      </div>
                      {searchResults.tables.map(t => (
                        <div
                          key={t.id}
                          className="search-result-row"
                          onClick={() => handleItemClick('table', t)}
                        >
                          <span className="row-title">{t.label}</span>
                          <span className="row-sub">{t.seatingType} • {t.capacity} Guests</span>
                          <span className="row-tag">{t.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 8. Vouchers */}
                  {searchResults.vouchers && searchResults.vouchers.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-title">
                        <Icon name="offers" size={14} /> Vouchers &amp; Offers ({searchResults.vouchers.length})
                      </div>
                      {searchResults.vouchers.map(v => (
                        <div
                          key={v.id}
                          className="search-result-row"
                          onClick={() => handleItemClick('voucher', v)}
                        >
                          <span className="row-title">{v.code}</span>
                          <span className="row-sub">{v.description || 'Offer discount'}</span>
                          <span className="row-tag">{v.discountPercent || v.discount || 15}% OFF</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="admin-topbar-right">
        {/* Quick Add Table Action Button */}
        {onAddTable && (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={onAddTable}
            title="Add a new dining table station"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700,
              fontSize: 12.5,
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(255, 107, 107, 0.25)',
              cursor: 'pointer',
            }}
          >
            <Icon name="add" size={15} color="#ffffff" />
            <span>+ Add Table</span>
          </button>
        )}

        {/* Quick Add Delivery Partner Action Button */}
        {onAddPartner && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={onAddPartner}
            title="Register a new delivery rider partner"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700,
              fontSize: 12.5,
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <Icon name="delivery" size={15} color="var(--accent)" />
            <span>+ Add Partner</span>
          </button>
        )}

        {/* Quick link to Customer App */}
        <a
          href="/"
          className="btn btn-sm btn-outline"
          title="Back to Customer App (http://localhost:5173/)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 12.5,
            color: 'var(--text)',
            borderRadius: 8,
          }}
        >
          <Icon name="home" size={15} color="var(--accent)" />
          <span>Customer App</span>
        </a>

        {/* System Live Operational Pill */}
        <div className="system-live-pill" title="Real-time Operational State Active">
          <span className="live-pulse-dot" />
          <span className="live-label">LIVE OPERATIONS</span>
        </div>

        {/* Notifications Icon Button */}
        <button
          type="button"
          className="admin-icon-btn notifications-btn"
          onClick={onOpenNotifications}
          title="Open Notifications Panel"
          aria-label="Open Notifications Panel"
        >
          <Icon name="notifications" size={20} />
          {unreadNotificationsCount > 0 && (
            <span className="notification-badge-count">{unreadNotificationsCount}</span>
          )}
        </button>

        {/* Admin Profile Pill & Dropdown */}
        <div className="admin-profile-pill-wrap" ref={profileMenuRef}>
          <button
            type="button"
            className="admin-profile-pill"
            onClick={() => setProfileMenuOpen(v => !v)}
            aria-expanded={profileMenuOpen}
          >
            <div className="admin-avatar-thumb">
              {adminUser?.avatar ? (
                <SafeImage
                  image={adminUser.avatar}
                  alt={adminUser.fullName || 'Admin'}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div className="admin-default-avatar-initials">
                  {(adminUser?.fullName?.[0] || 'D').toUpperCase()}
                </div>
              )}
            </div>
            <div className="admin-pill-meta">
              <span className="admin-pill-name">{adminUser?.fullName || 'Dheivalakshmi'}</span>
              <span className="admin-pill-role">{adminUser?.tier || 'Super Admin'}</span>
            </div>
            <Icon name="chevron-down" size={14} className="pill-arrow" />
          </button>

          {/* Profile Dropdown */}
          {profileMenuOpen && (
            <div className="admin-profile-dropdown">
              <div className="admin-dropdown-user-header">
                <strong>{adminUser?.fullName || 'Dheivalakshmi'}</strong>
                <span className="admin-dropdown-email">{adminUser?.email || 'dheivalakshmi7@gmail.com'}</span>
              </div>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onNavigate('profile');
                }}
              >
                <Icon name="profile" size={16} />
                <span>Admin Profile</span>
              </button>
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onNavigate('settings');
                }}
              >
                <Icon name="settings" size={16} />
                <span>Settings</span>
              </button>
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onNavigate('activity-log');
                }}
              >
                <Icon name="pulse" size={16} />
                <span>Activity Log</span>
              </button>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item logout-action"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onLogout();
                }}
              >
                <Icon name="logout" size={16} color="var(--danger)" />
                <span style={{ color: 'var(--danger)' }}>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
