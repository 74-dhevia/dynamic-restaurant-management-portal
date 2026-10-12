import { createSlice } from '@reduxjs/toolkit';

export const DEFAULT_VOUCHERS = [
  { code: 'ZESTRO50', desc: '50% Flat Off up to ₹200 on all artisanal feasts', minOrder: 399, usesLeft: 5, discount: 50, type: 'percent', badge: '🔥 HOT' },
  { code: 'FEAST100', desc: 'Flat ₹100 Off on orders above ₹599', minOrder: 599, usesLeft: 3, discount: 100, type: 'flat', badge: '🎉 POPULAR' },
  { code: 'WEEKEND25', desc: '25% Off on premium table dining & pre-orders', minOrder: 799, usesLeft: 4, discount: 25, type: 'percent', badge: '✨ WEEKEND' },
  { code: 'SWEETTREAT', desc: 'Complimentary dessert with orders above ₹499', minOrder: 499, usesLeft: 2, discount: 50, type: 'flat', badge: '🍰 DESSERT' },
  { code: 'BIRYANI40', desc: '₹40 Instant Cashback on authentic Chettinad Biriyani', minOrder: 299, usesLeft: 10, discount: 40, type: 'flat', badge: '🍗 SPECIAL' },
];

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem('zestro_vouchers'));
    if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    return DEFAULT_VOUCHERS;
  } catch {
    return DEFAULT_VOUCHERS;
  }
}

function persist(v) {
  try {
    localStorage.setItem('zestro_vouchers', JSON.stringify(v));
  } catch (err) {
    console.warn('Failed to save vouchers:', err);
  }
}

const voucherSlice = createSlice({
  name: 'voucher',
  initialState: { vouchers: load() },
  reducers: {
    addVoucher(state, action) {
      state.vouchers.push(action.payload);
      persist(state.vouchers);
    },
    updateVoucher(state, action) {
      const idx = state.vouchers.findIndex(v => v.code === action.payload.code);
      if (idx >= 0) state.vouchers[idx] = action.payload;
      persist(state.vouchers);
    },
    deleteVoucher(state, action) {
      state.vouchers = state.vouchers.filter(v => v.code !== action.payload);
      persist(state.vouchers);
    },
    useVoucher(state, action) {
      const v = state.vouchers.find(v => v.code === action.payload);
      if (v && v.usesLeft > 0) v.usesLeft -= 1;
      persist(state.vouchers);
    },
  },
});

export const { addVoucher, updateVoucher, deleteVoucher, useVoucher } = voucherSlice.actions;
export default voucherSlice.reducer;
