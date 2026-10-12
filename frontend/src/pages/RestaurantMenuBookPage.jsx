import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LivingRestaurantMenu from '../components/LivingRestaurantMenu';

export default function RestaurantMenuBookPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '85vh', width: '100%', maxWidth: '100%', margin: 0, padding: 0, boxSizing: 'border-box' }}>
      <LivingRestaurantMenu
        restaurantId={restaurantId}
        onSelectRestaurant={(newRestId) => navigate(`/restaurant/${newRestId}/menu`)}
      />
    </div>
  );
}
