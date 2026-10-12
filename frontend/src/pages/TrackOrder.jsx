import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { advanceOrderStage, ORDER_STAGES, completeRefund, updateOrderDeliveryLocation } from '../redux/slices/orderSlice';
import { addNotification } from '../redux/slices/notificationSlice';
import Icon from '../components/Icon';
import SafeImage from '../components/SafeImage';
import LiveRouteMap from '../components/delivery/LiveRouteMap';
import { useToast } from '../contexts/ToastContext';

export default function TrackOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const order = useSelector(s => s.order.orders.find(o => o.id === id));
  const [liveDistance, setLiveDistance] = useState(null);
  const [liveEta, setLiveEta] = useState(null);

  // Auto stage progression simulation for demo experience
  useEffect(() => {
    if (!order || order.cancelled || order.stageIndex >= ORDER_STAGES.length - 1) return;
    const timer = setInterval(() => {
      dispatch(advanceOrderStage(id));
    }, 12000);
    return () => clearInterval(timer);
  }, [id, order?.stageIndex, order?.cancelled, dispatch]);

  // Refund handling for cancelled orders
  useEffect(() => {
    if (order?.refund?.status === 'Processing') {
      const t = setTimeout(() => {
        dispatch(completeRefund(id));
        dispatch(
          addNotification({
            type: 'refund',
            title: 'Refund Completed',
            message: `₹${order.refund.amount} refunded via ${order.refund.method}.`,
          })
        );
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [order?.refund?.status, dispatch, id, order?.refund?.amount, order?.refund?.method]);

  if (!order) {
    return (
      <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <span className="emoji" style={{ fontSize: 44 }}>❓</span>
        <h2 style={{ marginTop: 12 }}>Order Not Found</h2>
        <p className="muted">We couldn't locate order #{id}. Check your order history.</p>
        <button className="btn btn-primary" onClick={() => navigate('/orders')} style={{ marginTop: 16 }}>
          View My Orders
        </button>
      </div>
    );
  }

  const riderInfo = {
    name: 'Suresh Kumar',
    phone: '+91 98401 23456',
    vehicleType: 'Hero Splendor Plus',
    vehicleNumber: 'TN 69 AB 1234',
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  };

  const handleLocationUpdate = loc => {
    if (loc?.distanceKm) setLiveDistance(loc.distanceKm);
    if (loc?.etaMinutes) setLiveEta(loc.etaMinutes);
    dispatch(
      updateOrderDeliveryLocation({
        id: order.id,
        riderCoords: loc.riderCoords,
        etaMinutes: loc.etaMinutes,
        distanceKm: loc.distanceKm,
      })
    );
  };

  const currentStageName = ORDER_STAGES[order.stageIndex] || order.status || 'Out for Delivery';
  const isDelivered = order.status === 'Delivered';
  const isCancelled = order.cancelled;
  const deliveryOtp = order.deliveryOtp || '4821';

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '16px clamp(12px, 2.5vw, 36px) 60px', boxSizing: 'border-box' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => navigate('/orders')}
            style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            ← Back to Orders
          </button>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>
            🛵 Live Food Delivery Tracking — #{order.id}
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 13.5 }}>
            From <strong>{order.restaurantName || 'Restaurant Kitchen'}</strong> to your doorstep in real-time
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            className="badge"
            style={{
              background: isDelivered ? 'rgba(16, 185, 129, 0.15)' : isCancelled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(232, 84, 42, 0.15)',
              color: isDelivered ? '#10b981' : isCancelled ? '#ef4444' : 'var(--accent)',
              fontWeight: 800,
              fontSize: 14,
              padding: '8px 16px',
              borderRadius: 20,
              border: `1px solid ${isDelivered ? '#10b981' : isCancelled ? '#ef4444' : 'var(--accent)'}`,
            }}
          >
            {isCancelled ? '❌ Order Cancelled' : isDelivered ? '✅ Order Delivered' : `● ${currentStageName}`}
          </span>
        </div>
      </div>

      {isCancelled ? (
        <div className="card" style={{ padding: 24, borderRadius: 16 }}>
          <h3 style={{ color: 'var(--danger)', margin: '0 0 8px' }}>❌ This order was cancelled.</h3>
          <p className="muted" style={{ margin: '0 0 16px' }}>Reason: {order.cancelReason || 'Requested by customer or restaurant operational delay.'}</p>
          {order.refund && (
            <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <p style={{ margin: '0 0 6px' }}>Refund Reference: <strong>{order.refund.id}</strong></p>
              <p style={{ margin: '0 0 10px' }}>Amount: <strong>₹{order.refund.amount}</strong> via {order.refund.method}</p>
              <span className="rating-chip" style={{ background: order.refund.status === 'Completed' ? 'var(--success)' : 'var(--accent2)' }}>
                Refund Status: {order.refund.status}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 540px), 1fr))', gap: 24 }}>
          {/* LEFT COLUMN: LIVE GPS MAP & ROUTE NAVIGATOR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <LiveRouteMap
              order={order}
              riderInfo={riderInfo}
              viewMode="customer"
              onLocationUpdate={handleLocationUpdate}
              height={440}
            />

            {/* Rider Identity & Contact Card */}
            <div
              className="card"
              style={{
                padding: 20,
                borderRadius: 16,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <SafeImage
                    image={riderInfo.avatar}
                    alt={riderInfo.name}
                    style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 16 }}>{riderInfo.name}</strong>
                      <span className="badge" style={{ fontSize: 11, background: '#10b981', color: '#fff', padding: '2px 7px', borderRadius: 10 }}>
                        ⭐ {riderInfo.rating}
                      </span>
                    </div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                      {riderInfo.vehicleType} • <strong style={{ color: 'var(--text)' }}>{riderInfo.vehicleNumber}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <a
                    href={`tel:${riderInfo.phone}`}
                    className="btn btn-sm"
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      fontWeight: 700,
                      borderRadius: 10,
                      padding: '8px 14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      textDecoration: 'none',
                    }}
                  >
                    <Icon name="phone" size={15} />
                    <span>Call Rider</span>
                  </a>

                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => showToast('Driver alerted: "Customer is waiting at gate"', 'success')}
                    style={{ borderRadius: 10 }}
                  >
                    💬 Send Gate Alert
                  </button>
                </div>
              </div>

              {/* Delivery Safety OTP Pass */}
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  background: 'color-mix(in srgb, var(--accent) 8%, var(--bg))',
                  border: '1px dashed var(--accent)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Doorstep Delivery Verification OTP
                  </span>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Share this 4-digit code when your rider arrives</div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 4, color: 'var(--accent)', fontFamily: 'monospace' }}>
                  {deliveryOtp}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ORDER TIMELINE & ITEMS SUMMARY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Live Progress Stage Stepper */}
            <div
              className="card"
              style={{
                padding: 22,
                borderRadius: 16,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="clock" size={18} color="var(--accent)" />
                <span>Order Status Progression</span>
              </h3>

              <ul className="timeline" style={{ margin: 0, padding: 0 }}>
                {ORDER_STAGES.map((stageName, idx) => {
                  const isDone = idx <= (order.stageIndex || 0);
                  const isCurrent = idx === (order.stageIndex || 0);
                  const timelineEntry = order.timeline?.find(t => t.status === stageName);

                  return (
                    <li
                      key={stageName}
                      className={isDone ? 'done' : ''}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 14,
                        marginBottom: idx < ORDER_STAGES.length - 1 ? 16 : 0,
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: isDone ? (isCurrent ? 'var(--accent)' : '#10b981') : 'var(--border)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: 14, color: isCurrent ? 'var(--accent)' : isDone ? 'var(--text)' : 'var(--text-muted)' }}>
                            {stageName}
                          </strong>
                          {timelineEntry?.at && (
                            <span className="muted" style={{ fontSize: 11 }}>
                              {new Date(timelineEntry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>
                          {stageName === 'Placed' && 'Order successfully received and payment verified'}
                          {stageName === 'Confirmed' && 'Kitchen accepted and queued the order'}
                          {stageName === 'Preparing' && 'Master chefs crafting your hot dishes'}
                          {stageName === 'Ready' && 'Food packed securely with tamper-proof seal'}
                          {stageName === 'Out for Delivery' && 'Rider en route with thermal hot bag'}
                          {stageName === 'Delivered' && 'Safely delivered to your doorstep. Bon appétit!'}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Delivery Address & Order Items */}
            <div
              className="card"
              style={{
                padding: 22,
                borderRadius: 16,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
              }}
            >
              <h3 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 800 }}>📍 Delivery Destination</h3>
              <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>
                {typeof order.deliveryAddress === 'string'
                  ? order.deliveryAddress
                  : (order.deliveryAddress?.text || order.deliveryAddress?.address || '12B Green Valley, Kovilpatti')}
              </p>
              {order.deliveryInstruction && (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', background: 'var(--bg)', padding: '8px 12px', borderRadius: 8, marginTop: 8 }}>
                  📝 Note: {order.deliveryInstruction}
                </div>
              )}

              <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

              <h4 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700 }}>Dishes Ordered ({order.items?.length || 0})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {(order.items || []).map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5 }}>
                    <span>
                      <strong style={{ color: 'var(--accent)' }}>{it.qty || 1}×</strong> {it.name}
                    </span>
                    <strong style={{ fontFamily: 'monospace' }}>₹{(it.price || 0) * (it.qty || 1)}</strong>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 10,
                  borderTop: '1px solid var(--border)',
                  fontSize: 16,
                  fontWeight: 900,
                }}
              >
                <span>Total Paid ({order.paymentMethod || 'UPI'})</span>
                <span style={{ color: 'var(--accent)' }}>₹{order.grandTotal || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
