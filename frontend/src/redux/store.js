import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import orderReducer from './slices/orderSlice';
import bookingReducer from './slices/bookingSlice';
import wishlistReducer from './slices/wishlistSlice';
import recentlyViewedReducer from './slices/recentlyViewedSlice';
import reviewReducer from './slices/reviewSlice';
import notificationReducer from './slices/notificationSlice';
import rewardReducer from './slices/rewardSlice';
import voucherReducer from './slices/voucherSlice';
import chatbotReducer from './slices/chatbotSlice';
import userReducer from './slices/userSlice';
import foodReducer from './slices/foodSlice';
import chefReducer from './slices/chefSlice';
import activityReducer from './slices/activitySlice';
import restaurantReducer from './slices/restaurantSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    order: orderReducer,
    booking: bookingReducer,
    wishlist: wishlistReducer,
    recentlyViewed: recentlyViewedReducer,
    review: reviewReducer,
    notification: notificationReducer,
    reward: rewardReducer,
    voucher: voucherReducer,
    chatbot: chatbotReducer,
    user: userReducer,
    food: foodReducer,
    chef: chefReducer,
    activity: activityReducer,
    restaurant: restaurantReducer,
  },
});

export default store;
