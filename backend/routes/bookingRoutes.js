import express from 'express';
import {
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
} from '../controllers/bookingController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Real-Time Table Availability (public or authenticated)
router.get('/availability', getTableAvailability);

// Customer Booking Actions (Seamless auth: accepts JWT or guest customer payload)
router.post('/', optionalProtect, createBooking);
router.get('/my-bookings', optionalProtect, getMyBookings);
router.get('/waitlist/my', optionalProtect, getMyWaitlist);
router.post('/waitlist', optionalProtect, joinWaitlist);
router.get('/:id', optionalProtect, getBookingById);
router.patch('/:id/cancel', optionalProtect, cancelBooking);
router.patch('/:id/reschedule', optionalProtect, rescheduleBooking);

// Host / Admin Management Routes
router.patch('/:id/confirm', protect, confirmBooking);
router.get('/', protect, getAllBookings);
router.post('/verify-pin', protect, verifyCheckInPin);

export default router;
