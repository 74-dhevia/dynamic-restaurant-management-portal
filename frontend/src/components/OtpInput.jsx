import React from 'react';
import { useOtp } from '../hooks/useOtp';

export default function OtpInput({ onComplete, correctCode = '123456' }) {
  const { digits, setDigit, handleKeyDown, handlePaste, refs, code, isComplete, error, setError, shake } = useOtp(6);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    if (isComplete && !checked) {
      setChecked(true);
      if (code === correctCode) {
        onComplete && onComplete(true);
      } else {
        shake();
        setTimeout(() => setError(''), 500);
        setTimeout(() => setChecked(false), 600);
      }
    }
    if (!isComplete) setChecked(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  return (
    <div>
      <div className={`otp-boxes ${error ? 'shake' : ''}`} onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => (refs.current[i] = el)}
            value={d}
            inputMode="numeric"
            maxLength={1}
            onChange={e => setDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
          />
        ))}
      </div>
      {error && <p className="error-text" style={{ textAlign: 'center' }}>Incorrect code. Try the demo OTP below.</p>}
      <p className="muted" style={{ textAlign: 'center' }}>🔐 Demo OTP: <strong>123456</strong> (no real SMS is sent)</p>
    </div>
  );
}
