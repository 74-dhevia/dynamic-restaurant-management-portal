import React from 'react';
import { useNavigate } from 'react-router-dom';
import SafeImage from './SafeImage';

export default function RestaurantCard({ r }) {
  const navigate = useNavigate();
  if (!r || typeof r !== 'object') return null;

  const restId = r.id || r._id || r.slug || '';
  const restName = r.name || 'Restaurant';
  const now = new Date().getHours();
  const isTimeOpen = (r.openHour !== undefined && r.closeHour !== undefined) ? (now >= r.openHour && now < r.closeHour) : true;
  const adminStatus = r.status || (isTimeOpen ? 'Open' : 'Closed');

  const statusBg =
    adminStatus === 'Open' ? 'var(--success)' :
    adminStatus === 'Closed' ? 'var(--danger)' :
    adminStatus === 'Busy' ? '#ffb703' : 'var(--danger)';

  const categoriesList = Array.isArray(r.categories) && r.categories.length > 0
    ? r.categories
    : Array.isArray(r.cuisineType) && r.cuisineType.length > 0
      ? r.cuisineType
      : ['South Indian'];

  const restImage = r.image || r.heroImage || (Array.isArray(r.images) && r.images[0]) || '';
  const locationText = r.area || r.address?.area || r.address?.city || r.city || '';
  const priceText = r.priceForTwo ? `₹${r.priceForTwo} for two` : (r.priceRange || '₹₹');

  const handleClick = () => {
    if (restId) {
      navigate(`/restaurant/${restId}`);
    }
  };

  return (
    <div
      className={`card rest-card ${adminStatus === 'Temporarily Unavailable' ? 'rest-unavailable' : ''}`}
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
      id={`restaurant-card-${restId || 'item'}`}
    >
      <div style={{ position: 'relative' }}>
        <SafeImage
          image={restImage}
          alt={restName}
          className="food-card-img"
          emoji="🏠"
          style={{ filter: adminStatus === 'Temporarily Unavailable' ? 'grayscale(0.5)' : 'none' }}
        />
        {r.offer && (
          <span className="rating-chip" style={{ position: 'absolute', top: 8, left: 8, background: 'var(--accent2)', color: '#3a2a00' }}>
            {r.offer}
          </span>
        )}
        <span className="rating-chip" style={{ position: 'absolute', bottom: 8, right: 8, background: statusBg, color: '#fff' }}>
          {adminStatus}
        </span>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{restName}</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{priceText}</span>
        </div>
        <p className="muted" style={{ margin: '4px 0 8px', fontSize: 13 }}>
          {categoriesList.slice(0, 3).map(c => String(c || '').replace('-', ' ')).join(' • ')}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
          <span className="rating-chip">⭐ {r.rating || 4.5} ({r.ratingCount || r.totalReviews || 120})</span>
          <span className="muted">
            {locationText ? `📍 ${locationText}` : `${r.deliveryTimeMin || 25} min`}
          </span>
        </div>
      </div>
    </div>
  );
}
