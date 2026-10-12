import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage } from '../redux/slices/chatbotSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { queryAskZestro, parseVoiceCommand } from '../services/aiApiService';
import { FOODS, RESTAURANTS } from '../data/mockData';

export function useChatbot() {
  const dispatch = useDispatch();
  const reduxFoods = useSelector(s => s.food?.foods || FOODS);
  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants || RESTAURANTS);
  const orders = useSelector(s => s.order?.orders || []);
  const userLocation = useSelector(s => s.user?.location || 'Kovilpatti');

  const sendMessage = useCallback((text) => {
    dispatch(addMessage({ from: 'user', text }));

    // 1. Direct Voice-to-Cart: automatically add requested dishes to Redux cart!
    const voiceParsed = parseVoiceCommand(text, reduxFoods);
    const isCartIntent = /add|cart|podu|order|venum|kudunga|parcel|eduthuko/i.test(text);

    if (voiceParsed && voiceParsed.intent === 'ORDER_ITEMS' && voiceParsed.items.length > 0 && isCartIntent) {
      voiceParsed.items.forEach(it => {
        dispatch(addToCart({
          foodId: it.food.id || it.food._id,
          name: it.food.name,
          price: it.food.price,
          restaurantId: it.food.restaurantId || 'r1',
          restaurantName: it.food.restaurantName || 'Authentic Kitchen',
          image: it.food.image,
          qty: it.qty || 1,
        }));
      });

      const itemsListStr = voiceParsed.items.map(i => `${i.qty}x ${i.name}`).join(' and ');

      setTimeout(() => {
        dispatch(addMessage({
          from: 'bot',
          text: `🎉 Super! Unga voice command moolama ${itemsListStr} direct-ah Cart-la add panniyachu (Total: ₹${voiceParsed.estimatedTotal})! Neenga ippo Cart open panni checkout pannalaam.`,
          items: voiceParsed.items.map(i => i.food),
          actions: [
            { label: '🛒 View Cart & Checkout', action: 'NAVIGATE', url: '/cart' },
            { label: 'Browse More Dishes', action: 'NAVIGATE', url: '/menu' },
          ],
        }));
      }, 350);
      return;
    }

    // 2. Conversational AI Butler response
    setTimeout(() => {
      const response = queryAskZestro(text, {
        foods: reduxFoods,
        restaurants: reduxRestaurants,
        orders,
        userLocation,
      });

      dispatch(addMessage({
        from: 'bot',
        text: response.text,
        items: response.items,
        restaurants: response.restaurants,
        order: response.order,
        actions: response.actions,
      }));
    }, 450);
  }, [dispatch, reduxFoods, reduxRestaurants, orders, userLocation]);

  return { sendMessage };
}
