import React, { useState } from 'react';
import { ISSUE_STATUS_SEQUENCE } from '../../services/issueApiService';

export default function IssueDetailsModal({
  issue,
  onClose,
  onStatusChange,
  onSendResponse,
  onNotifyAffectedCustomer,
  onStartRefund,
  onViewOrder,
  onViewBooking,
  onViewIncident,
}) {
  if (!issue) return null;

  const [responseText, setResponseText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notifyConfirmOpen, setNotifyConfirmOpen] = useState(false);
  const [refundConfirmOpen, setRefundConfirmOpen] = useState(false);

  // Status index for progression validation
  const currentStatusIdx = ISSUE_STATUS_SEQUENCE.indexOf(issue.status);

  // Valid next statuses (can move forward or close)
  const canAdvance = currentStatusIdx < ISSUE_STATUS_SEQUENCE.length - 1;
  const nextStatus = canAdvance ? ISSUE_STATUS_SEQUENCE[currentStatusIdx + 1] : null;

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) return;
    setIsSending(true);
    try {
      await onSendResponse(issue.id, responseText.trim());
      setResponseText('');
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmNotify = async () => {
    setNotifyConfirmOpen(false);
    await onNotifyAffectedCustomer(issue.id);
  };

  const handleConfirmRefund = async () => {
    setRefundConfirmOpen(false);
    await onStartRefund(issue.id);
  };

  // Priority color helper
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Critical':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.35)' };
      case 'High':
        return { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: 'rgba(249, 115, 22, 0.35)' };
      case 'Medium':
        return { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.35)' };
      case 'Low':
      default:
        return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.35)' };
    }
  };

  const pStyle = getPriorityStyle(issue.priority);

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="card modal-content"
        style={{
          width: '100%',
          maxWidth: '840px',
          background: 'var(--surface, #1e222d)',
          borderRadius: '16px',
          border: '1px solid var(--border, #333a4d)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          animation: 'fadeInScale 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border, #333a4d)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--surface-header, rgba(255,255,255,0.02))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                  Issue Ticket #{issue.id}
                </h3>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: pStyle.bg,
                    color: pStyle.text,
                    border: `1px solid ${pStyle.border}`,
                  }}
                >
                  {issue.priority} Priority
                </span>
              </div>
              <span className="muted" style={{ fontSize: '12px' }}>
                Type: {issue.issueType} • Reported: {new Date(issue.reportedAt).toLocaleString()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--text-muted, #8b949e)',
              padding: '6px',
              borderRadius: '8px',
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Progression Stepper */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--bg, #141721)',
              border: '1px solid var(--border, #333a4d)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted, #8b949e)', fontWeight: 600 }}>
                Resolution Workflow
              </span>
              <span style={{ fontSize: '12px', color: '#2ecc71', fontWeight: 600 }}>
                Current Status: <strong>{issue.status}</strong>
              </span>
            </div>

            {/* Steps visual */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {ISSUE_STATUS_SEQUENCE.map((st, idx) => {
                const isPassed = idx <= currentStatusIdx;
                const isCurrent = idx === currentStatusIdx;
                return (
                  <React.Fragment key={st}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: isCurrent ? 700 : 500,
                        background: isCurrent
                          ? '#ff7b00'
                          : isPassed
                          ? 'rgba(46, 204, 113, 0.15)'
                          : 'rgba(255, 255, 255, 0.05)',
                        color: isCurrent
                          ? '#fff'
                          : isPassed
                          ? '#2ecc71'
                          : 'var(--text-muted, #8b949e)',
                        border: `1px solid ${
                          isCurrent
                            ? '#ff7b00'
                            : isPassed
                            ? 'rgba(46, 204, 113, 0.3)'
                            : 'var(--border, #333a4d)'
                        }`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>{isPassed && !isCurrent ? '✓' : idx + 1}</span>
                      <span>{st}</span>
                    </div>
                    {idx < ISSUE_STATUS_SEQUENCE.length - 1 && (
                      <span style={{ color: isPassed ? '#2ecc71' : 'var(--border, #333a4d)', fontSize: '14px' }}>
                        →
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Status action buttons */}
            <div style={{ marginTop: '14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              {canAdvance && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: '6px', fontWeight: 600 }}
                  onClick={() => onStatusChange(issue.id, nextStatus)}
                >
                  Advance to: {nextStatus} →
                </button>
              )}
              {issue.status !== 'Closed' && issue.status !== 'Resolved' && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ borderRadius: '6px', borderColor: '#2ecc71', color: '#2ecc71' }}
                  onClick={() => onStatusChange(issue.id, 'Resolved')}
                >
                  Mark as Resolved
                </button>
              )}
              {issue.status === 'Resolved' && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ borderRadius: '6px' }}
                  onClick={() => onStatusChange(issue.id, 'Closed')}
                >
                  Close Ticket
                </button>
              )}
            </div>
          </div>

          {/* Section 20 & 21: Kitchen Incident Connection & Affected Customer Alert */}
          {issue.isKitchenIncidentRelated && (
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: 700, fontSize: '14px' }}>
                  <span>⚠️</span> Kitchen Incident Related
                </div>
                <div style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text, #fff)' }}>
                  <strong>Cause:</strong> {issue.incidentCause || 'Kitchen equipment interruption'}
                </div>
                <div className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                  Incident Reference: <strong>#{issue.relatedIncidentId || 'INC-1024'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {issue.relatedIncidentId && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ borderRadius: '6px' }}
                    onClick={() => onViewIncident && onViewIncident(issue.relatedIncidentId)}
                  >
                    View Incident #{issue.relatedIncidentId}
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '6px',
                    fontWeight: 600,
                  }}
                  onClick={() => setNotifyConfirmOpen(true)}
                >
                  📢 Notify Customer
                </button>
              </div>
            </div>
          )}

          {/* Section 21 Confirmation Modal for Affected Customer Alert */}
          {notifyConfirmOpen && (
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                marginTop: '-10px',
              }}
            >
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text, #fff)' }}>
                This customer may be affected by an operational incident. Notify them?
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: '6px', background: '#f97316', borderColor: '#f97316' }}
                  onClick={handleConfirmNotify}
                >
                  Yes, Send In-App Notice
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ borderRadius: '6px' }}
                  onClick={() => setNotifyConfirmOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Customer & Related Entity Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Customer Box */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border, #333a4d)',
              }}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted, #8b949e)', fontWeight: 600, marginBottom: '8px' }}>
                👤 Customer Details
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text, #fff)' }}>
                {issue.customerName || 'Customer'}
              </div>
              <div className="muted" style={{ fontSize: '13px', marginTop: '4px' }}>
                ✉️ {issue.customerEmail || 'No email provided'}
              </div>
              <div className="muted" style={{ fontSize: '13px', marginTop: '2px' }}>
                📞 {issue.customerPhone || 'No phone provided'}
              </div>
            </div>

            {/* Related Order Box */}
            {issue.orderId && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.04)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#38bdf8', fontWeight: 600 }}>
                    📦 Related Order
                  </div>
                  {onViewOrder && (
                    <button
                      type="button"
                      className="btn btn-xs"
                      style={{
                        background: 'rgba(56, 189, 248, 0.2)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={() => onViewOrder(issue.orderId)}
                    >
                      View Order →
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>
                  Order #{issue.orderId}
                </div>
                <div className="muted" style={{ fontSize: '13px', marginTop: '4px' }}>
                  🏪 {issue.restaurantName || issue.relatedOrder?.restaurantName || 'ZESTRO Partner'}
                </div>
                {issue.relatedOrder && (
                  <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text, #fff)' }}>
                    Total: ₹{issue.relatedOrder.grandTotal} • Status: {issue.relatedOrder.status}
                  </div>
                )}
              </div>
            )}

            {/* Related Booking Box */}
            {issue.bookingId && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(46, 204, 113, 0.04)',
                  border: '1px solid rgba(46, 204, 113, 0.25)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#2ecc71', fontWeight: 600 }}>
                    📅 Related Booking
                  </div>
                  {onViewBooking && (
                    <button
                      type="button"
                      className="btn btn-xs"
                      style={{
                        background: 'rgba(46, 204, 113, 0.2)',
                        color: '#2ecc71',
                        border: '1px solid rgba(46, 204, 113, 0.4)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={() => onViewBooking(issue.bookingId)}
                    >
                      View Booking →
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#2ecc71' }}>
                  Booking #{issue.bookingId}
                </div>
                <div className="muted" style={{ fontSize: '13px', marginTop: '4px' }}>
                  🏪 {issue.restaurantName || issue.relatedBooking?.restaurantName || 'ZESTRO Partner'}
                </div>
                {issue.relatedBooking && (
                  <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text, #fff)' }}>
                    Date: {issue.relatedBooking.date} • Guests: {issue.relatedBooking.guests || 2}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Problem Statement Box */}
          <div
            style={{
              padding: '18px',
              borderRadius: '12px',
              background: 'var(--bg, #141721)',
              border: '1px solid var(--border, #333a4d)',
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted, #8b949e)', fontWeight: 600, marginBottom: '6px' }}>
              Problem Description
            </div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--text, #fff)' }}>
              {issue.subject || issue.issueType}
            </h4>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: 'var(--text, #e6edf3)' }}>
              {issue.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Section 22: Refund Connection */}
          {issue.orderId && (
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(251, 133, 0, 0.05)',
                border: '1px solid rgba(251, 133, 0, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#fb8500', fontWeight: 600 }}>
                  💳 Refund Management
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px', color: 'var(--text, #fff)' }}>
                  Refund Status: <span style={{ color: '#fb8500' }}>{issue.refundStatus || 'Not Started'}</span>
                </div>
                <span className="muted" style={{ fontSize: '12px' }}>
                  (Connects to order payment gateway verification)
                </span>
              </div>

              {issue.refundStatus === 'Not Started' ? (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    background: 'rgba(251, 133, 0, 0.2)',
                    color: '#fb8500',
                    border: '1px solid rgba(251, 133, 0, 0.4)',
                    borderRadius: '6px',
                    fontWeight: 600,
                  }}
                  onClick={() => setRefundConfirmOpen(true)}
                >
                  Start Refund
                </button>
              ) : (
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'rgba(251, 133, 0, 0.15)',
                    color: '#fb8500',
                    border: '1px solid rgba(251, 133, 0, 0.3)',
                  }}
                >
                  ● {issue.refundStatus}
                </span>
              )}
            </div>
          )}

          {/* Refund Confirmation Prompt */}
          {refundConfirmOpen && (
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(251, 133, 0, 0.1)',
                border: '1px solid rgba(251, 133, 0, 0.4)',
                marginTop: '-10px',
              }}
            >
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text, #fff)' }}>
                Initiate full refund for Order #{issue.orderId}? This will update the order's payment status to 'Refund Processing'.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: '6px', background: '#fb8500', borderColor: '#fb8500' }}
                  onClick={handleConfirmRefund}
                >
                  Confirm Refund
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ borderRadius: '6px' }}
                  onClick={() => setRefundConfirmOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Section 25: Activity Timeline */}
          <div
            style={{
              padding: '18px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border, #333a4d)',
            }}
          >
            <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 700 }}>
              ⏱️ Activity Timeline
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {issue.timeline && issue.timeline.length > 0 ? (
                issue.timeline.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text, #fff)' }}>
                        {item.status}
                      </div>
                      <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                        {item.note || item.status} • {new Date(item.at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="muted" style={{ fontSize: '13px' }}>No timeline events recorded.</div>
              )}
            </div>
          </div>

          {/* Section 16: Admin Response */}
          <div
            style={{
              padding: '18px',
              borderRadius: '12px',
              background: 'var(--bg, #141721)',
              border: '1px solid var(--border, #333a4d)',
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700 }}>
              💬 Admin Responses &amp; Communication
            </h4>

            {/* Existing Responses */}
            {issue.adminResponses && issue.adminResponses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {issue.adminResponses.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border, #333a4d)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#ff7b00' }}>
                        {r.sender || 'Admin'}
                      </span>
                      <span className="muted" style={{ fontSize: '11px' }}>
                        {new Date(r.sentAt).toLocaleString()} ({r.channel || 'In-App'})
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text, #e6edf3)', lineHeight: '1.5' }}>
                      {r.message}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted" style={{ fontSize: '13px', marginBottom: '16px' }}>
                No admin responses sent yet.
              </div>
            )}

            {/* Write Response Form */}
            <form onSubmit={handleSendResponse}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted, #8b949e)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Admin Response
              </label>
              <textarea
                rows={3}
                placeholder="Write a response to the customer..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border, #333a4d)',
                  color: 'var(--text, #fff)',
                  resize: 'vertical',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span className="muted" style={{ fontSize: '11px' }}>
                  Response will be saved in-app and dispatched to customer alerts.
                </span>
                <button
                  type="submit"
                  disabled={!responseText.trim() || isSending}
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: '6px', fontWeight: 600 }}
                >
                  {isSending ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border, #333a4d)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--surface-header, rgba(255,255,255,0.02))',
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ borderRadius: '8px', padding: '8px 20px', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
