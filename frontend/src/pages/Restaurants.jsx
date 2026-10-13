import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CATEGORIES, RESTAURANTS } from '../data/mockData';
import RestaurantCard from '../components/RestaurantCard';
import { restaurantApiService, normalizeRestaurant } from '../services/restaurantApiService';
import { setRestaurants } from '../redux/slices/restaurantSlice';
import { setLocation } from '../redux/slices/userSlice';
import Icon from '../components/Icon';

const PAGE_SIZE = 24;
const AVAILABLE_CITIES = ['Kovilpatti', 'Tirunelveli'];

export default function Restaurants() {
  const dispatch = useDispatch();
  const currentLocation = useSelector(s => s.user?.location) || 'Kovilpatti';
  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants);

  const [restaurantsList, setRestaurantsList] = useState(() => {
    if (Array.isArray(reduxRestaurants) && reduxRestaurants.length > 0) {
      const mergedMap = new Map();
      RESTAURANTS.forEach(r => mergedMap.set(r.name.toLowerCase(), r));
      reduxRestaurants.map(normalizeRestaurant).filter(Boolean).forEach(r => mergedMap.set(r.name.toLowerCase(), r));
      return Array.from(mergedMap.values());
    }
    return RESTAURANTS;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [category, setCategory] = useState(null);
  const [sort, setSort] = useState('rating');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch real restaurants from MongoDB API and merge with full authentic catalog
  const loadRestaurantsFromApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await restaurantApiService.getRestaurants();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const normalized = res.data.map(normalizeRestaurant).filter(Boolean);
        // Merge MongoDB live restaurants with all 30 verified restaurants
        const mergedMap = new Map();
        RESTAURANTS.forEach(r => mergedMap.set(r.name.toLowerCase(), r));
        normalized.forEach(r => mergedMap.set(r.name.toLowerCase(), r));
        const merged = Array.from(mergedMap.values());
        setRestaurantsList(merged);
        dispatch(setRestaurants(merged));
      } else {
        setRestaurantsList(RESTAURANTS);
      }
    } catch (err) {
      console.warn('[Restaurants] Failed to fetch restaurants:', err.message);
      setRestaurantsList(RESTAURANTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurantsFromApi();
  }, []);

  // Sync if Redux updates
  useEffect(() => {
    if (Array.isArray(reduxRestaurants) && reduxRestaurants.length > 0) {
      const mergedMap = new Map();
      RESTAURANTS.forEach(r => mergedMap.set(r.name.toLowerCase(), r));
      reduxRestaurants.map(normalizeRestaurant).filter(Boolean).forEach(r => mergedMap.set(r.name.toLowerCase(), r));
      setRestaurantsList(Array.from(mergedMap.values()));
    }
  }, [reduxRestaurants]);

  // Safe filtered list with null safety & location matching
  const filtered = useMemo(() => {
    if (!Array.isArray(restaurantsList)) return [];

    let list = restaurantsList.filter(r => {
      if (!r || typeof r !== 'object') return false;

      // Location match
      if (currentLocation && currentLocation !== 'All') {
        const locLower = String(currentLocation).toLowerCase();
        const cityMatch = r.city && String(r.city).toLowerCase() === locLower;
        const areaMatch = r.area && String(r.area).toLowerCase() === locLower;
        const addressCityMatch = r.address?.city && String(r.address.city).toLowerCase() === locLower;
        const addressAreaMatch = r.address?.area && String(r.address.area).toLowerCase() === locLower;
        if (!cityMatch && !areaMatch && !addressCityMatch && !addressAreaMatch) {
          return false;
        }
      }

      // Category match
      if (category) {
        const catStr = String(category).toLowerCase();
        const inCats = Array.isArray(r.categories) && r.categories.some(c => String(c).toLowerCase().includes(catStr));
        const inCuisines = Array.isArray(r.cuisineType) && r.cuisineType.some(c => String(c).toLowerCase().includes(catStr));
        const inCuisineText = r.cuisine && String(r.cuisine).toLowerCase().includes(catStr);
        if (!inCats && !inCuisines && !inCuisineText) {
          return false;
        }
      }

      // Search filter
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const matchName = r.name && String(r.name).toLowerCase().includes(q);
        const matchArea = (r.area || r.city) && String(r.area || r.city).toLowerCase().includes(q);
        const matchCuisine = r.cuisine && String(r.cuisine).toLowerCase().includes(q);
        if (!matchName && !matchArea && !matchCuisine) {
          return false;
        }
      }

      return true;
    });

    // Sort safely
    list = [...list].sort((a, b) => {
      if (sort === 'rating') {
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      }
      if (sort === 'price_asc') {
        return (Number(a.priceForTwo) || 0) - (Number(b.priceForTwo) || 0);
      }
      return (Number(a.deliveryTimeMin) || 0) - (Number(b.deliveryTimeMin) || 0);
    });

    return list;
  }, [restaurantsList, currentLocation, category, sort, searchFilter]);

  const activeLocationTitle = currentLocation && currentLocation !== 'All' ? currentLocation : 'Tamil Nadu';

  return (
    <div className="restaurants-page-container" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '16px 16px', boxSizing: 'border-box' }}>
      {/* Header & Location Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800 }}>
            Restaurants in {activeLocationTitle}
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>
            Explore verified authentic dining spots with real-time menus and tables
          </p>
        </div>

        {/* City Filter Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>City:</span>
          {AVAILABLE_CITIES.map(city => (
            <button
              key={city}
              type="button"
              className={`chip ${currentLocation === city ? 'active' : ''}`}
              style={{ padding: '6px 14px', fontSize: 13, borderRadius: 20 }}
              onClick={() => dispatch(setLocation(city))}
            >
              📍 {city}
            </button>
          ))}
          <button
            type="button"
            className={`chip ${currentLocation === 'All' ? 'active' : ''}`}
            style={{ padding: '6px 14px', fontSize: 13, borderRadius: 20 }}
            onClick={() => dispatch(setLocation('All'))}
          >
            🌐 All Areas
          </button>
        </div>
      </div>

      {/* Search & Sort Controls */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginBottom: 14,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <input
            type="text"
            className="input"
            placeholder="Search restaurants, cuisines, or dishes..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10 }}
          />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}>🔍</span>
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={{
            padding: '9px 14px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            color: 'var(--text)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          aria-label="Sort restaurants"
        >
          <option value="rating">Sort: Top Rated ★</option>
          <option value="delivery">Sort: Fastest Delivery ⚡</option>
          <option value="price_asc">Sort: Price: Low to High ₹</option>
        </select>
      </div>

      {/* Category Filter Chips */}
      <div className="chip-row" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 18, scrollbarWidth: 'none' }}>
        <button
          type="button"
          className={`chip ${!category ? 'active' : ''}`}
          onClick={() => setCategory(null)}
          style={{ whiteSpace: 'nowrap', borderRadius: 20, padding: '7px 14px', fontSize: 13 }}
        >
          🍽️ All Categories
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            type="button"
            className={`chip ${category === c.id ? 'active' : ''}`}
            onClick={() => setCategory(category === c.id ? null : c.id)}
            style={{ whiteSpace: 'nowrap', borderRadius: 20, padding: '7px 14px', fontSize: 13 }}
          >
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          padding: '14px 18px',
          marginBottom: 16,
          borderRadius: 10,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ color: 'var(--danger)', fontSize: 14 }}>⚠️ {error}</span>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={loadRestaurantsFromApi}
            style={{ padding: '4px 12px', fontSize: 12 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14 }}>Loading verified restaurants from server...</p>
        </div>
      )}

      {/* Empty State: Proper "No restaurants available" message instead of displaying null */}
      {!loading && filtered.length === 0 && (
        <div className="empty-state" style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <span className="emoji" style={{ fontSize: 44, display: 'block', marginBottom: 10 }}>🍽️</span>
          <h2 style={{ fontSize: 20, margin: '0 0 8px', fontWeight: 700 }}>No restaurants available</h2>
          <p className="muted" style={{ margin: '0 0 16px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', fontSize: 14 }}>
            {category || searchFilter
              ? 'No restaurants match your selected filters. Try clearing your search or switching categories.'
              : `There are currently no partner restaurants listed in ${activeLocationTitle}. Check back soon or switch locations.`}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {(category || searchFilter) && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setCategory(null); setSearchFilter(''); }}
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => dispatch(setLocation(currentLocation === 'Kovilpatti' ? 'Tirunelveli' : 'Kovilpatti'))}
            >
              Explore {currentLocation === 'Kovilpatti' ? 'Tirunelveli' : 'Kovilpatti'}
            </button>
          </div>
        </div>
      )}

      {/* Grid of Restaurant Cards */}
      {!loading && filtered.length > 0 && (
        <>
          <div
            className="grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 22,
              width: '100%',
            }}
          >
            {filtered.slice(0, visible).map(r => (
              <RestaurantCard key={r.id || r._id || r.slug} r={r} />
            ))}
          </div>

          {visible < filtered.length && (
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setVisible(v => v + PAGE_SIZE)}
                style={{ padding: '10px 24px', fontWeight: 700, borderRadius: 24 }}
              >
                Load More ({filtered.length - visible} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
