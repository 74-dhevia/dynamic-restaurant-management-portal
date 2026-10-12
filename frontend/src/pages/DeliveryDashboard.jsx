import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import SafeImage from '../components/SafeImage';
import Pagination from '../components/Pagination';
import { useToast } from '../contexts/ToastContext';
import { logout } from '../redux/slices/authSlice';
import { updateOrderStatus, verifyDeliveryOtp, updateOrderDeliveryLocation } from '../redux/slices/orderSlice';
import LiveRouteMap from '../components/delivery/LiveRouteMap';

export default function DeliveryDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const currentUser = useSelector(s => s.auth?.currentUser);
  const allOrders = useSelector(s => s.order?.orders || []);

  const [activeTab, setActiveTab] = useState('active'); // 'active', 'available', 'completed', 'profile', 'mapRadar'
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [otpInput, setOtpInput] = useState({});
  const [selectedRouteOrder, setSelectedRouteOrder] = useState(null);

  // Main scroll ref for independent scrolling
  const mainContentRef = useRef(null);
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  // Delivery orders breakdown
  const activeDeliveries = useMemo(() => {
    return allOrders.filter(o => !o.cancelled && (o.status === 'Out for Delivery' || o.status === 'Ready'));
  }, [allOrders]);

  const availableOrders = useMemo(() => {
    return allOrders.filter(o => !o.cancelled && o.status === 'Preparing');
  }, [allOrders]);

  const completedDeliveries = useMemo(() => {
    return allOrders.filter(o => !o.cancelled && o.status === 'Delivered');
  }, [allOrders]);

  // Today stats
  const todayEarnings = useMemo(() => {
    return completedDeliveries.length * 45 + 120; // Base pay per delivery + tips
  }, [completedDeliveries]);

  const handleLogout = () => {
    dispatch(logout());
    showToast('Signed out of Delivery Partner Terminal', 'info');
    navigate('/login', { replace: true });
  };

  const handlePickUp = (orderId) => {
    dispatch(updateOrderStatus({ id: orderId, status: 'Out for Delivery' }));
    showToast('Order picked up from kitchen! Ready for delivery.', 'success');
  };

  const handleDeliver = (orderId) => {
    dispatch(verifyDeliveryOtp({ id: orderId }));
    dispatch(updateOrderStatus({ id: orderId, status: 'Delivered' }));
    showToast(`Order #${orderId} marked Delivered! +₹45 added to wallet.`, 'success');
  };

  const filteredOrders = useMemo(() => {
    let list = [];
    if (activeTab === 'active') list = activeDeliveries;
    else if (activeTab === 'available') list = availableOrders;
    else if (activeTab === 'completed') list = completedDeliveries;

    if (!searchQuery) return list;
    return list.filter(o =>
      String(o.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.restaurantName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof o.deliveryAddress === 'string' ? o.deliveryAddress : (o.deliveryAddress?.text || o.address?.text || '')).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, activeDeliveries, availableOrders, completedDeliveries, searchQuery]);

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="portal-layout-wrapper">
      {/* Mobile Drawer Backdrop */}
      {mobileNavOpen && (
        <div
          className="portal-mobile-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ================= LEFT SIDE PANEL ================= */}
      <aside className={`portal-sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="portal-sidebar-header">
          <div className="portal-brand">
            <span className="portal-brand-icon">🛵</span>
            <div className="portal-brand-text">
              <span className="portal-brand-title">ZESTRO</span>
              <span className="portal-brand-badge">Rider Fleet</span>
            </div>
          </div>
          <button
            type="button"
            className="portal-sidebar-close-btn"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close sidebar menu"
          >
            ✕
          </button>
        </div>

        {/* Rider Profile Card */}
        <div className="portal-user-card">
          <div className="portal-avatar-ring">
            <SafeImage
              image={currentUser?.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser?.fullName || 'Delivery Partner'}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
            />
            <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`} />
          </div>
          <div className="portal-user-meta">
            <strong className="portal-user-name">{currentUser?.fullName || currentUser?.name || 'Suresh Kumar'}</strong>
            <span className="portal-user-role">Fleet Partner • Kovilpatti</span>
          </div>
        </div>

        {/* Duty Toggle */}
        <div className="portal-sidebar-action-box">
          <button
            type="button"
            className={`duty-toggle-btn ${isOnline ? 'duty-online' : 'duty-offline'}`}
            onClick={() => {
              setIsOnline(!isOnline);
              showToast(isOnline ? 'Shift status: Offline' : 'Shift status: Online & Ready for Orders', 'info');
            }}
          >
            <span className="duty-dot" />
            <span>{isOnline ? 'On Duty (Accepting Orders)' : 'Off Duty'}</span>
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="portal-nav">
          <div className="portal-nav-group-title">DELIVERY DISPATCH</div>
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <Icon name="orders" size={18} />
            <span>Active Deliveries</span>
            {activeDeliveries.length > 0 && <span className="nav-badge alert">{activeDeliveries.length}</span>}
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            <Icon name="clock" size={18} />
            <span>Ready for Pickup</span>
            {availableOrders.length > 0 && <span className="nav-badge info">{availableOrders.length}</span>}
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <Icon name="check" size={18} />
            <span>Trip History</span>
            <span className="nav-badge muted">{completedDeliveries.length}</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'mapRadar' ? 'active' : ''}`}
            onClick={() => setActiveTab('mapRadar')}
          >
            <Icon name="location" size={18} />
            <span>🗺️ Live Route Radar</span>
            {activeDeliveries.length > 0 && <span className="nav-badge success">Live</span>}
          </button>

          <div className="portal-nav-group-title">ACCOUNT</div>
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Icon name="profile" size={18} />
            <span>Rider Profile & Wallet</span>
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

      {/* ================= MAIN CONTENT AREA ================= */}
      <main ref={mainContentRef} className="portal-content-body">
        {/* Top View Header */}
        <header className="portal-top-header">
          <div className="portal-header-left">
            <button
              type="button"
              className="portal-mobile-menu-btn"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open Fleet Navigation Menu"
              title="Open Navigation"
            >
              <Icon name="menu" size={18} />
              <span>Menu</span>
            </button>
            <h1 className="portal-page-title">
              {activeTab === 'active' && '🚚 Active Doorstep Deliveries'}
              {activeTab === 'available' && '📦 Restaurant Pickups in Queue'}
              {activeTab === 'completed' && '✅ Completed Deliveries History'}
              {activeTab === 'profile' && '👤 Rider Profile & Wallet Earnings'}
              {activeTab === 'mapRadar' && '🗺️ Real-Time Customer Route Radar & GPS'}
            </h1>
            <p className="portal-page-subtitle">Kovilpatti Hub • Live Fleet Terminal</p>
          </div>

          <div className="portal-header-right">
            <div className="portal-stat-pill">
              <span className="stat-pill-label">Today's Earnings</span>
              <strong className="stat-pill-value">₹{todayEarnings}</strong>
            </div>
            <div className="portal-stat-pill">
              <span className="stat-pill-label">Rating</span>
              <strong className="stat-pill-value">⭐ 4.9</strong>
            </div>
          </div>
        </header>

        {/* Metrics Grid */}
        <section className="portal-metric-strip">
          <div className="metric-box card">
            <span className="metric-label">Active Orders</span>
            <strong className="metric-num text-accent">{activeDeliveries.length}</strong>
          </div>
          <div className="metric-box card">
            <span className="metric-label">Available for Pickup</span>
            <strong className="metric-num text-info">{availableOrders.length}</strong>
          </div>
          <div className="metric-box card">
            <span className="metric-label">Completed Today</span>
            <strong className="metric-num text-success">{completedDeliveries.length}</strong>
          </div>
          <div className="metric-box card">
            <span className="metric-label">Avg Delivery Time</span>
            <strong className="metric-num">24 min</strong>
          </div>
        </section>

        {/* Filter / Search Bar */}
        {activeTab !== 'profile' && (
          <div className="portal-search-row">
            <div className="portal-search-box">
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="Search by order ID, customer name, restaurant, or address..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Orders List View */}
        {activeTab !== 'profile' ? (
          <>
            <div className="portal-orders-grid">
            {filteredOrders.length === 0 ? (
              <div className="card portal-empty-state">
                <span className="empty-icon">📭</span>
                <h3>No deliveries in this section</h3>
                <p className="muted">You're all caught up! When a customer places a delivery order, it will appear here.</p>
              </div>
            ) : (
              paginatedOrders.map(order => (
                <div key={order.id} className="card delivery-order-card">
                  <div className="doc-header">
                    <div>
                      <span className="doc-id">#{order.id}</span>
                      <span className={`status-pill ${order.status === 'Delivered' ? 'success' : order.status === 'Out for Delivery' ? 'warning' : 'info'}`}>
                        {order.status}
                      </span>
                    </div>
                    <span className="doc-amount">₹{order.grandTotal || 240}</span>
                  </div>

                  <div className="doc-details-grid">
                    <div className="doc-detail-item">
                      <span className="detail-lbl">🏪 Pick Up From</span>
                      <strong className="detail-val">{order.restaurantName || 'Aroma Chettinad Restaurant'}</strong>
                      <span className="muted" style={{ fontSize: 12 }}>Gandhi Nagar, Kovilpatti</span>
                    </div>

                    <div className="doc-detail-item">
                      <span className="detail-lbl">📍 Deliver To</span>
                      <strong className="detail-val">{order.customerName || 'Customer'}</strong>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {typeof order.deliveryAddress === 'string'
                          ? order.deliveryAddress
                          : (order.deliveryAddress?.text || order.address?.text || order.deliveryAddress?.address || '12B Green Valley, Kovilpatti')}
                      </span>
                      <span className="muted" style={{ fontSize: 12 }}>📞 {order.customerPhone || '+91 98401 23456'}</span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="doc-items-summary">
                    <span className="detail-lbl">Items ({order.items?.length || 1}):</span>
                    <span className="items-text">
                      {(order.items || []).map(i => `${i.qty || 1}x ${i.name}`).join(', ') || 'Special Chicken Biriyani, Parotta (2 pcs)'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="doc-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-block"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        fontWeight: 700,
                        marginBottom: 8,
                        background: 'color-mix(in srgb, var(--accent) 10%, var(--bg-elevated))',
                        borderColor: 'color-mix(in srgb, var(--accent) 30%, var(--border))',
                        color: 'var(--accent)',
                      }}
                      onClick={() => setSelectedRouteOrder(order)}
                    >
                      <span>🗺️</span>
                      <span>Customer Location &amp; Live Route</span>
                    </button>

                    {order.status === 'Preparing' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-block"
                        onClick={() => handlePickUp(order.id)}
                      >
                        <Icon name="check" size={16} />
                        <span>Confirm Pickup from Restaurant</span>
                      </button>
                    )}

                    {order.status === 'Out for Delivery' && (
                      <div className="doc-delivery-confirm-box" style={{ background: 'rgba(16, 185, 129, 0.08)', padding: 12, borderRadius: 12, border: '1px dashed #10b981' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>
                            🛡️ Customer Handshake OTP
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            (Ask customer for 4-digit code)
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="text"
                            placeholder="4-digit OTP"
                            maxLength={4}
                            value={otpInput[order.id] || ''}
                            onChange={(e) => setOtpInput({ ...otpInput, [order.id]: e.target.value })}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: '1px solid var(--border)',
                              background: 'var(--bg)',
                              color: 'var(--text)',
                              fontWeight: 800,
                              fontSize: 16,
                              textAlign: 'center',
                              letterSpacing: 4,
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => {
                              const entered = otpInput[order.id];
                              const actual = order.deliveryOtp || '4821';
                              if (entered && entered !== actual) {
                                showToast(`❌ Invalid OTP: "${entered}". Please ask the customer for the correct 4-digit OTP.`, 'error');
                                return;
                              }
                              handleDeliver(order.id);
                            }}
                            style={{ fontWeight: 800, whiteSpace: 'nowrap' }}
                          >
                            ✓ Verify &amp; Deliver
                          </button>
                        </div>
                      </div>
                    )}

                    {order.status === 'Delivered' && (
                      <div className="doc-delivered-banner">
                        <span>✅ Successfully Delivered • +₹45 Earned</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <Pagination
            currentPage={page}
            totalItems={filteredOrders.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setPage(1);
            }}
            itemName="deliveries"
          />
        </>
      ) : activeTab === 'mapRadar' ? (
        /* Real-Time Live Fleet Route Radar */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 18, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                  🗺️ Live Customer Route Radar &amp; GPS Dispatch
                </h2>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                  Select an active doorstep order below to view the customer's exact location, route path, and launch turn-by-turn Google Maps GPS.
                </p>
              </div>

              {activeDeliveries.length > 0 && (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0' }}>
                  {activeDeliveries.map(o => (
                    <button
                      key={o.id}
                      type="button"
                      className="btn btn-sm"
                      style={{
                        background: (selectedRouteOrder?.id || activeDeliveries[0]?.id) === o.id ? 'var(--accent)' : 'var(--bg)',
                        color: (selectedRouteOrder?.id || activeDeliveries[0]?.id) === o.id ? '#ffffff' : 'var(--text)',
                        border: '1px solid var(--border)',
                        fontWeight: 700,
                        borderRadius: 10,
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => setSelectedRouteOrder(o)}
                    >
                      #{o.id} • {o.customerName || 'Customer'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {activeDeliveries.length === 0 ? (
            <div className="card portal-empty-state" style={{ padding: 40, textAlign: 'center' }}>
              <span style={{ fontSize: 36, display: 'block', marginBottom: 10 }}>🛵</span>
              <h3>No Active Deliveries on Route</h3>
              <p className="muted">When orders are marked "Out for Delivery" or "Ready", their customer locations will plot here automatically.</p>
            </div>
          ) : (
            <LiveRouteMap
              order={selectedRouteOrder || activeDeliveries[0]}
              riderInfo={currentUser || { name: 'Suresh Kumar', phone: '+91 98401 23456', vehicleNumber: 'TN 69 AB 1234' }}
              viewMode="rider"
              onLocationUpdate={loc => {
                const targetId = (selectedRouteOrder || activeDeliveries[0])?.id;
                if (targetId) {
                  dispatch(
                    updateOrderDeliveryLocation({
                      id: targetId,
                      riderCoords: loc.riderCoords,
                      etaMinutes: loc.etaMinutes,
                      distanceKm: loc.distanceKm,
                    })
                  );
                }
              }}
              height={500}
            />
          )}
        </div>
      ) : (
        /* Profile & Wallet Tab */
        <div className="card portal-profile-card">
          <h2>Rider Profile & Performance</h2>
          <div className="profile-grid">
            <div>
              <p><strong>Name:</strong> {currentUser?.fullName || 'Suresh Kumar'}</p>
              <p><strong>Email:</strong> {currentUser?.email || 'delivery@zestro.com'}</p>
              <p><strong>Phone:</strong> {currentUser?.phone || '+91 97890 55443'}</p>
              <p><strong>Vehicle:</strong> Hero Splendor (TN 69 AB 4521)</p>
              <p><strong>Zone:</strong> Kovilpatti Central & Suburbs</p>
            </div>
            <div className="wallet-card">
              <h3>Today's Wallet Balance</h3>
              <div className="wallet-num">₹{todayEarnings}</div>
              <p className="muted">Payouts credited automatically every Monday to verified UPI.</p>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER LOCATION & TURN-BY-TURN GPS NAVIGATOR MODAL */}
      {selectedRouteOrder && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            boxSizing: 'border-box',
          }}
          onClick={() => setSelectedRouteOrder(null)}
        >
          <div
            className="card modal-content"
            style={{
              maxWidth: 860,
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: 24,
              borderRadius: 20,
              boxSizing: 'border-box',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                  📍 Customer Location &amp; Live Route Navigation
                </h2>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                  Order #{selectedRouteOrder.id} • Customer: <strong>{selectedRouteOrder.customerName || 'Customer'}</strong>
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setSelectedRouteOrder(null)}
                style={{ borderRadius: 8, padding: '4px 10px', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <LiveRouteMap
              order={selectedRouteOrder}
              riderInfo={currentUser || { name: 'Suresh Kumar', phone: '+91 98401 23456', vehicleNumber: 'TN 69 AB 1234' }}
              viewMode="rider"
              onLocationUpdate={loc => {
                dispatch(
                  updateOrderDeliveryLocation({
                    id: selectedRouteOrder.id,
                    riderCoords: loc.riderCoords,
                    etaMinutes: loc.etaMinutes,
                    distanceKm: loc.distanceKm,
                  })
                );
              }}
              height={400}
            />

            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 12, border: '1px solid var(--border)' }}>
                <strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>📍 Customer Drop-off Address</strong>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text)' }}>
                  {typeof selectedRouteOrder.deliveryAddress === 'string'
                    ? selectedRouteOrder.deliveryAddress
                    : (selectedRouteOrder.deliveryAddress?.text || selectedRouteOrder.deliveryAddress?.address || '12B Green Valley, Kovilpatti')}
                </p>
                {selectedRouteOrder.deliveryInstruction && (
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                    📝 Gate Note: {selectedRouteOrder.deliveryInstruction}
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  📞 Customer Phone:{' '}
                  <a href={`tel:${selectedRouteOrder.customerPhone || '+919840123456'}`} style={{ color: 'var(--accent)', fontWeight: 700 }}>
                    {selectedRouteOrder.customerPhone || '+91 98401 23456'}
                  </a>
                </div>
              </div>

              <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 12, border: '1px solid var(--border)' }}>
                <strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>🏪 Pick-up Restaurant Details</strong>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text)' }}>
                  {selectedRouteOrder.restaurantName || 'Restaurant Kitchen'}
                </p>
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  Order Total: <strong style={{ color: 'var(--text)' }}>₹{selectedRouteOrder.grandTotal || 0}</strong> ({selectedRouteOrder.paymentMethod || 'UPI'})
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                  Items ({selectedRouteOrder.items?.length || 1}):{' '}
                  {(selectedRouteOrder.items || []).map(i => `${i.qty || 1}x ${i.name}`).join(', ') || 'Food items'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  </div>
);
}
