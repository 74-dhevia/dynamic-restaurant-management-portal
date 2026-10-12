import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Icon from './Icon';
import SafeImage from './SafeImage';
import { login, SEED_USERS } from '../redux/slices/authSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { useToast } from '../contexts/ToastContext';

export default function LoginToOrderModal({ isOpen, onClose, foodItem }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSignInRedirect = () => {
    onClose();
    navigate('/login', {
      state: {
        from: location,
        pendingFood: foodItem,
        orderIntent: true,
      },
    });
  };

  const handleRegisterRedirect = () => {
    onClose();
    navigate('/register', {
      state: {
        from: location,
      },
    });
  };

  const handleQuickDemoLogin = async () => {
    try {
      const demoCustomer = SEED_USERS[0]; // Dheiva Lakshmi
      await dispatch(login({ email: demoCustomer.email, password: demoCustomer.password })).unwrap();
      
      if (foodItem) {
        dispatch(addToCart({
          foodId: foodItem.id,
          name: foodItem.name,
          price: foodItem.price,
          restaurantId: foodItem.restaurantId,
          restaurantName: foodItem.restaurantName || 'Authentic Kitchen',
          image: foodItem.image,
          qty: 1,
        }));
        showToast(`🎉 Logged in as ${demoCustomer.fullName}! ${foodItem.name} added to cart!`, 'success');
      } else {
        showToast(`🎉 Welcome back, ${demoCustomer.fullName}! Ready to order.`, 'success');
      }
      onClose();
    } catch (err) {
      showToast('Demo login failed. Please sign in via the login page.', 'error');
    }
  };

  return (
    <div
      className="login-order-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        className="login-order-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card-bg, #ffffff)',
          color: 'var(--text-color, #1f2937)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '460px',
          padding: '28px 24px',
          position: 'relative',
          boxShadow: '0 25px 60px -15px rgba(232, 84, 42, 0.3), 0 0 0 1px rgba(232, 84, 42, 0.15)',
          border: '1px solid rgba(232, 84, 42, 0.2)',
          textAlign: 'center',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--bg-secondary, #f3f4f6)',
            border: 'none',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#6b7280',
            transition: 'all 0.2s ease',
          }}
          title="Close"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Animated Glow Lock & Food Icon */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '14px' }}>
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e8542a 0%, #f59e0b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 10px 25px rgba(232, 84, 42, 0.35)',
              position: 'relative',
            }}
          >
            <Icon name="lock" size={34} color="#ffffff" />
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                fontSize: '20px',
                animation: 'bounce 1.5s infinite',
              }}
            >
              🍽️
            </span>
          </div>
        </div>

        {/* Subtitle Pill */}
        <div style={{ marginBottom: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(232, 84, 42, 0.12)',
              color: '#e8542a',
            }}
          >
            ✦ SIGN IN REQUIRED TO ORDER
          </span>
        </div>

        {/* Headline */}
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 800,
            margin: '0 0 8px',
            letterSpacing: '-0.4px',
            color: 'var(--heading-color, #111827)',
          }}
        >
          Please Log In to Place Your Order
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            lineHeight: 1.5,
            margin: '0 0 18px',
          }}
        >
          Hungry for authentic flavors? Sign in to your ZESTRO account to complete your order, collect instant DinePoints cashback, and track delivery live.
        </p>

        {/* Food Item Preview Card (If specific dish clicked) */}
        {foodItem && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--bg-secondary, #f9fafb)',
              border: '1px solid rgba(232, 84, 42, 0.2)',
              borderRadius: '14px',
              padding: '10px 14px',
              marginBottom: '18px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '10px',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            >
              <SafeImage
                image={foodItem.image}
                alt={foodItem.name}
                emoji="🍛"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: foodItem.veg ? '#10b981' : '#ef4444',
                  }}
                />
                <h4
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {foodItem.name}
                </h4>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>
                {foodItem.restaurantName || 'Authentic Kitchen'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#e8542a',
                }}
              >
                ₹{foodItem.price}
              </span>
            </div>
          </div>
        )}

        {/* Member Benefits */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '20px',
            fontSize: '12px',
          }}
        >
          <div
            style={{
              padding: '8px 4px',
              borderRadius: '10px',
              background: 'rgba(232, 84, 42, 0.06)',
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '2px' }}>⚡</div>
            <strong style={{ display: 'block', color: 'var(--text-color, #374151)' }}>Zero Wait</strong>
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>Fast prep</span>
          </div>

          <div
            style={{
              padding: '8px 4px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.08)',
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '2px' }}>🎁</div>
            <strong style={{ display: 'block', color: 'var(--text-color, #374151)' }}>100 Points</strong>
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>Cashback</span>
          </div>

          <div
            style={{
              padding: '8px 4px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.08)',
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '2px' }}>📍</div>
            <strong style={{ display: 'block', color: 'var(--text-color, #374151)' }}>Live Track</strong>
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>Real-time GPS</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Sign In Button */}
          <button
            type="button"
            onClick={handleSignInRedirect}
            id="modal-btn-login-to-order"
            style={{
              background: 'linear-gradient(135deg, #e8542a 0%, #ea580c 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              padding: '13px 18px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(232, 84, 42, 0.35)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Icon name="lock" size={16} color="#ffffff" />
            <span>Sign In &amp; Complete Order</span>
            <span>→</span>
          </button>

          {/* Quick 1-Click Demo Login */}
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            id="modal-btn-quick-demo-login"
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '14px',
              padding: '11px 16px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>⚡ Quick Demo Sign In as Dheiva (1-Click)</span>
          </button>

          {/* Register Link Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px', fontSize: '13px' }}>
            <span style={{ color: '#6b7280' }}>Don't have an account?</span>
            <button
              type="button"
              onClick={handleRegisterRedirect}
              style={{
                background: 'none',
                border: 'none',
                color: '#e8542a',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px',
                textDecoration: 'underline',
              }}
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
