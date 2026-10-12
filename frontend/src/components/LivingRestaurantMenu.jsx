import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RESTAURANTS, FOODS } from '../data/mockData';
import SafeImage from './SafeImage';
import Icon from './Icon';
import { addToCart, incQty, decQty } from '../redux/slices/cartSlice';
import { toggleWishlist } from '../redux/slices/wishlistSlice';
import { addRecentlyViewed } from '../redux/slices/recentlyViewedSlice';
import { useToast } from '../contexts/ToastContext';
import { restaurantApiService } from '../services/restaurantApiService';
import './LivingRestaurantMenu.css';

export default function LivingRestaurantMenu({ restaurantId, onSelectRestaurant }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const currentUser = useSelector(s => s.auth?.currentUser);
  const cartItems = useSelector(s => s.cart?.items || []);
  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants);
  const restaurantsData = reduxRestaurants && reduxRestaurants.length > 0 ? reduxRestaurants : RESTAURANTS;
  const reduxFoods = useSelector(s => s.food?.foods);
  const foodsData = reduxFoods && reduxFoods.length > 0 ? reduxFoods : FOODS;

  const [apiRestaurant, setApiRestaurant] = useState(null);

  // Load restaurant from API or Redux
  useEffect(() => {
    if (restaurantId) {
      restaurantApiService.getRestaurantById(restaurantId).then(res => {
        if (res.success && res.data) {
          setApiRestaurant(res.data);
        }
      });
    }
  }, [restaurantId]);

  // Target restaurant resolution
  const targetId = restaurantId || restaurantsData[0]?.id || 'r1';
  const restaurant = useMemo(() => {
    if (apiRestaurant) return apiRestaurant;
    return (
      restaurantsData.find(r => r.id === targetId || r._id === targetId || r.slug === targetId) ||
      restaurantsData[0]
    );
  }, [apiRestaurant, targetId, restaurantsData]);

  // Wishlist check for restaurant
  const isRestWished = useSelector(s =>
    s.wishlist?.items?.some(i => i.id === (restaurant?.id || restaurant?._id))
  );

  // Wishlist items set for fast lookup
  const wishedFoodIds = useSelector(s =>
    new Set((s.wishlist?.items || []).filter(i => i.type === 'food' || !i.type).map(i => i.id))
  );

  // Operating status
  const nowHour = new Date().getHours();
  const isOpen = restaurant
    ? nowHour >= (restaurant.openHour || 6) && nowHour < (restaurant.closeHour || 24)
    : true;

  // Add restaurant to recently viewed
  useEffect(() => {
    if (restaurant) {
      dispatch(
        addRecentlyViewed({
          id: restaurant.id || restaurant._id,
          type: 'restaurant',
          name: restaurant.name,
          image: restaurant.image,
        })
      );
    }
  }, [restaurant, dispatch]);

  // Raw foods belonging to this restaurant
  const restaurantFoods = useMemo(() => {
    if (!restaurant) return [];
    if (Array.isArray(restaurant.menu) && restaurant.menu.length > 0) {
      return restaurant.menu.map(m => ({
        id: m._id || m.id,
        _id: m._id,
        name: m.name,
        price: m.price || 150,
        veg: m.isVeg ?? (m.veg ?? true),
        category: (m.category || 'specialties').toLowerCase().replace(/\s+/g, '-'),
        restaurantId: restaurant.id || restaurant._id,
        restaurantName: restaurant.name,
        image: m.image || '',
        description: m.description || '',
        rating: m.rating || 4.6,
        isBestseller: m.isBestseller || false,
        spicy: m.spicy || false,
        spiceLevel: m.spiceLevel || (m.spicy ? 'Hot' : 'Medium'),
        ingredients: m.ingredients || '',
        allergens: m.allergens || '',
      }));
    }

    const rId = String(restaurant.id || restaurant._id || '');
    const matched = foodsData.filter(
      f =>
        (String(f.restaurantId) === rId || f.restaurantName === restaurant.name) &&
        f.status !== 'deactivated'
    );
    return matched.length > 0 ? matched : FOODS.slice(0, 12);
  }, [restaurant, foodsData]);

  // Dynamic Categories extracted from actual dishes
  const categoriesList = useMemo(() => {
    const set = new Set();
    restaurantFoods.forEach(f => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [restaurantFoods]);

  // State: Search, Filter, Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all' | 'veg' | 'nonveg'
  const [filterBestsellerOnly, setFilterBestsellerOnly] = useState(false);
  const [filterSpicyOnly, setFilterSpicyOnly] = useState(false);
  const [filterUnder200, setFilterUnder200] = useState(false);
  const [sortBy, setSortBy] = useState('recommended'); // 'recommended' | 'price-asc' | 'price-desc' | 'rating'

  // State: Dish Explorer Modal
  const [selectedDish, setSelectedDish] = useState(null);
  const [explorerQty, setExplorerQty] = useState(1);
  const [explorerSpice, setExplorerSpice] = useState('Medium');
  const [explorerNote, setExplorerNote] = useState('');
  const [explorerAddons, setExplorerAddons] = useState({
    extraRaita: false,
    boiledEgg: false,
    gheeRoast: false,
  });

  // Filter & Sort Logic
  const filteredDishes = useMemo(() => {
    let result = [...restaurantFoods];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        f =>
          f.name.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q)) ||
          (f.category && f.category.toLowerCase().includes(q)) ||
          (f.ingredients && f.ingredients.toLowerCase().includes(q))
      );
    }

    // Category
    if (activeCategory !== 'all') {
      result = result.filter(f => f.category === activeCategory);
    }

    // Dietary
    if (dietaryFilter === 'veg') {
      result = result.filter(f => f.veg === true);
    } else if (dietaryFilter === 'nonveg') {
      result = result.filter(f => f.veg === false);
    }

    // Quick filters
    if (filterBestsellerOnly) {
      result = result.filter(f => f.isBestseller);
    }
    if (filterSpicyOnly) {
      result = result.filter(f => f.spicy || f.spiceLevel === 'Hot');
    }
    if (filterUnder200) {
      result = result.filter(f => f.price <= 200);
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [
    restaurantFoods,
    searchQuery,
    activeCategory,
    dietaryFilter,
    filterBestsellerOnly,
    filterSpicyOnly,
    filterUnder200,
    sortBy,
  ]);

  // Cart helpers
  const getDishCartQty = foodId => {
    const item = cartItems.find(i => i.foodId === foodId || i.id === foodId);
    return item ? item.qty : 0;
  };

  const handleQuickAdd = (food, e) => {
    if (e) e.stopPropagation();
    dispatch(
      addToCart({
        foodId: food.id || food._id,
        name: food.name,
        price: food.price,
        restaurantId: restaurant.id || restaurant._id,
        restaurantName: restaurant.name,
        image: food.image,
        qty: 1,
      })
    );
    showToast(`Added ${food.name} to cart!`, 'success');
  };

  const handleIncQty = (foodId, e) => {
    if (e) e.stopPropagation();
    dispatch(incQty(foodId));
  };

  const handleDecQty = (foodId, e) => {
    if (e) e.stopPropagation();
    dispatch(decQty(foodId));
  };

  // Toggle food favorite
  const handleToggleFoodWish = (food, e) => {
    if (e) e.stopPropagation();
    dispatch(
      toggleWishlist({
        id: food.id || food._id,
        type: 'food',
        name: food.name,
        image: food.image,
        price: food.price,
        restaurantName: restaurant.name,
      })
    );
    const wished = wishedFoodIds.has(food.id || food._id);
    showToast(wished ? `Removed ${food.name} from wishlist` : `Added ${food.name} to wishlist ❤️`, 'info');
  };

  // Open Dish Explorer
  const handleOpenExplorer = food => {
    setSelectedDish(food);
    setExplorerQty(1);
    setExplorerSpice(food.spiceLevel || 'Medium');
    setExplorerNote('');
    setExplorerAddons({ extraRaita: false, boiledEgg: false, gheeRoast: false });
  };

  // Add from Dish Explorer
  const handleExplorerAddToCart = () => {
    if (!selectedDish) return;
    let addOnTotal = 0;
    if (explorerAddons.extraRaita) addOnTotal += 20;
    if (explorerAddons.boiledEgg) addOnTotal += 15;
    if (explorerAddons.gheeRoast) addOnTotal += 30;

    const unitPrice = selectedDish.price + addOnTotal;

    dispatch(
      addToCart({
        foodId: selectedDish.id || selectedDish._id,
        name: selectedDish.name + (addOnTotal > 0 ? ' (With Add-ons)' : ''),
        price: unitPrice,
        restaurantId: restaurant.id || restaurant._id,
        restaurantName: restaurant.name,
        image: selectedDish.image,
        qty: explorerQty,
        instructions: explorerNote || undefined,
        spicePreference: explorerSpice,
      })
    );

    showToast(`Added ${explorerQty}× ${selectedDish.name} to your cart! 🛒`, 'success');
    setSelectedDish(null);
  };

  // Sticky Cart Calculations
  const currentRestCartItems = useMemo(() => {
    const rId = String(restaurant?.id || restaurant?._id || '');
    return cartItems.filter(i => String(i.restaurantId) === rId);
  }, [cartItems, restaurant]);

  const cartTotalQty = currentRestCartItems.reduce((acc, i) => acc + (i.qty || 1), 0);
  const cartTotalPrice = currentRestCartItems.reduce((acc, i) => acc + (i.price || 0) * (i.qty || 1), 0);

  // Share action
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: restaurant.name,
        text: `Check out the delicious menu at ${restaurant.name} on ZESTRO!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Restaurant link copied to clipboard! 📋', 'success');
    }
  };

  if (!restaurant) {
    return (
      <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Icon name="restaurant" size={44} color="var(--accent)" />
        <h2>Restaurant Not Found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/restaurants')}>
          Explore Other Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="living-menu-container">
      {/* =====================================================================
          1. CINEMATIC RESTAURANT HEADER (Compact, Editorial, Food-Forward)
          ===================================================================== */}
      <section className="living-header-card">
        <div className="living-hero-banner">
          <SafeImage
            image={restaurant.image}
            alt={restaurant.name}
            className="living-hero-img"
            emoji="🏠"
            category="restaurant"
          />
          <div className="living-hero-gradient" />

          {/* Top Header Actions */}
          <div className="living-top-actions">
            <button
              type="button"
              className="living-back-btn"
              onClick={() => navigate('/restaurants')}
              title="Return to Restaurants list"
            >
              <span>←</span>
              <span>All Restaurants</span>
            </button>

            <div className="living-hero-right-btns">
              <button
                type="button"
                className={`living-round-action-btn ${isRestWished ? 'active' : ''}`}
                onClick={() => dispatch(toggleWishlist(restaurant))}
                title={isRestWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                {isRestWished ? '❤️' : '♡'}
              </button>

              <button
                type="button"
                className="living-round-action-btn"
                onClick={handleShare}
                title="Share Restaurant"
              >
                ↗
              </button>
            </div>
          </div>

          {/* Hero Bottom Overlay: Name & Cuisines */}
          <div className="living-hero-overlay-content">
            <h1 className="living-rest-name">{restaurant.name}</h1>
            <p className="living-rest-cuisine">
              {Array.isArray(restaurant.categories)
                ? restaurant.categories.map(c => c.replace('-', ' ')).join(' • ')
                : restaurant.cuisine || 'Authentic Regional Delicacies & Fine Dining'}
            </p>
          </div>
        </div>

        {/* Compact Details & Actions Bar */}
        <div className="living-header-meta-bar">
          <div className="living-meta-chips">
            <span className={`living-status-pill ${isOpen ? 'open' : 'closed'}`}>
              <span>{isOpen ? '●' : '○'}</span>
              <span>{isOpen ? 'Open Now' : 'Currently Closed'}</span>
            </span>

            <span className="living-rating-chip">
              ⭐ {restaurant.rating || '4.6'} ({restaurant.ratingCount || '320+'} reviews)
            </span>

            <span className="living-location-text">
              📍 {restaurant.area || restaurant.city || 'Kovilpatti'}
              {restaurant.address?.street ? ` • ${restaurant.address.street}` : ''}
            </span>

            {restaurant.offer && (
              <span
                style={{
                  background: 'rgba(232, 84, 42, 0.1)',
                  color: 'var(--accent)',
                  fontWeight: 800,
                  fontSize: 12,
                  padding: '3px 10px',
                  borderRadius: 12,
                }}
              >
                🏷️ {restaurant.offer}
              </span>
            )}
          </div>

          <div className="living-header-actions">
            <button
              type="button"
              className="living-book-table-btn"
              onClick={() => navigate(`/book-table?restaurantId=${restaurant.id || restaurant._id}`)}
            >
              <span>🍽️</span>
              <span>Reserve Table</span>
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. STICKY CONTROLS: SEARCH, FILTERS & CATEGORY TABS
          ===================================================================== */}
      <section className="living-sticky-controls">
        <div className="living-search-row">
          {/* Prominent Search Input */}
          <div className="living-search-input-wrap">
            <span className="living-search-icon">🔍</span>
            <input
              type="text"
              className="living-search-input"
              placeholder={`Search dishes in ${restaurant.name}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="living-search-clear"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          {/* Quick Dietary & Preference Filters */}
          <div className="living-quick-filters">
            <button
              type="button"
              className={`living-filter-chip ${dietaryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDietaryFilter('all')}
            >
              All Types
            </button>
            <button
              type="button"
              className={`living-filter-chip veg ${dietaryFilter === 'veg' ? 'active' : ''}`}
              onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? 'all' : 'veg')}
            >
              🟢 Pure Veg
            </button>
            <button
              type="button"
              className={`living-filter-chip nonveg ${dietaryFilter === 'nonveg' ? 'active' : ''}`}
              onClick={() => setDietaryFilter(dietaryFilter === 'nonveg' ? 'all' : 'nonveg')}
            >
              🔴 Non-Veg
            </button>
            <button
              type="button"
              className={`living-filter-chip ${filterBestsellerOnly ? 'active' : ''}`}
              onClick={() => setFilterBestsellerOnly(!filterBestsellerOnly)}
            >
              🔥 Bestsellers
            </button>
            <button
              type="button"
              className={`living-filter-chip ${filterSpicyOnly ? 'active' : ''}`}
              onClick={() => setFilterSpicyOnly(!filterSpicyOnly)}
            >
              🌶️ Spicy
            </button>
            <button
              type="button"
              className={`living-filter-chip ${filterUnder200 ? 'active' : ''}`}
              onClick={() => setFilterUnder200(!filterUnder200)}
            >
              💰 Under ₹200
            </button>

            {/* Sort Dropdown */}
            <select
              className="living-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="recommended">Sort: Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Dynamic Category Navigation Scroll Bar */}
        <nav className="living-category-pills-scroll" aria-label="Menu categories">
          <button
            type="button"
            className={`living-cat-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <span>🍽️ All Dishes</span>
            <span className="living-cat-count">({restaurantFoods.length})</span>
          </button>

          {categoriesList.map(cat => {
            const count = restaurantFoods.filter(f => f.category === cat).length;
            const label = cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            return (
              <button
                key={cat}
                type="button"
                className={`living-cat-tab-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                <span>{label}</span>
                <span className="living-cat-count">({count})</span>
              </button>
            );
          })}
        </nav>
      </section>

      {/* =====================================================================
          3. FOOD-FIRST RESPONSIVE CARDS GRID
          ===================================================================== */}
      {filteredDishes.length === 0 ? (
        <div
          className="card empty-state"
          style={{
            padding: '50px 20px',
            textAlign: 'center',
            borderRadius: 18,
            background: 'var(--bg-elevated)',
          }}
        >
          <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🍽️</span>
          <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>No dishes match your filters</h3>
          <p className="muted" style={{ margin: '0 0 16px', fontSize: 13.5 }}>
            Try adjusting your search query, dietary preference, or category filters.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
              setDietaryFilter('all');
              setFilterBestsellerOnly(false);
              setFilterSpicyOnly(false);
              setFilterUnder200(false);
            }}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="living-food-grid">
          {filteredDishes.map(food => {
            const cartQty = getDishCartQty(food.id || food._id);
            const isWished = wishedFoodIds.has(food.id || food._id);
            const isVeg = food.veg === true;

            return (
              <article
                key={food.id || food._id}
                className="living-food-card"
                onClick={() => handleOpenExplorer(food)}
              >
                {/* Food Image Wrapper */}
                <div className="living-food-card-img-wrap">
                  <SafeImage
                    image={food.image}
                    alt={food.name}
                    className="living-food-card-img"
                    emoji={isVeg ? '🥗' : '🍗'}
                    category={food.category}
                  />

                  {/* Badges on Image */}
                  <div className="living-food-badges-top">
                    {/* Veg / Non-Veg emblem */}
                    <div className="living-veg-symbol" title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}>
                      {isVeg ? (
                        <span className="veg-icon-dot" />
                      ) : (
                        <span className="nonveg-icon-tri" />
                      )}
                    </div>

                    {food.isBestseller && (
                      <span className="living-bestseller-tag">🔥 Bestseller</span>
                    )}

                    {(food.spicy || food.spiceLevel === 'Hot') && (
                      <span className="living-spice-tag">🌶️ Spicy</span>
                    )}
                  </div>

                  {/* Favorite Heart Button */}
                  <button
                    type="button"
                    className={`living-fav-btn ${isWished ? 'active' : ''}`}
                    onClick={e => handleToggleFoodWish(food, e)}
                    title={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    {isWished ? '❤️' : '♡'}
                  </button>
                </div>

                {/* Card Body */}
                <div className="living-food-card-body">
                  <div className="living-food-title-row">
                    <h3 className="living-food-title">{food.name}</h3>
                    {food.rating && (
                      <span className="living-food-rating">⭐ {food.rating}</span>
                    )}
                  </div>

                  <p className="living-food-desc">
                    {food.description ||
                      `${food.name} prepared freshly with authentic spices and finest ingredients.`}
                  </p>

                  <div className="living-food-footer">
                    <div className="living-price-wrap">
                      <span className="living-price-val">₹{food.price}</span>
                    </div>

                    {/* Add to Cart Stepper */}
                    {cartQty > 0 ? (
                      <div className="living-qty-stepper" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          className="living-stepper-btn"
                          onClick={e => handleDecQty(food.id || food._id, e)}
                          title="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="living-stepper-num">{cartQty}</span>
                        <button
                          type="button"
                          className="living-stepper-btn"
                          onClick={e => handleIncQty(food.id || food._id, e)}
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="living-add-btn"
                        onClick={e => handleQuickAdd(food, e)}
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          4. DISH EXPLORER MODAL (Interactive Dish Detail & Customization)
          ===================================================================== */}
      {selectedDish && (
        <div
          className="dish-explorer-backdrop"
          onClick={() => setSelectedDish(null)}
        >
          <div
            className="dish-explorer-modal"
            onClick={e => e.stopPropagation()}
          >
            {/* Dish Hero Photography */}
            <div className="dish-explorer-hero">
              <SafeImage
                image={selectedDish.image}
                alt={selectedDish.name}
                className="dish-explorer-hero-img"
                emoji={selectedDish.veg ? '🥗' : '🍗'}
                category={selectedDish.category}
              />
              <button
                type="button"
                className="dish-explorer-close-btn"
                onClick={() => setSelectedDish(null)}
                aria-label="Close dish explorer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="dish-explorer-body">
              <div className="dish-explorer-title-row">
                <div>
                  <h2 className="dish-explorer-title">{selectedDish.name}</h2>
                  <div className="dish-explorer-tags" style={{ marginTop: 8 }}>
                    <span className={`dish-tag-pill ${selectedDish.veg ? 'veg' : 'nonveg'}`}>
                      {selectedDish.veg ? '🟢 Pure Vegetarian' : '🔴 Non-Vegetarian'}
                    </span>
                    {selectedDish.rating && (
                      <span className="dish-tag-pill">⭐ {selectedDish.rating} Rating</span>
                    )}
                    {selectedDish.category && (
                      <span className="dish-tag-pill">
                        📂 {selectedDish.category.replace('-', ' ').toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="dish-explorer-price">₹{selectedDish.price}</div>
              </div>

              {/* Description */}
              <div>
                <h4 className="dish-explorer-section-title">About this Dish</h4>
                <p className="dish-explorer-desc">
                  {selectedDish.description ||
                    `${selectedDish.name} prepared freshly using time-honored South Indian culinary recipes.`}
                </p>
              </div>

              {/* Real Ingredients when available */}
              {selectedDish.ingredients && (
                <div>
                  <h4 className="dish-explorer-section-title">🌿 Ingredients &amp; Preparation</h4>
                  <div className="dish-explorer-ingredients">{selectedDish.ingredients}</div>
                </div>
              )}

              {/* Portion size & Allergens */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div style={{ background: 'var(--bg)', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>PORTION SIZE</div>
                  <strong style={{ fontSize: 13 }}>Serves 1–2 persons</strong>
                </div>

                {selectedDish.allergens && (
                  <div style={{ background: 'var(--bg)', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>ALLERGEN NOTICE</div>
                    <strong style={{ fontSize: 13, color: '#f59e0b' }}>{selectedDish.allergens}</strong>
                  </div>
                )}
              </div>

              {/* Spice Preference Selection */}
              <div>
                <h4 className="dish-explorer-section-title">🌶️ Spice Preference</h4>
                <div className="dish-spice-options">
                  {['Mild', 'Medium', 'Extra Spicy'].map(sp => (
                    <button
                      key={sp}
                      type="button"
                      className={`dish-spice-btn ${explorerSpice === sp ? 'active' : ''}`}
                      onClick={() => setExplorerSpice(sp)}
                    >
                      {sp === 'Mild' && '🟢 Mild'}
                      {sp === 'Medium' && '🟡 Medium (Standard)'}
                      {sp === 'Extra Spicy' && '🔴 Extra Spicy'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Culinary Add-ons */}
              <div>
                <h4 className="dish-explorer-section-title">✨ Popular Accompaniments</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg)',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>🥣 Extra Onion Raita &amp; Salna</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 13 }}>+₹20</strong>
                      <input
                        type="checkbox"
                        checked={explorerAddons.extraRaita}
                        onChange={e =>
                          setExplorerAddons(prev => ({ ...prev, extraRaita: e.target.checked }))
                        }
                      />
                    </div>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg)',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>🥚 Boiled Country Egg</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 13 }}>+₹15</strong>
                      <input
                        type="checkbox"
                        checked={explorerAddons.boiledEgg}
                        onChange={e =>
                          setExplorerAddons(prev => ({ ...prev, boiledEgg: e.target.checked }))
                        }
                      />
                    </div>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg)',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>🥜 Ghee Roasted Cashews</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 13 }}>+₹30</strong>
                      <input
                        type="checkbox"
                        checked={explorerAddons.gheeRoast}
                        onChange={e =>
                          setExplorerAddons(prev => ({ ...prev, gheeRoast: e.target.checked }))
                        }
                      />
                    </div>
                  </label>
                </div>
              </div>

              {/* Special Cooking Note */}
              <div>
                <h4 className="dish-explorer-section-title">📝 Special Kitchen Instructions</h4>
                <input
                  type="text"
                  className="dish-cooking-note-input"
                  placeholder="e.g. Less oil, make it crispy, serve gravy separately..."
                  value={explorerNote}
                  onChange={e => setExplorerNote(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Sticky Bottom Action Bar */}
            <div className="dish-explorer-footer">
              <div className="dish-explorer-qty-box">
                <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-muted)' }}>
                  QTY:
                </span>
                <div className="living-qty-stepper" style={{ padding: '4px 10px' }}>
                  <button
                    type="button"
                    className="living-stepper-btn"
                    onClick={() => setExplorerQty(Math.max(1, explorerQty - 1))}
                  >
                    −
                  </button>
                  <span className="living-stepper-num" style={{ fontSize: 15 }}>
                    {explorerQty}
                  </span>
                  <button
                    type="button"
                    className="living-stepper-btn"
                    onClick={() => setExplorerQty(explorerQty + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="dish-explorer-cta-btn"
                onClick={handleExplorerAddToCart}
              >
                <span>Add to Cart</span>
                <span style={{ fontFamily: 'monospace', fontSize: 16 }}>
                  ₹
                  {(selectedDish.price +
                    (explorerAddons.extraRaita ? 20 : 0) +
                    (explorerAddons.boiledEgg ? 15 : 0) +
                    (explorerAddons.gheeRoast ? 30 : 0)) *
                    explorerQty}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. STICKY BOTTOM CART BAR (Floating Drawer when items added)
          ===================================================================== */}
      {cartTotalQty > 0 && (
        <aside className="living-sticky-cart-bar">
          <div className="living-cart-info">
            <div className="living-cart-icon-bubble">🛒</div>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800 }}>
                {restaurant.name}
              </div>
              <strong style={{ fontSize: 15, color: '#f8fafc' }}>
                {cartTotalQty} {cartTotalQty === 1 ? 'Dish' : 'Dishes'} • ₹{cartTotalPrice}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="living-cart-checkout-btn"
            onClick={() => navigate('/cart')}
          >
            <span>View Cart</span>
            <span>→</span>
          </button>
        </aside>
      )}
    </div>
  );
}
