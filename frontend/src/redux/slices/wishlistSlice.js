import { createSlice } from '@reduxjs/toolkit';
function load() { try { return JSON.parse(localStorage.getItem('zestro_wishlist')) || []; } catch { return []; } }
function persist(v) { localStorage.setItem('zestro_wishlist', JSON.stringify(v)); }

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { items: load() },
  reducers: {
    toggleWishlist(state, action) {
      const id = action.payload.id;
      const exists = state.items.find(i => i.id === id);
      if (exists) state.items = state.items.filter(i => i.id !== id);
      else state.items.unshift(action.payload);
      persist(state.items);
    },
    clearWishlist(state) { state.items = []; persist([]); },
  },
});
export const { toggleWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
