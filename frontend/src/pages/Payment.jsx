import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Payment route redirection to unified Checkout & Payment simulation page.
 * Keeps customer checkout experience centralized, modern, and bug-free.
 */
export default function Payment() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/checkout', { replace: true });
  }, [navigate]);

  return (
    <div className="checkout-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div className="payment-processing-spinner" />
      <p className="muted" style={{ marginTop: 14 }}>Redirecting to secure checkout...</p>
    </div>
  );
}
