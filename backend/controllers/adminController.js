import Order from '../models/Order.js';
import TableBooking from '../models/TableBooking.js';
import Restaurant from '../models/Restaurant.js';
import FoodItem from '../models/FoodItem.js';
import User from '../models/User.js';
import { getBusinessDayBoundaries } from '../utils/dateUtils.js';

/**
 * @desc    Get complete administrative dashboard statistics from real MongoDB data
 * @route   GET /api/admin/dashboard
 * @access  Admin
 */
export const getDashboardStats = async (req, res) => {
  try {
    const timeZone = process.env.BUSINESS_TIMEZONE || 'Asia/Kolkata';
    const { startOfToday, startOfTomorrow, localDateStr } = getBusinessDayBoundaries(new Date(), timeZone);

    // 1. Order Status Counts & Date Range Queries
    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      outForDeliveryOrders,
      deliveredOrders,
      cancelledOrders,
      delayedOrders,
      refundsCount,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfToday, $lt: startOfTomorrow } }),
      Order.countDocuments({ orderStatus: { $in: ['Placed', 'Confirmed'] } }),
      Order.countDocuments({ orderStatus: { $in: ['Preparing', 'Food Preparing'] } }),
      Order.countDocuments({ orderStatus: { $in: ['Ready', 'Food Ready'] } }),
      Order.countDocuments({ orderStatus: { $in: ['OutForDelivery', 'Out for Delivery'] } }),
      Order.countDocuments({ orderStatus: 'Delivered' }),
      Order.countDocuments({ orderStatus: 'Cancelled' }),
      Order.countDocuments({
        kitchenStatus: 'Delayed',
        orderStatus: { $nin: ['Delivered', 'Cancelled'] },
      }),
      Order.countDocuments({ paymentStatus: 'Refunded' }),
    ]);

    // 2. Recognized Revenue Calculation
    // Non-cancelled and non-refunded transactions contribute to recognized revenue
    const revenueAggregation = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'Cancelled' },
          paymentStatus: { $nin: ['Failed', 'Refunded'] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ]);
    const revenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

    // 3. Bookings Counts
    const [
      totalBookings,
      todayBookings,
      todayScheduledBookings,
      pendingBookings,
    ] = await Promise.all([
      TableBooking.countDocuments(),
      TableBooking.countDocuments({ createdAt: { $gte: startOfToday, $lt: startOfTomorrow } }),
      TableBooking.countDocuments({ bookingDate: { $gte: startOfToday, $lt: startOfTomorrow } }),
      TableBooking.countDocuments({ status: { $in: ['Requested', 'Pending'] } }),
    ]);

    // 4. Customer & Directory Counts
    const [
      totalCustomers,
      todayRegistrations,
      totalRestaurants,
      totalMenuItems,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({
        role: 'customer',
        createdAt: { $gte: startOfToday, $lt: startOfTomorrow },
      }),
      Restaurant.countDocuments(),
      FoodItem.countDocuments(),
    ]);

    // 5. Recent Lists
    const [todayOrdersList, recentOrders, recentBookings] = await Promise.all([
      Order.find({ createdAt: { $gte: startOfToday, $lt: startOfTomorrow } })
        .sort({ createdAt: -1 }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10),
      TableBooking.find()
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          todayOrders,
          totalOrders,
          pendingOrders,
          preparingOrders,
          readyOrders,
          outForDeliveryOrders,
          deliveredOrders,
          cancelledOrders,
          delayedOrders,
          refunds: refundsCount,
          todayBookings,
          todayScheduledBookings,
          totalBookings,
          pendingBookings,
          totalCustomers,
          todayRegistrations,
          totalRestaurants,
          totalMenuItems,
          revenue,
        },
        timeZone,
        localDateStr,
        dateBoundaries: {
          startOfToday,
          startOfTomorrow,
        },
        todayOrdersList,
        recentOrders,
        recentBookings,
      },
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all registered users
 * @route   GET /api/admin/users
 * @access  Admin
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

/**
 * @desc    Update user status or role
 * @route   PATCH /api/admin/users/:id
 * @access  Admin
 */
export const updateUser = async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
};

export default {
  getDashboardStats,
  getAllUsers,
  updateUser,
};
