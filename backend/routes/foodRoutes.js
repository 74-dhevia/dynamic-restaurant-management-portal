import express from 'express';
import {
  getFoodItems,
  getFoodItemById,
  getCategories,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
} from '../controllers/foodController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getFoodItems);
router.get('/categories', getCategories);
router.get('/:id', getFoodItemById);

// Protected routes (Admin / Restaurant Owner)
router.post('/', protect, createFoodItem);
router.put('/:id', protect, updateFoodItem);
router.delete('/:id', protect, deleteFoodItem);

export default router;
