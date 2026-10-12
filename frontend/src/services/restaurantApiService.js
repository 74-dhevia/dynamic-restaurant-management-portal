/**
 * Restaurant API Service for ZESTRO Operations Center and Explore Restaurants.
 * Connects directly to the real MongoDB Express backend:
 *   GET    /api/restaurants
 *   GET    /api/restaurants/:id
 *   POST   /api/restaurants
 *   PUT    /api/restaurants/:id
 *   DELETE /api/restaurants/:id
 */

import { getToken } from './jwtService';
import { getApiBaseUrl } from './apiConfig';
import { RESTAURANTS } from '../data/mockData';

const STORAGE_KEY = 'zestro_admin_restaurants';

export function normalizeRestaurant(r) {
  if (!r) return null;
  const id = r._id || r.id || '';
  const name = r.name || 'Restaurant';
  const city = r.address?.city || r.city || r.area || 'Kovilpatti';
  const area = r.area || r.address?.area || city;
  const heroImg = r.heroImage || (Array.isArray(r.images) && r.images[0]) || (typeof r.image === 'string' ? r.image : r.image?.src);
  const categories = Array.isArray(r.categories) && r.categories.length > 0
    ? r.categories
    : Array.isArray(r.cuisineType) && r.cuisineType.length > 0
      ? r.cuisineType.map(c => c.toLowerCase().replace(/\s+/g, '-'))
      : ['south-indian'];
  const cuisine = r.cuisine || (Array.isArray(r.cuisineType) ? r.cuisineType.join(', ') : (Array.isArray(r.categories) ? r.categories.join(', ') : 'South Indian'));
  const priceForTwo = r.priceForTwo || (r.priceRange === '₹' ? 180 : r.priceRange === '₹₹₹' ? 550 : 320);

  return {
    ...r,
    id: id || r.slug || 'r1',
    _id: r._id || id,
    name,
    area,
    city,
    image: heroImg || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    heroImage: heroImg || '',
    categories,
    cuisine,
    rating: r.rating || 4.5,
    ratingCount: r.ratingCount || r.totalReviews || 120,
    deliveryTimeMin: r.deliveryTimeMin || 25,
    distanceKm: r.distanceKm || 2.2,
    priceForTwo,
    status: r.status || (r.isActive !== false ? 'Open' : 'Closed'),
    hasTableBooking: r.hasTableBooking ?? true,
    hasPreOrder: r.hasPreOrder ?? true,
    tables: Array.isArray(r.tables) ? r.tables : [],
    menu: Array.isArray(r.menu) ? r.menu : [],
  };
}

function getStoredRestaurants() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('[restaurantApiService] Error loading restaurants:', err);
    return [];
  }
}

function persistRestaurants(restaurants) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants));
  } catch (err) {
    console.error('[restaurantApiService] Error saving restaurants:', err);
  }
}

export const restaurantApiService = {
  /**
   * Fetch all restaurants from backend API with fallback to stored/mock data
   * GET /api/restaurants
   */
  async getRestaurants(params = {}) {
    const API_BASE_URL = getApiBaseUrl();
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.set('search', params.search);
      if (params.cuisine) queryParams.set('cuisine', params.cuisine);
      if (params.city) queryParams.set('city', params.city);
      if (params.sort) queryParams.set('sort', params.sort);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await fetch(`${API_BASE_URL}/restaurants${qs}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          const normalized = json.data.map(normalizeRestaurant).filter(Boolean);
          // If backend returns restaurants, persist them as cache
          if (normalized.length > 0) {
            persistRestaurants(normalized);
            return { success: true, data: normalized, total: normalized.length, source: 'api' };
          }
          // If backend legitimately returned 0 restaurants
          return { success: true, data: [], total: 0, source: 'api' };
        }
      }
    } catch (err) {
      console.warn('[restaurantApiService] API fetch failed, falling back:', err.message);
    }

    // Fallback: cached local restaurants or enhanced seed
    const stored = getStoredRestaurants();
    const fallbackList = (stored && stored.length > 0 ? stored : RESTAURANTS).map(normalizeRestaurant);
    let result = [...fallbackList];

    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(r =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.area && r.area.toLowerCase().includes(q)) ||
        (r.city && r.city.toLowerCase().includes(q)) ||
        (r.cuisine && r.cuisine.toLowerCase().includes(q)) ||
        (Array.isArray(r.categories) && r.categories.some(c => c && c.toLowerCase().includes(q)))
      );
    }

    if (params.status && params.status !== 'all') {
      result = result.filter(r => r.status === params.status);
    }

    if (params.city && params.city !== 'all') {
      const c = params.city.toLowerCase();
      result = result.filter(r => (r.city && r.city.toLowerCase() === c) || (r.area && r.area.toLowerCase() === c));
    }

    return { success: true, data: result, total: result.length, source: 'cache' };
  },

  /**
   * Fetch a single restaurant by ID or slug with menu items
   * GET /api/restaurants/:id
   */
  async getRestaurantById(id) {
    if (!id) return { success: false, error: 'Restaurant ID is required' };
    const API_BASE_URL = getApiBaseUrl();

    try {
      const response = await fetch(`${API_BASE_URL}/restaurants/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          const item = normalizeRestaurant(json.data);
          return { success: true, data: item, source: 'api' };
        }
      }
    } catch (err) {
      console.warn('[restaurantApiService] Single restaurant API fetch failed:', err.message);
    }

    // Fallback: check stored or seed
    const stored = getStoredRestaurants();
    const fallbackList = (stored && stored.length > 0 ? stored : RESTAURANTS).map(normalizeRestaurant);
    const item = fallbackList.find(r => r.id === id || r._id === id || r.slug === id);
    if (!item) {
      return { success: false, error: 'Restaurant not found' };
    }
    return { success: true, data: item, source: 'cache' };
  },

  /**
   * Create a new partner restaurant
   * POST /api/restaurants
   */
  async createRestaurant(restData) {
    const API_BASE_URL = getApiBaseUrl();
    const token = getToken();

    try {
      const response = await fetch(`${API_BASE_URL}/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(restData),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          const item = normalizeRestaurant(json.data);
          return { success: true, data: item };
        }
      }
    } catch (err) {
      console.warn('[restaurantApiService] Create restaurant API failed, saving locally:', err.message);
    }

    const list = getStoredRestaurants();
    const newEntry = normalizeRestaurant({
      id: restData.id || `r_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...restData,
    });
    list.unshift(newEntry);
    persistRestaurants(list);
    return { success: true, data: newEntry };
  },

  /**
   * Update restaurant details
   * PUT /api/restaurants/:id
   */
  async updateRestaurant(id, changes) {
    const API_BASE_URL = getApiBaseUrl();
    const token = getToken();

    try {
      const response = await fetch(`${API_BASE_URL}/restaurants/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(changes),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return { success: true, data: normalizeRestaurant(json.data) };
        }
      }
    } catch (err) {
      console.warn('[restaurantApiService] Update restaurant API failed:', err.message);
    }

    const list = getStoredRestaurants();
    const idx = list.findIndex(r => r.id === id || r._id === id);
    if (idx === -1) return { success: false, error: 'Restaurant not found' };

    list[idx] = normalizeRestaurant({ ...list[idx], ...changes, updatedAt: new Date().toISOString() });
    persistRestaurants(list);
    return { success: true, data: list[idx] };
  },

  /**
   * Delete restaurant
   * DELETE /api/restaurants/:id
   */
  async deleteRestaurant(id) {
    const API_BASE_URL = getApiBaseUrl();
    const token = getToken();

    try {
      const response = await fetch(`${API_BASE_URL}/restaurants/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const json = await response.json();
        return { success: true, message: json.message || 'Deleted' };
      }
    } catch (err) {
      console.warn('[restaurantApiService] Delete restaurant API failed:', err.message);
    }

    const list = getStoredRestaurants();
    const filtered = list.filter(r => r.id !== id && r._id !== id);
    persistRestaurants(filtered);
    return { success: true, message: 'Deleted locally' };
  },

  /**
   * Update restaurant operational status
   */
  async updateStatus(id, status) {
    return this.updateRestaurant(id, { status });
  },
};

export default restaurantApiService;
