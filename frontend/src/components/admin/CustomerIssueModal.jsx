import React, { useState } from 'react';
import Icon from '../Icon';

export default function CustomerIssueModal({
  isOpen,
  onClose,
  issue,
  onUpdateStatus,
  onOpenOrder,
}) {
  if (!isOpen || !issue) return null;

  const [status, setStatus] = useState(issue.status || 'Processing');
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

  const statuses = ['Open', 'Processing', 'Waiting for Customer', 'Resolved', 'Closed'];

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateStatus(issue.id, status, adminNote);
      setSaving(false);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  const getPriorityColor = (p) => {
    switch ((p || '').toLowerCase()) {
      case 'urgent': return 'var(--danger)';
      case 'high': return '#fb8500';
      case 'medium': return '#ffb703';
      default: return 'var(--accent)';
    }
  };

  const getStatusColor = (s) => {
    switch ((s || '').toLowerCase()) {
      case 'resolved':
      case 'closed': return 'var(--success)';
      case 'processing': return 'var(--accent)';
      case 'waiting for customer': return '#fb8500';
      default: return 'var(--danger)';
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="admin-modal-card customer-issue-modal"
        style={{ maxWidth: 620 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: getStatusColor(issue.status) }}>
              <Icon name="alert-triangle" size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>Issue #{issue.id}</h3>
                <span
                  className="status-pill"
                  style={{
                    background: `${getStatusColor(issue.status)}22`,
                    color: getStatusColor(issue.status),
                    fontWeight: 700,
                  }}
                >
                  {issue.status}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: `${getPriorityColor(issue.priority)}22`,
                    color: getPriorityColor(issue.priority),
                  }}
                >
                  {issue.priority} Priority
                </span>
              </div>
              <p className="sub" style={{ margin: '4px 0 0' }}>
                Customer: <strong>{issue.customerName}</strong> ({issue.customerEmail})
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="modal-body-scroll" style={{ padding: 20 }}>
          {/* Issue Summary Meta Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              padding: 14,
              background: 'var(--bg-elevated)',
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Problem Category</div>
              <strong style={{ fontSize: 14 }}>{issue.issue}</strong>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Connected Order</div>
              {issue.orderId ? (
                <button
                  type="button"
                  className="btn btn-link btn-xs"
                  onClick={() => onOpenOrder && onOpenOrder(issue.orderId)}
                  style={{ padding: 0, fontWeight: 800, fontSize: 13.5 }}
                >
                  #{issue.orderId} → View Order
                </button>
              ) : (
                <span className="muted">N/A</span>
              )}
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Reported At</div>
              <div style={{ fontSize: 12.5 }}>
                {issue.reportedAt ? new Date(issue.reportedAt).toLocaleString() : 'Recent'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Phone Contact</div>
              <div style={{ fontSize: 12.5 }}>{issue.customerPhone || 'Not available'}</div>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>
              Customer Complaint Description
            </label>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: 'var(--bg-elevated)',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              "{issue.description}"
            </div>
          </div>

          {/* Progress Timeline */}
          {issue.timeline && issue.timeline.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                Issue Event History
              </label>
              <div style={{ paddingLeft: 10, borderLeft: '2px solid var(--border)' }}>
                {issue.timeline.map((evt, idx) => (
                  <div key={idx} style={{ marginBottom: 8, position: 'relative', paddingLeft: 12 }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: -17,
                        top: 4,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                      }}
                    />
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{evt.status}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {evt.note} • {new Date(evt.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Status Update Form */}
          <form onSubmit={handleSave}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                Update Support Status
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {statuses.map(st => (
                  <button
                    key={st}
                    type="button"
                    className={`btn btn-xs ${status === st ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setStatus(st)}
                    style={{ borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>
                Admin Operations Note / Resolution
              </label>
              <textarea
                rows={3}
                className="admin-search-input"
                style={{ width: '100%', height: 'auto', borderRadius: 8, padding: 10, resize: 'vertical' }}
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="Log internal resolution steps or reply to customer..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Updating...' : 'Update Issue Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
