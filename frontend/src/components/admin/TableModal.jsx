import React, { useState, useEffect } from 'react';
import Icon from '../Icon';

export default function TableModal({
  isOpen,
  onClose,
  onSave,
  table = null,
}) {
  const isEditing = !!table;

  const [label, setLabel] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [seatingType, setSeatingType] = useState('Indoor');
  const [location, setLocation] = useState('Main Dining Hall');
  const [status, setStatus] = useState('free');
  const [error, setError] = useState('');

  useEffect(() => {
    if (table) {
      setLabel(table.label || '');
      setCapacity(table.capacity ? String(table.capacity) : '4');
      setSeatingType(table.seatingType || 'Indoor');
      setLocation(table.location || 'Main Dining Hall');
      setStatus(table.status || 'free');
    } else {
      setLabel('');
      setCapacity('4');
      setSeatingType('Indoor');
      setLocation('Main Dining Hall');
      setStatus('free');
    }
    setError('');
  }, [table, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Table label is required (e.g. T1, T2)');
      return;
    }

    const payload = {
      label: label.trim().toUpperCase(),
      capacity: parseInt(capacity, 10) || 4,
      seatingType,
      location: location.trim(),
      status,
    };

    if (isEditing) {
      payload.id = table.id;
    } else {
      payload.id = `table_${Date.now()}`;
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card table-modal-card" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: '#0284c7' }}>
              <Icon name="table" size={20} color="#ffffff" />
            </div>
            <div>
              <h3>{isEditing ? `Edit Table: ${table.label}` : 'Add New Restaurant Table'}</h3>
              <p className="sub">Configure seating capacity and live floor station status</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal-form">
          {error && (
            <div className="modal-error-banner" role="alert">
              <Icon name="alert-triangle" size={16} color="var(--danger)" />
              <span>{error}</span>
            </div>
          )}

          <div className="form-row-2">
            <div className="input-group">
              <label className="form-label">Table Number / Label *</label>
              <input
                type="text"
                required
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. T10, W-02"
                className="admin-form-input"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Seating Capacity (Guests)</label>
              <select
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                className="admin-form-select"
              >
                <option value="2">2 Guests (Couples Booth)</option>
                <option value="4">4 Guests (Standard Table)</option>
                <option value="6">6 Guests (Family Table)</option>
                <option value="8">8 Guests (Large Group)</option>
                <option value="12">12 Guests (Banquet Station)</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="input-group">
              <label className="form-label">Seating Zone / Type</label>
              <select
                value={seatingType}
                onChange={e => setSeatingType(e.target.value)}
                className="admin-form-select"
              >
                <option value="Indoor">Indoor (Air-Conditioned)</option>
                <option value="Outdoor">Outdoor Garden Seating</option>
                <option value="Window">Window Seating</option>
                <option value="Family">Family Dining Alcove</option>
                <option value="Balcony">Balcony &amp; Terrace</option>
              </select>
            </div>

            <div className="input-group">
              <label className="form-label">Initial Table Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="admin-form-select"
              >
                <option value="free">Available / Free</option>
                <option value="seating-soon">Reserved / Seating Soon</option>
                <option value="occupied">Occupied / Dining</option>
                <option value="cleaning">Cleaning</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="form-label">Floor Location Notes</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Ground Floor, East Wing near Garden View"
              className="admin-form-input"
            />
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Icon name="check" size={16} />
              <span>{isEditing ? 'Save Table' : 'Add Table'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
