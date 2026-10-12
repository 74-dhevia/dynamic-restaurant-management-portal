import React from 'react';
import Icon from '../Icon';

const PREORDER_TIMELINE = [
  'Booking Confirmed',
  'Food Order Received',
  'Preparing',
  'Food Ready',
  'Table Ready',
  'Customer Arrived',
  'Dining',
  'Completed',
];

export default function PreOrderConnectionModal({
  isOpen,
  onClose,
  booking,
  onAdvanceJourney,
  onSetJourneyStep,
}) {
  if (!isOpen || !booking) return null;

  const currentStep = booking.journeyStep || 0;
  const preOrderItems = booking.preOrderItems || [];
  const preOrderTotal = booking.preOrderTotal || preOrderItems.reduce((sum, i) => sum + (i.price * i.qty), 0);

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card preorder-connection-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: '#7209b7' }}>
              <Icon name="table" size={20} color="#ffffff" />
            </div>
            <div>
              <h3>Table + Food Pre-Order #{booking.id}</h3>
              <p className="sub">{booking.restaurantName} • Synchronized Reservation &amp; Kitchen Flow</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="preorder-modal-body">
          {/* Synchronized Dining Timeline Stepper */}
          <div className="timeline-box">
            <div className="timeline-header-row">
              <span className="title">Dining &amp; Kitchen Preparation Pipeline</span>
              <span className="badge-step">
                Step {currentStep + 1} of {PREORDER_TIMELINE.length}: {PREORDER_TIMELINE[currentStep]}
              </span>
            </div>

            <div className="preorder-stepper">
              {PREORDER_TIMELINE.map((stepName, idx) => {
                const isDone = currentStep >= idx;
                const isCurrent = currentStep === idx;
                return (
                  <div
                    key={stepName}
                    className={`preorder-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                    onClick={() => onSetJourneyStep && onSetJourneyStep(booking.id, idx)}
                    style={{ cursor: 'pointer' }}
                    title={`Click to set stage to: ${stepName}`}
                  >
                    <div className="step-circle">
                      {isDone ? <Icon name="check" size={12} /> : idx + 1}
                    </div>
                    <span className="step-title">{stepName}</span>
                    {idx < PREORDER_TIMELINE.length - 1 && <div className="step-connector" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="connection-split-grid">
            {/* Left: Table Reservation Details */}
            <div className="card connection-info-card">
              <div className="card-section-title">
                <Icon name="calendar" size={16} color="var(--accent)" />
                <span>Table Reservation</span>
              </div>

              <div className="detail-row">
                <span className="label">Date &amp; Time:</span>
                <strong className="value">{booking.date} at {booking.time}</strong>
              </div>
              <div className="detail-row">
                <span className="label">Party Size:</span>
                <span className="value">{booking.guests} Guests</span>
              </div>
              <div className="detail-row">
                <span className="label">Seating Preference:</span>
                <span className="value">{booking.seating || 'Standard'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Customer Contact:</span>
                <span className="value">{booking.userEmail || 'Guest Customer'}</span>
              </div>
              {booking.request && (
                <div className="detail-row special-request">
                  <span className="label">Special Request:</span>
                  <span className="value note">"{booking.request}"</span>
                </div>
              )}
              {booking.prepSchedule && (
                <div className="prep-schedule-box">
                  <div className="schedule-item">
                    <span>Kitchen Prep:</span>
                    <strong>{booking.prepSchedule.prepTime}</strong>
                  </div>
                  <div className="schedule-item">
                    <span>Target Ready:</span>
                    <strong>{booking.prepSchedule.readyTime}</strong>
                  </div>
                  <div className="schedule-item">
                    <span>Seating Time:</span>
                    <strong>{booking.prepSchedule.tableTime}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Pre-Ordered Food Items */}
            <div className="card connection-info-card">
              <div className="card-section-title">
                <Icon name="food" size={16} color="var(--accent)" />
                <span>Pre-Ordered Dishes ({preOrderItems.length})</span>
              </div>

              {preOrderItems.length === 0 ? (
                <div className="empty-preorder-note">
                  <p>No food pre-ordered for this reservation.</p>
                </div>
              ) : (
                <>
                  <div className="preorder-items-scroll">
                    {preOrderItems.map((item, idx) => (
                      <div key={idx} className="preorder-dish-row">
                        <div className="dish-info">
                          <strong className="dish-name">{item.name}</strong>
                          {item.spiceLevel && <span className="dish-sub">Spice: {item.spiceLevel}</span>}
                          {item.addOns && item.addOns.length > 0 && (
                            <span className="dish-addons">+ {item.addOns.join(', ')}</span>
                          )}
                        </div>
                        <div className="dish-qty-price">
                          <span className="qty">× {item.qty}</span>
                          <strong className="price">₹{item.price * item.qty}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="preorder-total-bar">
                    <span>Pre-Order Total:</span>
                    <strong className="amount">₹{preOrderTotal}</strong>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="admin-modal-footer">
          {currentStep < PREORDER_TIMELINE.length - 1 && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onAdvanceJourney(booking.id)}
            >
              Advance to: <strong>{PREORDER_TIMELINE[currentStep + 1]}</strong>
              <Icon name="forward" size={14} />
            </button>
          )}

          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} style={{ marginLeft: 'auto' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
