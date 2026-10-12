import express from 'express';
import {
  createReview,
  getRestaurantReviews,
  getFoodReviews,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/restaurant/:restaurantId', getRestaurantReviews);
router.get('/food/:foodItemId', getFoodReviews);

export default router;
