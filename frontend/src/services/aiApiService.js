/**
 * ZESTRO AI & Interactive Services (Backend-Ready Architecture)
 * 
 * Provides simulated AI inference, recommendation scoring, voice NLP parsing,
 * price drop detection, and dining assistant queries.
 * 
 * FUTURE BACKEND REST API MAPPINGS:
 *   GET    /api/recommendations
 *   GET    /api/recommendations/:customerId
 *   GET    /api/rewards
 *   POST   /api/rewards/:id/claim
 *   GET    /api/restaurants/:id/tables
 *   PATCH  /api/tables/:id/status
 *   POST   /api/voice/parse
 *   GET    /api/price-history/:foodId
 *   GET    /api/price-alerts
 *   POST   /api/assistant/query
 *   GET    /api/food/preferences
 *   POST   /api/food/preferences
 */

import { FOODS, RESTAURANTS, COUPONS } from '../data/mockData';

// --------------------------------------------------------------------------
// 1. AI RECOMMENDATION ENGINE
// --------------------------------------------------------------------------
export function calculateRecommendations({
  orders = [],
  recentlyViewed = [],
  wishlist = [],
  userLocation = 'Kovilpatti',
  dietaryPreferences = [],
  budgetMax = null,
}) {
  // Extract user affinities from history
  const orderedFoodNames = new Set();
  const orderedCategories = new Set();
  const visitedRestaurantIds = new Set();

  orders.forEach(ord => {
    if (ord.restaurantId) visitedRestaurantIds.add(ord.restaurantId);
    (ord.items || []).forEach(it => {
      if (it.name) orderedFoodNames.add(it.name.toLowerCase());
      if (it.category) orderedCategories.add(it.category);
    });
  });

  recentlyViewed.forEach(rv => {
    if (rv.type === 'restaurant') visitedRestaurantIds.add(rv.id);
    if (rv.type === 'food' && rv.name) orderedFoodNames.add(rv.name.toLowerCase());
  });

  const wishlistedIds = new Set(wishlist.map(w => w.id));

  // Score foods
  const scoredFoods = FOODS.map(food => {
    let score = 50; // base score
    const reasonPills = [];

    // Category / Cuisine affinity
    if (orderedCategories.has(food.category)) {
      score += 25;
      reasonPills.push(`Matches your ${food.category} preference`);
    }

    // Direct name similarity with previous orders
    for (const name of orderedFoodNames) {
      if (food.name.toLowerCase().includes(name) || name.includes(food.name.toLowerCase())) {
        score += 30;
        reasonPills.push(`Similar to past order "${name}"`);
        break;
      }
    }

    // Wishlist bonus
    if (wishlistedIds.has(food.id)) {
      score += 20;
      reasonPills.push('In your wishlist');
    }

    // Bestseller & high rating bonus
    const ratingVal = parseFloat(food.rating) || 4.0;
    score += Math.round(ratingVal * 5);
    if (food.isBestseller) {
      score += 15;
      reasonPills.push('Trending Bestseller');
    }

    // Location matching through restaurant
    const rest = RESTAURANTS.find(r => r.id === food.restaurantId);
    if (rest && rest.area === userLocation) {
      score += 15;
    }

    // Discounts
    if (food.discount > 0) {
      score += 10;
      reasonPills.push(`Save ₹${food.discount}`);
    }

    return {
      ...food,
      recommendationScore: Math.min(99, score),
      primaryReason: reasonPills[0] || 'Top rated in your area',
      allReasons: reasonPills,
    };
  });

  // Sort by score
  scoredFoods.sort((a, b) => b.recommendationScore - a.recommendationScore);

  // Group into curated sections matching Section 1
  const basedOnOrders = scoredFoods.filter(f => f.allReasons.some(r => r.includes('past order'))).slice(0, 4);
  const becauseViewed = scoredFoods.filter(f => recentlyViewed.some(rv => rv.id === f.id || (rv.type === 'restaurant' && rv.id === f.restaurantId))).slice(0, 4);
  const popularNearYou = scoredFoods.filter(f => f.isBestseller && f.rating >= 4.5).slice(0, 4);
  const youMayAlsoLike = scoredFoods.slice(0, 4);
  const newForYou = [...scoredFoods].reverse().slice(0, 4);
  const withinBudget = budgetMax ? scoredFoods.filter(f => f.price <= budgetMax).slice(0, 4) : scoredFoods.filter(f => f.price <= 200).slice(0, 4);

  return {
    topRecommendations: scoredFoods.slice(0, 8),
    sections: {
      basedOnOrders,
      becauseViewed,
      popularNearYou,
      youMayAlsoLike,
      newForYou,
      withinBudget,
    },
    meta: {
      engine: 'ZESTRO Semantic Affinity Engine v1.2 (Frontend Simulation)',
      generatedAt: new Date().toISOString(),
    },
  };
}

// --------------------------------------------------------------------------
// 2. RESTAURANT MYSTERY REWARD SERVICE
// --------------------------------------------------------------------------
const MYSTERY_REWARDS_POOL = [
  { id: 'rew_v50', type: 'voucher', title: '₹50 Voucher', code: 'MYSTERY-50', discount: 50, desc: 'Flat ₹50 OFF on orders above ₹199' },
  { id: 'rew_dessert', type: 'voucher', title: 'Free Dessert', code: 'FREE-SWEET', discount: 0, desc: 'Free Dessert with your next main course' },
  { id: 'rew_10pct', type: 'voucher', title: '10% Off', code: 'MYSTERY-10', discountPct: 10, desc: '10% OFF up to ₹100' },
  { id: 'rew_freeship', type: 'voucher', title: 'Free Delivery', code: 'ZESTRO-FREE', freeDelivery: true, desc: 'Free Delivery on any order' },
  { id: 'rew_50pts', type: 'points', title: '50 DinePoints', points: 50, desc: '50 DinePoints credited to your wallet' },
  { id: 'rew_100pts', type: 'points', title: '100 DinePoints', points: 100, desc: '100 DinePoints credited to your wallet' },
  { id: 'rew_v100', type: 'voucher', title: '₹100 Voucher', code: 'MYSTERY-100', discount: 100, desc: 'Flat ₹100 OFF on orders above ₹399' },
];

const STORAGE_MYSTERY = 'zestro_mystery_boxes';

export function getMysteryBoxState(orderId) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_MYSTERY)) || {};
    return data[orderId] || { status: 'Available', reward: null };
  } catch {
    return { status: 'Available', reward: null };
  }
}

export function openMysteryBox(orderId) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_MYSTERY)) || {};
    if (data[orderId] && (data[orderId].status === 'Opened' || data[orderId].status === 'Claimed')) {
      return data[orderId];
    }
    const chosen = MYSTERY_REWARDS_POOL[Math.floor(Math.random() * MYSTERY_REWARDS_POOL.length)];
    const updated = {
      status: 'Opened',
      reward: chosen,
      openedAt: new Date().toISOString(),
    };
    data[orderId] = updated;
    localStorage.setItem(STORAGE_MYSTERY, JSON.stringify(data));
    return updated;
  } catch {
    return { status: 'Opened', reward: MYSTERY_REWARDS_POOL[0] };
  }
}

export function claimMysteryReward(orderId) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_MYSTERY)) || {};
    if (data[orderId]) {
      data[orderId].status = 'Claimed';
      data[orderId].claimedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_MYSTERY, JSON.stringify(data));
      return data[orderId];
    }
    return null;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------
// 3. VOICE ORDERING & COMMAND PARSER
// --------------------------------------------------------------------------
export function parseVoiceCommand(transcript, availableFoods = FOODS) {
  if (!transcript || typeof transcript !== 'string') return null;

  const raw = transcript.trim();
  const lower = raw.toLowerCase();

  // Number words mapping (English + Tamil Tanglish)
  const numWords = {
    one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    // Tamil / Tanglish numbers
    oru: 1, onnu: 1, ondru: 1,
    rendu: 2, irandu: 2,
    moonu: 3, moondru: 3,
    naalu: 4, naangu: 4,
    anju: 5, ainthu: 5,
    aaru: 6, ezhu: 7, ettu: 8, ombathu: 9, pathu: 10,
  };

  // Check intent types
  if (/show (veg|vegetarian)|pure veg|veg items/.test(lower)) {
    return { intent: 'FILTER_DIETARY', preference: 'Vegetarian', message: 'Showing vegetarian food options.' };
  }
  if (/find dessert|show dessert|sweets|halwa/.test(lower)) {
    return { intent: 'FILTER_CATEGORY', category: 'desserts', message: 'Displaying desserts and sweets.' };
  }
  if (/restaurants? near me|nearby restaurants?|hotel enga/.test(lower)) {
    return { intent: 'NAVIGATE_RESTAURANTS', message: 'Showing restaurants in your area.' };
  }
  if (/view cart|open cart|show my cart|cart kaatu/.test(lower)) {
    return { intent: 'NAVIGATE_CART', message: 'Opening your cart.' };
  }

  // Parse dish ordering intent
  const detectedItems = [];
  const segments = lower.split(/,| and |\+| kooda /);

  segments.forEach(seg => {
    let clean = seg.trim();
    let qty = 1;

    // Detect quantity digits (e.g. "2 biryani")
    const digitMatch = clean.match(/\b(\d+)\b/);
    if (digitMatch) {
      qty = parseInt(digitMatch[1], 10);
      clean = clean.replace(digitMatch[0], '').trim();
    } else {
      for (const [word, val] of Object.entries(numWords)) {
        const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
        if (wordRegex.test(clean)) {
          qty = val;
          clean = clean.replace(wordRegex, '').trim();
          break;
        }
      }
    }

    // Clean English & Tanglish filler phrases
    clean = clean
      .replace(/\b(i want|add to cart|add|order|please|give me|can i have|get me|of|plates?|portions?|add pannu|cart la podu|cart la|order pannu|venum|kudu|podu|parcel|vechu|kudunga|eduthuko|pack)\b/gi, '')
      .trim();

    if (!clean) return;

    // Match against catalog foods
    let bestMatch = null;
    let bestScore = 0;

    availableFoods.forEach(food => {
      const foodName = food.name.toLowerCase();
      if (foodName === clean) {
        bestMatch = food;
        bestScore = 100;
      } else if (clean.includes(foodName) || foodName.includes(clean)) {
        if (foodName.length > bestScore) {
          bestMatch = food;
          bestScore = foodName.length;
        }
      }
    });

    if (bestMatch) {
      detectedItems.push({
        food: bestMatch,
        name: bestMatch.name,
        price: bestMatch.price,
        qty,
        total: bestMatch.price * qty,
      });
    }
  });

  const estimatedTotal = detectedItems.reduce((acc, it) => acc + it.total, 0);

  return {
    intent: detectedItems.length > 0 ? 'ORDER_ITEMS' : 'UNKNOWN',
    transcript: raw,
    items: detectedItems,
    estimatedTotal,
    message: detectedItems.length > 0
      ? `Understood ${detectedItems.length} item(s) from your voice command.`
      : "Couldn't match specific dishes from speech. Try saying: 'I want one Chicken Biryani and one Lime Soda'.",
  };
}

// --------------------------------------------------------------------------
// 4. AI PRICE DROP ALERTS & HISTORY
// --------------------------------------------------------------------------
export function detectPriceDrops(foodsOrOrders = FOODS, maybeOrders = []) {
  let foods = FOODS;
  let orders = [];

  // Robustly handle single-argument invocation with orders: detectPriceDrops(orders)
  if (Array.isArray(foodsOrOrders) && foodsOrOrders.length > 0 && (foodsOrOrders[0]?.items || foodsOrOrders[0]?.total !== undefined)) {
    orders = foodsOrOrders;
    foods = FOODS;
  } else if (Array.isArray(foodsOrOrders) && foodsOrOrders.length > 0 && foodsOrOrders[0]?.price !== undefined) {
    foods = foodsOrOrders;
    orders = Array.isArray(maybeOrders) ? maybeOrders : [];
  } else {
    foods = FOODS;
    orders = Array.isArray(maybeOrders) ? maybeOrders : [];
  }

  // Extract historical prices from orders
  const priceHistoryMap = {};

  orders.forEach(ord => {
    const dateStr = ord?.date || new Date().toISOString().slice(0, 10);
    (ord?.items || []).forEach(it => {
      if (it?.name) {
        if (!priceHistoryMap[it.name]) priceHistoryMap[it.name] = [];
        priceHistoryMap[it.name].push({ date: dateStr, price: it.price || 0 });
      }
    });
  });

  // Calculate price drops based on discount and order history
  const drops = [];

  (foods || []).forEach(food => {
    if (!food || !food.name) return;

    const history = priceHistoryMap[food.name] || [
      { date: '20 Sep', price: (food.price || 150) + (food.discount || 30) },
      { date: '24 Sep', price: (food.price || 150) + Math.round((food.discount || 20) / 2) },
      { date: '28 Sep', price: food.price || 150 },
    ];

    const prevPrice = history[0]?.price || ((food.price || 150) + (food.discount || 30));
    const currentPrice = food.price || 150;
    const diff = prevPrice - currentPrice;

    if (diff > 0 || (food.discount && food.discount > 0)) {
      const dropAmount = diff > 0 ? diff : (food.discount || 20);
      const itemDrop = {
        foodId: food.id || 'f1',
        name: food.name,
        image: food.image || '',
        category: food.category || '',
        restaurantId: food.restaurantId || 'r1',
        restaurantName: food.restaurantName || 'Zestro Kitchen',
        currentPrice,
        previousPrice: prevPrice,
        dropAmount,
        discountPct: Math.round((dropAmount / prevPrice) * 100),
        history,
      };
      // Provide both .name and .food.name for complete backward compatibility
      itemDrop.food = { ...itemDrop, ...food, name: food.name };
      drops.push(itemDrop);
    }
  });

  return drops.sort((a, b) => b.dropAmount - a.dropAmount);
}

// --------------------------------------------------------------------------
// 5. ASK ZESTRO — AI DINING ASSISTANT QUERIES
// --------------------------------------------------------------------------
export function queryAskZestro(query, context = {}) {
  const lower = query.toLowerCase().trim();
  const { foods = FOODS, restaurants = RESTAURANTS, orders = [], userLocation = 'Kovilpatti' } = context;

  // 0A. Tamil & Tanglish Greetings and Conversational Intents
  if (/^(vanakkam|hi|hello|hey|namaste|hlo|mapla|bro|thala)\b/i.test(lower)) {
    const popularDishes = foods.filter(f => f.isBestseller).slice(0, 3);
    return {
      text: "Vanakkam! 🙏 Naan dhaan ZESTRO AI Butler. Inaiku ungalukku enna saapada pidikkum? Biryani, Hot Parotta, illa Healthy Veg Combo-va? Enkitta voice or chat moolama sollunga!",
      items: popularDishes,
      actions: [
        { label: "🌙 Late-Night Biryani", action: "OPEN_MOOD", mood: "late-night" },
        { label: "💰 Under ₹250 Budget", action: "OPEN_MOOD", mood: "budget-beast" },
        { label: "🍽️ Book a Table", action: "NAVIGATE", url: "/book-table" },
      ],
    };
  }

  // 0B. Tamil & Tanglish Direct Food Cravings (e.g. "biryani venum", "saapada sollu", "parotta kudu", "dosa iruka")
  if (/venum|saapada|sapda|kudu|iruka|paaru|edhavadhu|solla/i.test(lower)) {
    const matchedFoods = foods.filter(f => {
      const fn = f.name.toLowerCase();
      const fc = (f.category || '').toLowerCase();
      return (lower.includes('biryani') && fn.includes('biryani')) ||
             (lower.includes('parotta') && fn.includes('parotta')) ||
             (lower.includes('dosa') && fn.includes('dosa')) ||
             (lower.includes('chicken') && fn.includes('chicken')) ||
             (lower.includes('paneer') && fn.includes('paneer')) ||
             (lower.includes('halwa') && fn.includes('halwa')) ||
             lower.includes(fn) || lower.includes(fc);
    });

    if (matchedFoods.length > 0) {
      const topPicks = matchedFoods.slice(0, 3);
      return {
        text: `Kandippa! Ungalukku pidicha freshly prepared authentic dishes list inga irukku. Direct-ah "Add to Cart" panni order pannalaam:`,
        items: topPicks,
        actions: [
          { label: "⚡ Add Top Pick to Cart", action: "ADD_COMBO_TO_CART", data: [topPicks[0]] },
          { label: "Browse Full Menu", action: "NAVIGATE", url: "/menu" },
        ],
      };
    }
  }

  // 0. AI Mood & Combo Craving Handler (Voice or Chip input)
  const moodPatterns = [
    { key: 'late-night', title: 'Late-Night Munchies Combo', test: /late night|midnight|craving|night/i, words: ['biryani', 'chicken', 'parotta', 'gravy'], emoji: '🌙' },
    { key: 'gym-protein', title: 'High Protein Muscle Fuel', test: /gym|protein|muscle|workout|fitness|diet/i, words: ['tandoori', 'chicken', 'paneer', 'egg', 'fish'], emoji: '🏋️' },
    { key: 'rainy-crispy', title: 'Rainy Day Hot & Crispy Feast', test: /rain|rainy|crispy|crunchy|tea|coffee|snack|vadai/i, words: ['rasam', 'soup', 'vadai', 'fry', 'tea', 'coffee'], emoji: '🌧️' },
    { key: 'budget-beast', title: 'Budget Beast Power Combo', test: /budget|cheap|under 250|under 200|affordable|value/i, words: ['meals', 'thali', 'dosa', 'idli', 'parotta'], emoji: '💰' },
    { key: 'squad-feast', title: 'Squad Party Sharing Platter', test: /party|squad|friends|group|gang|family feast/i, words: ['biriyani', 'biryani', 'bucket', 'platter', 'chicken'], emoji: '🎉' },
    { key: 'guilt-free', title: 'Guilt-Free Healthy Green Plate', test: /healthy|veg|green|diet|light|salad|clean/i, words: ['veg', 'curd', 'salad', 'juice', 'soup', 'idli'], emoji: '🥗' },
    { key: 'fiery-spice', title: 'Fiery Chettinad Spice Challenge', test: /spicy|hot|fire|pepper|chettinad|chukka/i, words: ['spicy', 'pepper', 'chukka', 'chettinad', 'salna'], emoji: '🔥' },
    { key: 'sweet-therapy', title: 'Sweet Tooth Dessert Paradise', test: /sweet|dessert|halwa|ice cream|shake|chocolate/i, words: ['halwa', 'sweet', 'ice cream', 'shake', 'dessert'], emoji: '🍨' },
    { key: 'biryani-combo', title: 'Signature Dum Biryani Combo', test: /biryani|biriyani/i, words: ['biriyani', 'biryani', 'chicken', 'egg', 'raita'], emoji: '🍛' },
  ];

  const matchedMood = moodPatterns.find(m => m.test.test(lower));
  if (matchedMood) {
    const locRests = restaurants.filter(r => {
      const area = r.area || r.address?.city || r.address?.area;
      return !userLocation || userLocation === 'All' || (area && area.toLowerCase().includes(userLocation.toLowerCase()));
    });
    const targetRest = locRests[0] || restaurants[0] || { id: 'r1', name: 'Annapoorna Mess' };
    const restKey = targetRest.id || targetRest._id || 'r1';

    let restFoods = foods.filter(f => (f.restaurantId === restKey || f.restaurantId === 'r1'));
    if (restFoods.length === 0) restFoods = foods.slice(0, 8);

    let comboDishes = restFoods.filter(f => {
      const t = `${f.name} ${f.description || ''} ${f.category || ''}`.toLowerCase();
      return matchedMood.words.some(w => t.includes(w));
    }).slice(0, 3);

    if (comboDishes.length < 2) {
      comboDishes = restFoods.slice(0, 3);
    }

    const rawTotal = comboDishes.reduce((sum, d) => sum + (d.price || 120), 0);
    const comboPrice = Math.round(rawTotal * 0.8);
    const savings = rawTotal - comboPrice;

    return {
      text: `${matchedMood.emoji} Here is your freshly curated ${matchedMood.title} from ${targetRest.name}! I've unlocked an instant 20% AI discount:`,
      combo: {
        title: matchedMood.title,
        restaurantName: targetRest.name,
        restaurantId: restKey,
        dishes: comboDishes,
        rawTotal,
        comboPrice,
        savings,
        protein: comboDishes.some(d => !d.veg) ? 42 : 18,
        calories: comboDishes.length * 260,
        spiceLevel: comboDishes.some(d => d.spicy) ? 'Fiery Hot 🔥' : 'Balanced Mild ✨',
      },
      items: comboDishes,
      actions: [
        { label: `⚡ Add Entire Combo (Save ₹${savings})`, action: 'ADD_COMBO_TO_CART', data: comboDishes },
        { label: 'View Restaurant Menu', action: 'NAVIGATE', url: `/restaurant/${restKey}` },
      ],
    };
  }

  // 1. Budget and Group Size: e.g. "I have ₹600 and 3 people"
  const budgetMatch = lower.match(/(?:₹|rs\.?|inr)?\s*(\d{2,5})/i);
  const peopleMatch = lower.match(/(\d+)\s*(?:people|persons?|guests?|friends?|family)/i);

  if (budgetMatch && (peopleMatch || /people|person|guest/i.test(lower))) {
    const budget = parseInt(budgetMatch[1], 10);
    const people = peopleMatch ? parseInt(peopleMatch[1], 10) : 3;
    const perPerson = Math.floor(budget / people);

    // Pick affordable dishes
    const suitableFoods = foods
      .filter(f => f.price <= perPerson && f.available !== false)
      .slice(0, people);

    const comboTotal = suitableFoods.reduce((acc, f) => acc + f.price, 0);

    return {
      text: `I've put together a delicious combination that comfortably fits ₹${budget} for ${people} people (approx ₹${perPerson} per person):`,
      items: suitableFoods,
      total: comboTotal,
      actions: [
        { label: 'Add All to Cart', action: 'ADD_COMBO_TO_CART', data: suitableFoods },
        { label: 'View Restaurants', action: 'NAVIGATE', url: '/restaurants' },
      ],
    };
  }

  // 2. Outdoor / Seating preference: e.g. "Which restaurant has outdoor seating?"
  if (/outdoor|garden|window|seating|terrace/i.test(lower)) {
    const matchingRests = restaurants.filter(r => r.hasTableBooking);
    return {
      text: `Here are popular restaurants in ${userLocation} that feature pleasant outdoor, garden & window seating:`,
      restaurants: matchingRests.slice(0, 3),
      actions: matchingRests.slice(0, 2).map(r => ({
        label: `Book Table at ${r.name.split(' ')[0]}`,
        action: 'NAVIGATE',
        url: `/restaurant/${r.id}/live-layout`,
      })),
    };
  }

  // 3. Table at a specific time: e.g. "Which restaurant has a table at 7:30 PM?"
  if (/table at|booking at|available at|\d{1,2}:\d{2}/i.test(lower)) {
    const timeMatch = lower.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?)/i);
    const targetTime = timeMatch ? timeMatch[1].toUpperCase() : '7:30 PM';
    const availableRests = restaurants.filter(r => r.hasTableBooking && r.status !== 'Closed');

    return {
      text: `I checked verified table availability at ${targetTime} for ${userLocation}:`,
      restaurants: availableRests.slice(0, 3),
      actions: availableRests.slice(0, 2).map(r => ({
        label: `Reserve ${r.name.split(' ')[0]} for ${targetTime}`,
        action: 'NAVIGATE',
        url: `/book-table/${r.id}`,
      })),
    };
  }

  // 4. Low budget: e.g. "What can I eat under ₹300?" or "under 200"
  if (/under|below|budget|less than/i.test(lower) && budgetMatch) {
    const maxPrice = parseInt(budgetMatch[1], 10);
    const matchingFoods = foods.filter(f => f.price <= maxPrice && f.available !== false).slice(0, 4);

    return {
      text: `Here are the top-rated culinary delights under ₹${maxPrice} freshly prepared near you:`,
      items: matchingFoods,
      actions: [
        { label: 'Explore Budget Foods', action: 'NAVIGATE', url: '/menu' },
      ],
    };
  }

  // 5. Last order: e.g. "Show my last order"
  if (/last order|recent order|previous order|what did i order/i.test(lower)) {
    const lastOrder = orders[0];
    if (!lastOrder) {
      return {
        text: "You haven't placed an order yet. Browse our verified menus to place your first authentic feast!",
        actions: [{ label: 'Explore Menu', action: 'NAVIGATE', url: '/menu' }],
      };
    }

    return {
      text: `Your last order was **${lastOrder.id}** from **${lastOrder.restaurantName}** (Total: ₹${lastOrder.grandTotal || lastOrder.itemsTotal || 350}):`,
      order: lastOrder,
      actions: [
        { label: 'Track Order', action: 'NAVIGATE', url: `/track-order/${lastOrder.id}` },
        { label: 'View E-Bill', action: 'NAVIGATE', url: `/ebill/${lastOrder.id}` },
      ],
    };
  }

  // Default fallback
  const topFoods = foods.filter(f => f.isBestseller).slice(0, 3);
  return {
    text: `I'm ZESTRO, your intelligent dining concierge! I can help you find dishes by budget, check live table availability, locate outdoor seating, or track previous orders.`,
    items: topFoods,
    actions: [
      { label: '✨ View Recommendations', action: 'NAVIGATE', url: '/recommendations' },
      { label: '💸 Check Price Drops', action: 'NAVIGATE', url: '/price-alerts' },
      { label: '🍽️ Book a Table', action: 'NAVIGATE', url: '/book-table' },
    ],
  };
}

// --------------------------------------------------------------------------
// 6. SMART DIETARY PREFERENCE MATRIX
// --------------------------------------------------------------------------
export const DIETARY_PREFERENCES = [
  { id: 'veg', label: 'Vegetarian', emoji: '🟢', desc: 'Plant-based & dairy items without meat or fish' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱', desc: '100% plant-based with zero animal or dairy products' },
  { id: 'high-protein', label: 'High Protein', emoji: '💪', desc: 'Dishes rich in lentils, paneer, chicken or fish' },
  { id: 'low-calorie', label: 'Low Calorie', emoji: '🥗', desc: 'Light, nutrient-dense preparations under 350 kcal' },
  { id: 'no-onion', label: 'No Onion', emoji: '🧅❌', desc: 'Authentic Jain & traditional satvik preparations' },
  { id: 'no-garlic', label: 'No Garlic', emoji: '🧄❌', desc: 'Prepared with asafoetida & cumin, without garlic' },
  { id: 'gluten-free', label: 'Gluten-Free', emoji: '🌾❌', desc: 'Naturally gluten-free rice, millet and corn recipes' },
];

export function matchesDietaryPreferences(food, activePreferences = []) {
  if (!activePreferences.length) return true;

  for (const pref of activePreferences) {
    if (pref === 'veg' && !food.veg) return false;
    if (pref === 'vegan' && (!food.veg || food.category === 'tea-coffee' || food.category === 'desserts')) return false;
    if (pref === 'high-protein' && !['biriyani', 'non-veg', 'meals', 'seafood'].includes(food.category) && !food.name.includes('Paneer')) return false;
    if (pref === 'low-calorie' && ['biriyani', 'parotta', 'kothu-parotta', 'fast-food'].includes(food.category)) return false;
    if (pref === 'no-onion' && (food.category === 'biriyani' || food.category === 'kothu-parotta')) return false;
    if (pref === 'no-garlic' && (food.category === 'non-veg' || food.category === 'chinese')) return false;
    if (pref === 'gluten-free' && (food.category === 'parotta' || food.category === 'bakery' || food.category === 'fast-food')) return false;
  }
  return true;
}
