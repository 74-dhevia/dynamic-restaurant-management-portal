import { createSlice } from '@reduxjs/toolkit';
import { FOODS } from '../../data/mockData';

// Enhanced initial food items with full management metadata
const ENHANCED_SEED_FOODS = FOODS.map(f => ({
  ...f,
  discount: f.isBestseller ? 15 : 0,
  prepTimeMin: f.category.includes('biriyani') ? 25 : f.category.includes('dosa') ? 12 : 15,
  spiceLevel: f.spicy ? 'Hot' : 'Medium',
  ingredients: f.veg
    ? 'Fresh Farm Vegetables, Cold-pressed Sesame Oil, Curry Leaves, Traditional Spice Blend'
    : 'Farm Fresh Meat/Poultry, Authentic Country Spices, Ghee, Mint Leaves, Basmati/Seeraga Samba Rice',
  allergens: f.veg ? 'Dairy (Ghee/Paneer)' : 'Eggs, Dairy',
  available: true,
  status: 'active',
  createdDate: '2024-01-20',
}));

function loadFoods() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = JSON.parse(window.localStorage.getItem('zestro_foods'));
      const isOutdated = !stored || !Array.isArray(stored) || stored.length === 0 ||
        !stored.some(f => f.name === 'Sambar Rice' && f.restaurantId === 'r1') ||
        stored.some(f => f.restaurantName?.includes('Kaveri Veg') || f.restaurantName?.includes('Kovilpatti Kaaram'));
      if (stored && Array.isArray(stored) && !isOutdated) {
        return stored;
      }
      window.localStorage.setItem('zestro_foods', JSON.stringify(ENHANCED_SEED_FOODS));
    }
    return ENHANCED_SEED_FOODS;
  } catch {
    return ENHANCED_SEED_FOODS;
  }
}

function persist(foods) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('zestro_foods', JSON.stringify(foods));
    }
  } catch (e) {
    console.error('Failed to persist foods:', e);
  }
}

const foodSlice = createSlice({
  name: 'food',
  initialState: {
    foods: loadFoods(),
  },
  reducers: {
    addFood(state, action) {
      const newFood = {
        id: `f_${Date.now()}`,
        status: 'active',
        available: true,
        rating: '4.8',
        ratingCount: 1,
        createdDate: new Date().toISOString().slice(0, 10),
        discount: 0,
        prepTimeMin: 15,
        ...action.payload,
      };
      state.foods.unshift(newFood);
      persist(state.foods);
    },
    updateFood(state, action) {
      const { id, ...changes } = action.payload;
      const idx = state.foods.findIndex(f => f.id === id);
      if (idx !== -1) {
        state.foods[idx] = { ...state.foods[idx], ...changes };
        persist(state.foods);
      }
    },
    deleteFood(state, action) {
      state.foods = state.foods.filter(f => f.id !== action.payload);
      persist(state.foods);
    },
    toggleFoodAvailability(state, action) {
      const item = state.foods.find(f => f.id === action.payload);
      if (item) {
        item.available = !item.available;
        persist(state.foods);
      }
    },
    setFoodAvailability(state, action) {
      const { id, available } = action.payload;
      const item = state.foods.find(f => f.id === id);
      if (item) {
        item.available = !!available;
        persist(state.foods);
      }
    },
    bulkSetFoodAvailability(state, action) {
      const { ids, available } = action.payload;
      if (Array.isArray(ids)) {
        state.foods.forEach(f => {
          if (ids.includes(f.id)) {
            f.available = !!available;
          }
        });
        persist(state.foods);
      }
    },
    toggleFoodStatus(state, action) {
      const item = state.foods.find(f => f.id === action.payload);
      if (item) {
        item.status = item.status === 'active' ? 'deactivated' : 'active';
        if (item.status === 'deactivated') {
          item.available = false;
        }
        persist(state.foods);
      }
    },
    deactivateFood(state, action) {
      const item = state.foods.find(f => f.id === action.payload);
      if (item) {
        item.status = 'deactivated';
        item.available = false;
        persist(state.foods);
      }
    },
  },
});

export const {
  addFood,
  updateFood,
  deleteFood,
  toggleFoodAvailability,
  setFoodAvailability,
  bulkSetFoodAvailability,
  toggleFoodStatus,
  deactivateFood,
} = foodSlice.actions;

export default foodSlice.reducer;
