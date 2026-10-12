import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import SafeImage from '../SafeImage';

export default function ChefModal({
  isOpen,
  onClose,
  onSave,
  chef = null,
  restaurants = [],
}) {
  const isEditing = !!chef;

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [experience, setExperience] = useState('8 Years');
  const [specialization, setSpecialization] = useState('');
  const [cuisineExpertise, setCuisineExpertise] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [qualification, setQualification] = useState('');
  const [biography, setBiography] = useState('');
  const [workload, setWorkload] = useState('Normal');
  const [status, setStatus] = useState('Active');
  const [error, setError] = useState('');

  useEffect(() => {
    if (chef) {
      setName(chef.name || '');
      setPhoto(chef.photo || '');
      setPhone(chef.phone || '');
      setEmail(chef.email || '');
      setExperience(chef.experience || '8 Years');
      setSpecialization(chef.specialization || '');
      setCuisineExpertise(chef.cuisineExpertise || '');
      setRestaurantId(chef.restaurantId || (restaurants[0]?.id || ''));
      setQualification(chef.qualification || '');
      setBiography(chef.biography || '');
      setWorkload(chef.workload || 'Normal');
      setStatus(chef.status || 'Active');
    } else {
      setName('');
      setPhoto('https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&auto=format&fit=crop&q=80');
      setPhone('+91 98400 11223');
      setEmail('');
      setExperience('10 Years');
      setSpecialization('Biriyani & Traditional South Indian');
      setCuisineExpertise('Dindigul Dum Biriyani, Chettinad, Tandoor');
      setRestaurantId(restaurants[0]?.id || '');
      setQualification('Certified Master Chef, State Culinary Guild');
      setBiography('');
      setWorkload('Normal');
      setStatus('Active');
    }
    setError('');
  }, [chef, restaurants, isOpen]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setPhoto(loadEvt.target?.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Chef name is required');
      return;
    }

    const selectedRest = restaurants.find(r => r.id === restaurantId);

    const payload = {
      name: name.trim(),
      photo,
      phone: phone.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}.chef@zestro.com`,
      experience: experience.trim(),
      specialization: specialization.trim(),
      cuisineExpertise: cuisineExpertise.trim(),
      restaurantId,
      restaurantName: selectedRest ? selectedRest.name : 'Partner Kitchen',
      qualification: qualification.trim(),
      biography: biography.trim(),
      workload,
      status,
      availability: status === 'Active' ? 'Available' : 'Unavailable',
    };

    if (isEditing) {
      payload.id = chef.id;
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card chef-modal-card" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: '#f72585' }}>
              <Icon name="chef" size={20} color="#ffffff" />
            </div>
            <div>
              <h3>{isEditing ? `Edit Chef: ${chef.name}` : 'Add Master Chef'}</h3>
              <p className="sub">Culinary team profile, assigned restaurant, and expertise</p>
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

          {/* Chef Photo Selection from Device */}
          <div className="form-image-uploader-section">
            <label className="form-label">Chef Profile Photo (Manual Device Upload)</label>
            <div className="image-preview-and-controls">
              <div className="image-preview-box avatar-style">
                {photo ? (
                  <SafeImage
                    image={photo}
                    alt={name || 'Chef'}
                    style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="no-image-placeholder avatar-placeholder">
                    <Icon name="chef" size={28} />
                  </div>
                )}
              </div>
              <div className="image-controls-wrap">
                <div className="image-upload-btn-row">
                  <label className="btn btn-outline btn-sm upload-file-btn">
                    <Icon name="camera" size={15} />
                    <span>Choose Photo from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {photo && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => setPhoto('')}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="form-row-2">
            <div className="input-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Chef Murugesan P."
                className="admin-form-input"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Assigned Restaurant *</label>
              <select
                value={restaurantId}
                onChange={e => setRestaurantId(e.target.value)}
                className="admin-form-select"
                required
              >
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.area})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="input-group">
              <label className="form-label">Specialization</label>
              <input
                type="text"
                value={specialization}
                onChange={e => setSpecialization(e.target.value)}
                placeholder="e.g. Biriyani Master & Tandoor Specialist"
                className="admin-form-input"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Experience</label>
              <input
                type="text"
                value={experience}
                onChange={e => setExperience(e.target.value)}
                placeholder="e.g. 14 Years"
                className="admin-form-input"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="form-label">Cuisine Expertise</label>
            <input
              type="text"
              value={cuisineExpertise}
              onChange={e => setCuisineExpertise(e.target.value)}
              placeholder="e.g. Dindigul Dum Biriyani, Chettinad Curries, Seeraga Samba Pulao"
              className="admin-form-input"
            />
          </div>

          <div className="form-row-3">
            <div className="input-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98421 00000"
                className="admin-form-input"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Workload</label>
              <select
                value={workload}
                onChange={e => setWorkload(e.target.value)}
                className="admin-form-select"
              >
                <option value="Normal">Normal</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
                <option value="Peak">Peak</option>
              </select>
            </div>

            <div className="input-group">
              <label className="form-label">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="admin-form-select"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="form-label">Biography &amp; Technique</label>
            <textarea
              rows={2}
              value={biography}
              onChange={e => setBiography(e.target.value)}
              placeholder="Mastered woodfire cooking technique in Kovilpatti traditional kitchen..."
              className="admin-form-textarea"
            />
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Icon name="check" size={16} />
              <span>{isEditing ? 'Save Chef Profile' : 'Add Chef'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
