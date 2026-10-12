import express from 'express';
import {
  validateCoupon,
  getAllCoupons,
  createCoupon,
} from '../controllers/couponController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllCoupons);
router.post('/validate', protect, validateCoupon);
router.post('/', protect, authorize('admin'), createCoupon);

export default router;
