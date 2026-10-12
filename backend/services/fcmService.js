/**
 * Firebase Admin FCM Push Notification Service for ZESTRO
 * Sends real-time Web Push & Mobile notifications for reservations, orders, and waitlists.
 */

import admin from 'firebase-admin';
import User from '../models/User.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let fcmInitialized = false;

// Attempt to load Service Account JSON if placed in backend directory or config
function initFirebaseAdmin() {
  if (fcmInitialized || admin.apps.length > 0) {
    fcmInitialized = true;
    return admin;
  }

  try {
    const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
    const altPath = path.resolve(__dirname, '../config/serviceAccountKey.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || 'zestro-fad9b',
      });
      fcmInitialized = true;
      console.log('[FCM Admin] Initialized with serviceAccountKey.json');
      return admin;
    } else if (fs.existsSync(altPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(altPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || 'zestro-fad9b',
      });
      fcmInitialized = true;
      console.log('[FCM Admin] Initialized with config/serviceAccountKey.json');
      return admin;
    } else {
      // Initialize with default project ID
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'zestro-fad9b',
      });
      fcmInitialized = true;
      console.log('[FCM Admin] Initialized with default projectId zestro-fad9b');
      return admin;
    }
  } catch (err) {
    console.warn('[FCM Admin] Initialization note:', err.message);
    return null;
  }
}

// Initialize on module import
initFirebaseAdmin();

/**
 * Send push notification to a specific device FCM token
 */
export async function sendPushNotification({ token, title, body, data = {}, clickAction = '/' }) {
  if (!token) return { success: false, reason: 'no_token' };
  try {
    initFirebaseAdmin();

    const message = {
      token,
      notification: {
        title: title || 'ZESTRO Dining Alert',
        body: body || 'You have an update on your table or order.',
      },
      data: {
        ...data,
        clickAction: clickAction || '/',
        timestamp: String(Date.now()),
      },
      webpush: {
        notification: {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: clickAction || '/',
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('[FCM Admin] Push notification sent successfully:', response);
    return { success: true, messageId: response };
  } catch (err) {
    console.warn('[FCM Admin] Failed to send push notification:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send push notification to a customer by User ID or Email
 */
export async function sendPushNotificationToUser(userIdOrEmail, { title, body, data = {}, clickAction = '/' }) {
  try {
    if (!userIdOrEmail) return { success: false };

    let user = null;
    if (typeof userIdOrEmail === 'string' && userIdOrEmail.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(userIdOrEmail);
    }
    if (!user && typeof userIdOrEmail === 'string' && userIdOrEmail.includes('@')) {
      user = await User.findOne({ email: userIdOrEmail.toLowerCase() });
    }

    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log('[FCM Admin] User has no registered FCM device tokens:', userIdOrEmail);
      return { success: false, reason: 'no_tokens_registered' };
    }

    const results = await Promise.all(
      user.fcmTokens.map((tok) =>
        sendPushNotification({ token: tok, title, body, data, clickAction })
      )
    );

    return { success: results.some((r) => r.success), results };
  } catch (err) {
    console.warn('[FCM Admin] User push error:', err.message);
    return { success: false, error: err.message };
  }
}

export default {
  initFirebaseAdmin,
  sendPushNotification,
  sendPushNotificationToUser,
};
