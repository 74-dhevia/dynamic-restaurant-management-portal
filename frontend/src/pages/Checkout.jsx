import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import SafeImage from '../components/SafeImage';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { DELIVERY_INSTRUCTIONS, getFoodImage } from '../data/mockData';
import { computeTotals } from './Cart';
import { placeOrder, ORDER_STAGES } from '../redux/slices/orderSlice';
import { clearCart } from '../redux/slices/cartSlice';
import { addNotification } from '../redux/slices/notificationSlice';
import { addPoints } from '../redux/slices/rewardSlice';
import { logActivity } from '../redux/slices/activitySlice';
import { pushAdminNotification } from '../services/adminNotificationService';
import { updateProfile } from '../redux/slices/authSlice';

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Redux Store Subscriptions
  const { items, coupon, redeemPoints } = useSelector(s => s.cart);
  const rewardPoints = useSelector(s => s.reward.points);
  const currentUser = useSelector(s => s.auth.currentUser);

  // Delivery Details State
  const [customerName, setCustomerName] = useState(() => currentUser?.fullName || currentUser?.name || 'Dheiva Lakshmi');
  const [customerPhone, setCustomerPhone] = useState(() => currentUser?.phone || '+91 98401 23456');
  const [savedAddresses, setSavedAddresses] = useState(() => {
    if (currentUser?.addresses && currentUser.addresses.length > 0) return currentUser.addresses;
    return [
      { id: 'addr-1', type: 'Home', text: 'Plot No. 42, Annai Nagar, Kovilpatti, Tamil Nadu 628501' },
      { id: 'addr-2', type: 'Work', text: 'Tech Hub Office 302, Bypass Road, Kovilpatti, Tamil Nadu 628502' },
    ];
  });
  const [selectedAddressId, setSelectedAddressId] = useState(() => savedAddresses[0]?.id || 'addr-1');
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddrType, setNewAddrType] = useState('Home');
  const [newAddrText, setNewAddrText] = useState('');

  // Instructions & Delivery Mode
  const [instruction, setInstruction] = useState(DELIVERY_INSTRUCTIONS[0] || 'Leave at the door');
  const [customInstruction, setCustomInstruction] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('now'); // 'now' | 'later'
  const [scheduledDate, setScheduledDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState('13:30');

  // Payment Method Selection State: 'UPI' | 'Card' | 'COD'
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // UPI Form Details
  const [upiId, setUpiId] = useState('');

  // Card Form Details
  const [cardHolder, setCardHolder] = useState(() => currentUser?.fullName || 'Dheiva Lakshmi');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Payment Simulation & Modal State
  // modalStage: 'closed' | 'verify' | 'processing' | 'success' | 'failure'
  const [modalStage, setModalStage] = useState('closed');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentRefId, setPaymentRefId] = useState('');

  // Digit Input Refs for Auto-Advance
  const pinInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Authentication Guard
  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      showToast('Please sign in to proceed with checkout.', 'info');
      navigate('/login', { state: { from: { pathname: '/checkout' } }, replace: true });
    }
  }, [currentUser, navigate, showToast]);

  // Compute Live Cart Totals (Never hardcoded)
  const totals = useMemo(() => {
    return computeTotals({
      items,
      coupon,
      redeemPoints,
      availablePoints: rewardPoints,
    });
  }, [items, coupon, redeemPoints, rewardPoints]);

  // Focus first PIN box when verification modal opens
  useEffect(() => {
    if (modalStage === 'verify') {
      setTimeout(() => {
        pinInputRefs[0].current?.focus();
      }, 100);
    }
  }, [modalStage]);

  // Selected Address Object
  const selectedAddress = useMemo(() => {
    return savedAddresses.find(a => a.id === selectedAddressId) || savedAddresses[0] || { type: 'Home', text: 'Kovilpatti, Tamil Nadu' };
  }, [savedAddresses, selectedAddressId]);

  // Handler: Add New Address
  const handleAddNewAddress = (e) => {
    e.preventDefault();
    if (!newAddrText.trim()) {
      showToast('Please enter full address details.', 'error');
      return;
    }
    const newAddr = {
      id: `addr-${Date.now()}`,
      type: newAddrType,
      text: newAddrText.trim(),
    };
    const nextList = [...savedAddresses, newAddr];
    setSavedAddresses(nextList);
    setSelectedAddressId(newAddr.id);
    dispatch(updateProfile({ addresses: nextList }));
    setNewAddrText('');
    setShowAddAddressForm(false);
    showToast('New delivery address saved.', 'success');
  };

  // Helper: Card number formatting
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const handleFillDemoCard = () => {
    setCardHolder(currentUser?.fullName || 'Dheiva Lakshmi');
    setCardNumber('4532 8920 4829 1048');
    setCardExpiry('12/28');
    setCardCvv('789');
    showToast('Demo card credentials filled.', 'info');
  };

  // Handler: 4-digit Demo PIN / OTP changes
  const handlePinDigitChange = (index, value) => {
    const cleanChar = value.replace(/\D/g, '').slice(-1);
    const newCode = [...verificationCode];
    newCode[index] = cleanChar;
    setVerificationCode(newCode);

    // Auto-advance to next input
    if (cleanChar && index < 3) {
      pinInputRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      pinInputRefs[index - 1].current?.focus();
    }
  };

  // Handler: Start Payment Flow
  const handleInitiatePayment = (e) => {
    e.preventDefault();
    if (paymentCompleted) {
      showToast('Payment already completed for this order.', 'info');
      return;
    }

    if (!selectedAddress) {
      showToast('Please select a valid delivery address.', 'error');
      return;
    }

    if (!customerPhone.trim()) {
      showToast('Please provide a contact phone number.', 'error');
      return;
    }

    // Cash On Delivery requires no PIN/OTP verification (Requirement 5)
    if (paymentMethod === 'COD') {
      executeOrderPlacement('Cash on Delivery', 'Cash on Delivery (Pending at Door)');
      return;
    }

    // Validate UPI
    if (paymentMethod === 'UPI' && !upiId.trim()) {
      showToast('Please enter your simulated UPI ID (e.g. yourname@upi).', 'error');
      return;
    }

    // Open Demo Verification Modal (Requirement 3 & 4)
    setVerificationCode(['', '', '', '']);
    setModalStage('verify');
  };

  // Handler: Verify Demo PIN/OTP
  const handleVerifyDemoCode = () => {
    const fullCode = verificationCode.join('');
    if (fullCode.length < 4) {
      showToast('Please enter the 4-digit demo verification code.', 'error');
      return;
    }

    // Requirement 3 & 4 & 12: Predefined test code is '1234'
    if (fullCode === '1234') {
      // Correct demo code -> proceed to short processing animation (Requirement 6)
      setModalStage('processing');
      setTimeout(() => {
        executeOrderPlacement(
          paymentMethod === 'UPI' ? 'UPI' : 'Card',
          'Paid (Demo)'
        );
      }, 1500);
    } else {
      // Incorrect demo code -> Demo failure scenario (Requirement 12)
      setModalStage('failure');
    }
  };

  // Order Placement Execution
  const executeOrderPlacement = (methodLabel, paymentStatusLabel) => {
    const orderIdNum = Math.floor(1000 + Math.random() * 9000);
    const newOrderId = `ZST-${orderIdNum}`;
    const generatedPaymentRef = `PAY-ZST-${Math.floor(10000 + Math.random() * 90000)}`;
    setPaymentRefId(generatedPaymentRef);

    const restaurantId = items[0]?.restaurantId || 'r1';
    const restaurantName = items[0]?.restaurantName || 'Zestro Kitchen';
    const custName = customerName.trim() || currentUser.fullName || currentUser.email || 'Customer';
    const custEmail = currentUser.email || '';
    const custPhone = customerPhone.trim();

    const finalInstruction = customInstruction.trim() ? `${instruction} (${customInstruction.trim()})` : instruction;

    const orderData = {
      id: newOrderId,
      userId: currentUser.id,
      userName: custName,
      customerName: custName,
      userEmail: custEmail,
      customerEmail: custEmail,
      customerPhone: custPhone,
      customerAvatar: currentUser.avatar || null,
      items: items.map(i => ({
        ...i,
        foodId: i.foodId || i.id,
        image: i.image || getFoodImage(i.name, i.category),
      })),
      restaurantId,
      restaurantName,
      address: selectedAddress,
      deliveryAddress: selectedAddress.text,
      deliveryInstruction: finalInstruction,
      deliveryMode,
      scheduledDate: deliveryMode === 'later' ? scheduledDate : null,
      scheduledTime: deliveryMode === 'later' ? scheduledTime : null,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      tax: totals.tax,
      discount: totals.discount,
      pointsValue: totals.pointsValue,
      grandTotal: totals.grandTotal,
      paymentMethod: methodLabel,
      paymentStatus: paymentStatusLabel,
      paymentRef: generatedPaymentRef,
      isDemoPayment: true,
      status: ORDER_STAGES[0] || 'Placed',
      stageIndex: 0,
      placedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      timeline: [
        { status: ORDER_STAGES[0] || 'Placed', at: new Date().toISOString() },
      ],
    };

    // 1. Dispatch order into shared store (Requirement 8)
    dispatch(placeOrder(orderData));

    // 2. Activity Feed update (Requirement 10)
    dispatch(logActivity({
      action: 'Customer Placed Order',
      entity: `Order #${newOrderId} (${custName})`,
      entityType: 'Order',
      admin: custEmail,
      prevValue: 'Cart',
      newValue: `₹${totals.grandTotal} via ${methodLabel} (${paymentStatusLabel})`,
    }));

    // 3. Admin Notification (Requirement 10)
    pushAdminNotification({
      id: `notif_ord_${Date.now()}`,
      type: 'order',
      title: 'New Order Placed',
      desc: `${custName} placed Order #${newOrderId} for ₹${totals.grandTotal}`,
      customerName: custName,
      restaurantName,
      amount: totals.grandTotal,
      status: 'Placed',
      entityId: newOrderId,
      actions: ['view_order', 'manage_order'],
    });

    // 4. Clear cart & award DinePoints (Requirement 8)
    dispatch(clearCart());
    dispatch(addPoints({
      amount: Math.round(totals.grandTotal / 10),
      reason: `Reward Points for Order ${newOrderId}`,
    }));
    dispatch(addNotification({
      type: 'order',
      title: 'Order Confirmed!',
      message: `Your demo order #${newOrderId} has been placed successfully.`,
    }));

    // 5. Store completed order details for success view
    setCreatedOrder(orderData);
    setPaymentCompleted(true);
    setModalStage('success');
  };

  // =========================================================================
  // VIEW: CART PROTECTION (Requirement 15)
  // If cart is empty and no order has just been placed, display empty state
  // =========================================================================
  if ((!items || items.length === 0) && !paymentCompleted) {
    return (
      <div className="checkout-container">
        <div className="card" style={{ padding: 50, textAlign: 'center', maxWidth: 540, margin: '40px auto' }}>
          <div style={{ fontSize: 54, marginBottom: 16 }}>🛒</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800 }}>Your Cart is Empty</h2>
          <p className="muted" style={{ margin: '0 0 24px', fontSize: 14 }}>
            You don't have any food items in your cart to checkout. Explore our top restaurants and order delicious food!
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/restaurants')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', fontWeight: 700 }}
          >
            <Icon name="restaurant" size={16} /> Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN CHECKOUT & PAYMENT PAGE
  // =========================================================================
  return (
    <div className="checkout-container">
      {/* 1. Checkout Page Header */}
      <div className="checkout-header">
        <div>
          <h1 className="checkout-header-title">Checkout &amp; Payment</h1>
          <p className="checkout-header-sub">
            Review delivery details, select your demo payment method, and complete your order.
          </p>
        </div>

        {/* Security / Demo Pill (Requirement 17) */}
        <div className="demo-security-pill">
          <Icon name="shield" size={14} color="#2ecc71" />
          <span>Demo Payment Mode — No real money will be charged</span>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="checkout-grid">
        {/* LEFT COLUMN: Delivery Details & Payment Method Selection */}
        <div className="checkout-left-col">
          {/* SECTION 1: DELIVERY DETAILS (Requirement 1) */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <h2 className="checkout-card-title">
                <Icon name="location" size={18} color="var(--accent)" />
                <span>1. Delivery Details</span>
              </h2>
              <span className="badge" style={{ background: 'rgba(232, 84, 42, 0.1)', color: 'var(--accent)', fontWeight: 700 }}>
                Step 1 of 2
              </span>
            </div>

            {/* Customer Name & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 18 }}>
              <div className="input-group">
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)' }}>Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Enter full name"
                  className="admin-form-input small"
                  disabled={paymentCompleted}
                  style={{ width: '100%', height: 38, borderRadius: 8 }}
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)' }}>Contact Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="+91 98401 23456"
                  className="admin-form-input small"
                  disabled={paymentCompleted}
                  style={{ width: '100%', height: 38, borderRadius: 8 }}
                />
              </div>
            </div>

            {/* Delivery Address Selection */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)' }}>Delivery Address</label>
                {!showAddAddressForm && !paymentCompleted && (
                  <button
                    type="button"
                    className="btn-custom-link"
                    onClick={() => setShowAddAddressForm(true)}
                    style={{ fontSize: 12 }}
                  >
                    + Add New Address
                  </button>
                )}
              </div>

              {/* Saved Addresses List */}
              <div className="saved-addresses-grid">
                {savedAddresses.map(addr => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      className={`saved-address-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => !paymentCompleted && setSelectedAddressId(addr.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                          {addr.type === 'Home' ? '🏠 Home' : addr.type === 'Work' ? '💼 Work' : '📍 ' + addr.type}
                        </span>
                        {isSelected && <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 800 }}>✓</span>}
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {addr.text}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Inline Add New Address Form */}
              {showAddAddressForm && !paymentCompleted && (
                <div className="card" style={{ padding: 14, background: 'var(--bg)', marginBottom: 14, border: '1px dashed var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <strong style={{ fontSize: 13 }}>Add New Delivery Address</strong>
                    <button
                      type="button"
                      className="btn-custom-link"
                      onClick={() => setShowAddAddressForm(false)}
                      style={{ color: 'var(--text-muted)', fontSize: 12 }}
                    >
                      Cancel
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                    {['Home', 'Work', 'Other'].map(t => (
                      <button
                        key={t}
                        type="button"
                        className={`chip-sm ${newAddrType === t ? 'active' : ''}`}
                        onClick={() => setNewAddrType(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={newAddrText}
                    onChange={e => setNewAddrText(e.target.value)}
                    placeholder="House/Flat No., Building name, Street, Area, Pincode"
                    className="admin-form-input small"
                    style={{ width: '100%', borderRadius: 8, padding: 8, fontSize: 12.5 }}
                  />
                  <button
                    type="button"
                    className="btn btn-xs btn-primary"
                    onClick={handleAddNewAddress}
                    style={{ marginTop: 8 }}
                  >
                    Save Address
                  </button>
                </div>
              )}
            </div>

            {/* Delivery Instructions */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)' }}>
                Delivery Instructions
              </label>
              <div className="instruction-chips-wrap">
                {DELIVERY_INSTRUCTIONS.map(d => (
                  <button
                    key={d}
                    type="button"
                    className={`instruction-chip ${instruction === d ? 'active' : ''}`}
                    onClick={() => !paymentCompleted && setInstruction(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customInstruction}
                onChange={e => setCustomInstruction(e.target.value)}
                placeholder="Optional: Landmark, gate code, or specific drop-off note"
                className="admin-form-input small"
                disabled={paymentCompleted}
                style={{ width: '100%', marginTop: 8, height: 34, borderRadius: 6, fontSize: 12 }}
              />
            </div>

            {/* Delivery Type (Mode) */}
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Delivery Schedule
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn btn-xs ${deliveryMode === 'now' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => !paymentCompleted && setDeliveryMode('now')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8 }}
                >
                  <span>⚡</span>
                  <span>Deliver Now (~25–35 mins)</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${deliveryMode === 'later' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => !paymentCompleted && setDeliveryMode('later')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8 }}
                >
                  <span>📅</span>
                  <span>Schedule for Later</span>
                </button>
              </div>

              {deliveryMode === 'later' && (
                <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <label style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="admin-form-input small"
                      disabled={paymentCompleted}
                      style={{ width: '100%', height: 36, borderRadius: 6 }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <label style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Time Slot</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      className="admin-form-input small"
                      disabled={paymentCompleted}
                      style={{ width: '100%', height: 36, borderRadius: 6 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: SELECT PAYMENT METHOD (Requirements 2, 3, 4, 5) */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <h2 className="checkout-card-title">
                <Icon name="credit-card" size={18} color="var(--accent)" />
                <span>2. Select Payment Method</span>
              </h2>
              <span className="badge" style={{ background: 'rgba(58, 134, 255, 0.1)', color: '#3a86ff', fontWeight: 700 }}>
                Step 2 of 2
              </span>
            </div>

            {/* 3 Payment Option Cards (Single Selection with Highlighted Border) */}
            <div className="payment-methods-grid">
              {/* UPI */}
              <div
                className={`payment-method-card ${paymentMethod === 'UPI' ? 'selected' : ''}`}
                onClick={() => !paymentCompleted && setPaymentMethod('UPI')}
              >
                <div className="payment-method-radio">
                  {paymentMethod === 'UPI' && <div className="payment-method-radio-dot" />}
                </div>
                <div className="payment-method-icon">📱</div>
                <div className="payment-method-title">UPI Payment</div>
                <div className="payment-method-sub">GPay, PhonePe, Paytm</div>
              </div>

              {/* Card */}
              <div
                className={`payment-method-card ${paymentMethod === 'Card' ? 'selected' : ''}`}
                onClick={() => !paymentCompleted && setPaymentMethod('Card')}
              >
                <div className="payment-method-radio">
                  {paymentMethod === 'Card' && <div className="payment-method-radio-dot" />}
                </div>
                <div className="payment-method-icon">💳</div>
                <div className="payment-method-title">Credit / Debit Card</div>
                <div className="payment-method-sub">Visa, Mastercard, RuPay</div>
              </div>

              {/* Cash On Delivery */}
              <div
                className={`payment-method-card ${paymentMethod === 'COD' ? 'selected' : ''}`}
                onClick={() => !paymentCompleted && setPaymentMethod('COD')}
              >
                <div className="payment-method-radio">
                  {paymentMethod === 'COD' && <div className="payment-method-radio-dot" />}
                </div>
                <div className="payment-method-icon">💵</div>
                <div className="payment-method-title">Cash on Delivery</div>
                <div className="payment-method-sub">Pay at doorstep</div>
              </div>
            </div>

            {/* Method-Specific Inputs */}
            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 18, border: '1px solid var(--border)' }}>
              {/* UPI Form */}
              {paymentMethod === 'UPI' && (
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>Pay with UPI</h3>
                  <p className="muted" style={{ margin: '0 0 12px', fontSize: 12.5 }}>
                    Enter any simulated UPI ID. In the next step, you will be prompted for a 4-digit demo PIN.
                  </p>

                  <div className="input-group" style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className="admin-form-input small"
                      disabled={paymentCompleted}
                      style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                    />
                  </div>

                  {/* Demo UPI Quick Fill Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Quick Demo ID:</span>
                    {['dheiva@okhdfcbank', 'customer@paytm', 'zestro@upi'].map(sample => (
                      <button
                        key={sample}
                        type="button"
                        className="btn-custom-link"
                        onClick={() => !paymentCompleted && setUpiId(sample)}
                        style={{ fontSize: 11.5, textDecoration: 'underline' }}
                      >
                        {sample}
                      </button>
                    ))}
                  </div>

                  <p className="muted" style={{ fontSize: 11.5, margin: '10px 0 0', fontStyle: 'italic' }}>
                    🔒 Notice: This UPI ID will not be permanently stored. Real bank credentials are never requested.
                  </p>
                </div>
              )}

              {/* Card Form */}
              {paymentMethod === 'Card' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Card Payment</h3>
                      <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>
                        Simulated card gateway. Use the demo autofill button for instant testing.
                      </p>
                    </div>
                    {!paymentCompleted && (
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={handleFillDemoCard}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
                      >
                        ⚡ Fill Demo Card
                      </button>
                    )}
                  </div>

                  <div className="input-group" style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Cardholder Name</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={e => setCardHolder(e.target.value)}
                      placeholder="Dheiva Lakshmi"
                      className="admin-form-input small"
                      disabled={paymentCompleted}
                      style={{ width: '100%', height: 36, borderRadius: 6 }}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="admin-form-input small"
                      disabled={paymentCompleted}
                      style={{ width: '100%', height: 36, borderRadius: 6, letterSpacing: 1 }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="input-group">
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="MM / YY"
                        maxLength={5}
                        className="admin-form-input small"
                        disabled={paymentCompleted}
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>
                    <div className="input-group">
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        placeholder="•••"
                        maxLength={3}
                        className="admin-form-input small"
                        disabled={paymentCompleted}
                        style={{ width: '100%', height: 36, borderRadius: 6 }}
                      />
                    </div>
                  </div>

                  <p className="muted" style={{ fontSize: 11.5, margin: '10px 0 0', fontStyle: 'italic' }}>
                    🔒 Notice: Demo card fields only. No real banking details are captured, validated with banks, or stored.
                  </p>
                </div>
              )}

              {/* Cash On Delivery */}
              {paymentMethod === 'COD' && (
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>Cash on Delivery</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(46, 204, 113, 0.1)', borderRadius: 8, border: '1px solid rgba(46, 204, 113, 0.3)' }}>
                    <span style={{ fontSize: 20 }}>💵</span>
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>
                      <strong>You will pay when your order is delivered.</strong>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Please keep exact cash ready of <strong>₹{totals.grandTotal}</strong> for the delivery partner.
                      </div>
                    </div>
                  </div>
                  <p className="muted" style={{ fontSize: 11.5, margin: '10px 0 0' }}>
                    No PIN or OTP is required for Cash on Delivery orders.
                  </p>
                </div>
              )}
            </div>

            {/* Security Disclaimer (Requirement 17) */}
            <div className="security-disclaimer-box">
              <Icon name="shield" size={18} color="var(--accent)" />
              <div>
                <strong>Demo Payment Mode</strong>
                <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                  No real money is charged. Do not enter real banking PINs, OTPs or card credentials.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY ORDER SUMMARY (Requirement 1) */}
        <div className="checkout-right-col">
          <div className="checkout-card order-summary-sidebar">
            <div className="checkout-card-header" style={{ marginBottom: 12, paddingBottom: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Order Summary</h3>
                <span className="muted" style={{ fontSize: 12 }}>
                  {items.length} unique item{items.length > 1 ? 's' : ''} in cart
                </span>
              </div>
              <span className="mini-badge-outline" style={{ fontSize: 11 }}>
                {items[0]?.restaurantName || 'Zestro Partner'}
              </span>
            </div>

            {/* Items List */}
            <div className="summary-items-list">
              {items.map(item => {
                const itemTotal = (item.price || 0) * (item.qty || 1);
                return (
                  <div key={item.foodId || item.id} className="summary-item-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <SafeImage
                        image={item.image || getFoodImage(item.name, item.category)}
                        alt={item.name}
                        className="summary-item-img"
                        emoji="🍛"
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.veg ? '#2ecc71' : '#e74c3c' }} />
                          <strong style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </strong>
                        </div>
                        <div className="muted" style={{ fontSize: 11.5 }}>
                          Qty: {item.qty} × ₹{item.price}
                        </div>
                      </div>
                    </div>
                    <strong style={{ fontSize: 13.5, color: 'var(--text)', flexShrink: 0 }}>
                      ₹{itemTotal}
                    </strong>
                  </div>
                );
              })}
            </div>

            {/* Price Calculations */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <div className="summary-price-row">
                <span>Items Subtotal</span>
                <span>₹{totals.subtotal}</span>
              </div>

              {totals.discount > 0 && (
                <div className="summary-price-row" style={{ color: 'var(--success)' }}>
                  <span>Coupon Discount</span>
                  <span>- ₹{totals.discount}</span>
                </div>
              )}

              {totals.pointsValue > 0 && (
                <div className="summary-price-row" style={{ color: 'var(--success)' }}>
                  <span>DinePoints Redeemed</span>
                  <span>- ₹{totals.pointsValue}</span>
                </div>
              )}

              <div className="summary-price-row">
                <span>Delivery Partner Fee</span>
                <span>{totals.deliveryFee > 0 ? `₹${totals.deliveryFee}` : 'FREE'}</span>
              </div>

              <div className="summary-price-row">
                <span>Taxes &amp; Restaurant Packaging (5% GST)</span>
                <span>₹{totals.tax}</span>
              </div>

              <div className="summary-price-row total-row">
                <span>Total Amount</span>
                <span style={{ color: 'var(--accent)' }}>₹{totals.grandTotal}</span>
              </div>
            </div>

            {/* Dynamic CTA Button (Requirement 14 & 16) */}
            <button
              type="button"
              className="pay-cta-btn"
              disabled={paymentCompleted}
              onClick={handleInitiatePayment}
            >
              {paymentCompleted ? (
                <>
                  <span>✓</span>
                  <span>Payment Already Completed</span>
                </>
              ) : paymentMethod === 'COD' ? (
                <>
                  <span>Place Order (Cash on Delivery)</span>
                  <Icon name="chevron-right" size={16} />
                </>
              ) : (
                <>
                  <span>Pay ₹{totals.grandTotal} with {paymentMethod}</span>
                  <Icon name="chevron-right" size={16} />
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <span className="muted" style={{ fontSize: 11 }}>
                🔒 256-bit Simulated Frontend Encryption
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DEMO PAYMENT VERIFICATION MODAL (Requirements 3, 4, 6, 7, 12, 13)
         ========================================================================= */}
      {modalStage !== 'closed' && (
        <div className="payment-modal-backdrop">
          <div className="payment-modal-card">
            {/* STAGE 1: VERIFY DEMO PIN / OTP */}
            {modalStage === 'verify' && (
              <div>
                <div style={{ fontSize: 36, marginBottom: 8 }}>
                  {paymentMethod === 'UPI' ? '📱' : '💳'}
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800 }}>
                  Demo Payment Verification
                </h3>
                <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  {paymentMethod === 'UPI' ? 'Enter 4-digit Demo PIN' : 'Enter 4-digit Demo OTP'}
                </p>

                {/* Subtext warning (Requirement 3 & 4) */}
                <p className="muted" style={{ fontSize: 12, margin: '0 0 12px' }}>
                  {paymentMethod === 'UPI'
                    ? 'This is a simulated payment. Do not enter your real UPI PIN.'
                    : 'Demo OTP — no real bank verification is performed.'}
                </p>

                {/* Demo Hint Badge (Tamil/English requested helper: duplicate/demo 4-digit code) */}
                <div className="demo-hint-chip">
                  <span>💡 Test Code: <strong>1234</strong></span>
                  <span style={{ opacity: 0.8 }}>(Enter 1234 to simulate success)</span>
                </div>

                {/* 4-digit PIN/OTP Input Boxes */}
                <div className="demo-pin-inputs-row">
                  {[0, 1, 2, 3].map(idx => (
                    <input
                      key={idx}
                      ref={pinInputRefs[idx]}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={verificationCode[idx]}
                      onChange={e => handlePinDigitChange(idx, e.target.value)}
                      onKeyDown={e => handlePinKeyDown(idx, e)}
                      className="demo-pin-digit-box"
                      autoComplete="off"
                    />
                  ))}
                </div>

                {/* Quick Auto-fill button */}
                <button
                  type="button"
                  className="btn-custom-link"
                  onClick={() => {
                    setVerificationCode(['1', '2', '3', '4']);
                    pinInputRefs[3].current?.focus();
                  }}
                  style={{ fontSize: 12, marginBottom: 18 }}
                >
                  ⚡ Auto-fill Demo Code (1234)
                </button>

                {/* Amount display */}
                <div style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, marginBottom: 18, fontSize: 13 }}>
                  Paying to: <strong>ZESTRO • {items[0]?.restaurantName}</strong> • <strong style={{ color: 'var(--accent)' }}>₹{totals.grandTotal}</strong>
                </div>

                {/* Modal Buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-block"
                    onClick={() => setModalStage('closed')}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={handleVerifyDemoCode}
                    style={{ flex: 2, fontWeight: 700 }}
                  >
                    Verify &amp; Pay ₹{totals.grandTotal}
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: PROCESSING ANIMATION (Requirement 6) */}
            {modalStage === 'processing' && (
              <div style={{ padding: '20px 0' }}>
                <div className="payment-processing-spinner" />
                <h3 style={{ margin: '14px 0 6px', fontSize: 18, fontWeight: 800 }}>
                  Processing Payment...
                </h3>
                <p style={{ margin: '0 0 6px', fontSize: 13.5, color: 'var(--text)' }}>
                  Verifying your demo payment
                </p>
                <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                  Please wait a moment...
                </p>
                <div style={{ marginTop: 14, fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>
                  Amount: ₹{totals.grandTotal} via {paymentMethod} (Simulated)
                </div>
              </div>
            )}

            {/* STAGE 3: PAYMENT VERIFICATION FAILED (Requirement 12 & 13) */}
            {modalStage === 'failure' && (
              <div>
                <div style={{ fontSize: 44, color: 'var(--danger)', marginBottom: 10 }}>
                  ❌
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: 'var(--danger)' }}>
                  Payment Verification Failed
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: 13.5, color: 'var(--text)' }}>
                  The demo verification code is incorrect.
                </p>
                <p className="muted" style={{ fontSize: 12, marginBottom: 20 }}>
                  For this simulated demonstration, please enter the test code <strong>1234</strong>. Your cart and entered details remain completely intact.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => {
                      setVerificationCode(['', '', '', '']);
                      setModalStage('verify');
                    }}
                    style={{ fontWeight: 700 }}
                  >
                    Try Again (Use 1234)
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    onClick={() => setModalStage('closed')}
                  >
                    Change Payment Method
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 4: PAYMENT SUCCESSFUL (Requirement 7 & 8) */}
            {modalStage === 'success' && createdOrder && (
              <div>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71', fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  ✓
                </div>
                <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
                  Payment Successful
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#2ecc71', fontWeight: 700 }}>
                  Demo payment completed successfully.
                </p>

                {/* Payment Reference Summary Card */}
                <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '14px 16px', textAlign: 'left', border: '1px solid var(--border)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="muted" style={{ fontSize: 12 }}>Order ID:</span>
                    <strong style={{ fontSize: 13, color: 'var(--accent)' }}>#{createdOrder.id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="muted" style={{ fontSize: 12 }}>Payment Method:</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700 }}>{createdOrder.paymentMethod} (Demo)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="muted" style={{ fontSize: 12 }}>Amount Paid:</span>
                    <strong style={{ fontSize: 13.5, color: 'var(--text)' }}>₹{createdOrder.grandTotal}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="muted" style={{ fontSize: 12 }}>Payment Reference:</span>
                    <code style={{ fontSize: 12, fontWeight: 700, background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>
                      {paymentRefId}
                    </code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="muted" style={{ fontSize: 12 }}>Date &amp; Time:</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(createdOrder.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(createdOrder.placedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="muted" style={{ fontSize: 11.5, margin: '0 0 18px', textAlign: 'center' }}>
                  This was a simulated frontend transaction. No real money was charged to any bank account.
                </p>

                {/* Primary Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => navigate(`/track-order/${createdOrder.id}`)}
                    style={{ fontWeight: 800, padding: 12 }}
                  >
                    Track Order ({createdOrder.id}) →
                  </button>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => navigate('/orders')}
                      style={{ flex: 1, fontSize: 13 }}
                    >
                      View All Orders
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => navigate(`/ebill/${createdOrder.id}`)}
                      style={{ flex: 1, fontSize: 13 }}
                    >
                      View E-Bill
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
