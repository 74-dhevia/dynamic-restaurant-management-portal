import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Icon from '../Icon';
import IncidentResolutionModal from './IncidentResolutionModal';

export default function KitchenIncidentAlertBanner() {
  const incidents = useSelector(s => s.chef?.incidents || []);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Filter for open / unresolved incidents
  const openIncidents = incidents.filter(i => i.status === 'open' || !i.status);

  if (openIncidents.length === 0) return null;

  const latest = openIncidents[0];

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'Critical':
        return { bg: '#dc2626', border: '#b91c1c', badge: '#7f1d1d' };
      case 'High':
        return { bg: '#ea580c', border: '#c2410c', badge: '#9a3412' };
      case 'Medium':
        return { bg: '#d97706', border: '#b45309', badge: '#78350f' };
      default:
        return { bg: '#2563eb', border: '#1d4ed8', badge: '#1e3a8a' };
    }
  };

  const style = getSeverityStyle(latest.severity);

  return (
    <>
      <div
        className="admin-incident-live-banner"
        style={{
          borderLeft: `5px solid ${style.bg}`,
        }}
      >
        <div className="incident-live-left">
          <div className="incident-pulsing-badge" style={{ background: style.bg }}>
            <Icon name="warning" size={18} color="#ffffff" />
          </div>
          <div className="incident-live-content">
            <div className="incident-top-line">
              <span className="incident-tag" style={{ background: style.badge, color: '#ffffff' }}>
                🚨 KITCHEN ALERT • {latest.severity?.toUpperCase()}
              </span>
              <strong className="incident-type-label">{latest.incidentType}</strong>
              <span className="incident-station-text">at <strong>{latest.restaurantName}</strong></span>
              <span className="incident-chef-text">Reported by <strong>{latest.chefName}</strong></span>
              <span className="incident-time-text">
                {latest.reportedAt ? new Date(latest.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
              </span>
            </div>

            <p className="incident-desc-line">
              "{latest.description}"
            </p>

            {latest.affectedOrders && latest.affectedOrders.length > 0 && (
              <div className="incident-affected-orders-row">
                <span className="affected-label">Affected Orders ({latest.affectedOrders.length}):</span>
                {latest.affectedOrders.map(oId => (
                  <span key={oId} className="affected-order-chip">#{oId}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="incident-live-right">
          <button
            type="button"
            className="btn btn-sm btn-danger btn-manage-incident"
            onClick={() => setSelectedIncident(latest)}
            id="btn-inspect-kitchen-incident"
          >
            <Icon name="sliders" size={15} />
            <span>Inspect Incident &amp; Manage Orders</span>
          </button>
        </div>
      </div>

      {selectedIncident && (
        <IncidentResolutionModal
          isOpen={!!selectedIncident}
          onClose={() => setSelectedIncident(null)}
          incident={selectedIncident}
        />
      )}
    </>
  );
}
