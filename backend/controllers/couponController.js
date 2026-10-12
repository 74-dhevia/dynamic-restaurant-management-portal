import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';
import { sendOffersNotificationEmail } from '../services/emailService.js';

/**
 * @desc    Validate a promo / coupon code
 * @route   POST /api/coupons/validate
 * @access  Private
 */
export const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required',
      });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
      validUntil: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired promo code',
      });
    }

    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
      });
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully!',
      data: {
        code: coupon.code,
        discount: Math.round(discount),
        discountType: coupon.discountType,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to validate coupon',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all active coupons
 * @route   GET /api/coupons
 * @access  Public
 */
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ isActive: true, validUntil: { $gte: new Date() } });
    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupons',
      error: error.message,
    });
  }
};

/**
 * @desc    Create and publish a new offer/coupon (Admin only)
 * @route   POST /api/coupons
 * @access  Private (Admin)
 */
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType = 'PERCENTAGE',
      discountValue,
      minOrderAmount = 0,
      maxDiscount = 100,
      validUntil,
      usageLimit = 1000,
    } = req.body;

    if (!code || !discountValue || !validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Code, discount value, and valid until date are required',
      });
    }

    const cleanCode = code.toUpperCase().trim();

    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Coupon code ${cleanCode} already exists`,
      });
    }

    // 1. Store the offer in MongoDB first (Strict Rule: Store successfully first)
    const coupon = await Coupon.create({
      code: cleanCode,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount),
      maxDiscount: Number(maxDiscount),
      validUntil: new Date(validUntil),
      usageLimit: Number(usageLimit),
      isActive: true,
    });

    // 2. Create Admin Notification for newly published offer (Part 1.3)
    createNotification({
      recipientRole: 'admin',
      title: 'New Offer Published',
      message: `Promo coupon ${coupon.code} (${coupon.discountValue}${coupon.discountType === 'PERCENTAGE' ? '%' : '₹'} off) has been published.`,
      type: 'offer',
      eventType: 'offer_published',
      entityId: coupon.code,
      entityType: 'Coupon',
      actionUrl: '/admin/coupons',
      metadata: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      idempotencyKey: `notif_admin_offer_${coupon.code}`,
    }).catch((notifErr) => console.warn('Offer admin notification note:', notifErr.message));

    // 3. Notify eligible customers according to preferences (Part 2.5.E & Test 9)
    // Send promotional email ONLY to customers opted in ('emailPreferences.promotions': true)
    User.find({
      role: 'customer',
      'emailPreferences.promotions': true,
    }).then((optedInUsers) => {
      optedInUsers.forEach((user) => {
        // Customer in-app notification
        createNotification({
          recipient: user._id,
          recipientRole: 'customer',
          title: `Special Dining Offer: Use Code ${coupon.code}! 🏷️`,
          message: `Get ${coupon.discountValue}${coupon.discountType === 'PERCENTAGE' ? '%' : '₹'} off on your next order with coupon code ${coupon.code}!`,
          type: 'offer',
          eventType: 'offer_published',
          entityId: coupon.code,
          entityType: 'Coupon',
          actionUrl: '/offers',
          metadata: { code: coupon.code, discountValue: coupon.discountValue },
          idempotencyKey: `notif_cust_offer_${coupon.code}_${user._id}`,
        }).catch(() => {});

        // Promotional email (only to opted-in users)
        sendOffersNotificationEmail({
          to: user.email,
          name: user.name,
          offers: [{
            title: `${coupon.discountValue}${coupon.discountType === 'PERCENTAGE' ? '%' : '₹'} OFF`,
            description: `Use coupon code ${coupon.code} on orders above ₹${coupon.minOrderAmount}`,
            code: coupon.code,
          }],
          customMessage: `Exclusive new dining offer! Save ${coupon.discountValue}${coupon.discountType === 'PERCENTAGE' ? '%' : '₹'} on your next feast at ZESTRO.`,
        }).catch(() => {});
      });
    }).catch((err) => console.warn('Offer broadcast notification note:', err.message));

    res.status(201).json({
      success: true,
      message: 'Offer created and published successfully',
      data: coupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create offer',
      error: error.message,
    });
  }
};

export default {
  validateCoupon,
  getAllCoupons,
  createCoupon,
};
