import React, { useState } from 'react';
import Icon from '../Icon';

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllAsRead,
  onSendNotification,
  onActionClick,
}) {
  const [filter, setFilter] = useState('all');
  const [showCompose, setShowCompose] = useState(false);
  const [composeTitle, setComposeTitle] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeTarget, setComposeTarget] = useState('all');

  if (!isOpen) return null;

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    return (n.type || '').toLowerCase() === filter;
  });

  const handleComposeSubmit = (e) => {
    e.preventDefault();
    if (!composeTitle.trim() || !composeMessage.trim()) return;

    if (onSendNotification) {
      onSendNotification({
        title: composeTitle.trim(),
        message: composeMessage.trim(),
        target: composeTarget,
        type: 'broadcast',
      });
    }

    setComposeTitle('');
    setComposeMessage('');
    setShowCompose(false);
  };

  return (
    <div className="admin-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-drawer-card" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title-wrap">
            <Icon name="notifications" size={20} color="var(--accent)" />
            <h3>Notification Center</h3>
            <span className="notif-count-pill">{notifications.length}</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close notifications">
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Action Bar */}
        <div className="drawer-actions-bar">
          <div className="filter-chips">
            {['all', 'order', 'booking', 'system'].map(cat => (
              <button
                key={cat}
                type="button"
                className={`drawer-chip ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={() => setShowCompose(v => !v)}
            >
              <Icon name="add" size={12} /> Broadcast
            </button>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={onMarkAllAsRead}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Optional Composer */}
        {showCompose && (
          <form onSubmit={handleComposeSubmit} className="notification-composer-box">
            <strong>Send Announcement (Frontend Preview)</strong>
            <input
              type="text"
              required
              placeholder="Notification Title (e.g. Peak Hour Alert)"
              value={composeTitle}
              onChange={e => setComposeTitle(e.target.value)}
              className="admin-form-input small"
              style={{ marginTop: 6 }}
            />
            <textarea
              rows={2}
              required
              placeholder="Message body..."
              value={composeMessage}
              onChange={e => setComposeMessage(e.target.value)}
              className="admin-form-textarea small"
              style={{ marginTop: 6 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <select
                value={composeTarget}
                onChange={e => setComposeTarget(e.target.value)}
                className="admin-form-select small"
                style={{ maxWidth: 140 }}
              >
                <option value="all">All Users</option>
                <option value="diners">Active Diners</option>
                <option value="staff">Kitchen Staff</option>
              </select>
              <button type="submit" className="btn btn-xs btn-primary">
                Send Notification
              </button>
            </div>
          </form>
        )}

        {/* Notifications List */}
        <div className="drawer-scroll-list">
          {filtered.length === 0 ? (
            <div className="empty-notifications">
              <Icon name="notifications" size={32} color="var(--text-muted)" />
              <p>No notifications in this category.</p>
            </div>
          ) : (
            filtered.map((n, i) => (
              <div key={n.id || i} className={`notif-card-item ${n.read ? 'read' : 'unread'}`} style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div className="notif-icon-col" style={{ marginTop: 2 }}>
                    <Icon
                      name={n.type === 'order' ? 'orders' : n.type === 'booking' ? 'calendar' : n.type === 'refund' ? 'refund' : 'bell'}
                      size={18}
                      color="var(--accent)"
                    />
                  </div>
                  <div className="notif-content-col" style={{ flex: 1 }}>
                    <div className="notif-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 13.5 }}>{n.title}</strong>
                      <span className="notif-time" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.time || 'Just now'}</span>
                    </div>

                    {n.entityId && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>
                        {n.type === 'order' ? `Order #${n.entityId}` : `Booking ID: ${n.entityId}`}
                      </div>
                    )}

                    <p className="notif-msg" style={{ margin: '4px 0 6px', fontSize: 12.5, color: 'var(--text)' }}>
                      {n.message || n.desc}
                    </p>

                    {/* Order-specific metadata */}
                    {n.type === 'order' && (
                      <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 8, flexWrap: 'wrap' }}>
                        {n.amount !== undefined && <span>Amount: <strong>₹{n.amount}</strong></span>}
                        {n.status && <span>Status: <strong style={{ color: 'var(--success)' }}>{n.status}</strong></span>}
                      </div>
                    )}

                    {/* Booking-specific metadata */}
                    {n.type === 'booking' && (
                      <div style={{ display: 'flex', gap: 10, fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 8, flexWrap: 'wrap' }}>
                        {n.date && <span>Date: <strong>{n.date}</strong></span>}
                        {n.timeSlot && <span>Time: <strong>{n.timeSlot}</strong></span>}
                        {n.guests && <span>Guests: <strong>{n.guests}</strong></span>}
                        {n.seating && <span>Seating: <strong>{n.seating}</strong></span>}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                      {n.type === 'order' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-xs btn-secondary"
                            onClick={() => {
                              onActionClick && onActionClick('view_order', n);
                              onClose();
                            }}
                          >
                            <Icon name="orders" size={12} /> View Order
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            onClick={() => {
                              onActionClick && onActionClick('manage_order', n);
                              onClose();
                            }}
                          >
                            <Icon name="settings" size={12} /> Manage Order
                          </button>
                        </>
                      )}

                      {n.type === 'booking' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-xs btn-secondary"
                            onClick={() => {
                              onActionClick && onActionClick('view_booking', n);
                              onClose();
                            }}
                          >
                            <Icon name="calendar" size={12} /> View Booking
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            onClick={() => {
                              onActionClick && onActionClick('confirm_booking', n);
                              onClose();
                            }}
                          >
                            <Icon name="check" size={12} /> Confirm Booking
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => {
                              onActionClick && onActionClick('manage_table', n);
                              onClose();
                            }}
                          >
                            <Icon name="table" size={12} /> Manage Table
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
