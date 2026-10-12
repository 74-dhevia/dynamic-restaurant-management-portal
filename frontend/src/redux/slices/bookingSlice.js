import { createSlice } from '@reduxjs/toolkit';

// Exact preparation and arrival journey states
export const JOURNEY_STEPS = [
  'Requested',
  'Confirmed',
  'Table Ready',
  'Customer Arrived',
  'Dining',
  'Completed',
];

export const BOOKING_STATUSES = [
  'Requested',
  'Confirmed',
  'Table Ready',
  'Customer Arrived',
  'Dining',
  'Completed',
  'Cancelled',
  'No Show',
];

export const CANCELLATION_REASONS = [
  'Customer Request',
  'Restaurant Unavailable',
  'Table Unavailable',
  'Kitchen Issue',
  'Operational Issue',
  'Other',
];

// Valid forward transitions in the lifecycle
export const ALLOWED_STATUS_TRANSITIONS = {
  'Requested': ['Confirmed', 'Cancelled', 'No Show'],
  'Confirmed': ['Table Ready', 'Cancelled', 'No Show'],
  'Table Ready': ['Customer Arrived', 'Cancelled', 'No Show'],
  'Customer Arrived': ['Dining', 'Cancelled'],
  'Dining': ['Completed', 'Cancelled'],
  'Completed': [],
  'Cancelled': [],
  'No Show': [],
};

export const SEED_BOOKINGS = [
  {
    id: 'BK-1024',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    customerEmail: 'dheiva@example.com',
    altEmail: 'dheivalakshmi7@gmail.com',
    customerPhone: '+91 98401 23456',
    customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r1',
    restaurantName: 'Annapoorna Mess',
    date: '2026-09-26',
    dateFormatted: '26 Sep',
    time: '7:30 PM',
    guests: 4,
    seating: 'Window',
    tableNumber: 'Table 06',
    tableId: 'Table 06',
    pin: '4827',
    verificationPin: '4827',
    tableBookingFee: 100,
    tableDetails: {
      number: 'Table 06',
      capacity: 4,
      location: 'Window',
      seatingType: 'Indoor',
      status: 'Reserved',
    },
    request: 'Quiet corner table near the window for family dinner',
    prepareBeforeArrival: true,
    prepSchedule: {
      tableTime: '7:30 PM',
      prepTime: '7:05 PM',
      readyTime: '7:25 PM',
    },
    preOrderItems: [
      { id: 'f1', name: 'Sambar Rice', price: 92, qty: 2, spiceLevel: 'Medium' },
      { id: 'f5', name: 'Special Meals', price: 150, qty: 1, spiceLevel: 'Mild' },
      { id: 'f9', name: 'Authentic Filter Coffee', price: 35, qty: 2, spiceLevel: 'None' },
    ],
    preOrderTotal: 404,
    grandTotal: 504,
    linkedOrderId: 'ZST-1024',
    status: 'Confirmed',
    journeyStep: 1, // 'Confirmed'
    reminderStatus: 'Scheduled',
    reminderText: 'Your ZESTRO table booking is scheduled for 7:30 PM today.',
    customerNotifications: [
      {
        id: 'notif_bk_1024_1',
        type: 'Confirmed',
        message: 'Your table booking has been confirmed.',
        sentAt: new Date(Date.now() - 3600000).toISOString(),
        channel: 'In-App',
      },
    ],
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'BK-2048',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    customerEmail: 'dheiva@example.com',
    altEmail: 'dheivalakshmi7@gmail.com',
    customerPhone: '+91 98401 23456',
    customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r4',
    restaurantName: 'Aasife Biriyani (Kovilpatti)',
    date: '2026-09-25',
    dateFormatted: '25 Sep',
    time: '8:30 PM',
    guests: 4,
    seating: 'Window',
    tableNumber: 'Table 02',
    tableId: 'Table 02',
    pin: '9134',
    verificationPin: '9134',
    tableBookingFee: 100,
    status: 'Confirmed',
    journeyStep: 1,
    linkedOrderId: 'ZST-1026',
    createdAt: '2026-09-25T15:00:00.000Z',
    updatedAt: '2026-09-25T15:30:00.000Z',
  },
  {
    id: 'BK-1003',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    customerEmail: 'dheiva@example.com',
    customerPhone: '+91 98401 23456',
    restaurantId: 'r16',
    restaurantName: 'Vaira Maaligai Restaurant',
    date: '2026-09-12',
    dateFormatted: '12 Sep',
    time: '1:00 PM',
    guests: 2,
    seating: 'Indoor',
    tableNumber: 'Table 04',
    tableId: 'Table 04',
    pin: '5281',
    verificationPin: '5281',
    tableBookingFee: 100,
    status: 'Completed',
    journeyStep: 5,
    createdAt: '2026-09-12T07:00:00.000Z',
    updatedAt: '2026-09-12T09:00:00.000Z',
    tableDetails: {
      number: 'T-12',
      capacity: 4,
      location: 'Window',
      seatingType: 'Indoor',
      status: 'Reserved',
    },
    request: 'Quiet corner table near the window for family dinner',
    prepareBeforeArrival: true,
    prepSchedule: {
      tableTime: '7:30 PM',
      prepTime: '7:05 PM',
      readyTime: '7:25 PM',
    },
    preOrderItems: [
      { id: 'f_biryani', name: 'Chicken Biryani', price: 220, qty: 2, spiceLevel: 'Medium' },
      { id: 'f8', name: 'Paneer 65', price: 180, qty: 1, spiceLevel: 'Mild' },
      { id: 'f9', name: 'Lime Soda', price: 60, qty: 2, spiceLevel: 'None' },
    ],
    preOrderTotal: 740,
    linkedOrderId: 'ZST-1024',
    status: 'Confirmed',
    journeyStep: 1, // 'Confirmed'
    reminderStatus: 'Scheduled',
    reminderText: 'Your ZESTRO table booking is scheduled for 7:30 PM today.',
    customerNotifications: [
      {
        id: 'notif_bk_1024_1',
        type: 'Confirmed',
        message: 'Your table booking has been confirmed.',
        sentAt: new Date(Date.now() - 3600000).toISOString(),
        channel: 'In-App',
      },
    ],
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'BK-1027',
    userId: 'u_priya',
    userName: 'Priya Sharma',
    customerName: 'Priya Sharma',
    userEmail: 'priya@example.com',
    customerPhone: '+91 98451 23456',
    customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r2',
    restaurantName: 'ABC Restaurant',
    date: '2026-09-26',
    dateFormatted: '26 Sep',
    time: '8:00 PM',
    guests: 2,
    seating: 'Indoor',
    tableNumber: 'T-02',
    tableId: 'T-02',
    tableDetails: {
      number: 'T-02',
      capacity: 2,
      location: 'Main Hall',
      seatingType: 'Indoor',
      status: 'Reserved',
    },
    request: 'Anniversary dessert surprise if possible',
    prepareBeforeArrival: true,
    prepSchedule: {
      tableTime: '8:00 PM',
      prepTime: '7:35 PM',
      readyTime: '7:55 PM',
    },
    preOrderItems: [
      { id: 'f_biryani', name: 'Chicken Biryani', price: 220, qty: 1, spiceLevel: 'Medium' },
      { id: 'f_dessert', name: 'Tirunelveli Halwa', price: 80, qty: 2, spiceLevel: 'None' },
    ],
    preOrderTotal: 380,
    linkedOrderId: 'ZST-1025',
    status: 'Requested',
    journeyStep: 0,
    reminderStatus: 'Scheduled',
    reminderText: 'Your ZESTRO table booking is scheduled for 8:00 PM today.',
    customerNotifications: [],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'BK-1031',
    userId: 'u_rahul',
    userName: 'Rahul Verma',
    customerName: 'Rahul Verma',
    userEmail: 'rahul@example.com',
    customerPhone: '+91 98765 43210',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r2',
    restaurantName: 'ABC Restaurant',
    date: '2026-09-26',
    dateFormatted: '26 Sep',
    time: '8:30 PM',
    guests: 6,
    seating: 'Family',
    tableNumber: 'T-05',
    tableId: 'T-05',
    tableDetails: {
      number: 'T-05',
      capacity: 6,
      location: 'Family Section',
      seatingType: 'Indoor',
      status: 'Reserved',
    },
    request: 'Baby high chair and extra plates needed',
    prepareBeforeArrival: false,
    preOrderItems: [],
    preOrderTotal: 0,
    linkedOrderId: null,
    status: 'Confirmed',
    journeyStep: 1,
    reminderStatus: 'Scheduled',
    reminderText: 'Your ZESTRO table booking is scheduled for 8:30 PM today.',
    customerNotifications: [
      {
        id: 'notif_bk_1031_1',
        type: 'Confirmed',
        message: 'Your table booking has been confirmed.',
        sentAt: new Date(Date.now() - 4000000).toISOString(),
        channel: 'In-App',
      },
    ],
    createdAt: new Date(Date.now() - 4000000).toISOString(),
    updatedAt: new Date(Date.now() - 4000000).toISOString(),
  },
  {
    id: 'BK-1010',
    userId: 'u_ananya',
    userName: 'Ananya Patel',
    customerName: 'Ananya Patel',
    userEmail: 'ananya@example.com',
    customerPhone: '+91 97123 45678',
    customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r1',
    restaurantName: 'A2B - Adyar Ananda Bhavan',
    date: '2026-09-26',
    dateFormatted: '26 Sep',
    time: '6:00 PM',
    guests: 2,
    seating: 'Indoor',
    tableNumber: 'T-03',
    tableId: 'T-03',
    tableDetails: {
      number: 'T-03',
      capacity: 2,
      location: 'Courtyard View',
      seatingType: 'Indoor',
      status: 'Occupied',
    },
    request: 'Fast service requested for evening meeting',
    prepareBeforeArrival: true,
    prepSchedule: {
      tableTime: '6:00 PM',
      prepTime: '5:35 PM',
      readyTime: '5:55 PM',
    },
    preOrderItems: [
      { id: 'f1', name: 'Ghee Podi Idli', price: 120, qty: 2 },
      { id: 'f_coffee', name: 'Filter Coffee', price: 40, qty: 2 },
    ],
    preOrderTotal: 320,
    linkedOrderId: 'ZST-1026',
    status: 'Customer Arrived',
    journeyStep: 3,
    reminderStatus: 'Sent',
    reminderText: 'Your ZESTRO table booking is scheduled for 6:00 PM today.',
    customerNotifications: [
      {
        id: 'notif_bk_1010_1',
        type: 'Confirmed',
        message: 'Your table booking has been confirmed.',
        sentAt: new Date(Date.now() - 14400000).toISOString(),
        channel: 'In-App',
      },
      {
        id: 'notif_bk_1010_2',
        type: 'Table Ready',
        message: 'Your table is ready.',
        sentAt: new Date(Date.now() - 3600000).toISOString(),
        channel: 'In-App',
      },
    ],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'BK-1012',
    userId: 'u_vikram',
    userName: 'Vikram Singh',
    customerName: 'Vikram Singh',
    userEmail: 'vikram@example.com',
    customerPhone: '+91 99887 76655',
    customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r1',
    restaurantName: 'A2B - Adyar Ananda Bhavan',
    date: '2026-09-26',
    dateFormatted: '26 Sep',
    time: '6:30 PM',
    guests: 4,
    seating: 'Window',
    tableNumber: 'T-04',
    tableId: 'T-04',
    tableDetails: {
      number: 'T-04',
      capacity: 4,
      location: 'Window View',
      seatingType: 'Window',
      status: 'Cleaning',
    },
    request: 'Extra water carafes and lime wedges',
    prepareBeforeArrival: false,
    preOrderItems: [],
    preOrderTotal: 0,
    linkedOrderId: null,
    status: 'Table Ready',
    journeyStep: 2,
    reminderStatus: 'Sent',
    reminderText: 'Your ZESTRO table booking is scheduled for 6:30 PM today.',
    customerNotifications: [
      {
        id: 'notif_bk_1012_1',
        type: 'Confirmed',
        message: 'Your table booking has been confirmed.',
        sentAt: new Date(Date.now() - 10800000).toISOString(),
        channel: 'In-App',
      },
      {
        id: 'notif_bk_1012_2',
        type: 'Table Ready',
        message: 'Your table is ready.',
        sentAt: new Date(Date.now() - 1200000).toISOString(),
        channel: 'In-App',
      },
    ],
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    updatedAt: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: 'BK-1014',
    userId: 'u_sneha',
    userName: 'Sneha Rao',
    customerName: 'Sneha Rao',
    userEmail: 'sneha@example.com',
    customerPhone: '+91 96543 21890',
    customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r3',
    restaurantName: 'Sree Annapoorna',
    date: '2026-09-26',
    dateFormatted: '26 Sep',
    time: '7:00 PM',
    guests: 3,
    seating: 'Outdoor',
    tableNumber: 'T-01',
    tableId: 'T-01',
    tableDetails: {
      number: 'T-01',
      capacity: 4,
      location: 'Garden Patio',
      seatingType: 'Outdoor',
      status: 'Occupied',
    },
    request: 'Outdoor lawn table',
    prepareBeforeArrival: true,
    prepSchedule: {
      tableTime: '7:00 PM',
      prepTime: '6:35 PM',
      readyTime: '6:55 PM',
    },
    preOrderItems: [
      { id: 'f_halwa', name: 'Tirunelveli Ghee Halwa', price: 90, qty: 3 },
      { id: 'f_tea', name: 'Masala Tea', price: 30, qty: 3 },
    ],
    preOrderTotal: 360,
    linkedOrderId: null,
    status: 'Dining',
    journeyStep: 4,
    reminderStatus: 'Sent',
    reminderText: 'Your ZESTRO table booking is scheduled for 7:00 PM today.',
    customerNotifications: [
      {
        id: 'notif_bk_1014_1',
        type: 'Confirmed',
        message: 'Your table booking has been confirmed.',
        sentAt: new Date(Date.now() - 7200000).toISOString(),
        channel: 'In-App',
      },
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 'BK-1020',
    userId: 'u_karthik',
    userName: 'Karthik Raja',
    customerName: 'Karthik Raja',
    userEmail: 'karthik@example.com',
    customerPhone: '+91 94441 55667',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r4',
    restaurantName: 'Junior Kuppanna',
    date: '2026-09-26',
    dateFormatted: '26 Sep',
    time: '7:30 PM',
    guests: 6,
    seating: 'Family',
    tableNumber: 'T-06',
    tableId: 'T-06',
    tableDetails: {
      number: 'T-06',
      capacity: 6,
      location: 'Family Cabin',
      seatingType: 'Indoor',
      status: 'Reserved',
    },
    request: 'Spicy chicken fry starters requested',
    prepareBeforeArrival: false,
    preOrderItems: [],
    preOrderTotal: 0,
    linkedOrderId: null,
    status: 'Confirmed',
    journeyStep: 1,
    reminderStatus: 'Scheduled',
    reminderText: 'Your ZESTRO table booking is scheduled for 7:30 PM today.',
    customerNotifications: [
      {
        id: 'notif_bk_1020_1',
        type: 'Confirmed',
        message: 'Your table booking has been confirmed.',
        sentAt: new Date(Date.now() - 3600000).toISOString(),
        channel: 'In-App',
      },
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  // Historical Records for /admin/booking-history
  {
    id: 'BK-1002',
    userId: 'u_dheiva',
    userName: 'Dheiva',
    customerName: 'Dheiva',
    userEmail: 'dheivalakshmi7@gmail.com',
    customerPhone: '+91 98401 23456',
    customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r2',
    restaurantName: 'ABC Restaurant',
    date: '2026-09-25',
    dateFormatted: '25 Sep',
    time: '7:30 PM',
    guests: 4,
    seating: 'Window',
    tableNumber: 'T-12',
    tableId: 'T-12',
    tableDetails: {
      number: 'T-12',
      capacity: 4,
      location: 'Window',
      seatingType: 'Indoor',
      status: 'Available',
    },
    request: 'Standard visit',
    prepareBeforeArrival: true,
    preOrderItems: [
      { id: 'f_biryani', name: 'Chicken Biryani', price: 220, qty: 2 },
    ],
    preOrderTotal: 440,
    linkedOrderId: 'ZST-1018',
    status: 'Completed',
    journeyStep: 5,
    reminderStatus: 'Sent',
    customerNotifications: [
      {
        id: 'notif_bk_1002_1',
        type: 'Confirmed',
        message: 'Your table booking has been confirmed.',
        sentAt: '2026-09-25T14:00:00.000Z',
        channel: 'In-App',
      },
    ],
    createdAt: '2026-09-25T13:00:00.000Z',
    completedAt: '2026-09-25T21:15:00.000Z',
  },
  {
    id: 'BK-1004',
    userId: 'u_rahul',
    userName: 'Rahul Verma',
    customerName: 'Rahul Verma',
    userEmail: 'rahul@example.com',
    customerPhone: '+91 98765 43210',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r3',
    restaurantName: 'Sree Annapoorna',
    date: '2026-09-24',
    dateFormatted: '24 Sep',
    time: '8:00 PM',
    guests: 2,
    seating: 'Indoor',
    tableNumber: 'T-02',
    tableId: 'T-02',
    tableDetails: {
      number: 'T-02',
      capacity: 2,
      location: 'Main Hall',
      seatingType: 'Indoor',
      status: 'Available',
    },
    request: 'Quiet table',
    prepareBeforeArrival: false,
    preOrderItems: [],
    preOrderTotal: 0,
    linkedOrderId: null,
    status: 'Cancelled',
    cancellationReason: 'Customer Request',
    cancelledAt: '2026-09-24T18:30:00.000Z',
    journeyStep: 0,
    reminderStatus: 'Not Required',
    customerNotifications: [
      {
        id: 'notif_bk_1004_1',
        type: 'Cancelled',
        message: 'Your table booking has been cancelled.',
        sentAt: '2026-09-24T18:30:00.000Z',
        channel: 'In-App',
      },
    ],
    createdAt: '2026-09-24T12:00:00.000Z',
  },
  {
    id: 'BK-1005',
    userId: 'u_priya',
    userName: 'Priya Sharma',
    customerName: 'Priya Sharma',
    userEmail: 'priya@example.com',
    customerPhone: '+91 98451 23456',
    customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r1',
    restaurantName: 'A2B - Adyar Ananda Bhavan',
    date: '2026-09-23',
    dateFormatted: '23 Sep',
    time: '7:00 PM',
    guests: 2,
    seating: 'Window',
    tableNumber: 'T-03',
    tableId: 'T-03',
    tableDetails: {
      number: 'T-03',
      capacity: 2,
      location: 'Courtyard View',
      seatingType: 'Indoor',
      status: 'Available',
    },
    request: 'Corner table',
    prepareBeforeArrival: false,
    preOrderItems: [],
    preOrderTotal: 0,
    linkedOrderId: null,
    status: 'No Show',
    journeyStep: 1,
    reminderStatus: 'Sent',
    customerNotifications: [],
    createdAt: '2026-09-23T15:00:00.000Z',
  },
];

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem('zestro_bookings'));
    if (stored && Array.isArray(stored) && stored.length > 0) {
      let changed = false;
      const patched = stored.map(b => {
        let updated = { ...b };
        if (!updated.pin && !updated.verificationPin) {
          changed = true;
          const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
          updated.pin = randomPin;
          updated.verificationPin = randomPin;
        }
        if (updated.restaurantName === 'ABC Restaurant' || updated.restaurantName === 'A2B - Adyar Ananda Bhavan') {
          changed = true;
          updated.restaurantName = 'Annapoorna Mess';
          updated.restaurantId = 'r1';
        }
        return updated;
      });

      const existingIds = new Set(patched.map(b => b.id));
      const merged = [...patched];
      SEED_BOOKINGS.forEach(seed => {
        if (!existingIds.has(seed.id)) {
          merged.push(seed);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('zestro_bookings', JSON.stringify(merged));
        return merged;
      }
      return patched;
    }
    localStorage.setItem('zestro_bookings', JSON.stringify(SEED_BOOKINGS));
    return SEED_BOOKINGS;
  } catch {
    return SEED_BOOKINGS;
  }
}

function persist(v) {
  try {
    localStorage.setItem('zestro_bookings', JSON.stringify(v));
  } catch (e) {
    console.error('Failed to persist bookings:', e);
  }
}

function pushToCustomerNotifications(title, message, bookingId) {
  try {
    const raw = localStorage.getItem('zestro_notifications');
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({
      id: `n_bk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'booking',
      title,
      message,
      bookingId,
      read: false,
      at: new Date().toISOString(),
    });
    localStorage.setItem('zestro_notifications', JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to sync to customer notifications:', e);
  }
}

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    bookings: load(),
    selectedBookingId: null,
    loading: false,
    error: null,
  },
  reducers: {
    createBooking(state, action) {
      const initialStatus = action.payload.status || 'Requested';
      const initialStep = action.payload.journeyStep !== undefined ? action.payload.journeyStep : (initialStatus === 'Requested' ? 0 : 1);
      const newBooking = {
        ...action.payload,
        status: initialStatus,
        journeyStep: initialStep,
        tableNumber: action.payload.tableNumber || action.payload.tableId || 'T-12',
        tableDetails: action.payload.tableDetails || {
          number: action.payload.tableNumber || action.payload.tableId || 'T-12',
          capacity: action.payload.guests || 4,
          location: action.payload.seating || 'Window',
          seatingType: 'Indoor',
          status: 'Reserved',
        },
        reminderStatus: 'Scheduled',
        reminderText: `Your ZESTRO table booking is scheduled for ${action.payload.time || '7:30 PM'} today.`,
        customerNotifications: [
          {
            id: `notif_${Date.now()}`,
            type: initialStatus,
            message: initialStatus === 'Requested'
              ? 'Your table reservation request has been submitted.'
              : 'Your table booking has been confirmed.',
            sentAt: new Date().toISOString(),
            channel: 'In-App',
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.bookings.unshift(newBooking);
      persist(state.bookings);
      pushToCustomerNotifications(
        `Reservation #${newBooking.id}`,
        initialStatus === 'Requested'
          ? 'Your table reservation request has been submitted.'
          : 'Your table booking has been confirmed.',
        newBooking.id
      );
    },

    advanceJourney(state, action) {
      const b = state.bookings.find(b => b.id === action.payload);
      if (b && b.journeyStep < JOURNEY_STEPS.length - 1) {
        b.journeyStep += 1;
        b.status = JOURNEY_STEPS[b.journeyStep] || b.status;
        b.updatedAt = new Date().toISOString();
        persist(state.bookings);
      }
    },

    setJourneyStep(state, action) {
      const { id, step } = action.payload;
      const b = state.bookings.find(b => b.id === id);
      if (b && step >= 0 && step < JOURNEY_STEPS.length) {
        b.journeyStep = step;
        b.status = JOURNEY_STEPS[step] || b.status;
        b.updatedAt = new Date().toISOString();
        persist(state.bookings);
      }
    },

    modifyBooking(state, action) {
      const { id, changes } = action.payload;
      const b = state.bookings.find(b => b.id === id);
      if (b && !['Cancelled', 'Completed', 'No Show'].includes(b.status)) {
        Object.assign(b, changes);
        b.updatedAt = new Date().toISOString();
        persist(state.bookings);
      }
    },

    cancelBooking(state, action) {
      const b = state.bookings.find(b => b.id === action.payload);
      if (b) {
        b.status = 'Cancelled';
        b.cancellationReason = b.cancellationReason || 'Customer Request';
        b.cancelledAt = new Date().toISOString();
        b.reminderStatus = 'Not Required';
        b.updatedAt = new Date().toISOString();

        if (!b.customerNotifications) b.customerNotifications = [];
        b.customerNotifications.unshift({
          id: `notif_${Date.now()}`,
          type: 'Cancelled',
          message: 'Your table booking has been cancelled.',
          sentAt: new Date().toISOString(),
          channel: 'In-App',
        });

        persist(state.bookings);
      }
    },

    cancelBookingWithReason(state, action) {
      const { id, reason, customReason, adminName } = action.payload;
      const b = state.bookings.find(b => b.id === id);
      if (b) {
        b.status = 'Cancelled';
        b.cancellationReason = customReason ? `${reason}: ${customReason}` : reason;
        b.cancelledBy = adminName || 'Admin';
        b.cancelledAt = new Date().toISOString();
        b.reminderStatus = 'Not Required';
        b.updatedAt = new Date().toISOString();

        if (b.tableDetails) {
          b.tableDetails.status = 'Available';
        }

        if (!b.customerNotifications) b.customerNotifications = [];
        b.customerNotifications.unshift({
          id: `notif_${Date.now()}`,
          type: 'Cancelled',
          message: 'Your table booking has been cancelled.',
          sentAt: new Date().toISOString(),
          channel: 'In-App',
          reason: b.cancellationReason,
        });

        persist(state.bookings);
        pushToCustomerNotifications(
          `Reservation #${b.id} Cancelled`,
          'Your table booking has been cancelled.',
          b.id
        );
      }
    },

    updateBookingStatus(state, action) {
      const { id, status } = action.payload;
      const b = state.bookings.find(b => b.id === id);
      if (b) {
        b.status = status;
        const stepIdx = JOURNEY_STEPS.indexOf(status);
        if (stepIdx !== -1) {
          b.journeyStep = stepIdx;
        } else if (status === 'Completed') {
          b.journeyStep = JOURNEY_STEPS.length - 1;
        }
        b.updatedAt = new Date().toISOString();
        persist(state.bookings);
      }
    },

    updateBookingStatusAdmin(state, action) {
      const { id, status, note, adminName } = action.payload;
      const b = state.bookings.find(b => b.id === id);
      if (b) {
        const currentAllowed = ALLOWED_STATUS_TRANSITIONS[b.status] || [];
        // Verify valid forward or terminal transition
        if (!currentAllowed.includes(status) && b.status !== status) {
          console.warn(`Invalid status transition attempt from ${b.status} to ${status}`);
          return;
        }

        b.status = status;
        b.updatedAt = new Date().toISOString();
        if (note) b.adminNote = note;
        if (adminName) b.lastUpdatedBy = adminName;

        const stepIdx = JOURNEY_STEPS.indexOf(status);
        if (stepIdx !== -1) {
          b.journeyStep = stepIdx;
        } else if (status === 'Completed') {
          b.journeyStep = JOURNEY_STEPS.length - 1;
          b.completedAt = new Date().toISOString();
          if (b.tableDetails) b.tableDetails.status = 'Available';
        } else if (status === 'Cancelled' || status === 'No Show') {
          b.reminderStatus = 'Not Required';
          if (b.tableDetails) b.tableDetails.status = 'Available';
        }

        // Automatic Customer Notification Generation
        if (!b.customerNotifications) b.customerNotifications = [];
        let notifMsg = '';
        if (status === 'Confirmed') {
          notifMsg = 'Your table booking has been confirmed.';
        } else if (status === 'Table Ready') {
          notifMsg = 'Your table is ready.';
        } else if (status === 'Customer Arrived') {
          notifMsg = 'Welcome to the restaurant! Your server will escort you shortly.';
        } else if (status === 'Dining') {
          notifMsg = 'Enjoy your meal! Let us know if you need any additional service.';
        } else if (status === 'Completed') {
          notifMsg = 'Thank you for dining with ZESTRO! We hope you enjoyed your meal.';
        }

        if (notifMsg) {
          b.customerNotifications.unshift({
            id: `notif_${Date.now()}`,
            type: status,
            message: notifMsg,
            sentAt: new Date().toISOString(),
            channel: 'In-App',
          });
          pushToCustomerNotifications(`Reservation #${b.id}`, notifMsg, b.id);
        }

        persist(state.bookings);
      }
    },

    assignBookingTable(state, action) {
      const { id, tableNumber, tableDetails } = action.payload;
      const b = state.bookings.find(b => b.id === id);
      if (b) {
        b.tableNumber = tableNumber;
        b.tableId = tableNumber;
        b.tableDetails = {
          number: tableNumber,
          capacity: tableDetails?.capacity || b.guests || 4,
          location: tableDetails?.location || b.seating || 'Window',
          seatingType: tableDetails?.seatingType || 'Indoor',
          status: 'Reserved',
        };
        b.updatedAt = new Date().toISOString();
        persist(state.bookings);
      }
    },

    rescheduleBooking(state, action) {
      const { id, date, time, tableNumber } = action.payload;
      const b = state.bookings.find(b => b.id === id);
      if (b) {
        b.date = date;
        b.time = time;
        if (tableNumber) {
          b.tableNumber = tableNumber;
          b.tableId = tableNumber;
        }
        b.updatedAt = new Date().toISOString();
        b.reminderStatus = 'Scheduled';
        b.reminderText = `Your ZESTRO table booking has been rescheduled to ${time} on ${date}.`;

        if (!b.customerNotifications) b.customerNotifications = [];
        b.customerNotifications.unshift({
          id: `notif_${Date.now()}`,
          type: 'Rescheduled',
          message: `Your reservation has been rescheduled to ${time} on ${date}.`,
          sentAt: new Date().toISOString(),
          channel: 'In-App',
        });

        persist(state.bookings);
        pushToCustomerNotifications(`Reservation #${b.id}`, `Your reservation has been rescheduled to ${time} on ${date}.`, b.id);
      }
    },

    sendCustomerNotification(state, action) {
      const { id, type, message, channel } = action.payload;
      const b = state.bookings.find(b => b.id === id);
      if (b) {
        if (!b.customerNotifications) b.customerNotifications = [];
        b.customerNotifications.unshift({
          id: `notif_${Date.now()}`,
          type: type || 'Notice',
          message,
          channel: channel || 'In-App',
          sentAt: new Date().toISOString(),
        });
        b.updatedAt = new Date().toISOString();
        persist(state.bookings);
        pushToCustomerNotifications(`Reservation #${b.id}`, message, b.id);
      }
    },

    updateReminderStatus(state, action) {
      const { id, reminderStatus } = action.payload;
      const b = state.bookings.find(b => b.id === id);
      if (b) {
        b.reminderStatus = reminderStatus;
        b.updatedAt = new Date().toISOString();
        persist(state.bookings);
      }
    },

    resetBookings(state) {
      state.bookings = SEED_BOOKINGS;
      persist(SEED_BOOKINGS);
    },
  },
});

export const {
  createBooking,
  advanceJourney,
  setJourneyStep,
  modifyBooking,
  cancelBooking,
  cancelBookingWithReason,
  updateBookingStatus,
  updateBookingStatusAdmin,
  assignBookingTable,
  rescheduleBooking,
  sendCustomerNotification,
  updateReminderStatus,
  resetBookings,
} = bookingSlice.actions;

export default bookingSlice.reducer;
