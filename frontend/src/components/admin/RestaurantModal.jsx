import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import SafeImage from '../SafeImage';
import { AREAS } from '../../data/mockData';

export default function RestaurantModal({
  isOpen,
  onClose,
  onSave,
  restaurant = null,
}) {
  const isEditing = !!restaurant;

  const [name, setName] = useState('');
  const [area, setArea] = useState(AREAS[0] || 'Kovilpatti');
  const [cuisine, setCuisine] = useState('');
  const [address, setAddress] = useState('');
  const [image, setImage] = useState('');
  const [openHour, setOpenHour] = useState('7');
  const [closeHour, setCloseHour] = useState('22');
  const [status, setStatus] = useState('Open');
  const [hasTableBooking, setHasTableBooking] = useState(true);
  const [hasPreOrder, setHasPreOrder] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || '');
      setArea(restaurant.area || (AREAS[0] || 'Kovilpatti'));
      setCuisine(restaurant.cuisine || 'South Indian, Biriyani');
      setAddress(restaurant.address || '');
      setImage(restaurant.image || '');
      setOpenHour(restaurant.openHour !== undefined ? String(restaurant.openHour) : '7');
      setCloseHour(restaurant.closeHour !== undefined ? String(restaurant.closeHour) : '22');
      setStatus(restaurant.status || 'Open');
      setHasTableBooking(restaurant.hasTableBooking !== undefined ? restaurant.hasTableBooking : true);
      setHasPreOrder(restaurant.hasPreOrder !== undefined ? restaurant.hasPreOrder : true);
    } else {
      setName('');
      setArea(AREAS[0] || 'Kovilpatti');
      setCuisine('South Indian, Chettinad, Biriyani');
      setAddress('14, Main Road, Kovilpatti');
      setImage('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80');
      setOpenHour('7');
      setCloseHour('22');
      setStatus('Open');
      setHasTableBooking(true);
      setHasPreOrder(true);
    }
    setError('');
  }, [restaurant, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file (PNG, JPG, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setImage(loadEvt.target?.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Restaurant name is required');
      return;
    }

    const payload = {
      name: name.trim(),
      area,
      cuisine: cuisine.trim(),
      address: address.trim() || `Main Bazaar Road, ${area}`,
      image: image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
      openHour: parseInt(openHour, 10) || 7,
      closeHour: parseInt(closeHour, 10) || 22,
      status,
      hasTableBooking,
      hasPreOrder,
    };

    if (isEditing) {
      payload.id = restaurant.id;
    } else {
      payload.id = `r_${Date.now()}`;
      payload.rating = '4.5';
      payload.ratingCount = 50;
      payload.priceForTwo = 350;
      payload.tables = Array.from({ length: 8 }, (_, t) => ({
        id: `T${t + 1}`,
        label: `T${t + 1}`,
        status: 'free',
      }));
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card restaurant-modal-card" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: '#e8542a' }}>
              <Icon name="restaurant" size={20} color="#ffffff" />
            </div>
            <div>
              <h3>{isEditing ? `Edit Restaurant: ${restaurant.name}` : 'Add Partner Restaurant'}</h3>
              <p className="sub">Establishment profile, operating region, and reservation parameters</p>
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

          {/* Restaurant Exterior / Interior Photo */}
          <div className="form-image-uploader-section">
            <label className="form-label">Establishment Photo (Manual Device Upload)</label>
            <div className="image-preview-and-controls">
              <div className="image-preview-box">
                {image ? (
                  <SafeImage
                    image={image}
                    alt={name || 'Restaurant'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                  />
                ) : (
                  <div className="no-image-placeholder">
                    <Icon name="restaurant" size={32} />
                  </div>
                )}
              </div>
              <div className="image-controls-wrap">
                <label className="btn btn-outline btn-sm upload-file-btn">
                  <Icon name="camera" size={15} />
                  <span>Choose Photo from Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="form-row-2">
            <div className="input-group">
              <label className="form-label">Restaurant Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sree Krishna Vilas"
                className="admin-form-input"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Region *</label>
              <select
                value={area}
                onChange={e => setArea(e.target.value)}
                className="admin-form-select"
              >
                {AREAS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="input-group">
              <label className="form-label">Cuisine Specialities</label>
              <input
                type="text"
                value={cuisine}
                onChange={e => setCuisine(e.target.value)}
                placeholder="e.g. South Indian, Chettinad, Dum Biriyani"
                className="admin-form-input"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Operational Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="admin-form-select"
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
                <option value="Busy">Busy</option>
                <option value="Temporarily Unavailable">Temporarily Unavailable</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="input-group">
              <label className="form-label">Opening Time (Hour 0-23)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={openHour}
                onChange={e => setOpenHour(e.target.value)}
                className="admin-form-input"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Closing Time (Hour 0-23)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={closeHour}
                onChange={e => setCloseHour(e.target.value)}
                className="admin-form-input"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="form-label">Street Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 24, Gandhi Road, Kovilpatti"
              className="admin-form-input"
            />
          </div>

          <div className="modal-footer-actions">
            <div style={{ display: 'flex', gap: 16 }}>
              <label className="availability-checkbox-label">
                <input
                  type="checkbox"
                  checked={hasTableBooking}
                  onChange={e => setHasTableBooking(e.target.checked)}
                />
                <span>Table Reservations</span>
              </label>

              <label className="availability-checkbox-label">
                <input
                  type="checkbox"
                  checked={hasPreOrder}
                  onChange={e => setHasPreOrder(e.target.checked)}
                />
                <span>Food Pre-Orders</span>
              </label>
            </div>

            <div className="action-buttons">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Icon name="check" size={16} />
                <span>{isEditing ? 'Save Restaurant' : 'Add Restaurant'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
