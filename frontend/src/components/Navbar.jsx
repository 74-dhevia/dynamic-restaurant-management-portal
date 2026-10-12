import React, { useState, useCallback, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { setLocation } from '../redux/slices/userSlice';
import { AREAS } from '../data/mockData';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { openAiConcierge } from './AiMoodConcierge';
import Icon from './Icon';

export default function Navbar() {
  const { t } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useSelector(s => s.user.location);
  const cartCount = useSelector(s => s.cart.items.reduce((a, i) => a + i.qty, 0));
  const unread = useSelector(s => s.notification.items.filter(n => !n.read).length);
  const currentUser = useSelector(s => s.auth.currentUser);

  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { listening, start, supported, transcript } = useSpeechRecognition();
  const lastTranscript = useRef('');

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    if (transcript && transcript !== lastTranscript.current) {
      lastTranscript.current = transcript;
      setQuery(transcript);
      navigate(`/search?q=${encodeURIComponent(transcript)}`);
    }
  }, [transcript, navigate]);

  const submitSearch = useCallback((e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }, [query, navigate]);

  const isCustomer = isAuthenticated && (!currentUser?.role || currentUser?.role === 'customer');

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <NavLink to={isCustomer ? "/customer" : "/"} className="logo">
        <Icon name="restaurant" size={22} color="var(--accent)" />
        <span>ZESTRO</span>
      </NavLink>

      {/* 18. Elegant Home Icon */}
      <NavLink
        to={isCustomer ? "/customer" : "/"}
        className="icon-btn nav-home-btn"
        title={isCustomer ? "Return to Customer Dashboard" : "Return to Home"}
        aria-label="Home"
        style={{ width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, padding: 0 }}
      >
        <Icon name="home" size={18} color="var(--text)" />
      </NavLink>

      <div className="location-pill">
        <Icon name="location" size={15} color="var(--accent)" />
        <select value={location} onChange={e => dispatch(setLocation(e.target.value))}>
          {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <form className="search-bar" onSubmit={submitSearch}>
        <Icon name="search" size={16} color="var(--text-muted)" />
        <input placeholder="Search for restaurants, cuisines or dishes..." value={query} onChange={e => setQuery(e.target.value)} />
        <button
          type="button"
          className="icon-btn"
          title={supported ? 'Voice search' : 'Voice search not supported'}
          onClick={() => supported ? start() : alert('Voice search is not supported in this browser.')}
        >
          <Icon name="mic" size={16} color={listening ? 'var(--danger)' : 'var(--text-muted)'} />
        </button>
      </form>

      <div className="nav-links">
        {/* 0. AI Voice & Mood Concierge */}
        <button
          type="button"
          className="nav-link-btn"
          onClick={() => openAiConcierge()}
          title="Open AI Voice & Mood Dining Concierge"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.18), rgba(232, 84, 42, 0.18))',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: '#fff',
            fontWeight: 700,
            boxShadow: '0 0 15px rgba(168, 85, 247, 0.25)',
          }}
        >
          <span style={{ fontSize: 15 }}>🎙️</span>
          <span>AI Concierge</span>
          <span className="nav-badge-pill" style={{ background: '#a855f7', color: '#fff', fontSize: 10, padding: '1px 6px' }}>VOICE</span>
        </button>

        {/* 1. Explore (with dropdown) */}
        <div className="nav-item-wrap">
          <NavLink
            to="/restaurants"
            className={({ isActive }) => `nav-link-btn ${isActive ? 'active' : ''}`}
            title="Explore Restaurants & Menus"
          >
            <Icon name="explore" size={16} color="var(--accent)" />
            <span>Explore</span>
            <Icon name="chevron-down" size={12} className="nav-dropdown-chevron" />
          </NavLink>

          <div className="nav-dropdown-menu">
            <NavLink to="/restaurants" className="nav-dropdown-link">
              <div className="nav-dropdown-icon">
                <Icon name="restaurant" size={17} color="var(--accent)" />
              </div>
              <div className="nav-dropdown-info">
                <strong>Restaurants</strong>
                <small>Top local dining spots</small>
              </div>
            </NavLink>

            <NavLink to="/menu" className="nav-dropdown-link">
              <div className="nav-dropdown-icon">
                <Icon name="food" size={17} color="var(--accent)" />
              </div>
              <div className="nav-dropdown-info">
                <strong>Food &amp; Dishes</strong>
                <small>Explore menus &amp; cuisines</small>
              </div>
            </NavLink>
          </div>
        </div>

        {/* 2. Our Services (with dropdown) */}
        <div className="nav-item-wrap">
          <button
            type="button"
            className="nav-link-btn"
            onClick={() => {
              if (window.location.pathname === '/') {
                const el = document.getElementById('services-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              } else {
                navigate('/book-table');
              }
            }}
            title="Our Flagship Services"
          >
            <Icon name="services" size={16} color="var(--accent)" />
            <span>Our Services</span>
            <Icon name="chevron-down" size={12} className="nav-dropdown-chevron" />
          </button>

          <div className="nav-dropdown-menu">
            <NavLink to="/book-table" className="nav-dropdown-link">
              <div className="nav-dropdown-icon">
                <Icon name="table" size={17} color="var(--accent)" />
              </div>
              <div className="nav-dropdown-info">
                <strong>3D Table Reservation</strong>
                <small>Instant PIN check-in &amp; live seating</small>
              </div>
            </NavLink>

            <div
              className="nav-dropdown-link"
              onClick={() => openAiConcierge()}
              style={{ cursor: 'pointer' }}
            >
              <div className="nav-dropdown-icon">
                <Icon name="sparkles" size={17} color="var(--accent)" />
              </div>
              <div className="nav-dropdown-info">
                <strong>AI Voice Concierge</strong>
                <small>Voice &amp; neural mood combos</small>
              </div>
            </div>

            <NavLink to="/rewards" className="nav-dropdown-link">
              <div className="nav-dropdown-icon">
                <Icon name="rewards" size={17} color="var(--accent)" />
              </div>
              <div className="nav-dropdown-info">
                <strong>Mystery Rewards</strong>
                <small>Post-dining scratch cards &amp; tokens</small>
              </div>
            </NavLink>
          </div>
        </div>

        {/* 3. Contact Us */}
        <button
          type="button"
          className="nav-link-btn nav-link-contact"
          onClick={() => {
            if (window.location.pathname === '/') {
              const el = document.getElementById('contact-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            } else {
              navigate('/');
              setTimeout(() => {
                const el = document.getElementById('contact-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 120);
            }
          }}
          title="Contact ZESTRO Support & Hotline"
          id="nav-contact-us-btn"
        >
          <Icon name="phone" size={16} color="var(--accent)" />
          <span>Contact Us</span>
          <span className="nav-badge-pill" style={{ background: '#10b981', color: '#fff' }}>24/7</span>
        </button>

        {/* 4. About Us */}
        <button
          type="button"
          className="nav-link-btn nav-link-about"
          onClick={() => {
            if (window.location.pathname === '/') {
              const el = document.getElementById('about-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            } else {
              navigate('/');
              setTimeout(() => {
                const el = document.getElementById('about-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 120);
            }
          }}
          title="About ZESTRO & Our Story"
        >
          <Icon name="about" size={16} color="var(--accent)" />
          <span>About Us</span>
        </button>
      </div>

      <div className="nav-right">
        {/* Admin Dashboard shortcut visible ONLY when Admin logs in */}
        {currentUser?.role === 'admin' && (
          <NavLink
            to="/admin/dashboard"
            className="admin-nav-pill-btn"
            title="Admin Dashboard"
            id="admin-dashboard-btn"
          >
            <Icon name="admin" size={15} color="#ffffff" />
            <span>Admin Dashboard</span>
          </NavLink>
        )}

        {/* Top customer navigation icons are hidden ONLY when Customer is logged in (accessed via Left Sidebar) */}
        {!isCustomer && (
          <NavLink to="/wishlist" className="icon-btn" title={t('wishlist')}>
            <Icon name="wishlist" size={19} />
          </NavLink>
        )}

        {!isCustomer && (
          <NavLink to="/notifications" className="icon-btn" title={t('notifications')}>
            <Icon name="notifications" size={19} />
            {unread > 0 && <span className="badge-dot">{unread}</span>}
          </NavLink>
        )}

        {!isCustomer && (
          <NavLink to="/cart" className="icon-btn" title={t('cart')}>
            <Icon name="cart" size={19} />
            {cartCount > 0 && <span className="badge-dot">{cartCount}</span>}
          </NavLink>
        )}

        <button
          type="button"
          className="nav-theme-toggle"
          title={isDark ? `${t('lightMode')} (Click to switch)` : `${t('darkMode')} (Click to switch)`}
          onClick={toggleTheme}
          aria-label="Toggle dark/light theme"
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {!isCustomer && (
          <NavLink to="/settings" className="icon-btn" title={t('settings')}>
            <Icon name="settings" size={19} />
          </NavLink>
        )}

        {/* Profile icon for Admin / Non-Customer logged in */}
        {isAuthenticated ? (
          !isCustomer && (
            <NavLink
              to={currentUser?.role === 'admin' ? '/admin/profile' : '/profile'}
              className="icon-btn profile-nav-btn"
              title={currentUser?.fullName || (currentUser?.role === 'admin' ? 'Admin Profile' : t('profile'))}
            >
              {currentUser?.avatar && currentUser.avatar.startsWith('http') ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.fullName}
                  style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <Icon name="profile" size={20} color="var(--accent)" />
              )}
            </NavLink>
          )
        ) : (
          <NavLink
            to="/login"
            className="btn btn-sm btn-primary nav-signin-btn"
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
          >
            {t('signIn') || 'Sign In'}
          </NavLink>
        )}
      </div>
    </nav>
  );
}
