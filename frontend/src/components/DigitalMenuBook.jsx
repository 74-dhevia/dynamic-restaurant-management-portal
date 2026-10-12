import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RESTAURANTS, FOODS, CATEGORIES } from '../data/mockData';
import SafeImage from './SafeImage';
import { addToCart, incQty, decQty } from '../redux/slices/cartSlice';
import { toggleWishlist } from '../redux/slices/wishlistSlice';
import { createBooking } from '../redux/slices/bookingSlice';
import { useToast } from '../contexts/ToastContext';
import { restaurantApiService } from '../services/restaurantApiService';
import './DigitalMenuBook.css';

export default function DigitalMenuBook({ restaurantId, onBack }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const userLocation = useSelector(s => s.user?.location || 'Kovilpatti');
  const cartItems = useSelector(s => s.cart?.items || []);
  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants);
  const restaurantsData = reduxRestaurants && reduxRestaurants.length > 0 ? reduxRestaurants : RESTAURANTS;
  const reduxFoods = useSelector(s => s.food?.foods);
  const foodsData = reduxFoods && reduxFoods.length > 0 ? reduxFoods : FOODS;

  const [apiRestaurant, setApiRestaurant] = useState(null);

  useEffect(() => {
    if (restaurantId) {
      restaurantApiService.getRestaurantById(restaurantId).then(res => {
        if (res.success && res.data) {
          setApiRestaurant(res.data);
        }
      });
    }
  }, [restaurantId]);

  // Resolve target restaurant
  const targetId = restaurantId || restaurantsData.find(r => r.area === userLocation || r.city === userLocation)?.id || restaurantsData[0]?.id || 'r1';
  const restaurant = useMemo(() => {
    if (apiRestaurant) return apiRestaurant;
    return restaurantsData.find(r => r.id === targetId || r._id === targetId || r.slug === targetId) || restaurantsData[0];
  }, [apiRestaurant, targetId, restaurantsData]);

  // Wishlist check
  const isWishlisted = useSelector(s => s.wishlist?.items?.some(i => i.id === (restaurant?.id || restaurant?._id)));

  // Operating status
  const nowHour = new Date().getHours();
  const isOpen = restaurant ? (nowHour >= (restaurant.openHour || 6) && nowHour < (restaurant.closeHour || 24)) : true;

  // Raw foods belonging strictly to this restaurant
  const restaurantFoods = useMemo(() => {
    if (!restaurant) return [];
    if (Array.isArray(restaurant.menu) && restaurant.menu.length > 0) {
      return restaurant.menu.map(m => ({
        id: m._id || m.id,
        _id: m._id,
        name: m.name,
        price: m.price || 150,
        veg: m.isVeg ?? true,
        category: (m.category || 'specialties').toLowerCase().replace(/\s+/g, '-'),
        restaurantId: restaurant.id || restaurant._id,
        restaurantName: restaurant.name,
        image: m.image || '',
        description: m.description || '',
        rating: m.rating || 4.5,
        isBestseller: m.isBestseller || false,
        calories: m.calories || 320,
      }));
    }
    const rId = String(restaurant.id || restaurant._id || '');
    const matched = foodsData.filter(f => (String(f.restaurantId) === rId || f.restaurantName === restaurant.name) && f.status !== 'deactivated');
    return matched.length > 0 ? matched : FOODS.slice(0, 10);
  }, [restaurant, foodsData]);

  // Page state & 3D flipping animation
  const [currentPage, setCurrentPage] = useState(1);
  const [flipDirection, setFlipDirection] = useState(null); // 'forward' | 'backward'
  const [isFlipping, setIsFlipping] = useState(false);

  // Modals & food detail
  const [selectedFoodDetails, setSelectedFoodDetails] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bookingTime, setBookingTime] = useState('7:30 PM');
  const [bookingGuests, setBookingGuests] = useState(4);
  const [bookingTable, setBookingTable] = useState('Table 06');
  const [bookingSeating, setBookingSeating] = useState('Window');

  // Swipe gesture tracker
  const touchStartX = useRef(null);

  // Lock body scroll while full screen menu is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Group dishes into structured categories
  const categoriesList = useMemo(() => {
    const set = new Set();
    restaurantFoods.forEach(f => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [restaurantFoods]);

  // Organize pages: Page 1 = Cover / Welcome, Pages 2..N = Category Pages (1-2 categories per page)
  const pages = useMemo(() => {
    const pageList = [];

    // 1. Cover Page
    pageList.push({
      pageNumber: 1,
      type: 'cover',
      title: 'COVER',
      heroDish: restaurantFoods.find(f => f.isBestseller) || restaurantFoods[0],
      topDishes: restaurantFoods.slice(0, 3),
    });

    if (restaurantFoods.length === 0) {
      return pageList;
    }

    const catMap = {};
    restaurantFoods.forEach(f => {
      const c = f.category || 'specialties';
      if (!catMap[c]) catMap[c] = [];
      catMap[c].push(f);
    });

    const getCatTitle = (catId) => {
      const found = CATEGORIES.find(c => c.id === catId);
      if (found) return found.name.toUpperCase();
      return catId.replace('-', ' ').toUpperCase();
    };

    const allSections = Object.entries(catMap).map(([catId, items]) => ({
      catId,
      title: getCatTitle(catId),
      items,
      featuredDish: items.find(i => i.image) || items[0],
      specialDish: items.find(i => i.isBestseller) || null,
    }));

    // Split sections across pages: max 2 sections per page for clean, spacious chalkboard look
    const sectionsPerPage = allSections.length <= 2 ? 1 : 2;
    for (let i = 0; i < allSections.length; i += sectionsPerPage) {
      const currentSecs = allSections.slice(i, i + sectionsPerPage);
      pageList.push({
        pageNumber: pageList.length + 1,
        type: 'menu',
        title: currentSecs.map(s => s.title).join(' • '),
        sections: currentSecs,
      });
    }

    return pageList;
  }, [restaurant, restaurantFoods]);

  const totalPages = pages.length;
  const currentPageData = pages[currentPage - 1] || pages[0];

  // Page navigation with 3D single-page turn
  const goToPage = (pageNum, direction = 'forward') => {
    if (isFlipping || pageNum === currentPage || pageNum < 1 || pageNum > totalPages) return;
    setIsFlipping(true);
    setFlipDirection(direction);
    setTimeout(() => {
      setCurrentPage(pageNum);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 520);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1, 'forward');
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1, 'backward');
    }
  };

  // Category navigation: find page that contains category and flip there
  const handleSelectCategory = (catId) => {
    if (catId === 'cover') {
      goToPage(1, currentPage > 1 ? 'backward' : 'forward');
      return;
    }
    const targetPageIndex = pages.findIndex(p => p.type === 'menu' && p.sections?.some(s => s.catId === catId));
    if (targetPageIndex !== -1) {
      const targetPageNum = targetPageIndex + 1;
      const dir = targetPageNum >= currentPage ? 'forward' : 'backward';
      goToPage(targetPageNum, dir);
    }
  };

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNextPage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'Escape') {
        if (selectedFoodDetails) setSelectedFoodDetails(null);
        else if (showTableModal) setShowTableModal(false);
        else if (onBack) onBack();
        else navigate(`/restaurant/${restaurant.id}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, isFlipping, selectedFoodDetails, showTableModal]);

  // Touch Swipe navigation
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) {
      // Swiped Left -> Next page
      handleNextPage();
    } else if (diff < -50) {
      // Swiped Right -> Previous page
      handlePrevPage();
    }
    touchStartX.current = null;
  };

  // Cart operations
  const getItemQty = (foodId) => {
    const item = cartItems.find(i => i.foodId === foodId);
    return item ? item.qty : 0;
  };

  const handleAddToCart = (food) => {
    if (!isOpen) {
      showToast('Ordering is unavailable as the restaurant is closed.', 'error');
      return;
    }
    dispatch(addToCart({
      foodId: food.id,
      name: food.name,
      price: food.price,
      qty: 1,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      image: food.image,
    }));
    showToast(`Added ${food.name} to cart!`, 'success');
  };

  // Table Reservation Submission with 4-Digit Verification PIN & Confirmation
  const handleTableReservation = (e) => {
    e.preventDefault();
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    const cleanDate = bookingDate ? bookingDate.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const bookingId = `ZST-${cleanDate}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking = {
      id: bookingId,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      date: bookingDate,
      time: bookingTime,
      guests: bookingGuests,
      tableNumber: bookingTable,
      tableId: bookingTable,
      seating: bookingSeating,
      pin: randomPin,
      verificationPin: randomPin,
      tableBookingFee: 100,
      preOrderItems: [],
      preOrderTotal: 0,
      grandTotal: 100,
      status: 'Confirmed',
      journeyStep: 1,
      createdAt: new Date().toISOString(),
    };

    dispatch(createBooking(newBooking));
    setShowTableModal(false);
    navigate(`/booking-success/${bookingId}`);
  };

  // Floating Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [cartItems]);
  const cartTotalQty = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.qty, 0);
  }, [cartItems]);

  return (
    <div
      className="fs-menu-viewport"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Edge Tabletop Ambiance Props (Chalkboard on wooden table) */}
      <img
        src="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=300&q=80"
        alt="Prop fries"
        className="fs-menu-prop prop-left-dish"
      />
      <img
        src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80"
        alt="Prop condiment"
        className="fs-menu-prop prop-right-dish"
      />
      <img
        src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80"
        alt="Prop burger"
        className="fs-menu-prop prop-bottom-dish"
      />
      <img
        src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80"
        alt="Prop salad"
        className="fs-menu-prop prop-bottom-left"
      />

      {/* ----------------------------------------------------------------------
          1. TOP NAVIGATION & CONTROLS (Requirement 14, 18, 23, 24)
          ---------------------------------------------------------------------- */}
      <header className="fs-menu-topbar">
        <div className="fs-menu-brand-meta">
          {/* Back button returns to Restaurant Details */}
          <button
            type="button"
            className="fs-back-btn"
            onClick={onBack || (() => navigate(`/restaurant/${restaurant.id}`))}
            title="Return to restaurant details"
          >
            ← Back
          </button>

          {/* Small Home icon returns to Zestro Home page (Requirement 24) */}
          <button
            type="button"
            className="fs-home-btn"
            onClick={() => navigate('/')}
            title="Return to ZESTRO Home"
          >
            🏠
          </button>

          <div className="fs-rest-info">
            <h1 className="fs-rest-title">{restaurant.name}</h1>
            <div className="fs-rest-sub">
              <span>⭐ {restaurant.rating}</span>
              <span>•</span>
              <span>📍 {restaurant.area || 'Kovilpatti'}</span>
              <span>•</span>
              <span style={{ color: isOpen ? '#4ade80' : '#f87171', fontWeight: 800 }}>
                {isOpen ? '● Open Now' : '● Closed'}
              </span>
            </div>
          </div>
        </div>

        {/* Small Elegant Category Navigation (Requirement 18) */}
        <nav className="fs-category-nav" aria-label="Menu categories">
          <button
            type="button"
            className={`fs-cat-tab ${currentPage === 1 ? 'active' : ''}`}
            onClick={() => handleSelectCategory('cover')}
          >
            COVER
          </button>
          {categoriesList.map(cat => {
            const isCatActive = currentPageData?.type === 'menu' && currentPageData.sections?.some(s => s.catId === cat);
            return (
              <button
                key={cat}
                type="button"
                className={`fs-cat-tab ${isCatActive ? 'active' : ''}`}
                onClick={() => handleSelectCategory(cat)}
              >
                {cat.replace('-', ' ').toUpperCase()}
              </button>
            );
          })}
        </nav>

        <div className="fs-topbar-actions">
          <button
            type="button"
            className={`fs-action-pill fs-wishlist-pill ${isWishlisted ? 'active' : ''}`}
            onClick={() => dispatch(toggleWishlist(restaurant))}
          >
            {isWishlisted ? '❤️ In Wishlist' : '♡ Wishlist'}
          </button>

          <button
            type="button"
            className="fs-action-pill fs-book-pill"
            onClick={() => setShowTableModal(true)}
          >
            <span>🍽️</span> Book Table
          </button>
        </div>
      </header>

      {/* ----------------------------------------------------------------------
          2. THE 3D FLIPPING SINGLE MENU PAGE (ONLY ONE PAGE VISIBLE AT A TIME)
          ---------------------------------------------------------------------- */}
      <main className="fs-menu-stage">
        <article
          className={`fs-single-page-card ${flipDirection === 'forward' ? 'turn-forward' : flipDirection === 'backward' ? 'turn-backward' : ''}`}
        >
          {/* Decorative Corner Stars */}
          <span className="fs-corner-flourish flourish-tl">✦</span>
          <span className="fs-corner-flourish flourish-tr">✦</span>
          <span className="fs-corner-flourish flourish-bl">✦</span>
          <span className="fs-corner-flourish flourish-br">✦</span>

          {/* PAGE 1: RESTAURANT COVER & INTRODUCTION (Requirement 6) */}
          {currentPageData?.type === 'cover' ? (
            <div className="fs-cover-container">
              <div className="fs-cover-header">
                <div className="fs-cover-crest">★ ZESTRO FINE DINING SELECTION ★</div>
                <h2 className="fs-cursive-title" style={{ fontSize: 'clamp(32px, 5vw, 54px)' }}>
                  {restaurant.name}
                </h2>
                <h3 className="fs-menu-stamp">MENU</h3>
                <p className="fs-cover-cuisine">{restaurant.cuisine}</p>
                <div className="fs-header-line">❖ ❖ ❖</div>
              </div>

              <div className="fs-cover-body">
                {/* Hero Restaurant/Specialty Photo */}
                <div className="fs-cover-hero-wrap">
                  <SafeImage
                    image={restaurant.image || currentPageData.heroDish?.image}
                    alt={restaurant.name}
                    className="fs-cover-hero-img"
                  />
                  <div className="fs-cover-hero-badge">
                    <span>⭐ {restaurant.rating} ({restaurant.ratingCount} Reviews)</span>
                    <span>•</span>
                    <span>📍 {restaurant.area}</span>
                  </div>
                </div>

                {/* Introduction & Highlights */}
                <div className="fs-cover-details">
                  <div className="fs-cover-intro-box">
                    <h4 className="fs-cover-subtitle">CHEF'S WELCOME</h4>
                    <p className="fs-cover-text">
                      Welcome to <strong>{restaurant.name}</strong>. We craft each authentic dish using regional heritage recipes, stone-ground masalas, and pristine ingredients. Turn the page to discover our complete menu selection.
                    </p>
                  </div>

                  <div className="fs-cover-meta-badges">
                    <div className="fs-meta-pill">
                      <span>📍</span>
                      <span>{typeof restaurant?.address === 'object' ? `${restaurant.address.street || ''}, ${restaurant.address.city || ''}` : (restaurant?.address || restaurant?.area || 'Tamil Nadu')}</span>
                    </div>
                    <div className="fs-meta-pill">
                      <span>🕒</span>
                      <span>{restaurant.openHour || 6}:00 AM - {restaurant.closeHour || 23}:00 PM ({isOpen ? 'Open Now' : 'Closed'})</span>
                    </div>
                    <div className="fs-meta-pill">
                      <span>💰</span>
                      <span>Price for Two: ₹{restaurant.priceForTwo || 220} approx</span>
                    </div>
                  </div>

                  {/* Quick CTAs on Cover */}
                  <div className="fs-cover-buttons">
                    <button
                      type="button"
                      className="fs-cover-explore-btn"
                      onClick={handleNextPage}
                    >
                      <span>OPEN FIRST COURSE (PAGE 02)</span>
                      <span>→</span>
                    </button>
                    <button
                      type="button"
                      className="fs-cover-reserve-btn"
                      onClick={() => setShowTableModal(true)}
                    >
                      <span>🍽️ Reserve Table with PIN</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Signature Highlights Ribbon */}
              {currentPageData.topDishes && currentPageData.topDishes.length > 0 && (
                <div className="fs-cover-highlights-ribbon">
                  <span className="fs-hl-banner-title">★ TODAY'S SIGNATURE SPECIALS ★</span>
                  <div className="fs-hl-items-row">
                    {currentPageData.topDishes.map(dish => (
                      <div
                        key={dish.id}
                        className="fs-hl-item-card"
                        onClick={() => setSelectedFoodDetails(dish)}
                      >
                        <SafeImage image={dish.image} alt={dish.name} className="fs-hl-thumb" />
                        <div className="fs-hl-info">
                          <span className="fs-hl-name">{dish.name}</span>
                          <span className="fs-hl-price">₹{dish.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* PAGES 2..N: DEDICATED CATEGORY MENU PAGES (Requirement 6, 9, 10) */
            <div className="fs-menu-content-page">
              {/* Page Header */}
              <div className="fs-page-header">
                <h2 className="fs-cursive-title">{restaurant.name}</h2>
                <h3 className="fs-menu-stamp">MENU</h3>
                <div className="fs-header-subtitle">
                  {currentPageData.title} • {restaurant.area.toUpperCase()}
                </div>
                <div className="fs-header-line">❖ ❖ ❖</div>
              </div>

              {/* Sections Grid */}
              <div className="fs-page-body">
                {currentPageData.sections && currentPageData.sections.length > 0 ? (
                  currentPageData.sections.map((sec) => (
                    <section key={sec.catId} className="fs-menu-section">
                      {/* Red Ribbon Category Banner (Inspired by Reference Image) */}
                      <div className="fs-ribbon-banner">
                        {sec.title}
                      </div>

                      {/* Featured Authentic Food Photograph */}
                      {sec.featuredDish && sec.featuredDish.image && (
                        <div
                          className="fs-photo-card"
                          onClick={() => setSelectedFoodDetails(sec.featuredDish)}
                          title={`View ${sec.featuredDish.name}`}
                        >
                          <SafeImage
                            image={sec.featuredDish.image}
                            alt={sec.featuredDish.name}
                            className="fs-photo-img"
                          />
                          <span className="fs-photo-badge">
                            ⭐ {sec.featuredDish.rating || '4.8'}
                          </span>
                          <div className="fs-photo-caption">
                            <span>{sec.featuredDish.name}</span>
                            <span style={{ color: '#ffdf78' }}>₹{sec.featuredDish.price}</span>
                          </div>
                        </div>
                      )}

                      {/* Dotted Leader Line Dish Items */}
                      <div className="fs-dish-list">
                        {sec.items.map((dish) => {
                          const qty = getItemQty(dish.id);

                          return (
                            <div key={dish.id} className="fs-dish-row">
                              <div className="fs-dish-header">
                                <span
                                  className="fs-dish-name"
                                  onClick={() => setSelectedFoodDetails(dish)}
                                >
                                  <span style={{ fontSize: 9 }}>{dish.veg ? '🟢' : '🔴'}</span>
                                  <span>{dish.name}</span>
                                </span>
                                <span className="fs-dot-leader" />
                                <span className="fs-dish-price">₹{dish.price}</span>

                                {/* Quantity Stepper / Add button */}
                                {qty > 0 ? (
                                  <div className="fs-stepper">
                                    <button
                                      type="button"
                                      onClick={() => dispatch(decQty(dish.id))}
                                    >
                                      −
                                    </button>
                                    <span>{qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => dispatch(incQty(dish.id))}
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="fs-add-btn"
                                    disabled={!isOpen}
                                    onClick={() => handleAddToCart(dish)}
                                  >
                                    {isOpen ? '+ ADD' : 'Closed'}
                                  </button>
                                )}
                              </div>

                              {dish.description && (
                                <div className="fs-dish-desc">
                                  {dish.description}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Special Recommendation Highlight (Requirement 10) */}
                      {sec.specialDish && sec.specialDish !== sec.featuredDish && (
                        <div
                          className="fs-special-card"
                          onClick={() => setSelectedFoodDetails(sec.specialDish)}
                        >
                          <div className="fs-special-tag">TODAY'S SPECIAL</div>
                          <div className="fs-special-content">
                            <SafeImage
                              image={sec.specialDish.image}
                              alt={sec.specialDish.name}
                              className="fs-special-img"
                            />
                            <div className="fs-special-meta">
                              <strong>{sec.specialDish.name}</strong>
                              <span className="fs-special-price">₹{sec.specialDish.price}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </section>
                  ))
                ) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                    <p style={{ fontSize: 18 }}>No dishes listed for this section.</p>
                  </div>
                )}
              </div>

              {/* Bottom Decorative Footer */}
              <div className="fs-page-printed-footer">
                ❖ {restaurant.name.toUpperCase()} • {restaurant.area.toUpperCase()} • ZESTRO AUTHENTIC DINING ❖
              </div>
            </div>
          )}
        </article>
      </main>

      {/* ----------------------------------------------------------------------
          3. BOTTOM NAVIGATION & PAGE COUNTER (Requirement 14, 17, 28)
          ---------------------------------------------------------------------- */}
      <footer className="fs-menu-bottombar">
        <div className="fs-keys-hint">
          <span>⌨️ Hint: Use</span>
          <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, color: '#fff' }}>←</kbd>
          <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, color: '#fff' }}>→</kbd>
          <span>or swipe to turn pages</span>
        </div>

        {/* Flipper Controls */}
        <div className="fs-nav-flipper">
          <button
            type="button"
            className="fs-flip-btn"
            disabled={currentPage <= 1 || isFlipping}
            onClick={handlePrevPage}
          >
            ← Previous
          </button>

          <span className="fs-page-counter">
            {String(currentPage).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
          </span>

          <button
            type="button"
            className="fs-flip-btn"
            disabled={currentPage >= totalPages || isFlipping}
            onClick={handleNextPage}
          >
            Next →
          </button>
        </div>

        <div style={{ width: 140 }} />
      </footer>

      {/* ----------------------------------------------------------------------
          4. FLOATING CART PILL (Requirement 20)
          ---------------------------------------------------------------------- */}
      {cartTotalQty > 0 && (
        <div
          className="fs-floating-cart-pill"
          onClick={() => navigate('/cart')}
        >
          <span>🛒 {cartTotalQty} {cartTotalQty === 1 ? 'Item' : 'Items'}</span>
          <span>•</span>
          <span>₹{cartSubtotal}</span>
          <span style={{ fontSize: 12, opacity: 0.9 }}>VIEW CART →</span>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          5. FOOD DETAILS / CUSTOMIZATION MODAL (Requirement 19)
          ---------------------------------------------------------------------- */}
      {selectedFoodDetails && (
        <div className="modal-backdrop" onClick={() => setSelectedFoodDetails(null)}>
          <div className="modal card" style={{ maxWidth: 420, padding: 22 }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'relative', width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
              <SafeImage
                image={selectedFoodDetails.image}
                alt={selectedFoodDetails.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                {selectedFoodDetails.veg ? '🟢 Pure Veg' : '🔴 Non-Veg'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{selectedFoodDetails.name}</h3>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>₹{selectedFoodDetails.price}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 12 }}>
              <span>⭐ {selectedFoodDetails.rating || '4.5'}</span>
              <span className="muted">•</span>
              <span className="muted">{selectedFoodDetails.category}</span>
            </div>

            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--text-muted)', marginBottom: 20 }}>
              {selectedFoodDetails.description}
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setSelectedFoodDetails(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, background: '#e52525' }}
                disabled={!isOpen}
                onClick={() => {
                  handleAddToCart(selectedFoodDetails);
                  setSelectedFoodDetails(null);
                }}
              >
                {isOpen ? 'Add to Cart' : 'Closed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          6. TABLE RESERVATION MODAL WITH PIN GENERATION (Requirement 21, 22)
          ---------------------------------------------------------------------- */}
      {showTableModal && (
        <div className="modal-backdrop" onClick={() => setShowTableModal(false)}>
          <div className="modal card" style={{ maxWidth: 440, padding: 22 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 6px', fontWeight: 800 }}>🍽️ Reserve Table</h3>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: 13 }}>
              Book an exclusive table at <strong>{restaurant.name}</strong>
            </p>

            <form onSubmit={handleTableReservation} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700 }}>Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={e => setBookingDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700 }}>Time Slot</label>
                <select
                  value={bookingTime}
                  onChange={e => setBookingTime(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}
                >
                  <option value="12:30 PM">12:30 PM (Lunch)</option>
                  <option value="1:30 PM">1:30 PM (Lunch)</option>
                  <option value="7:30 PM">7:30 PM (Dinner)</option>
                  <option value="8:30 PM">8:30 PM (Dinner)</option>
                  <option value="9:30 PM">9:30 PM (Dinner)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Guests</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={bookingGuests}
                    onChange={e => setBookingGuests(parseInt(e.target.value) || 1)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Select Table</label>
                  <select
                    value={bookingTable}
                    onChange={e => setBookingTable(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}
                  >
                    <option value="Table 06">Table 06 (Window)</option>
                    <option value="Table 02">Table 02 (Cozy Corner)</option>
                    <option value="Table 04">Table 04 (Booth)</option>
                    <option value="Table 08">Table 08 (Family)</option>
                    <option value="Table 12">Table 12 (Central Hall)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700 }}>Seating Preference</label>
                <select
                  value={bookingSeating}
                  onChange={e => setBookingSeating(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}
                >
                  <option value="Window">Window Seat</option>
                  <option value="Booth">Cozy Booth</option>
                  <option value="Central">Center Hall</option>
                  <option value="Outdoor">Outdoor / Garden</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowTableModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, background: '#e52525' }}
                >
                  Confirm Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
