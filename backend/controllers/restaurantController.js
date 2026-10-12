import Restaurant from '../models/Restaurant.js';
import FoodItem from '../models/FoodItem.js';

/**
 * @desc    Get all restaurants with search and filters
 * @route   GET /api/restaurants
 * @access  Public
 */
export const getRestaurants = async (req, res) => {
  try {
    const { search, cuisine, city, isPureVeg, isFeatured, sort } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tagline: { $regex: search, $options: 'i' } },
        { 'address.area': { $regex: search, $options: 'i' } },
        { cuisineType: { $regex: search, $options: 'i' } },
      ];
    }

    if (cuisine) {
      query.cuisineType = { $regex: cuisine, $options: 'i' };
    }

    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    if (isPureVeg !== undefined) {
      query.isPureVeg = isPureVeg === 'true';
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true';
    }

    let sortOption = { rating: -1 };
    if (sort === 'rating_asc') sortOption = { rating: 1 };
    if (sort === 'name') sortOption = { name: 1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const restaurants = await Restaurant.find(query).sort(sortOption);

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurants',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single restaurant by ID or slug
 * @route   GET /api/restaurants/:id
 * @access  Public
 */
export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    let restaurant;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      restaurant = await Restaurant.findById(id);
    } else {
      restaurant = await Restaurant.findOne({ slug: id.toLowerCase() });
    }

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Fetch related food items / menu
    const menuItems = await FoodItem.find({ restaurantId: restaurant._id, isAvailable: true });

    res.status(200).json({
      success: true,
      data: {
        ...restaurant.toObject(),
        menu: menuItems,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve restaurant details',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new restaurant
 * @route   POST /api/restaurants
 * @access  Admin / Owner
 */
export const createRestaurant = async (req, res) => {
  try {
    const { name, tagline, cuisineType, address, phone, email, priceRange, isPureVeg, isFeatured, heroImage, images, tables } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Restaurant name is required',
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const restaurant = await Restaurant.create({
      name,
      slug,
      tagline,
      cuisineType: Array.isArray(cuisineType) ? cuisineType : [cuisineType || 'Multi-Cuisine'],
      address: address || { city: 'Kovilpatti', state: 'Tamil Nadu' },
      phone,
      email,
      priceRange: priceRange || '₹₹',
      isPureVeg: !!isPureVeg,
      isFeatured: !!isFeatured,
      heroImage: heroImage || '',
      images: images || [],
      tables: tables || [
        { tableId: 'Table 01', capacity: 2, section: 'Indoor', isAvailable: true },
        { tableId: 'Table 02', capacity: 4, section: 'Family', isAvailable: true },
        { tableId: 'Table 03', capacity: 6, section: 'AC', isAvailable: true },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create restaurant',
      error: error.message,
    });
  }
};

/**
 * @desc    Update restaurant
 * @route   PUT /api/restaurants/:id
 * @access  Admin / Owner
 */
export const updateRestaurant = async (req, res) => {
  try {
    const updated = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update restaurant',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete restaurant
 * @route   DELETE /api/restaurants/:id
 * @access  Admin
 */
export const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Also remove menu items for this restaurant
    await FoodItem.deleteMany({ restaurantId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Restaurant and associated menu deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete restaurant',
      error: error.message,
    });
  }
};

export default {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
};
