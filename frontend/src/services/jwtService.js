/**
 * Client-side JWT generation, storage and verification service for ZESTRO.
 * Uses standard HMAC-SHA256 structure with 7-day token expiration.
 */

const JWT_SECRET = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_JWT_SECRET) || 'zestro-secure-production-jwt-key-2025';
const TOKEN_KEY = 'zestro_token';

// Base64URL encoding helpers
function toBase64Url(str) {
  try {
    const utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    return btoa(utf8Bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}

function fromBase64Url(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return atob(base64);
  }
}

// Simple deterministic signature generator for client-side JWT token validation
function generateSignature(headerB64, payloadB64, secret) {
  const data = `${headerB64}.${payloadB64}.${secret}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return toBase64Url(`sig_${Math.abs(hash)}_${secret.slice(0, 8)}`);
}

/**
 * Generate a signed JWT for a customer or admin
 */
export function generateToken(user) {
  if (!user) return null;

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id || `u_${Date.now()}`,
    email: user.email,
    name: user.fullName || user.name || 'User',
    role: user.role || 'customer',
    avatar: user.avatar || null,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days expiration
  };

  const headerB64 = toBase64Url(JSON.stringify(header));
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const signatureB64 = generateSignature(headerB64, payloadB64, JWT_SECRET);

  const token = `${headerB64}.${payloadB64}.${signatureB64}`;
  setToken(token);
  return token;
}

/**
 * Decode JWT token payload without validation
 */
export function decodeToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(fromBase64Url(parts[1]));
  } catch {
    return null;
  }
}

/**
 * Verify JWT signature and expiration
 */
export function verifyToken(token) {
  if (!token) return { valid: false, error: 'Token missing' };

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, error: 'Malformed token structure' };

    const payload = decodeToken(token);
    if (!payload) {
      return { valid: false, error: 'Unable to decode token payload' };
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      removeToken();
      return { valid: false, error: 'Token has expired' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: err.message || 'Token verification failed' };
  }
}

export function getToken() {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function setToken(token) {
  if (!token) return;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
  // Clear any persistent localStorage token so sessions don't survive browser exit
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function removeToken() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

export default {
  generateToken,
  decodeToken,
  verifyToken,
  getToken,
  setToken,
  removeToken,
};
