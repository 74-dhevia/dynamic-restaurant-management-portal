import { createSlice } from '@reduxjs/toolkit';
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem('zestro_location'));
    return ['Kovilpatti', 'Tirunelveli'].includes(saved) ? saved : 'Kovilpatti';
  } catch {
    return 'Kovilpatti';
  }
}

const userSlice = createSlice({
  name: 'user',
  initialState: { location: load() },
  reducers: {
    setLocation(state, action) {
      state.location = action.payload;
      localStorage.setItem('zestro_location', JSON.stringify(action.payload));
    },
  },
});
export const { setLocation } = userSlice.actions;
export default userSlice.reducer;
