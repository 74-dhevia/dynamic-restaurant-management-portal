import React, { useMemo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { addToCart } from '../../redux/slices/cartSlice';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/Icon';
import SafeImage from '../../components/SafeImage';
import { RESTAURANTS, FOODS } from '../../data/mockData';
import bookingApiService from '../../services/bookingApiService';

function parseBookingDateTime(b) {
  if (!b || !b.date) return new Date();
  const timeStr = String(b.time || b.timeSlot || '').trim();
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[3] ? match[3].toUpperCase() : null;
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    const parts = b.date.split('-').map(Number);
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2], hours, minutes);
    }
  }
  return new Date(`${b.date}T${b.time || b.timeSlot || '19:30'}`);
}

function computeCountdown(targetDate) {
  const diffMs = targetDate - new Date();
  if (diffMs <= 0) return null;
  const diffMin = Math.floor(diffMs / 60000);
  const days = Math.floor(diffMin / 1440);
  const hours = Math.floor((diffMin % 1440) / 60);
  const minutes = diffMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} mins`;
}

export default function CustomerDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const currentUser = useSelector(s => s.auth?.currentUser);
  const rawOrders = useSelector(s => s.order?.orders || []);
  const rawBookings = useSelector(s => s.booking?.bookings || []);
  const wishlistItems = useSelector(s => s.wishlist?.items || []);
  const recentlyViewed = useSelector(s => s.recentlyViewed?.items || []);
  const notifications = useSelector(s => s.notification?.items || []);
  const dinePoints = currentUser?.dinePoints ?? useSelector(s => s.reward?.points ?? 120);
  const vouchers = useSelector(s => s.voucher?.vouchers || []);

  const [backendBookings, setBackendBookings] = useState([]);

  // Fetch live bookings from MongoDB on mount
  useEffect(() => {
    bookingApiService.getMyBookings().then(res => {
      if (res && res.success && Array.isArray(res.data)) {
        setBackendBookings(res.data);
      }
    }).catch(() => {});
  }, []);

  // Real-Time GPS Tracking State
  const [gpsLocation, setGpsLocation] = useState({
    loading: true,
    latitude: 9.1726,
    longitude: 77.8728,
    accuracy: null,
    address: 'Kovilpatti, Tamil Nadu',
    status: 'Detecting live GPS...',
  });

  const refreshLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setGpsLocation(prev => ({ ...prev, loading: true, status: 'Locating via GPS satellites...' }));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setGpsLocation({
            loading: false,
            latitude: Number(latitude.toFixed(4)),
            longitude: Number(longitude.toFixed(4)),
            accuracy: Math.round(accuracy),
            address: `${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E (Live Device GPS)`,
            status: 'Live GPS Active ● Connected',
          });
          if (showToast) showToast('Live GPS location synchronized!', 'success');
        },
        () => {
          setGpsLocation(prev => ({
            ...prev,
            loading: false,
            status: 'Default Location (Kovilpatti, TN)',
          }));
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  const calculateDistance = (lat1, lon1, lat2 = 9.1726, lon2 = 77.8728) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.max(0.8, Number((R * c).toFixed(1)));
  };

  const displayName = currentUser?.fullName || currentUser?.name || 'Customer';
  const tier = currentUser?.tier || 'Bronze';

  // 1. Current Customer Orders
  const customerOrders = useMemo(() => {
    if (!Array.isArray(rawOrders)) return [];
    if (!currentUser) return rawOrders.slice(0, 5);
    const userMatch = rawOrders.filter(o => 
      o.userId === currentUser.id ||
      o.userEmail === currentUser.email ||
      o.customerEmail === currentUser.email ||
      o.userName === currentUser.fullName
    );
    return userMatch.length > 0 ? userMatch : rawOrders.slice(0, 5);
  }, [rawOrders, currentUser]);

  // Combined Bookings
  const allUserBookings = useMemo(() => {
    const map = new Map();
    backendBookings.forEach(b => map.set(b.bookingNumber || b.id || b._id, b));
    rawBookings.forEach(b => {
      const k = b.bookingNumber || b.id || b._id;
      if (!map.has(k)) map.set(k, b);
    });
    return Array.from(map.values());
  }, [backendBookings, rawBookings]);

  // 2. Upcoming Table Booking
  const upcomingBooking = useMemo(() => {
    if (!Array.isArray(allUserBookings) || allUserBookings.length === 0) return null;
    const now = new Date();
    const active = allUserBookings.filter(b => {
      if (b.status === 'Cancelled' || b.status === 'Completed') return false;
      return parseBookingDateTime(b) >= now;
    }).sort((a, b) => parseBookingDateTime(a) - parseBookingDateTime(b));

    return active[0] || allUserBookings.find(b => b.status !== 'Cancelled' && b.status !== 'Completed') || null;
  }, [allUserBookings]);

  const bookingCountdown = useMemo(() => {
    if (!upcomingBooking) return null;
    return computeCountdown(parseBookingDateTime(upcomingBooking));
  }, [upcomingBooking]);

  // 3. Quick Reorder Items from past orders
  const quickReorderDishes = useMemo(() => {
    const dishMap = new Map();
    customerOrders.forEach(ord => {
      (ord.items || []).forEach(it => {
        const foodId = it.foodId || it.id;
        if (!dishMap.has(foodId)) {
          const original = FOODS.find(f => f.id === foodId) || it;
          dishMap.set(foodId, {
            ...original,
            name: it.name || original.name,
            price: it.price || original.price,
            restaurantName: ord.restaurantName || it.restaurantName || 'Zestro Kitchen',
            image: it.image || original.image,
          });
        }
      });
    });
    const result = Array.from(dishMap.values());
    return result.length > 0 ? result.slice(0, 6) : FOODS.slice(0, 4);
  }, [customerOrders]);

  // 4. Favourite Restaurants
  const favouriteRestaurants = useMemo(() => {
    if (wishlistItems.length > 0) {
      const restWish = wishlistItems.filter(w => w.type === 'restaurant' || (!w.foodId && w.cuisine));
      if (restWish.length > 0) return restWish.slice(0, 4);
    }
    return RESTAURANTS.slice(0, 3);
  }, [wishlistItems]);

  // 5. Recent notifications
  const recentNotifs = useMemo(() => {
    return (notifications || []).slice(0, 3);
  }, [notifications]);

  // Reorder handler
  const handleQuickReorderDish = (dish) => {
    dispatch(addToCart({
      foodId: dish.id || dish.foodId,
      name: dish.name,
      price: dish.price,
      restaurantId: dish.restaurantId || 'r1',
      restaurantName: dish.restaurantName || 'Zestro Kitchen',
      image: dish.image,
      qty: 1,
    }));
    showToast(`Added ${dish.name} to cart!`, 'success');
  };

  const handleReorderWholeOrder = (order) => {
    (order.items || []).forEach(it => {
      dispatch(addToCart({
        foodId: it.foodId || it.id,
        name: it.name,
        price: it.price,
        restaurantId: it.restaurantId || order.restaurantId || 'r1',
        restaurantName: order.restaurantName || it.restaurantName || 'Zestro Kitchen',
        image: it.image,
        qty: it.qty || 1,
      }));
    });
    showToast(`Items from order ${order.id} added to cart!`, 'success');
    navigate('/customer/cart');
  };

  const greetingTime = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="customer-dashboard" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '0 4px', boxSizing: 'border-box' }}>
      {/* 1. Welcome Message Banner */}
      <div className="customer-dashboard-hero">
        <h1 className="customer-greeting-title">
          <span>{greetingTime()}, {displayName}!</span>
          <span className="customer-tier-pill" style={{ fontSize: 12, padding: '3px 10px' }}>
            {tier} Member
          </span>
        </h1>
        <p className="customer-greeting-sub">
          Welcome to your personal ZESTRO dining portal. Track your real-time orders, manage live 3D table reservations, and redeem your exclusive DinePoints.
        </p>

        <div className="customer-quick-actions">
          <Link to="/customer/restaurants" className="customer-action-chip primary">
            <Icon name="restaurant" size={16} color="#fff" />
            <span>Explore Restaurants</span>
          </Link>
          <Link to="/book-table" className="customer-action-chip">
            <Icon name="table" size={16} color="var(--accent)" />
            <span>Book a Table</span>
          </Link>
          <Link to="/customer/assistant" className="customer-action-chip">
            <Icon name="sparkles" size={16} color="var(--accent)" />
            <span>AI Dining Concierge</span>
          </Link>
          <Link to="/customer/rewards" className="customer-action-chip">
            <Icon name="rewards" size={16} color="var(--accent)" />
            <span>{dinePoints} DinePoints</span>
          </Link>
        </div>
      </div>

      {/* 1.5. Real-Time GPS Dining Radar & Location Tracker */}
      <div
        className="card"
        style={{
          padding: '16px 22px',
          marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08), rgba(249, 115, 22, 0.02))',
          border: '1px solid rgba(234, 88, 12, 0.2)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 280 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2, #f97316))',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.28)',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            📍
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#22c55e',
                border: '2px solid #fff',
              }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15 }}>
              <span>Real-Time GPS Location</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#16a34a',
                }}
              >
                ● Live GPS
              </span>
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>🛰️ {gpsLocation.address}</span>
              {upcomingBooking && (
                <>
                  <span>•</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                    🚗 {calculateDistance(gpsLocation.latitude, gpsLocation.longitude)} km from {upcomingBooking.restaurantName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {upcomingBooking ? (
            <Link
              to={`/track-booking/${upcomingBooking.bookingNumber || upcomingBooking.id}`}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, borderRadius: 10, padding: '8px 16px' }}
            >
              <Icon name="pulse" size={15} />
              <span>Track Arrival & Route</span>
            </Link>
          ) : (
            <Link
              to="/customer/restaurants"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, borderRadius: 10, padding: '8px 16px' }}
            >
              <span>Explore Nearby Restaurants</span>
            </Link>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={refreshLocation}
            title="Refresh device GPS coordinates"
            style={{ borderRadius: 10, padding: '8px 12px' }}
          >
            🔄 Sync GPS
          </button>
        </div>
      </div>

      {/* 2. Upcoming Table Booking Hero */}
      <div className="customer-section">
        <div className="customer-section-header">
          <h2 className="customer-section-title">
            <Icon name="calendar" size={20} color="var(--accent)" />
            <span>Upcoming Table Booking</span>
          </h2>
          <Link to="/customer/bookings" className="customer-section-link">
            <span>View All Bookings</span>
            <Icon name="arrow-right" size={14} />
          </Link>
        </div>

        {upcomingBooking ? (
          <div className="customer-booking-banner">
            <div className="customer-booking-details">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="customer-booking-restaurant">{upcomingBooking.restaurantName}</span>
                <span className="customer-pin-badge">PIN: {upcomingBooking.pin || upcomingBooking.verificationPin || '4827'}</span>
                <span className={`customer-order-status ${(upcomingBooking.status || 'confirmed').toLowerCase()}`}>
                  {upcomingBooking.status || 'Confirmed'}
                </span>
                {bookingCountdown && (
                  <span className="countdown-pill urgent" style={{ fontSize: 12, padding: '3px 9px' }}>
                    ⏱️ Starts in {bookingCountdown}
                  </span>
                )}
              </div>
              <div className="customer-booking-meta" style={{ marginTop: 4 }}>
                <span>📅 {upcomingBooking.date} at {upcomingBooking.time || upcomingBooking.timeSlot}</span>
                <span>•</span>
                <span>👥 {upcomingBooking.guests} Guests</span>
                <span>•</span>
                <span>🪑 Table {upcomingBooking.tableNumber || upcomingBooking.tableId || 'T12'} ({upcomingBooking.seating || 'Standard AC'})</span>
              </div>
              {upcomingBooking.preOrderItems && upcomingBooking.preOrderItems.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span className="customer-preorder-badge">
                    🍽️ Pre-Ordered Food:
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {upcomingBooking.preOrderItems.map(i => `${i.name} ×${i.qty}`).join(', ')}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                to={`/track-booking/${upcomingBooking.bookingNumber || upcomingBooking.id}`}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Icon name="pulse" size={15} />
                <span>Track Arrival</span>
              </Link>
              <Link
                to="/customer/bookings"
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>Check-In Pass</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <strong style={{ fontSize: 15, display: 'block', color: 'var(--text)' }}>No upcoming reservations</strong>
              <span className="muted" style={{ fontSize: 13 }}>Plan your next dining experience with interactive 3D table seating & food pre-ordering.</span>
            </div>
            <Link to="/book-table" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
              Reserve a Table
            </Link>
          </div>
        )}
      </div>

      {/* 3. Quick Reorder Shelf */}
      <div className="customer-section">
        <div className="customer-section-header">
          <h2 className="customer-section-title">
            <Icon name="refresh" size={20} color="var(--accent)" />
            <span>Quick Reorder</span>
          </h2>
          <span className="muted" style={{ fontSize: 13 }}>From your past favorites</span>
        </div>

        <div className="reorder-shelf">
          {quickReorderDishes.map((dish, idx) => (
            <div key={dish.id || idx} className="reorder-dish-card">
              <SafeImage
                image={dish.image}
                src={dish.image}
                category={dish.category || (dish.name?.toLowerCase().includes('biriyani') ? 'biriyani' : (dish.name?.toLowerCase().includes('rice') || dish.name?.toLowerCase().includes('sambar')) ? 'meals' : 'south-indian')}
                alt={dish.name}
                className="reorder-dish-img"
              />
              <div className="reorder-dish-name" title={dish.name}>{dish.name}</div>
              <div className="muted" style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {dish.restaurantName}
              </div>
              <div className="reorder-dish-meta">
                <span>₹{dish.price}</span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleQuickReorderDish(dish)}
                  style={{ padding: '4px 10px', fontSize: 12, borderRadius: 16 }}
                >
                  + Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Two-Column Layout: Recent Orders & Available Rewards */}
      <div className="customer-two-col customer-section">
        {/* Left Column: Recent Orders */}
        <div>
          <div className="customer-section-header">
            <h2 className="customer-section-title">
              <Icon name="orders" size={20} color="var(--accent)" />
              <span>Recent Orders</span>
            </h2>
            <Link to="/customer/orders" className="customer-section-link">
              <span>View All</span>
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {customerOrders.slice(0, 3).map((ord) => {
              const statusClass = (ord.status || 'placed').toLowerCase().replace(/\s+/g, '-');
              return (
                <div key={ord.id} className="customer-order-card">
                  <div className="customer-order-header">
                    <div>
                      <span className="customer-order-id">{ord.id}</span>
                      <div className="muted" style={{ fontSize: 11 }}>{ord.restaurantName}</div>
                    </div>
                    <span className={`customer-order-status ${statusClass}`}>
                      {ord.status || 'Placed'}
                    </span>
                  </div>

                  <div className="customer-order-body">
                    {(ord.items || []).map(i => `${i.name} (×${i.qty || 1})`).join(', ') || 'Assorted Dishes'}
                  </div>

                  <div className="customer-order-footer">
                    <span className="customer-order-total">₹{ord.grandTotal || ord.total || 450}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link to={`/track-order/${ord.id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: 12 }}>
                        Track
                      </Link>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleReorderWholeOrder(ord)}
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        Reorder
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Available Rewards & Important Notifications */}
        <div>
          {/* Rewards Summary Card */}
          <div className="customer-section-header">
            <h2 className="customer-section-title">
              <Icon name="rewards" size={20} color="var(--accent)" />
              <span>DinePoints &amp; Rewards</span>
            </h2>
            <Link to="/customer/rewards" className="customer-section-link">
              <span>Rewards Portal</span>
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>

          <div className="card" style={{ padding: 18, marginBottom: 20, background: 'var(--bg-elevated)', borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Active Balance</span>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', lineHeight: 1.1 }}>
                  {dinePoints} <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>DinePoints</span>
                </div>
              </div>
              <span className="customer-tier-pill" style={{ padding: '4px 12px', fontSize: 12 }}>
                {tier} Tier
              </span>
            </div>

            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}>
              Redeemable for discount vouchers, culinary mystery gifts, and complimentary dining privileges.
            </div>

            {vouchers.length > 0 && (
              <div style={{ background: 'color-mix(in srgb, var(--accent) 8%, var(--bg))', padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                  🎟️ {vouchers[0].code} — {vouchers[0].desc || '15% OFF on next reservation'}
                </span>
                <Link to="/customer/offers" className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: 11 }}>
                  Apply
                </Link>
              </div>
            )}
          </div>

          {/* Important Notifications */}
          <div className="customer-section-header">
            <h2 className="customer-section-title">
              <Icon name="notifications" size={20} color="var(--accent)" />
              <span>Important Notifications</span>
            </h2>
            <Link to="/customer/notifications" className="customer-section-link">
              <span>All</span>
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>

          <div>
            {recentNotifs.length > 0 ? (
              recentNotifs.map((n, idx) => (
                <div key={n.id || idx} className="customer-notif-item">
                  <div className="customer-notif-icon">
                    <Icon name={n.type === 'booking' ? 'calendar' : n.type === 'email' ? 'mail' : 'notifications'} size={16} color="var(--accent)" />
                  </div>
                  <div className="customer-notif-content">
                    <div className="customer-notif-title">{n.title}</div>
                    <div className="customer-notif-msg">{n.message}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted" style={{ fontSize: 13 }}>No unread notifications.</p>
            )}
          </div>
        </div>
      </div>

      {/* 5. Favourite Restaurants & Recently Viewed */}
      <div className="customer-two-col customer-section">
        {/* Favourite Restaurants */}
        <div>
          <div className="customer-section-header">
            <h2 className="customer-section-title">
              <Icon name="restaurant" size={20} color="var(--accent)" />
              <span>Favourite Restaurants</span>
            </h2>
            <Link to="/customer/wishlist" className="customer-section-link">
              <span>View Wishlist</span>
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {favouriteRestaurants.map((r, i) => (
              <div key={r.id || i} className="card" style={{ padding: 12, borderRadius: 12 }}>
                <SafeImage src={r.image} alt={r.name} style={{ width: '100%', height: 110, borderRadius: 8, objectFit: 'cover' }} />
                <strong style={{ fontSize: 14, display: 'block', marginTop: 8 }}>{r.name}</strong>
                <span className="muted" style={{ fontSize: 12 }}>{r.cuisine || 'South Indian • Tiffin'}</span>
                <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                  <Link to={`/restaurant/${r.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '4px', fontSize: 11, textAlign: 'center' }}>
                    Menu
                  </Link>
                  <Link to={`/book-table/${r.id}`} className="btn btn-primary btn-sm" style={{ flex: 1, padding: '4px', fontSize: 11, textAlign: 'center' }}>
                    Book
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Viewed */}
        <div>
          <div className="customer-section-header">
            <h2 className="customer-section-title">
              <Icon name="clock" size={20} color="var(--accent)" />
              <span>Recently Viewed</span>
            </h2>
            <Link to="/customer/recently-viewed" className="customer-section-link">
              <span>See History</span>
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>

          {recentlyViewed.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {recentlyViewed.slice(0, 2).map((item, idx) => (
                <div key={item.id || idx} className="card" style={{ padding: 12, borderRadius: 12 }}>
                  <SafeImage src={item.image} alt={item.name} style={{ width: '100%', height: 110, borderRadius: 8, objectFit: 'cover' }} />
                  <strong style={{ fontSize: 14, display: 'block', marginTop: 8 }}>{item.name}</strong>
                  <span className="muted" style={{ fontSize: 12 }}>₹{item.price || 150} • {item.restaurantName || 'Zestro Kitchen'}</span>
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm btn-block"
                      onClick={() => handleQuickReorderDish(item)}
                      style={{ fontSize: 11, padding: '5px' }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <span className="muted" style={{ fontSize: 13 }}>Items and restaurants you view will appear here for fast access.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
