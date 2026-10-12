import React from 'react';
import Icon from '../Icon';
import SafeImage from '../SafeImage';

export default function CustomerDetailsModal({
  isOpen,
  onClose,
  customer,
  orders = [],
  bookings = [],
  reviews = [],
  onToggleStatus,
  onSelectOrder,
  onSelectBooking,
}) {
  if (!isOpen || !customer) return null;

  const customerOrders = orders.filter(o =>
    (customer.id && o.userId === customer.id) ||
    (customer.email && (o.userEmail === customer.email || o.customerEmail === customer.email))
  );

  const customerBookings = bookings.filter(b =>
    (customer.id && b.userId === customer.id) ||
    (customer.email && (b.userEmail === customer.email || b.customerEmail === customer.email))
  );

  const totalSpend = customerOrders.reduce((sum, o) => sum + (o.cancelled ? 0 : (o.grandTotal || 0)), 0);

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card customer-details-modal" style={{ maxWidth: 840 }} onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: '#4361ee' }}>
              <Icon name="users" size={20} color="#ffffff" />
            </div>
            <div>
              <h3>Customer Account: {customer.fullName}</h3>
              <p className="sub">Registered Platform User • Tier: {customer.tier || 'Gold'} • ID: {customer.id}</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="modal-body-scroll" style={{ maxHeight: '72vh', overflowY: 'auto', padding: 18 }}>
          {/* Customer Profile Header */}
          <div className="customer-summary-header" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="cust-avatar-large">
              {customer.avatar ? (
                <SafeImage
                  image={customer.avatar}
                  alt={customer.fullName}
                  style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div className="cust-initials-large">
                  {(customer.fullName?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>

            <div className="cust-header-meta" style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 18 }}>{customer.fullName}</h4>
              <div className="cust-email" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                {customer.email}
              </div>
              {customer.phone && <div className="cust-phone" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Phone: {customer.phone}</div>}
              <div className="cust-pill-row" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span className="pill-tier">{customer.tier || 'Member'} Tier</span>
                <span className="pill-points">★ {customer.dinePoints || 0} DinePoints</span>
                <span className="pill-role">{customer.role || 'customer'}</span>
              </div>
            </div>
          </div>

          {/* KPI Mini Cards */}
          <div className="perf-stats-grid" style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <div className="card perf-metric-card" style={{ padding: 12 }}>
              <div className="metric-val" style={{ color: 'var(--accent)', fontSize: 18, fontWeight: 800 }}>₹{totalSpend}</div>
              <div className="metric-label" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Total Spend</div>
            </div>
            <div className="card perf-metric-card" style={{ padding: 12 }}>
              <div className="metric-val" style={{ fontSize: 18, fontWeight: 800 }}>{customerOrders.length}</div>
              <div className="metric-label" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Food Orders</div>
            </div>
            <div className="card perf-metric-card" style={{ padding: 12 }}>
              <div className="metric-val" style={{ fontSize: 18, fontWeight: 800 }}>{customerBookings.length}</div>
              <div className="metric-label" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Table Bookings</div>
            </div>
            <div className="card perf-metric-card" style={{ padding: 12 }}>
              <div className="metric-val" style={{ color: 'var(--success)', fontSize: 18, fontWeight: 800 }}>Active</div>
              <div className="metric-label" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Account Standing</div>
            </div>
          </div>

          {/* Section 12: Customer Complete Order History */}
          <div className="card customer-info-card" style={{ marginTop: 16, padding: 14 }}>
            <div className="card-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="orders" size={16} color="var(--accent)" />
                <strong style={{ fontSize: 14 }}>Order History ({customerOrders.length})</strong>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click any order to view full operations details</span>
            </div>

            {customerOrders.length === 0 ? (
              <p className="muted" style={{ margin: '10px 0', fontSize: 13 }}>No orders recorded for this user yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Restaurant</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerOrders.map(o => {
                      const dateStr = o.placedAt || o.createdAt ? new Date(o.placedAt || o.createdAt).toLocaleDateString() : 'Recent';
                      return (
                        <tr key={o.id}>
                          <td>
                            <button
                              type="button"
                              className="btn btn-link btn-xs"
                              style={{ fontWeight: 800, padding: 0 }}
                              onClick={() => onSelectOrder && onSelectOrder(o)}
                            >
                              {o.id}
                            </button>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{dateStr}</td>
                          <td style={{ fontSize: 12.5 }}>{o.restaurantName}</td>
                          <td style={{ fontSize: 12, maxWidth: 160 }} className="truncate-cell">
                            {o.items?.map(i => `${i.name} × ${i.qty}`).join(', ') || 'Dishes'}
                          </td>
                          <td><strong style={{ color: 'var(--accent)', fontSize: 13 }}>₹{o.grandTotal}</strong></td>
                          <td><span className="payment-badge" style={{ fontSize: 11 }}>{o.paymentMethod || 'UPI'}</span></td>
                          <td>
                            <span className={`status-pill ${o.cancelled ? 'danger' : 'success'}`} style={{ fontSize: 11 }}>
                              {o.status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-xs btn-outline"
                              onClick={() => onSelectOrder && onSelectOrder(o)}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 21: Customer Booking History */}
          <div className="card customer-info-card" style={{ marginTop: 16, padding: 14 }}>
            <div className="card-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="calendar" size={16} color="var(--accent)" />
                <strong style={{ fontSize: 14 }}>Booking History ({customerBookings.length})</strong>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Clicking a booking opens its reservation details</span>
            </div>

            {customerBookings.length === 0 ? (
              <p className="muted" style={{ margin: '10px 0', fontSize: 13 }}>No table bookings recorded for this diner yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Restaurant</th>
                      <th>Schedule</th>
                      <th>Party Size</th>
                      <th>Table</th>
                      <th>Food Pre-Order</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerBookings.map(b => (
                      <tr key={b.id}>
                        <td>
                          <button
                            type="button"
                            className="btn btn-link btn-xs"
                            style={{ fontWeight: 800, padding: 0 }}
                            onClick={() => onSelectBooking && onSelectBooking(b)}
                          >
                            {b.id}
                          </button>
                        </td>
                        <td><strong>{b.restaurantName}</strong></td>
                        <td style={{ fontSize: 12 }}>{b.date} at {b.time}</td>
                        <td>{b.guests} Guests</td>
                        <td>{b.tableNumber || b.tableId || 'T-12'}</td>
                        <td>
                          {b.preOrderItems && b.preOrderItems.length > 0 ? (
                            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>
                              Yes ({b.preOrderItems.length} items)
                            </span>
                          ) : (
                            <span className="muted" style={{ fontSize: 12 }}>No</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-pill ${b.status === 'Cancelled' ? 'danger' : 'success'}`} style={{ fontSize: 11 }}>
                            {b.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            onClick={() => onSelectBooking && onSelectBooking(b)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Customer Addresses */}
          {customer.addresses && customer.addresses.length > 0 && (
            <div className="card customer-info-card" style={{ marginTop: 14, padding: 14 }}>
              <div className="card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="location" size={15} color="var(--accent)" />
                <strong style={{ fontSize: 13.5 }}>Saved Delivery Addresses</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                {customer.addresses.map(a => (
                  <li key={a.id} style={{ marginBottom: 4 }}>
                    <strong>{a.label || a.type || 'Address'}:</strong> {typeof a === 'string' ? a : (a.text || a.address || '')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="admin-modal-footer">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} style={{ marginLeft: 'auto' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
