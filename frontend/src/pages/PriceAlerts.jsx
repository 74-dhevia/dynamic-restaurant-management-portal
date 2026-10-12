import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { detectPriceDrops } from '../services/aiApiService';
import SafeImage from '../components/SafeImage';
import { addToCart } from '../redux/slices/cartSlice';
import { useToast } from '../contexts/ToastContext';
import Icon from '../components/Icon';

export default function PriceAlerts() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const reduxFoods = useSelector(s => s.food?.foods || []);
  const orders = useSelector(s => s.order?.orders || []);
  const userLocation = useSelector(s => s.user.location);
  const currentUser = useSelector(s => s.auth.currentUser);

  const priceDrops = useMemo(() => {
    return detectPriceDrops(reduxFoods, orders).slice(0, 10);
  }, [reduxFoods, orders]);

  const handleOrderNow = (drop) => {
    if (!currentUser) {
      showToast('Please sign in to add items to your cart', 'info');
      navigate('/login');
      return;
    }
    dispatch(addToCart({
      foodId: drop.foodId,
      name: drop.name,
      price: drop.currentPrice,
      restaurantId: drop.restaurantId,
      restaurantName: drop.restaurantName,
      image: drop.image,
      qty: 1,
    }));
    showToast(`Added ${drop.name} at discounted price ₹${drop.currentPrice}! 🎉`, 'success');
    navigate('/cart');
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', paddingBottom: 60, boxSizing: 'border-box' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, #2e9e5b 15%, var(--bg-elevated)), var(--bg-elevated))',
        border: '1px solid color-mix(in srgb, #2e9e5b 30%, var(--border))',
        borderRadius: 20,
        padding: '24px 28px',
        marginBottom: 24,
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(46, 158, 91, 0.12)', color: 'var(--success)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
          <span>🔔</span>
          <span>AI Price Drop Monitor</span>
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800 }}>
          💸 Price Drop Alerts
        </h1>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>
          Real-time price monitoring detects reductions and special promotional drops on your usual favourites in <strong>{userLocation}</strong>.
        </p>
      </div>

      {/* Drops List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {priceDrops.map(drop => (
          <div
            key={drop.foodId}
            className="card"
            style={{
              padding: 20,
              display: 'flex',
              gap: 20,
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              border: '1.5px solid color-mix(in srgb, var(--success) 35%, var(--border))',
            }}
          >
            {/* Left image & details */}
            <div style={{ display: 'flex', gap: 16, minWidth: 260, flex: 1 }}>
              <div style={{ width: 100, height: 100, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
                <SafeImage
                  image={drop.image}
                  alt={drop.name}
                  style={{ width: '100%', height: '100%' }}
                  emoji="🍛"
                  category={drop.category}
                />
              </div>

              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(46, 158, 91, 0.15)', color: 'var(--success)', fontSize: 11.5, fontWeight: 800, padding: '2px 8px', borderRadius: 6, marginBottom: 6 }}>
                  <span>↓</span> ₹{drop.dropAmount} Price Drop ({drop.discountPct}% OFF)
                </div>
                <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>{drop.name}</h3>
                <p className="muted" style={{ margin: '0 0 8px', fontSize: 13 }}>
                  from <strong>{drop.restaurantName}</strong>
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span className="price" style={{ fontSize: 20 }}>₹{drop.currentPrice}</span>
                  <span className="muted" style={{ textDecoration: 'line-through', fontSize: 14 }}>
                    ₹{drop.previousPrice}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>
                    Save ₹{drop.dropAmount}!
                  </span>
                </div>
              </div>
            </div>

            {/* Price History Table Matching Requirement 7 */}
            <div style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '10px 14px',
              minWidth: 180,
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>
                📈 PRICE HISTORY:
              </div>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '2px 4px' }}>Date</th>
                    <th style={{ padding: '2px 4px', textAlign: 'right' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {drop.history.map((h, i) => (
                    <tr key={i} style={{ borderBottom: i < drop.history.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '4px 4px' }}>{h.date}</td>
                      <td style={{ padding: '4px 4px', textAlign: 'right', fontWeight: i === drop.history.length - 1 ? 800 : 500, color: i === drop.history.length - 1 ? 'var(--success)' : 'inherit' }}>
                        ₹{h.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => navigate(`/food/${drop.foodId}`)}
              >
                View Food
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleOrderNow(drop)}
              >
                Order Now (₹{drop.currentPrice})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
