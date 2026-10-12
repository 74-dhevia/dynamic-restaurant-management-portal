/**
 * Issue API Service for ZESTRO Operations Center (Part 8: Customer Support & Issues).
 * 
 * BACKEND PREPARATION:
 *   GET    /api/issues
 *   GET    /api/issues/:id
 *   POST   /api/issues
 *   PATCH  /api/issues/:id/status
 *   POST   /api/issues/:id/response
 */

const STORAGE_ISSUES = 'zestro_customer_issues';
const STORAGE_ORDERS = 'zestro_orders';
const STORAGE_BOOKINGS = 'zestro_bookings';
const STORAGE_INCIDENTS = 'zestro_kitchen_incidents';
const STORAGE_NOTIFS = 'zestro_customer_notifications';

export const ISSUE_TYPES = [
  'Order Problem',
  'Payment Problem',
  'Delivery Problem',
  'Food Problem',
  'Table Booking Problem',
  'Restaurant Problem',
  'Other',
];

export const ISSUE_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export const ISSUE_STATUS_SEQUENCE = [
  'Open',
  'Processing',
  'Waiting for Customer',
  'Resolved',
  'Closed',
];

export const SEED_ISSUES = [
  {
    id: 'ISS-1024',
    customerId: 'u_dheiva',
    customerName: 'Dheiva Lakshmi',
    customerEmail: 'dheiva@example.com',
    customerPhone: '+91 98401 23456',
    orderId: 'ZST-1024',
    restaurantName: 'Dindigul Thalappakatti',
    issueType: 'Delivery Problem',
    subject: 'Order delayed due to kitchen pause & route detour',
    description: 'Rider took an unintended detour and kitchen burner check paused order packaging. Food delivery is delayed by approx 25 minutes.',
    priority: 'High',
    status: 'Processing',
    isKitchenIncidentRelated: true,
    relatedIncidentId: 'INC-1024',
    incidentCause: 'Kitchen equipment failure (Burner Gas Valve Pressure Check)',
    refundStatus: 'Not Started',
    reportedAt: '2026-09-26T10:45:00.000Z',
    timeline: [
      { status: 'Open', at: '2026-09-26T10:45:00.000Z', note: 'Issue reported by customer in-app' },
      { status: 'Admin Opened', at: '2026-09-26T10:50:00.000Z', note: 'Admin reviewed issue details' },
      { status: 'Processing', at: '2026-09-26T10:55:00.000Z', note: 'Dispatched logistics priority alert to delivery partner' },
    ],
    adminResponses: [
      {
        id: 'resp_1',
        sender: 'Admin Dheiva',
        message: 'We apologize for the delay. The kitchen has resumed packaging and our driver has been re-routed with priority.',
        sentAt: '2026-09-26T11:00:00.000Z',
        channel: 'In-App',
      },
    ],
  },
  {
    id: 'ISS-1025',
    customerId: 'u_priya',
    customerName: 'Priya Sharma',
    customerEmail: 'priya@example.com',
    customerPhone: '+91 98451 23456',
    orderId: 'ZST-1029',
    restaurantName: 'Dindigul Thalappakatti',
    issueType: 'Order Problem',
    subject: 'Kitchen delay inquiry & request for delivery status',
    description: 'Order status has been showing Preparing for longer than usual. Inquiring whether items will arrive in time for lunch.',
    priority: 'Critical',
    status: 'Waiting for Customer',
    isKitchenIncidentRelated: true,
    relatedIncidentId: 'INC-1024',
    incidentCause: 'Gas pressure valve calibration halted main cooking range',
    refundStatus: 'Processing',
    reportedAt: '2026-09-26T09:30:00.000Z',
    timeline: [
      { status: 'Open', at: '2026-09-26T09:30:00.000Z', note: 'Issue created by customer' },
      { status: 'Admin Opened', at: '2026-09-26T09:35:00.000Z', note: 'Admin verified incident INC-1024' },
      { status: 'Processing', at: '2026-09-26T09:40:00.000Z', note: 'Initiated complimentary meal credit' },
      { status: 'Response Sent', at: '2026-09-26T09:45:00.000Z', note: 'Sent voucher code VOUCH100' },
      { status: 'Waiting for Customer', at: '2026-09-26T09:50:00.000Z', note: 'Awaiting customer response to proceed with express delivery' },
    ],
    adminResponses: [
      {
        id: 'resp_2',
        sender: 'Admin Dheiva',
        message: 'Dear Priya, we apologize for the burner safety halt. We have credited voucher VOUCH100 and food will be dispatched within 12 minutes.',
        sentAt: '2026-09-26T09:45:00.000Z',
        channel: 'In-App',
      },
    ],
  },
  {
    id: 'ISS-1019',
    customerId: 'u_rahul',
    customerName: 'Rahul Verma',
    customerEmail: 'rahul@example.com',
    customerPhone: '+91 98765 43210',
    bookingId: 'BK-2048',
    restaurantName: 'ABC Restaurant',
    issueType: 'Table Booking Problem',
    subject: 'Table seating request modification',
    description: 'Need table moved from indoor to window corner if possible for family birthday.',
    priority: 'Medium',
    status: 'Resolved',
    reportedAt: '2026-09-25T16:00:00.000Z',
    resolvedAt: '2026-09-25T17:30:00.000Z',
    timeline: [
      { status: 'Open', at: '2026-09-25T16:00:00.000Z', note: 'Customer requested window corner seating' },
      { status: 'Admin Opened', at: '2026-09-25T16:15:00.000Z', note: 'Admin contacted floor manager' },
      { status: 'Processing', at: '2026-09-25T16:30:00.000Z', note: 'Table T-12 allocated and decorated' },
      { status: 'Resolved', at: '2026-09-25T17:30:00.000Z', note: 'Reservation updated with window table' },
    ],
    adminResponses: [
      {
        id: 'resp_3',
        sender: 'Operations Desk',
        message: 'Floor manager confirmed window table T-12 has been set up with birthday decor for your arrival.',
        sentAt: '2026-09-25T16:45:00.000Z',
        channel: 'In-App',
      },
    ],
  },
  {
    id: 'ISS-1012',
    customerId: 'u_vikram',
    customerName: 'Vikram Singh',
    customerEmail: 'vikram@example.com',
    customerPhone: '+91 99887 76655',
    orderId: 'ZST-1008',
    restaurantName: 'A2B - Adyar Ananda Bhavan',
    issueType: 'Payment Problem',
    subject: 'Refund status inquiry for cancelled order',
    description: 'Order was cancelled and customer inquired about UPI reversal transaction reference.',
    priority: 'Low',
    status: 'Closed',
    refundStatus: 'Completed',
    reportedAt: '2026-09-24T11:00:00.000Z',
    resolvedAt: '2026-09-24T12:00:00.000Z',
    timeline: [
      { status: 'Open', at: '2026-09-24T11:00:00.000Z', note: 'Inquiry submitted' },
      { status: 'Processing', at: '2026-09-24T11:20:00.000Z', note: 'Finance checked gateway logs' },
      { status: 'Resolved', at: '2026-09-24T11:50:00.000Z', note: 'Shared UPI reference UPI-2026-778899' },
      { status: 'Closed', at: '2026-09-24T12:00:00.000Z', note: 'Customer confirmed receipt' },
    ],
    adminResponses: [
      {
        id: 'resp_4',
        sender: 'Finance Support',
        message: 'Your refund of ₹420 has been completed successfully via UPI. Transaction reference: UPI-2026-778899.',
        sentAt: '2026-09-24T11:50:00.000Z',
        channel: 'In-App',
      },
    ],
  },
  {
    id: 'ISS-1010',
    customerId: 'u_ananya',
    customerName: 'Ananya Patel',
    customerEmail: 'ananya@example.com',
    customerPhone: '+91 97123 45678',
    restaurantName: 'Junior Kuppanna',
    issueType: 'Food Problem',
    subject: 'Incorrect spicy salna received',
    description: 'Mild gravy was requested for kids, but extra spicy pepper salna was delivered.',
    priority: 'Medium',
    status: 'Open',
    reportedAt: '2026-09-26T12:15:00.000Z',
    timeline: [
      { status: 'Open', at: '2026-09-26T12:15:00.000Z', note: 'Customer submitted spice complaint' },
    ],
    adminResponses: [],
  },
];

function getStored(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}

function initIssues() {
  const existing = getStored(STORAGE_ISSUES, null);
  if (!existing || !Array.isArray(existing) || existing.length === 0) {
    setStored(STORAGE_ISSUES, SEED_ISSUES);
    return SEED_ISSUES;
  }
  const existingIds = new Set(existing.map(i => i.id));
  let changed = false;
  const merged = [...existing];
  SEED_ISSUES.forEach(seed => {
    if (!existingIds.has(seed.id)) {
      merged.push(seed);
      changed = true;
    }
  });
  if (changed) {
    setStored(STORAGE_ISSUES, merged);
    return merged;
  }
  return existing;
}

export const issueApiService = {
  /**
   * GET /issues
   */
  async getIssues(filters = {}) {
    const raw = initIssues();
    let list = [...raw];

    // 1. Search Query: Issue ID, Customer, Order ID, Booking ID, Restaurant, Issue type
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(i =>
        (i.id || '').toLowerCase().includes(q) ||
        (i.customerName || '').toLowerCase().includes(q) ||
        (i.customerEmail || '').toLowerCase().includes(q) ||
        (i.orderId || '').toLowerCase().includes(q) ||
        (i.bookingId || '').toLowerCase().includes(q) ||
        (i.restaurantName || '').toLowerCase().includes(q) ||
        (i.issueType || '').toLowerCase().includes(q) ||
        (i.subject || '').toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q)
      );
    }

    // 2. Status Filter
    if (filters.status && filters.status !== 'all') {
      list = list.filter(i => (i.status || 'Open').toLowerCase() === filters.status.toLowerCase());
    }

    // 3. Priority Filter
    if (filters.priority && filters.priority !== 'all') {
      list = list.filter(i => (i.priority || 'Medium').toLowerCase() === filters.priority.toLowerCase());
    }

    // 4. Issue Type Filter
    if (filters.issueType && filters.issueType !== 'all') {
      list = list.filter(i => (i.issueType || '').toLowerCase() === filters.issueType.toLowerCase());
    }

    // 5. Restaurant Filter
    if (filters.restaurant && filters.restaurant !== 'all') {
      list = list.filter(i => (i.restaurantName || '').toLowerCase() === filters.restaurant.toLowerCase());
    }

    // 6. Date Filter
    if (filters.date && filters.date !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfWeek = now.getTime() - 7 * 86400000;
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      list = list.filter(i => {
        const time = new Date(i.reportedAt || 0).getTime();
        if (filters.date === 'today') return time >= startOfToday;
        if (filters.date === 'this-week') return time >= startOfWeek;
        if (filters.date === 'this-month') return time >= startOfMonth;
        if (filters.date === 'custom' && filters.customDate) {
          const dateStr = new Date(time).toISOString().slice(0, 10);
          return dateStr === filters.customDate;
        }
        return true;
      });
    }

    // 7. Sort: Newest | Oldest | Highest Priority
    if (filters.sort === 'oldest') {
      list.sort((a, b) => new Date(a.reportedAt || 0) - new Date(b.reportedAt || 0));
    } else if (filters.sort === 'priority') {
      const pWeights = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      list.sort((a, b) => (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0));
    } else {
      // default: newest
      list.sort((a, b) => new Date(b.reportedAt || 0) - new Date(a.reportedAt || 0));
    }

    return list;
  },

  /**
   * GET /issues/:id
   */
  async getIssueById(id) {
    const list = initIssues();
    const issue = list.find(i => i.id === id);
    if (!issue) return null;

    // Enrich with order and booking details
    const orders = getStored(STORAGE_ORDERS, []);
    const bookings = getStored(STORAGE_BOOKINGS, []);
    const incidents = getStored(STORAGE_INCIDENTS, []);

    const relatedOrder = issue.orderId ? orders.find(o => o.id === issue.orderId) : null;
    const relatedBooking = issue.bookingId ? bookings.find(b => b.id === issue.bookingId) : null;
    const relatedIncident = issue.relatedIncidentId ? incidents.find(inc => inc.id === issue.relatedIncidentId) : null;

    return {
      ...issue,
      relatedOrder,
      relatedBooking,
      relatedIncident,
    };
  },

  /**
   * POST /issues
   */
  async createIssue(issueData) {
    const issues = initIssues();
    const newId = `ISS-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const newIssue = {
      id: newId,
      customerId: issueData.customerId || 'u_guest',
      customerName: issueData.customerName || 'Customer',
      customerEmail: issueData.customerEmail || 'customer@example.com',
      customerPhone: issueData.customerPhone || '',
      orderId: issueData.orderId || null,
      bookingId: issueData.bookingId || null,
      restaurantName: issueData.restaurantName || 'ZESTRO Partner',
      issueType: issueData.issueType || 'Order Problem',
      subject: issueData.subject || 'Support Ticket',
      description: issueData.description || '',
      priority: issueData.priority || 'Medium',
      status: 'Open',
      refundStatus: 'Not Started',
      reportedAt: nowIso,
      timeline: [
        { status: 'Issue Created', at: nowIso, note: 'Problem reported by customer' },
      ],
      adminResponses: [],
    };

    issues.unshift(newIssue);
    setStored(STORAGE_ISSUES, issues);
    return newIssue;
  },

  /**
   * PATCH /issues/:id/status
   * Follows sequence: Open -> Processing -> Waiting for Customer -> Resolved -> Closed
   */
  async updateIssueStatus(id, newStatus, adminNote = '') {
    const issues = initIssues();
    let updatedIssue = null;

    const updated = issues.map(i => {
      if (i.id === id) {
        const nowIso = new Date().toISOString();
        const newTimeline = [
          ...(i.timeline || []),
          {
            status: newStatus,
            at: nowIso,
            note: adminNote || `Status updated to ${newStatus} by Admin`,
          },
        ];

        updatedIssue = {
          ...i,
          status: newStatus,
          resolvedAt: (newStatus === 'Resolved' || newStatus === 'Closed') ? nowIso : i.resolvedAt,
          updatedAt: nowIso,
          timeline: newTimeline,
        };
        return updatedIssue;
      }
      return i;
    });

    setStored(STORAGE_ISSUES, updated);
    return updatedIssue;
  },

  /**
   * POST /issues/:id/response
   * Save Admin response and add to customer notifications
   */
  async sendIssueResponse(id, responseText, channel = 'In-App') {
    const issues = initIssues();
    const notifs = getStored(STORAGE_NOTIFS, []);
    let updatedIssue = null;
    const nowIso = new Date().toISOString();

    const updated = issues.map(i => {
      if (i.id === id) {
        const newResp = {
          id: `resp_${Date.now()}`,
          sender: 'ZESTRO Support Admin',
          message: responseText,
          sentAt: nowIso,
          channel,
        };

        const newTimeline = [
          ...(i.timeline || []),
          {
            status: 'Response Sent',
            at: nowIso,
            note: `Admin response sent via ${channel}`,
          },
        ];

        // Also if status was Open, automatically move to Processing
        const nextStatus = i.status === 'Open' ? 'Processing' : i.status;

        updatedIssue = {
          ...i,
          status: nextStatus,
          adminResponses: [...(i.adminResponses || []), newResp],
          timeline: newTimeline,
          updatedAt: nowIso,
        };
        return updatedIssue;
      }
      return i;
    });

    setStored(STORAGE_ISSUES, updated);

    // Create notification for customer
    if (updatedIssue) {
      notifs.unshift({
        id: `notif_iss_resp_${Date.now()}`,
        customerId: updatedIssue.customerId,
        type: `Support Response: #${updatedIssue.id}`,
        message: responseText,
        channel,
        status: 'Sent',
        timestamp: nowIso,
      });
      setStored(STORAGE_NOTIFS, notifs);
    }

    return updatedIssue;
  },

  /**
   * Send operational incident notification to affected customer
   */
  async notifyAffectedCustomer(issueId, customMessage) {
    const issue = await this.getIssueById(issueId);
    if (!issue) return false;

    const notifs = getStored(STORAGE_NOTIFS, []);
    const nowIso = new Date().toISOString();
    const msg = customMessage || `Operational Notice: Your order #${issue.orderId || ''} is experiencing a brief hold due to a kitchen incident. Our team is actively addressing it.`;

    notifs.unshift({
      id: `notif_incident_${Date.now()}`,
      customerId: issue.customerId,
      type: 'Kitchen Incident Alert',
      message: msg,
      channel: 'In-App',
      status: 'Sent',
      timestamp: nowIso,
    });
    setStored(STORAGE_NOTIFS, notifs);
    return true;
  },

  /**
   * Start refund for connected order
   */
  async startIssueRefund(issueId) {
    const issues = initIssues();
    const orders = getStored(STORAGE_ORDERS, []);
    let updatedIssue = null;

    const targetIssue = issues.find(i => i.id === issueId);
    if (!targetIssue || !targetIssue.orderId) return null;

    // Update order refund structure
    const updatedOrders = orders.map(o => {
      if (o.id === targetIssue.orderId) {
        return {
          ...o,
          paymentStatus: 'Refund Processing',
          refund: {
            id: `RF-${Math.floor(100000 + Math.random() * 900000)}`,
            status: 'Processing',
            amount: o.grandTotal,
            method: o.paymentMethod || 'UPI',
            requestedAt: new Date().toISOString(),
          },
        };
      }
      return o;
    });
    setStored(STORAGE_ORDERS, updatedOrders);

    // Update issue refund status
    const updatedIssues = issues.map(i => {
      if (i.id === issueId) {
        updatedIssue = {
          ...i,
          refundStatus: 'Processing',
          timeline: [
            ...(i.timeline || []),
            {
              status: 'Refund Initiated',
              at: new Date().toISOString(),
              note: `Admin initiated refund of full order amount`,
            },
          ],
        };
        return updatedIssue;
      }
      return i;
    });
    setStored(STORAGE_ISSUES, updatedIssues);
    return updatedIssue;
  },

  /**
   * Calculate summary metrics for Customer Issues
   */
  async getIssueSummary() {
    const raw = initIssues();
    return {
      open: raw.filter(i => (i.status || 'Open') === 'Open').length,
      highPriority: raw.filter(i => i.priority === 'High' || i.priority === 'Critical').length,
      processing: raw.filter(i => i.status === 'Processing').length,
      waitingForCustomer: raw.filter(i => i.status === 'Waiting for Customer').length,
      resolved: raw.filter(i => i.status === 'Resolved').length,
      closed: raw.filter(i => i.status === 'Closed').length,
      total: raw.length,
    };
  },
};
