import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMe, updateProfile } from '../controllers/authController.js';

const router = express.Router();

// GET /api/profile - Access own profile
router.get('/', protect, getMe);

// PUT /api/profile - Update own profile
router.put('/', protect, updateProfile);

export default router;
