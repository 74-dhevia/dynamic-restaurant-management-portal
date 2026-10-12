import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/wishlist - Fetch user wishlist items
router.get('/', protect, (req, res) => {
  res.status(200).json({
    success: true,
    wishlist: [],
    message: `Wishlist for user ${req.user.name}`,
  });
});

// POST /api/wishlist - Add item to wishlist
router.post('/', protect, (req, res) => {
  const { itemId, itemType } = req.body;
  res.status(201).json({
    success: true,
    message: 'Item added to wishlist',
    item: {
      userId: req.user._id,
      itemId,
      itemType: itemType || 'dish',
      savedAt: new Date().toISOString(),
    },
  });
});

export default router;
