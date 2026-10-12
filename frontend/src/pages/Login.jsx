import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login, loginWithGoogle, clearErrors, setProcessing } from '../redux/slices/authSlice';
import { addNotification } from '../redux/slices/notificationSlice';
import authApiService from '../services/authApiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import Icon from '../components/Icon';
import { initializeGoogleSignIn, promptGoogleSignIn, getGoogleClientId } from '../services/googleAuthService';

export default function Login() {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const error = useSelector(s => s.auth.loginError);
  const isAuthenticated = useSelector(s => s.auth.isAuthenticated);
  const currentUser = useSelector(s => s.auth.currentUser);
  const isProcessing = useSelector(s => s.auth.isProcessing);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  // Capture original intended destination
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    setEmail('');
    setPassword('');
    setShowPw(false);
    setValidationError('');
    dispatch(clearErrors());
  }, [dispatch, location.key]);

  // Automatic silent role-based redirection based on backend verified role
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const role = currentUser.role;

      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'chef') {
        navigate('/chef/dashboard', { replace: true });
      } else if (role === 'restaurantManager' || role === 'owner') {
        navigate('/owner/dashboard', { replace: true });
      } else if (role === 'deliveryPartner') {
        navigate('/delivery/dashboard', { replace: true });
      } else {
        // Default customer redirection to Customer Dashboard portal
        const destination = (
          from === '/' ||
          from === '/login' ||
          from === '/register' ||
          from.startsWith('/admin') ||
          from.startsWith('/chef') ||
          from.startsWith('/owner') ||
          from.startsWith('/delivery')
        ) ? '/customer' : from;
        navigate(destination, { replace: true });
      }
    }
  }, [isAuthenticated, currentUser, navigate, from, dispatch]);

  // Initialize real Google Identity Services if client ID exists
  useEffect(() => {
    const clientId = getGoogleClientId();
    if (clientId) {
      initializeGoogleSignIn(
        (googleUser) => {
          dispatch(loginWithGoogle(googleUser));
          showToast(t('googleAuthSuccess') || 'Successfully signed in with Google!', 'success');
        },
        (errMsg) => {
          dispatch(setProcessing(false));
          showToast(errMsg || t('googleAuthFailed'), 'error');
        }
      );
    }
  }, [dispatch, showToast, t]);

  const validateForm = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      return 'Invalid email or password. Please try again.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return 'Invalid email or password. Please try again.';
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
    dispatch(setProcessing(true));
    dispatch(login({ email: email.trim(), password }));
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
        showToast(t('googleAuthSuccess') || 'Signed in with Google!', 'success');
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
        id: `google_user_${Date.now()}`,
        email: 'google.foodie@gmail.com',
        fullName: 'Google Dining Member',
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      }));
      dispatch(setProcessing(false));
      showToast('Signed in via Google OAuth session!', 'success');
    }, 600);
  };

  return (
    <div className="auth-page">
      <div className="card auth-split-card">
        {/* Left Side: Premium Dining Showcase */}
        <div className="auth-split-visual">
          <div className="auth-visual-top">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div className="auth-visual-badge">
                <Icon name="sparkles" size={14} color="var(--accent)" />
                <span>ZESTRO FOOD PLATFORM</span>
              </div>
            </Link>
            <h2 className="auth-visual-title">
              Taste the finest dishes. <span>Reserve top tables.</span>
            </h2>
            <p className="auth-visual-sub">
              Experience the best culinary destinations, seamless doorstep delivery, and priority table reservations across the region.
            </p>

            <div className="auth-visual-features">
              <div className="auth-visual-feature">
                <span className="auth-feature-icon">🛵</span>
                <div>
                  <strong>Lightning Fast Delivery</strong>
                  <p>Hot, authentic gourmet meals delivered fresh to your doorstep</p>
                </div>
              </div>
              <div className="auth-visual-feature">
                <span className="auth-feature-icon">🪑</span>
                <div>
                  <strong>Table Reservations</strong>
                  <p>Pre-order your favorite dishes for instant dining upon arrival</p>
                </div>
              </div>
              <div className="auth-visual-feature">
                <span className="auth-feature-icon">🎁</span>
                <div>
                  <strong>DinePoints &amp; Rewards</strong>
                  <p>Earn reward points with every meal and unlock member discounts</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-visual-testimonial">
            <div className="auth-testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p className="auth-testimonial-text">
              "Zestro elevates the entire dining journey — from discovering hidden culinary gems to reserving favorite tables without waiting."
            </p>
            <span className="auth-testimonial-author">Dheiva L. — Verified Member</span>
          </div>
        </div>

        {/* Right Side: Unified Single Login Form */}
        <div className="auth-split-form">
          <div className="auth-form-header" style={{ textAlign: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <div className="auth-mini-brand" style={{ justifyContent: 'center', marginBottom: 16 }}>
                <Icon name="restaurant" size={24} color="var(--accent)" />
                <span style={{ fontSize: 24, letterSpacing: '1px' }}>ZESTRO</span>
              </div>
            </Link>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>{t('welcomeBack') || 'Welcome Back'}</h1>
            <p className="sub" style={{ maxWidth: 360, margin: '0 auto', fontSize: 14 }}>
              Sign in to continue your ZESTRO dining experience.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate autoComplete="off" style={{ width: '100%', maxWidth: 420 }}>
            <div className="input-group" style={{ marginBottom: 18 }}>
              <label htmlFor="zestro_email" style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6, display: 'block' }}>
                Email
              </label>
              <div className="input-with-icon">
                <span className="input-prefix-icon"><Icon name="mail" size={17} /></span>
                <input
                  id="zestro_email"
                  name="zestro_email"
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); setValidationError(''); }}
                  placeholder="Enter your email"
                  disabled={isProcessing}
                  autoComplete="off"
                  data-lpignore="true"
                  style={{ height: 46, fontSize: 14, borderRadius: 10 }}
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 20 }}>
              <label htmlFor="zestro_password" style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6, display: 'block' }}>
                Password
              </label>
              <div className="input-with-icon">
                <span className="input-prefix-icon"><Icon name="shield" size={17} /></span>
                <input
                  id="zestro_password"
                  name="zestro_password"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => { setPassword(e.target.value); setValidationError(''); }}
                  placeholder="Enter your password"
                  disabled={isProcessing}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  style={{ height: 46, fontSize: 14, borderRadius: 10 }}
                />
                <button
                  type="button"
                  className="pw-toggle-btn"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  title={showPw ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPw ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
            </div>

            {(validationError || error) && (
              <div className="auth-error-banner" role="alert" style={{ marginBottom: 18, borderRadius: 10 }}>
                <Icon name="close" size={16} color="var(--danger)" />
                <span>{validationError || error}</span>
              </div>
            )}

            <button
              id="btn-sign-in"
              className="btn btn-primary btn-block btn-auth-submit"
              type="submit"
              disabled={isProcessing}
              style={{
                height: 48,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.8px',
                borderRadius: 10,
                textTransform: 'uppercase',
              }}
            >
              {isProcessing ? (
                <span className="btn-loading-content">
                  <span className="spinner-dot" />
                  Signing you in...
                </span>
              ) : (
                <span>SIGN IN</span>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <Link
                to="/forgot-password"
                className="auth-link-forgot"
                style={{ fontSize: 13, textDecoration: 'none', fontWeight: 600 }}
              >
                Forgot Password?
              </Link>
            </div>
          </form>

          {/* Clean Divider */}
          <div className="auth-divider" style={{ width: '100%', maxWidth: 420, margin: '22px 0 18px' }}>
            <span>─────── or ───────</span>
          </div>

          {/* Continue with Google */}
          <button
            id="btn-google-login"
            type="button"
            className="btn-google"
            onClick={handleGoogleClick}
            disabled={isProcessing}
            style={{ width: '100%', maxWidth: 420, height: 46, borderRadius: 10, fontSize: 14 }}
          >
            <Icon name="google" size={19} />
            <span>Continue with Google</span>
          </button>

          {/* Unified Sign Up Prompt */}
          <p className="auth-switch" style={{ marginTop: 24, fontSize: 14, textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              state={{ from: location.state?.from }}
              style={{ fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      {/* Google OAuth Modal for Live Configuration or Simulation */}
      {googleModalOpen && (
        <div className="modal-backdrop" onClick={() => setGoogleModalOpen(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, padding: 24, borderRadius: 16 }}>
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
              You can also test the Google authentication flow right now:
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setGoogleModalOpen(false)}>
                Close
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSimulateGoogleLogin}>
                Test Google Sign-In Flow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
