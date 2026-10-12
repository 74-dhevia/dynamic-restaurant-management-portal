import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import SafeImage from '../SafeImage';

export default function FoodModal({
  isOpen,
  onClose,
  onSave,
  food = null, // null for Add, object for Edit
  restaurants = [],
  categories = [],
}) {
  const isEditing = !!food;

  const [name, setName] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [veg, setVeg] = useState(true);
  const [prepTimeMin, setPrepTimeMin] = useState('15');
  const [spiceLevel, setSpiceLevel] = useState('Medium');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [allergens, setAllergens] = useState('');
  const [image, setImage] = useState('');
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState('');

  // Load existing food values or default
  useEffect(() => {
    if (food) {
      setName(food.name || '');
      setRestaurantId(food.restaurantId || (restaurants[0]?.id || ''));
      setCategory(food.category || (categories[0]?.id || 'south-indian'));
      setPrice(food.price ? String(food.price) : '');
      setDiscount(food.discount !== undefined ? String(food.discount) : '0');
      setVeg(food.veg !== undefined ? !!food.veg : true);
      setPrepTimeMin(food.prepTimeMin ? String(food.prepTimeMin) : '15');
      setSpiceLevel(food.spiceLevel || 'Medium');
      setDescription(food.description || '');
      setIngredients(food.ingredients || '');
      setAllergens(food.allergens || '');
      setImage(food.image || '');
      setAvailable(food.available !== undefined ? food.available : true);
    } else {
      setName('');
      setRestaurantId(restaurants[0]?.id || '');
      setCategory(categories[0]?.id || 'south-indian');
      setPrice('');
      setDiscount('0');
      setVeg(true);
      setPrepTimeMin('15');
      setSpiceLevel('Medium');
      setDescription('');
      setIngredients('Fresh farm ingredients, Traditional spice blend, Ghee / Oil');
      setAllergens('Dairy (Ghee / Paneer)');
      setImage('https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80');
      setAvailable(true);
    }
    setError('');
  }, [food, restaurants, categories, isOpen]);

  if (!isOpen) return null;

  // Handle Manual File Upload from Device
  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    // Limit size to ~4MB
    if (file.size > 4 * 1024 * 1024) {
      setError('File size too large. Please select an image under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setImage(loadEvent.target?.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Food name is required');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid price greater than 0');
      return;
    }

    const selectedRest = restaurants.find(r => r.id === restaurantId);

    const payload = {
      name: name.trim(),
      restaurantId,
      restaurantName: selectedRest ? selectedRest.name : 'Partner Restaurant',
      category,
      price: Math.round(numPrice),
      discount: parseInt(discount, 10) || 0,
      veg,
      prepTimeMin: parseInt(prepTimeMin, 10) || 15,
      spiceLevel,
      description: description.trim() || `Authentic ${name.trim()} prepared fresh with premium ingredients.`,
      ingredients: ingredients.trim(),
      allergens: allergens.trim(),
      image: image || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
      available,
    };

    if (isEditing) {
      payload.id = food.id;
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card food-modal-card" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <Icon name="food" size={20} color="#ffffff" />
            </div>
            <div>
              <h3>{isEditing ? `Edit Food: ${food.name}` : 'Add New Food Item'}</h3>
              <p className="sub">Update catalog specifications and manual dish photography</p>
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

          {/* Manual Image Selection Section */}
          <div className="form-image-uploader-section">
            <label className="form-label">Dish Photography (Manual Device Upload)</label>
            <div className="image-preview-and-controls">
              <div className="image-preview-box">
                {image ? (
                  <SafeImage
                    image={image}
                    alt={name || 'Food preview'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                  />
                ) : (
                  <div className="no-image-placeholder">
                    <Icon name="image" size={32} color="var(--text-muted)" />
                    <span>No image selected</span>
                  </div>
                )}
              </div>

              <div className="image-controls-wrap">
                <div className="image-upload-btn-row">
                  <label className="btn btn-outline btn-sm upload-file-btn">
                    <Icon name="camera" size={15} />
                    <span>Choose from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {image && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => setImage('')}
                    >
                      <Icon name="delete" size={14} /> Remove
                    </button>
                  )}
                </div>
                <div className="manual-url-fallback">
                  <span className="url-label">Or Image URL:</span>
                  <input
                    type="url"
                    value={image}
                    onChange={e => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="admin-form-input small"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-row-2">
            <div className="input-group">
              <label className="form-label">Food Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Special Ghee Podi Dosa"
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

          <div className="form-row-3">
            <div className="input-group">
              <label className="form-label">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="admin-form-select"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="form-label">Price (₹) *</label>
              <input
                type="number"
                required
                min="10"
                step="1"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="150"
                className="admin-form-input"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="90"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                placeholder="0"
                className="admin-form-input"
              />
            </div>
          </div>

          <div className="form-row-3">
            <div className="input-group">
              <label className="form-label">Dietary</label>
              <div className="dietary-toggle-wrap">
                <button
                  type="button"
                  className={`dietary-btn veg ${veg ? 'active' : ''}`}
                  onClick={() => setVeg(true)}
                >
                  <span className="dot" /> Pure Veg
                </button>
                <button
                  type="button"
                  className={`dietary-btn non-veg ${!veg ? 'active' : ''}`}
                  onClick={() => setVeg(false)}
                >
                  <span className="dot" /> Non-Veg
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="form-label">Preparation Time (mins)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={prepTimeMin}
                onChange={e => setPrepTimeMin(e.target.value)}
                placeholder="15"
                className="admin-form-input"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Spice Level</label>
              <select
                value={spiceLevel}
                onChange={e => setSpiceLevel(e.target.value)}
                className="admin-form-select"
              >
                <option value="Mild">Mild</option>
                <option value="Medium">Medium</option>
                <option value="Hot">Hot</option>
                <option value="Extra Hot">Extra Hot</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="form-label">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Crispy, golden crepe topped with aromatic spiced lentils and clarified butter..."
              className="admin-form-textarea"
            />
          </div>

          <div className="form-row-2">
            <div className="input-group">
              <label className="form-label">Ingredients</label>
              <input
                type="text"
                value={ingredients}
                onChange={e => setIngredients(e.target.value)}
                placeholder="Lentils, Rice Batter, Desi Ghee, Podi Masala"
                className="admin-form-input"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Allergens</label>
              <input
                type="text"
                value={allergens}
                onChange={e => setAllergens(e.target.value)}
                placeholder="Dairy, Nuts, None"
                className="admin-form-input"
              />
            </div>
          </div>

          <div className="modal-footer-actions">
            <label className="availability-checkbox-label">
              <input
                type="checkbox"
                checked={available}
                onChange={e => setAvailable(e.target.checked)}
              />
              <span>In Stock &amp; Available for Ordering</span>
            </label>

            <div className="action-buttons">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Icon name="check" size={16} />
                <span>{isEditing ? 'Save Changes' : 'Add Food Item'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
