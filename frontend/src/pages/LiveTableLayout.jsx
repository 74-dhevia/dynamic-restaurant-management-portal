import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RESTAURANTS, TIME_SLOTS, SEATING_OPTIONS } from '../data/mockData';
import { updateTableStatus } from '../redux/slices/restaurantSlice';
import { createBooking } from '../redux/slices/bookingSlice';
import { useToast } from '../contexts/ToastContext';
import Icon from '../components/Icon';
import SafeImage from '../components/SafeImage';

export default function LiveTableLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const currentUser = useSelector(s => s.auth.currentUser);
  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants);
  const restaurantsData = reduxRestaurants && reduxRestaurants.length > 0 ? reduxRestaurants : RESTAURANTS;
  const restaurant = restaurantsData.find(r => r.id === id) || restaurantsData[0];

  // Active tables for this restaurant
  const tables = useMemo(() => {
    if (restaurant?.tables && restaurant.tables.length > 0) {
      return restaurant.tables.map((t, idx) => {
        // Map any legacy status strings to standard specification
        let normalized = 'Available';
        const st = (t.status || '').toLowerCase();
        if (st === 'occupied') normalized = 'Occupied';
        else if (st === 'reserved') normalized = 'Reserved';
        else if (st === 'cleaning' || st === 'seating-soon') normalized = 'Cleaning';
        else if (st === 'unavailable') normalized = 'Unavailable';
        else normalized = 'Available';

        return {
          id: t.id || `T${idx + 1}`,
          label: t.label || `T${idx + 1}`,
          seats: idx % 3 === 0 ? 6 : idx % 2 === 0 ? 4 : 2,
          location: idx < 3 ? 'Window' : idx < 6 ? 'Indoor' : 'Near Counter',
          status: normalized,
          nextSlot: '8:30 PM',
        };
      });
    }
    // Default 8-table layout
    return [
      { id: 'T1', label: 'T01', seats: 4, location: 'Window', status: 'Available', nextSlot: '8:00 PM' },
      { id: 'T2', label: 'T02', seats: 2, location: 'Window', status: 'Reserved', nextSlot: '8:30 PM' },
      { id: 'T3', label: 'T03', seats: 4, location: 'Window', status: 'Available', nextSlot: '7:45 PM' },
      { id: 'T4', label: 'T04', seats: 4, location: 'Indoor', status: 'Available', nextSlot: '8:30 PM' },
      { id: 'T5', label: 'T05', seats: 6, location: 'Family', status: 'Occupied', nextSlot: '9:00 PM' },
      { id: 'T6', label: 'T06', seats: 2, location: 'Indoor', status: 'Cleaning', nextSlot: '8:15 PM' },
      { id: 'T7', label: 'T07', seats: 4, location: 'Near Counter', status: 'Available', nextSlot: '8:00 PM' },
      { id: 'T8', label: 'T08', seats: 8, location: 'Family', status: 'Available', nextSlot: '8:30 PM' },
    ];
  }, [restaurant]);

  const [selectedTable, setSelectedTable] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bookingTime, setBookingTime] = useState('7:30 PM');
  const [bookingGuests, setBookingGuests] = useState(4);

  // Status badge styling helper
  const getStatusStyle = (st) => {
    switch (st) {
      case 'Available': return { bg: 'rgba(46, 158, 91, 0.15)', border: 'var(--success)', color: 'var(--success)', icon: '🟢' };
      case 'Reserved': return { bg: 'rgba(0, 119, 255, 0.15)', border: '#0077ff', color: '#0077ff', icon: '🔵' };
      case 'Occupied': return { bg: 'rgba(214, 69, 69, 0.15)', border: 'var(--danger)', color: 'var(--danger)', icon: '🔴' };
      case 'Cleaning': return { bg: 'rgba(255, 183, 3, 0.15)', border: '#ffb703', color: '#b37d00', icon: '🟠' };
      case 'Unavailable': default: return { bg: 'rgba(100, 100, 100, 0.15)', border: '#666', color: '#666', icon: '⚫' };
    }
  };

  const handleTableClick = (tbl) => {
    setSelectedTable(tbl);
  };

  const handleConfirmReservation = () => {
    if (!selectedTable) return;
    if (!currentUser) {
      showToast('Please sign in to complete your table reservation', 'info');
      navigate('/login');
      return;
    }

    const bookingId = `BK-${Date.now().toString().slice(-4)}`;
    dispatch(createBooking({
      id: bookingId,
      userId: currentUser.id || 'u_guest',
      customerName: currentUser.fullName || 'Guest Customer',
      userEmail: currentUser.email || 'guest@example.com',
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      date: bookingDate,
      dateFormatted: new Date(bookingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      time: bookingTime,
      guests: bookingGuests,
      tableNumber: selectedTable.label,
      tableId: selectedTable.id,
      seating: selectedTable.location,
      status: 'Confirmed',
      journeyStep: 1,
      createdAt: new Date().toISOString(),
    }));

    // Update table state: Available -> Reserved!
    dispatch(updateTableStatus({
      restaurantId: restaurant.id,
      tableId: selectedTable.id,
      status: 'Reserved',
    }));

    showToast(`Table ${selectedTable.label} reserved successfully! Booking ID: ${bookingId}`, 'success');
    setShowBookingModal(false);
    navigate(`/track-booking/${bookingId}`);
  };

  // Chef / Admin simulated status toggle
  const handleSimulateStatusChange = (tbl, newStatus) => {
    dispatch(updateTableStatus({
      restaurantId: restaurant.id,
      tableId: tbl.id,
      status: newStatus,
    }));
    showToast(`Table ${tbl.label} status changed to ${newStatus} (Live Twin Updated)`, 'info');
    if (selectedTable?.id === tbl.id) {
      setSelectedTable(prev => ({ ...prev, status: newStatus }));
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', paddingBottom: 60, boxSizing: 'border-box' }}>
      {/* Header Banner */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '20px 24px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/restaurant/${restaurant.id}`)}
            style={{ marginBottom: 10, borderRadius: 20 }}
          >
            ← Back to Restaurant Menu
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 26 }}>🏪</span>
            <h1 style={{ margin: 0, fontSize: 24 }}>Digital Restaurant Twin</h1>
          </div>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Interactive real-time floor plan for <strong>{restaurant.name}</strong> ({restaurant.area}).
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', background: 'var(--bg)', padding: '10px 14px', borderRadius: 14, border: '1px solid var(--border)' }}>
          {[
            { label: 'Available', icon: '🟢' },
            { label: 'Reserved', icon: '🔵' },
            { label: 'Occupied', icon: '🔴' },
            { label: 'Cleaning', icon: '🟠' },
          ].map(it => (
            <span key={it.label} style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{it.icon}</span> {it.label}
            </span>
          ))}
        </div>
      </div>

      {/* Main Twin Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* Floor Plan Container */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '2px solid var(--border)',
          borderRadius: 24,
          padding: 24,
          position: 'relative',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
        }}>
          {/* WINDOW ZONE (Top) */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(0, 119, 255, 0.08), transparent)',
            border: '2px dashed #0077ff',
            borderRadius: 14,
            padding: '10px 16px',
            textAlign: 'center',
            fontWeight: 800,
            fontSize: 13,
            color: '#0077ff',
            marginBottom: 24,
            letterSpacing: 1,
          }}>
            🪟 PANORAMIC SUNLIT WINDOW SEATING ZONE
          </div>

          {/* Interactive Tables Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 20,
            marginBottom: 28,
          }}>
            {tables.map(tbl => {
              const styleObj = getStatusStyle(tbl.status);
              const isSelected = selectedTable?.id === tbl.id;

              return (
                <div
                  key={tbl.id}
                  onClick={() => handleTableClick(tbl)}
                  style={{
                    background: isSelected ? 'color-mix(in srgb, var(--accent) 10%, var(--bg))' : styleObj.bg,
                    border: isSelected ? '2px solid var(--accent)' : `1.5px solid ${styleObj.border}`,
                    borderRadius: 18,
                    padding: 16,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    transform: isSelected ? 'translateY(-4px)' : 'none',
                    boxShadow: isSelected ? '0 8px 24px rgba(232, 84, 42, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 4 }}>
                    {tbl.seats >= 6 ? '🛋️' : '🪑'}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
                    {tbl.label}
                  </div>
                  <div className="muted" style={{ fontSize: 12, margin: '2px 0 6px' }}>
                    {tbl.seats} Seats • {tbl.location}
                  </div>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 800,
                    color: styleObj.color,
                  }}>
                    {styleObj.icon} {tbl.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* COUNTER & KITCHEN PASS (Bottom) */}
          <div style={{
            background: 'linear-gradient(0deg, color-mix(in srgb, var(--accent) 10%, transparent), transparent)',
            border: '2px solid var(--border)',
            borderRadius: 14,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 800,
            fontSize: 13,
            color: 'var(--text)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🍽️</span>
              <span>LIVE ORDER COUNTER & KITCHEN PASS</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent)' }}>
              <span>🚪</span>
              <span>MAIN ENTRANCE</span>
            </div>
          </div>
        </div>

        {/* Selected Table Inspection Drawer */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}>
          {selectedTable ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 20 }}>Table {selectedTable.label}</h3>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 800,
                  ...getStatusStyle(selectedTable.status),
                }}>
                  {selectedTable.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '14px 0', fontSize: 13.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Capacity:</span>
                  <strong>{selectedTable.seats} Persons</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Zone:</span>
                  <strong>{selectedTable.location} Area</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Restaurant:</span>
                  <strong>{restaurant.name}</strong>
                </div>
              </div>

              {/* Status Specific Actions */}
              {selectedTable.status === 'Available' ? (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 700, marginBottom: 12 }}>
                    ✓ This table is vacant and ready for booking right now!
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => {
                      setBookingGuests(selectedTable.seats);
                      setShowBookingModal(true);
                    }}
                    style={{ padding: '12px 18px', fontWeight: 800 }}
                  >
                    📅 Book Table {selectedTable.label}
                  </button>
                </div>
              ) : selectedTable.status === 'Reserved' ? (
                <div style={{ marginTop: 16, padding: 14, background: 'var(--bg)', borderRadius: 12, border: '1px solid #0077ff', color: '#0077ff' }}>
                  <strong>🔵 Table Reserved</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5 }}>
                    Available again at: <strong>{selectedTable.nextSlot}</strong>.
                  </p>
                </div>
              ) : selectedTable.status === 'Occupied' ? (
                <div style={{ marginTop: 16, padding: 14, background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                  <strong>🔴 Currently Occupied</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5 }}>
                    Guests are currently dining at this table.
                  </p>
                </div>
              ) : (
                <div style={{ marginTop: 16, padding: 14, background: 'var(--bg)', borderRadius: 12, border: '1px solid #ffb703', color: '#b37d00' }}>
                  <strong>🟠 Table Cleaning</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5 }}>
                    Staff is sanitizing this table. Ready in approx 5 minutes.
                  </p>
                </div>
              )}

              {/* Chef / Admin Live Table Status Simulator (Requirement 4) */}
              <div style={{ borderTop: '1px dashed var(--border)', marginTop: 20, paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>
                  👨‍🍳 CHEF / ADMIN LIVE TABLE CONTROL (Demo):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {['Available', 'Reserved', 'Occupied', 'Cleaning'].map(st => (
                    <button
                      key={st}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 11, padding: '4px 6px' }}
                      onClick={() => handleSimulateStatusChange(selectedTable, st)}
                    >
                      Set {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>👆</div>
              <h4>Select a table to inspect</h4>
              <p style={{ fontSize: 13 }}>Click on any table on the interactive floor map to view details, current status, or reserve.</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal with Selected Table Attached */}
      {showBookingModal && selectedTable && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }} onClick={() => setShowBookingModal(false)}>
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            maxWidth: 460,
            width: '100%',
            padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            position: 'relative',
          }} onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowBookingModal(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>

            <h3 style={{ margin: '0 0 6px', fontSize: 20 }}>Book Table {selectedTable.label}</h3>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: 13 }}>
              {restaurant.name} • {selectedTable.location} • {selectedTable.seats} Seats
            </p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Date</label>
              <input
                type="date"
                value={bookingDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setBookingDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Time Slot</label>
              <select
                value={bookingTime}
                onChange={e => setBookingTime(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                {TIME_SLOTS.map(s => <option key={s.time} value={s.time}>{s.time}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Guests ({bookingGuests})</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[2, 4, 6, 8].map(g => (
                  <button
                    key={g}
                    type="button"
                    className={`btn ${bookingGuests === g ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => setBookingGuests(g)}
                    style={{ flex: 1 }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowBookingModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmReservation}>
                Confirm Reservation (Table {selectedTable.label})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
