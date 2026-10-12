import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema(
  {
    waitlistNumber: {
      type: String,
      required: true,
      unique: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    restaurantName: {
      type: String,
      default: 'Zestro Partner Restaurant',
    },
    customerId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    guests: {
      type: Number,
      required: true,
      min: 1,
      default: 2,
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    preferredTimeSlot: {
      type: String,
      required: true,
    },
    seatingArea: {
      type: String,
      enum: ['Any', 'Indoor', 'AC', 'Rooftop', 'Family', 'Window'],
      default: 'Any',
    },
    status: {
      type: String,
      enum: ['Waiting', 'Notified', 'Allocated', 'Expired', 'Cancelled'],
      default: 'Waiting',
    },
    notifiedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Waitlist || mongoose.model('Waitlist', waitlistSchema);
