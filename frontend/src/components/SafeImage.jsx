import React, { useState } from 'react';

export const CATEGORY_REAL_FOOD_FALLBACKS = {
  'south-indian': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
  dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
  idli: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
  meals: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80',
  biriyani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
  parotta: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
  'kothu-parotta': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  veg: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
  'non-veg': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
  chinese: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
  'fast-food': 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
  snacks: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  'tea-coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  'fresh-juice': 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80',
  desserts: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
  seafood: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
  default: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
};

export default function SafeImage({ image, src, alt, className = '', category, style, emoji, ...props }) {
  const rawImage = image || src;
  const primarySrc = typeof rawImage === 'string' && rawImage.trim().length > 0 ? rawImage : rawImage?.src;
  const secondarySrc = typeof rawImage === 'object' ? rawImage?.fallback : null;
  const categoryFallback = (category && CATEGORY_REAL_FOOD_FALLBACKS[category]) || CATEGORY_REAL_FOOD_FALLBACKS.default;

  const sources = [primarySrc, secondarySrc, categoryFallback, CATEGORY_REAL_FOOD_FALLBACKS.default].filter(Boolean);
  const [srcIndex, setSrcIndex] = useState(0);

  const currentSrc = sources[srcIndex] || CATEGORY_REAL_FOOD_FALLBACKS.default;

  const handleOnError = () => {
    if (srcIndex < sources.length - 1) {
      setSrcIndex(prev => prev + 1);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt || 'Authentic food'}
      className={className}
      style={{ objectFit: 'cover', ...style }}
      loading="lazy"
      onError={handleOnError}
      {...props}
    />
  );
}
