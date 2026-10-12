import React, { useMemo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import SafeImage from '../components/SafeImage';
import ConfirmationModal from '../components/ConfirmationModal';
import { addToCart, incQty, decQty, removeFromCart, clearCart, removeCoupon, setRedeemPoints } from '../redux/slices/cartSlice';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { 
  getActiveRoom, 
  saveActiveRoom, 
  subscribeToCollabActions, 
  broadcastCollabAction 
} from '../utils/collabCartUtils';
import CollabCartModal from '../components/CollabCartModal';

export function computeTotals({ items, coupon, redeemPoints = 0, availablePoints = 0 }) {
  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  let deliveryFee = subtotal >= 300 ? 0 : 35;
  let discount = 0;
  if (coupon) {
    if (coupon.freeDelivery) deliveryFee = 0;
    else discount = Math.min(Math.round(subtotal * (coupon.discountPct / 100)), coupon.maxDiscount || Infinity);
  }
  const pointsValue = Math.min(redeemPoints, availablePoints, subtotal);
  const grandTotal = Math.max(0, subtotal + tax + deliveryFee - discount - pointsValue);
  return { subtotal, tax, deliveryFee, discount, pointsValue, grandTotal };
}

export default function Cart() {
  const { items, coupon } = useSelector(s => s.cart);
  const rewardPoints = useSelector(s => s.reward.points);
  const reduxFoods = useSelector(s => s.food?.foods || []);
  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants || []);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);
  const [usePoints, setUsePoints] = useState(false);

  // CollabCart State
  const [collabRoom, setCollabRoom] = useState(getActiveRoom);
  const [collabModal, setCollabModal] = useState({ open: false, mode: 'split' });

  // Handle URL query ?room=ZEST-xxxx to join
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setCollabModal({ open: true, mode: 'join' });
    }
  }, [location.search]);

  // Subscribe to peer tab events for live sync
  useEffect(() => {
    const unsubscribe = subscribeToCollabActions((action) => {
      if (action.type === 'ADD_ITEM') {
        dispatch(addToCart(action.item));
        showToast(`🎉 ${action.participant || 'Friend'} added ${action.item.name} to the group cart!`, 'info');
      } else if (action.type === 'PEER_JOINED') {
        setCollabRoom(action.room);
        showToast(`🟢 ${action.participant} joined the Group Feast!`, 'success');
      } else if (action.type === 'ROOM_STATE_UPDATED') {
        setCollabRoom(action.room);
      } else if (action.type === 'ROOM_CREATED') {
        setCollabRoom(action.room);
      }
    });
    return unsubscribe;
  }, [dispatch, showToast]);

  // Leave room helper
  const leaveRoom = () => {
    saveActiveRoom(null);
    setCollabRoom(null);
    showToast('Left Group Feast Room', 'info');
  };

  // Check if any items in cart became unavailable or restaurant is closed/temporarily unavailable
  const itemAvailabilityIssues = useMemo(() => {
    return items.map(item => {
      const f = reduxFoods.find(food => food.id === item.foodId);
      const r = reduxRestaurants.find(rest => rest.id === item.restaurantId);
      let reason = null;
      if (f && (f.available === false || f.status === 'deactivated')) {
        reason = 'Dish is currently unavailable';
      } else if (r && (r.status === 'Temporarily Unavailable' || r.status === 'Closed')) {
        reason = `Restaurant is ${r.status}`;
      }
      return { ...item, issue: reason };
    });
  }, [items, reduxFoods, reduxRestaurants]);

  const hasUnavailableItems = itemAvailabilityIssues.some(i => !!i.issue);

  const totals = useMemo(() => computeTotals({ items, coupon, redeemPoints: usePoints ? rewardPoints : 0, availablePoints: rewardPoints }), [items, coupon, usePoints, rewardPoints]);

  const proceed = () => {
    if (hasUnavailableItems) {
      showToast('Some items in your cart are currently unavailable. Please remove them before proceeding.', 'error');
      return;
    }
    if (!isAuthenticated) {
      showToast('Please sign in or register to place your order', 'info');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    dispatch(setRedeemPoints(usePoints ? rewardPoints : 0));
    navigate('/checkout');
  };

  if (!items.length) {
    return (
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px' }}>
        {/* CollabCart Banner on Empty State */}
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.16), rgba(232, 84, 42, 0.14))',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            borderRadius: 20,
            padding: '20px 24px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 32 }}>🎉</span>
            <div>
              <strong style={{ fontSize: 16, color: '#fff', display: 'block' }}>
                CollabCart — Order Together with Friends
              </strong>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                Host a live group room, let friends add dishes in real-time &amp; auto-split with UPI QR codes!
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setCollabModal({ open: true, mode: 'start' })}
              style={{ fontSize: 13, fontWeight: 800, padding: '8px 18px', borderRadius: 12 }}
            >
              ✨ Start Group Feast (Host)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCollabModal({ open: true, mode: 'join' })}
              style={{ fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 12 }}
            >
              🔗 Join with PIN
            </button>
          </div>
        </div>

        <div className="empty-state">
          <span className="emoji">🛒</span>Your cart is empty.
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-primary" onClick={() => navigate('/restaurants')}>
              Browse Restaurants
            </button>
          </div>
        </div>

        {/* Modal */}
        <CollabCartModal
          isOpen={collabModal.open}
          mode={collabModal.mode}
          room={collabRoom}
          cartItems={items}
          onClose={() => setCollabModal({ open: false, mode: 'split' })}
          onRoomUpdated={(r) => setCollabRoom(r)}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px' }}>
      {/* =========================================================================
          COLLABCART LIVE ROOM BANNER (Active Room vs Start/Join Trigger)
          ========================================================================= */}
      {collabRoom ? (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.12))',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            borderRadius: 18,
            padding: '14px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🟢</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ color: '#4ade80', fontSize: 14 }}>
                  LIVE COLLABCART ROOM:
                </strong>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 900,
                    background: 'rgba(0,0,0,0.3)',
                    padding: '2px 8px',
                    borderRadius: 6,
                    color: '#fff',
                    letterSpacing: 1.5,
                  }}
                >
                  {collabRoom.code}
                </span>
                <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 10, color: 'rgba(255,255,255,0.8)' }}>
                  {collabRoom.participants?.length || 1} Members
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                Host: <strong>{collabRoom.hostName}</strong> • Any peer can add dishes simultaneously!
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setCollabModal({ open: true, mode: 'split' })}
              style={{ fontWeight: 800, padding: '7px 16px', borderRadius: 10 }}
            >
              🧾 Split Bill (UPI QR)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const url = `${window.location.origin}/cart?room=${collabRoom.code}`;
                navigator.clipboard?.writeText?.(url);
                showToast(`Copied invite link: ${url}`, 'info');
              }}
              style={{ padding: '7px 12px', borderRadius: 10 }}
            >
              Invite Link 🔗
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={leaveRoom}
              style={{ padding: '7px 10px', borderRadius: 10, color: '#fca5a5' }}
              title="Leave Room"
            >
              Exit
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.14), rgba(232, 84, 42, 0.12))',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: 18,
            padding: '14px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>🎉</span>
            <div>
              <strong style={{ color: '#fff', fontSize: 14, display: 'block' }}>
                CollabCart — Group Dining &amp; Split
              </strong>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                Host or join a live room to add dishes together across multiple screens &amp; auto-split UPI bills.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setCollabModal({ open: true, mode: 'start' })}
              style={{ fontWeight: 800, padding: '7px 16px', borderRadius: 10 }}
            >
              ✨ Start Group Feast
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setCollabModal({ open: true, mode: 'join' })}
              style={{ fontWeight: 700, padding: '7px 14px', borderRadius: 10 }}
            >
              🔗 Join with PIN
            </button>
          </div>
        </div>
      )}

      <h1>🛒 Your Cart</h1>

      {hasUnavailableItems && (
        <div className="card" style={{ padding: 12, marginBottom: 16, background: 'rgba(230,57,70,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
          <strong>⚠️ Item Availability Notice:</strong> One or more items in your cart cannot be ordered right now (either the item is unavailable or the restaurant is closed/temporarily unavailable). Please remove them using the trash icon to proceed with checkout.
        </div>
      )}

      {/* Cart Items List */}
      {itemAvailabilityIssues.map(item => (
        <div key={item.foodId} className="card" style={{ display: 'flex', gap: 12, padding: 14, marginBottom: 12, alignItems: 'center', opacity: item.issue ? 0.75 : 1 }}>
          <SafeImage image={item.image} className="food-card-img" style={{ width: 68, height: 68, borderRadius: 10, flexShrink: 0, filter: item.issue ? 'grayscale(0.6)' : 'none' }} emoji="🍛" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <strong>{item.name}</strong>
              {item.issue && (
                <span className="rating-chip" style={{ background: 'var(--danger)', color: '#fff', fontSize: 11 }}>
                  {item.issue}
                </span>
              )}
              {/* CollabCart Member Attribution Badge */}
              {collabRoom && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#d8b4fe',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                  }}
                >
                  👤 Added by {item.addedBy || collabRoom.hostName || 'You'}
                </span>
              )}
            </div>
            <p className="muted" style={{ margin: '3px 0' }}>{item.restaurantName} • ₹{item.price}</p>
          </div>
          <button className="btn btn-secondary btn-sm" disabled={!!item.issue} onClick={() => dispatch(decQty(item.foodId))}>−</button>
          <strong>{item.qty}</strong>
          <button className="btn btn-secondary btn-sm" disabled={!!item.issue} onClick={() => dispatch(incQty(item.foodId))}>+</button>
          <button className="icon-btn" onClick={() => dispatch(removeFromCart(item.foodId))}>🗑️</button>
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setConfirmClear(true)}>
          Clear Cart
        </button>

        {/* Multi-Person Bill Split Trigger */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setCollabModal({ open: true, mode: 'split' })}
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(232, 84, 42, 0.15))',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          🧾 Split Bill with Friends (UPI QR)
        </button>
      </div>

      {/* Totals & Checkout Card */}
      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        {coupon && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span>Coupon <strong>{coupon.code}</strong> applied</span>
            <button className="btn btn-sm btn-secondary" onClick={() => dispatch(removeCoupon())}>Remove</button>
          </div>
        )}
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <input type="checkbox" checked={usePoints} onChange={e => setUsePoints(e.target.checked)} />
          Redeem {rewardPoints} DinePoints (₹{Math.min(rewardPoints, totals.subtotal)} off)
        </label>
        <Row label="Subtotal" value={totals.subtotal} />
        <Row label="Tax" value={totals.tax} />
        <Row label="Delivery Fee" value={totals.deliveryFee} />
        {totals.discount > 0 && <Row label="Coupon Discount" value={-totals.discount} />}
        {totals.pointsValue > 0 && <Row label="Points Redeemed" value={-totals.pointsValue} />}
        <hr style={{ borderColor: 'var(--border)' }} />
        <Row label="Grand Total" value={totals.grandTotal} bold />

        {!isAuthenticated && (
          <div
            className="card"
            style={{
              padding: '14px 16px',
              marginTop: 14,
              background: 'linear-gradient(135deg, rgba(230, 57, 70, 0.08), rgba(245, 166, 35, 0.08))',
              border: '1.5px dashed var(--danger)',
              borderRadius: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 26, lineHeight: 1 }}>🔒</span>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: 14, color: 'var(--danger)', marginBottom: 3 }}>
                  Sign In Required to Place Order
                </strong>
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.4, display: 'block' }}>
                  Guest checkout is not permitted on ZESTRO. Please sign in or create a new account to proceed with your address, delivery time, and payment.
                </span>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => navigate('/login', { state: { from: { pathname: '/checkout' } } })}
                  >
                    🔑 Sign In to Order
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => navigate('/register', { state: { from: { pathname: '/checkout' } } })}
                  >
                    📝 Create New Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          className="btn btn-primary btn-block"
          style={{
            marginTop: 14,
            background: !isAuthenticated ? 'linear-gradient(135deg, #e63946, #c1121f)' : 'var(--accent)',
            boxShadow: !isAuthenticated ? '0 4px 14px rgba(230, 57, 70, 0.3)' : undefined,
          }}
          onClick={proceed}
        >
          {isAuthenticated ? 'Proceed to Checkout →' : '🔒 Sign In to Place Order'}
        </button>
      </div>

      {/* Confirmation & Collab Modals */}
      <ConfirmationModal
        open={confirmClear}
        title="Clear Cart?"
        message="This will remove all items from your cart."
        confirmLabel="Clear"
        danger
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => { dispatch(clearCart()); setConfirmClear(false); }}
      />

      <CollabCartModal
        isOpen={collabModal.open}
        mode={collabModal.mode}
        room={collabRoom}
        cartItems={items}
        onClose={() => setCollabModal({ open: false, mode: 'split' })}
        onRoomUpdated={(r) => setCollabRoom(r)}
      />
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontWeight: bold ? 800 : 400, fontSize: bold ? 17 : 14 }}>
      <span>{label}</span><span>₹{value}</span>
    </div>
  );
}
