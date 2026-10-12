import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RESTAURANTS } from '../data/mockData';
import RestaurantCard from '../components/RestaurantCard';
import { applyCoupon } from '../redux/slices/cartSlice';
import { addNotification } from '../redux/slices/notificationSlice';
import { useToast } from '../contexts/ToastContext';
import authApiService from '../services/authApiService';
import Icon from '../components/Icon';

export default function Offers() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const vouchers = useSelector(s => s.voucher?.vouchers || []);
  const currentUser = useSelector(s => s.auth?.currentUser);
  const offerRestaurants = RESTAURANTS.filter(r => r.offer);

  const [notificationEmail, setNotificationEmail] = useState(currentUser?.email || '');
  const [sendingAll, setSendingAll] = useState(false);
  const [sendingCode, setSendingCode] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'percent' | 'flat'

  const activeVouchers = vouchers.filter(v => v.usesLeft > 0);

  const filteredVouchers = activeVouchers.filter(v => {
    if (filterType === 'all') return true;
    if (filterType === 'percent') return v.type === 'percent' || v.desc?.includes('%');
    if (filterType === 'flat') return v.type === 'flat' || v.desc?.includes('₹');
    return true;
  });

  // Dispatch all active offers to user's notification email
  const handleSendAllOffersEmail = async (e) => {
    e?.preventDefault();
    const targetEmail = (notificationEmail || currentUser?.email || '').trim().toLowerCase();

    if (!targetEmail) {
      showToast('Please enter your notification email address', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setSendingAll(true);
    try {
      const res = await authApiService.sendOffersEmail({
        email: targetEmail,
        name: currentUser?.fullName || currentUser?.name || 'Valued Foodie',
        offers: activeVouchers,
        customMessage: 'Here are all the live discount vouchers and promotional deals ready for you at ZESTRO!',
      });

      if (res.ok && res.data?.success) {
        showToast(`🎉 All active offers & vouchers dispatched to ${targetEmail}! Check your inbox.`, 'success');

        // Dispatch in-app notification to the user's notification tray
        dispatch(addNotification({
          type: 'offer',
          title: '🏷️ Exclusive Offers Sent to Email!',
          message: `Active coupons & discount codes dispatched to ${targetEmail}.`,
          actionUrl: '/offers',
        }));
      } else {
        showToast(res.data?.message || 'Failed to dispatch offers email. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Error sending offers email: ' + err.message, 'error');
    } finally {
      setSendingAll(false);
    }
  };

  // Dispatch single voucher to email
  const handleSendSingleOfferEmail = async (voucher) => {
    const targetEmail = (notificationEmail || currentUser?.email || '').trim().toLowerCase();

    if (!targetEmail) {
      showToast('Please enter your notification email address in the box above', 'error');
      return;
    }

    setSendingCode(voucher.code);
    try {
      const res = await authApiService.sendOffersEmail({
        email: targetEmail,
        name: currentUser?.fullName || currentUser?.name || 'Valued Foodie',
        offers: [voucher],
        customMessage: `Here is your exclusive discount code: ${voucher.code} (${voucher.desc || 'Special Offer'}). Redeem it on your next meal!`,
      });

      if (res.ok && res.data?.success) {
        showToast(`📧 Coupon code ${voucher.code} sent to ${targetEmail}!`, 'success');

        dispatch(addNotification({
          type: 'offer',
          title: `🏷️ Promo Code ${voucher.code} Sent!`,
          message: `Voucher details dispatched to ${targetEmail}.`,
          actionUrl: '/offers',
        }));
      } else {
        showToast(res.data?.message || 'Failed to dispatch voucher email', 'error');
      }
    } catch (err) {
      showToast('Error sending voucher: ' + err.message, 'error');
    } finally {
      setSendingCode(null);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showToast(`Code ${code} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedCode(''), 3000);
  };

  return (
    <div className="offers-page-container" style={{ padding: '20px clamp(12px, 2vw, 24px)', width: '100%', maxWidth: '100%', margin: '0', boxSizing: 'border-box' }}>
      {/* Hero Header */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.15) 0%, rgba(234, 88, 12, 0.1) 100%)',
          border: '1px solid rgba(225, 29, 72, 0.3)',
          borderRadius: 18,
          padding: '28px 32px',
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(225, 29, 72, 0.2)', color: '#fb7185', fontSize: 12.5, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>
              <span>🏷️</span>
              <span>Exclusive Savings & Gourmet Perks</span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
              Offers, Coupons & Dining Deals
            </h1>
            <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: 14.5, margin: 0, maxWidth: 640 }}>
              Apply verified discount vouchers to save instantly at checkout, or dispatch all active codes directly to your notification email inbox so you never miss a deal!
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fb7185' }}>{activeVouchers.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Active Coupons</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399' }}>{offerRestaurants.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Offer Outlets</div>
            </div>
          </div>
        </div>

        {/* Email Notification Dispatch Bar */}
        <div
          style={{
            marginTop: 24,
            padding: '16px 20px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 14,
            backdropFilter: 'blur(8px)',
          }}
        >
          <form onSubmit={handleSendAllOffersEmail} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 300px' }}>
              <span style={{ fontSize: 20 }}>📬</span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f1f5f9' }}>
                  Send Offers to Notification Email
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)' }}>
                  Receive all active voucher codes, discounts, and dining perks in your inbox
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 340px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="Enter notification email..."
                  required
                  style={{
                    width: '100%',
                    height: 42,
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 8,
                    padding: '0 12px',
                    color: '#ffffff',
                    fontSize: 13.5,
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={sendingAll}
                className="btn btn-primary"
                style={{
                  height: 42,
                  padding: '0 20px',
                  fontWeight: 700,
                  fontSize: 13.5,
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{sendingAll ? '📨 Sending...' : '✉️ Email Me Offers'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setFilterType('all')}
            className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 20, padding: '5px 14px', fontSize: 12.5 }}
          >
            All Offers ({activeVouchers.length})
          </button>
          <button
            onClick={() => setFilterType('percent')}
            className={`btn btn-sm ${filterType === 'percent' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 20, padding: '5px 14px', fontSize: 12.5 }}
          >
            % Discounts
          </button>
          <button
            onClick={() => setFilterType('flat')}
            className={`btn btn-sm ${filterType === 'flat' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 20, padding: '5px 14px', fontSize: 12.5 }}
          >
            Flat ₹ Savings
          </button>
        </div>

        <div style={{ fontSize: 12.5, color: 'var(--text-muted, #94a3b8)' }}>
          Showing {filteredVouchers.length} coupon deals
        </div>
      </div>

      {/* Vouchers Grid */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18, marginBottom: 40 }}>
        {filteredVouchers.map((v) => (
          <div
            key={v.code}
            className="card"
            style={{
              padding: 20,
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'var(--card-bg, #161b2e)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              transition: 'transform 0.2s, border-color 0.2s',
            }}
          >
            <div>
              {/* Badge & Uses Left */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span
                  style={{
                    background: v.badge?.includes('HOT') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: v.badge?.includes('HOT') ? '#f87171' : '#60a5fa',
                    border: `1px solid ${v.badge?.includes('HOT') ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 12,
                    textTransform: 'uppercase',
                  }}
                >
                  {v.badge || 'PROMO'}
                </span>

                <span style={{ fontSize: 11.5, color: 'var(--text-muted, #94a3b8)' }}>
                  ⏳ {v.usesLeft} use(s) left
                </span>
              </div>

              {/* Code Box with Copy */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1.5px dashed var(--accent, #e11d48)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 18,
                    fontWeight: 900,
                    letterSpacing: 1.5,
                    color: 'var(--accent, #fb7185)',
                  }}
                >
                  {v.code}
                </span>

                <button
                  type="button"
                  onClick={() => handleCopyCode(v.code)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedCode === v.code ? '#34d399' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '2px 6px',
                  }}
                  title="Copy Code"
                >
                  {copiedCode === v.code ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>

              {/* Description */}
              <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: '0 0 6px', lineHeight: 1.4 }}>
                {v.desc}
              </p>

              <p style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', margin: '0 0 16px' }}>
                Minimum Order: <strong>₹{v.minOrder || 0}</strong> • Valid for all dine-in & delivery
              </p>
            </div>

            {/* Actions: Apply & Email Code */}
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  dispatch(applyCoupon(v));
                  showToast(`Coupon ${v.code} applied to your cart!`, 'success');
                  navigate('/cart');
                }}
                style={{ flex: 1, fontWeight: 700, height: 36 }}
              >
                Apply Coupon
              </button>

              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={sendingCode === v.code}
                onClick={() => handleSendSingleOfferEmail(v)}
                style={{
                  height: 36,
                  padding: '0 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Send this offer to your email"
              >
                <span>{sendingCode === v.code ? '...' : '📧 Email'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Restaurants with Live Offers */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
              🍽️ Restaurants with Exclusive Offers ({offerRestaurants.length})
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)', margin: '4px 0 0' }}>
              Handpicked outlets currently offering special discounts, complimentary gifts, and flat markdowns.
            </p>
          </div>
        </div>

        <div className="grid">
          {offerRestaurants.map((r) => (
            <RestaurantCard key={r.id} r={r} />
          ))}
        </div>
      </div>
    </div>
  );
}
