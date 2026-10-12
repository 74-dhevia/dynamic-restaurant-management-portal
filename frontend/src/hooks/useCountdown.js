import { useState, useEffect, useRef, useCallback } from 'react';

export function useCountdown(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (seconds <= 0) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setSeconds(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [seconds > 0]);

  const start = useCallback((s) => setSeconds(s), []);
  const reset = useCallback(() => setSeconds(0), []);

  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return { seconds, start, reset, formatted, isActive: seconds > 0 };
}
