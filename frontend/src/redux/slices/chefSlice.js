import { createSlice } from '@reduxjs/toolkit';

export const SEED_CHEFS = [
  {
    id: 'chef_1',
    name: 'Chef Murugesan P.',
    photo: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&auto=format&fit=crop&q=80',
    specialization: 'Biriyani Master & Woodfire Grills',
    experience: '16 Years',
    cuisineExpertise: 'Dindigul Dum Biriyani, Chettinad Masala, Tandoor',
    restaurantId: 'r2',
    restaurantName: 'Dindigul Thalappakatti',
    phone: '+91 98421 88901',
    email: 'murugesan.chef@zestro.com',
    qualification: 'Senior Culinary Craftsman, Tamil Nadu Culinary Guild',
    biography: 'Specializes in traditional Seeraga Samba woodfire slow-cooking, maintaining proprietary secret spices passed down over three generations.',
    rating: '4.9',
    workload: 'High',
    status: 'Active',
    availability: 'Available', // 'Available' | 'Busy' | 'Temporarily Unavailable'
    performance: {
      ordersPrepared: 2840,
      avgPrepTimeMin: 22,
      customerRating: 4.9,
      reviewsCount: 384,
      popularDishes: ['Thalappakatti Mutton Biriyani', 'Chicken 65', 'Mutton Sukka'],
      completedOrders: 2812,
      cancelledOrders: 14,
    },
  },
  {
    id: 'chef_2',
    name: 'Chef S. Meenakshi Sundaram',
    photo: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=200&auto=format&fit=crop&q=80',
    specialization: 'Traditional South Indian Tiffin & Filter Coffee',
    experience: '12 Years',
    cuisineExpertise: 'Ghee Podi Dosas, Crispy Medu Vada, Filter Kaapi',
    restaurantId: 'r1',
    restaurantName: 'A2B - Adyar Ananda Bhavan',
    phone: '+91 97890 12340',
    email: 'meenakshi.chef@zestro.com',
    qualification: 'Certified Master Tiffin Specialist',
    biography: 'Known for producing golden, lace-thin crispy dosas and signature stone-ground chutney flights across Kovilpatti & Tirunelveli branches.',
    rating: '4.8',
    workload: 'Normal',
    status: 'Active',
    availability: 'Available',
    performance: {
      ordersPrepared: 3450,
      avgPrepTimeMin: 12,
      customerRating: 4.8,
      reviewsCount: 420,
      popularDishes: ['Special Masala Dosa', 'Ghee Podi Idli', 'Filter Coffee'],
      completedOrders: 3435,
      cancelledOrders: 9,
    },
  },
  {
    id: 'chef_3',
    name: 'Chef Arulmozhi Nathan',
    photo: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=200&auto=format&fit=crop&q=80',
    specialization: 'Tirunelveli Halwa & Traditional Sweets',
    experience: '20 Years',
    cuisineExpertise: 'Thamirabarani Wheat Halwa, Kovilpatti Kadalai Mittai, Jangiri',
    restaurantId: 'r3',
    restaurantName: 'Sree Annapoorna',
    phone: '+91 94432 55678',
    email: 'arulmozhi.chef@zestro.com',
    qualification: 'Master Sweetmaker Awardee 2021',
    biography: 'Dedicated traditional artisan mastering the 4-hour slow stirring technique for authentic Tirunelveli ghee halwa.',
    rating: '5.0',
    workload: 'Peak',
    status: 'Active',
    availability: 'Available',
    performance: {
      ordersPrepared: 1980,
      avgPrepTimeMin: 15,
      customerRating: 5.0,
      reviewsCount: 512,
      popularDishes: ['Tirunelveli Ghee Halwa', 'Kada-lai Mittai', 'Badam Milk'],
      completedOrders: 1972,
      cancelledOrders: 3,
    },
  },
  {
    id: 'chef_4',
    name: 'Chef David Raj',
    photo: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=200&auto=format&fit=crop&q=80',
    specialization: 'Kothu Parotta & Midnight Street Wok',
    experience: '9 Years',
    cuisineExpertise: 'Egg Kothu Parotta, Kari Dosa, Chicken Salna',
    restaurantId: 'r4',
    restaurantName: 'Junior Kuppanna',
    phone: '+91 96231 99012',
    email: 'david.chef@zestro.com',
    qualification: 'Wok Master & Hot Plate Certified',
    biography: 'Brings street theater and rapid rhythm rhythmic chopping to the hot tawa, producing sensational flaky kothu parotta.',
    rating: '4.7',
    workload: 'Moderate',
    status: 'Active',
    availability: 'Available',
    performance: {
      ordersPrepared: 2150,
      avgPrepTimeMin: 16,
      customerRating: 4.7,
      reviewsCount: 290,
      popularDishes: ['Chicken Kothu Parotta', 'Egg Ceylon Parotta', 'Pepper Chicken'],
      completedOrders: 2130,
      cancelledOrders: 11,
    },
  },
];

export const SEED_INCIDENTS = [
  {
    id: 'INC-802',
    incidentType: 'Kitchen Incident',
    severity: 'High',
    description: 'Primary exhaust ventilation malfunction in main kitchen wok line. Preparing orders and hot table bookings delayed.',
    restaurantId: 'r2',
    restaurantName: 'ABC Restaurant',
    chefId: 'chef_1',
    chefName: 'Chef Murugesan P.',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&auto=format&fit=crop&q=80',
    affectedOrders: ['ZST-1024', 'ZST-1025'],
    affectedBookings: ['BK-1024', 'BK-1027', 'BK-1031'],
    reportedAt: new Date(Date.now() - 1800000).toISOString(),
    status: 'open', // 'open' | 'resolved'
    adminNotes: '',
    resolvedAt: null,
  },
  {
    id: 'INC-701',
    incidentType: 'Equipment Failure',
    severity: 'Medium',
    description: 'Tandoor furnace secondary blower valve inspection required. Preparing orders slightly delayed by 10 minutes.',
    restaurantId: 'r2',
    restaurantName: 'Dindigul Thalappakatti',
    chefId: 'chef_1',
    chefName: 'Chef Murugesan P.',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&auto=format&fit=crop&q=80',
    affectedOrders: ['ZST-1025'],
    reportedAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'resolved', // 'open' | 'resolved'
    adminNotes: 'Maintenance team serviced valve. Kitchen resumed normal operations.',
    resolvedAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

function loadChefs() {
  try {
    const stored = JSON.parse(localStorage.getItem('zestro_chefs'));
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    localStorage.setItem('zestro_chefs', JSON.stringify(SEED_CHEFS));
    return SEED_CHEFS;
  } catch {
    return SEED_CHEFS;
  }
}

function persist(chefs) {
  try {
    localStorage.setItem('zestro_chefs', JSON.stringify(chefs));
  } catch (e) {
    console.error('Failed to persist chefs:', e);
  }
}

function loadIncidents() {
  try {
    const stored = JSON.parse(localStorage.getItem('zestro_kitchen_incidents'));
    if (stored && Array.isArray(stored) && stored.length > 0) {
      const hasInc802 = stored.some(i => i.id === 'INC-802');
      if (hasInc802) return stored;
      const merged = [SEED_INCIDENTS[0], ...stored];
      localStorage.setItem('zestro_kitchen_incidents', JSON.stringify(merged));
      return merged;
    }
    localStorage.setItem('zestro_kitchen_incidents', JSON.stringify(SEED_INCIDENTS));
    return SEED_INCIDENTS;
  } catch {
    return SEED_INCIDENTS;
  }
}

function persistIncidents(incidents) {
  try {
    localStorage.setItem('zestro_kitchen_incidents', JSON.stringify(incidents));
  } catch (e) {
    console.error('Failed to persist incidents:', e);
  }
}

// Helper: sync added or updated chef to auth users in localStorage so chef can log in immediately
function syncChefToAuthUsers(chef, remove = false) {
  try {
    const usersStr = localStorage.getItem('zestro_users');
    let users = usersStr ? JSON.parse(usersStr) : [];
    if (!Array.isArray(users)) users = [];

    if (remove) {
      users = users.filter(u => u.email !== chef.email && u.id !== chef.id);
    } else {
      const idx = users.findIndex(u => u.id === chef.id || u.email.toLowerCase() === chef.email.toLowerCase());
      const chefUserObj = {
        id: chef.id,
        fullName: chef.name,
        email: chef.email.toLowerCase(),
        phone: chef.phone || '',
        password: chef.password || 'Chef@123',
        role: 'chef',
        restaurantId: chef.restaurantId,
        restaurantName: chef.restaurantName,
        specialization: chef.specialization,
        avatar: chef.photo || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&auto=format&fit=crop&q=80',
        availability: chef.availability || 'Available',
        addresses: [],
      };
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...chefUserObj };
      } else {
        users.push(chefUserObj);
      }
    }
    localStorage.setItem('zestro_users', JSON.stringify(users));
  } catch (e) {
    console.warn('Failed to sync chef with auth users:', e);
  }
}

const chefSlice = createSlice({
  name: 'chef',
  initialState: {
    chefs: loadChefs(),
    incidents: loadIncidents(),
  },
  reducers: {
    addChef(state, action) {
      const newChef = {
        id: `chef_${Date.now()}`,
        status: 'Active',
        rating: '5.0',
        workload: 'Normal',
        availability: 'Available',
        password: 'Chef@123',
        performance: {
          ordersPrepared: 0,
          avgPrepTimeMin: 15,
          customerRating: 5.0,
          reviewsCount: 0,
          popularDishes: [],
          completedOrders: 0,
          cancelledOrders: 0,
        },
        ...action.payload,
      };
      state.chefs.unshift(newChef);
      persist(state.chefs);
      syncChefToAuthUsers(newChef);
    },

    updateChef(state, action) {
      const { id, ...changes } = action.payload;
      const idx = state.chefs.findIndex(c => c.id === id);
      if (idx !== -1) {
        state.chefs[idx] = { ...state.chefs[idx], ...changes };
        persist(state.chefs);
        syncChefToAuthUsers(state.chefs[idx]);
      }
    },

    deleteChef(state, action) {
      const chefToDelete = state.chefs.find(c => c.id === action.payload);
      state.chefs = state.chefs.filter(c => c.id !== action.payload);
      persist(state.chefs);
      if (chefToDelete) {
        syncChefToAuthUsers(chefToDelete, true);
      }
    },

    toggleChefStatus(state, action) {
      const chef = state.chefs.find(c => c.id === action.payload);
      if (chef) {
        chef.status = chef.status === 'Active' ? 'Inactive' : 'Active';
        persist(state.chefs);
        syncChefToAuthUsers(chef);
      }
    },

    updateChefKitchenStatus(state, action) {
      const { id, status } = action.payload;
      const chef = state.chefs.find(c => c.id === id || c.email === id);
      if (chef) {
        chef.availability = status;
        persist(state.chefs);
        syncChefToAuthUsers(chef);
      }
    },

    updateChefWorkload(state, action) {
      const { id, workload } = action.payload;
      const chef = state.chefs.find(c => c.id === id);
      if (chef) {
        chef.workload = workload;
        persist(state.chefs);
      }
    },

    assignChefRestaurant(state, action) {
      const { chefId, restaurantId, restaurantName } = action.payload;
      const chef = state.chefs.find(c => c.id === chefId);
      if (chef) {
        chef.restaurantId = restaurantId;
        chef.restaurantName = restaurantName;
        persist(state.chefs);
        syncChefToAuthUsers(chef);
      }
    },

    reportKitchenIncident(state, action) {
      const incident = {
        id: `INC-${Math.floor(100 + Math.random() * 900)}`,
        status: 'open',
        reportedAt: new Date().toISOString(),
        adminNotes: '',
        resolvedAt: null,
        ...action.payload,
      };
      state.incidents.unshift(incident);
      persistIncidents(state.incidents);

      // If kitchen closed, update chef status
      if (incident.incidentType === 'Kitchen Temporarily Closed') {
        const chef = state.chefs.find(c => c.id === incident.chefId);
        if (chef) {
          chef.availability = 'Temporarily Unavailable';
          persist(state.chefs);
          syncChefToAuthUsers(chef);
        }
      }
    },

    updateKitchenIncidentStatus(state, action) {
      const { id, status, resolutionNote = '' } = action.payload;
      const inc = state.incidents.find(i => i.id === id);
      if (inc) {
        inc.status = status;
        if (status === 'resolved') {
          inc.resolvedAt = new Date().toISOString();
        }
        if (resolutionNote) {
          inc.adminNotes = resolutionNote;
        }
        persistIncidents(state.incidents);
      }
    },
  },
});

export const {
  addChef,
  updateChef,
  deleteChef,
  toggleChefStatus,
  updateChefKitchenStatus,
  updateChefWorkload,
  assignChefRestaurant,
  reportKitchenIncident,
  resolveKitchenIncidentRecord,
  updateKitchenIncidentStatus,
} = chefSlice.actions;

export default chefSlice.reducer;
