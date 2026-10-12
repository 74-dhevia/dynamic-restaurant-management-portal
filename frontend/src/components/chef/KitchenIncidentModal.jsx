import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Icon from '../Icon';
import SafeImage from '../SafeImage';
import { pushAdminNotification } from '../../services/adminNotificationService';
import { updateKitchenIncidentStatus } from '../../redux/slices/chefSlice';
import { incidentApiService } from '../../services/incidentApiService';
import { INCIDENT_TYPES, SEVERITY_LEVELS } from '../../utils/incidentConstants';

const SAMPLE_EVIDENCE_PRESETS = [
  { label: 'Burner Gas Leak / Pressure Drop', url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&auto=format&fit=crop&q=80' },
  { label: 'Tandoor Furnace Thermocouple Breakdown', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop&q=80' },
  { label: 'Deep Fryer Heating Element Failure', url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&auto=format&fit=crop&q=80' },
];

export default function KitchenIncidentModal({
  isOpen,
  onClose,
  onSubmitIncident,
  chef,
  restaurantName,
  restaurantId,
  activeOrders = [],
}) {
  const dispatch = useDispatch();
  const allIncidents = useSelector(s => s.chef?.incidents || []);

  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'history'
  const [incidentType, setIncidentType] = useState('Equipment Failure');
  const [severity, setSeverity] = useState('High');
  const [description, setDescription] = useState('');
  const [imageEvidence, setImageEvidence] = useState('');
  const [selectedOrders, setSelectedOrders] = useState(() => activeOrders.map(o => o.id));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resolutionNotesMap, setResolutionNotesMap] = useState({});

  // Sync selected orders when modal opens or activeOrders change
  React.useEffect(() => {
    if (isOpen) {
      setSelectedOrders(activeOrders.map(o => o.id));
      setError('');
    }
  }, [isOpen, activeOrders]);

  // Incidents for this restaurant
  const stationIncidents = useMemo(() => {
    return allIncidents.filter(i => i.restaurantId === restaurantId || !i.restaurantId || i.restaurantId === 'r2');
  }, [allIncidents, restaurantId]);

  if (!isOpen) return null;

  const isCritical = severity === 'Critical' || incidentType === 'Fire or Safety Incident';

  const handleToggleOrder = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAllOrders = () => {
    if (selectedOrders.length === activeOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(activeOrders.map(o => o.id));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setImageEvidence(loadEvt.target?.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide a descriptive incident summary (at least 10 characters).');
      return;
    }

    setSubmitting(true);

    const payload = {
      incidentType,
      severity,
      description: description.trim(),
      restaurantId: restaurantId || chef?.restaurantId || 'r2',
      restaurantName: restaurantName || chef?.restaurantName || 'Master Kitchen',
      chefId: chef?.id || 'chef_1',
      chefName: chef?.fullName || chef?.name || 'Head Chef',
      image: imageEvidence || null,
      affectedOrders: selectedOrders,
      status: 'open',
    };

    onSubmitIncident(payload);

    // Push instant high-priority Admin Notification
    pushAdminNotification({
      type: 'incident',
      title: `🚨 Kitchen Incident: ${incidentType} (${severity})`,
      desc: `${payload.chefName} reported an incident at ${payload.restaurantName}. Affected orders: ${selectedOrders.join(', ') || 'None'}. ${payload.description.slice(0, 80)}...`,
      restaurantName: payload.restaurantName,
      severity,
      entityId: `INC-${Date.now()}`,
      time: 'Just now',
      actions: ['inspect_incident', 'manage_orders'],
    });

    setSubmitting(false);
    onClose();
  };

  const handleUpdateStatus = (incidentId, nextStatus) => {
    const note = resolutionNotesMap[incidentId] || `Status updated to ${nextStatus} by ${chef?.fullName || 'Station Chef'}`;
    dispatch(updateKitchenIncidentStatus({
      id: incidentId,
      status: nextStatus,
      resolutionNote: note,
    }));
    // Sync to backend persistent API
    incidentApiService.updateStatus(incidentId, {
      status: nextStatus,
      resolutionNote: note,
    }).catch(err => console.warn('Incident status backend sync note:', err.message));
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="admin-modal-card kitchen-incident-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 680 }}
      >
        {/* Header */}
        <div
          className="admin-modal-header"
          style={{
            borderBottomColor: isCritical ? 'rgba(220, 38, 38, 0.4)' : 'rgba(239, 68, 68, 0.25)',
            background: isCritical ? 'rgba(220, 38, 38, 0.06)' : 'transparent',
          }}
        >
          <div className="modal-title-wrap">
            <div
              className="modal-icon-badge"
              style={{
                background: isCritical ? '#dc2626' : '#ea580c',
                color: '#ffffff',
                boxShadow: isCritical ? '0 0 12px rgba(220, 38, 38, 0.6)' : 'none',
              }}
            >
              <Icon name="warning" size={20} />
            </div>
            <div>
              <h3 style={{ color: isCritical ? '#dc2626' : '#ef4444', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <span>KITCHEN INCIDENT &amp; DELAY ESCALATION</span>
              </h3>
              <p className="sub" style={{ margin: 0 }}>
                Operations alert dispatched to Admin &amp; Restaurant Manager • {restaurantName}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Tab switcher: Report New Incident vs Incident History */}
        <div className="incident-tab-strip">
          <button
            type="button"
            className={`incident-tab-btn ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            <Icon name="warning" size={14} />
            <span>Report New Incident</span>
          </button>
          <button
            type="button"
            className={`incident-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Icon name="clock" size={14} />
            <span>Incident History &amp; Resolutions ({stationIncidents.length})</span>
          </button>
        </div>

        {/* Tab 1: Report Incident Form */}
        {activeTab === 'report' && (
          <form onSubmit={handleSubmit}>
            <div className="modal-body-scroll" style={{ maxHeight: '68vh', padding: '18px 22px' }}>
              {/* Critical safety banner if applicable */}
              {isCritical && (
                <div className="critical-safety-alert-banner">
                  <Icon name="warning" size={18} color="#dc2626" />
                  <div>
                    <strong style={{ color: '#dc2626' }}>CRITICAL SAFETY ESCALATION LEVEL</strong>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      High-priority safety protocol triggered. Admin dispatch and station halt broadcast.
                    </p>
                  </div>
                </div>
              )}

              {/* Station & Reporter info banner */}
              <div className="incident-meta-banner">
                <div className="incident-meta-col">
                  <span className="meta-label">Station / Restaurant:</span>
                  <strong>{restaurantName || 'Dindigul Thalappakatti'}</strong>
                </div>
                <div className="incident-meta-col">
                  <span className="meta-label">Reporting Chef:</span>
                  <strong>{chef?.fullName || chef?.name || 'Chef Murugesan P.'}</strong>
                </div>
              </div>

              {/* Incident Type Selector */}
              <div className="form-group" style={{ marginTop: 14 }}>
                <label htmlFor="incident-type-select" className="form-label" style={{ fontWeight: 700 }}>
                  Incident Classification <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  id="incident-type-select"
                  value={incidentType}
                  onChange={e => setIncidentType(e.target.value)}
                  className="admin-form-select"
                  style={{ width: '100%', fontSize: 13.5 }}
                >
                  {INCIDENT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Severity Level Grid */}
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Severity Classification <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div className="severity-grid-selector">
                  {SEVERITY_LEVELS.map(sev => {
                    const isSelected = severity === sev.value;
                    return (
                      <button
                        key={sev.value}
                        type="button"
                        className={`severity-option-btn ${isSelected ? 'selected' : ''}`}
                        style={{
                          borderColor: isSelected ? sev.color : 'var(--border)',
                          background: isSelected ? `${sev.color}15` : 'var(--bg)',
                        }}
                        onClick={() => setSeverity(sev.value)}
                      >
                        <div className="severity-header-row">
                          <span className="severity-dot" style={{ background: sev.color }} />
                          <strong style={{ color: isSelected ? sev.color : 'var(--text)' }}>{sev.label}</strong>
                        </div>
                        <small className="severity-desc">{sev.desc}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginTop: 14 }}>
                <label htmlFor="incident-description" className="form-label" style={{ fontWeight: 700 }}>
                  Incident Description &amp; Immediate Operational Impact <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea
                  id="incident-description"
                  rows={3}
                  value={description}
                  onChange={e => { setDescription(e.target.value); setError(''); }}
                  placeholder="Detail what occurred, equipment involved, ingredient shortages, station safety status, and whether orders must be temporarily paused..."
                  className="admin-form-textarea"
                  style={{ width: '100%', fontSize: 13, resize: 'vertical' }}
                  required
                />
              </div>

              {/* Affected Orders with Explicit Order IDs */}
              <div className="form-group" style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                    Affected Kitchen Orders ({selectedOrders.length} of {activeOrders.length} selected)
                  </label>
                  {activeOrders.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-link btn-xs"
                      onClick={handleSelectAllOrders}
                      style={{ fontSize: 11.5 }}
                    >
                      {selectedOrders.length === activeOrders.length ? 'Deselect All' : 'Select All Active'}
                    </button>
                  )}
                </div>

                {activeOrders.length === 0 ? (
                  <div className="empty-affected-box" style={{ padding: 10, background: 'var(--bg)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    No active orders currently queued for this kitchen station.
                  </div>
                ) : (
                  <div className="affected-orders-checklist">
                    {activeOrders.map(ord => {
                      const isChecked = selectedOrders.includes(ord.id);
                      return (
                        <label key={ord.id} className={`affected-order-item ${isChecked ? 'checked' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleOrder(ord.id)}
                          />
                          <div className="affected-order-info">
                            <div className="order-head">
                              <strong className="order-id-label">Order #{ord.id}</strong>
                              <span className={`status-pill mini ${ord.status?.toLowerCase()}`}>{ord.status}</span>
                              <span className="items-count">{(ord.items || []).length} items</span>
                            </div>
                            <div className="items-summary" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                              {(ord.items || []).map(i => `${i.name} × ${i.qty}`).join(', ')}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Affected Order IDs display summary */}
              {selectedOrders.length > 0 && (
                <div className="selected-ids-pill-row">
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Affected IDs:</span>
                  {selectedOrders.map(id => (
                    <span key={id} className="affected-id-tag">#{id}</span>
                  ))}
                </div>
              )}

              {/* Photo Evidence */}
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Photo / Evidence Attachment (Optional)
                </label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="btn btn-outline btn-xs" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="camera" size={14} />
                    <span>Attach Photo</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                  </label>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>or choose preset evidence:</span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {SAMPLE_EVIDENCE_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="btn btn-xs btn-outline"
                        style={{ fontSize: 10.5 }}
                        onClick={() => setImageEvidence(p.url)}
                      >
                        {p.label.split(' ')[0]} {p.label.split(' ')[1]}
                      </button>
                    ))}
                  </div>
                </div>

                {imageEvidence && (
                  <div className="evidence-preview-wrap" style={{ marginTop: 10, position: 'relative', display: 'inline-block' }}>
                    <SafeImage
                      image={imageEvidence}
                      alt="Evidence Preview"
                      style={{ width: 120, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
                    />
                    <button
                      type="button"
                      className="btn btn-xs btn-danger"
                      style={{ position: 'absolute', top: 4, right: 4, padding: '1px 5px', fontSize: 10 }}
                      onClick={() => setImageEvidence('')}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Notification transparency disclosure */}
              <div className="notification-transparency-box">
                <Icon name="info" size={13} color="var(--text-muted)" />
                <span>
                  Incident will be recorded in kitchen operational logs and dispatched to Admin Operations Console. External SMS/WhatsApp alerts are not configured on this environment.
                </span>
              </div>

              {error && (
                <div className="auth-error-banner" style={{ marginTop: 12 }}>
                  <Icon name="close" size={15} color="var(--danger)" />
                  <span style={{ fontSize: 12.5 }}>{error}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-danger btn-sm"
                disabled={submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                <Icon name="warning" size={15} />
                <span>{submitting ? 'Transmitting Incident...' : 'TRANSMIT INCIDENT REPORT'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Incident History & Resolution Workflow */}
        {activeTab === 'history' && (
          <div className="modal-body-scroll" style={{ maxHeight: '68vh', padding: '18px 22px' }}>
            {stationIncidents.length === 0 ? (
              <div className="empty-history-state" style={{ padding: '30px 20px', textAlign: 'center' }}>
                <Icon name="check" size={32} color="var(--success)" />
                <h4 style={{ margin: '10px 0 4px' }}>No Incidents Recorded</h4>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
                  This kitchen station has a clean operational log with zero unresolved alerts.
                </p>
              </div>
            ) : (
              <div className="incident-history-list">
                {stationIncidents.map(inc => {
                  const isIncCritical = inc.severity === 'Critical' || inc.incidentType === 'Fire or Safety Incident';
                  const isResolved = inc.status === 'resolved';
                  const isInProgress = inc.status === 'in_progress';
                  const isOpenStatus = inc.status === 'open' || !inc.status;

                  return (
                    <div
                      key={inc.id}
                      className={`incident-history-card ${isIncCritical ? 'critical-border' : ''} ${isResolved ? 'resolved-card' : ''}`}
                    >
                      <div className="history-card-header">
                        <div className="history-id-col">
                          <strong>{inc.id}</strong>
                          <span className="history-type-tag">{inc.incidentType}</span>
                          <span
                            className="history-severity-tag"
                            style={{
                              background:
                                inc.severity === 'Critical' ? '#dc2626' :
                                inc.severity === 'High' ? '#ea580c' :
                                inc.severity === 'Medium' ? '#f59e0b' : '#3b82f6',
                              color: '#fff',
                            }}
                          >
                            {inc.severity}
                          </span>
                        </div>
                        <div className="history-status-col">
                          <span className={`resolution-status-badge ${inc.status || 'open'}`}>
                            {isResolved ? 'Resolved' : isInProgress ? 'In Progress' : 'Open / Logged'}
                          </span>
                        </div>
                      </div>

                      {/* Workflow progression indicator */}
                      <div className="resolution-workflow-stepper">
                        <span className="step-point complete">Reported</span>
                        <span className="step-arrow">→</span>
                        <span className="step-point complete">Recorded</span>
                        <span className="step-arrow">→</span>
                        <span className="step-point complete">Admin Dispatched</span>
                        <span className="step-arrow">→</span>
                        <span className={`step-point ${isInProgress || isResolved ? 'complete' : ''}`}>In Progress</span>
                        <span className="step-arrow">→</span>
                        <span className={`step-point ${isResolved ? 'complete' : ''}`}>Resolved</span>
                      </div>

                      <p className="history-desc-text">{inc.description}</p>

                      {/* Affected order IDs */}
                      {inc.affectedOrders && inc.affectedOrders.length > 0 && (
                        <div className="history-affected-row">
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Affected Orders:</span>
                          {inc.affectedOrders.map(oId => (
                            <span key={oId} className="affected-id-tag">#{oId}</span>
                          ))}
                        </div>
                      )}

                      <div className="history-meta-footer">
                        <span>Reported by: <strong>{inc.chefName}</strong></span>
                        <span>•</span>
                        <span>{new Date(inc.reportedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        {inc.resolvedAt && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--success)' }}>
                              Resolved at {new Date(inc.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Resolution controls for authorized kitchen staff */}
                      {!isResolved && (
                        <div className="resolution-action-box">
                          <input
                            type="text"
                            placeholder="Add resolution or progress note..."
                            className="admin-form-input"
                            style={{ fontSize: 12, padding: '5px 8px', flex: 1 }}
                            value={resolutionNotesMap[inc.id] || ''}
                            onChange={e => setResolutionNotesMap({ ...resolutionNotesMap, [inc.id]: e.target.value })}
                          />
                          {isOpenStatus && (
                            <button
                              type="button"
                              className="btn btn-warning btn-xs"
                              onClick={() => handleUpdateStatus(inc.id, 'in_progress')}
                            >
                              Mark In Progress
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-success btn-xs"
                            onClick={() => handleUpdateStatus(inc.id, 'resolved')}
                          >
                            Mark Resolved
                          </button>
                        </div>
                      )}

                      {inc.adminNotes && (
                        <div className="resolution-notes-display">
                          <Icon name="check" size={12} color="var(--success)" />
                          <span>Resolution note: {inc.adminNotes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="admin-modal-footer" style={{ marginTop: 16 }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
                Close Incident History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
