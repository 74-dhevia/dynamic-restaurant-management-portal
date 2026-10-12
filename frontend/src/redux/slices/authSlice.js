import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { generateToken, setToken, removeToken, verifyToken, getToken } from '../../services/jwtService.js';
import authApiService from '../../services/authApiService.js';

// 5 Pre-configured Seed Customer Accounts + Admin + Owner
export const SEED_USERS = [
  {
    id: 'u_dheiva',
    fullName: 'Dheiva Lakshmi',
    email: 'dheiva@example.com',
    altEmail: 'dheiva.customer@example.com',
    phone: '+91 98401 23456',
    password: 'Dheiva@123',
    role: 'customer',
    dinePoints: 2150,
    tier: 'Platinum',
    status: 'Active',
    createdAt: '2024-01-10T10:00:00.000Z',
    lastActive: 'Today, 10:42 AM',
    birthday: '1994-06-15',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    addresses: [
      { id: 'addr_d1', label: 'Home', address: '12B Green Valley, 100ft Road, Indiranagar, Bengaluru - 560038' },
      { id: 'addr_d2', label: 'Office', address: 'Prestige Tech Cloud, 4th Floor, Whitefield, Bengaluru' }
    ],
    favoriteCuisines: ['Biriyani', 'South Indian', 'Chettinad'],
    dietaryPreference: 'Non-Veg',
  },
  {
    id: 'u_karthik',
    fullName: 'Karthik Raja',
    email: 'karthik@example.com',
    phone: '+91 98234 56789',
    password: 'Karthik@123',
    role: 'customer',
    dinePoints: 410,
    tier: 'Silver',
    status: 'Active',
    createdAt: '2024-02-14T11:20:00.000Z',
    lastActive: 'Yesterday, 4:15 PM',
    birthday: '1993-03-21',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    addresses: [
      { id: 'addr_k1', label: 'Home', address: '88 Diamond District, Old Airport Road, Bengaluru' }
    ],
    favoriteCuisines: ['North Indian', 'Chinese'],
    dietaryPreference: 'Non-Veg',
  },
  {
    id: 'u_priya',
    fullName: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91 98451 23456',
    password: 'Priya@123',
    role: 'customer',
    dinePoints: 540,
    tier: 'Gold',
    status: 'Active',
    createdAt: '2024-01-18T12:00:00.000Z',
    lastActive: 'Today, 9:20 AM',
    birthday: '1995-04-12',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    addresses: [
      { id: 'addr_1', label: 'Home', address: '12B Green Valley, 100ft Road, Indiranagar, Bengaluru - 560038' },
      { id: 'addr_2', label: 'Office', address: 'Tower B, Bagmane Tech Park, CV Raman Nagar, Bengaluru' }
    ],
    favoriteCuisines: ['South Indian', 'Biriyani', 'Desserts'],
    dietaryPreference: 'Non-Veg',
  },
  {
    id: 'u_rahul',
    fullName: 'Rahul Verma',
    email: 'rahul@example.com',
    phone: '+91 98765 43210',
    password: 'Rahul@123',
    role: 'customer',
    dinePoints: 320,
    tier: 'Silver',
    birthday: '1992-08-23',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    addresses: [
      { id: 'addr_3', label: 'Office', address: 'Tech Park Tower 4, Prestige Tech Cloud, Whitefield, Bengaluru' }
    ],
    favoriteCuisines: ['Biriyani', 'Fast Food', 'Beverages'],
    dietaryPreference: 'Non-Veg',
  },
  {
    id: 'u_ananya',
    fullName: 'Ananya Patel',
    email: 'ananya@example.com',
    phone: '+91 97123 45678',
    password: 'Ananya@123',
    role: 'customer',
    dinePoints: 1150,
    tier: 'Platinum',
    birthday: '1998-11-05',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    addresses: [
      { id: 'addr_4', label: 'Home', address: '45 Lake View Residency, 5th Block, Koramangala, Bengaluru' }
    ],
    favoriteCuisines: ['Veg', 'South Indian', 'Chinese'],
    dietaryPreference: 'Vegetarian',
  },
  {
    id: 'u_vikram',
    fullName: 'Vikram Singh',
    email: 'vikram@example.com',
    phone: '+91 99887 76655',
    password: 'Vikram@123',
    role: 'customer',
    dinePoints: 180,
    tier: 'Bronze',
    birthday: '1990-01-18',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    addresses: [
      { id: 'addr_5', label: 'Home', address: '77 Heritage Enclave, 4th Block, Jayanagar, Bengaluru' }
    ],
    favoriteCuisines: ['Non-Veg', 'Kothu Parotta', 'Chettinad'],
    dietaryPreference: 'Non-Veg',
  },
  {
    id: 'u_sneha',
    fullName: 'Sneha Rao',
    email: 'sneha@example.com',
    phone: '+91 96543 21890',
    password: 'Sneha@123',
    role: 'customer',
    dinePoints: 620,
    tier: 'Gold',
    birthday: new Date().toISOString().slice(5, 10) === '09-22' ? '1996-09-22' : '1996-09-22',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    addresses: [
      { id: 'addr_6', label: 'Apartment', address: '201 Palms Court, Sector 2, HSR Layout, Bengaluru' }
    ],
    favoriteCuisines: ['Bakery', 'Tea & Coffee', 'Chinese'],
    dietaryPreference: 'Vegetarian',
  },
  {
    id: 'admin1',
    fullName: 'Dheivalakshmi',
    email: 'dheivalakshmi7@gmail.com',
    phone: '+91 98401 23456',
    password: 'Rohini#7',
    role: 'admin',
    dinePoints: 9999,
    tier: 'Super Admin',
    createdAt: '2024-01-15T09:00:00.000Z',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    addresses: [],
  },
  {
    id: 'owner1',
    fullName: 'Restaurant Owner (A2B)',
    email: 'owner@zestro.com',
    phone: '+91 90000 00002',
    password: 'owner123',
    role: 'owner',
    restaurantId: 'r1',
    dinePoints: 5000,
    tier: 'Partner',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    addresses: [],
  },
  {
    id: 'chef_1',
    fullName: 'Chef Murugesan P.',
    email: 'murugesan.chef@zestro.com',
    phone: '+91 98421 88901',
    password: 'Chef@123',
    role: 'chef',
    restaurantId: 'r2',
    restaurantName: 'Dindigul Thalappakatti',
    specialization: 'Biriyani Master & Woodfire Grills',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&auto=format&fit=crop&q=80',
    availability: 'Available',
    tier: 'Executive Chef',
    addresses: [],
  },
  {
    id: 'chef_2',
    fullName: 'Chef S. Meenakshi Sundaram',
    email: 'meenakshi.chef@zestro.com',
    phone: '+91 97890 12340',
    password: 'Chef@123',
    role: 'chef',
    restaurantId: 'r1',
    restaurantName: 'A2B - Adyar Ananda Bhavan',
    specialization: 'Traditional South Indian Tiffin & Filter Coffee',
    avatar: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=200&auto=format&fit=crop&q=80',
    availability: 'Available',
    tier: 'Master Tiffin Chef',
    addresses: [],
  },
  {
    id: 'chef_3',
    fullName: 'Chef Arulmozhi Nathan',
    email: 'arulmozhi.chef@zestro.com',
    phone: '+91 94432 55678',
    password: 'Chef@123',
    role: 'chef',
    restaurantId: 'r3',
    restaurantName: 'Sree Annapoorna',
    specialization: 'Tirunelveli Halwa & Traditional Sweets',
    avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=200&auto=format&fit=crop&q=80',
    availability: 'Available',
    tier: 'Sweet Artisan',
    addresses: [],
  },
  {
    id: 'chef_4',
    fullName: 'Chef David Raj',
    email: 'david.chef@zestro.com',
    phone: '+91 96231 99012',
    password: 'Chef@123',
    role: 'chef',
    restaurantId: 'r4',
    restaurantName: 'Junior Kuppanna',
    specialization: 'Kothu Parotta & Midnight Street Wok',
    avatar: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=200&auto=format&fit=crop&q=80',
    availability: 'Available',
    tier: 'Wok Master',
    addresses: [],
  },
  {
    id: 'chef_std',
    fullName: 'Chef Murugesan P.',
    email: 'chef@zestro.com',
    phone: '+91 98421 88901',
    password: 'Chef@123',
    role: 'chef',
    restaurantId: 'r2',
    restaurantName: 'Dindigul Thalappakatti',
    specialization: 'Biriyani Master & Grills',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&auto=format&fit=crop&q=80',
    availability: 'Available',
    tier: 'Executive Chef',
    addresses: [],
  },
  {
    id: 'delivery_std',
    fullName: 'Suresh Kumar (Delivery Partner)',
    email: 'delivery@zestro.com',
    phone: '+91 97890 55443',
    password: 'Delivery@123',
    role: 'deliveryPartner',
    tier: 'Fleet Partner',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    addresses: [],
  },
  {
    id: 'manager_std',
    fullName: 'Karthik Raman (Manager)',
    email: 'manager@zestro.com',
    phone: '+91 98940 11223',
    password: 'Manager@123',
    role: 'restaurantManager',
    tier: 'General Manager',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    addresses: [],
  },
  {
    id: 'customer_std',
    fullName: 'Priya Sharma',
    email: 'customer@zestro.com',
    phone: '+91 98765 43210',
    password: 'Customer@123',
    role: 'customer',
    tier: 'Gold',
    dinePoints: 500,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    addresses: [
      { id: 'addr_c1', label: 'Home', address: '12B Green Valley, Kovilpatti' }
    ],
  },
];

/**
 * ZESTRO AUTHENTICATION LAYER — DEVELOPMENT & ARCHITECTURE SPECIFICATION
 * 
 * CURRENT STATUS (FRONTEND DEVELOPMENT MODE):
 * - Backend server is not implemented yet.
 * - Authentication state is managed via Redux + LocalStorage with client-side JWT token generation.
 * - Dedicated Admin credentials:
 *     Email:    dheivalakshmi7@gmail.com
 *     Password: Rohini#7 (stored only in separated dev auth layer; NEVER exposed in UI/tables/logs/profiles)
 * 
 * FUTURE PRODUCTION BACKEND AUTHENTICATION PATH:
 * - Client (React) -> Express API -> MongoDB
 * - Passwords securely hashed with bcrypt / argon2 (never stored in plaintext).
 * - Backend endpoint POST /api/admin/auth/login validates credentials and role === 'admin'.
 * - Backend signs JWT with payload: { sub: userId, role: 'admin', iat, exp }.
 * - Protected Admin API requests require Authorization: Bearer <token>.
 * - Server verifies JWT signature + User ID + Admin Role before granting access.
 */
export function isAdminEmail(email) {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return (
    clean === 'dheivalakshmi7@gmail.com' ||
    clean === 'dheivalakshmi@7gmail.com' ||
    clean === 'dheivalakshmi@gmail.com' ||
    clean.startsWith('dheivalakshmi')
  );
}

function loadUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem('zestro_users'));
    if (stored && Array.isArray(stored) && stored.length > 0) {
      // Remove any legacy admin accounts (e.g. admin@zestro.com / admin@123)
      const sanitized = stored.filter(u => u.email !== 'admin@zestro.com');
      // Ensure canonical admin identity - strictly only dheivalakshmi is admin
      const merged = sanitized.map(u => {
        if (isAdminEmail(u.email)) {
          return {
            ...u,
            email: 'dheivalakshmi7@gmail.com',
            fullName: u.fullName || 'Dheivalakshmi',
            password: u.password || 'Rohini#7',
            phone: u.phone || '+91 98401 23456',
            tier: 'Super Admin',
            role: 'admin',
          };
        }
        // Demote any other user if they have admin role
        if (u.role === 'admin') {
          return { ...u, role: 'customer' };
        }
        return u;
      });
      SEED_USERS.forEach(seed => {
        const idx = merged.findIndex(u => (u.email || '').toLowerCase() === seed.email.toLowerCase() || u.id === seed.id);
        if (idx === -1) {
          merged.push(seed);
        } else {
          merged[idx] = { ...merged[idx], password: seed.password, role: seed.role, status: 'Active' };
        }
      });
      // Ensure all customers have status defaulted to 'Active'
      merged.forEach(u => {
        if (u.role === 'customer' && !u.status) {
          u.status = 'Active';
        }
      });
      localStorage.setItem('zestro_users', JSON.stringify(merged));
      return merged;
    }
    const withStatus = SEED_USERS.map(u => ({ ...u, status: u.status || 'Active' }));
    localStorage.setItem('zestro_users', JSON.stringify(withStatus));
    return withStatus;
  } catch {
    return SEED_USERS;
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem('zestro_users', JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users:', e);
  }
}

// Helper: strip password from runtime client state
export function sanitizeUser(u) {
  if (!u) return null;
  const { password, ...safe } = u;
  return safe;
}

// Initial session check with JWT validation (sessionStorage only - auto-logout when leaving website)
const initialAuthSession = (() => {
  try {
    // Purge persistent localStorage auth to guarantee sessions terminate when browser/website is closed
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('zestro_auth');
      localStorage.removeItem('zestro_token');
    }
    const rawUser = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('zestro_auth') : null;
    const token = getToken();
    if (rawUser && token) {
      const { valid } = verifyToken(token);
      if (valid) {
        return { user: sanitizeUser(JSON.parse(rawUser)), token };
      }
    }
    // Clean up stale or invalid session
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('zestro_auth');
      sessionStorage.removeItem('zestro_token');
    }
    return { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
})();

const initialState = {
  currentUser: initialAuthSession.user,
  token: initialAuthSession.token,
  isAuthenticated: !!initialAuthSession.user,
  users: loadUsers(),
  otpPending: null,
  loginError: null,
  registerError: null,
  lastRegisteredEmail: null,
  isProcessing: false,
};

function applyAuthSuccess(state, rawUser, token) {
  if (!rawUser) return;
  const safeUser = {
    ...rawUser,
    id: rawUser.id || rawUser._id || `u_${Date.now()}`,
    fullName: rawUser.fullName || rawUser.name || 'User',
    name: rawUser.name || rawUser.fullName || 'User',
    email: rawUser.email,
    phone: rawUser.phone || '',
    role: rawUser.role || 'customer',
    avatar: rawUser.avatar || rawUser.profileImage || (rawUser.role === 'admin'
      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      : rawUser.role === 'chef'
      ? 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
    dinePoints: rawUser.dinePoints ?? 100,
    tier: rawUser.tier || (rawUser.role === 'admin' ? 'Super Admin' : rawUser.role === 'chef' ? 'Executive Chef' : 'Bronze'),
    addresses: rawUser.addresses || [],
    status: 'Active',
  };

  const safe = sanitizeUser(safeUser);
  state.currentUser = safe;
  state.token = token;
  state.isAuthenticated = true;
  state.loginError = null;
  state.registerError = null;
  state.isProcessing = false;

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('zestro_auth', JSON.stringify(safe));
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('zestro_auth');
  }
  setToken(token);
}

// Async Thunk: Login with backend API
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue, getState }) => {
    const normalizedEmail = (email || '').toLowerCase().trim();

    try {
      const res = await authApiService.login(normalizedEmail, password);
      if (res.ok && res.data?.success) {
        return { user: res.data.user, token: res.data.token };
      }
      if (res.status === 401 || res.status === 400 || res.status === 403) {
        return rejectWithValue(res.data?.message || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      console.warn('[authSlice] Real backend connection issue, checking fallback:', err);
    }

    const state = getState();
    const user = state.auth.users.find(
      u => u.email.toLowerCase() === normalizedEmail && u.password === password
    );
    if (!user) {
      return rejectWithValue('Invalid email or password. Please try again.');
    }
    if (user.status === 'Inactive' || user.isActive === false) {
      return rejectWithValue('Your account is currently inactive. Please contact support.');
    }
    const token = generateToken(user);
    return { user, token };
  }
);

// Async Thunk: Register with backend API
export const register = createAsyncThunk(
  'auth/register',
  async ({ fullName, name, email, phone, password, avatar }, { rejectWithValue, getState }) => {
    const userName = name || fullName;
    const normalizedEmail = (email || '').toLowerCase().trim();

    try {
      const res = await authApiService.register({
        name: userName,
        email: normalizedEmail,
        phone,
        password,
        role: 'customer',
      });
      if (res.ok && res.data?.success) {
        return {
          user: {
            ...res.data.user,
            fullName: res.data.user.name,
            phone: phone || '',
            avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            dinePoints: 100,
            tier: 'Bronze',
          },
          token: res.data.token,
        };
      }
      if (res.status === 400) {
        return rejectWithValue(res.data?.message || 'Email already registered');
      }
    } catch (err) {
      console.warn('[authSlice] Real backend connection issue, checking fallback:', err);
    }

    const state = getState();
    const exists = state.auth.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (exists) {
      return rejectWithValue('An account already exists with this email address. Multiple users cannot register with the same email ID.');
    }
    const user = {
      id: `u_${Date.now()}`,
      fullName: userName,
      name: userName,
      email: normalizedEmail,
      phone: phone || '',
      password,
      role: 'customer',
      dinePoints: 100,
      tier: 'Bronze',
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    };
    const token = generateToken(user);
    return { user, token };
  }
);

// Async Thunk: Admin Login with backend API
export const adminLogin = createAsyncThunk(
  'auth/adminLogin',
  async ({ email, password }, { rejectWithValue, getState }) => {
    const normalizedEmail = (email || '').toLowerCase().trim();

    try {
      const res = await authApiService.login(normalizedEmail, password);
      if (res.ok && res.data?.success) {
        if (res.data.user.role !== 'admin') {
          return rejectWithValue('Access denied: You do not have administrator privileges.');
        }
        return { user: res.data.user, token: res.data.token };
      }
      if (res.status === 401 || res.status === 400) {
        return rejectWithValue('Invalid admin email or password.');
      }
    } catch (err) {
      console.warn('[authSlice] Real backend connection issue, checking fallback:', err);
    }

    const state = getState();
    const user = state.auth.users.find(
      u => u.email.toLowerCase() === normalizedEmail && u.password === password && u.role === 'admin'
    );
    if (!user) {
      return rejectWithValue('Invalid admin email or password.');
    }
    const token = generateToken(user);
    return { user, token };
  }
);

// Async Thunk: Chef Login with backend API
export const chefLogin = createAsyncThunk(
  'auth/chefLogin',
  async ({ email, password }, { rejectWithValue, getState }) => {
    const normalizedEmail = (email || '').toLowerCase().trim();

    try {
      const res = await authApiService.login(normalizedEmail, password);
      if (res.ok && res.data?.success) {
        if (res.data.user.role !== 'chef' && res.data.user.role !== 'admin') {
          return rejectWithValue('Invalid chef email or password. Please verify credentials with Kitchen Operations.');
        }
        return { user: res.data.user, token: res.data.token };
      }
      if (res.status === 401 || res.status === 400) {
        return rejectWithValue('Invalid chef email or password. Please verify credentials with Kitchen Operations.');
      }
    } catch (err) {
      console.warn('[authSlice] Real backend connection issue, checking fallback:', err);
    }

    const state = getState();
    const user = state.auth.users.find(
      u => u.email.toLowerCase() === normalizedEmail && u.password === password && (u.role === 'chef' || u.role === 'admin')
    );
    if (!user) {
      return rejectWithValue('Invalid chef email or password. Please verify credentials with Kitchen Operations.');
    }
    const token = generateToken(user);
    return { user, token };
  }
);

// Async Thunk: Check and verify current session with backend API
export const checkAuthSession = createAsyncThunk(
  'auth/checkAuthSession',
  async (_, { rejectWithValue }) => {
    const token = getToken();
    if (!token) return rejectWithValue('No token');
    const res = await authApiService.getMe(token);
    if (res.ok && res.data?.success) {
      return { user: res.data.user, token };
    }
    return rejectWithValue('Session invalid');
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setProcessing(state, action) {
      state.isProcessing = !!action.payload;
    },

    syncChefAvailability(state, action) {
      const { id, availability } = action.payload;
      if (state.currentUser && state.currentUser.id === id) {
        state.currentUser.availability = availability;
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('zestro_auth', JSON.stringify(state.currentUser));
        }
      }
      const u = state.users.find(usr => usr.id === id);
      if (u) {
        u.availability = availability;
        saveUsers(state.users);
      }
    },

    loginWithGoogle(state, action) {
      const googleProfile = action.payload; // { email, fullName, avatar, id }
      const normalizedEmail = (googleProfile.email || '').toLowerCase().trim();
      const isTargetAdmin = isAdminEmail(normalizedEmail);

      let user = state.users.find(u => u.email?.toLowerCase() === normalizedEmail);

      if (!user) {
        if (isTargetAdmin) {
          // Strictly register as Super Admin
          user = {
            id: 'admin1',
            fullName: googleProfile.fullName || 'Dheivalakshmi',
            email: normalizedEmail,
            phone: '+91 98401 23456',
            password: 'Rohini#7',
            role: 'admin',
            dinePoints: 9999,
            tier: 'Super Admin',
            status: 'Active',
            addresses: [],
            avatar: googleProfile.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
            provider: 'google',
            createdAt: new Date().toISOString(),
          };
        } else {
          // Normal customers - strictly no admin privileges
          user = {
            id: googleProfile.id || `u_google_${Date.now()}`,
            fullName: googleProfile.fullName || 'Zestro Foodie',
            email: normalizedEmail,
            phone: '',
            password: `OAuth_${Date.now()}`,
            role: 'customer',
            dinePoints: 150, // Google sign-up bonus
            tier: 'Bronze',
            status: 'Active',
            birthday: null,
            addresses: [],
            avatar: googleProfile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            provider: 'google',
            createdAt: new Date().toISOString(),
          };
        }
        state.users.push(user);
        saveUsers(state.users);

        // Section 2: Send welcome email ONLY when a genuinely new Google account is created
        if (user.email) {
          authApiService.sendWelcomeEmail({
            email: user.email,
            name: user.fullName || user.name || 'Member',
            role: user.role || 'customer',
            provider: 'google',
          }).catch((err) => console.warn('Google registration welcome email note:', err?.message));
        }
      } else {
        // Enforce strict role isolation on existing account:
        if (isTargetAdmin) {
          user.role = 'admin';
          user.tier = 'Super Admin';
          user.fullName = googleProfile.fullName || user.fullName || 'Dheivalakshmi';
        } else if (user.role === 'admin') {
          // Security: demote any other user if somehow marked as admin
          user.role = 'customer';
        }

        // Update user avatar from Google if available
        if (googleProfile.avatar) {
          user.avatar = googleProfile.avatar;
        }
        saveUsers(state.users);
      }

      const token = generateToken(user);
      const safe = sanitizeUser(user);
      state.currentUser = safe;
      state.token = token;
      state.isAuthenticated = true;
      state.loginError = null;
      state.isProcessing = false;

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('zestro_auth', JSON.stringify(safe));
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('zestro_auth');
      }
      setToken(token);
    },

    logout(state) {
      state.currentUser = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loginError = null;
      state.registerError = null;
      state.isProcessing = false;
      state.lastRegisteredEmail = null;
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('zestro_auth');
        localStorage.removeItem('zestro_remembered_email');
        localStorage.removeItem('zestro_admin_remember');
        localStorage.removeItem('zestro_last_user');
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('zestro_auth');
        sessionStorage.removeItem('zestro_token');
        sessionStorage.clear();
      }
      removeToken();
    },

    updateProfile(state, action) {
      if (!state.currentUser) return;
      state.currentUser = { ...state.currentUser, ...action.payload };
      const idx = state.users.findIndex(u => u.id === state.currentUser.id);
      if (idx >= 0) {
        state.users[idx] = state.currentUser;
        saveUsers(state.users);
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('zestro_auth', JSON.stringify(state.currentUser));
      }
    },

    setAvatar(state, action) {
      const avatar = action.payload;
      if (state.currentUser) {
        state.currentUser.avatar = avatar;
        const idx = state.users.findIndex(u => u.id === state.currentUser.id);
        if (idx >= 0) {
          state.users[idx] = { ...state.users[idx], avatar };
          saveUsers(state.users);
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('zestro_auth', JSON.stringify(state.currentUser));
        }
      }
    },

    removeAvatar(state) {
      if (state.currentUser) {
        state.currentUser.avatar = null;
        const idx = state.users.findIndex(u => u.id === state.currentUser.id);
        if (idx >= 0) {
          state.users[idx] = { ...state.users[idx], avatar: null };
          saveUsers(state.users);
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('zestro_auth', JSON.stringify(state.currentUser));
        }
      }
    },

    clearErrors(state) {
      state.loginError = null;
      state.registerError = null;
    },
    requestOtp(state, action) {
      state.otpPending = {
        email: action.payload.email,
        code: '123456',
        purpose: action.payload.purpose || 'verify',
      };
    },
    clearOtp(state) {
      state.otpPending = null;
    },
    updateUserPassword(state, action) {
      const { identifier, newPassword } = action.payload;
      const clean = (identifier || '').toLowerCase().trim();
      let user = state.users.find(
        (u) =>
          u.email?.toLowerCase() === clean ||
          (u.phone && u.phone.replace(/\D/g, '').endsWith(clean.replace(/\D/g, '')))
      );
      if (user) {
        user.password = newPassword;
      } else {
        user = {
          id: `u_${Date.now()}`,
          fullName: clean.includes('@') ? clean.split('@')[0] : 'Customer',
          name: clean.includes('@') ? clean.split('@')[0] : 'Customer',
          email: clean.includes('@') ? clean : `${clean}@customer.zestro.com`,
          phone: clean.includes('@') ? '' : clean,
          password: newPassword,
          role: 'customer',
          dinePoints: 100,
          tier: 'Bronze',
          status: 'Active',
          createdAt: new Date().toISOString(),
        };
        state.users.push(user);
      }
      saveUsers(state.users);
    },
    setCustomerStatus(state, action) {
      const { customerId, status } = action.payload;
      const user = state.users.find(u => u.id === customerId || u.email === customerId);
      if (user) {
        user.status = status;
        saveUsers(state.users);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isProcessing = true;
        state.loginError = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        applyAuthSuccess(state, action.payload.user, action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.isProcessing = false;
        state.loginError = action.payload || 'Invalid email or password. Please try again.';
      })

      // Register
      .addCase(register.pending, (state) => {
        state.isProcessing = true;
        state.registerError = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        applyAuthSuccess(state, action.payload.user, action.payload.token);
      })
      .addCase(register.rejected, (state, action) => {
        state.isProcessing = false;
        state.registerError = action.payload || 'Registration failed';
      })

      // Admin Login
      .addCase(adminLogin.pending, (state) => {
        state.isProcessing = true;
        state.loginError = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        applyAuthSuccess(state, action.payload.user, action.payload.token);
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.isProcessing = false;
        state.loginError = action.payload || 'Invalid admin credentials.';
      })

      // Chef Login
      .addCase(chefLogin.pending, (state) => {
        state.isProcessing = true;
        state.loginError = null;
      })
      .addCase(chefLogin.fulfilled, (state, action) => {
        applyAuthSuccess(state, action.payload.user, action.payload.token);
      })
      .addCase(chefLogin.rejected, (state, action) => {
        state.isProcessing = false;
        state.loginError = action.payload || 'Invalid chef credentials.';
      })

      // Check Session
      .addCase(checkAuthSession.fulfilled, (state, action) => {
        applyAuthSuccess(state, action.payload.user, action.payload.token);
      })
      .addCase(checkAuthSession.rejected, () => {
        // Leave unauthenticated if session is invalid or expired
      });
  },
});

export const {
  setProcessing,
  syncChefAvailability,
  loginWithGoogle,
  logout,
  updateProfile,
  setAvatar,
  removeAvatar,
  clearErrors,
  requestOtp,
  clearOtp,
  updateUserPassword,
  setCustomerStatus,
} = authSlice.actions;

export default authSlice.reducer;

