import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  updateOrderQualityCheck,
  processRefund,
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Customer routes
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/cancel', protect, cancelOrder);

// Admin & Staff routes
router.get('/', protect, getAllOrders);
router.patch('/:id/status', protect, updateOrderStatus);
router.patch('/:id/quality-check', protect, updateOrderQualityCheck);
router.patch('/:id/refund', protect, processRefund);

export default router;
