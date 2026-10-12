import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RESTAURANTS, AREAS } from '../data/mockData';
import { setLocation } from '../redux/slices/userSlice';
import Icon from '../components/Icon';
import LivingRestaurantMenu from '../components/LivingRestaurantMenu';
import { openAiConcierge } from '../components/AiMoodConcierge';

export default function Menu() {
  const dispatch = useDispatch();
  const userLocation = useSelector(s => s.user.location);
  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants);
  const restaurantsData = reduxRestaurants && reduxRestaurants.length > 0 ? reduxRestaurants : RESTAURANTS;

  // Restaurants matching current area (with graceful fallback so menu never empties)
  const areaRestaurants = useMemo(() => {
    const matched = restaurantsData.filter(r => {
      const area = r.area || r.address?.area || r.address?.city;
      return !userLocation || userLocation === 'All' || (area && area.toLowerCase().includes(userLocation.toLowerCase()));
    });
    return matched.length > 0 ? matched : restaurantsData;
  }, [restaurantsData, userLocation]);

  // Helper to extract identifier (supports both mock 'id' and MongoDB '_id')
  const getRestKey = r => r?.id || r?._id || 'r1';

  // Selected restaurant in this area
  const [selectedRestId, setSelectedRestId] = useState(() => {
    return getRestKey(areaRestaurants[0]) || 'r1';
  });

  // Ensure selectedRestId is in the current area if area changes
  useEffect(() => {
    if (areaRestaurants.length > 0 && !areaRestaurants.some(r => getRestKey(r) === selectedRestId)) {
      setSelectedRestId(getRestKey(areaRestaurants[0]));
    }
  }, [userLocation, areaRestaurants, selectedRestId]);

  return (
    <div style={{ maxWidth: '100%', width: '100%', margin: '0 auto', padding: '0 12px', boxSizing: 'border-box' }}>
      {/* Restaurant Switcher Ribbon */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: 'var(--accent)' }}>
            <Icon name="restaurant" size={16} color="var(--accent)" />
            <span>Select Restaurant:</span>
          </div>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', maxWidth: '100%', padding: '2px 0', scrollbarWidth: 'none' }}>
            {areaRestaurants.map(r => {
              const rKey = getRestKey(r);
              const isSelected = selectedRestId === rKey;
              return (
                <button
                  key={rKey}
                  type="button"
                  onClick={() => setSelectedRestId(rKey)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 12.5,
                    fontWeight: 700,
                    border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: isSelected ? 'color-mix(in srgb, var(--accent) 12%, var(--bg-elevated))' : 'var(--bg)',
                    color: isSelected ? 'var(--accent)' : 'var(--text)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <span>{(r.name || 'Restaurant').split(' ')[0]}</span>
                  <span style={{ fontSize: 11, opacity: 0.8 }}>⭐ {r.rating || '4.5'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: Location selector & AI Concierge trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700 }}>
            <Icon name="location" size={14} color="var(--accent)" />
            <span className="muted">City:</span>
            <select
              value={userLocation}
              onChange={e => dispatch(setLocation(e.target.value))}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                fontWeight: 800,
                color: 'var(--accent)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <button
            type="button"
            onClick={() => openAiConcierge()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.22), rgba(232, 84, 42, 0.22))',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 14px rgba(168, 85, 247, 0.25)',
              transition: 'all 0.2s ease',
            }}
            title="Open AI Voice & Mood Butler to auto-curate combos"
          >
            <span>🎙️ AI Butler Curate</span>
          </button>
        </div>
      </div>

      {/* Main Experience: Food-First Living Restaurant Menu */}
      <LivingRestaurantMenu
        restaurantId={selectedRestId}
        onSelectRestaurant={setSelectedRestId}
      />
    </div>
  );
}
