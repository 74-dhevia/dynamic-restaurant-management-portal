import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RESTAURANTS, FOODS } from '../data/mockData';
import SafeImage from '../components/SafeImage';
import Icon from '../components/Icon';
import Pagination from '../components/Pagination';
import { useToast } from '../contexts/ToastContext';
import { logout } from '../redux/slices/authSlice';
import { updateOrderStatus } from '../redux/slices/orderSlice';

export default function OwnerDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const user = useSelector(s => s.auth.currentUser);
  const restaurant = RESTAURANTS.find(r => r.id === (user?.restaurantId || 'r1')) || RESTAURANTS[0] || {};
  const orders = useSelector(s => (s.order?.orders || []).filter(o => o?.restaurantId === restaurant?.id));
  const bookings = useSelector(s => (s.booking?.bookings || []).filter(b => b?.restaurantId === restaurant?.id));
  
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'orders', 'tables', 'menu', 'bookings'
  const [tables, setTables] = useState(restaurant?.tables || [
    { id: 't1', label: 'T-01 (2P)', status: 'free' },
    { id: 't2', label: 'T-02 (4P)', status: 'occupied' },
    { id: 't3', label: 'T-03 (6P)', status: 'seating-soon' },
    { id: 't4', label: 'T-04 (4P)', status: 'free' },
    { id: 't5', label: 'T-05 (2P)', status: 'free' },
    { id: 't6', label: 'T-06 (8P)', status: 'occupied' },
  ]);

  const menu = (FOODS || []).filter(f => f?.restaurantId === restaurant?.id);
  const revenue = useMemo(() => orders.reduce((a, o) => a + (o.cancelled ? 0 : o.grandTotal || 0), 0) + 14250, [orders]);

  // Main scroll ref for independent scrolling
  const mainContentRef = useRef(null);
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Pagination states
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageSize, setOrdersPageSize] = useState(10);
  const [menuPage, setMenuPage] = useState(1);
  const [menuPageSize, setMenuPageSize] = useState(10);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsPageSize, setBookingsPageSize] = useState(10);

  useEffect(() => {
    setOrdersPage(1);
    setMenuPage(1);
    setBookingsPage(1);
  }, [activeTab]);

  const activeOrdersList = useMemo(() => {
    return orders.length > 0 ? orders : [
      { id: '101', customerName: 'Ramesh K.', grandTotal: 340, status: 'Preparing', items: [{ qty: 2, name: 'Bun Parotta' }, { qty: 1, name: 'Chicken Salna' }] },
      { id: '102', customerName: 'Sangeetha M.', grandTotal: 580, status: 'Confirmed', items: [{ qty: 2, name: 'Chicken Biriyani' }] },
      { id: '103', customerName: 'Anto V.', grandTotal: 220, status: 'Ready', items: [{ qty: 1, name: 'Ghee Roast Dosa' }] },
    ];
  }, [orders]);

  const activeBookingsList = useMemo(() => {
    return bookings.length > 0 ? bookings : [
      { id: 'b1', customer: 'Vijay Anand', guests: 4, time: '7:30 PM Tonight', table: 'Table 03 (AC)', status: 'Confirmed', pin: '4582' },
      { id: 'b2', customer: 'Deepika S.', guests: 2, time: '8:00 PM Tonight', table: 'Table 01 (Indoor)', status: 'Confirmed', pin: '7129' },
      { id: 'b3', customer: 'Dr. Subramanian', guests: 6, time: '8:30 PM Tonight', table: 'Table 06 (Family)', status: 'Seated', pin: '9903' },
    ];
  }, [bookings]);

  const paginatedOrders = useMemo(() => {
    const start = (ordersPage - 1) * ordersPageSize;
    return activeOrdersList.slice(start, start + ordersPageSize);
  }, [activeOrdersList, ordersPage, ordersPageSize]);

  const paginatedMenu = useMemo(() => {
    const start = (menuPage - 1) * menuPageSize;
    return menu.slice(start, start + menuPageSize);
  }, [menu, menuPage, menuPageSize]);

  const paginatedBookings = useMemo(() => {
    const start = (bookingsPage - 1) * bookingsPageSize;
    return activeBookingsList.slice(start, start + bookingsPageSize);
  }, [activeBookingsList, bookingsPage, bookingsPageSize]);

  const handleLogout = () => {
    dispatch(logout());
    showToast('Signed out of Restaurant Manager Terminal', 'info');
    navigate('/login', { replace: true });
  };

  const handleAdvanceOrderStatus = (orderId, currentStatus) => {
    let nextStatus = 'Preparing';
    if (currentStatus === 'Placed' || currentStatus === 'Confirmed') nextStatus = 'Preparing';
    else if (currentStatus === 'Preparing') nextStatus = 'Ready';
    else if (currentStatus === 'Ready') nextStatus = 'Out for Delivery';
    else if (currentStatus === 'Out for Delivery') nextStatus = 'Delivered';

    dispatch(updateOrderStatus({ id: orderId, status: nextStatus }));
    showToast(`Order #${orderId} moved to ${nextStatus}`, 'success');
  };

  return (
    <div className="portal-layout-wrapper">
      {/* ================= LEFT SIDE PANEL ================= */}
      <aside className="portal-sidebar">
        <div className="portal-sidebar-header">
          <div className="portal-brand">
            <span className="portal-brand-icon">🏪</span>
            <div className="portal-brand-text">
              <span className="portal-brand-title">{restaurant.name || 'ZESTRO'}</span>
              <span className="portal-brand-badge">Manager Portal</span>
            </div>
          </div>
        </div>

        {/* Manager User Info */}
        <div className="portal-user-card">
          <div className="portal-avatar-ring">
            <SafeImage
              image={user?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'}
              alt={user?.fullName || 'Manager'}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
            />
            <span className="status-indicator online" />
          </div>
          <div className="portal-user-meta">
            <strong className="portal-user-name">{user?.fullName || user?.name || 'Karthik Raman'}</strong>
            <span className="portal-user-role">General Manager</span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="portal-nav">
          <div className="portal-nav-group-title">RESTAURANT OPS</div>
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Icon name="home" size={18} />
            <span>Dashboard Overview</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Icon name="orders" size={18} />
            <span>Live Kitchen Orders</span>
            {orders.length > 0 && <span className="nav-badge alert">{orders.length}</span>}
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'tables' ? 'active' : ''}`}
            onClick={() => setActiveTab('tables')}
          >
            <Icon name="table" size={18} />
            <span>Digital Twin Floor Map</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <Icon name="calendar" size={18} />
            <span>Table Reservations</span>
            <span className="nav-badge info">{bookings.length || 3}</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            <Icon name="food" size={18} />
            <span>Menu & Pricing ({menu.length || 18})</span>
          </button>
        </nav>

        {/* Footer Logout */}
        <div className="portal-sidebar-footer">
          <button type="button" className="portal-logout-btn" onClick={handleLogout}>
            <Icon name="logout" size={18} />
            <span>Sign Out Terminal</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT BODY ================= */}
      <main ref={mainContentRef} className="portal-content-body">
        {/* Top Header */}
        <header className="portal-top-header">
          <div className="portal-header-left">
            <h1 className="portal-page-title">
              {activeTab === 'overview' && `🏪 ${restaurant.name} — Manager Console`}
              {activeTab === 'orders' && '📋 Live Restaurant Orders'}
              {activeTab === 'tables' && '🗺️ Digital Twin — Dining Floor Map'}
              {activeTab === 'bookings' && '📅 Table Bookings & Queue Management'}
              {activeTab === 'menu' && `🍲 Restaurant Menu (${menu.length || 18} Dishes)`}
            </h1>
            <p className="portal-page-subtitle">
              {typeof restaurant.address === 'object' ? `${restaurant.address.street || ''}, ${restaurant.address.city || ''}` : (restaurant.address || restaurant.area || 'Kovilpatti')} • {restaurant.area || 'Kovilpatti'}
            </p>
          </div>

          <div className="portal-header-right">
            <div className="portal-stat-pill">
              <span className="stat-pill-label">Today's Revenue</span>
              <strong className="stat-pill-value">₹{revenue}</strong>
            </div>
            <div className="portal-stat-pill">
              <span className="stat-pill-label">Rating</span>
              <strong className="stat-pill-value">⭐ {restaurant.rating || 4.8}</strong>
            </div>
          </div>
        </header>

        {/* KPI Metric Strip */}
        <section className="portal-metric-strip">
          <div className="metric-box card" onClick={() => setActiveTab('orders')} style={{ cursor: 'pointer' }}>
            <span className="metric-label">Active Orders</span>
            <strong className="metric-num text-accent">{orders.length || 6}</strong>
          </div>
          <div className="metric-box card" onClick={() => setActiveTab('tables')} style={{ cursor: 'pointer' }}>
            <span className="metric-label">Occupied Tables</span>
            <strong className="metric-num text-warning">{tables.filter(t => t.status === 'occupied').length} / {tables.length}</strong>
          </div>
          <div className="metric-box card" onClick={() => setActiveTab('bookings')} style={{ cursor: 'pointer' }}>
            <span className="metric-label">Reservations Today</span>
            <strong className="metric-num text-info">{bookings.length || 4}</strong>
          </div>
          <div className="metric-box card">
            <span className="metric-label">Total Revenue</span>
            <strong className="metric-num text-success">₹{revenue}</strong>
          </div>
        </section>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="portal-view-grid">
            <div className="card section" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>🗺️ Live Floor Map Status</h3>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setActiveTab('tables')}>View Full Screen</button>
              </div>
              <div className="table-grid">
                {tables.map(t => (
                  <div
                    key={t.id}
                    className={`table-cell ${t.status}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const order = ['free', 'seating-soon', 'occupied'];
                      const next = order[(order.indexOf(t.status) + 1) % order.length];
                      setTables(prev => prev.map(x => x.id === t.id ? { ...x, status: next } : x));
                    }}
                  >
                    {t.status === 'free' ? '🟢' : t.status === 'seating-soon' ? '🟡' : '🔴'} {t.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="card section" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>📋 Quick Orders Feed</h3>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setActiveTab('orders')}>All Orders</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.slice(0, 4).map(o => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: 'var(--bg)' }}>
                    <div>
                      <strong>Order #{o.id}</strong> — <span className="muted">{o.customerName || 'Customer'}</span>
                      <div className="muted" style={{ fontSize: 12 }}>{(o.items || []).map(i => `${i.qty}x ${i.name}`).join(', ') || 'Meals, Parotta'}</div>
                    </div>
                    <span className={`status-pill ${o.status === 'Delivered' ? 'success' : 'warning'}`}>{o.status || 'Preparing'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Orders */}
        {activeTab === 'orders' && (
          <div className="card section" style={{ padding: 20 }}>
            <h3>All Restaurant Orders</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              {paginatedOrders.map(o => (
                <div key={o.id} className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: 16 }}>Order #{o.id}</strong> — <span>{o.customerName}</span>
                    <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                      {(o.items || []).map(i => `${i.qty}x ${i.name}`).join(', ')} • <strong>₹{o.grandTotal}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className={`status-pill ${o.status === 'Delivered' ? 'success' : 'warning'}`}>{o.status}</span>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAdvanceOrderStatus(o.id, o.status)}
                    >
                      Advance Status ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={ordersPage}
              totalItems={activeOrdersList.length}
              pageSize={ordersPageSize}
              onPageChange={setOrdersPage}
              onPageSizeChange={(sz) => {
                setOrdersPageSize(sz);
                setOrdersPage(1);
              }}
              itemName="orders"
            />
          </div>
        )}

        {/* Tab 3: Tables Floor Map */}
        {activeTab === 'tables' && (
          <div className="card section" style={{ padding: 24 }}>
            <h3>Digital Twin — Live Seating Map</h3>
            <p className="muted">Click any table to cycle status between: 🟢 Free ➔ 🟡 Seating Soon ➔ 🔴 Occupied</p>
            <div className="table-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16, marginTop: 20 }}>
              {tables.map(t => (
                <div
                  key={t.id}
                  className={`table-cell ${t.status}`}
                  style={{ cursor: 'pointer', padding: 20, textAlign: 'center', borderRadius: 12 }}
                  onClick={() => {
                    const order = ['free', 'seating-soon', 'occupied'];
                    const next = order[(order.indexOf(t.status) + 1) % order.length];
                    setTables(prev => prev.map(x => x.id === t.id ? { ...x, status: next } : x));
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{t.status === 'free' ? '🟢' : t.status === 'seating-soon' ? '🟡' : '🔴'}</div>
                  <strong style={{ display: 'block', fontSize: 15 }}>{t.label}</strong>
                  <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{t.status.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Bookings */}
        {activeTab === 'bookings' && (
          <div className="card section" style={{ padding: 20 }}>
            <h3>Customer Reservations & Bookings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              {paginatedBookings.map(b => (
                <div key={b.id} className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{b.customer}</strong> — <span className="muted">{b.guests} Guests • {b.time}</span>
                    <div style={{ fontSize: 13, marginTop: 4 }}>Assigned: <strong>{b.table}</strong> | Check-in PIN: <code style={{ color: 'var(--accent)', fontWeight: 700 }}>{b.pin}</code></div>
                  </div>
                  <span className={`status-pill ${b.status === 'Seated' ? 'info' : 'success'}`}>{b.status}</span>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={bookingsPage}
              totalItems={activeBookingsList.length}
              pageSize={bookingsPageSize}
              onPageChange={setBookingsPage}
              onPageSizeChange={(sz) => {
                setBookingsPageSize(sz);
                setBookingsPage(1);
              }}
              itemName="reservations"
            />
          </div>
        )}

        {/* Tab 5: Menu */}
        {activeTab === 'menu' && (
          <div className="card section" style={{ padding: 20 }}>
            <h3>Restaurant Dishes & Availability</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              {paginatedMenu.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <SafeImage image={f.image} alt={f.name} style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />
                    <div>
                      <strong style={{ fontSize: 15 }}>{f.name}</strong>
                      <div className="muted" style={{ fontSize: 12 }}>{f.category.replace('-', ' ')} • ⭐ {f.rating}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <strong style={{ fontSize: 16 }}>₹{f.price}</strong>
                    <span className="status-pill success">In Stock</span>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={menuPage}
              totalItems={menu.length}
              pageSize={menuPageSize}
              onPageChange={setMenuPage}
              onPageSizeChange={(sz) => {
                setMenuPageSize(sz);
                setMenuPage(1);
              }}
              itemName="menu items"
            />
          </div>
        )}
      </main>
    </div>
  );
}
