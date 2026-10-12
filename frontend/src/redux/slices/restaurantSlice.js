import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RESTAURANTS } from '../../data/mockData';
import { restaurantApiService, normalizeRestaurant } from '../../services/restaurantApiService';

// Enrich initial restaurants with full management attributes
const ENHANCED_SEED_RESTAURANTS = RESTAURANTS.map(r => ({
  ...r,
  status: r.status || 'Open',
  cuisine: r.cuisine || (Array.isArray(r.categories) ? r.categories.map(c => c.replace(/-/g, ' ')).join(', ') : 'South Indian, Multi-Cuisine'),
  phone: r.phone || '+91 98765 43210',
  email: r.email || `contact@${r.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
  seatingCapacity: r.seatingCapacity || (r.tables ? r.tables.length * 4 : 32),
  description: r.description || `Famous authentic restaurant in ${r.area} known for delicious quality dining and traditional hospitality.`,
  openingTime: r.openHour !== undefined ? `${String(r.openHour).padStart(2, '0')}:00` : '07:00',
  closingTime: r.closeHour !== undefined ? `${String(r.closeHour).padStart(2, '0')}:00` : '22:00',
}));

function loadRestaurants() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = JSON.parse(window.localStorage.getItem('zestro_admin_restaurants'));
      if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored.map(normalizeRestaurant).filter(Boolean);
      }
      window.localStorage.setItem('zestro_admin_restaurants', JSON.stringify(ENHANCED_SEED_RESTAURANTS));
    }
    return ENHANCED_SEED_RESTAURANTS;
  } catch {
    return ENHANCED_SEED_RESTAURANTS;
  }
}

function persist(restaurants) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('zestro_admin_restaurants', JSON.stringify(restaurants));
    }
  } catch (e) {
    console.error('Failed to persist restaurants:', e);
  }
}

export const fetchRestaurants = createAsyncThunk(
  'restaurant/fetchRestaurants',
  async (params, { rejectWithValue }) => {
    try {
      const res = await restaurantApiService.getRestaurants(params);
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
      return rejectWithValue(res.error || 'Failed to fetch restaurants');
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState: {
    restaurants: loadRestaurants(),
    loading: false,
    error: null,
  },
  reducers: {
    setRestaurants(state, action) {
      if (Array.isArray(action.payload)) {
        state.restaurants = action.payload.map(normalizeRestaurant).filter(Boolean);
        persist(state.restaurants);
      }
    },
    addRestaurant(state, action) {
      const newRestaurant = normalizeRestaurant({
        id: `r_${Date.now()}`,
        rating: '4.5',
        ratingCount: 1,
        priceForTwo: 350,
        status: 'Open',
        hasTableBooking: true,
        hasPreOrder: true,
        tables: Array.from({ length: 8 }, (_, t) => ({
          id: `T${t + 1}`,
          label: `T${t + 1}`,
          status: 'free',
        })),
        ...action.payload,
      });
      state.restaurants.unshift(newRestaurant);
      persist(state.restaurants);
    },
    updateRestaurant(state, action) {
      const { id, ...changes } = action.payload;
      const idx = state.restaurants.findIndex(r => r.id === id || r._id === id);
      if (idx !== -1) {
        state.restaurants[idx] = normalizeRestaurant({ ...state.restaurants[idx], ...changes });
        persist(state.restaurants);
      }
    },
    deleteRestaurant(state, action) {
      state.restaurants = state.restaurants.filter(r => r.id !== action.payload && r._id !== action.payload);
      persist(state.restaurants);
    },
    updateRestaurantStatus(state, action) {
      const { id, status } = action.payload;
      const target = state.restaurants.find(r => r.id === id || r._id === id);
      if (target) {
        target.status = status;
        persist(state.restaurants);
      }
    },
    toggleRestaurantStatus(state, action) {
      const id = action.payload;
      const target = state.restaurants.find(r => r.id === id || r._id === id);
      if (target) {
        const statuses = ['Open', 'Closed', 'Busy', 'Temporarily Unavailable'];
        const currentIdx = statuses.indexOf(target.status);
        target.status = statuses[(currentIdx + 1) % statuses.length];
        persist(state.restaurants);
      }
    },
    updateTableStatus(state, action) {
      const { restaurantId, tableId, status } = action.payload;
      const target = state.restaurants.find(r => r.id === restaurantId || r._id === restaurantId);
      if (target) {
        if (!target.tables || !target.tables.length) {
          target.tables = Array.from({ length: 8 }, (_, t) => ({ id: `T${t + 1}`, label: `T${t + 1}`, status: 'Available' }));
        }
        const tbl = target.tables.find(t => t.id === tableId || t.label === tableId);
        if (tbl) {
          tbl.status = status;
          persist(state.restaurants);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          state.restaurants = action.payload;
          persist(state.restaurants);
        }
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setRestaurants,
  addRestaurant,
  updateRestaurant,
  deleteRestaurant,
  updateRestaurantStatus,
  toggleRestaurantStatus,
  updateTableStatus,
} = restaurantSlice.actions;

export default restaurantSlice.reducer;
