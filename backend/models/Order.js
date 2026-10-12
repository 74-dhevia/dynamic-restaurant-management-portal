import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  foodItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodItem',
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: String,
  customizations: [String],
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: String,
    customerEmail: String,
    deliveryAddress: {
      addressLine: String,
      landmark: String,
      city: { type: String, default: 'Kovilpatti' },
      pincode: String,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    couponCode: String,
    deliveryFee: {
      type: Number,
      default: 30,
    },
    tax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Card', 'COD', 'NetBanking'],
      default: 'UPI',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    orderStatus: {
      type: String,
      enum: ['Placed', 'Confirmed', 'Preparing', 'Ready', 'OutForDelivery', 'Delivered', 'Cancelled'],
      default: 'Placed',
    },
    restaurantId: {
      type: String,
      default: 'r2',
    },
    kitchenStatus: {
      type: String,
      enum: ['Waiting', 'Preparing', 'Ready', 'Delayed'],
      default: 'Waiting',
    },
    priority: {
      type: String,
      enum: ['Normal', 'High', 'Urgent'],
      default: 'Normal',
    },
    estimatedPrepMinutes: Number,
    estimatedReadyTime: Date,
    actualReadyTime: Date,
    qualityCheck: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: String,
      checklist: [String],
      notes: String,
    },
    incident: {
      reported: { type: Boolean, default: false },
      incidentId: String,
      incidentType: String,
      severity: String,
      message: String,
      reportedAt: Date,
      reportedBy: String,
      paused: Boolean,
    },
    deliveryPartner: {
      name: String,
      phone: String,
    },
    estimatedDeliveryTime: String,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
