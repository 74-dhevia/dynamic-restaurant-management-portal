import { createSlice } from '@reduxjs/toolkit';
function load() {
  try { return JSON.parse(localStorage.getItem('zestro_rewards')) || { points: 120, history: [], lastSpin: null }; }
  catch { return { points: 120, history: [], lastSpin: null }; }
}
function persist(v) { localStorage.setItem('zestro_rewards', JSON.stringify(v)); }

const rewardSlice = createSlice({
  name: 'reward',
  initialState: load(),
  reducers: {
    addPoints(state, action) {
      state.points += action.payload.amount;
      state.history.unshift({ change: action.payload.amount, reason: action.payload.reason, at: new Date().toISOString() });
      persist(state);
    },
    redeemPoints(state, action) {
      state.points -= action.payload.amount;
      state.history.unshift({ change: -action.payload.amount, reason: 'Redeemed at checkout', at: new Date().toISOString() });
      persist(state);
    },
    setLastSpin(state, action) { state.lastSpin = action.payload; persist(state); },
  },
});
export const { addPoints, redeemPoints, setLastSpin } = rewardSlice.actions;
export default rewardSlice.reducer;
