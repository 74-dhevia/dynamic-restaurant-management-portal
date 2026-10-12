import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toggleChat } from '../../redux/slices/chatbotSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import { calculateRecommendations } from '../../services/aiApiService';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/Icon';
import SafeImage from '../../components/SafeImage';

export default function CustomerAssistant() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const userLocation = useSelector(s => s.user.location);
  const currentUser = useSelector(s => s.auth.currentUser);
  const orders = useSelector(s => s.order?.orders || []);
  const recentlyViewed = useSelector(s => s.recentlyViewed?.items || []);
  const wishlist = useSelector(s => s.wishlist?.items || []);

  const [activeBudget, setActiveBudget] = useState(null);
  const [activeMood, setActiveMood] = useState('All');

  const recommendations = useMemo(() => {
    return calculateRecommendations({
      orders,
      recentlyViewed,
      wishlist,
      userLocation,
      dietaryPreferences: activeMood === 'Veg' ? ['veg'] : activeMood === 'Non-Veg' ? ['non-veg'] : [],
      budgetMax: activeBudget,
    });
  }, [orders, recentlyViewed, wishlist, userLocation, activeMood, activeBudget]);

  const handleOpenDineBot = () => {
    dispatch(toggleChat());
  };

  const handleAddToCart = (food) => {
    dispatch(addToCart({
      foodId: food.id,
      name: food.name,
      price: food.price,
      restaurantId: food.restaurantId,
      restaurantName: food.restaurantName,
      image: food.image,
      qty: 1,
    }));
    showToast(`Added ${food.name} to cart! 🎉`, 'success');
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', boxSizing: 'border-box' }}>
      {/* AI Assistant Banner */}
      <div style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 15%, var(--bg-elevated)), var(--bg-elevated))',
        border: '1px solid color-mix(in srgb, var(--accent) 30%, var(--border))',
        borderRadius: 20,
        padding: '24px 28px',
        marginBottom: 24,
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'color-mix(in srgb, var(--accent) 14%, var(--bg))', color: 'var(--accent)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
          <Icon name="sparkles" size={14} color="var(--accent)" />
          <span>ZESTRO AI Dining Assistant &amp; Culinary Concierge</span>
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800 }}>
          Meet Your Personal AI Dining Concierge
        </h1>
        <p className="muted" style={{ margin: '0 0 18px', fontSize: 14, maxWidth: 640 }}>
          Smart suggestions tailored to your budget, dining group, preferred spice levels, and favorite cuisines in <strong>{userLocation}</strong>.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenDineBot}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
          >
            <Icon name="chat" size={17} color="#fff" />
            <span>Chat Live with Ask Zestro Bot</span>
          </button>
          <Link
            to="/plan-dining"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="table" size={16} />
            <span>Plan 3D Dining Experience</span>
          </Link>
        </div>
      </div>

      {/* Budget & Mood Filters */}
      <div className="card" style={{ padding: 18, borderRadius: 14, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
              💰 Budget-Based Suggestions
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Any Budget', value: null },
                { label: 'Under ₹200', value: 200 },
                { label: 'Under ₹400', value: 400 },
                { label: 'Under ₹750', value: 750 },
              ].map(b => (
                <button
                  key={String(b.value)}
                  type="button"
                  className={`btn btn-sm ${activeBudget === b.value ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveBudget(b.value)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
              🥗 Dietary / Mood Alignment
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {['All', 'Veg', 'Non-Veg'].map(m => (
                <button
                  key={m}
                  type="button"
                  className={`btn btn-sm ${activeMood === m ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveMood(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Dishes */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="food" size={20} color="var(--accent)" />
            <span>AI Food Suggestions {activeBudget ? `(Under ₹${activeBudget})` : ''}</span>
          </h2>
          <span className="muted" style={{ fontSize: 13 }}>Tuned to your taste history</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {(recommendations?.sections?.[0]?.items || []).slice(0, 4).map((f, i) => (
            <div key={f.id || i} className="card" style={{ padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SafeImage src={f.image} alt={f.name} style={{ width: '100%', height: 130, borderRadius: 10, objectFit: 'cover' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                <strong style={{ fontSize: 14 }}>{f.name}</strong>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)' }}>₹{f.price}</span>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>{f.restaurantName || 'Zestro Kitchen'}</span>
              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm btn-block"
                  onClick={() => handleAddToCart(f)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Booking Assistance */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="table" size={20} color="var(--accent)" />
            <span>AI Table Reservation Assistance</span>
          </h2>
          <span className="muted" style={{ fontSize: 13 }}>Optimized seating &amp; fast PIN check-in</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {[
            { name: 'Annapoorna Mess', cuisine: 'Authentic Veg & Tiffin', timing: 'Fastest Table in 15 mins', id: 'r1' },
            { name: 'Dindigul Thalappakatti', cuisine: 'Biriyani & Grills', timing: 'Popular Evening Dinner Seating', id: 'r2' },
          ].map(r => (
            <div key={r.id} className="card" style={{ padding: 18, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <strong style={{ fontSize: 15, display: 'block' }}>{r.name}</strong>
                <span className="muted" style={{ fontSize: 12 }}>{r.cuisine}</span>
                <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, marginTop: 4 }}>
                  ⚡ {r.timing}
                </div>
              </div>
              <Link to={`/book-table/${r.id}`} className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
                Book Table
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
