import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LivingRestaurantMenu from '../components/LivingRestaurantMenu';

export default function RestaurantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '0', boxSizing: 'border-box' }}>
      <LivingRestaurantMenu
        restaurantId={id}
        onSelectRestaurant={(newRestId) => {
          if (newRestId) navigate(`/restaurant/${newRestId}`);
          else navigate('/restaurants');
        }}
      />
    </div>
  );
}
