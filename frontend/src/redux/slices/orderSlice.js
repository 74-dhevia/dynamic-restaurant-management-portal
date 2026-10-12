import { createSlice } from '@reduxjs/toolkit';

export const ORDER_STAGES = [
  'Placed',
  'Confirmed',
  'Preparing',
  'Ready',
  'Out for Delivery',
  'Delivered',
];

export const ORDER_STATUSES = [
  'Placed',
  'Confirmed',
  'Preparing',
  'Ready',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export const KITCHEN_STATUSES = [
  'Waiting',
  'Preparing',
  'Ready',
  'Delayed',
];

export const ORDER_PRIORITIES = [
  'Normal',
  'High',
  'Urgent',
];

export const REFUND_STATUSES = [
  'Not Applicable',
  'Processing',
  'Completed',
  'Failed',
];

const now = Date.now();
const hourAgo = now - 3600000;
const twoHoursAgo = now - 7200000;
const dayAgo = now - 86400000;
const twoDaysAgo = now - 172800000;

export const SEED_ORDERS = [
  {
    id: 'ZST-1024',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    customerEmail: 'dheiva@example.com',
    altEmail: 'dheivalakshmi7@gmail.com',
    customerPhone: '+91 98401 23456',
    customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r2',
    restaurantName: 'Dindigul Thalappakatti',
    restaurantLocation: 'Whitefield Main Road, Bengaluru',
    orderType: 'Delivery',
    items: [
      { id: 'f_biryani', name: 'Chicken Biryani', price: 220, qty: 2, discount: 0, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300' },
      { id: 'f8', name: 'Paneer 65', price: 180, qty: 1, discount: 0, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300' },
      { id: 'f9', name: 'Lime Soda', price: 60, qty: 2, discount: 0, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300' },
    ],
    itemsTotal: 740,
    discount: 40,
    deliveryFee: 30,
    tax: 35,
    grandTotal: 765,
    deliveryAddress: '12B Green Valley, 100ft Road, Indiranagar, Bengaluru - 560038',
    deliveryInstruction: 'Please ring the bell and leave with security if unavailable.',
    deliveryMode: 'Standard Delivery',
    scheduledDate: null,
    scheduledTime: null,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    transactionRef: 'UPI-2026-984100',
    status: 'Temporarily Paused',
    stageIndex: 2,
    otpStatus: 'Pending',
    kitchenStatus: 'Delayed',
    priority: 'High',
    internalNote: 'Order temporarily paused: Kitchen gas pressure valve calibration.',
    incident: {
      reported: true,
      status: 'Temporarily Paused',
      reason: 'Unexpected kitchen incident',
      type: 'Burner Gas Valve Pressure Check',
      adminActionRequired: 'Customer notification required',
      paused: true,
      reportedAt: new Date(now - 1200000).toISOString(),
    },
    cancelled: false,
    timeline: [
      { status: 'Placed', at: new Date(now - 1800000).toISOString(), note: 'Order placed via ZESTRO Web', updatedBy: 'Customer' },
      { status: 'Confirmed', at: new Date(now - 1500000).toISOString(), note: 'Order confirmed by restaurant', updatedBy: 'Admin' },
      { status: 'Temporarily Paused', at: new Date(now - 1200000).toISOString(), note: 'Temporarily paused: Kitchen incident', updatedBy: 'Kitchen' },
    ],
    createdAt: new Date(now - 1800000).toISOString(),
    placedAt: new Date(now - 1800000).toISOString(),
  },
  // Additional Orders for Dheiva Lakshmi (to form 12 historical orders totaling Rs 5,240)
  {
    id: 'ZST-1018',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    customerEmail: 'dheiva@example.com',
    customerPhone: '+91 98401 23456',
    customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r2',
    restaurantName: 'ABC Restaurant',
    orderType: 'Dine-in / Pre-order',
    bookingId: 'BK-1002',
    items: [{ id: 'f_biryani', name: 'Chicken Biryani', price: 220, qty: 2 }],
    itemsTotal: 440,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    grandTotal: 440,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    transactionRef: 'UPI-2026-101800',
    status: 'Delivered',
    cancelled: false,
    createdAt: '2026-09-25T14:30:00.000Z',
    placedAt: '2026-09-25T14:30:00.000Z',
  },
  {
    id: 'ZST-1017',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    customerEmail: 'dheiva@example.com',
    customerPhone: '+91 98401 23456',
    restaurantId: 'r1',
    restaurantName: 'A2B - Adyar Ananda Bhavan',
    orderType: 'Delivery',
    items: [
      { id: 'f1', name: 'Ghee Podi Idli', price: 120, qty: 2 },
      { id: 'f2', name: 'Special Masala Dosa', price: 140, qty: 2 }
    ],
    itemsTotal: 520,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    grandTotal: 520,
    paymentMethod: 'Credit Card',
    paymentStatus: 'Paid',
    transactionRef: 'TXN-CC-101700',
    status: 'Delivered',
    cancelled: false,
    createdAt: '2026-09-24T09:15:00.000Z',
    placedAt: '2026-09-24T09:15:00.000Z',
  },
  {
    id: 'ZST-1016',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    customerEmail: 'dheiva@example.com',
    customerPhone: '+91 98401 23456',
    restaurantId: 'r3',
    restaurantName: 'Sree Annapoorna',
    orderType: 'Delivery',
    items: [
      { id: 'f5', name: 'Tirunelveli Halwa (250g)', price: 150, qty: 2 },
      { id: 'f10', name: 'South Indian Filter Coffee', price: 40, qty: 2 }
    ],
    itemsTotal: 380,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    grandTotal: 380,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    transactionRef: 'UPI-2026-101600',
    status: 'Delivered',
    cancelled: false,
    createdAt: '2026-09-23T16:00:00.000Z',
    placedAt: '2026-09-23T16:00:00.000Z',
  },
  {
    id: 'ZST-1015',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    customerEmail: 'dheiva@example.com',
    customerPhone: '+91 98401 23456',
    restaurantId: 'r4',
    restaurantName: 'Junior Kuppanna',
    orderType: 'Delivery',
    items: [
      { id: 'f6', name: 'Chicken Kothu Parotta', price: 210, qty: 2 },
      { id: 'f7', name: 'Pepper Chicken Gravy', price: 230, qty: 1 }
    ],
    itemsTotal: 650,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    grandTotal: 650,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    transactionRef: 'UPI-2026-101500',
    status: 'Delivered',
    cancelled: false,
    createdAt: '2026-09-21T20:00:00.000Z',
    placedAt: '2026-09-21T20:00:00.000Z',
  },
  {
    id: 'ZST-1014',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    customerEmail: 'dheiva@example.com',
    customerPhone: '+91 98401 23456',
    restaurantId: 'r2',
    restaurantName: 'Dindigul Thalappakatti',
    orderType: 'Pickup',
    items: [{ id: 'f4', name: 'Thalappakatti Mutton Biriyani', price: 310, qty: 1 }],
    itemsTotal: 310,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    grandTotal: 310,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Paid',
    status: 'Delivered',
    cancelled: false,
    createdAt: '2026-09-19T13:00:00.000Z',
    placedAt: '2026-09-19T13:00:00.000Z',
  },
  {
    id: 'ZST-1013',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    customerEmail: 'dheiva@example.com',
    customerPhone: '+91 98401 23456',
    restaurantId: 'r2',
    restaurantName: 'ABC Restaurant',
    orderType: 'Delivery',
    items: [
      { id: 'f12', name: 'Chettinad Chicken Gravy', price: 340, qty: 1 },
      { id: 'f13', name: 'Butter Naan', price: 50, qty: 3 }
    ],
    itemsTotal: 490,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    grandTotal: 490,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    status: 'Delivered',
    cancelled: false,
    createdAt: '2026-09-17T19:30:00.000Z',
    placedAt: '2026-09-17T19:30:00.000Z',
  },
  {
    id: 'ZST-1012',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    customerEmail: 'dheiva@example.com',
    customerPhone: '+91 98401 23456',
    restaurantId: 'r1',
    restaurantName: 'A2B - Adyar Ananda Bhavan',
    orderType: 'Delivery',
    items: [
      { id: 'f14', name: 'Rava Kesari', price: 80, qty: 1 },
      { id: 'f15', name: 'Poori Masala', price: 100, qty: 2 }
    ],
    itemsTotal: 280,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    grandTotal: 280,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    status: 'Delivered',
    cancelled: false,
    createdAt: '2026-09-14T08:30:00.000Z',
    placedAt: '2026-09-14T08:30:00.000Z',
  },
  {
    id: 'ZST-1011',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    customerEmail: 'dheiva@example.com',
    customerPhone: '+91 98401 23456',
    restaurantId: 'r3',
    restaurantName: 'Sree Annapoorna',
    orderType: 'Delivery',
    items: [{ id: 'f16', name: 'Special South Indian Meals', price: 280, qty: 2 }],
    itemsTotal: 560,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    grandTotal: 560,
    paymentMethod: 'Credit Card',
    paymentStatus: 'Paid',
    status: 'Delivered',
    cancelled: false,
    createdAt: '2026-09-10T12:45:00.000Z',
    placedAt: '2026-09-10T12:45:00.000Z',
  },
  {
    id: 'ZST-1010',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    customerEmail: 'dheiva@example.com',
    customerPhone: '+91 98401 23456',
    restaurantId: 'r4',
    restaurantName: 'Junior Kuppanna',
    orderType: 'Delivery',
    items: [{ id: 'f17', name: 'Egg Kothu Parotta', price: 175, qty: 2 }],
    itemsTotal: 350,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    grandTotal: 350,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    status: 'Delivered',
    cancelled: false,
    createdAt: '2026-09-05T20:15:00.000Z',
    placedAt: '2026-09-05T20:15:00.000Z',
  },
  {
    id: 'ZST-1009',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    customerEmail: 'dheiva@example.com',
    customerPhone: '+91 98401 23456',
    restaurantId: 'r2',
    restaurantName: 'Dindigul Thalappakatti',
    orderType: 'Delivery',
    items: [
      { id: 'f18', name: 'Chicken 65 Biriyani', price: 375, qty: 1 },
      { id: 'f9', name: 'Lime Soda', price: 60, qty: 2 }
    ],
    itemsTotal: 495,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    grandTotal: 495,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    status: 'Delivered',
    cancelled: false,
    createdAt: '2026-08-28T13:20:00.000Z',
    placedAt: '2026-08-28T13:20:00.000Z',
  },
  {
    id: 'ZST-1008',
    userId: 'u_dheiva',
    userName: 'Dheiva Lakshmi',
    customerName: 'Dheiva Lakshmi',
    userEmail: 'dheiva@example.com',
    customerEmail: 'dheiva@example.com',
    customerPhone: '+91 98401 23456',
    restaurantId: 'r1',
    restaurantName: 'A2B - Adyar Ananda Bhavan',
    orderType: 'Delivery',
    items: [
      { id: 'f19', name: 'Ven Pongal', price: 120, qty: 2 },
      { id: 'f20', name: 'Medu Vada (2 pcs)', price: 90, qty: 2 }
    ],
    itemsTotal: 420,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    grandTotal: 420,
    paymentMethod: 'UPI',
    paymentStatus: 'Refunded',
    status: 'Cancelled',
    cancelled: true,
    cancellation: {
      reason: 'Customer rescheduled morning trip',
      cancelledBy: 'Customer',
    },
    createdAt: '2026-08-20T08:00:00.000Z',
    placedAt: '2026-08-20T08:00:00.000Z',
  },
  {
    id: 'ZST-1025',
    userId: 'u_priya',
    userName: 'Priya Sharma',
    customerName: 'Priya Sharma',
    userEmail: 'priya@example.com',
    customerEmail: 'priya@example.com',
    customerPhone: '+91 98451 23456',
    customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r2',
    restaurantName: 'Dindigul Thalappakatti',
    restaurantLocation: 'Whitefield Main Road, Bengaluru',
    orderType: 'Delivery',
    items: [
      { id: 'f4', name: 'Thalappakatti Mutton Biriyani', price: 340, qty: 1, discount: 20, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300' },
      { id: 'f7', name: 'Mutton Chukka', price: 260, qty: 1, discount: 0, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300' },
    ],
    itemsTotal: 600,
    discount: 50,
    deliveryFee: 40,
    tax: 30,
    grandTotal: 620,
    deliveryAddress: 'Tower B, Bagmane Tech Park, CV Raman Nagar, Bengaluru',
    deliveryInstruction: 'Call upon arrival at reception gate 3.',
    deliveryMode: 'Express Delivery',
    paymentMethod: 'Credit Card',
    paymentStatus: 'Paid',
    transactionRef: 'TXN-CC-847291',
    status: 'Preparing',
    stageIndex: 2,
    otpStatus: 'Pending',
    kitchenStatus: 'Preparing',
    priority: 'High',
    internalNote: 'Extra raita and spicy salna requested.',
    incident: null,
    cancelled: false,
    timeline: [
      { status: 'Placed', at: new Date(hourAgo - 1200000).toISOString(), updatedBy: 'Customer' },
      { status: 'Confirmed', at: new Date(hourAgo - 600000).toISOString(), updatedBy: 'Admin' },
      { status: 'Preparing', at: new Date(hourAgo).toISOString(), updatedBy: 'Kitchen' },
    ],
    createdAt: new Date(hourAgo - 1200000).toISOString(),
    placedAt: new Date(hourAgo - 1200000).toISOString(),
  },
  {
    id: 'ZST-1026',
    userId: 'u_rahul',
    userName: 'Rahul Verma',
    customerName: 'Rahul Verma',
    userEmail: 'rahul@example.com',
    customerEmail: 'rahul@example.com',
    customerPhone: '+91 98765 43210',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r1',
    restaurantName: 'A2B - Adyar Ananda Bhavan',
    restaurantLocation: '100ft Road, Indiranagar, Bengaluru',
    orderType: 'Dine-in / Pre-order',
    bookingId: 'BK-2048',
    table: 'T-12',
    guests: 4,
    bookingStatus: 'Confirmed',
    items: [
      { id: 'f_biryani', name: 'Chicken Biryani', price: 220, qty: 2, discount: 0, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300' },
      { id: 'f8', name: 'Paneer 65', price: 180, qty: 1, discount: 0, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300' },
      { id: 'f9', name: 'Fresh Lime Soda', price: 60, qty: 2, discount: 0, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300' },
    ],
    itemsTotal: 740,
    discount: 40,
    deliveryFee: 0,
    tax: 35,
    grandTotal: 735,
    deliveryAddress: 'Table T-12, Ground Floor Main Dining Area',
    deliveryInstruction: 'Serve starters first as soon as party is seated.',
    deliveryMode: 'Dine-In Pre-Order',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    transactionRef: 'UPI-2026-619280',
    status: 'Confirmed',
    stageIndex: 1,
    otpStatus: 'Pending',
    kitchenStatus: 'Waiting',
    priority: 'Normal',
    internalNote: 'Birthday celebration table setup.',
    incident: null,
    cancelled: false,
    timeline: [
      { status: 'Placed', at: new Date(twoHoursAgo).toISOString(), updatedBy: 'Customer' },
      { status: 'Confirmed', at: new Date(twoHoursAgo + 600000).toISOString(), updatedBy: 'Admin' },
    ],
    createdAt: new Date(twoHoursAgo).toISOString(),
    placedAt: new Date(twoHoursAgo).toISOString(),
  },
  {
    id: 'ZST-1027',
    userId: 'u_ananya',
    userName: 'Ananya Patel',
    customerName: 'Ananya Patel',
    userEmail: 'ananya@example.com',
    customerEmail: 'ananya@example.com',
    customerPhone: '+91 97123 45678',
    customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r2',
    restaurantName: 'Dindigul Thalappakatti',
    restaurantLocation: 'Whitefield Main Road, Bengaluru',
    orderType: 'Delivery',
    items: [
      { id: 'f2', name: 'Special Masala Dosa', price: 140, qty: 2, discount: 0, image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300' },
      { id: 'f10', name: 'South Indian Filter Coffee', price: 40, qty: 2, discount: 0, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300' },
    ],
    itemsTotal: 360,
    discount: 30,
    deliveryFee: 30,
    tax: 18,
    grandTotal: 378,
    deliveryAddress: '45 Lake View Residency, 5th Block, Koramangala, Bengaluru',
    deliveryInstruction: 'Gate code 4491. Do not ring doorbell, baby sleeping.',
    deliveryMode: 'Standard Delivery',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    transactionRef: 'UPI-2026-449102',
    status: 'Out for Delivery',
    stageIndex: 4,
    otpStatus: 'Pending',
    kitchenStatus: 'Ready',
    priority: 'Urgent',
    internalNote: 'Platinum Tier VIP Customer. Fast track delivery dispatch.',
    incident: null,
    cancelled: false,
    timeline: [
      { status: 'Placed', at: new Date(hourAgo - 2400000).toISOString(), updatedBy: 'Customer' },
      { status: 'Confirmed', at: new Date(hourAgo - 1800000).toISOString(), updatedBy: 'Admin' },
      { status: 'Preparing', at: new Date(hourAgo - 1200000).toISOString(), updatedBy: 'Kitchen' },
      { status: 'Ready', at: new Date(hourAgo - 600000).toISOString(), updatedBy: 'Kitchen' },
      { status: 'Out for Delivery', at: new Date(hourAgo).toISOString(), updatedBy: 'Delivery Partner (Karthik R.)' },
    ],
    createdAt: new Date(hourAgo - 2400000).toISOString(),
    placedAt: new Date(hourAgo - 2400000).toISOString(),
  },
  {
    id: 'ZST-1028',
    userId: 'u_vikram',
    userName: 'Vikram Singh',
    customerName: 'Vikram Singh',
    userEmail: 'vikram@example.com',
    customerEmail: 'vikram@example.com',
    customerPhone: '+91 99887 76655',
    customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r1',
    restaurantName: 'A2B - Adyar Ananda Bhavan',
    restaurantLocation: '100ft Road, Indiranagar, Bengaluru',
    orderType: 'Delivery',
    items: [
      { id: 'f11', name: 'Buhari Chicken 65', price: 240, qty: 2, discount: 0, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300' },
    ],
    itemsTotal: 480,
    discount: 0,
    deliveryFee: 30,
    tax: 24,
    grandTotal: 534,
    deliveryAddress: '77 Heritage Enclave, 4th Block, Jayanagar, Bengaluru',
    deliveryInstruction: 'Near South End Circle.',
    deliveryMode: 'Standard Delivery',
    paymentMethod: 'UPI',
    paymentStatus: 'Refunded',
    transactionRef: 'UPI-2026-778899',
    status: 'Cancelled',
    stageIndex: 1,
    otpStatus: 'Not Applicable',
    kitchenStatus: 'Waiting',
    priority: 'Normal',
    internalNote: 'Cancelled due to customer sudden business meeting trip.',
    incident: null,
    cancelled: true,
    cancellation: {
      reason: 'Customer requested cancellation due to travel schedule change',
      cancelledBy: 'Customer',
      at: new Date(hourAgo - 900000).toISOString(),
    },
    refund: {
      id: 'RF-992140',
      status: 'Completed',
      amount: 534,
      method: 'UPI',
      requestedAt: new Date(hourAgo - 900000).toISOString(),
      completedAt: new Date(hourAgo - 300000).toISOString(),
    },
    timeline: [
      { status: 'Placed', at: new Date(hourAgo - 1800000).toISOString(), updatedBy: 'Customer' },
      { status: 'Confirmed', at: new Date(hourAgo - 1200000).toISOString(), updatedBy: 'Admin' },
      { status: 'Cancelled', at: new Date(hourAgo - 900000).toISOString(), updatedBy: 'Customer', note: 'Customer cancelled order' },
    ],
    createdAt: new Date(hourAgo - 1800000).toISOString(),
    placedAt: new Date(hourAgo - 1800000).toISOString(),
  },
  {
    id: 'ZST-1029',
    userId: 'u_priya',
    userName: 'Priya Sharma',
    customerName: 'Priya Sharma',
    userEmail: 'priya@example.com',
    customerEmail: 'priya@example.com',
    customerPhone: '+91 98451 23456',
    customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r2',
    restaurantName: 'Dindigul Thalappakatti',
    restaurantLocation: 'Whitefield Main Road, Bengaluru',
    orderType: 'Delivery',
    items: [
      { id: 'f4', name: 'Thalappakatti Mutton Biriyani', price: 340, qty: 2, discount: 0, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300' },
    ],
    itemsTotal: 680,
    discount: 50,
    deliveryFee: 40,
    tax: 34,
    grandTotal: 704,
    deliveryAddress: '12B Green Valley, 100ft Road, Indiranagar, Bengaluru',
    deliveryInstruction: 'Please deliver hot.',
    deliveryMode: 'Express Delivery',
    paymentMethod: 'Credit Card',
    paymentStatus: 'Paid',
    transactionRef: 'TXN-CC-112233',
    status: 'Preparing',
    stageIndex: 2,
    otpStatus: 'Pending',
    kitchenStatus: 'Delayed',
    priority: 'Urgent',
    internalNote: 'Kitchen gas valve safety check caused temporary queue halt.',
    incident: {
      reported: true,
      message: 'Kitchen incident reported. Order temporarily paused. Admin action required.',
      type: 'Burner Gas Valve Pressure Check',
      paused: true,
      reportedAt: new Date(now - 1200000).toISOString(),
    },
    cancelled: false,
    timeline: [
      { status: 'Placed', at: new Date(now - 2400000).toISOString(), updatedBy: 'Customer' },
      { status: 'Confirmed', at: new Date(now - 1800000).toISOString(), updatedBy: 'Admin' },
      { status: 'Preparing', at: new Date(now - 1400000).toISOString(), updatedBy: 'Kitchen' },
    ],
    createdAt: new Date(now - 2400000).toISOString(),
    placedAt: new Date(now - 2400000).toISOString(),
  },
  {
    id: 'ORD-729104',
    userId: 'u_priya',
    userName: 'Priya Sharma',
    customerName: 'Priya Sharma',
    userEmail: 'priya@example.com',
    customerEmail: 'priya@example.com',
    customerPhone: '+91 98451 23456',
    customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r1',
    restaurantName: 'A2B - Adyar Ananda Bhavan',
    restaurantLocation: '100ft Road, Indiranagar, Bengaluru',
    orderType: 'Delivery',
    items: [
      { id: 'f1', name: 'Ghee Podi Idli', price: 120, qty: 2, discount: 0, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300' },
      { id: 'f2', name: 'Special Masala Dosa', price: 140, qty: 1, discount: 0, image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300' },
    ],
    itemsTotal: 380,
    deliveryFee: 30,
    tax: 19,
    discount: 50,
    grandTotal: 379,
    deliveryAddress: '12B Green Valley, 100ft Road, Indiranagar, Bengaluru',
    deliveryInstruction: 'Delivered to door.',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    transactionRef: 'UPI-2026-729104',
    status: 'Delivered',
    stageIndex: 5,
    otpStatus: 'Verified',
    kitchenStatus: 'Ready',
    priority: 'Normal',
    internalNote: 'Delivered on time, 5 star rating received.',
    incident: null,
    cancelled: false,
    timeline: [
      { status: 'Placed', at: new Date(dayAgo).toISOString(), updatedBy: 'Customer' },
      { status: 'Confirmed', at: new Date(dayAgo + 600000).toISOString(), updatedBy: 'Admin' },
      { status: 'Preparing', at: new Date(dayAgo + 1200000).toISOString(), updatedBy: 'Kitchen' },
      { status: 'Ready', at: new Date(dayAgo + 1800000).toISOString(), updatedBy: 'Kitchen' },
      { status: 'Out for Delivery', at: new Date(dayAgo + 2400000).toISOString(), updatedBy: 'Delivery Partner' },
      { status: 'Delivered', at: new Date(dayAgo + 3600000).toISOString(), updatedBy: 'Delivery Partner' },
    ],
    createdAt: new Date(dayAgo).toISOString(),
    placedAt: new Date(dayAgo).toISOString(),
    mysteryReward: '🎉 FREE DESSERT next order!',
  },
  {
    id: 'ORD-610283',
    userId: 'u_rahul',
    userName: 'Rahul Verma',
    customerName: 'Rahul Verma',
    userEmail: 'rahul@example.com',
    customerEmail: 'rahul@example.com',
    customerPhone: '+91 98765 43210',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    restaurantId: 'r2',
    restaurantName: 'Dindigul Thalappakatti',
    restaurantLocation: 'Whitefield Main Road, Bengaluru',
    orderType: 'Pickup',
    items: [
      { id: 'f4', name: 'Thalappakatti Mutton Biriyani', price: 340, qty: 1, discount: 0, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300' },
    ],
    itemsTotal: 340,
    deliveryFee: 0,
    tax: 17,
    discount: 0,
    grandTotal: 357,
    deliveryAddress: 'Direct Customer Pickup at Restaurant Counter',
    deliveryInstruction: 'Collect from takeaway packaging section.',
    paymentMethod: 'Credit Card',
    paymentStatus: 'Paid',
    transactionRef: 'TXN-CC-610283',
    status: 'Delivered',
    stageIndex: 5,
    otpStatus: 'Verified',
    kitchenStatus: 'Ready',
    priority: 'Normal',
    incident: null,
    cancelled: false,
    timeline: [
      { status: 'Placed', at: new Date(twoDaysAgo).toISOString(), updatedBy: 'Customer' },
      { status: 'Confirmed', at: new Date(twoDaysAgo + 600000).toISOString(), updatedBy: 'Admin' },
      { status: 'Preparing', at: new Date(twoDaysAgo + 1200000).toISOString(), updatedBy: 'Kitchen' },
      { status: 'Ready', at: new Date(twoDaysAgo + 1800000).toISOString(), updatedBy: 'Kitchen' },
      { status: 'Delivered', at: new Date(twoDaysAgo + 2400000).toISOString(), updatedBy: 'Staff Counter' },
    ],
    createdAt: new Date(twoDaysAgo).toISOString(),
    placedAt: new Date(twoDaysAgo).toISOString(),
  },
];

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem('zestro_orders'));
    if (stored && Array.isArray(stored) && stored.length > 0) {
      // Merge missing seeds so all customer scenarios and historical metrics are available
      const existingIds = new Set(stored.map(o => o.id));
      let changed = false;
      const merged = [...stored];
      SEED_ORDERS.forEach(seed => {
        if (!existingIds.has(seed.id)) {
          merged.push(seed);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('zestro_orders', JSON.stringify(merged));
        return merged;
      }
      return stored;
    }
    localStorage.setItem('zestro_orders', JSON.stringify(SEED_ORDERS));
    return SEED_ORDERS;
  } catch {
    return SEED_ORDERS;
  }
}

function persist(v) {
  try {
    localStorage.setItem('zestro_orders', JSON.stringify(v));
  } catch (e) {
    console.error('Failed to persist orders:', e);
  }
}

const orderSlice = createSlice({
  name: 'order',
  initialState: { orders: load() },
  reducers: {
    placeOrder(state, action) {
      const order = {
        ...action.payload,
        orderType: action.payload.orderType || (action.payload.bookingId ? 'Dine-in / Pre-order' : 'Delivery'),
        otpStatus: action.payload.otpStatus || 'Pending',
        kitchenStatus: action.payload.kitchenStatus || 'Waiting',
        priority: action.payload.priority || 'Normal',
        incident: null,
        timeline: action.payload.timeline || [
          { status: 'Placed', at: new Date().toISOString(), note: 'Order placed by customer', updatedBy: 'Customer' },
        ],
      };
      state.orders.unshift(order);
      persist(state.orders);
    },

    advanceOrderStage(state, action) {
      const orderId = typeof action.payload === 'object' ? action.payload.id : action.payload;
      const o = state.orders.find(ord => ord.id === orderId);
      if (o && !o.cancelled && o.stageIndex < ORDER_STAGES.length - 1) {
        o.stageIndex += 1;
        o.status = ORDER_STAGES[o.stageIndex];
        if (o.status === 'Preparing') {
          o.kitchenStatus = 'Preparing';
        } else if (o.status === 'Ready') {
          o.kitchenStatus = 'Ready';
        } else if (o.status === 'Delivered') {
          o.otpStatus = 'Verified';
        }
        if (!o.timeline) o.timeline = [];
        o.timeline.push({
          status: o.status,
          at: new Date().toISOString(),
          updatedBy: 'Admin Operations',
          note: `Progressed to ${o.status}`,
        });
        persist(state.orders);
      }
    },

    updateOrderStatus(state, action) {
      const { id, status, reason = '', by = 'Admin', note = '' } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o) {
        // Enforce transition rules: delivered cannot revert to preparing
        if (o.status === 'Delivered' && status !== 'Delivered' && status !== 'Cancelled') {
          console.warn('Cannot regress from Delivered to previous stage.');
          return;
        }

        o.status = status;
        const stageIdx = ORDER_STAGES.indexOf(status);
        if (stageIdx !== -1) {
          o.stageIndex = stageIdx;
        }

        if (status === 'Cancelled') {
          o.cancelled = true;
          o.cancellation = {
            reason: reason || 'Cancelled by Admin',
            cancelledBy: by || 'Admin',
            at: new Date().toISOString(),
          };
          if (!o.refund) {
            o.refund = {
              id: `RF${Date.now()}`,
              status: o.paymentStatus === 'Paid' ? 'Processing' : 'Not Applicable',
              amount: o.grandTotal || 0,
              method: o.paymentMethod || 'Original Payment Source',
              requestedAt: new Date().toISOString(),
              completedAt: null,
            };
          }
        } else {
          o.cancelled = false;
          if (status === 'Preparing') o.kitchenStatus = 'Preparing';
          if (status === 'Ready') o.kitchenStatus = 'Ready';
          if (status === 'Delivered') {
            o.otpStatus = 'Verified';
            o.kitchenStatus = 'Ready';
          }
        }

        if (!o.timeline) o.timeline = [];
        o.timeline.push({
          status,
          at: new Date().toISOString(),
          updatedBy: by,
          note: note || reason || `Status updated to ${status}`,
        });
        persist(state.orders);
      }
    },

    cancelOrder(state, action) {
      const payload = action.payload;
      const id = typeof payload === 'object' ? payload.id : payload;
      const reason = typeof payload === 'object' && payload.reason ? payload.reason : 'Cancelled by Admin';
      const by = typeof payload === 'object' && payload.by ? payload.by : 'Admin';

      const o = state.orders.find(ord => ord.id === id);
      if (o) {
        o.status = 'Cancelled';
        o.cancelled = true;
        o.cancellation = {
          reason,
          cancelledBy: by,
          at: new Date().toISOString(),
        };
        o.refund = {
          id: `RF${Date.now()}`,
          status: o.paymentStatus === 'Paid' ? 'Processing' : 'Not Applicable',
          amount: o.grandTotal || 0,
          method: o.paymentMethod || 'Original Payment Source',
          requestedAt: new Date().toISOString(),
          completedAt: null,
        };
        if (!o.timeline) o.timeline = [];
        o.timeline.push({
          status: 'Cancelled',
          at: new Date().toISOString(),
          updatedBy: by,
          note: `Order cancelled: ${reason}`,
        });
        persist(state.orders);
      }
    },

    completeRefund(state, action) {
      const orderId = typeof action.payload === 'object' ? action.payload.id : action.payload;
      const o = state.orders.find(ord => ord.id === orderId);
      if (o && o.refund) {
        o.refund.status = 'Completed';
        o.refund.completedAt = new Date().toISOString();
        if (o.paymentStatus) o.paymentStatus = 'Refunded';
        if (!o.timeline) o.timeline = [];
        o.timeline.push({
          status: 'Refund Completed',
          at: new Date().toISOString(),
          updatedBy: 'Finance / Admin',
          note: `Refund of ₹${o.refund.amount} completed via ${o.refund.method}`,
        });
      }
      persist(state.orders);
    },

    updateOrderPriority(state, action) {
      const { id, priority } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o) {
        o.priority = priority;
        persist(state.orders);
      }
    },

    updateInternalNote(state, action) {
      const { id, note } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o) {
        o.internalNote = note;
        persist(state.orders);
      }
    },

    updateKitchenStatus(state, action) {
      const { id, kitchenStatus } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o) {
        o.kitchenStatus = kitchenStatus;
        persist(state.orders);
      }
    },

    reportKitchenIncident(state, action) {
      const { id, message, type = 'Operational Incident' } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o) {
        o.incident = {
          reported: true,
          message: message || 'Kitchen incident reported. Order temporarily paused. Admin action required.',
          type,
          paused: true,
          reportedAt: new Date().toISOString(),
        };
        o.kitchenStatus = 'Delayed';
        if (!o.timeline) o.timeline = [];
        o.timeline.push({
          status: 'Kitchen Incident Reported',
          at: new Date().toISOString(),
          updatedBy: 'Kitchen Chef',
          note: message || type,
        });
        persist(state.orders);
      }
    },

    resolveKitchenIncident(state, action) {
      const { id, action: incidentAction, note = '' } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o && o.incident) {
        if (incidentAction === 'resume') {
          o.incident.paused = false;
          o.kitchenStatus = 'Preparing';
        } else if (incidentAction === 'pause') {
          o.incident.paused = true;
          o.kitchenStatus = 'Delayed';
        } else if (incidentAction === 'dismiss') {
          o.incident = null;
          o.kitchenStatus = 'Preparing';
        }
        if (!o.timeline) o.timeline = [];
        o.timeline.push({
          status: `Incident Action: ${incidentAction.toUpperCase()}`,
          at: new Date().toISOString(),
          updatedBy: 'Admin Operations',
          note: note || `Admin executed ${incidentAction} on kitchen incident`,
        });
        persist(state.orders);
      }
    },

    updateOrderStatusChef(state, action) {
      const { id, nextStatus, qualityCheck, estimatedPrepMinutes, estimatedReadyTime } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o) {
        if (nextStatus === 'Preparing') {
          o.status = 'Preparing';
          o.stageIndex = Math.max(o.stageIndex || 0, 2);
          o.kitchenStatus = 'Preparing';
          if (!o.prepStartedAt) {
            o.prepStartedAt = new Date().toISOString();
          }
        } else if (nextStatus === 'Ready') {
          o.status = 'Ready';
          o.stageIndex = Math.max(o.stageIndex || 0, 3);
          o.kitchenStatus = 'Ready';
          o.actualReadyTime = new Date().toISOString();
        }
        if (qualityCheck) {
          o.qualityCheck = qualityCheck;
        }
        if (estimatedPrepMinutes) {
          o.estimatedPrepMinutes = estimatedPrepMinutes;
        }
        if (estimatedReadyTime) {
          o.estimatedReadyTime = estimatedReadyTime;
        }
        if (!o.timeline) o.timeline = [];
        o.timeline.push({
          status: nextStatus,
          at: new Date().toISOString(),
          updatedBy: qualityCheck?.verifiedBy || 'Kitchen Chef',
          note: qualityCheck ? `Quality verified & marked ${nextStatus}` : `Chef updated preparation stage to ${nextStatus}`,
        });
        persist(state.orders);
      }
    },

    attachIncidentToOrders(state, action) {
      const { orderIds = [], incidentId, incidentType, severity, message, chefName } = action.payload;
      state.orders.forEach(o => {
        if (orderIds.includes(o.id)) {
          o.incident = {
            id: incidentId,
            reported: true,
            type: incidentType,
            severity,
            message: message || 'Kitchen incident reported. Order paused.',
            reportedAt: new Date().toISOString(),
            reportedBy: chefName || 'Kitchen Chef',
            paused: true,
          };
          o.kitchenStatus = 'Delayed';
          if (!o.timeline) o.timeline = [];
          o.timeline.push({
            status: 'Kitchen Incident Reported',
            at: new Date().toISOString(),
            updatedBy: chefName || 'Kitchen Chef',
            note: `${incidentType} (${severity}): ${message}`,
          });
        }
      });
      persist(state.orders);
    },

    pauseOrder(state, action) {
      const { id, reason } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o) {
        if (!o.incident) {
          o.incident = { reported: true, paused: true, message: reason || 'Order paused by Admin operations' };
        } else {
          o.incident.paused = true;
          if (reason) o.incident.message = reason;
        }
        o.kitchenStatus = 'Delayed';
        if (!o.timeline) o.timeline = [];
        o.timeline.push({
          status: 'Order Paused',
          at: new Date().toISOString(),
          updatedBy: 'Admin Operations',
          note: reason || 'Order paused by Admin operations',
        });
        persist(state.orders);
      }
    },

    resumeOrder(state, action) {
      const { id, note } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o) {
        if (o.incident) {
          o.incident.paused = false;
        }
        o.kitchenStatus = 'Preparing';
        if (o.status === 'Confirmed' || o.status === 'Placed') {
          o.status = 'Preparing';
          o.stageIndex = 2;
        }
        if (!o.timeline) o.timeline = [];
        o.timeline.push({
          status: 'Order Resumed',
          at: new Date().toISOString(),
          updatedBy: 'Admin Operations',
          note: note || 'Order resumed by Admin operations',
        });
        persist(state.orders);
      }
    },

    cancelOrderFromIncident(state, action) {
      const { id, reason = 'Kitchen incident: Unable to fulfill order' } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o) {
        o.status = 'Cancelled';
        o.cancelled = true;
        o.kitchenStatus = 'Delayed';
        o.cancellationReason = reason;
        if (!o.timeline) o.timeline = [];
        o.timeline.push({
          status: 'Cancelled',
          at: new Date().toISOString(),
          updatedBy: 'Admin Operations',
          note: reason,
        });
        persist(state.orders);
      }
    },

    notifyCustomerSimulated(state, action) {
      const { id, message, channel = 'SMS / WhatsApp', recipientPhone } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o) {
        if (!o.simulatedCustomerAlerts) o.simulatedCustomerAlerts = [];
        o.simulatedCustomerAlerts.push({
          sentAt: new Date().toISOString(),
          channel,
          recipient: recipientPhone || o.customerPhone,
          message,
        });
        if (!o.timeline) o.timeline = [];
        o.timeline.push({
          status: 'Customer Notified',
          at: new Date().toISOString(),
          updatedBy: 'Admin Operations',
          note: `[SIMULATED ${channel}]: "${message}"`,
        });
        persist(state.orders);
      }
    },

    verifyDeliveryOtp(state, action) {
      const { id } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o) {
        o.otpStatus = 'Verified';
        if (!o.timeline) o.timeline = [];
        o.timeline.push({
          status: 'OTP Verified',
          at: new Date().toISOString(),
          updatedBy: 'Delivery Partner / Admin',
          note: 'Customer delivery OTP verified successfully',
        });
        persist(state.orders);
      }
    },

    updatePaymentStatus(state, action) {
      const { id, paymentStatus } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o) {
        o.paymentStatus = paymentStatus;
        persist(state.orders);
      }
    },

    modifyOrder(state, action) {
      const { id, changes } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o && o.stageIndex < 2) {
        Object.assign(o, changes);
        persist(state.orders);
      }
    },

    addReviewToOrder(state, action) {
      const { id, review } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o) {
        o.review = review;
        persist(state.orders);
      }
    },

    revealMysteryReward(state, action) {
      const o = state.orders.find(ord => ord.id === action.payload);
      if (o && !o.mysteryReward) {
        const rewards = ['🎉 FREE DESSERT next order!', '⭐ +100 DinePoints', '🥤 FREE Drink next order!', '🏷️ 15% OFF coupon unlocked'];
        o.mysteryReward = rewards[Math.floor(Math.random() * rewards.length)];
        persist(state.orders);
      }
    },

    updateOrderDeliveryLocation(state, action) {
      const { id, riderCoords, customerCoords, etaMinutes, distanceKm } = action.payload;
      const o = state.orders.find(ord => ord.id === id);
      if (o) {
        if (riderCoords) o.riderCoords = riderCoords;
        if (customerCoords) o.customerCoords = customerCoords;
        if (etaMinutes !== undefined) o.liveEtaMinutes = etaMinutes;
        if (distanceKm !== undefined) o.liveDistanceKm = distanceKm;
        persist(state.orders);
      }
    },
  },
});

export const {
  placeOrder,
  advanceOrderStage,
  updateOrderStatus,
  cancelOrder,
  completeRefund,
  updateOrderPriority,
  updateInternalNote,
  updateKitchenStatus,
  reportKitchenIncident,
  resolveKitchenIncident,
  updateOrderStatusChef,
  attachIncidentToOrders,
  pauseOrder,
  resumeOrder,
  cancelOrderFromIncident,
  notifyCustomerSimulated,
  verifyDeliveryOtp,
  updatePaymentStatus,
  modifyOrder,
  addReviewToOrder,
  revealMysteryReward,
  updateOrderDeliveryLocation,
} = orderSlice.actions;

export default orderSlice.reducer;
