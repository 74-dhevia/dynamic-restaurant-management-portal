import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import SafeImage from './SafeImage';
import { addToCart } from '../redux/slices/cartSlice';
import { toggleWishlist } from '../redux/slices/wishlistSlice';
import { useToast } from '../contexts/ToastContext';
import { useLoginModal } from '../contexts/LoginModalContext';

export default function FoodCard({ food }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { openLoginToOrderModal } = useLoginModal();
  const currentUser = useSelector(s => s.auth.currentUser);
  const isWished = useSelector(s => s.wishlist.items.some(i => i.id === food.id));
  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants || []);
  const restaurant = reduxRestaurants.find(r => r.id === food.restaurantId);

  // Availability & Status checks (Requirements 4, 14, 21)
  const isFoodAvailable = food.available !== false && food.status !== 'deactivated';
  const restStatus = restaurant?.status || 'Open';
  const isRestUnavailable = restStatus === 'Temporarily Unavailable' || restStatus === 'Closed';
  const canOrder = isFoodAvailable && !isRestUnavailable;

  const finalPrice = Math.max(0, (food.price || 0) - (food.discount || 0));

  const handleAddToCart = (e) => {
    e.stopPropagation();
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
    if (!canOrder) {
      if (!isFoodAvailable) {
        showToast(`"${food.name}" is currently unavailable and cannot be ordered.`, 'error');
      } else if (isRestUnavailable) {
        showToast(`"${food.restaurantName}" is currently ${restStatus}. Orders cannot be placed.`, 'error');
      }
      return;
    }

    dispatch(addToCart({
      foodId: food.id,
      name: food.name,
      price: finalPrice,
      restaurantId: food.restaurantId,
      restaurantName: food.restaurantName,
      image: food.image,
      qty: 1,
    }));
    showToast(`${food.name} added to cart`, 'success');
  };

  return (
    <div className={`card food-card ${!canOrder ? 'food-card-unavailable' : ''}`}>
      <div style={{ position: 'relative' }} onClick={() => navigate(`/food/${food.id}`)}>
        <SafeImage image={food.image} alt={food.name} className="food-card-img" emoji="🍛"
          style={{ cursor: 'pointer', filter: !canOrder ? 'grayscale(0.6)' : 'none' }} />
        {food.isBestseller && <span className="rating-chip" style={{ position: 'absolute', top: 8, left: 8 }}>🔥 Bestseller</span>}
        {!isFoodAvailable ? (
          <span className="rating-chip" style={{ position: 'absolute', top: 8, left: food.isBestseller ? 90 : 8, background: 'var(--danger)', color: '#fff' }}>
            Currently Unavailable
          </span>
        ) : isRestUnavailable ? (
          <span className="rating-chip" style={{ position: 'absolute', top: 8, left: 8, background: '#e63946', color: '#fff' }}>
            {restStatus}
          </span>
        ) : null}
        <button
          className="icon-btn"
          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.85)', borderRadius: '50%', width: 30, height: 30, fontSize: 15 }}
          onClick={(e) => {
            e.stopPropagation();
            if (!currentUser) {
              showToast('Please sign in to save items to your wishlist', 'info');
              navigate('/login');
              return;
            }
            dispatch(toggleWishlist({ id: food.id, type: 'food', name: food.name, image: food.image }));
          }}
        >{isWished ? '❤️' : '🤍'}</button>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className={`veg-dot ${!food.veg ? 'nonveg-dot' : ''}`}></span>
          <h3 style={{ cursor: 'pointer' }} onClick={() => navigate(`/food/${food.id}`)}>{food.name}</h3>
        </div>
        <p className="muted">{food.restaurantName}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="price">₹{finalPrice}</span>
            {food.discount > 0 && (
              <span className="muted" style={{ textDecoration: 'line-through', fontSize: 12, marginLeft: 6 }}>
                ₹{food.price}
              </span>
            )}
          </div>
          <span className="rating-chip">⭐ {food.rating}</span>
        </div>
        <button
          className={`btn btn-block ${canOrder ? 'btn-primary' : 'btn-outline'}`}
          style={{
            marginTop: 8,
            opacity: canOrder ? 1 : 0.7,
            cursor: canOrder ? 'pointer' : 'not-allowed',
          }}
          disabled={!canOrder}
          onClick={handleAddToCart}
        >
          {!isFoodAvailable
            ? 'Currently Unavailable'
            : isRestUnavailable
            ? `Restaurant ${restStatus}`
            : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
