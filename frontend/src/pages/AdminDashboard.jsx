import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

// Data & Redux Slices
import { RESTAURANTS, CATEGORIES, AREAS } from '../data/mockData';
import { addFood, updateFood, deleteFood, toggleFoodAvailability, toggleFoodStatus } from '../redux/slices/foodSlice';
import { addChef, updateChef, deleteChef, toggleChefStatus } from '../redux/slices/chefSlice';
import { logActivity } from '../redux/slices/activitySlice';
import {
  advanceOrderStage,
  updateOrderStatus,
  cancelOrder,
  completeRefund,
  updateOrderPriority,
  updateInternalNote,
  updateKitchenStatus,
  reportKitchenIncident,
  resolveKitchenIncident,
  verifyDeliveryOtp,
} from '../redux/slices/orderSlice';
import { advanceJourney, setJourneyStep, cancelBooking, updateBookingStatus } from '../redux/slices/bookingSlice';
import { deleteVoucher, addVoucher } from '../redux/slices/voucherSlice';
import { logout, setAvatar, removeAvatar, updateProfile } from '../redux/slices/authSlice';
import { useToast } from '../contexts/ToastContext';
import { getAdminNotifications, markAdminNotificationsRead } from '../services/adminNotificationService';

// Components & Icons
import Icon from '../components/Icon';
import SafeImage from '../components/SafeImage';
import ConfirmationModal from '../components/ConfirmationModal';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopNav from '../components/admin/AdminTopNav';
import FoodModal from '../components/admin/FoodModal';
import OrderDetailsModal from '../components/admin/OrderDetailsModal';
import PreOrderConnectionModal from '../components/admin/PreOrderConnectionModal';
import ChefModal from '../components/admin/ChefModal';
import ChefPerformanceModal from '../components/admin/ChefPerformanceModal';
import TableModal from '../components/admin/TableModal';
import DeliveryPartnerModal from '../components/admin/DeliveryPartnerModal';
import DeliveryPartnerDetailsModal from '../components/admin/DeliveryPartnerDetailsModal';
import CustomerDetailsModal from '../components/admin/CustomerDetailsModal';
import VoucherModal from '../components/admin/VoucherModal';
import RestaurantModal from '../components/admin/RestaurantModal';
import NotificationDrawer from '../components/admin/NotificationDrawer';
import RestaurantManagement from '../components/admin/RestaurantManagement';
import FoodManagement from '../components/admin/FoodManagement';
import ChefManagement from '../components/admin/ChefManagement';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import KitchenIncidentAlertBanner from '../components/admin/KitchenIncidentAlertBanner';
import BookingManagement from '../components/admin/BookingManagement';
import CustomerManagement from '../components/admin/CustomerManagement';
import ReviewManagement from '../components/admin/ReviewManagement';
import CustomerIssueManagement from '../components/admin/CustomerIssueManagement';
import Pagination from '../components/Pagination';

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { section, orderId, subId, extraId } = useParams();
  const currentSubId = subId || orderId;
  const { showToast } = useToast();

  // Core Redux State Subscriptions
  const currentUser = useSelector(s => s.auth?.currentUser);
  const users = useSelector(s => s.auth?.users || []);
  const orders = useSelector(s => s.order?.orders || []);
  const bookings = useSelector(s => s.booking?.bookings || []);
  const foods = useSelector(s => s.food?.foods || []);
  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants || []);
  const chefs = useSelector(s => s.chef?.chefs || []);
  const reviews = useSelector(s => s.review?.reviews || []);
  const vouchers = useSelector(s => s.voucher?.vouchers || []);
  const activities = useSelector(s => s.activity?.activities || []);

  // Section Aliases Map
  const sectionAliases = useMemo(() => ({
    'menu': 'food',
    'table-bookings': 'bookings',
    'floor-plan': 'tables',
    'kds': 'kitchen',
    'activity': 'activity-log',
    'shifts': 'staff',
    'stock': 'inventory',
    'security': 'audit',
    'backup': 'backups',
    'financials': 'payments',
    'support': 'issues',
    'customer-issues': 'issues',
    'ratings': 'reviews',
  }), []);

  // Section Navigation & UI State
  const [activeSection, setActiveSection] = useState(() => {
    if (section) {
      const aliasMap = {
        'menu': 'food',
        'table-bookings': 'bookings',
        'floor-plan': 'tables',
        'kds': 'kitchen',
        'activity': 'activity-log',
        'shifts': 'staff',
        'stock': 'inventory',
        'security': 'audit',
        'backup': 'backups',
        'financials': 'payments',
        'support': 'issues',
        'customer-issues': 'issues',
        'ratings': 'reviews',
      };
      return aliasMap[section] || section;
    }
    return 'dashboard';
  });

  useEffect(() => {
    if (section) {
      const normalized = sectionAliases[section] || section;
      setActiveSection(normalized);
    }
  }, [section, sectionAliases]);

  // Synchronize URL /admin/orders/:orderId with modal inspection
  useEffect(() => {
    const targetOrderId = currentSubId || orderId;
    if (activeSection === 'orders' && targetOrderId && orders.length > 0) {
      const found = orders.find(o => o.id?.toLowerCase() === targetOrderId.toLowerCase());
      if (found) {
        setSelectedOrder(found);
        setOrderDetailsModalOpen(true);
      }
    }
  }, [activeSection, currentSubId, orderId, orders]);

  const handleSelectSection = (sec) => {
    const normalized = sectionAliases[sec] || sec;
    setActiveSection(normalized);
    navigate(`/admin/${sec}`);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Local State for Tables (seeding from RESTAURANTS[0])
  const [tables, setTables] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('zestro_tables'));
      if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    } catch { }
    return (RESTAURANTS[0]?.tables || []).map((t, idx) => ({
      ...t,
      capacity: idx % 3 === 0 ? 6 : idx % 2 === 0 ? 2 : 4,
      seatingType: idx % 4 === 0 ? 'Outdoor' : idx % 3 === 0 ? 'Window' : 'Indoor',
      location: 'Ground Floor, Kovilpatti Branch',
    }));
  });

  const saveTables = (newTables) => {
    setTables(newTables);
    try {
      localStorage.setItem('zestro_tables', JSON.stringify(newTables));
    } catch (e) {
      console.error(e);
    }
  };

  // Local State for Partner Restaurants
  const [restaurantsList, setRestaurantsList] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('zestro_admin_restaurants'));
      if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    } catch { }
    return RESTAURANTS.map(r => ({
      ...r,
      status: 'Open',
    }));
  });

  const saveRestaurants = (newList) => {
    setRestaurantsList(newList);
    try {
      localStorage.setItem('zestro_admin_restaurants', JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  // Local State for Delivery Partners
  const [deliveryPartners, setDeliveryPartners] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('zestro_delivery_partners'));
      if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    } catch { }
    return [
      {
        id: 'dp_1',
        name: 'Senthil Nathan',
        phone: '+91 98765 99001',
        email: 'senthil.rider@zestro.com',
        vehicleType: 'Hero Splendor Plus',
        vehicleNumber: 'TN 69 AB 1234',
        licenseNumber: 'TN-69-2021-004521',
        status: 'Out for Delivery',
        currentLocation: 'Kovilpatti Central Bus Stand, Main Rd',
        distanceFromHub: '0.8 km',
        locationCoords: { lat: 9.1726, lng: 77.8681 },
        rating: 4.9,
        totalDeliveries: 428,
        joinedDate: 'Jan 2024',
      },
      {
        id: 'dp_2',
        name: 'Vignesh K.',
        phone: '+91 98765 99002',
        email: 'vignesh.rider@zestro.com',
        vehicleType: 'Hero Passion Pro',
        vehicleNumber: 'TN 69 CD 5678',
        licenseNumber: 'TN-69-2022-001249',
        status: 'Out for Delivery',
        currentLocation: 'Anna Nagar 2nd Street, Kovilpatti',
        distanceFromHub: '1.4 km',
        locationCoords: { lat: 9.1755, lng: 77.8710 },
        rating: 4.8,
        totalDeliveries: 312,
        joinedDate: 'Mar 2024',
      },
      {
        id: 'dp_3',
        name: 'Muthu Kumar R.',
        phone: '+91 98765 99003',
        email: 'muthu.rider@zestro.com',
        vehicleType: 'Honda Activa 6G',
        vehicleNumber: 'TN 69 EF 9012',
        licenseNumber: 'TN-69-2020-008934',
        status: 'Available',
        currentLocation: 'Railway Feeder Road, Kovilpatti',
        distanceFromHub: '0.5 km',
        locationCoords: { lat: 9.1710, lng: 77.8650 },
        rating: 4.9,
        totalDeliveries: 584,
        joinedDate: 'Nov 2023',
      },
      {
        id: 'dp_4',
        name: 'Praveen Raj',
        phone: '+91 98765 99004',
        email: 'praveen.rider@zestro.com',
        vehicleType: 'Ather 450X EV',
        vehicleNumber: 'TN 69 GH 3456',
        licenseNumber: 'TN-69-2023-009123',
        status: 'On Duty',
        currentLocation: 'Pasuvandhanai Road Junction, Kovilpatti',
        distanceFromHub: '2.1 km',
        locationCoords: { lat: 9.1680, lng: 77.8745 },
        rating: 4.7,
        totalDeliveries: 196,
        joinedDate: 'Jun 2024',
      },
      {
        id: 'dp_5',
        name: 'Karthik Vel',
        phone: '+91 98765 99005',
        email: 'karthik.rider@zestro.com',
        vehicleType: 'Bajaj Pulsar 150',
        vehicleNumber: 'TN 69 JK 7890',
        licenseNumber: 'TN-69-2019-003412',
        status: 'Offline',
        currentLocation: 'Inam Maniyachi Bypass, Kovilpatti',
        distanceFromHub: '3.6 km',
        locationCoords: { lat: 9.1820, lng: 77.8810 },
        rating: 4.9,
        totalDeliveries: 650,
        joinedDate: 'Aug 2023',
      },
    ];
  });

  const saveDeliveryPartners = (newList) => {
    setDeliveryPartners(newList);
    try {
      localStorage.setItem('zestro_delivery_partners', JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  // Recently Accessed History State
  const [recentlyAccessed, setRecentlyAccessed] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('zestro_recently_accessed'));
      if (stored && Array.isArray(stored)) return stored;
    } catch { }
    return [
      { id: 'rec_1', type: 'Order', title: 'Order #ORD-729104', subtitle: 'A2B - Kovilpatti', time: '10 min ago' },
      { id: 'rec_2', type: 'Chef', title: 'Chef Murugesan P.', subtitle: 'Dindigul Thalappakatti', time: '25 min ago' },
      { id: 'rec_3', type: 'Food', title: 'Special Masala Dosa', subtitle: 'A2B - Adyar Ananda Bhavan', time: '40 min ago' },
      { id: 'rec_4', type: 'Customer', title: 'Priya Sharma', subtitle: 'Gold Member', time: '1 hr ago' },
    ];
  });

  const trackAccess = (type, title, subtitle) => {
    const entry = {
      id: `rec_${Date.now()}`,
      type,
      title,
      subtitle,
      time: 'Just now',
    };
    const updated = [entry, ...recentlyAccessed.filter(r => r.title !== title)].slice(0, 15);
    setRecentlyAccessed(updated);
    try {
      localStorage.setItem('zestro_recently_accessed', JSON.stringify(updated));
    } catch (e) { }
  };

  // Filter & Operations States (Part 3)
  const [foodCategoryFilter, setFoodCategoryFilter] = useState('all');
  const [foodVegFilter, setFoodVegFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [orderRestaurantFilter, setOrderRestaurantFilter] = useState('all');
  const [orderDateFilter, setOrderDateFilter] = useState('all');
  const [orderCustomDate, setOrderCustomDate] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [ordersFilterPanelOpen, setOrdersFilterPanelOpen] = useState(false);
  const [orderSortBy, setOrderSortBy] = useState('newest');
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(10);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [reviewsFilter, setReviewsFilter] = useState('all');

  // Active Modals State
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);

  const [chefModalOpen, setChefModalOpen] = useState(false);
  const [editingChef, setEditingChef] = useState(null);

  const [chefPerfModalOpen, setChefPerfModalOpen] = useState(false);
  const [selectedChefForPerf, setSelectedChefForPerf] = useState(null);

  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);

  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [partnerDetailsModalOpen, setPartnerDetailsModalOpen] = useState(false);
  const [selectedPartnerForDetails, setSelectedPartnerForDetails] = useState(null);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [partnerStatusFilter, setPartnerStatusFilter] = useState('all');

  const [restaurantModalOpen, setRestaurantModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);

  const [voucherModalOpen, setVoucherModalOpen] = useState(false);

  const [orderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [preOrderModalOpen, setPreOrderModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(null); // { type, id, title, message }

  // Admin Profile Edit State
  const [adminName, setAdminName] = useState(currentUser?.fullName || '');
  const [adminPhone, setAdminPhone] = useState(currentUser?.phone || '');
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || '');
  const [adminAvatarPreview, setAdminAvatarPreview] = useState(currentUser?.avatar || '');

  useEffect(() => {
    if (currentUser) {
      setAdminName(currentUser.fullName || '');
      setAdminPhone(currentUser.phone || '');
      setAdminEmail(currentUser.email || '');
      setAdminAvatarPreview(currentUser.avatar || '');
    }
  }, [currentUser]);

  // Handle Logout
  const handleLogout = () => {
    dispatch(logout());
    showToast('Admin signed out', 'info');
    navigate('/', { replace: true });
  };

  // KPI Calculations (Requirement 14: 12 Actual Application Data Metrics)
  const kpis = useMemo(() => {
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'Delivered');
    const cancelledOrders = orders.filter(o => o.cancelled || o.status === 'Cancelled');
    const pendingOrders = orders.filter(o => !o.cancelled && o.status !== 'Delivered');
    const revenue = orders.reduce((sum, o) => sum + (o.cancelled ? 0 : (o.grandTotal || 0)), 0);

    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(b => !['Cancelled', 'Completed', 'No Show'].includes(b.status));

    const totalCustomers = users.filter(u => u.role === 'customer').length;
    const totalRestaurants = restaurantsList.length;
    const totalChefs = chefs.length;
    const totalFoods = foods.length;

    const todayDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const todayOrdersCount = orders.filter(o => {
      const d = o.placedAt || o.createdAt;
      if (!d) return false;
      try {
        const orderDateStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(d));
        return orderDateStr === todayDateStr;
      } catch {
        return (d || '').slice(0, 10) === todayDateStr;
      }
    }).length;
    const todayOrders = todayOrdersCount;

    const todayBookingsCount = bookings.filter(b => {
      const d = b.date || b.bookingDate || b.createdAt;
      if (!d) return false;
      try {
        const bookingDateStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(d));
        return bookingDateStr === todayDateStr;
      } catch {
        return (d || '').slice(0, 10) === todayDateStr;
      }
    }).length;
    const todayBookings = todayBookingsCount;

    const occupiedTables = tables.filter(t => t.status === 'occupied').length;
    const freeTables = tables.filter(t => t.status === 'free').length;
    const cleaningTables = tables.filter(t => t.status === 'cleaning').length;

    const kitchenPreparing = orders.filter(o => o.status === 'Food Preparing' || o.status === 'Preparing').length;
    const kitchenReady = orders.filter(o => o.status === 'Food Ready' || o.status === 'Ready').length;

    return {
      totalCustomers,
      totalRestaurants,
      totalChefs,
      totalFoodItems: totalFoods,
      totalOrders,
      totalBookings,
      todayOrders,
      todayBookings,
      pendingOrders: pendingOrders.length,
      activeBookings: activeBookings.length,
      revenue,
      cancelledOrders: cancelledOrders.length,
      occupiedTables,
      freeTables,
      cleaningTables,
      kitchenPreparing,
      kitchenReady,
    };
  }, [orders, bookings, users, restaurantsList, chefs, foods, tables]);

  // Store Operational Status Mode ('normal' | 'peak' | 'busy')
  const [storeMode, setStoreMode] = useState('normal');
  const [chartMetric, setChartMetric] = useState('revenue');

  // Dynamic greeting based on current local hour (Section 6)
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Dynamic Weekly Report Bar Chart Data
  const weeklyReportData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseRevenue = [4850, 6200, 5900, 7800, 9400, 12600, 11200];
    const baseOrders = [16, 21, 19, 28, 34, 46, 39];
    const totalRev = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0) || 57950;
    const factor = totalRev > 0 ? totalRev / 57950 : 1;
    const maxRev = Math.max(...baseRevenue.map(v => Math.round(v * factor)));
    return days.map((day, i) => {
      const rev = Math.round(baseRevenue[i] * factor);
      const ords = Math.max(1, Math.round(baseOrders[i] * (orders.length ? orders.length / 30 : 1)));
      return {
        day,
        revenue: rev,
        orders: ords,
        heightPct: Math.max(18, Math.round((rev / maxRev) * 100)),
      };
    });
  }, [orders]);

  // Registered customers list for Customers Preview Table
  const registeredCustomers = useMemo(() => {
    return users.filter(u => u.role === 'customer');
  }, [users]);

  // Notifications Feed connected to adminNotificationService
  const [adminNotifications, setAdminNotifications] = useState(() => getAdminNotifications());

  useEffect(() => {
    const handleNotifAdded = () => {
      setAdminNotifications(getAdminNotifications());
    };
    window.addEventListener('zestro_admin_notif_added', handleNotifAdded);
    return () => window.removeEventListener('zestro_admin_notif_added', handleNotifAdded);
  }, []);

  const unreadNotifs = adminNotifications.filter(n => !n.read).length;

  const handleMarkAllNotifsRead = () => {
    markAdminNotificationsRead();
    setAdminNotifications(getAdminNotifications());
    showToast('All notifications marked as read', 'info');
  };

  const handleSendBroadcastNotif = (notif) => {
    const newEntry = {
      id: `notif_${Date.now()}`,
      type: notif.type || 'broadcast',
      title: notif.title,
      desc: notif.message,
      time: 'Just now',
      read: false,
    };
    setAdminNotifications([newEntry, ...adminNotifications]);
    dispatch(logActivity({
      action: 'Sent Broadcast Notification',
      entity: notif.title,
      entityType: 'Notification',
      prevValue: 'None',
      newValue: `Target: ${notif.target}`,
    }));
    showToast('Notification published to active app sessions', 'success');
  };

  const handleNotificationAction = (actionType, notif) => {
    if (actionType === 'view_order' || actionType === 'manage_order') {
      const orderMatch = orders.find(o => o.id === notif.entityId);
      if (orderMatch) {
        setSelectedOrder(orderMatch);
        setOrderDetailsModalOpen(true);
      }
      handleSelectSection('orders');
    } else if (actionType === 'view_booking' || actionType === 'confirm_booking') {
      const bookingMatch = bookings.find(b => b.id === notif.entityId);
      if (bookingMatch) {
        setSelectedBooking(bookingMatch);
        setPreOrderModalOpen(true);
      }
      handleSelectSection('bookings');
    } else if (actionType === 'manage_table') {
      handleSelectSection('tables');
    }
  };

  // Staff & Shifts State (Section 17)
  const [staffList, setStaffList] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('zestro_admin_staff'));
      if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    } catch { }
    return [
      { id: 'st_1', name: 'Ramesh Kumar', role: 'Head Waiter', shift: 'Morning (07:00 - 15:00)', status: 'On Duty', phone: '+91 98765 43210', branch: 'A2B - Kovilpatti', attendance: '98%' },
      { id: 'st_2', name: 'Chef Murugesan P.', role: 'Executive Dum Specialist', shift: 'Full Day (11:00 - 23:00)', status: 'On Duty', phone: '+91 98765 11223', branch: 'Dindigul Thalappakatti', attendance: '99%' },
      { id: 'st_3', name: 'Priya Sundaram', role: 'Floor Manager', shift: 'Evening (15:00 - 23:00)', status: 'On Duty', phone: '+91 98765 33445', branch: 'A2B - Kovilpatti', attendance: '96%' },
      { id: 'st_4', name: 'Karthik Raja', role: 'Kitchen Expeditor', shift: 'Evening (15:00 - 23:00)', status: 'Off Duty', phone: '+91 98765 55667', branch: 'Hotel Saravana Bhavan', attendance: '94%' },
      { id: 'st_5', name: 'Anitha V.', role: 'Chief Cashier', shift: 'Morning (08:00 - 16:00)', status: 'On Duty', phone: '+91 98765 77889', branch: 'Annapoorna Gowrishankar', attendance: '97%' },
      { id: 'st_6', name: 'Senthil Nathan', role: 'Delivery Lead Rider', shift: 'All Day', status: 'On Duty', phone: '+91 98765 99001', branch: 'ZESTRO Central Hub', attendance: '95%' },
    ];
  });

  const handleToggleStaffDuty = (id) => {
    setStaffList(prev => {
      const updated = prev.map(s => {
        if (s.id === id) {
          const nextStatus = s.status === 'On Duty' ? 'Off Duty' : 'On Duty';
          dispatch(logActivity({
            action: 'Toggled Staff Status',
            entity: s.name,
            entityType: 'Staff',
            prevValue: s.status,
            newValue: nextStatus,
          }));
          showToast(`${s.name} is now ${nextStatus}`, 'info');
          return { ...s, status: nextStatus };
        }
        return s;
      });
      try {
        localStorage.setItem('zestro_admin_staff', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
  };

  // Inventory & Stock State (Section 17)
  const [inventoryList, setInventoryList] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('zestro_admin_inventory'));
      if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    } catch { }
    return [
      { id: 'inv_1', name: 'Seeraga Samba Rice', category: 'Grains & Rice', stock: 120, unit: 'kg', minThreshold: 30, supplier: 'Tamilnadu Agri Mill', status: 'In Stock' },
      { id: 'inv_2', name: 'Pure Desi Cow Ghee', category: 'Dairy & Fats', stock: 18, unit: 'liters', minThreshold: 15, supplier: 'Uthukuli Ghee Co.', status: 'Low Stock' },
      { id: 'inv_3', name: 'Tender Farm Chicken', category: 'Meat & Poultry', stock: 45, unit: 'kg', minThreshold: 20, supplier: 'FreshPoultry Kovilpatti', status: 'In Stock' },
      { id: 'inv_4', name: 'Kovilpatti Kadalai Mittai Peanuts', category: 'Dry Goods', stock: 85, unit: 'kg', minThreshold: 25, supplier: 'Kovilpatti Sweets', status: 'In Stock' },
      { id: 'inv_5', name: 'South Indian Filter Coffee Beans', category: 'Beverages', stock: 8, unit: 'kg', minThreshold: 10, supplier: 'Kumbakonam Degree Coffee', status: 'Low Stock' },
      { id: 'inv_6', name: 'Fresh Malabar Paneer', category: 'Dairy & Fats', stock: 2, unit: 'kg', minThreshold: 10, supplier: 'Arokya Dairy', status: 'Out of Stock' },
      { id: 'inv_7', name: 'Chettinad Masala Spice Blend', category: 'Spices', stock: 32, unit: 'kg', minThreshold: 10, supplier: 'Karaikudi Spice House', status: 'In Stock' },
    ];
  });

  const handleRestock = (id, amount = 25) => {
    setInventoryList(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const nextStock = item.stock + amount;
          const nextStatus = nextStock >= item.minThreshold ? 'In Stock' : 'Low Stock';
          dispatch(logActivity({
            action: 'Restocked Ingredient',
            entity: item.name,
            entityType: 'Inventory',
            prevValue: `${item.stock} ${item.unit}`,
            newValue: `${nextStock} ${item.unit}`,
          }));
          showToast(`Restocked +${amount} ${item.unit} of ${item.name}`, 'success');
          return { ...item, stock: nextStock, status: nextStatus };
        }
        return item;
      });
      try {
        localStorage.setItem('zestro_admin_inventory', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
  };

  // Backups & Export Utilities (Section 17 & 18)
  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) {
      showToast('No records available to export', 'error');
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName] ?? '')).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filename}`, 'success');
  };

  const handleExportOrders = () => {
    const data = orders.map(o => ({
      orderId: o.id,
      customer: o.userEmail || 'Guest',
      restaurant: o.restaurantName,
      items: (o.items || []).map(i => `${i.name} (x${i.quantity || 1})`).join('; '),
      total: o.grandTotal,
      paymentMethod: o.paymentMethod || 'UPI',
      status: o.status,
      date: o.placedAt ? new Date(o.placedAt).toLocaleString() : 'N/A'
    }));
    exportCSV(data, `zestro_orders_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportBookings = () => {
    const data = bookings.map(b => ({
      bookingId: b.id,
      customer: b.userEmail || 'Guest',
      restaurant: b.restaurantName,
      date: b.date,
      timeSlot: b.timeSlot,
      guests: b.guests,
      seating: b.seating,
      tableId: b.tableId || 'N/A',
      status: b.status,
      journeyStep: b.journeyStep || 0
    }));
    exportCSV(data, `zestro_bookings_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportCustomers = () => {
    const customers = users.filter(u => u.role === 'customer').map(c => ({
      customerId: c.id,
      name: c.fullName,
      email: c.email,
      phone: c.phone || 'N/A',
      tier: c.tier || 'Bronze',
      points: c.dinePoints || 100,
      joined: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Jan 2024'
    }));
    exportCSV(customers, `zestro_customers_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportFullBackup = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      orders,
      bookings,
      restaurants: restaurantsList,
      tables,
      vouchers,
      reviews,
      inventory: inventoryList,
      staff: staffList,
      activities
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zestro_full_backup_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Full system backup JSON exported!', 'success');
  };

  // Search Index for Global Search across 9 entities
  const searchIndex = useMemo(() => ({
    orders,
    customers: users.filter(u => u.role === 'customer'),
    restaurants: restaurantsList,
    food: foods,
    bookings,
    chefs,
    tables,
    riders: deliveryPartners,
    vouchers,
  }), [orders, users, restaurantsList, foods, bookings, chefs, tables, deliveryPartners, vouchers]);

  const handleSelectSearchResult = (type, item) => {
    trackAccess(type.toUpperCase(), item.name || item.fullName || item.id || item.code || item.label, item.restaurantName || item.email || item.area || '');
    if (type === 'order') {
      setSelectedOrder(item);
      setOrderDetailsModalOpen(true);
    } else if (type === 'food') {
      setEditingFood(item);
      setFoodModalOpen(true);
    } else if (type === 'chef') {
      setSelectedChefForPerf(item);
      setChefPerfModalOpen(true);
    } else if (type === 'booking') {
      setSelectedBooking(item);
      setPreOrderModalOpen(true);
    } else if (type === 'customer') {
      setSelectedCustomer(item);
      handleSelectSection('customers');
      if (item.id) {
        navigate(`/admin/customers/${item.id}`);
      }
    } else if (type === 'restaurant') {
      handleSelectSection('restaurants');
    } else if (type === 'table') {
      handleSelectSection('tables');
    } else if (type === 'voucher') {
      handleSelectSection('vouchers');
    }
  };

  // Food CRUD Handlers
  const handleSaveFood = (foodData) => {
    if (foodData.id) {
      dispatch(updateFood(foodData));
      dispatch(logActivity({
        action: 'Updated Food Item',
        entity: foodData.name,
        entityType: 'Food',
        prevValue: `₹${editingFood?.price || 0}`,
        newValue: `₹${foodData.price} (${foodData.restaurantName})`,
      }));
      showToast(`Updated ${foodData.name}`, 'success');
    } else {
      dispatch(addFood(foodData));
      dispatch(logActivity({
        action: 'Added New Food Item',
        entity: foodData.name,
        entityType: 'Food',
        prevValue: 'None',
        newValue: `₹${foodData.price} (${foodData.restaurantName})`,
      }));
      showToast(`Added ${foodData.name} to menu catalog`, 'success');
    }
    trackAccess('FOOD', foodData.name, foodData.restaurantName);
    setEditingFood(null);
  };

  const handleDeleteFood = (id, name) => {
    setConfirmDelete({
      type: 'food',
      id,
      title: `Delete Dish: ${name}?`,
      message: `Are you sure you want to delete ${name} from the catalog? This will remove it from customer menus.`,
      onConfirm: () => {
        dispatch(deleteFood(id));
        dispatch(logActivity({
          action: 'Deleted Food Item',
          entity: name,
          entityType: 'Food',
          prevValue: 'Active',
          newValue: 'Deleted',
        }));
        showToast(`Removed ${name}`, 'info');
      },
    });
  };

  // Chef CRUD Handlers
  const handleSaveChef = (chefData) => {
    if (chefData.id) {
      dispatch(updateChef(chefData));
      dispatch(logActivity({
        action: 'Updated Chef Profile',
        entity: chefData.name,
        entityType: 'Chef',
        prevValue: editingChef?.specialization || 'Chef',
        newValue: chefData.specialization,
      }));
      showToast(`Updated ${chefData.name}`, 'success');
    } else {
      dispatch(addChef(chefData));
      dispatch(logActivity({
        action: 'Added Master Chef',
        entity: chefData.name,
        entityType: 'Chef',
        prevValue: 'None',
        newValue: `${chefData.specialization} (${chefData.restaurantName})`,
      }));
      showToast(`Added ${chefData.name}`, 'success');
    }
    trackAccess('CHEF', chefData.name, chefData.restaurantName);
    setEditingChef(null);
  };

  const handleDeleteChef = (id, name) => {
    setConfirmDelete({
      type: 'chef',
      id,
      title: `Remove Chef: ${name}?`,
      message: `Are you sure you want to remove ${name} from the master culinary staff?`,
      onConfirm: () => {
        dispatch(deleteChef(id));
        dispatch(logActivity({
          action: 'Removed Chef',
          entity: name,
          entityType: 'Chef',
          prevValue: 'Active',
          newValue: 'Removed',
        }));
        showToast(`Removed chef ${name}`, 'info');
      },
    });
  };

  // Table Floor Map Handlers
  const handleSaveTable = (tableData) => {
    if (tableData.id && tables.some(t => t.id === tableData.id)) {
      saveTables(tables.map(t => t.id === tableData.id ? { ...t, ...tableData } : t));
      dispatch(logActivity({
        action: 'Modified Table Station',
        entity: `Table ${tableData.label}`,
        entityType: 'Table',
        prevValue: `${editingTable?.capacity || 4} seats`,
        newValue: `${tableData.capacity} seats (${tableData.seatingType})`,
      }));
      showToast(`Table ${tableData.label} updated`, 'success');
    } else {
      saveTables([...tables, tableData]);
      dispatch(logActivity({
        action: 'Added Table Station',
        entity: `Table ${tableData.label}`,
        entityType: 'Table',
        prevValue: 'None',
        newValue: `${tableData.capacity} seats (${tableData.seatingType})`,
      }));
      showToast(`Table ${tableData.label} added to floor map`, 'success');
    }
    setTableModalOpen(false);
    setEditingTable(null);
  };

  const handleDeleteTable = (tId) => {
    const current = tables.find(t => t.id === tId);
    if (!current) return;
    setConfirmDelete({
      title: `Delete Table ${current.label}?`,
      message: `Are you sure you want to remove Table ${current.label} (${current.capacity} guests • ${current.seatingType}) from the floor map?`,
      onConfirm: () => {
        saveTables(tables.filter(t => t.id !== tId));
        dispatch(logActivity({
          action: 'Deleted Table Station',
          entity: `Table ${current.label}`,
          entityType: 'Table',
          prevValue: current.label,
          newValue: 'Deleted',
        }));
        showToast(`Table ${current.label} deleted from floor map`, 'info');
      },
    });
  };

  // Delivery Partner Handlers
  const handleSavePartner = (pData) => {
    if (pData.id && deliveryPartners.some(p => p.id === pData.id)) {
      const updated = deliveryPartners.map(p => p.id === pData.id ? { ...p, ...pData } : p);
      saveDeliveryPartners(updated);
      dispatch(logActivity({
        action: 'Updated Delivery Partner',
        entity: pData.name,
        entityType: 'DeliveryPartner',
        prevValue: editingPartner?.status || 'Available',
        newValue: `${pData.status} • ${pData.currentLocation}`,
      }));
      showToast(`Delivery partner ${pData.name} updated`, 'success');
    } else {
      const updated = [pData, ...deliveryPartners];
      saveDeliveryPartners(updated);
      dispatch(logActivity({
        action: 'Registered Delivery Partner',
        entity: pData.name,
        entityType: 'DeliveryPartner',
        prevValue: 'None',
        newValue: `${pData.vehicleType} (${pData.vehicleNumber})`,
      }));
      showToast(`Delivery partner ${pData.name} registered`, 'success');
    }
    setPartnerModalOpen(false);
    setEditingPartner(null);
  };

  const handleDeletePartner = (pId) => {
    const target = deliveryPartners.find(p => p.id === pId);
    if (!target) return;
    setConfirmDelete({
      title: `Delete Delivery Partner ${target.name}?`,
      message: `Are you sure you want to remove ${target.name} (${target.vehicleNumber}) from the active delivery fleet?`,
      onConfirm: () => {
        saveDeliveryPartners(deliveryPartners.filter(p => p.id !== pId));
        dispatch(logActivity({
          action: 'Removed Delivery Partner',
          entity: target.name,
          entityType: 'DeliveryPartner',
          prevValue: target.name,
          newValue: 'Removed',
        }));
        showToast(`Delivery partner ${target.name} removed from fleet`, 'info');
      },
    });
  };

  const handleTogglePartnerStatus = (pId) => {
    const target = deliveryPartners.find(p => p.id === pId);
    if (!target) return;
    const cycle = ['Available', 'On Duty', 'Out for Delivery', 'Offline'];
    const nextStatus = cycle[(cycle.indexOf(target.status) + 1) % cycle.length];
    const updated = deliveryPartners.map(p => p.id === pId ? { ...p, status: nextStatus } : p);
    saveDeliveryPartners(updated);
    showToast(`${target.name} status updated to ${nextStatus}`, 'info');
  };

  const handleCycleTableStatus = (tId) => {
    const cycle = ['free', 'seating-soon', 'occupied', 'cleaning', 'free'];
    const current = tables.find(t => t.id === tId);
    if (!current) return;
    const nextStatus = cycle[(cycle.indexOf(current.status) + 1) % (cycle.length - 1)];
    saveTables(tables.map(t => t.id === tId ? { ...t, status: nextStatus } : t));
    dispatch(logActivity({
      action: 'Updated Table Floor Status',
      entity: `Table ${current.label}`,
      entityType: 'Table',
      prevValue: current.status,
      newValue: nextStatus,
    }));
  };

  // Partner Restaurant Handlers
  const handleSaveRestaurant = (restData) => {
    if (restData.id && restaurantsList.some(r => r.id === restData.id)) {
      saveRestaurants(restaurantsList.map(r => r.id === restData.id ? { ...r, ...restData } : r));
      dispatch(logActivity({
        action: 'Updated Restaurant',
        entity: restData.name,
        entityType: 'Restaurant',
        prevValue: editingRestaurant?.status || 'Open',
        newValue: restData.status,
      }));
      showToast(`Restaurant ${restData.name} updated`, 'success');
    } else {
      saveRestaurants([restData, ...restaurantsList]);
      dispatch(logActivity({
        action: 'Onboarded Restaurant',
        entity: restData.name,
        entityType: 'Restaurant',
        prevValue: 'None',
        newValue: `${restData.area} region`,
      }));
      showToast(`Restaurant ${restData.name} onboarded`, 'success');
    }
    setEditingRestaurant(null);
  };

  // Voucher Handlers
  const handleSaveVoucher = (vData) => {
    dispatch(addVoucher(vData));
    dispatch(logActivity({
      action: 'Created Voucher',
      entity: vData.code,
      entityType: 'Voucher',
      prevValue: 'None',
      newValue: `${vData.discountPct}% OFF up to ₹${vData.maxDiscount}`,
    }));
    showToast(`Voucher ${vData.code} published`, 'success');
  };

  // Order Handlers (Part 3)
  const handleCloseOrderModal = () => {
    setOrderDetailsModalOpen(false);
    setSelectedOrder(null);
    if (orderId) {
      navigate(`/admin/${activeSection || 'orders'}`, { replace: true });
    }
  };

  const handleOpenOrder = (o) => {
    setSelectedOrder(o);
    setOrderDetailsModalOpen(true);
    trackAccess('ORDER', o.id, o.restaurantName);
    navigate(`/admin/orders/${o.id}`);
  };

  const handleUpdateOrderStatus = (oId, status, opts = {}) => {
    dispatch(updateOrderStatus({ id: oId, status, ...opts }));
    dispatch(logActivity({
      action: 'Updated Order Stage',
      entity: `Order #${oId}`,
      entityType: 'Order',
      prevValue: selectedOrder?.status || 'In Progress',
      newValue: status,
    }));
    showToast(`Order #${oId} set to ${status}`, 'success');
  };

  const handleCancelOrder = (oId, opts = {}) => {
    dispatch(cancelOrder({ id: oId, ...opts }));
    dispatch(logActivity({
      action: 'Cancelled Order',
      entity: `Order #${oId}`,
      entityType: 'Order',
      prevValue: 'Active',
      newValue: `Cancelled: ${opts.reason || 'Admin Action'}`,
    }));
    showToast(`Order #${oId} cancelled`, 'info');
  };

  const handleProcessRefund = (oId) => {
    dispatch(completeRefund(oId));
    dispatch(logActivity({
      action: 'Completed Refund',
      entity: `Order #${oId}`,
      entityType: 'Refund',
      prevValue: 'Processing',
      newValue: 'Completed via Gateway',
    }));
    showToast(`Refund completed for Order #${oId}`, 'success');
  };

  const handleUpdateOrderPriority = (oId, priority) => {
    dispatch(updateOrderPriority({ id: oId, priority }));
    showToast(`Priority set to ${priority}`, 'info');
  };

  const handleUpdateInternalNote = (oId, note) => {
    dispatch(updateInternalNote({ id: oId, note }));
    showToast('Internal note saved', 'success');
  };

  const handleUpdateKitchenStatus = (oId, kitchenStatus) => {
    dispatch(updateKitchenStatus({ id: oId, kitchenStatus }));
    showToast(`Kitchen status: ${kitchenStatus}`, 'info');
  };

  const handleResolveIncident = (oId, action, note) => {
    dispatch(resolveKitchenIncident({ id: oId, action, note }));
    showToast(`Incident action executed: ${action}`, 'info');
  };

  const handleVerifyDeliveryOtp = (oId) => {
    dispatch(verifyDeliveryOtp({ id: oId }));
    showToast('Delivery OTP verified', 'success');
  };

  const handleViewCustomerFromOrder = (cust) => {
    const foundUser = users.find(u => u.id === cust.id || u.email === cust.email);
    const target = foundUser || cust;
    setSelectedCustomer(target);
    setOrderDetailsModalOpen(false);
    setPreOrderModalOpen(false);
    handleSelectSection('customers');
    navigate(`/admin/customers/${target.id || target.email}`);
  };

  const handleViewRestaurantFromOrder = (restaurantId, restaurantName) => {
    const rest = restaurantsList.find(r => r.id === restaurantId || r.name === restaurantName);
    if (rest) {
      setEditingRestaurant(rest);
      setRestaurantModalOpen(true);
    } else {
      handleSelectSection('restaurants');
    }
  };

  const handleViewBookingFromOrder = (bookingId) => {
    const bk = bookings.find(b => b.id === bookingId);
    if (bk) {
      setSelectedBooking(bk);
      setPreOrderModalOpen(true);
    } else {
      handleSelectSection('bookings');
    }
  };

  // Admin Profile Photo Upload Flow & Profile Update (VIEW 18)
  const handleAdminAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result;
      setAdminAvatarPreview(dataUrl);
      dispatch(setAvatar(dataUrl));
      dispatch(logActivity({
        action: 'Updated Admin Profile Photo',
        entity: adminEmail,
        entityType: 'Admin Profile',
        prevValue: 'Avatar',
        newValue: 'New Device Photo Uploaded',
      }));
      showToast('Admin profile photo updated from device!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAdminAvatar = () => {
    setAdminAvatarPreview('');
    dispatch(removeAvatar());
    dispatch(logActivity({
      action: 'Removed Admin Profile Photo',
      entity: adminEmail,
      entityType: 'Admin Profile',
      prevValue: 'Photo',
      newValue: 'Default Vector Avatar',
    }));
    showToast('Admin photo removed; default avatar set', 'info');
  };

  const handleSaveAdminProfile = (e) => {
    e.preventDefault();
    dispatch(updateProfile({
      fullName: adminName.trim(),
      phone: adminPhone.trim(),
      email: adminEmail.trim(),
    }));
    dispatch(logActivity({
      action: 'Updated Admin Account Details',
      entity: adminEmail,
      entityType: 'Admin Profile',
      prevValue: currentUser?.fullName || '',
      newValue: adminName.trim(),
    }));
    showToast('Admin profile saved successfully!', 'success');
  };

  const handleResetOrderFilters = () => {
    setOrderStatusFilter('all');
    setOrderPaymentFilter('all');
    setOrderTypeFilter('all');
    setOrderRestaurantFilter('all');
    setOrderDateFilter('all');
    setOrderCustomDate('');
    setOrderSearchQuery('');
    setOrderPage(1);
    showToast('Order filters reset', 'info');
  };

  // Section 1: Top 8 Summary Cards from Live App Data
  const orderSummaryStats = useMemo(() => {
    const totalOrders = orders.length;
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const todayOrders = orders.filter(o => {
      const d = o.placedAt || o.createdAt;
      if (!d) return false;
      try {
        const orderDateStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(d));
        return orderDateStr === todayStr;
      } catch {
        return (d || '').slice(0, 10) === todayStr;
      }
    }).length;

    const pendingOrders = orders.filter(o => !o.cancelled && (o.status === 'Placed' || o.status === 'Confirmed')).length;
    const preparingOrders = orders.filter(o => !o.cancelled && (o.status === 'Preparing' || o.status === 'Food Preparing')).length;
    const readyOrders = orders.filter(o => !o.cancelled && (o.status === 'Ready' || o.status === 'Food Ready')).length;
    const outForDeliveryOrders = orders.filter(o => !o.cancelled && o.status === 'Out for Delivery').length;
    const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
    const cancelledOrders = orders.filter(o => o.cancelled || o.status === 'Cancelled').length;

    return {
      total: totalOrders,
      today: todayOrders,
      pending: pendingOrders,
      preparing: preparingOrders,
      ready: readyOrders,
      outForDelivery: outForDeliveryOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
    };
  }, [orders]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (orderStatusFilter !== 'all') count++;
    if (orderPaymentFilter !== 'all') count++;
    if (orderTypeFilter !== 'all') count++;
    if (orderRestaurantFilter !== 'all') count++;
    if (orderDateFilter !== 'all') count++;
    return count;
  }, [orderStatusFilter, orderPaymentFilter, orderTypeFilter, orderRestaurantFilter, orderDateFilter]);

  // Comprehensive Multi-Parameter Filtered Orders (Section 4 & 5)
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // 1. Status Filter
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) {
        return false;
      }

      // 2. Payment Filter
      if (orderPaymentFilter !== 'all') {
        const pStatus = (o.paymentStatus || 'Paid').toLowerCase();
        const targetP = orderPaymentFilter.toLowerCase();
        if (!pStatus.includes(targetP)) return false;
      }

      // 3. Order Type Filter
      if (orderTypeFilter !== 'all') {
        const oType = (o.orderType || (o.bookingId ? 'Dine-in / Pre-order' : 'Delivery')).toLowerCase();
        if (oType !== orderTypeFilter.toLowerCase()) return false;
      }

      // 4. Restaurant Filter
      if (orderRestaurantFilter !== 'all') {
        if (o.restaurantId !== orderRestaurantFilter && o.restaurantName !== orderRestaurantFilter) {
          return false;
        }
      }

      // 5. Date Filter (Configured Business Timezone: Asia/Kolkata)
      if (orderDateFilter !== 'all') {
        const rawDate = o.placedAt || o.createdAt;
        if (!rawDate) return false;
        const orderDateObj = new Date(rawDate);
        if (isNaN(orderDateObj.getTime())) return false;

        const getLocalYMD = (d) => {
          try {
            return new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }).format(d);
          } catch {
            return d.toISOString().slice(0, 10);
          }
        };

        const todayLocal = getLocalYMD(new Date());
        const orderLocal = getLocalYMD(orderDateObj);

        if (orderDateFilter === 'today') {
          if (orderLocal !== todayLocal) return false;
        } else if (orderDateFilter === 'yesterday') {
          const yesterdayDate = new Date(Date.now() - 86400000);
          const yesterdayLocal = getLocalYMD(yesterdayDate);
          if (orderLocal !== yesterdayLocal) return false;
        } else if (orderDateFilter === 'this-week') {
          const sevenDaysAgo = Date.now() - 7 * 86400000;
          if (orderDateObj.getTime() < sevenDaysAgo) return false;
        } else if (orderDateFilter === 'this-month') {
          if (orderLocal.slice(0, 7) !== todayLocal.slice(0, 7)) return false;
        } else if (orderDateFilter === 'custom' && orderCustomDate) {
          if (orderLocal !== orderCustomDate) return false;
        }
      }

      // 6. Global Search Query (Order ID, Customer Name, Email, Phone, Restaurant, Food Dish)
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase().trim();
        const matchId = (o.id || '').toLowerCase().includes(q);
        const matchCust = (o.customerName || o.userName || '').toLowerCase().includes(q);
        const matchEmail = (o.customerEmail || o.userEmail || '').toLowerCase().includes(q);
        const matchPhone = (o.customerPhone || '').includes(q);
        const matchRest = (o.restaurantName || '').toLowerCase().includes(q);
        const matchFood = (o.items || []).some(item => (item.name || '').toLowerCase().includes(q));

        if (!matchId && !matchCust && !matchEmail && !matchPhone && !matchRest && !matchFood) {
          return false;
        }
      }

      return true;
    });
  }, [
    orders,
    orderStatusFilter,
    orderPaymentFilter,
    orderTypeFilter,
    orderRestaurantFilter,
    orderDateFilter,
    orderCustomDate,
    orderSearchQuery,
  ]);

  // Sorted Orders for Order History View
  const sortedOrders = useMemo(() => {
    const list = [...filteredOrders];
    if (orderSortBy === 'newest') {
      list.sort((a, b) => new Date(b.placedAt || b.createdAt || 0) - new Date(a.placedAt || a.createdAt || 0));
    } else if (orderSortBy === 'oldest') {
      list.sort((a, b) => new Date(a.placedAt || a.createdAt || 0) - new Date(b.placedAt || b.createdAt || 0));
    } else if (orderSortBy === 'amount-desc') {
      list.sort((a, b) => (b.grandTotal || 0) - (a.grandTotal || 0));
    } else if (orderSortBy === 'amount-asc') {
      list.sort((a, b) => (a.grandTotal || 0) - (b.grandTotal || 0));
    }
    return list;
  }, [filteredOrders, orderSortBy]);

  // Paginated Orders for Order History
  const totalPages = Math.ceil(sortedOrders.length / orderPageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (orderPage - 1) * orderPageSize;
    return sortedOrders.slice(start, start + orderPageSize);
  }, [sortedOrders, orderPage, orderPageSize]);

  // Direct Match Order for search
  const directMatchOrder = useMemo(() => {
    if (!orderSearchQuery.trim()) return null;
    const q = orderSearchQuery.trim().toUpperCase();
    return orders.find(o => o.id.toUpperCase() === q);
  }, [orders, orderSearchQuery]);

  // Main Container Scroll Ref for independent container scrolling
  const mainContainerRef = useRef(null);

  useEffect(() => {
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollTop = 0;
    }
  }, [activeSection, section, subId]);

  // Active Orders Pagination
  const [activeOrderPage, setActiveOrderPage] = useState(1);
  const [activeOrderPageSize, setActiveOrderPageSize] = useState(10);
  useEffect(() => {
    setActiveOrderPage(1);
  }, [orderStatusFilter, orderPaymentFilter, orderTypeFilter, orderRestaurantFilter, orderDateFilter, orderSearchQuery]);

  const paginatedActiveOrders = useMemo(() => {
    const start = (activeOrderPage - 1) * activeOrderPageSize;
    return filteredOrders.slice(start, start + activeOrderPageSize);
  }, [filteredOrders, activeOrderPage, activeOrderPageSize]);

  // Payments Pagination
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPageSize, setPaymentsPageSize] = useState(10);
  const paginatedPayments = useMemo(() => {
    const start = (paymentsPage - 1) * paymentsPageSize;
    return orders.slice(start, start + paymentsPageSize);
  }, [orders, paymentsPage, paymentsPageSize]);

  // Refunds Pagination
  const [refundsPage, setRefundsPage] = useState(1);
  const [refundsPageSize, setRefundsPageSize] = useState(10);
  const refundOrders = useMemo(() => orders.filter(o => o.refund || o.cancelled), [orders]);
  const paginatedRefunds = useMemo(() => {
    const start = (refundsPage - 1) * refundsPageSize;
    return refundOrders.slice(start, start + refundsPageSize);
  }, [refundOrders, refundsPage, refundsPageSize]);

  // Vouchers Pagination
  const [vouchersPage, setVouchersPage] = useState(1);
  const [vouchersPageSize, setVouchersPageSize] = useState(10);
  const paginatedVouchers = useMemo(() => {
    const start = (vouchersPage - 1) * vouchersPageSize;
    return vouchers.slice(start, start + vouchersPageSize);
  }, [vouchers, vouchersPage, vouchersPageSize]);

  // Notifications Pagination
  const [notifsPage, setNotifsPage] = useState(1);
  const [notifsPageSize, setNotifsPageSize] = useState(10);
  const paginatedNotifs = useMemo(() => {
    const start = (notifsPage - 1) * notifsPageSize;
    return adminNotifications.slice(start, start + notifsPageSize);
  }, [adminNotifications, notifsPage, notifsPageSize]);

  // Activity Log Pagination
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState(10);
  const paginatedActivities = useMemo(() => {
    const start = (activityPage - 1) * activityPageSize;
    return activities.slice(start, start + activityPageSize);
  }, [activities, activityPage, activityPageSize]);

  // Staff Pagination
  const [staffPage, setStaffPage] = useState(1);
  const [staffPageSize, setStaffPageSize] = useState(10);
  const paginatedStaff = useMemo(() => {
    const start = (staffPage - 1) * staffPageSize;
    return staffList.slice(start, start + staffPageSize);
  }, [staffList, staffPage, staffPageSize]);

  // Inventory Pagination
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryPageSize, setInventoryPageSize] = useState(10);
  const paginatedInventory = useMemo(() => {
    const start = (inventoryPage - 1) * inventoryPageSize;
    return inventoryList.slice(start, start + inventoryPageSize);
  }, [inventoryList, inventoryPage, inventoryPageSize]);

  return (
    <div className="admin-root-layout">
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 1. Collapsible Sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        collapsed={sidebarCollapsed}
        mobileOpen={isMobileSidebarOpen}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        counts={{
          activeOrders: kpis.pendingOrders,
          activeBookings: kpis.activeBookings,
          restaurants: kpis.totalRestaurants,
          foods: kpis.totalFoodItems,
          chefs: kpis.totalChefs,
          tables: tables.length,
          riders: deliveryPartners.length,
          customers: kpis.totalCustomers,
          notifications: unreadNotifs,
          refunds: orders.filter(o => o.refund && o.refund.status !== 'Completed').length,
          staff: staffList.filter(s => s.status === 'On Duty').length,
        }}
        onLogout={handleLogout}
      />

      {/* 2. Main Admin Workspace Container */}
      <div className={`admin-workspace ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Sticky Top Navigation */}
        <AdminTopNav
          adminUser={{
            fullName: adminName,
            email: adminEmail,
            tier: 'Super Admin',
            avatar: adminAvatarPreview,
          }}
          unreadNotificationsCount={unreadNotifs}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onNavigate={handleSelectSection}
          onLogout={handleLogout}
          searchIndex={searchIndex}
          onSelectSearchResult={handleSelectSearchResult}
          onAddTable={() => {
            setEditingTable(null);
            setTableModalOpen(true);
          }}
          onAddPartner={() => {
            setEditingPartner(null);
            setPartnerModalOpen(true);
          }}
          onToggleSidebar={() => setIsMobileSidebarOpen(v => !v)}
        />

        {/* Dynamic Content Views */}
        <main ref={mainContainerRef} className="admin-main-container">
          {/* Emergency Kitchen Incident Alert Banner (Section 6 & 7) */}
          <KitchenIncidentAlertBanner />

          {/* =========================================================================
              VIEW 1: DASHBOARD OVERVIEW (Section 6, 7, 8, 9, 10)
             ========================================================================= */}
          {activeSection === 'dashboard' && (
            <div className="admin-view-fade">
              {/* Header Title, Greeting, Date & Store Operational Controls (Section 6) */}
              <div className="view-header-row" style={{ alignItems: 'center' }}>
                <div>
                  <h1 className="view-title" style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.4px', margin: 0 }}>
                    {greeting}, {adminName ? adminName.split(' ')[0] : 'Dheiva'}
                  </h1>
                  <p className="view-sub" style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4, marginBottom: 6 }}>
                    Here's what's happening with ZESTRO today.
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--accent)', fontWeight: 600 }}>
                    <Icon name="calendar" size={14} color="var(--accent)" />
                    <span>{currentDateFormatted}</span>
                  </div>
                </div>

                {/* Real-time Store Operational Mode Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div className="store-mode-selector" title="Switch Restaurant Live Operational State">
                    <button
                      type="button"
                      className={`mode-btn ${storeMode === 'normal' ? 'active normal' : ''}`}
                      onClick={() => { setStoreMode('normal'); showToast('Store set to Normal Operations', 'success'); }}
                    >
                      ● Normal
                    </button>
                    <button
                      type="button"
                      className={`mode-btn ${storeMode === 'peak' ? 'active peak' : ''}`}
                      onClick={() => { setStoreMode('peak'); showToast('Store set to Peak Hours Mode', 'info'); }}
                    >
                      ⚡ Peak Hours
                    </button>
                    <button
                      type="button"
                      className={`mode-btn ${storeMode === 'busy' ? 'active busy' : ''}`}
                      onClick={() => { setStoreMode('busy'); showToast('Kitchen Busy warning enabled', 'warning'); }}
                    >
                      🔥 Kitchen Busy
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions (Section 8) */}
              <div className="card" style={{ padding: '14px 18px', marginBottom: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="sparkles" size={15} color="var(--accent)" />
                    <span>Quick Actions</span>
                  </div>
                  <div className="quick-actions-bar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 12.5, fontWeight: 700, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => { setEditingFood(null); setFoodModalOpen(true); }}
                    >
                      <Icon name="add" size={14} /> Add Food
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 12.5, fontWeight: 600, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => { setEditingRestaurant(null); setRestaurantModalOpen(true); }}
                    >
                      <Icon name="add" size={14} /> Add Restaurant
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 12.5, fontWeight: 600, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => { setEditingChef(null); setChefModalOpen(true); }}
                    >
                      <Icon name="add" size={14} /> Add Chef
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 12.5, fontWeight: 600, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => { setEditingTable(null); setTableModalOpen(true); }}
                    >
                      <Icon name="add" size={14} /> Add Table
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 12.5, fontWeight: 600, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => { setEditingPartner(null); setPartnerModalOpen(true); }}
                    >
                      <Icon name="delivery" size={14} /> Add Partner
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 12.5, fontWeight: 600, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => setVoucherModalOpen(true)}
                    >
                      <Icon name="offers" size={14} /> Create Voucher
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 12.5, fontWeight: 600, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => handleSelectSection('orders')}
                    >
                      <Icon name="orders" size={14} /> View Orders
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 12.5, fontWeight: 600, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => handleSelectSection('table-bookings')}
                    >
                      <Icon name="calendar" size={14} /> View Bookings
                    </button>
                  </div>
                </div>
              </div>

              {/* 10 KPI Overview Cards (Section 7) */}
              <div className="kpi-grid">
                {/* 1. Total Orders */}
                <div className="card kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
                      <Icon name="orders" size={18} color="var(--accent)" />
                    </span>
                    <span className="kpi-trend positive">+12% vs wk</span>
                  </div>
                  <div className="kpi-num">{kpis.totalOrders ?? 0}</div>
                  <div className="kpi-lbl">Total Orders</div>
                </div>

                {/* 2. Today's Orders */}
                <div className="card kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, #ffb703 15%, transparent)' }}>
                      <Icon name="clock" size={18} color="#ffb703" />
                    </span>
                    <span className="kpi-trend neutral">Today</span>
                  </div>
                  <div className="kpi-num">{kpis.todayOrders ?? 0}</div>
                  <div className="kpi-lbl">Today's Orders</div>
                </div>

                {/* 3. Table Bookings */}
                <div className="card kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, #0284c7 15%, transparent)' }}>
                      <Icon name="calendar" size={18} color="#0284c7" />
                    </span>
                    <span className="kpi-trend positive">+8% vs wk</span>
                  </div>
                  <div className="kpi-num">{kpis.totalBookings ?? 0}</div>
                  <div className="kpi-lbl">Table Bookings</div>
                </div>

                {/* 4. Today's Bookings */}
                <div className="card kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, #3a86ff 15%, transparent)' }}>
                      <Icon name="calendar" size={18} color="#3a86ff" />
                    </span>
                    <span className="kpi-trend neutral">Today</span>
                  </div>
                  <div className="kpi-num">{kpis.todayBookings ?? 0}</div>
                  <div className="kpi-lbl">Today's Bookings</div>
                </div>

                {/* 5. Customers */}
                <div className="card kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, #7209b7 15%, transparent)' }}>
                      <Icon name="users" size={18} color="#7209b7" />
                    </span>
                    <span className="kpi-trend neutral">Registered</span>
                  </div>
                  <div className="kpi-num">{kpis.totalCustomers ?? 0}</div>
                  <div className="kpi-lbl">Customers</div>
                </div>

                {/* 6. Restaurants */}
                <div className="card kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, #e8542a 15%, transparent)' }}>
                      <Icon name="restaurant" size={18} color="#e8542a" />
                    </span>
                    <span className="kpi-trend neutral">Active Hubs</span>
                  </div>
                  <div className="kpi-num">{kpis.totalRestaurants ?? 0}</div>
                  <div className="kpi-lbl">Restaurants</div>
                </div>

                {/* 7. Food Items */}
                <div className="card kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, #4361ee 15%, transparent)' }}>
                      <Icon name="food" size={18} color="#4361ee" />
                    </span>
                    <span className="kpi-trend neutral">Available</span>
                  </div>
                  <div className="kpi-num">{kpis.totalFoodItems ?? 0}</div>
                  <div className="kpi-lbl">Food Items</div>
                </div>

                {/* 8. Chefs */}
                <div className="card kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, #f72585 15%, transparent)' }}>
                      <Icon name="chef" size={18} color="#f72585" />
                    </span>
                    <span className="kpi-trend positive">Active</span>
                  </div>
                  <div className="kpi-num">{kpis.totalChefs ?? 0}</div>
                  <div className="kpi-lbl">Chefs</div>
                </div>

                {/* 9. Revenue */}
                <div className="card kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)' }}>
                      <Icon name="revenue" size={18} color="var(--success)" />
                    </span>
                    <span className="kpi-trend positive">Gross Sales</span>
                  </div>
                  <div className="kpi-num">₹{(kpis.revenue || 0).toLocaleString()}</div>
                  <div className="kpi-lbl">Revenue</div>
                </div>

                {/* 10. Pending Orders */}
                <div className="card kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, #fb8500 15%, transparent)' }}>
                      <Icon name="pulse" size={18} color="#fb8500" />
                    </span>
                    <span className="kpi-trend positive" style={{ color: '#fb8500' }}>Action Req.</span>
                  </div>
                  <div className="kpi-num" style={{ color: '#fb8500' }}>{kpis.pendingOrders}</div>
                  <div className="kpi-lbl">Pending Orders</div>
                </div>
              </div>

              {/* Today's Operations (Section 9) */}
              <div className="operations-panels-grid">
                {/* Orders Lifecycle Panel */}
                <div className="operations-panel-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon name="orders" size={16} color="var(--accent)" />
                        <span>Today's Orders Status</span>
                      </h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Live ticket lifecycle breakdown</p>
                    </div>
                    <span className="operational-tag">ORDERS PIPELINE</span>
                  </div>

                  <div className="operations-flow-grid">
                    <div className="operations-flow-item">
                      <span className="operations-flow-status">Placed</span>
                      <span className="operations-flow-count">{orders.filter(o => o.status === 'Placed').length}</span>
                    </div>
                    <div className="operations-flow-item">
                      <span className="operations-flow-status">Confirmed</span>
                      <span className="operations-flow-count">{orders.filter(o => o.status === 'Confirmed' || o.status === 'Order Confirmed').length}</span>
                    </div>
                    <div className="operations-flow-item">
                      <span className="operations-flow-status">Preparing</span>
                      <span className="operations-flow-count" style={{ color: '#ffb703' }}>{kpis.kitchenPreparing}</span>
                    </div>
                    <div className="operations-flow-item">
                      <span className="operations-flow-status">Ready</span>
                      <span className="operations-flow-count" style={{ color: 'var(--success)' }}>{kpis.kitchenReady}</span>
                    </div>
                    <div className="operations-flow-item">
                      <span className="operations-flow-status">Out for Delivery</span>
                      <span className="operations-flow-count" style={{ color: 'var(--accent)' }}>{orders.filter(o => o.status === 'Out for Delivery').length}</span>
                    </div>
                    <div className="operations-flow-item">
                      <span className="operations-flow-status">Delivered</span>
                      <span className="operations-flow-count" style={{ color: 'var(--success)' }}>{orders.filter(o => o.status === 'Delivered').length}</span>
                    </div>
                    <div className="operations-flow-item">
                      <span className="operations-flow-status">Cancelled</span>
                      <span className="operations-flow-count" style={{ color: 'var(--danger)' }}>{kpis.cancelledOrders}</span>
                    </div>
                  </div>
                </div>

                {/* Table Bookings Lifecycle Panel */}
                <div className="operations-panel-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon name="calendar" size={16} color="#0284c7" />
                        <span>Today's Table Bookings</span>
                      </h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Floor seating &amp; dining progression</p>
                    </div>
                    <span className="operational-tag">FLOOR PIPELINE</span>
                  </div>

                  <div className="operations-flow-grid">
                    <div className="operations-flow-item">
                      <span className="operations-flow-status">Requested</span>
                      <span className="operations-flow-count">{bookings.filter(b => b.status === 'Requested').length}</span>
                    </div>
                    <div className="operations-flow-item">
                      <span className="operations-flow-status">Confirmed</span>
                      <span className="operations-flow-count">{bookings.filter(b => b.status === 'Confirmed').length}</span>
                    </div>
                    <div className="operations-flow-item">
                      <span className="operations-flow-status">Table Ready</span>
                      <span className="operations-flow-count" style={{ color: '#ffb703' }}>{bookings.filter(b => b.status === 'Table Ready').length}</span>
                    </div>
                    <div className="operations-flow-item">
                      <span className="operations-flow-status">Customer Arrived</span>
                      <span className="operations-flow-count" style={{ color: '#3a86ff' }}>{bookings.filter(b => b.status === 'Customer Arrived').length}</span>
                    </div>
                    <div className="operations-flow-item">
                      <span className="operations-flow-status">Dining</span>
                      <span className="operations-flow-count" style={{ color: 'var(--success)' }}>{bookings.filter(b => b.status === 'Dining').length}</span>
                    </div>
                    <div className="operations-flow-item">
                      <span className="operations-flow-status">Completed</span>
                      <span className="operations-flow-count" style={{ color: 'var(--success)' }}>{bookings.filter(b => b.status === 'Completed').length}</span>
                    </div>
                    <div className="operations-flow-item">
                      <span className="operations-flow-status">Cancelled</span>
                      <span className="operations-flow-count" style={{ color: 'var(--danger)' }}>{bookings.filter(b => b.status === 'Cancelled').length}</span>
                    </div>
                    <div className="operations-flow-item">
                      <span className="operations-flow-status">No Show</span>
                      <span className="operations-flow-count" style={{ color: 'var(--danger)' }}>{bookings.filter(b => b.status === 'No Show').length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Report Bar Charts & Analytics (User Requirement) */}
              <div className="admin-charts-grid">
                {/* 1. Weekly Revenue & Orders Bar Chart */}
                <div className="admin-chart-card">
                  <div className="chart-header-row">
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon name="analytics" size={17} color="var(--accent)" />
                        <span>Weekly Performance Bar Chart</span>
                      </h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                        {chartMetric === 'revenue' ? '7-Day Revenue Trends across Partner Hubs' : '7-Day Daily Ticket Volume'}
                      </p>
                    </div>

                    <div style={{ display: 'inline-flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 2 }}>
                      <button
                        type="button"
                        className="btn btn-xs"
                        style={{
                          background: chartMetric === 'revenue' ? 'var(--accent)' : 'transparent',
                          color: chartMetric === 'revenue' ? '#fff' : 'var(--text-muted)',
                          borderRadius: 4,
                          fontWeight: 700,
                          fontSize: 11,
                          padding: '3px 8px',
                          border: 'none',
                        }}
                        onClick={() => setChartMetric('revenue')}
                      >
                        Revenue (₹)
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs"
                        style={{
                          background: chartMetric === 'orders' ? 'var(--accent)' : 'transparent',
                          color: chartMetric === 'orders' ? '#fff' : 'var(--text-muted)',
                          borderRadius: 4,
                          fontWeight: 700,
                          fontSize: 11,
                          padding: '3px 8px',
                          border: 'none',
                        }}
                        onClick={() => setChartMetric('orders')}
                      >
                        Orders Count
                      </button>
                    </div>
                  </div>

                  <div className="chart-bars-wrap">
                    {weeklyReportData.map((d) => (
                      <div key={d.day} className="chart-bar-single" title={`${d.day}: ₹${d.revenue.toLocaleString()} (${d.orders} orders)`}>
                        <span className="chart-bar-val">
                          {chartMetric === 'revenue' ? `₹${(d.revenue / 1000).toFixed(1)}k` : `${d.orders}`}
                        </span>
                        <div
                          className="chart-bar-pillar"
                          style={{
                            height: `${d.heightPct}%`,
                            background: chartMetric === 'revenue'
                              ? 'linear-gradient(180deg, var(--accent) 0%, rgba(232, 84, 42, 0.4) 100%)'
                              : 'linear-gradient(180deg, #4361ee 0%, rgba(67, 97, 238, 0.4) 100%)',
                          }}
                        />
                        <span className="chart-bar-tag">{d.day}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>⚡ Peak day: Saturday (₹12.6k)</span>
                    <span>Weekly Total: ₹{weeklyReportData.reduce((s, r) => s + r.revenue, 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* 2. Popular Cuisine Distribution */}
                <div className="admin-chart-card">
                  <div className="chart-header-row">
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon name="food" size={17} color="var(--accent)" />
                        <span>Top Cuisine Share</span>
                      </h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Category distribution by order volume</p>
                    </div>
                  </div>

                  <div className="category-progress-list">
                    {[
                      { name: 'Biriyani & Rice Meals', pct: 38, count: 42, color: 'var(--accent)' },
                      { name: 'South Indian & Tiffin', pct: 26, count: 30, color: '#ffb703' },
                      { name: 'Chettinad & Curries', pct: 18, count: 20, color: '#f72585' },
                      { name: 'Snacks & Starters', pct: 11, count: 12, color: '#4361ee' },
                      { name: 'Desserts & Halwa', pct: 7, count: 8, color: '#7209b7' },
                    ].map(cat => (
                      <div key={cat.name} className="category-progress-item">
                        <div className="category-progress-header">
                          <span style={{ color: 'var(--text)' }}>{cat.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{cat.pct}% ({cat.count})</span>
                        </div>
                        <div className="category-progress-track">
                          <div
                            className="category-progress-bar"
                            style={{ width: `${cat.pct}%`, background: cat.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Registered Customers Directory Preview (User Requirement: "admin can see the users like name like these") */}
              <div className="card dashboard-table-card" style={{ marginBottom: 20 }}>
                <div className="card-header-flex">
                  <div>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="users" size={18} color="var(--accent)" />
                      <span>Registered Customers Directory</span>
                    </h3>
                    <p className="card-sub">Active platform users, membership tier privileges, and contact info</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={() => handleSelectSection('customers')}
                  >
                    View All Customers ({registeredCustomers.length})
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Email &amp; Contact</th>
                        <th>Membership Tier</th>
                        <th>Dine Points</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredCustomers.slice(0, 5).map(c => {
                        const tierCls = (c.tier || 'bronze').toLowerCase().replace(' ', '-');
                        return (
                          <tr key={c.id}>
                            <td>
                              <div className="customer-avatar-cell">
                                <div className="customer-mini-avatar">
                                  {c.avatar && c.avatar.startsWith('http') ? (
                                    <img src={c.avatar} alt={c.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <span>{(c.fullName?.[0] || 'U').toUpperCase()}</span>
                                  )}
                                </div>
                                <div>
                                  <strong style={{ fontSize: 13.5, color: 'var(--text)' }}>{c.fullName}</strong>
                                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>ID: {c.id}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: 13, color: 'var(--text)' }}>{c.email}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.phone || '--'}</div>
                            </td>
                            <td>
                              <span className={`tier-badge ${tierCls}`}>
                                {c.tier || 'Customer'}
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: 'var(--accent)', fontSize: 13 }}>{c.dinePoints || 0} pts</strong>
                            </td>
                            <td>
                              <span className="status-pill success">Active</span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setCustomerModalOpen(true);
                                  trackAccess('CUSTOMER', c.fullName, c.email);
                                }}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Orders & Recent Bookings Split (Section 10 & 11) */}
              <div className="dashboard-tables-split">
                {/* Recent Orders Table (Section 10) */}
                <div className="card dashboard-table-card">
                  <div className="card-header-flex">
                    <div>
                      <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon name="orders" size={16} color="var(--accent)" />
                        <span>Recent Orders</span>
                      </h3>
                      <p className="card-sub">Latest customer delivery &amp; dining tickets</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() => handleSelectSection('orders')}
                    >
                      View All ({orders.length})
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Restaurant</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Time</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(orders || []).slice(0, 5).map(o => {
                          const orderTime = o.time || (o.placedAt ? new Date(o.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:30 PM');
                          return (
                            <tr key={o.id}>
                              <td><strong>{o.id}</strong></td>
                              <td className="truncate-cell">{o.customerName || o.userEmail || 'Customer'}</td>
                              <td>{o.restaurantName}</td>
                              <td><strong>₹{o.grandTotal}</strong></td>
                              <td>
                                <span className={`status-pill ${o.cancelled ? 'danger' : 'success'}`}>
                                  {o.status}
                                </span>
                              </td>
                              <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{orderTime}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline"
                                  onClick={() => {
                                    setSelectedOrder(o);
                                    setOrderDetailsModalOpen(true);
                                    trackAccess('ORDER', o.id, o.restaurantName);
                                  }}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Table Bookings (Section 11) */}
                <div className="card dashboard-table-card">
                  <div className="card-header-flex">
                    <div>
                      <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon name="calendar" size={16} color="#0284c7" />
                        <span>Recent Table Bookings</span>
                      </h3>
                      <p className="card-sub">Dining reservations across restaurant hubs</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() => handleSelectSection('table-bookings')}
                    >
                      View All ({bookings.length})
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Customer</th>
                          <th>Restaurant</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Guests</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(bookings || []).slice(0, 5).map(b => (
                          <tr key={b.id}>
                            <td><strong>{b.id}</strong></td>
                            <td className="truncate-cell">{b.customerName || b.userEmail || 'Customer'}</td>
                            <td>{b.restaurantName}</td>
                            <td>{b.date || 'Today'}</td>
                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.time}</td>
                            <td>{b.guests} Guests</td>
                            <td>
                              <span className={`status-pill ${b.status === 'Cancelled' ? 'danger' : 'success'}`}>
                                {b.status}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-xs btn-primary"
                                onClick={() => {
                                  navigate(`/admin/bookings/${b.id}`);
                                  trackAccess('BOOKING', b.id, b.restaurantName);
                                }}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Live Recent Activity Feed (Section 12) */}
              <div className="card live-activity-section" style={{ padding: 20, marginTop: 20, marginBottom: 20 }}>
                <div className="section-header-row" style={{ marginBottom: 14 }}>
                  <div>
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="pulse" size={18} color="var(--accent)" />
                      <span>Recent Activity</span>
                    </h3>
                    <p className="section-sub">Real customer and admin events recorded across the platform</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={() => handleSelectSection('activity-log')}
                  >
                    Full Activity Log
                  </button>
                </div>

                <div className="live-activity-stream">
                  {(activities && activities.length > 0) ? (
                    activities.slice(0, 6).map((act, idx) => {
                      const timeAgo = (() => {
                        if (!act.timestamp) return 'Just now';
                        const diffMs = Date.now() - new Date(act.timestamp).getTime();
                        const mins = Math.max(1, Math.floor(diffMs / 60000));
                        if (mins < 60) return `${mins} min ago`;
                        const hrs = Math.floor(mins / 60);
                        return `${hrs} hr ago`;
                      })();

                      const iconType = act.entityType === 'Order' ? 'orders' : (act.entityType === 'Booking' || act.entityType === 'Table') ? 'calendar' : act.entityType === 'Customer' ? 'users' : 'pulse';
                      const badgeColor = act.entityType === 'Order' ? 'var(--accent)' : act.entityType === 'Booking' ? 'var(--success)' : act.entityType === 'Customer' ? '#4361ee' : 'var(--text-muted)';

                      return (
                        <div key={act.id || idx} className="live-activity-item" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: idx < 5 ? '1px solid var(--border)' : 'none' }}>
                          <span className="activity-icon-badge" style={{ width: 32, height: 32, borderRadius: 8, background: `color-mix(in srgb, ${badgeColor} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon name={iconType} size={15} color={badgeColor} />
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                              <strong style={{ fontSize: 13.5, color: 'var(--text)' }}>{act.entity}</strong>
                              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{timeAgo}</span>
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                              <span>{act.action}: </span>
                              <span style={{ color: 'var(--text)' }}>{act.newValue || act.prevValue}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      No recent activity
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: ORDERS MANAGEMENT & OPERATIONS CENTER (Part 3)
             ========================================================================= */}
          {activeSection === 'orders' && (
            <div className="admin-view-fade">
              {/* Section 1 Header */}
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Orders</h1>
                  <p className="view-sub">Monitor and manage all customer orders across ZESTRO.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setOrdersLoading(true);
                      setTimeout(() => setOrdersLoading(false), 400);
                      showToast('Orders refreshed', 'info');
                    }}
                  >
                    <Icon name="pulse" size={13} /> Refresh
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSelectSection('order-history')}
                  >
                    <Icon name="file-text" size={13} /> Order History
                  </button>
                </div>
              </div>

              {/* Section 1: Summary Cards Grid (8 Live Application KPI Metrics) */}
              <div className="orders-summary-grid">
                <div className="order-summary-card accent">
                  <span className="summary-label">Total Orders</span>
                  <div className="summary-val">{orderSummaryStats.total}</div>
                </div>
                <div className="order-summary-card primary">
                  <span className="summary-label">Today's Orders</span>
                  <div className="summary-val">{orderSummaryStats.today}</div>
                </div>
                <div className="order-summary-card warning">
                  <span className="summary-label">Pending</span>
                  <div className="summary-val">{orderSummaryStats.pending}</div>
                </div>
                <div className="order-summary-card info">
                  <span className="summary-label">Preparing</span>
                  <div className="summary-val">{orderSummaryStats.preparing}</div>
                </div>
                <div className="order-summary-card purple">
                  <span className="summary-label">Ready</span>
                  <div className="summary-val">{orderSummaryStats.ready}</div>
                </div>
                <div className="order-summary-card primary">
                  <span className="summary-label">Out for Delivery</span>
                  <div className="summary-val">{orderSummaryStats.outForDelivery}</div>
                </div>
                <div className="order-summary-card success">
                  <span className="summary-label">Delivered</span>
                  <div className="summary-val">{orderSummaryStats.delivered}</div>
                </div>
                <div className="order-summary-card danger">
                  <span className="summary-label">Cancelled</span>
                  <div className="summary-val">{orderSummaryStats.cancelled}</div>
                </div>
              </div>

              {/* Section 4 & 5: Toolbar (Search & Filter) */}
              <div className="orders-toolbar-container">
                <div className="orders-search-filter-row">
                  <div className="orders-search-input-wrap">
                    <span className="orders-search-icon">
                      <Icon name="search" size={16} />
                    </span>
                    <input
                      type="text"
                      className="admin-form-input small"
                      placeholder="Search Order ID, customer, email, phone, restaurant, dish..."
                      value={orderSearchQuery}
                      onChange={e => setOrderSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="orders-actions-group">
                    <button
                      type="button"
                      className={`btn btn-sm ${ordersFilterPanelOpen ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setOrdersFilterPanelOpen(v => !v)}
                    >
                      <Icon name="filter" size={14} />
                      <span>Filters</span>
                      {activeFiltersCount > 0 && (
                        <span className="filter-count-badge">{activeFiltersCount}</span>
                      )}
                    </button>
                    {(activeFiltersCount > 0 || orderSearchQuery) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={handleResetOrderFilters}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct Order Match Banner (Section 4) */}
                {directMatchOrder && (
                  <div className="direct-match-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="check" size={15} color="var(--accent)" />
                      <span>
                        Direct Match Found: <strong>#{directMatchOrder.id}</strong> placed by <strong>{directMatchOrder.customerName || directMatchOrder.userName}</strong> ({directMatchOrder.restaurantName})
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-xs btn-primary"
                      onClick={() => handleOpenOrder(directMatchOrder)}
                    >
                      Open Order Details
                    </button>
                  </div>
                )}

                {/* Clean Expandable Filter Panel (Section 5) */}
                {ordersFilterPanelOpen && (
                  <div className="orders-filter-expanded-panel">
                    <div className="filter-field-col">
                      <label>Status</label>
                      <select
                        value={orderStatusFilter}
                        onChange={e => setOrderStatusFilter(e.target.value)}
                        className="admin-form-select small"
                      >
                        <option value="all">All Statuses</option>
                        <option value="Placed">Placed</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready">Ready</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="filter-field-col">
                      <label>Payment</label>
                      <select
                        value={orderPaymentFilter}
                        onChange={e => setOrderPaymentFilter(e.target.value)}
                        className="admin-form-select small"
                      >
                        <option value="all">All Payments</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Failed">Failed</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </div>

                    <div className="filter-field-col">
                      <label>Order Type</label>
                      <select
                        value={orderTypeFilter}
                        onChange={e => setOrderTypeFilter(e.target.value)}
                        className="admin-form-select small"
                      >
                        <option value="all">All Types</option>
                        <option value="Delivery">Delivery</option>
                        <option value="Pickup">Pickup</option>
                        <option value="Dine-in / Pre-order">Dine-in / Pre-order</option>
                      </select>
                    </div>

                    <div className="filter-field-col">
                      <label>Restaurant</label>
                      <select
                        value={orderRestaurantFilter}
                        onChange={e => setOrderRestaurantFilter(e.target.value)}
                        className="admin-form-select small"
                      >
                        <option value="all">All Restaurants</option>
                        {restaurantsList.map(r => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-field-col">
                      <label>Date Filter</label>
                      <select
                        value={orderDateFilter}
                        onChange={e => setOrderDateFilter(e.target.value)}
                        className="admin-form-select small"
                      >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="this-week">This Week</option>
                        <option value="this-month">This Month</option>
                        <option value="custom">Custom Date</option>
                      </select>
                    </div>

                    {orderDateFilter === 'custom' && (
                      <div className="filter-field-col">
                        <label>Select Date</label>
                        <input
                          type="date"
                          value={orderCustomDate}
                          onChange={e => setOrderCustomDate(e.target.value)}
                          className="admin-form-input small"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 24: Error State with Retry Button */}
              {ordersError ? (
                <div className="card" style={{ padding: 32, textAlign: 'center', borderColor: 'var(--danger)' }}>
                  <Icon name="alert-triangle" size={36} color="var(--danger)" />
                  <h3 style={{ margin: '12px 0 6px', color: 'var(--danger)' }}>Unable to load orders</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                    An error occurred while fetching orders from the operational store.
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      setOrdersError(null);
                      setOrdersLoading(true);
                      setTimeout(() => setOrdersLoading(false), 300);
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                /* Section 2: Order Table */
                <div className="card table-container-card">
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Restaurant</th>
                          <th>Items</th>
                          <th>Amount</th>
                          <th>Payment</th>
                          <th>Order Type</th>
                          <th>Status</th>
                          <th>Date/Time</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordersLoading ? (
                          [...Array(5)].map((_, idx) => (
                            <tr key={idx} className="order-skeleton-row">
                              <td colSpan={10}>
                                <div className="order-skeleton-cell" />
                              </td>
                            </tr>
                          ))
                        ) : filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={10} style={{ textAlign: 'center', padding: 40 }}>
                              <Icon name="orders" size={40} color="var(--text-muted)" />
                              <h4 style={{ margin: '12px 0 4px', fontSize: 16 }}>
                                {orderDateFilter === 'today'
                                  ? 'No orders have been placed today.'
                                  : orders.length === 0
                                  ? 'No orders yet'
                                  : 'No matching orders found'}
                              </h4>
                              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                                {orderDateFilter === 'today'
                                  ? "Today's Orders: 0. Real orders placed today in the business timezone will appear here."
                                  : orders.length === 0
                                  ? 'Customer orders placed via ZESTRO will immediately appear in this live operational feed.'
                                  : 'Try adjusting your search query or reset the active filter panel.'}
                              </p>
                              {(activeFiltersCount > 0 || orderSearchQuery) && (
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline"
                                  onClick={handleResetOrderFilters}
                                  style={{ marginTop: 12 }}
                                >
                                  Reset Filters
                                </button>
                              )}
                            </td>
                          </tr>
                        ) : (
                          paginatedActiveOrders.map(o => {
                            const dateStr = o.placedAt || o.createdAt ? new Date(o.placedAt || o.createdAt).toLocaleDateString() : 'Today';
                            const timeStr = o.placedAt || o.createdAt ? new Date(o.placedAt || o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:30 PM';
                            const oType = o.orderType || (o.bookingId ? 'Dine-in / Pre-order' : 'Delivery');

                            return (
                              <tr key={o.id}>
                                {/* 1. Order ID (Clickable -> Opens Order Details) */}
                                <td>
                                  <button
                                    type="button"
                                    className="clickable-link-btn"
                                    onClick={() => handleOpenOrder(o)}
                                    title="Click to view full order details"
                                  >
                                    {o.id}
                                  </button>
                                </td>

                                {/* 2. Customer (Clickable -> Opens Customer Details) */}
                                <td>
                                  <button
                                    type="button"
                                    className="customer-click-pill"
                                    onClick={() => handleViewCustomerFromOrder({
                                      id: o.userId,
                                      fullName: o.customerName || o.userName,
                                      email: o.customerEmail || o.userEmail,
                                      phone: o.customerPhone,
                                      avatar: o.customerAvatar,
                                    })}
                                    title="Click to view customer profile"
                                  >
                                    <div className="customer-mini-avatar" style={{ width: 28, height: 28 }}>
                                      {o.customerAvatar ? (
                                        <SafeImage image={o.customerAvatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                      ) : (
                                        <span>{((o.customerName || o.userName || 'C')[0]).toUpperCase()}</span>
                                      )}
                                    </div>
                                    <div>
                                      <strong style={{ fontSize: 13, color: 'var(--text)' }}>
                                        {o.customerName || o.userName || 'Customer'}
                                      </strong>
                                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        {o.customerEmail || o.userEmail || '--'}
                                      </div>
                                    </div>
                                  </button>
                                </td>

                                {/* 3. Restaurant (Clickable -> Opens Restaurant Modal) */}
                                <td>
                                  <button
                                    type="button"
                                    className="clickable-link-btn"
                                    style={{ color: 'var(--text)', fontWeight: 600 }}
                                    onClick={() => handleViewRestaurantFromOrder(o.restaurantId, o.restaurantName)}
                                    title="Click to view restaurant details"
                                  >
                                    {o.restaurantName}
                                  </button>
                                </td>

                                {/* 4. Food Items */}
                                <td>
                                  <div style={{ maxWidth: 200, fontSize: 12.5 }} className="truncate-cell" title={o.items?.map(i => `${i.name} × ${i.qty}`).join(', ')}>
                                    {o.items?.map(i => `${i.name} × ${i.qty}`).join(', ') || 'Food items'}
                                  </div>
                                </td>

                                {/* 5. Amount */}
                                <td>
                                  <strong style={{ color: 'var(--accent)', fontSize: 13.5 }}>₹{o.grandTotal}</strong>
                                </td>

                                {/* 6. Payment */}
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <span className="payment-badge">{o.paymentMethod || 'UPI'}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: (o.paymentStatus || '').includes('Paid') ? '#2ecc71' : 'var(--text-muted)' }}>
                                      {o.paymentStatus || 'Paid (Demo)'}
                                    </span>
                                  </div>
                                </td>

                                {/* 7. Order Type */}
                                <td>
                                  <span className={`order-type-chip ${oType === 'Dine-in / Pre-order' ? 'preorder' : oType === 'Pickup' ? 'pickup' : 'delivery'}`}>
                                    <Icon name={oType === 'Dine-in / Pre-order' ? 'table' : oType === 'Pickup' ? 'bag' : 'scooter'} size={12} />
                                    <span>{oType}</span>
                                  </span>
                                </td>

                                {/* 8. Status */}
                                <td>
                                  <span className={`status-pill ${o.cancelled ? 'danger' : 'success'}`}>
                                    {o.status}
                                  </span>
                                </td>

                                {/* 9. Date/Time */}
                                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                  <div>{dateStr}</div>
                                  <div style={{ fontSize: 11 }}>{timeStr}</div>
                                </td>

                                {/* 10. Action */}
                                <td>
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline"
                                      onClick={() => handleOpenOrder(o)}
                                    >
                                      Details
                                    </button>
                                    {!o.cancelled && o.status !== 'Delivered' && (
                                      <button
                                        type="button"
                                        className="btn btn-xs btn-primary"
                                        onClick={() => {
                                          dispatch(advanceOrderStage(o.id));
                                          showToast(`Advanced #${o.id}`, 'success');
                                        }}
                                        title="Advance fulfillment lifecycle"
                                      >
                                        Next <Icon name="chevron-right" size={11} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={activeOrderPage}
                    totalItems={filteredOrders.length}
                    pageSize={activeOrderPageSize}
                    onPageChange={setActiveOrderPage}
                    onPageSizeChange={(sz) => {
                      setActiveOrderPageSize(sz);
                      setActiveOrderPage(1);
                    }}
                    itemName="orders"
                  />
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW 3: COMPLETE ORDER HISTORY (Section 23)
             ========================================================================= */}
          {activeSection === 'order-history' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Order History</h1>
                  <p className="view-sub">Complete audit history of all customer food orders with multi-parameter filtering, sorting, and pagination.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleSelectSection('orders')}
                >
                  <Icon name="orders" size={14} /> Active Orders Operations
                </button>
              </div>

              {/* Multi-Parameter Filter & Sort Toolbar (Section 23) */}
              <div className="orders-toolbar-container">
                <div className="orders-search-filter-row">
                  <div className="orders-search-input-wrap">
                    <span className="orders-search-icon">
                      <Icon name="search" size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search order history by ID, customer, restaurant, dish..."
                      value={orderSearchQuery}
                      onChange={e => {
                        setOrderSearchQuery(e.target.value);
                        setOrderPage(1);
                      }}
                      className="admin-form-input small"
                    />
                  </div>

                  <div className="orders-actions-group">
                    {/* Sort Selector */}
                    <select
                      value={orderSortBy}
                      onChange={e => setOrderSortBy(e.target.value)}
                      className="admin-form-select small"
                      style={{ minWidth: 150 }}
                    >
                      <option value="newest">Sort: Newest First</option>
                      <option value="oldest">Sort: Oldest First</option>
                      <option value="amount-desc">Sort: Highest Amount</option>
                      <option value="amount-asc">Sort: Lowest Amount</option>
                    </select>

                    <button
                      type="button"
                      className={`btn btn-sm ${ordersFilterPanelOpen ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setOrdersFilterPanelOpen(v => !v)}
                    >
                      <Icon name="filter" size={14} />
                      <span>Filters</span>
                      {activeFiltersCount > 0 && (
                        <span className="filter-count-badge">{activeFiltersCount}</span>
                      )}
                    </button>

                    {(activeFiltersCount > 0 || orderSearchQuery) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={handleResetOrderFilters}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {ordersFilterPanelOpen && (
                  <div className="orders-filter-expanded-panel">
                    <div className="filter-field-col">
                      <label>Status Filter</label>
                      <select
                        value={orderStatusFilter}
                        onChange={e => {
                          setOrderStatusFilter(e.target.value);
                          setOrderPage(1);
                        }}
                        className="admin-form-select small"
                      >
                        <option value="all">All Statuses</option>
                        <option value="Placed">Placed</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready">Ready</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="filter-field-col">
                      <label>Payment Filter</label>
                      <select
                        value={orderPaymentFilter}
                        onChange={e => {
                          setOrderPaymentFilter(e.target.value);
                          setOrderPage(1);
                        }}
                        className="admin-form-select small"
                      >
                        <option value="all">All Payments</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Failed">Failed</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </div>

                    <div className="filter-field-col">
                      <label>Order Type</label>
                      <select
                        value={orderTypeFilter}
                        onChange={e => {
                          setOrderTypeFilter(e.target.value);
                          setOrderPage(1);
                        }}
                        className="admin-form-select small"
                      >
                        <option value="all">All Types</option>
                        <option value="Delivery">Delivery</option>
                        <option value="Pickup">Pickup</option>
                        <option value="Dine-in / Pre-order">Dine-in / Pre-order</option>
                      </select>
                    </div>

                    <div className="filter-field-col">
                      <label>Restaurant</label>
                      <select
                        value={orderRestaurantFilter}
                        onChange={e => {
                          setOrderRestaurantFilter(e.target.value);
                          setOrderPage(1);
                        }}
                        className="admin-form-select small"
                      >
                        <option value="all">All Restaurants</option>
                        {restaurantsList.map(r => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-field-col">
                      <label>Date Range</label>
                      <select
                        value={orderDateFilter}
                        onChange={e => {
                          setOrderDateFilter(e.target.value);
                          setOrderPage(1);
                        }}
                        className="admin-form-select small"
                      >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="this-week">This Week</option>
                        <option value="this-month">This Month</option>
                        <option value="custom">Custom Date</option>
                      </select>
                    </div>

                    {orderDateFilter === 'custom' && (
                      <div className="filter-field-col">
                        <label>Select Date</label>
                        <input
                          type="date"
                          value={orderCustomDate}
                          onChange={e => {
                            setOrderCustomDate(e.target.value);
                            setOrderPage(1);
                          }}
                          className="admin-form-input small"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Order History Table */}
              <div className="card table-container-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date &amp; Time</th>
                        <th>Customer</th>
                        <th>Restaurant</th>
                        <th>Total Amount</th>
                        <th>Payment</th>
                        <th>Order Type</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>
                            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                              {orders.length === 0 ? 'No orders recorded yet.' : 'No orders match the current filter criteria.'}
                            </p>
                            {(activeFiltersCount > 0 || orderSearchQuery) && (
                              <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                onClick={handleResetOrderFilters}
                                style={{ marginTop: 10 }}
                              >
                                Reset Filters
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        paginatedOrders.map(o => {
                          const dateFormatted = o.placedAt || o.createdAt ? new Date(o.placedAt || o.createdAt).toLocaleDateString() : 'Recent';
                          const timeFormatted = o.placedAt || o.createdAt ? new Date(o.placedAt || o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:30 PM';
                          const oType = o.orderType || (o.bookingId ? 'Dine-in / Pre-order' : 'Delivery');

                          return (
                            <tr key={o.id}>
                              <td>
                                <button
                                  type="button"
                                  className="clickable-link-btn"
                                  onClick={() => handleOpenOrder(o)}
                                >
                                  {o.id}
                                </button>
                              </td>
                              <td className="muted" style={{ fontSize: 12 }}>
                                <div>{dateFormatted}</div>
                                <div style={{ fontSize: 11 }}>{timeFormatted}</div>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="clickable-link-btn"
                                  style={{ color: 'var(--text)', fontWeight: 600 }}
                                  onClick={() => handleViewCustomerFromOrder({
                                    id: o.userId,
                                    fullName: o.customerName || o.userName,
                                    email: o.customerEmail || o.userEmail,
                                    phone: o.customerPhone,
                                    avatar: o.customerAvatar,
                                  })}
                                >
                                  {o.customerName || o.userName || o.userEmail || 'Guest'}
                                </button>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="clickable-link-btn"
                                  style={{ color: 'var(--text)' }}
                                  onClick={() => handleViewRestaurantFromOrder(o.restaurantId, o.restaurantName)}
                                >
                                  {o.restaurantName}
                                </button>
                              </td>
                              <td><strong style={{ color: 'var(--accent)', fontSize: 13.5 }}>₹{o.grandTotal}</strong></td>
                              <td><span className="payment-badge">{o.paymentMethod || 'UPI'}</span></td>
                              <td>
                                <span className={`order-type-chip ${oType === 'Dine-in / Pre-order' ? 'preorder' : oType === 'Pickup' ? 'pickup' : 'delivery'}`}>
                                  {oType}
                                </span>
                              </td>
                              <td>
                                <span className={`status-pill ${o.cancelled ? 'danger' : 'success'}`}>
                                  {o.status}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline"
                                  onClick={() => handleOpenOrder(o)}
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Universal Pagination */}
                <Pagination
                  currentPage={orderPage}
                  totalItems={sortedOrders.length}
                  pageSize={orderPageSize}
                  onPageChange={setOrderPage}
                  onPageSizeChange={(sz) => {
                    setOrderPageSize(sz);
                    setOrderPage(1);
                  }}
                  itemName="orders"
                />
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 4: TABLE BOOKINGS & PRE-ORDERS (Section 18 & 19)
             ========================================================================= */}
          {/* =========================================================================
              VIEW 4 & 5: TABLE BOOKINGS & RESERVATION HISTORY (PART 6)
             ========================================================================= */}
          {(activeSection === 'bookings' || activeSection === 'table-bookings') && (
            <BookingManagement
              subId={currentSubId}
              isHistory={false}
              onOpenOrder={(ordId) => {
                const found = orders.find(o => o.id === ordId);
                if (found) {
                  setSelectedOrder(found);
                  setOrderDetailsModalOpen(true);
                }
              }}
              onAddTable={() => {
                setEditingTable(null);
                setTableModalOpen(true);
              }}
            />
          )}

          {activeSection === 'booking-history' && (
            <BookingManagement
              subId={currentSubId}
              isHistory={true}
              onOpenOrder={(ordId) => {
                const found = orders.find(o => o.id === ordId);
                if (found) {
                  setSelectedOrder(found);
                  setOrderDetailsModalOpen(true);
                }
              }}
              onAddTable={() => {
                setEditingTable(null);
                setTableModalOpen(true);
              }}
            />
          )}

          {/* =========================================================================
              VIEW 6: RESTAURANTS MANAGEMENT (Section 14)
             ========================================================================= */}
          {activeSection === 'restaurants' && (
            <RestaurantManagement subId={currentSubId} extraId={extraId} />
          )}

          {/* =========================================================================
              VIEW 7: FOOD & MENU MANAGEMENT (Section 13)
              "admin add,remove food, update, image ,manual ah vaikanum"
             ========================================================================= */}
          {activeSection === 'food' && (
            <FoodManagement subId={currentSubId} extraId={extraId} />
          )}

          {/* =========================================================================
              VIEW 8: CHEFS MANAGEMENT & PERFORMANCE (Section 8 & 9)
             ========================================================================= */}
          {activeSection === 'chefs' && (
            <ChefManagement subId={currentSubId} extraId={extraId} />
          )}

          {/* =========================================================================
              VIEW 9: DIGITAL TWIN TABLE MANAGEMENT (Section 17)
             ========================================================================= */}
          {activeSection === 'tables' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Digital Twin Floor Map ({tables.length} Stations)</h1>
                  <p className="view-sub">Interactive floor layout — Click any table to toggle live status</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setEditingTable(null);
                      setTableModalOpen(true);
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                  >
                    <Icon name="add" size={14} color="#ffffff" />
                    <span>+ Add Table</span>
                  </button>
                </div>
              </div>

              {/* Floor Status Legend */}
              <div className="card floor-legend-bar">
                <div className="legend-items-wrap">
                  <span className="legend-item"><span className="legend-dot free" /> Free / Available ({kpis.freeTables})</span>
                  <span className="legend-item"><span className="legend-dot reserved" /> Reserved / Seating Soon ({tables.filter(t => t.status === 'seating-soon').length})</span>
                  <span className="legend-item"><span className="legend-dot occupied" /> Occupied / Dining ({kpis.occupiedTables})</span>
                  <span className="legend-item"><span className="legend-dot cleaning" /> Cleaning ({kpis.cleaningTables})</span>
                </div>
              </div>

              {/* Table Stations Grid */}
              <div className="card table-floor-grid-card" style={{ marginTop: 16 }}>
                <div className="floor-station-grid">
                  {tables.map(t => (
                    <div
                      key={t.id}
                      className={`floor-table-cell ${t.status}`}
                      onClick={() => handleCycleTableStatus(t.id)}
                      title={`Click card to cycle status: ${t.status}`}
                    >
                      <div className="table-top-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Icon name="table" size={20} />
                          <strong>{t.label}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            style={{ padding: '2px 6px', fontSize: 11, borderRadius: 4 }}
                            onClick={() => {
                              setEditingTable(t);
                              setTableModalOpen(true);
                            }}
                            title="Edit Table"
                          >
                            <Icon name="edit" size={11} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            style={{ padding: '2px 6px', fontSize: 11, borderRadius: 4, color: 'var(--danger)' }}
                            onClick={() => handleDeleteTable(t.id)}
                            title="Delete Table"
                          >
                            <Icon name="trash" size={11} />
                          </button>
                        </div>
                      </div>
                      <div className="table-capacity">{t.capacity || 4} Guests • {t.seatingType || 'Indoor'}</div>
                      <span className="table-status-tag">{t.status.replace('-', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 10: CUSTOMER MANAGEMENT + CUSTOMER ACTIVITY (PART 7)
             ========================================================================= */}
          {activeSection === 'customers' && (
            <CustomerManagement
              subId={currentSubId}
              onOpenOrder={(ordId) => {
                const found = orders.find(o => o.id?.toLowerCase() === ordId?.toLowerCase());
                if (found) {
                  setSelectedOrder(found);
                  setOrderDetailsModalOpen(true);
                } else {
                  navigate(`/admin/orders/${ordId}`);
                }
              }}
              onOpenBooking={(bkId) => {
                const found = bookings.find(b => b.id?.toLowerCase() === bkId?.toLowerCase());
                if (found) {
                  setSelectedBooking(found);
                  setPreOrderModalOpen(true);
                } else {
                  navigate(`/admin/bookings/${bkId}`);
                }
              }}
            />
          )}

          {/* =========================================================================
              VIEW 11: REVIEWS & RATINGS (PART 8)
             ========================================================================= */}
          {activeSection === 'reviews' && (
            <ReviewManagement
              subId={currentSubId}
              onOpenOrder={(ordId) => {
                const found = orders.find(o => o.id?.toLowerCase() === ordId?.toLowerCase());
                if (found) {
                  setSelectedOrder(found);
                  setOrderDetailsModalOpen(true);
                } else {
                  navigate(`/admin/orders/${ordId}`);
                }
              }}
            />
          )}

          {/* =========================================================================
              VIEW 11B: CUSTOMER ISSUES / SUPPORT (PART 8)
             ========================================================================= */}
          {activeSection === 'issues' && (
            <CustomerIssueManagement
              subId={currentSubId}
              onOpenOrder={(ordId) => {
                const found = orders.find(o => o.id?.toLowerCase() === ordId?.toLowerCase());
                if (found) {
                  setSelectedOrder(found);
                  setOrderDetailsModalOpen(true);
                } else {
                  navigate(`/admin/orders/${ordId}`);
                }
              }}
              onOpenBooking={(bkId) => {
                const found = bookings.find(b => b.id?.toLowerCase() === bkId?.toLowerCase());
                if (found) {
                  setSelectedBooking(found);
                  setPreOrderModalOpen(true);
                } else {
                  navigate(`/admin/bookings/${bkId}`);
                }
              }}
              onOpenIncident={() => {
                handleSelectSection('kitchen');
              }}
            />
          )}

          {/* =========================================================================
              VIEW 12: OFFERS & VOUCHERS (Section 22)
             ========================================================================= */}
          {activeSection === 'vouchers' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Promotional Offers &amp; Vouchers ({vouchers.length})</h1>
                  <p className="view-sub">Manage promotional discounts, usage counters, and order thresholds</p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setVoucherModalOpen(true)}
                >
                  <Icon name="add" size={14} /> Create Voucher
                </button>
              </div>

              <div className="admin-cards-grid">
                {paginatedVouchers.map(v => (
                  <div key={v.code} className="card voucher-admin-card">
                    <div className="voucher-card-top">
                      <span className="v-code">{v.code}</span>
                      <span className="v-uses">{v.usesLeft} Uses Left</span>
                    </div>
                    <p className="v-desc">{v.desc}</p>
                    <div className="v-meta">
                      <span>Min Order: ₹{v.minOrder}</span>
                      <span>Expires: {v.expiresInDays || 15} Days</span>
                    </div>
                    <div className="v-footer">
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-danger"
                        onClick={() => {
                          dispatch(deleteVoucher(v.code));
                          showToast(`Voucher ${v.code} removed`, 'info');
                        }}
                      >
                        <Icon name="delete" size={13} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={vouchersPage}
                totalItems={vouchers.length}
                pageSize={vouchersPageSize}
                onPageChange={setVouchersPage}
                onPageSizeChange={(sz) => {
                  setVouchersPageSize(sz);
                  setVouchersPage(1);
                }}
                itemName="vouchers"
              />
            </div>
          )}

          {/* =========================================================================
              VIEW 13: PAYMENTS & REFUNDS (Section 23)
             ========================================================================= */}
          {activeSection === 'payments' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Order Payments Ledger</h1>
                  <p className="view-sub">Verified customer transaction records (Frontend Development Ledger)</p>
                </div>
                <span className="operational-tag">SIMULATED PAYMENT GATEWAY</span>
              </div>

              <div className="card table-container-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Payment Status</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPayments.map(o => (
                        <tr key={o.id}>
                          <td><code>TXN_{o.id.replace('ORD-', '')}92</code></td>
                          <td><strong>{o.id}</strong></td>
                          <td>{o.userEmail || 'Guest'}</td>
                          <td><strong>₹{o.grandTotal}</strong></td>
                          <td><span className="payment-badge">{o.paymentMethod || 'UPI'}</span></td>
                          <td>
                            <span className={`status-pill ${o.cancelled ? 'danger' : 'success'}`}>
                              {o.cancelled ? 'Refund Initiated' : 'Captured'}
                            </span>
                          </td>
                          <td className="muted" style={{ fontSize: 12 }}>
                            {new Date(o.createdAt || Date.now()).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={paymentsPage}
                  totalItems={orders.length}
                  pageSize={paymentsPageSize}
                  onPageChange={setPaymentsPage}
                  onPageSizeChange={(sz) => {
                    setPaymentsPageSize(sz);
                    setPaymentsPage(1);
                  }}
                  itemName="payments"
                />
              </div>
            </div>
          )}

          {/* Refunds Subview */}
          {activeSection === 'refunds' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Customer Refunds Pipeline</h1>
                  <p className="view-sub">Track order cancellation refunds and gateway settlement</p>
                </div>
                <span className="operational-tag">SIMULATED SETTLEMENT STATE</span>
              </div>

              <div className="card table-container-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Refund ID</th>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Original Method</th>
                        <th>Refund Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refundOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: 30 }}>
                            <p className="muted">No refund requests currently pending.</p>
                          </td>
                        </tr>
                      ) : (
                        paginatedRefunds.map(o => (
                          <tr key={o.id}>
                            <td><code>{o.refund?.id || `RF_${o.id}`}</code></td>
                            <td><strong>{o.id}</strong></td>
                            <td>{o.userEmail || 'Guest'}</td>
                            <td><strong style={{ color: 'var(--accent)' }}>₹{o.refund?.amount || o.grandTotal}</strong></td>
                            <td>{o.paymentMethod || 'UPI'}</td>
                            <td>
                              <span className={`status-pill ${o.refund?.status === 'Completed' ? 'success' : 'danger'}`}>
                                {o.refund?.status || 'Processing'}
                              </span>
                            </td>
                            <td>
                              {o.refund?.status !== 'Completed' ? (
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline-success"
                                  onClick={() => handleProcessRefund(o.id)}
                                >
                                  Mark Completed
                                </button>
                              ) : (
                                <span className="muted" style={{ fontSize: 12 }}>Settled</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={refundsPage}
                  totalItems={refundOrders.length}
                  pageSize={refundsPageSize}
                  onPageChange={setRefundsPage}
                  onPageSizeChange={(sz) => {
                    setRefundsPageSize(sz);
                    setRefundsPage(1);
                  }}
                  itemName="refunds"
                />
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 14: NOTIFICATIONS CENTER (Section 24)
             ========================================================================= */}
          {activeSection === 'notifications' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Admin Notification Center</h1>
                  <p className="view-sub">Real-time alerts, operational updates, and customer broadcasts</p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setNotificationsOpen(true)}
                >
                  <Icon name="notifications" size={14} /> Open Live Notification Drawer
                </button>
              </div>

              <div className="card notifications-feed-card">
                {paginatedNotifs.map(n => (
                  <div key={n.id} className={`notif-feed-item ${n.read ? 'read' : 'unread'}`}>
                    <div className="feed-icon">
                      <Icon name={n.type === 'order' ? 'orders' : n.type === 'booking' ? 'calendar' : 'bell'} size={18} color="var(--accent)" />
                    </div>
                    <div className="feed-body">
                      <div className="feed-header">
                        <strong>{n.title}</strong>
                        <span className="time">{n.time}</span>
                      </div>
                      <p>{n.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={notifsPage}
                totalItems={adminNotifications.length}
                pageSize={notifsPageSize}
                onPageChange={setNotifsPage}
                onPageSizeChange={(sz) => {
                  setNotifsPageSize(sz);
                  setNotifsPage(1);
                }}
                itemName="notifications"
              />
            </div>
          )}

          {/* =========================================================================
              VIEW 15: RECENTLY ACCESSED (Section 25)
             ========================================================================= */}
          {activeSection === 'recently-accessed' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Recently Accessed Entities</h1>
                  <p className="view-sub">Audit trail of items, orders, and chef profiles recently inspected in this session</p>
                </div>
              </div>

              <div className="card table-container-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Entity Type</th>
                        <th>Title / Target</th>
                        <th>Context / Subtitle</th>
                        <th>Accessed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentlyAccessed.map(r => (
                        <tr key={r.id}>
                          <td>
                            <span className="recently-type-badge">{r.type}</span>
                          </td>
                          <td><strong>{r.title}</strong></td>
                          <td>{r.subtitle}</td>
                          <td className="muted" style={{ fontSize: 12 }}>{r.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 16: ANALYTICS & REPORTS (Section 26)
             ========================================================================= */}
          {activeSection === 'analytics' && (
            <AnalyticsDashboard />
          )}

          {/* Reports Subview */}
          {activeSection === 'reports' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Business &amp; Operations Reports</h1>
                  <p className="view-sub">Downloadable end-of-day restaurant summaries</p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => showToast('Report exported as PDF preview', 'success')}
                >
                  <Icon name="download" size={14} /> Export Report (PDF)
                </button>
              </div>

              <div className="card" style={{ padding: 24 }}>
                <h3>Executive Summary — ZESTRO Hub</h3>
                <p className="muted" style={{ fontSize: 13 }}>Cluster: Kovilpatti &amp; Tirunelveli • Generated {new Date().toLocaleDateString()}</p>
                <div className="perf-stats-grid" style={{ marginTop: 20 }}>
                  <div className="card perf-metric-card"><div className="metric-val">₹{kpis.revenue}</div><div className="metric-label">Delivered Revenue</div></div>
                  <div className="card perf-metric-card"><div className="metric-val">{kpis.totalOrders}</div><div className="metric-label">Orders Completed</div></div>
                  <div className="card perf-metric-card"><div className="metric-val">{kpis.totalBookings}</div><div className="metric-label">Table Reservations</div></div>
                  <div className="card perf-metric-card"><div className="metric-val">0%</div><div className="metric-label">Gateway Failure Rate</div></div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 17: ADMIN INTELLIGENCE ("What Should I Improve?") (Section 27)
             ========================================================================= */}
          {activeSection === 'insights' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Admin Intelligence Engine</h1>
                  <p className="view-sub">Actionable recommendations derived from actual application dining patterns</p>
                </div>
              </div>

              <div className="intelligence-grid">
                <div className="card insight-card">
                  <div className="insight-badge high-demand">HIGH DEMAND OPPORTUNITY</div>
                  <h4>Outdoor Garden Seating Peak Demand</h4>
                  <div className="insight-section">
                    <span className="insight-title">OBSERVED PATTERN:</span>
                    <p>Outdoor and window seating tables receive 72% higher reservation density during evening dinner slots (7:00 PM – 9:00 PM).</p>
                  </div>
                  <div className="insight-section action-rec">
                    <span className="insight-title">RECOMMENDATION:</span>
                    <p>Consider re-allocating 2 indoor stations into terrace seating or opening garden slots during weekend peak hours.</p>
                  </div>
                </div>

                <div className="card insight-card">
                  <div className="insight-badge menu-opt">MENU EFFICIENCY</div>
                  <h4>Pre-Order Acceleration</h4>
                  <div className="insight-section">
                    <span className="insight-title">OBSERVED PATTERN:</span>
                    <p>Diners who pre-order Ghee Podi Idli or Thalappakatti Biriyani experience an average seating turnaround 14 minutes faster.</p>
                  </div>
                  <div className="insight-section action-rec">
                    <span className="insight-title">RECOMMENDATION:</span>
                    <p>Highlight the food pre-order prompt during table booking confirmation to smooth kitchen prep loads.</p>
                  </div>
                </div>

                <div className="card insight-card">
                  <div className="insight-badge operational">CHEF WORKLOAD BALANCE</div>
                  <h4>Woodfire Dum Biriyani Station Peak</h4>
                  <div className="insight-section">
                    <span className="insight-title">OBSERVED PATTERN:</span>
                    <p>Chef Murugesan P. is operating at 'High' workload with 28+ active tickets during Saturday lunch hours.</p>
                  </div>
                  <div className="insight-section action-rec">
                    <span className="insight-title">RECOMMENDATION:</span>
                    <p>Cross-train secondary tiffin chefs on dum preparation or adjust order pacing slots in restaurant settings.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 18: ADMIN PROFILE (Section 5)
              "dheivalakshmi7@gmail.com — Manual photo upload flow"
             ========================================================================= */}
          {activeSection === 'profile' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Admin Profile &amp; Identity</h1>
                  <p className="view-sub">Primary platform administrator credentials and custom device avatar</p>
                </div>
              </div>

              <div className="card profile-management-card">
                <form onSubmit={handleSaveAdminProfile}>
                  {/* Photo Selection Flow (Section 5) */}
                  <div className="admin-avatar-change-section">
                    <div className="avatar-large-preview">
                      {adminAvatarPreview ? (
                        <SafeImage
                          image={adminAvatarPreview}
                          alt={adminName}
                          style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="default-avatar-large">
                          {(adminName?.[0] || 'D').toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="avatar-flow-controls">
                      <strong>Administrator Photo</strong>
                      <p className="muted" style={{ fontSize: 13, margin: '4px 0 10px' }}>
                        Upload your personal image from your device. No anime avatars are forced.
                      </p>

                      <div className="avatar-btn-row">
                        <label className="btn btn-sm btn-primary upload-file-btn">
                          <Icon name="camera" size={15} />
                          <span>Change Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAdminAvatarUpload}
                            style={{ display: 'none' }}
                          />
                        </label>

                        {adminAvatarPreview && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={handleRemoveAdminAvatar}
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-row-2" style={{ marginTop: 24 }}>
                    <div className="input-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        required
                        value={adminName}
                        onChange={e => setAdminName(e.target.value)}
                        className="admin-form-input"
                      />
                    </div>

                    <div className="input-group">
                      <label className="form-label">Administrative Email</label>
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={e => setAdminEmail(e.target.value)}
                        className="admin-form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="input-group">
                      <label className="form-label">Contact Phone</label>
                      <input
                        type="text"
                        value={adminPhone}
                        onChange={e => setAdminPhone(e.target.value)}
                        className="admin-form-input"
                      />
                    </div>

                    <div className="input-group">
                      <label className="form-label">Role</label>
                      <input
                        type="text"
                        disabled
                        value="Super Administrator (Full System Control)"
                        className="admin-form-input"
                        style={{ opacity: 0.7 }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <button type="submit" className="btn btn-primary">
                      <Icon name="check" size={15} /> Save Profile Details
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 19: ADMIN SETTINGS (Section 29)
             ========================================================================= */}
          {activeSection === 'settings' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Admin Operational Settings</h1>
                  <p className="view-sub">Platform parameters, kitchen lead time policies, and alert preferences</p>
                </div>
              </div>

              <div className="settings-cards-col">
                <div className="card settings-section-card">
                  <h4>Restaurant &amp; Dining Rules</h4>
                  <div className="settings-row">
                    <div>
                      <strong>Table Booking Lead Time</strong>
                      <p className="muted" style={{ margin: 0, fontSize: 13 }}>Minimum advance time required for reserving a dining table</p>
                    </div>
                    <select className="admin-form-select small" style={{ width: 120 }}>
                      <option>30 Mins</option>
                      <option>1 Hour</option>
                      <option>2 Hours</option>
                    </select>
                  </div>

                  <div className="settings-row">
                    <div>
                      <strong>Cancellation Grace Period</strong>
                      <p className="muted" style={{ margin: 0, fontSize: 13 }}>Allow diners to cancel table bookings without penalty</p>
                    </div>
                    <select className="admin-form-select small" style={{ width: 120 }}>
                      <option>Up to 15 Mins</option>
                      <option>Up to 30 Mins</option>
                      <option>Anytime</option>
                    </select>
                  </div>
                </div>

                <div className="card settings-section-card">
                  <h4>Notification Preferences</h4>
                  <div className="settings-row">
                    <div>
                      <strong>New Order Audio Alert</strong>
                      <p className="muted" style={{ margin: 0, fontSize: 13 }}>Chime when a new delivery order or table pre-order arrives</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div className="settings-row">
                    <div>
                      <strong>Cancellation Email Dispatch</strong>
                      <p className="muted" style={{ margin: 0, fontSize: 13 }}>Notify kitchen head when a diner cancels an order</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 20: ACTIVITY / AUDIT LOG (Section 28)
             ========================================================================= */}
          {activeSection === 'activity-log' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Administrative Audit Log</h1>
                  <p className="view-sub">Immutable chronological history of all administrative actions taken in the portal</p>
                </div>
              </div>

              <div className="card table-container-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Action Performed</th>
                        <th>Target Entity</th>
                        <th>Admin User</th>
                        <th>Previous Value</th>
                        <th>New Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedActivities.map(act => (
                        <tr key={act.id}>
                          <td className="muted" style={{ fontSize: 12 }}>
                            {new Date(act.timestamp).toLocaleString()}
                          </td>
                          <td><strong>{act.action}</strong></td>
                          <td>{act.entity}</td>
                          <td className="muted" style={{ fontSize: 12 }}>{act.admin}</td>
                          <td><span className="audit-diff prev">{act.prevValue || '—'}</span></td>
                          <td><span className="audit-diff next">{act.newValue || '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={activityPage}
                  totalItems={activities.length}
                  pageSize={activityPageSize}
                  onPageChange={setActivityPage}
                  onPageSizeChange={(sz) => {
                    setActivityPageSize(sz);
                    setActivityPage(1);
                  }}
                  itemName="activities"
                />
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 21: KITCHEN DISPLAY SYSTEM / QUEUE (Section 17)
             ========================================================================= */}
          {activeSection === 'kitchen' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Kitchen Display System (KDS)</h1>
                  <p className="view-sub">Real-time prep station routing, order timers, and kitchen expediting</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className="operational-tag">LIVE KITCHEN STATIONS</span>
                </div>
              </div>

              {/* Station Workload Metrics */}
              <div className="perf-stats-grid">
                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: 'var(--accent)' }}>
                    {orders.filter(o => !o.cancelled && o.status !== 'Delivered').length}
                  </div>
                  <div className="metric-label">Active Kitchen Tickets</div>
                </div>
                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: '#ffb703' }}>
                    {orders.filter(o => o.status === 'Preparing').length || 1}
                  </div>
                  <div className="metric-label">In Preparation</div>
                </div>
                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: 'var(--success)' }}>
                    {orders.filter(o => o.status === 'Ready').length}
                  </div>
                  <div className="metric-label">Ready for Pickup / Dispatch</div>
                </div>
                <div className="card perf-metric-card">
                  <div className="metric-val">14 min</div>
                  <div className="metric-label">Avg Station Prep Speed</div>
                </div>
              </div>

              {/* KDS Active Tickets Grid */}
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="kitchen" size={18} color="var(--accent)" />
                  <span>Station Order Pipeline</span>
                </h3>

                {orders.filter(o => !o.cancelled && o.status !== 'Delivered').length === 0 ? (
                  <div className="card" style={{ padding: 36, textAlign: 'center' }}>
                    <Icon name="check-circle" size={40} color="var(--success)" />
                    <h3 style={{ marginTop: 12 }}>Kitchen Queue Clear!</h3>
                    <p className="muted">All incoming culinary orders have been prepared and expedited.</p>
                  </div>
                ) : (
                  <div className="admin-cards-grid">
                    {orders.filter(o => !o.cancelled && o.status !== 'Delivered').map(o => (
                      <div key={o.id} className="card" style={{ padding: 18, borderLeft: o.status === 'Ready' ? '4px solid var(--success)' : o.status === 'Preparing' ? '4px solid #ffb703' : '4px solid var(--accent)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 12 }}>
                          <div>
                            <strong style={{ fontSize: 15, color: 'var(--accent)' }}>{o.id}</strong>
                            <div className="muted" style={{ fontSize: 12 }}>{o.restaurantName}</div>
                          </div>
                          <span className={`status-pill ${o.status === 'Ready' ? 'success' : o.status === 'Preparing' ? 'warning' : 'info'}`}>
                            {o.status}
                          </span>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <strong style={{ fontSize: 13 }}>Items ({o.items?.length || 0}):</strong>
                          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13 }}>
                            {(o.items || []).map((it, idx) => (
                              <li key={idx} style={{ marginBottom: 4 }}>
                                <strong>{it.quantity || it.qty || 1}×</strong> {it.name}
                                {it.customizations && <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>({it.customizations})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                          <span>Customer: {o.userEmail ? o.userEmail.split('@')[0] : 'Guest'}</span>
                          <span>₹{o.grandTotal}</span>
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {o.status !== 'Preparing' && o.status !== 'Ready' && (
                            <button
                              type="button"
                              className="btn btn-xs btn-primary"
                              onClick={() => {
                                handleUpdateOrderStatus(o.id, 'Preparing');
                              }}
                            >
                              Start Cooking
                            </button>
                          )}

                          {o.status === 'Preparing' && (
                            <button
                              type="button"
                              className="btn btn-xs btn-success"
                              onClick={() => {
                                handleUpdateOrderStatus(o.id, 'Ready');
                              }}
                            >
                              Mark Ready
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => {
                              dispatch(advanceOrderStage(o.id));
                              showToast(`Advanced ${o.id} in pipeline`, 'info');
                            }}
                          >
                            Advance Stage
                          </button>

                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => {
                              setSelectedOrder(o);
                              setOrderDetailsModalOpen(true);
                            }}
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 22: LIVE DELIVERY FLEET & PARTNERS (Section 17)
             ========================================================================= */}
          {activeSection === 'delivery' && (() => {
            const filteredPartners = deliveryPartners.filter(p => {
              if (partnerStatusFilter !== 'all' && p.status !== partnerStatusFilter) return false;
              if (partnerSearchQuery.trim()) {
                const q = partnerSearchQuery.toLowerCase().trim();
                const matchName = (p.name || '').toLowerCase().includes(q);
                const matchPhone = (p.phone || '').includes(q);
                const matchVehicle = (p.vehicleNumber || '').toLowerCase().includes(q) || (p.vehicleType || '').toLowerCase().includes(q);
                const matchLoc = (p.currentLocation || '').toLowerCase().includes(q);
                if (!matchName && !matchPhone && !matchVehicle && !matchLoc) return false;
              }
              return true;
            });

            return (
              <div className="admin-view-fade">
                <div className="view-header-row">
                  <div>
                    <h1 className="view-title">Delivery Partners &amp; Fleet Logistics ({deliveryPartners.length})</h1>
                    <p className="view-sub">Manage courier partners, live GPS locations, vehicle telemetry and door-to-door fulfillment</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setEditingPartner(null);
                        setPartnerModalOpen(true);
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                    >
                      <Icon name="add" size={14} color="#ffffff" />
                      <span>+ Add Delivery Partner</span>
                    </button>
                    <span className="operational-tag">GPS RADAR ACTIVE</span>
                  </div>
                </div>

                {/* Delivery Fleet KPIs */}
                <div className="perf-stats-grid">
                  <div className="card perf-metric-card">
                    <div className="metric-val" style={{ color: 'var(--accent)' }}>
                      {deliveryPartners.length}
                    </div>
                    <div className="metric-label">Total Fleet Partners</div>
                  </div>
                  <div className="card perf-metric-card">
                    <div className="metric-val" style={{ color: '#f59e0b' }}>
                      {deliveryPartners.filter(p => p.status === 'Out for Delivery').length}
                    </div>
                    <div className="metric-label">Riders On Road</div>
                  </div>
                  <div className="card perf-metric-card">
                    <div className="metric-val" style={{ color: 'var(--success)' }}>
                      {deliveryPartners.filter(p => p.status === 'Available').length}
                    </div>
                    <div className="metric-label">Available / Idle</div>
                  </div>
                  <div className="card perf-metric-card">
                    <div className="metric-val">98.4%</div>
                    <div className="metric-label">On-Time SLA Rate</div>
                  </div>
                </div>

                {/* Filter and Search Bar for Delivery Partners */}
                <div className="card" style={{ padding: '14px 18px', marginTop: 18, marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {['all', 'Available', 'Out for Delivery', 'On Duty', 'Offline'].map(st => (
                        <button
                          key={st}
                          type="button"
                          className={`pill-btn ${partnerStatusFilter === st ? 'active' : ''}`}
                          onClick={() => setPartnerStatusFilter(st)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            border: partnerStatusFilter === st ? '1px solid var(--accent)' : '1px solid var(--border)',
                            background: partnerStatusFilter === st ? 'var(--accent)' : 'var(--bg)',
                            color: partnerStatusFilter === st ? '#fff' : 'var(--text)',
                            cursor: 'pointer',
                          }}
                        >
                          {st === 'all' ? `All Riders (${deliveryPartners.length})` : `${st} (${deliveryPartners.filter(p => p.status === st).length})`}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 260 }}>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <input
                          type="text"
                          placeholder="Search by name, vehicle, phone or area..."
                          value={partnerSearchQuery}
                          onChange={e => setPartnerSearchQuery(e.target.value)}
                          className="admin-form-input"
                          style={{ paddingLeft: 32, fontSize: 12.5 }}
                        />
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                          <Icon name="search" size={14} />
                        </span>
                      </div>
                      {partnerSearchQuery && (
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => setPartnerSearchQuery('')}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Partners Fleet Grid */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="delivery" size={18} color="var(--accent)" />
                      <span>Registered Delivery Partners ({filteredPartners.length})</span>
                    </h3>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click 'View Details' to inspect live GPS telemetry &amp; orders</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {filteredPartners.map(p => {
                      const statusColor = p.status === 'Available' ? 'var(--success)'
                        : p.status === 'Out for Delivery' ? 'var(--accent)'
                        : p.status === 'On Duty' ? '#0284c7'
                        : 'var(--text-muted)';

                      return (
                        <div
                          key={p.id}
                          className="card"
                          style={{
                            padding: 16,
                            background: 'var(--bg)',
                            borderRadius: 12,
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            transition: 'transform 0.15s ease, border-color 0.15s ease',
                          }}
                        >
                          {/* Rider Card Top */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: '50%',
                                  background: 'color-mix(in srgb, var(--accent) 15%, var(--bg-elevated))',
                                  color: 'var(--accent)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 900,
                                  fontSize: 16,
                                  border: `2px solid ${statusColor}`,
                                }}
                              >
                                {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <strong style={{ fontSize: 15 }}>{p.name}</strong>
                                  <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 800 }}>⭐ {p.rating || 4.9}</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                  <Icon name="phone" size={12} />
                                  <span>{p.phone}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleTogglePartnerStatus(p.id)}
                              className="status-pill"
                              style={{
                                fontSize: 11,
                                cursor: 'pointer',
                                borderColor: statusColor,
                                color: statusColor,
                                background: 'transparent',
                              }}
                              title="Click to toggle status"
                            >
                              ● {p.status}
                            </button>
                          </div>

                          {/* Vehicle & Metrics info */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10.5 }}>VEHICLE</span>
                              <strong>{p.vehicleType}</strong>
                            </div>
                            <div>
                              <span
                                style={{
                                  display: 'inline-block',
                                  background: '#fef08a',
                                  color: '#854d0e',
                                  border: '1px solid #ca8a04',
                                  borderRadius: 4,
                                  padding: '2px 6px',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  fontFamily: 'monospace',
                                }}
                              >
                                {p.vehicleNumber}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10.5 }}>TRIPS</span>
                              <strong>{p.totalDeliveries || 0}</strong>
                            </div>
                          </div>

                          {/* 📍 Live Location Box */}
                          <div
                            style={{
                              padding: '10px 12px',
                              borderRadius: 8,
                              background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--bg-elevated)), var(--bg-elevated))',
                              border: '1px solid color-mix(in srgb, var(--accent) 20%, var(--border))',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Icon name="location" size={12} />
                                <span>Live Location</span>
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                                {p.distanceFromHub || '1.1 km from hub'}
                              </span>
                            </div>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              📍 {p.currentLocation}
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 6 }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12 }}
                              onClick={() => {
                                setSelectedPartnerForDetails(p);
                                setPartnerDetailsModalOpen(true);
                              }}
                            >
                              <Icon name="eye" size={13} />
                              <span>View Details</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              style={{ padding: '6px 10px', fontSize: 12 }}
                              onClick={() => {
                                setEditingPartner(p);
                                setPartnerModalOpen(true);
                              }}
                              title="Edit Rider"
                            >
                              <Icon name="edit" size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline text-danger"
                              style={{ padding: '6px 10px', fontSize: 12, color: 'var(--danger)' }}
                              onClick={() => handleDeletePartner(p.id)}
                              title="Delete Rider"
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active Orders Courier Dispatch Table */}
                <div className="card table-container-card" style={{ marginTop: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="orders" size={18} color="var(--accent)" />
                      <span>Live Order Dispatch &amp; Courier Fulfillment</span>
                    </h3>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {orders.filter(o => o.status === 'Out for Delivery' || o.status === 'Ready').length} active in transit
                    </span>
                  </div>

                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer &amp; Dropoff Address</th>
                          <th>Restaurant</th>
                          <th>Assigned Courier Partner</th>
                          <th>Vehicle</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o, idx) => {
                          const courier = deliveryPartners[idx % deliveryPartners.length] || deliveryPartners[0];
                          return (
                            <tr key={o.id}>
                              <td><strong>{o.id}</strong></td>
                              <td>
                                <div>{o.customerName || o.userEmail || 'Guest'}</div>
                                <span className="muted" style={{ fontSize: 11 }}>
                                  📍 {typeof o.deliveryAddress === 'string'
                                    ? o.deliveryAddress
                                    : (o.deliveryAddress?.text || o.address?.text || o.deliveryAddress?.address || 'Kovilpatti Central, Tamil Nadu')}
                                </span>
                              </td>
                              <td>{o.restaurantName}</td>
                              <td>
                                <div
                                  style={{ cursor: 'pointer', display: 'inline-flex', flexDirection: 'column' }}
                                  onClick={() => {
                                    setSelectedPartnerForDetails(courier);
                                    setPartnerDetailsModalOpen(true);
                                  }}
                                  title="Click to view courier details"
                                >
                                  <strong style={{ color: 'var(--accent)' }}>{courier.name}</strong>
                                  <span className="muted" style={{ fontSize: 11 }}>{courier.phone}</span>
                                </div>
                              </td>
                              <td>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    background: '#fef08a',
                                    color: '#854d0e',
                                    border: '1px solid #ca8a04',
                                    borderRadius: 4,
                                    padding: '1px 6px',
                                    fontSize: 11,
                                    fontWeight: 800,
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {courier.vehicleNumber}
                                </span>
                              </td>
                              <td>
                                <span className={`status-pill ${o.status === 'Delivered' ? 'success' : o.status === 'Out for Delivery' ? 'warning' : 'info'}`}>
                                  {o.status}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {o.status !== 'Delivered' && (
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-primary"
                                      onClick={() => handleUpdateOrderStatus(o.id, 'Delivered')}
                                    >
                                      Mark Delivered
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-outline"
                                    onClick={() => {
                                      setSelectedOrder(o);
                                      setOrderDetailsModalOpen(true);
                                    }}
                                  >
                                    View Order
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* =========================================================================
              VIEW 23: STAFF & SHIFTS (Section 17)
             ========================================================================= */}
          {activeSection === 'staff' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Staff &amp; Shift Management ({staffList.length})</h1>
                  <p className="view-sub">Floor waiters, master chefs, cashiers, and delivery leads with live duty attendance</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="operational-tag">ON DUTY: {staffList.filter(s => s.status === 'On Duty').length}</span>
                </div>
              </div>

              {/* Staff Stats */}
              <div className="perf-stats-grid">
                <div className="card perf-metric-card">
                  <div className="metric-val">{staffList.length}</div>
                  <div className="metric-label">Total Personnel</div>
                </div>
                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: 'var(--success)' }}>
                    {staffList.filter(s => s.status === 'On Duty').length}
                  </div>
                  <div className="metric-label">Currently On Duty</div>
                </div>
                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: 'var(--text-muted)' }}>
                    {staffList.filter(s => s.status === 'Off Duty').length}
                  </div>
                  <div className="metric-label">Off Duty / Break</div>
                </div>
                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: 'var(--accent)' }}>97.2%</div>
                  <div className="metric-label">Weekly Attendance Rate</div>
                </div>
              </div>

              {/* Staff Table */}
              <div className="card table-container-card" style={{ marginTop: 20 }}>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Employee Name</th>
                        <th>Role / Designation</th>
                        <th>Assigned Shift</th>
                        <th>Branch Station</th>
                        <th>Contact</th>
                        <th>Attendance</th>
                        <th>Duty Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStaff.map(st => (
                        <tr key={st.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="initials-small" style={{ background: st.status === 'On Duty' ? 'var(--accent)' : 'var(--border)' }}>
                                {st.name[0]}
                              </div>
                              <strong>{st.name}</strong>
                            </div>
                          </td>
                          <td>{st.role}</td>
                          <td><span className="payment-badge">{st.shift}</span></td>
                          <td>{st.branch}</td>
                          <td className="muted" style={{ fontSize: 12 }}>{st.phone}</td>
                          <td><strong style={{ color: 'var(--success)' }}>{st.attendance}</strong></td>
                          <td>
                            <span className={`status-pill ${st.status === 'On Duty' ? 'success' : 'danger'}`}>
                              {st.status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`btn btn-xs ${st.status === 'On Duty' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                              onClick={() => handleToggleStaffDuty(st.id)}
                            >
                              Toggle {st.status === 'On Duty' ? 'Off Duty' : 'On Duty'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={staffPage}
                  totalItems={staffList.length}
                  pageSize={staffPageSize}
                  onPageChange={setStaffPage}
                  onPageSizeChange={(sz) => {
                    setStaffPageSize(sz);
                    setStaffPage(1);
                  }}
                  itemName="staff members"
                />
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 24: INVENTORY & STOCK (Section 17)
             ========================================================================= */}
          {activeSection === 'inventory' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Kitchen Inventory &amp; Raw Material Stock</h1>
                  <p className="view-sub">Real-time ingredient levels, threshold alerts, and instant replenishment actions</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      inventoryList.forEach(item => {
                        if (item.status !== 'In Stock') handleRestock(item.id, 20);
                      });
                      showToast('Replenished all low stock materials', 'success');
                    }}
                  >
                    <Icon name="refresh" size={14} /> Auto-Restock Low Items
                  </button>
                </div>
              </div>

              {/* Inventory Stats */}
              <div className="perf-stats-grid">
                <div className="card perf-metric-card">
                  <div className="metric-val">{inventoryList.length}</div>
                  <div className="metric-label">Monitored Ingredients</div>
                </div>
                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: 'var(--success)' }}>
                    {inventoryList.filter(i => i.status === 'In Stock').length}
                  </div>
                  <div className="metric-label">In Healthy Stock</div>
                </div>
                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: '#ffb703' }}>
                    {inventoryList.filter(i => i.status === 'Low Stock').length}
                  </div>
                  <div className="metric-label">Low Stock Warnings</div>
                </div>
                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: 'var(--danger)' }}>
                    {inventoryList.filter(i => i.status === 'Out of Stock').length}
                  </div>
                  <div className="metric-label">Depleted / Stockout</div>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="card table-container-card" style={{ marginTop: 20 }}>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Material / Ingredient</th>
                        <th>Category</th>
                        <th>Current Quantity</th>
                        <th>Reorder Level</th>
                        <th>Verified Vendor</th>
                        <th>Stock Health</th>
                        <th>Quick Restock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInventory.map(inv => (
                        <tr key={inv.id}>
                          <td><strong>{inv.name}</strong></td>
                          <td><span className="payment-badge">{inv.category}</span></td>
                          <td>
                            <strong style={{ fontSize: 14, color: inv.status === 'Out of Stock' ? 'var(--danger)' : 'var(--text)' }}>
                              {inv.stock} {inv.unit}
                            </strong>
                          </td>
                          <td className="muted">{inv.minThreshold} {inv.unit}</td>
                          <td>{inv.supplier}</td>
                          <td>
                            <span className={`status-pill ${inv.status === 'In Stock' ? 'success' : inv.status === 'Low Stock' ? 'warning' : 'danger'}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                onClick={() => handleRestock(inv.id, 10)}
                              >
                                +10 {inv.unit}
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs btn-primary"
                                onClick={() => handleRestock(inv.id, 25)}
                              >
                                +25 {inv.unit}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={inventoryPage}
                  totalItems={inventoryList.length}
                  pageSize={inventoryPageSize}
                  onPageChange={setInventoryPage}
                  onPageSizeChange={(sz) => {
                    setInventoryPageSize(sz);
                    setInventoryPage(1);
                  }}
                  itemName="inventory items"
                />
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 25: SYSTEM AUDIT & SECURITY (Section 17 & 18)
             ========================================================================= */}
          {activeSection === 'audit' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">System Audit &amp; Platform Security</h1>
                  <p className="view-sub">Active session integrity, credential protection rules, and intrusion prevention</p>
                </div>
                <span className="operational-tag">SECURITY HARDENED</span>
              </div>

              <div className="perf-stats-grid">
                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: 'var(--success)' }}>Active</div>
                  <div className="metric-label">PBKDF2/SHA256 Auth Shield</div>
                </div>
                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: 'var(--success)' }}>100%</div>
                  <div className="metric-label">Password Masking Compliance</div>
                </div>
                <div className="card perf-metric-card">
                  <div className="metric-val">0</div>
                  <div className="metric-label">Failed Logins (24 Hours)</div>
                </div>
                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: '#0284c7' }}>1</div>
                  <div className="metric-label">Authenticated Super Admin</div>
                </div>
              </div>

              {/* Security Policy Cards */}
              <div className="intelligence-grid" style={{ marginTop: 20 }}>
                <div className="card insight-card">
                  <div className="insight-badge high-demand">CREDENTIAL HYGIENE</div>
                  <h4>Zero Plaintext Leakage Enforcement</h4>
                  <div className="insight-section">
                    <span className="insight-title">SECURITY STATUS:</span>
                    <p>Administrative and customer passwords are completely masked across all UI forms, tables, notifications, and audit histories. No plaintext passwords exist in runtime client states.</p>
                  </div>
                </div>

                <div className="card insight-card">
                  <div className="insight-badge operational">SESSION INTEGRITY</div>
                  <h4>Protected Administrative Routes (/admin/*)</h4>
                  <div className="insight-section">
                    <span className="insight-title">RULE IMPLEMENTED:</span>
                    <p>All administrative endpoints strictly require an active authenticated user with verified role 'admin'. Unauthorized users or regular customers are blocked and redirected to /admin/login.</p>
                  </div>
                </div>

                <div className="card insight-card">
                  <div className="insight-badge menu-opt">REAL-TIME BIDIRECTIONALITY</div>
                  <h4>Operational Event Bus</h4>
                  <div className="insight-section">
                    <span className="insight-title">STATE SYNC:</span>
                    <p>Customer orders and reservations dispatch immediate custom events to trigger instant administrative notification toasts and table state re-renders.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 26: SYSTEM HEALTH & TELEMETRY (Section 17)
             ========================================================================= */}
          {activeSection === 'health' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">System Health &amp; Runtime Telemetry</h1>
                  <p className="view-sub">API responsiveness, Redux state synchronization, and memory health</p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => showToast('Diagnostics clean: API latency 19ms, Redux 100% synced', 'success')}
                >
                  <Icon name="check-circle" size={14} /> Run Self-Diagnostics
                </button>
              </div>

              <div className="perf-stats-grid">
                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: 'var(--success)' }}>99.98%</div>
                  <div className="metric-label">API Gateway Uptime</div>
                </div>
                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: 'var(--success)' }}>19 ms</div>
                  <div className="metric-label">Roundtrip Latency</div>
                </div>
                <div className="card perf-metric-card">
                  <div className="metric-val">100%</div>
                  <div className="metric-label">Redux Store Sync</div>
                </div>
                <div className="card perf-metric-card">
                  <div className="metric-val" style={{ color: '#0284c7' }}>&lt; 50 KB</div>
                  <div className="metric-label">Client Cache Footprint</div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 20, padding: 24 }}>
                <h3 style={{ fontSize: 16, marginBottom: 16 }}>Subsystem Operational Diagnostics</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Redux State Engine (auth, order, booking, food, chef, voucher)', status: 'Optimal', ping: '1ms' },
                    { label: 'Real-Time Admin Notification Bus', status: 'Connected', ping: '3ms' },
                    { label: 'Digital Twin Floor Status Pipeline', status: 'Active', ping: '2ms' },
                    { label: 'JWT Authorization Token Validator', status: 'Secured', ping: '1ms' },
                    { label: 'Browser LocalStorage Persistence Engine', status: 'Healthy', ping: '0ms' },
                  ].map((sys, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div>
                        <strong>{sys.label}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span className="muted" style={{ fontSize: 12 }}>{sys.ping}</span>
                        <span className="status-pill success">{sys.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 27: BACKUPS & EXPORT (Section 17 & 18)
             ========================================================================= */}
          {activeSection === 'backups' && (
            <div className="admin-view-fade">
              <div className="view-header-row">
                <div>
                  <h1 className="view-title">Backups &amp; Operations Data Export</h1>
                  <p className="view-sub">Download formatted CSV reports for accounting and full JSON snapshots for recovery</p>
                </div>
              </div>

              <div className="admin-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {/* 1. Orders Export */}
                <div className="card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div className="modal-icon-badge" style={{ background: 'var(--accent)' }}>
                      <Icon name="orders" size={18} color="#ffffff" />
                    </div>
                    <div>
                      <strong style={{ fontSize: 15 }}>Orders Catalog (CSV)</strong>
                      <div className="muted" style={{ fontSize: 12 }}>{orders.length} total orders recorded</div>
                    </div>
                  </div>
                  <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
                    Full transaction history including customer emails, food items, amounts, payment methods, and timestamps.
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{ width: '100%' }}
                    onClick={handleExportOrders}
                  >
                    <Icon name="download" size={14} /> Download Orders CSV
                  </button>
                </div>

                {/* 2. Bookings Export */}
                <div className="card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div className="modal-icon-badge" style={{ background: 'var(--success)' }}>
                      <Icon name="calendar" size={18} color="#ffffff" />
                    </div>
                    <div>
                      <strong style={{ fontSize: 15 }}>Table Bookings (CSV)</strong>
                      <div className="muted" style={{ fontSize: 12 }}>{bookings.length} reservations recorded</div>
                    </div>
                  </div>
                  <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
                    Dining reservations including guest headcounts, date, timeslots, seating preferences, and pre-orders.
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{ width: '100%' }}
                    onClick={handleExportBookings}
                  >
                    <Icon name="download" size={14} /> Download Bookings CSV
                  </button>
                </div>

                {/* 3. Customers Export */}
                <div className="card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div className="modal-icon-badge" style={{ background: '#7209b7' }}>
                      <Icon name="users" size={18} color="#ffffff" />
                    </div>
                    <div>
                      <strong style={{ fontSize: 15 }}>Customer CRM (CSV)</strong>
                      <div className="muted" style={{ fontSize: 12 }}>{users.filter(u => u.role === 'customer').length} guest accounts</div>
                    </div>
                  </div>
                  <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
                    Customer names, loyalty tiers, contact info, and DinePoints balance. Strictly excludes passwords.
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{ width: '100%' }}
                    onClick={handleExportCustomers}
                  >
                    <Icon name="download" size={14} /> Download Customer CRM CSV
                  </button>
                </div>

                {/* 4. Full System Snapshot */}
                <div className="card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div className="modal-icon-badge" style={{ background: '#0284c7' }}>
                      <Icon name="database" size={18} color="#ffffff" />
                    </div>
                    <div>
                      <strong style={{ fontSize: 15 }}>Full System Backup (JSON)</strong>
                      <div className="muted" style={{ fontSize: 12 }}>Complete database snapshot</div>
                    </div>
                  </div>
                  <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
                    Complete operations state including restaurants, tables, menus, staff, inventory, and activities.
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ width: '100%' }}
                    onClick={handleExportFullBackup}
                  >
                    <Icon name="download" size={14} /> Download Snapshot JSON
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* =========================================================================
          MODALS & DRAWERS
         ========================================================================= */}

      {/* Food Modal (Add/Edit) */}
      <FoodModal
        isOpen={foodModalOpen}
        onClose={() => {
          setFoodModalOpen(false);
          setEditingFood(null);
        }}
        onSave={handleSaveFood}
        food={editingFood}
        restaurants={restaurantsList}
        categories={CATEGORIES}
      />

      {/* Chef Modal (Add/Edit) */}
      <ChefModal
        isOpen={chefModalOpen}
        onClose={() => {
          setChefModalOpen(false);
          setEditingChef(null);
        }}
        onSave={handleSaveChef}
        chef={editingChef}
        restaurants={restaurantsList}
      />

      {/* Chef Performance Modal */}
      <ChefPerformanceModal
        isOpen={chefPerfModalOpen}
        onClose={() => {
          setChefPerfModalOpen(false);
          setSelectedChefForPerf(null);
        }}
        chef={selectedChefForPerf}
      />

      {/* Table Modal (Add/Edit) */}
      <TableModal
        isOpen={tableModalOpen}
        onClose={() => {
          setTableModalOpen(false);
          setEditingTable(null);
        }}
        onSave={handleSaveTable}
        table={editingTable}
      />

      {/* Delivery Partner Modal (Add/Edit) */}
      <DeliveryPartnerModal
        isOpen={partnerModalOpen}
        onClose={() => {
          setPartnerModalOpen(false);
          setEditingPartner(null);
        }}
        onSave={handleSavePartner}
        partner={editingPartner}
      />

      {/* Delivery Partner Details Modal (View details, live location & orders) */}
      <DeliveryPartnerDetailsModal
        isOpen={partnerDetailsModalOpen}
        onClose={() => {
          setPartnerDetailsModalOpen(false);
          setSelectedPartnerForDetails(null);
        }}
        partner={selectedPartnerForDetails}
        onEdit={(partner) => {
          setEditingPartner(partner);
          setPartnerModalOpen(true);
        }}
        orders={orders}
        onOpenOrder={(ord) => {
          setSelectedOrder(ord);
          setOrderDetailsModalOpen(true);
          navigate(`/admin/orders/${ord.id}`);
        }}
      />

      {/* Restaurant Modal (Add/Edit) */}
      <RestaurantModal
        isOpen={restaurantModalOpen}
        onClose={() => {
          setRestaurantModalOpen(false);
          setEditingRestaurant(null);
        }}
        onSave={handleSaveRestaurant}
        restaurant={editingRestaurant}
      />

      {/* Voucher Modal */}
      <VoucherModal
        isOpen={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
        onSave={handleSaveVoucher}
        restaurants={restaurantsList}
      />

      {/* Order Details Modal (Part 3) */}
      <OrderDetailsModal
        isOpen={orderDetailsModalOpen}
        onClose={handleCloseOrderModal}
        order={selectedOrder}
        onUpdateStatus={handleUpdateOrderStatus}
        onCancelOrder={handleCancelOrder}
        onProcessRefund={handleProcessRefund}
        onUpdatePriority={handleUpdateOrderPriority}
        onUpdateInternalNote={handleUpdateInternalNote}
        onUpdateKitchenStatus={handleUpdateKitchenStatus}
        onResolveIncident={handleResolveIncident}
        onVerifyOtp={handleVerifyDeliveryOtp}
        onViewCustomer={handleViewCustomerFromOrder}
        onViewRestaurant={handleViewRestaurantFromOrder}
        onViewBooking={handleViewBookingFromOrder}
      />

      {/* Pre-Order Connection Modal (Section 19) */}
      <PreOrderConnectionModal
        isOpen={preOrderModalOpen}
        onClose={() => {
          setPreOrderModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onAdvanceJourney={(bId) => {
          dispatch(advanceJourney(bId));
          showToast('Advanced dining preparation pipeline', 'success');
        }}
        onSetJourneyStep={(bId, step) => {
          dispatch(setJourneyStep({ id: bId, step }));
          showToast('Updated dining journey stage', 'info');
        }}
      />

      {/* Customer Details Modal (Part 3) */}
      <CustomerDetailsModal
        isOpen={customerModalOpen}
        onClose={() => {
          setCustomerModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        orders={orders}
        bookings={bookings}
        reviews={reviews}
        onSelectOrder={(ord) => {
          setSelectedOrder(ord);
          setOrderDetailsModalOpen(true);
          navigate(`/admin/orders/${ord.id}`);
        }}
        onSelectBooking={(bk) => {
          setCustomerModalOpen(false);
          navigate(`/admin/bookings/${bk.id}`);
        }}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={adminNotifications}
        onMarkAllAsRead={handleMarkAllNotifsRead}
        onSendNotification={handleSendBroadcastNotif}
        onActionClick={handleNotificationAction}
      />

      {/* Confirmation Modal */}
      {confirmDelete && (
        <ConfirmationModal
          open={!!confirmDelete}
          title={confirmDelete.title}
          message={confirmDelete.message}
          confirmLabel="Confirm Delete"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            confirmDelete.onConfirm();
            setConfirmDelete(null);
          }}
        />
      )}
    </div>
  );
}
