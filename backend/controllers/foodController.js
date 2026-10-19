import FoodItem from '../models/FoodItem.js';
import Category from '../models/Category.js';

/**
 * @desc    Get all food items with search and filters
 * @route   GET /api/food
 * @access  Public
 */
export const getFoodItems = async (req, res) => {
  try {
    const { category, restaurantId, isVeg, isBestseller, search, sort, includeUnavailable, all } = req.query;
    const filter = {};

    if (includeUnavailable !== 'true' && all !== 'true') {
      filter.isAvailable = true;
    }

    if (category && category !== 'All') {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (restaurantId && restaurantId !== 'all') {
      filter.restaurantId = restaurantId;
    }

    if (isVeg !== undefined) {
      filter.isVeg = isVeg === 'true';
    }

    if (isBestseller !== undefined) {
      filter.isBestseller = isBestseller === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    let sortObj = { rating: -1 };
    if (sort === 'price_asc') sortObj = { price: 1 };
    if (sort === 'price_desc') sortObj = { price: -1 };
    if (sort === 'rating') sortObj = { rating: -1 };
    if (sort === 'name') sortObj = { name: 1 };

    const foodItems = await FoodItem.find(filter).populate('restaurantId', 'name slug address rating').sort(sortObj);

    res.status(200).json({
      success: true,
      count: foodItems.length,
      data: foodItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food items',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single food item by ID
 * @route   GET /api/food/:id
 * @access  Public
 */
export const getFoodItemById = async (req, res) => {
  try {
    const item = await FoodItem.findById(req.params.id).populate('restaurantId', 'name slug address rating phone');
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve food item',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all food categories
 * @route   GET /api/food/categories
 * @access  Public
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 });
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new food item
 * @route   POST /api/food
 * @access  Admin / Restaurant Owner
 */
export const createFoodItem = async (req, res) => {
  try {
    const { name, price, originalPrice, category, restaurantId, description, isVeg, isBestseller, image, ingredients, calories } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and category are required',
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const foodItem = await FoodItem.create({
      name,
      slug,
      price: Number(price),
      originalPrice: Number(originalPrice) || Number(price),
      category,
      restaurantId,
      description,
      isVeg: isVeg !== undefined ? isVeg : true,
      isBestseller: !!isBestseller,
      image: image || '',
      ingredients: ingredients || [],
      calories: calories || 300,
    });

    res.status(201).json({
      success: true,
      message: 'Food item added successfully',
      data: foodItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create food item',
      error: error.message,
    });
  }
};

/**
 * @desc    Update food item
 * @route   PUT /api/food/:id
 * @access  Admin / Restaurant Owner
 */
export const updateFoodItem = async (req, res) => {
  try {
    const updated = await FoodItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Food item updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update food item',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete food item
 * @route   DELETE /api/food/:id
 * @access  Admin / Restaurant Owner
 */
export const deleteFoodItem = async (req, res) => {
  try {
    const item = await FoodItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Food item removed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete food item',
      error: error.message,
    });
  }
};

export default {
  getFoodItems,
  getFoodItemById,
  getCategories,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
};
