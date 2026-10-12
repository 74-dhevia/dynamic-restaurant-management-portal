import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { chefLogin, clearErrors, setProcessing } from '../redux/slices/authSlice';
import { useToast } from '../contexts/ToastContext';
import Icon from '../components/Icon';

export default function ChefLogin() {
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

  // Always reset fields on load/unmount
  useEffect(() => {
    setEmail('');
    setPassword('');
    setValidationError('');
    dispatch(clearErrors());
  }, [dispatch, location.key]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'chef') {
      navigate('/chef/dashboard', { replace: true });
    } else if (isAuthenticated && currentUser?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearErrors());

    if (!email.trim() || !password) {
      setValidationError('Please enter your chef email and kitchen password.');
      return;
    }

    setValidationError('');
    dispatch(setProcessing(true));

    dispatch(chefLogin({ email: email.trim(), password }));
  };

  const handleQuickFill = (chefEmail, chefPw) => {
    setEmail(chefEmail);
    setPassword(chefPw);
    setValidationError('');
    dispatch(clearErrors());
    showToast(`Loaded credentials for ${chefEmail}`, 'info');
  };

  return (
    <div className="auth-page chef-auth-page">
      <div className="card auth-split-card chef-split-card">
        {/* Left Side: Kitchen Station & Culinary Control Visual */}
        <div className="auth-split-visual chef-split-visual">
          <div className="auth-visual-top">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div className="auth-visual-badge chef-visual-badge">
                <Icon name="chef" size={14} color="#f72585" />
                <span>ZESTRO CULINARY COMMAND • KDS</span>
              </div>
            </Link>
            <h2 className="auth-visual-title">
              Precision Kitchen <span>Operations &amp; Dispatch.</span>
            </h2>
            <p className="auth-visual-sub">
              Dedicated terminal for kitchen masters, head chefs, and station artisans. Monitor live tickets, coordinate food prep lines, and file instant operational alerts.
            </p>

            <div className="auth-visual-features">
              <div className="auth-visual-feature">
                <span className="auth-feature-icon">🍳</span>
                <div>
                  <strong>Live Kitchen Display System (KDS)</strong>
                  <p>Real-time order tickets categorized by Confirmed, Preparing, and Ready</p>
                </div>
              </div>
              <div className="auth-visual-feature">
                <span className="auth-feature-icon">⏱️</span>
                <div>
                  <strong>Food Preparation Summaries</strong>
                  <p>Consolidated dish counts and portion queues for peak service hours</p>
                </div>
              </div>
              <div className="auth-visual-feature">
                <span className="auth-feature-icon">🚨</span>
                <div>
                  <strong>Instant Incident Reporting</strong>
                  <p>Direct priority line to Admin console for safety, equipment, and stock alerts</p>
                </div>
              </div>
              <div className="auth-visual-feature">
                <span className="auth-feature-icon">🔒</span>
                <div>
                  <strong>Role Isolation Protocol</strong>
                  <p>Focused strictly on kitchen logistics; customer billing is secured</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-visual-testimonial chef-visual-notice">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Icon name="flame" size={16} color="#f72585" />
              <strong style={{ fontSize: 13, color: '#f72585' }}>Kitchen Personnel Portal</strong>
            </div>
            <p className="auth-testimonial-text" style={{ fontSize: 12, opacity: 0.85, fontStyle: 'normal' }}>
              Designed for live tablet/touchscreen kitchen displays with rapid status toggles and zero distraction.
            </p>
          </div>
        </div>

        {/* Right Side: Chef Sign In Form */}
        <div className="auth-split-form chef-split-form">
          <div className="auth-form-header">
            <div className="auth-mini-brand chef-brand-tag">
              <div className="auth-icon-badge chef-badge-mini">
                <Icon name="chef" size={20} color="#ffffff" />
              </div>
              <span>ZESTRO CHEF</span>
            </div>
            <h1>Kitchen Terminal Sign In</h1>
            <p className="sub">Enter your culinary artisan credentials to access your station dashboard</p>
          </div>

          {/* Quick-Select Demo Chefs for Evaluator Convenience */}
          <div className="chef-quick-select-card">
            <div className="quick-select-header">
              <Icon name="sparkles" size={13} color="var(--accent)" />
              <span>Quick Demo Station Selection:</span>
            </div>
            <div className="quick-chef-chips">
              <button
                type="button"
                className="btn-quick-chef"
                onClick={() => handleQuickFill('murugesan.chef@zestro.com', 'Chef@123')}
              >
                <span>Murugesan P.</span>
                <small>Dindigul Thalappakatti</small>
              </button>
              <button
                type="button"
                className="btn-quick-chef"
                onClick={() => handleQuickFill('meenakshi.chef@zestro.com', 'Chef@123')}
              >
                <span>S. Meenakshi</span>
                <small>A2B Bhavan</small>
              </button>
              <button
                type="button"
                className="btn-quick-chef"
                onClick={() => handleQuickFill('arulmozhi.chef@zestro.com', 'Chef@123')}
              >
                <span>Arulmozhi N.</span>
                <small>Sree Annapoorna</small>
              </button>
              <button
                type="button"
                className="btn-quick-chef"
                onClick={() => handleQuickFill('david.chef@zestro.com', 'Chef@123')}
              >
                <span>David Raj</span>
                <small>Junior Kuppanna</small>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate autoComplete="off">
            {/* Decoy inputs */}
            <input type="text" name="decoy_chef_user" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="off" />
            <input type="password" name="decoy_chef_pass" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="off" />

            <div className="input-group">
              <label htmlFor="chef-email">Chef Email Address</label>
              <div className="input-with-icon">
                <span className="input-prefix-icon"><Icon name="mail" size={17} /></span>
                <input
                  id="chef-email"
                  name="zestro_chef_email_field"
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); setValidationError(''); }}
                  placeholder="e.g. murugesan.chef@zestro.com"
                  disabled={isProcessing}
                  autoComplete="off"
                  data-lpignore="true"
                />
              </div>
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label htmlFor="chef-password" style={{ margin: 0 }}>Kitchen Password</label>
                <Link to="/forgot-password" className="auth-link-forgot" style={{ fontSize: 12.5, color: 'var(--accent)' }}>
                  Forgot Password?
                </Link>
              </div>
              <div className="input-with-icon">
                <span className="input-prefix-icon"><Icon name="shield" size={17} /></span>
                <input
                  id="chef-password"
                  name="zestro_chef_password_field"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => { setPassword(e.target.value); setValidationError(''); }}
                  placeholder="Enter kitchen access password"
                  disabled={isProcessing}
                  autoComplete="new-password"
                  data-lpignore="true"
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
                <span>Keep kitchen station session active</span>
              </label>
            </div>

            {(validationError || error) && (
              <div className="auth-error-banner" role="alert">
                <Icon name="close" size={16} color="var(--danger)" />
                <span>{validationError || error}</span>
              </div>
            )}

            <button
              id="btn-chef-submit"
              className="btn btn-primary btn-block btn-auth-submit chef-btn"
              type="submit"
              disabled={isProcessing}
              style={{ marginTop: 8 }}
            >
              {isProcessing ? (
                <span className="btn-loading-content">
                  <span className="spinner-dot" />
                  <span>Verifying Kitchen Credentials...</span>
                </span>
              ) : (
                <span>Access Kitchen Station Terminal</span>
              )}
            </button>
          </form>

          <div className="auth-footer-admin" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <Link to="/login" className="admin-portal-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
              <Icon name="back" size={14} />
              <span>Customer Portal</span>
            </Link>
            <Link to="/admin/login" className="admin-portal-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
              <Icon name="admin" size={14} />
              <span>Admin Console</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
