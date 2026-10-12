import React, { useState } from 'react';
import Icon from '../Icon';

export default function VoucherModal({
  isOpen,
  onClose,
  onSave,
  restaurants = [],
}) {
  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');
  const [discountPct, setDiscountPct] = useState('20');
  const [maxDiscount, setMaxDiscount] = useState('150');
  const [minOrder, setMinOrder] = useState('299');
  const [usesLeft, setUsesLeft] = useState('50');
  const [expiresInDays, setExpiresInDays] = useState('30');
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Coupon code is required (e.g. FESTIVE30)');
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      desc: desc.trim() || `${discountPct}% OFF up to ₹${maxDiscount}`,
      discountPct: parseInt(discountPct, 10) || 0,
      maxDiscount: parseInt(maxDiscount, 10) || 0,
      minOrder: parseInt(minOrder, 10) || 0,
      usesLeft: parseInt(usesLeft, 10) || 10,
      expiresInDays: parseInt(expiresInDays, 10) || 15,
      freeDelivery,
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card voucher-modal-card" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: '#ffb703' }}>
              <Icon name="offers" size={20} color="#000000" />
            </div>
            <div>
              <h3>Create Promotional Voucher</h3>
              <p className="sub">Deploy discount codes for Kovilpatti &amp; Tirunelveli foodies</p>
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
              <label className="form-label">Voucher Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ZESTRO30"
                className="admin-form-input code-font"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Discount Percentage (%)</label>
              <input
                type="number"
                min="5"
                max="100"
                value={discountPct}
                onChange={e => setDiscountPct(e.target.value)}
                placeholder="20"
                className="admin-form-input"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="form-label">Campaign Description</label>
            <input
              type="text"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="e.g. 20% OFF on all South Indian orders above ₹299"
              className="admin-form-input"
            />
          </div>

          <div className="form-row-3">
            <div className="input-group">
              <label className="form-label">Min Order (₹)</label>
              <input
                type="number"
                min="0"
                value={minOrder}
                onChange={e => setMinOrder(e.target.value)}
                placeholder="199"
                className="admin-form-input"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Max Discount (₹)</label>
              <input
                type="number"
                min="0"
                value={maxDiscount}
                onChange={e => setMaxDiscount(e.target.value)}
                placeholder="150"
                className="admin-form-input"
              />
            </div>

            <div className="input-group">
              <label className="form-label">Total Redemptions</label>
              <input
                type="number"
                min="1"
                value={usesLeft}
                onChange={e => setUsesLeft(e.target.value)}
                placeholder="50"
                className="admin-form-input"
              />
            </div>
          </div>

          <div className="modal-footer-actions">
            <label className="availability-checkbox-label">
              <input
                type="checkbox"
                checked={freeDelivery}
                onChange={e => setFreeDelivery(e.target.checked)}
              />
              <span>Include Free Delivery Waiver</span>
            </label>

            <div className="action-buttons">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Icon name="check" size={16} />
                <span>Create Voucher</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
