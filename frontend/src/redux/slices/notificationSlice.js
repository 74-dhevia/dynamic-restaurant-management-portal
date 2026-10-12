import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getToken } from '../../services/jwtService';
import { getApiBaseUrl } from '../../services/apiConfig';

const API_BASE_URL = getApiBaseUrl();

/**
 * Fetch real notifications from MongoDB Atlas backend for authenticated customer/user
 */
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) {
        return [];
      }

      const res = await fetch(`${API_BASE_URL}/notifications?limit=50`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return rejectWithValue(errData.message || 'Failed to fetch notifications');
      }

      const data = await res.json();
      return (data.data || []).map(doc => ({
        id: doc._id || doc.id,
        type: doc.type || 'system',
        title: doc.title,
        message: doc.message,
        actionUrl: doc.actionUrl || '',
        read: Boolean(doc.read),
        at: doc.createdAt || new Date().toISOString(),
        entityId: doc.entityId || '',
      }));
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Mark a single notification as read in backend
 */
export const markNotificationRead = createAsyncThunk(
  'notification/markNotificationRead',
  async (id, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Mark all notifications as read in backend
 */
export const markAllNotificationsRead = createAsyncThunk(
  'notification/markAllNotificationsRead',
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/notifications/read-all`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    addNotification(state, action) {
      state.items.unshift({
        id: `n_${Date.now()}_${Math.random()}`,
        read: false,
        at: new Date().toISOString(),
        ...action.payload,
      });
    },
    markRead(state, action) {
      const n = state.items.find(i => i.id === action.payload);
      if (n) n.read = true;
    },
    markAllRead(state) {
      state.items.forEach(i => {
        i.read = true;
      });
    },
    deleteNotification(state, action) {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find(i => i.id === action.payload);
        if (item) item.read = true;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach(i => {
          i.read = true;
        });
      });
  },
});

export const { addNotification, markRead, markAllRead, deleteNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
