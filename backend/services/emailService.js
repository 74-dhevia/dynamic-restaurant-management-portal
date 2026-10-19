import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import EmailLog from '../models/EmailLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

// In-memory idempotency cache fallback for ultra-fast checks and resilience
const memEmailLogs = new Map();

// Cached transporter singleton
let cachedTransporter = null;

/**
 * Get or initialize Nodemailer transporter using SMTP configuration
 * Uses environment variables EMAIL_USER and EMAIL_PASS (Gmail SMTP by default)
 */
export const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

  if (!user || !pass) {
    return null;
  }

  try {
    cachedTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 465,
      secure: true,
      auth: {
        user,
        pass,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false,
      },
    });

    return cachedTransporter;
  } catch (err) {
    console.error('Failed to initialize nodemailer transport:', err.message);
    return null;
  }
};

export const createTransporter = getTransporter;

/**
 * Check if the email service provider is configured
 */
export const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return Boolean(user && pass && user.trim() !== '' && pass.trim() !== '');
};

/**
 * Validate email address format strictly
 */
export const isValidEmailAddress = (email) => {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim().toLowerCase());
};

const getClientBaseUrl = () => {
  return process.env.APP_BASE_URL || process.env.CLIENT_URL || 'http://localhost:5173';
};

const getSenderAddress = () => {
  const senderEmail = process.env.EMAIL_USER;
  const senderName = process.env.EMAIL_FROM_NAME || 'ZESTRO';
  return `"${senderName}" <${senderEmail}>`;
};

/**
 * Base email layout wrapper for consistent, premium branding
 */
const buildEmailHtml = ({ title, preheader = '', contentHtml, actionUrl = '', actionText = '', footerNote = '' }) => {
  const baseUrl = getClientBaseUrl();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; }
    .wrapper { max-width: 600px; margin: 24px auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #e11d48, #ea580c); padding: 32px 24px; text-align: center; }
    .brand { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
    .tagline { font-size: 13px; color: rgba(255,255,255,0.9); margin-top: 6px; font-weight: 500; letter-spacing: 1px; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
    .text { font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px; }
    .btn-container { text-align: center; margin: 28px 0; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #e11d48, #ea580c); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4); }
    .info-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 18px 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #94a3b8; }
    .info-value { color: #f8fafc; font-weight: 600; text-align: right; }
    .footer { padding: 24px; background: #0a0e17; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; }
    .footer a { color: #94a3b8; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">🍽️ ZESTRO</div>
      <div class="tagline">ARTISANAL DINING & TABLE RESERVATIONS</div>
    </div>
    <div class="content">
      ${contentHtml}
      ${actionUrl && actionText ? `
      <div class="btn-container">
        <a href="${actionUrl}" class="cta-btn">${actionText}</a>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px;">© 2026 ZESTRO Dining Platform. All rights reserved.</p>
      ${footerNote ? `<p style="margin: 0 0 8px;">${footerNote}</p>` : ''}
      <p style="margin: 0;">Visit ZESTRO at <a href="${baseUrl}">${baseUrl}</a></p>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Core idempotency-protected sender
 * Prevents duplicate emails using database and in-memory idempotency locks
 */
export const sendEmailWithIdempotency = async ({
  idempotencyKey,
  eventType,
  to,
  subject,
  html,
  text,
  relatedId = '',
}) => {
  const cleanTo = (to || '').trim().toLowerCase();

  if (!cleanTo || !isValidEmailAddress(cleanTo)) {
    console.warn(`[Email Service] Invalid recipient address rejected: "${to}"`);
    return {
      success: false,
      error: 'Invalid recipient email address',
    };
  }

  // 1. Idempotency Check: In-memory store
  if (memEmailLogs.has(idempotencyKey)) {
    const cached = memEmailLogs.get(idempotencyKey);
    console.log(`ℹ️ [Email Idempotency] Skipping duplicate email event "${idempotencyKey}" (Already processed at ${cached.time})`);
    return {
      success: true,
      skipped: true,
      reason: 'Duplicate event: Email already dispatched',
      messageId: cached.messageId,
    };
  }

  // 2. Idempotency Check: Database (EmailLog collection)
  if (mongoose.connection.readyState === 1) {
    try {
      const existingLog = await EmailLog.findOne({ idempotencyKey });
      if (existingLog && existingLog.status === 'sent') {
        console.log(`ℹ️ [Email Idempotency] Skipping duplicate email event "${idempotencyKey}" (Found in DB log: ${existingLog.messageId})`);
        memEmailLogs.set(idempotencyKey, { time: existingLog.createdAt, messageId: existingLog.messageId });
        return {
          success: true,
          skipped: true,
          reason: 'Duplicate event: Email already dispatched',
          messageId: existingLog.messageId,
        };
      }
    } catch (dbErr) {
      console.warn('[Email Service] Database idempotency check note:', dbErr.message);
    }
  }

  // 3. Provider Configuration Check
  if (!isEmailConfigured()) {
    const errorMsg = 'Email service credentials not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env';
    console.warn(`⚠️ [Email Service] Missing credentials. Event "${eventType}" to "${cleanTo}" cannot be sent.`);
    console.log(`[Email Simulation] To: ${cleanTo} | Subject: ${subject} | Key: ${idempotencyKey}`);

    // Record simulation status
    memEmailLogs.set(idempotencyKey, { time: new Date().toISOString(), messageId: 'simulated' });

    if (mongoose.connection.readyState === 1) {
      try {
        await EmailLog.create({
          idempotencyKey,
          eventType,
          recipient: cleanTo,
          relatedId,
          subject,
          status: 'simulated',
          error: errorMsg,
        });
      } catch (logErr) {
        // Ignore duplicate key race condition
      }
    }

    return {
      success: false,
      notConfigured: true,
      error: errorMsg,
      message: errorMsg,
    };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return {
      success: false,
      notConfigured: true,
      error: 'Failed to initialize email transport',
    };
  }

  // 4. Send Email via Transporter
  try {
    const sender = getSenderAddress();
    const mailOptions = {
      from: sender,
      replyTo: process.env.EMAIL_USER,
      to: cleanTo,
      subject,
      text,
      html,
      headers: {
        'X-ZESTRO-Event': eventType,
        'X-ZESTRO-Idempotency': idempotencyKey,
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email Service] Email dispatched successfully to ${cleanTo} | Event: ${eventType} | MessageId: ${info.messageId}`);

    // Record success in memory
    memEmailLogs.set(idempotencyKey, { time: new Date().toISOString(), messageId: info.messageId });

    // Record in database
    if (mongoose.connection.readyState === 1) {
      try {
        await EmailLog.findOneAndUpdate(
          { idempotencyKey },
          {
            idempotencyKey,
            eventType,
            recipient: cleanTo,
            relatedId,
            subject,
            status: 'sent',
            messageId: info.messageId,
            attempts: 1,
            lastAttemptAt: new Date(),
          },
          { upsert: true, new: true }
        );
      } catch (logErr) {
        console.warn('[Email Service] Failed to save DB log:', logErr.message);
      }
    }

    return {
      success: true,
      messageId: info.messageId,
      recipient: cleanTo,
    };
  } catch (error) {
    console.error(`❌ [Email Service] Failed to dispatch email to ${cleanTo}:`, error.message);

    if (mongoose.connection.readyState === 1) {
      try {
        await EmailLog.findOneAndUpdate(
          { idempotencyKey },
          {
            idempotencyKey,
            eventType,
            recipient: cleanTo,
            relatedId,
            subject,
            status: 'failed',
            error: error.message,
            attempts: 1,
            lastAttemptAt: new Date(),
          },
          { upsert: true, new: true }
        );
      } catch (logErr) {
        // ignore
      }
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * -------------------------------------------------------------
 * 1. WELCOME EMAIL — NEW CUSTOMER REGISTRATION
 * -------------------------------------------------------------
 * Strict Rules:
 * - Triggered ONLY when a genuinely new customer successfully registers
 * - Sent only once per account
 * - Existing customers logging in must NOT receive another welcome email
 */
export const sendWelcomeEmail = async ({ to, name = 'Valued Guest' }) => {
  const cleanTo = (to || '').trim().toLowerCase();
  const customerName = (name && name.trim()) ? name.trim() : 'Valued Guest';
  const idempotencyKey = `welcome_${cleanTo}`;

  const subject = 'Welcome to ZESTRO!';

  const text = `
Hello ${customerName},

Welcome to ZESTRO!

Your account has been created successfully. You can now explore restaurants, browse menus, order your favourite food and reserve tables.

We are happy to have you with us!

Enjoy your ZESTRO experience.

Regards,
Team ZESTRO
`.trim();

  const contentHtml = `
    <h2 class="greeting">Hello ${customerName},</h2>
    <p class="text">Welcome to <strong>ZESTRO</strong>!</p>
    <p class="text">Your account has been created successfully. You can now explore restaurants, browse menus, order your favourite food and reserve tables.</p>
    <div class="info-card" style="border-left: 4px solid #ea580c;">
      <p style="margin: 0; color: #f8fafc; font-size: 14px; font-weight: 600;">✨ Explore Delicious Dining</p>
      <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">Browse handcrafted menus, reserve prime tables, and track your food deliveries in real time.</p>
    </div>
    <p class="text">We are happy to have you with us!</p>
    <p class="text">Enjoy your ZESTRO experience.</p>
    <p class="text" style="margin-bottom: 0;">Regards,<br><strong>Team ZESTRO</strong></p>
  `;

  const html = buildEmailHtml({
    title: subject,
    contentHtml,
    actionUrl: `${getClientBaseUrl()}/restaurants`,
    actionText: 'Explore Restaurants & Menus →',
    footerNote: `Sent to ${cleanTo} because you created a new ZESTRO account.`,
  });

  return await sendEmailWithIdempotency({
    idempotencyKey,
    eventType: 'welcome',
    to: cleanTo,
    subject,
    html,
    text,
  });
};

/**
 * -------------------------------------------------------------
 * 2. FORGOT PASSWORD — PASSWORD RESET EMAIL
 * -------------------------------------------------------------
 * Security:
 * - Single-use, time-limited (15-min) reset token
 * - Cryptographically secure reset link
 */
export const sendPasswordResetEmail = async ({ to, name = 'Valued Customer', resetUrl, token }) => {
  const cleanTo = (to || '').trim().toLowerCase();
  const idempotencyKey = `pwd_reset_${cleanTo}_${token || Date.now()}`;

  const subject = 'Reset Your ZESTRO Password';

  const text = `
Hello,

We received a request to reset your ZESTRO account password.

Use the secure link below to choose a new password:

${resetUrl}

This link expires after 15 minutes and can be used only once.

If you did not request this change, you can safely ignore this email.

Regards,
Team ZESTRO
`.trim();

  const contentHtml = `
    <h2 class="greeting">Hello,</h2>
    <p class="text">We received a request to reset your ZESTRO account password.</p>
    <p class="text">Click the secure button below to choose a new password:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${resetUrl}" class="cta-btn" style="background: linear-gradient(135deg, #e11d48, #ea580c);">Reset Password</a>
    </div>
    <p class="text" style="font-size: 13px; color: #94a3b8; word-break: break-all;">
      Or copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #fb7185;">${resetUrl}</a>
    </p>
    <div class="info-card" style="border-left: 4px solid #e11d48;">
      <p style="margin: 0; color: #fb7185; font-size: 13px; font-weight: 600;">⏱️ Security Notice</p>
      <p style="margin: 4px 0 0; color: #94a3b8; font-size: 12.5px;">This link expires after <strong>15 minutes</strong> and can be used <strong>only once</strong>.</p>
    </div>
    <p class="text">If you did not request this change, you can safely ignore this email. Your existing password remains secure.</p>
    <p class="text" style="margin-bottom: 0;">Regards,<br><strong>Team ZESTRO</strong></p>
  `;

  const html = buildEmailHtml({
    title: subject,
    contentHtml,
    actionUrl: '',
    actionText: '',
    footerNote: `Security notification sent to ${cleanTo}.`,
  });

  return await sendEmailWithIdempotency({
    idempotencyKey,
    eventType: 'password_reset',
    to: cleanTo,
    subject,
    html,
    text,
    relatedId: token,
  });
};

/**
 * -------------------------------------------------------------
 * 3. ORDER EMAILS — ONLY FOR IMPORTANT EVENTS
 * -------------------------------------------------------------
 * Allowed events: Placed, Confirmed, OutForDelivery, Delivered, Cancelled, Refunded
 */
export const sendOrderEventEmail = async ({ to, name = 'Customer', order, eventType }) => {
  const cleanTo = (to || order.customerEmail || order.userEmail || '').trim().toLowerCase();
  const orderNum = order.orderNumber || order.id || `ORD-${order._id}`;
  const restaurant = order.restaurantName || 'ZESTRO Partner Restaurant';
  const total = Number(order.totalAmount || order.grandTotal || 0).toLocaleString('en-IN');
  const idempotencyKey = `order_${orderNum}_${eventType}`;

  const statusConfigs = {
    Placed: {
      subject: 'Your ZESTRO Order Has Been Placed',
      heading: 'Order Successfully Placed! 🍲',
      message: 'Thank you for your order! Your restaurant has received the ticket and will begin preparation shortly.',
      badgeColor: '#ea580c',
    },
    Confirmed: {
      subject: 'Your ZESTRO Order Has Been Confirmed',
      heading: 'Order Confirmed! 👨‍🍳',
      message: 'Great news! The restaurant has confirmed your order and the kitchen has begun preparation.',
      badgeColor: '#3b82f6',
    },
    OutForDelivery: {
      subject: 'Your ZESTRO Order Is Out for Delivery',
      heading: 'Order Out for Delivery! 🛵',
      message: 'Your hot meal is on its way to your delivery address. Our delivery partner is en route.',
      badgeColor: '#8b5cf6',
    },
    Delivered: {
      subject: 'Your ZESTRO Order Has Been Delivered',
      heading: 'Order Delivered! 🎉',
      message: 'Your order has been delivered. We hope you enjoy your meal! Thank you for dining with ZESTRO.',
      badgeColor: '#10b981',
    },
    Cancelled: {
      subject: 'Your ZESTRO Order Has Been Cancelled',
      heading: 'Order Cancelled',
      message: 'Your order has been cancelled. Any pre-payments made will be refunded to your original payment method.',
      badgeColor: '#ef4444',
    },
    Refunded: {
      subject: 'Your ZESTRO Order Refund Has Been Processed',
      heading: 'Refund Processed 💳',
      message: `Your refund of ₹${total} for Order #${orderNum} has been processed successfully.`,
      badgeColor: '#10b981',
    },
  };

  const config = statusConfigs[eventType] || statusConfigs.Placed;
  const items = Array.isArray(order.items) ? order.items : [];
  const trackUrl = `${getClientBaseUrl()}/track-order/${order._id || orderNum}`;

  const itemsText = items.map((i) => `• ${i.name} x ${i.quantity || i.qty || 1} - ₹${(i.price || 0) * (i.quantity || i.qty || 1)}`).join('\n');

  const text = `
Hello ${name},

${config.message}

Order Details:
Order Number: ${orderNum}
Restaurant: ${restaurant}
Status: ${eventType}
Total Amount: ₹${total}

Ordered Items:
${itemsText}

Track your order: ${trackUrl}

Regards,
Team ZESTRO
`.trim();

  const itemsHtml = items.map((i) => `
    <div class="info-row">
      <span class="info-label">${i.name} <strong style="color: #94a3b8;">x ${i.quantity || i.qty || 1}</strong></span>
      <span class="info-value">₹${((i.price || 0) * (i.quantity || i.qty || 1)).toLocaleString('en-IN')}</span>
    </div>
  `).join('');

  const contentHtml = `
    <h2 class="greeting">${config.heading}</h2>
    <p class="text">${config.message}</p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Order Reference</span>
        <span class="info-value" style="color: #fb7185;">#${orderNum}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Restaurant</span>
        <span class="info-value">${restaurant}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Current Status</span>
        <span class="info-value" style="color: ${config.badgeColor};">${eventType}</span>
      </div>
      <div style="margin: 12px 0 6px; padding-top: 8px; border-top: 1px solid #1e293b; font-weight: 700; color: #cbd5e1; font-size: 13px;">
        ORDERED ITEMS
      </div>
      ${itemsHtml}
      <div class="info-row" style="margin-top: 8px; padding-top: 10px; border-top: 1px dashed #334155; font-size: 15px;">
        <span class="info-label" style="font-weight: 700; color: #ffffff;">Order Total</span>
        <span class="info-value" style="color: #10b981; font-size: 16px;">₹${total}</span>
      </div>
    </div>
  `;

  const html = buildEmailHtml({
    title: config.subject,
    contentHtml,
    actionUrl: trackUrl,
    actionText: 'View & Track Order →',
    footerNote: `Order notification for #${orderNum}.`,
  });

  return await sendEmailWithIdempotency({
    idempotencyKey,
    eventType: `order_${eventType.toLowerCase()}`,
    to: cleanTo,
    subject: config.subject,
    html,
    text,
    relatedId: orderNum,
  });
};

/**
 * -------------------------------------------------------------
 * 4. TABLE BOOKING EMAILS
 * -------------------------------------------------------------
 * Allowed events: Created, Confirmed, Rescheduled, Cancelled
 */
export const sendBookingEventEmail = async ({ to, name = 'Customer', booking, eventType = 'Confirmed', clientUrl }) => {
  const cleanTo = (to || booking.customerEmail || '').trim().toLowerCase();
  const bookingNum = booking.bookingNumber || booking.id || `TBK-${booking._id}`;
  const restaurant = booking.restaurantName || 'ZESTRO Partner Restaurant';
  const idempotencyKey = `booking_${bookingNum}_${eventType}`;

  const dateFormatted = booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) : 'Scheduled Date';

  const configs = {
    Requested: {
      subject: 'Your ZESTRO Table Reservation Request Received',
      heading: 'Reservation Request Received 🍽️',
      message: 'Your table reservation request has been submitted to the restaurant. We will notify you once confirmed by the host.',
    },
    Created: {
      subject: 'Your ZESTRO Table Reservation Request Received',
      heading: 'Reservation Request Received 🍽️',
      message: 'Your table reservation request has been submitted to the restaurant. We will notify you once confirmed by the host.',
    },
    Confirmed: {
      subject: `Your booking is confirmed! Verify OTP: ${booking.checkInPin || ''}`,
      heading: 'Table Reservation Confirmed! 🥂',
      message: `Your booking is confirmed! Your verify OTP is ${booking.checkInPin || ''}. Please present this PIN to the restaurant host upon arrival.`,
    },
    Rescheduled: {
      subject: 'Your ZESTRO Table Reservation Has Been Rescheduled',
      heading: 'Reservation Rescheduled 📅',
      message: 'Your table reservation date or time has been updated successfully.',
    },
    Cancelled: {
      subject: 'Your ZESTRO Table Reservation Has Been Cancelled',
      heading: 'Reservation Cancelled',
      message: 'Your table reservation has been cancelled as requested.',
    },
    WaitlistJoined: {
      subject: 'You Are on the ZESTRO Smart Waitlist',
      heading: 'Added to Table Waitlist 📋',
      message: 'You have been placed on the priority waitlist. We will notify you as soon as an eligible table becomes available.',
    },
    WaitlistAllocated: {
      subject: 'A Table Has Opened Up at ZESTRO!',
      heading: 'Great News — Table Available! 🎉',
      message: 'A table matching your party size has become available for your preferred time slot. Reserve now to secure your spot!',
    },
  };

  const config = configs[eventType] || configs.Confirmed;
  const baseClient = clientUrl || getClientBaseUrl();
  const bookingsUrl = `${baseClient}/customer/bookings`;

  const text = `
Hello ${name},

${config.message}

Reservation Details:
Reference: ${bookingNum}
Restaurant: ${restaurant}
Date: ${dateFormatted}
Time Slot: ${booking.timeSlot || 'Scheduled Slot'}
Guests: ${booking.guests || 2} People
Seating: ${booking.seatingArea || 'Indoor'}
Check-in PIN: ${booking.checkInPin || 'N/A'}
Status: ${eventType}

View your bookings: ${bookingsUrl}

Regards,
Team ZESTRO
`.trim();

  const contentHtml = `
    <h2 class="greeting">${config.heading}</h2>
    <p class="text">${config.message}</p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Booking Reference</span>
        <span class="info-value" style="color: #ea580c;">#${bookingNum}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Restaurant</span>
        <span class="info-value">${restaurant}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date & Time</span>
        <span class="info-value">${dateFormatted} at ${booking.timeSlot || 'Time slot'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Guests & Area</span>
        <span class="info-value">${booking.guests || 2} Guests • ${booking.seatingArea || 'Indoor'}</span>
      </div>
      ${booking.checkInPin ? `
      <div class="info-row" style="background: rgba(225, 29, 72, 0.1); margin: 8px -10px -10px; padding: 12px 10px; border-radius: 8px;">
        <span class="info-label" style="font-weight: 700; color: #fb7185;">Arrival Check-in PIN</span>
        <span class="info-value" style="font-family: monospace; font-size: 20px; color: #fb7185; letter-spacing: 2px;">${booking.checkInPin}</span>
      </div>
      ` : ''}
    </div>
  `;

  const html = buildEmailHtml({
    title: config.subject,
    contentHtml,
    actionUrl: bookingsUrl,
    actionText: 'Manage My Bookings →',
    footerNote: `Table reservation notification for #${bookingNum}.`,
  });

  return await sendEmailWithIdempotency({
    idempotencyKey,
    eventType: `booking_${eventType.toLowerCase()}`,
    to: cleanTo,
    subject: config.subject,
    html,
    text,
    relatedId: bookingNum,
  });
};

/**
 * -------------------------------------------------------------
 * 5. SECURITY ALERT EMAILS
 * -------------------------------------------------------------
 * Triggered only for genuine security events: Password changed, Email changed
 */
export const sendSecurityAlertEmail = async ({ to, name = 'Valued Customer', alertType = 'password_changed', timestamp = new Date() }) => {
  const cleanTo = (to || '').trim().toLowerCase();
  const timeStr = new Date(timestamp).toLocaleString('en-US', { timeZoneName: 'short' });
  const idempotencyKey = `security_${cleanTo}_${alertType}_${Math.floor(Date.now() / 60000)}`;

  const subject = 'Security Alert: Your ZESTRO Account Password Was Changed';

  const text = `
Hello ${name},

Your ZESTRO account password was successfully changed on ${timeStr}.

If you made this change, you can safely disregard this email.

IMPORTANT: If you did not make this change, please contact ZESTRO Security immediately to secure your account.

Regards,
Team ZESTRO Security
`.trim();

  const contentHtml = `
    <h2 class="greeting">🔒 Security Alert</h2>
    <p class="text">Hello <strong>${name}</strong>,</p>
    <p class="text">Your ZESTRO account password was successfully changed on <strong>${timeStr}</strong>.</p>
    <div class="info-card" style="border-left: 4px solid #10b981;">
      <p style="margin: 0; color: #10b981; font-size: 13.5px; font-weight: 600;">Account Protection Confirmation</p>
      <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">If you initiated this password change, no further action is required.</p>
    </div>
    <p class="text" style="font-size: 13.5px; color: #ef4444;">
      <strong>Did not request this change?</strong> Please contact support immediately to lock and recover your account.
    </p>
    <p class="text" style="margin-bottom: 0;">Regards,<br><strong>Team ZESTRO Security</strong></p>
  `;

  const html = buildEmailHtml({
    title: subject,
    contentHtml,
    actionUrl: `${getClientBaseUrl()}/help`,
    actionText: 'Contact Security Support →',
    footerNote: `Account security alert sent to ${cleanTo}.`,
  });

  return await sendEmailWithIdempotency({
    idempotencyKey,
    eventType: 'security_alert',
    to: cleanTo,
    subject,
    html,
    text,
  });
};

/**
 * -------------------------------------------------------------
 * 6. OFFERS AND PROMOTIONAL EMAILS
 * -------------------------------------------------------------
 * Strict Rules:
 * - Sent ONLY to customers who opted in to promotional emails
 * - Must include an unsubscribe link
 */
export const sendOffersNotificationEmail = async ({
  to,
  name = 'Valued Foodie',
  offers = [],
  customMessage = 'Here are exclusive discount vouchers handpicked for your next feast at ZESTRO!',
  unsubscribeUrl = '',
}) => {
  const cleanTo = (to || '').trim().toLowerCase();
  const idempotencyKey = `promo_${cleanTo}_${Math.floor(Date.now() / 3600000)}`;

  const subject = '🏷️ Exclusive Dining Offers from ZESTRO';
  const defaultOffers = [
    { code: 'ZESTRO50', desc: '50% Flat Off up to ₹200 on all artisanal dishes', minOrder: 399 },
    { code: 'FEAST100', desc: 'Flat ₹100 Off on orders above ₹599', minOrder: 599 },
  ];
  const offerList = (offers && offers.length > 0) ? offers : defaultOffers;
  const unsubsLink = unsubscribeUrl || `${getClientBaseUrl()}/customer/settings`;

  const text = `
Hello ${name},

${customMessage}

Exclusive Vouchers:
${offerList.map((o) => `• Code: ${o.code} — ${o.desc || 'Discount'} (Min Order: ₹${o.minOrder || 0})`).join('\n')}

Redeem and order now at: ${getClientBaseUrl()}/offers

To unsubscribe from promotional emails: ${unsubsLink}

Regards,
Team ZESTRO
`.trim();

  const offersHtml = offerList.map((o) => `
    <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <span style="font-family: monospace; font-size: 18px; font-weight: 800; color: #ff6b35; border: 1.5px dashed #ff6b35; padding: 2px 8px; border-radius: 6px;">${o.code}</span>
        <div style="font-size: 13.5px; color: #e2e8f0; font-weight: 600; margin-top: 6px;">${o.desc || 'Discount Offer'}</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Min Order: ₹${o.minOrder || 0}</div>
      </div>
    </div>
  `).join('');

  const contentHtml = `
    <h2 class="greeting">Hey ${name}! 🎉</h2>
    <p class="text">${customMessage}</p>
    ${offersHtml}
  `;

  const html = buildEmailHtml({
    title: subject,
    contentHtml,
    actionUrl: `${getClientBaseUrl()}/offers`,
    actionText: 'Redeem Offers & Order Now →',
    footerNote: `You received this promotional email because you opted into dining offers. <a href="${unsubsLink}">Unsubscribe here</a>.`,
  });

  return await sendEmailWithIdempotency({
    idempotencyKey,
    eventType: 'promotional_offer',
    to: cleanTo,
    subject,
    html,
    text,
  });
};

/**
 * Backward compatibility: send 6-digit OTP email if needed
 */
export const sendPasswordResetOtpEmail = async ({ to, name = 'Valued Customer', otp }) => {
  const cleanTo = (to || '').trim().toLowerCase();
  const idempotencyKey = `otp_${cleanTo}_${otp}_${Date.now()}`;
  const subject = `Your ZESTRO Verification Code: ${otp}`;

  const text = `
Hello ${name},

Your ZESTRO account verification code is: ${otp}

This code is valid for 10 minutes. Do not share this code with anyone.

Regards,
Team ZESTRO
`.trim();

  const contentHtml = `
    <h2 class="greeting">Hello ${name},</h2>
    <p class="text">Use the one-time verification code below to proceed with your verification:</p>
    <div style="background: #0f172a; border: 2px dashed #e11d48; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
      <div style="font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #fb7185;">${otp}</div>
      <div style="font-size: 12px; color: #f43f5e; font-weight: 600; margin-top: 8px;">⏱️ Valid for 10 minutes only</div>
    </div>
    <p class="text" style="font-size: 13px; color: #94a3b8;">Never share this code with anyone. ZESTRO staff will never ask for your verification code.</p>
  `;

  const html = buildEmailHtml({
    title: subject,
    contentHtml,
    actionUrl: '',
    actionText: '',
    footerNote: `Sent to ${cleanTo}.`,
  });

  return await sendEmailWithIdempotency({
    idempotencyKey,
    eventType: 'password_reset',
    to: cleanTo,
    subject,
    html,
    text,
  });
};

export default {
  getTransporter,
  createTransporter,
  isEmailConfigured,
  isValidEmailAddress,
  sendEmailWithIdempotency,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetOtpEmail,
  sendOrderEventEmail,
  sendBookingEventEmail,
  sendSecurityAlertEmail,
  sendOffersNotificationEmail,
};
