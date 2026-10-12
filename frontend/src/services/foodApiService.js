/**
 * Food / Menu API Service for ZESTRO Operations Center (Section 29 Backend Preparation).
 * 
 * Provides an abstracted data access layer for food & menu catalog.
 * When real endpoints are deployed, this service maps directly to:
 *   GET    /api/foods
 *   GET    /api/foods/:id
 *   POST   /api/foods
 *   PATCH  /api/foods/:id
 *   PATCH  /api/foods/:id/availability
 */

const STORAGE_KEY = 'zestro_foods';

function getStoredFoods() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('[foodApiService] Error loading foods:', err);
    return [];
  }
}

function persistFoods(foods) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(foods));
  } catch (err) {
    console.error('[foodApiService] Error saving foods:', err);
  }
}

export const foodApiService = {
  /**
   * Fetch all foods with optional filters
   * Future: GET /api/foods
   */
  async getFoods(params = {}) {
    const list = getStoredFoods();
    let result = [...list];

    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(f =>
        (f.name && f.name.toLowerCase().includes(q)) ||
        (f.restaurantName && f.restaurantName.toLowerCase().includes(q)) ||
        (f.category && f.category.toLowerCase().includes(q)) ||
        (f.description && f.description.toLowerCase().includes(q))
      );
    }

    if (params.restaurantId && params.restaurantId !== 'all') {
      result = result.filter(f => f.restaurantId === params.restaurantId);
    }

    if (params.category && params.category !== 'all') {
      result = result.filter(f => f.category === params.category);
    }

    if (params.available !== undefined && params.available !== 'all') {
      const isAvail = params.available === true || params.available === 'available';
      result = result.filter(f => f.available === isAvail);
    }

    if (params.veg !== undefined && params.veg !== 'all') {
      const isVeg = params.veg === true || params.veg === 'veg';
      result = result.filter(f => !!f.veg === isVeg);
    }

    return { success: true, data: result, total: result.length };
  },

  /**
   * Fetch a single food item by ID
   * Future: GET /api/foods/:id
   */
  async getFoodById(id) {
    const list = getStoredFoods();
    const item = list.find(f => f.id === id);
    if (!item) {
      return { success: false, error: 'Food item not found' };
    }
    return { success: true, data: item };
  },

  /**
   * Create a new food dish
   * Future: POST /api/foods
   */
  async createFood(foodData) {
    const list = getStoredFoods();
    const finalPrice = Math.max(0, (Number(foodData.price) || 0) - (Number(foodData.discount) || 0));
    const newEntry = {
      id: foodData.id || `f_${Date.now()}`,
      status: 'active',
      available: true,
      rating: '4.8',
      ratingCount: 1,
      finalPrice,
      createdDate: new Date().toISOString().slice(0, 10),
      ...foodData,
    };
    list.unshift(newEntry);
    persistFoods(list);
    return { success: true, data: newEntry };
  },

  /**
   * Update food item attributes
   * Future: PATCH /api/foods/:id
   */
  async updateFood(id, changes) {
    const list = getStoredFoods();
    const idx = list.findIndex(f => f.id === id);
    if (idx === -1) return { success: false, error: 'Food item not found' };

    const price = changes.price !== undefined ? Number(changes.price) : Number(list[idx].price);
    const discount = changes.discount !== undefined ? Number(changes.discount) : Number(list[idx].discount || 0);
    const finalPrice = Math.max(0, price - discount);

    list[idx] = {
      ...list[idx],
      ...changes,
      finalPrice,
      updatedAt: new Date().toISOString(),
    };
    persistFoods(list);
    return { success: true, data: list[idx] };
  },

  /**
   * Quick toggle availability
   * Future: PATCH /api/foods/:id/availability
   */
  async updateAvailability(id, available) {
    const list = getStoredFoods();
    const item = list.find(f => f.id === id);
    if (!item) return { success: false, error: 'Food item not found' };

    item.available = !!available;
    item.availabilityUpdatedAt = new Date().toISOString();
    persistFoods(list);
    return { success: true, data: item };
  },

  /**
   * Bulk toggle availability
   */
  async bulkUpdateAvailability(ids, available) {
    const list = getStoredFoods();
    list.forEach(f => {
      if (ids.includes(f.id)) {
        f.available = !!available;
      }
    });
    persistFoods(list);
    return { success: true, count: ids.length };
  },

  /**
   * Deactivate a food item (keeps historical references safe)
   */
  async deactivateFood(id) {
    const list = getStoredFoods();
    const item = list.find(f => f.id === id);
    if (!item) return { success: false, error: 'Food item not found' };

    item.status = 'deactivated';
    item.available = false;
    item.deactivatedAt = new Date().toISOString();
    persistFoods(list);
    return { success: true, data: item };
  },
};

export default foodApiService;
