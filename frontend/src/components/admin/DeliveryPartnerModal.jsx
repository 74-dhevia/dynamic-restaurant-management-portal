import React, { useState, useEffect } from 'react';
import Icon from '../Icon';

export default function DeliveryPartnerModal({
  isOpen,
  onClose,
  onSave,
  partner = null,
}) {
  const isEditing = !!partner;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState('Hero Splendor Plus');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [status, setStatus] = useState('Available');
  const [currentLocation, setCurrentLocation] = useState('Kovilpatti Central Hub');
  const [rating, setRating] = useState('4.9');
  const [error, setError] = useState('');

  useEffect(() => {
    if (partner) {
      setName(partner.name || '');
      setPhone(partner.phone || '');
      setEmail(partner.email || '');
      setVehicleType(partner.vehicleType || 'Hero Splendor Plus');
      setVehicleNumber(partner.vehicleNumber || '');
      setLicenseNumber(partner.licenseNumber || '');
      setStatus(partner.status || 'Available');
      setCurrentLocation(partner.currentLocation || 'Kovilpatti Central Hub');
      setRating(partner.rating ? String(partner.rating) : '4.9');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setVehicleType('Hero Splendor Plus');
      setVehicleNumber('');
      setLicenseNumber('');
      setStatus('Available');
      setCurrentLocation('Kovilpatti Central Hub');
      setRating('4.9');
    }
    setError('');
  }, [partner, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Delivery partner full name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Contact phone number is required');
      return;
    }
    if (!vehicleNumber.trim()) {
      setError('Vehicle registration number is required (e.g. TN 69 AB 1234)');
      return;
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@zestro.com`,
      vehicleType,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      licenseNumber: licenseNumber.trim().toUpperCase() || `TN-69-${Date.now().toString().slice(-6)}`,
      status,
      currentLocation: currentLocation.trim(),
      distanceFromHub: partner?.distanceFromHub || '1.1 km',
      locationCoords: partner?.locationCoords || { lat: 9.1726, lng: 77.8681 },
      rating: parseFloat(rating) || 4.9,
      totalDeliveries: partner?.totalDeliveries || 0,
      avatar: partner?.avatar || '',
      id: isEditing ? partner.id : `dp_${Date.now()}`,
      joinedDate: partner?.joinedDate || 'Just now',
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: '#0284c7' }}>
              <Icon name="delivery" size={20} color="#ffffff" />
            </div>
            <div>
              <h3>{isEditing ? `Edit Delivery Partner: ${partner.name}` : 'Add New Delivery Partner'}</h3>
              <p className="sub">Register courier rider profile, vehicle plate, and operating zone</p>
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
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Senthil Nathan"
                className="admin-form-input"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 99001"
                className="admin-form-input"
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="input-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. senthil.rider@zestro.com"
                className="admin-form-input"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Duty Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="admin-form-select"
              >
                <option value="Available">Available / Idle</option>
                <option value="On Duty">On Duty</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="input-group">
              <label className="form-label">Vehicle Model / Type</label>
              <select
                value={vehicleType}
                onChange={e => setVehicleType(e.target.value)}
                className="admin-form-select"
              >
                <option value="Hero Splendor Plus">Hero Splendor Plus (Motorcycle)</option>
                <option value="Honda Activa 6G">Honda Activa 6G (Scooter)</option>
                <option value="Ather 450X EV">Ather 450X (Electric EV)</option>
                <option value="TVS Jupiter 125">TVS Jupiter 125 (Scooter)</option>
                <option value="Bajaj Pulsar 150">Bajaj Pulsar 150 (Motorcycle)</option>
                <option value="Commercial Mini Van">Commercial Mini Cargo</option>
              </select>
            </div>

            <div className="input-group">
              <label className="form-label">Vehicle Registration No. *</label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={e => setVehicleNumber(e.target.value)}
                placeholder="e.g. TN 69 AB 1234"
                className="admin-form-input"
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="input-group">
              <label className="form-label">Driving License Number</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={e => setLicenseNumber(e.target.value)}
                placeholder="e.g. TN-69-2022-008912"
                className="admin-form-input"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Initial Performance Rating</label>
              <select
                value={rating}
                onChange={e => setRating(e.target.value)}
                className="admin-form-select"
              >
                <option value="5.0">5.0 ⭐ (Exceptional)</option>
                <option value="4.9">4.9 ⭐ (Top Rated)</option>
                <option value="4.8">4.8 ⭐ (Very Good)</option>
                <option value="4.7">4.7 ⭐ (Good)</option>
                <option value="4.5">4.5 ⭐ (Standard)</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="form-label">Current Operating Area / Location *</label>
            <input
              type="text"
              required
              value={currentLocation}
              onChange={e => setCurrentLocation(e.target.value)}
              placeholder="e.g. Kovilpatti Central Bus Stand, Main Road"
              className="admin-form-input"
            />
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Icon name="check" size={16} />
              <span>{isEditing ? 'Save Changes' : 'Register Partner'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
