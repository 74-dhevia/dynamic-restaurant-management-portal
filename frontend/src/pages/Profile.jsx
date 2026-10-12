import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, logout, setAvatar } from '../redux/slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { addNotification } from '../redux/slices/notificationSlice';
import { PROFILE_AVATARS } from '../contexts/translations';
import Icon from '../components/Icon';

export default function Profile() {
  const user = useSelector(s => s.auth?.currentUser);
  const currentAvatar = typeof user?.avatar === 'string' && user.avatar
    ? user.avatar
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

  const orders = useSelector(s => s.order?.orders || []);
  const bookings = useSelector(s => s.booking?.bookings || []);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const { theme, setTheme, mood, setMood, moodThemes } = useTheme();

  // Admin users are administrators, not food-ordering customers; redirect immediately to admin profile
  React.useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/profile', { replace: true });
    }
  }, [user?.role, navigate]);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthday, setBirthday] = useState(user?.birthday || '');

  const isBirthdayToday = useMemo(() => {
    if (!birthday) return false;
    try {
      const b = new Date(birthday);
      if (isNaN(b.getTime())) return false;
      const today = new Date();
      return b.getDate() === today.getDate() && b.getMonth() === today.getMonth();
    } catch {
      return false;
    }
  }, [birthday]);

  const analytics = useMemo(() => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeBookings = Array.isArray(bookings) ? bookings : [];
    const totalSpent = safeOrders.reduce((a, o) => a + (o?.grandTotal || 0), 0);
    const cuisineCount = {};
    safeOrders.forEach(o => {
      (o?.items || []).forEach(i => {
        if (i && i.name) {
          cuisineCount[i.name] = (cuisineCount[i.name] || 0) + (i.qty || 1);
        }
      });
    });
    const sortedDishes = Object.entries(cuisineCount).sort((a, b) => b[1] - a[1]);
    const topFood = sortedDishes[0]?.[0] || 'Ghee Podi Idli';
    return { totalOrders: safeOrders.length, totalBookings: safeBookings.length, totalSpent, topFood };
  }, [orders, bookings]);

  const save = (e) => {
    e.preventDefault();
    dispatch(updateProfile({ fullName, phone, birthday }));
    showToast('Profile updated successfully', 'success');
    if (isBirthdayToday) {
      dispatch(addNotification({ type: 'birthday', title: '🎂 Happy Birthday!', message: 'Enjoy 25% off with code BIRTHDAY25!' }));
    }
  };

  const handleAvatarChange = (avatarUrl) => {
    dispatch(setAvatar(avatarUrl));
    showToast(t('avatarUpdated'), 'success');
  };

  const handleLogout = () => {
    dispatch(logout());
    showToast('Signed out successfully', 'info');
    navigate('/', { replace: true });
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="profile" size={26} color="var(--accent)" /> {t('profile')}
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/settings" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="settings" size={16} /> {t('settings')}
          </Link>
          <button type="button" className="btn btn-danger btn-sm" onClick={handleLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="logout" size={16} color="#fff" /> {t('logout')}
          </button>
        </div>
      </div>

      {isBirthdayToday && (
        <div className="card" style={{ padding: 16, marginBottom: 16, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff', borderRadius: 'var(--radius)' }}>
          🎂 Happy Birthday, {user?.fullName}! Use code <strong>BIRTHDAY25</strong> for 25% off today.
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="card" style={{ padding: 18, marginBottom: 16, background: 'linear-gradient(135deg, rgba(232, 84, 42, 0.1), rgba(255, 183, 3, 0.1))', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <strong style={{ fontSize: 16, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="admin" size={18} /> ZESTRO Admin Control Center
            </strong>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>You have verified administrator privileges. Access live orders, floor management, and operational analytics.</div>
          </div>
          <Link to="/admin/dashboard" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <Icon name="admin" size={15} /> Open Admin Dashboard
          </Link>
        </div>
      )}

      {/* Profile Header & Avatar Card */}
      <div className="settings-profile-card">
        <div className="settings-profile-top">
          <div className="profile-avatar-circle" title={t('profileIcon')}>
            {typeof currentAvatar === 'string' && currentAvatar.startsWith('http') ? (
              <img
                src={currentAvatar}
                alt={user?.fullName || 'Avatar'}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <span>{typeof currentAvatar === 'string' ? currentAvatar : '👤'}</span>
            )}
          </div>
          <div className="settings-profile-info">
            <h3 className="settings-profile-name">
              {user?.fullName || t('guestUser')}
              <span className="settings-profile-role">{user?.role || 'Customer'}</span>
              {user?.tier && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginLeft: 8 }}>
                  • {user.tier} Tier ({user.dinePoints || 0} pts)
                </span>
              )}
            </h3>
            <p className="settings-profile-sub">{user?.email || 'Registered User'}</p>
            {user?.phone && <p className="settings-profile-sub" style={{ fontSize: 12, marginTop: 2 }}>{user.phone}</p>}
          </div>
        </div>

        <div className="avatar-picker-wrap">
          <div className="avatar-picker-label">
            <Icon name="sparkles" size={16} color="var(--accent)" /> {t('chooseAvatar')} ({t('profileIcon')})
          </div>
          <div className="avatar-grid">
            {PROFILE_AVATARS.map(av => (
              <button
                key={av.icon}
                type="button"
                className={`avatar-btn ${currentAvatar === av.icon ? 'active' : ''}`}
                title={av.label}
                onClick={() => handleAvatarChange(av.icon)}
              >
                {av.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appearance & Theme Quick Controls */}
      <div className="profile-appearance-card">
        <div className="profile-appearance-top">
          <h3 className="profile-appearance-title">
            <Icon name="sparkles" size={18} color="var(--accent)" />
            {t('quickAppearance') || 'Appearance & Theme'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="profile-mode-toggle-group">
              <button
                type="button"
                className={`profile-mode-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => { setTheme('light'); showToast(`${t('modeUpdated')} ${t('lightMode')}`, 'info'); }}
                title={t('lightMode')}
              >
                ☀️ {t('light')}
              </button>
              <button
                type="button"
                className={`profile-mode-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => { setTheme('dark'); showToast(`${t('modeUpdated')} ${t('darkMode')}`, 'info'); }}
                title={t('darkMode')}
              >
                🌙 {t('dark')}
              </button>
              <button
                type="button"
                className={`profile-mode-btn ${theme === 'system' ? 'active' : ''}`}
                onClick={() => { setTheme('system'); showToast(`${t('modeUpdated')} ${t('systemMode')}`, 'info'); }}
                title={t('systemMode')}
              >
                💻 Auto
              </button>
            </div>
            <Link to="/settings" className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: '5px 9px' }}>
              {t('settings')} →
            </Link>
          </div>
        </div>

        {/* Theme Palette Dots */}
        <div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
            {t('themeColor')} ({moodThemes?.[mood]?.name || mood})
          </div>
          <div className="profile-palette-dots">
            {Object.values(moodThemes || {}).map(p => (
              <button
                key={p.id}
                type="button"
                className={`profile-palette-dot ${mood === p.id ? 'active' : ''}`}
                style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }}
                title={`${p.name} (${p.desc})`}
                onClick={() => { setMood(p.id); showToast(`${t('themeUpdated')} ${p.name}`, 'success'); }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Link to="/orders" className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="orders" size={22} color="var(--accent)" />
          <div>
            <strong>My Orders</strong>
            <div className="muted" style={{ fontSize: 12 }}>{analytics.totalOrders} past orders</div>
          </div>
        </Link>
        <Link to="/my-bookings" className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="calendar" size={22} color="var(--accent)" />
          <div>
            <strong>My Bookings</strong>
            <div className="muted" style={{ fontSize: 12 }}>{analytics.totalBookings} reservations</div>
          </div>
        </Link>
        <Link to="/plan-dining" className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="sparkles" size={22} color="var(--accent)" />
          <div>
            <strong>Plan Dining</strong>
            <div className="muted" style={{ fontSize: 12 }}>Custom experiences</div>
          </div>
        </Link>
      </div>

      {/* Profile Details Form */}
      <form onSubmit={save} className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Personal Details</h3>
        <div className="input-group">
          <label>{t('fullName')}</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <div className="input-group">
          <label>{t('email')}</label>
          <input value={user?.email || ''} disabled style={{ opacity: 0.7 }} />
        </div>
        <div className="input-group">
          <label>{t('phone')}</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Birthday</label>
          <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" style={{ padding: 12 }}>
          {t('save')}
        </button>
      </form>

      {/* Analytics summary */}
      <div className="section stat-grid">
        <div className="card stat-card">
          <div className="num">{analytics.totalOrders}</div>
          <div className="lbl">Total Orders</div>
        </div>
        <div className="card stat-card">
          <div className="num">₹{analytics.totalSpent}</div>
          <div className="lbl">Total Spent</div>
        </div>
        <div className="card stat-card">
          <div className="num" style={{ fontSize: 15 }}>{analytics.topFood}</div>
          <div className="lbl">Most Ordered Dish</div>
        </div>
      </div>
    </div>
  );
}
