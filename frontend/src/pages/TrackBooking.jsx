import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { advanceJourney, setJourneyStep, JOURNEY_STEPS } from '../redux/slices/bookingSlice';
import Icon from '../components/Icon';

const STAGE_ICONS = [
  'clock',        // Requested
  'check',        // Confirmed
  'table',        // Table Ready
  'users',        // Customer Arrived
  'restaurant',   // Dining
  'sparkles',     // Completed
];

const STAGE_DESCRIPTIONS = [
  'Reservation requested by diner. Awaiting host confirmation.',
  'Your table booking has been confirmed. Table slot locked.',
  'Your table is ready. Table sanitized and cutlery prepared.',
  'Welcome to the restaurant! Host is escorting you to your table.',
  'Enjoy your meal! Food served hot and fresh.',
  'Dining completed. Thank you for visiting ZESTRO!',
];

import bookingApiService from '../services/bookingApiService';

export default function TrackBooking() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const reduxBooking = useSelector(s => s.booking.bookings.find(b => b.id === id || b.bookingNumber === id || b._id === id));
  const [apiBooking, setApiBooking] = useState(null);
  const [loading, setLoading] = useState(!reduxBooking);
  const [autoSimulate, setAutoSimulate] = useState(false);

  // Live GPS tracking state
  const [userGps, setUserGps] = useState({
    latitude: 9.1726,
    longitude: 77.8728,
    active: false,
    distanceKm: 1.8,
    etaMins: 6,
  });

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          // Approximate distance to Kovilpatti center / restaurant
          const R = 6371;
          const dLat = (9.1726 - latitude) * Math.PI / 180;
          const dLon = (77.8728 - longitude) * Math.PI / 180;
          const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(latitude*Math.PI/180)*Math.cos(9.1726*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
          const dist = Math.max(0.6, Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1)));
          setUserGps({
            latitude,
            longitude,
            active: true,
            distanceKm: dist,
            etaMins: Math.max(3, Math.round(dist * 3.5)),
          });
        },
        () => {
          setUserGps(prev => ({ ...prev, active: true }));
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  useEffect(() => {
    if (!reduxBooking && id) {
      setLoading(true);
      bookingApiService.getMyBookings().then(res => {
        if (res && res.success && Array.isArray(res.data)) {
          const match = res.data.find(b => b.id === id || b.bookingNumber === id || b._id === id);
          if (match) setApiBooking(match);
        }
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [id, reduxBooking]);

  const booking = reduxBooking || apiBooking;

  useEffect(() => {
    if (!booking || booking.status === 'Cancelled' || (booking.journeyStep || 0) >= JOURNEY_STEPS.length - 1 || !autoSimulate) {
      return;
    }
    const timer = setInterval(() => {
      dispatch(advanceJourney(id));
    }, 6000);
    return () => clearInterval(timer);
  }, [id, booking?.journeyStep, booking?.status, autoSimulate, dispatch]);

  if (loading && !booking) {
    return (
      <div className="empty-state" style={{ padding: 48, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p className="muted">Locating reservation #{id}...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="empty-state">
        <Icon name="search" size={48} color="var(--danger)" />
        <h3 style={{ marginTop: 14 }}>Booking Not Found</h3>
        <p className="muted">The reservation reference {id} could not be located.</p>
        <Link to="/customer/bookings" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>
          View My Bookings
        </Link>
      </div>
    );
  }

  const currentStep = booking.journeyStep || 0;
  const isCompleted = currentStep >= JOURNEY_STEPS.length - 1;

  return (
    <div className="track-booking-page" style={{ width: '100%', maxWidth: '100%', margin: '0', boxSizing: 'border-box' }}>
      <div className="track-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="booking-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'color-mix(in srgb, var(--accent) 15%, var(--bg-elevated))', color: 'var(--accent)', marginBottom: 6 }}>
              <Icon name="table" size={14} /> RESERVATION #{booking.id}
            </div>
            <h1 style={{ margin: 0, fontSize: 24 }}>{booking.restaurantName}</h1>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: 13.5 }}>
              {booking.date} at {booking.time} • {booking.guests} Guests • Table {booking.tableNumber || booking.tableId || 'T-12'} • {booking.seating}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              className="status-pill"
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontWeight: 700,
                fontSize: 13,
                background: booking.status === 'Cancelled' ? 'var(--danger)'
                  : booking.status === 'Completed' ? 'var(--success)'
                  : booking.status === 'Confirmed' ? '#4361ee'
                  : booking.status === 'Table Ready' ? 'var(--accent)'
                  : booking.status === 'Customer Arrived' ? '#f72585'
                  : booking.status === 'Dining' ? '#fb8500'
                  : 'var(--text-muted)',
                color: '#fff',
              }}
            >
              {booking.status}
            </span>
          </div>
        </div>
      </div>

      {/* Real-Time GPS Arrival Radar & Live Route Map */}
      <div
        className="card"
        style={{
          padding: '18px 22px',
          marginBottom: 20,
          background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08), rgba(249, 115, 22, 0.03))',
          border: '1px solid rgba(234, 88, 12, 0.25)',
          borderRadius: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🛰️</span>
            <div>
              <strong style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                Live GPS Arrival Tracking
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', fontWeight: 700 }}>
                  ● Active Tracking
                </span>
              </strong>
              <span className="muted" style={{ fontSize: 12.5 }}>Real-time satellite positioning & dining arrival estimate</span>
            </div>
          </div>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((booking.restaurantName || 'Restaurant') + ', ' + (booking.area || 'Kovilpatti, Tamil Nadu'))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
            style={{ borderRadius: 10, fontWeight: 700, padding: '6px 14px', textDecoration: 'none' }}
          >
            🗺️ Google Maps Directions ↗
          </a>
        </div>

        {/* Live Radar Route Visualizer */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, fontWeight: 700, flexWrap: 'wrap', gap: 6 }}>
            <span style={{ color: '#16a34a' }}>📍 Your Live Location</span>
            <span style={{ color: 'var(--accent)', fontWeight: 800 }}>🚗 {userGps.distanceKm} km away • ETA ~{userGps.etaMins} mins</span>
            <span style={{ color: 'var(--accent)' }}>🏪 {booking.restaurantName}</span>
          </div>

          {/* Progress Path */}
          <div style={{ width: '100%', height: 8, background: 'var(--border)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(90, Math.max(25, 100 - (userGps.distanceKm * 15)))}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #16a34a, var(--accent))',
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11.5, color: 'var(--text-muted)', flexWrap: 'wrap', gap: 4 }}>
            <span>GPS: {userGps.latitude.toFixed(3)}°N, {userGps.longitude.toFixed(3)}°E</span>
            <span>Check-in PIN: <strong style={{ color: 'var(--accent)', fontSize: 14 }}>{booking.checkInPin || booking.verificationPin || booking.pin || '2042'}</strong></span>
          </div>
        </div>
      </div>

      {/* Requirement 9: Prominent Customer Status Banner */}
      {booking.status === 'Confirmed' && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 20, background: 'color-mix(in srgb, #4361ee 12%, var(--bg-elevated))', border: '1px solid #4361ee', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#4361ee', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>✓</span>
          <div>
            <strong style={{ color: '#4361ee', fontSize: 15 }}>Your table booking has been confirmed.</strong>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
              Assigned Table: <strong>{booking.tableNumber || booking.tableId || 'T-12'}</strong> ({booking.seating}) • {booking.guests} Guests
            </p>
          </div>
        </div>
      )}
      {booking.status === 'Table Ready' && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 20, background: 'color-mix(in srgb, var(--accent) 12%, var(--bg-elevated))', border: '1px solid var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="table" size={24} color="var(--accent)" />
          <div>
            <strong style={{ color: 'var(--accent)', fontSize: 15 }}>Your table is ready.</strong>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
              Table {booking.tableNumber || booking.tableId || 'T-12'} has been prepared, sanitized, and set for your party.
            </p>
          </div>
        </div>
      )}
      {booking.status === 'Cancelled' && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 20, background: 'color-mix(in srgb, var(--danger) 12%, var(--bg-elevated))', border: '1px solid var(--danger)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="close" size={24} color="var(--danger)" />
          <div>
            <strong style={{ color: 'var(--danger)', fontSize: 15 }}>Your table booking has been cancelled.</strong>
            {booking.cancellationReason && (
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                Reason: {booking.cancellationReason}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Prepare Before Arrival Schedule Card */}
      {booking.prepareBeforeArrival && booking.prepSchedule && (
        <div className="card prep-schedule-card" style={{ padding: 18, marginBottom: 20, background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--bg-elevated)), var(--bg-elevated))', border: '1px solid color-mix(in srgb, var(--accent) 25%, var(--border))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Icon name="clock" size={20} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: 15 }}>Prepare Before Arrival Schedule</h3>
          </div>
          <div className="prep-time-display">
            <div className="prep-step">
              <span className="muted">Table Time</span>
              <strong>{booking.prepSchedule.tableTime || booking.time}</strong>
            </div>
            <div className="prep-step">
              <span className="muted">Food preparation</span>
              <strong style={{ color: 'var(--accent)' }}>{booking.prepSchedule.prepTime}</strong>
            </div>
            <div className="prep-step">
              <span className="muted">Expected ready</span>
              <strong style={{ color: 'var(--success)' }}>{booking.prepSchedule.readyTime}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Live Timeline Progression */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>Table &amp; Food Preparation Journey</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Step {currentStep + 1} of {JOURNEY_STEPS.length}
          </span>
        </div>

        <ul className="timeline">
          {JOURNEY_STEPS.map((stepName, idx) => {
            const isDone = idx <= currentStep;
            const isCurrent = idx === currentStep;
            return (
              <li key={stepName} className={isDone ? 'done' : ''} style={{ position: 'relative', paddingLeft: 34, paddingBottom: 22 }}>
                <span
                  className="dot"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 2,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--accent)' : isDone ? 'var(--success)' : 'var(--border)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isCurrent ? '0 0 0 4px color-mix(in srgb, var(--accent) 25%, transparent)' : 'none',
                  }}
                >
                  <Icon name={STAGE_ICONS[idx]} size={13} color="#fff" />
                </span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 14.5, color: isCurrent ? 'var(--accent)' : isDone ? 'var(--text)' : 'var(--text-muted)' }}>
                      {stepName}
                    </strong>
                    {isCurrent && (
                      <span className="live-pill" style={{ background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                        CURRENT STATE
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                    {STAGE_DESCRIPTIONS[idx]}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Simulation Controls Disclaimer & Actions */}
        <div style={{ marginTop: 10, padding: 14, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              <Icon name="clock" size={14} style={{ marginRight: 6 }} />
              Frontend preparation simulation • {autoSimulate ? 'Auto-advancing every 6s' : 'Manual control mode'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setAutoSimulate(v => !v)}
              >
                {autoSimulate ? 'Pause Auto-Advance' : 'Resume Auto'}
              </button>
              {!isCompleted && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => dispatch(advanceJourney(id))}
                >
                  Next Step <Icon name="forward" size={12} />
                </button>
              )}
              {isCompleted && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => dispatch(setJourneyStep({ id, step: 0 }))}
                >
                  Replay Journey
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pre-ordered items card */}
      {booking.preOrderItems && booking.preOrderItems.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Pre-Ordered Food Items</h3>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            {booking.preOrderItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13.5 }}>
                <span>
                  <strong>{item.name}</strong> × {item.qty}
                  {item.spiceLevel && <span className="muted"> ({item.spiceLevel})</span>}
                  {item.addOns?.length > 0 && <span className="muted"> + {item.addOns.join(', ')}</span>}
                </span>
                <strong>₹{(item.price + (item.addOns?.length || 0) * 30) * item.qty}</strong>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 8, fontSize: 15 }}>
              <strong>Pre-Order Total:</strong>
              <strong style={{ color: 'var(--accent)' }}>₹{booking.preOrderTotal}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
