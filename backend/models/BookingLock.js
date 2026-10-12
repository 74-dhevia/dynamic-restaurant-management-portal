import mongoose from 'mongoose';

/**
 * Concurrency Reservation Lock
 * Uses a unique lockKey (`restaurantId_tableId_dateStr_slot`) to prevent
 * simultaneous race-condition double bookings at the database engine level.
 * Has a TTL index of 60 seconds to automatically release stale locks if an error occurs.
 */
const bookingLockSchema = new mongoose.Schema(
  {
    lockKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bookingNumber: {
      type: String,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60, // Auto-deleted after 60 seconds
    },
  },
  { timestamps: false }
);

export default mongoose.models.BookingLock || mongoose.model('BookingLock', bookingLockSchema);
