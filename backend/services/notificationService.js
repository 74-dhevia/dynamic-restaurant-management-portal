import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

// Fast in-memory deduplication cache
const memNotifKeys = new Set();

/**
 * Creates a persistent notification in MongoDB with deduplication.
 * Only genuine events produce notifications.
 * Duplicate attempts with the same idempotencyKey are safely intercepted.
 */
export const createNotification = async ({
  recipient = null,
  recipientRole = 'customer',
  title,
  message,
  type = 'system',
  eventType,
  entityId = '',
  entityType = '',
  actionUrl = '',
  metadata = {},
  idempotencyKey,
}) => {
  if (!idempotencyKey) {
    throw new Error('idempotencyKey is required for notification dispatch');
  }

  // 1. Fast in-memory deduplication check
  if (memNotifKeys.has(idempotencyKey)) {
    return {
      success: true,
      skipped: true,
      reason: 'Duplicate event: Notification already created',
    };
  }

  // 2. Database deduplication check
  if (mongoose.connection.readyState === 1) {
    try {
      const existing = await Notification.findOne({ idempotencyKey });
      if (existing) {
        memNotifKeys.add(idempotencyKey);
        return {
          success: true,
          skipped: true,
          reason: 'Duplicate event: Notification already exists in database',
          data: existing,
        };
      }
    } catch (err) {
      console.warn('[NotificationService] Check error:', err.message);
    }
  }

  try {
    const notification = await Notification.create({
      recipient,
      recipientRole,
      title,
      message,
      type,
      eventType,
      entityId,
      entityType,
      actionUrl,
      metadata,
      idempotencyKey,
      read: false,
    });

    memNotifKeys.add(idempotencyKey);
    return {
      success: true,
      skipped: false,
      data: notification,
    };
  } catch (err) {
    // Catch MongoDB duplicate key error (code 11000) for concurrency safety
    if (err.code === 11000) {
      memNotifKeys.add(idempotencyKey);
      const existing = await Notification.findOne({ idempotencyKey }).catch(() => null);
      return {
        success: true,
        skipped: true,
        reason: 'Concurrent duplicate event intercepted',
        data: existing,
      };
    }
    console.error('[NotificationService] Failed to create notification:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
};

export default {
  createNotification,
};
