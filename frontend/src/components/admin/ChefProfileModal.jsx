import React from 'react';
import { useSelector } from 'react-redux';
import Icon from '../Icon';
import SafeImage from '../SafeImage';

export default function ChefProfileModal({
  isOpen,
  onClose,
  chef,
}) {
  const allOrders = useSelector(s => s.order?.orders || []);
  const allIncidents = useSelector(s => s.chef?.incidents || []);

  if (!isOpen || !chef) return null;

  const perf = chef.performance || {};

  // Current assigned active orders for this chef's restaurant
  const assignedActiveOrders = allOrders.filter(
    o => o.restaurantId === chef.restaurantId && !o.cancelled && o.status !== 'Delivered'
  );

  // Incidents reported by this chef
  const chefIncidents = allIncidents.filter(
    i => i.chefId === chef.id || i.chefName?.toLowerCase() === chef.name?.toLowerCase()
  );

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card chef-full-profile-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 840 }}>
        {/* Header */}
        <div className="admin-modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: '#f72585', color: '#ffffff' }}>
              <Icon name="chef" size={20} />
            </div>
            <div>
              <h3>Chef Profile Dossier: {chef.name}</h3>
              <p className="sub">{chef.specialization} • {chef.restaurantName}</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body-scroll" style={{ maxHeight: '74vh', padding: '20px 24px' }}>
          {/* Section 9: Chef Identity & Status Banner (NEVER SHOWS PASSWORD) */}
          <div className="chef-dossier-hero card">
            <div className="dossier-avatar-col">
              {chef.photo ? (
                <SafeImage
                  image={chef.photo}
                  alt={chef.name}
                  style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }}
                />
              ) : (
                <div className="chef-avatar-fallback large">
                  <Icon name="chef" size={40} color="#f72585" />
                </div>
              )}
            </div>

            <div className="dossier-identity-col">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: 20 }}>{chef.name}</h3>
                <span className={`status-pill ${chef.status === 'Active' ? 'active' : 'inactive'}`}>
                  {chef.status}
                </span>
                <span className={`kitchen-status-badge ${chef.availability?.toLowerCase() || 'available'}`}>
                  Kitchen Status: <strong>{chef.availability || 'Available'}</strong>
                </span>
              </div>

              <div className="dossier-sub-info" style={{ marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
                <span><strong>Specialization:</strong> {chef.specialization}</span>
                <span><strong>Experience:</strong> {chef.experience}</span>
                <span><strong>Station:</strong> {chef.restaurantName}</span>
              </div>

              <div className="dossier-contact-info" style={{ marginTop: 6, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-muted)' }}>
                <span>📧 {chef.email || 'No email provided'}</span>
                <span>📞 {chef.phone || 'No phone provided'}</span>
              </div>
            </div>
          </div>

          {/* Performance & Orders Prepared Metrics */}
          <div className="dossier-metrics-grid" style={{ marginTop: 18 }}>
            <div className="card metric-mini-card">
              <span className="metric-val">{perf.ordersPrepared || 2840}</span>
              <span className="metric-label">Orders Prepared</span>
            </div>
            <div className="card metric-mini-card">
              <span className="metric-val">{perf.avgPrepTimeMin || 18} min</span>
              <span className="metric-label">Avg Prep Time</span>
            </div>
            <div className="card metric-mini-card">
              <span className="metric-val" style={{ color: '#ffb703' }}>★ {perf.customerRating || chef.rating || '4.9'}</span>
              <span className="metric-label">Customer Rating</span>
            </div>
            <div className="card metric-mini-card">
              <span className="metric-val" style={{ color: 'var(--success)' }}>{perf.completedOrders || 2810}</span>
              <span className="metric-label">Completed Orders</span>
            </div>
          </div>

          {/* Section 9: Current Assigned Orders */}
          <div className="dossier-section-box card" style={{ marginTop: 20, padding: 18 }}>
            <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="orders" size={17} color="var(--accent)" />
                <h4 style={{ margin: 0, fontSize: 15 }}>
                  Current Assigned Orders ({assignedActiveOrders.length})
                </h4>
              </div>
              <span className="mini-badge-outline">{chef.restaurantName}</span>
            </div>

            {assignedActiveOrders.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                No active kitchen tickets currently queued at this chef's station.
              </p>
            ) : (
              <div className="assigned-orders-compact-list">
                {assignedActiveOrders.map(ord => (
                  <div key={ord.id} className="assigned-order-compact-item">
                    <div className="left">
                      <strong>Order #{ord.id}</strong>
                      <span className={`status-pill mini ${ord.status?.toLowerCase()}`}>{ord.status}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {(ord.items || []).map(i => `${i.name} × ${i.qty}`).join(', ')}
                      </span>
                    </div>
                    <div className="right">
                      <span className="order-time">
                        {ord.placedAt ? new Date(ord.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 9: Incident Reports Filed by Chef */}
          <div className="dossier-section-box card" style={{ marginTop: 20, padding: 18 }}>
            <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="warning" size={17} color="#dc2626" />
                <h4 style={{ margin: 0, fontSize: 15 }}>
                  Incident Reports ({chefIncidents.length})
                </h4>
              </div>
              <span className="mini-badge-outline">Audit Records</span>
            </div>

            {chefIncidents.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                No operational incidents recorded for this chef.
              </p>
            ) : (
              <div className="incidents-history-stack">
                {chefIncidents.map(inc => (
                  <div key={inc.id} className="incident-history-item">
                    <div className="inc-head">
                      <div>
                        <strong>#{inc.id} • {inc.incidentType}</strong>
                        <span className={`severity-tag mini ${inc.severity?.toLowerCase()}`}>{inc.severity}</span>
                      </div>
                      <span className={`incident-status-pill ${inc.status}`}>
                        {(inc.status || 'open').toUpperCase()}
                      </span>
                    </div>
                    <p className="inc-desc">"{inc.description}"</p>
                    <div className="inc-footer">
                      <span>Reported: {inc.reportedAt ? new Date(inc.reportedAt).toLocaleString() : 'Recent'}</span>
                      {inc.affectedOrders && inc.affectedOrders.length > 0 && (
                        <span>Affected: {inc.affectedOrders.join(', ')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="admin-modal-footer">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} style={{ marginLeft: 'auto' }}>
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
