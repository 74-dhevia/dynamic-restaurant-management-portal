import { getToken } from './jwtService';
import { getApiBaseUrl } from './apiConfig';

const API_BASE_URL = getApiBaseUrl();

export const incidentApiService = {
  /**
   * Report a new kitchen incident to backend
   * POST /api/incidents
   */
  async createIncident(incidentData) {
    try {
      const token = getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/incidents`, {
        method: 'POST',
        headers,
        body: JSON.stringify(incidentData),
      });

      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.warn('[incidentApiService] Create incident failed (offline fallback active):', err.message);
      return { ok: false, error: err.message };
    }
  },

  /**
   * Fetch all incidents from backend
   * GET /api/incidents
   */
  async getIncidents(restaurantId) {
    try {
      const url = restaurantId
        ? `${API_BASE_URL}/incidents?restaurantId=${encodeURIComponent(restaurantId)}`
        : `${API_BASE_URL}/incidents`;

      const res = await fetch(url);
      const data = await res.json();
      return { ok: res.ok, status: res.status, data: data.data || [] };
    } catch (err) {
      console.warn('[incidentApiService] Get incidents failed (offline fallback active):', err.message);
      return { ok: false, error: err.message, data: [] };
    }
  },

  /**
   * Update resolution status of an incident
   * PATCH /api/incidents/:id/status
   */
  async updateStatus(id, { status, resolutionNote }) {
    try {
      const token = getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/incidents/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status, resolutionNote }),
      });

      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.warn('[incidentApiService] Update incident status failed:', err.message);
      return { ok: false, error: err.message };
    }
  },
};

export default incidentApiService;
