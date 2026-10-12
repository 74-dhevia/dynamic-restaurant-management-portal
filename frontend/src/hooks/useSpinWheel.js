import { useState, useCallback } from 'react';

const PRIZES = [
  { label: '10% OFF', type: 'coupon', value: 10 },
  { label: 'Free Delivery', type: 'delivery', value: 0 },
  { label: '+50 Points', type: 'points', value: 50 },
  { label: 'Try Again', type: 'none', value: 0 },
  { label: '20% OFF', type: 'coupon', value: 20 },
  { label: '+100 Points', type: 'points', value: 100 },
  { label: '5% OFF', type: 'coupon', value: 5 },
  { label: 'Try Again', type: 'none', value: 0 },
];

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function useSpinWheel() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [lastSpin, setLastSpin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zestro_lastSpin')); } catch { return null; }
  });

  const canSpin = !lastSpin || (Date.now() - lastSpin > COOLDOWN_MS);
  const msUntilNext = lastSpin ? Math.max(0, COOLDOWN_MS - (Date.now() - lastSpin)) : 0;

  const spin = useCallback((onDone) => {
    if (!canSpin || spinning) return;
    setSpinning(true);
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const segmentAngle = 360 / PRIZES.length;
    const targetRotation = 360 * 5 + (360 - prizeIndex * segmentAngle - segmentAngle / 2);
    setRotation(targetRotation);
    setTimeout(() => {
      setSpinning(false);
      setResult(PRIZES[prizeIndex]);
      const now = Date.now();
      localStorage.setItem('zestro_lastSpin', JSON.stringify(now));
      setLastSpin(now);
      onDone && onDone(PRIZES[prizeIndex]);
    }, 4000);
  }, [canSpin, spinning]);

  return { PRIZES, spinning, rotation, result, spin, canSpin, msUntilNext };
}
