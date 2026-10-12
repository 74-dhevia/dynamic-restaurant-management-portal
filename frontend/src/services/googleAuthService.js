/**
 * Google Identity Services & OAuth 2.0 integration for ZESTRO.
 * Uses official Google GIS script (https://accounts.google.com/gsi/client).
 * Securely extracts profile name, email, avatar image, and verified sub ID.
 */

const GOOGLE_CLIENT_ID = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || '';

let scriptLoadingPromise = null;

/**
 * Dynamically load Google Identity Services library
 */
export function loadGoogleScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not defined'));
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);

  if (!scriptLoadingPromise) {
    scriptLoadingPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById('google-identity-services');
      if (existingScript) {
        existingScript.onload = () => resolve(window.google?.accounts?.id);
        existingScript.onerror = (e) => reject(e);
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          resolve(window.google.accounts.id);
        } else {
          reject(new Error('Google Identity Services failed to initialize'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.body.appendChild(script);
    });
  }

  return scriptLoadingPromise;
}

/**
 * Parse Google JWT credential token payload
 */
export function parseGoogleCredential(credential) {
  try {
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return {
      id: `google_${parsed.sub}`,
      email: parsed.email,
      fullName: parsed.name,
      firstName: parsed.given_name,
      lastName: parsed.family_name,
      avatar: parsed.picture,
      emailVerified: parsed.email_verified,
    };
  } catch (err) {
    console.error('Error parsing Google credential:', err);
    return null;
  }
}

/**
 * Initialize Google Identity Services
 */
export async function initializeGoogleSignIn(onSuccess, onError) {
  const clientId = getGoogleClientId();
  if (!clientId) {
    return { configured: false };
  }

  try {
    const googleId = await loadGoogleScript();
    googleId.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          const user = parseGoogleCredential(response.credential);
          if (user) {
            onSuccess(user, response.credential);
          } else {
            onError('Could not parse Google user profile');
          }
        } else {
          onError('No credentials received from Google');
        }
      },
      error_callback: (err) => {
        onError(err?.message || 'Google authentication error');
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    return { configured: true };
  } catch (err) {
    onError(err.message || 'Google Identity Service failed to load');
    return { configured: false, error: err };
  }
}

/**
 * Trigger Google Sign In Prompt or Token Flow
 */
export async function promptGoogleSignIn(onSuccess, onError) {
  const clientId = getGoogleClientId();
  if (!clientId) {
    return { configured: false, reason: 'MISSING_CLIENT_ID' };
  }

  try {
    await loadGoogleScript();

    // Prefer OAuth2 Token Client for button clicks (standard Google Account picker popup)
    if (window.google?.accounts?.oauth2) {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            onError(tokenResponse.error_description || tokenResponse.error);
            return;
          }
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            if (!res.ok) {
              throw new Error(`Failed to fetch user profile (${res.status})`);
            }
            const data = await res.json();
            const user = {
              id: `google_${data.sub}`,
              email: data.email,
              fullName: data.name || `${data.given_name || ''} ${data.family_name || ''}`.trim() || 'Google User',
              firstName: data.given_name || data.name?.split(' ')[0] || '',
              lastName: data.family_name || data.name?.split(' ').slice(1).join(' ') || '',
              avatar: data.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              emailVerified: data.email_verified,
            };
            onSuccess(user, tokenResponse.access_token);
          } catch (err) {
            console.error('Failed to get user profile from Google:', err);
            onError('Could not fetch Google profile: ' + (err.message || 'Network error'));
          }
        },
        error_callback: (err) => {
          onError(err?.message || 'Google Sign-In popup closed or failed');
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
      return { configured: true };
    }

    // Fallback: One Tap prompt if oauth2 is not loaded
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          onError('Google Sign-In prompt was not displayed: ' + notification.getNotDisplayedReason());
        } else if (notification.isSkippedMoment()) {
          onError('Google Sign-In was cancelled or skipped: ' + notification.getSkippedReason());
        } else if (notification.isDismissedMoment()) {
          onError('Google Sign-In prompt was dismissed');
        }
      });
      return { configured: true };
    }

    onError('Google Identity Services not ready');
    return { configured: false };
  } catch (err) {
    onError(err.message || 'Google Sign-In failed');
    return { configured: false, error: err };
  }
}

export function getGoogleClientId() {
  return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || GOOGLE_CLIENT_ID || '';
}

export default {
  loadGoogleScript,
  parseGoogleCredential,
  initializeGoogleSignIn,
  promptGoogleSignIn,
  getGoogleClientId,
};
