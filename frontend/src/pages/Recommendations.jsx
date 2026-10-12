import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { calculateRecommendations, matchesDietaryPreferences } from '../services/aiApiService';
import SmartDietaryFilter from '../components/SmartDietaryFilter';
import SafeImage from '../components/SafeImage';
import { addToCart } from '../redux/slices/cartSlice';
import { toggleWishlist } from '../redux/slices/wishlistSlice';
import { useToast } from '../contexts/ToastContext';
import Icon from '../components/Icon';

export default function Recommendations() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const userLocation = useSelector(s => s.user.location);
  const currentUser = useSelector(s => s.auth.currentUser);
  const orders = useSelector(s => s.order?.orders || []);
  const recentlyViewed = useSelector(s => s.recentlyViewed?.items || []);
  const wishlist = useSelector(s => s.wishlist?.items || []);

  const [activePreferences, setActivePreferences] = useState([]);
  const [budgetFilter, setBudgetFilter] = useState(null);

  // Compute recommendations
  const recommendationData = useMemo(() => {
    return calculateRecommendations({
      orders,
      recentlyViewed,
      wishlist,
      userLocation,
      dietaryPreferences: activePreferences,
      budgetMax: budgetFilter,
    });
  }, [orders, recentlyViewed, wishlist, userLocation, activePreferences, budgetFilter]);

  const handleTogglePref = (prefId) => {
    setActivePreferences(prev =>
      prev.includes(prefId) ? prev.filter(x => x !== prefId) : [...prev, prefId]
    );
  };

  const handleAddToCart = (food, e) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast('Please sign in to add items to your cart', 'info');
      navigate('/login');
      return;
    }
    const finalPrice = Math.max(0, (food.price || 0) - (food.discount || 0));
    dispatch(addToCart({
      foodId: food.id,
      name: food.name,
      price: finalPrice,
      restaurantId: food.restaurantId,
      restaurantName: food.restaurantName,
      image: food.image,
      qty: 1,
    }));
    showToast(`Added ${food.name} to cart! 🎉`, 'success');
  };

  // Filter food items according to dietary preferences
  const filterList = (items) => {
    return items.filter(f => matchesDietaryPreferences(f, activePreferences));
  };

  const { sections } = recommendationData;

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', paddingBottom: 60, boxSizing: 'border-box' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 15%, var(--bg-elevated)), var(--bg-elevated))',
        border: '1px solid color-mix(in srgb, var(--accent) 30%, var(--border))',
        borderRadius: 20,
        padding: '24px 28px',
        marginBottom: 20,
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'color-mix(in srgb, var(--accent) 12%, var(--bg))', color: 'var(--accent)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
          <span>✨</span>
          <span>ZESTRO AI Recommendation Engine (v1.2)</span>
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800 }}>
          ✨ Recommended For You
        </h1>
        <p className="muted" style={{ margin: 0, fontSize: 14, maxWidth: 640 }}>
          Personalized suggestions based on your ZESTRO order history, wishlist, taste affinities & local restaurant ratings in <strong>{userLocation}</strong>.
        </p>
      </div>

      {/* Smart Dietary Filter Bar */}
      <SmartDietaryFilter
        activePreferences={activePreferences}
        onTogglePreference={handleTogglePref}
        onClearAll={() => setActivePreferences([])}
      />

      {/* ----------------------------------------------------------------------
          Section 1: Based on Your Orders
          ---------------------------------------------------------------------- */}
      {filterList(sections.basedOnOrders).length > 0 && (
        <RecommendationSection
          title="❤️ Based on Your Orders"
          subtitle="Because you enjoyed past orders from our authentic kitchen"
          foods={filterList(sections.basedOnOrders)}
          onAddToCart={handleAddToCart}
          onFoodClick={f => navigate(`/food/${f.id}`)}
        />
      )}

      {/* ----------------------------------------------------------------------
          Section 2: Because You Viewed
          ---------------------------------------------------------------------- */}
      {filterList(sections.becauseViewed).length > 0 && (
        <RecommendationSection
          title="👀 Because You Viewed"
          subtitle="Dishes and restaurants you recently browsed"
          foods={filterList(sections.becauseViewed)}
          onAddToCart={handleAddToCart}
          onFoodClick={f => navigate(`/food/${f.id}`)}
        />
      )}

      {/* ----------------------------------------------------------------------
          Section 3: Popular Near You
          ---------------------------------------------------------------------- */}
      {filterList(sections.popularNearYou).length > 0 && (
        <RecommendationSection
          title="🔥 Popular Near You"
          subtitle={`Most loved bestsellers across ${userLocation}`}
          foods={filterList(sections.popularNearYou)}
          onAddToCart={handleAddToCart}
          onFoodClick={f => navigate(`/food/${f.id}`)}
        />
      )}

      {/* ----------------------------------------------------------------------
          Section 4: You May Also Like
          ---------------------------------------------------------------------- */}
      {filterList(sections.youMayAlsoLike).length > 0 && (
        <RecommendationSection
          title="🍽️ You May Also Like"
          subtitle="Hand-picked culinary matches tailored to your taste profile"
          foods={filterList(sections.youMayAlsoLike)}
          onAddToCart={handleAddToCart}
          onFoodClick={f => navigate(`/food/${f.id}`)}
        />
      )}

      {/* ----------------------------------------------------------------------
          Section 5: Within Your Budget
          ---------------------------------------------------------------------- */}
      {filterList(sections.withinBudget).length > 0 && (
        <RecommendationSection
          title="💰 Within Your Budget"
          subtitle="Top rated value dishes under ₹200"
          foods={filterList(sections.withinBudget)}
          onAddToCart={handleAddToCart}
          onFoodClick={f => navigate(`/food/${f.id}`)}
        />
      )}

      {/* ----------------------------------------------------------------------
          Section 6: New For You
          ---------------------------------------------------------------------- */}
      {filterList(sections.newForYou).length > 0 && (
        <RecommendationSection
          title="🆕 New For You"
          subtitle="Discover new authentic flavors recently added to ZESTRO"
          foods={filterList(sections.newForYou)}
          onAddToCart={handleAddToCart}
          onFoodClick={f => navigate(`/food/${f.id}`)}
        />
      )}
    </div>
  );
}

function RecommendationSection({ title, subtitle, foods, onAddToCart, onFoodClick }) {
  const navigate = useNavigate();

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 800 }}>{title}</h2>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>{subtitle}</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap: 16,
      }}>
        {foods.map(food => (
          <div
            key={food.id}
            className="card food-card"
            style={{ cursor: 'pointer' }}
            onClick={() => onFoodClick(food)}
          >
            <div style={{ position: 'relative' }}>
              <SafeImage
                image={food.image}
                alt={food.name}
                className="food-card-img"
                emoji="🍛"
                category={food.category}
              />
              <span className="rating-chip" style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 11 }}>
                ⭐ {food.rating}
              </span>
              <span style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 10.5,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 12,
              }}>
                {food.recommendationScore}% Match
              </span>
            </div>

            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span className={`veg-dot ${!food.veg ? 'nonveg-dot' : ''}`} />
                <h3 style={{ margin: 0, fontSize: 15 }}>{food.name}</h3>
              </div>
              <p className="muted" style={{ margin: '2px 0 6px', fontSize: 12 }}>
                from <strong>{food.restaurantName}</strong>
              </p>

              {food.primaryReason && (
                <div style={{
                  fontSize: 11,
                  color: 'var(--accent)',
                  background: 'color-mix(in srgb, var(--accent) 10%, var(--bg))',
                  padding: '2px 6px',
                  borderRadius: 6,
                  display: 'inline-block',
                  marginBottom: 8,
                  fontWeight: 600,
                }}>
                  ✨ {food.primaryReason}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span className="price" style={{ fontSize: 16 }}>₹{food.price}</span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={(e) => onAddToCart(food, e)}
                  style={{ padding: '4px 10px', fontSize: 12 }}
                >
                  ADD +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
