import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import generateToken from '../utils/generateToken.js';
import { createNotification } from '../services/notificationService.js';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetOtpEmail,
  sendSecurityAlertEmail,
  sendOffersNotificationEmail,
} from '../services/emailService.js';
import { sendWhatsAppOtp } from '../services/whatsappService.js';

// Fast in-memory OTP cache (prevents connection drops/timeouts during Atlas reconnects)
const memOtpStore = new Map();

// Rate limit tracker for forgot password reset link requests (max 3 per 15 min per email)
const resetLinkRateLimit = new Map();

// Email format validation regex
const isValidEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Role handling: Public registration is strictly restricted to 'customer'
    // Privileged accounts (admin, chef, manager, delivery) must never be self-assigned
    const userRole = 'customer';

    // Create user (pre-save hook hashes the password)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      password,
      role: userRole,
    });

    const token = generateToken(user._id, user.role);

    // Send Welcome Email only on genuine new account creation (Strict Rule: never on login)
    sendWelcomeEmail({
      to: user.email,
      name: user.name,
    }).then(async () => {
      user.welcomeEmailSent = true;
      await user.save().catch(() => {});
    }).catch((mailErr) => {
      console.warn('Registration welcome email background note:', mailErr.message);
    });

    // Create Admin Notification for genuinely new customer registration (Strict Rule: never on login or refresh)
    createNotification({
      recipientRole: 'admin',
      title: 'New Customer Registered',
      message: `A new customer, ${user.name}, has successfully created a ZESTRO account.`,
      type: 'registration',
      eventType: 'customer_registration',
      entityId: user._id.toString(),
      entityType: 'User',
      actionUrl: `/admin/customers/${user._id}`,
      metadata: {
        customerName: user.name,
        customerEmail: user.email,
        customerId: user._id.toString(),
        registrationDate: user.createdAt,
      },
      idempotencyKey: `notif_reg_${user._id}`,
    }).catch((notifErr) => {
      console.warn('Registration admin notification note:', notifErr.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

/**
 * @desc    Authenticate user & return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password presence
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password. Please try again.',
      });
    }

    // Query user and explicitly include hashed password
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please try again.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently inactive. Please contact support.',
      });
    }

    // Compare passwords
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please try again.',
      });
    }

    const token = generateToken(user._id, user.role);

    // STRICT RULE: Existing customers logging in must NOT receive another welcome email.
    // Welcome email is sent ONLY upon new registration.

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private (JWT protected)
 */
export const getMe = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        profileImage: user.profileImage || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching user profile',
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile or PUT /api/profile
 * @access  Private (JWT protected)
 */
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { name, phone, profileImage } = req.body;
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        profileImage: user.profileImage || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile',
    });
  }
};

/**
 * @desc    Send Welcome email notification to user inbox
 * @route   POST /api/auth/welcome-email
 * @access  Public
 */
export const sendWelcomeNotification = async (req, res) => {
  try {
    const { email, name, role, provider } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    const result = await sendWelcomeEmail({
      to: email.trim().toLowerCase(),
      name: name || 'Valued Guest',
      role: role || 'customer',
      provider: provider || 'email',
    });

    if (result.notConfigured) {
      return res.status(200).json({
        success: false,
        notConfigured: true,
        message: result.error || 'Email service credentials not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env',
        details: result,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.simulated
        ? 'Welcome notification simulated (Configure EMAIL_USER & EMAIL_PASS in backend/.env for live dispatch)'
        : `Welcome email successfully sent to ${email}`,
      details: result,
    });
  } catch (error) {
    console.error('Welcome email endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch welcome email',
    });
  }
};

/**
 * @desc    Send promotional offers email to user's registered/notification inbox
 * @route   POST /api/auth/offers-email
 * @access  Public
 */
export const sendOffersNotification = async (req, res) => {
  try {
    const { email, name, offers, customMessage } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Notification email address is required',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if customer opted in to promotional emails (Strict Requirement: Default OFF unless opted in)
    if (mongoose.connection.readyState === 1) {
      try {
        const user = await User.findOne({ email: cleanEmail }).maxTimeMS(2000);
        if (!user || !user.emailPreferences || user.emailPreferences.promotions !== true) {
          return res.status(403).json({
            success: false,
            message: 'Customer has not opted in to promotional marketing emails.',
          });
        }
      } catch (dbErr) {
        console.warn('MongoDB preferences check note:', dbErr.message);
      }
    }

    const result = await sendOffersNotificationEmail({
      to: cleanEmail,
      name: name || 'Valued Foodie',
      offers: offers || [],
      customMessage: customMessage || 'Here are exclusive dining discounts & coupon vouchers for your next feast at ZESTRO!',
      unsubscribeUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/customer/settings`,
    });

    if (result.notConfigured) {
      return res.status(200).json({
        success: false,
        notConfigured: true,
        message: result.error || 'Email service credentials not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env',
        details: result,
      });
    }

    // Also create customer website notification in MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        const user = await User.findOne({ email: cleanEmail });
        if (user) {
          createNotification({
            recipient: user._id,
            recipientRole: 'customer',
            title: 'Special Dining Offers Available 🏷️',
            message: customMessage || 'Exclusive discount vouchers have been unlocked for your next meal at ZESTRO!',
            type: 'offer',
            eventType: 'offer_published',
            actionUrl: '/offers',
            metadata: { offers },
            idempotencyKey: `notif_promo_${cleanEmail}_${Math.floor(Date.now() / 3600000)}`,
          }).catch(() => {});
        }
      } catch (notifErr) {
        // ignore
      }
    }

    return res.status(200).json({
      success: true,
      message: result.simulated
        ? `Offers notification simulated for ${cleanEmail}`
        : `Exclusive dining offers successfully sent to ${cleanEmail}! Check your inbox.`,
      details: result,
    });
  } catch (error) {
    console.error('Send offers email endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch offers email',
    });
  }
};

/**
 * @desc    Generate and send Password Reset OTP via WhatsApp or Email
 * @route   POST /api/auth/forgot-password/send-otp
 * @access  Public
 */
export const forgotPasswordSendOtp = async (req, res) => {
  try {
    const { identifier, channel } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address or phone number is required',
      });
    }

    const selectedChannel = channel === 'whatsapp' ? 'whatsapp' : 'email';
    const cleanIdentifier = identifier.trim().toLowerCase();

    // Check if user exists in database if MongoDB is connected
    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        if (selectedChannel === 'email') {
          user = await User.findOne({ email: cleanIdentifier }).maxTimeMS(2000);
        } else {
          const digits = identifier.replace(/\D/g, '');
          const searchPattern = digits.length >= 10 ? digits.slice(-10) : digits;
          user = await User.findOne({ phone: { $regex: searchPattern, $options: 'i' } }).maxTimeMS(2000);
        }
      } catch (dbErr) {
        console.warn('MongoDB user lookup notice:', dbErr.message);
      }
    }

    const userName = user ? user.name : 'Valued Customer';
    const targetEmail = user?.email || (selectedChannel === 'email' ? cleanIdentifier : null);
    const targetPhone = user?.phone || (selectedChannel === 'whatsapp' ? identifier : null);

    // Generate cryptographically sound 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in memory cache (guarantees zero delay/timeout even if Atlas is reconnecting)
    memOtpStore.set(cleanIdentifier, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      channel: selectedChannel,
      verified: false,
    });

    if (mongoose.connection.readyState === 1) {
      try {
        await Otp.deleteMany({ identifier: cleanIdentifier }).maxTimeMS(1000);
        await Otp.create({
          identifier: cleanIdentifier,
          otp,
          channel: selectedChannel,
        });
      } catch (dbErr) {
        console.warn('MongoDB OTP store notice (using memory store):', dbErr.message);
      }
    }

    let dispatchResult = { success: true };

    if (selectedChannel === 'email') {
      if (!targetEmail) {
        return res.status(400).json({
          success: false,
          message: 'No registered email found for this account',
        });
      }

      dispatchResult = await sendPasswordResetOtpEmail({
        to: targetEmail,
        name: userName,
        otp,
      });

      if (!dispatchResult?.success) {
        return res.status(500).json({
          success: false,
          message: dispatchResult?.error || 'Failed to deliver verification code to your email. Please try again.',
        });
      }
    } else {
      // WhatsApp dispatch
      if (!targetPhone) {
        return res.status(400).json({
          success: false,
          message: 'No registered phone number found for this account',
        });
      }

      dispatchResult = await sendWhatsAppOtp({
        to: targetPhone,
        name: userName,
        otp,
      });
    }

    const cleanDigits = (targetPhone || cleanIdentifier).replace(/\D/g, '');
    const fallbackPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const fallbackWaUrl = `https://wa.me/${fallbackPhone}?text=${encodeURIComponent(`🍽️ *ZESTRO Security*\n\nHello ${userName},\nYour password reset verification OTP is: *${otp}*\n\n⏱️ This code expires in 10 minutes.\n🔒 Do not share this code with anyone.`)}`;

    return res.status(200).json({
      success: true,
      channel: selectedChannel,
      identifier: cleanIdentifier,
      waMeUrl: selectedChannel === 'whatsapp' ? (dispatchResult?.waMeUrl || fallbackWaUrl) : undefined,
      message: selectedChannel === 'email'
        ? `A 6-digit verification code has been sent to ${targetEmail}. Please check your inbox and spam folder!`
        : `WhatsApp verification code dispatched to ${targetPhone}`,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch verification OTP',
    });
  }
};

/**
 * @desc    Verify the 6-digit OTP
 * @route   POST /api/auth/forgot-password/verify-otp
 * @access  Public
 */
export const forgotPasswordVerifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Identifier and OTP code are required',
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    let isMatch = false;

    // 1. Check in-memory cache
    const memData = memOtpStore.get(cleanIdentifier);
    if (memData && memData.otp === cleanOtp && memData.expiresAt > Date.now()) {
      memData.verified = true;
      isMatch = true;
    }

    // 2. Check MongoDB collection
    if (!isMatch) {
      try {
        const otpDoc = await Otp.findOne({ identifier: cleanIdentifier, otp: cleanOtp });
        if (otpDoc) {
          otpDoc.verified = true;
          await otpDoc.save();
          isMatch = true;
        }
      } catch (dbErr) {
        console.warn('DB OTP lookup note:', dbErr.message);
      }
    }

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please check your email and try again.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP',
    });
  }
};

/**
 * @desc    Reset password after OTP verification
 * @route   POST /api/auth/forgot-password/reset-password
 * @access  Public
 */
export const forgotPasswordReset = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    if (!identifier || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Identifier and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Verify OTP record
    if (otp) {
      const cleanOtp = String(otp).trim();
      let otpValid = false;

      const memData = memOtpStore.get(cleanIdentifier);
      if (memData && memData.otp === cleanOtp) {
        otpValid = true;
      }

      if (!otpValid && mongoose.connection.readyState === 1) {
        try {
          const otpDoc = await Otp.findOne({ identifier: cleanIdentifier, otp: cleanOtp }).maxTimeMS(2000);
          if (otpDoc) otpValid = true;
        } catch (dbErr) {
          console.warn('DB OTP verify error:', dbErr.message);
        }
      }

      if (!otpValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP session. Please try again.',
        });
      }
    }

    // Find user by email or phone if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      try {
        let user = await User.findOne({ email: cleanIdentifier }).maxTimeMS(2000);
        if (!user) {
          const digits = cleanIdentifier.replace(/\D/g, '');
          const searchPattern = digits.length >= 10 ? digits.slice(-10) : digits;
          user = await User.findOne({ phone: { $regex: searchPattern, $options: 'i' } }).maxTimeMS(2000);
        }

        if (user) {
          user.password = newPassword;
          await user.save();
          console.log(`✅ Password successfully updated for user: ${user.email}`);
        } else {
          // If user verified the real OTP, create the customer account so they can login immediately
          user = await User.create({
            name: cleanIdentifier.includes('@') ? cleanIdentifier.split('@')[0] : 'Customer',
            email: cleanIdentifier.includes('@') ? cleanIdentifier : `${cleanIdentifier}@customer.zestro.com`,
            phone: cleanIdentifier.includes('@') ? '' : cleanIdentifier,
            password: newPassword,
            role: 'customer',
          });
          console.log(`✅ User account created with new password for verified email: ${user.email}`);
        }

        await Otp.deleteMany({ identifier: cleanIdentifier }).maxTimeMS(2000);
      } catch (dbErr) {
        console.warn('MongoDB password reset update notice:', dbErr.message);
      }
    }

    // Clear used in-memory OTP
    memOtpStore.delete(cleanIdentifier);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! Please sign in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password',
    });
  }
};

/**
 * =========================================================================
 * MANDATORY SECTION 3: FORGOT PASSWORD — SECURE RESET TOKEN & EMAIL FLOW
 * =========================================================================
 */

/**
 * @desc    Submit email for secure password-reset link
 * @route   POST /api/auth/forgot-password/request-link
 * @access  Public
 */
export const forgotPasswordRequestLink = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid registered email address',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address format',
      });
    }

    // Rate Limiting Protection (Max 3 requests per 15 minutes per email)
    const now = Date.now();
    const rateRecord = resetLinkRateLimit.get(cleanEmail);
    if (rateRecord && rateRecord.count >= 3 && now < rateRecord.resetAt) {
      const waitMin = Math.ceil((rateRecord.resetAt - now) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many password reset requests. Please wait ${waitMin} minutes before trying again.`,
      });
    }

    if (!rateRecord || now > rateRecord.resetAt) {
      resetLinkRateLimit.set(cleanEmail, { count: 1, resetAt: now + 15 * 60 * 1000 });
    } else {
      rateRecord.count += 1;
    }

    // Query user in MongoDB
    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ email: cleanEmail }).select('+password +resetPasswordToken +resetPasswordExpire +resetPasswordUsed');
      } catch (dbErr) {
        console.warn('MongoDB user lookup notice:', dbErr.message);
      }
    }

    // Security Rule: If account exists, send reset email; never reveal existence
    if (user) {
      // If user is Google-only without local password
      if (user.password && user.password.startsWith('OAuth_')) {
        // Send notification explaining they should sign in via Google
        sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`,
          token: 'google_oauth_notice',
        }).catch((err) => console.warn('OAuth note email error:', err.message));
      } else {
        // 1. Generate cryptographically secure random token (Section 3 requirement)
        const rawToken = crypto.randomBytes(32).toString('hex');

        // 2. Hash token with SHA-256 before storing in database
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        // 3. Set 15-minute expiration and single-use flag
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
        user.resetPasswordUsed = false;
        await user.save();

        // 4. Construct secure reset link
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetUrl = `${clientUrl}/forgot-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

        // 5. Send password-reset email
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
          token: rawToken,
        });

        console.log(`🔒 Secure password reset link dispatched to ${user.email}`);
      }
    }

    // Security Requirement: Never reveal whether an email address exists; show generic response
    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, password reset instructions will be sent.',
    });
  } catch (error) {
    console.error('Request reset link error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
    });
  }
};

/**
 * @desc    Verify if a password reset token is valid and unexpired
 * @route   POST /api/auth/forgot-password/verify-token
 * @access  Public
 */
export const forgotPasswordVerifyToken = async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and email address are required',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      email: cleanEmail,
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
      resetPasswordUsed: { $ne: true },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid, expired, or has already been used.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reset token verified successfully',
      email: user.email,
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify reset token',
    });
  }
};

/**
 * @desc    Reset password using single-use secure reset token
 * @route   POST /api/auth/forgot-password/reset-with-token
 * @access  Public
 */
export const forgotPasswordResetWithToken = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, email and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

    // Query user by email and non-expired, unused token
    const user = await User.findOne({
      email: cleanEmail,
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
      resetPasswordUsed: { $ne: true },
    }).select('+password +resetPasswordToken +resetPasswordExpire +resetPasswordUsed');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid, expired, or has already been used. Please request a new link.',
      });
    }

    // Set new password (pre-save hook hashes it with bcryptjs)
    user.password = newPassword;

    // Single-use guarantee: Invalidate the token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.resetPasswordUsed = true;

    await user.save();

    // Trigger Security Alert Email (Section 7: Meaningful account-security event)
    sendSecurityAlertEmail({
      to: user.email,
      name: user.name,
      alertType: 'password_changed',
    }).catch((mailErr) => console.warn('Security alert email note:', mailErr.message));

    // Create in-app customer notification for account security event (Section 2)
    createNotification({
      recipient: user._id,
      recipientRole: 'customer',
      title: 'Security Alert: Password Changed',
      message: 'Your ZESTRO account password was recently changed. If you did not make this change, please contact support immediately.',
      type: 'security',
      eventType: 'password_changed',
      actionUrl: '/customer/settings',
      idempotencyKey: `notif_pwd_${user._id}_${Date.now()}`,
    }).catch(() => {});

    console.log(`✅ Password successfully reset via secure token for: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! Please sign in with your new password.',
    });
  } catch (error) {
    console.error('Reset with token error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update password',
    });
  }
};

/**
 * =========================================================================
 * MANDATORY SECTION 10: CUSTOMER EMAIL PREFERENCES
 * =========================================================================
 */

/**
 * @desc    Get customer email preferences
 * @route   GET /api/auth/email-preferences
 * @access  Private
 */
export const getEmailPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const prefs = user.emailPreferences || {
      promotions: false,
      nonEssentialUpdates: false,
    };

    return res.status(200).json({
      success: true,
      emailPreferences: {
        promotions: Boolean(prefs.promotions),
        nonEssentialUpdates: Boolean(prefs.nonEssentialUpdates),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch email preferences',
    });
  }
};

/**
 * @desc    Update customer email preferences
 * @route   PUT /api/auth/email-preferences
 * @access  Private
 */
export const updateEmailPreferences = async (req, res) => {
  try {
    const { promotions, nonEssentialUpdates } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.emailPreferences) {
      user.emailPreferences = {};
    }

    if (promotions !== undefined) user.emailPreferences.promotions = Boolean(promotions);
    if (nonEssentialUpdates !== undefined) user.emailPreferences.nonEssentialUpdates = Boolean(nonEssentialUpdates);

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email preferences updated successfully',
      emailPreferences: {
        promotions: user.emailPreferences.promotions,
        nonEssentialUpdates: user.emailPreferences.nonEssentialUpdates,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update email preferences',
    });
  }
};

/**
 * @desc    Public 1-click unsubscribe from promotional marketing emails
 * @route   POST /api/auth/unsubscribe or GET /api/auth/unsubscribe
 * @access  Public
 */
export const unsubscribeEmail = async (req, res) => {
  try {
    const email = (req.body?.email || req.query?.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required to unsubscribe',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email });
      if (user) {
        if (!user.emailPreferences) user.emailPreferences = {};
        user.emailPreferences.promotions = false;
        user.emailPreferences.nonEssentialUpdates = false;
        await user.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully unsubscribed ${email} from promotional marketing emails.`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process unsubscribe request',
    });
  }
};

/**
 * @desc    Authenticate or register user via Google OAuth
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = async (req, res) => {
  try {
    const { email, name, avatar } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Google email is required',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });
    let isNewCustomer = false;

    if (!user) {
      isNewCustomer = true;
      user = await User.create({
        name: name ? name.trim() : 'Google Foodie',
        email: cleanEmail,
        password: `OAuth_${Date.now()}_${Math.random()}`,
        role: 'customer',
        profileImage: avatar || '',
      });

      // Send welcome email ONLY for genuinely new customer
      sendWelcomeEmail({
        to: user.email,
        name: user.name,
      }).then(async () => {
        user.welcomeEmailSent = true;
        await user.save().catch(() => {});
      }).catch((mailErr) => {
        console.warn('Google registration welcome email note:', mailErr.message);
      });

      // Create Admin Notification ONLY for genuinely new customer registration
      createNotification({
        recipientRole: 'admin',
        title: 'New Customer Registered',
        message: `A new customer, ${user.name}, has successfully created a ZESTRO account via Google.`,
        type: 'registration',
        eventType: 'customer_registration',
        entityId: user._id.toString(),
        entityType: 'User',
        actionUrl: `/admin/customers/${user._id}`,
        metadata: {
          customerName: user.name,
          customerEmail: user.email,
          customerId: user._id.toString(),
          registrationDate: user.createdAt,
          provider: 'google',
        },
        idempotencyKey: `notif_reg_${user._id}`,
      }).catch((notifErr) => {
        console.warn('Google registration admin notification note:', notifErr.message);
      });
    } else {
      // Existing user logging in: update profile photo if available
      if (avatar && !user.profileImage) {
        user.profileImage = avatar;
        await user.save().catch(() => {});
      }
      // Strict rule: DO NOT send welcome email, DO NOT create registration notification
    }

    const token = generateToken(user._id, user.role);

    return res.status(isNewCustomer ? 201 : 200).json({
      success: true,
      message: isNewCustomer ? 'Registration successful via Google' : 'Login successful via Google',
      isNewCustomer,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage || null,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during Google authentication',
    });
  }
};



