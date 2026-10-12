import React, { useState, useMemo } from 'react';
import Icon from '../Icon';

export default function FoodQualityCheckpointModal({
  isOpen,
  order,
  chef,
  restaurantName,
  onConfirmReady,
  onClose,
}) {
  const isTakeawayOrDelivery = useMemo(() => {
    if (!order) return true;
    const type = (order.orderType || '').toLowerCase();
    return type.includes('delivery') || type.includes('pickup') || type.includes('takeaway');
  }, [order]);

  const hasSpecialInstructions = useMemo(() => {
    return !!(order?.deliveryInstruction || order?.notes || order?.internalNote);
  }, [order]);

  // Define checklist items with applicable condition
  const checklistItems = useMemo(() => {
    return [
      {
        id: 'correct_dish',
        label: 'Correct dish verified',
        desc: 'Matches ordered menu recipes and portion plating',
        applicable: true,
      },
      {
        id: 'correct_qty',
        label: 'Correct quantity confirmed',
        desc: 'All item portions counted and accounted for',
        applicable: true,
      },
      {
        id: 'presentation',
        label: 'Presentation checked',
        desc: 'Garnish, plating standards, and serving temperature inspected',
        applicable: true,
      },
      {
        id: 'instructions',
        label: 'Special instructions followed',
        desc: hasSpecialInstructions
          ? `Customer note adhered to: "${order.deliveryInstruction || order.notes || order.internalNote}"`
          : 'Standard kitchen preparation instructions verified',
        applicable: true,
      },
      {
        id: 'dietary',
        label: 'Dietary & allergy notes reviewed',
        desc: 'Allergen segregation and culinary safety standards maintained',
        applicable: true,
      },
      {
        id: 'packaging',
        label: 'Packaging checked for takeaway/delivery orders',
        desc: isTakeawayOrDelivery
          ? 'Thermal containers sealed, tamper-evident labels applied'
          : 'Dine-in service ware and runner tray presentation prepared',
        applicable: true,
      },
    ];
  }, [order, isTakeawayOrDelivery, hasSpecialInstructions]);

  const [checkedMap, setCheckedMap] = useState({});
  const [chefNotes, setChefNotes] = useState('');
  const [error, setError] = useState('');

  // Reset when order changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCheckedMap({});
      setChefNotes('');
      setError('');
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  // Count verified
  const applicableItems = checklistItems.filter(i => i.applicable);
  const completedCount = applicableItems.filter(i => !!checkedMap[i.id]).length;
  const isAllCompleted = completedCount === applicableItems.length;

  const handleToggle = (id) => {
    setCheckedMap(prev => {
      const next = { ...prev, [id]: !prev[id] };
      return next;
    });
    setError('');
  };

  const handleVerifyAll = () => {
    const all = {};
    applicableItems.forEach(i => {
      all[i.id] = true;
    });
    setCheckedMap(all);
    setError('');
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (order.cancelled || order.status === 'Cancelled') {
      setError('Cannot mark ready: Order is cancelled.');
      return;
    }

    if (!isAllCompleted) {
      setError(`All ${applicableItems.length} quality checkpoints must be verified before confirming readiness.`);
      return;
    }

    const qualityCheckResult = {
      verified: true,
      verifiedAt: new Date().toISOString(),
      verifiedBy: chef?.fullName || chef?.name || 'Station Chef',
      checklist: applicableItems.map(i => i.label),
      notes: chefNotes.trim() || 'All culinary quality criteria verified by station chef before dispatch.',
    };

    onConfirmReady(order.id, qualityCheckResult);
    onClose();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="admin-modal-card quality-checkpoint-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 580 }}
      >
        {/* Header */}
        <div className="admin-modal-header" style={{ borderBottomColor: 'rgba(34, 197, 94, 0.25)' }}>
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: '#16a34a', color: '#ffffff' }}>
              <Icon name="shield" size={19} />
            </div>
            <div>
              <h3 style={{ color: '#16a34a', margin: 0, fontSize: 16 }}>
                FOOD QUALITY CHECKPOINT
              </h3>
              <p className="sub" style={{ margin: 0, fontSize: 12 }}>
                Mandatory verification before dispatch • Station: {restaurantName}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleConfirm}>
          <div className="modal-body-scroll" style={{ maxHeight: '72vh', padding: '18px 22px' }}>
            {/* Order & Station Summary Banner */}
            <div className="checkpoint-order-meta">
              <div className="meta-left">
                <span className="order-chip">Order #{order.id}</span>
                <span className="order-type-chip">{order.orderType || 'Delivery'}</span>
              </div>
              <div className="meta-right">
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Restaurant:</span>
                <strong style={{ fontSize: 12.5, marginLeft: 4 }}>{restaurantName}</strong>
              </div>
            </div>

            {/* Dish Names & Quantities */}
            <div className="checkpoint-dishes-box">
              <span className="box-title">Plated Dishes to Verify:</span>
              <ul className="checkpoint-dish-list">
                {(order.items || []).map((item, idx) => (
                  <li key={idx} className="checkpoint-dish-row">
                    <span className="dish-qty-chip">× {item.qty}</span>
                    <strong className="dish-name-text">{item.name}</strong>
                  </li>
                ))}
              </ul>
            </div>

            {/* Relevant Customer Instructions */}
            {hasSpecialInstructions && (
              <div className="checkpoint-instructions-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="sparkles" size={14} color="var(--accent)" />
                  <strong style={{ fontSize: 12.5, color: 'var(--text)' }}>Customer Notes / Instructions:</strong>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                  "{order.deliveryInstruction || order.notes || order.internalNote}"
                </p>
              </div>
            )}

            {/* Checklist Completion Status Header */}
            <div className="checkpoint-status-bar">
              <div className="status-text-row">
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                  Quality Verification Checklist ({completedCount} of {applicableItems.length} verified)
                </span>
                <button
                  type="button"
                  className="btn btn-link btn-xs"
                  onClick={handleVerifyAll}
                  style={{ fontSize: 11.5 }}
                >
                  Verify All Checklist Items
                </button>
              </div>
              <div className="checkpoint-progress-track">
                <div
                  className="checkpoint-progress-bar"
                  style={{ width: `${(completedCount / applicableItems.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Checklist items */}
            <div className="checkpoint-items-stack">
              {applicableItems.map(item => {
                const isChecked = !!checkedMap[item.id];
                return (
                  <label
                    key={item.id}
                    className={`checkpoint-check-label ${isChecked ? 'checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(item.id)}
                    />
                    <div className="check-text-col">
                      <strong className="check-item-title">{item.label}</strong>
                      <span className="check-item-desc">{item.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Optional Chef Sign-Off Note */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <label htmlFor="chef-quality-note" className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
                Chef Verification Notes (Optional)
              </label>
              <input
                id="chef-quality-note"
                type="text"
                className="admin-form-input"
                style={{ fontSize: 13, padding: '7px 10px', width: '100%' }}
                placeholder="e.g. Plated fresh, temperature checked at 74°C, extra garnish added."
                value={chefNotes}
                onChange={e => setChefNotes(e.target.value)}
              />
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
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel &amp; Return to Ticket
            </button>
            <button
              type="submit"
              className="btn btn-success btn-sm"
              disabled={!isAllCompleted}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 700,
                opacity: isAllCompleted ? 1 : 0.6,
                cursor: isAllCompleted ? 'pointer' : 'not-allowed',
              }}
            >
              <Icon name="check" size={15} />
              <span>CONFIRM QUALITY &amp; MARK READY</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
