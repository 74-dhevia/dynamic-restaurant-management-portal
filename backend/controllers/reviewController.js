import Review from '../models/Review.js';
import Restaurant from '../models/Restaurant.js';
import FoodItem from '../models/FoodItem.js';

/**
 * @desc    Submit a review for a restaurant or food item
 * @route   POST /api/reviews
 * @access  Private
 */
export const createReview = async (req, res) => {
  try {
    const { restaurantId, foodItemId, rating, comment, images } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating and comment are required',
      });
    }

    const review = await Review.create({
      userId: req.user._id,
      userName: req.user.name,
      userAvatar: req.user.profileImage || '',
      restaurantId,
      foodItemId,
      rating: Number(rating),
      comment,
      images: images || [],
    });

    // Update restaurant average rating if applicable
    if (restaurantId) {
      const allReviews = await Review.find({ restaurantId });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await Restaurant.findByIdAndUpdate(restaurantId, {
        rating: Math.round(avgRating * 10) / 10,
        totalReviews: allReviews.length,
      });
    }

    // Update food item rating if applicable
    if (foodItemId) {
      const allFoodReviews = await Review.find({ foodItemId });
      const avg = allFoodReviews.reduce((sum, r) => sum + r.rating, 0) / allFoodReviews.length;
      await FoodItem.findByIdAndUpdate(foodItemId, {
        rating: Math.round(avg * 10) / 10,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Review posted successfully',
      data: review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to post review',
      error: error.message,
    });
  }
};

/**
 * @desc    Get reviews for a restaurant
 * @route   GET /api/reviews/restaurant/:restaurantId
 * @access  Public
 */
export const getRestaurantReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ restaurantId: req.params.restaurantId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message,
    });
  }
};

/**
 * @desc    Get reviews for a food item
 * @route   GET /api/reviews/food/:foodItemId
 * @access  Public
 */
export const getFoodReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ foodItemId: req.params.foodItemId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food reviews',
      error: error.message,
    });
  }
};

export default {
  createReview,
  getRestaurantReviews,
  getFoodReviews,
};
