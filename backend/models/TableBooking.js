import mongoose from 'mongoose';

const tableBookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
    },
    restaurantId: {
      type: mongoose.Schema.Types.Mixed,
    },
    restaurantName: {
      type: String,
      default: 'Zestro Partner Restaurant',
    },
    tableId: {
      type: String,
      required: true,
      default: 'Table 01',
    },
    tableNumber: {
      type: String,
    },
    tableCapacity: {
      type: Number,
      default: 4,
    },
    seatingArea: {
      type: String,
      enum: ['Indoor', 'AC', 'Rooftop', 'Family', 'Window'],
      default: 'Indoor',
    },
    guests: {
      type: Number,
      required: true,
      min: 1,
      default: 2,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 90,
    },
    startTimeMinutes: {
      type: Number,
    },
    endTimeMinutes: {
      type: Number,
    },
    checkInPin: {
      type: String,
      required: true,
    },
    verificationPin: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        'Requested',
        'Confirmed',
        'Table Ready',
        'Customer Arrived',
        'CheckedIn',
        'Dining',
        'Completed',
        'Cancelled',
        'No Show',
      ],
      default: 'Confirmed',
    },
    specialRequests: String,
    preOrderItems: Array,
    preOrderTotal: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      default: 0,
    },
    rejectionReason: String,
    rescheduledFrom: Object,
  },
  { timestamps: true }
);

// Helpful index for fast availability conflict searches
tableBookingSchema.index({ restaurantId: 1, bookingDate: 1, tableId: 1, status: 1 });

export default mongoose.models.TableBooking || mongoose.model('TableBooking', tableBookingSchema);
