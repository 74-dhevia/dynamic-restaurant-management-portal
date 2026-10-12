import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage } from '../redux/slices/chatbotSlice';
import { queryAskZestro } from '../services/aiApiService';
import { FOODS, RESTAURANTS } from '../data/mockData';

export function useChatbot() {
  const dispatch = useDispatch();
  const reduxFoods = useSelector(s => s.food?.foods || FOODS);
  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants || RESTAURANTS);
  const orders = useSelector(s => s.order?.orders || []);
  const userLocation = useSelector(s => s.user?.location || 'Kovilpatti');

  const sendMessage = useCallback((text) => {
    dispatch(addMessage({ from: 'user', text }));

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
