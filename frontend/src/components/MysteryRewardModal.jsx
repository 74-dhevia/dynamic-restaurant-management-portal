import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMysteryBoxState, openMysteryBox, claimMysteryReward } from '../services/aiApiService';
import { addVoucher } from '../redux/slices/voucherSlice';
import { addPoints } from '../redux/slices/rewardSlice';
import { addNotification } from '../redux/slices/notificationSlice';
import { useToast } from '../contexts/ToastContext';

export default function MysteryRewardModal({ orderId = 'order_default', isOpen, onClose }) {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [boxState, setBoxState] = useState({ status: 'Available', reward: null });
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getMysteryBoxState(orderId);
      setBoxState(current);
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const handleOpenBox = () => {
    if (boxState.status !== 'Available') return;
    setIsOpening(true);

    setTimeout(() => {
      const opened = openMysteryBox(orderId);
      setBoxState(opened);
      setIsOpening(false);
      showToast('🎁 Mystery Box Opened! You won a reward!', 'success');
    }, 1100);
  };

  const handleClaimReward = () => {
    if (!boxState.reward) return;
    const claimed = claimMysteryReward(orderId);
    setBoxState(claimed);

    const rew = boxState.reward;
    if (rew.type === 'voucher') {
      dispatch(addVoucher({
        code: rew.code,
        desc: rew.desc,
        minOrder: 199,
        discountPct: rew.discountPct || 0,
        maxDiscount: rew.discount || 100,
        freeDelivery: !!rew.freeDelivery,
        expiresInDays: 30,
        usesLeft: 1,
      }));
      showToast(`Coupon ${rew.code} added to your account! 🎉`, 'success');
    } else if (rew.type === 'points') {
      dispatch(addPoints({
        amount: rew.points,
        reason: 'Won from Mystery Box 🎁',
      }));
      showToast(`+${rew.points} DinePoints credited to your wallet! ⭐`, 'success');
    }

    dispatch(addNotification({
      type: 'reward',
      title: 'Mystery Reward Claimed!',
      message: `You claimed ${rew.title}. Use it on your next authentic feast!`,
    }));

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 310,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1.5px solid var(--border)',
        borderRadius: 24,
        maxWidth: 440,
        width: '100%',
        padding: 30,
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        {/* State 1: Available */}
        {boxState.status === 'Available' && (
          <div>
            <div style={{
              fontSize: 72,
              marginBottom: 12,
              animation: isOpening ? 'shake 0.5s infinite' : 'none',
              display: 'inline-block',
            }}>
              🎁
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 22 }}>Your Mystery Box is Ready!</h2>
            <p className="muted" style={{ margin: '0 0 20px', fontSize: 13.5 }}>
              You've completed your order! Tap to reveal your exclusive restaurant reward.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleOpenBox}
              disabled={isOpening}
              style={{
                fontSize: 16,
                padding: '12px 20px',
                borderRadius: 14,
                boxShadow: '0 8px 24px rgba(232, 84, 42, 0.4)',
              }}
            >
              {isOpening ? 'Opening Mystery Box...' : '✨ OPEN MYSTERY BOX'}
            </button>
          </div>
        )}

        {/* State 2: Opened */}
        {boxState.status === 'Opened' && boxState.reward && (
          <div>
            <div style={{ fontSize: 64, marginBottom: 8 }}>🎉</div>
            <span className="rating-chip" style={{ background: '#ffb703', color: '#382400', fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 12 }}>
              CONGRATULATIONS!
            </span>
            <h2 style={{ margin: '12px 0 6px', fontSize: 24, color: 'var(--accent)' }}>
              {boxState.reward.title}
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)' }}>
              {boxState.reward.desc}
            </p>

            {boxState.reward.code && (
              <div style={{
                background: 'var(--bg)',
                border: '1.5px dashed var(--accent)',
                borderRadius: 12,
                padding: '10px 16px',
                marginBottom: 20,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span className="muted" style={{ fontSize: 12 }}>Voucher Code:</span>
                <strong style={{ fontSize: 16, letterSpacing: 1, color: 'var(--accent)' }}>{boxState.reward.code}</strong>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleClaimReward}
              style={{
                fontSize: 15,
                padding: '12px 20px',
                borderRadius: 12,
              }}
            >
              Claim Reward & Add to Account
            </button>
          </div>
        )}

        {/* State 3: Claimed */}
        {boxState.status === 'Claimed' && (
          <div>
            <div style={{ fontSize: 56, marginBottom: 8 }}>✅</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>Reward Claimed!</h3>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: 13.5 }}>
              This Mystery Box has already been opened and the reward has been added to your available coupons and DinePoints.
            </p>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
