import React from 'react';

export default function ReviewDetailsModal({ review, onClose, onStatusChange, onNavigateOrder }) {
  if (!review) return null;

  const isVerified = review.verified === true;
  const ratingStars = review.rating || review.stars || 5;
  const status = review.status || 'Published';

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
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
          maxWidth: '620px',
          background: 'var(--surface, #1e222d)',
          borderRadius: '16px',
          border: '1px solid var(--border, #333a4d)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
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
            <span style={{ fontSize: '24px' }}>💬</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Review Details</h3>
              <span className="muted" style={{ fontSize: '12px' }}>
                ID: {review.id}
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

        {/* Body Content */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {/* Status & Verification Badges */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                background:
                  status === 'Published'
                    ? 'rgba(46, 204, 113, 0.15)'
                    : status === 'Hidden'
                    ? 'rgba(149, 165, 166, 0.15)'
                    : 'rgba(231, 76, 60, 0.15)',
                color:
                  status === 'Published'
                    ? '#2ecc71'
                    : status === 'Hidden'
                    ? '#95a5a6'
                    : '#e74c3c',
                border: `1px solid ${
                  status === 'Published'
                    ? 'rgba(46, 204, 113, 0.3)'
                    : status === 'Hidden'
                    ? 'rgba(149, 165, 166, 0.3)'
                    : 'rgba(231, 76, 60, 0.3)'
                }`,
              }}
            >
              ● {status}
            </span>

            {isVerified ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: 'rgba(46, 204, 113, 0.15)',
                  color: '#2ecc71',
                  border: '1px solid rgba(46, 204, 113, 0.3)',
                }}
              >
                ✓ Verified Purchase
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-muted, #8b949e)',
                  border: '1px solid var(--border, #333a4d)',
                }}
              >
                Unverified Review
              </span>
            )}

            <span className="muted" style={{ marginLeft: 'auto', fontSize: '13px' }}>
              📅 {review.dateFormatted || review.date || 'Recent'}
            </span>
          </div>

          {/* Rating Display */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(255, 183, 3, 0.08)',
              border: '1px solid rgba(255, 183, 3, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '24px', letterSpacing: '2px', color: '#ffb703', lineHeight: 1 }}>
                {'★'.repeat(ratingStars)}
                {'☆'.repeat(5 - ratingStars)}
              </div>
              <span style={{ fontSize: '12px', color: '#ffb703', fontWeight: 600, marginTop: '4px', display: 'inline-block' }}>
                {ratingStars} out of 5 Stars
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text, #fff)' }}>
                {ratingStars}.0
              </span>
              <span className="muted" style={{ fontSize: '13px' }}> / 5.0</span>
            </div>
          </div>

          {/* Review Text */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted, #8b949e)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              Customer Feedback
            </label>
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'var(--bg, #141721)',
                border: '1px solid var(--border, #333a4d)',
                fontSize: '15px',
                lineHeight: '1.6',
                color: 'var(--text, #e6edf3)',
                fontStyle: 'italic',
              }}
            >
              "{review.comment || review.text || review.review || 'No comment provided.'}"
            </div>
          </div>

          {/* Details Grid: Customer, Restaurant, Food, Order */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            {/* Customer Box */}
            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border, #333a4d)',
              }}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted, #8b949e)', fontWeight: 600, marginBottom: '6px' }}>
                Customer
              </div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text, #fff)' }}>
                👤 {review.customerName || review.userName || review.author || 'Anonymous'}
              </div>
              {(review.userEmail || review.customerEmail) && (
                <div className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                  ✉️ {review.userEmail || review.customerEmail}
                </div>
              )}
            </div>

            {/* Restaurant & Food Box */}
            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border, #333a4d)',
              }}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted, #8b949e)', fontWeight: 600, marginBottom: '6px' }}>
                Restaurant & Dish
              </div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text, #fff)' }}>
                🏪 {review.restaurantName || 'ZESTRO Partner Restaurant'}
              </div>
              <div style={{ fontSize: '13px', color: '#ff7b00', marginTop: '4px', fontWeight: 500 }}>
                🍲 {review.foodName || 'Dining Experience'}
              </div>
            </div>
          </div>

          {/* Connected Order ID info */}
          {review.orderId ? (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #8b949e)' }}>Verified via Connected Order:</span>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#38bdf8' }}>
                  📦 Order #{review.orderId}
                </div>
              </div>
              {onNavigateOrder && (
                <button
                  className="btn btn-sm"
                  style={{
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontWeight: 600,
                  }}
                  onClick={() => onNavigateOrder(review.orderId)}
                >
                  View Order →
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border, #333a4d)',
                fontSize: '12px',
                color: 'var(--text-muted, #8b949e)',
              }}
            >
              ℹ️ No direct order identifier attached. Verification check cross-references customer purchase history.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border, #333a4d)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--surface-header, rgba(255,255,255,0.02))',
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ borderRadius: '8px', padding: '8px 18px', cursor: 'pointer' }}
          >
            Close
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {status === 'Published' ? (
              <button
                className="btn"
                style={{
                  background: 'rgba(234, 179, 8, 0.15)',
                  color: '#eab308',
                  border: '1px solid rgba(234, 179, 8, 0.35)',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => onStatusChange(review.id, 'Hidden')}
              >
                👁️‍🗨️ Hide Review
              </button>
            ) : (
              <button
                className="btn btn-primary"
                style={{
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => onStatusChange(review.id, 'Published')}
              >
                ✅ Restore Review
              </button>
            )}

            {status !== 'Flagged' && (
              <button
                className="btn"
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                }}
                onClick={() => onStatusChange(review.id, 'Flagged')}
                title="Flag for inappropriate content or spam"
              >
                🚩 Flag
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
