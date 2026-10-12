import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MysteryRewardModal from '../components/MysteryRewardModal';

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = useSelector(s => s.order.orders.find(o => o.id === id));
  const [showMysteryModal, setShowMysteryModal] = useState(false);

  if (!order) return <div className="empty-state"><span className="emoji">❓</span>Order not found.</div>;

  return (
    <div className="empty-state" style={{ maxWidth: 520, margin: '20px auto' }}>
      <span className="emoji" style={{ fontSize: 54 }}>🎉</span>
      <h1 style={{ margin: '8px 0' }}>Order Placed Successfully!</h1>
      <p className="muted" style={{ margin: '0 0 16px' }}>Order ID: <strong>{order.id}</strong></p>

      {/* Order Summary Card */}
      <div className="card" style={{ padding: 18, margin: '16px 0', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>{order.restaurantName}</strong>
          <span className="rating-chip">Confirmed</span>
        </div>
        <p className="muted" style={{ margin: '6px 0' }}>{order.items.length} item(s) • Total: ₹{order.grandTotal || order.itemsTotal}</p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Estimated Delivery: 25–35 min to {order.customerAddress || 'Kovilpatti'}</p>
      </div>

      {/* Mystery Reward Callout Card Matching Section 2 */}
      <div className="card" style={{
        padding: 20,
        margin: '18px 0',
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--bg-elevated)), var(--bg-elevated))',
        border: '1.5px dashed var(--accent)',
        borderRadius: 16,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 44, marginBottom: 6 }}>🎁</div>
        <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>Your Mystery Box is Ready!</h3>
        <p className="muted" style={{ margin: '0 0 14px', fontSize: 13 }}>
          You've completed your order. Open your mystery box to unlock an exclusive reward!
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowMysteryModal(true)}
          style={{ padding: '10px 24px', borderRadius: 20, fontWeight: 800 }}
        >
          ✨ OPEN MYSTERY BOX
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => navigate(`/track-order/${order.id}`)}>
          Track Order Live
        </button>
        <button className="btn btn-secondary" onClick={() => navigate(`/ebill/${order.id}`)}>
          View E-Bill
        </button>
      </div>

      {/* Mystery Reward Modal */}
      <MysteryRewardModal
        orderId={order.id}
        isOpen={showMysteryModal}
        onClose={() => setShowMysteryModal(false)}
      />
    </div>
  );
}
