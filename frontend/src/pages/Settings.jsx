import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { LANGUAGES, PROFILE_AVATARS } from '../contexts/translations';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { setAvatar } from '../redux/slices/authSlice';
import authApiService from '../services/authApiService';

const FONT_FAMILIES = ['System Default', 'Inter', 'Poppins', 'Roboto', 'Open Sans', 'Georgia'];

export default function Settings() {
  const {
    theme, setTheme, toggleTheme, isDark, mood, setMood, fontSize, setFontSize, fontFamily, setFontFamily,
    highContrast, setHighContrast, reducedMotion, setReducedMotion, moodOptions, moodThemes,
  } = useTheme();
  const { lang, changeLang, t } = useLanguage();
  const { showToast } = useToast();
  const dispatch = useDispatch();

  const currentUser = useSelector(s => s.auth.currentUser);
  const guestAvatar = useSelector(s => s.auth.guestAvatar) || '👤';
  const isAuthenticated = useSelector(s => s.auth.isAuthenticated);

  const currentAvatar = currentUser?.avatar || guestAvatar;

  // Section 10: Backend Persisted Customer Email Preferences (Defaults strictly to OFF)
  const [emailPrefs, setEmailPrefs] = useState({
    promotions: false,
    nonEssentialUpdates: false,
  });
  const [savingEmailPrefs, setSavingEmailPrefs] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      authApiService.getEmailPreferences().then((res) => {
        if (res.ok && res.data?.emailPreferences) {
          setEmailPrefs({
            promotions: Boolean(res.data.emailPreferences.promotions),
            nonEssentialUpdates: Boolean(res.data.emailPreferences.nonEssentialUpdates),
          });
        }
      }).catch((err) => {
        console.warn('Could not fetch email preferences:', err.message);
      });
    }
  }, [isAuthenticated]);

  const handleToggleEmailPref = async (key, value) => {
    const updated = { ...emailPrefs, [key]: value };
    setEmailPrefs(updated);

    if (isAuthenticated) {
      setSavingEmailPrefs(true);
      try {
        const res = await authApiService.updateEmailPreferences(updated);
        if (res.ok) {
          showToast(`Email preference updated: ${key === 'promotions' ? 'Promotional emails' : 'Optional updates'} ${value ? 'enabled' : 'disabled'}`, 'success');
        } else {
          showToast('Failed to save email preference to backend', 'error');
        }
      } catch (err) {
        showToast('Error saving preference: ' + err.message, 'error');
      } finally {
        setSavingEmailPrefs(false);
      }
    } else {
      showToast('Please sign in to save email preferences', 'info');
    }
  };

  const [notifPrefs, setNotifPrefs] = useLocalStorage('zestro_notifPrefs', {
    orders: true, offers: true, birthday: true, booking: true, refund: true, rewards: true,
  });

  const handleLanguageChange = (code, label) => {
    changeLang(code);
    const feedback = {
      en: `Language updated to ${label}`,
      ta: `மொழி மாற்றப்பட்டது: ${label}`,
      hi: `भाषा बदली गई: ${label}`,
      fr: `Langue changée en : ${label}`,
      es: `Idioma cambiado a: ${label}`,
    };
    showToast(feedback[code] || `${t('languageUpdated')} ${label}`, 'success');
  };

  const handleAvatarSelect = (icon) => {
    dispatch(setAvatar(icon));
    showToast(t('avatarUpdated'), 'success');
  };

  const notificationLabels = {
    orders: t('notifOrders'),
    offers: t('notifOffers'),
    birthday: t('notifBirthday'),
    booking: t('notifBooking'),
    refund: t('notifRefund'),
    rewards: t('notifRewards'),
  };

  const fontSizeLabels = {
    small: t('small'),
    medium: t('medium'),
    large: t('large'),
    'extra-large': t('extraLarge'),
  };

  const handleThemeModeChange = (modeValue) => {
    setTheme(modeValue);
    const modeName = modeValue === 'light' ? t('lightMode') : modeValue === 'dark' ? t('darkMode') : t('systemMode');
    showToast(`${t('modeUpdated')} ${modeName}`, 'info');
  };

  const handlePaletteChange = (paletteKey, paletteName) => {
    setMood(paletteKey);
    showToast(`${t('themeUpdated')} ${paletteName}`, 'success');
  };

  const modeCards = [
    {
      id: 'light',
      title: t('lightMode') || 'Light Mode',
      desc: t('modeLightDesc') || 'Crisp & bright daylight aesthetic',
      icon: '☀️',
      badge: 'Daylight',
    },
    {
      id: 'dark',
      title: t('darkMode') || 'Dark Mode',
      desc: t('modeDarkDesc') || 'Easy on the eyes, deep midnight aesthetic',
      icon: '🌙',
      badge: 'Midnight',
    },
    {
      id: 'system',
      title: t('systemMode') || 'System Auto',
      desc: t('modeSystemDesc') || 'Automatically syncs with your device setting',
      icon: '💻',
      badge: 'Auto Sync',
    },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '0 4px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          ⚙️ {t('settingsTitle')}
        </h1>
        <span className="location-pill" style={{ fontSize: 12 }}>
          {LANGUAGES.find(l => l.code === lang)?.flag} {LANGUAGES.find(l => l.code === lang)?.label}
        </span>
      </div>

      {/* Profile & Avatar Card */}
      <div className="settings-profile-card">
        <div className="settings-profile-top">
          <div className="profile-avatar-circle" title={t('profileIcon')} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentAvatar && currentAvatar.startsWith('http') ? (
              <img src={currentAvatar} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 32 }}>{currentAvatar || '👤'}</span>
            )}
          </div>
          <div className="settings-profile-info">
            <h3 className="settings-profile-name">
              {isAuthenticated ? (currentUser?.fullName || 'User') : t('guestUser')}
              <span className="settings-profile-role">
                {isAuthenticated ? (currentUser?.role || 'Member') : 'Guest'}
              </span>
            </h3>
            <p className="settings-profile-sub">
              {isAuthenticated
                ? (currentUser?.email || currentUser?.phone || 'Verified Customer')
                : t('guestSubtitle')}
            </p>
          </div>
          <div className="settings-profile-actions">
            {isAuthenticated ? (
              <Link to="/profile" className="btn btn-secondary btn-sm">
                👤 {t('viewProfile')}
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">
                🔑 {t('loginNow')}
              </Link>
            )}
          </div>
        </div>

        {/* Profile Avatar Icon Selector */}
        <div className="avatar-picker-wrap">
          <div className="avatar-picker-label">
            <span>✨</span> {t('chooseAvatar')} ({t('profileIcon')})
          </div>
          <div className="avatar-grid">
            {PROFILE_AVATARS.map(av => (
              <button
                key={av.icon}
                type="button"
                className={`avatar-btn ${currentAvatar === av.icon ? 'active' : ''}`}
                title={av.label}
                onClick={() => handleAvatarSelect(av.icon)}
              >
                {av.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appearance: Theme & Display Mode Section */}
      <SettingBlock title={`🎨 ${t('appearance') || 'Appearance & Display'}`}>
        <div className="appearance-section">
          {/* 1. Display Mode (Dark, Light, System) */}
          <div>
            <div className="appearance-subheading">
              <span>🌗</span> {t('displayMode')} ({t('lightMode')} / {t('darkMode')})
            </div>
            <div className="mode-card-grid">
              {modeCards.map(m => (
                <div
                  key={m.id}
                  className={`mode-card ${theme === m.id ? 'active' : ''}`}
                  onClick={() => handleThemeModeChange(m.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleThemeModeChange(m.id)}
                >
                  <div className="mode-card-top">
                    <div className="mode-card-icon">{m.icon}</div>
                    {theme === m.id ? (
                      <span className="mode-card-badge">✓ Active</span>
                    ) : (
                      <span className="muted" style={{ fontSize: 11 }}>{m.badge}</span>
                    )}
                  </div>
                  <h4 className="mode-card-title">{m.title}</h4>
                  <p className="mode-card-desc">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Theme Color Palettes */}
          <div>
            <div className="appearance-subheading">
              <span>✨</span> {t('themeColor')} ({t('themePalettes')})
            </div>
            <div className="palette-grid">
              {Object.values(moodThemes || {}).map(p => {
                const isSelected = mood === p.id;
                return (
                  <div
                    key={p.id}
                    className={`palette-card ${isSelected ? 'active' : ''}`}
                    onClick={() => handlePaletteChange(p.id, p.name)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handlePaletteChange(p.id, p.name)}
                    title={p.desc}
                  >
                    <div className="palette-swatches">
                      <span className="palette-swatch-1" style={{ background: p.accent }} />
                      <span className="palette-swatch-2" style={{ background: p.accent2 }} />
                    </div>
                    <div className="palette-info">
                      <div className="palette-name">
                        <span style={{ marginRight: 4 }}>{p.icon}</span> {p.name}
                      </div>
                      <div className="palette-desc">{p.desc}</div>
                    </div>
                    {isSelected && <span className="palette-check">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Real-time Live Preview Box */}
          <div className="live-preview-box">
            <div className="live-preview-header">
              <div className="live-preview-header-title">
                <span>👁️</span> {t('livePreview')}
              </div>
              <div className="live-preview-tags">
                <span className="mode-card-badge">
                  {theme === 'dark' ? '🌙 Dark Mode' : theme === 'light' ? '☀️ Light Mode' : '💻 System Auto'}
                </span>
                <span className="mode-card-badge">
                  {moodThemes?.[mood]?.icon} {moodThemes?.[mood]?.name || mood}
                </span>
              </div>
            </div>
            <div className="live-preview-content">
              <div className="live-preview-mock-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Chef's Recommendation
                  </span>
                  <span className="rating-chip">4.9 ★</span>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 16 }}>Royal Tandoori Platter</h4>
                  <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                    {t('livePreviewDesc')}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <span className="price" style={{ fontSize: 18 }}>₹349</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '6px 10px' }}>
                      {t('bookTable')}
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>
                      {t('addToCart')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SettingBlock>

      {/* Language Section - Instant Dynamic Switch */}
      <SettingBlock title={`🌐 ${t('language')}`}>
        <div className="chip-row">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              type="button"
              className={`chip ${lang === l.code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(l.code, l.label)}
            >
              <span style={{ marginRight: 6 }}>{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      </SettingBlock>

      {/* Font Size */}
      <SettingBlock title={`🔤 ${t('fontSize')}`}>
        <div className="chip-row">
          {['small', 'medium', 'large', 'extra-large'].map(v => (
            <button
              key={v}
              type="button"
              className={`chip ${fontSize === v ? 'active' : ''}`}
              onClick={() => setFontSize(v)}
            >
              {fontSizeLabels[v] || v}
            </button>
          ))}
        </div>
      </SettingBlock>

      {/* Font Family */}
      <SettingBlock title={`✍️ ${t('fontFamily')}`}>
        <select
          value={fontFamily}
          onChange={e => setFontFamily(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            maxWidth: 300,
            width: '100%',
          }}
        >
          {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </SettingBlock>

      {/* Accessibility */}
      <SettingBlock title={`♿ ${t('accessibility')}`}>
        <label className="settings-toggle-row">
          <span>{t('highContrast')}</span>
          <input
            type="checkbox"
            checked={highContrast}
            onChange={e => setHighContrast(e.target.checked)}
          />
        </label>
        <label className="settings-toggle-row">
          <span>{t('reducedMotion')}</span>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={e => setReducedMotion(e.target.checked)}
          />
        </label>
        <p className="muted" style={{ marginTop: 8 }}>
          {t('accessibilityDesc')}
        </p>
      </SettingBlock>

      {/* Section 10: Customer Email Preferences (Backend-Persisted) */}
      <SettingBlock title="✉️ Customer Email Preferences">
        <p className="muted" style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.5 }}>
          Manage which email communications you receive from ZESTRO. Promotional communications default to OFF unless explicitly enabled.
        </p>

        <label className="settings-toggle-row">
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>🏷️ Promotional & Marketing Emails</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Receive exclusive vouchers, festival discounts, and special dining offers
            </div>
          </div>
          <input
            type="checkbox"
            checked={emailPrefs.promotions}
            disabled={savingEmailPrefs}
            onChange={(e) => handleToggleEmailPref('promotions', e.target.checked)}
          />
        </label>

        <label className="settings-toggle-row">
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>✨ Optional Non-Essential Updates</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Chef culinary highlights, new seasonal menu announcements, and dining recommendations
            </div>
          </div>
          <input
            type="checkbox"
            checked={emailPrefs.nonEssentialUpdates}
            disabled={savingEmailPrefs}
            onChange={(e) => handleToggleEmailPref('nonEssentialUpdates', e.target.checked)}
          />
        </label>

        {/* Transactional Emails Mandatory Notice */}
        <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 10, padding: 14, marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#60a5fa', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
            <span>🔒</span> Essential Transactional Emails (Always Active)
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
            To safeguard your account and provide core dining services, transactional emails — including order updates, table reservation PINs, and security alerts — are always dispatched when corresponding events occur.
          </p>
        </div>
      </SettingBlock>

      {/* Notification Preferences */}
      <SettingBlock title={`🔔 ${t('notificationPrefs')}`}>
        {Object.keys(notifPrefs).map(key => (
          <label key={key} className="settings-toggle-row">
            <span>{notificationLabels[key] || key}</span>
            <input
              type="checkbox"
              checked={notifPrefs[key]}
              onChange={e => setNotifPrefs({ ...notifPrefs, [key]: e.target.checked })}
            />
          </label>
        ))}
      </SettingBlock>
    </div>
  );
}

function SettingBlock({ title, children }) {
  return (
    <div className="card section" style={{ padding: 20 }}>
      <h3 style={{ marginTop: 0, marginBottom: 14 }}>{title}</h3>
      {children}
    </div>
  );
}
