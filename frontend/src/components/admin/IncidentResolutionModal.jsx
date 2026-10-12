import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Icon from '../Icon';
import SafeImage from '../SafeImage';
import { useToast } from '../../contexts/ToastContext';
import { resolveKitchenIncidentRecord } from '../../redux/slices/chefSlice';
import {
  pauseOrder,
  resumeOrder,
  cancelOrderFromIncident,
  notifyCustomerSimulated,
  completeRefund,
} from '../../redux/slices/orderSlice';

export default function IncidentResolutionModal({
  isOpen,
  onClose,
  incident,
}) {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const allOrders = useSelector(s => s.order?.orders || []);

  const [adminNote, setAdminNote] = useState('');
  const [notifyModalOrder, setNotifyModalOrder] = useState(null);
  const [customNotificationMessage, setCustomNotificationMessage] = useState('');
  const [notifyChannel, setNotifyChannel] = useState('WhatsApp + SMS');

  if (!isOpen || !incident) return null;

  // Retrieve affected orders from Redux
  const affectedOrdersList = (incident.affectedOrders || [])
    .map(orderId => allOrders.find(o => o.id === orderId))
    .filter(Boolean);

  const handlePauseOrder = (orderId) => {
    dispatch(pauseOrder({ id: orderId, reason: `Kitchen incident (${incident.incidentType}): Order paused by Admin.` }));
    showToast(`Order #${orderId} paused. Kitchen status set to Delayed.`, 'info');
  };

  const handleResumeOrder = (orderId) => {
    dispatch(resumeOrder({ id: orderId, note: `Admin resumed order after assessing ${incident.incidentType}.` }));
    showToast(`Order #${orderId} resumed. Kitchen status set to Preparing.`, 'success');
  };

  const handleCancelOrder = (orderId) => {
    dispatch(cancelOrderFromIncident({ id: orderId, reason: `Cancelled due to kitchen incident: ${incident.incidentType}` }));
    showToast(`Order #${orderId} cancelled due to incident.`, 'error');
  };

  const handleStartRefund = (order) => {
    dispatch(completeRefund({
      id: order.id,
      amount: order.grandTotal || 500,
      method: order.paymentMethod || 'Original Payment Source',
      reason: `Kitchen incident: ${incident.incidentType}`,
    }));
    showToast(`Full refund of ₹${order.grandTotal} completed for Order #${order.id}.`, 'success');
  };

  const handleOpenNotifyModal = (order) => {
    setNotifyModalOrder(order);
    setCustomNotificationMessage(
      `Dear ${order.customerName || 'Customer'}, your order #${order.id} from ${incident.restaurantName} is delayed due to an operational issue (${incident.incidentType}). Our culinary team is handling this with urgency. Thank you for your patience.`
    );
  };

  const handleSendSimulatedNotification = () => {
    if (!notifyModalOrder) return;
    dispatch(notifyCustomerSimulated({
      id: notifyModalOrder.id,
      message: customNotificationMessage,
      channel: notifyChannel,
      recipientPhone: notifyModalOrder.customerPhone,
    }));
    showToast(
      `[SIMULATED NOTIFICATION] Message queued to ${notifyModalOrder.customerPhone || 'customer'}. Live WhatsApp/SMS API will trigger in production backend.`,
      'info'
    );
    setNotifyModalOrder(null);
  };

  const handleResolveIncident = () => {
    dispatch(resolveKitchenIncidentRecord({
      id: incident.id,
      adminNote: adminNote.trim() || 'Admin resolved kitchen incident and cleared operational roadblock.',
    }));
    showToast(`Incident #${incident.id} marked as RESOLVED.`, 'success');
    onClose();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card incident-resolution-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 880 }}>
        {/* Header */}
        <div className="admin-modal-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: '#dc2626', color: '#ffffff' }}>
              <Icon name="warning" size={20} />
            </div>
            <div>
              <h3 style={{ color: '#ef4444' }}>
                Kitchen Incident Management &amp; Customer Order Dispatch
              </h3>
              <p className="sub">
                Incident #{incident.id} • {incident.incidentType} ({incident.severity}) • {incident.restaurantName}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body-scroll" style={{ maxHeight: '74vh', padding: '20px 24px' }}>
          {/* Incident Dossier Card */}
          <div className="card incident-dossier-card">
            <div className="dossier-grid">
              <div>
                <span className="dossier-label">Station / Restaurant:</span>
                <strong>{incident.restaurantName}</strong>
              </div>
              <div>
                <span className="dossier-label">Reporting Chef:</span>
                <strong>{incident.chefName}</strong>
              </div>
              <div>
                <span className="dossier-label">Incident Type:</span>
                <span className="incident-badge-type">{incident.incidentType}</span>
              </div>
              <div>
                <span className="dossier-label">Severity:</span>
                <span className={`severity-tag ${incident.severity?.toLowerCase()}`}>
                  {incident.severity}
                </span>
              </div>
              <div>
                <span className="dossier-label">Reported Time:</span>
                <span>{incident.reportedAt ? new Date(incident.reportedAt).toLocaleString() : 'Just now'}</span>
              </div>
              <div>
                <span className="dossier-label">Status:</span>
                <span className={`incident-status-pill ${incident.status || 'open'}`}>
                  {(incident.status || 'OPEN').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="dossier-desc-box">
              <span className="dossier-label">Chef Description &amp; Operational Statement:</span>
              <p className="dossier-desc-text">"{incident.description}"</p>
            </div>

            {incident.image && (
              <div className="dossier-evidence-box">
                <span className="dossier-label">Attached Incident Evidence:</span>
                <div style={{ marginTop: 6 }}>
                  <SafeImage
                    image={incident.image}
                    alt="Incident Evidence"
                    style={{ maxWidth: 280, maxHeight: 180, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 7: Affected Customer Orders */}
          <div className="affected-orders-section" style={{ marginTop: 22 }}>
            <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="orders" size={18} color="var(--accent)" />
                <h4 style={{ margin: 0, fontSize: 16 }}>
                  Affected Customer Orders ({affectedOrdersList.length})
                </h4>
              </div>
              <span className="mini-badge-outline">
                Kitchen Temporarily Paused
              </span>
            </div>

            {affectedOrdersList.length === 0 ? (
              <div className="card empty-affected-panel" style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No active customer orders were attached to this incident record.</p>
              </div>
            ) : (
              <div className="affected-orders-stack">
                {affectedOrdersList.map(order => {
                  const isPaused = order.kitchenStatus === 'Delayed' || (order.incident && order.incident.paused);
                  const isCancelled = order.cancelled || order.status === 'Cancelled';
                  const isRefunded = order.refundStatus === 'Completed';

                  return (
                    <div key={order.id} className={`card affected-order-card ${isCancelled ? 'cancelled-card' : ''}`}>
                      <div className="affected-order-main">
                        <div className="order-id-col">
                          <strong className="order-id-text">Order #{order.id}</strong>
                          <span className={`status-pill mini ${order.status?.toLowerCase()}`}>{order.status}</span>
                          <span className="kitchen-status-text">
                            Kitchen: <strong style={{ color: isPaused ? 'var(--danger)' : 'var(--accent)' }}>{order.kitchenStatus || 'Waiting'}</strong>
                          </span>
                        </div>

                        <div className="order-customer-col">
                          <strong>{order.customerName || order.userName || 'Guest Customer'}</strong>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Phone: {order.customerPhone || '--'}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total: ₹{order.grandTotal} ({order.paymentMethod})</div>
                        </div>

                        <div className="order-dishes-col">
                          <span className="dossier-label" style={{ fontSize: 11 }}>Items:</span>
                          <div className="dishes-summary-text">
                            {(order.items || []).map(i => `${i.name} × ${i.qty}`).join(', ')}
                          </div>
                        </div>
                      </div>

                      {/* Customer Action Choices (Section 7) */}
                      <div className="affected-order-actions-bar">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => handleOpenNotifyModal(order)}
                          title="Simulate SMS/WhatsApp dispatch"
                        >
                          <Icon name="mail" size={13} />
                          <span>Notify Customer</span>
                        </button>

                        {!isCancelled && (
                          <>
                            {isPaused ? (
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-success"
                                onClick={() => handleResumeOrder(order.id)}
                              >
                                <Icon name="flame" size={13} />
                                <span>Resume Order</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-warning"
                                onClick={() => handlePauseOrder(order.id)}
                              >
                                <Icon name="clock" size={13} />
                                <span>Pause Order</span>
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn btn-xs btn-outline-danger"
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              <Icon name="close" size={13} />
                              <span>Cancel Order</span>
                            </button>
                          </>
                        )}

                        {!isRefunded ? (
                          <button
                            type="button"
                            className="btn btn-xs btn-secondary"
                            onClick={() => handleStartRefund(order)}
                            title="Start customer refund process"
                          >
                            <Icon name="refund" size={13} />
                            <span>Start Refund</span>
                          </button>
                        ) : (
                          <span className="refunded-pill">✓ Refund Processed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin Resolution Section */}
          <div className="incident-resolution-input-card card" style={{ marginTop: 22, padding: 18 }}>
            <label htmlFor="admin-incident-note" className="form-label" style={{ fontWeight: 700 }}>
              Admin Operations Resolution Summary:
            </label>
            <textarea
              id="admin-incident-note"
              rows={2}
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="Describe corrective actions taken (e.g., replacement equipment deployed, maintenance verified, orders resumed or refunded)..."
              className="admin-form-textarea"
              style={{ width: '100%', fontSize: 13, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Close Window
          </button>
          <button
            type="button"
            className="btn btn-success btn-sm"
            onClick={handleResolveIncident}
            style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="check" size={15} />
            <span>Mark Incident Resolved &amp; Close</span>
          </button>
        </div>
      </div>

      {/* Simulated Customer Notification Modal */}
      {notifyModalOrder && (
        <div className="admin-modal-overlay sub-modal" onClick={() => setNotifyModalOrder(null)}>
          <div className="admin-modal-card notify-customer-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge" style={{ background: 'var(--accent)', color: '#fff' }}>
                  <Icon name="mail" size={18} />
                </div>
                <div>
                  <h4>Notify Customer: {notifyModalOrder.customerName}</h4>
                  <p className="sub">Order #{notifyModalOrder.id} • {notifyModalOrder.customerPhone || 'No Phone'}</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setNotifyModalOrder(null)}>
                <Icon name="close" size={16} />
              </button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Dispatch Channel:</label>
                <select
                  value={notifyChannel}
                  onChange={e => setNotifyChannel(e.target.value)}
                  className="admin-form-select"
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  <option value="WhatsApp + SMS">WhatsApp + SMS Priority Broadcast</option>
                  <option value="SMS Only">Standard SMS</option>
                  <option value="In-App Push">In-App Customer Push Banner</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Message Preview:</label>
                <textarea
                  rows={4}
                  value={customNotificationMessage}
                  onChange={e => setCustomNotificationMessage(e.target.value)}
                  className="admin-form-textarea"
                  style={{ width: '100%', fontSize: 13 }}
                />
              </div>

              <div className="backend-disclaimer-box" style={{ background: 'var(--bg)', padding: 10, borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', border: '1px solid var(--border)', marginTop: 10 }}>
                ℹ️ <em>Backend Integration Status:</em> Real SMS/WhatsApp API gateway endpoints are not implemented yet. Clicking send records a simulated customer alert in the order audit timeline.
              </div>
            </div>

            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setNotifyModalOrder(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSendSimulatedNotification}
                style={{ fontWeight: 700 }}
              >
                Send Simulated Customer Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
