import express from 'express';
import {
  getMyBills,
  getBillByOrder,
  getBillById,
  getAllBills,
} from '../controllers/billController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-bills', protect, getMyBills);
router.get('/order/:orderId', protect, getBillByOrder);
router.get('/:id', protect, getBillById);
router.get('/', protect, getAllBills);

export default router;
