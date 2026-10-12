import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RESTAURANTS, FOODS, CATEGORIES, COUPONS, AREAS, SEATING_OPTIONS, TIME_SLOTS, getFoodImage } from '../data/mockData';
import SafeImage from './SafeImage';
import Icon from './Icon';
import { addToCart, incQty, decQty, clearCart } from '../redux/slices/cartSlice';
import { toggleWishlist } from '../redux/slices/wishlistSlice';
import { addRecentlyViewed } from '../redux/slices/recentlyViewedSlice';
import { addReview } from '../redux/slices/reviewSlice';
import { createBooking } from '../redux/slices/bookingSlice';
import { setLocation } from '../redux/slices/userSlice';
import { useToast } from '../contexts/ToastContext';
import SmartDietaryFilter from './SmartDietaryFilter';
import VoiceOrderingModal from './VoiceOrderingModal';
import { matchesDietaryPreferences } from '../services/aiApiService';
import { restaurantApiService } from '../services/restaurantApiService';
import './RestaurantMenu.css';

// Nutrition, calorie & culinary metadata generator
function getFoodMeta(food) {
  const cat = food.category || '';
  const caloriesMap = {
    biriyani: 520, meals: 560, dosa: 280, idli: 170, parotta: 360,
    'kothu-parotta': 480, 'non-veg': 410, veg: 320, chinese: 390,
    'fast-food': 440, snacks: 210, bakery: 250, 'tea-coffee': 80,
    'fresh-juice': 120, desserts: 270, seafood: 330, 'south-indian': 340,
  };
  const calories = caloriesMap[cat] || (food.veg ? 310 : 420);
  const serves = ['biriyani', 'snacks', 'meals', 'desserts'].includes(cat) ? 'Serves 1–2' : 'Serves 1';
  const prepTime = cat === 'biriyani' ? '25–30 min' : cat === 'fresh-juice' || cat === 'tea-coffee' ? '8–12 min' : '15–20 min';

  const ingredientsMap = {
    biriyani: 'Aromatic Seeraga Samba / Basmati rice, marinated tender chicken, fresh mint, coriander, caramelized onions, clove, cardamom, saffron, pure ghee.',
    dosa: 'Slow-fermented rice & urad dal batter, cold-pressed gingelly oil / pure country ghee, served with traditional coconut, tomato chutneys & sambar.',
    idli: 'Steamed naturally fermented organic rice & urad dal, soft and fluffy, paired with fresh coconut chutney and piping hot spiced sambar.',
    parotta: 'Multi-layered flaky South Indian flatbread crafted with traditional hand-stretching technique and roasted on iron tawa with pure ghee.',
    'kothu-parotta': 'Shredded parotta tossed vigorously on sizzling tawa with spicy salna gravy, scrambled eggs / chicken, curry leaves, and green chillies.',
    meals: 'Traditional South Indian feast: boiled Ponni rice, Kovilpatti sambar, spicy rasam, kootu, poriyal, appalam, curd, pickle and sweet payasam.',
    'non-veg': 'Succulent cuts simmered in freshly stone-ground Chettinad spices, black pepper, shallots, garlic, and cold-pressed gingelly oil.',
    veg: 'Fresh farm cottage cheese / vegetables slow-cooked in rich cashew and vine-ripened tomato gravy with aromatic garam masala.',
    desserts: 'Traditional slow-cooked ghee delicacy prepared with authentic Kovilpatti palm jaggery, groundnuts or wheat milk.',
    'tea-coffee': 'Authentic South Indian degree decoction brewed from freshly roasted chicory beans, frothy boiled country milk, served piping hot.',
    'fresh-juice': '100% cold-pressed fresh fruit extract with natural sweetness, chilled and refreshing.',
    seafood: 'Fresh coastal catch marinated in red chilli paste, crushed garlic, curry leaves, and shallow-fried to crispy perfection.',
  };

  const allergensMap = {
    biriyani: 'Contains Dairy (Ghee, Curd)',
    parotta: 'Contains Gluten (Wheat)',
    'kothu-parotta': 'Contains Gluten, Egg',
    veg: 'Contains Dairy (Cashews, Cream, Paneer)',
    bakery: 'Contains Gluten, Dairy',
    desserts: 'Contains Dairy, Nuts (Cashews)',
    seafood: 'Contains Seafood / Fish',
  };

  return {
    calories: `${calories} kcal`,
    serves,
    prepTime,
    ingredients: ingredientsMap[cat] || 'Fresh authentic regional ingredients, farm-sourced spices, and cold-pressed cooking oil prepared under strict hygiene standards.',
    allergens: allergensMap[cat] || 'None declared (Prepared in a facility that handles dairy and nuts)',
  };
}

export default function RestaurantMenuExperience({ restaurantId, onSelectRestaurant }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const currentUser = useSelector(s => s.auth.currentUser);
  const userLocation = useSelector(s => s.user.location);
  const cartItems = useSelector(s => s.cart.items || []);
  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants);
  const restaurantsData = reduxRestaurants && reduxRestaurants.length > 0 ? reduxRestaurants : RESTAURANTS;
  const reduxFoods = useSelector(s => s.food?.foods);
  const foodsData = reduxFoods && reduxFoods.length > 0 ? reduxFoods : FOODS;

  const [apiRestaurant, setApiRestaurant] = useState(null);

  useEffect(() => {
    if (restaurantId) {
      restaurantApiService.getRestaurantById(restaurantId).then(res => {
        if (res.success && res.data) {
          setApiRestaurant(res.data);
        }
      });
    }
  }, [restaurantId]);

  // Resolve target restaurant
  const targetId = restaurantId || restaurantsData.find(r => r.area === userLocation || r.city === userLocation)?.id || restaurantsData[0]?.id || 'r1';
  const restaurant = useMemo(() => {
    if (apiRestaurant) return apiRestaurant;
    return restaurantsData.find(r => r.id === targetId || r._id === targetId || r.slug === targetId) || restaurantsData[0];
  }, [apiRestaurant, targetId, restaurantsData]);

  // Loading state simulation for realistic feel when switching restaurants
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 260);
    return () => clearTimeout(timer);
  }, [restaurant?.id, restaurant?._id]);

  // Record recently viewed
  useEffect(() => {
    if (restaurant) {
      dispatch(addRecentlyViewed({
        id: restaurant.id || restaurant._id,
        type: 'restaurant',
        name: restaurant.name,
        image: restaurant.image,
      }));
    }
  }, [restaurant, dispatch]);

  // Menu items for this restaurant
  const rawMenu = useMemo(() => {
    if (!restaurant) return [];
    if (Array.isArray(restaurant.menu) && restaurant.menu.length > 0) {
      return restaurant.menu.map(m => ({
        id: m._id || m.id,
        _id: m._id,
        name: m.name,
        price: m.price || 150,
        veg: m.isVeg ?? true,
        category: (m.category || 'specialties').toLowerCase().replace(/\s+/g, '-'),
        restaurantId: restaurant.id || restaurant._id,
        restaurantName: restaurant.name,
        image: m.image || '',
        description: m.description || '',
        rating: m.rating || 4.5,
        isBestseller: m.isBestseller || false,
      }));
    }
    const rId = restaurant.id || restaurant._id;
    return foodsData.filter(f => (f.restaurantId === rId || f.restaurantId === restaurant._id || f.restaurantId === restaurant.id) && f.status !== 'deactivated');
  }, [restaurant, foodsData]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all', 'veg', 'non-veg'
  const [smartPreferences, setSmartPreferences] = useState([]);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isNavSticky, setIsNavSticky] = useState(false);

  // Modals state
  const [foodDetailsItem, setFoodDetailsItem] = useState(null);
  const [customizingItem, setCustomizingItem] = useState(null);
  const [customPortion, setCustomPortion] = useState('Regular'); // 'Regular' | 'Large'
  const [customAddOns, setCustomAddOns] = useState([]);
  const [customSpice, setCustomSpice] = useState('Medium');
  const [customInstructions, setCustomInstructions] = useState('');
  const [customQty, setCustomQty] = useState(1);

  // Cart conflict modal state
  const [conflictItem, setConflictItem] = useState(null);

  // Table booking modal state
  const [showTableBookingModal, setShowTableBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bookingTime, setBookingTime] = useState('7:30 PM');
  const [bookingGuests, setBookingGuests] = useState(4);
  const [bookingSeating, setBookingSeating] = useState('Window');
  const [wantPreOrder, setWantPreOrder] = useState(true);
  const [preOrderDishes, setPreOrderDishes] = useState({});

  // Reviews state
  const reduxReviews = useSelector(s => s.review?.reviews || []);
  const restaurantReviews = useMemo(() => {
    if (!restaurant) return [];
    const direct = reduxReviews.filter(r => r.restaurantId === restaurant.id || (r.restaurantName && r.restaurantName.toLowerCase().includes(restaurant.name.toLowerCase())));
    if (direct.length > 0) return direct;
    // Fallback to top verified reviews from pool
    return reduxReviews.slice(0, 4);
  }, [restaurant, reduxReviews]);

  const [reviewStars, setReviewStars] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewDishName, setReviewDishName] = useState('');

  // Wishlist check
  const wished = useSelector(s => s.wishlist.items.some(i => i.id === restaurant?.id));

  // Operating status calculation
  const nowHour = new Date().getHours();
  const isTimeOpen = restaurant ? (nowHour >= restaurant.openHour && nowHour < restaurant.closeHour) : true;
  const adminStatus = restaurant?.status || (isTimeOpen ? 'Open' : 'Closed');
  const isOpen = adminStatus === 'Open';

  // Format restaurant hours nicely (e.g. 10:00 AM – 10:30 PM)
  const formattedHours = useMemo(() => {
    if (!restaurant) return '10:00 AM – 10:30 PM';
    const o = restaurant.openHour || 9;
    const c = restaurant.closeHour || 22;
    const formatH = (h) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hr = h % 12 === 0 ? 12 : h % 12;
      return `${hr}:00 ${ampm}`;
    };
    return `${formatH(o)} – ${formatH(c)}`;
  }, [restaurant]);

  // Cuisines list
  const cuisinesList = useMemo(() => {
    if (!restaurant) return [];
    const cats = Array.isArray(restaurant.categories) ? restaurant.categories : [];
    return cats.map(c => CATEGORIES.find(x => x.id === c)?.name || c.replace('-', ' '));
  }, [restaurant]);

  // Grouped Menu structure: actual categories present in this restaurant's menu
  const menuCategories = useMemo(() => {
    const catsMap = {};
    rawMenu.forEach(item => {
      const catKey = item.category || 'other';
      if (!catsMap[catKey]) {
        const catObj = CATEGORIES.find(c => c.id === catKey);
        catsMap[catKey] = {
          id: catKey,
          name: catObj?.name || catKey.charAt(0).toUpperCase() + catKey.slice(1),
          emoji: catObj?.emoji || '🍽️',
          items: [],
        };
      }
      catsMap[catKey].items.push(item);
    });
    return Object.values(catsMap);
  }, [rawMenu]);

  // Popular items (4-6 dishes based on bestseller or highest rating)
  const popularDishes = useMemo(() => {
    const bestsellers = rawMenu.filter(f => f.isBestseller);
    const sorted = [...rawMenu].sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
    const combined = [...new Set([...bestsellers, ...sorted])];
    return combined.slice(0, 5);
  }, [rawMenu]);

  // Filtered menu items according to search and dietary selection
  const filteredCategorySections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menuCategories.map(cat => {
      const matchingItems = cat.items.filter(item => {
        // Dietary filter
        if (dietaryFilter === 'veg' && !item.veg) return false;
        if (dietaryFilter === 'non-veg' && item.veg) return false;

        // Smart dietary preferences filter
        if (smartPreferences.length > 0 && !matchesDietaryPreferences(item, smartPreferences)) {
          return false;
        }

        // Search query filter
        if (q) {
          const matchName = item.name.toLowerCase().includes(q);
          const matchDesc = (item.description || '').toLowerCase().includes(q);
          const matchCat = (cat.name || '').toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat) return false;
        }
        return true;
      });

      return {
        ...cat,
        items: matchingItems,
      };
    }).filter(cat => cat.items.length > 0);
  }, [menuCategories, searchQuery, dietaryFilter, smartPreferences]);

  const totalFilteredDishesCount = useMemo(() => {
    return filteredCategorySections.reduce((acc, c) => acc + c.items.length, 0);
  }, [filteredCategorySections]);

  // Category Scrollspy & smooth scroll
  const sectionRefs = useRef({});
  const handleScrollToCategory = (catId) => {
    setActiveCategory(catId);
    if (catId === 'all') {
      window.scrollTo({ top: 400, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(`cat-section-${catId}`);
    if (elem) {
      const topOffset = elem.getBoundingClientRect().top + window.pageYOffset - 120;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;
      let currentActive = 'all';

      if (filteredCategorySections.length > 0) {
        for (const cat of filteredCategorySections) {
          const elem = document.getElementById(`cat-section-${cat.id}`);
          if (elem) {
            const top = elem.offsetTop;
            const height = elem.offsetHeight;
            if (scrollPos >= top && scrollPos < top + height) {
              currentActive = cat.id;
              break;
            }
          }
        }
      }
      setActiveCategory(currentActive);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredCategorySections]);

  // Cart calculations for items from THIS restaurant
  const currentCartRestId = cartItems.length > 0 ? cartItems[0].restaurantId : null;
  const isCartFromDifferentRest = currentCartRestId && currentCartRestId !== restaurant?.id;
  const currentRestCartItems = cartItems.filter(i => i.restaurantId === restaurant?.id);
  const cartTotalQty = currentRestCartItems.reduce((acc, item) => acc + item.qty, 0);
  const cartTotalPrice = currentRestCartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  // Helper to check quantity of dish in cart
  const getItemQtyInCart = (foodId) => {
    const item = cartItems.find(i => i.foodId === foodId && i.restaurantId === restaurant?.id);
    return item ? item.qty : 0;
  };

  // Add / Stepper handlers
  const handleAddClick = (food, e) => {
    if (e) e.stopPropagation();
    if (!isOpen) {
      showToast(`Restaurant is currently ${adminStatus}. Orders cannot be placed.`, 'error');
      return;
    }
    if (food.available === false) {
      showToast(`"${food.name}" is currently unavailable.`, 'error');
      return;
    }

    // Check if cart has items from another restaurant
    if (isCartFromDifferentRest) {
      setConflictItem(food);
      return;
    }

    // If food is Biryani, Meals, Combos or customizable, prompt customization modal
    const isCustomizable = ['biriyani', 'meals', 'non-veg', 'chinese', 'fast-food'].includes(food.category);
    if (isCustomizable) {
      openCustomizationModal(food);
      return;
    }

    // Standard instant add to cart
    const finalPrice = Math.max(0, (food.price || 0) - (food.discount || 0));
    dispatch(addToCart({
      foodId: food.id,
      name: food.name,
      price: finalPrice,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      image: food.image,
      qty: 1,
    }));
    showToast(`Added ${food.name} to cart`, 'success');
  };

  const handleQtyChange = (food, delta, e) => {
    if (e) e.stopPropagation();
    if (delta > 0) {
      dispatch(incQty(food.id));
    } else {
      dispatch(decQty(food.id));
    }
  };

  // Customization Modal logic
  const openCustomizationModal = (food) => {
    setCustomizingItem(food);
    setCustomPortion('Regular');
    setCustomAddOns([]);
    setCustomSpice(food.spicy ? 'Medium' : 'Mild');
    setCustomInstructions('');
    setCustomQty(1);
  };

  const toggleAddOn = (addOnName) => {
    setCustomAddOns(prev => prev.includes(addOnName) ? prev.filter(x => x !== addOnName) : [...prev, addOnName]);
  };

  const calculateCustomizedPrice = () => {
    if (!customizingItem) return 0;
    const basePrice = Math.max(0, (customizingItem.price || 0) - (customizingItem.discount || 0));
    const portionExtra = customPortion === 'Large' ? 60 : 0;
    const addOnsTotal = customAddOns.reduce((acc, name) => {
      if (name.includes('Chicken') || name.includes('Paneer')) return acc + 80;
      if (name.includes('Egg') || name.includes('Raita')) return acc + 20;
      return acc + 30; // default gravy/extra
    }, 0);
    return (basePrice + portionExtra + addOnsTotal) * customQty;
  };

  const handleConfirmCustomization = () => {
    if (!customizingItem) return;
    if (isCartFromDifferentRest) {
      setConflictItem(customizingItem);
      return;
    }

    const singleUnitPrice = calculateCustomizedPrice() / customQty;
    const addOnsLabel = customAddOns.length > 0 ? ` (${customAddOns.join(', ')})` : '';
    const portionLabel = customPortion === 'Large' ? ' [Large]' : '';

    dispatch(addToCart({
      foodId: customizingItem.id,
      name: `${customizingItem.name}${portionLabel}${addOnsLabel}`,
      price: singleUnitPrice,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      image: customizingItem.image,
      qty: customQty,
    }));

    showToast(`Added ${customizingItem.name} with customizations to cart!`, 'success');
    setCustomizingItem(null);
  };

  // Conflict Resolution
  const handleResolveConflict = (clearExisting) => {
    if (clearExisting && conflictItem) {
      dispatch(clearCart());
      const finalPrice = Math.max(0, (conflictItem.price || 0) - (conflictItem.discount || 0));
      dispatch(addToCart({
        foodId: conflictItem.id,
        name: conflictItem.name,
        price: finalPrice,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        image: conflictItem.image,
        qty: 1,
      }));
      showToast(`Cart cleared & ${conflictItem.name} added!`, 'success');
    }
    setConflictItem(null);
  };

  // Wishlist handler
  const handleToggleWishlist = () => {
    if (!currentUser) {
      showToast('Please sign in to save restaurants to your wishlist', 'info');
      navigate('/login', { state: { from: location } });
      return;
    }
    dispatch(toggleWishlist({
      id: restaurant.id,
      type: 'restaurant',
      name: restaurant.name,
      image: restaurant.image,
    }));
    showToast(wished ? 'Removed from wishlist' : 'Saved to wishlist ❤️', 'info');
  };

  // Share handler
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${restaurant.name} — ZESTRO`,
          text: `Check out the delicious menu at ${restaurant.name} on ZESTRO!`,
          url,
        });
      } catch (err) {
        // Ignored or cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      showToast('Restaurant menu link copied to clipboard! 📋', 'success');
    }
  };

  // Table Booking + Pre-order initialization
  const openTableBookingModal = () => {
    if (!currentUser) {
      showToast('Please sign in to book a table', 'info');
      navigate('/login', { state: { from: location } });
      return;
    }
    // Initialize preOrderDishes with items from cart or top recommendation
    const initialPreOrder = {};
    if (currentRestCartItems.length > 0) {
      currentRestCartItems.forEach(item => {
        initialPreOrder[item.foodId] = {
          id: item.foodId,
          name: item.name,
          price: item.price,
          qty: item.qty,
        };
      });
    } else if (popularDishes.length > 0) {
      initialPreOrder[popularDishes[0].id] = {
        id: popularDishes[0].id,
        name: popularDishes[0].name,
        price: popularDishes[0].price,
        qty: 2,
      };
    }
    setPreOrderDishes(initialPreOrder);
    setShowTableBookingModal(true);
  };

  const updatePreOrderQty = (food, delta) => {
    setPreOrderDishes(prev => {
      const current = prev[food.id]?.qty || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[food.id];
        return copy;
      }
      return {
        ...prev,
        [food.id]: {
          id: food.id,
          name: food.name,
          price: food.price,
          qty: next,
        },
      };
    });
  };

  const bookingFoodTotal = useMemo(() => {
    if (!wantPreOrder) return 0;
    return Object.values(preOrderDishes).reduce((acc, item) => acc + item.price * item.qty, 0);
  }, [wantPreOrder, preOrderDishes]);

  const handleConfirmTableBooking = () => {
    const bookingId = `BK-${Date.now().toString().slice(-4)}`;
    const preOrderList = wantPreOrder ? Object.values(preOrderDishes) : [];

    dispatch(createBooking({
      id: bookingId,
      userId: currentUser.id || 'u_guest',
      userName: currentUser.fullName || 'Guest Customer',
      customerName: currentUser.fullName || 'Guest Customer',
      userEmail: currentUser.email || 'customer@zestro.com',
      customerEmail: currentUser.email || 'customer@zestro.com',
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      date: bookingDate,
      dateFormatted: new Date(bookingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      time: bookingTime,
      guests: bookingGuests,
      seating: bookingSeating,
      prepareBeforeArrival: wantPreOrder,
      preOrderItems: preOrderList,
      preOrderTotal: bookingFoodTotal,
      status: 'Confirmed',
      journeyStep: 1,
      createdAt: new Date().toISOString(),
    }));

    setShowTableBookingModal(false);
    showToast(`Table booked successfully at ${restaurant.name}! Booking ID: ${bookingId}`, 'success');
    navigate(`/track-booking/${bookingId}`);
  };

  // Submit Review Handler
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to write a review', 'info');
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!reviewText.trim()) return;

    dispatch(addReview({
      id: `rev_${Date.now()}`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      foodName: reviewDishName || 'Overall Experience',
      stars: reviewStars,
      rating: reviewStars,
      comment: reviewText,
      text: reviewText,
      verified: true,
      author: currentUser.fullName || 'Customer',
      customerName: currentUser.fullName || 'Customer',
      date: new Date().toISOString().slice(0, 10),
      dateFormatted: 'Today',
      status: 'Published',
    }));

    setReviewText('');
    setReviewDishName('');
    showToast('Thank you! Your verified review has been published.', 'success');
  };

  // Rating distribution calculations
  const ratingDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    restaurantReviews.forEach(r => {
      const s = Math.min(5, Math.max(1, Math.round(r.stars || r.rating || 5)));
      counts[s] = (counts[s] || 0) + 1;
    });
    const total = restaurantReviews.length || 1;
    return {
      5: Math.round(((counts[5] || 0) / total) * 100),
      4: Math.round(((counts[4] || 0) / total) * 100),
      3: Math.round(((counts[3] || 0) / total) * 100),
      2: Math.round(((counts[2] || 0) / total) * 100),
      1: Math.round(((counts[1] || 0) / total) * 100),
      totalReviews: restaurant.ratingCount || (restaurantReviews.length * 35 + 80),
      avgRating: restaurantReviews.length ? (restaurantReviews.reduce((a, r) => a + (r.stars || r.rating || 5), 0) / restaurantReviews.length).toFixed(1) : (restaurant.rating || '4.6'),
    };
  }, [restaurantReviews, restaurant]);

  // Recently Viewed from Redux
  const recentlyViewedItems = useSelector(s => s.recentlyViewed?.items || []);

  if (!restaurant) {
    return (
      <div className="empty-state card" style={{ padding: 40, textAlign: 'center' }}>
        <span className="emoji" style={{ fontSize: 48 }}>🍽️</span>
        <h2>Restaurant Not Found</h2>
        <p className="muted">The restaurant you are looking for is currently unavailable.</p>
        <button className="btn btn-primary" onClick={() => navigate('/restaurants')}>Explore All Restaurants</button>
      </div>
    );
  }

  return (
    <div className="rest-menu-page">
      {/* ----------------------------------------------------------------------
          LOADING SKELETON (renders briefly while initializing / changing rest)
          ---------------------------------------------------------------------- */}
      {loading ? (
        <div>
          <div className="rest-skeleton-shimmer rest-skeleton-banner" />
          <div className="rest-info-grid" style={{ marginBottom: 20 }}>
            {[1, 2, 3, 4].map(k => (
              <div key={k} className="rest-skeleton-shimmer" style={{ height: 60, borderRadius: 12 }} />
            ))}
          </div>
          <div className="rest-skeleton-shimmer" style={{ height: 45, borderRadius: 24, marginBottom: 24 }} />
          {[1, 2, 3].map(k => (
            <div key={k} className="rest-skeleton-shimmer rest-skeleton-card" />
          ))}
        </div>
      ) : (
        <>
          {/* ----------------------------------------------------------------------
              1. RESTAURANT HEADER BANNER (Cover, Name, Badges, Wishlist, Share)
              ---------------------------------------------------------------------- */}
          <div className="rest-hero-card">
            <div className="rest-cover-wrapper">
              <SafeImage
                image={restaurant.image}
                alt={restaurant.name}
                className="rest-cover-img"
                emoji="🏠"
                category="restaurant"
              />
              <div className="rest-cover-gradient" />

              {/* Status & Timing badges on top left */}
              <div className="rest-cover-badges">
                <span className={`rest-cover-status ${isOpen ? 'open' : adminStatus === 'Closed' ? 'closed' : 'temp'}`}>
                  {isOpen ? '🟢 Currently Open' : adminStatus === 'Closed' ? '🔴 Closed' : '🟠 Temporarily Unavailable'}
                </span>
                {restaurant.offer && (
                  <span className="rest-cover-status" style={{ background: 'rgba(255, 183, 3, 0.95)', color: '#382400' }}>
                    🏷️ {restaurant.offer}
                  </span>
                )}
              </div>

              {/* Top right quick actions: Wishlist & Share */}
              <div className="rest-cover-actions">
                <button
                  type="button"
                  className={`rest-action-round-btn ${wished ? 'wished' : ''}`}
                  onClick={handleToggleWishlist}
                  title={wished ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  {wished ? '❤️' : '♡'}
                </button>
                <button
                  type="button"
                  className="rest-action-round-btn"
                  onClick={handleShare}
                  title="Share restaurant"
                >
                  ↗
                </button>
              </div>

              {/* Cover text overlay */}
              <div className="rest-cover-content-overlay">
                <h1 className="rest-title-name">{restaurant.name}</h1>
                <p className="rest-cuisines-line">
                  {cuisinesList.join(' • ')}
                </p>
              </div>
            </div>

            {/* Header Body with CTAs and Key Info */}
            <div className="rest-header-details-body">
              <div className="rest-primary-action-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span className="rating-chip" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 8 }}>
                    ⭐ {ratingDistribution.avgRating} ({ratingDistribution.totalReviews} ratings)
                  </span>
                  <span className="muted" style={{ fontSize: 13 }}>
                    📍 {typeof restaurant?.address === 'object' ? `${restaurant.address.street || ''}, ${restaurant.address.city || ''}` : (restaurant?.address || restaurant?.area || 'Tamil Nadu')}
                  </span>
                  <span className="muted" style={{ fontSize: 13 }}>
                    🕐 {formattedHours}
                  </span>
                </div>

                {/* Primary Actions: Book Table, Menu Book & Switch Restaurant */}
                <div className="rest-action-buttons-group">
                  <button
                    type="button"
                    className="rest-btn-pill"
                    style={{
                      background: 'linear-gradient(135deg, #d4af37 0%, #aa8010 100%)',
                      color: '#1a1208',
                      fontWeight: 800,
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(170,128,16,0.3)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onClick={() => navigate(`/restaurant/${restaurant.id}/menu`)}
                    title="Open 3D Digital Restaurant Menu Book"
                  >
                    <span>📖</span>
                    <span>View Menu Book</span>
                  </button>

                  {restaurant.hasTableBooking && (
                    <>
                      <button
                        type="button"
                        className="rest-btn-pill primary"
                        onClick={openTableBookingModal}
                      >
                        <span>🍽️</span> Book a Table
                      </button>
                      <button
                        type="button"
                        className="rest-btn-pill"
                        onClick={() => navigate(`/restaurant/${restaurant.id}/live-layout`)}
                        title="View Digital Restaurant Twin & Interactive Floor Plan"
                      >
                        <span>🏪</span> Live Table Layout
                      </button>
                    </>
                  )}
                  {onSelectRestaurant && (
                    <button
                      type="button"
                      className="rest-btn-pill"
                      onClick={() => onSelectRestaurant(null)}
                      title="Switch to another restaurant in your area"
                    >
                      <Icon name="restaurant" size={15} color="var(--accent)" />
                      Switch Restaurant
                    </button>
                  )}
                </div>
              </div>

              {/* ----------------------------------------------------------------------
                  2. RESTAURANT COMPACT INFORMATION
                  ---------------------------------------------------------------------- */}
              <div className="rest-info-grid">
                <div className="rest-info-tile">
                  <div className="rest-info-tile-icon">⭐</div>
                  <div className="rest-info-tile-content">
                    <span className="rest-info-tile-val">{ratingDistribution.avgRating}</span>
                    <span className="rest-info-tile-lbl">{ratingDistribution.totalReviews} Reviews</span>
                  </div>
                </div>

                <div className="rest-info-tile">
                  <div className="rest-info-tile-icon">🕐</div>
                  <div className="rest-info-tile-content">
                    <span className="rest-info-tile-val">{restaurant.deliveryTimeMin || 30}–{(restaurant.deliveryTimeMin || 30) + 10} min</span>
                    <span className="rest-info-tile-lbl">Delivery Time</span>
                  </div>
                </div>

                <div className="rest-info-tile">
                  <div className="rest-info-tile-icon">₹</div>
                  <div className="rest-info-tile-content">
                    <span className="rest-info-tile-val">₹{restaurant.priceForTwo || 250}</span>
                    <span className="rest-info-tile-lbl">For Two</span>
                  </div>
                </div>

                <div className="rest-info-tile">
                  <div className="rest-info-tile-icon">📍</div>
                  <div className="rest-info-tile-content">
                    <span className="rest-info-tile-val">{restaurant.area || 'Kovilpatti'}</span>
                    <span className="rest-info-tile-lbl">{restaurant.distanceKm || '1.8'} km away</span>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------------
                  18. DELIVERY INFORMATION BAR
                  ---------------------------------------------------------------------- */}
              <div className="rest-delivering-bar">
                <div className="rest-delivering-text">
                  <Icon name="location" size={16} color="var(--accent)" />
                  <span>Delivering to: <strong>Home, {userLocation}</strong></span>
                </div>
                <select
                  value={userLocation}
                  onChange={(e) => dispatch(setLocation(e.target.value))}
                  className="rest-delivering-change-btn"
                  style={{ background: 'none', border: 'none', outline: 'none' }}
                >
                  {AREAS.map(a => <option key={a} value={a}>Change to {a}</option>)}
                </select>
              </div>

              {/* ----------------------------------------------------------------------
                  19. RESTAURANT STATUS ALERTS
                  ---------------------------------------------------------------------- */}
              {!isOpen && (
                <div className={`rest-status-alert-banner ${adminStatus === 'Closed' ? 'closed' : 'temp'}`}>
                  <span>{adminStatus === 'Closed' ? '🔴' : '🟠'}</span>
                  <div>
                    <strong>{adminStatus === 'Closed' ? 'Restaurant is Currently Closed' : 'Temporarily Unavailable'}:</strong>{' '}
                    {adminStatus === 'Closed'
                      ? `Ordering will be available when the restaurant opens at ${restaurant.openHour || 9}:00 AM.`
                      : 'This restaurant is temporarily not accepting orders. Please browse our table booking or explore nearby venues.'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ----------------------------------------------------------------------
              14. ACTIVE OFFERS (Compact coupon carousel)
              ---------------------------------------------------------------------- */}
          <div className="rest-offers-wrap">
            <div className="rest-section-mini-title">
              <span>🏷️</span> Active Restaurant Offers
            </div>
            <div className="rest-offers-scroll">
              {COUPONS.map(c => (
                <div key={c.code} className="rest-offer-card">
                  <div className="rest-offer-left">
                    <span className="rest-offer-icon">🎁</span>
                    <div>
                      <div className="rest-offer-title">{c.desc}</div>
                      <div className="rest-offer-sub">Above ₹{c.minOrder} • Code: <strong>{c.code}</strong></div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rest-offer-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(c.code);
                      showToast(`Coupon ${c.code} copied! Apply at checkout.`, 'success');
                    }}
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dedicated 3D Digital Restaurant Menu Book Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(232, 84, 42, 0.1) 100%)',
            border: '1.5px solid rgba(212, 175, 55, 0.45)',
            borderRadius: 16,
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            boxShadow: '0 6px 20px rgba(212, 175, 55, 0.12)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 32 }}>📖</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: 'Playfair Display, serif', color: 'var(--text)' }}>
                  Experience the 3D Digital Menu Book
                </h3>
                <p className="muted" style={{ margin: '3px 0 0', fontSize: 13 }}>
                  Flip pages like a real restaurant menu with fine-dining typography, chef specials & dot leaders.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #aa8010 100%)',
                color: '#1a1208',
                fontWeight: 800,
                border: 'none',
                boxShadow: '0 4px 14px rgba(170,128,16,0.35)',
                padding: '9px 22px',
                borderRadius: 24,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
              onClick={() => navigate(`/restaurant/${restaurant.id}/menu`)}
            >
              <span>📖 OPEN MENU BOOK →</span>
            </button>
          </div>

          {/* ----------------------------------------------------------------------
              3. SEARCH MENU & DIETARY CONTROLS
              ---------------------------------------------------------------------- */}
          <div className="rest-menu-controls-bar">
            <div className="rest-menu-search-box">
              <Icon name="search" size={17} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search dishes, desserts, drinks in this menu..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="rest-menu-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Veg / Non-Veg Quick Dietary Toggles */}
            <div className="rest-dietary-pills">
              <button
                type="button"
                className={`rest-diet-btn ${dietaryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setDietaryFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`rest-diet-btn ${dietaryFilter === 'veg' ? 'active veg' : ''}`}
                onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? 'all' : 'veg')}
              >
                <span className="veg-dot" /> Pure Veg
              </button>
              <button
                type="button"
                className={`rest-diet-btn ${dietaryFilter === 'non-veg' ? 'active nonveg' : ''}`}
                onClick={() => setDietaryFilter(dietaryFilter === 'non-veg' ? 'all' : 'non-veg')}
              >
                <span className="nonveg-dot" /> Non-Veg
              </button>
            </div>

            {/* 5. Voice Food Ordering Button */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowVoiceModal(true)}
              style={{
                borderRadius: 20,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 700,
                padding: '6px 14px',
              }}
            >
              <span style={{ fontSize: 16 }}>🎙️</span>
              <span>Order by Voice</span>
            </button>
          </div>

          {/* 11. Smart Dietary Preferences Filter */}
          <SmartDietaryFilter
            activePreferences={smartPreferences}
            onTogglePreference={(pref) => {
              setSmartPreferences(prev =>
                prev.includes(pref) ? prev.filter(x => x !== pref) : [...prev, pref]
              );
            }}
            onClearAll={() => setSmartPreferences([])}
          />

          {/* ----------------------------------------------------------------------
              4. HORIZONTAL STICKY CATEGORY NAVIGATION (Scrollspy)
              ---------------------------------------------------------------------- */}
          <div className="rest-sticky-nav-container">
            <div className="rest-category-tabs-scroll">
              <button
                type="button"
                className={`rest-cat-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => handleScrollToCategory('all')}
              >
                <span>🍽️</span> All Dishes
                <span className="rest-cat-badge-count">{rawMenu.length}</span>
              </button>

              {popularDishes.length > 0 && (
                <button
                  type="button"
                  className={`rest-cat-tab-btn ${activeCategory === 'popular' ? 'active' : ''}`}
                  onClick={() => handleScrollToCategory('popular')}
                >
                  <span>🔥</span> Popular
                  <span className="rest-cat-badge-count">{popularDishes.length}</span>
                </button>
              )}

              {filteredCategorySections.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`rest-cat-tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => handleScrollToCategory(cat.id)}
                >
                  <span>{cat.emoji}</span> {cat.name}
                  <span className="rest-cat-badge-count">{cat.items.length}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ----------------------------------------------------------------------
              13. POPULAR SECTION (Top 4-6 Dishes at this restaurant)
              ---------------------------------------------------------------------- */}
          {!searchQuery && dietaryFilter === 'all' && popularDishes.length > 0 && (
            <div id="cat-section-popular" className="rest-menu-section">
              <div className="rest-section-header">
                <div className="rest-section-title-wrap">
                  <h2 className="rest-section-title">
                    <span>🔥</span> Popular at this restaurant
                  </h2>
                  <span className="rest-section-count">({popularDishes.length} dishes)</span>
                </div>
              </div>

              <div className="rest-food-items-list">
                {popularDishes.map(food => (
                  <FoodItemRow
                    key={food.id}
                    food={food}
                    isOpen={isOpen}
                    qtyInCart={getItemQtyInCart(food.id)}
                    onAdd={handleAddClick}
                    onQtyChange={handleQtyChange}
                    onOpenDetails={setFoodDetailsItem}
                    onCustomize={openCustomizationModal}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------
              5. MENU STRUCTURE (Categorized Sections)
              ---------------------------------------------------------------------- */}
          {filteredCategorySections.length > 0 ? (
            filteredCategorySections.map(cat => (
              <div key={cat.id} id={`cat-section-${cat.id}`} className="rest-menu-section">
                <div className="rest-section-header">
                  <div className="rest-section-title-wrap">
                    <h2 className="rest-section-title">
                      <span>{cat.emoji}</span> {cat.name}
                    </h2>
                    <span className="rest-section-count">({cat.items.length} dishes)</span>
                  </div>
                </div>

                <div className="rest-food-items-list">
                  {cat.items.map(food => (
                    <FoodItemRow
                      key={food.id}
                      food={food}
                      isOpen={isOpen}
                      qtyInCart={getItemQtyInCart(food.id)}
                      onAdd={handleAddClick}
                      onQtyChange={handleQtyChange}
                      onOpenDetails={setFoodDetailsItem}
                      onCustomize={openCustomizationModal}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            /* 26. EMPTY MENU STATE */
            <div className="empty-state card" style={{ padding: '60px 20px', textAlign: 'center', marginTop: 24 }}>
              <span className="emoji" style={{ fontSize: 44 }}>🍽️</span>
              <h3>Menu currently unavailable</h3>
              <p className="muted">
                {searchQuery || dietaryFilter !== 'all'
                  ? 'No dishes matched your search criteria. Try clearing your filters.'
                  : 'This restaurant does not have active dishes at this time. Please check again later.'}
              </p>
              {(searchQuery || dietaryFilter !== 'all') && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => { setSearchQuery(''); setDietaryFilter('all'); }}
                  style={{ marginTop: 12 }}
                >
                  Reset Menu Filters
                </button>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------------
              24. RECOMMENDATIONS ("You May Also Like")
              ---------------------------------------------------------------------- */}
          {rawMenu.length > 3 && (
            <div className="rest-menu-section" style={{ marginTop: 40 }}>
              <div className="rest-section-header">
                <h2 className="rest-section-title">
                  <span>💡</span> You May Also Like
                </h2>
                <span className="rest-section-count">Chef recommendations</span>
              </div>
              <div className="rest-horizontal-cards-row">
                {rawMenu.slice(0, 5).map(dish => (
                  <div key={dish.id} className="rest-compact-dish-card" onClick={() => setFoodDetailsItem(dish)} style={{ cursor: 'pointer' }}>
                    <div className="rest-compact-img-wrap">
                      <SafeImage image={dish.image} alt={dish.name} style={{ width: '100%', height: '100%' }} emoji="🍛" category={dish.category} />
                    </div>
                    <div className="rest-compact-card-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`veg-dot ${!dish.veg ? 'nonveg-dot' : ''}`} />
                        <h4 className="rest-compact-card-name">{dish.name}</h4>
                      </div>
                      <div className="rest-compact-card-bottom">
                        <span className="price" style={{ fontSize: 13.5 }}>₹{dish.price}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          style={{ padding: '3px 8px', fontSize: 11 }}
                          onClick={(e) => handleAddClick(dish, e)}
                        >
                          ADD +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------
              22. CUSTOMER REVIEWS & RATINGS DISTRIBUTION
              ---------------------------------------------------------------------- */}
          <div className="rest-reviews-container">
            <h2 style={{ margin: '0 0 16px', fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⭐</span> Customer Reviews & Ratings
            </h2>

            <div className="rest-reviews-summary-grid">
              {/* Overall Score box */}
              <div className="rest-overall-score-box">
                <div className="rest-overall-score-num">{ratingDistribution.avgRating}</div>
                <div className="rest-stars-row">
                  {'⭐'.repeat(Math.round(parseFloat(ratingDistribution.avgRating)) || 5)}
                </div>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  Based on {ratingDistribution.totalReviews} verified dining experiences
                </div>
              </div>

              {/* Progress bars */}
              <div className="rest-rating-dist-list">
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} className="rest-dist-row">
                    <span style={{ width: 35 }}>{star} ★</span>
                    <div className="rest-dist-bar-track">
                      <div className="rest-dist-bar-fill" style={{ width: `${ratingDistribution[star]}%` }} />
                    </div>
                    <span style={{ width: 35, textAlign: 'right', color: 'var(--text-muted)' }}>
                      {ratingDistribution[star]}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Write a review form */}
            <form onSubmit={handleReviewSubmit} style={{ marginBottom: 24, padding: 16, background: 'var(--bg)', borderRadius: 14, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
                Share your dining experience at {restaurant.name}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <span className="muted" style={{ fontSize: 13 }}>Your Rating:</span>
                {[1, 2, 3, 4, 5].map(s => (
                  <span
                    key={s}
                    onClick={() => setReviewStars(s)}
                    style={{ cursor: 'pointer', fontSize: 22, color: s <= reviewStars ? '#ffb703' : 'var(--border)' }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Dish you ordered (e.g. Chicken Biryani, Ghee Roast Dosa)..."
                value={reviewDishName}
                onChange={e => setReviewDishName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text)', marginBottom: 8 }}
              />
              <textarea
                required
                placeholder="Write your honest review (taste, portion, freshness, service)..."
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text)', minHeight: 70 }}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
                Submit Verified Review
              </button>
            </form>

            {/* Review Cards list */}
            <div>
              {restaurantReviews.length === 0 ? (
                <p className="muted">No reviews yet. Be the first customer to leave feedback!</p>
              ) : (
                restaurantReviews.map(r => (
                  <div key={r.id} className="rest-review-card">
                    <div className="rest-review-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="rest-review-author">{r.customerName || r.userName || r.author || 'Dheiva Lakshmi'}</span>
                        {r.verified !== false && (
                          <span className="rest-review-verified-badge">
                            <span>✓</span> Verified Order
                          </span>
                        )}
                      </div>
                      <span className="rest-review-date">{r.dateFormatted || r.date || '2 days ago'}</span>
                    </div>
                    <div style={{ color: '#ffb703', fontSize: 14, marginBottom: 4 }}>
                      {'★'.repeat(r.stars || r.rating || 5)}
                    </div>
                    {r.foodName && (
                      <span className="rest-review-dish-tag">
                        🍽️ {r.foodName}
                      </span>
                    )}
                    <p className="rest-review-comment">{r.comment || r.text || 'Very delicious authentic flavour, fresh ingredients and quick delivery.'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ----------------------------------------------------------------------
              23. RECENTLY VIEWED SECTION
              ---------------------------------------------------------------------- */}
          {recentlyViewedItems.length > 0 && (
            <div style={{ marginTop: 36 }}>
              <div className="rest-section-mini-title">
                <span>🕒</span> Recently Viewed
              </div>
              <div className="rest-horizontal-cards-row">
                {recentlyViewedItems.map(item => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="rest-compact-dish-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (item.type === 'restaurant') navigate(`/restaurant/${item.id}`);
                      else navigate(`/food/${item.id}`);
                    }}
                  >
                    <div className="rest-compact-img-wrap">
                      <SafeImage image={item.image} alt={item.name} style={{ width: '100%', height: '100%' }} emoji="🍽️" />
                    </div>
                    <div className="rest-compact-card-body">
                      <h4 className="rest-compact-card-name">{item.name}</h4>
                      <span className="muted" style={{ fontSize: 11 }}>{item.type === 'restaurant' ? 'Restaurant' : 'Food Item'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------
              15. FLOATING BOTTOM CART BAR (when items are added)
              ---------------------------------------------------------------------- */}
          {cartTotalQty > 0 && (
            <div className="rest-floating-cart-bar">
              <div className="rest-floating-cart-left">
                <div className="rest-floating-cart-icon-bubble">🛒</div>
                <div className="rest-floating-cart-details">
                  <span className="rest-floating-cart-qty">{cartTotalQty} {cartTotalQty === 1 ? 'item' : 'items'} added</span>
                  <span className="rest-floating-cart-total">₹{cartTotalPrice}</span>
                </div>
              </div>
              <button
                type="button"
                className="rest-floating-cart-btn"
                onClick={() => navigate('/cart')}
              >
                <span>View Cart</span> →
              </button>
            </div>
          )}

          {/* ----------------------------------------------------------------------
              11. FOOD CUSTOMIZATION MODAL
              ---------------------------------------------------------------------- */}
          {customizingItem && (
            <div className="rest-modal-backdrop" onClick={() => setCustomizingItem(null)}>
              <div className="rest-modal-container" onClick={e => e.stopPropagation()}>
                <button type="button" className="rest-modal-close-btn" onClick={() => setCustomizingItem(null)}>✕</button>
                <div className="rest-modal-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className={`veg-dot ${!customizingItem.veg ? 'nonveg-dot' : ''}`} />
                    <h3 style={{ margin: 0, fontSize: 18 }}>Customize {customizingItem.name}</h3>
                  </div>
                  <p className="muted" style={{ margin: '0 0 16px' }}>Base Price: ₹{customizingItem.price}</p>

                  {/* Choose Portion */}
                  <div className="rest-modal-section-title">Choose Portion:</div>
                  <div className="rest-choice-group">
                    <label className={`rest-choice-label ${customPortion === 'Regular' ? 'selected' : ''}`}>
                      <div className="rest-choice-left">
                        <input
                          type="radio"
                          name="portion"
                          checked={customPortion === 'Regular'}
                          onChange={() => setCustomPortion('Regular')}
                        />
                        <span>Regular Portion</span>
                      </div>
                      <span className="rest-choice-price">₹{customizingItem.price}</span>
                    </label>

                    <label className={`rest-choice-label ${customPortion === 'Large' ? 'selected' : ''}`}>
                      <div className="rest-choice-left">
                        <input
                          type="radio"
                          name="portion"
                          checked={customPortion === 'Large'}
                          onChange={() => setCustomPortion('Large')}
                        />
                        <span>Large / Double Pack</span>
                      </div>
                      <span className="rest-choice-price">₹{customizingItem.price + 60} (+₹60)</span>
                    </label>
                  </div>

                  {/* Extra Add-ons */}
                  <div className="rest-modal-section-title">Extras & Add-ons:</div>
                  <div className="rest-choice-group">
                    {[
                      { name: customizingItem.veg ? 'Extra Paneer Cubes' : 'Extra Chicken Pieces', price: 80 },
                      { name: 'Boiled Egg (1 pc)', price: 20 },
                      { name: 'Signature Onion Raita', price: 20 },
                      { name: 'Extra Salna / Gravy Cup', price: 30 },
                    ].map(extra => (
                      <label key={extra.name} className={`rest-choice-label ${customAddOns.includes(extra.name) ? 'selected' : ''}`}>
                        <div className="rest-choice-left">
                          <input
                            type="checkbox"
                            checked={customAddOns.includes(extra.name)}
                            onChange={() => toggleAddOn(extra.name)}
                          />
                          <span>{extra.name}</span>
                        </div>
                        <span className="rest-choice-price">+₹{extra.price}</span>
                      </label>
                    ))}
                  </div>

                  {/* Spice Level */}
                  <div className="rest-modal-section-title">Spice Level:</div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    {['Mild', 'Medium', 'Spicy'].map(spice => (
                      <button
                        key={spice}
                        type="button"
                        className={`rest-booking-pill-btn ${customSpice === spice ? 'selected' : ''}`}
                        onClick={() => setCustomSpice(spice)}
                        style={{ flex: 1 }}
                      >
                        {spice === 'Spicy' ? '🌶️' : spice === 'Medium' ? '🌿' : '🍃'} {spice}
                      </button>
                    ))}
                  </div>

                  {/* Special Instructions */}
                  <div className="rest-modal-section-title">Special Instructions:</div>
                  <textarea
                    placeholder="Add instructions (e.g. Less oil, spicy, no onion, crispy)..."
                    value={customInstructions}
                    onChange={e => setCustomInstructions(e.target.value)}
                    className="rest-instructions-input"
                  />

                  {/* Modal Bottom Action Bar */}
                  <div className="rest-modal-bottom-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setCustomQty(q => Math.max(1, q - 1))}>−</button>
                      <strong style={{ fontSize: 16 }}>{customQty}</strong>
                      <button className="btn btn-secondary btn-sm" onClick={() => setCustomQty(q => q + 1)}>+</button>
                    </div>

                    <button
                      type="button"
                      className="rest-modal-cta-btn"
                      onClick={handleConfirmCustomization}
                    >
                      Add to Cart — ₹{calculateCustomizedPrice()}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------
              12. FOOD DETAILS MODAL (High-res image, nutrition, full ingredients)
              ---------------------------------------------------------------------- */}
          {foodDetailsItem && (
            <div className="rest-modal-backdrop" onClick={() => setFoodDetailsItem(null)}>
              <div className="rest-modal-container" onClick={e => e.stopPropagation()}>
                <button type="button" className="rest-modal-close-btn" onClick={() => setFoodDetailsItem(null)}>✕</button>
                <div style={{ position: 'relative' }}>
                  <SafeImage
                    image={foodDetailsItem.image}
                    alt={foodDetailsItem.name}
                    className="rest-modal-hero-img"
                    emoji="🍛"
                    category={foodDetailsItem.category}
                  />
                  {foodDetailsItem.isBestseller && (
                    <span className="rating-chip" style={{ position: 'absolute', top: 14, left: 14, background: '#ffb703', color: '#382400', fontWeight: 800 }}>
                      🔥 Bestseller
                    </span>
                  )}
                </div>

                <div className="rest-modal-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span className={`veg-dot ${!foodDetailsItem.veg ? 'nonveg-dot' : ''}`} />
                        <h2 style={{ margin: 0, fontSize: 20 }}>{foodDetailsItem.name}</h2>
                      </div>
                      <span className="rating-chip">⭐ {foodDetailsItem.rating || 4.7}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="price" style={{ fontSize: 20 }}>₹{foodDetailsItem.price}</span>
                      {foodDetailsItem.discount > 0 && (
                        <div className="muted" style={{ textDecoration: 'line-through', fontSize: 13 }}>
                          ₹{foodDetailsItem.price + foodDetailsItem.discount}
                        </div>
                      )}
                    </div>
                  </div>

                  <p style={{ margin: '14px 0', lineHeight: 1.5, color: 'var(--text)' }}>
                    {foodDetailsItem.description}
                  </p>

                  {/* Metadata Chips: Calories, Serves, Prep Time */}
                  {(() => {
                    const meta = getFoodMeta(foodDetailsItem);
                    return (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
                        <span className="rest-food-meta-pill">🔥 {meta.calories}</span>
                        <span className="rest-food-meta-pill">👥 {meta.serves}</span>
                        <span className="rest-food-meta-pill">⏱️ {meta.prepTime}</span>
                      </div>
                    );
                  })()}

                  {/* Ingredients & Allergens */}
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, margin: '14px 0', fontSize: 13 }}>
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>🌿 Authentic Recipe & Ingredients:</div>
                    <p style={{ margin: '0 0 8px', color: 'var(--text-muted)' }}>
                      {getFoodMeta(foodDetailsItem).ingredients}
                    </p>
                    <div style={{ fontWeight: 800, marginBottom: 2 }}>⚠️ Allergen Information:</div>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                      {getFoodMeta(foodDetailsItem).allergens}
                    </p>
                  </div>

                  <div className="rest-modal-bottom-bar">
                    <button
                      type="button"
                      className="rest-btn-pill"
                      onClick={() => {
                        dispatch(toggleWishlist({ id: foodDetailsItem.id, type: 'food', name: foodDetailsItem.name, image: foodDetailsItem.image }));
                        showToast('Updated food wishlist ❤️', 'info');
                      }}
                    >
                      ♡ Wishlist
                    </button>
                    <button
                      type="button"
                      className="rest-modal-cta-btn"
                      disabled={!isOpen}
                      onClick={() => {
                        setFoodDetailsItem(null);
                        handleAddClick(foodDetailsItem);
                      }}
                    >
                      {!isOpen ? `Restaurant ${adminStatus}` : `Add to Cart — ₹${foodDetailsItem.price}`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------
              17. RESTAURANT-SPECIFIC CART CONFLICT MODAL
              ---------------------------------------------------------------------- */}
          {conflictItem && (
            <div className="rest-modal-backdrop" onClick={() => setConflictItem(null)}>
              <div className="rest-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
                <div className="rest-modal-body" style={{ textAlign: 'center', padding: 26 }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Items from Another Restaurant in Cart</h3>
                  <p className="muted" style={{ margin: '0 0 20px', lineHeight: 1.45 }}>
                    Your cart currently contains dishes from <strong>{cartItems[0]?.restaurantName || 'another restaurant'}</strong>.
                    ZESTRO orders can only be placed from one restaurant at a time.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-block"
                      onClick={() => handleResolveConflict(true)}
                    >
                      Clear Cart & Add New Item
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-block"
                      onClick={() => handleResolveConflict(false)}
                    >
                      Keep Current Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------
              20 & 21. TABLE BOOKING + FOOD PRE-ORDER CONNECTION MODAL
              ---------------------------------------------------------------------- */}
          {showTableBookingModal && (
            <div className="rest-modal-backdrop" onClick={() => setShowTableBookingModal(false)}>
              <div className="rest-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
                <button type="button" className="rest-modal-close-btn" onClick={() => setShowTableBookingModal(false)}>✕</button>
                <div className="rest-modal-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 24 }}>🍽️</span>
                    <h2 style={{ margin: 0, fontSize: 20 }}>Book a Table at {restaurant.name}</h2>
                  </div>
                  <p className="muted" style={{ margin: '0 0 16px' }}>Reserve your table and pre-order your favourite dishes.</p>

                  {/* Step 1: Date & Time */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Date</label>
                      <input
                        type="date"
                        value={bookingDate}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={e => setBookingDate(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Time Slot</label>
                      <select
                        value={bookingTime}
                        onChange={e => setBookingTime(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      >
                        {TIME_SLOTS.map(s => <option key={s.time} value={s.time}>{s.time}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Guests & Seating */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Guests ({bookingGuests})</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[2, 4, 6, 8].map(g => (
                          <button
                            key={g}
                            type="button"
                            className={`rest-booking-pill-btn ${bookingGuests === g ? 'selected' : ''}`}
                            onClick={() => setBookingGuests(g)}
                            style={{ flex: 1, padding: '6px 2px', fontSize: 12 }}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Seating</label>
                      <select
                        value={bookingSeating}
                        onChange={e => setBookingSeating(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      >
                        {SEATING_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Step 2: Food Pre-order Option */}
                  <div style={{ margin: '18px 0 12px', padding: '12px 14px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 800 }}>
                      <input
                        type="checkbox"
                        checked={wantPreOrder}
                        onChange={e => setWantPreOrder(e.target.checked)}
                      />
                      <span>Want to order food in advance? (Prepared hot on arrival)</span>
                    </label>

                    {wantPreOrder && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                          Select dishes for your table booking:
                        </div>
                        <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {rawMenu.slice(0, 8).map(food => {
                            const currentQty = preOrderDishes[food.id]?.qty || 0;
                            return (
                              <div key={food.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>
                                  {food.name} <span className="muted" style={{ fontSize: 11 }}>• ₹{food.price}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {currentQty > 0 ? (
                                    <>
                                      <button className="btn btn-secondary btn-sm" style={{ padding: '2px 6px' }} onClick={() => updatePreOrderQty(food, -1)}>−</button>
                                      <span style={{ fontSize: 13, fontWeight: 800 }}>{currentQty}</span>
                                      <button className="btn btn-secondary btn-sm" style={{ padding: '2px 6px' }} onClick={() => updatePreOrderQty(food, 1)}>+</button>
                                    </>
                                  ) : (
                                    <button className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => updatePreOrderQty(food, 1)}>
                                      + Add
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary Card Matching Prompt 21 */}
                  <div className="rest-booking-summary-card">
                    <div style={{ fontWeight: 800, marginBottom: 6, color: 'var(--accent)' }}>Table Booking Summary:</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span className="muted">Date & Time:</span>
                      <strong>{new Date(bookingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} • {bookingTime}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span className="muted">Guests & Table:</span>
                      <strong>{bookingGuests} Guests • {bookingSeating} Seating</strong>
                    </div>

                    {wantPreOrder && Object.keys(preOrderDishes).length > 0 && (
                      <div style={{ borderTop: '1px dashed var(--border)', marginTop: 8, paddingTop: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Food Pre-order:</div>
                        {Object.values(preOrderDishes).map(d => (
                          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                            <span>{d.name} × {d.qty}</span>
                            <span>₹{d.price * d.qty}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: 4, color: 'var(--accent)' }}>
                          <span>Estimated Food Total:</span>
                          <span>₹{bookingFoodTotal}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="rest-modal-cta-btn"
                    style={{ marginTop: 16 }}
                    onClick={handleConfirmTableBooking}
                  >
                    Confirm Table {wantPreOrder && Object.keys(preOrderDishes).length > 0 ? '+ Food' : 'Booking'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. Voice Food Ordering Modal */}
          <VoiceOrderingModal
            isOpen={showVoiceModal}
            onClose={() => setShowVoiceModal(false)}
            defaultFoods={rawMenu}
          />
        </>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Subcomponent: Food Item Row (Pure real restaurant menu card)
// --------------------------------------------------------------------------
function FoodItemRow({ food, isOpen, qtyInCart, onAdd, onQtyChange, onOpenDetails, onCustomize }) {
  const meta = useMemo(() => getFoodMeta(food), [food]);
  const isAvailable = food.available !== false && isOpen;
  const isCustomizable = ['biriyani', 'meals', 'non-veg', 'chinese', 'fast-food'].includes(food.category);

  return (
    <div
      className={`rest-food-item-card ${!isAvailable ? 'unavailable' : ''}`}
      onClick={() => onOpenDetails(food)}
    >
      {/* Left: Food content */}
      <div className="rest-food-content">
        <div className="rest-food-header-line">
          <span className={`veg-dot ${!food.veg ? 'nonveg-dot' : ''}`} />
          <h3 className="rest-food-name">{food.name}</h3>
          {food.isBestseller && <span className="rest-badge-bestseller">🔥 Bestseller</span>}
          {food.spicy && <span className="rest-badge-spicy">🌶️ Spicy</span>}
        </div>

        <div className="rest-food-price-row">
          <span className="rest-food-price">₹{food.price}</span>
          {food.discount > 0 && (
            <>
              <span className="rest-food-old-price">₹{food.price + food.discount}</span>
              <span className="rest-food-discount-tag">₹{food.discount} OFF</span>
            </>
          )}
        </div>

        <div className="rest-food-rating-chip">
          ⭐ {food.rating || '4.7'}
        </div>

        <p className="rest-food-desc">
          {food.description}
        </p>

        <div className="rest-food-meta-row">
          <span className="rest-food-meta-pill">🔥 {meta.calories}</span>
          <span className="rest-food-meta-pill">👥 {meta.serves}</span>
          <span className="rest-food-meta-pill">⏱️ {meta.prepTime}</span>
        </div>
      </div>

      {/* Right: Food image and action button */}
      <div className="rest-food-visual" onClick={e => e.stopPropagation()}>
        <div className="rest-food-img-frame" onClick={() => onOpenDetails(food)} style={{ cursor: 'pointer' }}>
          <SafeImage
            image={food.image}
            alt={food.name}
            className="rest-food-thumb-img"
            emoji="🍛"
            category={food.category}
          />
        </div>

        <div className="rest-food-btn-wrap">
          {qtyInCart === 0 ? (
            <button
              type="button"
              className="rest-add-btn"
              disabled={!isAvailable}
              onClick={(e) => onAdd(food, e)}
            >
              ADD <span style={{ fontSize: 16 }}>+</span>
            </button>
          ) : (
            <div className="rest-qty-stepper">
              <button
                type="button"
                className="rest-qty-step-btn"
                onClick={(e) => onQtyChange(food, -1, e)}
              >
                −
              </button>
              <span className="rest-qty-num">{qtyInCart}</span>
              <button
                type="button"
                className="rest-qty-step-btn"
                onClick={(e) => onQtyChange(food, 1, e)}
              >
                +
              </button>
            </div>
          )}

          {isCustomizable && isAvailable && (
            <span
              className="rest-customisable-hint"
              onClick={(e) => {
                e.stopPropagation();
                onCustomize(food);
              }}
              style={{ cursor: 'pointer' }}
            >
              Customisable
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
