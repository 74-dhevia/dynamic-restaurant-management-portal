import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Icon from '../Icon';
import SafeImage from '../SafeImage';
import {
  updateBookingStatusAdmin,
  cancelBookingWithReason,
  assignBookingTable,
  rescheduleBooking,
  sendCustomerNotification,
  updateReminderStatus,
  CANCELLATION_REASONS,
  ALLOWED_STATUS_TRANSITIONS,
} from '../../redux/slices/bookingSlice';
import {
  DEFAULT_TABLES,
  checkTableConflict,
  getAvailableAlternativeTables,
} from '../../services/tableBookingService';

export default function BookingDetailsModal({
  isOpen,
  onClose,
  booking,
  onSelectBooking,
  onViewLinkedOrder,
  onOpenCustomer,
}) {
  const dispatch = useDispatch();
  const allBookings = useSelector(s => s.booking?.bookings || []);
  const allOrders = useSelector(s => s.order?.orders || []);
  const allUsers = useSelector(s => s.auth?.users || []);
  const allChefs = useSelector(s => s.chef?.chefs || []);
  const incidents = useSelector(s => s.chef?.incidents || []);

  // Modal local sub-states
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'table' | 'notifications' | 'reschedule'
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('Customer Request');
  const [customReasonNote, setCustomReasonNote] = useState('');

  // Table Reassignment State
  const [selectedTableCandidate, setSelectedTableCandidate] = useState(booking?.tableNumber || booking?.tableId || 'T-12');
  const [tableConflictError, setTableConflictError] = useState(null);
  const [tableSuccessMsg, setTableSuccessMsg] = useState(null);

  // Reschedule State
  const [rescheduleDate, setRescheduleDate] = useState(booking?.date || '2026-09-26');
  const [rescheduleTime, setRescheduleTime] = useState(booking?.time || '7:30 PM');

  // Notification Composer State
  const [notifTemplate, setNotifTemplate] = useState('Confirmed');
  const [customNotifMsg, setCustomNotifMsg] = useState('');
  const [notifChannel, setNotifChannel] = useState('In-App');
  const [notifSentBanner, setNotifSentBanner] = useState(null);

  if (!isOpen || !booking) return null;

  // Resolve customer account
  const customerUser = allUsers.find(u =>
    u.id === booking.userId ||
    (booking.userEmail && u.email?.toLowerCase() === booking.userEmail.toLowerCase())
  );
  const customerName = booking.customerName || booking.userName || customerUser?.fullName || 'Guest Diner';
  const customerEmail = booking.userEmail || booking.customerEmail || customerUser?.email || 'guest@zestro.com';
  const customerPhone = booking.customerPhone || customerUser?.phone || '+91 98401 23456';
  const customerAvatar = booking.customerAvatar || customerUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  // Customer booking history & related orders
  const customerBookings = allBookings.filter(b =>
    b.id !== booking.id &&
    ((booking.userId && b.userId === booking.userId) ||
     (customerEmail && b.userEmail?.toLowerCase() === customerEmail.toLowerCase()))
  );

  const customerOrders = allOrders.filter(o =>
    (booking.userId && o.userId === booking.userId) ||
    (customerEmail && (o.customerEmail?.toLowerCase() === customerEmail.toLowerCase() || o.userEmail?.toLowerCase() === customerEmail.toLowerCase()))
  );

  // Linked Order lookup
  const linkedOrder = allOrders.find(o =>
    (booking.linkedOrderId && o.id === booking.linkedOrderId) ||
    (o.customerEmail?.toLowerCase() === customerEmail.toLowerCase() && o.restaurantId === booking.restaurantId)
  );

  // Active Kitchen Incidents at this Restaurant
  const activeIncident = incidents.find(inc =>
    inc.status === 'open' &&
    (inc.restaurantId === booking.restaurantId || inc.restaurantName === booking.restaurantName)
  );

  // Table Details
  const assignedTableInfo = booking.tableDetails || {
    number: booking.tableNumber || booking.tableId || 'T-12',
    capacity: booking.guests || 4,
    location: booking.seating || 'Window',
    seatingType: 'Indoor',
    status: booking.status === 'Dining' || booking.status === 'Customer Arrived' ? 'Occupied' : 'Reserved',
  };

  // Status transitions
  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[booking.status] || [];

  const handleAdvanceStatus = (nextStatus) => {
    dispatch(updateBookingStatusAdmin({
      id: booking.id,
      status: nextStatus,
      adminName: 'Admin Dheiva',
    }));
  };

  const handleConfirmCancellation = () => {
    dispatch(cancelBookingWithReason({
      id: booking.id,
      reason: cancellationReason,
      customReason: customReasonNote,
      adminName: 'Admin Dheiva',
    }));
    setCancelModalOpen(false);
  };

  const handleCheckAndAssignTable = (targetTableNumber) => {
    setTableConflictError(null);
    setTableSuccessMsg(null);

    const conflict = checkTableConflict({
      bookings: allBookings,
      restaurantId: booking.restaurantId,
      date: booking.date,
      time: booking.time,
      tableNumber: targetTableNumber,
      currentBookingId: booking.id,
    });

    if (conflict.hasConflict) {
      setTableConflictError(conflict.errorMessage);
      return;
    }

    const tableObj = DEFAULT_TABLES.find(t => t.number === targetTableNumber);
    dispatch(assignBookingTable({
      id: booking.id,
      tableNumber: targetTableNumber,
      tableDetails: {
        number: targetTableNumber,
        capacity: tableObj?.capacity || booking.guests || 4,
        location: tableObj?.location || booking.seating || 'Window',
        seatingType: tableObj?.seatingType || 'Indoor',
        status: 'Reserved',
      },
    }));

    setTableSuccessMsg(`Table successfully updated to ${targetTableNumber}!`);
    setTimeout(() => setTableSuccessMsg(null), 3000);
  };

  const handleSendNotification = () => {
    let msg = customNotifMsg;
    if (!msg) {
      if (notifTemplate === 'Confirmed') msg = 'Your table booking has been confirmed.';
      else if (notifTemplate === 'Cancelled') msg = 'Your table booking has been cancelled.';
      else if (notifTemplate === 'Table Ready') msg = 'Your table is ready.';
      else if (notifTemplate === 'Restaurant Issue') msg = 'There has been an unexpected issue at the restaurant. Please check your booking for available options.';
      else msg = 'Important update regarding your table reservation.';
    }

    dispatch(sendCustomerNotification({
      id: booking.id,
      type: notifTemplate,
      message: msg,
      channel: notifChannel,
    }));

    setNotifSentBanner(`Simulated ${notifChannel} notification dispatched to customer!`);
    setCustomNotifMsg('');
    setTimeout(() => setNotifSentBanner(null), 3500);
  };

  const handleExecuteReschedule = (e) => {
    e.preventDefault();
    dispatch(rescheduleBooking({
      id: booking.id,
      date: rescheduleDate,
      time: rescheduleTime,
      tableNumber: selectedTableCandidate,
    }));
    setActiveTab('overview');
  };

  const alternativeTables = getAvailableAlternativeTables({
    tables: DEFAULT_TABLES,
    bookings: allBookings,
    restaurantId: booking.restaurantId,
    date: booking.date,
    time: booking.time,
    currentBookingId: booking.id,
    requiredGuests: booking.guests || 2,
  });

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="admin-modal-card booking-details-modal"
        style={{ maxWidth: 880, width: '95%' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="admin-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="modal-icon-badge" style={{ background: 'var(--accent)', color: '#fff', borderRadius: 8, padding: 8, display: 'flex' }}>
              <Icon name="calendar" size={20} />
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Reservation #{booking.id}</h3>
                <span className={`status-pill ${booking.status === 'Cancelled' ? 'danger' : booking.status === 'Completed' ? 'success' : 'warning'}`}>
                  {booking.status}
                </span>
                {booking.preOrderItems && booking.preOrderItems.length > 0 && (
                  <span className="preorder-cell-pill" style={{ fontSize: 11 }}>
                    <Icon name="food" size={12} color="var(--accent)" />
                    <span>Food Pre-ordered ({booking.preOrderItems.length} items)</span>
                  </span>
                )}
              </div>
              <p className="sub" style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                {booking.restaurantName} • {booking.date} at {booking.time} • {booking.guests} Guests
              </p>
            </div>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="admin-modal-tabs" style={{ display: 'flex', gap: 4, padding: '8px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
          <button
            type="button"
            className={`admin-sub-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Icon name="orders" size={14} /> Overview &amp; Customer
          </button>
          <button
            type="button"
            className={`admin-sub-tab ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            <Icon name="table" size={14} /> Assigned Table &amp; Conflict
          </button>
          <button
            type="button"
            className={`admin-sub-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Icon name="notifications" size={14} /> Notifications &amp; Reminders
          </button>
          <button
            type="button"
            className={`admin-sub-tab ${activeTab === 'reschedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('reschedule')}
          >
            <Icon name="clock" size={14} /> Reschedule
          </button>
        </div>

        {/* Body Content */}
        <div className="modal-body-scroll" style={{ maxHeight: '72vh', overflowY: 'auto', padding: 20 }}>
          {/* Active Kitchen Incident Warning Banner */}
          {activeIncident && (
            <div className="incident-alert-strip" style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: 'color-mix(in srgb, var(--danger) 12%, var(--bg-elevated))', border: '1px solid var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="alert-triangle" size={20} color="var(--danger)" />
                <div>
                  <strong style={{ color: 'var(--danger)', fontSize: 13.5 }}>🚨 Active Kitchen Incident Reported</strong>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {activeIncident.description} (Severity: {activeIncident.severity})
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-danger"
                  onClick={() => {
                    setActiveTab('notifications');
                    setNotifTemplate('Restaurant Issue');
                    setCustomNotifMsg('There has been an unexpected issue at the restaurant. Please check your booking for available options.');
                  }}
                >
                  Notify Customer
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={() => setActiveTab('reschedule')}
                >
                  Reschedule
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW & CUSTOMER */}
          {activeTab === 'overview' && (
            <div className="booking-overview-grid" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Lifecycle Progression Flow */}
              <div className="card" style={{ padding: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
                    Reservation Lifecycle Progression
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>
                    Current: {booking.status}
                  </div>
                </div>

                <div className="booking-status-flow" style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
                  {['Requested', 'Confirmed', 'Table Ready', 'Customer Arrived', 'Dining', 'Completed'].map((st, sIdx, arr) => {
                    const isCurrent = booking.status === st;
                    const isPast = arr.indexOf(booking.status) > sIdx;
                    return (
                      <React.Fragment key={st}>
                        <div
                          className={`flow-node ${isCurrent ? 'active' : isPast ? 'passed' : ''}`}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            background: isCurrent ? 'var(--accent)' : isPast ? 'color-mix(in srgb, var(--success) 18%, var(--bg-elevated))' : 'var(--bg)',
                            color: isCurrent ? '#ffffff' : isPast ? 'var(--success)' : 'var(--text-muted)',
                            border: `1px solid ${isCurrent ? 'var(--accent)' : isPast ? 'var(--success)' : 'var(--border)'}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isPast ? '✓ ' : ''}{st}
                        </div>
                        {sIdx < arr.length - 1 && (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>→</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Status Action Buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  {booking.status === 'Requested' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleAdvanceStatus('Confirmed')}
                    >
                      Confirm Booking (Requested → Confirmed)
                    </button>
                  )}
                  {booking.status === 'Confirmed' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleAdvanceStatus('Table Ready')}
                    >
                      Mark Table Ready (Confirmed → Table Ready)
                    </button>
                  )}
                  {booking.status === 'Table Ready' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleAdvanceStatus('Customer Arrived')}
                    >
                      Mark Arrived (Table Ready → Customer Arrived)
                    </button>
                  )}
                  {booking.status === 'Customer Arrived' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleAdvanceStatus('Dining')}
                    >
                      Seat &amp; Start Dining (Customer Arrived → Dining)
                    </button>
                  )}
                  {booking.status === 'Dining' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={() => handleAdvanceStatus('Completed')}
                    >
                      Complete Dining (Dining → Completed)
                    </button>
                  )}

                  {/* No Show Option */}
                  {['Requested', 'Confirmed', 'Table Ready'].includes(booking.status) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleAdvanceStatus('No Show')}
                      title="Customer did not arrive for the reservation"
                    >
                      Mark No Show
                    </button>
                  )}

                  {/* Cancel Button */}
                  {!['Completed', 'Cancelled', 'No Show'].includes(booking.status) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => setCancelModalOpen(true)}
                    >
                      Cancel Booking...
                    </button>
                  )}

                  {booking.cancellationReason && (
                    <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, marginLeft: 'auto' }}>
                      Reason: {booking.cancellationReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Information & Assigned Table Split */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {/* 5. Booking Information */}
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <Icon name="calendar" size={16} color="var(--accent)" />
                    <strong style={{ fontSize: 14 }}>Booking Information</strong>
                  </div>
                  <div className="meta-info-list" style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Booking ID:</span>
                      <strong>{booking.id}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Restaurant:</span>
                      <strong style={{ textAlign: 'right' }}>{booking.restaurantName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Reservation Date:</span>
                      <strong>{booking.date}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Time Slot:</span>
                      <strong>{booking.time}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Number of Guests:</span>
                      <strong>{booking.guests} Guests</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Seating Preference:</span>
                      <strong>{booking.seating || 'Standard'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Table Number:</span>
                      <strong style={{ color: 'var(--accent)' }}>{booking.tableNumber || booking.tableId || 'T-12'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Special Request:</span>
                      <span style={{ textAlign: 'right', fontStyle: 'italic', maxWidth: 160 }}>
                        {booking.request || 'None requested'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Booking Status:</span>
                      <span className={`status-pill ${booking.status === 'Cancelled' ? 'danger' : 'success'}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. Assigned Table Information */}
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="table" size={16} color="var(--success)" />
                      <strong style={{ fontSize: 14 }}>Assigned Table</strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() => setActiveTab('table')}
                    >
                      Change Table
                    </button>
                  </div>
                  <div className="meta-info-list" style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Table Station:</span>
                      <strong>Table {assignedTableInfo.number}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Capacity:</span>
                      <strong>{assignedTableInfo.capacity} Guests</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Location:</span>
                      <strong>{assignedTableInfo.location}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Seating Type:</span>
                      <strong>{assignedTableInfo.seatingType}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="muted">Current Status:</span>
                      <span className="status-pill warning">{assignedTableInfo.status}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 14, padding: 10, borderRadius: 8, background: 'var(--bg)', border: '1px dashed var(--border)', fontSize: 12 }}>
                    <span className="muted">Verification: </span>
                    Table is reserved specifically for <strong>{booking.time}</strong> on <strong>{booking.date}</strong>. System guarantees no double bookings.
                  </div>
                </div>
              </div>

              {/* 10. Food Pre-Order Card */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="food" size={16} color="var(--accent)" />
                    <strong style={{ fontSize: 14 }}>Food Pre-Order Information</strong>
                  </div>
                  {/* View Linked Order Button */}
                  {(linkedOrder || booking.linkedOrderId) && (
                    <button
                      type="button"
                      className="btn btn-xs btn-primary"
                      onClick={() => onViewLinkedOrder && onViewLinkedOrder(linkedOrder?.id || booking.linkedOrderId)}
                    >
                      View Linked Order
                    </button>
                  )}
                </div>

                {booking.preOrderItems && booking.preOrderItems.length > 0 ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                      {booking.preOrderItems.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: 'var(--bg)',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: 13 }}>{item.name}</strong>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              ₹{item.price} each {item.spiceLevel ? `• ${item.spiceLevel}` : ''}
                            </div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)' }}>
                            × {item.qty}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                      <div>
                        <span className="muted" style={{ fontSize: 12 }}>
                          {booking.prepareBeforeArrival ? '🔥 Kitchen scheduled to prepare dishes prior to diner arrival.' : 'Dishes prepared upon customer check-in.'}
                        </span>
                      </div>
                      <div style={{ fontSize: 14 }}>
                        Pre-Order Total: <strong style={{ color: 'var(--accent)', fontSize: 16 }}>₹{booking.preOrderTotal || 0}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    <p style={{ margin: 0 }}>No food items pre-ordered for this reservation. Diner will order at table.</p>
                  </div>
                )}
              </div>

              {/* 4. Customer Details Section (NO PASSWORDS) */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="users" size={16} color="#4361ee" />
                    <strong style={{ fontSize: 14 }}>Customer Profile &amp; Dining History</strong>
                  </div>
                  {onOpenCustomer && customerUser && (
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() => onOpenCustomer(customerUser)}
                    >
                      Full Customer Dossier
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    <SafeImage
                      image={customerAvatar}
                      alt={customerName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16 }}>{customerName}</h4>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{customerEmail}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Phone: {customerPhone}</div>
                  </div>
                </div>

                {/* 21. Customer Past Booking History */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                    Customer Booking History ({customerBookings.length})
                  </div>
                  {customerBookings.length === 0 ? (
                    <p className="muted" style={{ fontSize: 12.5, margin: '4px 0' }}>No other reservations recorded for this customer.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {customerBookings.slice(0, 3).map(cb => (
                        <div
                          key={cb.id}
                          onClick={() => onSelectBooking && onSelectBooking(cb)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: 'var(--bg)',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 12.5,
                          }}
                        >
                          <div>
                            <strong>{cb.id}</strong> — {cb.restaurantName} ({cb.guests} Guests)
                            <div className="muted" style={{ fontSize: 11.5 }}>{cb.date} at {cb.time}</div>
                          </div>
                          <span className={`status-pill ${cb.status === 'Cancelled' ? 'danger' : 'success'}`} style={{ fontSize: 11 }}>
                            {cb.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Customer Related Orders */}
                <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                    Related Orders ({customerOrders.length})
                  </div>
                  {customerOrders.length === 0 ? (
                    <p className="muted" style={{ fontSize: 12.5, margin: '4px 0' }}>No related orders for this customer.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {customerOrders.slice(0, 3).map(ord => (
                        <div
                          key={ord.id}
                          onClick={() => onViewLinkedOrder && onViewLinkedOrder(ord.id)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: 'var(--bg)',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 12.5,
                          }}
                        >
                          <div>
                            <strong>#{ord.id}</strong> — {ord.restaurantName} (₹{ord.grandTotal})
                            <div className="muted" style={{ fontSize: 11.5 }}>
                              {ord.items?.map(i => `${i.name} × ${i.qty || 1}`).join(', ')}
                            </div>
                          </div>
                          <span className={`status-pill ${ord.cancelled ? 'danger' : 'success'}`} style={{ fontSize: 11 }}>
                            {ord.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TABLE ASSIGNMENT & CONFLICT VALIDATION */}
          {activeTab === 'table' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Icon name="table" size={18} color="var(--accent)" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15 }}>Real-Time Table Conflict Validator</h4>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      Validating assignment for {booking.restaurantName} on {booking.date} at {booking.time}
                    </p>
                  </div>
                </div>

                {tableConflictError && (
                  <div className="table-conflict-alert" style={{ padding: '10px 14px', borderRadius: 8, background: 'color-mix(in srgb, var(--danger) 15%, var(--bg-elevated))', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="alert-triangle" size={16} />
                    <strong>{tableConflictError}</strong>
                  </div>
                )}

                {tableSuccessMsg && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'color-mix(in srgb, var(--success) 15%, var(--bg-elevated))', border: '1px solid var(--success)', color: 'var(--success)', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="check" size={16} />
                    <strong>{tableSuccessMsg}</strong>
                  </div>
                )}

                {/* Table Station Selector Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginTop: 10 }}>
                  {DEFAULT_TABLES.map(t => {
                    const conflict = checkTableConflict({
                      bookings: allBookings,
                      restaurantId: booking.restaurantId,
                      date: booking.date,
                      time: booking.time,
                      tableNumber: t.number,
                      currentBookingId: booking.id,
                    });

                    const isCurrentAssigned = (booking.tableNumber === t.number || booking.tableId === t.number);
                    const isSelected = selectedTableCandidate === t.number;

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedTableCandidate(t.number);
                          if (!conflict.hasConflict) {
                            handleCheckAndAssignTable(t.number);
                          } else {
                            setTableConflictError(`This table is already reserved for this time.`);
                          }
                        }}
                        style={{
                          padding: '12px 10px',
                          borderRadius: 8,
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: isCurrentAssigned ? 'color-mix(in srgb, var(--accent) 18%, var(--bg-elevated))' : 'var(--bg)',
                          border: `2px solid ${isCurrentAssigned ? 'var(--accent)' : conflict.hasConflict ? 'var(--danger)' : isSelected ? 'var(--text)' : 'var(--border)'}`,
                          opacity: conflict.hasConflict ? 0.6 : 1,
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 15, color: isCurrentAssigned ? 'var(--accent)' : 'var(--text)' }}>
                          {t.number}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {t.capacity} Seats • {t.seatingType}
                        </div>
                        <div style={{ marginTop: 6 }}>
                          {conflict.hasConflict ? (
                            <span style={{ fontSize: 10.5, color: 'var(--danger)', fontWeight: 700 }}>Occupied / Conflict</span>
                          ) : isCurrentAssigned ? (
                            <span style={{ fontSize: 10.5, color: 'var(--accent)', fontWeight: 700 }}>Assigned Now</span>
                          ) : (
                            <span style={{ fontSize: 10.5, color: 'var(--success)', fontWeight: 700 }}>Available</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Suggested Available Tables */}
                {alternativeTables.length > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                      Recommended Alternative Tables for {booking.guests} Guests:
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {alternativeTables.map(alt => (
                        <button
                          key={alt.id}
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => handleCheckAndAssignTable(alt.number)}
                        >
                          Assign Table {alt.number} ({alt.capacity} seats, {alt.location})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS & REMINDERS */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 18. Booking Reminder Card */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="clock" size={16} color="var(--accent)" />
                    <strong style={{ fontSize: 14 }}>Booking Reminder Status</strong>
                  </div>
                  <span className={`status-pill ${booking.reminderStatus === 'Sent' ? 'success' : booking.reminderStatus === 'Scheduled' ? 'warning' : 'neutral'}`}>
                    {booking.reminderStatus || 'Scheduled'}
                  </span>
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 13 }}>
                  <div className="muted" style={{ fontSize: 11.5, marginBottom: 4 }}>Prepared Reminder Notice:</div>
                  <strong>"Your ZESTRO table booking is scheduled for {booking.time} today."</strong>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-xs btn-primary"
                    disabled={booking.reminderStatus === 'Sent'}
                    onClick={() => {
                      dispatch(updateReminderStatus({ id: booking.id, reminderStatus: 'Sent' }));
                      setNotifSentBanner('Simulated booking reminder marked as sent to customer!');
                      setTimeout(() => setNotifSentBanner(null), 3000);
                    }}
                  >
                    Simulate Send Reminder Now
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={() => {
                      dispatch(updateReminderStatus({ id: booking.id, reminderStatus: 'Not Required' }));
                    }}
                  >
                    Mark Not Required
                  </button>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    * Real WhatsApp/SMS reminder will be dispatched via backend gateway.
                  </span>
                </div>
              </div>

              {/* 17. Customer Notification Center */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Icon name="notifications" size={16} color="var(--accent)" />
                  <strong style={{ fontSize: 14 }}>Dispatch Customer Notification</strong>
                </div>

                {notifSentBanner && (
                  <div style={{ padding: '8px 12px', borderRadius: 6, background: 'color-mix(in srgb, var(--success) 15%, var(--bg-elevated))', color: 'var(--success)', fontSize: 12.5, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="check" size={14} />
                    <span>{notifSentBanner}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  {['Confirmed', 'Table Ready', 'Cancelled', 'Restaurant Issue'].map(temp => (
                    <button
                      key={temp}
                      type="button"
                      className={`btn btn-xs ${notifTemplate === temp ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => {
                        setNotifTemplate(temp);
                        if (temp === 'Confirmed') setCustomNotifMsg('Your table booking has been confirmed.');
                        else if (temp === 'Table Ready') setCustomNotifMsg('Your table is ready.');
                        else if (temp === 'Cancelled') setCustomNotifMsg('Your table booking has been cancelled.');
                        else if (temp === 'Restaurant Issue') setCustomNotifMsg('There has been an unexpected issue at the restaurant. Please check your booking for available options.');
                      }}
                    >
                      Preset: {temp}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Notification Message</label>
                  <textarea
                    rows={3}
                    className="admin-form-input"
                    value={customNotifMsg}
                    onChange={e => setCustomNotifMsg(e.target.value)}
                    placeholder="Enter notification text to be displayed to customer..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Channel:</label>
                    <select
                      className="admin-form-select small"
                      value={notifChannel}
                      onChange={e => setNotifChannel(e.target.value)}
                    >
                      <option value="In-App">In-App Notification</option>
                      <option value="SMS (Simulated)">SMS (Simulated)</option>
                      <option value="WhatsApp (Simulated)">WhatsApp (Simulated)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleSendNotification}
                  >
                    Send to Customer
                  </button>
                </div>

                {/* Notification Log for this Booking */}
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Notification Dispatch History ({booking.customerNotifications?.length || 0})
                  </div>
                  {(!booking.customerNotifications || booking.customerNotifications.length === 0) ? (
                    <p className="muted" style={{ fontSize: 12, margin: 0 }}>No notifications dispatched yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {booking.customerNotifications.map((notif, nIdx) => (
                        <div
                          key={notif.id || nIdx}
                          style={{
                            padding: '8px 12px',
                            background: 'var(--bg)',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            fontSize: 12,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>[{notif.type}] via {notif.channel || 'In-App'}</strong>
                            <span className="muted" style={{ fontSize: 11 }}>
                              {notif.sentAt ? new Date(notif.sentAt).toLocaleTimeString() : 'Recently'}
                            </span>
                          </div>
                          <div style={{ marginTop: 2, color: 'var(--text)' }}>
                            {notif.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESCHEDULE */}
          {activeTab === 'reschedule' && (
            <form onSubmit={handleExecuteReschedule} className="card" style={{ padding: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Reschedule Table Reservation</h4>
              <p style={{ margin: '0 0 16px', fontSize: 12.5, color: 'var(--text-muted)' }}>
                Select a new dining schedule. Customer will automatically receive a rescheduling notification.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="filter-field-col">
                  <label>New Date</label>
                  <input
                    type="date"
                    className="admin-form-input"
                    value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                    required
                  />
                </div>
                <div className="filter-field-col">
                  <label>New Time Slot</label>
                  <select
                    className="admin-form-select"
                    value={rescheduleTime}
                    onChange={e => setRescheduleTime(e.target.value)}
                  >
                    <option value="6:00 PM">6:00 PM</option>
                    <option value="6:30 PM">6:30 PM</option>
                    <option value="7:00 PM">7:00 PM</option>
                    <option value="7:30 PM">7:30 PM</option>
                    <option value="8:00 PM">8:00 PM</option>
                    <option value="8:30 PM">8:30 PM</option>
                    <option value="9:00 PM">9:00 PM</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setActiveTab('overview')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary"
                >
                  Save &amp; Notify Diner
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="admin-modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Admin Session: <strong>Super Admin</strong>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Close Window
          </button>
        </div>
      </div>

      {/* 16. Cancellation Reason Confirmation Sub-Modal */}
      {cancelModalOpen && (
        <div className="admin-modal-overlay sub-modal" onClick={() => setCancelModalOpen(false)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: 440, padding: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--danger)', marginBottom: 12 }}>
              <Icon name="alert-triangle" size={24} />
              <h3 style={{ margin: 0, fontSize: 17 }}>Cancel Table Booking?</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
              Are you sure you want to cancel booking <strong>#{booking.id}</strong> for <strong>{customerName}</strong>? Please select a mandatory cancellation reason.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700 }}>Cancellation Reason</label>
              <select
                className="admin-form-select"
                value={cancellationReason}
                onChange={e => setCancellationReason(e.target.value)}
              >
                {CANCELLATION_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {cancellationReason === 'Other' && (
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="Specify custom cancellation note..."
                  value={customReasonNote}
                  onChange={e => setCustomReasonNote(e.target.value)}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setCancelModalOpen(false)}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={handleConfirmCancellation}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
