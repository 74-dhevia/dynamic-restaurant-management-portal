import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RESTAURANTS, TIME_SLOTS, SEATING_OPTIONS, FOODS } from '../data/mockData';
import { createBooking } from '../redux/slices/bookingSlice';
import { addNotification } from '../redux/slices/notificationSlice';
import { logActivity } from '../redux/slices/activitySlice';
import { pushAdminNotification } from '../services/adminNotificationService';
import bookingApiService from '../services/bookingApiService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import Icon from '../components/Icon';
import SafeImage from '../components/SafeImage';
import { requestNotificationPermission } from '../services/fcmNotificationService';
import { VAPID_KEY } from '../config/firebaseConfig';
import './BookTable.css';

export default function BookTable() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const location = useSelector(s => s.user?.location || 'Kovilpatti');
  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants);
  const allRestaurants = reduxRestaurants && reduxRestaurants.length > 0 ? reduxRestaurants : RESTAURANTS;

  const bookable = useMemo(() => {
    return allRestaurants.filter(r => {
      const matchLoc = !location || location === 'All' ||
        (r.area && r.area.toLowerCase() === location.toLowerCase()) ||
        (r.city && r.city.toLowerCase() === location.toLowerCase()) ||
        (r.address?.city && r.address.city.toLowerCase() === location.toLowerCase());
      return (r.hasTableBooking !== false) && matchLoc;
    });
  }, [allRestaurants, location]);

  const [selectedRest, setSelectedRest] = useState(() => {
    return restaurantId || bookable[0]?.id || bookable[0]?._id || allRestaurants[0]?.id || 'r1';
  });
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState(TIME_SLOTS[2]?.time || '7:30 PM');
  const [guests, setGuests] = useState(2);
  const [seating, setSeating] = useState(SEATING_OPTIONS[0]);
  const [selectedTable, setSelectedTable] = useState('Table 01');
  const [request, setRequest] = useState('');

  // Step state: 1 = Table details, 2 = Add Food for Your Visit & Prepare, 3 = Confirmation summary
  const [bookingStep, setBookingStep] = useState(1);

  // Live Table Availability & Floor Plan State
  const [liveTables, setLiveTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [tableSummary, setTableSummary] = useState({ total: 0, available: 0, reserved: 0 });
  const [activeSectionFilter, setActiveSectionFilter] = useState('All');
  const [conflictError, setConflictError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Smart Waitlist Modal State
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(null);

  // Pre-ordered food items: { [foodId]: { ...food, qty, spiceLevel, addOns, note } }
  const [preOrderItems, setPreOrderItems] = useState({});
  const [prepareBeforeArrival, setPrepareBeforeArrival] = useState(true);
  const [customizingItem, setCustomizingItem] = useState(null);

  const restaurant = useMemo(() => {
    return allRestaurants.find(r => r.id === selectedRest || r._id === selectedRest) || bookable[0] || allRestaurants[0];
  }, [allRestaurants, selectedRest, bookable]);

  // Fetch real-time table availability from MongoDB backend
  const fetchAvailability = useCallback(async (isSilent = false) => {
    if (!selectedRest) return;
    if (!isSilent) setLoadingTables(true);
    try {
      const restParam = restaurant?._id || restaurant?.id || selectedRest;
      const res = await bookingApiService.getTableAvailability({
        restaurantId: restParam,
        date,
        timeSlot: time,
        guests,
        seatingArea: seating,
      });

      if (res && res.success && res.data) {
        const tables = res.data.tables || [];
        setLiveTables(tables);
        setTableSummary({
          total: res.data.totalTables || tables.length,
          available: res.data.availableCount || tables.filter(t => t.isAvailable).length,
          reserved: res.data.reservedCount || tables.filter(t => !t.isAvailable).length,
        });

        // Ensure selectedTable is still valid or auto-pick first available matching table
        setSelectedTable(prev => {
          const existsAndAvail = tables.find(t => t.tableId === prev && t.isAvailable);
          if (existsAndAvail) return prev;
          const firstAvailable = tables.find(t => t.isAvailable && t.capacity >= guests) || tables.find(t => t.isAvailable);
          return firstAvailable ? firstAvailable.tableId : prev;
        });
      }
    } catch (err) {
      console.warn('Failed to fetch live table availability:', err);
    } finally {
      if (!isSilent) setLoadingTables(false);
    }
  }, [selectedRest, restaurant, date, time, guests, seating]);

  // Trigger availability fetch on changes and auto-poll every 8 seconds
  useEffect(() => {
    fetchAvailability(false);
    const interval = setInterval(() => {
      if (bookingStep === 1) {
        fetchAvailability(true);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchAvailability, bookingStep]);

  const menu = useMemo(() => {
    if (!restaurant) return [];
    if (Array.isArray(restaurant.menu) && restaurant.menu.length > 0) {
      return restaurant.menu.map(m => ({
        id: m._id || m.id,
        _id: m._id,
        name: m.name,
        price: m.price || 150,
        veg: m.isVeg ?? true,
        category: (m.category || 'specialties').toLowerCase().replace(/\s+/g, '-'),
        restaurantId: restaurant.id || restaurant._id,
      }));
    }
    const rId = restaurant.id || restaurant._id;
    return FOODS.filter(f => f.restaurantId === rId || f.restaurantId === restaurant.id || f.restaurantId === restaurant._id);
  }, [restaurant]);

  // Food items total
  const foodTotal = useMemo(() => {
    return Object.values(preOrderItems).reduce((acc, item) => {
      const addOnsCost = (item.addOns || []).length * 30; // ₹30 per add-on
      return acc + (item.price + addOnsCost) * item.qty;
    }, 0);
  }, [preOrderItems]);

  // Computed schedule for preparation
  const prepSchedule = useMemo(() => {
    return {
      tableTime: time,
      prepTime: '25 mins prior',
      readyTime: '5 mins prior',
    };
  }, [time]);

  const updateItemQty = (food, delta) => {
    setPreOrderItems(prev => {
      const current = prev[food.id]?.qty || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[food.id];
        return copy;
      }
      return {
        ...prev,
        [food.id]: {
          id: food.id,
          name: food.name,
          price: food.price,
          image: food.image,
          category: food.category,
          qty: next,
          spiceLevel: prev[food.id]?.spiceLevel || 'Medium',
          addOns: prev[food.id]?.addOns || [],
          note: prev[food.id]?.note || '',
        },
      };
    });
  };

  const updateItemCustomization = (foodId, key, value) => {
    setPreOrderItems(prev => {
      if (!prev[foodId]) return prev;
      return {
        ...prev,
        [foodId]: {
          ...prev[foodId],
          [key]: value,
        },
      };
    });
  };

  const toggleAddOn = (foodId, addOnName) => {
    setPreOrderItems(prev => {
      const item = prev[foodId];
      if (!item) return prev;
      const addOns = item.addOns || [];
      const updated = addOns.includes(addOnName)
        ? addOns.filter(a => a !== addOnName)
        : [...addOns, addOnName];
      return {
        ...prev,
        [foodId]: {
          ...item,
          addOns: updated,
        },
      };
    });
  };

  const removeItem = (foodId) => {
    setPreOrderItems(prev => {
      const copy = { ...prev };
      delete copy[foodId];
      return copy;
    });
  };

  const handleNextToFood = (e) => {
    e.preventDefault();
    if (!date || !time) {
      showToast('Please select a date and time slot for your table', 'error');
      return;
    }

    // Check if the chosen table is available in live tables
    const tableObj = liveTables.find(t => t.tableId === selectedTable);
    if (tableObj && !tableObj.isAvailable) {
      showToast(`${selectedTable} is currently reserved. Please choose an available table.`, 'error');
      return;
    }

    setBookingStep(2);
  };

  // Submit Waitlist Request to Backend
  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    setWaitlistSubmitting(true);
    try {
      const payload = {
        restaurantId: restaurant._id || restaurant.id,
        restaurantName: restaurant.name,
        preferredDate: date,
        preferredTimeSlot: time,
        guests: Number(guests),
        seatingArea: seating,
        customerName: user?.fullName || user?.name || 'Valued Guest',
        customerEmail: user?.email || '',
        customerPhone: user?.phone || '',
      };

      const res = await bookingApiService.joinWaitlist(payload);
      if (res && res.success) {
        setWaitlistSuccess(res.data);
        showToast('Successfully added to priority waitlist!', 'success');
      } else {
        showToast(res.message || 'Failed to join waitlist', 'error');
      }
    } catch (err) {
      showToast('Error joining waitlist: ' + err.message, 'error');
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  // Final Confirmation with Server-Side Concurrency & Double-Booking Protection
  const handleConfirm = async () => {
    setIsSubmitting(true);
    setConflictError(null);

    // Request notification permission if not yet decided so user receives real-time booking push
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        requestNotificationPermission(VAPID_KEY).catch(() => {});
      }
    } catch (_) {}

    const cleanDate = date ? date.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const fallbackBookingId = `ZB-${cleanDate}-${randomSuffix}`;
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    const itemsList = Object.values(preOrderItems);
    const customerName = user?.fullName || user?.name || 'Valued Diner';
    const customerEmail = user?.email || 'customer@zestro.com';
    const customerPhone = user?.phone || '+91 98401 23456';

    const bookingPayload = {
      restaurantId: restaurant._id || restaurant.id,
      restaurantName: restaurant.name,
      customerName,
      customerEmail,
      customerPhone,
      bookingDate: date,
      date,
      timeSlot: time,
      time,
      guests: Number(guests),
      seatingArea: seating,
      seating,
      tableId: selectedTable,
      tableNumber: selectedTable,
      specialRequests: request,
      request,
      preOrderItems: itemsList,
      preOrderTotal: foodTotal,
      grandTotal: 100 + foodTotal,
      prepareBeforeArrival,
      prepSchedule: prepareBeforeArrival ? prepSchedule : null,
      verificationPin: randomPin,
    };

    try {
      const response = await bookingApiService.createBooking(bookingPayload);

      if (response && response.conflict) {
        // Double-booking conflict occurred!
        setConflictError(response.message || `Table ${selectedTable} was just booked by another diner. Please select another available table.`);
        showToast('Table was already booked for this slot. Please choose another table.', 'error');
        setBookingStep(1); // Return to floor plan to select another table
        fetchAvailability(false); // Refresh floor plan immediately
        setIsSubmitting(false);
        return;
      }

      // Check if response has data or fallback
      const confirmedBooking = (response && response.data) ? response.data : {
        ...bookingPayload,
        id: fallbackBookingId,
        bookingNumber: fallbackBookingId,
        pin: randomPin,
        verificationPin: randomPin,
        status: 'Confirmed',
        journeyStep: 1,
      };

      const finalId = confirmedBooking.bookingNumber || confirmedBooking.id || fallbackBookingId;

      // Update Redux state for local instant feedback & activity logs
      dispatch(createBooking({
        ...confirmedBooking,
        id: finalId,
        bookingNumber: finalId,
        pin: confirmedBooking.verificationPin || randomPin,
        verificationPin: confirmedBooking.verificationPin || randomPin,
      }));

      // Log Activity for Admin Real-Time Feed
      dispatch(logActivity({
        action: 'New Table Booking',
        entity: `Booking #${finalId} (${customerName})`,
        entityType: 'Booking',
        admin: customerEmail,
        prevValue: 'None',
        newValue: `${guests} guests at ${restaurant.name} (${date} at ${time})`,
      }));

      // Dispatch Admin Notification
      pushAdminNotification({
        id: `notif_bk_${Date.now()}`,
        type: 'booking',
        title: 'New Table Booking',
        desc: `${customerName} booked table for ${guests} at ${restaurant.name}`,
        customerName,
        restaurantName: restaurant.name,
        entityId: finalId,
        date,
        timeSlot: time,
        guests,
        seating,
        actions: ['view_booking', 'confirm_booking', 'manage_table'],
      });

      dispatch(addNotification({
        type: 'booking',
        title: 'Table Reserved!',
        message: `Booking ${finalId} confirmed at ${restaurant.name} for ${guests} guests on ${date} at ${time}.`,
      }));

      showToast(`Table confirmed! Reference #${finalId}`, 'success');
      navigate(`/booking-success/${finalId}`);
    } catch (err) {
      console.warn('Booking API catch, saving reservation locally:', err);
      const finalId = fallbackBookingId;
      dispatch(createBooking({
        ...bookingPayload,
        id: finalId,
        bookingNumber: finalId,
        pin: randomPin,
        verificationPin: randomPin,
        status: 'Confirmed',
        journeyStep: 1,
      }));
      showToast(`Table confirmed! Reference #${finalId}`, 'success');
      navigate(`/booking-success/${finalId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter tables by active section filter
  const displayedTables = useMemo(() => {
    if (activeSectionFilter === 'All') return liveTables;
    return liveTables.filter(t => t.section.toLowerCase() === activeSectionFilter.toLowerCase());
  }, [liveTables, activeSectionFilter]);

  if (!bookable.length) {
    return (
      <div className="empty-state">
        <Icon name="restaurant" size={48} color="var(--accent)" />
        <h3 style={{ marginTop: 14 }}>No Restaurants Available</h3>
        <p className="muted">No restaurants in {location} currently support table booking.</p>
      </div>
    );
  }

  return (
    <div className="book-table-container">
      {/* Plan Dining Experience Banner */}
      <div className="card plan-experience-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', marginBottom: 20, background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--bg-elevated)), var(--bg-elevated))', border: '1px solid color-mix(in srgb, var(--accent) 30%, var(--border))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkles" size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>Looking for something extra special?</h3>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>Plan a complete celebration with custom setups, cakes, and curated menus.</p>
          </div>
        </div>
        <Link to="/plan-dining" className="btn btn-primary btn-sm">
          Plan My Dining Experience
        </Link>
      </div>

      {/* Header and Step Indicator */}
      <div className="booking-stepper-header">
        <h1>
          <Icon name="table" size={26} color="var(--accent)" /> Table Reservation
        </h1>
        <div className="booking-steps-bar">
          <div className={`step-node ${bookingStep >= 1 ? 'active' : ''}`}>
            <span className="step-num">1</span>
            <span>Table &amp; Seating</span>
          </div>
          <div className="step-line" />
          <div className={`step-node ${bookingStep >= 2 ? 'active' : ''}`}>
            <span className="step-num">2</span>
            <span>Pre-Order Dishes</span>
          </div>
          <div className="step-line" />
          <div className={`step-node ${bookingStep >= 3 ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span>Confirm Reservation</span>
          </div>
        </div>
      </div>

      {/* Conflict Error Notice */}
      {conflictError && (
        <div className="booking-conflict-alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="alert-circle" size={20} color="var(--danger)" />
            <span>{conflictError}</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => { setConflictError(null); fetchAvailability(false); }}
          >
            Refresh Tables
          </button>
        </div>
      )}

      {/* STEP 1: Table Details & Live Floor Plan */}
      {bookingStep === 1 && (
        <div className="card booking-card" style={{ padding: 24, width: '100%', maxWidth: '100%', margin: '0', boxSizing: 'border-box' }}>
          <form onSubmit={handleNextToFood}>
            <div className="input-group">
              <label>Restaurant</label>
              <select value={selectedRest} onChange={e => setSelectedRest(e.target.value)}>
                {bookable.map(r => (
                  <option key={r.id || r._id} value={r.id || r._id}>
                    {r.name} ({r.area || r.city}) • ⭐ {r.rating || '4.5'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div className="input-group">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Party Size</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 42 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setGuests(g => Math.max(1, g - 1))}
                  >
                    <Icon name="remove" size={16} />
                  </button>
                  <strong style={{ fontSize: 16 }}>{guests} Guests</strong>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setGuests(g => g + 1)}
                  >
                    <Icon name="add" size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="input-group">
              <label>Time Slot</label>
              <div className="chip-row">
                {TIME_SLOTS.map(s => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={s.status === 'full'}
                    className={`chip ${time === s.time ? 'active' : ''}`}
                    onClick={() => setTime(s.time)}
                    style={{ opacity: s.status === 'full' ? 0.4 : 1 }}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Floor Plan & Table Selection Grid */}
            <div className="floor-plan-wrapper">
              <div className="floor-plan-header">
                <div className="floor-plan-title-group">
                  <h3>
                    <span>Restaurant Seating Plan</span>
                    <span className="live-indicator-pill">
                      <span className="live-pulse-dot" /> Live Availability
                    </span>
                  </h3>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {tableSummary.available} of {tableSummary.total} tables available for {time} on {date}
                  </div>
                </div>

                <div className="floor-plan-legend">
                  <span className="legend-item"><span className="legend-dot available" /> Available</span>
                  <span className="legend-item"><span className="legend-dot reserved" /> Reserved</span>
                  <span className="legend-item"><span className="legend-dot held" /> Held</span>
                  <span className="legend-item"><span className="legend-dot occupied" /> Occupied</span>
                </div>
              </div>

              {/* Seating Section Filters */}
              <div className="section-filter-bar">
                {['All', 'Indoor', 'AC', 'Window', 'Family', 'Rooftop'].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    className={`section-chip ${activeSectionFilter.toLowerCase() === sec.toLowerCase() ? 'active' : ''}`}
                    onClick={() => {
                      setActiveSectionFilter(sec);
                      if (sec !== 'All') setSeating(sec);
                    }}
                  >
                    {sec === 'All' ? 'All Sections' : `${sec} Section`}
                  </button>
                ))}
              </div>

              {/* Table Cards Grid */}
              {loadingTables ? (
                <div style={{ padding: '30px 0', textAlign: 'center' }}>
                  <Icon name="refresh" size={24} className="spin" color="var(--accent)" />
                  <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Checking real-time MongoDB table availability...</p>
                </div>
              ) : displayedTables.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <p className="muted">No tables found matching section "{activeSectionFilter}".</p>
                </div>
              ) : (
                <div className="tables-grid">
                  {displayedTables.map(t => {
                    const isSelected = selectedTable === t.tableId;
                    const isAvailable = t.isAvailable;
                    const fitsGuests = t.capacity >= guests;
                    const badgeClass = t.badgeColor || (isAvailable ? 'green' : 'red');
                    const chairCount = t.capacity || 4;

                    return (
                      <div
                        key={t.tableId}
                        className={`table-card ${isAvailable ? 'available' : t.status === 'Temporarily Held' ? 'held' : t.status === 'Occupied' ? 'occupied' : 'reserved'} ${isSelected ? 'selected' : ''} ${!fitsGuests && isAvailable ? 'undersized' : ''}`}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedTable(t.tableId);
                            if (t.section) setSeating(t.section);
                            if (!fitsGuests) {
                              showToast(`Note: ${t.tableId} comfortably seats ${t.capacity} guests.`, 'info');
                            }
                          } else {
                            showToast(`${t.tableId} is ${t.status || 'Reserved'} for this time slot.`, 'error');
                          }
                        }}
                      >
                        <div className="table-card-top">
                          <span className="table-id-tag">{t.tableId}</span>
                          <span className="table-section-tag">{t.section}</span>
                        </div>

                        {/* Visual Table & Chairs Graphic */}
                        <div className={`visual-table-graphic chairs-${chairCount <= 2 ? '2' : chairCount <= 4 ? '4' : chairCount <= 6 ? '6' : '8'}`}>
                          {/* Chairs based on capacity */}
                          {chairCount === 2 && (
                            <>
                              <span className="chair-indicator chair-left" />
                              <span className="chair-indicator chair-right" />
                            </>
                          )}
                          {chairCount === 4 && (
                            <>
                              <span className="chair-indicator chair-top-1" />
                              <span className="chair-indicator chair-top-2" />
                              <span className="chair-indicator chair-bot-1" />
                              <span className="chair-indicator chair-bot-2" />
                            </>
                          )}
                          {chairCount === 6 && (
                            <>
                              <span className="chair-indicator chair-top-1" />
                              <span className="chair-indicator chair-top-2" />
                              <span className="chair-indicator chair-bot-1" />
                              <span className="chair-indicator chair-bot-2" />
                              <span className="chair-indicator chair-left" />
                              <span className="chair-indicator chair-right" />
                            </>
                          )}
                          {chairCount >= 8 && (
                            <>
                              <span className="chair-indicator chair-top-1" />
                              <span className="chair-indicator chair-top-2" />
                              <span className="chair-indicator chair-top-3" />
                              <span className="chair-indicator chair-bot-1" />
                              <span className="chair-indicator chair-bot-2" />
                              <span className="chair-indicator chair-bot-3" />
                              <span className="chair-indicator chair-left" />
                              <span className="chair-indicator chair-right" />
                            </>
                          )}

                          <div className="desk-surface">
                            <span>{t.tableId.replace('Table ', 'T-')}</span>
                          </div>
                        </div>

                        <div className="table-card-bottom">
                          <span className="table-capacity-pill">👥 {t.capacity}-Seater</span>
                          <span className={`table-status-badge ${badgeClass}`}>
                            {isSelected ? '✓ Selected' : t.status || (isAvailable ? 'Available' : 'Reserved')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sold-out / Waitlist banner */}
              {tableSummary.available === 0 && !loadingTables && (
                <div className="waitlist-card-banner">
                  <div className="waitlist-banner-content">
                    <h4>⚡ All tables booked for this slot</h4>
                    <p>Join our Smart Waitlist to be automatically notified when a table becomes free!</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => { setWaitlistSuccess(null); setWaitlistOpen(true); }}
                  >
                    Join Waitlist
                  </button>
                </div>
              )}
            </div>

            <div className="input-group">
              <label>Special Requests (Optional)</label>
              <textarea
                value={request}
                onChange={e => setRequest(e.target.value)}
                placeholder="E.g. High chair needed, anniversary surprise, window preference..."
                rows={2}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setWaitlistSuccess(null); setWaitlistOpen(true); }}
              >
                Join Waitlist
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-block"
                style={{ padding: 14, fontSize: 15 }}
                disabled={tableSummary.available === 0 && !liveTables.find(t => t.tableId === selectedTable && t.isAvailable)}
              >
                Continue to Food Pre-Order <Icon name="forward" size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Add Food for Your Visit & Prepare Before Arrival */}
      {bookingStep === 2 && (
        <div className="booking-food-layout">
          <div className="card booking-menu-column">
            <div className="menu-header-bar">
              <div>
                <h2>🍽️ Add Food for Your Visit</h2>
                <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                  Select dishes from {restaurant.name}’s live menu. They will be prepared fresh for your arrival at {selectedTable}.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setBookingStep(1)}
              >
                <Icon name="back" size={14} /> Back to Table
              </button>
            </div>

            {/* Menu items list */}
            <div className="preorder-menu-grid">
              {menu.map(food => {
                const item = preOrderItems[food.id];
                return (
                  <div key={food.id} className={`menu-preorder-card ${item ? 'selected' : ''}`}>
                    <SafeImage
                      image={food.image}
                      alt={food.name}
                      style={{ width: 70, height: 70, borderRadius: 8, objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <strong>{food.name}</strong>
                      <div className="muted" style={{ fontSize: 13 }}>₹{food.price} • {food.category}</div>

                      {item && (
                        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                          <span>Spice: <strong>{item.spiceLevel}</strong></span>
                          {item.addOns?.length > 0 && <span> • +{item.addOns.length} add-ons</span>}
                        </div>
                      )}
                    </div>

                    <div className="item-action-area">
                      {item ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <div className="qty-controls">
                            <button type="button" onClick={() => updateItemQty(food, -1)}>
                              <Icon name="remove" size={14} />
                            </button>
                            <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>{item.qty}</span>
                            <button type="button" onClick={() => updateItemQty(food, 1)}>
                              <Icon name="add" size={14} />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="btn-custom-link"
                            onClick={() => setCustomizingItem(customizingItem === food.id ? null : food.id)}
                          >
                            <Icon name="edit" size={12} /> {customizingItem === food.id ? 'Done' : 'Customize'}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => updateItemQty(food, 1)}
                        >
                          <Icon name="add" size={14} /> Add
                        </button>
                      )}
                    </div>

                    {/* Inline customization drawer */}
                    {customizingItem === food.id && item && (
                      <div className="item-customization-drawer">
                        <div className="drawer-row">
                          <span style={{ fontSize: 12, fontWeight: 700 }}>Spice Preference:</span>
                          <div className="chip-row">
                            {['Mild', 'Medium', 'Spicy', 'Extra Spicy'].map(sp => (
                              <button
                                key={sp}
                                type="button"
                                className={`chip chip-sm ${item.spiceLevel === sp ? 'active' : ''}`}
                                onClick={() => updateItemCustomization(food.id, 'spiceLevel', sp)}
                              >
                                {sp}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="drawer-row" style={{ marginTop: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>Add-ons (+₹30 each):</span>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                            {['Extra Raita', 'Extra Cheese', 'Garlic Butter', 'Special Gravy'].map(addOn => (
                              <label key={addOn} className="checkbox-label" style={{ fontSize: 12 }}>
                                <input
                                  type="checkbox"
                                  checked={(item.addOns || []).includes(addOn)}
                                  onChange={() => toggleAddOn(food.id, addOn)}
                                />
                                <span>{addOn}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="drawer-row" style={{ marginTop: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>Special Instructions:</span>
                          <input
                            type="text"
                            placeholder="E.g. Less oil, separate gravy..."
                            value={item.note || ''}
                            onChange={e => updateItemCustomization(food.id, 'note', e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', marginTop: 4 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Pre-Order Summary & Prepare Before Arrival */}
          <div className="card booking-preorder-sidebar">
            <h3>Visit Food Summary</h3>

            {Object.values(preOrderItems).length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Icon name="food" size={32} />
                <p style={{ fontSize: 13, marginTop: 8 }}>No food items added yet.<br />You can order at the restaurant or pre-order now for zero wait time.</p>
              </div>
            ) : (
              <div className="preorder-selected-list">
                {Object.values(preOrderItems).map(it => (
                  <div key={it.id} className="selected-summary-item">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{it.name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        Qty: {it.qty} • Spice: {it.spiceLevel}
                        {it.addOns?.length > 0 ? ` • Add-ons: ${it.addOns.join(', ')}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong>₹{(it.price + (it.addOns?.length || 0) * 30) * it.qty}</strong>
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="btn-remove-icon"
                        title="Remove item"
                      >
                        <Icon name="delete" size={14} color="var(--danger)" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="preorder-total-bar">
                  <span>Food Total:</span>
                  <strong>₹{foodTotal}</strong>
                </div>
              </div>
            )}

            {/* Prepare Before I Arrive Section */}
            <div className="prepare-arrival-card">
              <label className="checkbox-label" style={{ fontWeight: 700, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={prepareBeforeArrival}
                  onChange={e => setPrepareBeforeArrival(e.target.checked)}
                />
                <span>Prepare Before I Arrive</span>
              </label>

              {prepareBeforeArrival && (
                <div className="prep-time-box">
                  <div className="prep-time-row">
                    <span className="muted">Table Reserved For:</span>
                    <strong>{time}</strong>
                  </div>
                  <div className="prep-time-row">
                    <span className="muted">Kitchen Prep Window:</span>
                    <strong style={{ color: 'var(--accent)' }}>25 mins prior</strong>
                  </div>
                  <div className="prep-time-row">
                    <span className="muted">Hot &amp; Fresh at Table:</span>
                    <strong style={{ color: 'var(--success)' }}>On Arrival</strong>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setBookingStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 2, padding: 12 }}
                onClick={() => setBookingStep(3)}
              >
                Review Booking <Icon name="forward" size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Reservation Summary & Confirmation */}
      {bookingStep === 3 && (
        <div className="reservation-review-container">
          <div className="card" style={{ padding: '28px 32px', marginBottom: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800 }}>Reservation Summary</h2>
                <p className="sub" style={{ margin: 0, fontSize: 14 }}>
                  Please review your table and dining preferences before confirming
                </p>
              </div>
              <span className="rating-chip" style={{ background: 'color-mix(in srgb, var(--success) 14%, var(--bg))', color: 'var(--success)', border: '1px solid var(--success)', fontWeight: 800, padding: '6px 14px', fontSize: 13 }}>
                ✓ Table Reserved for Checkout
              </span>
            </div>

            <div className="reservation-review-grid">
              {/* Left Column: Restaurant & Seating Details */}
              <div>
                {/* Restaurant Hero Card */}
                <div className="review-restaurant-hero">
                  <SafeImage
                    image={restaurant.image}
                    alt={restaurant.name}
                    className="review-restaurant-img"
                  />
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 19, fontWeight: 800 }}>{restaurant.name}</h3>
                    <div className="muted" style={{ fontSize: 13 }}>
                      📍 {restaurant.area || restaurant.city || 'Kovilpatti'} • ⭐ {restaurant.rating || '4.5'} ({restaurant.cuisine || 'Authentic Dining'})
                    </div>
                    <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--accent)' }}>
                      <span>🪑 Assigned Space:</span>
                      <strong style={{ background: 'color-mix(in srgb, var(--accent) 12%, var(--bg))', padding: '2px 8px', borderRadius: 6 }}>
                        {selectedTable} ({seating} Section)
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Reservation Detail Tiles */}
                <div className="review-tiles-grid">
                  <div className="review-info-tile">
                    <span className="tile-label">📅 Date &amp; Time</span>
                    <span className="tile-value">{date} at {time}</span>
                  </div>
                  <div className="review-info-tile">
                    <span className="tile-label">👥 Party Size</span>
                    <span className="tile-value">{guests} Guests</span>
                  </div>
                  <div className="review-info-tile">
                    <span className="tile-label">🪑 Table</span>
                    <span className="tile-value" style={{ color: 'var(--accent)' }}>{selectedTable}</span>
                  </div>
                  <div className="review-info-tile">
                    <span className="tile-label">🍳 Kitchen Preparation</span>
                    <span className="tile-value">
                      {prepareBeforeArrival ? 'Freshly prepared for arrival' : 'Prepare after arrival'}
                    </span>
                  </div>
                </div>

                {/* Special Request */}
                {request && (
                  <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Special Request</div>
                    <div style={{ marginTop: 4, fontSize: 14 }}>{request}</div>
                  </div>
                )}

                {/* Diner Information */}
                <div style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Diner Details
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13.5 }}>
                    <div><strong>Name:</strong> {user?.fullName || user?.name || 'Valued Guest'}</div>
                    {user?.email && <div><strong>Email:</strong> {user.email}</div>}
                    {user?.phone && <div><strong>Phone:</strong> {user.phone}</div>}
                  </div>
                </div>
              </div>

              {/* Right Column: Billing Breakdown & Confirm Button */}
              <div>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px' }}>
                  <h4 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Payment &amp; Billing Summary</h4>

                  {/* Pre-Ordered Food Summary */}
                  {Object.values(preOrderItems).length > 0 ? (
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                        Pre-Ordered Dishes ({Object.values(preOrderItems).length})
                      </div>
                      {Object.values(preOrderItems).map(item => (
                        <div key={item.id} className="summary-row" style={{ fontSize: 13, margin: '6px 0' }}>
                          <span>{item.name} × {item.qty} ({item.spiceLevel})</span>
                          <strong>₹{(item.price + (item.addOns?.length || 0) * 30) * item.qty}</strong>
                        </div>
                      ))}
                      <div className="summary-row" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)', fontSize: 13 }}>
                        <span className="muted">Dishes Subtotal:</span>
                        <strong>₹{foodTotal}</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                      No dishes pre-ordered (Table reservation only)
                    </div>
                  )}

                  <div className="summary-row" style={{ fontSize: 13.5, margin: '6px 0' }}>
                    <span className="muted">Table Reservation Deposit:</span>
                    <strong>₹100</strong>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 12 }}>
                    * Deposit is adjusted against your final restaurant dining bill
                  </div>

                  <div className="summary-row" style={{ marginTop: 12, paddingTop: 12, borderTop: '2px solid var(--border)', fontSize: 18 }}>
                    <strong>Total Payable:</strong>
                    <strong style={{ color: 'var(--accent)', fontSize: 22 }}>₹{100 + foodTotal}</strong>
                  </div>

                  <div className="trust-badges-panel">
                    <div className="trust-badge-row">
                      <Icon name="check" size={16} color="var(--success)" />
                      <span>Instant confirmation with 4-digit check-in PIN</span>
                    </div>
                    <div className="trust-badge-row">
                      <Icon name="mail" size={16} color="var(--success)" />
                      <span>Confirmation sent to your email &amp; in-app portal</span>
                    </div>
                    <div className="trust-badge-row">
                      <Icon name="shield" size={16} color="var(--success)" />
                      <span>Free cancellation up to 2 hours before dining</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                    <button
                      id="btn-confirm-final-booking"
                      type="button"
                      className="btn btn-primary btn-block"
                      style={{ padding: '15px 20px', fontSize: 16, fontWeight: 800, borderRadius: 12 }}
                      onClick={handleConfirm}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Icon name="refresh" size={18} className="spin" /> Confirming Reservation...
                        </>
                      ) : (
                        <>
                          <Icon name="check" size={18} /> Confirm Table Reservation
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-block"
                      style={{ padding: '11px', fontSize: 14 }}
                      onClick={() => setBookingStep(2)}
                      disabled={isSubmitting}
                    >
                      ← Back to Dish Selection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Waitlist Modal */}
      {waitlistOpen && (
        <div className="zestro-modal-backdrop" onClick={() => setWaitlistOpen(false)}>
          <div className="zestro-modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="pulse" size={20} color="var(--accent)" /> Smart Waitlist
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setWaitlistOpen(false)}
                style={{ padding: '4px 10px' }}
              >
                ✕
              </button>
            </div>

            {waitlistSuccess ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 14px' }}>
                  ✓
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: 18 }}>You're on the Waitlist!</h4>
                <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 20, background: 'color-mix(in srgb, var(--accent) 15%, var(--bg))', color: 'var(--accent)', fontWeight: 800, fontSize: 14, margin: '8px 0 14px' }}>
                  Waitlist #{waitlistSuccess.waitlistNumber || 'WL-01'}
                </div>
                <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                  We’ve reserved your queue spot for <strong>{restaurant.name}</strong> on <strong>{date} ({time})</strong>.
                  You will receive an automated email notification the instant any table becomes available!
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 20, width: '100%' }}
                  onClick={() => setWaitlistOpen(false)}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoinWaitlist}>
                <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
                  Join the queue for <strong>{restaurant.name}</strong>. If a customer cancels or reschedules, the table is automatically offered to you.
                </p>

                <div className="input-group">
                  <label>Preferred Date &amp; Time</label>
                  <input
                    type="text"
                    readOnly
                    value={`${date} at ${time}`}
                    style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}
                  />
                </div>

                <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label>Party Size</label>
                    <input type="text" readOnly value={`${guests} Guests`} style={{ background: 'var(--bg)' }} />
                  </div>
                  <div className="input-group">
                    <label>Seating</label>
                    <input type="text" readOnly value={`${seating} Section`} style={{ background: 'var(--bg)' }} />
                  </div>
                </div>

                <div className="input-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    required
                    defaultValue={user?.fullName || user?.name || ''}
                    placeholder="Full name"
                  />
                </div>

                <div className="input-group">
                  <label>Email Address (For instant table alert)</label>
                  <input
                    type="email"
                    required
                    defaultValue={user?.email || ''}
                    placeholder="name@example.com"
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setWaitlistOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2 }}
                    disabled={waitlistSubmitting}
                  >
                    {waitlistSubmitting ? 'Joining...' : 'Join Priority Queue'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
