/**
 * Chef Workload & Preparation Time Utility for ZESTRO
 * 
 * Provides rule-based workload balancing and estimated preparation times
 * based on actual dish types, portion quantities, active queue state, and kitchen capacity.
 * 
 * Note: Identifies as rule-based estimates (no fake AI/ML claims).
 */

export const DISH_BASE_PREP_TIMES = {
  // Biryani & Rice
  'Chicken Biryani': 18,
  'Thalappakatti Mutton Biriyani': 20,
  'Mutton Biryani': 20,
  'Veg Biryani': 14,
  'Paneer Biryani': 15,
  'Chicken 65 Biriyani': 18,
  // Starters & Grills
  'Chicken 65': 12,
  'Paneer 65': 10,
  'Buhari Chicken 65': 12,
  'Mutton Chukka': 16,
  'Pepper Chicken': 14,
  'Pepper Chicken Gravy': 15,
  // Tiffin & Breads
  'Special Masala Dosa': 10,
  'Ghee Podi Idli': 8,
  'Ven Pongal': 10,
  'Medu Vada (2 pcs)': 10,
  'Chicken Kothu Parotta': 14,
  'Egg Ceylon Parotta': 12,
  // Drinks & Desserts
  'Fresh Lime Soda': 5,
  'Lime Soda': 5,
  'South Indian Filter Coffee': 5,
  'Filter Coffee': 5,
  'Tirunelveli Ghee Halwa': 8,
  'Badam Milk': 5,
};

/**
 * Returns base preparation time in minutes for a given dish name using configurable values
 */
export function getDishBasePrepTime(dishName = '') {
  if (!dishName) return 15;
  const match = Object.keys(DISH_BASE_PREP_TIMES).find(
    k => k.toLowerCase() === dishName.toLowerCase() || dishName.toLowerCase().includes(k.toLowerCase())
  );
  if (match) return DISH_BASE_PREP_TIMES[match];

  const lower = dishName.toLowerCase();
  if (lower.includes('biryani')) return 18;
  if (lower.includes('mutton') || lower.includes('sukka') || lower.includes('chukka')) return 16;
  if (lower.includes('chicken') || lower.includes('fish') || lower.includes('kebab') || lower.includes('tikka')) return 14;
  if (lower.includes('dosa') || lower.includes('parotta') || lower.includes('roti') || lower.includes('naan')) return 11;
  if (lower.includes('idli') || lower.includes('pongal') || lower.includes('vada') || lower.includes('sambar')) return 8;
  if (lower.includes('soda') || lower.includes('coffee') || lower.includes('tea') || lower.includes('juice') || lower.includes('shake')) return 5;
  if (lower.includes('halwa') || lower.includes('dessert') || lower.includes('sweet') || lower.includes('ice cream')) return 7;
  return 15; // default standard kitchen prep
}

/**
 * Calculate estimated preparation duration for a single order.
 * Avoids adding the entire queue repeatedly by applying a staggered concurrency offset.
 */
export function calculateOrderPrepEstimate(order, allStationOrders = [], kitchenStatus = 'Available') {
  if (!order || !order.items || order.items.length === 0) {
    return {
      prepMinutes: 15,
      estReadyTimeMs: Date.now() + 15 * 60000,
      placedTimeStr: 'Recent',
      isDelayed: false,
    };
  }

  // 1. Longest single dish base prep time in this order
  const itemPrepTimes = order.items.map(it => getDishBasePrepTime(it.name));
  const maxDishBaseTime = Math.max(...itemPrepTimes, 10);

  // 2. Extra portion / dish count adjustment (concurrency in same order)
  const totalQty = order.items.reduce((sum, it) => sum + (Number(it.qty) || 1), 0);
  const extraItemsTime = Math.max(0, (totalQty - 1) * 2);

  // 3. Current kitchen capacity / status factor
  const statusOffset = kitchenStatus === 'Busy' ? 4 : kitchenStatus === 'Temporarily Unavailable' ? 8 : 0;

  // 4. Pending queue position concurrency offset (not full linear sum of prior orders)
  // Count uncompleted orders placed before this one
  const orderCreatedMs = new Date(order.placedAt || order.createdAt || Date.now()).getTime();
  const priorOrdersCount = allStationOrders.filter(o => {
    if (o.id === order.id || o.cancelled || o.status === 'Ready' || o.status === 'Delivered') return false;
    const oTime = new Date(o.placedAt || o.createdAt || 0).getTime();
    return oTime < orderCreatedMs;
  }).length;

  // Realistic parallel preparation batch offset (cap at 12 mins to avoid artificial explosion)
  const queueOffset = Math.min(priorOrdersCount * 2.5, 12);

  const prepMinutes = Math.round(maxDishBaseTime + extraItemsTime + statusOffset + queueOffset);

  // 5. Calculate estimated ready time timestamp
  let baseStartTimeMs = orderCreatedMs;
  if (order.status === 'Preparing') {
    // If already in prep, check if timeline has a Preparing timestamp
    const prepEntry = (order.timeline || []).find(t => t.status === 'Preparing');
    if (prepEntry && prepEntry.at) {
      baseStartTimeMs = new Date(prepEntry.at).getTime();
    }
  }

  const estReadyTimeMs = baseStartTimeMs + prepMinutes * 60000;

  // 6. Check for delay: exceeded ready time while still in prep or delayed flag
  const now = Date.now();
  const isExceeded = (order.status === 'Placed' || order.status === 'Confirmed' || order.status === 'Preparing') && (now > estReadyTimeMs);
  const isDelayed = isExceeded || order.kitchenStatus === 'Delayed' || !!(order.incident && order.incident.paused);

  // Placed time display
  const placedTimeStr = order.placedAt || order.createdAt
    ? new Date(order.placedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Recent';

  // Ready time display
  const estReadyTimeStr = new Date(estReadyTimeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Actual completion time if ready
  let actualReadyTimeStr = null;
  if (order.status === 'Ready' || order.status === 'Delivered') {
    const readyTimeline = (order.timeline || []).find(t => t.status === 'Ready');
    const compTime = order.actualReadyTime || (readyTimeline && readyTimeline.at) || order.updatedAt || order.placedAt;
    if (compTime) {
      actualReadyTimeStr = new Date(compTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  return {
    prepMinutes,
    estReadyTimeMs,
    estReadyTimeStr,
    placedTimeStr,
    actualReadyTimeStr,
    isDelayed,
    isExceeded,
  };
}

/**
 * Determine Suggested Preparation Priority and reason for an order based on actual queue data
 */
export function getOrderSuggestedPriority(order, allStationOrders = [], kitchenStatus = 'Available') {
  if (!order || order.cancelled || order.status === 'Delivered' || order.status === 'Ready') {
    return { priority: 'Normal', reason: 'Order already fulfilled or completed.' };
  }

  const isDelayed = order.kitchenStatus === 'Delayed' || (order.incident && order.incident.paused);
  if (isDelayed) {
    return {
      priority: 'Urgent',
      reason: 'Incident or station delay reported; requires immediate recovery priority.',
    };
  }

  // Check prep duration
  const { prepMinutes } = calculateOrderPrepEstimate(order, allStationOrders, kitchenStatus);
  const orderCreatedMs = new Date(order.placedAt || order.createdAt || Date.now()).getTime();
  const waitingMinutes = Math.round((Date.now() - orderCreatedMs) / 60000);

  // Check if order has been waiting long
  if (waitingMinutes > 25 || prepMinutes >= 22) {
    return {
      priority: 'High',
      reason: waitingMinutes > 25
        ? `Order waiting for ${waitingMinutes} mins in queue; fire dishes promptly.`
        : `Longer preparation duration (${prepMinutes} mins); start cooking early.`,
    };
  }

  if (order.priority === 'Urgent' || order.priority === 'High') {
    return {
      priority: order.priority,
      reason: 'Flagged with express operational handling priority.',
    };
  }

  if (prepMinutes <= 10) {
    return {
      priority: 'Normal',
      reason: 'Quick prep turnaround item; can be assembled in parallel.',
    };
  }

  return {
    priority: 'Normal',
    reason: 'Standard kitchen preparation sequence.',
  };
}

/**
 * Calculate overall Kitchen Workload Insights from actual available order data
 */
export function calculateKitchenWorkload(stationOrders = [], currentKitchenStatus = 'Available') {
  if (!stationOrders || stationOrders.length === 0) {
    return {
      hasData: false,
      workloadLevel: 'Low',
      totalDishesAwaiting: 0,
      estimatedDurationMinutes: 0,
      suggestedDish: null,
      reason: 'Insufficient data to calculate workload.',
    };
  }

  const activeOrders = stationOrders.filter(o => !o.cancelled && o.status !== 'Delivered' && o.status !== 'Cancelled');
  const pendingOrders = activeOrders.filter(o => o.status === 'Placed' || o.status === 'Confirmed');
  const preparingOrders = activeOrders.filter(o => o.status === 'Preparing');
  const delayedOrders = activeOrders.filter(o => o.kitchenStatus === 'Delayed' || (o.incident && o.incident.paused));

  // Count total dishes awaiting preparation
  let totalDishesAwaiting = 0;
  const dishCounts = {};

  activeOrders.forEach(o => {
    (o.items || []).forEach(it => {
      const q = Number(it.qty) || 1;
      if (o.status !== 'Ready') {
        totalDishesAwaiting += q;
        if (!dishCounts[it.name]) {
          dishCounts[it.name] = {
            name: it.name,
            pendingPortions: 0,
            preparingPortions: 0,
            basePrepTime: getDishBasePrepTime(it.name),
          };
        }
        if (o.status === 'Preparing') {
          dishCounts[it.name].preparingPortions += q;
        } else {
          dishCounts[it.name].pendingPortions += q;
        }
      }
    });
  });

  // Calculate estimated workload duration to clear queue
  const dishList = Object.values(dishCounts);
  let estimatedDurationMinutes = 0;
  if (dishList.length > 0) {
    const maxItemTime = Math.max(...dishList.map(d => d.basePrepTime), 10);
    const batchFactor = Math.ceil(totalDishesAwaiting / 4) * 3;
    const capacityFactor = currentKitchenStatus === 'Busy' ? 6 : 0;
    estimatedDurationMinutes = Math.min(maxItemTime + batchFactor + capacityFactor, 75);
  }

  // Workload Level: Low / Moderate / High
  let workloadLevel = 'Low';
  if (totalDishesAwaiting > 8 || activeOrders.length >= 5 || delayedOrders.length > 0 || currentKitchenStatus === 'Busy') {
    workloadLevel = 'High';
  } else if (totalDishesAwaiting >= 4 || activeOrders.length >= 2) {
    workloadLevel = 'Moderate';
  }

  // Find Suggested Preparation Priority
  // Pick dish with most pending portions and longest cooking time
  let suggestedDish = null;
  let suggestionReason = '';
  let suggestedPriority = 'Normal';

  if (dishList.length > 0) {
    const sorted = [...dishList].sort((a, b) => {
      const scoreB = b.pendingPortions * 2 + b.basePrepTime;
      const scoreA = a.pendingPortions * 2 + a.basePrepTime;
      return scoreB - scoreA;
    });

    const topDish = sorted[0];
    if (topDish.pendingPortions > 0 || topDish.preparingPortions > 0) {
      suggestedPriority = (topDish.pendingPortions >= 3 || topDish.basePrepTime >= 18) ? 'High' : 'Moderate';
      suggestedDish = {
        name: topDish.name,
        portions: topDish.pendingPortions || topDish.preparingPortions,
        prepMinutes: topDish.basePrepTime,
        priority: suggestedPriority,
      };

      if (topDish.pendingPortions >= 3 && topDish.basePrepTime >= 16) {
        suggestionReason = 'Multiple pending orders and longer preparation time.';
      } else if (topDish.basePrepTime >= 18) {
        suggestionReason = 'Longer cooking dish requiring immediate stove fire.';
      } else if (topDish.pendingPortions >= 2) {
        suggestionReason = 'Consolidated portion queue across incoming tickets.';
      } else {
        suggestionReason = 'Next in queue for active station prep.';
      }
    }
  }

  return {
    hasData: true,
    workloadLevel,
    totalDishesAwaiting,
    estimatedDurationMinutes,
    suggestedDish,
    suggestionReason,
    pendingOrdersCount: pendingOrders.length,
    preparingOrdersCount: preparingOrders.length,
    delayedOrdersCount: delayedOrders.length,
  };
}
