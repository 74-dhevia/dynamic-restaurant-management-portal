import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import SafeImage from '../SafeImage';

export const ORDER_LIFECYCLE_STAGES = [
  'Placed',
  'Confirmed',
  'Preparing',
  'Ready',
  'Out for Delivery',
  'Delivered',
];

export default function OrderDetailsModal({
  isOpen,
  onClose,
  order,
  onUpdateStatus,
  onCancelOrder,
  onProcessRefund,
  onUpdatePriority,
  onUpdateInternalNote,
  onUpdateKitchenStatus,
  onResolveIncident,
  onVerifyOtp,
  onViewCustomer,
  onViewRestaurant,
  onViewBooking,
}) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer requested order cancellation');
  const [cancelBy, setCancelBy] = useState('Admin');
  
  // Internal Note State
  const [noteText, setNoteText] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  // Sync internal note when order changes
  useEffect(() => {
    if (order) {
      setNoteText(order.internalNote || '');
      setSelectedStatus('');
      setShowCancelConfirm(false);
      setNoteSaved(false);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const isCancelled = order.cancelled || order.status === 'Cancelled';
  const currentStageIndex = ORDER_LIFECYCLE_STAGES.indexOf(order.status);

  // Available valid forward transitions (Do not allow invalid backward transitions from Delivered)
  const getAvailableNextStatuses = () => {
    if (isCancelled) return [];
    if (order.status === 'Delivered') return [];
    
    // Allow advancing to subsequent valid stages
    return ORDER_LIFECYCLE_STAGES.filter((st, idx) => idx > currentStageIndex);
  };

  const nextValidStages = getAvailableNextStatuses();

  // Dynamic Calculated Totals (Section 7)
  const calculatedSubtotal = (order.items || []).reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmount = order.discount || 0;
  const deliveryFee = order.orderType === 'Pickup' || order.orderType === 'Dine-in / Pre-order' ? 0 : (order.deliveryFee !== undefined ? order.deliveryFee : 30);
  const taxAmount = order.tax !== undefined ? order.tax : Math.round(calculatedSubtotal * 0.05);
  const grandTotal = order.grandTotal || Math.max(0, calculatedSubtotal - discountAmount + deliveryFee + taxAmount);

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    if (selectedStatus && selectedStatus !== order.status) {
      if (onUpdateStatus) {
        onUpdateStatus(order.id, selectedStatus);
      }
      setSelectedStatus('');
    }
  };

  const handleConfirmCancel = () => {
    if (onCancelOrder) {
      onCancelOrder(order.id, { reason: cancelReason, by: cancelBy });
    }
    setShowCancelConfirm(false);
  };

  const handleSaveNote = () => {
    if (onUpdateInternalNote) {
      onUpdateInternalNote(order.id, noteText);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    }
  };

  // Safe formatting helpers
  const orderDate = order.placedAt || order.createdAt ? new Date(order.placedAt || order.createdAt).toLocaleDateString() : 'Today';
  const orderTime = order.placedAt || order.createdAt ? new Date(order.placedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card order-details-modal-v3" onClick={e => e.stopPropagation()}>
        {/* Header (Section 6) */}
        <div className="admin-modal-header" style={{ alignItems: 'flex-start' }}>
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: isCancelled ? 'var(--danger)' : 'var(--accent)' }}>
              <Icon name="orders" size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Order #{order.id}</h3>
                <span className={`status-pill ${isCancelled ? 'danger' : 'success'}`}>
                  {order.status}
                </span>
                <span className={`order-type-chip ${order.orderType === 'Dine-in / Pre-order' ? 'preorder' : order.orderType === 'Pickup' ? 'pickup' : 'delivery'}`}>
                  <Icon name={order.orderType === 'Dine-in / Pre-order' ? 'table' : order.orderType === 'Pickup' ? 'bag' : 'scooter'} size={13} />
                  <span>{order.orderType || 'Delivery'}</span>
                </span>
                {order.priority && (
                  <span className={`priority-tag ${order.priority.toLowerCase()}`}>
                    {order.priority} Priority
                  </span>
                )}
              </div>
              <p className="sub" style={{ marginTop: 4 }}>
                {order.restaurantName} • Placed on {orderDate} at {orderTime}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="order-modal-body-scroll">
          {/* Section 19: Kitchen Incident Connection Banner */}
          {order.incident && order.incident.reported && (
            <div className="order-incident-alert-banner">
              <div className="incident-alert-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="alert-triangle" size={20} color="#b91c1c" />
                  <strong style={{ fontSize: 14, color: '#991b1b' }}>⚠ Kitchen Incident Reported</strong>
                </div>
                <span className="incident-badge">ACTION REQUIRED</span>
              </div>
              <p style={{ margin: '6px 0 10px', fontSize: 13, color: '#7f1d1d' }}>
                {order.incident.message || 'Kitchen incident reported. Order temporarily paused. Admin action required.'}
                {order.incident.type && <span> ({order.incident.type})</span>}
              </p>
              <div className="incident-action-buttons">
                <button
                  type="button"
                  className="btn btn-xs btn-outline-danger"
                  onClick={() => onResolveIncident && onResolveIncident(order.id, 'resume')}
                >
                  <Icon name="check" size={12} /> Resume Order
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={() => {
                    alert(`Notification dispatched to customer ${order.customerName || order.userName}: Order is undergoing brief kitchen check.`);
                  }}
                >
                  <Icon name="bell" size={12} /> Notify Customer
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-danger"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  <Icon name="close" size={12} /> Cancel &amp; Refund
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={() => onResolveIncident && onResolveIncident(order.id, 'dismiss')}
                >
                  Dismiss Incident
                </button>
              </div>
            </div>
          )}

          {/* Section 8: Order Status Timeline */}
          <div className="order-timeline-card-v3">
            <div className="timeline-title-row">
              <strong style={{ fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="analytics" size={15} color="var(--accent)" />
                <span>Order Fulfillment Lifecycle</span>
              </strong>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {isCancelled ? 'Order was cancelled' : `Stage ${currentStageIndex + 1} of ${ORDER_LIFECYCLE_STAGES.length}`}
              </span>
            </div>

            {isCancelled ? (
              <div className="cancelled-timeline-stepper">
                <div className="cancelled-step done">
                  <div className="step-circle"><Icon name="check" size={12} /></div>
                  <span className="step-name">Order Placed</span>
                  <span className="step-time">{orderTime}</span>
                </div>
                <div className="cancelled-connector" />
                <div className="cancelled-step done">
                  <div className="step-circle"><Icon name="check" size={12} /></div>
                  <span className="step-name">Confirmed</span>
                </div>
                <div className="cancelled-connector" />
                <div className="cancelled-step cancelled">
                  <div className="step-circle"><Icon name="close" size={12} /></div>
                  <span className="step-name">Cancelled</span>
                  <span className="step-time">{order.cancellation?.at ? new Date(order.cancellation.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Cancelled'}</span>
                </div>
              </div>
            ) : (
              <div className="interactive-timeline-stepper">
                {ORDER_LIFECYCLE_STAGES.map((stage, idx) => {
                  const isDone = currentStageIndex >= idx;
                  const isCurrent = currentStageIndex === idx;
                  const timelineEntry = order.timeline?.find(t => t.status === stage);
                  return (
                    <div key={stage} className={`lifecycle-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                      <div className="step-circle">
                        {isDone ? <Icon name="check" size={12} /> : idx + 1}
                      </div>
                      <span className="step-name">{stage}</span>
                      {timelineEntry?.at && (
                        <span className="step-timestamp">
                          {new Date(timelineEntry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {idx < ORDER_LIFECYCLE_STAGES.length - 1 && <div className="step-line-bar" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer, Restaurant, Order & Delivery Overview Grid (Sections 3, 6, 13) */}
          <div className="order-details-3col-grid">
            {/* 1. Customer Information (Section 3 & 6: Never show customer passwords) */}
            <div className="card order-info-box">
              <div className="box-header-row">
                <span className="box-title">
                  <Icon name="users" size={15} color="var(--accent)" />
                  <span>Customer Information</span>
                </span>
                {onViewCustomer && (
                  <button
                    type="button"
                    className="btn btn-link btn-xs"
                    onClick={() => onViewCustomer({
                      id: order.userId,
                      fullName: order.customerName || order.userName,
                      email: order.customerEmail || order.userEmail,
                      phone: order.customerPhone,
                      avatar: order.customerAvatar,
                    })}
                  >
                    View Customer
                  </button>
                )}
              </div>
              <div className="customer-info-content" style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                <div className="cust-avatar-frame">
                  {order.customerAvatar ? (
                    <SafeImage
                      image={order.customerAvatar}
                      alt={order.customerName || 'Customer'}
                      style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="cust-avatar-fallback">
                      {((order.customerName || order.userName || 'C')[0]).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <strong style={{ fontSize: 14, color: 'var(--text)' }}>
                    {order.customerName || order.userName || 'Guest Customer'}
                  </strong>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    {order.customerEmail || order.userEmail || 'No email registered'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Phone: {order.customerPhone || '--'}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Restaurant Information (Section 3 & 6) */}
            <div className="card order-info-box">
              <div className="box-header-row">
                <span className="box-title">
                  <Icon name="restaurant" size={15} color="var(--accent)" />
                  <span>Restaurant Partner</span>
                </span>
                {onViewRestaurant && (
                  <button
                    type="button"
                    className="btn btn-link btn-xs"
                    onClick={() => onViewRestaurant(order.restaurantId, order.restaurantName)}
                  >
                    View Restaurant
                  </button>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <strong style={{ fontSize: 14, color: 'var(--text)' }}>{order.restaurantName}</strong>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  {order.restaurantLocation || 'Bangalore Kitchen Hub'}
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  <span className="mini-badge-outline">ID: {order.restaurantId || 'r1'}</span>
                  {/* Section 18: Kitchen Status */}
                  <span className="mini-badge-kitchen" style={{ fontSize: 11 }}>
                    Kitchen: <strong style={{ color: order.kitchenStatus === 'Delayed' ? 'var(--danger)' : 'var(--accent)' }}>{order.kitchenStatus || 'Waiting'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Delivery & Fulfillment (Section 13) */}
            <div className="card order-info-box">
              <div className="box-header-row">
                <span className="box-title">
                  <Icon name="scooter" size={15} color="var(--accent)" />
                  <span>Delivery Destination</span>
                </span>
                <span className="mini-badge-outline">{order.deliveryMode || 'Delivery'}</span>
              </div>
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 13, color: 'var(--text)', margin: '0 0 4px', lineHeight: 1.4 }}>
                  {typeof order.deliveryAddress === 'string'
                    ? order.deliveryAddress
                    : (order.deliveryAddress?.text || order.address?.text || order.deliveryAddress?.address || 'Standard Delivery Address')}
                </p>
                {order.deliveryInstruction && (
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontStyle: 'italic', background: 'var(--bg)', padding: '4px 8px', borderRadius: 4 }}>
                    Note: "{order.deliveryInstruction}"
                  </div>
                )}
                {order.scheduledTime && (
                  <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>
                    Scheduled for: {order.scheduledDate || 'Today'} at {order.scheduledTime}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment & Transaction Simulation Info (Requirement 10) */}
          <div className="card" style={{ padding: 14, background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
              <strong style={{ fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="credit-card" size={15} color="var(--accent)" />
                <span>Payment &amp; Transaction Details</span>
              </strong>
              <span className="operational-tag" style={{ fontSize: 11 }}>
                SIMULATED FRONTEND GATEWAY
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, fontSize: 12.5 }}>
              <div>
                <span className="muted">Method:</span>{' '}
                <strong>{order.paymentMethod || 'UPI'}</strong>
              </div>
              <div>
                <span className="muted">Payment Status:</span>{' '}
                <span className={`status-pill ${(order.paymentStatus || '').includes('Paid') ? 'success' : 'warning'}`} style={{ fontSize: 11, marginLeft: 6 }}>
                  {order.paymentStatus || 'Paid (Demo)'}
                </span>
              </div>
              <div>
                <span className="muted">Demo Reference:</span>{' '}
                <code>{order.paymentRef || `PAY-ZST-${order.id.replace(/\D/g, '') || '48291'}`}</code>
              </div>
              <div>
                <span className="muted">Total Captured:</span>{' '}
                <strong style={{ color: 'var(--accent)', fontSize: 13.5 }}>₹{order.grandTotal}</strong>
              </div>
            </div>
          </div>

          {/* Section 17: Dine-In / Food Pre-Order Connection */}
          {order.orderType === 'Dine-in / Pre-order' && (
            <div className="card preorder-dinein-connection-banner">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="preorder-table-icon">
                    <Icon name="table" size={20} color="#7209b7" />
                  </div>
                  <div>
                    <strong style={{ fontSize: 14, color: '#581c87' }}>Connected Table Reservation: #{order.bookingId || 'BK-2048'}</strong>
                    <div style={{ fontSize: 12.5, color: '#6b21a8' }}>
                      Table: <strong>{order.table || 'T-12'}</strong> • Party: <strong>{order.guests || 4} Guests</strong> • Status: <strong>{order.bookingStatus || 'Confirmed'}</strong>
                    </div>
                  </div>
                </div>
                {onViewBooking && (
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    style={{ borderColor: '#7209b7', color: '#7209b7' }}
                    onClick={() => onViewBooking(order.bookingId || 'BK-2048')}
                  >
                    View Connected Booking
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section 7: Food Items Table with Individual Details */}
          <div className="card order-items-container-card">
            <div className="items-header-bar">
              <strong style={{ fontSize: 14 }}>Ordered Food Items ({order.items?.length || 0})</strong>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Prices in INR (₹)</span>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Food Item</th>
                    <th style={{ textAlign: 'center' }}>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Discount</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item, idx) => {
                    const unitPrice = item.price || 0;
                    const itemQty = item.qty || 1;
                    const itemDisc = item.discount || 0;
                    const lineTotal = (unitPrice * itemQty) - itemDisc;

                    return (
                      <tr key={item.id || idx}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <SafeImage
                              image={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                              alt={item.name}
                              style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                            />
                            <div>
                              <strong style={{ fontSize: 13.5, color: 'var(--text)' }}>{item.name}</strong>
                              {item.spiceLevel && (
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Spice: {item.spiceLevel}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 700 }}>
                          × {itemQty}
                        </td>
                        <td style={{ textAlign: 'right', fontSize: 13 }}>
                          ₹{unitPrice} each
                        </td>
                        <td style={{ textAlign: 'right', fontSize: 13, color: itemDisc > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                          {itemDisc > 0 ? `- ₹${itemDisc}` : '--'}
                        </td>
                        <td style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 800, color: 'var(--accent)' }}>
                          ₹{lineTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Price Breakdown (Section 7: dynamic calculations) */}
            <div className="order-price-calculation-footer">
              <div className="price-calc-col">
                <div className="calc-row">
                  <span>Subtotal:</span>
                  <strong>₹{calculatedSubtotal}</strong>
                </div>
                {discountAmount > 0 && (
                  <div className="calc-row discount-row" style={{ color: 'var(--success)' }}>
                    <span>Promotional Discount:</span>
                    <strong>- ₹{discountAmount}</strong>
                  </div>
                )}
                <div className="calc-row">
                  <span>Delivery Fee:</span>
                  <strong>{deliveryFee > 0 ? `₹${deliveryFee}` : 'FREE'}</strong>
                </div>
                <div className="calc-row">
                  <span>Taxes &amp; GST:</span>
                  <strong>₹{taxAmount}</strong>
                </div>
                <div className="calc-row grand-total-row">
                  <span style={{ fontSize: 15, fontWeight: 800 }}>Grand Total:</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent)' }}>₹{grandTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Control Grid: Delivery OTP, Kitchen Status, Priority, Internal Notes */}
          <div className="order-operations-secondary-grid">
            {/* Section 14: Delivery OTP Verification (Only status shown, never real OTP to admin) */}
            <div className="card op-card-item">
              <div className="op-card-header">
                <Icon name="shield" size={15} color="var(--accent)" />
                <strong>Delivery Verification (OTP)</strong>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 8px' }}>
                Secure rider handover confirmation. Actual customer passcode is never exposed.
              </p>
              <div className="otp-status-display-row">
                <span className="otp-label">OTP Status:</span>
                <span className={`otp-status-chip ${order.otpStatus === 'Verified' ? 'verified' : 'pending'}`}>
                  {order.otpStatus || (order.status === 'Delivered' ? 'Verified' : 'Pending')}
                </span>
                {order.otpStatus !== 'Verified' && order.status !== 'Cancelled' && (
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-success"
                    onClick={() => onVerifyOtp && onVerifyOtp(order.id)}
                  >
                    Mark Verified
                  </button>
                )}
              </div>
            </div>

            {/* Section 18: Kitchen Status Control */}
            <div className="card op-card-item">
              <div className="op-card-header">
                <Icon name="chef" size={15} color="var(--accent)" />
                <strong>Kitchen Connection Status</strong>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 8px' }}>
                Direct synchronization with kitchen order ticket line.
              </p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select
                  value={order.kitchenStatus || 'Waiting'}
                  onChange={e => onUpdateKitchenStatus && onUpdateKitchenStatus(order.id, e.target.value)}
                  className="admin-form-select small"
                  disabled={isCancelled || order.status === 'Delivered'}
                >
                  <option value="Waiting">Waiting</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready">Ready</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
            </div>

            {/* Section 20: Order Priority Control */}
            <div className="card op-card-item">
              <div className="op-card-header">
                <Icon name="analytics" size={15} color="var(--accent)" />
                <strong>Order Priority</strong>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 8px' }}>
                Operational urgency flag for kitchen and delivery routing.
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Normal', 'High', 'Urgent'].map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-xs ${order.priority === p ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => onUpdatePriority && onUpdatePriority(order.id, p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 21: Internal Admin Notes (Private from Customer) */}
          <div className="card internal-notes-card">
            <div className="notes-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="edit" size={15} color="#d97706" />
                <strong style={{ fontSize: 13.5 }}>Internal Admin Note</strong>
              </div>
              <span className="private-badge">🔒 Strictly Internal • Never shown to customer</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <textarea
                rows={2}
                placeholder="Add private operational notes here (e.g., customer requested extra spicy, caller confirmed address, etc.)..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                className="admin-form-textarea"
                style={{ fontSize: 13, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, gap: 8, alignItems: 'center' }}>
                {noteSaved && <span style={{ fontSize: 12, color: 'var(--success)' }}>✓ Note Saved</span>}
                <button
                  type="button"
                  className="btn btn-xs btn-primary"
                  onClick={handleSaveNote}
                >
                  Save Internal Note
                </button>
              </div>
            </div>
          </div>

          {/* Section 15 & 16: Cancellation & Refund Summary */}
          {isCancelled && (
            <div className="card cancellation-refund-audit-card">
              <div className="audit-header">
                <Icon name="alert-triangle" size={16} color="var(--danger)" />
                <strong style={{ fontSize: 14, color: 'var(--danger)' }}>Order Cancellation &amp; Refund Details</strong>
              </div>
              <div className="cancellation-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 10 }}>
                <div>
                  <span className="label-sm">Cancellation Reason:</span>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{order.cancellation?.reason || 'Not specified'}</div>
                </div>
                <div>
                  <span className="label-sm">Cancelled By:</span>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{order.cancellation?.cancelledBy || 'Admin'}</div>
                </div>
                <div>
                  <span className="label-sm">Cancelled At:</span>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {order.cancellation?.at ? new Date(order.cancellation.at).toLocaleString() : orderDate}
                  </div>
                </div>
                <div>
                  <span className="label-sm">Refund Status:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span className={`status-pill ${order.refund?.status === 'Completed' ? 'success' : 'danger'}`}>
                      {order.refund?.status || 'Processing'}
                    </span>
                    {order.refund && order.refund.status !== 'Completed' && (
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-success"
                        onClick={() => onProcessRefund && onProcessRefund(order.id)}
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 22: Recent Order Activity Audit Trail */}
          <div className="card recent-activity-timeline-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon name="activity" size={15} color="var(--accent)" />
              <strong style={{ fontSize: 13.5 }}>Recent Order Activity &amp; Audit Trail</strong>
            </div>
            <div className="audit-events-list">
              {(order.timeline || []).map((t, idx) => (
                <div key={idx} className="audit-event-row">
                  <div className="audit-dot" />
                  <div className="audit-details">
                    <strong style={{ fontSize: 13 }}>{t.status}</strong>
                    {t.note && <span className="audit-note"> — {t.note}</span>}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      {t.at ? new Date(t.at).toLocaleString() : 'Recent'} {t.updatedBy && `• by ${t.updatedBy}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls (Section 9: Admin Order Status Control & Confirmations) */}
        <div className="admin-modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          {/* Status Progression Controls */}
          {!isCancelled && order.status !== 'Delivered' && (
            <form onSubmit={handleStatusSubmit} className="order-status-advancer-form" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Advance Status:</span>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="admin-form-select small"
              >
                <option value="">Select next status...</option>
                {nextValidStages.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={!selectedStatus}
              >
                Update Status
              </button>
            </form>
          )}

          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            {!isCancelled && order.status !== 'Delivered' && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => setShowCancelConfirm(true)}
              >
                Cancel Order
              </button>
            )}
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Close Details
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Order Cancellation (Section 9 & 15) */}
      {showCancelConfirm && (
        <div className="admin-modal-overlay" style={{ zIndex: 10001 }} onClick={() => setShowCancelConfirm(false)}>
          <div className="admin-modal-card" style={{ maxWidth: 450, padding: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Icon name="alert-triangle" size={24} color="var(--danger)" />
              <h4 style={{ margin: 0, fontSize: 17 }}>Are you sure you want to cancel this order?</h4>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Cancelling order <strong>#{order.id}</strong> will notify the customer, stop kitchen preparation, and initiate an automatic refund of <strong>₹{grandTotal}</strong>.
            </p>
            <div style={{ marginTop: 12 }}>
              <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600 }}>Cancellation Reason</label>
              <input
                type="text"
                className="admin-form-input small"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setShowCancelConfirm(false)}
              >
                Go Back
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={handleConfirmCancel}
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
