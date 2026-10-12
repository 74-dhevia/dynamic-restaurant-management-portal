/**
 * Frontend Auth API Service for ZESTRO.
 * Connects React frontend components to the Express + MongoDB Atlas backend.
 */

import { getToken } from './jwtService';
import { getApiBaseUrl } from './apiConfig';

const API_BASE_URL = getApiBaseUrl();

export const authApiService = {
  /**
   * Register a new user with real MongoDB Atlas backend
   * POST /api/auth/register
   */
  async register({ name, fullName, email, phone, password, role = 'customer' }) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name || fullName,
          email,
          phone,
          password,
          role,
        }),
      });

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.warn('[authApiService] Backend register request failed:', err.message);
      return { ok: false, status: 0, error: err.message };
    }
  },

  /**
   * Login user with real MongoDB Atlas backend
   * POST /api/auth/login
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.warn('[authApiService] Backend login request failed:', err.message);
      return { ok: false, status: 0, error: err.message };
    }
  },

  /**
   * Fetch current authenticated user with JWT
   * GET /api/auth/me
   */
  async getMe(token) {
    if (!token) return { ok: false, error: 'No token provided' };
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.warn('[authApiService] Backend /me request failed:', err.message);
      return { ok: false, status: 0, error: err.message };
    }
  },

  /**
   * Dispatch a real Welcome Email to the user's Gmail inbox via backend Nodemailer
   * POST /api/auth/welcome-email
   */
  async sendWelcomeEmail({ email, name, role = 'customer', provider = 'email' }) {
    if (!email) return { ok: false, error: 'No email provided' };
    try {
      const response = await fetch(`${API_BASE_URL}/auth/welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, role, provider }),
      });
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.warn('[authApiService] Backend welcome email request failed:', err.message);
      return { ok: false, status: 0, error: err.message };
    }
  },

  /**
   * Dispatch Promotional Offers & Discount Vouchers email to the user's notification email
   * POST /api/auth/offers-email
   */
  async sendOffersEmail({ email, name, offers, customMessage }) {
    if (!email) return { ok: false, error: 'No email provided' };
    try {
      const response = await fetch(`${API_BASE_URL}/auth/offers-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, offers, customMessage }),
      });
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.warn('[authApiService] Send offers email request failed:', err.message);
      return { ok: false, status: 0, error: err.message };
    }
  },

  /**
   * Request Password Reset OTP via WhatsApp or Email
   * POST /api/auth/forgot-password/send-otp
   */
  async sendPasswordResetOtp({ identifier, channel = 'email' }) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, channel }),
      });

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.warn('[authApiService] Send OTP request failed:', err.message);
      return { ok: false, status: 0, error: err.message };
    }
  },

  /**
   * Verify the 6-digit OTP
   * POST /api/auth/forgot-password/verify-otp
   */
  async verifyPasswordResetOtp({ identifier, otp }) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, otp }),
      });

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.warn('[authApiService] Verify OTP request failed:', err.message);
      return { ok: false, status: 0, error: err.message };
    }
  },

  /**
   * Reset Password with OTP & New Password
   * POST /api/auth/forgot-password/reset-password
   */
  async resetPasswordWithOtp({ identifier, otp, newPassword }) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, otp, newPassword }),
      });

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.warn('[authApiService] Reset password request failed:', err.message);
      return { ok: false, status: 0, error: err.message };
    }
  },

  /**
   * Request secure single-use password reset link via email (Section 3 requirement)
   * POST /api/auth/forgot-password/request-link
   */
  async requestPasswordResetLink(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/request-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.warn('[authApiService] Request reset link failed:', err.message);
      return { ok: false, status: 0, error: err.message };
    }
  },

  /**
   * Verify password reset token from email link
   * POST /api/auth/forgot-password/verify-token
   */
  async verifyPasswordResetToken({ token, email }) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.warn('[authApiService] Verify token failed:', err.message);
      return { ok: false, status: 0, error: err.message };
    }
  },

  /**
   * Reset password using secure time-limited token
   * POST /api/auth/forgot-password/reset-with-token
   */
  async resetPasswordWithToken({ token, email, newPassword }) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/reset-with-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email, newPassword }),
      });

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.warn('[authApiService] Reset password with token failed:', err.message);
      return { ok: false, status: 0, error: err.message };
    }
  },

  /**
   * Fetch saved customer email preferences from backend (Section 10)
   * GET /api/auth/email-preferences
   */
  async getEmailPreferences() {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/auth/email-preferences`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.warn('[authApiService] Get email preferences failed:', err.message);
      return { ok: false, status: 0, error: err.message };
    }
  },

  /**
   * Update customer email preferences in database (Section 10)
   * PUT /api/auth/email-preferences
   */
  async updateEmailPreferences(preferences) {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/auth/email-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.warn('[authApiService] Update email preferences failed:', err.message);
      return { ok: false, status: 0, error: err.message };
    }
  },

  /**
   * 1-click Unsubscribe from promotional marketing emails
   * POST /api/auth/unsubscribe
   */
  async unsubscribe(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.warn('[authApiService] Unsubscribe failed:', err.message);
      return { ok: false, status: 0, error: err.message };
    }
  },
};

export default authApiService;
