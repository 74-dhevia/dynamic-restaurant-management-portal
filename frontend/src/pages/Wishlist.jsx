import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FOODS, RESTAURANTS } from '../data/mockData';
import FoodCard from '../components/FoodCard';
import RestaurantCard from '../components/RestaurantCard';
import { clearWishlist } from '../redux/slices/wishlistSlice';

export default function Wishlist() {
  const items = useSelector(s => s.wishlist.items);
  const dispatch = useDispatch();

  if (!items.length) return <div className="empty-state"><span className="emoji">🤍</span>Your wishlist is empty. Tap the heart icon on any food or restaurant to save it here.</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>❤️ Wishlist</h1>
        <button className="btn btn-sm btn-secondary" onClick={() => dispatch(clearWishlist())}>Clear All</button>
      </div>
      <div className="grid">
        {items.map(item => item.type === 'restaurant'
          ? <RestaurantCard key={item.id} r={RESTAURANTS.find(r => r.id === item.id) || item} />
          : <FoodCard key={item.id} food={FOODS.find(f => f.id === item.id) || item} />
        )}
      </div>
    </div>
  );
}
