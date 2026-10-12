/**
 * Review API Service for ZESTRO Operations Center (Part 8: Reviews & Ratings).
 * 
 * Provides an abstracted data access layer for customer reviews and rating analytics.
 * BACKEND PREPARATION:
 *   GET    /api/reviews
 *   GET    /api/reviews/:id
 *   PATCH  /api/reviews/:id/status
 */

const STORAGE_REVIEWS = 'zestro_reviews';
const STORAGE_ORDERS = 'zestro_orders';
const STORAGE_BOOKINGS = 'zestro_bookings';

export const REVIEW_STATUSES = ['Published', 'Hidden', 'Flagged'];

export const SEED_REVIEWS = [
  {
    id: 'rev_dheiva_biryani',
    userId: 'u_dheiva',
    userName: 'Dheiva',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    restaurantName: 'Dindigul Thalappakatti',
    foodName: 'Chicken Biryani',
    rating: 5,
    comment: 'Very tasty and fresh',
    date: '2026-09-26',
    dateFormatted: '26 Sep',
    orderId: 'ZST-1024',
    status: 'Published',
  },
  {
    id: 'rev_dheiva_idli',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    restaurantName: 'A2B - Adyar Ananda Bhavan',
    foodName: 'Ghee Podi Idli',
    rating: 5,
    comment: 'Phenomenal aroma and softness! Absolutely authentic South Indian breakfast.',
    date: '2026-09-24',
    dateFormatted: '24 Sep',
    orderId: 'ZST-1017',
    status: 'Published',
  },
  {
    id: 'rev_priya_biryani',
    userId: 'u_priya',
    userName: 'Priya Sharma',
    customerName: 'Priya Sharma',
    userEmail: 'priya@example.com',
    restaurantName: 'Dindigul Thalappakatti',
    foodName: 'Thalappakatti Mutton Biriyani',
    rating: 5,
    comment: 'The Seeraga Samba rice and tender mutton were spiced to perfection. Best biryani in town!',
    date: '2026-09-23',
    dateFormatted: '23 Sep',
    orderId: 'ZST-1025',
    status: 'Published',
  },
  {
    id: 'rev_rahul_dosa',
    userId: 'u_rahul',
    userName: 'Rahul Verma',
    customerName: 'Rahul Verma',
    userEmail: 'rahul@example.com',
    restaurantName: 'Hotel Saravana Bhavan',
    foodName: 'Special Masala Dosa',
    rating: 4,
    comment: 'Crisp and golden dosa with great coconut and tomato chutneys. Sambar was slightly mild.',
    date: '2026-09-22',
    dateFormatted: '22 Sep',
    status: 'Published',
  },
  {
    id: 'rev_ananya_halwa',
    userId: 'u_ananya',
    userName: 'Ananya Patel',
    customerName: 'Ananya Patel',
    userEmail: 'ananya@example.com',
    restaurantName: 'Sree Annapoorna',
    foodName: 'Tirunelveli Halwa',
    rating: 5,
    comment: 'Mouth-melting wheat halwa with generous pure ghee. Warm packaging was intact.',
    date: '2026-09-20',
    dateFormatted: '20 Sep',
    orderId: 'ZST-1027',
    status: 'Published',
  },
  {
    id: 'rev_vikram_kothu',
    userId: 'u_vikram',
    userName: 'Vikram Singh',
    customerName: 'Vikram Singh',
    userEmail: 'vikram@example.com',
    restaurantName: 'Junior Kuppanna',
    foodName: 'Chicken Kothu Parotta',
    rating: 4,
    comment: 'Good shredded parotta tossed with spicy chicken salna. Very filling portion.',
    date: '2026-09-18',
    dateFormatted: '18 Sep',
    orderId: 'ZST-1015',
    status: 'Published',
  },
  {
    id: 'rev_sneha_soda',
    userId: 'u_sneha',
    userName: 'Sneha Rao',
    customerName: 'Sneha Rao',
    userEmail: 'sneha@example.com',
    restaurantName: 'Dindigul Thalappakatti',
    foodName: 'Lime Soda',
    rating: 3,
    comment: 'Drink was refreshing but could have had slightly less sugar.',
    date: '2026-09-15',
    dateFormatted: '15 Sep',
    status: 'Published',
  },
  {
    id: 'rev_karthik_pepper',
    userId: 'u_karthik',
    userName: 'Karthik Raja',
    customerName: 'Karthik Raja',
    userEmail: 'karthik@example.com',
    restaurantName: 'Junior Kuppanna',
    foodName: 'Pepper Chicken Gravy',
    rating: 2,
    comment: 'Peppercorn was overpowering and gravy was lukewarm by the time it arrived.',
    date: '2026-09-12',
    dateFormatted: '12 Sep',
    status: 'Flagged',
  },
  {
    id: 'rev_anon_paneer',
    userId: 'u_guest_1',
    userName: 'Anonymous Diner',
    customerName: 'Anonymous Diner',
    userEmail: 'guest1@example.com',
    restaurantName: 'ABC Restaurant',
    foodName: 'Paneer 65',
    rating: 1,
    comment: 'Received wrong items and delivery was over 45 minutes late without any notification.',
    date: '2026-09-10',
    dateFormatted: '10 Sep',
    status: 'Hidden',
  },
  {
    id: 'rev_dheiva_chettinad',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    restaurantName: 'ABC Restaurant',
    foodName: 'Chettinad Chicken Gravy',
    rating: 5,
    comment: 'Outstanding authentic Chettinad flavor and perfectly soft butter naans!',
    date: '2026-09-08',
    dateFormatted: '08 Sep',
    orderId: 'ZST-1013',
    status: 'Published',
  },
];

function getStored(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}

function initReviews() {
  const existing = getStored(STORAGE_REVIEWS, null);
  if (!existing || !Array.isArray(existing) || existing.length === 0) {
    setStored(STORAGE_REVIEWS, SEED_REVIEWS);
    return SEED_REVIEWS;
  }
  // Ensure seed reviews exist (merge if missing)
  const existingIds = new Set(existing.map(r => r.id));
  let changed = false;
  const merged = [...existing];
  SEED_REVIEWS.forEach(seed => {
    if (!existingIds.has(seed.id)) {
      merged.push(seed);
      changed = true;
    }
  });
  if (changed) {
    setStored(STORAGE_REVIEWS, merged);
    return merged;
  }
  return existing;
}

export const reviewApiService = {
  /**
   * Check if a review is verified by matching against real orders or bookings
   */
  isReviewVerified(rev, orders = [], bookings = []) {
    if (rev.orderId) {
      const match = orders.find(o => o.id.toLowerCase() === rev.orderId.toLowerCase());
      if (match) return true;
    }

    // Match by user and restaurant / food
    const userMatch = (o) => (
      (rev.userId && o.userId === rev.userId) ||
      (rev.userEmail && (o.userEmail?.toLowerCase() === rev.userEmail.toLowerCase() || o.customerEmail?.toLowerCase() === rev.userEmail.toLowerCase()))
    );

    const hasMatchingOrder = orders.some(o => {
      if (!userMatch(o)) return false;
      const matchRest = (o.restaurantName || '').toLowerCase() === (rev.restaurantName || '').toLowerCase();
      const matchFood = (o.items || []).some(i => (i.name || '').toLowerCase().includes((rev.foodName || '').toLowerCase()));
      return matchRest || matchFood;
    });

    if (hasMatchingOrder) return true;

    const hasMatchingBooking = bookings.some(b => {
      const matchUser = (
        (rev.userId && b.userId === rev.userId) ||
        (rev.userEmail && (b.userEmail?.toLowerCase() === rev.userEmail.toLowerCase() || b.customerEmail?.toLowerCase() === rev.userEmail.toLowerCase()))
      );
      if (!matchUser) return false;
      return (b.restaurantName || '').toLowerCase() === (rev.restaurantName || '').toLowerCase();
    });

    return hasMatchingBooking;
  },

  /**
   * GET /reviews
   */
  async getReviews(filters = {}) {
    const rawReviews = initReviews();
    const orders = getStored(STORAGE_ORDERS, []);
    const bookings = getStored(STORAGE_BOOKINGS, []);

    // Enrich with verified status
    let list = rawReviews.map(r => {
      const verified = this.isReviewVerified(r, orders, bookings);
      return {
        ...r,
        verified,
        status: r.status || 'Published',
      };
    });

    // 1. Search Query across Customer, Restaurant, Food, Review text, Order ID
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(r =>
        (r.userName || r.customerName || '').toLowerCase().includes(q) ||
        (r.restaurantName || '').toLowerCase().includes(q) ||
        (r.foodName || '').toLowerCase().includes(q) ||
        (r.comment || r.text || '').toLowerCase().includes(q) ||
        (r.orderId || '').toLowerCase().includes(q)
      );
    }

    // 2. Rating Filter: All | 5 | 4 | 3 | 2 | 1
    if (filters.rating && filters.rating !== 'all') {
      const targetStar = parseInt(filters.rating, 10);
      list = list.filter(r => (r.rating || r.stars) === targetStar);
    }

    // 3. Verification Filter: All | Verified | Not Verified
    if (filters.verification && filters.verification !== 'all') {
      if (filters.verification === 'verified') {
        list = list.filter(r => r.verified === true);
      } else if (filters.verification === 'not-verified') {
        list = list.filter(r => !r.verified);
      }
    }

    // 4. Status Filter: Published | Hidden | Flagged
    if (filters.status && filters.status !== 'all') {
      list = list.filter(r => (r.status || 'Published').toLowerCase() === filters.status.toLowerCase());
    }

    // 5. Restaurant Filter
    if (filters.restaurant && filters.restaurant !== 'all') {
      list = list.filter(r => (r.restaurantName || '').toLowerCase() === filters.restaurant.toLowerCase());
    }

    // 6. Food Filter
    if (filters.food && filters.food !== 'all') {
      list = list.filter(r => (r.foodName || '').toLowerCase() === filters.food.toLowerCase());
    }

    return list;
  },

  /**
   * GET /reviews/:id
   */
  async getReviewById(id) {
    const all = await this.getReviews();
    return all.find(r => r.id === id) || null;
  },

  /**
   * PATCH /reviews/:id/status
   * Status: Published | Hidden | Flagged
   */
  async updateReviewStatus(id, newStatus) {
    const reviews = initReviews();
    const updated = reviews.map(r => {
      if (r.id === id) {
        return { ...r, status: newStatus };
      }
      return r;
    });
    setStored(STORAGE_REVIEWS, updated);
    return { success: true, id, status: newStatus };
  },

  /**
   * Calculate summary metrics and rating distribution
   */
  async getReviewSummary() {
    const rawReviews = initReviews();
    const orders = getStored(STORAGE_ORDERS, []);
    const bookings = getStored(STORAGE_BOOKINGS, []);

    const total = rawReviews.length;
    if (total === 0) {
      return {
        total: 0,
        avgRating: '0.0',
        star5: 0,
        star4: 0,
        star3: 0,
        star2: 0,
        star1: 0,
        verifiedCount: 0,
        distribution: [
          { star: 5, count: 0, percentage: 0 },
          { star: 4, count: 0, percentage: 0 },
          { star: 3, count: 0, percentage: 0 },
          { star: 2, count: 0, percentage: 0 },
          { star: 1, count: 0, percentage: 0 },
        ],
      };
    }

    let sum = 0;
    let star5 = 0;
    let star4 = 0;
    let star3 = 0;
    let star2 = 0;
    let star1 = 0;
    let verifiedCount = 0;

    rawReviews.forEach(r => {
      const star = r.rating || r.stars || 5;
      sum += star;
      if (star === 5) star5++;
      else if (star === 4) star4++;
      else if (star === 3) star3++;
      else if (star === 2) star2++;
      else if (star === 1) star1++;

      if (this.isReviewVerified(r, orders, bookings)) {
        verifiedCount++;
      }
    });

    const avgRating = (sum / total).toFixed(1);

    const distribution = [
      { star: 5, count: star5, percentage: Math.round((star5 / total) * 100) },
      { star: 4, count: star4, percentage: Math.round((star4 / total) * 100) },
      { star: 3, count: star3, percentage: Math.round((star3 / total) * 100) },
      { star: 2, count: star2, percentage: Math.round((star2 / total) * 100) },
      { star: 1, count: star1, percentage: Math.round((star1 / total) * 100) },
    ];

    return {
      total,
      avgRating,
      star5,
      star4,
      star3,
      star2,
      star1,
      verifiedCount,
      distribution,
    };
  },
};
