import { useState, useRef, useCallback } from 'react';

export function useOtp(length = 6) {
  const [digits, setDigits] = useState(Array(length).fill(''));
  const [error, setError] = useState('');
  const refs = useRef([]);

  const setDigit = useCallback((index, val) => {
    if (!/^[0-9]?$/.test(val)) return;
    setDigits(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
    setError('');
    if (val && index < length - 1) refs.current[index + 1]?.focus();
  }, [length]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }, [digits]);

  const handlePaste = useCallback((e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    e.preventDefault();
    setDigits(Array.from({ length }, (_, i) => text[i] || ''));
    const lastIdx = Math.min(text.length, length) - 1;
    if (lastIdx >= 0) refs.current[lastIdx]?.focus();
  }, [length]);

  const code = digits.join('');
  const isComplete = digits.every(d => d !== '');

  const shake = () => setError('shake');
  const reset = () => { setDigits(Array(length).fill('')); setError(''); refs.current[0]?.focus(); };

  return { digits, setDigit, handleKeyDown, handlePaste, refs, code, isComplete, error, setError, shake, reset };
}
