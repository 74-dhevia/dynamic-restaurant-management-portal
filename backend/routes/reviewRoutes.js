import express from 'express';
import {
  createReview,
  getRestaurantReviews,
  getFoodReviews,
  replyToReview,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/restaurant/:restaurantId', getRestaurantReviews);
router.get('/food/:foodItemId', getFoodReviews);
router.post('/:id/reply', protect, replyToReview);

export default router;
