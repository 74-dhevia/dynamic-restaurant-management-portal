import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { adminLogin, clearErrors, setProcessing } from '../redux/slices/authSlice';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import Icon from '../components/Icon';

export default function AdminLogin() {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const currentUser = useSelector(s => s.auth.currentUser);
  const isAuthenticated = useSelector(s => s.auth.isAuthenticated);
  const isProcessing = useSelector(s => s.auth.isProcessing);
  const error = useSelector(s => s.auth.loginError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Always reset fields on load and unmount so previous credentials or admin emails never linger
  useEffect(() => {
    setEmail('');
    setPassword('');
    setValidationError('');
    dispatch(clearErrors());
  }, [dispatch, location.key]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearErrors());

    if (!email.trim() || !password) {
      setValidationError('Please enter your admin email and password.');
      return;
    }

    setValidationError('');
    dispatch(setProcessing(true));

    // Admin login dispatches dedicated admin authentication
    dispatch(adminLogin({ email: email.trim(), password, remember }));
  };

  return (
    <div className="auth-page admin-auth-page">
      <div className="card auth-split-card admin-split-card">
        {/* Left Side: Enterprise Control Visual */}
        <div className="auth-split-visual admin-split-visual">
          <div className="auth-visual-top">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div className="auth-visual-badge admin-visual-badge">
                <Icon name="shield" size={14} color="#4ade80" />
                <span>ZESTRO ENTERPRISE COMMAND • HQ</span>
              </div>
            </Link>
            <h2 className="auth-visual-title">
              Unified Restaurant <span>Operations & Control.</span>
            </h2>
            <p className="auth-visual-sub">
              Centralized platform for real-time kitchen dispatching, live table inventory, financial reporting, and comprehensive staff coordination.
            </p>

            <div className="auth-visual-features">
              <div className="auth-visual-feature">
                <span className="auth-feature-icon">⚡</span>
                <div>
                  <strong>Live Multi-Branch Dispatch</strong>
                  <p>Real-time order statuses, delivery rider telemetry & instant updates</p>
                </div>
              </div>
              <div className="auth-visual-feature">
                <span className="auth-feature-icon">🪑</span>
                <div>
                  <strong>Dynamic Table Allocation</strong>
                  <p>Interactive table grid mapping, slot locks, and guest party pre-orders</p>
                </div>
              </div>
              <div className="auth-visual-feature">
                <span className="auth-feature-icon">📊</span>
                <div>
                  <strong>Ledger & Revenue Intelligence</strong>
                  <p>Real-time analytics, automated tax e-bills, and customer DinePoints ledger</p>
                </div>
              </div>
              <div className="auth-visual-feature">
                <span className="auth-feature-icon">🛡️</span>
                <div>
                  <strong>Zero-Trust Session Security</strong>
                  <p>Encrypted single-tenant admin privileges with strict role boundaries</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-visual-testimonial admin-visual-notice">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Icon name="lock" size={16} color="#4ade80" />
              <strong style={{ fontSize: 13, color: '#4ade80' }}>Authorized Personnel Only</strong>
            </div>
            <p className="auth-testimonial-text" style={{ fontSize: 12, opacity: 0.85, fontStyle: 'normal' }}>
              All administrative access, IP locations, and state mutations are securely audited. Never share your administrative master credentials.
            </p>
          </div>
        </div>

        {/* Right Side: Admin Sign In Form */}
        <div className="auth-split-form admin-split-form">
          <div className="auth-form-header">
            <div className="auth-mini-brand admin-brand-tag">
              <div className="auth-icon-badge admin-badge-mini">
                <Icon name="admin" size={20} color="#ffffff" />
              </div>
              <span>ZESTRO ADMIN</span>
            </div>
            <h1>Management Portal</h1>
            <p className="sub">Sign in with verified administrator credentials to access your console</p>
          </div>

          <form onSubmit={handleSubmit} noValidate autoComplete="off">
            {/* Decoy inputs to capture and prevent browser auto-fill of previous user credentials */}
            <input type="text" name="decoy_admin_user" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="off" />
            <input type="password" name="decoy_admin_pass" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="off" />

            <div className="input-group">
              <label htmlFor="admin-email">Admin Email Address</label>
              <div className="input-with-icon">
                <span className="input-prefix-icon"><Icon name="mail" size={17} /></span>
                <input
                  id="admin-email"
                  name="zestro_admin_email_field"
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); setValidationError(''); }}
                  placeholder="Enter admin email address"
                  disabled={isProcessing}
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label htmlFor="admin-password" style={{ margin: 0 }}>Admin Password</label>
                <Link to="/forgot-password" className="auth-link-forgot" style={{ fontSize: 12.5, color: 'var(--accent)' }}>
                  Forgot Password?
                </Link>
              </div>
              <div className="input-with-icon">
                <span className="input-prefix-icon"><Icon name="shield" size={17} /></span>
                <input
                  id="admin-password"
                  name="zestro_admin_password_field"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => { setPassword(e.target.value); setValidationError(''); }}
                  placeholder="Enter admin password"
                  disabled={isProcessing}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
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

            <div className="auth-options-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0' }}>
              <label className="checkbox-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  disabled={isProcessing}
                />
                <span>Remember this workstation session</span>
              </label>
            </div>

            {(validationError || error) && (
              <div className="auth-error-banner" role="alert">
                <Icon name="close" size={16} color="var(--danger)" />
                <span>{validationError || error}</span>
              </div>
            )}

            <button
              id="btn-admin-submit"
              className="btn btn-primary btn-block btn-auth-submit admin-btn"
              type="submit"
              disabled={isProcessing}
              style={{ marginTop: 8 }}
            >
              {isProcessing ? (
                <span className="btn-loading-content">
                  <span className="spinner-dot" />
                  <span>Verifying credentials...</span>
                </span>
              ) : (
                <span>Authenticate & Access Console</span>
              )}
            </button>
          </form>

          <div className="auth-footer-admin" style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <Link to="/login" className="admin-portal-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
              <Icon name="back" size={14} />
              <span>Customer Sign In</span>
            </Link>
            <Link to="/chef/login" className="admin-portal-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#f72585' }}>
              <Icon name="chef" size={14} color="#f72585" />
              <span>Chef Kitchen Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
