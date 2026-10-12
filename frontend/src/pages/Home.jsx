import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AREAS, RESTAURANTS, FOODS } from '../data/mockData';
import Icon from '../components/Icon';
import { setLocation } from '../redux/slices/userSlice';
import { toggleChat } from '../redux/slices/chatbotSlice';
import { useToast } from '../contexts/ToastContext';
import { useLoginModal } from '../contexts/LoginModalContext';
import { addToCart } from '../redux/slices/cartSlice';
import MysteryRewardModal from '../components/MysteryRewardModal';
import { openAiConcierge } from '../components/AiMoodConcierge';
import './Home.css';

// Flagship Platform Services (Our Services)
const ZESTRO_SERVICES = [
  {
    id: 'table-reservation',
    title: '3D Table Reservation',
    badge: 'Live Seating & PIN',
    iconName: 'table',
    tagline: 'Interactive floor layouts with instant 4-digit check-in confirmation.',
    features: ['Live 3D table maps', 'Zero queue wait time', 'Host-verified PIN entry'],
    ctaText: 'Reserve Table',
    path: '/book-table',
    accentColor: '#e8542a',
  },
  {
    id: 'ai-concierge',
    title: 'AI Voice & Mood Butler',
    badge: 'Neural Engine',
    iconName: 'sparkles',
    tagline: 'Speak or choose your vibe — instant chef combos with 20% discount & 1-click cart order.',
    features: ['Live voice recognition', '8 sensory mood pairings', 'Instant 1-click combo cart'],
    ctaText: 'Launch AI Butler',
    isAiConciergeTrigger: true,
    path: '/recommendations',
    accentColor: '#8b5cf6',
  },
  {
    id: 'digital-menu',
    title: 'Interactive Digital Menu',
    badge: 'Real-Time Sync',
    iconName: 'food',
    tagline: 'High-res visual dish cards, authentic ingredients & chef specialties.',
    features: ['Photo dish previews', 'Nutrition & macros', 'Frictionless cart ordering'],
    ctaText: 'Explore Menu',
    path: '/menu',
    accentColor: '#f59e0b',
  },
  {
    id: 'mystery-rewards',
    title: 'Mystery Dining Rewards',
    badge: 'Guaranteed Gifts',
    iconName: 'rewards',
    tagline: 'Post-dining scratch cards, cashback tokens & exclusive chef treats.',
    features: ['Scratch & win prizes', 'DinePoints token wallet', 'Weekend dining vouchers'],
    ctaText: 'Claim Rewards',
    isMysteryTrigger: true,
    accentColor: '#10b981',
  },
];

// About Us - Core Trust Pillars
const ABOUT_PILLARS = [
  {
    icon: 'shield',
    title: '100% Verified Kitchens',
    desc: 'Every restaurant is vetted for strict hygiene audits, fresh ingredients, and authentic regional taste.',
  },
  {
    icon: 'chef',
    title: 'Master Chef Heritage',
    desc: 'Celebrating legendary hometown specialties — from Kovilpatti sweets to Tirunelveli spiced curries.',
  },
  {
    icon: 'clock',
    title: 'Zero-Wait Precision',
    desc: 'Reserve in advance or pre-order so your feast is served hot and ready the moment you walk through the door.',
  },
  {
    icon: 'award',
    title: 'Direct Local Ecosystem',
    desc: 'Empowering local restaurateurs and culinary artisans with transparent zero-commission pricing.',
  },
];

// About Us - Real Impact Metrics
const ABOUT_STATS = [
  { value: '50+', label: 'Partner Restaurants', sub: 'Handpicked & Verified' },
  { value: '15,000+', label: 'Happy Diners', sub: 'Reserved & Delighted' },
  { value: '4.8 ★', label: 'Average Rating', sub: 'Across Kovilpatti & Nellai' },
  { value: '28 min', label: 'Express Delivery', sub: 'Steaming Hot to Doorstep' },
];

// "What are you in the mood for?" 6 Options
const MOOD_OPTIONS = [
  {
    id: 'comfort',
    label: 'Comfort Food',
    emoji: '🍛',
    desc: 'Traditional Meals & Sambar Rice',
    action: { path: '/menu', search: '?category=meals' },
  },
  {
    id: 'spicy',
    label: 'Spicy',
    emoji: '🔥',
    desc: 'Fiery Chettinad & Pepper Gravies',
    action: { path: '/menu', search: '?mood=spicy' },
  },
  {
    id: 'healthy',
    label: 'Healthy',
    emoji: '🥗',
    desc: 'Pure Veg & Millet Specials',
    action: { path: '/menu', search: '?category=veg' },
  },
  {
    id: 'sweet',
    label: 'Sweet',
    emoji: '🍰',
    desc: 'Tirunelveli Halwa & Desserts',
    action: { path: '/menu', search: '?category=desserts' },
  },
  {
    id: 'cafe',
    label: 'Cafe',
    emoji: '☕',
    desc: 'Degree Coffee & Evening Snacks',
    action: { path: '/menu', search: '?category=tea-coffee' },
  },
  {
    id: 'family',
    label: 'Family Dining',
    emoji: '👨‍👩‍👧',
    desc: 'Reserved Tables & Feast Menus',
    action: { path: '/book-table', search: '' },
  },
];

// Popular search suggestions shown inside hero search
const POPULAR_SEARCH_SUGGESTIONS = [
  { label: 'Biryani', emoji: '🍛', query: 'Biryani' },
  { label: 'South Indian', emoji: '🥘', query: 'South Indian' },
  { label: 'Fast Food', emoji: '🍕', query: 'Fast Food' },
  { label: 'Desserts', emoji: '🍰', query: 'Desserts' },
];

// AI Quick Prompt Suggestions
const AI_QUICK_PROMPTS = [
  'I have ₹500 for 3 people',
  'I want something spicy',
  'I want vegetarian food',
  'I want a family dinner',
];

// Authentic High-Resolution Food & Pizza Dining Images for Hero Background
const HERO_BG_IMAGES = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1920&q=80', // Delicious hot cheese pizza slice pull
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1920&q=80', // Friends happily eating pizza & food at dining table
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1920&q=80', // Fresh wood-fired artisan pizza feast
];

export default function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { openLoginToOrderModal } = useLoginModal();
  const currentUser = useSelector((s) => s.auth?.currentUser);

  const selectedLocation = useSelector((s) => s.user?.location || 'Kovilpatti');
  const [currentHeroBg, setCurrentHeroBg] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [aiCustomInput, setAiCustomInput] = useState('');
  const [showMysteryModal, setShowMysteryModal] = useState(false);

  // Contact section interactive form state
  const [contactForm, setContactForm] = useState({
    name: currentUser?.fullName || '',
    contact: currentUser?.phone || currentUser?.email || '',
    topic: 'General Inquiry',
    message: '',
  });
  const [contactSent, setContactSent] = useState(false);
  const [contactSending, setContactSending] = useState(false);

  // Rotate hero background images every 6 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroBg((prev) => (prev + 1) % HERO_BG_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const reduxRestaurants = useSelector((s) => s.restaurant?.restaurants);
  const allRestaurants = reduxRestaurants && reduxRestaurants.length > 0 ? reduxRestaurants : RESTAURANTS;

  // Filter 4-5 Featured Restaurants based on current selected location
  const featuredRestaurants = useMemo(() => {
    const locLower = (selectedLocation || 'Kovilpatti').toLowerCase();
    const matched = allRestaurants.filter(
      (r) => (r.area && r.area.toLowerCase() === locLower) ||
             (r.city && r.city.toLowerCase() === locLower) ||
             (r.address?.city && r.address.city.toLowerCase() === locLower)
    );
    return (matched.length > 0 ? matched : allRestaurants).slice(0, 4);
  }, [allRestaurants, selectedLocation]);

  // Filter 4-6 Highlight Foods (Trending Today) matching the location's restaurants
  const trendingFoods = useMemo(() => {
    const locLower = (selectedLocation || 'Kovilpatti').toLowerCase();
    const matchedRestIds = new Set(
      allRestaurants.filter(
        (r) => (r.area && r.area.toLowerCase() === locLower) ||
               (r.city && r.city.toLowerCase() === locLower) ||
               (r.address?.city && r.address.city.toLowerCase() === locLower)
      ).map((r) => r.id || r._id)
    );

    let list = FOODS.filter((f) => matchedRestIds.has(f.restaurantId));
    if (list.length === 0) {
      list = FOODS;
    }
    return list.slice(0, 6);
  }, [allRestaurants, selectedLocation]);

  // Helper to find restaurant name for food
  const getRestaurantName = (restaurantId) => {
    const r = allRestaurants.find((res) => res.id === restaurantId || res._id === restaurantId);
    return r ? r.name : 'Authentic Kitchen';
  };

  const handleLocationChange = (loc) => {
    dispatch(setLocation(loc));
    setLocationDropdownOpen(false);
    showToast(`Location set to ${loc} 📍`, 'info');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/restaurants');
    }
    setShowSearchSuggestions(false);
  };

  const handleSelectSuggestion = (query) => {
    setSearchQuery(query);
    setShowSearchSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleAiPromptClick = (promptText) => {
    setAiCustomInput(promptText);
    showToast(`AI prompt loaded: "${promptText}"`, 'info');
    dispatch(toggleChat());
  };

  const handleAskZestroSubmit = (e) => {
    e.preventDefault();
    const prompt = aiCustomInput.trim() || 'Recommend best dining spots for today';
    dispatch(toggleChat());
    showToast(`Asking ZESTRO AI: "${prompt}"`, 'info');
  };

  const scrollToServices = () => {
    const section = document.getElementById('services-section');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToExplore = () => {
    const section = document.getElementById('explore-section');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAbout = () => {
    const section = document.getElementById('about-section');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    const section = document.getElementById('contact-section');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOrderNow = (food) => {
    if (!currentUser) {
      openLoginToOrderModal({
        id: food.id,
        name: food.name,
        price: food.price,
        restaurantId: food.restaurantId,
        restaurantName: getRestaurantName(food.restaurantId),
        image: food.image,
        veg: food.veg,
      });
      showToast(`🔒 Please log in to order ${food.name}!`, 'info');
      return;
    }

    dispatch(addToCart({
      foodId: food.id,
      name: food.name,
      price: food.price,
      restaurantId: food.restaurantId,
      restaurantName: getRestaurantName(food.restaurantId),
      image: food.image,
      qty: 1,
    }));
    showToast(`🛒 ${food.name} added to your cart!`, 'success');
    navigate('/cart');
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.contact.trim() || !contactForm.message.trim()) {
      showToast('Please fill in your name, contact info, and message.', 'error');
      return;
    }
    setContactSending(true);
    setTimeout(() => {
      setContactSending(false);
      setContactSent(true);
      showToast('🎉 Message sent to ZESTRO Concierge! We will contact you soon.', 'success');
    }, 800);
  };

  return (
    <div className="zestro-platform-home light-theme-home">
      {/* =========================================================================
          SCREEN 1: HERO SECTION — MOVING FOOD ANIMATION & CENTERED ZOMATO-STYLE
          ========================================================================= */}
      <section className="zh-hero-screen" id="hero-section">
        {/* Moving Cinematic Pizza & Food Eating Background Slides */}
        <div className="zh-hero-bg-container">
          {HERO_BG_IMAGES.map((imgUrl, idx) => (
            <div
              key={imgUrl}
              className={`zh-hero-bg-slide ${idx === currentHeroBg ? 'active' : ''}`}
              style={{ backgroundImage: `url('${imgUrl}')` }}
            />
          ))}
        </div>
        <div className="zh-hero-light-overlay" />

        <div className="zh-hero-center-box">
          {/* Small Label Chip */}
          <div className="zh-hero-chip">
            <span className="zh-chip-sparkle">✦</span>
            <span className="zh-chip-text">ZESTRO DINING EXPERIENCE</span>
            <span className="zh-chip-loc">📍 {selectedLocation}</span>
          </div>

          {/* Main Headline: DISCOVER. DINE. DELIGHT. with Staggered Word Animations */}
          <h1 className="zh-hero-headline" aria-label="Discover. Dine. Delight.">
            <span className="zh-hero-word word-discover">DISCOVER.</span>
            <span className="zh-hero-word word-dine">DINE.</span>
            <span className="zh-hero-word word-delight">DELIGHT.</span>
          </h1>

          {/* Subtitle Description */}
          <p className="zh-hero-desc">
            Discover exceptional restaurants, order your favourite food, and create memorable dining experiences in {selectedLocation}.
          </p>

          {/* Centered Large Floating Search Bar */}
          <div className="zh-hero-search-shell">
            <form className="zh-hero-search-form" onSubmit={handleSearchSubmit}>
              {/* Location Picker */}
              <div
                className="zh-search-loc-btn"
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
              >
                <Icon name="location" size={18} color="#e8542a" />
                <span className="zh-search-loc-name">{selectedLocation}</span>
                <span className="zh-search-arrow">▼</span>

                {locationDropdownOpen && (
                  <div className="zh-loc-dropdown-menu">
                    {AREAS.map((a) => (
                      <div
                        key={a}
                        className={`zh-loc-item ${a === selectedLocation ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLocationChange(a);
                        }}
                      >
                        <Icon name="location" size={14} color="#e8542a" />
                        <span>{a}</span>
                        {a === selectedLocation && <span className="zh-check">✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="zh-search-divider" />

              {/* Search Field */}
              <div className="zh-search-input-wrap">
                <Icon name="search" size={18} color="#9ca3af" />
                <input
                  type="text"
                  className="zh-search-text-field"
                  placeholder="Search for restaurants, dishes or cuisines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchSuggestions(true)}
                  id="zh-main-search-input"
                  autoComplete="off"
                />
              </div>

              <button type="submit" className="zh-search-go-btn" aria-label="Explore">
                <span>Explore</span>
                <span className="zh-btn-chevron">→</span>
              </button>
            </form>

            {/* Search Suggestions Dropdown */}
            {showSearchSuggestions && (
              <div className="zh-search-suggestions-box">
                <div className="zh-sug-header">
                  <span>Popular near you in {selectedLocation}</span>
                  <button
                    type="button"
                    className="zh-sug-close-btn"
                    onClick={() => setShowSearchSuggestions(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="zh-sug-chips">
                  {POPULAR_SEARCH_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug.label}
                      type="button"
                      className="zh-sug-chip"
                      onClick={() => handleSelectSuggestion(sug.query)}
                    >
                      <span>{sug.emoji}</span>
                      <span>{sug.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="zh-hero-buttons-row">
            <button
              type="button"
              className="zh-primary-action-btn"
              onClick={() => navigate('/restaurants')}
              id="hero-btn-restaurants"
            >
              <span>Explore Restaurants</span>
              <span className="zh-action-arrow">→</span>
            </button>

            <button
              type="button"
              className="zh-secondary-action-btn"
              onClick={() => navigate('/book-table')}
              id="hero-btn-book-table"
            >
              <Icon name="table" size={17} color="#ffffff" />
              <span>Book a Table</span>
            </button>
          </div>

          {/* Real Website Quick Feature Navigation Dock */}
          <div className="zh-hero-dock">
            <button type="button" className="zh-dock-item" onClick={scrollToExplore}>
              <Icon name="explore" size={15} color="var(--accent)" />
              <span>Explore</span>
            </button>
            <button type="button" className="zh-dock-item" onClick={scrollToServices}>
              <Icon name="services" size={15} color="var(--accent)" />
              <span>Our Services</span>
            </button>
            <button type="button" className="zh-dock-item" onClick={scrollToAbout}>
              <Icon name="about" size={15} color="var(--accent)" />
              <span>About Us</span>
            </button>
            <button type="button" className="zh-dock-item" onClick={scrollToContact} id="dock-btn-contact-us">
              <Icon name="phone" size={15} color="var(--accent)" />
              <span>Contact Us</span>
            </button>
            <button type="button" className="zh-dock-item zh-dock-highlight" onClick={() => setShowMysteryModal(true)}>
              <Icon name="rewards" size={15} color="#fbbf24" />
              <span>Mystery Gift 🎁</span>
            </button>
          </div>

          {/* Scroll Down Indicator */}
          <div className="zh-hero-scroll-down" onClick={scrollToServices}>
            <span>Discover Services &amp; Food</span>
            <span className="zh-scroll-arrow-anim">︾</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SCREEN 2: OUR SERVICES — REAL WORLD SHOWCASE WITH INTERACTIVE CARDS
          ========================================================================= */}
      <section className="zh-page-section zh-services-section" id="services-section">
        <div className="zh-page-container">
          <div className="zh-section-title-wrap">
            <span className="zh-title-pill">FLAGSHIP SERVICES ✦ CORE PLATFORM</span>
            <h2 className="zh-main-heading">Our Flagship Dining Services</h2>
            <p className="zh-main-subtext">
              Revolutionizing food discovery, table reservations, and culinary rewards in {selectedLocation}
            </p>
          </div>

          <div className="zh-services-grid">
            {ZESTRO_SERVICES.map((srv) => (
              <div
                key={srv.id}
                className="zh-service-card"
                onClick={() => {
                  if (srv.isMysteryTrigger) {
                    setShowMysteryModal(true);
                  } else if (srv.isAiConciergeTrigger) {
                    openAiConcierge();
                  } else {
                    navigate(srv.path);
                  }
                }}
                id={`service-card-${srv.id}`}
              >
                <div className="zh-service-top">
                  <div className="zh-service-icon-box" style={{ background: `${srv.accentColor}18`, borderColor: `${srv.accentColor}33` }}>
                    <Icon name={srv.iconName} size={24} color={srv.accentColor} />
                  </div>
                  <span className="zh-service-badge" style={{ color: srv.accentColor, borderColor: `${srv.accentColor}44`, background: `${srv.accentColor}10` }}>
                    {srv.badge}
                  </span>
                </div>

                <h3 className="zh-service-title">{srv.title}</h3>
                <p className="zh-service-tagline">{srv.tagline}</p>

                <ul className="zh-service-features">
                  {srv.features.map((feat, idx) => (
                    <li key={idx}>
                      <span className="zh-feat-check" style={{ color: srv.accentColor }}>✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="zh-service-footer">
                  <button
                    type="button"
                    className="zh-service-cta-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (srv.isMysteryTrigger) {
                        setShowMysteryModal(true);
                      } else if (srv.isAiConciergeTrigger) {
                        openAiConcierge();
                      } else {
                        navigate(srv.path);
                      }
                    }}
                  >
                    <span>{srv.ctaText}</span>
                    <span className="zh-cta-arrow">→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SCREEN 3: EXPLORE — "WHAT ARE YOU IN THE MOOD FOR?"
          ========================================================================= */}
      <section className="zh-page-section zh-mood-section" id="explore-section">
        <div className="zh-page-container">
          <div className="zh-section-title-wrap">
            <span className="zh-title-pill">TASTE PROFILING</span>
            <h2 className="zh-main-heading">What are you in the mood for?</h2>
            <p className="zh-main-subtext">
              Choose your instant culinary vibe to discover tailored food and tables in {selectedLocation}
            </p>
          </div>

          <div className="zh-mood-grid">
            {MOOD_OPTIONS.map((mood) => {
              const conciergeMoodMap = {
                comfort: 'late-night',
                spicy: 'fiery-spice',
                healthy: 'guilt-free',
                sweet: 'sweet-therapy',
                cafe: 'rainy-crispy',
                family: 'squad-feast',
              };
              return (
                <div
                  key={mood.id}
                  className="zh-mood-card"
                  onClick={() => openAiConcierge({ mood: conciergeMoodMap[mood.id] || 'late-night' })}
                  id={`mood-${mood.id}`}
                  title="Click to curate instant chef combo with AI"
                >
                  <div className="zh-mood-emoji">{mood.emoji}</div>
                  <h4 className="zh-mood-title">{mood.label}</h4>
                  <p className="zh-mood-desc">{mood.desc}</p>
                  <span className="zh-mood-explore-btn">Curate with AI 🎙️</span>
                </div>
              );
            })}
          </div>

          {/* Standout AI Voice & Mood Butler Showcase Banner */}
          <div 
            style={{
              marginTop: 28,
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.16), rgba(232, 84, 42, 0.14))',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: 22,
              padding: '22px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
              cursor: 'pointer',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.25)',
              transition: 'all 0.25s ease',
            }}
            onClick={() => openAiConcierge()}
            id="home-ai-concierge-banner"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e8542a, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                boxShadow: '0 0 25px rgba(168, 85, 247, 0.45)'
              }}>
                🎙️
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.18rem', color: '#fff', fontWeight: 800 }}>
                  Can't decide? Ask ZESTRO AI Voice Concierge!
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Speak your craving in Tamil or English — get instant 20% bundle savings on chef-curated combos with 1-click cart checkout.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="zh-service-cta-btn"
              style={{ padding: '12px 24px', borderRadius: 999, background: 'linear-gradient(135deg, #e8542a, #a855f7)', color: '#fff', fontWeight: 800 }}
            >
              <span>Talk to AI Butler</span>
              <span className="zh-cta-arrow">🎙️</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SCREEN 4: FEATURED RESTAURANTS (4-5 Curated Cards with Clear Contrast)
          ========================================================================= */}
      <section className="zh-page-section zh-restaurants-section">
        <div className="zh-page-container">
          <div className="zh-section-header-row">
            <div>
              <span className="zh-title-pill">CURATED SPOTS</span>
              <h2 className="zh-main-heading">Featured Restaurants</h2>
              <p className="zh-main-subtext">
                Handpicked culinary destinations in {selectedLocation} celebrated for authentic flavors
              </p>
            </div>
            <Link to="/restaurants" className="zh-view-all-button" id="link-all-restaurants">
              <span>View All Restaurants</span>
              <span>→</span>
            </Link>
          </div>

          <div className="zh-restaurants-grid">
            {featuredRestaurants.map((res) => {
              const rId = res.id || res._id || res.slug;
              const rImg = (typeof res.image === 'string' ? res.image : res.image?.src) || res.heroImage || (Array.isArray(res.images) && res.images[0]) || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80';
              return (
                <div
                  key={rId}
                  className="zh-restaurant-card"
                  onClick={() => navigate(`/restaurant/${rId}`)}
                  id={`rest-card-${rId}`}
                >
                  <div className="zh-rest-image-shell">
                    <img
                      src={rImg}
                      alt={res.name || 'Restaurant'}
                      className="zh-rest-image"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="zh-rest-status">
                      <span className="zh-green-dot" />
                      <span>Open Now</span>
                    </div>
                    <div className="zh-rest-rating">
                      <span>★</span>
                      <strong>{res.rating || '4.5'}</strong>
                    </div>
                  </div>

                  <div className="zh-rest-info">
                    <div className="zh-rest-header">
                      <h3 className="zh-rest-title">{res.name || 'Restaurant'}</h3>
                      <span className="zh-rest-cost">₹{res.priceForTwo || '250'} for two</span>
                    </div>

                    <p className="zh-rest-cuisines">
                      {res.cuisine || (Array.isArray(res.cuisineType) ? res.cuisineType.join(', ') : 'Traditional South Indian & Regional Dishes')}
                    </p>

                    <div className="zh-rest-bottom">
                      <span className="zh-rest-location">📍 {res.area || res.city || selectedLocation}</span>
                      <button
                        type="button"
                        className="zh-rest-view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/restaurant/${rId}`);
                        }}
                      >
                        View Restaurant →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="zh-center-action-btn-wrap">
            <button
              type="button"
              className="zh-large-pill-btn"
              onClick={() => navigate('/restaurants')}
            >
              <span>View All Restaurants in {selectedLocation}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SCREEN 5: TRENDING TODAY (4-6 Highlight Food Items)
          ========================================================================= */}
      <section className="zh-page-section zh-food-section">
        <div className="zh-page-container">
          <div className="zh-section-header-row">
            <div>
              <span className="zh-title-pill">MOST POPULAR</span>
              <h2 className="zh-main-heading">Trending Today</h2>
              <p className="zh-main-subtext">
                The most loved signature dishes ordered by food lovers in {selectedLocation}
              </p>
            </div>
            <Link to="/menu" className="zh-view-all-button" id="link-all-menu">
              <span>Explore Full Menu</span>
              <span>→</span>
            </Link>
          </div>

          <div className="zh-foods-grid">
            {trendingFoods.map((food) => (
              <div
                key={food.id}
                className="zh-food-card"
                onClick={() => navigate(`/food/${food.id}`)}
                id={`trending-dish-${food.id}`}
              >
                <div className="zh-food-image-shell">
                  <img
                    src={food.image?.src || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'}
                    alt={food.name}
                    className="zh-food-image"
                  />
                  <div className="zh-food-tag">
                    <span className={`zh-veg-marker ${food.veg ? 'veg' : 'non-veg'}`}>●</span>
                    <span>{food.veg ? 'Pure Veg' : 'Non-Veg'}</span>
                  </div>
                  <div className="zh-food-rating">
                    <span>★</span>
                    <strong>{food.rating || '4.7'}</strong>
                  </div>
                </div>

                <div className="zh-food-info">
                  <div className="zh-food-head">
                    <h4 className="zh-food-title">{food.name}</h4>
                    <span className="zh-food-price">₹{food.price}</span>
                  </div>

                  <span className="zh-food-kitchen">
                    From {getRestaurantName(food.restaurantId)}
                  </span>

                  <p className="zh-food-summary">
                    {food.description || 'Authentic traditional recipe prepared with fresh farm ingredients.'}
                  </p>

                  <div className="zh-food-bottom">
                    <button
                      type="button"
                      className="zh-food-order-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOrderNow(food);
                      }}
                      id={`btn-order-now-${food.id}`}
                    >
                      <span>Order Now</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="zh-center-action-btn-wrap">
            <button
              type="button"
              className="zh-large-pill-btn secondary"
              onClick={() => navigate('/menu')}
            >
              <span>Explore Full Menu →</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SCREEN 6: UNIQUE AI SECTION — "LET ZESTRO CHOOSE FOR YOU"
          ========================================================================= */}
      <section className="zh-page-section zh-ai-section">
        <div className="zh-page-container">
          <div className="zh-ai-feature-card">
            <div className="zh-ai-header">
              <span className="zh-ai-badge">NEURAL CULINARY ENGINE</span>
              <h2 className="zh-ai-title">LET ZESTRO CHOOSE FOR YOU ✦</h2>
              <p className="zh-ai-desc">
                Not sure what to eat? Tell ZESTRO what you're looking for and our AI culinary engine will recommend the perfect match.
              </p>
            </div>

            {/* Quick Interactive Prompt Chips */}
            <div className="zh-ai-chips-container">
              <span className="zh-chips-caption">Try asking:</span>
              <div className="zh-ai-chips-list">
                {AI_QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="zh-ai-prompt-chip"
                    onClick={() => handleAiPromptClick(prompt)}
                  >
                    <span>“{prompt}”</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Prompt Input Bar */}
            <form className="zh-ai-search-form" onSubmit={handleAskZestroSubmit}>
              <div className="zh-ai-input-wrapper">
                <Icon name="sparkles" size={20} color="#e8542a" />
                <input
                  type="text"
                  placeholder='e.g., "Where can I get the best crispy ghee roast under ₹150 in Kovilpatti?"'
                  value={aiCustomInput}
                  onChange={(e) => setAiCustomInput(e.target.value)}
                  className="zh-ai-text-input"
                  id="zh-ai-prompt-input"
                />
              </div>
              <button type="submit" className="zh-ai-submit-btn" id="btn-ask-zestro-ai">
                <Icon name="sparkles" size={17} color="#ffffff" />
                <span>Ask Zestro ✦</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SCREEN 7: ZESTRO UNIQUE FEATURES — "THE ZESTRO EXPERIENCE"
          ========================================================================= */}
      <section className="zh-page-section zh-experience-section">
        <div className="zh-page-container">
          <div className="zh-section-title-wrap">
            <span className="zh-title-pill">PLATFORM CAPABILITIES</span>
            <h2 className="zh-main-heading">THE ZESTRO EXPERIENCE</h2>
            <p className="zh-main-subtext">
              Engineered with modern dining technologies for hyper-local food discovery
            </p>
          </div>

          <div className="zh-experience-grid">
            {/* Feature 1 */}
            <div className="zh-exp-card" onClick={() => dispatch(toggleChat())}>
              <div className="zh-exp-icon grad-1">
                <Icon name="sparkles" size={24} color="#ffffff" />
              </div>
              <h4 className="zh-exp-title">✦ AI Dining Assistant</h4>
              <p className="zh-exp-desc">
                Personalized dietary suggestions, flavor pairing &amp; culinary chat.
              </p>
              <span className="zh-exp-action">Launch Assistant →</span>
            </div>

            {/* Feature 2 */}
            <div className="zh-exp-card" onClick={() => setShowMysteryModal(true)}>
              <div className="zh-exp-icon grad-2">
                <Icon name="rewards" size={24} color="#ffffff" />
              </div>
              <h4 className="zh-exp-title">🎁 Mystery Rewards</h4>
              <p className="zh-exp-desc">
                Post-dining scratch cards, DinePoints tokens &amp; free sweet treats.
              </p>
              <span className="zh-exp-action">Try Mystery Card →</span>
            </div>

            {/* Feature 3 */}
            <div className="zh-exp-card" onClick={() => navigate('/search')}>
              <div className="zh-exp-icon grad-3">
                <Icon name="mic" size={24} color="#ffffff" />
              </div>
              <h4 className="zh-exp-title">🎙 Voice Ordering</h4>
              <p className="zh-exp-desc">
                Speak naturally in Tamil or English to discover food &amp; fill cart.
              </p>
              <span className="zh-exp-action">Voice Search →</span>
            </div>

            {/* Feature 4 */}
            <div className="zh-exp-card" onClick={() => navigate('/book-table')}>
              <div className="zh-exp-icon grad-4">
                <Icon name="bookTable" size={24} color="#ffffff" />
              </div>
              <h4 className="zh-exp-title">🪑 Digital Restaurant Twin</h4>
              <p className="zh-exp-desc">
                Interactive real-time 3D table maps &amp; instant 4-digit check-in PIN.
              </p>
              <span className="zh-exp-action">Reserve Table →</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SCREEN 8: ABOUT US & TRUST PILLARS
          ========================================================================= */}
      <section className="zh-page-section zh-about-section" id="about-section">
        <div className="zh-page-container">
          <div className="zh-section-title-wrap">
            <span className="zh-title-pill">ABOUT ZESTRO ✦ LOCAL EXCELLENCE</span>
            <h2 className="zh-main-heading">Crafted for Food Lovers, Powered by Local Pride</h2>
            <p className="zh-main-subtext">
              Bridging South Tamil Nadu’s deep culinary heritage with intelligent dining technology.
            </p>
          </div>

          <div className="zh-about-grid">
            {/* Left Column: Story & 4 Trust Pillars */}
            <div className="zh-about-story-col">
              <div className="zh-about-story-card">
                <div className="zh-about-chip">OUR MISSION</div>
                <h3 className="zh-about-story-heading">Authentic Flavors, Seamless Technology</h3>
                <p className="zh-about-story-text">
                  ZESTRO was born out of deep admiration for the iconic culinary heritage of Kovilpatti and Tirunelveli. From legendary heritage sweet houses to bustling traditional mess dining and contemporary cafes, we empower food lovers to discover verified regional kitchens with precision, safety, and joy.
                </p>

                <div className="zh-about-pillars-grid">
                  {ABOUT_PILLARS.map((p, idx) => (
                    <div key={idx} className="zh-pillar-item">
                      <div className="zh-pillar-icon">
                        <Icon name={p.icon} size={20} color="var(--accent)" />
                      </div>
                      <div className="zh-pillar-content">
                        <h4>{p.title}</h4>
                        <p>{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Real Impact Metrics & Connoisseur Card */}
            <div className="zh-about-stats-col">
              <div className="zh-about-metrics-box">
                <div className="zh-metrics-header">
                  <span className="zh-metrics-tag">✦ LIVE PLATFORM METRICS</span>
                  <h3>Trusted by Food Lovers</h3>
                </div>

                <div className="zh-metrics-grid">
                  {ABOUT_STATS.map((st, idx) => (
                    <div key={idx} className="zh-stat-tile">
                      <span className="zh-stat-value">{st.value}</span>
                      <strong className="zh-stat-label">{st.label}</strong>
                      <small className="zh-stat-sub">{st.sub}</small>
                    </div>
                  ))}
                </div>

                <div className="zh-quote-banner">
                  <p className="zh-quote-text">
                    “ZESTRO brings the warmth of Kovilpatti hospitality and Nellai spices right into modern digital dining. An unmatched local culinary experience.”
                  </p>
                  <span className="zh-quote-author">— The ZESTRO Food Committee</span>
                </div>

                <button
                  type="button"
                  className="zh-about-explore-btn"
                  onClick={() => navigate('/restaurants')}
                >
                  <span>Explore Verified Eateries in {selectedLocation}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SCREEN 9: CONTACT US & 24/7 CONCIERGE (Modern Interactive Section)
          ========================================================================= */}
      <section className="zh-page-section zh-contact-section" id="contact-section">
        <div className="zh-page-container">
          <div className="zh-section-title-wrap">
            <span className="zh-title-pill">✦ 24/7 CUSTOMER SUPPORT &amp; CONCIERGE</span>
            <h2 className="zh-main-heading">Contact ZESTRO Support</h2>
            <p className="zh-main-subtext">
              Have questions about your order, need special dining arrangements, or want to partner with us? Our regional support team in {selectedLocation} is ready to help.
            </p>
          </div>

          <div className="zh-contact-grid">
            {/* Left Column: Direct Interactive Channels */}
            <div className="zh-contact-channels">
              <div className="zh-contact-channel-card">
                <div className="zh-channel-icon-wrap" style={{ background: '#e8542a15', color: '#e8542a' }}>
                  <Icon name="phone" size={24} color="#e8542a" />
                </div>
                <div className="zh-channel-info">
                  <span className="zh-channel-tag">PHONE HELPLINE</span>
                  <h4 className="zh-channel-title">+91 98765 43210</h4>
                  <p className="zh-channel-desc">Toll-free hotline available daily from 7:00 AM to 11:30 PM</p>
                  <a href="tel:+919876543210" className="zh-channel-action-btn">
                    <span>Call Helpline Now</span>
                    <span>→</span>
                  </a>
                </div>
              </div>

              <div className="zh-contact-channel-card">
                <div className="zh-channel-icon-wrap" style={{ background: '#10b98115', color: '#10b981' }}>
                  <Icon name="chat" size={24} color="#10b981" />
                </div>
                <div className="zh-channel-info">
                  <span className="zh-channel-tag" style={{ color: '#10b981' }}>WHATSAPP CONCIERGE</span>
                  <h4 className="zh-channel-title">+91 98765 43210</h4>
                  <p className="zh-channel-desc">Average reply under 2 mins for quick table &amp; delivery help</p>
                  <a
                    href="https://wa.me/919876543210?text=Hello%20Zestro%20Support!%20I%20need%20help%20with%20my%20order."
                    target="_blank"
                    rel="noreferrer"
                    className="zh-channel-action-btn whatsapp"
                  >
                    <span>Chat on WhatsApp</span>
                    <span>💬</span>
                  </a>
                </div>
              </div>

              <div className="zh-contact-channel-card">
                <div className="zh-channel-icon-wrap" style={{ background: '#3b82f615', color: '#3b82f6' }}>
                  <Icon name="mail" size={24} color="#3b82f6" />
                </div>
                <div className="zh-channel-info">
                  <span className="zh-channel-tag" style={{ color: '#3b82f6' }}>EMAIL SUPPORT</span>
                  <h4 className="zh-channel-title">support@zestro.in</h4>
                  <p className="zh-channel-desc">Send questions, billing slips, or enterprise catering requests</p>
                  <a href="mailto:support@zestro.in" className="zh-channel-action-btn">
                    <span>Send Email</span>
                    <span>✉️</span>
                  </a>
                </div>
              </div>

              <div className="zh-contact-channel-card">
                <div className="zh-channel-icon-wrap" style={{ background: '#8b5cf615', color: '#8b5cf6' }}>
                  <Icon name="location" size={24} color="#8b5cf6" />
                </div>
                <div className="zh-channel-info">
                  <span className="zh-channel-tag" style={{ color: '#8b5cf6' }}>REGIONAL HUBS</span>
                  <h4 className="zh-channel-title">Kovilpatti &amp; Tirunelveli</h4>
                  <p className="zh-channel-desc">Main Bazaar Road, Kovilpatti &bull; Vannarpettai Bypass, Tirunelveli</p>
                  <button type="button" className="zh-channel-action-btn" onClick={() => dispatch(toggleChat())}>
                    <span>Ask AI Concierge</span>
                    <span>✦</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Send Instant Message Form */}
            <div className="zh-contact-form-wrap">
              <div className="zh-contact-form-box">
                <div className="zh-contact-form-head">
                  <span className="zh-form-chip">DIRECT MESSAGE</span>
                  <h3>Send Us a Quick Message</h3>
                  <p>Leave a note and our local support team will get in touch with you shortly.</p>
                </div>

                {contactSent ? (
                  <div className="zh-contact-success-state">
                    <div className="zh-success-icon-badge">✓</div>
                    <h4>Message Received!</h4>
                    <p>
                      Thank you, <strong>{contactForm.name}</strong>! Your inquiry regarding <strong>{contactForm.topic}</strong> has been logged. Our concierge will contact you within 15 minutes.
                    </p>
                    <button
                      type="button"
                      className="zh-contact-reset-btn"
                      onClick={() => {
                        setContactSent(false);
                        setContactForm({
                          name: currentUser?.fullName || '',
                          contact: currentUser?.phone || currentUser?.email || '',
                          topic: 'General Inquiry',
                          message: '',
                        });
                      }}
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="zh-contact-form">
                    <div className="zh-form-field">
                      <label htmlFor="contact-name">Your Full Name</label>
                      <input
                        type="text"
                        id="contact-name"
                        required
                        placeholder="e.g. Dheiva Lakshmi"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      />
                    </div>

                    <div className="zh-form-field">
                      <label htmlFor="contact-phone-email">Phone Number or Email</label>
                      <input
                        type="text"
                        id="contact-phone-email"
                        required
                        placeholder="e.g. +91 98401 23456 or name@example.com"
                        value={contactForm.contact}
                        onChange={(e) => setContactForm({ ...contactForm, contact: e.target.value })}
                      />
                    </div>

                    <div className="zh-form-field">
                      <label htmlFor="contact-topic">Inquiry Type</label>
                      <select
                        id="contact-topic"
                        value={contactForm.topic}
                        onChange={(e) => setContactForm({ ...contactForm, topic: e.target.value })}
                      >
                        <option value="Food Order Assistance">Food Order Assistance</option>
                        <option value="Table Reservation Help">Table Reservation Help</option>
                        <option value="Restaurant Partnership">Restaurant Partnership</option>
                        <option value="Catering & Party Order">Catering &amp; Party Order</option>
                        <option value="General Inquiry">General Inquiry</option>
                      </select>
                    </div>

                    <div className="zh-form-field">
                      <label htmlFor="contact-message">How can we help?</label>
                      <textarea
                        id="contact-message"
                        required
                        rows={4}
                        placeholder="Describe your request or question here..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      className="zh-contact-submit-btn"
                      disabled={contactSending}
                    >
                      {contactSending ? (
                        <span>Sending Message...</span>
                      ) : (
                        <>
                          <Icon name="phone" size={16} color="#ffffff" />
                          <span>Send Message to Support</span>
                          <span>→</span>
                        </>
                      )}
                    </button>

                    <div className="zh-contact-footer-note">
                      <span>Need formal issue ticketing?</span>
                      <Link to="/help" className="zh-help-link">Open Full Helpdesk &amp; FAQ →</Link>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SCREEN 10: PROFESSIONAL FULL-WIDTH FOOTER (Clean & Elegant)
          ========================================================================= */}
      <footer className="zh-site-footer">
        <div className="zh-page-container">
          <div className="zh-footer-top-grid">
            <div className="zh-footer-brand-col">
              <div className="zh-footer-brand-logo">
                <Icon name="restaurant" size={26} color="#e8542a" />
                <span className="zh-footer-brand-name">zestro</span>
              </div>
              <p className="zh-footer-desc">
                A premium intelligent food discovery &amp; restaurant booking platform. Serving Kovilpatti &amp; Tirunelveli with culinary excellence.
              </p>
              <div className="zh-footer-chips">
                <span>📍 Kovilpatti Hub</span>
                <span>📍 Tirunelveli Hub</span>
                <span>⚡ 30-Min Delivery</span>
              </div>
            </div>

            <div className="zh-footer-link-col">
              <h4>EXPLORE</h4>
              <Link to="/restaurants">All Restaurants</Link>
              <Link to="/menu">Trending Menus</Link>
              <a href="#explore-section" onClick={(e) => { e.preventDefault(); scrollToExplore(); }}>Mood Dining</a>
              <Link to="/search">Dishes &amp; Cuisines</Link>
            </div>

            <div className="zh-footer-link-col">
              <h4>OUR SERVICES</h4>
              <Link to="/book-table">3D Table Reservation</Link>
              <Link to="/recommendations">AI Taste Engine</Link>
              <Link to="/menu">Digital Menu Book</Link>
              <Link to="/rewards">Mystery Rewards</Link>
            </div>

            <div className="zh-footer-link-col">
              <h4>ABOUT US</h4>
              <a href="#about-section" onClick={(e) => { e.preventDefault(); scrollToAbout(); }}>Our Story &amp; Mission</a>
              <a href="#contact-section" onClick={(e) => { e.preventDefault(); scrollToContact(); }}>Contact Us (24/7)</a>
              <Link to="/help">Help &amp; Support</Link>
              <Link to="/feedback">Guest Feedback</Link>
              <Link to="/login">Sign In</Link>
            </div>
          </div>

          <div className="zh-footer-bottom-bar">
            <span>© 2026 ZESTRO Food Tech. All rights reserved.</span>
            <div className="zh-footer-bottom-links">
              <Link to="/help">Privacy Policy</Link>
              <span>•</span>
              <Link to="/help">Terms of Service</Link>
              <span>•</span>
              <Link to="/help">Security</Link>
              <span>•</span>
              <Link to="/help">Sitemap</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Mystery Reward Modal */}
      {showMysteryModal && (
        <MysteryRewardModal onClose={() => setShowMysteryModal(false)} />
      )}
    </div>
  );
}
