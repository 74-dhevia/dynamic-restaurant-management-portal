import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RESTAURANTS, TIME_SLOTS, FOODS } from '../data/mockData';
import { createBooking } from '../redux/slices/bookingSlice';
import { addNotification } from '../redux/slices/notificationSlice';
import { logActivity } from '../redux/slices/activitySlice';
import { pushAdminNotification } from '../services/adminNotificationService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import Icon from '../components/Icon';
import SafeImage from '../components/SafeImage';

const OCCASIONS = [
  { id: 'birthday', label: 'Birthday Celebration', icon: 'rewards', desc: 'Cake, balloons & celebration vibes' },
  { id: 'anniversary', label: 'Anniversary', icon: 'wishlist', desc: 'Romantic setting & celebration setup' },
  { id: 'date', label: 'Romantic Date', icon: 'wishlist', desc: 'Intimate candlelight & quiet corner' },
  { id: 'business', label: 'Business Dinner', icon: 'profile', desc: 'Professional ambiance with privacy' },
  { id: 'family', label: 'Family Gathering', icon: 'users', desc: 'Spacious seating for all generations' },
  { id: 'friends', label: 'Friends Get-Together', icon: 'restaurant', desc: 'Lively atmosphere & party mood' },
];

const SEATING_PREFERENCES = [
  { id: 'window', label: 'Window Seating', desc: 'Scenic outside street or skyline view' },
  { id: 'rooftop', label: 'Rooftop Terrace', desc: 'Open-air dining under city lights' },
  { id: 'private', label: 'Private Dining Room', desc: 'Exclusive space with dedicated attendant' },
  { id: 'candlelight', label: 'Candlelight Corner', desc: 'Dim, cozy lighting and floral accents' },
  { id: 'garden', label: 'Garden Patio', desc: 'Surrounded by lush greenery' },
];

const SPECIAL_SETUPS = [
  { id: 'cake', label: 'Celebration Cake & Candles (₹350)', cost: 350 },
  { id: 'flowers', label: 'Fresh Flower Table Arrangement (₹250)', cost: 250 },
  { id: 'menu_card', label: 'Personalized Printed Menu (₹100)', cost: 100 },
  { id: 'soft_music', label: 'Acoustic / Soft Jazz Corner (Complimentary)', cost: 0 },
  { id: 'photo', label: 'Complimentary Commemorative Photo (Complimentary)', cost: 0 },
];

const DIETARY_OPTIONS = ['All Cuisines', 'Vegetarian', 'Non-Veg', 'Jain', 'Vegan', 'Halal'];

const BUDGET_PRESETS = [1500, 2500, 4000, 6000];

export default function PlanDiningExperience() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const location = useSelector(s => s.user?.location || 'Kovilpatti');

  const availableRestaurants = useMemo(
    () => {
      const filtered = RESTAURANTS.filter(r => r.hasTableBooking && (!location || r.area === location));
      return filtered.length > 0 ? filtered : RESTAURANTS.filter(r => r.hasTableBooking) || RESTAURANTS;
    },
    [location]
  );

  const [selectedRestId, setSelectedRestId] = useState(availableRestaurants[0]?.id || RESTAURANTS[0]?.id || 'r1');
  const [occasion, setOccasion] = useState(OCCASIONS[0].id);
  const [guests, setGuests] = useState(4);
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState(TIME_SLOTS[4]?.time || '7:30 PM');
  const [seating, setSeating] = useState(SEATING_PREFERENCES[0].id);
  const [dietary, setDietary] = useState(DIETARY_OPTIONS[0]);
  const [budget, setBudget] = useState(2500);
  const [selectedSetups, setSelectedSetups] = useState(['cake', 'flowers']);
  const [specialRequest, setSpecialRequest] = useState('');
  const [prepareBeforeArrival, setPrepareBeforeArrival] = useState(true);

  // Pre-ordered food items: { foodId: { ...food, qty, spiceLevel } }
  const [preOrderItems, setPreOrderItems] = useState({});

  const restaurant = useMemo(
    () => RESTAURANTS.find(r => r.id === selectedRestId) || availableRestaurants[0] || RESTAURANTS[0] || { id: 'r1', name: 'Restaurant', area: 'Kovilpatti' },
    [selectedRestId, availableRestaurants]
  );

  const menu = useMemo(
    () => FOODS.filter(f => f.restaurantId === restaurant?.id),
    [restaurant]
  );

  // Food items total
  const foodTotal = useMemo(() => {
    return Object.values(preOrderItems).reduce((acc, item) => acc + (item.price * item.qty), 0);
  }, [preOrderItems]);

  // Setups total
  const setupTotal = useMemo(() => {
    return selectedSetups.reduce((sum, id) => {
      const item = SPECIAL_SETUPS.find(s => s.id === id);
      return sum + (item?.cost || 0);
    }, 0);
  }, [selectedSetups]);

  const grandTotal = foodTotal + setupTotal;

  const toggleSetup = (id) => {
    setSelectedSetups(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

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
          qty: next,
          spiceLevel: prev[food.id]?.spiceLevel || 'Medium',
        },
      };
    });
  };

  // Preparation times simulation
  const prepSchedule = useMemo(() => {
    return {
      tableTime: time,
      prepTime: '7:05 PM',
      readyTime: '7:25 PM',
    };
  }, [time]);

  const handleConfirm = () => {
    if (!isAuthenticated) {
      showToast('Please sign in to plan and confirm your dining experience', 'error');
      navigate('/login', { state: { from: { pathname: '/plan-dining' } } });
      return;
    }

    if (!date || !time) {
      showToast('Please select a valid date and time', 'error');
      return;
    }

    const bookingId = `EXP-${Date.now().toString().slice(-4)}`;
    const occasionObj = OCCASIONS.find(o => o.id === occasion);
    const seatingObj = SEATING_PREFERENCES.find(s => s.id === seating);
    const customerName = user?.fullName || 'Guest';
    const customerEmail = user?.email || '';
    const customerPhone = user?.phone || '';

    const bookingRecord = {
      id: bookingId,
      userId: user?.id,
      userName: customerName,
      userEmail: customerEmail,
      customerPhone,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      date,
      time,
      guests,
      seating: seatingObj?.label || seating,
      occasion: occasionObj?.label || occasion,
      dietary,
      budget,
      request: specialRequest || `Special setup: ${selectedSetups.join(', ')}`,
      selectedSetups: selectedSetups.map(sId => SPECIAL_SETUPS.find(s => s.id === sId)?.label),
      tableId: 'T-14',
      preOrderItems: Object.values(preOrderItems),
      preOrderTotal: foodTotal,
      setupTotal,
      grandTotal,
      prepareBeforeArrival,
      prepSchedule: prepareBeforeArrival ? prepSchedule : null,
      status: 'Confirmed',
      journeyStep: 1,
      createdAt: new Date().toISOString(),
    };

    dispatch(createBooking(bookingRecord));

    // Log Activity for Admin
    dispatch(logActivity({
      action: 'Curated Dining Booking',
      entity: `Experience #${bookingId} (${customerName})`,
      entityType: 'Booking',
      admin: customerEmail,
      prevValue: 'None',
      newValue: `${occasionObj?.label} celebration at ${restaurant.name} (${guests} guests)`,
    }));

    // Dispatch professional Admin Notification (no emoji)
    pushAdminNotification({
      id: `notif_exp_${Date.now()}`,
      type: 'booking',
      title: 'New Table Booking',
      desc: `${customerName} booked ${occasionObj?.label} at ${restaurant.name}`,
      customerName,
      restaurantName: restaurant.name,
      entityId: bookingId,
      date,
      timeSlot: time,
      guests,
      seating: seatingObj?.label || seating,
      actions: ['view_booking', 'confirm_booking', 'manage_table'],
    });

    dispatch(addNotification({
      type: 'booking',
      title: 'Dining Experience Reserved!',
      message: `Your ${occasionObj?.label} celebration at ${restaurant.name} for ${guests} guests is confirmed!`,
    }));

    showToast('Dining experience booked successfully!', 'success');
    navigate(`/booking-success/${bookingId}`);
  };

  return (
    <div className="dining-experience-page">
      <div className="experience-header">
        <div className="experience-title-badge">
          <Icon name="sparkles" size={24} color="var(--accent)" />
          <span>CURATED RESERVATIONS</span>
        </div>
        <h1>Plan My Dining Experience</h1>
        <p className="sub">
          Customize your celebration with tailored seating, pre-ordered chef specials, bespoke setups, and scheduled arrival preparation.
        </p>
      </div>

      <div className="experience-layout">
        {/* Main Planning Form */}
        <div className="experience-form-column">
          {/* Step 1: Restaurant & Occasion */}
          <div className="card experience-section-card">
            <h3><Icon name="restaurant" size={20} /> 1. Select Restaurant &amp; Occasion</h3>
            <div className="input-group" style={{ marginTop: 12 }}>
              <label>Choose Restaurant in {location}</label>
              <select value={selectedRestId} onChange={e => setSelectedRestId(e.target.value)}>
                {RESTAURANTS.filter(r => r.hasTableBooking).map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.area}) • ⭐ {r.rating}</option>
                ))}
              </select>
            </div>

            <label style={{ fontSize: 13, fontWeight: 700, marginTop: 12, display: 'block' }}>Occasion</label>
            <div className="occasion-grid">
              {OCCASIONS.map(occ => (
                <button
                  key={occ.id}
                  type="button"
                  className={`occasion-card ${occasion === occ.id ? 'active' : ''}`}
                  onClick={() => setOccasion(occ.id)}
                >
                  <Icon name={occ.icon} size={22} color={occasion === occ.id ? 'var(--accent)' : 'currentColor'} />
                  <div>
                    <strong>{occ.label}</strong>
                    <div className="muted">{occ.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Date, Time & Seating */}
          <div className="card experience-section-card">
            <h3><Icon name="calendar" size={20} /> 2. Date, Time &amp; Seating</h3>

            <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 12 }}>
              <div className="input-group">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={e => setDate(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Number of Guests</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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

            <div className="input-group" style={{ marginTop: 10 }}>
              <label>Preferred Time Slot</label>
              <div className="chip-row">
                {TIME_SLOTS.map(slot => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={slot.status === 'full'}
                    className={`chip ${time === slot.time ? 'active' : ''}`}
                    onClick={() => setTime(slot.time)}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>

            <label style={{ fontSize: 13, fontWeight: 700, marginTop: 12, display: 'block' }}>Seating Preference</label>
            <div className="seating-list">
              {SEATING_PREFERENCES.map(pref => (
                <button
                  key={pref.id}
                  type="button"
                  className={`seating-option-btn ${seating === pref.id ? 'active' : ''}`}
                  onClick={() => setSeating(pref.id)}
                >
                  <Icon name="table" size={18} />
                  <div>
                    <strong>{pref.label}</strong>
                    <div className="muted">{pref.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Food Pre-Order & Customization */}
          <div className="card experience-section-card">
            <h3><Icon name="food" size={20} /> 3. Pre-Order Chef Specials ({restaurant?.name || 'Restaurant'})</h3>
            <p className="sub" style={{ margin: '4px 0 14px' }}>
              Add dishes now so your food is cooked fresh and served promptly upon arrival.
            </p>

            <div className="experience-menu-list">
              {(menu || []).slice(0, 6).map(dish => {
                const selected = preOrderItems[dish.id];
                return (
                  <div key={dish.id} className="preorder-item-row">
                    <SafeImage image={dish.image} alt={dish.name} style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <strong>{dish.name}</strong>
                      <div className="muted">₹{dish.price} • {dish.category}</div>
                    </div>
                    {selected ? (
                      <div className="qty-controls">
                        <button type="button" onClick={() => updateItemQty(dish, -1)}>
                          <Icon name="remove" size={14} />
                        </button>
                        <span>{selected.qty}</span>
                        <button type="button" onClick={() => updateItemQty(dish, 1)}>
                          <Icon name="add" size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => updateItemQty(dish, 1)}
                      >
                        <Icon name="add" size={14} /> Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step 4: Special Setup & Atmosphere */}
            <h4 style={{ margin: '20px 0 10px' }}>Atmosphere &amp; Special Setup</h4>
            <div className="setup-options">
              {SPECIAL_SETUPS.map(s => (
                <label key={s.id} className="setup-toggle-row">
                  <span>
                    <input
                      type="checkbox"
                      checked={selectedSetups.includes(s.id)}
                      onChange={() => toggleSetup(s.id)}
                    />
                    <strong style={{ marginLeft: 8 }}>{s.label}</strong>
                  </span>
                </label>
              ))}
            </div>

            {/* Prepare Before Arrival Toggle */}
            <div className="prepare-arrival-box" style={{ marginTop: 20 }}>
              <label className="checkbox-label" style={{ fontWeight: 700, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={prepareBeforeArrival}
                  onChange={e => setPrepareBeforeArrival(e.target.checked)}
                />
                <span>Prepare Before I Arrive (Cook to schedule)</span>
              </label>

              {prepareBeforeArrival && (
                <div className="prep-time-display">
                  <div className="prep-step">
                    <span className="muted">Table Time</span>
                    <strong>{time}</strong>
                  </div>
                  <div className="prep-step">
                    <span className="muted">Food preparation starts</span>
                    <strong style={{ color: 'var(--accent)' }}>{prepSchedule.prepTime}</strong>
                  </div>
                  <div className="prep-step">
                    <span className="muted">Expected ready</span>
                    <strong style={{ color: 'var(--success)' }}>{prepSchedule.readyTime}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sticky Summary Column */}
        <div className="experience-summary-column">
          <div className="card experience-summary-card">
            <h3>Experience Summary</h3>

            <div className="summary-info-block">
              <div className="summary-row">
                <span className="muted">Occasion:</span>
                <strong>{OCCASIONS.find(o => o.id === occasion)?.label}</strong>
              </div>
              <div className="summary-row">
                <span className="muted">Restaurant:</span>
                <strong>{restaurant?.name || 'Restaurant'}</strong>
              </div>
              <div className="summary-row">
                <span className="muted">Guests:</span>
                <strong>{guests} Guests</strong>
              </div>
              <div className="summary-row">
                <span className="muted">Date &amp; Time:</span>
                <strong>{date} at {time}</strong>
              </div>
              <div className="summary-row">
                <span className="muted">Seating:</span>
                <strong>{SEATING_PREFERENCES.find(s => s.id === seating)?.label}</strong>
              </div>
              <div className="summary-row">
                <span className="muted">Schedule:</span>
                <span>{prepareBeforeArrival ? 'Prepare Before Arrival Enabled' : 'Prepare at Table'}</span>
              </div>
            </div>

            {/* Pre-ordered items breakdown */}
            <div className="summary-items-block">
              <h4>Pre-Ordered Menu ({Object.values(preOrderItems).length})</h4>
              {Object.values(preOrderItems).length === 0 ? (
                <p className="muted" style={{ fontSize: 13 }}>No dishes pre-ordered yet (optional)</p>
              ) : (
                Object.values(preOrderItems).map(item => (
                  <div key={item.id} className="summary-item-line">
                    <span>{item.name} × {item.qty}</span>
                    <strong>₹{item.price * item.qty}</strong>
                  </div>
                ))
              )}
            </div>

            {/* Cost breakdown */}
            <div className="summary-pricing-block">
              <div className="summary-price-row">
                <span>Food Pre-Order:</span>
                <span>₹{foodTotal}</span>
              </div>
              <div className="summary-price-row">
                <span>Special Setups:</span>
                <span>₹{setupTotal}</span>
              </div>
              <div className="summary-price-row total">
                <strong>Estimated Total:</strong>
                <strong style={{ color: 'var(--accent)', fontSize: 18 }}>₹{grandTotal}</strong>
              </div>
            </div>

            <button
              id="btn-confirm-experience"
              type="button"
              className="btn btn-primary btn-block"
              style={{ marginTop: 20, padding: 14, fontSize: 15 }}
              onClick={handleConfirm}
            >
              <Icon name="check" size={18} /> Confirm &amp; Reserve Table
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
