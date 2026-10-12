import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      enum: ['email', 'whatsapp'],
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    // TTL index: MongoDB will automatically delete documents after 600 seconds (10 minutes)
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600,
    },
  },
  {
    timestamps: true,
  }
);

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;
