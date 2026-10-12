import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { createNotification } from '../services/notificationService.js';

/**
 * @desc    Get notifications for authenticated user or admin role
 * @route   GET /api/notifications
 * @access  Private (JWT protected)
 */
export const getNotifications = async (req, res) => {
  try {
    const user = req.user;
    const { type, read, page = 1, limit = 50, recipient } = req.query;

    const filter = {};

    if (user.role === 'admin') {
      // If admin specifies a specific recipient customer to inspect
      if (recipient) {
        filter.recipient = recipient;
      } else {
        // By default, admin receives admin notifications
        filter.recipientRole = 'admin';
      }
    } else {
      // STRICT SECURITY: Non-admin customers can ONLY see their own notifications.
      const isValidObjectId = user?._id && typeof user._id === 'string' && user._id.match(/^[0-9a-fA-F]{24}$/);
      if (isValidObjectId) {
        filter.recipient = user._id;
      } else {
        filter.recipient = null;
      }
      filter.recipientRole = user?.role || 'customer';
    }

    if (type && type !== 'all') {
      filter.type = type.toLowerCase();
    }

    if (read !== undefined) {
      filter.read = read === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, read: false }),
    ]);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: error.message,
    });
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private (JWT protected)
 */
export const getUnreadCount = async (req, res) => {
  try {
    const user = req.user;
    const filter = { read: false };

    if (user.role === 'admin') {
      filter.recipientRole = 'admin';
    } else {
      const isValidObjectId = user?._id && typeof user._id === 'string' && user._id.match(/^[0-9a-fA-F]{24}$/);
      if (isValidObjectId) {
        filter.recipient = user._id;
      } else {
        filter.recipient = null;
      }
      filter.recipientRole = user?.role || 'customer';
    }

    const unreadCount = await Notification.countDocuments(filter);

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve unread notification count',
      error: error.message,
    });
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private (JWT protected)
 */
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // STRICT SECURITY CHECK
    const isOwner = notification.recipient && String(notification.recipient) === String(user._id);
    const isAdminRole = user.role === 'admin' && notification.recipientRole === 'admin';

    if (!isOwner && !isAdminRole && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You cannot access or modify another user\'s notification',
      });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
};

/**
 * @desc    Mark all unread notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private (JWT protected)
 */
export const markAllRead = async (req, res) => {
  try {
    const user = req.user;
    const filter = { read: false };

    if (user.role === 'admin') {
      filter.recipientRole = 'admin';
    } else {
      const isValidObjectId = user?._id && typeof user._id === 'string' && user._id.match(/^[0-9a-fA-F]{24}$/);
      if (isValidObjectId) {
        filter.recipient = user._id;
      } else {
        filter.recipient = null;
      }
      filter.recipientRole = user?.role || 'customer';
    }

    const result = await Notification.updateMany(filter, {
      $set: { read: true, readAt: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message,
    });
  }
};

/**
 * @desc    Admin: Create manual broadcast notification
 * @route   POST /api/notifications
 * @access  Private (Admin only)
 */
export const createBroadcast = async (req, res) => {
  try {
    const { title, message, target = 'all', type = 'broadcast' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required',
      });
    }

    const idempotencyKey = `broadcast_${Date.now()}_${Math.random()}`;

    const result = await createNotification({
      recipientRole: target === 'admin' ? 'admin' : 'customer',
      title: title.trim(),
      message: message.trim(),
      type,
      eventType: 'admin_broadcast',
      metadata: { target },
      idempotencyKey,
    });


    return res.status(201).json({
      success: true,
      message: 'Notification published successfully',
      data: result.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to publish broadcast notification',
      error: error.message,
    });
  }
};

/**
 * @desc Save / register FCM device token for authenticated user
 * @route POST /api/notifications/fcm-token
 */
export const saveFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'fcmToken is required' });
    }

    if (req.user && req.user._id) {
      const User = (await import('../models/User.js')).default;
      if (typeof req.user._id === 'string' && req.user._id.match(/^[0-9a-fA-F]{24}$/)) {
        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { fcmTokens: fcmToken },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'FCM device token registered successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to save FCM token',
      error: error.message,
    });
  }
};

/**
 * @desc Test send FCM push notification
 * @route POST /api/notifications/test-push
 */
export const testPushNotification = async (req, res) => {
  try {
    const { fcmToken, title = 'ZESTRO Dining Alert', body = 'Test push notification from ZESTRO!' } = req.body;
    const { sendPushNotification } = await import('../services/fcmService.js');
    const result = await sendPushNotification({
      token: fcmToken,
      title,
      body,
      clickAction: '/customer/bookings',
    });

    return res.status(200).json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
  createBroadcast,
  saveFcmToken,
  testPushNotification,
};
