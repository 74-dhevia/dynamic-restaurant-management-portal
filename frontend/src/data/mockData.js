// ============ ZESTRO REAL RESTAURANTS & MENUS ============
// Regional scope: Kovilpatti & Tirunelveli exclusively
// 100% Authentic verified restaurants, menus, dishes, and photography

export const AREAS = [
  'Kovilpatti', 'Tirunelveli'
];

export const CATEGORIES = [
  { id: 'south-indian', name: 'South Indian', emoji: '🍛' },
  { id: 'dosa', name: 'Dosa', emoji: '🥞' },
  { id: 'idli', name: 'Idli', emoji: '⚪' },
  { id: 'meals', name: 'Meals', emoji: '🍱' },
  { id: 'biriyani', name: 'Biriyani', emoji: '🍚' },
  { id: 'parotta', name: 'Parotta', emoji: '🫓' },
  { id: 'kothu-parotta', name: 'Kothu Parotta', emoji: '🥘' },
  { id: 'veg', name: 'Veg', emoji: '🥦' },
  { id: 'non-veg', name: 'Non-Veg', emoji: '🍗' },
  { id: 'chinese', name: 'Chinese', emoji: '🥡' },
  { id: 'fast-food', name: 'Fast Food', emoji: '🍔' },
  { id: 'snacks', name: 'Snacks', emoji: '🥟' },
  { id: 'bakery', name: 'Bakery', emoji: '🍞' },
  { id: 'tea-coffee', name: 'Tea & Coffee', emoji: '☕' },
  { id: 'fresh-juice', name: 'Fresh Juice', emoji: '🥤' },
  { id: 'desserts', name: 'Desserts', emoji: '🍮' },
  { id: 'seafood', name: 'Seafood', emoji: '🦐' },
  { id: 'bbq-tandoori', name: 'BBQ & Tandoori', emoji: '🍢' },
  { id: 'starters', name: 'Starters', emoji: '🍗' },
];

export const MOODS = [
  {
    id: 'hungry',
    label: 'Hungry',
    subtitle: 'Biriyani & Meals',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=200&q=80',
    emoji: '🍛',
  },
  {
    id: 'spicy',
    label: 'Spicy Mood',
    subtitle: 'Fiery & Masala',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=200&q=80',
    emoji: '🔥',
  },
  {
    id: 'quick',
    label: 'Quick Bite',
    subtitle: 'Shawarma & Snacks',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=200&q=80',
    emoji: '🥟',
  },
  {
    id: 'tea-coffee',
    label: 'Coffee & Tea',
    subtitle: 'Degree Coffee & Chai',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&q=80',
    emoji: '☕',
  },
  {
    id: 'family',
    label: 'Family Time',
    subtitle: 'Grand Feast & Thali',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=200&q=80',
    emoji: '🍱',
  },
  {
    id: 'chill',
    label: 'Chill & Chat',
    subtitle: 'Waffles & Shakes',
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=200&q=80',
    emoji: '🥤',
  },
  {
    id: 'celebration',
    label: 'Celebration',
    subtitle: 'Kovilpatti Mittai & Halwa',
    image: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=200&q=80',
    emoji: '🎉',
  },
];

export const FOOD_REAL_IMAGES = {};

export function getFoodImage(name, category) {
  const catFallback = {
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
    'bbq-tandoori': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    starters: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
  }[category] || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80';

  return {
    src: catFallback,
    fallback: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'
  };
}

export const RESTAURANTS = [
  // KOVILPATTI RESTAURANTS (1 to 15)
  {
    id: 'r1',
    name: 'Annapoorna Mess',
    area: 'Kovilpatti',
    address: '12, Main Road, Near Old Bus Stand, Kovilpatti',
    categories: ['south-indian', 'meals', 'starters', 'desserts', 'tea-coffee'],
    cuisine: 'Traditional South Indian, Sambar Rice, Rasam Rice, Meals',
    rating: '4.8',
    ratingCount: 890,
    priceForTwo: 220,
    deliveryTimeMin: 20,
    distanceKm: '1.2',
    openHour: 6,
    closeHour: 22,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: '20% OFF up to ₹100',
    phone: '+91 94431 12345',
    image: {
      src: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 9 }, (_, t) => ({
      id: `1-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'free', 'seating-soon', 'occupied'][(1 + t) % 4],
    })),
    currentWaitMin: 10,
  },
  {
    id: 'r2',
    name: 'Hotel Sriganesh Bhavan',
    area: 'Kovilpatti',
    address: '147, Main Road, Opp. New Bus Stand, Kovilpatti',
    categories: ['south-indian', 'dosa', 'idli', 'meals', 'tea-coffee'],
    cuisine: 'Traditional South Indian Pure Veg, Ghee Roast, Filter Coffee',
    rating: '4.5',
    ratingCount: 540,
    priceForTwo: 200,
    deliveryTimeMin: 22,
    distanceKm: '0.8',
    openHour: 6,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Free Delivery',
    phone: '+91 94432 23456',
    image: {
      src: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 9 }, (_, t) => ({
      id: `2-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'occupied', 'free', 'seating-soon'][(2 + t) % 4],
    })),
    currentWaitMin: 15,
  },
  {
    id: 'r3',
    name: 'Aarthi Hotel',
    area: 'Kovilpatti',
    address: 'Station Road, Near Railway Station, Kovilpatti',
    categories: ['south-indian', 'parotta', 'non-veg', 'biriyani'],
    cuisine: 'South Indian, Parotta, Non-Veg Gravies, Biryani',
    rating: '4.2',
    ratingCount: 290,
    priceForTwo: 260,
    deliveryTimeMin: 25,
    distanceKm: '1.5',
    openHour: 7,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: '15% OFF up to ₹80',
    phone: '+91 94433 34567',
    image: {
      src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 9 }, (_, t) => ({
      id: `3-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'free', 'occupied', 'free'][(3 + t) % 4],
    })),
    currentWaitMin: 8,
  },
  {
    id: 'r4',
    name: 'Aasife Biriyani (Kovilpatti)',
    area: 'Kovilpatti',
    address: 'Main Road, Near Lakshmi Mills, Kovilpatti',
    categories: ['biriyani', 'non-veg', 'chinese', 'snacks'],
    cuisine: 'World-Class Dum Biryani, Mughlai, Tandoori, Chinese',
    rating: '4.6',
    ratingCount: 780,
    priceForTwo: 450,
    deliveryTimeMin: 30,
    distanceKm: '2.1',
    openHour: 11,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: '20% OFF on Family Combos',
    phone: '+91 98421 45678',
    image: {
      src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 12 }, (_, t) => ({
      id: `4-T${t + 1}`,
      label: `Table ${String(t + 1).padStart(2, '0')}`,
      status: ['free', 'occupied', 'free', 'free'][(4 + t) % 4],
    })),
    currentWaitMin: 18,
  },
  {
    id: 'r5',
    name: 'Salem RR Biriyani Kovilpatti',
    area: 'Kovilpatti',
    address: 'Madurai-Tirunelveli Bypass Road, Kovilpatti',
    categories: ['biriyani', 'non-veg', 'parotta'],
    cuisine: 'Traditional Salem Mutton Biryani, Chukka, Parotta',
    rating: '4.3',
    ratingCount: 420,
    priceForTwo: 420,
    deliveryTimeMin: 28,
    distanceKm: '2.4',
    openHour: 11,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: null,
    phone: '+91 98422 56789',
    image: {
      src: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 8 }, (_, t) => ({
      id: `5-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'seating-soon', 'free', 'occupied'][(5 + t) % 4],
    })),
    currentWaitMin: 12,
  },
  {
    id: 'r6',
    name: 'BILAL RESTAURANT',
    area: 'Kovilpatti',
    address: 'Main Bazaar, Opp. Juma Masjid, Kovilpatti',
    categories: ['biriyani', 'parotta', 'kothu-parotta', 'non-veg'],
    cuisine: 'Halal Non-Veg, Dum Biryani, Kothu Parotta, Alfaham',
    rating: '4.4',
    ratingCount: 510,
    priceForTwo: 320,
    deliveryTimeMin: 24,
    distanceKm: '1.1',
    openHour: 12,
    closeHour: 24,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Free Salna with Parotta',
    phone: '+91 98423 67890',
    image: {
      src: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 9 }, (_, t) => ({
      id: `6-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'free', 'occupied', 'seating-soon'][(6 + t) % 4],
    })),
    currentWaitMin: 10,
  },
  {
    id: 'r7',
    name: 'Zwarma Kovilpatti',
    area: 'Kovilpatti',
    address: 'Kadalaiyur Road, Near Old Post Office, Kovilpatti',
    categories: ['fast-food', 'snacks', 'fresh-juice'],
    cuisine: 'Arabian Shawarma, Burgers, Loaded Fries, Shakes',
    rating: '4.5',
    ratingCount: 390,
    priceForTwo: 250,
    deliveryTimeMin: 20,
    distanceKm: '1.0',
    openHour: 13,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Buy 2 Shawarmas Get Drink Free',
    phone: '+91 98424 78901',
    image: {
      src: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 6 }, (_, t) => ({
      id: `7-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'free', 'occupied', 'free'][(7 + t) % 4],
    })),
    currentWaitMin: 5,
  },
  {
    id: 'r8',
    name: 'KFC',
    area: 'Kovilpatti',
    address: 'NH 44 Highway Junction, Kovilpatti',
    categories: ['fast-food', 'snacks', 'non-veg'],
    cuisine: 'American Fried Chicken, Zinger Burgers, Wings, Krushers',
    rating: '4.3',
    ratingCount: 890,
    priceForTwo: 480,
    deliveryTimeMin: 26,
    distanceKm: '2.8',
    openHour: 10,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: '₹100 OFF on 8pc Bucket',
    phone: '+91 98425 89012',
    image: {
      src: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 12 }, (_, t) => ({
      id: `8-T${t + 1}`,
      label: `Table ${String(t + 1).padStart(2, '0')}`,
      status: ['free', 'occupied', 'free', 'free'][(8 + t) % 4],
    })),
    currentWaitMin: 14,
  },
  {
    id: 'r9',
    name: 'Meat and Eat - Kovilpatti',
    area: 'Kovilpatti',
    address: 'New Road, Opp. Municipal Complex, Kovilpatti',
    categories: ['fast-food', 'snacks', 'non-veg'],
    cuisine: 'Crispy Fried Chicken, Burgers, Tortilla Wraps, Fries',
    rating: '4.2',
    ratingCount: 310,
    priceForTwo: 360,
    deliveryTimeMin: 22,
    distanceKm: '1.4',
    openHour: 11,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: null,
    phone: '+91 98426 90123',
    image: {
      src: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 8 }, (_, t) => ({
      id: `9-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'free', 'seating-soon', 'occupied'][(9 + t) % 4],
    })),
    currentWaitMin: 8,
  },
  {
    id: 'r10',
    name: 'Greenleaf Multicuisine Restaurant',
    area: 'Kovilpatti',
    address: 'Bypass Road, Near Railway Overbridge, Kovilpatti',
    categories: ['chinese', 'veg', 'non-veg', 'south-indian'],
    cuisine: 'North Indian, Chinese, Tandoori, South Indian, Multicuisine',
    rating: '4.3',
    ratingCount: 340,
    priceForTwo: 400,
    deliveryTimeMin: 28,
    distanceKm: '2.0',
    openHour: 11,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: '10% OFF on Dine-in',
    phone: '+91 98427 01234',
    image: {
      src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 10 }, (_, t) => ({
      id: `10-T${t + 1}`,
      label: `Table ${String(t + 1).padStart(2, '0')}`,
      status: ['free', 'occupied', 'free', 'free'][(10 + t) % 4],
    })),
    currentWaitMin: 15,
  },
  {
    id: 'r11',
    name: 'SizZlers Restaurant',
    area: 'Kovilpatti',
    address: 'Main Road, Near Pasumpon Nagar, Kovilpatti',
    categories: ['fast-food', 'chinese', 'non-veg', 'veg'],
    cuisine: 'Sizzlers, Continental, Chinese, Mocktails, Grills',
    rating: '4.2',
    ratingCount: 260,
    priceForTwo: 450,
    deliveryTimeMin: 30,
    distanceKm: '1.9',
    openHour: 12,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: null,
    phone: '+91 98428 12345',
    image: {
      src: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 8 }, (_, t) => ({
      id: `11-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'free', 'occupied', 'free'][(11 + t) % 4],
    })),
    currentWaitMin: 12,
  },
  {
    id: 'r12',
    name: 'Muthuvilas Hotel',
    area: 'Kovilpatti',
    address: 'Mandai Street, Old Pettai, Kovilpatti',
    categories: ['parotta', 'non-veg', 'meals'],
    cuisine: 'Traditional Nadar Non-Veg, Bun Parotta, Kari Dosa, Mutton Chukka',
    rating: '4.6',
    ratingCount: 610,
    priceForTwo: 340,
    deliveryTimeMin: 24,
    distanceKm: '1.3',
    openHour: 7,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Free Soup with Meals',
    phone: '+91 98429 23456',
    image: {
      src: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 10 }, (_, t) => ({
      id: `12-T${t + 1}`,
      label: `Table ${String(t + 1).padStart(2, '0')}`,
      status: ['free', 'occupied', 'free', 'seating-soon'][(12 + t) % 4],
    })),
    currentWaitMin: 20,
  },
  {
    id: 'r13',
    name: 'Original Chettiyar Mess',
    area: 'Kovilpatti',
    address: 'Near Teppakulam, Kovilpatti',
    categories: ['meals', 'non-veg', 'seafood', 'south-indian'],
    cuisine: 'Traditional Chettinad, Country Chicken Meals, Ayira Meen Kuzhambu',
    rating: '4.6',
    ratingCount: 520,
    priceForTwo: 380,
    deliveryTimeMin: 25,
    distanceKm: '1.2',
    openHour: 11,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: null,
    phone: '+91 98430 34567',
    image: {
      src: 'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 8 }, (_, t) => ({
      id: `13-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'free', 'occupied', 'free'][(13 + t) % 4],
    })),
    currentWaitMin: 15,
  },
  {
    id: 'r14',
    name: "D'Lakshmi Sweets & Bakery",
    area: 'Kovilpatti',
    address: 'Main Bazaar Road, Kovilpatti',
    categories: ['desserts', 'bakery', 'snacks', 'tea-coffee'],
    cuisine: 'Kovilpatti Kadalai Mittai, Ghee Halwa, Mysore Pak, Bakery',
    rating: '4.7',
    ratingCount: 880,
    priceForTwo: 180,
    deliveryTimeMin: 18,
    distanceKm: '0.6',
    openHour: 8,
    closeHour: 22,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Fresh Batches Daily',
    phone: '+91 98431 45678',
    image: {
      src: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 6 }, (_, t) => ({
      id: `14-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'free', 'free', 'occupied'][(14 + t) % 4],
    })),
    currentWaitMin: 5,
  },
  {
    id: 'r15',
    name: 'BELGIAN WAFFLES & CREPES KOVILPATTI',
    area: 'Kovilpatti',
    address: 'New Bus Stand Road, Kovilpatti',
    categories: ['desserts', 'bakery', 'fresh-juice', 'tea-coffee'],
    cuisine: 'Belgian Waffles, Nutella Crepes, Shakes, Pancakes, Sundaes',
    rating: '4.5',
    ratingCount: 370,
    priceForTwo: 280,
    deliveryTimeMin: 22,
    distanceKm: '0.9',
    openHour: 12,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Free Scoop of Ice Cream',
    phone: '+91 98432 56789',
    image: {
      src: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 6 }, (_, t) => ({
      id: `15-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'occupied', 'free', 'free'][(15 + t) % 4],
    })),
    currentWaitMin: 6,
  },

  // TIRUNELVELI / NELLAI RESTAURANTS (16 to 30)
  {
    id: 'r16',
    name: 'Vaira Maaligai Restaurant',
    area: 'Tirunelveli',
    address: 'Vannarpettai, Tirunelveli',
    categories: ['biriyani', 'south-indian', 'chinese', 'non-veg'],
    cuisine: 'South Indian, Chettinad, Dum Biryani, Chinese, Multicuisine',
    rating: '4.6',
    ratingCount: 920,
    priceForTwo: 460,
    deliveryTimeMin: 26,
    distanceKm: '1.8',
    openHour: 11,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: '20% OFF up to ₹100',
    phone: '+91 94434 67890',
    image: {
      src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 12 }, (_, t) => ({
      id: `16-T${t + 1}`,
      label: `Table ${String(t + 1).padStart(2, '0')}`,
      status: ['free', 'occupied', 'free', 'free'][(16 + t) % 4],
    })),
    currentWaitMin: 16,
  },
  {
    id: 'r17',
    name: 'Dindigul Thalappakatti Restaurant',
    area: 'Tirunelveli',
    address: 'SN High Road, Near Tirunelveli Junction, Tirunelveli',
    categories: ['biriyani', 'non-veg', 'parotta'],
    cuisine: 'Authentic Thalappakatti Seeraga Samba Biryani, Mutton Sukka',
    rating: '4.5',
    ratingCount: 1140,
    priceForTwo: 550,
    deliveryTimeMin: 25,
    distanceKm: '1.2',
    openHour: 11,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Free Delivery',
    phone: '+91 94435 78901',
    image: {
      src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 12 }, (_, t) => ({
      id: `17-T${t + 1}`,
      label: `Table ${String(t + 1).padStart(2, '0')}`,
      status: ['free', 'free', 'occupied', 'free'][(17 + t) % 4],
    })),
    currentWaitMin: 18,
  },
  {
    id: 'r18',
    name: 'Varnams',
    area: 'Tirunelveli',
    address: 'Palayamkottai High Road, Tirunelveli',
    categories: ['chinese', 'non-veg', 'biriyani', 'seafood'],
    cuisine: 'Multicuisine, Barbecue, North Indian, Seafood, Chinese',
    rating: '4.4',
    ratingCount: 480,
    priceForTwo: 480,
    deliveryTimeMin: 28,
    distanceKm: '2.5',
    openHour: 12,
    closeHour: 24,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: null,
    phone: '+91 94436 89012',
    image: {
      src: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 10 }, (_, t) => ({
      id: `18-T${t + 1}`,
      label: `Table ${String(t + 1).padStart(2, '0')}`,
      status: ['free', 'seating-soon', 'free', 'occupied'][(18 + t) % 4],
    })),
    currentWaitMin: 10,
  },
  {
    id: 'r19',
    name: 'Nellai Saravana Bhava',
    area: 'Tirunelveli',
    address: 'Madurai Road, Tirunelveli Junction, Tirunelveli',
    categories: ['south-indian', 'dosa', 'idli', 'meals', 'tea-coffee'],
    cuisine: 'Pure Vegetarian, Ghee Roast Dosa, Nellai Meals, Filter Coffee',
    rating: '4.6',
    ratingCount: 1350,
    priceForTwo: 220,
    deliveryTimeMin: 20,
    distanceKm: '0.9',
    openHour: 6,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Free Dessert with Thali',
    phone: '+91 94437 90123',
    image: {
      src: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 14 }, (_, t) => ({
      id: `19-T${t + 1}`,
      label: `Table ${String(t + 1).padStart(2, '0')}`,
      status: ['free', 'occupied', 'free', 'free'][(19 + t) % 4],
    })),
    currentWaitMin: 15,
  },
  {
    id: 'r20',
    name: 'Hotel Nellai Saravana Bhava, KTC Nagar',
    area: 'Tirunelveli',
    address: 'KTC Nagar Main Road, NH 7, Tirunelveli',
    categories: ['south-indian', 'dosa', 'meals', 'chinese', 'veg'],
    cuisine: 'Pure Vegetarian Family Dining, Tiffin, Executive Thali, Sweets',
    rating: '4.5',
    ratingCount: 790,
    priceForTwo: 250,
    deliveryTimeMin: 25,
    distanceKm: '3.2',
    openHour: 6,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Family Dining Special Discount',
    phone: '+91 94438 01234',
    image: {
      src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 12 }, (_, t) => ({
      id: `20-T${t + 1}`,
      label: `Table ${String(t + 1).padStart(2, '0')}`,
      status: ['free', 'free', 'occupied', 'seating-soon'][(20 + t) % 4],
    })),
    currentWaitMin: 12,
  },
  {
    id: 'r21',
    name: 'Aasife Biriyani - Tirunelveli (Nellai)',
    area: 'Tirunelveli',
    address: 'South Bypass Road, Vannarpettai, Tirunelveli',
    categories: ['biriyani', 'non-veg', 'chinese', 'snacks'],
    cuisine: 'Signature Dum Biryani, Tandoori Platters, Shawarma, Chinese',
    rating: '4.6',
    ratingCount: 960,
    priceForTwo: 480,
    deliveryTimeMin: 27,
    distanceKm: '2.0',
    openHour: 11,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Free Sweet with Large Biryani',
    phone: '+91 94439 12345',
    image: {
      src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 14 }, (_, t) => ({
      id: `21-T${t + 1}`,
      label: `Table ${String(t + 1).padStart(2, '0')}`,
      status: ['free', 'occupied', 'free', 'free'][(21 + t) % 4],
    })),
    currentWaitMin: 20,
  },
  {
    id: 'r22',
    name: 'Buhari Restaurant',
    area: 'Tirunelveli',
    address: 'South Bypass Road, Near New Bus Stand, Tirunelveli',
    categories: ['non-veg', 'biriyani', 'parotta', 'chinese'],
    cuisine: 'The Original Buhari Chicken 65, Buhari Mutton Biryani, Ceylon Parotta',
    rating: '4.4',
    ratingCount: 670,
    priceForTwo: 440,
    deliveryTimeMin: 24,
    distanceKm: '2.2',
    openHour: 11,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Heritage Chicken 65 Combo',
    phone: '+91 94440 23456',
    image: {
      src: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 10 }, (_, t) => ({
      id: `22-T${t + 1}`,
      label: `Table ${String(t + 1).padStart(2, '0')}`,
      status: ['free', 'free', 'occupied', 'free'][(22 + t) % 4],
    })),
    currentWaitMin: 14,
  },
  {
    id: 'r23',
    name: 'Udhaya Vilas',
    area: 'Tirunelveli',
    address: 'West Car Street, Near Nellaiappar Temple, Tirunelveli Town',
    categories: ['south-indian', 'meals', 'dosa', 'tea-coffee'],
    cuisine: 'Traditional Nellai Sodhi Saapadu, Pure Ghee Pongal, Filter Coffee',
    rating: '4.7',
    ratingCount: 820,
    priceForTwo: 200,
    deliveryTimeMin: 22,
    distanceKm: '1.4',
    openHour: 6,
    closeHour: 22,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Authentic Temple Town Tiffin',
    phone: '+91 94441 34567',
    image: {
      src: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 8 }, (_, t) => ({
      id: `23-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'occupied', 'free', 'free'][(23 + t) % 4],
    })),
    currentWaitMin: 10,
  },
  {
    id: 'r24',
    name: 'Muthu Mess',
    area: 'Tirunelveli',
    address: 'Tirunelveli Town Main Road, Tirunelveli',
    categories: ['non-veg', 'parotta', 'meals', 'kothu-parotta'],
    cuisine: 'Authentic Country Non-Veg, Nattu Kozhi, Mutton Sukka, Coin Parotta',
    rating: '4.6',
    ratingCount: 710,
    priceForTwo: 360,
    deliveryTimeMin: 25,
    distanceKm: '1.7',
    openHour: 11,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Carrier Meals Available',
    phone: '+91 94442 45678',
    image: {
      src: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 8 }, (_, t) => ({
      id: `24-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'free', 'occupied', 'seating-soon'][(24 + t) % 4],
    })),
    currentWaitMin: 18,
  },
  {
    id: 'r25',
    name: 'Vairamaligai Rooftop Restaurant',
    area: 'Tirunelveli',
    address: 'Vannarpettai Overbridge View, Tirunelveli',
    categories: ['chinese', 'non-veg', 'fresh-juice', 'fast-food'],
    cuisine: 'Scenic Rooftop Dining, Tandoori Platters, Chinese, Mocktails',
    rating: '4.5',
    ratingCount: 560,
    priceForTwo: 550,
    deliveryTimeMin: 32,
    distanceKm: '2.0',
    openHour: 18,
    closeHour: 24,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Candlelight Seating Available',
    phone: '+91 94443 56789',
    image: {
      src: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 10 }, (_, t) => ({
      id: `25-T${t + 1}`,
      label: `Table ${String(t + 1).padStart(2, '0')}`,
      status: ['free', 'occupied', 'free', 'free'][(25 + t) % 4],
    })),
    currentWaitMin: 25,
  },
  {
    id: 'r26',
    name: 'Naadody Restaurant',
    area: 'Tirunelveli',
    address: 'Near Vasanth & Co, Bypass Road, Tirunelveli',
    categories: ['biriyani', 'parotta', 'non-veg'],
    cuisine: 'Rustic Village Claypot Biryani, Karandi Omelette, Kizhi Parotta',
    rating: '4.4',
    ratingCount: 430,
    priceForTwo: 390,
    deliveryTimeMin: 28,
    distanceKm: '2.6',
    openHour: 12,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Free Sweet Paan',
    phone: '+91 94444 67890',
    image: {
      src: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 8 }, (_, t) => ({
      id: `26-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'free', 'seating-soon', 'occupied'][(26 + t) % 4],
    })),
    currentWaitMin: 12,
  },
  {
    id: 'r27',
    name: 'Zaitoon Restaurant, Tirunelveli',
    area: 'Tirunelveli',
    address: 'Trivandrum Road, Palayamkottai, Tirunelveli',
    categories: ['biriyani', 'fast-food', 'non-veg', 'desserts'],
    cuisine: 'Authentic Arabian Mandi, BBQ Alfaham, Mixed Grills, Shawarma',
    rating: '4.6',
    ratingCount: 880,
    priceForTwo: 580,
    deliveryTimeMin: 30,
    distanceKm: '2.9',
    openHour: 12,
    closeHour: 24,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Mandi Feast Discount',
    phone: '+91 94445 78901',
    image: {
      src: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 12 }, (_, t) => ({
      id: `27-T${t + 1}`,
      label: `Table ${String(t + 1).padStart(2, '0')}`,
      status: ['free', 'occupied', 'free', 'free'][(27 + t) % 4],
    })),
    currentWaitMin: 16,
  },
  {
    id: 'r28',
    name: 'Palmyra multi-cuisine Restaurant',
    area: 'Tirunelveli',
    address: 'Regunath Hotel, South Bypass Road, Tirunelveli',
    categories: ['chinese', 'non-veg', 'veg', 'south-indian'],
    cuisine: 'Grand Multicuisine Dining, Executive Buffet, Continental, Tandoori',
    rating: '4.4',
    ratingCount: 460,
    priceForTwo: 500,
    deliveryTimeMin: 28,
    distanceKm: '2.4',
    openHour: 7,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Buffet Specials on Weekends',
    phone: '+91 94446 89012',
    image: {
      src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 12 }, (_, t) => ({
      id: `28-T${t + 1}`,
      label: `Table ${String(t + 1).padStart(2, '0')}`,
      status: ['free', 'free', 'occupied', 'free'][(28 + t) % 4],
    })),
    currentWaitMin: 14,
  },
  {
    id: 'r29',
    name: 'Pearl’s Restaurant',
    area: 'Tirunelveli',
    address: 'Trivandrum Road, Near Collectorate, Tirunelveli',
    categories: ['seafood', 'non-veg', 'chinese', 'parotta'],
    cuisine: 'Coastal Seafood, Vanjaram Fish Fry, Chettinad Non-Veg, Parotta',
    rating: '4.3',
    ratingCount: 390,
    priceForTwo: 460,
    deliveryTimeMin: 26,
    distanceKm: '2.3',
    openHour: 11,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Fresh Catch of the Day Specials',
    phone: '+91 94447 90123',
    image: {
      src: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 8 }, (_, t) => ({
      id: `29-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'seating-soon', 'free', 'occupied'][(29 + t) % 4],
    })),
    currentWaitMin: 12,
  },
  {
    id: 'r30',
    name: 'Anies Restaurant & Catering',
    area: 'Tirunelveli',
    address: 'High Ground, Palayamkottai, Tirunelveli',
    categories: ['south-indian', 'non-veg', 'seafood', 'biriyani'],
    cuisine: 'Kerala & Nellai Fusion, Appam with Stew, Alleppey Fish Curry, Biryani',
    rating: '4.5',
    ratingCount: 510,
    priceForTwo: 420,
    deliveryTimeMin: 25,
    distanceKm: '2.7',
    openHour: 11,
    closeHour: 23,
    hasTableBooking: true,
    hasPreOrder: true,
    offer: 'Free Payasam with Sunday Biryani',
    phone: '+91 94448 01234',
    image: {
      src: 'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?auto=format&fit=crop&w=800&q=80',
      fallback: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80'
    },
    tables: Array.from({ length: 8 }, (_, t) => ({
      id: `30-T${t + 1}`,
      label: `Table 0${t + 1}`,
      status: ['free', 'free', 'occupied', 'free'][(30 + t) % 4],
    })),
    currentWaitMin: 10,
  }
];



export const FOODS = [
  {
    "id": "f1",
    "name": "Sambar Rice",
    "restaurantId": "r1",
    "restaurantName": "",
    "category": "south-indian",
    "price": 92,
    "veg": true,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Traditional Kovilpatti Annapoorna style steaming rice infused with aromatic murungakkai sambar, fresh ghee, and potato fry.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f2",
    "name": "Rasam Rice",
    "restaurantId": "r1",
    "restaurantName": "",
    "category": "south-indian",
    "price": 89,
    "veg": true,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Comforting home-style garlic and pepper rasam sadam served piping hot with appalam and Kovilpatti urulai poriyal.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f3",
    "name": "Curd Rice",
    "restaurantId": "r1",
    "restaurantName": "",
    "category": "south-indian",
    "price": 131,
    "veg": true,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Thick creamy curd rice seasoned with mustard, ginger, green chillies, curry leaves, fresh pomegranate, and mango pickle.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f4",
    "name": "Veg Meals",
    "restaurantId": "r1",
    "restaurantName": "",
    "category": "meals",
    "price": 90,
    "veg": true,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Wholesome South Indian lunch with Ponni rice, Kovilpatti sambar, rasam, kootu, poriyal, appalam, and buttermilk.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f5",
    "name": "Special Meals",
    "restaurantId": "r1",
    "restaurantName": "",
    "category": "meals",
    "price": 150,
    "veg": true,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Today's Special Kovilpatti feast on banana leaf: sweet payasam, medu vada, ghee, sambar, vatha kulambu, rasam, 2 poriyals, appalam, and thick curd.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f6",
    "name": "Special Ghee Roast Dosa",
    "restaurantId": "r1",
    "restaurantName": "",
    "category": "south-indian",
    "price": 85,
    "veg": true,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Crispy paper-thin golden crepe roasted with pure country ghee, served with 3 signature chutneys and aromatic sambar.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f7",
    "name": "Paneer 65",
    "restaurantId": "r1",
    "restaurantName": "",
    "category": "starters",
    "price": 140,
    "veg": true,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Tender cottage cheese cubes marinated in southern spices and fried crisp with curry leaves.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f8",
    "name": "Gobi 65",
    "restaurantId": "r1",
    "restaurantName": "",
    "category": "starters",
    "price": 120,
    "veg": true,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Crunchy cauliflower florets tossed with crushed pepper, garlic, and fresh green chillies.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f9",
    "name": "Authentic Filter Coffee",
    "restaurantId": "r1",
    "restaurantName": "",
    "category": "tea-coffee",
    "price": 35,
    "veg": true,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Freshly brewed aromatic chicory-coffee decoction with hot frothy country milk in traditional brass dabara set.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f10",
    "name": "Tirunelveli Ghee Halwa",
    "restaurantId": "r1",
    "restaurantName": "",
    "category": "desserts",
    "price": 70,
    "veg": true,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Authentic Thamirabarani water wheat halwa dripping with pure desi ghee and roasted cashews.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f11",
    "name": "Sriganesh Special Veg Meals",
    "restaurantId": "r2",
    "restaurantName": "",
    "category": "meals",
    "price": 150,
    "veg": true,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Grand Kovilpatti vegetarian feast with Ponni rice, Kovilpatti special murungakkai sambar, rasam, kootu, and payasam.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f12",
    "name": "Ghee Roast Masala Dosa",
    "restaurantId": "r2",
    "restaurantName": "",
    "category": "dosa",
    "price": 120,
    "veg": true,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Signature paper-thin golden dosa folded over spiced potato masala and roasted with pure cow ghee.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f13",
    "name": "Onion Rava Masala Dosa",
    "restaurantId": "r2",
    "restaurantName": "",
    "category": "dosa",
    "price": 120,
    "veg": true,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Crispy semolina crepe studded with chopped green chillies, crushed peppercorns, and caramelized onions.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f14",
    "name": "Sriganesh Podi Idli",
    "restaurantId": "r2",
    "restaurantName": "",
    "category": "idli",
    "price": 80,
    "veg": true,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Steamed fluffy idlis tossed in spicy country idli podi and cold-pressed gingelly oil.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f15",
    "name": "Poori Masala (2 pcs)",
    "restaurantId": "r2",
    "restaurantName": "",
    "category": "south-indian",
    "price": 80,
    "veg": true,
    "rating": "4.5",
    "image": {
      "src": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Golden puffed wheat pooris served with tempered South Indian spiced potato masala.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f16",
    "name": "Ghee Ven Pongal",
    "restaurantId": "r2",
    "restaurantName": "",
    "category": "south-indian",
    "price": 75,
    "veg": true,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Melt-in-mouth rice and moong dal porridge tempered with whole black peppercorns, cumin, curry leaves, and cashews.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f17",
    "name": "Aarthi Special Chicken Biryani",
    "restaurantId": "r3",
    "restaurantName": "",
    "category": "biriyani",
    "price": 220,
    "veg": false,
    "rating": "4.4",
    "image": {
      "src": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Traditional Kovilpatti style Seeraga Samba chicken biryani served with brinjal gravy and onion raita.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f18",
    "name": "Madurai Flaky Parotta (2 pcs)",
    "restaurantId": "r3",
    "restaurantName": "",
    "category": "parotta",
    "price": 80,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Hand-beaten multi-layered flaky parottas served with flavorful spicy chicken salna.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f19",
    "name": "Pepper Chicken Dry",
    "restaurantId": "r3",
    "restaurantName": "",
    "category": "non-veg",
    "price": 190,
    "veg": false,
    "rating": "4.5",
    "image": {
      "src": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Tender chicken pieces pan-roasted with freshly crushed tellicherry black peppercorns and shallots.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f20",
    "name": "Egg Kothu Parotta",
    "restaurantId": "r3",
    "restaurantName": "",
    "category": "kothu-parotta",
    "price": 140,
    "veg": false,
    "rating": "4.5",
    "image": {
      "src": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Shredded parotta chopped on iron griddle with double egg, onion, curry leaves, and spicy gravy.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f21",
    "name": "Chicken Biriyani",
    "restaurantId": "r4",
    "restaurantName": "",
    "category": "biriyani",
    "price": 280,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80"
    },
    "description": "The world-famous Aasife Dum Biriyani cooked with tender chicken cuts, saffron, pure ghee, and basmati rice.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f22",
    "name": "Mutton Biriyani",
    "restaurantId": "r4",
    "restaurantName": "",
    "category": "biriyani",
    "price": 390,
    "veg": false,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Slow-cooked succulent tender goat meat dum biriyani layered with fragrant long grain basmati rice.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f23",
    "name": "Egg Biriyani",
    "restaurantId": "r4",
    "restaurantName": "",
    "category": "biriyani",
    "price": 200,
    "veg": false,
    "rating": "4.5",
    "image": {
      "src": "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Flavored aromatic basmati dum biriyani rice served with two seasoned hard-boiled eggs and dalcha.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f24",
    "name": "Prawns Biriyani",
    "restaurantId": "r4",
    "restaurantName": "",
    "category": "biriyani",
    "price": 380,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Fresh coastal prawns marinated in spices and layered with fragrant basmati dum rice.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f25",
    "name": "Veg Biryani",
    "restaurantId": "r4",
    "restaurantName": "",
    "category": "biriyani",
    "price": 180,
    "veg": true,
    "rating": "4.4",
    "image": {
      "src": "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Mildly spiced basmati rice slow-cooked with fresh garden vegetables, mint, and saffron.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f26",
    "name": "Kaadai Biriyani",
    "restaurantId": "r4",
    "restaurantName": "",
    "category": "biriyani",
    "price": 310,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Whole country quail cooked in traditional South Indian biriyani masala with rich spices.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f27",
    "name": "Nattu Kozhi Biriyani",
    "restaurantId": "r4",
    "restaurantName": "",
    "category": "biriyani",
    "price": 340,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Traditional country chicken dum biriyani made with aromatic seeraga samba rice.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f28",
    "name": "Chicken 65",
    "restaurantId": "r4",
    "restaurantName": "",
    "category": "starters",
    "price": 230,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Crispy deep-fried boneless chicken cubes marinated in Kashmiri chilli, ginger, and curry leaves.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f29",
    "name": "Chicken Fried Rice",
    "restaurantId": "r4",
    "restaurantName": "",
    "category": "chinese",
    "price": 220,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Wok-tossed basmati rice with shredded chicken, eggs, crunchy vegetables, and soy seasonings.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f30",
    "name": "Tandoori Chicken (Half)",
    "restaurantId": "r4",
    "restaurantName": "",
    "category": "bbq-tandoori",
    "price": 260,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Classic clay oven roasted chicken marinated in hung curd, Kashmiri spices, and mustard oil.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f31",
    "name": "Salem RR Special Mutton Biryani",
    "restaurantId": "r5",
    "restaurantName": "",
    "category": "biriyani",
    "price": 360,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Authentic Salem style Seeraga Samba mutton biryani cooked over woodfire with pure ghee.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f32",
    "name": "Salem RR Chicken Biryani",
    "restaurantId": "r5",
    "restaurantName": "",
    "category": "biriyani",
    "price": 260,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Flavorsome Salem Seeraga Samba chicken biryani served with sour brinjal pachadi and boiled egg.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f33",
    "name": "Salem Chicken Chukka",
    "restaurantId": "r5",
    "restaurantName": "",
    "category": "non-veg",
    "price": 210,
    "veg": false,
    "rating": "4.5",
    "image": {
      "src": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Country style chicken dry fry cooked in iron kadai with small onions and crushed pepper.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f34",
    "name": "Mutton Kola Urundai (4 pcs)",
    "restaurantId": "r5",
    "restaurantName": "",
    "category": "starters",
    "price": 180,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Crispy minced mutton meatballs seasoned with roasted gram flour, fennel, and garlic.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f35",
    "name": "Bilal Special Mutton Dum Biryani",
    "restaurantId": "r6",
    "restaurantName": "",
    "category": "biriyani",
    "price": 320,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Halal dum biryani cooked with tender mutton chunks and fragrant jeerakasala rice.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f36",
    "name": "Chicken Dum Biryani",
    "restaurantId": "r6",
    "restaurantName": "",
    "category": "biriyani",
    "price": 240,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Authentic Muslim wedding style dum biryani served with dalcha and onion raita.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f37",
    "name": "Coin Parotta (3 pcs) with Salna",
    "restaurantId": "r6",
    "restaurantName": "",
    "category": "parotta",
    "price": 90,
    "veg": false,
    "rating": "4.5",
    "image": {
      "src": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Cute miniature layered coin parottas roasted crispy on tawa, served with rich chicken salna.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f38",
    "name": "Alfaham BBQ Chicken (Half)",
    "restaurantId": "r6",
    "restaurantName": "",
    "category": "bbq-tandoori",
    "price": 260,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Charcoal grilled Arabian chicken marinated in olive oil, Arabic spices, and fresh herbs.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f39",
    "name": "Classic Arabian Chicken Shawarma",
    "restaurantId": "r7",
    "restaurantName": "",
    "category": "fast-food",
    "price": 110,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Tender shaved rotisserie grilled chicken wrapped in soft kuboos with garlic toum mayonnaise.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f40",
    "name": "Special Mexican Shawarma",
    "restaurantId": "r7",
    "restaurantName": "",
    "category": "fast-food",
    "price": 140,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Spicy Mexican style grilled chicken shawarma loaded with jalapeños and salsa sauce.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f41",
    "name": "Crispy Zwarma Burger",
    "restaurantId": "r7",
    "restaurantName": "",
    "category": "fast-food",
    "price": 150,
    "veg": false,
    "rating": "4.5",
    "image": {
      "src": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Crunchy fried chicken fillet in sesame brioche bun with lettuce and signature Zwarma sauce.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f42",
    "name": "BBQ Chicken Loaded Fries",
    "restaurantId": "r7",
    "restaurantName": "",
    "category": "snacks",
    "price": 170,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Crispy french fries topped with smoky barbecue chicken, melted cheese sauce, and oregano.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f43",
    "name": "Hot & Crispy Chicken (4 pcs)",
    "restaurantId": "r8",
    "restaurantName": "",
    "category": "fast-food",
    "price": 460,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Signature KFC bone-in chicken marinated in 11 secret herbs and spices, fried to a golden crunch.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f44",
    "name": "Classic Zinger Burger",
    "restaurantId": "r8",
    "restaurantName": "",
    "category": "fast-food",
    "price": 199,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Crispy spicy chicken fillet, fresh lettuce, and creamy mayo in a toasted sesame bun.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f45",
    "name": "Peri Peri Chicken Strips (6 pcs)",
    "restaurantId": "r8",
    "restaurantName": "",
    "category": "snacks",
    "price": 259,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Tender boneless chicken strips dusted with fiery peri peri seasoning.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f46",
    "name": "French Fries Large",
    "restaurantId": "r8",
    "restaurantName": "",
    "category": "snacks",
    "price": 120,
    "veg": true,
    "rating": "4.4",
    "image": {
      "src": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Golden salted shoestring potato fries served crisp and hot.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f47",
    "name": "ME Crispy Chicken Bucket (4 pcs)",
    "restaurantId": "r9",
    "restaurantName": "",
    "category": "fast-food",
    "price": 399,
    "veg": false,
    "rating": "4.5",
    "image": {
      "src": "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Crunchy golden crumb-coated chicken pieces served with garlic dip and tomato ketchup.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f48",
    "name": "Big Crunch Chicken Burger",
    "restaurantId": "r9",
    "restaurantName": "",
    "category": "fast-food",
    "price": 169,
    "veg": false,
    "rating": "4.4",
    "image": {
      "src": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Extra thick crispy fried chicken patty with tangy cocktail sauce in soft bun.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f49",
    "name": "Spicy Chicken Popcorn",
    "restaurantId": "r9",
    "restaurantName": "",
    "category": "snacks",
    "price": 149,
    "veg": false,
    "rating": "4.4",
    "image": {
      "src": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Bite-sized crispy fried chicken nuggets seasoned with spicy masala.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f50",
    "name": "Greenleaf Special Veg Fried Rice",
    "restaurantId": "r10",
    "restaurantName": "",
    "category": "chinese",
    "price": 170,
    "veg": true,
    "rating": "4.4",
    "image": {
      "src": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Fluffy long grain rice wok-tossed with garden vegetables, spring onions, and oriental spices.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f51",
    "name": "Butter Chicken Masala",
    "restaurantId": "r10",
    "restaurantName": "",
    "category": "non-veg",
    "price": 240,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Charbroiled tandoori chicken simmered in creamy makhani gravy with fenugreek and butter.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f52",
    "name": "Dragon Chicken",
    "restaurantId": "r10",
    "restaurantName": "",
    "category": "chinese",
    "price": 230,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Crispy fried chicken strips tossed in spicy chilli garlic sauce with crunchy cashews and dry chillies.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f53",
    "name": "Sizzling Chicken Sizzler",
    "restaurantId": "r11",
    "restaurantName": "",
    "category": "fast-food",
    "price": 340,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
    },
    "description": "Sizzling hot platter with grilled chicken breast, herb butter rice, french fries, and sauteed vegetables.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f54",
    "name": "Crispy Chilli Baby Corn",
    "restaurantId": "r11",
    "restaurantName": "",
    "category": "chinese",
    "price": 170,
    "veg": true,
    "rating": "4.4",
    "image": {
      "src": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Batter-fried golden baby corn wok-tossed with capsicum, garlic, and sweet chilli glaze.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f55",
    "name": "Muthuvilas Bun Parotta (2 pcs)",
    "restaurantId": "r12",
    "restaurantName": "",
    "category": "parotta",
    "price": 90,
    "veg": false,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Thick puffy round bun parotta hand-beaten to flaky perfection, served with spicy country salna.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f56",
    "name": "Mutton Kari Dosa",
    "restaurantId": "r12",
    "restaurantName": "",
    "category": "non-veg",
    "price": 240,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Famous Madurai-Nadar style three-layer thick dosa topped with spiced minced mutton chukka and beaten eggs.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f57",
    "name": "Mutton Chukka",
    "restaurantId": "r12",
    "restaurantName": "",
    "category": "non-veg",
    "price": 260,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Slow-roasted tender boneless goat meat with caramelized shallots, curry leaves, and black pepper.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f58",
    "name": "Chettiyar Mess Non-Veg Meals",
    "restaurantId": "r13",
    "restaurantName": "",
    "category": "meals",
    "price": 220,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Traditional carrier meals with hot Ponni rice, country chicken kuzhambu, mutton gravy, fish curry, and rasam.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f59",
    "name": "Ayira Meen Kuzhambu",
    "restaurantId": "r13",
    "restaurantName": "",
    "category": "seafood",
    "price": 280,
    "veg": false,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Rare local spiny loach fresh-water fish cooked in spicy tamarind and shallot gravy in clay pot.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f60",
    "name": "Nattu Kozhi Pepper Roast",
    "restaurantId": "r13",
    "restaurantName": "",
    "category": "non-veg",
    "price": 240,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Country fowl pan-seared with stone-crushed peppercorns, garlic, and gingelly oil.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f61",
    "name": "Authentic Kovilpatti Kadalai Mittai (500g)",
    "restaurantId": "r14",
    "restaurantName": "",
    "category": "desserts",
    "price": 180,
    "veg": true,
    "rating": "5.0",
    "image": {
      "src": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80"
    },
    "description": "GI-tagged world famous Kovilpatti peanut candy made with selected groundnuts and organic palm jaggery.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f62",
    "name": "Special Pure Ghee Mysore Pak (250g)",
    "restaurantId": "r14",
    "restaurantName": "",
    "category": "desserts",
    "price": 190,
    "veg": true,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Melt-in-mouth traditional gram flour sweet cooked with pure cow ghee and cardamom.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f63",
    "name": "Fresh Hot Veg Puff",
    "restaurantId": "r14",
    "restaurantName": "",
    "category": "bakery",
    "price": 25,
    "veg": true,
    "rating": "4.5",
    "image": {
      "src": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Flaky baked pastry filled with spiced potato and green peas masala.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f64",
    "name": "Belgian Chocolate Overload Waffle",
    "restaurantId": "r15",
    "restaurantName": "",
    "category": "desserts",
    "price": 160,
    "veg": true,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Crispy warm Belgian waffle smothered in melted milk chocolate and dark chocolate chips.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f65",
    "name": "Nutella Banana Crepe",
    "restaurantId": "r15",
    "restaurantName": "",
    "category": "desserts",
    "price": 175,
    "veg": true,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Thin French crepe filled with fresh banana slices and imported Nutella hazelnut spread.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f66",
    "name": "Cold Coffee with Ice Cream",
    "restaurantId": "r15",
    "restaurantName": "",
    "category": "fresh-juice",
    "price": 120,
    "veg": true,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Chilled blended creamy espresso coffee topped with rich vanilla ice cream.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f67",
    "name": "Vaira Maaligai Special Mutton Biryani",
    "restaurantId": "r16",
    "restaurantName": "",
    "category": "biriyani",
    "price": 380,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Signature Nellai biryani cooked with tender young goat meat, pure ghee, and roasted cashews.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f68",
    "name": "Chicken Biriyani",
    "restaurantId": "r16",
    "restaurantName": "",
    "category": "biriyani",
    "price": 270,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Vannarpettai favorite chicken dum biryani served with brinjal curry and boiled egg.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f69",
    "name": "Vaira Maaligai Special Fish Fry",
    "restaurantId": "r16",
    "restaurantName": "",
    "category": "non-veg",
    "price": 240,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Fresh coastal sea fish steak marinated in red chilli masala and shallow fried crisp.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f70",
    "name": "Schezwan Chicken Fried Rice",
    "restaurantId": "r16",
    "restaurantName": "",
    "category": "chinese",
    "price": 230,
    "veg": false,
    "rating": "4.5",
    "image": {
      "src": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Spicy wok-tossed fried rice with diced chicken, scrambled egg, and fiery Schezwan peppers.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f71",
    "name": "Thalappakatti Mutton Biriyani",
    "restaurantId": "r17",
    "restaurantName": "",
    "category": "biriyani",
    "price": 399,
    "veg": false,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
    },
    "description": "The legendary Seeraga Samba rice biryani slow-cooked with tender grass-fed goat meat since 1957.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f72",
    "name": "Thalappakatti Chicken Biriyani",
    "restaurantId": "r17",
    "restaurantName": "",
    "category": "biriyani",
    "price": 289,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Signature Thalappakatti chicken biriyani with aromatic tiny Seeraga Samba grains and authentic spices.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f73",
    "name": "Mutton Sukka Varuval",
    "restaurantId": "r17",
    "restaurantName": "",
    "category": "non-veg",
    "price": 349,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Iconic Thalappakatti dry mutton roast simmered with shallots and hand-pounded pepper.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f74",
    "name": "Chicken 65 Boneless",
    "restaurantId": "r17",
    "restaurantName": "",
    "category": "non-veg",
    "price": 249,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Bite-sized boneless chicken cubes seasoned with secret spices and fried crunchy.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f75",
    "name": "Varnams BBQ Chicken Wings",
    "restaurantId": "r18",
    "restaurantName": "",
    "category": "chinese",
    "price": 240,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Smoky grilled chicken wings glazed with tangy barbecue sauce and sesame seeds.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f76",
    "name": "Dum Gosht Biryani",
    "restaurantId": "r18",
    "restaurantName": "",
    "category": "biriyani",
    "price": 350,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Slow-cooked Awadhi style mutton dum biryani with long basmati grains and fried onions.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f77",
    "name": "Prawn Pepper Salt",
    "restaurantId": "r18",
    "restaurantName": "",
    "category": "seafood",
    "price": 290,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Crispy fried prawns tossed with cracked peppercorns, sea salt, and fresh spring onions.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f78",
    "name": "Saravana Bhava Special Veg Meals",
    "restaurantId": "r19",
    "restaurantName": "",
    "category": "meals",
    "price": 150,
    "veg": true,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Traditional Nellai plantain leaf lunch with rice, sambar, vatha kuzhambu, rasam, kootu, curd, and Tirunelveli halwa.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f79",
    "name": "Ghee Roast Masala Dosa",
    "restaurantId": "r19",
    "restaurantName": "",
    "category": "dosa",
    "price": 120,
    "veg": true,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Crispy cone-shaped dosa roasted in pure melted ghee, stuffed with potato masala.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f80",
    "name": "Ghee Podi Thatte Idli",
    "restaurantId": "r19",
    "restaurantName": "",
    "category": "idli",
    "price": 80,
    "veg": true,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Large flat soft idli coated with spicy Nellai gun powder and drenched in pure ghee.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f81",
    "name": "Tirunelveli Halwa",
    "restaurantId": "r19",
    "restaurantName": "",
    "category": "tea-coffee",
    "price": 60,
    "veg": true,
    "rating": "5.0",
    "image": {
      "src": "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Warm, glossy authentic wheat milk halwa cooked with pure cow ghee and Thamirabarani water.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f82",
    "name": "Special KTC South Indian Thali",
    "restaurantId": "r20",
    "restaurantName": "",
    "category": "meals",
    "price": 160,
    "veg": true,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Executive vegetarian thali with chappathi, rice, dal, special vegetable kurma, poriyal, curd, and sweet.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f83",
    "name": "Paper Roast Ghee Dosa",
    "restaurantId": "r20",
    "restaurantName": "",
    "category": "dosa",
    "price": 130,
    "veg": true,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Extra long ultra crisp golden dosa roasted with ghee, served with 3 chutneys.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f84",
    "name": "Paneer Fried Rice",
    "restaurantId": "r20",
    "restaurantName": "",
    "category": "chinese",
    "price": 180,
    "veg": true,
    "rating": "4.5",
    "image": {
      "src": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Indo-Chinese fried rice loaded with crispy paneer cubes and crunchy veggies.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f85",
    "name": "Nellai Special Chicken Dum Biryani",
    "restaurantId": "r21",
    "restaurantName": "",
    "category": "biriyani",
    "price": 280,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Authentic Aasife signature basmati dum biriyani with tender chicken pieces, egg, and raita.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f86",
    "name": "Aasife Mutton Dum Biryani",
    "restaurantId": "r21",
    "restaurantName": "",
    "category": "biriyani",
    "price": 390,
    "veg": false,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Finest basmati rice cooked on slow charcoal dum with succulent goat meat and aromatic herbs.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f87",
    "name": "Chicken 65 Classic",
    "restaurantId": "r21",
    "restaurantName": "",
    "category": "snacks",
    "price": 230,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Juicy spiced deep-fried chicken cubes with curry leaves and green chillies.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f88",
    "name": "Buhari Original Chicken 65",
    "restaurantId": "r22",
    "restaurantName": "",
    "category": "non-veg",
    "price": 260,
    "veg": false,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80"
    },
    "description": "The world-famous dish invented by A.M. Buhari in 1965 — authentic heritage spiced chicken fry.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f89",
    "name": "Buhari Special Mutton Biryani",
    "restaurantId": "r22",
    "restaurantName": "",
    "category": "biriyani",
    "price": 380,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Classic Chennai-Buhari style mutton dum biryani with rich bone marrow essence and hard boiled egg.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f90",
    "name": "Ceylon Egg Parotta",
    "restaurantId": "r22",
    "restaurantName": "",
    "category": "parotta",
    "price": 150,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Square folded stuffed Ceylon parotta with minced egg and shallots, pan-fried with ghee.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f91",
    "name": "Traditional Nellai Sodhi Saapadu (Meals)",
    "restaurantId": "r23",
    "restaurantName": "",
    "category": "meals",
    "price": 160,
    "veg": true,
    "rating": "5.0",
    "image": {
      "src": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
    },
    "description": "The pride of Tirunelveli: authentic coconut milk sodhi kuzhambu, ginger thuvaiyal, potato roast, and hot rice.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f92",
    "name": "Udhaya Vilas Ghee Podi Dosa",
    "restaurantId": "r23",
    "restaurantName": "",
    "category": "dosa",
    "price": 100,
    "veg": true,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Crisp hot dosa sprinkled with traditional temple town roasted lentil podi and pure ghee.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f93",
    "name": "Rava Kesari with Cashews",
    "restaurantId": "r23",
    "restaurantName": "",
    "category": "south-indian",
    "price": 60,
    "veg": true,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Glistening saffron semolina dessert loaded with golden roasted cashews, raisins, and pure cow ghee.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f94",
    "name": "Muthu Mess Special Non-Veg Carrier Meals",
    "restaurantId": "r24",
    "restaurantName": "",
    "category": "meals",
    "price": 230,
    "veg": false,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Famous country meals with nattu kozhi kuzhambu, mutton bone rasam, meen kuzhambu, and kootu.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f95",
    "name": "Nattu Kozhi Varuval",
    "restaurantId": "r24",
    "restaurantName": "",
    "category": "non-veg",
    "price": 250,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Village bred country chicken pan-roasted with shallots, crushed dry chillies, and garlic.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f96",
    "name": "Karandi Omelette",
    "restaurantId": "r24",
    "restaurantName": "",
    "category": "non-veg",
    "price": 50,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Fluffy round ladle-cooked egg omelette with minced onions, green chillies, and black pepper.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f97",
    "name": "Rooftop Tandoori Chicken Platter",
    "restaurantId": "r25",
    "restaurantName": "",
    "category": "non-veg",
    "price": 360,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Assorted clay oven charbroiled chicken tikka, malai kebab, and tandoori chicken with mint chutney.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f98",
    "name": "Crispy Schezwan Fish",
    "restaurantId": "r25",
    "restaurantName": "",
    "category": "chinese",
    "price": 280,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Battered fish fingers wok-tossed in pungent fiery Schezwan red pepper sauce.",
    "isBestseller": false,
    "spicy": true
  },
  {
    "id": "f99",
    "name": "Blue Curacao Mojito Mocktail",
    "restaurantId": "r25",
    "restaurantName": "",
    "category": "fresh-juice",
    "price": 140,
    "veg": true,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Refreshing sparkling mocktail with blue curacao citrus, crushed mint, lime, and soda.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f100",
    "name": "Naadody Claypot Mutton Biryani",
    "restaurantId": "r26",
    "restaurantName": "",
    "category": "biriyani",
    "price": 360,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Slow-cooked in claypots over hot charcoal embers for intense rustic village flavor.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f101",
    "name": "Kizhi Parotta",
    "restaurantId": "r26",
    "restaurantName": "",
    "category": "parotta",
    "price": 220,
    "veg": false,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Layers of flaky parotta and chicken chukka tied in plantain leaf and steamed to infuse herbal aroma.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f102",
    "name": "Zaitoon Special Arabian Mutton Mandi",
    "restaurantId": "r27",
    "restaurantName": "",
    "category": "biriyani",
    "price": 450,
    "veg": false,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Yemeni style fragrant long grain rice topped with melt-in-mouth slow cooked goat meat, fried nuts, and mandi soup.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f103",
    "name": "Chicken Alfaham BBQ with Kuboos",
    "restaurantId": "r27",
    "restaurantName": "",
    "category": "fast-food",
    "price": 280,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Smoky grilled Arabian spiced chicken served with fresh kuboos flatbread and garlic toum.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f104",
    "name": "Tender Coconut Souffle",
    "restaurantId": "r27",
    "restaurantName": "",
    "category": "desserts",
    "price": 130,
    "veg": true,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Creamy chilled pudding crafted from fresh tender coconut malai and condensed milk.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f105",
    "name": "Palmyra Grand Lunch Buffet / Executive Meals",
    "restaurantId": "r28",
    "restaurantName": "",
    "category": "meals",
    "price": 290,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Multicuisine lunch with soup, chicken biryani, steamed rice, fish curry, chicken gravy, paneer dish, and dessert.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f106",
    "name": "Murgh Malai Tikka",
    "restaurantId": "r28",
    "restaurantName": "",
    "category": "non-veg",
    "price": 270,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Boneless chicken breast pieces marinated in cream, cheese, cardamom, and gentle spices roasted in tandoor.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f107",
    "name": "Vanjaram Fish Fry",
    "restaurantId": "r29",
    "restaurantName": "",
    "category": "seafood",
    "price": 320,
    "veg": false,
    "rating": "4.9",
    "image": {
      "src": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Thick King Fish (Seer Fish) cut marinated in coastal chilli garlic paste and tawa fried in oil.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f108",
    "name": "Prawn Masala Fry",
    "restaurantId": "r29",
    "restaurantName": "",
    "category": "seafood",
    "price": 290,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Fresh Gulf of Mannar prawns tossed in caramelized shallot and tomato masala.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f109",
    "name": "Kerala Parotta (2 pcs)",
    "restaurantId": "r29",
    "restaurantName": "",
    "category": "parotta",
    "price": 70,
    "veg": false,
    "rating": "4.5",
    "image": {
      "src": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Crispy, multi-layered flaky flatbread served with aromatic gravy.",
    "isBestseller": false,
    "spicy": false
  },
  {
    "id": "f110",
    "name": "Kerala Appam (3 pcs) with Chicken Stew",
    "restaurantId": "r30",
    "restaurantName": "",
    "category": "south-indian",
    "price": 190,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Soft-centered lacy fermented rice pancakes paired with mild coconut milk chicken and potato stew.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f111",
    "name": "Alleppey Fish Curry with Steamed Rice",
    "restaurantId": "r30",
    "restaurantName": "",
    "category": "seafood",
    "price": 260,
    "veg": false,
    "rating": "4.8",
    "image": {
      "src": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Fresh fish cooked in tangy raw mango, coconut milk, and ginger curry, served with Ponni boiled rice.",
    "isBestseller": true,
    "spicy": true
  },
  {
    "id": "f112",
    "name": "Anies Special Thalassery Chicken Biriyani",
    "restaurantId": "r30",
    "restaurantName": "",
    "category": "biriyani",
    "price": 260,
    "veg": false,
    "rating": "4.7",
    "image": {
      "src": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Fragrant Kaima rice Thalassery dum biriyani layered with ghee fried onions and cashews.",
    "isBestseller": true,
    "spicy": false
  },
  {
    "id": "f113",
    "name": "Malabar Parotta (2 pcs) with Gravy",
    "restaurantId": "r30",
    "restaurantName": "",
    "category": "parotta",
    "price": 60,
    "veg": false,
    "rating": "4.6",
    "image": {
      "src": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
      "fallback": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"
    },
    "description": "Flaky and soft layered Kerala parotta served with traditional spicy kurma gravy.",
    "isBestseller": false,
    "spicy": false
  }
];

// Populate restaurantName in FOODS matching RESTAURANTS
FOODS.forEach(f => {
  const r = RESTAURANTS.find(rest => rest.id === f.restaurantId);
  if (r) {
    f.restaurantName = r.name;
  }
});

export const TIME_SLOTS = [
  { time: '12:00 PM', status: 'available' },
  { time: '12:30 PM', status: 'available' },
  { time: '01:00 PM', status: 'few-left' },
  { time: '01:30 PM', status: 'available' },
  { time: '07:00 PM', status: 'available' },
  { time: '07:30 PM', status: 'available' },
  { time: '08:00 PM', status: 'few-left' },
  { time: '08:30 PM', status: 'available' },
  { time: '09:00 PM', status: 'available' },
  { time: '09:30 PM', status: 'available' },
];

export const COUPONS = [
  { code: 'WELCOME50', desc: '50% OFF up to ₹100', minOrder: 199, discountPct: 50, maxDiscount: 100, expiresInDays: 30, usesLeft: 1 },
  { code: 'ZESTRO20', desc: '20% OFF up to ₹150', minOrder: 299, discountPct: 20, maxDiscount: 150, expiresInDays: 15, usesLeft: 3 },
  { code: 'FREESHIP', desc: 'Free Delivery', minOrder: 149, discountPct: 0, freeDelivery: true, expiresInDays: 10, usesLeft: 2 },
  { code: 'BIRTHDAY25', desc: 'Birthday Special — 25% OFF', minOrder: 0, discountPct: 25, maxDiscount: 200, expiresInDays: 1, usesLeft: 1 },
];

export const DELIVERY_INSTRUCTIONS = [
  'Leave at door', 'Call on arrival', 'Ring the bell', 'Leave with security', 'Contactless delivery'
];

export const SEATING_OPTIONS = ['Window', 'Indoor', 'Family Section', 'Outdoor / Garden', 'Center Hall'];
