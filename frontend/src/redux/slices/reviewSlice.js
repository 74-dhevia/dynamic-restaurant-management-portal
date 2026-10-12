import { createSlice } from '@reduxjs/toolkit';
import { SEED_REVIEWS } from '../../services/reviewApiService';

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem('zestro_reviews'));
    if (stored && Array.isArray(stored) && stored.length > 0) {
      const existingIds = new Set(stored.map(r => r.id));
      let changed = false;
      const merged = [...stored];
      SEED_REVIEWS.forEach(seed => {
        if (!existingIds.has(seed.id)) {
          merged.push(seed);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('zestro_reviews', JSON.stringify(merged));
      }
      return merged;
    }
    localStorage.setItem('zestro_reviews', JSON.stringify(SEED_REVIEWS));
    return SEED_REVIEWS;
  } catch {
    return SEED_REVIEWS;
  }
}

function persist(v) {
  try {
    localStorage.setItem('zestro_reviews', JSON.stringify(v));
  } catch (e) {
    console.error(e);
  }
}

const reviewSlice = createSlice({
  name: 'review',
  initialState: { reviews: load() },
  reducers: {
    addReview(state, action) {
      state.reviews.unshift(action.payload);
      persist(state.reviews);
    },
    updateReviewStatus(state, action) {
      const { id, status } = action.payload;
      const review = state.reviews.find(r => r.id === id);
      if (review) {
        review.status = status;
        persist(state.reviews);
      }
    },
    deleteReview(state, action) {
      state.reviews = state.reviews.filter(r => r.id !== action.payload);
      persist(state.reviews);
    },
  },
});

export const { addReview, updateReviewStatus, deleteReview } = reviewSlice.actions;
export default reviewSlice.reducer;

