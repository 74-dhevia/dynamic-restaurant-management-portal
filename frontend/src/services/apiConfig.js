/**
 * Centralized API configuration for ZESTRO.
 * Dynamically resolves the API base URL so the website works seamlessly on:
 * - Localhost desktop browser (http://localhost:5173 -> http://localhost:5001/api)
 * - Mobile phones on same Wi-Fi (http://<LAN_IP>:5173 -> http://<LAN_IP>:5001/api)
 * - Custom configured VITE_API_URL environment variables
 */

export function getApiBaseUrl() {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL;

  // 1. If explicit production API URL is set via environment variable (e.g. Render / external API)
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // 2. Resolve based on current browser window location
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, origin } = window.location;

    // Check if accessing from local network IP (e.g. mobile phone on Wi-Fi: 192.168.x.x, 10.x.x.x, 172.x.x.x)
    const isLanIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) && hostname !== '127.0.0.1';
    if (isLanIp) {
      const port = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_PORT) || 5001;
      return `http://${hostname}:${port}/api`;
    }

    // Check if running on localhost desktop
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocalhost) {
      // Production deployed domain (e.g., https://zestro.vercel.app)
      // Route to same-origin /api or configured envUrl
      return envUrl || `${origin}/api`;
    }
  }

  return envUrl || 'http://localhost:5001/api';
}

export default getApiBaseUrl;
