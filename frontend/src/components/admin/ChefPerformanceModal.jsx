import React from 'react';
import Icon from '../Icon';
import SafeImage from '../SafeImage';

export default function ChefPerformanceModal({
  isOpen,
  onClose,
  chef,
}) {
  if (!isOpen || !chef) return null;

  const perf = chef.performance || {};
  const hasData = perf.ordersPrepared !== undefined && perf.ordersPrepared > 0;

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card chef-performance-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: '#f72585' }}>
              <Icon name="chef" size={20} color="#ffffff" />
            </div>
            <div>
              <h3>Chef Performance: {chef.name}</h3>
              <p className="sub">{chef.specialization} • {chef.restaurantName}</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="modal-body-scroll">
          {/* Chef Header Profile Summary */}
          <div className="chef-summary-banner">
            <div className="chef-avatar-wrap">
              {chef.photo ? (
                <SafeImage
                  image={chef.photo}
                  alt={chef.name}
                  style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div className="chef-fallback-avatar">
                  <Icon name="chef" size={32} />
                </div>
              )}
            </div>
            <div className="chef-meta-info">
              <h4>{chef.name}</h4>
              <div className="chef-meta-tags">
                <span className="chef-badge-pill">{chef.experience} Exp</span>
                <span className="chef-badge-pill">{chef.restaurantName}</span>
                <span className={`chef-workload-badge ${chef.workload?.toLowerCase()}`}>
                  Workload: {chef.workload || 'Normal'}
                </span>
              </div>
            </div>
          </div>

          {!hasData ? (
            <div className="empty-state-perf">
              <Icon name="pulse" size={36} color="var(--text-muted)" />
              <p>No recorded performance data yet for this chef.</p>
              <span className="muted">Activity will populate automatically as kitchen tickets are completed.</span>
            </div>
          ) : (
            <>
              {/* Metric Cards Grid */}
              <div className="perf-stats-grid">
                <div className="card perf-metric-card">
                  <div className="metric-val">{perf.ordersPrepared}</div>
                  <div className="metric-label">Orders Prepared</div>
                </div>

                <div className="card perf-metric-card">
                  <div className="metric-val">{perf.avgPrepTimeMin} min</div>
                  <div className="metric-label">Avg Prep Time</div>
                </div>

                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: '#ffb703' }}>
                    ★ {perf.customerRating || chef.rating}
                  </div>
                  <div className="metric-label">{perf.reviewsCount} Guest Reviews</div>
                </div>

                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: 'var(--success)' }}>
                    {perf.completedOrders}
                  </div>
                  <div className="metric-label">Completed Deliveries</div>
                </div>
              </div>

              {/* Popular Signature Dishes */}
              {perf.popularDishes && perf.popularDishes.length > 0 && (
                <div className="popular-dishes-card card">
                  <div className="section-title">
                    <Icon name="sparkles" size={16} color="var(--accent)" />
                    <span>Signature High-Demand Dishes</span>
                  </div>
                  <div className="popular-dishes-list">
                    {perf.popularDishes.map((dish, i) => (
                      <div key={i} className="popular-dish-pill">
                        <Icon name="food" size={14} />
                        <span>{dish}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Biography / Philosophy */}
              {chef.biography && (
                <div className="chef-bio-box card">
                  <strong>Culinary Philosophy &amp; Craft:</strong>
                  <p>{chef.biography}</p>
                </div>
              )}
            </>
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
