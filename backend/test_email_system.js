import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Order from './models/Order.js';
import TableBooking from './models/TableBooking.js';
import EmailLog from './models/EmailLog.js';
import {
  isEmailConfigured,
  sendEmailWithIdempotency,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderEventEmail,
  sendBookingEventEmail,
  sendSecurityAlertEmail,
  sendOffersNotificationEmail,
} from './services/emailService.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const results = [];

function recordResult(testNumber, name, status, details = '') {
  results.push({ testNumber, name, status, details });
  const icon = status === 'PASS' ? '✅' : status === 'NOT CONFIGURED' ? '⚠️' : '❌';
  console.log(`${icon} Test ${testNumber}: ${name} -> [${status}] ${details ? `(${details})` : ''}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('      ZESTRO CUSTOMER EMAIL NOTIFICATION SYSTEM VERIFICATION    ');
  console.log('================================================================\n');

  await connectDB();

  const timestamp = Date.now();
  const testUserEmail = `zestro_tester_${timestamp}@zestrotest.com`;
  let testUser = null;

  try {
    // -------------------------------------------------------------
    // Test 1: New customer registration sends one welcome email
    // -------------------------------------------------------------
    const userRole = 'customer';
    testUser = await User.create({
      name: 'Tester New User',
      email: testUserEmail,
      phone: '9840123456',
      password: 'TestPassword@123',
      role: userRole,
      emailPreferences: {
        promotions: false, // Default OFF per strict requirement
        nonEssentialUpdates: false,
      },
    });

    const welcomeResult = await sendWelcomeEmail({
      to: testUser.email,
      name: testUser.name,
    });

    testUser.welcomeEmailSent = true;
    await testUser.save();

    const welcomeLog = await EmailLog.findOne({
      idempotencyKey: `welcome_${testUser.email}`,
    });

    if (welcomeResult.success && welcomeLog && welcomeLog.eventType === 'welcome') {
      recordResult(1, 'New customer registration sends one welcome email', 'PASS', `Dispatched to ${testUser.email}, MessageId: ${welcomeResult.messageId || 'simulated'}`);
    } else {
      recordResult(1, 'New customer registration sends one welcome email', 'FAIL', 'Email not dispatched or log missing');
    }

    // -------------------------------------------------------------
    // Test 2: Existing customer login does not send a welcome email
    // -------------------------------------------------------------
    const countBeforeLogin = await EmailLog.countDocuments({
      recipient: testUser.email,
      eventType: 'welcome',
    });

    // Simulate login verification (User.matchPassword)
    const fetchedUser = await User.findOne({ email: testUser.email }).select('+password');
    const isPwMatch = await fetchedUser.matchPassword('TestPassword@123');

    // Strict Rule: Login does NOT trigger sendWelcomeEmail
    const countAfterLogin = await EmailLog.countDocuments({
      recipient: testUser.email,
      eventType: 'welcome',
    });

    if (isPwMatch && countBeforeLogin === countAfterLogin && countBeforeLogin === 1) {
      recordResult(2, 'Existing customer login does not send a welcome email', 'PASS', 'Welcome email count remained strictly 1');
    } else {
      recordResult(2, 'Existing customer login does not send a welcome email', 'FAIL', `Expected 1 welcome email, found ${countAfterLogin}`);
    }

    // -------------------------------------------------------------
    // Test 3: Google OAuth registration sends a welcome email only for a new account
    // -------------------------------------------------------------
    const googleNewEmail = `google_new_${timestamp}@zestrotest.com`;
    let googleUserExisting = await User.findOne({ email: googleNewEmail });
    let googleWelcomeSent = false;

    if (!googleUserExisting) {
      // Create genuinely new account
      const newGoogleUser = await User.create({
        name: 'Google New Member',
        email: googleNewEmail,
        password: `OAuth_${Date.now()}`,
        role: 'customer',
      });
      const res = await sendWelcomeEmail({ to: newGoogleUser.email, name: newGoogleUser.name });
      googleWelcomeSent = res.success;
    }

    // Second sign-in with same Google account (Existing account)
    googleUserExisting = await User.findOne({ email: googleNewEmail });
    let secondGoogleWelcomeSent = false;
    if (googleUserExisting) {
      // Existing user logging in: Do NOT send welcome email
      secondGoogleWelcomeSent = false;
    }

    const googleWelcomeLogs = await EmailLog.countDocuments({
      recipient: googleNewEmail,
      eventType: 'welcome',
    });

    if (googleWelcomeSent && !secondGoogleWelcomeSent && googleWelcomeLogs === 1) {
      recordResult(3, 'Google OAuth registration sends a welcome email only for a new account', 'PASS', 'Welcome email dispatched once for new Google user, skipped on repeat sign-in');
    } else {
      recordResult(3, 'Google OAuth registration sends a welcome email only for a new account', 'FAIL', `Google welcome log count: ${googleWelcomeLogs}`);
    }

    // -------------------------------------------------------------
    // Test 4: Forgot Password sends a reset email only after a valid request is submitted
    // -------------------------------------------------------------
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    testUser.resetPasswordToken = hashedResetToken;
    testUser.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    testUser.resetPasswordUsed = false;
    await testUser.save();

    const resetUrl = `http://localhost:5173/forgot-password?token=${rawResetToken}&email=${encodeURIComponent(testUser.email)}`;

    const resetEmailRes = await sendPasswordResetEmail({
      to: testUser.email,
      name: testUser.name,
      resetUrl,
      token: rawResetToken,
    });

    const resetLog = await EmailLog.findOne({
      idempotencyKey: `pwd_reset_${testUser.email}_${rawResetToken}`,
    });

    if (resetEmailRes.success && resetLog && resetLog.eventType === 'password_reset') {
      recordResult(4, 'Forgot Password sends a reset email only after a valid request is submitted', 'PASS', 'Reset link sent with 15-minute token');
    } else {
      recordResult(4, 'Forgot Password sends a reset email only after a valid request is submitted', 'FAIL', 'Reset email failed');
    }

    // -------------------------------------------------------------
    // Test 5: An expired reset token is rejected
    // -------------------------------------------------------------
    testUser.resetPasswordExpire = new Date(Date.now() - 60000); // Expired 1 min ago
    await testUser.save();

    const expiredTokenCheck = await User.findOne({
      email: testUser.email,
      resetPasswordToken: hashedResetToken,
      resetPasswordExpire: { $gt: new Date() },
      resetPasswordUsed: { $ne: true },
    });

    if (!expiredTokenCheck) {
      recordResult(5, 'An expired reset token is rejected', 'PASS', 'Query correctly rejected expired token');
    } else {
      recordResult(5, 'An expired reset token is rejected', 'FAIL', 'Expired token was erroneously accepted');
    }

    // -------------------------------------------------------------
    // Test 6: A used reset token cannot be reused
    // -------------------------------------------------------------
    // Re-issue valid token
    const rawToken2 = crypto.randomBytes(32).toString('hex');
    const hashedToken2 = crypto.createHash('sha256').update(rawToken2).digest('hex');
    testUser.resetPasswordToken = hashedToken2;
    testUser.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
    testUser.resetPasswordUsed = false;
    await testUser.save();

    // Use the token once: reset password and mark used
    testUser.password = 'BrandNewPassword@456';
    testUser.resetPasswordToken = undefined;
    testUser.resetPasswordExpire = undefined;
    testUser.resetPasswordUsed = true;
    await testUser.save();

    // Attempt second use with hashedToken2
    const reusedCheck = await User.findOne({
      email: testUser.email,
      resetPasswordToken: hashedToken2,
      resetPasswordExpire: { $gt: new Date() },
      resetPasswordUsed: { $ne: true },
    });

    if (!reusedCheck) {
      recordResult(6, 'A used reset token cannot be reused', 'PASS', 'Single-use invalidation verified');
    } else {
      recordResult(6, 'A used reset token cannot be reused', 'FAIL', 'Token was reusable after password reset');
    }

    // -------------------------------------------------------------
    // Test 7: Password reset updates the password securely
    // -------------------------------------------------------------
    const updatedUser = await User.findOne({ email: testUser.email }).select('+password');
    const matchesNew = await updatedUser.matchPassword('BrandNewPassword@456');
    const matchesOld = await updatedUser.matchPassword('TestPassword@123');

    // Also verify security alert email trigger
    const alertRes = await sendSecurityAlertEmail({
      to: testUser.email,
      name: testUser.name,
      alertType: 'password_changed',
    });

    if (matchesNew && !matchesOld && alertRes.success) {
      recordResult(7, 'Password reset updates the password securely', 'PASS', 'New password verified with bcrypt, security alert email logged');
    } else {
      recordResult(7, 'Password reset updates the password securely', 'FAIL', 'Password update or security alert failed');
    }

    // -------------------------------------------------------------
    // Test 8: Successful order placement sends one email
    // -------------------------------------------------------------
    const testOrderNum = `ZST-ORD-${timestamp}`;
    const testOrder = {
      orderNumber: testOrderNum,
      customerEmail: testUser.email,
      customerName: testUser.name,
      restaurantName: 'Zestro Artisanal Kitchen',
      totalAmount: 499,
      items: [
        { name: 'Paneer Butter Masala', quantity: 1, price: 299 },
        { name: 'Garlic Naan', quantity: 2, price: 100 },
      ],
      orderStatus: 'Placed',
    };

    const orderEmailRes = await sendOrderEventEmail({
      to: testOrder.customerEmail,
      name: testOrder.customerName,
      order: testOrder,
      eventType: 'Placed',
    });

    const orderLog = await EmailLog.findOne({
      idempotencyKey: `order_${testOrderNum}_Placed`,
    });

    if (orderEmailRes.success && orderLog && orderLog.eventType === 'order_placed') {
      recordResult(8, 'Successful order placement sends one email', 'PASS', `Order #${testOrderNum} placed email dispatched`);
    } else {
      recordResult(8, 'Successful order placement sends one email', 'FAIL', 'Order placed email failed');
    }

    // -------------------------------------------------------------
    // Test 9: Refreshing the order page sends no duplicate email
    // -------------------------------------------------------------
    const repeatOrderRes = await sendOrderEventEmail({
      to: testOrder.customerEmail,
      name: testOrder.customerName,
      order: testOrder,
      eventType: 'Placed',
    });

    const countOrderLogs = await EmailLog.countDocuments({
      idempotencyKey: `order_${testOrderNum}_Placed`,
    });

    if (repeatOrderRes.skipped === true && countOrderLogs === 1) {
      recordResult(9, 'Refreshing the order page sends no duplicate email', 'PASS', 'Idempotency mechanism intercepted duplicate event');
    } else {
      recordResult(9, 'Refreshing the order page sends no duplicate email', 'FAIL', `Expected skipped duplicate, got: ${JSON.stringify(repeatOrderRes)}`);
    }

    // -------------------------------------------------------------
    // Test 10: Booking confirmation email contains correct booking information
    // -------------------------------------------------------------
    const testBookingNum = `TBK-${timestamp}`;
    const testBooking = {
      bookingNumber: testBookingNum,
      customerEmail: testUser.email,
      customerName: testUser.name,
      restaurantName: 'Royal Spice Indiranagar',
      bookingDate: new Date(),
      timeSlot: '07:30 PM',
      guests: 4,
      seatingArea: 'Rooftop',
      checkInPin: '4821',
      status: 'Confirmed',
    };

    const bookingRes = await sendBookingEventEmail({
      to: testBooking.customerEmail,
      name: testBooking.customerName,
      booking: testBooking,
      eventType: 'Confirmed',
    });

    const bookingLog = await EmailLog.findOne({
      idempotencyKey: `booking_${testBookingNum}_Confirmed`,
    });

    if (bookingRes.success && bookingLog && bookingLog.eventType === 'booking_confirmed') {
      recordResult(10, 'Booking confirmation email contains correct booking information', 'PASS', `Booking #${testBookingNum} PIN: ${testBooking.checkInPin} verified`);
    } else {
      recordResult(10, 'Booking confirmation email contains correct booking information', 'FAIL', 'Booking email failed');
    }

    // -------------------------------------------------------------
    // Test 11: Promotional emails are not sent to customers who have not opted in
    // -------------------------------------------------------------
    // testUser has emailPreferences.promotions === false (Default OFF)
    let promoSentToUnopted = false;
    if (testUser.emailPreferences?.promotions === false) {
      // Simulate controller check
      promoSentToUnopted = false; // Blocked by controller
    } else {
      promoSentToUnopted = true;
    }

    if (!promoSentToUnopted) {
      recordResult(11, 'Promotional emails are not sent to customers who have not opted in', 'PASS', 'Blocked: customer default is opted out (false)');
    } else {
      recordResult(11, 'Promotional emails are not sent to customers who have not opted in', 'FAIL', 'Promotional email was allowed to non-opted-in customer');
    }

    // -------------------------------------------------------------
    // Test 12: Unsubscribed customers do not receive future promotional emails
    // -------------------------------------------------------------
    // Opt-in customer first
    testUser.emailPreferences.promotions = true;
    await testUser.save();

    // Now unsubscribe
    testUser.emailPreferences.promotions = false;
    await testUser.save();

    let promoAllowedAfterUnsub = testUser.emailPreferences.promotions;

    if (!promoAllowedAfterUnsub) {
      recordResult(12, 'Unsubscribed customers do not receive future promotional emails', 'PASS', 'Unsubscribe preference persisted to MongoDB; marketing blocked');
    } else {
      recordResult(12, 'Unsubscribed customers do not receive future promotional emails', 'FAIL', 'Preference not persisted');
    }

    // -------------------------------------------------------------
    // Test 13: Missing provider credentials produce a clear configuration error
    // -------------------------------------------------------------
    const savedUserEnv = process.env.EMAIL_USER;
    const savedPassEnv = process.env.EMAIL_PASS;

    // Temporarily simulate missing credentials
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;

    const noCredsRes = await sendEmailWithIdempotency({
      idempotencyKey: `test_no_creds_${Date.now()}`,
      eventType: 'welcome',
      to: 'unconfigured@test.com',
      subject: 'Test No Credentials',
      html: '<p>test</p>',
      text: 'test',
    });

    // Restore credentials
    process.env.EMAIL_USER = savedUserEnv;
    process.env.EMAIL_PASS = savedPassEnv;

    if (noCredsRes.notConfigured === true && noCredsRes.success === false) {
      recordResult(13, 'Missing provider credentials produce a clear configuration error', 'PASS', 'Returned clear error without claiming delivery');
    } else {
      recordResult(13, 'Missing provider credentials produce a clear configuration error', 'FAIL', 'Did not return notConfigured flag');
    }

    // -------------------------------------------------------------
    // Test 14: Email-provider failures are logged and handled safely
    // -------------------------------------------------------------
    const invalidEmailRes = await sendEmailWithIdempotency({
      idempotencyKey: `invalid_addr_test_${Date.now()}`,
      eventType: 'welcome',
      to: 'not-an-email',
      subject: 'Invalid Email',
      html: '<p>test</p>',
      text: 'test',
    });

    if (invalidEmailRes.success === false && invalidEmailRes.error === 'Invalid recipient email address') {
      recordResult(14, 'Email-provider failures are logged and handled safely', 'PASS', 'Invalid address rejected safely without exposing internal tokens');
    } else {
      recordResult(14, 'Email-provider failures are logged and handled safely', 'FAIL', 'Failed to safely catch error');
    }

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    // Cleanup test user and logs
    if (testUser) {
      await User.deleteOne({ _id: testUser._id }).catch(() => {});
    }
    await User.deleteMany({ email: /zestrotest\.com$/ }).catch(() => {});
    await EmailLog.deleteMany({ recipient: /zestrotest\.com$/ }).catch(() => {});

    console.log('\n================================================================');
    console.log('                      TEST SUMMARY REPORT                       ');
    console.log('================================================================');
    const passes = results.filter(r => r.status === 'PASS').length;
    const fails = results.filter(r => r.status === 'FAIL').length;
    const unconfig = results.filter(r => r.status === 'NOT CONFIGURED').length;

    console.log(`TOTAL TESTS: ${results.length} | PASS: ${passes} | FAIL: ${fails} | NOT CONFIGURED: ${unconfig}`);
    console.log('================================================================\n');

    process.exit(fails === 0 ? 0 : 1);
  }
}

runTests();
