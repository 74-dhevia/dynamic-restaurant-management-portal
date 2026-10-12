import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useCountdown } from '../hooks/useCountdown';
import { useToast } from '../contexts/ToastContext';
import Icon from '../components/Icon';
import { useLanguage } from '../contexts/LanguageContext';
import authApiService from '../services/authApiService';
import { updateUserPassword } from '../redux/slices/authSlice';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const resetTokenParam = searchParams.get('token');
  const resetEmailParam = searchParams.get('email');

  // Primary channel is 'email' by default
  const [channel, setChannel] = useState('email'); // 'email' | 'whatsapp'
  const [step, setStep] = useState(resetTokenParam ? 3 : 1);
  const [identifier, setIdentifier] = useState(resetEmailParam || ''); // email or phone
  const [resetToken, setResetToken] = useState(resetTokenParam || '');
  const [tokenVerified, setTokenVerified] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [resetLinkSent, setResetLinkSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '', '', '']);
  const [waUrl, setWaUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { start, formatted, isActive } = useCountdown(0);

  // If token and email present in URL, verify token immediately (Section 3)
  useEffect(() => {
    if (resetTokenParam && resetEmailParam) {
      setLoading(true);
      authApiService.verifyPasswordResetToken({
        token: resetTokenParam,
        email: resetEmailParam,
      }).then((res) => {
        if (res.ok && res.data?.success) {
          setTokenVerified(true);
          setStep(3);
          setIdentifier(resetEmailParam);
          setResetToken(resetTokenParam);
        } else {
          setTokenError(res.data?.message || 'This password reset link is invalid or has expired.');
          showToast(res.data?.message || 'This password reset link is invalid or has expired.', 'error');
        }
      }).catch((err) => {
        setTokenError('Failed to verify reset link: ' + err.message);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [resetTokenParam, resetEmailParam, showToast]);

  // Section 3: Request secure password-reset link via backend
  const handleRequestResetLink = async (e) => {
    e?.preventDefault();
    const cleanTarget = identifier.trim().toLowerCase();
    if (!cleanTarget) {
      showToast('Please enter your registered email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await authApiService.requestPasswordResetLink(cleanTarget);
      if (res.ok || res.data?.success) {
        setResetLinkSent(true);
        showToast('If an account exists for this email, password reset instructions will be sent.', 'success');
      } else {
        showToast(res.data?.message || 'Failed to submit reset request. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Error requesting reset link: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP
  const sendOtp = async (e) => {
    e?.preventDefault();
    if (channel === 'email') {
      return handleRequestResetLink(e);
    }

    const cleanTarget = identifier.trim();
    if (!cleanTarget) {
      showToast('Please enter your WhatsApp mobile number', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await authApiService.sendPasswordResetOtp({
        identifier: cleanTarget,
        channel,
      });

      if (res.ok && res.data?.success) {
        start(60);
        setStep(2);
        setEnteredOtp(['', '', '', '', '', '']);
        if (res.data?.waMeUrl) {
          setWaUrl(res.data.waMeUrl);
        }
        showToast(`Verification code generated for WhatsApp: ${cleanTarget}`, 'success');
      } else {
        showToast(res.data?.message || 'Failed to dispatch verification code. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Error requesting OTP: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resend = () => {
    sendOtp();
  };

  // OTP input change handler (digit boxes)
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste of 6 digits
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...enteredOtp];
      pasted.forEach((char, idx) => {
        if (idx < 6) newOtp[idx] = char;
      });
      setEnteredOtp(newOtp);
      const nextInput = document.getElementById(`otp-input-${Math.min(pasted.length, 5)}`);
      if (nextInput) nextInput.focus();
      return;
    }

    const cleanDigit = value.replace(/\D/g, '');
    const newOtp = [...enteredOtp];
    newOtp[index] = cleanDigit;
    setEnteredOtp(newOtp);

    // Auto-focus next input box
    if (cleanDigit && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !enteredOtp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Step 2: Verify OTP
  const verifyOtp = async (e) => {
    e?.preventDefault();
    const fullCode = enteredOtp.join('');
    if (fullCode.length !== 6) {
      showToast('Please enter the full 6-digit verification code', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await authApiService.verifyPasswordResetOtp({
        identifier: identifier.trim(),
        otp: fullCode,
      });

      if (res.ok && res.data?.success) {
        showToast('OTP verified successfully!', 'success');
        setStep(3);
      } else {
        showToast(res.data?.message || 'Invalid or expired verification code. Please check your email and try again.', 'error');
      }
    } catch (err) {
      showToast('Verification failed: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password & Sync Redux + MongoDB
  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match. Please re-check.', 'error');
      return;
    }

    setLoading(true);
    try {
      const cleanIdent = identifier.trim().toLowerCase();

      // If resetting via secure single-use token from email link (Section 3)
      if (resetToken) {
        const res = await authApiService.resetPasswordWithToken({
          token: resetToken,
          email: cleanIdent,
          newPassword,
        });

        if (res.ok && res.data?.success) {
          dispatch(updateUserPassword({ identifier: cleanIdent, newPassword }));
          showToast('🎉 Password reset successfully! Please sign in with your new password.', 'success');
          navigate('/login');
          return;
        } else {
          showToast(res.data?.message || 'Failed to reset password. The link may have expired.', 'error');
          return;
        }
      }

      const fullCode = enteredOtp.join('');

      // 1. Call Backend API to update MongoDB Atlas
      await authApiService.resetPasswordWithOtp({
        identifier: cleanIdent,
        otp: fullCode,
        newPassword,
      });

      // 2. Dispatch to Redux Store so runtime in-memory user list has the new password
      dispatch(updateUserPassword({ identifier: cleanIdent, newPassword }));

      // 3. Update localStorage so offline/mock fallback also stays 100% in sync
      try {
        const storedUsers = JSON.parse(localStorage.getItem('zestro_users') || '[]');
        const cleanLower = cleanIdent.toLowerCase();
        let found = false;
        const updated = storedUsers.map((u) => {
          const matchEmail = u.email?.toLowerCase() === cleanLower;
          const matchPhone = u.phone && u.phone.replace(/\D/g, '').endsWith(cleanLower.replace(/\D/g, ''));
          if (matchEmail || matchPhone) {
            found = true;
            return { ...u, password: newPassword };
          }
          return u;
        });

        if (!found) {
          updated.push({
            id: `u_${Date.now()}`,
            fullName: cleanLower.includes('@') ? cleanLower.split('@')[0] : 'Customer',
            name: cleanLower.includes('@') ? cleanLower.split('@')[0] : 'Customer',
            email: cleanLower.includes('@') ? cleanLower : `${cleanLower}@customer.zestro.com`,
            phone: cleanLower.includes('@') ? '' : cleanLower,
            password: newPassword,
            role: 'customer',
            status: 'Active',
            createdAt: new Date().toISOString(),
          });
        }
        localStorage.setItem('zestro_users', JSON.stringify(updated));
      } catch (storageErr) {
        console.warn('LocalStorage user update note:', storageErr);
      }

      showToast('🎉 Password reset successfully! Please sign in with your new password.', 'success');
      navigate('/login');
    } catch (err) {
      showToast('Failed to reset password: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card" style={{ maxWidth: 440 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 24,
              fontWeight: 900,
              color: 'var(--accent)',
              letterSpacing: '-0.5px',
            }}
          >
            <span>🍴</span>
            <span>ZESTRO</span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            Account Recovery
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="auth-header">
          <div className="auth-icon-badge">
            <Icon name="clock" size={26} color="var(--accent)" />
          </div>
          <h1>{t('forgotPassword') || 'Forgot Password?'}</h1>
          <p className="sub">
            {tokenError && 'This password reset link is invalid or has expired.'}
            {!tokenError && step === 1 && (channel === 'email'
              ? 'Enter your registered email to receive a secure password-reset link.'
              : 'Enter your registered mobile number to receive a recovery code via WhatsApp.')}
            {!tokenError && step === 2 && `Enter the 6-digit verification code sent via WhatsApp to ${identifier}.`}
            {!tokenError && step === 3 && (resetToken
              ? `Choose a new password for ${identifier || 'your account'}.`
              : 'Create a new secure password for your account.')}
          </p>
        </div>

        {/* Token Error Alert Banner */}
        {tokenError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 10, padding: 16, marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>⚠️</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f87171', marginBottom: 4 }}>Reset Link Expired or Invalid</div>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 14px' }}>{tokenError}</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setTokenError('');
                setResetToken('');
                setStep(1);
              }}
            >
              Request a New Reset Link
            </button>
          </div>
        )}

        {/* STEP 1: Single primary input (Email default) with "Try another way" option */}
        {!tokenError && step === 1 && (
          <form onSubmit={sendOtp}>
            {resetLinkSent && (
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: 10, padding: 14, marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                  <span>✉️</span> Reset Instructions Sent
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.5 }}>
                  If an account exists for <strong>{identifier}</strong>, password reset instructions will be sent.
                  Please check your inbox (and spam folder). The link expires after <strong>15 minutes</strong>.
                </p>
              </div>
            )}

            {channel === 'email' ? (
              <div className="input-group">
                <label htmlFor="reset-email">{t('email') || 'Email Address'}</label>
                <div className="input-with-icon">
                  <span className="input-prefix-icon">
                    <Icon name="mail" size={16} />
                  </span>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your registered email"
                    autoFocus
                  />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, display: 'block' }}>
                  A single-use link valid for 15 minutes will be dispatched to your inbox.
                </span>
              </div>
            ) : (
              <div className="input-group">
                <label htmlFor="reset-phone">WhatsApp Mobile Number</label>
                <div className="input-with-icon">
                  <span className="input-prefix-icon" style={{ fontSize: 14 }}>
                    📱
                  </span>
                  <input
                    id="reset-phone"
                    type="tel"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 98401 23456"
                    autoFocus
                  />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, display: 'block' }}>
                  Enter your 10-digit phone number registered with WhatsApp.
                </span>
              </div>
            )}

            <button
              className="btn btn-primary btn-block btn-auth-submit"
              type="submit"
              disabled={loading}
              style={{
                marginTop: 20,
                height: 48,
                fontWeight: 700,
                fontSize: 14,
                background: channel === 'whatsapp' ? '#22c55e' : undefined,
                borderColor: channel === 'whatsapp' ? '#16a34a' : undefined,
              }}
            >
              {loading
                ? 'Processing Request...'
                : channel === 'email'
                ? (resetLinkSent ? 'Resend Reset Link' : 'Send Password Reset Link')
                : 'Send OTP via WhatsApp'}
            </button>

            {/* "Try another way" toggle */}
            <div style={{ textAlign: 'center', marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
              {channel === 'email' ? (
                <button
                  type="button"
                  onClick={() => {
                    setChannel('whatsapp');
                    setIdentifier('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#22c55e',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                  }}
                >
                  <span>💬</span>
                  <span>Try another way: Send code via WhatsApp</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setChannel('email');
                    setIdentifier('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent, #e11d48)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                  }}
                >
                  <span>✉️</span>
                  <span>Use Email instead</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* STEP 2: Enter & Verify 6-digit OTP */}
        {step === 2 && (
          <form onSubmit={verifyOtp}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 20,
                  background: channel === 'whatsapp' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(225, 29, 72, 0.15)',
                  color: channel === 'whatsapp' ? '#4ade80' : '#fb7185',
                  fontSize: 12.5,
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                <span>{channel === 'whatsapp' ? '📱 WhatsApp' : '✉️ Email'}</span>
                <span>•</span>
                <span>{identifier}</span>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
                {channel === 'whatsapp'
                  ? 'Please check your WhatsApp messages and enter the 6-digit verification code below.'
                  : 'Please check your Email inbox (and Spam folder) and enter the 6-digit code below.'}
              </p>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  borderRadius: 12,
                  padding: '12px 16px',
                  margin: '0 0 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 24 }}>📬</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted, #94a3b8)', lineHeight: 1.4 }}>
                  <span>We sent a 6-digit code to </span>
                  <strong style={{ color: 'var(--text-primary, #ffffff)' }}>{identifier}</strong>.
                  <span style={{ display: 'block', fontSize: 11.5, color: '#fb7185', marginTop: 3 }}>
                    Check your Inbox and Spam/Junk folder.
                  </span>
                </div>
              </div>

              {/* 6 Digit Box Inputs */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 10,
                  margin: '12px 0 20px',
                }}
              >
                {enteredOtp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    style={{
                      width: 44,
                      height: 52,
                      fontSize: 22,
                      fontWeight: 800,
                      textAlign: 'center',
                      borderRadius: 10,
                      border: '2px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                      background: 'var(--card-bg-2, rgba(0, 0, 0, 0.3))',
                      color: 'var(--text-primary, #ffffff)',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent, #e11d48)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.15))')}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>

            <button
              className="btn btn-primary btn-block btn-auth-submit"
              type="submit"
              disabled={loading || enteredOtp.join('').length !== 6}
              style={{ height: 46, fontWeight: 700, fontSize: 14 }}
            >
              {loading ? 'Verifying OTP...' : 'Verify OTP Code'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setStep(1)}
                style={{ fontSize: 12, color: 'var(--text-muted)' }}
              >
                ← Change Email / Number
              </button>

              <div className="auth-switch" style={{ margin: 0 }}>
                {isActive ? (
                  <span style={{ fontSize: 12 }}>
                    Resend in <strong>{formatted}</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={resend}
                    style={{ fontSize: 12 }}
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {/* STEP 3: Create New Password */}
        {step === 3 && (
          <form onSubmit={resetPassword}>
            <div className="input-group">
              <label htmlFor="reset-new-pw">New Password</label>
              <div className="input-with-icon">
                <span className="input-prefix-icon">
                  <Icon name="clock" size={16} />
                </span>
                <input
                  id="reset-new-pw"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  autoFocus
                />
                <button
                  type="button"
                  className="pw-toggle-btn"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPw ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
            </div>

            <div className="input-group" style={{ marginTop: 14 }}>
              <label htmlFor="reset-confirm-pw">Confirm New Password</label>
              <div className="input-with-icon">
                <span className="input-prefix-icon">
                  <Icon name="clock" size={16} />
                </span>
                <input
                  id="reset-confirm-pw"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  minLength={6}
                />
              </div>
            </div>

            <button
              className="btn btn-primary btn-block btn-auth-submit"
              type="submit"
              disabled={loading}
              style={{ marginTop: 20, height: 48, fontWeight: 700, fontSize: 14 }}
            >
              {loading ? 'Updating Password...' : 'Save Password & Sign In'}
            </button>
          </form>
        )}

        {/* Return to Sign in link */}
        <p className="auth-switch" style={{ marginTop: 22, textAlign: 'center' }}>
          Remembered your password? <Link to="/login">{t('signIn') || 'Sign In'}</Link>
        </p>
      </div>
    </div>
  );
}
