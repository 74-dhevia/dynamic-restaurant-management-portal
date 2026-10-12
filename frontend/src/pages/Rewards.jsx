import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSpinWheel } from '../hooks/useSpinWheel';
import { addPoints } from '../redux/slices/rewardSlice';
import { applyCoupon } from '../redux/slices/cartSlice';
import { addNotification } from '../redux/slices/notificationSlice';
import { useToast } from '../contexts/ToastContext';

function tierFor(points) {
  if (points >= 1000) return { name: 'Platinum', emoji: '💎', next: null };
  if (points >= 500) return { name: 'Gold', emoji: '🥇', next: 1000 };
  if (points >= 200) return { name: 'Silver', emoji: '🥈', next: 500 };
  return { name: 'Bronze', emoji: '🥉', next: 200 };
}

export default function Rewards() {
  const { points = 120, history = [] } = useSelector(s => s.reward || {});
  const safeHistory = Array.isArray(history) ? history : [];
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { PRIZES, spinning, rotation, result, spin, canSpin, msUntilNext } = useSpinWheel();
  const tier = tierFor(points);
  const progressPct = tier.next ? Math.min(100, (points / tier.next) * 100) : 100;

  const handleSpinResult = (prize) => {
    if (prize.type === 'points') {
      dispatch(addPoints({ amount: prize.value, reason: 'Spin the Wheel' }));
      dispatch(addNotification({ type: 'rewards', title: 'Spin Wheel Win!', message: `You won +${prize.value} DinePoints!` }));
      showToast(`🎉 +${prize.value} DinePoints!`, 'success');
    } else if (prize.type === 'coupon') {
      dispatch(applyCoupon({ code: `SPIN${prize.value}`, desc: `${prize.value}% OFF from Spin Wheel`, discountPct: prize.value, maxDiscount: 200, minOrder: 0, usesLeft: 1 }));
      showToast(`🎉 ${prize.value}% OFF coupon ready to use!`, 'success');
    } else if (prize.type === 'delivery') {
      dispatch(applyCoupon({ code: 'SPINFREESHIP', desc: 'Free Delivery from Spin Wheel', freeDelivery: true, discountPct: 0, minOrder: 0, usesLeft: 1 }));
      showToast('🎉 Free delivery coupon ready!', 'success');
    } else {
      showToast('Try again tomorrow!', 'info');
    }
  };

  return (
    <div>
      <h1>🏆 Rewards — DinePoints</h1>
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ margin: 0 }}>{tier.emoji} {tier.name} Tier</h2>
        <p className="muted">{points} DinePoints</p>
        <div className="progress-bar"><div className="fill" style={{ width: `${progressPct}%` }} /></div>
        {tier.next && <p className="muted">{tier.next - points} points to next tier</p>}
      </div>

      <div className="section card" style={{ padding: 20, textAlign: 'center' }}>
        <h2>🎡 Spin the Wheel</h2>
        <div className="wheel-wrap">
          <div className="wheel-outer">
            <span className="wheel-pointer">🔻</span>
            <div className="wheel" style={{ transform: `rotate(${rotation}deg)`, background: `conic-gradient(${PRIZES.map((p, i) => `${i % 2 ? 'var(--accent2)' : 'var(--accent)'} ${i * (360 / PRIZES.length)}deg ${(i + 1) * (360 / PRIZES.length)}deg`).join(',')})` }}>
            </div>
          </div>
          <button className="btn btn-primary" disabled={!canSpin || spinning} onClick={() => spin(handleSpinResult)}>
            {spinning ? 'Spinning...' : canSpin ? 'SPIN NOW' : `Come back in ${Math.ceil(msUntilNext / 3600000)}h`}
          </button>
          {result && !spinning && <p>You landed on: <strong>{result.label}</strong></p>}
        </div>
      </div>

      <div className="section card" style={{ padding: 20 }}>
        <h3>History</h3>
        {safeHistory.length === 0 ? <p className="muted">No history yet.</p> : safeHistory.slice(0, 10).map((h, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span>{h.reason}</span>
            <strong style={{ color: h.change > 0 ? 'var(--success)' : 'var(--danger)' }}>{h.change > 0 ? '+' : ''}{h.change}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
