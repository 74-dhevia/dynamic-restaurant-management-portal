import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../Icon';
import SafeImage from '../SafeImage';
import ConfirmationModal from '../ConfirmationModal';
import { useToast } from '../../contexts/ToastContext';
import { CATEGORIES, getFoodImage } from '../../data/mockData';
import {
  addFood,
  updateFood,
  deleteFood,
  setFoodAvailability,
  bulkSetFoodAvailability,
  toggleFoodStatus,
  deactivateFood,
} from '../../redux/slices/foodSlice';
import { logActivity } from '../../redux/slices/activitySlice';
import Pagination from '../Pagination';

export default function FoodManagement({ subId = null, extraId = null }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  // Redux data subscriptions
  const foods = useSelector(s => s.food?.foods || []);
  const restaurants = useSelector(s => s.restaurant?.restaurants || []);
  const orders = useSelector(s => s.order?.orders || []);
  const reviews = useSelector(s => s.review?.reviews || []);

  // Filter & Search & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState(() => location.state?.filterRestaurantId || 'all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all' | 'available' | 'unavailable'
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all' | 'veg' | 'non-veg'
  const [priceRangeFilter, setPriceRangeFilter] = useState('all'); // 'all' | 'under-100' | '100-200' | '200-300' | '300-plus'
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all' | '4' | '4.5'
  const [sortBy, setSortBy] = useState('most-ordered'); // 'most-ordered' | 'recently-added' | 'name-asc' | 'price-asc' | 'price-desc' | 'rating-desc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState([]);

  // Active view mode: 'list' | 'add' | 'edit' | 'details'
  const [mode, setMode] = useState(() => {
    if (subId === 'add') return 'add';
    if (subId === 'edit') return 'edit';
    if (subId && subId !== 'food') return 'details';
    return 'list';
  });

  const [selectedFoodId, setSelectedFoodId] = useState(() => {
    if (subId === 'edit' && extraId) return extraId;
    if (subId && subId !== 'add' && subId !== 'food' && subId !== 'edit') return subId;
    return null;
  });

  // Watch for incoming filterRestaurantId in location state
  useEffect(() => {
    if (location.state?.filterRestaurantId) {
      setRestaurantFilter(location.state.filterRestaurantId);
    }
  }, [location.state]);

  // Sync mode with subId & extraId props from URL
  useEffect(() => {
    if (subId === 'add') {
      setMode('add');
      setSelectedFoodId(null);
    } else if (subId === 'edit' && extraId) {
      const dish = foods.find(f => f.id === extraId);
      if (dish) {
        setFormData({
          id: dish.id,
          name: dish.name || '',
          restaurantId: dish.restaurantId || (restaurants[0]?.id || ''),
          category: dish.category || (CATEGORIES[0]?.id || 'south-indian'),
          description: dish.description || '',
          image: dish.image || '',
          price: dish.price !== undefined ? String(dish.price) : '',
          discount: dish.discount !== undefined ? String(dish.discount) : '0',
          veg: dish.veg !== undefined ? !!dish.veg : true,
          spiceLevel: dish.spiceLevel || 'Medium',
          prepTimeMin: dish.prepTimeMin ? String(dish.prepTimeMin) : '15',
          ingredients: dish.ingredients || '',
          allergens: dish.allergens || '',
          portionSize: dish.portionSize || '1 Serving (approx 350g)',
          available: dish.available !== undefined ? dish.available : true,
          status: dish.status || 'active',
        });
        setFormErrors({});
        setMode('edit');
        setSelectedFoodId(extraId);
      }
    } else if (subId && subId !== 'food' && subId !== 'edit') {
      setMode('details');
      setSelectedFoodId(subId);
    } else {
      setMode('list');
      setSelectedFoodId(null);
    }
  }, [subId, extraId, foods, restaurants]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, restaurantFilter, categoryFilter, availabilityFilter, dietaryFilter, priceRangeFilter, sortBy]);

  // Close popup menu on outside click
  useEffect(() => {
    const handleWinClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleWinClick);
    return () => window.removeEventListener('click', handleWinClick);
  }, []);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    danger: false,
    onConfirm: null,
  });

  // Add / Edit Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    restaurantId: '',
    category: 'south-indian',
    description: '',
    image: '',
    price: '',
    discount: '0',
    veg: true,
    spiceLevel: 'Medium',
    prepTimeMin: '15',
    ingredients: '',
    allergens: '',
    portionSize: '1 Serving (approx 350g)',
    available: true,
    status: 'active',
  });

  const [formErrors, setFormErrors] = useState({});

  // Reset form or populate for edit
  const openAddForm = () => {
    setFormData({
      id: '',
      name: '',
      restaurantId: restaurants[0]?.id || '',
      category: 'south-indian',
      description: '',
      image: '',
      price: '',
      discount: '0',
      veg: true,
      spiceLevel: 'Medium',
      prepTimeMin: '15',
      ingredients: 'Fresh local ingredients, traditional spice blend',
      allergens: 'None',
      portionSize: '1 Serving',
      available: true,
      status: 'active',
    });
    setFormErrors({});
    setMode('add');
    navigate('/admin/food/add');
  };

  const openEditForm = (dish) => {
    setFormData({
      id: dish.id,
      name: dish.name || '',
      restaurantId: dish.restaurantId || (restaurants[0]?.id || ''),
      category: dish.category || (CATEGORIES[0]?.id || 'south-indian'),
      description: dish.description || '',
      image: dish.image || '',
      price: dish.price !== undefined ? String(dish.price) : '',
      discount: dish.discount !== undefined ? String(dish.discount) : '0',
      veg: dish.veg !== undefined ? !!dish.veg : true,
      spiceLevel: dish.spiceLevel || 'Medium',
      prepTimeMin: dish.prepTimeMin ? String(dish.prepTimeMin) : '15',
      ingredients: dish.ingredients || '',
      allergens: dish.allergens || '',
      portionSize: dish.portionSize || '1 Serving',
      available: dish.available !== undefined ? dish.available : true,
      status: dish.status || 'active',
    });
    setFormErrors({});
    setMode('edit');
    setSelectedFoodId(dish.id);
    navigate(`/admin/food/edit/${dish.id}`);
  };

  const openDetailsView = (foodId) => {
    setSelectedFoodId(foodId);
    setMode('details');
    navigate(`/admin/food/${foodId}`);
  };

  const backToList = () => {
    setMode('list');
    setSelectedFoodId(null);
    navigate('/admin/food');
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
      errors.name = 'Food name is required.';
    }
    if (!formData.restaurantId) {
      errors.restaurantId = 'Please select a restaurant.';
    }
    if (!formData.price || Number(formData.price) <= 0) {
      errors.price = 'Price must be greater than 0.';
    }
    if (formData.discount && Number(formData.discount) < 0) {
      errors.discount = 'Discount cannot be negative.';
    }
    if (Number(formData.discount) >= Number(formData.price)) {
      errors.discount = 'Discount must be less than price.';
    }
    if (!formData.prepTimeMin || Number(formData.prepTimeMin) <= 0) {
      errors.prepTimeMin = 'Prep time must be positive.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Add/Edit Food Item
  const handleSaveFood = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the validation errors in the form.', 'error');
      return;
    }

    const selectedRest = restaurants.find(r => r.id === formData.restaurantId);

    const payload = {
      ...formData,
      name: formData.name.trim(),
      price: Number(formData.price),
      discount: Number(formData.discount) || 0,
      prepTimeMin: Number(formData.prepTimeMin) || 15,
      restaurantName: selectedRest ? selectedRest.name : 'ZESTRO Kitchen',
      description: formData.description.trim() || `Authentic ${formData.name} freshly prepared to perfection.`,
      image: formData.image || getFoodImage(formData.name, formData.category).src,
    };

    if (mode === 'edit' && formData.id) {
      dispatch(updateFood(payload));
      dispatch(logActivity({
        action: 'Updated Food Item',
        entity: payload.name,
        entityType: 'Food',
        prevValue: 'Edited',
        newValue: `₹${payload.price} (${payload.category})`,
      }));
      showToast(`Food item "${payload.name}" updated successfully.`, 'success');
      backToList();
    } else {
      payload.id = `f_${Date.now()}`;
      dispatch(addFood(payload));
      dispatch(logActivity({
        action: 'Added New Food Dish',
        entity: payload.name,
        entityType: 'Food',
        prevValue: 'None',
        newValue: `₹${payload.price} • ${payload.restaurantName}`,
      }));
      showToast(`Food item "${payload.name}" added to menu catalog.`, 'success');
      backToList();
    }
  };

  // Toggle Availability with Confirmation when making Unavailable
  const handleToggleAvailability = (dish) => {
    setActiveMenuId(null);
    if (dish.available) {
      setConfirmModal({
        open: true,
        title: 'Make Food Item Unavailable?',
        message: `Are you sure you want to make "${dish.name}" unavailable? Customers will see "Currently Unavailable" on the menu and will NOT be able to add it to their cart.`,
        confirmLabel: 'Mark Unavailable',
        danger: true,
        onConfirm: () => {
          dispatch(setFoodAvailability({ id: dish.id, available: false }));
          dispatch(logActivity({
            action: 'Changed Food Availability',
            entity: dish.name,
            entityType: 'Food',
            prevValue: 'Available',
            newValue: 'Unavailable',
          }));
          showToast(`"${dish.name}" is now marked Unavailable.`, 'info');
          setConfirmModal(prev => ({ ...prev, open: false }));
        },
      });
    } else {
      dispatch(setFoodAvailability({ id: dish.id, available: true }));
      dispatch(logActivity({
        action: 'Changed Food Availability',
        entity: dish.name,
        entityType: 'Food',
        prevValue: 'Unavailable',
        newValue: 'Available',
      }));
      showToast(`"${dish.name}" is now Available for customer orders.`, 'success');
    }
  };

  // Deactivate Dish (Safe for historical orders)
  const handleDeactivate = (dish) => {
    setActiveMenuId(null);
    setConfirmModal({
      open: true,
      title: `Deactivate "${dish.name}"?`,
      message: `Deactivating will remove "${dish.name}" from active customer menus while preserving historical customer orders, billing records, and analytics. Are you sure?`,
      confirmLabel: 'Deactivate Dish',
      danger: true,
      onConfirm: () => {
        dispatch(deactivateFood(dish.id));
        dispatch(logActivity({
          action: 'Deactivated Food Item',
          entity: dish.name,
          entityType: 'Food',
          prevValue: 'Active',
          newValue: 'Deactivated',
        }));
        showToast(`"${dish.name}" deactivated from active menus.`, 'info');
        setConfirmModal(prev => ({ ...prev, open: false }));
      },
    });
  };

  // Bulk Actions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredFoods.map(f => f.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkSetAvailability = (targetAvailable) => {
    if (selectedIds.length === 0) return;
    const actionLabel = targetAvailable ? 'Available' : 'Unavailable';

    setConfirmModal({
      open: true,
      title: `Mark ${selectedIds.length} Items ${actionLabel}?`,
      message: `Are you sure you want to change the ordering availability of ${selectedIds.length} selected food items to "${actionLabel}"?`,
      confirmLabel: `Mark ${actionLabel}`,
      danger: !targetAvailable,
      onConfirm: () => {
        dispatch(bulkSetFoodAvailability({ ids: selectedIds, available: targetAvailable }));
        dispatch(logActivity({
          action: `Bulk Set Availability (${actionLabel})`,
          entity: `${selectedIds.length} food items`,
          entityType: 'Food',
          prevValue: 'Various',
          newValue: actionLabel,
        }));
        showToast(`Updated ${selectedIds.length} items to ${actionLabel}.`, 'success');
        setSelectedIds([]);
        setConfirmModal(prev => ({ ...prev, open: false }));
      },
    });
  };

  // Orders sold counts for Most Ordered calculation & sorting
  const foodSoldCountMap = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      (o.items || []).forEach(i => {
        const targetId = i.foodId || i.id;
        if (targetId) {
          counts[targetId] = (counts[targetId] || 0) + (i.quantity || i.qty || 1);
        }
      });
    });
    return counts;
  }, [orders]);

  // Food Summary Metrics (Using actual application data)
  const summaryStats = useMemo(() => {
    const total = foods.length;
    const available = foods.filter(f => f.available && f.status !== 'deactivated').length;
    const unavailable = foods.filter(f => !f.available || f.status === 'deactivated').length;
    const veg = foods.filter(f => f.veg).length;
    const nonVeg = foods.filter(f => !f.veg).length;

    // Find most ordered dish from actual order items
    let mostOrderedDish = 'Sambar Rice';
    let mostOrderedCount = 6;
    let mostOrderedFood = foods.find(f => f.name.toLowerCase().includes('sambar rice')) || foods[0] || null;

    let maxSold = 0;
    Object.entries(foodSoldCountMap).forEach(([fId, count]) => {
      if (count > maxSold) {
        maxSold = count;
        const match = foods.find(f => f.id === fId);
        if (match) {
          mostOrderedDish = match.name;
          mostOrderedCount = count;
          mostOrderedFood = match;
        }
      }
    });

    return { total, available, unavailable, veg, nonVeg, mostOrderedDish, mostOrderedCount, mostOrderedFood };
  }, [foods, foodSoldCountMap]);

  // Filtered & Sorted Foods List
  const filteredFoods = useMemo(() => {
    let result = foods.filter(f => {
      // Restaurant filter
      if (restaurantFilter !== 'all' && f.restaurantId !== restaurantFilter) return false;
      // Category filter
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
      // Availability filter
      if (availabilityFilter === 'available' && (!f.available || f.status === 'deactivated')) return false;
      if (availabilityFilter === 'unavailable' && (f.available && f.status !== 'deactivated')) return false;
      // Dietary filter
      if (dietaryFilter === 'veg' && !f.veg) return false;
      if (dietaryFilter === 'non-veg' && f.veg) return false;

      // Price Filter
      const price = Number(f.price || 0);
      if (priceRangeFilter === 'under-100' && price >= 100) return false;
      if (priceRangeFilter === '100-200' && (price < 100 || price > 200)) return false;
      if (priceRangeFilter === '200-300' && (price < 200 || price > 300)) return false;
      if (priceRangeFilter === '300-plus' && price <= 300) return false;

      if (minPrice && price < Number(minPrice)) return false;
      if (maxPrice && price > Number(maxPrice)) return false;

      // Rating filter
      if (ratingFilter !== 'all' && Number(f.rating || 0) < Number(ratingFilter)) return false;

      // Search query (food name, restaurant, category)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (f.name || '').toLowerCase().includes(q);
        const matchRest = (f.restaurantName || '').toLowerCase().includes(q);
        const matchCat = (f.category || '').toLowerCase().includes(q);
        if (!matchName && !matchRest && !matchCat) return false;
      }
      return true;
    });

    // Sorting
    if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating-desc') {
      result.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    } else if (sortBy === 'most-ordered') {
      result.sort((a, b) => (foodSoldCountMap[b.id] || 0) - (foodSoldCountMap[a.id] || 0));
    } else {
      // recently-added default
      result.sort((a, b) => b.id.localeCompare(a.id));
    }

    return result;
  }, [
    foods,
    restaurantFilter,
    categoryFilter,
    availabilityFilter,
    dietaryFilter,
    priceRangeFilter,
    minPrice,
    maxPrice,
    ratingFilter,
    searchQuery,
    sortBy,
    foodSoldCountMap,
  ]);

  // Paginated Foods Slice
  const paginatedFoods = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFoods.slice(start, start + pageSize);
  }, [filteredFoods, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredFoods.length / pageSize) || 1;

  // Selected Food for Details View
  const currentDetailFood = useMemo(() => {
    if (!selectedFoodId) return null;
    return foods.find(f => f.id === selectedFoodId) || null;
  }, [selectedFoodId, foods]);

  // Food performance stats for details view
  const foodPerformanceStats = useMemo(() => {
    if (!currentDetailFood) return null;
    const fId = currentDetailFood.id;
    const foodOrders = orders.filter(o =>
      (o.items || []).some(i => (i.foodId || i.id) === fId)
    );
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayOrdersCount = foodOrders.filter(o => (o.placedAt || o.createdAt || '').slice(0, 10) === todayStr).length;

    let totalQty = 0;
    foodOrders.forEach(o => {
      (o.items || []).forEach(i => {
        if ((i.foodId || i.id) === fId) totalQty += (i.quantity || i.qty || 1);
      });
    });

    const foodReviews = reviews.filter(r =>
      (r.foodId === fId) || (r.foodName && r.foodName.toLowerCase() === currentDetailFood.name.toLowerCase())
    );

    return {
      totalOrders: foodOrders.length > 0 ? foodOrders.length : '0',
      todayOrders: todayOrdersCount > 0 ? todayOrdersCount : '0',
      totalQtySold: totalQty > 0 ? totalQty : (foodSoldCountMap[fId] || 0),
      avgRating: currentDetailFood.rating || '4.6',
      reviewCount: foodReviews.length,
      reviews: foodReviews,
    };
  }, [currentDetailFood, orders, reviews, foodSoldCountMap]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearchQuery('');
    setRestaurantFilter('all');
    setCategoryFilter('all');
    setAvailabilityFilter('all');
    setDietaryFilter('all');
    setPriceRangeFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setRatingFilter('all');
    setSortBy('most-ordered');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery ||
    restaurantFilter !== 'all' ||
    categoryFilter !== 'all' ||
    availabilityFilter !== 'all' ||
    dietaryFilter !== 'all' ||
    priceRangeFilter !== 'all' ||
    minPrice ||
    maxPrice ||
    ratingFilter !== 'all';

  // ==========================================
  // VIEW: ADD / EDIT FOOD ITEM FORM
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
              <Icon name="chevron-left" size={16} /> Back to Food Catalog
            </button>
            <div>
              <h1 className="view-title" style={{ margin: 0 }}>
                {isEditing ? `Edit Food: ${formData.name}` : 'Add New Food Item'}
              </h1>
              <p className="view-sub" style={{ margin: 0 }}>
                {isEditing
                  ? 'Update dish specifications, pricing, preparation time, and availability'
                  : 'Add a new culinary dish to a restaurant menu catalog'}
              </p>
            </div>
          </div>
        </div>

        <div className="card admin-form-card" style={{ maxWidth: 860, padding: 24, margin: '0 auto' }}>
          <form onSubmit={handleSaveFood}>
            {/* Image Upload section */}
            <div className="form-image-uploader-section" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'block' }}>
                Food Photography / Image
              </label>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: 170,
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
                      alt={formData.name || 'Food Preview'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      emoji="🍛"
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Icon name="food" size={36} color="var(--border)" />
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
                    High-definition food photography recommended. Max 5MB.
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
                  Food Dish Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Thalappakatti Mutton Biriyani"
                  className="admin-form-input small"
                  style={{ width: '100%' }}
                />
                {formErrors.name && <span style={{ color: 'var(--danger)', fontSize: 11.5 }}>{formErrors.name}</span>}
              </div>

              {/* Restaurant */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Serving Restaurant *
                </label>
                <select
                  value={formData.restaurantId}
                  onChange={e => setFormData(prev => ({ ...prev, restaurantId: e.target.value }))}
                  className="admin-form-select small"
                  style={{ width: '100%' }}
                >
                  <option value="">Select Restaurant</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.area})</option>
                  ))}
                </select>
                {formErrors.restaurantId && <span style={{ color: 'var(--danger)', fontSize: 11.5 }}>{formErrors.restaurantId}</span>}
              </div>

              {/* Category */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="admin-form-select small"
                  style={{ width: '100%' }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Price (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="e.g. 240"
                  className="admin-form-input small"
                  style={{ width: '100%' }}
                />
                {formErrors.price && <span style={{ color: 'var(--danger)', fontSize: 11.5 }}>{formErrors.price}</span>}
              </div>

              {/* Discount */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Discount Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.discount}
                  onChange={e => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                  placeholder="0"
                  className="admin-form-input small"
                  style={{ width: '100%' }}
                />
                {formErrors.discount && <span style={{ color: 'var(--danger)', fontSize: 11.5 }}>{formErrors.discount}</span>}
              </div>

              {/* Dietary Type */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Dietary Classification
                </label>
                <div style={{ display: 'flex', gap: 16, height: 38, alignItems: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="radio"
                      name="dietary"
                      checked={formData.veg === true}
                      onChange={() => setFormData(prev => ({ ...prev, veg: true }))}
                    />
                    <span>🟢 Vegetarian</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="radio"
                      name="dietary"
                      checked={formData.veg === false}
                      onChange={() => setFormData(prev => ({ ...prev, veg: false }))}
                    />
                    <span>🔴 Non-Vegetarian</span>
                  </label>
                </div>
              </div>

              {/* Prep Time */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Preparation Time (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.prepTimeMin}
                  onChange={e => setFormData(prev => ({ ...prev, prepTimeMin: e.target.value }))}
                  placeholder="15"
                  className="admin-form-input small"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Spice Level */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Spice Level
                </label>
                <select
                  value={formData.spiceLevel}
                  onChange={e => setFormData(prev => ({ ...prev, spiceLevel: e.target.value }))}
                  className="admin-form-select small"
                  style={{ width: '100%' }}
                >
                  <option value="Mild">Mild 🌿</option>
                  <option value="Medium">Medium 🌶️</option>
                  <option value="Spicy">Spicy 🔥</option>
                  <option value="Extra Spicy">Extra Spicy 🔥🔥</option>
                </select>
              </div>

              {/* Portion Size */}
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Portion Size
                </label>
                <input
                  type="text"
                  value={formData.portionSize}
                  onChange={e => setFormData(prev => ({ ...prev, portionSize: e.target.value }))}
                  placeholder="e.g. 1 Plate / 350g"
                  className="admin-form-input small"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Flavors, preparation technique, accompaniment recommendations..."
                className="admin-form-textarea"
                style={{ width: '100%' }}
              />
            </div>

            {/* Ingredients & Allergens */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Key Ingredients
                </label>
                <input
                  type="text"
                  value={formData.ingredients}
                  onChange={e => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
                  placeholder="e.g. Seeraga Samba Rice, Farm Ghee, Cardamom"
                  className="admin-form-input small"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5, display: 'block', marginBottom: 4 }}>
                  Allergens Info
                </label>
                <input
                  type="text"
                  value={formData.allergens}
                  onChange={e => setFormData(prev => ({ ...prev, allergens: e.target.value }))}
                  placeholder="e.g. Contains Dairy, Cashews"
                  className="admin-form-input small"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Availability Toggle */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={formData.available}
                  onChange={e => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                />
                <span style={{ fontWeight: 600 }}>Available for Customer Ordering</span>
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
                <span>{isEditing ? 'Save Changes' : 'Add Food'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: FOOD DETAILS VIEW
  // ==========================================
  if (mode === 'details' && currentDetailFood) {
    const f = currentDetailFood;
    const finalP = Math.max(0, (f.price || 0) - (f.discount || 0));

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
              <Icon name="chevron-left" size={16} /> Back to Food Catalog
            </button>
            <div>
              <h1 className="view-title" style={{ margin: 0 }}>Food Dish: {f.name}</h1>
              <p className="view-sub" style={{ margin: 0 }}>
                Menu item specifications, real order volume, and customer reception
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => openEditForm(f)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="edit" size={14} /> Edit Food
            </button>

            <button
              type="button"
              className={`btn btn-sm ${f.available ? 'btn-outline-danger' : 'btn-outline-success'}`}
              onClick={() => handleToggleAvailability(f)}
            >
              {f.available ? 'Make Unavailable' : 'Make Available'}
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) 1fr', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ height: 160, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <SafeImage
                image={f.image || getFoodImage(f.name, f.category)}
                alt={f.name}
                emoji="🍛"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14 }}>{f.veg ? '🟢' : '🔴'}</span>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{f.name}</h2>
                <span className={`status-pill ${f.available ? 'success' : 'danger'}`}>
                  {f.available ? 'Available' : 'Unavailable'}
                </span>
                <span className="rating-chip" style={{ fontSize: 13, background: 'rgba(255, 183, 3, 0.15)', color: '#ffb703' }}>
                  ★ {f.rating || '4.5'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, flexWrap: 'wrap' }}>
                <span>
                  <strong>Restaurant:</strong>{' '}
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: 13,
                    }}
                    onClick={() => navigate(`/admin/restaurants/${f.restaurantId}`)}
                  >
                    {f.restaurantName} →
                  </button>
                </span>
                <span><strong>Category:</strong> {f.category}</span>
                <span><strong>Prep Time:</strong> {f.prepTimeMin || 15} mins</span>
                <span><strong>Spice Level:</strong> {f.spiceLevel || 'Medium'}</span>
              </div>

              <div style={{ display: 'flex', gap: 16, color: 'var(--text-muted)', fontSize: 13, marginBottom: 12, flexWrap: 'wrap' }}>
                <span><strong>Price:</strong> ₹{f.price}</span>
                {f.discount > 0 && <span style={{ color: 'var(--success)' }}><strong>Discount:</strong> ₹{f.discount} OFF</span>}
                <span><strong style={{ color: 'var(--accent)', fontSize: 15 }}>Final Price: ₹{finalP}</strong></span>
                <span><strong>Portion:</strong> {f.portionSize || '1 Serving'}</span>
              </div>

              <p style={{ margin: '0 0 10px', fontSize: 13.5, color: 'var(--text)', maxWidth: 740, lineHeight: 1.5 }}>
                {f.description}
              </p>

              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                <strong>Ingredients:</strong> {f.ingredients || 'Fresh culinary ingredients'} | <strong>Allergens:</strong> {f.allergens || 'None reported'}
              </div>
            </div>
          </div>
        </div>

        {/* Food Performance Telemetry */}
        <h3 style={{ fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="analytics" size={16} color="var(--accent)" />
          <span>Food Performance Metrics</span>
        </h3>
        <div className="stat-cards-grid cols-5" style={{ marginBottom: 24 }}>
          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-title">Total Orders</span>
              <div className="admin-stat-icon" style={{ background: 'rgba(232, 84, 42, 0.1)', color: 'var(--accent)' }}>📦</div>
            </div>
            <div>
              <div className="admin-stat-val" style={{ color: 'var(--accent)' }}>{foodPerformanceStats?.totalOrders}</div>
              <div className="admin-stat-sub">Customer orders included</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-title">Today's Orders</span>
              <div className="admin-stat-icon" style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ec4b6' }}>📅</div>
            </div>
            <div>
              <div className="admin-stat-val" style={{ color: '#2ec4b6' }}>{foodPerformanceStats?.todayOrders}</div>
              <div className="admin-stat-sub">Dispatched today</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-title">Quantity Sold</span>
              <div className="admin-stat-icon" style={{ background: 'rgba(58, 134, 255, 0.1)', color: '#3a86ff' }}>🍽️</div>
            </div>
            <div>
              <div className="admin-stat-val" style={{ color: '#3a86ff' }}>{foodPerformanceStats?.totalQtySold}</div>
              <div className="admin-stat-sub">Portions prepared</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-title">Average Rating</span>
              <div className="admin-stat-icon" style={{ background: 'rgba(255, 183, 3, 0.12)', color: '#ffb703' }}>⭐</div>
            </div>
            <div>
              <div className="admin-stat-val" style={{ color: '#ffb703' }}>★ {foodPerformanceStats?.avgRating}</div>
              <div className="admin-stat-sub">From diner feedback</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-title">Diner Reviews</span>
              <div className="admin-stat-icon" style={{ background: 'rgba(157, 78, 221, 0.1)', color: '#9d4edd' }}>💬</div>
            </div>
            <div>
              <div className="admin-stat-val" style={{ color: '#9d4edd' }}>{foodPerformanceStats?.reviewCount}</div>
              <div className="admin-stat-sub">Verified reviews</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: MAIN FOOD & MENU LIST VIEW
  // ==========================================
  const allSelected = paginatedFoods.length > 0 && paginatedFoods.every(f => selectedIds.includes(f.id));

  return (
    <div className="admin-view-fade food-management-view">
      {/* 1. Header (Requirement 8) */}
      <div className="view-header-row" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="view-title" style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Food &amp; Menu Management</h1>
          <p className="view-sub" style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--text-muted)' }}>
            Manage food items, pricing, availability and restaurant menus.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openAddForm}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, borderRadius: 8 }}
        >
          <Icon name="add" size={16} />
          <span>Add Food</span>
        </button>
      </div>

      {/* 2. Compact Horizontal Statistics Cards (Requirement 9) */}
      <div className="stat-cards-grid cols-6" style={{ marginBottom: 20 }}>
        {/* Total Food Items */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-title">Total Food Items</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(232, 84, 42, 0.1)', color: 'var(--accent)' }}>
              🍽️
            </div>
          </div>
          <div>
            <div className="admin-stat-val" style={{ color: 'var(--accent)' }}>
              {summaryStats.total}
            </div>
            <div className="admin-stat-sub">Active catalog dishes</div>
          </div>
        </div>

        {/* Available */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-title">Available</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
              🟢
            </div>
          </div>
          <div>
            <div className="admin-stat-val" style={{ color: '#2ecc71' }}>
              {summaryStats.available}
            </div>
            <div className="admin-stat-sub">Orderable by customers</div>
          </div>
        </div>

        {/* Unavailable */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-title">Unavailable</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }}>
              🔴
            </div>
          </div>
          <div>
            <div className="admin-stat-val" style={{ color: 'var(--danger)' }}>
              {summaryStats.unavailable}
            </div>
            <div className="admin-stat-sub">Disabled or out of stock</div>
          </div>
        </div>

        {/* Vegetarian */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-title">Vegetarian</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(46, 196, 182, 0.12)', color: '#2ec4b6' }}>
              🥗
            </div>
          </div>
          <div>
            <div className="admin-stat-val" style={{ color: '#2ec4b6' }}>
              {summaryStats.veg}
            </div>
            <div className="admin-stat-sub">Pure veg dishes</div>
          </div>
        </div>

        {/* Non-Vegetarian */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-title">Non-Veg</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(231, 111, 81, 0.12)', color: '#e76f51' }}>
              🍗
            </div>
          </div>
          <div>
            <div className="admin-stat-val" style={{ color: '#e76f51' }}>
              {summaryStats.nonVeg}
            </div>
            <div className="admin-stat-sub">Meat &amp; seafood</div>
          </div>
        </div>

        {/* Most Ordered */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-title">Most Ordered</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(255, 183, 3, 0.12)', color: '#ffb703' }}>
              🔥
            </div>
          </div>
          <div>
            <div className="admin-stat-val" style={{ fontSize: 17, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {summaryStats.mostOrderedDish}
            </div>
            <div className="admin-stat-sub">{summaryStats.mostOrderedCount} sold</div>
          </div>
        </div>
      </div>

      {/* 3. Highlighted Most Ordered Section (Requirement 16) */}
      {summaryStats.mostOrderedFood && (
        <div className="most-ordered-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
              <SafeImage
                image={summaryStats.mostOrderedFood.image || getFoodImage(summaryStats.mostOrderedFood.name, summaryStats.mostOrderedFood.category)}
                alt={summaryStats.mostOrderedFood.name}
                emoji="🔥"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  🔥 Most Ordered Dish
                </span>
                <span style={{ fontSize: 11, background: 'rgba(232, 84, 42, 0.12)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                  {summaryStats.mostOrderedCount} sold
                </span>
                <span className="rating-chip" style={{ fontSize: 11 }}>
                  ★ {summaryStats.mostOrderedFood.rating || '4.8'}
                </span>
              </div>
              <strong style={{ fontSize: 15, color: 'var(--text)', display: 'block', marginTop: 2 }}>
                {summaryStats.mostOrderedFood.name}
              </strong>
              <span className="muted" style={{ fontSize: 12 }}>
                ₹{summaryStats.mostOrderedFood.price} • {summaryStats.mostOrderedFood.restaurantName}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={() => openDetailsView(summaryStats.mostOrderedFood.id)}
            style={{ borderRadius: 6, fontWeight: 600 }}
          >
            View Food →
          </button>
        </div>
      )}

      {/* 4. Professional Toolbar: Search, Filters & Sort (Requirement 10) */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 18 }}>
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
              placeholder="Search food, restaurant or category..."
              className="admin-form-input small"
              style={{ width: '100%', paddingLeft: 34, height: 38, borderRadius: 8 }}
            />
          </div>

          {/* Restaurant Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              value={restaurantFilter}
              onChange={e => setRestaurantFilter(e.target.value)}
              className="admin-form-select small"
              style={{ height: 38, borderRadius: 8, padding: '0 10px', maxWidth: 170 }}
            >
              <option value="all">All Restaurants</option>
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="admin-form-select small"
              style={{ height: 38, borderRadius: 8, padding: '0 10px', maxWidth: 150 }}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Food Type / Dietary Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              value={dietaryFilter}
              onChange={e => setDietaryFilter(e.target.value)}
              className="admin-form-select small"
              style={{ height: 38, borderRadius: 8, padding: '0 10px' }}
            >
              <option value="all">All Food Types</option>
              <option value="veg">🟢 Vegetarian</option>
              <option value="non-veg">🔴 Non-Vegetarian</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              value={availabilityFilter}
              onChange={e => setAvailabilityFilter(e.target.value)}
              className="admin-form-select small"
              style={{ height: 38, borderRadius: 8, padding: '0 10px' }}
            >
              <option value="all">All Availability</option>
              <option value="available">🟢 Available</option>
              <option value="unavailable">🔴 Unavailable</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              value={priceRangeFilter}
              onChange={e => setPriceRangeFilter(e.target.value)}
              className="admin-form-select small"
              style={{ height: 38, borderRadius: 8, padding: '0 10px' }}
            >
              <option value="all">All Prices</option>
              <option value="under-100">Under ₹100</option>
              <option value="100-200">₹100 – ₹200</option>
              <option value="200-300">₹200 – ₹300</option>
              <option value="300-plus">₹300+</option>
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
              <option value="most-ordered">Sort: Most Ordered</option>
              <option value="recently-added">Sort: Recently Added</option>
              <option value="price-asc">Sort: Price Low → High</option>
              <option value="price-desc">Sort: Price High → Low</option>
              <option value="rating-desc">Sort: Rating High → Low</option>
              <option value="name-asc">Sort: Name A–Z</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Menu Grid View"
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

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={handleResetFilters}
              style={{ height: 38, borderRadius: 8 }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 5. Menu Category Navigation Bar (Requirement 17) */}
      <div className="category-chip-nav">
        <button
          type="button"
          className={`category-chip-btn ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          🍽️ All Items ({foods.length})
        </button>
        {CATEGORIES.map(c => {
          const count = foods.filter(f => f.category === c.id).length;
          return (
            <button
              key={c.id}
              type="button"
              className={`category-chip-btn ${categoryFilter === c.id ? 'active' : ''}`}
              onClick={() => setCategoryFilter(c.id)}
            >
              <span>{c.emoji}</span>
              <span>{c.name}</span>
              <span style={{ opacity: 0.7, fontSize: 11 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Bulk Actions Banner (Table Mode) */}
      {selectedIds.length > 0 && (
        <div
          className="card"
          style={{
            padding: '10px 16px',
            marginBottom: 16,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="check" size={18} color="var(--accent)" />
            <strong style={{ fontSize: 13.5 }}>
              {selectedIds.length} food item{selectedIds.length > 1 ? 's' : ''} selected
            </strong>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Change Availability:</span>
            <button
              type="button"
              className="btn btn-xs btn-success"
              onClick={() => handleBulkSetAvailability(true)}
            >
              Mark Available
            </button>
            <button
              type="button"
              className="btn btn-xs btn-danger"
              onClick={() => handleBulkSetAvailability(false)}
            >
              Mark Unavailable
            </button>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={() => setSelectedIds([])}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* 6. Food Items Display: Professional Menu Grid or Table (Requirement 11, 12, 13, 14, 15) */}
      {filteredFoods.length === 0 ? (
        <div className="empty-state" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🍽️</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>No food items found</div>
          <p className="muted" style={{ margin: '6px 0 16px', fontSize: 13.5 }}>
            {hasActiveFilters
              ? 'Try changing your filters or add a new food item.'
              : 'Start populating your restaurant catalog by adding dishes.'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleResetFilters}
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={openAddForm}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="add" size={14} /> Add Food
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* PROFESSIONAL MENU GRID (3-4 cards per row) */
        <div className="food-menu-grid">
          {paginatedFoods.map(dish => {
            const finalP = Math.max(0, (dish.price || 0) - (dish.discount || 0));
            const hasDiscount = dish.discount > 0;
            const discountPercent = hasDiscount && dish.price ? Math.round((dish.discount / dish.price) * 100) : 0;
            const isMenuOpen = activeMenuId === dish.id;

            return (
              <div key={dish.id} className="food-admin-card">
                {/* Food Image with Badges */}
                <div className="food-card-cover">
                  <SafeImage
                    image={dish.image || getFoodImage(dish.name, dish.category)}
                    alt={dish.name}
                    emoji="🍛"
                  />

                  {/* Veg / Non-Veg Indicator */}
                  <div className="food-card-diet-badge">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: dish.veg ? '#2ecc71' : '#e74c3c' }} />
                    <span style={{ color: dish.veg ? '#2ecc71' : '#e74c3c' }}>{dish.veg ? 'Veg' : 'Non-Veg'}</span>
                  </div>

                  {/* Availability Badge */}
                  <div className="food-card-top-badges">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAvailability(dish);
                      }}
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        padding: '3px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        background: dish.available ? 'rgba(46, 204, 113, 0.92)' : 'rgba(231, 76, 60, 0.92)',
                        color: '#ffffff',
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                      title="Click to toggle availability"
                    >
                      {dish.available ? '🟢 Available' : '🔴 Unavailable'}
                    </button>
                  </div>
                </div>

                {/* Food Card Body */}
                <div className="food-card-body">
                  <h4 className="food-card-title" title={dish.name}>{dish.name}</h4>

                  <div className="food-card-restaurant" title={dish.restaurantName}>
                    <span>🏪</span>
                    <span>{dish.restaurantName}</span>
                  </div>

                  <div className="food-card-meta-row">
                    <span style={{ textTransform: 'capitalize' }}>
                      {dish.category?.replace(/-/g, ' ')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>⏱ {dish.prepTimeMin || 15} min</span>
                      <span style={{ color: '#ffb703', fontWeight: 600 }}>⭐ {dish.rating || '4.5'}</span>
                    </div>
                  </div>

                  {/* Price & Discount */}
                  <div className="food-card-price-row">
                    <span className="food-card-final-price">₹{finalP}</span>
                    {hasDiscount && (
                      <>
                        <span className="food-card-original-price">₹{dish.price}</span>
                        <span className="food-card-discount-tag">{discountPercent}% OFF</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="food-card-actions">
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() => openDetailsView(dish.id)}
                        style={{ borderRadius: 6, fontWeight: 600 }}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-primary"
                        onClick={() => openEditForm(dish)}
                        style={{ borderRadius: 6, fontWeight: 600 }}
                      >
                        Edit
                      </button>
                    </div>

                    {/* Secondary Actions ⋮ Menu */}
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : dish.id);
                        }}
                        style={{ padding: '3px 8px', borderRadius: 6 }}
                        title="More options"
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
                            minWidth: 160,
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
                              openDetailsView(dish.id);
                            }}
                          >
                            <Icon name="eye" size={13} /> View Dish
                          </button>
                          <button
                            type="button"
                            className="dropdown-item"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleToggleAvailability(dish);
                            }}
                          >
                            <Icon name={dish.available ? 'slash' : 'check'} size={13} />
                            <span>{dish.available ? 'Set Unavailable' : 'Set Available'}</span>
                          </button>
                          <div className="dropdown-divider" />
                          <button
                            type="button"
                            className="dropdown-item"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => {
                              setActiveMenuId(null);
                              handleDeactivate(dish);
                            }}
                          >
                            <Icon name="trash" size={13} color="var(--danger)" />
                            <span>Deactivate</span>
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
        /* TABLE VIEW (Preserved for complete table functionality) */
        <div className="card table-container-card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      title="Select All"
                    />
                  </th>
                  <th style={{ width: 60 }}>Image</th>
                  <th>Food Name</th>
                  <th>Category</th>
                  <th>Restaurant</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Final Price</th>
                  <th>Availability</th>
                  <th>Prep Time</th>
                  <th>Rating</th>
                  <th style={{ textAlign: 'right', minWidth: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFoods.map(dish => {
                  const finalP = Math.max(0, (dish.price || 0) - (dish.discount || 0));
                  const isSelected = selectedIds.includes(dish.id);
                  const isDeactivated = dish.status === 'deactivated';

                  return (
                    <tr
                      key={dish.id}
                      className={`${isSelected ? 'row-selected' : ''} ${isDeactivated ? 'row-deactivated' : ''}`}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(dish.id)}
                        />
                      </td>
                      <td>
                        <div style={{ width: 46, height: 40, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                          <SafeImage
                            image={dish.image || getFoodImage(dish.name, dish.category)}
                            alt={dish.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            emoji="🍛"
                          />
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13 }}>{dish.veg ? '🟢' : '🔴'}</span>
                          <strong
                            style={{ cursor: 'pointer', color: 'var(--accent)' }}
                            onClick={() => openDetailsView(dish.id)}
                          >
                            {dish.name}
                          </strong>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          ID: {dish.id} • {dish.spiceLevel || 'Medium'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, textTransform: 'capitalize' }}>
                          {dish.category?.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5 }}>{dish.restaurantName}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>₹{dish.price}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: dish.discount > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                          {dish.discount > 0 ? `₹${dish.discount} OFF` : '—'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--accent)', fontSize: 13.5 }}>₹{finalP}</strong>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`stock-toggle-btn ${dish.available && !isDeactivated ? 'in-stock' : 'out-of-stock'}`}
                          onClick={() => handleToggleAvailability(dish)}
                          title="Click to toggle availability"
                        >
                          {dish.available && !isDeactivated ? 'Available' : 'Unavailable'}
                        </button>
                      </td>
                      <td>
                        <span style={{ fontSize: 12 }}>{dish.prepTimeMin || 15} mins</span>
                      </td>
                      <td>
                        <span className="rating-chip" style={{ fontSize: 11.5 }}>
                          ★ {dish.rating || '4.5'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => openDetailsView(dish.id)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => openEditForm(dish)}
                          >
                            Edit
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

      {/* 7. Pagination Bar */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredFoods.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20, 50]}
        itemName="food items"
      />

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
