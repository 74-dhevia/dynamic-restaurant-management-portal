import React, { useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUpiQrCodeUrl } from '../utils/collabCartUtils';
import { useToast } from '../contexts/ToastContext';
import Icon from '../components/Icon';

export default function EBill() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const order = useSelector(s => s.order.orders.find(o => o.id === id));
  const user = useSelector(s => s.auth.currentUser);
  const billRef = useRef(null);

  // Group Split Calculator State
  const [splitCount, setSplitCount] = useState(1);
  const [showSplitDrawer, setShowSplitDrawer] = useState(false);

  if (!order) return <div className="empty-state"><span className="emoji">❓</span>Order not found.</div>;

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const html = `<html><head><title>ZESTRO Invoice ${order.id}</title><style>body{font-family:system-ui,-apple-system,sans-serif;padding:20px;max-width:800px;margin:0 auto;color:#1e293b;}table{width:100%;border-collapse:collapse;}th,td{padding:8px;border-bottom:1px solid #e2e8f0;text-align:left;}.total-box{text-align:right;margin-top:20px;}</style></head><body>${billRef.current.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ZESTRO-Invoice-${order.id}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  const deliveryOtp = order.deliveryOtp || '4821';
  const grandTotal = order.grandTotal || 0;
  const splitAmount = Math.ceil(grandTotal / (splitCount || 1));
  const qrUrl = getUpiQrCodeUrl(splitAmount, 'ZESTRO Dining', 'zestro.orders@okaxis');

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '16px clamp(12px, 2.5vw, 36px) 60px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={() => navigate('/orders')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          ← Back to Orders
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowSplitDrawer(!showSplitDrawer)}
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(232, 84, 42, 0.15))',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            🧾 {showSplitDrawer ? 'Hide Group Split' : 'Split Bill (UPI QR)'}
          </button>
          <button className="btn btn-secondary" onClick={handlePrint}>🖨️ Print Bill</button>
          <button className="btn btn-primary" onClick={handleDownload}>⬇️ Download E-Bill</button>
        </div>
      </div>

      {/* Interactive Group Split Drawer */}
      {showSplitDrawer && (
        <div
          className="card"
          style={{
            padding: 22,
            marginBottom: 20,
            borderRadius: 18,
            background: 'linear-gradient(145deg, rgba(30, 27, 46, 0.95), rgba(18, 18, 28, 0.98))',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            boxShadow: '0 12px 35px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#c084fc', textTransform: 'uppercase' }}>
                👥 AUTOMATED GROUP BILL SPLITTING
              </div>
              <h3 style={{ margin: '4px 0 0', fontSize: 18, color: '#fff' }}>
                Split ₹{grandTotal} with Friends via Instant UPI QR
              </h3>
            </div>

            {/* Friend count buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Friends:</span>
              {[2, 3, 4, 5].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setSplitCount(cnt)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: splitCount === cnt ? '1.5px solid #a855f7' : '1px solid rgba(255,255,255,0.15)',
                    background: splitCount === cnt ? '#a855f7' : 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                Each Person Pays:
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#4ade80', margin: '4px 0 12px' }}>
                ₹{splitAmount} <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>({splitCount} shares)</span>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const upiLink = `upi://pay?pa=zestro.orders@okaxis&pn=ZESTRO%20Dining&am=${splitAmount}&cu=INR`;
                    navigator.clipboard?.writeText?.(upiLink);
                    showToast(`Copied UPI Link: ₹${splitAmount}`, 'success');
                  }}
                  style={{ borderRadius: 10 }}
                >
                  📋 Copy GPay/UPI Link
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const text = `Hey, your food share for ZESTRO Order #${order.id} is ₹${splitAmount}. Pay via GPay/PhonePe UPI: upi://pay?pa=zestro.orders@okaxis&pn=ZESTRO%20Dining&am=${splitAmount}&cu=INR`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  style={{ borderRadius: 10, background: '#22c55e', borderColor: '#22c55e' }}
                >
                  💬 Share on WhatsApp
                </button>
              </div>
            </div>

            {/* Live Scannable UPI QR Box */}
            <div
              style={{
                background: '#fff',
                padding: 12,
                borderRadius: 14,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                maxWidth: 180,
                justifySelf: 'center',
              }}
            >
              <img
                src={qrUrl}
                alt="UPI QR Code"
                style={{ width: 140, height: 140, objectFit: 'contain' }}
              />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
                Scan ₹{splitAmount} UPI
              </span>
              <span style={{ fontSize: 9, color: '#64748b' }}>
                GPay • PhonePe • Paytm
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Printable / Downloadable Invoice Document */}
      <div className="card" style={{ padding: 28, borderRadius: 20 }} ref={billRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 style={{ color: 'var(--accent)', margin: 0, fontSize: 28 }}>🍽️ ZESTRO</h1>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
              Autonomous Dynamic Restaurant &amp; Fleet Ecosystem
            </p>
          </div>

          {/* Eco-Friendly Green Seal & Handshake Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                padding: '4px 10px',
                borderRadius: 999,
              }}
            >
              🌱 100% Certified Paperless Green E-Bill
            </span>

            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                padding: '4px 10px',
                borderRadius: 999,
              }}
            >
              🛡️ OTP Handshake Verified
            </span>
          </div>
        </div>

        <hr style={{ borderColor: 'var(--border)', margin: '18px 0' }} />

        {/* Invoice Meta Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, fontSize: 13.5 }}>
          <div>
            <span className="muted" style={{ display: 'block', fontSize: 12 }}>Invoice / Order No:</span>
            <strong>#{order.id}</strong>
          </div>
          <div>
            <span className="muted" style={{ display: 'block', fontSize: 12 }}>Date &amp; Time:</span>
            <strong>{new Date(order.placedAt || Date.now()).toLocaleString()}</strong>
          </div>
          <div>
            <span className="muted" style={{ display: 'block', fontSize: 12 }}>Customer:</span>
            <strong>{user?.fullName || order.customerName || 'Guest Diner'}</strong>
          </div>
          <div>
            <span className="muted" style={{ display: 'block', fontSize: 12 }}>Restaurant:</span>
            <strong>{order.restaurantName || 'Authentic Kitchen'}</strong>
          </div>
        </div>

        {/* Security OTP Verification Highlight Box */}
        <div
          style={{
            margin: '20px 0',
            padding: '12px 18px',
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
            <strong style={{ fontSize: 13, color: 'var(--accent)', display: 'block' }}>
              🛡️ Doorstep Handshake Delivery Verification OTP
            </strong>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Unique cryptographic 4-digit code preventing unauthorized order handover
            </span>
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: 4,
              color: 'var(--accent)',
              background: 'rgba(0,0,0,0.3)',
              padding: '4px 14px',
              borderRadius: 8,
            }}
          >
            {deliveryOtp}
          </div>
        </div>

        <p style={{ margin: '10px 0', fontSize: 13.5 }}>
          <strong>Delivery Destination:</strong> {order.address?.type || 'Home'} — {order.address?.text || 'Kovilpatti, Tamil Nadu'}
        </p>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', fontSize: 13, color: 'var(--text-muted)' }}>
              <th style={{ padding: '10px 8px' }}>Dish Item</th>
              <th style={{ padding: '10px 8px' }}>Portion / Qty</th>
              <th style={{ padding: '10px 8px' }}>Unit Price</th>
              <th style={{ padding: '10px 8px', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map(i => (
              <tr key={i.foodId || i.id} style={{ borderBottom: '1px solid var(--border)', fontSize: 13.5 }}>
                <td style={{ padding: '10px 8px' }}>
                  <strong>{i.name}</strong>
                  {i.addedBy && (
                    <span style={{ fontSize: 11, color: '#a855f7', marginLeft: 6 }}>
                      (by {i.addedBy})
                    </span>
                  )}
                </td>
                <td style={{ padding: '10px 8px' }}>x{i.qty}</td>
                <td style={{ padding: '10px 8px' }}>₹{i.price}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700 }}>₹{i.price * i.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Breakdown */}
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: 240 }}>
            <span className="muted">Subtotal:</span>
            <span>₹{order.subtotal || grandTotal}</span>
          </div>
          {order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: 240, color: '#22c55e' }}>
              <span>Coupon Discount:</span>
              <span>-₹{order.discount}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: 240 }}>
            <span className="muted">Delivery Fee:</span>
            <span>₹{order.deliveryFee || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: 240 }}>
            <span className="muted">GST (5%):</span>
            <span>₹{order.tax || 0}</span>
          </div>
          <hr style={{ width: 240, borderColor: 'var(--border)', margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', width: 240, fontSize: 18, fontWeight: 900, color: 'var(--accent)' }}>
            <span>Grand Total:</span>
            <span>₹{grandTotal}</span>
          </div>
        </div>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span>
            <strong>Payment Method:</strong> {order.paymentMethod || 'Online UPI'} • <strong>Status:</strong> {order.cancelled ? 'Refunded' : 'Paid in Full'}
          </span>
          <span>Thank you for dining with ZESTRO! 🌟</span>
        </div>
      </div>
    </div>
  );
}
