import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../redux/slices/notificationSlice';
import Pagination from '../components/Pagination';
import { useToast } from '../contexts/ToastContext';
import {
  requestNotificationPermission,
  getCurrentFcmToken,
  onForegroundMessage,
} from '../services/fcmNotificationService';
import { VAPID_KEY } from '../config/firebaseConfig';
import { getApiBaseUrl } from '../services/apiConfig';

export default function Notifications() {
  const { items, loading } = useSelector(s => s.notification);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pushPermission, setPushPermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [fcmToken, setFcmToken] = useState(() => getCurrentFcmToken());

  useEffect(() => {
    dispatch(fetchNotifications());

    // Listen for foreground push notifications
    const unsubscribe = onForegroundMessage((payload) => {
      const title = payload.notification?.title || 'ZESTRO Notification';
      const body = payload.notification?.body || 'New dining update received.';
      showToast(`${title}: ${body}`, 'info');
      dispatch(fetchNotifications());
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [dispatch, showToast]);

  const handleEnablePush = async () => {
    setIsEnablingPush(true);
    try {
      const res = await requestNotificationPermission(VAPID_KEY);
      if (res && res.success) {
        setPushPermission('granted');
        setFcmToken(res.token);
        showToast('Push notifications enabled! Real-time alerts are now active.', 'success');
      } else if (res && res.permission === 'denied') {
        setPushPermission('denied');
        showToast('Notification permission was blocked in browser settings.', 'error');
      } else {
        showToast('Could not enable push notifications: ' + (res?.error || res?.reason || 'Unknown error'), 'error');
      }
    } catch (err) {
      showToast('Error enabling push: ' + err.message, 'error');
    } finally {
      setIsEnablingPush(false);
    }
  };

  const handleSendTestPush = async () => {
    const token = fcmToken || getCurrentFcmToken();
    if (!token) {
      showToast('No device push token found. Please click "Enable Push Notifications" first.', 'error');
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/notifications/test-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fcmToken: token,
          title: 'Table Reservation Confirmed! 🥂',
          body: 'This is a live Firebase push notification from ZESTRO.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Live test notification sent to your browser! 🔔', 'success');
      } else {
        showToast('Failed to send test push: ' + (data.error || 'Check server logs'), 'error');
      }
    } catch (err) {
      showToast('Error sending test push: ' + err.message, 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return (items || []).slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const handleNotificationClick = (n) => {
    dispatch(markNotificationRead(n.id));
    if (n.actionUrl) {
      navigate(n.actionUrl);
    }
  };

  const renderPushBanner = () => (
    <div
      className="card"
      style={{
        padding: '16px 20px',
        marginBottom: 20,
        background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08), rgba(249, 115, 22, 0.03))',
        border: '1px solid rgba(234, 88, 12, 0.25)',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'var(--accent, #ea580c)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}
        >
          🔔
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            Real-Time Push Notifications
            {pushPermission === 'granted' && (
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#16a34a',
                  fontWeight: 600,
                }}
              >
                ● Connected
              </span>
            )}
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            {pushPermission === 'granted'
              ? 'Push notifications are active. You will receive table and order updates directly on your device.'
              : 'Enable browser notifications to receive instant table booking confirmation and PIN alerts.'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {pushPermission !== 'granted' ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleEnablePush}
            disabled={isEnablingPush}
            style={{ fontWeight: 600, borderRadius: 8, padding: '8px 16px' }}
          >
            {isEnablingPush ? 'Enabling...' : 'Enable Push Notifications'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleSendTestPush}
            disabled={isSendingTest}
            style={{ fontWeight: 600, borderRadius: 8, padding: '8px 16px' }}
          >
            {isSendingTest ? 'Sending...' : 'Test Push Notification 🚀'}
          </button>
        )}
      </div>

      {pushPermission === 'denied' && (
        <div style={{ width: '100%', marginTop: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: 13, color: '#ef4444', lineHeight: 1.5 }}>
          📱 <strong>Mobile Chrome Permission Tip:</strong> Local Wi-Fi IP address (<code>10.222.61.40</code>) HTTP-la iruppathaal Chrome auto-block seiyalaam. Unga phone browser top address bar-la irukkum <strong>▲ (Warning / lock icon)</strong>-ai tap seithu ➔ <strong>Permissions / Site Settings</strong> ➔ <strong>Notifications</strong> ➔ <strong>Allow</strong> kuduthuvittu indha page-ai Refresh seiyavum!
        </div>
      )}
    </div>
  );

  if (loading && (!items || items.length === 0)) {
    return (
      <div style={{ maxWidth: 760, margin: '40px auto', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p className="muted">Loading notifications...</p>
      </div>
    );
  }

  if (!items || !items.length) {
    return (
      <div style={{ width: '100%', maxWidth: '100%', margin: '0', boxSizing: 'border-box' }}>
        <h1 style={{ margin: '0 0 20px', fontSize: 24 }}>🔔 Notifications</h1>
        {renderPushBanner()}
        <div className="empty-state card" style={{ padding: 48, textAlign: 'center' }}>
          <span className="emoji" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🔔</span>
          <h3 style={{ margin: '0 0 8px' }}>No notifications yet</h3>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            When meaningful updates about your orders, table bookings, or account security occur, they will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '16px 0', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>🔔 Notifications</h1>
        <button
          className="btn btn-sm btn-secondary"
          onClick={handleMarkAllRead}
        >
          Mark all read
        </button>
      </div>

      {renderPushBanner()}

      {paginatedItems.map(n => (
        <div
          key={n.id}
          className="card"
          style={{
            padding: 16,
            marginBottom: 10,
            opacity: n.read ? 0.7 : 1,
            borderLeft: n.read ? '3px solid transparent' : '3px solid var(--accent)',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
          onClick={() => handleNotificationClick(n)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <strong style={{ fontSize: 15 }}>{n.title}</strong>
            <button
              className="icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                dispatch(deleteNotification(n.id));
              }}
              title="Dismiss"
            >
              🗑️
            </button>
          </div>
          <p className="muted" style={{ margin: '6px 0 8px', fontSize: 13.5 }}>{n.message}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 11 }}>
              {new Date(n.at).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
            {n.actionUrl && (
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                View details →
              </span>
            )}
          </div>
        </div>
      ))}

      <Pagination
        currentPage={currentPage}
        totalItems={items.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        }}
        itemName="notifications"
      />
    </div>
  );
}
