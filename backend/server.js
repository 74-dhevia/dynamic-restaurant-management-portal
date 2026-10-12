import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import billRoutes from './routes/billRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { seedDefaultUsers } from './utils/seedUsers.js';

const __serverFilename = fileURLToPath(import.meta.url);
const __serverDirname = path.dirname(__serverFilename);

// Load environment variables reliably from backend directory and workspace root
dotenv.config({ path: path.resolve(__serverDirname, '.env') });
dotenv.config({ path: path.resolve(__serverDirname, '../.env') });
dotenv.config({ path: path.resolve(__serverDirname, '../frontend/.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// CORS configuration: supports localhost and local network Wi-Fi devices (e.g. phones on 192.168.x.x)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5001'];
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Support LAN IP access from mobile devices on Wi-Fi (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      const isLan = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
      if (isLan) return callback(null, true);

      return callback(null, true); // Allow in development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure DB connection is active before servicing API requests
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      console.warn('[DB Middleware] Auto-reconnect note:', err.message);
    }
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check API endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ZESTRO Dynamic Restaurant Backend is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Root welcome endpoint with API documentation overview
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to ZESTRO Dynamic Restaurant Backend API',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
      },
      restaurants: {
        list: 'GET /api/restaurants',
        details: 'GET /api/restaurants/:id',
      },
      food: {
        list: 'GET /api/food',
        categories: 'GET /api/food/categories',
        item: 'GET /api/food/:id',
      },
      orders: {
        create: 'POST /api/orders',
        myOrders: 'GET /api/orders/my-orders',
        cancel: 'PATCH /api/orders/:id/cancel',
      },
      bookings: {
        create: 'POST /api/bookings',
        myBookings: 'GET /api/bookings/my-bookings',
      },
      bills: {
        myBills: 'GET /api/bills/my-bills',
        orderBill: 'GET /api/bills/order/:orderId',
      },
      reviews: {
        create: 'POST /api/reviews',
        restaurant: 'GET /api/reviews/restaurant/:restaurantId',
      },
      coupons: {
        list: 'GET /api/coupons',
        validate: 'POST /api/coupons/validate',
      },
      admin: {
        dashboard: 'GET /api/admin/dashboard',
        users: 'GET /api/admin/users',
      },
    },
  });
});

// Connect to MongoDB and start Express server
const startServer = async () => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ZESTRO Backend Server running on port ${PORT} (host: 0.0.0.0)`);
    console.log(`API URL: http://localhost:${PORT}/api`);
  });

  try {
    const db = await connectDB();
    if (db) {
      await seedDefaultUsers();
      const { seedRestaurantData } = await import('./utils/seedRestaurantData.js');
      await seedRestaurantData();
    }
  } catch (err) {
    console.warn('MongoDB connection deferred:', err.message);
  }
};

// If running in Vercel Serverless Function, do not bind port via app.listen
if (process.env.VERCEL) {
  connectDB().catch(err => console.warn('Serverless DB initialization note:', err.message));
} else {
  startServer();
}

export default app;
