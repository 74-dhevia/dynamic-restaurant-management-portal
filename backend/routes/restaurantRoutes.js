import express from 'express';
import {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantStaff,
  updateRestaurantStaff,
} from '../controllers/restaurantController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getRestaurants);
router.get('/:id', getRestaurantById);

// Protected routes (Admin / Restaurant Owner / Manager)
router.post('/', protect, createRestaurant);
router.put('/:id', protect, updateRestaurant);
router.delete('/:id', protect, deleteRestaurant);
router.get('/:id/staff', protect, getRestaurantStaff);
router.patch('/:id/staff/:staffId', protect, updateRestaurantStaff);

export default router;
