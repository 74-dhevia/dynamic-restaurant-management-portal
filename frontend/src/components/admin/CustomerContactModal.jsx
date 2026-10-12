import React, { useState } from 'react';
import Icon from '../Icon';
import SafeImage from '../SafeImage';

export default function CustomerContactModal({
  isOpen,
  onClose,
  customer,
  onSendMessage,
}) {
  if (!isOpen || !customer) return null;

  const [channel, setChannel] = useState('in_app'); // 'in_app' | 'email' | 'whatsapp' | 'sms'
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const templates = [
    {
      title: 'Order Status Update',
      subject: 'Update on your ZESTRO Order',
      body: `Hi ${customer.fullName},\n\nWe wanted to let you know that our culinary team is giving special care to your order. It is moving smoothly through our kitchen stations!`,
    },
    {
      title: 'Table Reservation Check-In',
      subject: 'Your ZESTRO Table Reservation',
      body: `Dear ${customer.fullName},\n\nWe are delighted to confirm that your dining table is being reserved and prepped according to your preferences. We look forward to hosting you!`,
    },
    {
      title: 'Kitchen Delay Apology & Voucher',
      subject: 'Important update regarding your recent order',
      body: `Dear ${customer.fullName},\n\nWe sincerely apologize for the delay caused by an unexpected kitchen equipment calibration. To make this right, we have credited ₹100 DinePoints to your loyalty wallet.`,
    },
    {
      title: 'Support Issue Resolution',
      subject: 'Resolution of your recent support inquiry',
      body: `Hi ${customer.fullName},\n\nOur operations desk has reviewed your inquiry and resolved the issue. Please let us know if there is anything else we can do to make your dining experience memorable!`,
    },
  ];

  const handleApplyTemplate = (tmpl) => {
    setSubject(tmpl.subject);
    setMessage(tmpl.body);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      await onSendMessage({
        channel: channel === 'in_app' ? 'In-App' : channel.toUpperCase(),
        subject: subject || 'Customer Support Notification',
        message: message.trim(),
      });
      setFeedback({
        type: 'success',
        text: channel === 'in_app'
          ? 'In-app notification delivered to active diner session!'
          : `Message queued via ${channel.toUpperCase()} dispatch interface! (Simulation mode)`,
      });
      setTimeout(() => {
        setFeedback(null);
        setSending(false);
        onClose();
      }, 1400);
    } catch {
      setSending(false);
      setFeedback({ type: 'error', text: 'Failed to dispatch message. Please retry.' });
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="admin-modal-card customer-contact-modal"
        style={{ maxWidth: 640 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: '#4361ee' }}>
              <Icon name="mail" size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>Contact Customer</h3>
              <p className="sub" style={{ margin: 0 }}>
                Direct communication interface for {customer.fullName}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="modal-body-scroll" style={{ padding: 20 }}>
          {/* Customer Overview Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'var(--bg-elevated)',
              borderRadius: 10,
              marginBottom: 18,
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              {customer.avatar ? (
                <SafeImage
                  image={customer.avatar}
                  alt={customer.fullName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="cust-avatar-fallback" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: '#fff', fontWeight: 800 }}>
                  {(customer.fullName?.[0] || 'C').toUpperCase()}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14.5 }}>{customer.fullName}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {customer.email} {customer.phone ? `• ${customer.phone}` : ''}
              </div>
            </div>
            <span className="tier-badge-pill" style={{ fontSize: 11 }}>
              {customer.tier || 'Member'} Tier
            </span>
          </div>

          {/* Channel Selector */}
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            Communication Channel
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              className={`btn btn-sm ${channel === 'in_app' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setChannel('in_app')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', gap: 4 }}
            >
              <Icon name="notifications" size={16} />
              <span style={{ fontSize: 11.5, fontWeight: 700 }}>In-App Push</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${channel === 'email' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setChannel('email')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', gap: 4 }}
            >
              <Icon name="mail" size={16} />
              <span style={{ fontSize: 11.5, fontWeight: 700 }}>Email</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${channel === 'whatsapp' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setChannel('whatsapp')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', gap: 4 }}
            >
              <span style={{ fontSize: 15 }}>💬</span>
              <span style={{ fontSize: 11.5, fontWeight: 700 }}>WhatsApp</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${channel === 'sms' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setChannel('sms')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', gap: 4 }}
            >
              <span style={{ fontSize: 15 }}>📱</span>
              <span style={{ fontSize: 11.5, fontWeight: 700 }}>SMS</span>
            </button>
          </div>

          {/* Integration Status Notice */}
          {channel !== 'in_app' && (
            <div
              style={{
                fontSize: 12,
                color: '#854d0e',
                background: '#fef9c3',
                border: '1px solid #fde047',
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>ℹ️</span>
              <span>
                <strong>Integration Ready:</strong> Formatted for {channel.toUpperCase()} gateway. Simulated dispatch will record to customer activity and notification history.
              </span>
            </div>
          )}

          {/* Preset Templates */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
              Quick Templates
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {templates.map(tmpl => (
                <button
                  key={tmpl.title}
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={() => handleApplyTemplate(tmpl)}
                  style={{ borderRadius: 6, fontSize: 11 }}
                >
                  + {tmpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Subject & Message Fields */}
          <form onSubmit={handleSend}>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>
                Subject / Title
              </label>
              <input
                type="text"
                className="admin-search-input"
                style={{ width: '100%', borderRadius: 8 }}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Update regarding your dining booking..."
              />
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>
                Message Content
              </label>
              <textarea
                rows={5}
                required
                className="admin-search-input"
                style={{ width: '100%', height: 'auto', borderRadius: 8, padding: 10, resize: 'vertical' }}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type your message to the customer here..."
              />
            </div>

            {feedback && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  marginBottom: 14,
                  fontSize: 12.5,
                  fontWeight: 600,
                  background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: feedback.type === 'success' ? '#047857' : '#b91c1c',
                  border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                }}
              >
                {feedback.text}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={onClose}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={sending || !message.trim()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {sending ? 'Dispatching...' : `Send ${channel === 'in_app' ? 'In-App' : channel.toUpperCase()}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
