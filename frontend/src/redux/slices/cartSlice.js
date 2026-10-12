import { createSlice } from '@reduxjs/toolkit';

function load() {
  try { return JSON.parse(localStorage.getItem('zestro_cart')) || []; } catch { return []; }
}
function persist(items) { localStorage.setItem('zestro_cart', JSON.stringify(items)); }

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: load(), // {foodId, name, price, qty, restaurantId, restaurantName, image}
    coupon: null,
    redeemPoints: 0,
  },
  reducers: {
    addToCart(state, action) {
      const item = action.payload;
      if (item.available === false) return;
      const existing = state.items.find(i => i.foodId === item.foodId);
      // enforce single-restaurant cart
      if (state.items.length && state.items[0].restaurantId !== item.restaurantId) {
        state.items = [];
      }
      const again = state.items.find(i => i.foodId === item.foodId);
      if (again) again.qty += item.qty || 1;
      else state.items.push({ ...item, qty: item.qty || 1 });
      persist(state.items);
    },
    incQty(state, action) {
      const it = state.items.find(i => i.foodId === action.payload);
      if (it) it.qty += 1;
      persist(state.items);
    },
    decQty(state, action) {
      const it = state.items.find(i => i.foodId === action.payload);
      if (it) { it.qty -= 1; if (it.qty <= 0) state.items = state.items.filter(i => i.foodId !== action.payload); }
      persist(state.items);
    },
    removeFromCart(state, action) {
      state.items = state.items.filter(i => i.foodId !== action.payload);
      persist(state.items);
    },
    clearCart(state) {
      state.items = [];
      state.coupon = null;
      state.redeemPoints = 0;
      persist([]);
    },
    applyCoupon(state, action) { state.coupon = action.payload; },
    removeCoupon(state) { state.coupon = null; },
    setRedeemPoints(state, action) { state.redeemPoints = action.payload; },
  },
});

export const { addToCart, incQty, decQty, removeFromCart, clearCart, applyCoupon, removeCoupon, setRedeemPoints } = cartSlice.actions;
export default cartSlice.reducer;
