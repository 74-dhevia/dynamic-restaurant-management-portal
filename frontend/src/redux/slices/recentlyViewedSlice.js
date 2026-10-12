import { createSlice } from '@reduxjs/toolkit';
function load() { try { return JSON.parse(localStorage.getItem('zestro_recent')) || []; } catch { return []; } }
function persist(v) { localStorage.setItem('zestro_recent', JSON.stringify(v)); }

const recentlyViewedSlice = createSlice({
  name: 'recentlyViewed',
  initialState: { items: load() },
  reducers: {
    addRecentlyViewed(state, action) {
      state.items = [action.payload, ...state.items.filter(i => i.id !== action.payload.id)].slice(0, 10);
      persist(state.items);
    },
    clearRecentlyViewed(state) { state.items = []; persist([]); },
  },
});
export const { addRecentlyViewed, clearRecentlyViewed } = recentlyViewedSlice.actions;
export default recentlyViewedSlice.reducer;
