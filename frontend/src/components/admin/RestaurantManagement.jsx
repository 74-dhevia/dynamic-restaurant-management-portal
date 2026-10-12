import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Icon from '../Icon';
import SafeImage from '../SafeImage';
import ConfirmationModal from '../ConfirmationModal';
import Pagination from '../Pagination';
import { useToast } from '../../contexts/ToastContext';
import { AREAS, getFoodImage } from '../../data/mockData';
import {
  addRestaurant,
  updateRestaurant,
  deleteRestaurant,
  updateRestaurantStatus,
} from '../../redux/slices/restaurantSlice';
import { logActivity } from '../../redux/slices/activitySlice';

export default function RestaurantManagement({ subId = null, extraId = null }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Redux data subscriptions
  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants || []);
  const foods = useSelector(s => s.food?.foods || []);
  const orders = useSelector(s => s.order?.orders || []);
  const bookings = useSelector(s => s.booking?.bookings || []);
  const chefs = useSelector(s => s.chef?.chefs || []);

  // Filter, Search, Sort & View states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc' | 'rating-desc' | 'foods-desc' | 'tables-desc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, areaFilter, cuisineFilter, sortBy]);

  // Active view states
  // mode: 'list' | 'add' | 'edit' | 'details'
  const [mode, setMode] = useState(() => {
    if (subId === 'add') return 'add';
    if (subId === 'edit') return 'edit';
    if (subId && subId !== 'restaurants') return 'details';
    return 'list';
  });

  const [selectedRestId, setSelectedRestId] = useState(() => {
    if (subId === 'edit' && extraId) return extraId;
    if (subId && subId !== 'add' && subId !== 'restaurants' && subId !== 'edit') return subId;
    return null;
  });

  // Keep mode in sync with subId & extraId props from URL
  useEffect(() => {
    if (subId === 'add') {
      setMode('add');
      setSelectedRestId(null);
    } else if (subId === 'edit' && extraId) {
      const rest = reduxRestaurants.find(r => r.id === extraId);
      if (rest) {
        setFormData({
          id: rest.id,
          name: rest.name || '',
          image: rest.image || '',
          description: rest.description || '',
          area: rest.area || (AREAS[0] || 'Kovilpatti'),
          address: rest.address || '',
          cuisine: rest.cuisine || 'South Indian, Multi-Cuisine',
          openingTime: rest.openingTime || (rest.openHour !== undefined ? `${String(rest.openHour).padStart(2, '0')}:00` : '07:00'),
          closingTime: rest.closingTime || (rest.closeHour !== undefined ? `${String(rest.closeHour).padStart(2, '0')}:00` : '22:00'),
          openHour: rest.openHour ?? 7,
          closeHour: rest.closeHour ?? 22,
          phone: rest.phone || '+91 98765 43210',
          email: rest.email || `contact@${(rest.name || 'rest').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          seatingCapacity: rest.seatingCapacity || (rest.tables ? rest.tables.length * 4 : 32),
          status: rest.status || 'Open',
          hasTableBooking: rest.hasTableBooking !== undefined ? rest.hasTableBooking : true,
          hasPreOrder: rest.hasPreOrder !== undefined ? rest.hasPreOrder : true,
        });
        setFormErrors({});
        setMode('edit');
        setSelectedRestId(extraId);
      }
    } else if (subId && subId !== 'restaurants' && subId !== 'edit') {
      setMode('details');
      setSelectedRestId(subId);
    } else {
      setMode('list');
      setSelectedRestId(null);
    }
  }, [subId, extraId, reduxRestaurants]);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    danger: false,
    onConfirm: null,
  });

  // Edit / Add Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    image: '',
    description: '',
    area: AREAS[0] || 'Kovilpatti',
    address: '',
    cuisine: '',
    openingTime: '07:00',
    closingTime: '22:00',
    openHour: 7,
    closeHour: 22,
    phone: '',
    email: '',
    seatingCapacity: 40,
    status: 'Open',
    hasTableBooking: true,
    hasPreOrder: true,
  });

  const [formErrors, setFormErrors] = useState({});

  // Reset form or populate for edit
  const openAddForm = () => {
    setFormData({
      id: '',
      name: '',
      image: '',
      description: '',
      area: AREAS[0] || 'Kovilpatti',
      address: '',
      cuisine: 'South Indian, Chettinad, Dum Biriyani',
      openingTime: '07:00',
      closingTime: '22:00',
      openHour: 7,
      closeHour: 22,
      phone: '+91 98765 43210',
      email: 'manager@restaurant.com',
      seatingCapacity: 40,
      status: 'Open',
      hasTableBooking: true,
      hasPreOrder: true,
    });
    setFormErrors({});
    setMode('add');
    navigate('/admin/restaurants/add');
  };

  const openEditForm = (restaurant) => {
    setFormData({
      id: restaurant.id,
      name: restaurant.name || '',
      image: restaurant.image || '',
      description: restaurant.description || '',
      area: restaurant.area || (AREAS[0] || 'Kovilpatti'),
      address: restaurant.address || '',
      cuisine: restaurant.cuisine || 'South Indian, Multi-Cuisine',
      openingTime: restaurant.openingTime || (restaurant.openHour !== undefined ? `${String(restaurant.openHour).padStart(2, '0')}:00` : '07:00'),
      closingTime: restaurant.closingTime || (restaurant.closeHour !== undefined ? `${String(restaurant.closeHour).padStart(2, '0')}:00` : '22:00'),
      openHour: restaurant.openHour ?? 7,
      closeHour: restaurant.closeHour ?? 22,
      phone: restaurant.phone || '+91 98765 43210',
      email: restaurant.email || `contact@${(restaurant.name || 'rest').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      seatingCapacity: restaurant.seatingCapacity || (restaurant.tables ? restaurant.tables.length * 4 : 32),
      status: restaurant.status || 'Open',
      hasTableBooking: restaurant.hasTableBooking !== undefined ? restaurant.hasTableBooking : true,
      hasPreOrder: restaurant.hasPreOrder !== undefined ? restaurant.hasPreOrder : true,
    });
    setFormErrors({});
    setMode('edit');
    setSelectedRestId(restaurant.id);
    navigate(`/admin/restaurants/edit/${restaurant.id}`);
  };

  const openDetailsView = (restaurantId) => {
    setSelectedRestId(restaurantId);
    setMode('details');
    navigate(`/admin/restaurants/${restaurantId}`);
  };

  const backToList = () => {
    setMode('list');
    setSelectedRestId(null);
    navigate('/admin/restaurants');
  };

  // Image Upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormErrors(prev => ({ ...prev, image: 'Please choose a valid image file (PNG, JPG, WebP).' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors(prev => ({ ...prev, image: 'Image size should be less than 5MB.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setFormData(prev => ({ ...prev, image: loadEvt.target?.result }));
      setFormErrors(prev => ({ ...prev, image: null }));
    };
    reader.readAsDataURL(file);
  };

  // Validate Add/Edit form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Restaurant name is required.';
    }
    if (!formData.cuisine.trim()) {
      errors.cuisine = 'Please specify cuisine specialities.';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Contact phone number is required.';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please provide a valid email address.';
    }
    if (!formData.seatingCapacity || Number(formData.seatingCapacity) <= 0) {
      errors.seatingCapacity = 'Seating capacity must be a positive number.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Add/Edit Restaurant
  const handleSaveRestaurant = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the validation errors in the form.', 'error');
      return;
    }

    const openH = parseInt(formData.openingTime.split(':')[0], 10) || 7;
    const closeH = parseInt(formData.closingTime.split(':')[0], 10) || 22;

    const payload = {
      ...formData,
      name: formData.name.trim(),
      cuisine: formData.cuisine.trim(),
      description: formData.description.trim() || `Authentic restaurant in ${formData.area} known for delicious quality dining.`,
      address: formData.address.trim() || `Main Bazaar Road, ${formData.area}`,
      image: formData.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      openHour: openH,
      closeHour: closeH,
      seatingCapacity: Number(formData.seatingCapacity) || 40,
    };

    if (mode === 'edit' && formData.id) {
      dispatch(updateRestaurant(payload));
      dispatch(logActivity({
        action: 'Updated Restaurant Profile',
        entity: payload.name,
        entityType: 'Restaurant',
        prevValue: 'Edited',
        newValue: `${payload.status} (${payload.area})`,
      }));
      showToast(`Restaurant "${payload.name}" updated successfully.`, 'success');
      backToList();
    } else {
      payload.id = `r_${Date.now()}`;
      dispatch(addRestaurant(payload));
      dispatch(logActivity({
        action: 'Onboarded New Restaurant',
        entity: payload.name,
        entityType: 'Restaurant',
        prevValue: 'None',
        newValue: `${payload.area} • ${payload.cuisine}`,
      }));
      showToast(`Restaurant "${payload.name}" added to ZESTRO.`, 'success');
      backToList();
    }
  };

  // Status Change with Confirmation for Temporarily Unavailable
  const handlePromptStatusChange = (restaurant, targetStatus) => {
    setActiveMenuId(null);
    if (targetStatus === 'Temporarily Unavailable') {
      setConfirmModal({
        open: true,
        title: 'Make Restaurant Temporarily Unavailable?',
        message: `Are you sure you want to mark "${restaurant.name}" as Temporarily Unavailable? Customers will see this status and will be blocked from placing new orders for this restaurant.`,
        confirmLabel: 'Set Unavailable',
        danger: true,
        onConfirm: () => {
          dispatch(updateRestaurantStatus({ id: restaurant.id, status: 'Temporarily Unavailable' }));
          dispatch(logActivity({
            action: 'Changed Restaurant Status',
            entity: restaurant.name,
            entityType: 'Restaurant',
            prevValue: restaurant.status,
            newValue: 'Temporarily Unavailable',
          }));
          showToast(`"${restaurant.name}" is now Temporarily Unavailable.`, 'info');
          setConfirmModal(prev => ({ ...prev, open: false }));
        },
      });
    } else {
      dispatch(updateRestaurantStatus({ id: restaurant.id, status: targetStatus }));
      dispatch(logActivity({
        action: 'Changed Restaurant Status',
        entity: restaurant.name,
        entityType: 'Restaurant',
        prevValue: restaurant.status,
        newValue: targetStatus,
      }));
      showToast(`"${restaurant.name}" is now marked as ${targetStatus}.`, 'success');
    }
  };

  // Overview Counts (Actual application data, not random)
  const overviewStats = useMemo(() => {
    const total = reduxRestaurants.length;
    const open = reduxRestaurants.filter(r => (r.status || 'Open') === 'Open').length;
    const closed = reduxRestaurants.filter(r => r.status === 'Closed').length;
    const busy = reduxRestaurants.filter(r => r.status === 'Busy').length;
    const tempUnavailable = reduxRestaurants.filter(r => r.status === 'Temporarily Unavailable').length;
    return { total, open, closed, busy, tempUnavailable };
  }, [reduxRestaurants]);

  // Unique Cuisines for Filter Dropdown
  const uniqueCuisines = useMemo(() => {
    const list = new Set();
    reduxRestaurants.forEach(r => {
      if (r.cuisine) {
        r.cuisine.split(',').forEach(c => {
          const trimmed = c.trim();
          if (trimmed) list.add(trimmed);
        });
      }
    });
    return Array.from(list).sort();
  }, [reduxRestaurants]);

  // Filtered and Sorted Restaurant List
  const filteredRestaurants = useMemo(() => {
    let result = reduxRestaurants.filter(r => {
      if (statusFilter !== 'all' && (r.status || 'Open') !== statusFilter) return false;
      if (areaFilter !== 'all' && r.area !== areaFilter) return false;
      if (cuisineFilter !== 'all' && !(r.cuisine || '').toLowerCase().includes(cuisineFilter.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (r.name || '').toLowerCase().includes(q);
        const matchArea = (r.area || '').toLowerCase().includes(q);
        const matchCuisine = (r.cuisine || '').toLowerCase().includes(q);
        if (!matchName && !matchArea && !matchCuisine) return false;
      }
      return true;
    });

    if (sortBy === 'name-asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'rating-desc') {
      result.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    } else if (sortBy === 'foods-desc') {
      result.sort((a, b) => {
        const countA = foods.filter(f => f.restaurantId === a.id).length;
        const countB = foods.filter(f => f.restaurantId === b.id).length;
        return countB - countA;
      });
    } else if (sortBy === 'tables-desc') {
      result.sort((a, b) => (b.tables?.length || 8) - (a.tables?.length || 8));
    }

    return result;
  }, [reduxRestaurants, statusFilter, areaFilter, cuisineFilter, searchQuery, sortBy, foods]);

  const paginatedRestaurants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRestaurants.slice(start, start + pageSize);
  }, [filteredRestaurants, currentPage, pageSize]);

  // Selected restaurant for details view
  const currentDetailRestaurant = useMemo(() => {
    if (!selectedRestId) return null;
    return reduxRestaurants.find(r => r.id === selectedRestId) || null;
  }, [selectedRestId, reduxRestaurants]);

  // Restaurant details stats & menu
  const restaurantStats = useMemo(() => {
    if (!currentDetailRestaurant) return null;
    const rId = currentDetailRestaurant.id;
    const rOrders = orders.filter(o => o.restaurantId === rId);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayOrdersCount = rOrders.filter(o => (o.placedAt || o.createdAt || '').slice(0, 10) === todayStr).length;

    const rBookings = bookings.filter(b => b.restaurantId === rId);
    const todayBookingsCount = rBookings.filter(b => (b.date || b.createdAt || '').slice(0, 10) === todayStr).length;

    const foodCount = foods.filter(f => f.restaurantId === rId && f.status !== 'deactivated').length;
    const tablesCount = (currentDetailRestaurant.tables || []).length || 8;
    const chefsCount = chefs.filter(c => c.restaurantId === rId || c.restaurantName === currentDetailRestaurant.name).length;

    return {
      totalOrders: rOrders.length > 0 ? rOrders.length : '0',
      todayOrders: todayOrdersCount > 0 ? todayOrdersCount : '0',
      totalBookings: rBookings.length > 0 ? rBookings.length : '0',
      todayBookings: todayBookingsCount > 0 ? todayBookingsCount : '0',
      foodItems: foodCount,
      tables: tablesCount,
      chefs: chefsCount > 0 ? chefsCount : '0',
    };
  }, [currentDetailRestaurant, orders, bookings, foods, chefs]);

  // Menu preview grouped by category for details view
  const restaurantMenuCategorized = useMemo(() => {
    if (!currentDetailRestaurant) return {};
    const rId = currentDetailRestaurant.id;
    const restFoods = foods.filter(f => f.restaurantId === rId && f.status !== 'deactivated');

    const groups = {};
    restFoods.forEach(f => {
      const cat = f.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(f);
    });
    return groups;
  }, [currentDetailRestaurant, foods]);

  // Helper for Status Badge Rendering
  const renderStatusBadge = (status) => {
    let dotColor = '#2ecc71';
    let label = status || 'Open';
    let bg = 'rgba(46, 204, 113, 0.14)';
    let color = '#2ecc71';
    let border = 'rgba(46, 204, 113, 0.3)';

    if (status === 'Closed') {
      dotColor = '#e74c3c';
      bg = 'rgba(231, 76, 60, 0.14)';
      color = '#e74c3c';
      border = 'rgba(231, 76, 60, 0.3)';
    } else if (status === 'Busy') {
      dotColor = '#ffb703';
      bg = 'rgba(255, 183, 3, 0.14)';
      color = '#ffb703';
      border = 'rgba(255, 183, 3, 0.3)';
    } else if (status === 'Temporarily Unavailable') {
      dotColor = '#95a5a6';
      label = 'Unavailable';
      bg = 'rgba(149, 165, 166, 0.18)';
      color = 'var(--text-muted, #8b949e)';
      border = 'rgba(149, 165, 166, 0.35)';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 8px',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
          background: bg,
          color,
          border: `1px solid ${border}`,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor }} />
        {label}
      </span>
    );
  };

  // Close active dropdown menu when clicking anywhere
  useEffect(() => {
    const handleWindowClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // ==========================================
  // VIEW: ADD / EDIT RESTAURANT FORM
  // ==========================================
  if (mode === 'add' || mode === 'edit') {
    const isEditing = mode === 'edit';
    return (
      <div className="admin-view-fade">
        <div className="view-header-row" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={backToList}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="chevron-left" size={16} /> Back to Restaurants
            </button>
            <div>
              <h1 className="view-title" style={{ margin: 0 }}>
                {isEditing ? `Edit Restaurant: ${formData.name}` : 'Add New Restaurant'}
              </h1>
              <p className="view-sub" style={{ margin: 0 }}>
                {isEditing
                  ? 'Modify restaurant profile, operating hours, capacity, and service status'
                  : 'Onboard a new dining establishment to the ZESTRO partner network'}
              </p>
            </div>
          </div>
        </div>

        <div className="card admin-form-card" style={{ maxWidth: 860, padding: 24, margin: '0 auto' }}>
          <form onSubmit={handleSaveRestaurant}>
            {/* Image Upload with Preview, Replace, Remove */}
            <div className="form-image-uploader-section" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'block' }}>
                Restaurant Image
              </label>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: 200,
                    height: 130,
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {formData.image ? (
                    <SafeImage
                      image={formData.image}
                      alt={formData.name || 'Restaurant Preview'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      emoji="🏠"
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Icon name="restaurant" size={36} color="var(--border)" />
                      <div style={{ fontSize: 11, marginTop: 4 }}>No Image Selected</div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="add" size={14} />
                    <span>{formData.image ? 'Replace Image' : 'Upload Image'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                  {formData.image && (
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-danger"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Icon name="trash" size={12} /> Remove Image
                    </button>
                  )}
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    Recommended: 16:9 ratio, min 800x450px. Max 5MB.
                  </span>
                  {formErrors.image && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{formErrors.image}</span>}
                </div>
              </div>
            </div>

            {/* Grid Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 18 }}>
              {/* Name */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Annapoorna Heritage"
                  className="admin-form-input small"
                  style={{ width: '100%' }}
                />
                {formErrors.name && <span style={{ color: 'var(--danger)', fontSize: 11.5 }}>{formErrors.name}</span>}
              </div>

              {/* Area */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Area / Region *
                </label>
                <select
                  value={formData.area}
                  onChange={e => setFormData(prev => ({ ...prev, area: e.target.value }))}
                  className="admin-form-select small"
                  style={{ width: '100%' }}
                >
                  {AREAS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Cuisine */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Cuisines / Specialties *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cuisine}
                  onChange={e => setFormData(prev => ({ ...prev, cuisine: e.target.value }))}
                  placeholder="e.g. South Indian, Biriyani, Chettinad"
                  className="admin-form-input small"
                  style={{ width: '100%' }}
                />
                {formErrors.cuisine && <span style={{ color: 'var(--danger)', fontSize: 11.5 }}>{formErrors.cuisine}</span>}
              </div>

              {/* Seating Capacity */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Total Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.seatingCapacity}
                  onChange={e => setFormData(prev => ({ ...prev, seatingCapacity: e.target.value }))}
                  placeholder="e.g. 48"
                  className="admin-form-input small"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Opening Time */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Opening Time
                </label>
                <input
                  type="time"
                  value={formData.openingTime}
                  onChange={e => setFormData(prev => ({ ...prev, openingTime: e.target.value }))}
                  className="admin-form-input small"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Closing Time */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Closing Time
                </label>
                <input
                  type="time"
                  value={formData.closingTime}
                  onChange={e => setFormData(prev => ({ ...prev, closingTime: e.target.value }))}
                  className="admin-form-input small"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 98401 23456"
                  className="admin-form-input small"
                  style={{ width: '100%' }}
                />
                {formErrors.phone && <span style={{ color: 'var(--danger)', fontSize: 11.5 }}>{formErrors.phone}</span>}
              </div>

              {/* Email */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="operations@restaurant.com"
                  className="admin-form-input small"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Operational Status */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Initial Status
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="admin-form-select small"
                  style={{ width: '100%' }}
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                  <option value="Busy">Busy</option>
                  <option value="Temporarily Unavailable">Temporarily Unavailable</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                Full Physical Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Shop No. 12, South Car Street, Kovilpatti"
                className="admin-form-input small"
                style={{ width: '100%' }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                Description &amp; Highlights
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Highlight signature dishes, atmosphere, special awards or dining history..."
                className="admin-form-textarea"
                style={{ width: '100%' }}
              />
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={formData.hasTableBooking}
                  onChange={e => setFormData(prev => ({ ...prev, hasTableBooking: e.target.checked }))}
                />
                <span>Enable Table Reservations</span>
              </label>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={formData.hasPreOrder}
                  onChange={e => setFormData(prev => ({ ...prev, hasPreOrder: e.target.checked }))}
                />
                <span>Enable Food Pre-Orders</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={backToList}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Icon name="check" size={16} />
                <span>Save Restaurant</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: RESTAURANT DETAILS VIEW (Section 7)
  // ==========================================
  if (mode === 'details' && currentDetailRestaurant) {
    const r = currentDetailRestaurant;
    return (
      <div className="admin-view-fade">
        {/* Navigation & Header */}
        <div className="view-header-row" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={backToList}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="chevron-left" size={16} /> Back to Restaurants
            </button>
            <div>
              <h1 className="view-title" style={{ margin: 0 }}>Restaurant Profile: {r.name}</h1>
              <p className="view-sub" style={{ margin: 0 }}>
                Operations telemetry, real statistics, and menu preview
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => openEditForm(r)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="edit" size={14} /> Edit Restaurant
            </button>

            {/* Quick Status Select */}
            <select
              value={r.status || 'Open'}
              onChange={e => handlePromptStatusChange(r, e.target.value)}
              className="admin-form-select small"
              style={{ width: 'auto' }}
            >
              <option value="Open">Status: Open</option>
              <option value="Closed">Status: Closed</option>
              <option value="Busy">Status: Busy</option>
              <option value="Temporarily Unavailable">Status: Temporarily Unavailable</option>
            </select>
          </div>
        </div>

        {/* Top Section: Cover & Details Card */}
        <div className="card" style={{ padding: 24, marginBottom: 22, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) 1fr', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ height: 160, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <SafeImage
                image={r.image}
                alt={r.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                emoji="🏠"
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{r.name}</h2>
                {renderStatusBadge(r.status)}
                <span className="rating-chip" style={{ fontSize: 13, background: 'rgba(255, 183, 3, 0.15)', color: '#ffb703' }}>
                  ★ {r.rating || '4.5'} ({r.ratingCount || 50} reviews)
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, flexWrap: 'wrap' }}>
                <span><Icon name="location" size={13} color="var(--accent)" /> {r.address || r.area}</span>
                <span><strong>Cuisine:</strong> {r.cuisine}</span>
                <span><strong>Hours:</strong> {r.openingTime || `${r.openHour}:00`} – {r.closingTime || `${r.closeHour}:00`}</span>
              </div>

              <div style={{ display: 'flex', gap: 16, color: 'var(--text-muted)', fontSize: 13, marginBottom: 12, flexWrap: 'wrap' }}>
                <span>📞 {r.phone || '+91 98765 43210'}</span>
                <span>✉️ {r.email || `contact@${r.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`}</span>
                <span>🪑 Seating: {r.seatingCapacity || 40} seats</span>
              </div>

              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text)', maxWidth: 740, lineHeight: 1.5 }}>
                {r.description || `Specialty establishment offering authentic South Indian flavors in ${r.area}.`}
              </p>

              {/* Quick Action Links */}
              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => navigate('/admin/tables')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icon name="table" size={13} />
                  <span>Manage Tables ({restaurantStats?.tables || 0})</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => navigate('/admin/chefs')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icon name="chef" size={13} />
                  <span>Manage Chefs ({restaurantStats?.chefs || 0})</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => navigate('/admin/food', { state: { filterRestaurantId: r.id } })}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icon name="food" size={13} />
                  <span>Manage Full Menu ({restaurantStats?.foodItems || 0} items)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Information Cards: Orders, Bookings, Food Items, Tables, Chefs */}
        <h3 style={{ fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="analytics" size={16} color="var(--accent)" />
          <span>Operations &amp; Telemetry Cards</span>
        </h3>
        <div className="stat-cards-grid cols-5" style={{ marginBottom: 24 }}>
          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-title">Total Orders</span>
              <div className="admin-stat-icon" style={{ background: 'rgba(232, 84, 42, 0.1)', color: 'var(--accent)' }}>📦</div>
            </div>
            <div>
              <div className="admin-stat-val" style={{ color: 'var(--accent)' }}>{restaurantStats?.totalOrders}</div>
              <div className="admin-stat-sub">Today: {restaurantStats?.todayOrders} orders</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-title">Bookings</span>
              <div className="admin-stat-icon" style={{ background: 'rgba(58, 134, 255, 0.1)', color: '#3a86ff' }}>📅</div>
            </div>
            <div>
              <div className="admin-stat-val" style={{ color: '#3a86ff' }}>{restaurantStats?.totalBookings}</div>
              <div className="admin-stat-sub">Today: {restaurantStats?.todayBookings} guests</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-title">Food Items</span>
              <div className="admin-stat-icon" style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>🍽️</div>
            </div>
            <div>
              <div className="admin-stat-val" style={{ color: '#2ecc71' }}>{restaurantStats?.foodItems}</div>
              <div className="admin-stat-sub">Active menu items</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-title">Tables</span>
              <div className="admin-stat-icon" style={{ background: 'rgba(6, 214, 160, 0.1)', color: '#06d6a0' }}>🪑</div>
            </div>
            <div>
              <div className="admin-stat-val" style={{ color: '#06d6a0' }}>{restaurantStats?.tables}</div>
              <div className="admin-stat-sub">Floor layout capacity</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-title">Master Chefs</span>
              <div className="admin-stat-icon" style={{ background: 'rgba(231, 111, 81, 0.1)', color: '#e76f51' }}>👨‍🍳</div>
            </div>
            <div>
              <div className="admin-stat-val" style={{ color: '#e76f51' }}>{restaurantStats?.chefs}</div>
              <div className="admin-stat-sub">Assigned culinary roster</div>
            </div>
          </div>
        </div>

        {/* Restaurant Menu Preview (Requirement 7) */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Restaurant Menu Preview</h3>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: 12.5 }}>
                Current live dishes served by {r.name}, matching the real customer menu experience
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/admin/food/add')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="add" size={14} /> Add Food to this Restaurant
            </button>
          </div>

          {Object.keys(restaurantMenuCategorized).length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
              <Icon name="food" size={40} color="var(--text-muted)" />
              <div style={{ marginTop: 10, fontWeight: 600 }}>No food items assigned yet</div>
              <p className="muted">Add dishes for this restaurant to build its menu catalog.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/admin/food/add')}
                style={{ marginTop: 12 }}
              >
                + Add Food Item
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {Object.entries(restaurantMenuCategorized).map(([cat, items]) => (
                <div key={cat} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
                  <h4 style={{ margin: '0 0 14px', textTransform: 'capitalize', color: 'var(--accent)', fontSize: 14.5, fontWeight: 700 }}>
                    🍽️ {cat.replace(/-/g, ' ')} ({items.length})
                  </h4>
                  <div className="food-menu-grid">
                    {items.map(dish => (
                      <div
                        key={dish.id}
                        className="food-admin-card"
                        onClick={() => navigate(`/admin/food/${dish.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="food-card-cover" style={{ height: 140 }}>
                          <SafeImage
                            image={dish.image || getFoodImage(dish.name, dish.category)}
                            alt={dish.name}
                            emoji="🍛"
                          />
                          <div className="food-card-diet-badge">
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: dish.veg ? '#2ecc71' : '#e74c3c' }} />
                            <span>{dish.veg ? 'Veg' : 'Non-Veg'}</span>
                          </div>
                          <div className="food-card-top-badges">
                            <span
                              style={{
                                padding: '2px 7px',
                                borderRadius: 10,
                                fontSize: 10.5,
                                fontWeight: 700,
                                background: dish.available ? 'rgba(46, 204, 113, 0.9)' : 'rgba(231, 76, 60, 0.9)',
                                color: '#fff',
                              }}
                            >
                              {dish.available ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </div>
                        <div className="food-card-body" style={{ padding: 12 }}>
                          <h4 className="food-card-title" style={{ fontSize: 14 }}>{dish.name}</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                            <strong style={{ fontSize: 15, color: 'var(--accent)' }}>₹{dish.price}</strong>
                            <span style={{ fontSize: 11.5, color: '#ffb703' }}>★ {dish.rating || '4.5'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: MAIN RESTAURANT TABLE & LIST VIEW
  // ==========================================
  return (
    <div className="admin-view-fade restaurant-management-view">
      {/* 1. Page Header */}
      <div className="view-header-row" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="view-title" style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Restaurant Management</h1>
          <p className="view-sub" style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--text-muted)' }}>
            Manage restaurants, availability, menus and operations across ZESTRO.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openAddForm}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, borderRadius: 8 }}
        >
          <Icon name="add" size={16} />
          <span>Add Restaurant</span>
        </button>
      </div>

      {/* 2. Compact Horizontal Statistics Cards (Requirement 1) */}
      <div className="stat-cards-grid cols-5" style={{ marginBottom: 22 }}>
        {/* Total Restaurants */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-title">Total Restaurants</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(232, 84, 42, 0.1)', color: 'var(--accent)' }}>
              🏪
            </div>
          </div>
          <div>
            <div className="admin-stat-val" style={{ color: 'var(--accent)' }}>
              {overviewStats.total}
            </div>
            <div className="admin-stat-sub">Active network branches</div>
          </div>
        </div>

        {/* Open */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-title">Open</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
              🟢
            </div>
          </div>
          <div>
            <div className="admin-stat-val" style={{ color: '#2ecc71' }}>
              {overviewStats.open}
            </div>
            <div className="admin-stat-sub">Accepting orders &amp; diners</div>
          </div>
        </div>

        {/* Closed */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-title">Closed</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }}>
              🔴
            </div>
          </div>
          <div>
            <div className="admin-stat-val" style={{ color: 'var(--text-muted)' }}>
              {overviewStats.closed}
            </div>
            <div className="admin-stat-sub">Off operational hours</div>
          </div>
        </div>

        {/* Busy */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-title">Busy</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(255, 183, 3, 0.12)', color: '#ffb703' }}>
              🟠
            </div>
          </div>
          <div>
            <div className="admin-stat-val" style={{ color: '#ffb703' }}>
              {overviewStats.busy}
            </div>
            <div className="admin-stat-sub">High kitchen load</div>
          </div>
        </div>

        {/* Temporarily Unavailable */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-title">Unavailable</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(149, 165, 166, 0.12)', color: '#95a5a6' }}>
              ⚠️
            </div>
          </div>
          <div>
            <div className="admin-stat-val" style={{ color: 'var(--danger)' }}>
              {overviewStats.tempUnavailable}
            </div>
            <div className="admin-stat-sub">Ordering blocked</div>
          </div>
        </div>
      </div>

      {/* 3. Restaurant Search + Filter Bar (Requirement 3) */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Icon name="search" size={15} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search restaurants by name, cuisine, location..."
              className="admin-form-input small"
              style={{ width: '100%', paddingLeft: 34, height: 38, borderRadius: 8 }}
            />
          </div>

          {/* Location Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              value={areaFilter}
              onChange={e => setAreaFilter(e.target.value)}
              className="admin-form-select small"
              style={{ height: 38, borderRadius: 8, padding: '0 10px' }}
            >
              <option value="all">All Locations</option>
              {AREAS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Cuisine Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              value={cuisineFilter}
              onChange={e => setCuisineFilter(e.target.value)}
              className="admin-form-select small"
              style={{ height: 38, borderRadius: 8, padding: '0 10px', maxWidth: 160 }}
            >
              <option value="all">All Cuisines</option>
              {uniqueCuisines.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="admin-form-select small"
              style={{ height: 38, borderRadius: 8, padding: '0 10px' }}
            >
              <option value="all">All Statuses</option>
              <option value="Open">🟢 Open</option>
              <option value="Closed">🔴 Closed</option>
              <option value="Busy">🟠 Busy</option>
              <option value="Temporarily Unavailable">⚫ Unavailable</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="admin-form-select small"
              style={{ height: 38, borderRadius: 8, padding: '0 10px' }}
            >
              <option value="name-asc">Sort: Name A–Z</option>
              <option value="rating-desc">Sort: Rating High–Low</option>
              <option value="foods-desc">Sort: Most Foods</option>
              <option value="tables-desc">Sort: Most Tables</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞ Grid
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              ☰ Table
            </button>
          </div>

          {/* Clear Filters */}
          {(searchQuery || statusFilter !== 'all' || areaFilter !== 'all' || cuisineFilter !== 'all') && (
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setAreaFilter('all');
                setCuisineFilter('all');
              }}
              style={{ height: 38, borderRadius: 8 }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 4. RESTAURANT DISPLAY: GRID OR TABLE */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Icon name="loader" size={32} className="spin-icon" />
          <div style={{ marginTop: 8 }}>Loading restaurants...</div>
        </div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--danger)' }}>
          <div>Error loading restaurant data: {error}</div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setError(null)} style={{ marginTop: 10 }}>
            Retry
          </button>
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="empty-state" style={{ padding: 48, textAlign: 'center' }}>
          <Icon name="restaurant" size={44} color="var(--text-muted)" />
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>No matching restaurants found</div>
          <p className="muted" style={{ margin: '6px 0 16px' }}>
            {searchQuery || statusFilter !== 'all' || areaFilter !== 'all' || cuisineFilter !== 'all'
              ? 'Try modifying your search query or reset the applied filters.'
              : 'Onboard your first restaurant to get started.'}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openAddForm}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="add" size={14} /> Add Restaurant
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* PROFESSIONAL RESTAURANT CARDS GRID (Requirement 4 & 5 & 6) */
        <div className="restaurant-cards-grid">
          {paginatedRestaurants.map(r => {
            const rFoodsCount = foods.filter(f => f.restaurantId === r.id && f.status !== 'deactivated').length;
            const rTablesCount = (r.tables || []).length || 8;
            const isMenuOpen = activeMenuId === r.id;

            return (
              <div key={r.id} className="restaurant-admin-card">
                {/* Cover Image & Badges */}
                <div className="restaurant-card-cover">
                  <SafeImage
                    image={r.image}
                    alt={r.name}
                    emoji="🏠"
                  />
                  <div className="restaurant-badge-overlay">
                    {renderStatusBadge(r.status)}
                  </div>
                  <div className="restaurant-rating-overlay">
                    ★ {r.rating || '4.5'}
                  </div>
                </div>

                {/* Card Content */}
                <div className="restaurant-card-body">
                  <h3 className="restaurant-card-name">{r.name}</h3>

                  <div className="restaurant-card-meta">
                    <span>{r.cuisine}</span>
                    <span>•</span>
                    <span><Icon name="location" size={12} color="var(--accent)" /> {r.area}</span>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon name="clock" size={12} />
                    <span>{r.openingTime || `${r.openHour || 7}:00 AM`} – {r.closingTime || `${r.closeHour || 22}:00 PM`}</span>
                  </div>

                  {/* Telemetry row */}
                  <div className="restaurant-card-telemetry">
                    <div className="restaurant-card-telemetry-item">
                      <span style={{ color: 'var(--accent)' }}>🍽️</span>
                      <span>{rFoodsCount} Food Items</span>
                    </div>
                    <div className="restaurant-card-telemetry-item" style={{ marginLeft: 'auto' }}>
                      <span style={{ color: '#06d6a0' }}>🪑</span>
                      <span>{rTablesCount} Tables</span>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="restaurant-card-actions">
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() => openDetailsView(r.id)}
                        style={{ borderRadius: 6, fontWeight: 600 }}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() => openEditForm(r)}
                        style={{ borderRadius: 6, fontWeight: 600 }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-primary"
                        onClick={() => navigate('/admin/food', { state: { filterRestaurantId: r.id } })}
                        style={{ borderRadius: 6, fontWeight: 600 }}
                      >
                        Manage Menu
                      </button>
                    </div>

                    {/* Secondary Actions ⋮ Menu */}
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : r.id);
                        }}
                        style={{ padding: '3px 8px', borderRadius: 6 }}
                        title="More actions"
                      >
                        ⋮
                      </button>

                      {isMenuOpen && (
                        <div
                          className="card"
                          style={{
                            position: 'absolute',
                            right: 0,
                            bottom: '100%',
                            marginBottom: 6,
                            minWidth: 180,
                            padding: 6,
                            zIndex: 100,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                            borderRadius: 8,
                            background: 'var(--bg-elevated)',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="dropdown-item"
                            onClick={() => {
                              setActiveMenuId(null);
                              navigate('/admin/tables');
                            }}
                          >
                            <Icon name="table" size={14} /> Manage Tables
                          </button>
                          <button
                            type="button"
                            className="dropdown-item"
                            onClick={() => {
                              setActiveMenuId(null);
                              navigate('/admin/chefs');
                            }}
                          >
                            <Icon name="chef" size={14} /> Manage Chefs
                          </button>
                          <div className="dropdown-divider" />
                          <div style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', color: 'var(--text-muted)' }}>
                            CHANGE STATUS
                          </div>
                          <button
                            type="button"
                            className="dropdown-item"
                            onClick={() => handlePromptStatusChange(r, 'Open')}
                          >
                            🟢 Mark Open
                          </button>
                          <button
                            type="button"
                            className="dropdown-item"
                            onClick={() => handlePromptStatusChange(r, 'Closed')}
                          >
                            🔴 Mark Closed
                          </button>
                          <button
                            type="button"
                            className="dropdown-item"
                            onClick={() => handlePromptStatusChange(r, 'Busy')}
                          >
                            🟠 Mark Busy
                          </button>
                          <button
                            type="button"
                            className="dropdown-item"
                            onClick={() => handlePromptStatusChange(r, 'Temporarily Unavailable')}
                          >
                            ⚠️ Set Unavailable
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (Preserved for complete functionality) */
        <div className="card table-container-card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 64 }}>Image</th>
                  <th>Restaurant Name</th>
                  <th>Location</th>
                  <th>Cuisine</th>
                  <th>Operating Hours</th>
                  <th>Rating</th>
                  <th>Food Items</th>
                  <th>Tables</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', minWidth: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRestaurants.map(r => {
                  const rFoodsCount = foods.filter(f => f.restaurantId === r.id && f.status !== 'deactivated').length;
                  const rTablesCount = (r.tables || []).length || 8;

                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ width: 44, height: 40, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                          <SafeImage
                            image={r.image}
                            alt={r.name}
                            emoji="🏠"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      </td>
                      <td>
                        <strong
                          style={{ cursor: 'pointer', color: 'var(--accent)' }}
                          onClick={() => openDetailsView(r.id)}
                        >
                          {r.name}
                        </strong>
                        <div className="muted" style={{ fontSize: 11.5 }}>
                          ID: {r.id} • {r.phone || 'No phone'}
                        </div>
                      </td>
                      <td>{r.area}</td>
                      <td style={{ fontSize: 12.5 }}>{r.cuisine}</td>
                      <td style={{ fontSize: 12 }}>
                        {r.openingTime || `${r.openHour}:00`} – {r.closingTime || `${r.closeHour}:00`}
                      </td>
                      <td>
                        <span className="rating-chip" style={{ fontSize: 11.5 }}>
                          ★ {r.rating || '4.5'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{rFoodsCount}</span> items
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{rTablesCount}</span> tables
                      </td>
                      <td>{renderStatusBadge(r.status)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => openDetailsView(r.id)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => openEditForm(r)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            onClick={() => navigate('/admin/food', { state: { filterRestaurantId: r.id } })}
                          >
                            Menu
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
      )}

      {/* Pagination Controls */}
      {mode === 'list' && filteredRestaurants.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredRestaurants.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50]}
          itemName="restaurants"
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        danger={confirmModal.danger}
        onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
}
