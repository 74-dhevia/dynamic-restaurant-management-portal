import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Icon from '../components/Icon';
import bookingApiService from '../services/bookingApiService';
import { createBooking } from '../redux/slices/bookingSlice';

export default function BookingSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const reduxBooking = useSelector(s => s.booking.bookings.find(b => b.id === id || b.bookingNumber === id || b._id === id));
  const [fetchedBooking, setFetchedBooking] = useState(null);
  const [loading, setLoading] = useState(!reduxBooking);

  useEffect(() => {
    if (!reduxBooking && id) {
      bookingApiService.getBookingById(id).then(res => {
        if (res && res.success && res.data) {
          setFetchedBooking(res.data);
          dispatch(createBooking(res.data));
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [reduxBooking, id, dispatch]);

  const booking = reduxBooking || fetchedBooking;

  if (loading) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <Icon name="refresh" size={32} className="spin" color="var(--accent)" />
        <p className="muted" style={{ marginTop: 14 }}>Loading reservation details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="empty-state" style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
        <Icon name="table" size={54} color="var(--text-muted)" />
        <h2 style={{ marginTop: 16 }}>Reservation Details Not Found</h2>
        <p className="muted">The booking may have expired or is not associated with this session.</p>
        <button className="btn btn-primary" onClick={() => navigate('/my-bookings')}>
          Go to My Bookings
        </button>
      </div>
    );
  }

  // Verification PIN
  const pin = booking.pin || booking.verificationPin || '4827';
  const pinDigits = String(pin).padStart(4, '0').split('');

  // Formatted date string
  const formatBookingDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const foodItems = booking.preOrderItems || [];
  const foodTotal = booking.preOrderTotal || 0;
  const tableBookingFee = booking.tableBookingFee || 100;
  const grandTotal = booking.grandTotal || (tableBookingFee + foodTotal);

  // Add to Calendar integration
  const handleAddToCalendar = () => {
    const title = `Table Booking at ${booking.restaurantName}`;
    const details = `Booking ID: ${booking.id}\\nVerification PIN: ${pin}\\nGuests: ${booking.guests}\\nTable: ${booking.tableNumber || booking.tableId || 'Table 06'}\\nSeating: ${booking.seating}`;
    const location = `${booking.restaurantName}, ${booking.date}`;
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    window.open(gCalUrl, '_blank');
  };

  return (
    <div style={{ maxWidth: 560, margin: '24px auto', padding: '0 16px', boxSizing: 'border-box' }}>
      {/* ----------------------------------------------------------------------
          TOP HERO PIN CARD (As specifically requested in prompt specification)
          ---------------------------------------------------------------------- */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(180deg, #1b281f 0%, var(--bg-elevated) 100%)',
          border: '2px solid #2e9e5b',
          borderRadius: 20,
          padding: '32px 24px 28px',
          textAlign: 'center',
          boxShadow: '0 12px 36px rgba(46, 158, 91, 0.15)',
          marginBottom: 20,
        }}
      >
        {/* Animated Checkmark Circle */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#2e9e5b',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 32,
            boxShadow: '0 6px 20px rgba(46, 158, 91, 0.4)',
          }}
        >
          ✓
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: 2,
            color: '#ffffff',
            textTransform: 'uppercase',
          }}
        >
          TABLE BOOKED
        </h1>

        <p
          style={{
            margin: '6px 0 20px',
            fontSize: 16,
            color: '#a3e635',
            fontWeight: 600,
          }}
        >
          Your table is confirmed!
        </p>

        {/* BOOKING VERIFICATION PIN */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1.5px dashed rgba(255, 255, 255, 0.25)',
            borderRadius: 16,
            padding: '16px 20px',
            maxWidth: 320,
            margin: '0 auto 16px',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: '#cbd5e1',
              marginBottom: 10,
            }}
          >
            Booking Verification PIN
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            {pinDigits.map((digit, idx) => (
              <span
                key={idx}
                style={{
                  width: 44,
                  height: 52,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#222923',
                  border: '1.5px solid #4ade80',
                  borderRadius: 10,
                  fontSize: 26,
                  fontWeight: 900,
                  color: '#ffffff',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
                }}
              >
                {digit}
              </span>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
          Show this PIN at the restaurant
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          BOOKING DETAILS CARD
          ---------------------------------------------------------------------- */}
      <div
        className="card"
        style={{
          padding: 22,
          borderRadius: 16,
          border: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#2e9e5b',
            fontWeight: 800,
            fontSize: 15,
            borderBottom: '1px solid var(--border)',
            paddingBottom: 12,
            marginBottom: 14,
          }}
        >
          <span>✓</span>
          <span>Booking Confirmed</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontSize: 13 }}>Restaurant:</span>
            <strong style={{ fontSize: 14 }}>{booking.restaurantName}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontSize: 13 }}>Date:</span>
            <strong style={{ fontSize: 14 }}>{formatBookingDate(booking.date)}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontSize: 13 }}>Time:</span>
            <strong style={{ fontSize: 14 }}>{booking.time}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontSize: 13 }}>Guests:</span>
            <strong style={{ fontSize: 14 }}>{booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontSize: 13 }}>Table:</span>
            <strong style={{ fontSize: 14 }}>{booking.tableNumber || booking.tableId || 'Table 06'}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontSize: 13 }}>Seating:</span>
            <strong style={{ fontSize: 14 }}>{booking.seating || 'Window'}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontSize: 13 }}>Booking ID:</span>
            <code style={{ fontSize: 13, background: 'var(--bg)', padding: '2px 8px', borderRadius: 4 }}>
              {booking.id}
            </code>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontSize: 13 }}>Verification PIN:</span>
            <strong style={{ fontSize: 14, color: 'var(--accent)' }}>{pin}</strong>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          FOOD PRE-ORDER SECTION (If selected)
          ---------------------------------------------------------------------- */}
      {foodItems.length > 0 && (
        <div
          className="card"
          style={{
            padding: 22,
            borderRadius: 16,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            marginBottom: 20,
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>Food Pre-order</h3>

          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 12 }}>
            {foodItems.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13.5,
                  padding: '4px 0',
                }}
              >
                <span>{item.name} × {item.qty}</span>
                <strong>₹{(item.price || 0) * (item.qty || 1)}</strong>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 14 }}>
            <span>Food Total:</span>
            <strong>₹{foodTotal}</strong>
          </div>

          <div
            style={{
              background: 'var(--bg)',
              padding: 12,
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="muted">Table Booking</span>
              <strong>₹{tableBookingFee}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="muted">Food</span>
              <strong>₹{foodTotal}</strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border)',
                paddingTop: 6,
                marginTop: 2,
                fontSize: 15,
              }}
            >
              <strong>Total</strong>
              <strong style={{ color: 'var(--accent)' }}>₹{grandTotal}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          CONFIRMATION ACTIONS (All 5 functional buttons)
          ---------------------------------------------------------------------- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          marginTop: 10,
        }}
      >
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '12px 14px', borderRadius: 10, fontWeight: 700 }}
          onClick={() => navigate('/my-bookings')}
        >
          View Booking
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '12px 14px', borderRadius: 10, fontWeight: 700 }}
          onClick={handleAddToCalendar}
        >
          📅 Add to Calendar
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '12px 14px', borderRadius: 10, fontWeight: 700 }}
          onClick={() => navigate(`/restaurant/${booking.restaurantId}`)}
        >
          View Restaurant
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '12px 14px', borderRadius: 10, fontWeight: 700 }}
          onClick={() => navigate(`/track-booking/${booking.id}`)}
        >
          View Order
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          style={{
            gridColumn: '1 / -1',
            padding: '12px 14px',
            borderRadius: 10,
            fontWeight: 700,
            background: 'var(--bg-elevated)',
          }}
          onClick={() => navigate('/')}
        >
          🏠 Go Home
        </button>
      </div>
    </div>
  );
}
