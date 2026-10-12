import { createSlice } from '@reduxjs/toolkit';

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState: {
    isOpen: false,
    messages: [{ from: 'bot', text: "Hi! I'm DineBot 🤖 — tell me your mood or budget, like \"I have ₹500 and I'm very hungry\"." }],
  },
  reducers: {
    toggleChat(state) { state.isOpen = !state.isOpen; },
    openChat(state) { state.isOpen = true; },
    closeChat(state) { state.isOpen = false; },
    addMessage(state, action) { state.messages.push(action.payload); },
    resetChat(state) { state.messages = [state.messages[0]]; },
  },
});
export const { toggleChat, openChat, closeChat, addMessage, resetChat } = chatbotSlice.actions;
export default chatbotSlice.reducer;
