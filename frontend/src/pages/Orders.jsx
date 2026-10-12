import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { cancelOrder } from '../redux/slices/orderSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { addNotification } from '../redux/slices/notificationSlice';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import SafeImage from '../components/SafeImage';
import Icon from '../components/Icon';
import Pagination from '../components/Pagination';
import { FOODS, getFoodImage } from '../data/mockData';

export default function Orders() {
  const rawOrders = useSelector(s => s.order?.orders || []);
  const orders = Array.isArray(rawOrders) ? rawOrders : [];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [cancelId, setCancelId] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return orders.slice(start, start + pageSize);
  }, [orders, currentPage, pageSize]);

  if (!orders.length) {
    return (
      <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <span className="emoji" style={{ fontSize: 48 }}>📦</span>
        <h2 style={{ margin: '14px 0 6px', fontSize: 22, fontWeight: 800 }}>No Orders Yet</h2>
        <p className="muted" style={{ margin: '0 0 20px', fontSize: 14 }}>
          You haven't placed any orders yet. Discover delicious dishes from our restaurant network!
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/restaurants')}
          style={{ fontWeight: 700 }}
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  const reorder = (order) => {
    let unavailable = 0;
    (order.items || []).forEach(item => {
      const targetId = item.foodId || item.id;
      const stillExists = FOODS.some(f => f.id === targetId);
      if (stillExists) dispatch(addToCart({ ...item, foodId: targetId }));
      else unavailable++;
    });
    if (unavailable) showToast(`${unavailable} item(s) are no longer available`, 'error');
    else showToast('Items added to cart!', 'success');
    navigate('/cart');
  };

  const doCancel = () => {
    dispatch(cancelOrder(cancelId));
    dispatch(addNotification({
      type: 'refund',
      title: 'Order Cancelled',
      message: `Order ${cancelId} has been cancelled. Simulated refund is processing.`,
    }));
    setCancelId(null);
    showToast(`Order ${cancelId} cancelled.`, 'info');
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '16px clamp(12px, 2vw, 24px) 60px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>📦 My Orders</h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 13.5 }}>
            View your order history, live tracking, payment status, and electronic receipts.
          </p>
        </div>
        <span className="badge" style={{ background: 'rgba(232, 84, 42, 0.12)', color: 'var(--accent)', fontWeight: 700, padding: '6px 12px', borderRadius: 20 }}>
          {orders.length} Total Order{orders.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Orders List (Requirement 11) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 540px), 1fr))', gap: 16 }}>
        {paginatedOrders.map(o => {
          const dateStr = o.placedAt || o.createdAt ? new Date(o.placedAt || o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
          const timeStr = o.placedAt || o.createdAt ? new Date(o.placedAt || o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
          const paymentMethodDisplay = o.paymentMethod || 'UPI';
          const paymentStatusDisplay = o.paymentStatus || 'Paid (Demo)';

          return (
            <div
              key={o.id}
              className="card"
              style={{
                padding: 18,
                borderRadius: 14,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                transition: 'all 0.18s ease',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedOrderDetails(o)}
            >
              {/* Header: Restaurant, Date, Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 16, color: 'var(--text)' }}>{o.restaurantName}</strong>
                    <span className="mini-badge-outline" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                      #{o.id}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>
                    {dateStr} {timeStr ? `• ${timeStr}` : ''}
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {/* Payment Status Badge */}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 12,
                        background: paymentStatusDisplay.includes('Paid') ? 'rgba(46, 204, 113, 0.15)' : 'rgba(255, 183, 3, 0.15)',
                        color: paymentStatusDisplay.includes('Paid') ? '#2ecc71' : '#ffb703',
                        border: `1px solid ${paymentStatusDisplay.includes('Paid') ? 'rgba(46, 204, 113, 0.3)' : 'rgba(255, 183, 3, 0.3)'}`,
                      }}
                    >
                      {paymentStatusDisplay}
                    </span>

                    {/* Order Status Badge */}
                    <span
                      className="rating-chip"
                      style={{
                        background: o.cancelled ? 'var(--danger)' : 'var(--success)',
                        fontSize: 11,
                        padding: '3px 8px',
                      }}
                    >
                      {o.status}
                    </span>
                  </div>

                  <strong style={{ fontSize: 16, color: 'var(--accent)', marginTop: 2 }}>
                    ₹{o.grandTotal}
                  </strong>
                </div>
              </div>

              {/* Payment Method Banner (Requirement 11) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', padding: '6px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <span>
                  💳 <strong>Payment:</strong> {paymentMethodDisplay}
                </span>
                {o.paymentRef && (
                  <span className="muted">
                    Ref: <code>{o.paymentRef}</code>
                  </span>
                )}
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
                  Delivery: <strong>{o.deliveryMode === 'later' ? 'Scheduled' : 'Standard'}</strong>
                </span>
              </div>

              {/* Items chips */}
              <div style={{ display: 'flex', gap: 10, margin: '8px 0', flexWrap: 'wrap' }}>
                {(o.items || []).map((i, idx) => {
                  const targetId = i.foodId || i.id;
                  const foodItem = FOODS.find(f => f.id === targetId);
                  const imgData = i.image || foodItem?.image || getFoodImage(i.name, i.category);
                  return (
                    <div
                      key={targetId || i.name || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        padding: '4px 10px',
                        borderRadius: 8,
                      }}
                    >
                      <SafeImage
                        image={imgData}
                        alt={i.name || 'Dish'}
                        style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover' }}
                        emoji="🍛"
                      />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>
                        {i.qty || 1}× {i.name || 'Item'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons row (stopPropagation so buttons don't open modal unless clicked) */}
              <div
                style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => setSelectedOrderDetails(o)}
                    style={{ fontWeight: 600 }}
                  >
                    Order Details
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => navigate(`/track-order/${o.id}`)}
                  >
                    Track Order
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => navigate(`/ebill/${o.id}`)}
                  >
                    E-Bill
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => reorder(o)}
                  >
                    Reorder
                  </button>
                </div>

                {!o.cancelled && (o.stageIndex === undefined || o.stageIndex <= 1) && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => setCancelId(o.id)}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={orders.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        }}
        itemName="orders"
      />

      {/* =========================================================================
          CUSTOMER ORDER DETAILS MODAL (Requirement 11)
         ========================================================================= */}
      {selectedOrderDetails && (
        <div className="payment-modal-backdrop" onClick={() => setSelectedOrderDetails(null)}>
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 580,
              background: 'var(--bg-elevated)',
              borderRadius: 18,
              padding: 24,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.35)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Order #{selectedOrderDetails.id}</h3>
                  <span className="rating-chip" style={{ background: selectedOrderDetails.cancelled ? 'var(--danger)' : 'var(--success)', fontSize: 11 }}>
                    {selectedOrderDetails.status}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                  {selectedOrderDetails.restaurantName} • {new Date(selectedOrderDetails.placedAt || selectedOrderDetails.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={() => setSelectedOrderDetails(null)}
                style={{ padding: '4px 8px', borderRadius: 8 }}
              >
                ✕
              </button>
            </div>

            {/* Payment & Transaction Info Card */}
            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 14, border: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="credit-card" size={15} color="var(--accent)" />
                <strong style={{ fontSize: 13.5 }}>Payment &amp; Transaction Details</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                <div>
                  <span className="muted">Method:</span>{' '}
                  <strong>{selectedOrderDetails.paymentMethod || 'UPI'}</strong>
                </div>
                <div>
                  <span className="muted">Status:</span>{' '}
                  <strong style={{ color: selectedOrderDetails.paymentStatus?.includes('Paid') ? '#2ecc71' : 'var(--text)' }}>
                    {selectedOrderDetails.paymentStatus || 'Paid (Demo)'}
                  </strong>
                </div>
                {selectedOrderDetails.paymentRef && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <span className="muted">Reference ID:</span>{' '}
                    <code>{selectedOrderDetails.paymentRef}</code>
                  </div>
                )}
                <div>
                  <span className="muted">Type:</span>{' '}
                  <span>Simulated Demo Flow</span>
                </div>
                <div>
                  <span className="muted">Amount:</span>{' '}
                  <strong style={{ color: 'var(--accent)' }}>₹{selectedOrderDetails.grandTotal}</strong>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 14, border: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Icon name="location" size={15} color="var(--accent)" />
                <strong style={{ fontSize: 13.5 }}>Delivery Address</strong>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
                {typeof selectedOrderDetails.deliveryAddress === 'string'
                  ? selectedOrderDetails.deliveryAddress
                  : selectedOrderDetails.deliveryAddress?.text || selectedOrderDetails.address?.text || 'Standard Address'}
              </div>
              {selectedOrderDetails.customerPhone && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  📞 {selectedOrderDetails.customerPhone}
                </div>
              )}
              {selectedOrderDetails.deliveryInstruction && (
                <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6, fontStyle: 'italic' }}>
                  Note: "{selectedOrderDetails.deliveryInstruction}"
                </div>
              )}
            </div>

            {/* Ordered Items Table */}
            <div style={{ marginBottom: 16 }}>
              <strong style={{ fontSize: 13.5, display: 'block', marginBottom: 8 }}>Ordered Items ({selectedOrderDetails.items?.length || 0})</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(selectedOrderDetails.items || []).map((item, idx) => {
                  const lineTotal = (item.price || 0) * (item.qty || 1);
                  return (
                    <div
                      key={item.foodId || item.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <SafeImage
                          image={item.image || getFoodImage(item.name, item.category)}
                          alt={item.name}
                          style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }}
                          emoji="🍛"
                        />
                        <div>
                          <strong style={{ fontSize: 13 }}>{item.name}</strong>
                          <div className="muted" style={{ fontSize: 11.5 }}>
                            {item.qty || 1} × ₹{item.price}
                          </div>
                        </div>
                      </div>
                      <strong style={{ fontSize: 13.5 }}>₹{lineTotal}</strong>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bill Calculation */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Subtotal</span>
                <span>₹{selectedOrderDetails.subtotal || selectedOrderDetails.grandTotal}</span>
              </div>
              {selectedOrderDetails.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--success)', marginBottom: 4 }}>
                  <span>Discount</span>
                  <span>- ₹{selectedOrderDetails.discount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Delivery Fee</span>
                <span>₹{selectedOrderDetails.deliveryFee || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>Taxes &amp; Packaging</span>
                <span>₹{selectedOrderDetails.tax || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: 'var(--text)', borderTop: '1px dashed var(--border)', paddingTop: 8 }}>
                <span>Grand Total</span>
                <span style={{ color: 'var(--accent)' }}>₹{selectedOrderDetails.grandTotal}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const id = selectedOrderDetails.id;
                  setSelectedOrderDetails(null);
                  navigate(`/track-order/${id}`);
                }}
                style={{ flex: 1, fontWeight: 700 }}
              >
                Track Live Order →
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  const id = selectedOrderDetails.id;
                  setSelectedOrderDetails(null);
                  navigate(`/ebill/${id}`);
                }}
                style={{ flex: 1 }}
              >
                View E-Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Cancellation Confirmation Modal */}
      <ConfirmationModal
        open={!!cancelId}
        title="Cancel Order?"
        message="Are you sure you want to cancel this order? A demo refund will be initiated to your original payment method."
        confirmLabel="Cancel Order"
        danger
        onCancel={() => setCancelId(null)}
        onConfirm={doCancel}
      />
    </div>
  );
}
