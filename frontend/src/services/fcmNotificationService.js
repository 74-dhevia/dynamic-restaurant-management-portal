/**
 * Firebase Cloud Messaging (FCM) Client Service
 * Handles notification permissions, FCM device tokens, and foreground message handlers.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { firebaseConfig } from '../config/firebaseConfig';
import { getApiBaseUrl } from './apiConfig';

let messagingInstance = null;
let currentFcmToken = null;

/**
 * Initialize Firebase Messaging if supported by the browser
 */
export async function initializeFcm() {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('[FCM] Push messaging is not supported in this browser.');
      return null;
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (err) {
    console.warn('[FCM] Initialization warning:', err.message);
    return null;
  }
}

/**
 * Request Notification Permission and retrieve the FCM device token
 * @param {string} vapidKey Web Push certificate key from Firebase Console
 */
export async function requestNotificationPermission(vapidKey = '') {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('[FCM] Notifications are not supported in this environment.');
      return { success: false, reason: 'unsupported' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission was denied or dismissed:', permission);
      return { success: false, permission };
    }

    const messaging = messagingInstance || (await initializeFcm());
    if (!messaging) {
      return { success: false, reason: 'messaging_not_available' };
    }

    // Register service worker
    let registration = null;
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch (swErr) {
        console.warn('[FCM] SW registration note:', swErr.message);
      }
    }

    // Retrieve FCM Device Token
    const tokenOptions = {};
    if (registration) tokenOptions.serviceWorkerRegistration = registration;
    if (vapidKey) tokenOptions.vapidKey = vapidKey;

    const token = await getToken(messaging, tokenOptions);
    if (token) {
      currentFcmToken = token;
      localStorage.setItem('zestro_fcm_token', token);
      console.log('[FCM] Device Token acquired successfully:', token.slice(0, 20) + '...');

      // Sync token to backend
      await syncTokenToBackend(token);
      return { success: true, token };
    }

    return { success: false, reason: 'no_token_returned' };
  } catch (err) {
    console.warn('[FCM] Permission/Token error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Synchronize FCM token to backend user profile
 */
export async function syncTokenToBackend(token) {
  try {
    const baseUrl = getApiBaseUrl();
    const authToken = localStorage.getItem('token') || localStorage.getItem('zestro_token');
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    await fetch(`${baseUrl}/notifications/fcm-token`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fcmToken: token, device: navigator.userAgent }),
    });
  } catch (err) {
    console.warn('[FCM] Token sync warning:', err.message);
  }
}

/**
 * Listen for foreground push messages while app is actively open
 */
export function onForegroundMessage(callback) {
  if (!messagingInstance) return () => {};
  try {
    return onMessage(messagingInstance, (payload) => {
      console.log('[FCM] Foreground notification received:', payload);
      if (typeof callback === 'function') {
        callback(payload);
      }
    });
  } catch (err) {
    console.warn('[FCM] onMessage listener warning:', err.message);
    return () => {};
  }
}

export function getCurrentFcmToken() {
  return currentFcmToken || localStorage.getItem('zestro_fcm_token');
}

export default {
  initializeFcm,
  requestNotificationPermission,
  onForegroundMessage,
  syncTokenToBackend,
  getCurrentFcmToken,
};
