import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FOODS, RESTAURANTS } from '../data/mockData';
import SafeImage from '../components/SafeImage';
import FoodCard from '../components/FoodCard';
import { addToCart } from '../redux/slices/cartSlice';
import { addRecentlyViewed } from '../redux/slices/recentlyViewedSlice';
import { toggleWishlist } from '../redux/slices/wishlistSlice';
import { useToast } from '../contexts/ToastContext';
import { useLoginModal } from '../contexts/LoginModalContext';

export default function FoodDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { openLoginToOrderModal } = useLoginModal();

  const reduxFoods = useSelector(s => s.food?.foods);
  const foodsData = reduxFoods && reduxFoods.length > 0 ? reduxFoods : FOODS;
  const food = foodsData.find(f => f.id === id);

  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants);
  const restaurantsData = reduxRestaurants && reduxRestaurants.length > 0 ? reduxRestaurants : RESTAURANTS;
  const restaurant = food && restaurantsData.find(r => r.id === food.restaurantId);

  const [qty, setQty] = useState(1);
  const currentUser = useSelector(s => s.auth.currentUser);
  const wished = useSelector(s => s.wishlist.items.some(i => i.id === id));
  const similar = foodsData.filter(f => f.category === food?.category && f.id !== id && f.status !== 'deactivated').slice(0, 4);

  // Availability & status checks
  const isFoodAvailable = food?.available !== false && food?.status !== 'deactivated';
  const restStatus = restaurant?.status || 'Open';
  const isRestUnavailable = restStatus === 'Temporarily Unavailable' || restStatus === 'Closed';
  const canOrder = isFoodAvailable && !isRestUnavailable;

  const finalPrice = food ? Math.max(0, (food.price || 0) - (food.discount || 0)) : 0;

  useEffect(() => {
    if (food) dispatch(addRecentlyViewed({ id: food.id, type: 'food', name: food.name, image: food.image }));
  }, [id, food]); // eslint-disable-line

  if (!food) return <div className="empty-state"><span className="emoji">🔍</span>Food item not found.</div>;

  return (
    <div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <SafeImage image={food.image} className="food-card-img" style={{ height: 260 }} emoji="🍛" />
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h1 style={{ margin: '0 0 4px' }}>
              <span className={`veg-dot ${!food.veg ? 'nonveg-dot' : ''}`}></span> {food.name}
            </h1>
            <button className="icon-btn" onClick={() => {
              if (!currentUser) {
                showToast('Please sign in to save items to your wishlist', 'info');
                navigate('/login', { state: { from: { pathname: `/food/${id}` } } });
                return;
              }
              dispatch(toggleWishlist({ id: food.id, type: 'food', name: food.name, image: food.image }));
            }}>
              {wished ? '❤️' : '🤍'}
            </button>
          </div>
          <p className="muted" onClick={() => navigate(`/restaurant/${food.restaurantId}`)} style={{ cursor: 'pointer' }}>from {food.restaurantName} →</p>
          <p>{food.description}</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '10px 0', flexWrap: 'wrap' }}>
            <span className="rating-chip">⭐ {food.rating}</span>
            {food.isBestseller && <span className="rating-chip" style={{ background: 'var(--accent2)', color: '#3a2a00' }}>🔥 Bestseller</span>}
            {food.spicy && <span className="rating-chip" style={{ background: 'var(--danger)' }}>🌶️ Spicy</span>}
            {!isFoodAvailable ? (
              <span className="rating-chip" style={{ background: 'var(--danger)', color: '#fff' }}>
                Currently Unavailable
              </span>
            ) : isRestUnavailable ? (
              <span className="rating-chip" style={{ background: '#e63946', color: '#fff' }}>
                Restaurant {restStatus}
              </span>
            ) : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '10px 0' }}>
            <h2 className="price" style={{ margin: 0 }}>₹{finalPrice}</h2>
            {food.discount > 0 && (
              <span className="muted" style={{ textDecoration: 'line-through', fontSize: 16 }}>
                ₹{food.price}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <button className="btn btn-secondary" disabled={!canOrder} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <strong>{qty}</strong>
            <button className="btn btn-secondary" disabled={!canOrder} onClick={() => setQty(q => q + 1)}>+</button>
          </div>
          <button
            className={`btn btn-block ${canOrder ? 'btn-primary' : 'btn-outline'}`}
            disabled={!canOrder}
            style={{
              opacity: canOrder ? 1 : 0.7,
              cursor: canOrder ? 'pointer' : 'not-allowed',
            }}
            onClick={() => {
              if (!currentUser) {
                openLoginToOrderModal({
                  id: food.id,
                  name: food.name,
                  price: finalPrice,
                  restaurantId: food.restaurantId,
                  restaurantName: food.restaurantName,
                  image: food.image,
                  veg: food.veg,
                });
                showToast(`🔒 Please log in to order ${food.name}!`, 'info');
                return;
              }
              if (!canOrder) return;
              dispatch(addToCart({ foodId: food.id, name: food.name, price: finalPrice, restaurantId: food.restaurantId, restaurantName: food.restaurantName, image: food.image, qty }));
              showToast(`${qty} × ${food.name} added to cart`, 'success');
              navigate('/cart');
            }}
          >
            {!isFoodAvailable
              ? 'Currently Unavailable'
              : isRestUnavailable
              ? `Restaurant ${restStatus} — Cannot Order`
              : `Add ${qty} to Cart — ₹${finalPrice * qty}`}
          </button>
        </div>
      </div>

      {similar.length > 0 && (
        <div className="section">
          <h2>You might also like</h2>
          <div className="hscroll">{similar.map(f => <FoodCard key={f.id} food={f} />)}</div>
        </div>
      )}
    </div>
  );
}
