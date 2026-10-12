import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { cancelBooking, modifyBooking } from '../redux/slices/bookingSlice';
import { addNotification } from '../redux/slices/notificationSlice';
import bookingApiService from '../services/bookingApiService';
import ConfirmationModal from '../components/ConfirmationModal';
import Pagination from '../components/Pagination';
import QrCodeSvg from '../components/QrCodeSvg';
import Icon from '../components/Icon';
import { useToast } from '../contexts/ToastContext';
import { SEATING_OPTIONS, TIME_SLOTS } from '../data/mockData';
import './MyBookings.css';

function bookingDateTime(b) {
  if (!b || !b.date) return new Date();
  if (!b.time && !b.timeSlot) return new Date(b.date);
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

function formatCountdown(targetDate) {
  const diffMs = targetDate - new Date();
  if (diffMs <= 0) return null;
  const diffMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(diffMinutes / 1440);
  const hours = Math.floor((diffMinutes % 1440) / 60);
  const minutes = diffMinutes % 60;

  if (days > 0) return `Starts in ${days}d ${hours}h`;
  if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
  return `Starts in ${minutes}m`;
}

export default function MyBookings() {
  const reduxBookings = useSelector(s => s.booking.bookings);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [tab, setTab] = useState('Upcoming');
  const [backendBookings, setBackendBookings] = useState([]);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals & Action States
  const [cancelId, setCancelId] = useState(null);
  const [qrModalBooking, setQrModalBooking] = useState(null);
  const [rescheduleBookingTarget, setRescheduleBookingTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleGuests, setRescheduleGuests] = useState(2);
  const [rescheduling, setRescheduling] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Clock tick for live countdown refresh
  const [, setClock] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 30000); // refresh every 30s
    return () => clearInterval(timer);
  }, []);

  // Fetch real bookings & waitlist from MongoDB backend
  const loadLiveBookings = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, waitlistRes] = await Promise.all([
        bookingApiService.getMyBookings(),
        bookingApiService.getMyWaitlist(),
      ]);

      if (bookingsRes && bookingsRes.success && Array.isArray(bookingsRes.data)) {
        setBackendBookings(bookingsRes.data);
      }
      if (waitlistRes && waitlistRes.success && Array.isArray(waitlistRes.data)) {
        setWaitlistEntries(waitlistRes.data);
      }
    } catch (err) {
      console.warn('Error syncing bookings from backend:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLiveBookings();
  }, [loadLiveBookings]);

  // Merge redux bookings and backend bookings into unique list
  const mergedBookings = useMemo(() => {
    const map = new Map();
    // Prioritize backend data
    backendBookings.forEach(b => {
      const key = b.bookingNumber || b.id || b._id;
      map.set(key, { ...b, id: key });
    });
    // Supplement with redux bookings
    reduxBookings.forEach(b => {
      const key = b.bookingNumber || b.id || b._id;
      if (!map.has(key)) {
        map.set(key, { ...b, id: key });
      }
    });
    return Array.from(map.values()).sort((a, b) => bookingDateTime(b) - bookingDateTime(a));
  }, [backendBookings, reduxBookings]);

  // Tab filtering
  const now = new Date();
  const filtered = useMemo(() => {
    return mergedBookings.filter(b => {
      const isPast = bookingDateTime(b) < now;
      if (tab === 'Upcoming') {
        return !isPast && b.status !== 'Cancelled' && b.status !== 'Completed';
      }
      if (tab === 'Requested') {
        return b.status === 'Requested';
      }
      if (tab === 'Confirmed') {
        return b.status === 'Confirmed' || b.status === 'Table Ready';
      }
      if (tab === 'Completed') {
        return b.status === 'Completed' || (isPast && b.status !== 'Cancelled');
      }
      if (tab === 'Cancelled') {
        return b.status === 'Cancelled' || b.status === 'No Show';
      }
      return true;
    });
  }, [mergedBookings, tab, now]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab]);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Real backend cancel
  const doCancel = async () => {
    if (!cancelId) return;
    try {
      const res = await bookingApiService.cancelBooking(cancelId, 'Customer Request');
      dispatch(cancelBooking(cancelId));
      dispatch(addNotification({
        type: 'booking',
        title: 'Booking Cancelled',
        message: `Reservation ${cancelId} has been cancelled. Any waitlisted diners will be notified.`,
      }));
      showToast('Reservation successfully cancelled.', 'info');
      setBackendBookings(prev => prev.map(b => (b.id === cancelId || b.bookingNumber === cancelId) ? { ...b, status: 'Cancelled' } : b));
    } catch (err) {
      showToast('Error cancelling booking: ' + err.message, 'error');
    } finally {
      setCancelId(null);
    }
  };

  // Open reschedule dialog
  const openReschedule = (b) => {
    setRescheduleBookingTarget(b);
    setRescheduleDate(b.date || new Date().toISOString().slice(0, 10));
    setRescheduleTime(b.time || b.timeSlot || '7:30 PM');
    setRescheduleGuests(b.guests || 2);
  };

  // Submit reschedule to backend
  const handleSaveReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleBookingTarget) return;
    setRescheduling(true);
    try {
      const res = await bookingApiService.rescheduleBooking(rescheduleBookingTarget.id || rescheduleBookingTarget.bookingNumber, {
        date: rescheduleDate,
        timeSlot: rescheduleTime,
        guests: Number(rescheduleGuests),
        seatingArea: rescheduleBookingTarget.seating || 'Indoor',
      });

      if (res && res.conflict) {
        showToast(res.message || 'The selected slot has no available tables. Please choose another time.', 'error');
        setRescheduling(false);
        return;
      }

      if (res && res.success) {
        dispatch(modifyBooking({
          id: rescheduleBookingTarget.id,
          changes: {
            date: rescheduleDate,
            time: rescheduleTime,
            timeSlot: rescheduleTime,
            guests: rescheduleGuests,
          },
        }));
        showToast('Reservation rescheduled successfully!', 'success');
        setRescheduleBookingTarget(null);
        loadLiveBookings();
      } else {
        showToast(res?.message || 'Failed to reschedule reservation', 'error');
      }
    } catch (err) {
      showToast('Reschedule error: ' + err.message, 'error');
    } finally {
      setRescheduling(false);
    }
  };

  const upcomingSoon = mergedBookings.find(b => {
    if (b.status === 'Cancelled' || b.status === 'Completed') return false;
    const diffMin = (bookingDateTime(b) - now) / 60000;
    return diffMin > 0 && diffMin <= 90;
  });

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '16px clamp(12px, 2vw, 24px) 60px', boxSizing: 'border-box' }}>
      <div className="bookings-page-header">
        <h1 className="bookings-page-title">
          <Icon name="table" size={28} color="var(--accent)" />
          <span>My Table Reservations</span>
        </h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/book-table')}
        >
          + Book New Table
        </button>
      </div>

      {/* Urgent Upcoming Banner */}
      {upcomingSoon && (
        <div
          className="card"
          style={{
            padding: '16px 20px',
            marginBottom: 20,
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, var(--bg-elevated)), var(--bg-elevated))',
            border: '1.5px solid var(--accent)',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>⏰</span>
            <div>
              <strong style={{ fontSize: 15, display: 'block' }}>
                Your table at {upcomingSoon.restaurantName} is coming up!
              </strong>
              <span className="muted" style={{ fontSize: 13 }}>
                Starts in {Math.round((bookingDateTime(upcomingSoon) - now) / 60000)} minutes • Table {upcomingSoon.tableNumber || upcomingSoon.tableId || 'T-06'}
              </span>
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setQrModalBooking(upcomingSoon)}
          >
            Show Check-In Pass
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bookings-tab-bar">
        {[
          { key: 'Upcoming', label: 'Upcoming' },
          { key: 'Requested', label: 'Requested' },
          { key: 'Confirmed', label: 'Confirmed' },
          { key: 'Completed', label: 'Completed' },
          { key: 'Cancelled', label: 'Cancelled' },
          { key: 'Waitlist', label: 'Smart Waitlist', count: waitlistEntries.length },
        ].map(t => (
          <button
            key={t.key}
            className={`bookings-tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span>{t.label}</span>
            {t.count !== undefined && t.count > 0 && (
              <span className="tab-badge-count">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* SMART WAITLIST TAB VIEW */}
      {tab === 'Waitlist' ? (
        waitlistEntries.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
            <Icon name="pulse" size={42} color="var(--text-muted)" />
            <h3 style={{ marginTop: 12 }}>No Active Waitlists</h3>
            <p className="muted">You are not currently in any restaurant waitlist queues.</p>
          </div>
        ) : (
          <div>
            {waitlistEntries.map(w => (
              <div key={w._id || w.waitlistNumber} className="waitlist-item-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 17 }}>{w.restaurantName || 'Restaurant'}</h3>
                    <span className="waitlist-num-badge">
                      Queue #{w.waitlistNumber || 'WL-01'}
                    </span>
                  </div>
                  <div className="booking-meta-line" style={{ marginTop: 6 }}>
                    <span>📅 {w.preferredDate}</span>
                    <span>⏰ {w.preferredTimeSlot}</span>
                    <span>👥 {w.guests} Guests</span>
                    <span>🪑 {w.seatingArea || 'Any'} Section</span>
                  </div>
                  <p className="muted" style={{ margin: '8px 0 0', fontSize: 12.5 }}>
                    Status: <strong style={{ color: w.status === 'Allocated' ? 'var(--success)' : 'var(--accent)' }}>{w.status || 'Waiting'}</strong> • You will receive an immediate email notification when a matching table opens up!
                  </p>
                </div>
                {w.status === 'Allocated' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/book-table/${w.restaurantId}`)}
                  >
                    Claim Table
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
          <Icon name="table" size={42} color="var(--text-muted)" />
          <h3 style={{ marginTop: 12 }}>No {tab} Bookings Found</h3>
          <p className="muted">You do not have any reservations in this category.</p>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginTop: 12 }}
            onClick={() => navigate('/book-table')}
          >
            Book a Table Now
          </button>
        </div>
      ) : (
        <>
          {paginatedBookings.map(b => {
            const bDate = bookingDateTime(b);
            const countdownText = formatCountdown(bDate);
            const isImminent = countdownText && countdownText.includes('m') && !countdownText.includes('h');
            const pin = b.pin || b.verificationPin || '4827';
            const tableNo = b.tableNumber || b.tableId || 'Table 06';

            return (
              <div key={b.id || b._id} className="booking-item-card">
                <div className="booking-card-main-row">
                  <div className="booking-res-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h3>{b.restaurantName}</h3>
                      <span
                        className="rating-chip"
                        style={{
                          background: b.status === 'Cancelled' ? 'var(--danger)'
                            : b.status === 'Completed' ? 'var(--success)'
                            : b.status === 'Confirmed' ? '#4361ee'
                            : b.status === 'Table Ready' ? 'var(--accent)'
                            : b.status === 'Customer Arrived' ? '#f72585'
                            : b.status === 'Dining' ? '#fb8500'
                            : 'var(--text-muted)'
                        }}
                      >
                        {b.status || 'Confirmed'}
                      </span>
                      {countdownText && (
                        <span className={`countdown-pill ${isImminent ? 'urgent' : ''}`}>
                          ⏱️ {countdownText}
                        </span>
                      )}
                    </div>

                    <div className="booking-meta-line">
                      <span>Ref: <strong>{b.bookingNumber || b.id}</strong></span>
                      <span>•</span>
                      <span>📅 {b.date} at {b.time || b.timeSlot}</span>
                      <span>•</span>
                      <span>👥 {b.guests} Guests</span>
                      <span>•</span>
                      <span>🪑 {tableNo} ({b.seating || 'Standard'})</span>
                    </div>

                    {b.preOrderItems && b.preOrderItems.length > 0 && (
                      <div style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 700, marginTop: 6 }}>
                        🍽️ Pre-Ordered: {b.preOrderItems.map(i => `${i.name} (×${i.qty})`).join(', ')}
                      </div>
                    )}
                  </div>

                  {/* QR Check-in Pass Button & PIN */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <button
                      type="button"
                      className="qr-pass-trigger-btn"
                      onClick={() => setQrModalBooking(b)}
                    >
                      <Icon name="qr-code" size={16} />
                      <span>Contactless Pass</span>
                    </button>
                    <span className="booking-pin-badge">
                      PIN: {pin}
                    </span>
                  </div>
                </div>

                {/* Status Guidance Banner */}
                {b.status === 'Confirmed' && (
                  <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'color-mix(in srgb, #4361ee 12%, var(--bg-elevated))', border: '1px solid #4361ee', color: '#4361ee', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>✓</span>
                    <span>Your table booking has been confirmed with assigned table {tableNo}.</span>
                  </div>
                )}
                {b.status === 'Requested' && (
                  <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'color-mix(in srgb, #eab308 14%, var(--bg-elevated))', border: '1px solid #eab308', color: '#ca8a04', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>⏳</span>
                    <span>Booking request submitted. Restaurant host will confirm shortly.</span>
                  </div>
                )}
                {b.status === 'Table Ready' && (
                  <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'color-mix(in srgb, var(--accent) 12%, var(--bg-elevated))', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🍽️</span>
                    <span>Your table {tableNo} is ready! Please proceed to the restaurant host.</span>
                  </div>
                )}
                {b.status === 'Customer Arrived' && (
                  <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'color-mix(in srgb, #f72585 12%, var(--bg-elevated))', border: '1px solid #f72585', color: '#f72585', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>👋</span>
                    <span>Welcome! The restaurant host is seating your party.</span>
                  </div>
                )}
                {b.status === 'Dining' && (
                  <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'color-mix(in srgb, #fb8500 12%, var(--bg-elevated))', border: '1px solid #fb8500', color: '#fb8500', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🍲</span>
                    <span>Currently dining. Enjoy your fresh meal and service!</span>
                  </div>
                )}
                {b.status === 'Completed' && (
                  <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'color-mix(in srgb, var(--success) 12%, var(--bg-elevated))', border: '1px solid var(--success)', color: 'var(--success)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>★</span>
                    <span>Thank you for dining with ZESTRO! We hope you loved the experience.</span>
                  </div>
                )}
                {b.status === 'Cancelled' && (
                  <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'color-mix(in srgb, var(--danger) 12%, var(--bg-elevated))', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>✕</span>
                    <span>This reservation has been cancelled.</span>
                  </div>
                )}

                {/* Actions Row */}
                <div className="booking-actions-row">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => navigate(`/booking-success/${b.bookingNumber || b.id}`)}
                  >
                    View Details
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => navigate(`/track-booking/${b.bookingNumber || b.id}`)}
                  >
                    Live Journey
                  </button>

                  {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                    <>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => openReschedule(b)}
                      >
                        Reschedule
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => setCancelId(b.id || b.bookingNumber)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          <Pagination
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
            itemName="reservations"
          />
        </>
      )}

      {/* Confirmation Modal for Cancel */}
      <ConfirmationModal
        open={!!cancelId}
        title="Cancel Table Reservation?"
        message="Are you sure you want to cancel this booking? The table will be immediately offered to our smart waitlist queue."
        confirmLabel="Confirm Cancellation"
        danger
        onCancel={() => setCancelId(null)}
        onConfirm={doCancel}
      />

      {/* Contactless Check-In Pass Modal */}
      {qrModalBooking && (
        <div className="zestro-modal-backdrop" onClick={() => setQrModalBooking(null)}>
          <div className="zestro-modal-card qr-modal-dialog" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Contactless Check-In Pass</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setQrModalBooking(null)}
              >
                ✕
              </button>
            </div>

            <p className="muted" style={{ fontSize: 13, margin: '8px 0 0' }}>
              Show this pass to the host at <strong>{qrModalBooking.restaurantName}</strong>
            </p>

            <div className="qr-code-frame">
              <QrCodeSvg
                value={`ZESTRO-CHECKIN:${qrModalBooking.bookingNumber || qrModalBooking.id}:PIN:${qrModalBooking.pin || qrModalBooking.verificationPin || '4827'}`}
                size={160}
              />
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Express Check-In PIN
            </div>
            <div className="qr-pin-display">
              {String(qrModalBooking.pin || qrModalBooking.verificationPin || '4827').padStart(4, '0').split('').map((char, i) => (
                <div key={i} className="qr-pin-char">{char}</div>
              ))}
            </div>

            <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: 10, fontSize: 13, textAlign: 'left', lineHeight: 1.5 }}>
              <div><strong>Table:</strong> {qrModalBooking.tableNumber || qrModalBooking.tableId || 'Table 06'}</div>
              <div><strong>Slot:</strong> {qrModalBooking.date} at {qrModalBooking.time || qrModalBooking.timeSlot}</div>
              <div><strong>Party:</strong> {qrModalBooking.guests} Guests</div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 16 }}
              onClick={() => setQrModalBooking(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Reschedule Booking Modal */}
      {rescheduleBookingTarget && (
        <div className="zestro-modal-backdrop" onClick={() => setRescheduleBookingTarget(null)}>
          <div className="zestro-modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Reschedule Table</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setRescheduleBookingTarget(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReschedule}>
              <div className="input-group">
                <label>Restaurant</label>
                <input
                  type="text"
                  readOnly
                  value={rescheduleBookingTarget.restaurantName}
                  style={{ background: 'var(--bg)' }}
                />
              </div>

              <div className="input-group">
                <label>New Reservation Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  required
                />
              </div>

              <div className="input-group">
                <label>New Time Slot</label>
                <div className="chip-row">
                  {TIME_SLOTS.map(s => (
                    <button
                      key={s.time}
                      type="button"
                      className={`chip ${rescheduleTime === s.time ? 'active' : ''}`}
                      onClick={() => setRescheduleTime(s.time)}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>Guests</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setRescheduleGuests(g => Math.max(1, g - 1))}
                  >
                    −
                  </button>
                  <strong>{rescheduleGuests} Guests</strong>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setRescheduleGuests(g => g + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setRescheduleBookingTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={rescheduling}
                >
                  {rescheduling ? 'Checking Availability...' : 'Confirm New Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
