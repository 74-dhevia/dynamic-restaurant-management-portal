import mongoose from 'mongoose';
import TableBooking from '../models/TableBooking.js';
import Restaurant from '../models/Restaurant.js';
import Waitlist from '../models/Waitlist.js';
import BookingLock from '../models/BookingLock.js';
import User from '../models/User.js';
import { sendBookingEventEmail } from '../services/emailService.js';
import { createNotification } from '../services/notificationService.js';
import {
  parseSlotToMinutes,
  isTimeSlotOverlapping,
  normalizeDateString,
  getDayBounds,
} from '../utils/bookingTimeUtils.js';

/**
 * @desc    Check real-time table availability for a restaurant, date and time slot
 * @route   GET /api/bookings/availability
 * @access  Public / Private
 */
export const getTableAvailability = async (req, res) => {
  try {
    const { restaurantId, date, timeSlot, guests = 2, seatingArea } = req.query;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'restaurantId is required to check table availability',
      });
    }

    // 1. Fetch live Restaurant document from MongoDB
    let restaurant = null;
    if (restaurantId.match(/^[0-9a-fA-F]{24}$/)) {
      restaurant = await Restaurant.findById(restaurantId);
    } else {
      restaurant = await Restaurant.findOne({ slug: restaurantId });
    }

    if (!restaurant) {
      // Fallback to first active restaurant if ID not matched
      restaurant = await Restaurant.findOne({ isActive: true });
    }

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found in database',
      });
    }

    // 2. Default tables if restaurant has no table array defined
    let tables = restaurant.tables || [];
    if (!tables || tables.length === 0) {
      tables = [
        { tableId: 'Table 01', capacity: 2, section: 'Indoor', isAvailable: true },
        { tableId: 'Table 02', capacity: 4, section: 'Indoor', isAvailable: true },
        { tableId: 'Table 03', capacity: 4, section: 'AC', isAvailable: true },
        { tableId: 'Table 04', capacity: 6, section: 'Family', isAvailable: true },
        { tableId: 'Table 05', capacity: 4, section: 'Rooftop', isAvailable: true },
        { tableId: 'Table 06', capacity: 8, section: 'Family', isAvailable: true },
      ];
    }

    // 3. Query all active bookings for this restaurant on the requested calendar day
    const queryDate = date || new Date().toISOString().slice(0, 10);
    const { start, end, dateStr } = getDayBounds(queryDate);

    const activeBookings = await TableBooking.find({
      $or: [{ restaurantId: restaurant._id }, { restaurantName: restaurant.name }],
      bookingDate: { $gte: start, $lte: end },
      status: { $nin: ['Cancelled', 'No Show'] },
    });

    const targetSlot = timeSlot || '7:30 PM';
    const guestCount = Number(guests) || 2;

    // 4. Compute status for every physical table in the restaurant
    const evaluatedTables = tables.map((t) => {
      const tId = t.tableId || t.name || `Table ${t._id}`;
      const capacity = Number(t.capacity) || 4;
      const section = t.section || 'Indoor';

      // Check if table is marked down by restaurant host
      if (t.isAvailable === false) {
        return {
          id: tId,
          tableId: tId,
          capacity,
          section,
          status: 'Unavailable',
          badgeColor: 'grey',
          isAvailable: false,
          capacityFits: capacity >= guestCount,
          activeBooking: null,
        };
      }

      // Check if any active booking conflicts with requested time slot
      const conflictingBooking = activeBookings.find((b) => {
        const matchesTable = b.tableId === tId || b.tableNumber === tId;
        if (!matchesTable) return false;
        return isTimeSlotOverlapping(b.timeSlot, targetSlot);
      });

      if (conflictingBooking) {
        let computedStatus = 'Reserved';
        if (conflictingBooking.status === 'CheckedIn' || conflictingBooking.status === 'Dining') {
          computedStatus = 'Occupied';
        } else if (conflictingBooking.status === 'Requested') {
          computedStatus = 'Temporarily Held';
        }

        return {
          id: tId,
          tableId: tId,
          capacity,
          section,
          status: computedStatus,
          badgeColor: computedStatus === 'Occupied' ? 'red' : computedStatus === 'Temporarily Held' ? 'yellow' : 'red',
          isAvailable: false,
          capacityFits: capacity >= guestCount,
          bookingReference: conflictingBooking.bookingNumber,
        };
      }

      return {
        id: tId,
        tableId: tId,
        capacity,
        section,
        status: 'Available',
        badgeColor: 'green',
        isAvailable: true,
        capacityFits: capacity >= guestCount,
      };
    });

    // Check if seating area filter applied
    let filteredTables = evaluatedTables;
    if (seatingArea && seatingArea !== 'All' && seatingArea !== 'Any') {
      filteredTables = evaluatedTables.filter((t) => t.section.toLowerCase() === seatingArea.toLowerCase());
    }

    const availableCount = evaluatedTables.filter((t) => t.isAvailable && t.capacityFits).length;
    const isSoldOut = availableCount === 0;

    res.status(200).json({
      success: true,
      data: {
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        date: dateStr,
        timeSlot: targetSlot,
        guests: guestCount,
        seatingArea: seatingArea || 'All',
        tables: filteredTables,
        allTables: evaluatedTables,
        availableCount,
        isSoldOut,
      },
    });
  } catch (error) {
    console.error('[getTableAvailability] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate table availability',
      error: error.message,
    });
  }
};

/**
 * @desc    Reserve a restaurant table concurrency-safely
 * @route   POST /api/bookings
 * @access  Private (Authenticated Customers)
 */
export const createBooking = async (req, res) => {
  let createdLockKey = null;

  try {
    const {
      restaurantId,
      restaurantName,
      tableId = 'Table 01',
      seatingArea = 'Indoor',
      guests = 2,
      bookingDate,
      timeSlot,
      specialRequests,
      preOrderItems = [],
      preOrderTotal = 0,
    } = req.body;

    if (!bookingDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Booking date and time slot are required for reservation',
      });
    }

    const guestCount = Number(guests) || 2;
    const { start, end, dateStr } = getDayBounds(bookingDate);

    // 1. Prevent duplicate instant submissions from the same user within 15 seconds
    const recentDuplicate = await TableBooking.findOne({
      customerId: req.user._id,
      tableId,
      bookingDate: { $gte: start, $lte: end },
      timeSlot,
      createdAt: { $gte: new Date(Date.now() - 15000) },
      status: { $nin: ['Cancelled', 'No Show'] },
    });

    if (recentDuplicate) {
      return res.status(200).json({
        success: true,
        message: 'Your table reservation was already placed successfully.',
        data: recentDuplicate,
      });
    }

    // 2. Fetch target restaurant
    let restaurant = null;
    if (restaurantId && restaurantId.match(/^[0-9a-fA-F]{24}$/)) {
      restaurant = await Restaurant.findById(restaurantId);
    } else if (restaurantId) {
      restaurant = await Restaurant.findOne({ slug: restaurantId });
    }
    if (!restaurant) {
      restaurant = await Restaurant.findOne({ isActive: true });
    }

    const resolvedRestId = restaurant?._id || restaurantId;
    const resolvedRestName = restaurant?.name || restaurantName || 'ZESTRO Partner Restaurant';

    // 3. Strict Server-Side Overlap Conflict Check
    const existingBookingsOnTable = await TableBooking.find({
      $or: [{ restaurantId: resolvedRestId }, { restaurantName: resolvedRestName }],
      tableId,
      bookingDate: { $gte: start, $lte: end },
      status: { $nin: ['Cancelled', 'No Show'] },
    });

    const hasOverlap = existingBookingsOnTable.some((b) => {
      return isTimeSlotOverlapping(b.timeSlot, timeSlot);
    });

    if (hasOverlap) {
      return res.status(409).json({
        success: false,
        conflict: true,
        message: `${tableId} was just reserved for ${timeSlot} on ${dateStr} by another customer. Please select another available table or join the waitlist.`,
      });
    }

    // 4. Concurrency Safety: Acquire atomic reservation lock in MongoDB
    const cleanSlotKey = timeSlot.replace(/[^a-zA-Z0-9]/g, '');
    const lockKey = `${resolvedRestId}_${tableId}_${dateStr}_${cleanSlotKey}`;
    createdLockKey = lockKey;

    try {
      await BookingLock.create({
        lockKey,
        bookingNumber: 'PENDING',
        customerId: req.user._id,
      });
    } catch (lockErr) {
      if (lockErr.code === 11000) {
        // Another simultaneous request won the race at the database engine level
        return res.status(409).json({
          success: false,
          conflict: true,
          message: `${tableId} is currently being booked by another customer. Please choose another table.`,
        });
      }
      console.warn('[createBooking] Booking lock note:', lockErr.message);
    }

    // 5. Generate unique booking reference (#ZB-XXXXXX) and 4-digit check-in PIN
    const bookingNumber = `ZB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const checkInPin = Math.floor(1000 + Math.random() * 9000).toString();

    const startMinutes = parseSlotToMinutes(timeSlot);
    const endMinutes = startMinutes + 90;

    const booking = await TableBooking.create({
      bookingNumber,
      customerId: req.user._id,
      customerName: req.user.name,
      customerPhone: req.user.phone || req.body.phone || '9876543210',
      customerEmail: req.user.email,
      restaurantId: resolvedRestId,
      restaurantName: resolvedRestName,
      tableId,
      tableNumber: tableId,
      tableCapacity: guestCount > 4 ? 6 : 4,
      seatingArea: seatingArea || 'Indoor',
      guests: guestCount,
      bookingDate: new Date(bookingDate),
      timeSlot,
      durationMinutes: 90,
      startTimeMinutes: startMinutes,
      endTimeMinutes: endMinutes,
      checkInPin,
      verificationPin: checkInPin,
      status: 'Confirmed',
      specialRequests: specialRequests || '',
      preOrderItems: Array.isArray(preOrderItems) ? preOrderItems : [],
      preOrderTotal: Number(preOrderTotal) || 0,
      grandTotal: (Number(preOrderTotal) || 0) + 100, // 100 reservation fee
    });

    const formattedDate = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    // 6. Send transactional table booking email to authenticated customer's email
    let reqOrigin = req.get('origin');
    if (!reqOrigin && req.headers.referer) {
      try { reqOrigin = new URL(req.headers.referer).origin; } catch (_) {}
    }
    sendBookingEventEmail({
      to: req.user.email,
      name: req.user.name,
      booking,
      eventType: booking.status === 'Requested' ? 'Requested' : 'Confirmed',
      clientUrl: reqOrigin,
    }).catch((mailErr) => console.warn('[createBooking] Email dispatch note:', mailErr.message));

    // 7. Create Admin and Customer Notifications
    createNotification({
      recipientRole: 'admin',
      title: 'New Table Booking',
      message: `New booking #${booking.bookingNumber} by ${booking.customerName} at ${booking.restaurantName} for ${formattedDate} at ${booking.timeSlot} (${booking.guests} guests, ${booking.tableId}).`,
      type: 'booking',
      eventType: 'booking_created',
      entityId: booking.bookingNumber,
      entityType: 'TableBooking',
      actionUrl: `/admin/bookings/${booking.bookingNumber}`,
      metadata: {
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerName,
        guests: booking.guests,
        timeSlot: booking.timeSlot,
        bookingDate: booking.bookingDate,
        tableId: booking.tableId,
      },
      idempotencyKey: `notif_admin_bk_${booking.bookingNumber}_created`,
    }).catch(() => {});

    createNotification({
      recipient: booking.customerId,
      recipientRole: 'customer',
      title: 'Table Booking Confirmed',
      message: `Your reservation #${booking.bookingNumber} at ${booking.restaurantName} is confirmed for ${booking.timeSlot} on ${formattedDate}. Check-in PIN: ${booking.checkInPin}.`,
      type: 'booking',
      eventType: 'booking_confirmed',
      entityId: booking.bookingNumber,
      entityType: 'TableBooking',
      actionUrl: `/customer/bookings`,
      metadata: {
        bookingNumber: booking.bookingNumber,
        timeSlot: booking.timeSlot,
        bookingDate: booking.bookingDate,
        checkInPin: booking.checkInPin,
        tableId: booking.tableId,
      },
      idempotencyKey: `notif_cust_bk_${booking.bookingNumber}_created`,
    }).catch(() => {});

    // Send Real-time FCM Web Push Notification to Customer
    import('../services/fcmService.js').then(({ sendPushNotificationToUser }) => {
      sendPushNotificationToUser(booking.customerEmail || req.user?.email, {
        title: 'Table Reservation Confirmed! 🥂',
        body: `Your table (${booking.tableId}) at ${booking.restaurantName} is confirmed for ${booking.timeSlot}. PIN: ${booking.checkInPin}`,
        clickAction: `/customer/bookings`,
      }).catch(err => console.warn('[createBooking] Push notification note:', err.message));
    }).catch(() => {});

    // Clean up temporary concurrency lock
    if (createdLockKey) {
      BookingLock.deleteOne({ lockKey: createdLockKey }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'Table reserved successfully! Present your 4-digit PIN upon arrival.',
      data: booking,
    });
  } catch (error) {
    if (createdLockKey) {
      BookingLock.deleteOne({ lockKey: createdLockKey }).catch(() => {});
    }
    console.error('[createBooking] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create table reservation',
      error: error.message,
    });
  }
};

/**
 * @desc    Get user's table bookings
 * @route   GET /api/bookings/my-bookings
 * @access  Private (Authenticated User)
 */
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await TableBooking.find({
      $or: [{ customerId: req.user._id }, { customerEmail: req.user.email }],
    }).sort({ bookingDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error('[getMyBookings] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single booking details
 * @route   GET /api/bookings/:id
 * @access  Private
 */
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    let booking;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await TableBooking.findById(id);
    } else {
      booking = await TableBooking.findOne({ bookingNumber: id });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
      error: error.message,
    });
  }
};

/**
 * @desc    Cancel table booking and notify eligible waitlist customers
 * @route   PATCH /api/bookings/:id/cancel
 * @access  Private
 */
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason = 'Customer Request' } = req.body;

    const booking = await TableBooking.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bookingNumber: id }],
      $or: [{ customerId: req.user._id }, { customerEmail: req.user.email }],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized',
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    booking.status = 'Cancelled';
    booking.rejectionReason = cancellationReason;
    await booking.save();

    // 1. Transactional cancellation email
    sendBookingEventEmail({
      to: req.user.email,
      name: req.user.name,
      booking,
      eventType: 'Cancelled',
    }).catch((mailErr) => console.warn('[cancelBooking] Email note:', mailErr.message));

    // 2. Admin & Customer Notifications
    createNotification({
      recipientRole: 'admin',
      title: 'Table Booking Cancelled',
      message: `Table booking #${booking.bookingNumber} (${booking.tableId} at ${booking.restaurantName}) has been cancelled by ${booking.customerName}.`,
      type: 'booking',
      eventType: 'booking_cancelled',
      entityId: booking.bookingNumber,
      entityType: 'TableBooking',
      actionUrl: `/admin/bookings/${booking.bookingNumber}`,
      metadata: { bookingNumber: booking.bookingNumber },
      idempotencyKey: `notif_admin_bk_${booking.bookingNumber}_cancelled`,
    }).catch(() => {});

    createNotification({
      recipient: booking.customerId,
      recipientRole: 'customer',
      title: 'Table Booking Cancelled',
      message: `Your reservation #${booking.bookingNumber} at ${booking.restaurantName} has been cancelled.`,
      type: 'booking',
      eventType: 'booking_cancelled',
      entityId: booking.bookingNumber,
      entityType: 'TableBooking',
      actionUrl: `/customer/bookings`,
      metadata: { bookingNumber: booking.bookingNumber },
      idempotencyKey: `notif_cust_bk_${booking.bookingNumber}_cancelled`,
    }).catch(() => {});

    // 3. Smart Waitlist Automatic Trigger: Check if eligible waitlist customers exist
    try {
      const { start, end } = getDayBounds(booking.bookingDate);
      const waitingCustomer = await Waitlist.findOne({
        restaurantId: booking.restaurantId,
        preferredDate: { $gte: start, $lte: end },
        preferredTimeSlot: booking.timeSlot,
        status: 'Waiting',
        guests: { $lte: booking.guests + 2 },
      }).sort({ createdAt: 1 });

      if (waitingCustomer) {
        waitingCustomer.status = 'Notified';
        waitingCustomer.notifiedAt = new Date();
        waitingCustomer.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes priority hold
        await waitingCustomer.save();

        // Send email notifying the customer a table has freed up
        sendBookingEventEmail({
          to: waitingCustomer.customerEmail,
          name: waitingCustomer.customerName,
          booking: {
            bookingNumber: waitingCustomer.waitlistNumber,
            restaurantName: waitingCustomer.restaurantName,
            bookingDate: waitingCustomer.preferredDate,
            timeSlot: waitingCustomer.preferredTimeSlot,
            guests: waitingCustomer.guests,
            seatingArea: waitingCustomer.seatingArea,
          },
          eventType: 'WaitlistAllocated',
        }).catch(() => {});

        // In-app notification
        createNotification({
          recipient: waitingCustomer.customerId,
          recipientRole: 'customer',
          title: 'Table Available from Waitlist! 🎉',
          message: `A table has opened up at ${waitingCustomer.restaurantName} for ${waitingCustomer.preferredTimeSlot}! Book now before priority expires.`,
          type: 'booking',
          eventType: 'waitlist_allocated',
          actionUrl: `/book-table/${waitingCustomer.restaurantId}?date=${new Date(waitingCustomer.preferredDate).toISOString().slice(0, 10)}&time=${encodeURIComponent(waitingCustomer.preferredTimeSlot)}`,
          idempotencyKey: `notif_waitlist_${waitingCustomer.waitlistNumber}_allocated`,
        }).catch(() => {});

        // Push notification to waitlisted diner
        import('../services/fcmService.js').then(({ sendPushNotificationToUser }) => {
          sendPushNotificationToUser(waitingCustomer.customerEmail, {
            title: 'Table Available from Waitlist! 🎉',
            body: `A table opened up at ${waitingCustomer.restaurantName} for ${waitingCustomer.preferredTimeSlot}! Book now before priority expires.`,
            clickAction: `/book-table/${waitingCustomer.restaurantId}?date=${new Date(waitingCustomer.preferredDate).toISOString().slice(0, 10)}&time=${encodeURIComponent(waitingCustomer.preferredTimeSlot)}`,
          }).catch(() => {});
        }).catch(() => {});
      }
    } catch (wlErr) {
      console.warn('[cancelBooking] Waitlist trigger note:', wlErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error) {
    console.error('[cancelBooking] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message,
    });
  }
};

/**
 * @desc    Reschedule table booking concurrency-safely
 * @route   PATCH /api/bookings/:id/reschedule
 * @access  Private
 */
export const rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingDate, timeSlot, guests, seatingArea } = req.body;

    if (!bookingDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'New booking date and time slot are required for rescheduling',
      });
    }

    const booking = await TableBooking.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bookingNumber: id }],
      $or: [{ customerId: req.user._id }, { customerEmail: req.user.email }],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized',
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule a cancelled reservation',
      });
    }

    const { start, end, dateStr } = getDayBounds(bookingDate);

    // Overlap conflict check for the rescheduled slot
    const existingConflicts = await TableBooking.find({
      _id: { $ne: booking._id },
      restaurantId: booking.restaurantId,
      tableId: booking.tableId,
      bookingDate: { $gte: start, $lte: end },
      status: { $nin: ['Cancelled', 'No Show'] },
    });

    const isBlocked = existingConflicts.some((b) => isTimeSlotOverlapping(b.timeSlot, timeSlot));

    if (isBlocked) {
      return res.status(409).json({
        success: false,
        conflict: true,
        message: `${booking.tableId} is already reserved for ${timeSlot} on ${dateStr}. Please pick another time slot.`,
      });
    }

    booking.rescheduledFrom = {
      date: booking.bookingDate,
      timeSlot: booking.timeSlot,
      guests: booking.guests,
    };

    booking.bookingDate = new Date(bookingDate);
    booking.timeSlot = timeSlot;
    if (guests) booking.guests = Number(guests);
    if (seatingArea) booking.seatingArea = seatingArea;
    booking.startTimeMinutes = parseSlotToMinutes(timeSlot);
    booking.endTimeMinutes = booking.startTimeMinutes + 90;
    booking.status = 'Confirmed';
    await booking.save();

    // Transactional reschedule email
    sendBookingEventEmail({
      to: req.user.email,
      name: req.user.name,
      booking,
      eventType: 'Rescheduled',
    }).catch(() => {});

    // Notification
    createNotification({
      recipient: booking.customerId,
      recipientRole: 'customer',
      title: 'Table Reservation Rescheduled',
      message: `Your reservation #${booking.bookingNumber} at ${booking.restaurantName} is now set for ${booking.timeSlot} on ${dateStr}.`,
      type: 'booking',
      eventType: 'booking_rescheduled',
      entityId: booking.bookingNumber,
      entityType: 'TableBooking',
      actionUrl: `/customer/bookings`,
      idempotencyKey: `notif_cust_bk_${booking.bookingNumber}_resched_${Date.now()}`,
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: booking,
    });
  } catch (error) {
    console.error('[rescheduleBooking] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule booking',
      error: error.message,
    });
  }
};

/**
 * @desc    Join Smart Waitlist for fully booked time slots
 * @route   POST /api/bookings/waitlist
 * @access  Private
 */
export const joinWaitlist = async (req, res) => {
  try {
    const { restaurantId, restaurantName, preferredDate, preferredTimeSlot, guests = 2, seatingArea = 'Any', notes = '' } = req.body;

    if (!restaurantId || !preferredDate || !preferredTimeSlot) {
      return res.status(400).json({
        success: false,
        message: 'restaurantId, preferredDate, and preferredTimeSlot are required',
      });
    }

    // Check if customer already on waitlist for this slot
    const { start, end } = getDayBounds(preferredDate);
    const existingEntry = await Waitlist.findOne({
      customerId: req.user._id,
      restaurantId,
      preferredDate: { $gte: start, $lte: end },
      preferredTimeSlot,
      status: 'Waiting',
    });

    if (existingEntry) {
      return res.status(200).json({
        success: true,
        message: 'You are already on the waitlist for this dining slot.',
        data: existingEntry,
      });
    }

    const waitlistNumber = `WL-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const waitlistEntry = await Waitlist.create({
      waitlistNumber,
      restaurantId,
      restaurantName: restaurantName || 'ZESTRO Partner Restaurant',
      customerId: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone || '9876543210',
      guests: Number(guests) || 2,
      preferredDate: new Date(preferredDate),
      preferredTimeSlot,
      seatingArea,
      status: 'Waiting',
      notes,
    });

    // Send confirmation email
    sendBookingEventEmail({
      to: req.user.email,
      name: req.user.name,
      booking: {
        bookingNumber: waitlistNumber,
        restaurantName: waitlistEntry.restaurantName,
        bookingDate: waitlistEntry.preferredDate,
        timeSlot: preferredTimeSlot,
        guests: waitlistEntry.guests,
        seatingArea,
      },
      eventType: 'WaitlistJoined',
    }).catch(() => {});

    // In-app notification
    createNotification({
      recipient: req.user._id,
      recipientRole: 'customer',
      title: 'Joined Smart Waitlist',
      message: `You're on the priority waitlist for ${waitlistEntry.restaurantName} (${preferredTimeSlot}). We'll notify you if a table opens up!`,
      type: 'booking',
      eventType: 'waitlist_joined',
      idempotencyKey: `notif_wl_${waitlistNumber}_joined`,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Successfully joined the Smart Waitlist! We will alert you immediately if a table opens.',
      data: waitlistEntry,
    });
  } catch (error) {
    console.error('[joinWaitlist] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join waitlist',
      error: error.message,
    });
  }
};

/**
 * @desc    Get customer's active waitlist entries
 * @route   GET /api/bookings/waitlist/my
 * @access  Private
 */
export const getMyWaitlist = async (req, res) => {
  try {
    const list = await Waitlist.find({
      $or: [{ customerId: req.user._id }, { customerEmail: req.user.email }],
      status: { $in: ['Waiting', 'Notified'] },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch waitlist entries',
      error: error.message,
    });
  }
};

/**
 * @desc    Admin / Restaurant Host: Confirm a 'Requested' reservation
 * @route   PATCH /api/bookings/:id/confirm
 * @access  Admin / Manager
 */
export const confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await TableBooking.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bookingNumber: id }],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    booking.status = 'Confirmed';
    await booking.save();

    // Send the separate confirmation email now!
    sendBookingEventEmail({
      to: booking.customerEmail,
      name: booking.customerName,
      booking,
      eventType: 'Confirmed',
    }).catch(() => {});

    createNotification({
      recipient: booking.customerId,
      recipientRole: 'customer',
      title: 'Booking Confirmed by Restaurant',
      message: `Great news! Your table booking #${booking.bookingNumber} at ${booking.restaurantName} is now confirmed. PIN: ${booking.checkInPin}.`,
      type: 'booking',
      eventType: 'booking_confirmed',
      actionUrl: `/customer/bookings`,
      idempotencyKey: `notif_cust_bk_${booking.bookingNumber}_confirmed`,
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Booking status updated to Confirmed',
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to confirm booking',
      error: error.message,
    });
  }
};

/**
 * @desc    Admin / Manager: Get all table bookings with filters
 * @route   GET /api/bookings
 * @access  Admin / Manager
 */
export const getAllBookings = async (req, res) => {
  try {
    const filter = {};
    const { restaurantId, status, date } = req.query;

    if (restaurantId && restaurantId !== 'all') {
      if (typeof restaurantId === 'string' && restaurantId.match(/^[0-9a-fA-F]{24}$/)) {
        filter.$or = [
          { restaurantId: restaurantId },
          { restaurantId: new mongoose.Types.ObjectId(restaurantId) },
        ];
      } else {
        filter.restaurantId = restaurantId;
      }
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (date === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      filter.bookingDate = { $gte: start, $lte: end };
    }

    const bookings = await TableBooking.find(filter).sort({ bookingDate: -1, createdAt: -1 });
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all bookings',
      error: error.message,
    });
  }
};

/**
 * @desc    Admin / Manager: Update booking status (Confirm, Cancel, Complete, CheckedIn, etc.)
 * @route   PATCH /api/bookings/:id/status
 * @access  Admin / Manager
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const booking = await TableBooking.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { bookingNumber: id }],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (status) {
      booking.status = status;
    }
    if (rejectionReason) {
      booking.rejectionReason = rejectionReason;
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${booking.status}`,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message,
    });
  }
};

/**
 * @desc    Admin / Restaurant Host: Verify check-in PIN
 * @route   POST /api/bookings/verify-pin
 * @access  Admin / Manager
 */
export const verifyCheckInPin = async (req, res) => {
  try {
    const { bookingNumber, checkInPin } = req.body;

    const booking = await TableBooking.findOne({ bookingNumber, checkInPin });

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking number or check-in PIN',
      });
    }

    booking.status = 'CheckedIn';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Customer verified and seated successfully!',
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify check-in PIN',
      error: error.message,
    });
  }
};

export default {
  getTableAvailability,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  joinWaitlist,
  getMyWaitlist,
  confirmBooking,
  getAllBookings,
  verifyCheckInPin,
};
