import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  sendWelcomeNotification,
  sendOffersNotification,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset,
  forgotPasswordRequestLink,
  forgotPasswordVerifyToken,
  forgotPasswordResetWithToken,
  getEmailPreferences,
  updateEmailPreferences,
  unsubscribeEmail,
  googleAuth,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/welcome-email', sendWelcomeNotification);
router.post('/offers-email', sendOffersNotification);

// Section 3: Secure password recovery with cryptographically secure single-use token
router.post('/forgot-password/request-link', forgotPasswordRequestLink);
router.post('/forgot-password/verify-token', forgotPasswordVerifyToken);
router.post('/forgot-password/reset-with-token', forgotPasswordResetWithToken);

// Password recovery / OTP routes (preserved for dual-channel support)
router.post('/forgot-password/send-otp', forgotPasswordSendOtp);
router.post('/forgot-password/verify-otp', forgotPasswordVerifyOtp);
router.post('/forgot-password/reset-password', forgotPasswordReset);

// Section 6 & 10: 1-click Unsubscribe endpoint (Public)
router.post('/unsubscribe', unsubscribeEmail);
router.get('/unsubscribe', unsubscribeEmail);

// Private routes (JWT protected)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Section 10: Customer Email Preferences (JWT protected)
router.get('/email-preferences', protect, getEmailPreferences);
router.put('/email-preferences', protect, updateEmailPreferences);

// Role-protected test route
router.get('/admin-only', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: Access granted to admin resource',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

export default router;
