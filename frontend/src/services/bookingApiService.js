/**
 * Real-Time Booking API Service for ZESTRO
 * Directly connects to MongoDB backend (/api/bookings) with JWT auth
 * and local storage fallback.
 */

import { getApiBaseUrl } from './apiConfig';

const STORAGE_KEY = 'zestro_bookings';

function getStoredBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function persistBookings(bookings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error('[bookingApiService] Error saving bookings:', err);
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('zestro_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const bookingApiService = {
  /**
   * Fetch real-time live table availability for restaurant, date, and time slot
   */
  async getTableAvailability({ restaurantId, date, timeSlot, guests = 2, seatingArea = 'All' }) {
    const baseUrl = getApiBaseUrl();
    try {
      const q = new URLSearchParams({
        restaurantId,
        date: date || new Date().toISOString().slice(0, 10),
        timeSlot: timeSlot || '7:30 PM',
        guests: String(guests || 2),
        seatingArea: seatingArea || 'All',
      });
      const response = await fetch(`${baseUrl}/bookings/availability?${q.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return data;
      }
      return { success: false, message: data.message || 'Failed to fetch table availability' };
    } catch (err) {
      console.warn('[bookingApiService] Availability fetch error, fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  /**
   * Reserve a restaurant table
   */
  async createBooking(bookingData) {
    const baseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bookingData),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const stored = getStoredBookings();
        persistBookings([data.data, ...stored]);
        return data;
      }
      return {
        success: false,
        conflict: response.status === 409 || data.conflict,
        message: data.message || 'Failed to reserve table',
      };
    } catch (err) {
      console.warn('[bookingApiService] Create booking network error, saving locally:', err.message);
      const bookingNumber = `ZB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const fallbackBooking = {
        ...bookingData,
        id: bookingNumber,
        bookingNumber,
        status: 'Confirmed',
        checkInPin: Math.floor(1000 + Math.random() * 9000).toString(),
        createdAt: new Date().toISOString(),
      };
      const stored = getStoredBookings();
      persistBookings([fallbackBooking, ...stored]);
      return { success: true, data: fallbackBooking, offline: true };
    }
  },

  /**
   * Get current user's bookings from backend
   */
  async getMyBookings() {
    const baseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/bookings/my-bookings`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        persistBookings(data.data);
        return data;
      }
      return { success: true, data: getStoredBookings() };
    } catch (err) {
      return { success: true, data: getStoredBookings() };
    }
  },

  /**
   * Get single booking by ID or Reference
   */
  async getBookingById(id) {
    const baseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/bookings/${id}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return data;
      }
    } catch {}
    const stored = getStoredBookings();
    const found = stored.find(b => b.id === id || b.bookingNumber === id || b._id === id);
    return { success: !!found, data: found };
  },

  /**
   * Cancel booking
   */
  async cancelBooking(id, cancellationReason = 'Customer Request') {
    const baseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/bookings/${id}/cancel`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ cancellationReason }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const stored = getStoredBookings().map(b => (b.id === id || b.bookingNumber === id || b._id === id) ? { ...b, status: 'Cancelled' } : b);
        persistBookings(stored);
        return data;
      }
    } catch {}
    const stored = getStoredBookings().map(b => (b.id === id || b.bookingNumber === id || b._id === id) ? { ...b, status: 'Cancelled' } : b);
    persistBookings(stored);
    return { success: true, message: 'Booking cancelled' };
  },

  /**
   * Reschedule booking
   */
  async rescheduleBooking(id, updateData) {
    const baseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/bookings/${id}/reschedule`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const stored = getStoredBookings().map(b => (b.id === id || b.bookingNumber === id || b._id === id) ? { ...b, ...data.data } : b);
        persistBookings(stored);
        return data;
      }
      return { success: false, conflict: response.status === 409 || data.conflict, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Join Smart Waitlist
   */
  async joinWaitlist(waitlistData) {
    const baseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/bookings/waitlist`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(waitlistData),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Get customer's waitlist
   */
  async getMyWaitlist() {
    const baseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/bookings/waitlist/my`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      return { success: false, data: [] };
    }
  },
};

export default bookingApiService;
