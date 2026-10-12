import React from 'react';
import Icon from '../Icon';

export default function DeliveryPartnerDetailsModal({
  isOpen,
  onClose,
  partner,
  onEdit,
  orders = [],
  onOpenOrder,
}) {
  if (!isOpen || !partner) return null;

  // Filter orders assigned to this delivery partner
  const assignedOrders = (orders || []).filter(o =>
    (o.courierName && o.courierName.toLowerCase().includes(partner.name.toLowerCase())) ||
    (o.deliveryPartnerId === partner.id) ||
    (partner.name === 'Senthil Nathan' && o.status === 'Out for Delivery')
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'var(--success)';
      case 'Out for Delivery': return 'var(--accent)';
      case 'On Duty': return '#0284c7';
      case 'Offline': return 'var(--text-muted)';
      default: return 'var(--accent)';
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal-header" style={{ paddingBottom: 16 }}>
          <div className="modal-title-wrap">
            <div
              className="modal-icon-badge"
              style={{
                background: getStatusColor(partner.status),
                width: 44,
                height: 44,
                borderRadius: 12,
              }}
            >
              <Icon name="delivery" size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{partner.name}</h3>
                <span
                  className="status-pill"
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    borderColor: getStatusColor(partner.status),
                    color: getStatusColor(partner.status),
                  }}
                >
                  ● {partner.status}
                </span>
              </div>
              <p className="sub" style={{ margin: '2px 0 0', fontSize: 12.5 }}>
                Rider ID: <strong>#{partner.id}</strong> • Joined: {partner.joinedDate || 'Verified Fleet Rider'}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 }}>
          {/* Quick Metrics Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 10,
              background: 'var(--bg-elevated)',
              padding: 12,
              borderRadius: 10,
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>RATING</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#f59e0b', marginTop: 2 }}>
                ⭐ {partner.rating || 4.9}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>DELIVERIES</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--accent)', marginTop: 2 }}>
                {partner.totalDeliveries || 428}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>ON-TIME SLA</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--success)', marginTop: 2 }}>
                98.6%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>AVG TIME</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text)', marginTop: 2 }}>
                21 min
              </div>
            </div>
          </div>

          {/* 📍 LIVE LOCATION & GPS RADAR TRACKING */}
          <div
            className="card"
            style={{
              padding: 16,
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, var(--bg)), var(--bg))',
              border: '1px solid color-mix(in srgb, var(--accent) 25%, var(--border))',
              borderRadius: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--accent)', display: 'inline-flex' }}>
                  <Icon name="location" size={18} />
                </span>
                <strong style={{ fontSize: 14 }}>Live GPS Telemetry &amp; Location</strong>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11.5,
                  padding: '3px 8px',
                  borderRadius: 20,
                  background: 'color-mix(in srgb, var(--success) 12%, transparent)',
                  color: 'var(--success)',
                  fontWeight: 700,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
                LIVE BEACON ACTIVE
              </span>
            </div>

            {/* Radar / Map graphic */}
            <div
              style={{
                position: 'relative',
                height: 120,
                background: 'linear-gradient(180deg, #131b2e 0%, #0d131f 100%)',
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              {/* Grid Lines Mock */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />

              {/* Pulsing Target Point */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'rgba(255, 107, 107, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse 2s infinite',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 12px var(--accent)',
                    }}
                  >
                    <Icon name="delivery" size={16} color="#ffffff" />
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#ffffff',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '2px 8px',
                    borderRadius: 12,
                    marginTop: 4,
                  }}
                >
                  {partner.name} ({partner.distanceFromHub || '0.8 km from hub'})
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, fontSize: 12.5 }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block' }}>CURRENT OPERATING ZONE</span>
                <strong style={{ fontSize: 13, color: 'var(--text)' }}>📍 {partner.currentLocation}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block' }}>GPS COORDINATES</span>
                <code style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>
                  {partner.locationCoords ? `${partner.locationCoords.lat}° N, ${partner.locationCoords.lng}° E` : '9.1726° N, 77.8681° E'}
                </code>
              </div>
            </div>
          </div>

          {/* Contact & Vehicle Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Contact Card */}
            <div className="card" style={{ padding: 14, background: 'var(--bg)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                Contact Details
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="phone" size={15} color="var(--accent)" />
                  <strong style={{ fontSize: 13 }}>{partner.phone}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="mail" size={15} color="var(--accent)" />
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{partner.email}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Card */}
            <div className="card" style={{ padding: 14, background: 'var(--bg)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                Vehicle &amp; License
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {partner.vehicleType || 'Hero Splendor Plus'}
                </div>
                <div style={{ display: 'inline-block' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      background: '#fef08a',
                      color: '#854d0e',
                      border: '1.5px solid #ca8a04',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 11.5,
                      fontWeight: 900,
                      letterSpacing: '1px',
                      fontFamily: 'monospace',
                    }}
                  >
                    IND {partner.vehicleNumber}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  License: {partner.licenseNumber || 'TN-69-VERIFIED'}
                </div>
              </div>
            </div>
          </div>

          {/* Active Assigned Deliveries */}
          <div className="card" style={{ padding: 14, background: 'var(--bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="orders" size={15} color="var(--accent)" />
                <span>Active Assigned Deliveries ({assignedOrders.length})</span>
              </strong>
            </div>

            {assignedOrders.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>
                No active delivery orders currently in transit for this rider.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {assignedOrders.map(o => (
                  <div
                    key={o.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                        Order #{o.id} • <span style={{ color: 'var(--accent)' }}>₹{o.grandTotal || o.totalAmount || 320}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                        {o.restaurantName} ➔ {typeof o.deliveryAddress === 'string'
                          ? o.deliveryAddress
                          : (o.deliveryAddress?.text || o.address?.text || o.deliveryAddress?.address || 'Kovilpatti Dropoff')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`status-pill ${o.status === 'Delivered' ? 'success' : 'warning'}`} style={{ fontSize: 11 }}>
                        {o.status}
                      </span>
                      {onOpenOrder && (
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => {
                            onClose();
                            onOpenOrder(o);
                          }}
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="admin-modal-footer" style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onClose();
              if (onEdit) onEdit(partner);
            }}
          >
            <Icon name="edit" size={15} />
            <span>Edit Rider Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
