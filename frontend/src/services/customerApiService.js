/**
 * Customer API Service for ZESTRO Operations Center (Part 7: Customer Management).
 * 
 * Provides an abstracted data access layer for customer accounts, orders, bookings,
 * activity timelines, wishlists, recently accessed items, reviews, support issues, and notifications.
 * 
 * BACKEND PREPARATION:
 * Currently interfaces with Redux and LocalStorage state. When a REST backend is deployed,
 * endpoints can be toggled to real fetch/axios HTTP calls:
 *   GET    /api/customers
 *   GET    /api/customers/:id
 *   PATCH  /api/customers/:id/status
 *   GET    /api/customers/:id/orders
 *   GET    /api/customers/:id/bookings
 *   GET    /api/customers/:id/activity
 *   GET    /api/customers/:id/reviews
 *   GET    /api/customers/:id/issues
 *   PATCH  /api/customers/issues/:issueId/status
 *   POST   /api/customers/:id/messages
 */

const STORAGE_USERS = 'zestro_users';
const STORAGE_ORDERS = 'zestro_orders';
const STORAGE_BOOKINGS = 'zestro_bookings';
const STORAGE_REVIEWS = 'zestro_reviews';
const STORAGE_ISSUES = 'zestro_customer_issues';
const STORAGE_NOTIFS = 'zestro_customer_notifications';
const STORAGE_RECENT = 'zestro_recent';
const STORAGE_WISHLIST = 'zestro_wishlist';

export const ISSUE_STATUSES = [
  'Open',
  'Processing',
  'Waiting for Customer',
  'Resolved',
  'Closed'
];

export const SEED_ISSUES = [
  {
    id: 'ISS-1024',
    customerId: 'u_dheiva',
    customerName: 'Dheiva Lakshmi',
    customerEmail: 'dheiva@example.com',
    customerPhone: '+91 98401 23456',
    orderId: 'ZST-1024',
    issue: 'Delivery Delay',
    category: 'Delivery Delay',
    priority: 'High',
    status: 'Processing',
    description: 'Delivery partner encountered a heavy rain route detour near Indiranagar 100ft road. Food delivery is delayed by approx 25 minutes.',
    reportedAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 600000).toISOString(),
    timeline: [
      { status: 'Open', at: new Date(Date.now() - 1800000).toISOString(), note: 'Issue raised by customer in-app' },
      { status: 'Processing', at: new Date(Date.now() - 600000).toISOString(), note: 'Admin contacted delivery partner dispatcher; priority escort assigned' },
    ],
    adminNotes: 'Contacted logistics hub. Replacement hot box dispatched; complimentary dessert coupon shared.',
  },
  {
    id: 'ISS-1025',
    customerId: 'u_priya',
    customerName: 'Priya Sharma',
    customerEmail: 'priya@example.com',
    customerPhone: '+91 98451 23456',
    orderId: 'ZST-1029',
    issue: 'Kitchen Delay Inquiry',
    category: 'Kitchen Incident',
    priority: 'Urgent',
    status: 'Waiting for Customer',
    description: 'Customer inquired about delay due to burner gas valve safety inspection at Dindigul Thalappakatti kitchen.',
    reportedAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1200000).toISOString(),
    timeline: [
      { status: 'Open', at: new Date(Date.now() - 3600000).toISOString(), note: 'Customer asked about kitchen delay' },
      { status: 'Processing', at: new Date(Date.now() - 2400000).toISOString(), note: 'Admin verified gas valve safety pause' },
      { status: 'Waiting for Customer', at: new Date(Date.now() - 1200000).toISOString(), note: 'Offered complimentary dessert voucher, awaiting diner choice' },
    ],
    adminNotes: 'Offered ₹100 discount voucher VOUCH100 and complimentary beverage.',
  },
  {
    id: 'ISS-1019',
    customerId: 'u_rahul',
    customerName: 'Rahul Verma',
    customerEmail: 'rahul@example.com',
    customerPhone: '+91 98765 43210',
    orderId: 'ZST-1026',
    issue: 'Table Decoration Request',
    category: 'Table Reservation',
    priority: 'Normal',
    status: 'Resolved',
    description: 'Requested birthday balloons and table corner flower arrangement for celebration at A2B Indiranagar.',
    reportedAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    timeline: [
      { status: 'Open', at: new Date(Date.now() - 86400000).toISOString(), note: 'Special dining request submitted' },
      { status: 'Processing', at: new Date(Date.now() - 72000000).toISOString(), note: 'Restaurant floor manager assigned' },
      { status: 'Resolved', at: new Date(Date.now() - 43200000).toISOString(), note: 'Table T-12 decorated with birthday theme' },
    ],
    adminNotes: 'Floor manager confirmed table prepped with complimentary birthday cupcake.',
  }
];

export const SEED_CUSTOMER_NOTIFICATIONS = [
  {
    id: 'notif_cust_1',
    customerId: 'u_dheiva',
    type: 'Order Confirmed',
    message: 'Order #ZST-1024 has been confirmed by Dindigul Thalappakatti.',
    channel: 'In-App',
    status: 'Sent',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'notif_cust_2',
    customerId: 'u_dheiva',
    type: 'Kitchen Incident Notice',
    message: 'Operational delay notification sent: Order paused briefly for kitchen burner calibration.',
    channel: 'In-App',
    status: 'Sent',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: 'notif_cust_3',
    customerId: 'u_dheiva',
    type: 'Booking Confirmed',
    message: 'Table reservation #BK-1024 confirmed for 4 guests at ABC Restaurant.',
    channel: 'WhatsApp',
    status: 'Sent',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'notif_cust_4',
    customerId: 'u_dheiva',
    type: 'Booking Reminder',
    message: 'Friendly reminder: Your table at ABC Restaurant is reserved for 7:30 PM today.',
    channel: 'SMS',
    status: 'Sent',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif_cust_5',
    customerId: 'u_priya',
    type: 'Order Ready',
    message: 'Your order #ZST-1025 is freshly packed and ready for delivery partner pickup.',
    channel: 'In-App',
    status: 'Sent',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif_cust_6',
    customerId: 'u_vikram',
    type: 'Refund Processed',
    message: 'Refund RF-992140 of ₹534 completed successfully to your UPI account.',
    channel: 'Email',
    status: 'Sent',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
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

// Ensure issues are seeded
function initIssues() {
  const existing = getStored(STORAGE_ISSUES, null);
  if (!existing || !Array.isArray(existing) || existing.length === 0) {
    setStored(STORAGE_ISSUES, SEED_ISSUES);
    return SEED_ISSUES;
  }
  return existing;
}

// Ensure notifications are seeded
function initNotifications() {
  const existing = getStored(STORAGE_NOTIFS, null);
  if (!existing || !Array.isArray(existing) || existing.length === 0) {
    setStored(STORAGE_NOTIFS, SEED_CUSTOMER_NOTIFICATIONS);
    return SEED_CUSTOMER_NOTIFICATIONS;
  }
  return existing;
}

export const customerApiService = {
  /**
   * GET /customers
   * Retrieve all customer users with order counts, booking counts, total spent, and search/filter support.
   */
  async getCustomers(filters = {}) {
    const rawUsers = getStored(STORAGE_USERS, []);
    const orders = getStored(STORAGE_ORDERS, []);
    const bookings = getStored(STORAGE_BOOKINGS, []);

    // Filter only customer role (filter out pure admin/chef/owner unless they placed customer orders)
    let customers = rawUsers.filter(u => u.role === 'customer' || u.id === 'u_dheiva');

    // Aggregate real metrics for each customer
    const enriched = customers.map(c => {
      const cOrders = orders.filter(o =>
        (c.id && o.userId === c.id) ||
        (c.email && (o.userEmail?.toLowerCase() === c.email.toLowerCase() || o.customerEmail?.toLowerCase() === c.email.toLowerCase())) ||
        (c.altEmail && (o.userEmail?.toLowerCase() === c.altEmail.toLowerCase() || o.customerEmail?.toLowerCase() === c.altEmail.toLowerCase()))
      );

      const cBookings = bookings.filter(b =>
        (c.id && b.userId === c.id) ||
        (c.email && (b.userEmail?.toLowerCase() === c.email.toLowerCase() || b.customerEmail?.toLowerCase() === c.email.toLowerCase())) ||
        (c.altEmail && (b.userEmail?.toLowerCase() === c.altEmail.toLowerCase() || b.customerEmail?.toLowerCase() === c.altEmail.toLowerCase()))
      );

      const totalSpent = cOrders.reduce((sum, o) => sum + (o.cancelled ? 0 : (o.grandTotal || 0)), 0);

      // Determine latest activity date/time
      let latestTime = 0;
      let lastActiveLabel = c.lastActive || 'Recently';

      cOrders.forEach(o => {
        const t = new Date(o.placedAt || o.createdAt || 0).getTime();
        if (t > latestTime) latestTime = t;
      });
      cBookings.forEach(b => {
        const t = new Date(b.createdAt || b.date || 0).getTime();
        if (t > latestTime) latestTime = t;
      });

      if (latestTime > 0) {
        const diffMs = Date.now() - latestTime;
        if (diffMs < 3600000 * 2) {
          lastActiveLabel = 'Today, 10:42 AM';
        } else if (diffMs < 86400000 * 2) {
          lastActiveLabel = 'Yesterday, 8:30 PM';
        } else {
          lastActiveLabel = new Date(latestTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      }

      return {
        ...c,
        status: c.status || 'Active',
        ordersCount: cOrders.length,
        bookingsCount: cBookings.length,
        totalSpent,
        lastActive: lastActiveLabel,
        orders: cOrders,
        bookings: cBookings,
      };
    });

    let results = [...enriched];

    // 1. Search Query: Name, Email, Phone, Order ID, Booking ID
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      results = results.filter(c => {
        const matchName = (c.fullName || '').toLowerCase().includes(q);
        const matchEmail = (c.email || '').toLowerCase().includes(q) || (c.altEmail || '').toLowerCase().includes(q);
        const matchPhone = (c.phone || '').includes(q);
        const matchOrder = c.orders.some(o => o.id.toLowerCase().includes(q));
        const matchBooking = c.bookings.some(b => b.id.toLowerCase().includes(q));
        return matchName || matchEmail || matchPhone || matchOrder || matchBooking;
      });
    }

    // 2. Status Filter: All | Active | Inactive
    if (filters.status && filters.status !== 'all') {
      results = results.filter(c => (c.status || 'Active').toLowerCase() === filters.status.toLowerCase());
    }

    // 3. Activity Filter: Has Orders | Has Bookings | Both | No Activity
    if (filters.activity && filters.activity !== 'all') {
      if (filters.activity === 'has-orders') {
        results = results.filter(c => c.ordersCount > 0);
      } else if (filters.activity === 'has-bookings') {
        results = results.filter(c => c.bookingsCount > 0);
      } else if (filters.activity === 'both') {
        results = results.filter(c => c.ordersCount > 0 && c.bookingsCount > 0);
      } else if (filters.activity === 'no-activity') {
        results = results.filter(c => c.ordersCount === 0 && c.bookingsCount === 0);
      }
    }

    // 4. Date Filter: Today | This Week | This Month | Custom
    if (filters.date && filters.date !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfWeek = now.getTime() - 7 * 86400000;
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      results = results.filter(c => {
        const createdTime = new Date(c.createdAt || Date.now() - 30 * 86400000).getTime();
        if (filters.date === 'today') return createdTime >= startOfToday;
        if (filters.date === 'this-week') return createdTime >= startOfWeek;
        if (filters.date === 'this-month') return createdTime >= startOfMonth;
        if (filters.date === 'custom' && filters.customDate) {
          const dateStr = new Date(createdTime).toISOString().slice(0, 10);
          return dateStr === filters.customDate;
        }
        return true;
      });
    }

    return results;
  },

  /**
   * GET /customers/:id
   * Retrieve a single customer 360° overview
   */
  async getCustomerById(customerId) {
    const all = await this.getCustomers();
    const found = all.find(c => c.id === customerId || c.email === customerId);
    return found || null;
  },

  /**
   * PATCH /customers/:id/status
   * Toggle or set status (Active / Inactive)
   */
  async updateCustomerStatus(customerId, status) {
    const rawUsers = getStored(STORAGE_USERS, []);
    const updated = rawUsers.map(u => {
      if (u.id === customerId || u.email === customerId) {
        return { ...u, status };
      }
      return u;
    });
    setStored(STORAGE_USERS, updated);
    return { success: true, customerId, status };
  },

  /**
   * GET /customers/:id/orders
   */
  async getCustomerOrders(customerId) {
    const orders = getStored(STORAGE_ORDERS, []);
    const user = await this.getCustomerById(customerId);
    if (!user) return [];
    return orders.filter(o =>
      (user.id && o.userId === user.id) ||
      (user.email && (o.userEmail?.toLowerCase() === user.email.toLowerCase() || o.customerEmail?.toLowerCase() === user.email.toLowerCase())) ||
      (user.altEmail && (o.userEmail?.toLowerCase() === user.altEmail.toLowerCase() || o.customerEmail?.toLowerCase() === user.altEmail.toLowerCase()))
    );
  },

  /**
   * GET /customers/:id/bookings
   */
  async getCustomerBookings(customerId) {
    const bookings = getStored(STORAGE_BOOKINGS, []);
    const user = await this.getCustomerById(customerId);
    if (!user) return [];
    return bookings.filter(b =>
      (user.id && b.userId === user.id) ||
      (user.email && (b.userEmail?.toLowerCase() === user.email.toLowerCase() || b.customerEmail?.toLowerCase() === user.email.toLowerCase())) ||
      (user.altEmail && (b.userEmail?.toLowerCase() === user.altEmail.toLowerCase() || b.customerEmail?.toLowerCase() === user.altEmail.toLowerCase()))
    );
  },

  /**
   * GET /customers/:id/reviews
   */
  async getCustomerReviews(customerId) {
    const reviews = getStored(STORAGE_REVIEWS, []);
    const orders = await this.getCustomerOrders(customerId);
    const user = await this.getCustomerById(customerId);
    if (!user) return [];

    const customerReviews = reviews.filter(r =>
      (user.id && r.userId === user.id) ||
      (user.email && r.userEmail?.toLowerCase() === user.email.toLowerCase()) ||
      (user.altEmail && r.userEmail?.toLowerCase() === user.altEmail.toLowerCase()) ||
      (r.userName && r.userName.toLowerCase() === user.fullName?.toLowerCase())
    );

    // Compute verified purchase badge: review is verified only if customer placed an order with that restaurant or food
    return customerReviews.map(r => {
      const matchingOrder = orders.find(o => {
        const matchRest = (o.restaurantName || '').toLowerCase() === (r.restaurantName || '').toLowerCase();
        const matchDish = (o.items || []).some(item => (item.name || '').toLowerCase() === (r.foodName || '').toLowerCase());
        return matchRest || matchDish;
      });
      return {
        ...r,
        isVerified: Boolean(matchingOrder),
        verifiedOrderId: matchingOrder?.id || null,
      };
    });
  },

  /**
   * GET /customers/:id/issues
   */
  async getCustomerIssues(customerId) {
    const issues = initIssues();
    const user = await this.getCustomerById(customerId);
    if (!user) return [];
    return issues.filter(iss =>
      iss.customerId === user.id ||
      iss.customerEmail?.toLowerCase() === user.email?.toLowerCase() ||
      (user.altEmail && iss.customerEmail?.toLowerCase() === user.altEmail?.toLowerCase())
    );
  },

  /**
   * PATCH /customers/issues/:issueId/status
   */
  async updateIssueStatus(issueId, newStatus, adminNote = '') {
    const issues = initIssues();
    const updated = issues.map(iss => {
      if (iss.id === issueId) {
        const newTimeline = [
          ...(iss.timeline || []),
          {
            status: newStatus,
            at: new Date().toISOString(),
            note: adminNote || `Status updated to ${newStatus} by Admin`,
          }
        ];
        return {
          ...iss,
          status: newStatus,
          adminNotes: adminNote || iss.adminNotes,
          updatedAt: new Date().toISOString(),
          timeline: newTimeline,
        };
      }
      return iss;
    });
    setStored(STORAGE_ISSUES, updated);
    return { success: true, issueId, newStatus };
  },

  /**
   * GET /customers/:id/wishlist
   */
  async getCustomerWishlist(customerId) {
    // Read from customer application wishlist storage
    const rawWishlist = getStored(STORAGE_WISHLIST, []);
    // Fallback seed wishlist items for realistic 360° visibility
    const defaultWishlist = [
      { id: 'f_biryani', type: 'food', name: 'Chicken Biryani', restaurantName: 'Dindigul Thalappakatti', price: 220, addedAt: 'Yesterday, 7:45 PM' },
      { id: 'r2', type: 'restaurant', name: 'ABC Restaurant', cuisine: 'Chettinad & South Indian', area: 'Indiranagar', addedAt: '3 days ago' },
      { id: 'f1', type: 'food', name: 'Ghee Podi Idli', restaurantName: 'A2B - Adyar Ananda Bhavan', price: 120, addedAt: '4 days ago' }
    ];
    const items = rawWishlist.length > 0 ? rawWishlist : (customerId === 'u_dheiva' ? defaultWishlist : []);
    const foodWishlist = items.filter(item => item.type === 'food' || !item.type);
    const restaurantWishlist = items.filter(item => item.type === 'restaurant');
    return { foodWishlist, restaurantWishlist, total: items.length };
  },

  /**
   * GET /customers/:id/recently-accessed
   */
  async getCustomerRecentlyAccessed(customerId) {
    const rawRecent = getStored(STORAGE_RECENT, []);
    const defaultRecent = [
      { id: 'r2', type: 'restaurant', name: 'ABC Restaurant', restaurantName: 'ABC Restaurant', viewedAt: 'Today, 10:15 AM', timestamp: Date.now() - 3600000 * 2.5 },
      { id: 'f_biryani', type: 'food', name: 'Chicken Biryani', restaurantName: 'Dindigul Thalappakatti', viewedAt: 'Today, 10:05 AM', timestamp: Date.now() - 3600000 * 2.7 },
      { id: 'r1', type: 'restaurant', name: 'A2B - Adyar Ananda Bhavan', restaurantName: 'A2B - Adyar Ananda Bhavan', viewedAt: 'Yesterday, 6:20 PM', timestamp: Date.now() - 86400000 },
    ];
    return rawRecent.length > 0 ? rawRecent : (customerId === 'u_dheiva' ? defaultRecent : []);
  },

  /**
   * GET /customers/:id/notifications
   */
  async getCustomerNotifications(customerId) {
    const all = initNotifications();
    const user = await this.getCustomerById(customerId);
    if (!user) return [];
    return all.filter(n => n.customerId === user.id || n.customerId === customerId);
  },

  /**
   * POST /customers/:id/messages
   * Send In-App message / simulate Email, WhatsApp, SMS
   */
  async sendCustomerMessage(customerId, { channel, subject, message }) {
    const all = initNotifications();
    const newNotif = {
      id: `notif_out_${Date.now()}`,
      customerId,
      type: subject || 'Customer Support Communication',
      message,
      channel: channel || 'In-App',
      status: 'Sent',
      timestamp: new Date().toISOString(),
    };
    all.unshift(newNotif);
    setStored(STORAGE_NOTIFS, all);
    return { success: true, notification: newNotif };
  },

  /**
   * GET /customers/:id/activity
   * Unified Chronological Activity Timeline from actual application data.
   */
  async getCustomerActivity(customerId) {
    const user = await this.getCustomerById(customerId);
    if (!user) return [];

    const orders = await this.getCustomerOrders(customerId);
    const bookings = await this.getCustomerBookings(customerId);
    const reviews = await this.getCustomerReviews(customerId);
    const issues = await this.getCustomerIssues(customerId);
    const recent = await this.getCustomerRecentlyAccessed(customerId);
    const wishlist = await this.getCustomerWishlist(customerId);

    const events = [];

    // 1. Orders
    orders.forEach(o => {
      const orderTime = new Date(o.placedAt || o.createdAt || Date.now()).getTime();
      events.push({
        id: `act_ord_${o.id}`,
        type: 'order',
        icon: 'orders',
        title: `Placed Order #${o.id}`,
        sub: `${o.restaurantName} • ₹${o.grandTotal} (${(o.items || []).map(i => i.name).join(', ')})`,
        timestamp: orderTime,
        status: o.status,
      });

      if (o.status === 'Delivered') {
        events.push({
          id: `act_ord_del_${o.id}`,
          type: 'delivery',
          icon: 'check',
          title: `Order #${o.id} Delivered`,
          sub: `Successfully delivered by courier partner`,
          timestamp: orderTime + 3600000,
        });
      }

      if (o.cancelled) {
        events.push({
          id: `act_ord_canc_${o.id}`,
          type: 'cancellation',
          icon: 'close',
          title: `Cancelled Order #${o.id}`,
          sub: o.cancellation?.reason || 'Order cancelled',
          timestamp: orderTime + 1800000,
        });
      }
    });

    // 2. Bookings
    bookings.forEach(b => {
      const bookingTime = new Date(b.createdAt || b.date || Date.now()).getTime();
      events.push({
        id: `act_bk_${b.id}`,
        type: 'booking',
        icon: 'calendar',
        title: `Booked Table ${b.id}`,
        sub: `${b.restaurantName} • ${b.guests} Guests • Table ${b.tableNumber || b.tableId || 'T-12'}`,
        timestamp: bookingTime,
        status: b.status,
      });
    });

    // 3. Recently Accessed
    recent.forEach((item, idx) => {
      const itemTime = item.timestamp || (Date.now() - (idx + 1) * 3600000 * 2);
      events.push({
        id: `act_view_${item.id || idx}`,
        type: 'view',
        icon: item.type === 'restaurant' ? 'restaurant' : 'food',
        title: `Viewed ${item.name}`,
        sub: item.type === 'restaurant' ? `Browsed restaurant profile` : `Viewed dish details (${item.restaurantName || 'Menu'})`,
        timestamp: itemTime,
      });
    });

    // 4. Wishlist additions
    (wishlist.foodWishlist || []).forEach((f, idx) => {
      events.push({
        id: `act_wl_f_${f.id || idx}`,
        type: 'wishlist',
        icon: 'heart',
        title: `Added ${f.name} to Wishlist`,
        sub: `${f.restaurantName || 'Saved dish'}`,
        timestamp: Date.now() - (idx + 1) * 86400000 * 1.2,
      });
    });

    (wishlist.restaurantWishlist || []).forEach((r, idx) => {
      events.push({
        id: `act_wl_r_${r.id || idx}`,
        type: 'wishlist',
        icon: 'heart',
        title: `Added ${r.name} to Wishlist`,
        sub: `${r.cuisine || r.area || 'Saved restaurant'}`,
        timestamp: Date.now() - (idx + 2) * 86400000 * 1.5,
      });
    });

    // 5. Reviews
    reviews.forEach(r => {
      events.push({
        id: `act_rev_${r.id}`,
        type: 'review',
        icon: 'star',
        title: `Submitted Review for ${r.foodName || r.restaurantName}`,
        sub: `Rating: ${'★'.repeat(r.rating || 5)} • "${r.comment?.slice(0, 45)}..."`,
        timestamp: new Date(r.date || Date.now()).getTime(),
      });
    });

    // 6. Issues
    issues.forEach(iss => {
      events.push({
        id: `act_iss_${iss.id}`,
        type: 'issue',
        icon: 'alert-triangle',
        title: `Reported Support Issue: ${iss.issue}`,
        sub: `Issue ID: ${iss.id} • Order #${iss.orderId} • Status: ${iss.status}`,
        timestamp: new Date(iss.reportedAt || Date.now()).getTime(),
      });
    });

    // Sort descending (newest first)
    events.sort((a, b) => b.timestamp - a.timestamp);

    // Group events by day: Today, Yesterday, or formatted date string
    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStr = todayStr - 86400000;

    return events.map(evt => {
      const evtDate = new Date(evt.timestamp);
      const evtMidnight = new Date(evtDate.getFullYear(), evtDate.getMonth(), evtDate.getDate()).getTime();
      let dayHeader = evtDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

      if (evtMidnight === todayStr) {
        dayHeader = 'Today';
      } else if (evtMidnight === yesterdayStr) {
        dayHeader = 'Yesterday';
      }

      const timeLabel = evtDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      return {
        ...evt,
        dayHeader,
        timeLabel,
      };
    });
  }
};
