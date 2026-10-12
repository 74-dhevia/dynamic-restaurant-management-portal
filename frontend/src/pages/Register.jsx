import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { register, loginWithGoogle, clearErrors, setProcessing } from '../redux/slices/authSlice';
import { addNotification } from '../redux/slices/notificationSlice';
import authApiService from '../services/authApiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import Icon from '../components/Icon';
import { initializeGoogleSignIn, promptGoogleSignIn, getGoogleClientId } from '../services/googleAuthService';

export default function Register() {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const error = useSelector(s => s.auth.registerError);
  const isAuthenticated = useSelector(s => s.auth.isAuthenticated);
  const currentUser = useSelector(s => s.auth.currentUser);
  const isProcessing = useSelector(s => s.auth.isProcessing);
  const users = useSelector(s => s.auth?.users || []);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  // Redirect destination if user was attempting to visit a protected route
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.email) {
        authApiService.sendWelcomeEmail({
          email: currentUser.email,
          name: currentUser.fullName || currentUser.name || 'Member',
          role: currentUser.role || 'customer',
          provider: currentUser.provider || 'email',
        });
      }

      const role = currentUser.role;
      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'chef') {
        navigate('/chef/dashboard', { replace: true });
      } else if (role === 'restaurantManager' || role === 'owner') {
        navigate('/owner/dashboard', { replace: true });
      } else {
        const dest = (from === '/login' || from === '/register' || from.startsWith('/admin')) ? '/' : from;
        navigate(dest, { replace: true });
      }
    }
  }, [isAuthenticated, currentUser, navigate, from]);

  // Initialize real Google Identity Services if client ID exists
  useEffect(() => {
    const clientId = getGoogleClientId();
    if (clientId) {
      initializeGoogleSignIn(
        (googleUser) => {
          dispatch(loginWithGoogle(googleUser));
          showToast(t('googleAuthSuccess') || 'Successfully registered with Google!', 'success');
        },
        (errMsg) => {
          dispatch(setProcessing(false));
          showToast(errMsg || t('googleAuthFailed'), 'error');
        }
      );
    }
  }, [dispatch, showToast, t]);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setValidationError('');
  };

  const validateForm = () => {
    if (!form.fullName.trim()) {
      return t('fieldRequired') || 'Please enter your full name';
    }
    if (!form.email.trim()) {
      return t('fieldRequired') || 'Please enter your email address';
    }

    const trimmedEmail = form.email.trim().toLowerCase();

    // 1. Strict RFC email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return 'Please enter a valid email address (e.g. name@gmail.com).';
    }

    // 2. Validate real domain and reject disposable / dummy emails
    const parts = trimmedEmail.split('@');
    if (parts.length !== 2) return 'Please enter a valid email address.';
    const [userPart, domainPart] = parts;
    if (userPart.length < 2) return 'Email username must be at least 2 characters.';
    if (!domainPart.includes('.')) return 'Please provide a valid domain with an extension (e.g. gmail.com).';
    const domainParts = domainPart.split('.');
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) return 'Email domain extension must be at least 2 characters.';

    const fakeDomains = [
      'fake.com', 'test.com', 'example.com', 'tempmail.com', 'mailinator.com',
      'throwaway.com', 'asdf.com', 'dummy.com', 'trashmail.com', 'guerrillamail.com',
      'sharklasers.com', '10minutemail.com', 'fakeemail.com', 'sample.com', 'foo.com', 'bar.com'
    ];
    if (fakeDomains.includes(domainPart)) {
      return 'Please enter a real, active email address. Disposable, test or fake domains are not allowed.';
    }

    // 3. Strict unique email: One email ID per user!
    const alreadyExists = users.some(u => (u.email || '').toLowerCase() === trimmedEmail);
    if (alreadyExists) {
      return 'An account already exists with this email address. Multiple users cannot register with the same email ID.';
    }

    if (!form.phone.trim()) {
      return t('fieldRequired') || 'Please enter your phone number';
    }
    if (!form.password) {
      return t('fieldRequired') || 'Please create a password';
    }
    if (form.password.length < 6) {
      return t('passwordTooShort') || 'Password must be at least 6 characters long';
    }
    if (form.password !== form.confirmPassword) {
      return t('passwordMismatch') || 'Passwords do not match';
    }
    if (!agreeTerms) {
      return t('termsRequired') || 'Please agree to the Terms & Conditions to continue';
    }
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearErrors());
    const err = validateForm();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError('');
    const trimmedEmail = form.email.trim().toLowerCase();
    dispatch(setProcessing(true));
    dispatch(register({
      fullName: form.fullName.trim(),
      email: trimmedEmail,
      phone: form.phone.trim(),
      password: form.password,
    }));
    dispatch(addNotification({
      type: 'email',
      title: '📧 Welcome to ZESTRO — Verification Email Sent',
      message: `A verification & welcome notification has been dispatched to your email address: ${trimmedEmail}. Your account is activated!`,
      timestamp: new Date().toISOString(),
    }));
    showToast(`📧 Verification & welcome notification sent to ${trimmedEmail}!`, 'success');
  };

  const handleGoogleClick = async () => {
    dispatch(clearErrors());
    setValidationError('');

    const clientId = getGoogleClientId();
    if (!clientId) {
      setGoogleModalOpen(true);
      return;
    }

    dispatch(setProcessing(true));
    const result = await promptGoogleSignIn(
      (googleUser) => {
        dispatch(loginWithGoogle(googleUser));
        showToast(t('googleAuthSuccess') || 'Registered with Google!', 'success');
      },
      (err) => {
        dispatch(setProcessing(false));
        showToast(err || t('googleAuthFailed'), 'error');
      }
    );

    if (!result.configured) {
      setGoogleModalOpen(true);
      dispatch(setProcessing(false));
    }
  };

  const handleSimulateGoogleLogin = () => {
    setGoogleModalOpen(false);
    dispatch(setProcessing(true));
    setTimeout(() => {
      dispatch(loginWithGoogle({
        id: `google_new_${Date.now()}`,
        email: 'google.foodie@gmail.com',
        fullName: 'Google Dining Member',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      }));
      dispatch(setProcessing(false));
      showToast('Account created and verified via Google OAuth!', 'success');
    }, 700);
  };

  return (
    <div className="auth-page">
      <div className="card auth-split-card">
        {/* Left Side: Brand Visual Showcase */}
        <div className="auth-split-visual">
          <div className="auth-visual-top">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div className="auth-visual-badge">
                <Icon name="sparkles" size={14} color="var(--accent)" />
                <span>JOIN ZESTRO DINING CLUB</span>
              </div>
            </Link>
            <h2 className="auth-visual-title">
              Unlock a world of <span>exceptional dining.</span>
            </h2>
            <p className="auth-visual-sub">
              Create your account to save favorite eateries, enjoy one-click reordering, reserve tables, and earn 100 bonus DinePoints!
            </p>

            <div className="auth-visual-features">
              <div className="auth-visual-feature">
                <span className="auth-feature-icon">✨</span>
                <div>
                  <strong>100 Free Welcome DinePoints</strong>
                  <p>Instantly redeemable for order discounts</p>
                </div>
              </div>
              <div className="auth-visual-feature">
                <span className="auth-feature-icon">🍷</span>
                <div>
                  <strong>Personalized Dining Experiences</strong>
                  <p>Tailor occasions, custom setups, and chef recommendations</p>
                </div>
              </div>
              <div className="auth-visual-feature">
                <span className="auth-feature-icon">⚡</span>
                <div>
                  <strong>Live Tracking & Instant E-Bills</strong>
                  <p>Track delivery and view digital receipts anytime</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-visual-testimonial">
            <div className="auth-testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p className="auth-testimonial-text">
              "Signing up took 30 seconds, and the welcome bonus points gave me an instant discount on dinner!"
            </p>
            <span className="auth-testimonial-author">Ananya P. — Platinum Member</span>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="auth-split-form">
          <div className="auth-form-header">
            <div className="auth-mini-brand">
              <Icon name="restaurant" size={20} color="var(--accent)" />
              <span>ZESTRO</span>
            </div>
            <h1>{t('createAccount') || 'Create Account'}</h1>
            <p className="sub">{t('signUpSubtitle') || 'Sign up to start ordering and reserving tables'}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate autoComplete="off">
            {/* Decoy inputs to capture browser autofill */}
            <input type="text" name="decoy_reg_user" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="off" />
            <input type="password" name="decoy_reg_pass" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="off" />

            <div className="input-group">
              <label htmlFor="reg-name">{t('fullName')}</label>
              <div className="input-with-icon">
                <span className="input-prefix-icon"><Icon name="profile" size={16} /></span>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={e => setField('fullName', e.target.value)}
                  placeholder="Enter full name"
                  disabled={isProcessing}
                  autoComplete="off"
                  data-form-type="other"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="reg-email">{t('email')}</label>
              <div className="input-with-icon">
                <span className="input-prefix-icon"><Icon name="reviews" size={16} /></span>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setField('email', e.target.value)}
                  placeholder="Enter your email address"
                  disabled={isProcessing}
                  autoComplete="off"
                  data-form-type="other"
                />
              </div>
            </div>

          <div className="input-group">
            <label htmlFor="reg-phone">{t('phone')}</label>
            <div className="input-with-icon">
              <span className="input-prefix-icon"><Icon name="delivery" size={16} /></span>
              <input
                id="reg-phone"
                type="tel"
                required
                value={form.phone}
                onChange={e => setField('phone', e.target.value)}
                placeholder="+91 98765 43210"
                disabled={isProcessing}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="reg-password">{t('password')}</label>
            <div className="input-with-icon">
              <span className="input-prefix-icon"><Icon name="clock" size={16} /></span>
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                required
                value={form.password}
                onChange={e => setField('password', e.target.value)}
                placeholder="Minimum 6 characters"
                disabled={isProcessing}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="pw-toggle-btn"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPw ? 'eye-off' : 'eye'} size={18} />
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="reg-confirm-password">{t('confirmPassword')}</label>
            <div className="input-with-icon">
              <span className="input-prefix-icon"><Icon name="check" size={16} /></span>
              <input
                id="reg-confirm-password"
                type={showConfirmPw ? 'text' : 'password'}
                required
                value={form.confirmPassword}
                onChange={e => setField('confirmPassword', e.target.value)}
                placeholder="Re-enter your password"
                disabled={isProcessing}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="pw-toggle-btn"
                onClick={() => setShowConfirmPw(v => !v)}
                aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
              >
                <Icon name={showConfirmPw ? 'eye-off' : 'eye'} size={18} />
              </button>
            </div>
          </div>

          <div className="terms-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={e => { setAgreeTerms(e.target.checked); setValidationError(''); }}
                disabled={isProcessing}
              />
              <span>{t('agreeTerms') || 'I agree to the Terms & Conditions'}</span>
            </label>
          </div>

          {(validationError || error) && (
            <div className="auth-error-banner" role="alert">
              <Icon name="close" size={16} color="var(--danger)" />
              <span>{validationError || error}</span>
            </div>
          )}

          <button
            id="btn-register-submit"
            className="btn btn-primary btn-block btn-auth-submit"
            type="submit"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="btn-loading-content">
                <span className="spinner-dot" />
                {t('creatingAccount') || 'Creating account...'}
              </span>
            ) : (
              <span>{t('createAccount') || 'Create Account'}</span>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button
          id="btn-google-register"
          type="button"
          className="btn-google"
          onClick={handleGoogleClick}
          disabled={isProcessing}
        >
          <Icon name="google" size={20} />
          <span>{t('continueWithGoogle') || 'Continue with Google'}</span>
        </button>

        <p className="auth-switch">
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login" state={{ from: location.state?.from }}>{t('signIn') || t('login')}</Link>
        </p>
      </div>
    </div>

      {googleModalOpen && (
        <div className="modal-backdrop" onClick={() => setGoogleModalOpen(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Icon name="google" size={24} />
              <h3 style={{ margin: 0 }}>Google OAuth 2.0 Integration</h3>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              To enable live Google Sign-In with real Google accounts, obtain your <strong>Client ID</strong> from Google Cloud Console and paste it into your <code>.env</code> file:
            </p>
            <div className="code-box" style={{ background: 'var(--bg)', padding: 10, borderRadius: 8, fontSize: 12, fontFamily: 'monospace', border: '1px solid var(--border)', margin: '12px 0' }}>
              VITE_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
              You can also test the Google registration flow right now:
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setGoogleModalOpen(false)}>
                Close
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSimulateGoogleLogin}>
                Test Google Registration Flow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
