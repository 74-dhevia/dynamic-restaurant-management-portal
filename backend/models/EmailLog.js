import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema(
  {
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'welcome',
        'password_reset',
        'security_alert',
        'order_placed',
        'order_confirmed',
        'order_dispatched',
        'order_delivered',
        'order_cancelled',
        'order_refunded',
        'booking_created',
        'booking_confirmed',
        'booking_rescheduled',
        'booking_cancelled',
        'promotional_offer',
      ],
    },
    recipient: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    relatedId: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'simulated', 'skipped'],
      default: 'sent',
    },
    messageId: {
      type: String,
      default: '',
    },
    error: {
      type: String,
      default: '',
    },
    attempts: {
      type: Number,
      default: 1,
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize compound index for fast lookups
emailLogSchema.index({ recipient: 1, eventType: 1 });

const EmailLog = mongoose.models.EmailLog || mongoose.model('EmailLog', emailLogSchema);

export default EmailLog;
