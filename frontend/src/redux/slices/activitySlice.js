import { createSlice } from '@reduxjs/toolkit';

const SEED_ACTIVITIES = [
  {
    id: 'act_1042',
    action: 'Customer Placed Order',
    admin: 'dheivalakshmi7@gmail.com',
    entity: 'Order #ZST-1042 (Dheiva)',
    entityType: 'Order',
    prevValue: 'Cart',
    newValue: '₹420 (Chicken Biryani × 2 at A2B - Kovilpatti)',
    timestamp: new Date(Date.now() - 120000).toISOString(), // 2 min ago
    ip: '192.168.1.104',
  },
  {
    id: 'act_t12',
    action: 'Customer Booked Table',
    admin: 'dheivalakshmi7@gmail.com',
    entity: 'Table T-12 (Dheiva)',
    entityType: 'Booking',
    prevValue: 'Available',
    newValue: 'Reserved for 4 guests (Dindigul Thalappakatti)',
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    ip: '192.168.1.104',
  },
  {
    id: 'act_1040',
    action: 'Order Stage Advanced',
    admin: 'dheivalakshmi7@gmail.com',
    entity: 'Order #ZST-1040',
    entityType: 'Order',
    prevValue: 'Confirmed',
    newValue: 'Preparing (Kitchen Station 2)',
    timestamp: new Date(Date.now() - 480000).toISOString(), // 8 min ago
    ip: '192.168.1.104',
  },
  {
    id: 'act_bk2047',
    action: 'Table Booking Confirmed',
    admin: 'dheivalakshmi7@gmail.com',
    entity: 'Booking BK-2047',
    entityType: 'Booking',
    prevValue: 'Requested',
    newValue: 'Confirmed (Table T-4, Window Seating)',
    timestamp: new Date(Date.now() - 720000).toISOString(), // 12 min ago
    ip: '192.168.1.104',
  },
  {
    id: 'act_reg1',
    action: 'New Customer Registered',
    admin: 'system@zestro.com',
    entity: 'Dheiva Lakshmi',
    entityType: 'Customer',
    prevValue: 'Guest',
    newValue: 'Verified Account (Gold Tier Member)',
    timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
    ip: '192.168.1.104',
  },
  {
    id: 'act_1',
    action: 'Changed Order Status',
    admin: 'dheivalakshmi7@gmail.com',
    entity: 'Order #ORD-729104',
    entityType: 'Order',
    prevValue: 'Out for Delivery',
    newValue: 'Delivered',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    ip: '192.168.1.104',
  },
];

function loadActivities() {
  try {
    const stored = JSON.parse(localStorage.getItem('zestro_activities'));
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    localStorage.setItem('zestro_activities', JSON.stringify(SEED_ACTIVITIES));
    return SEED_ACTIVITIES;
  } catch {
    return SEED_ACTIVITIES;
  }
}

function persist(activities) {
  try {
    localStorage.setItem('zestro_activities', JSON.stringify(activities));
  } catch (e) {
    console.error('Failed to persist activities:', e);
  }
}

const activitySlice = createSlice({
  name: 'activity',
  initialState: {
    activities: loadActivities(),
  },
  reducers: {
    logActivity(state, action) {
      const entry = {
        id: `act_${Date.now()}`,
        admin: 'dheivalakshmi7@gmail.com',
        timestamp: new Date().toISOString(),
        ip: '192.168.1.104 (Admin Session)',
        ...action.payload,
      };
      state.activities.unshift(entry);
      if (state.activities.length > 100) {
        state.activities.pop();
      }
      persist(state.activities);
    },
    clearActivities(state) {
      state.activities = [];
      persist(state.activities);
    },
  },
});

export const { logActivity, clearActivities } = activitySlice.actions;
export default activitySlice.reducer;
