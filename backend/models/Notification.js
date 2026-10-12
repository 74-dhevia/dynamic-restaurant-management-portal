import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['customer', 'admin', 'chef', 'restaurantManager', 'deliveryPartner'],
      default: 'customer',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'order',
        'booking',
        'registration',
        'refund',
        'incident',
        'security',
        'offer',
        'system',
        'broadcast',
      ],
      default: 'system',
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      default: '',
      index: true,
    },
    entityType: {
      type: String,
      default: '',
    },
    actionUrl: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-speed scoped notification queries
notificationSchema.index({ recipient: 1, recipientRole: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, read: 1, createdAt: -1 });

// Transform for clean client output
notificationSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
