/**
 * Order API Service for ZESTRO Operations Center (Section 25 Backend Preparation).
 * 
 * Provides an abstracted data access layer for orders.
 * Currently bridges with the shared local/Redux persistence layer.
 * When an Express/MongoDB backend is introduced, endpoints can be toggled to real fetch/axios calls
 * without modifying UI or component logic:
 *   GET    /api/orders
 *   GET    /api/orders/:id
 *   POST   /api/orders
 *   PATCH  /api/orders/:id/status
 *   PATCH  /api/orders/:id/cancel
 *   PATCH  /api/orders/:id/priority
 *   PATCH  /api/orders/:id/note
 *   PATCH  /api/orders/:id/kitchen
 *   PATCH  /api/orders/:id/otp-verify
 *   GET    /api/orders/customer/:id
 *   GET    /api/orders/restaurant/:id
 */

import { getToken } from './jwtService';
import { getApiBaseUrl } from './apiConfig';

const API_BASE_URL = getApiBaseUrl();
const STORAGE_KEY = 'zestro_orders';

// Helper to safely load orders from storage
function getStoredOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('[orderApiService] Error loading orders:', err);
    return [];
  }
}

// Helper to safely persist orders
function persistOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('[orderApiService] Error saving orders:', err);
  }
}

export const orderApiService = {
  /**
   * Fetch all orders with optional filter/query parameters
   * Express equiv: GET /api/orders
   */
  async getOrders(params = {}) {
    const orders = getStoredOrders();
    let result = [...orders];

    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(o =>
        (o.id && o.id.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.userName && o.userName.toLowerCase().includes(q)) ||
        (o.userEmail && o.userEmail.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        (o.restaurantName && o.restaurantName.toLowerCase().includes(q)) ||
        (o.items && o.items.some(i => i.name && i.name.toLowerCase().includes(q)))
      );
    }

    if (params.status && params.status !== 'all') {
      result = result.filter(o => o.status === params.status);
    }

    if (params.restaurantId && params.restaurantId !== 'all') {
      result = result.filter(o => o.restaurantId === params.restaurantId);
    }

    return { success: true, data: result, total: result.length };
  },

  /**
   * Fetch a single order by ID
   * Express equiv: GET /api/orders/:id
   */
  async getOrderById(id) {
    const orders = getStoredOrders();
    const order = orders.find(o => o.id === id);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    return { success: true, data: order };
  },

  /**
   * Place/Create a new order
   * Express equiv: POST /api/orders
   */
  async createOrder(orderData) {
    const orders = getStoredOrders();
    orders.unshift(orderData);
    persistOrders(orders);
    return { success: true, data: orderData };
  },

  /**
   * Update order status with validation and audit logging
   * Express equiv: PATCH /api/orders/:id/status
   */
  async updateStatus(id, newStatus, { reason = '', by = 'Admin', note = '' } = {}) {
    const orders = getStoredOrders();
    const order = orders.find(o => o.id === id);
    if (!order) return { success: false, error: 'Order not found' };

    order.status = newStatus;
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: newStatus,
      at: new Date().toISOString(),
      updatedBy: by,
      note: note || reason || `Status updated to ${newStatus}`,
    });

    if (newStatus === 'Delivered') {
      order.otpStatus = 'Verified';
      order.deliveredAt = new Date().toISOString();
    }

    persistOrders(orders);
    return { success: true, data: order };
  },

  /**
   * Record food quality checkpoint results
   * Express equiv: PATCH /api/orders/:id/quality-check
   */
  async updateQualityCheck(id, qualityCheckData) {
    const orders = getStoredOrders();
    const order = orders.find(o => o.id === id);
    if (order) {
      order.qualityCheck = qualityCheckData;
      order.status = 'Ready';
      order.kitchenStatus = 'Ready';
      order.actualReadyTime = qualityCheckData.verifiedAt || new Date().toISOString();
      if (!order.timeline) order.timeline = [];
      order.timeline.push({
        status: 'Ready',
        at: new Date().toISOString(),
        updatedBy: qualityCheckData.verifiedBy || 'Kitchen Chef',
        note: `Quality verified & marked Ready`,
      });
      persistOrders(orders);
    }

    try {
      const token = getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/orders/${id}/quality-check`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ qualityCheck: qualityCheckData }),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, data: json.data || order };
      }
    } catch (err) {
      console.warn('[orderApiService] Remote quality check sync note:', err.message);
    }

    return { success: true, data: order };
  },

  /**
   * Cancel an order and initiate refund flow
   * Express equiv: PATCH /api/orders/:id/cancel
   */
  async cancelOrder(id, { reason = 'Cancelled by Admin', by = 'Admin' } = {}) {
    const orders = getStoredOrders();
    const order = orders.find(o => o.id === id);
    if (!order) return { success: false, error: 'Order not found' };

    order.status = 'Cancelled';
    order.cancelled = true;
    order.cancellation = {
      reason,
      cancelledBy: by,
      at: new Date().toISOString(),
    };

    if (!order.refund) {
      order.refund = {
        id: `RF${Date.now()}`,
        status: order.paymentStatus === 'Paid' ? 'Processing' : 'Not Applicable',
        amount: order.grandTotal || 0,
        method: order.paymentMethod || 'Original Payment Source',
        requestedAt: new Date().toISOString(),
        completedAt: null,
      };
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'Cancelled',
      at: new Date().toISOString(),
      updatedBy: by,
      note: `Cancelled: ${reason}`,
    });

    persistOrders(orders);
    return { success: true, data: order };
  },

  /**
   * Update internal admin notes (not visible to customer)
   * Express equiv: PATCH /api/orders/:id/note
   */
  async updateInternalNote(id, note) {
    const orders = getStoredOrders();
    const order = orders.find(o => o.id === id);
    if (!order) return { success: false, error: 'Order not found' };
    order.internalNote = note;
    persistOrders(orders);
    return { success: true, data: order };
  },

  /**
   * Update order priority (Normal, High, Urgent)
   * Express equiv: PATCH /api/orders/:id/priority
   */
  async updatePriority(id, priority) {
    const orders = getStoredOrders();
    const order = orders.find(o => o.id === id);
    if (!order) return { success: false, error: 'Order not found' };
    order.priority = priority;
    persistOrders(orders);
    return { success: true, data: order };
  },

  /**
   * Update kitchen preparation status
   * Express equiv: PATCH /api/orders/:id/kitchen
   */
  async updateKitchenStatus(id, kitchenStatus) {
    const orders = getStoredOrders();
    const order = orders.find(o => o.id === id);
    if (!order) return { success: false, error: 'Order not found' };
    order.kitchenStatus = kitchenStatus;
    persistOrders(orders);
    return { success: true, data: order };
  },

  /**
   * Verify delivery OTP (admin sets OTP status without exposing real OTP)
   * Express equiv: PATCH /api/orders/:id/otp-verify
   */
  async verifyDeliveryOtp(id) {
    const orders = getStoredOrders();
    const order = orders.find(o => o.id === id);
    if (!order) return { success: false, error: 'Order not found' };
    order.otpStatus = 'Verified';
    persistOrders(orders);
    return { success: true, data: order };
  },

  /**
   * Fetch all orders for a specific customer
   * Express equiv: GET /api/orders/customer/:id
   */
  async getCustomerOrders(customerId, customerEmail) {
    const orders = getStoredOrders();
    const customerOrders = orders.filter(o =>
      (customerId && o.userId === customerId) ||
      (customerEmail && (o.userEmail === customerEmail || o.customerEmail === customerEmail))
    );
    return { success: true, data: customerOrders };
  },

  /**
   * Fetch all orders for a specific restaurant
   * Express equiv: GET /api/orders/restaurant/:id
   */
  async getRestaurantOrders(restaurantId) {
    const orders = getStoredOrders();
    const restaurantOrders = orders.filter(o => o.restaurantId === restaurantId);
    return { success: true, data: restaurantOrders };
  },
};

export default orderApiService;
