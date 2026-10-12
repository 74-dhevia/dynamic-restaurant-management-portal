import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
  createBroadcast,
  saveFcmToken,
  testPushNotification,
} from '../controllers/notificationController.js';
import { protect, optionalProtect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// FCM Web Push endpoints (open to authenticated diners or device registrations)
router.post('/fcm-token', optionalProtect, saveFcmToken);
router.post('/test-push', optionalProtect, testPushNotification);

// In-app notifications
router.get('/', optionalProtect, getNotifications);
router.get('/unread-count', optionalProtect, getUnreadCount);
router.patch('/read-all', optionalProtect, markAllRead);
router.patch('/:id/read', optionalProtect, markNotificationRead);
router.post('/', protect, authorize('admin'), createBroadcast);

export default router;
