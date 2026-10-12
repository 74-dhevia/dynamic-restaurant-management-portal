/**
 * Admin Notification Service for ZESTRO Restaurant Operations Control Center.
 * Connects frontend notification center to real backend MongoDB Atlas /api/notifications API.
 * Uses real database records only (no fake seed records, no localStorage source of truth).
 */

import { getToken } from './jwtService';
import { getApiBaseUrl } from './apiConfig';

const API_BASE_URL = getApiBaseUrl();

let memoryCache = [];
let hasFetched = false;

function formatRelativeTime(date) {
  if (!date) return 'Recently';
  const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
  return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function formatNotification(doc) {
  if (!doc) return null;
  return {
    id: doc._id || doc.id || `notif_${Date.now()}`,
    type: doc.type || 'system',
    title: doc.title,
    desc: doc.message || doc.desc || '',
    message: doc.message || doc.desc || '',
    customerName: doc.metadata?.customerName || '',
    customerEmail: doc.metadata?.customerEmail || '',
    restaurantName: doc.metadata?.restaurantName || '',
    amount: doc.metadata?.amount || null,
    status: doc.metadata?.status || '',
    entityId: doc.entityId || '',
    date: doc.metadata?.bookingDate || '',
    timeSlot: doc.metadata?.timeSlot || '',
    guests: doc.metadata?.guests || null,
    time: formatRelativeTime(doc.createdAt),
    read: Boolean(doc.read),
    actions: doc.type === 'order' ? ['view_order', 'manage_order'] : doc.type === 'booking' ? ['view_booking', 'confirm_booking'] : [],
    createdAt: doc.createdAt || new Date().toISOString(),
    raw: doc,
  };
}

/**
 * Fetch real administrative notifications from MongoDB backend
 */
export async function fetchAdminNotifications() {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/notifications?limit=50`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        memoryCache = data.data.map(formatNotification).filter(Boolean);
        hasFetched = true;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('zestro_admin_notif_added', { detail: memoryCache }));
        }
        return memoryCache;
      }
    }
  } catch (err) {
    console.warn('[adminNotificationService] Fetch error:', err.message);
  }
  return memoryCache;
}

/**
 * Synchronously get current notifications cache and triggers initial fetch if needed
 */
export function getAdminNotifications() {
  if (!hasFetched && typeof window !== 'undefined') {
    fetchAdminNotifications();
  }
  return memoryCache;
}

/**
 * Mark all notifications as read in backend MongoDB and local cache
 */
export async function markAdminNotificationsRead() {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    memoryCache = memoryCache.map(n => ({ ...n, read: true }));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('zestro_admin_notif_updated'));
    }
    return memoryCache;
  } catch (err) {
    console.warn('[adminNotificationService] Mark read error:', err.message);
    memoryCache = memoryCache.map(n => ({ ...n, read: true }));
    return memoryCache;
  }
}

/**
 * Mark single notification as read in backend MongoDB
 */
export async function markNotificationRead(id) {
  try {
    const token = getToken();
    await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    memoryCache = memoryCache.map(n => n.id === id ? { ...n, read: true } : n);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('zestro_admin_notif_updated'));
    }
  } catch (err) {
    console.warn('[adminNotificationService] Mark single read error:', err.message);
  }
}

/**
 * Push notification / broadcast to backend
 */
export async function pushAdminNotification(notif) {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        title: notif.title,
        message: notif.desc || notif.message,
        type: notif.type || 'broadcast',
        target: 'admin',
      }),
    });

    if (res.ok) {
      const result = await res.json();
      if (result && result.data) {
        const formatted = formatNotification(result.data);
        memoryCache = [formatted, ...memoryCache];
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('zestro_admin_notif_added', { detail: formatted }));
        }
        return formatted;
      }
    }
  } catch (err) {
    console.warn('[adminNotificationService] Push notification error:', err.message);
  }
  return null;
}

export function clearAdminNotifications() {
  memoryCache = [];
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zestro_admin_notif_updated'));
  }
}

export default {
  fetchAdminNotifications,
  getAdminNotifications,
  pushAdminNotification,
  markAdminNotificationsRead,
  markNotificationRead,
  clearAdminNotifications,
};
