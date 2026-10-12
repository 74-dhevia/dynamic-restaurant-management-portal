import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    tagline: {
      type: String,
      trim: true,
    },
    cuisineType: [
      {
        type: String,
        trim: true,
      },
    ],
    address: {
      street: String,
      area: String,
      city: { type: String, default: 'Kovilpatti' },
      state: { type: String, default: 'Tamil Nadu' },
      pincode: String,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    priceRange: {
      type: String,
      enum: ['₹', '₹₹', '₹₹₹'],
      default: '₹₹',
    },
    heroImage: {
      type: String,
      default: '',
    },
    images: [String],
    isPureVeg: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    openingHours: {
      open: { type: String, default: '10:00 AM' },
      close: { type: String, default: '11:00 PM' },
    },
    tables: [
      {
        tableId: String,
        capacity: Number,
        section: { type: String, enum: ['Indoor', 'AC', 'Rooftop', 'Family'], default: 'Indoor' },
        isAvailable: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Restaurant || mongoose.model('Restaurant', restaurantSchema);
