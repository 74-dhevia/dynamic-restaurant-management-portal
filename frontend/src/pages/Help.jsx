import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { issueApiService, ISSUE_TYPES, ISSUE_PRIORITIES } from '../services/issueApiService';
import { useToast } from '../contexts/ToastContext';

const FAQS = [
  { q: 'How do I track my order?', a: 'Go to Orders and tap Track on any active order to see live status.' },
  { q: 'Can I cancel my order?', a: 'Yes, orders can be cancelled before the restaurant starts preparing them, from the Orders page.' },
  { q: 'How does the Demo OTP work?', a: 'Since ZESTRO has no backend, OTP verification uses a fixed demo code (123456) shown on screen — no real SMS is sent.' },
  { q: 'How do I redeem DinePoints?', a: 'At checkout, toggle "Redeem DinePoints" in your Cart to apply available points as a discount.' },
  { q: 'Can I modify a table booking?', a: 'Yes, from My Bookings > Upcoming, tap Modify before your reservation time.' },
];

export default function Help() {
  const { showToast } = useToast();
  const currentUser = useSelector((s) => s.auth?.currentUser);
  const orders = useSelector((s) => s.order?.orders || []);
  const bookings = useSelector((s) => s.booking?.bookings || []);

  const [activeTab, setActiveTab] = useState('faq'); // 'faq' | 'report' | 'my-issues'
  const [openFaq, setOpenFaq] = useState(null);

  // Form State
  const [issueType, setIssueType] = useState('Order Problem');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);

  // My Issues State
  const [myIssues, setMyIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  const loadMyIssues = async () => {
    try {
      setLoadingIssues(true);
      const all = await issueApiService.getIssues();
      const filtered = all.filter((i) => {
        if (!currentUser) return true; // show all created on device if guest
        return (
          i.customerId === currentUser.id ||
          (i.customerEmail && i.customerEmail.toLowerCase() === currentUser.email?.toLowerCase())
        );
      });
      setMyIssues(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingIssues(false);
    }
  };

  useEffect(() => {
    loadMyIssues();
  }, [currentUser]);

  const handleSubmitProblem = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please describe the problem you experienced', 'info');
      return;
    }

    setSubmitting(true);
    try {
      const selectedOrder = orders.find((o) => o.id === selectedOrderId);
      const selectedBooking = bookings.find((b) => b.id === selectedBookingId);

      const newIssue = await issueApiService.createIssue({
        customerId: currentUser?.id || 'u_guest',
        customerName: currentUser?.fullName || 'Guest Diner',
        customerEmail: currentUser?.email || 'customer@example.com',
        customerPhone: currentUser?.phone || '',
        orderId: selectedOrderId || null,
        bookingId: selectedBookingId || null,
        restaurantName:
          selectedOrder?.restaurantName || selectedBooking?.restaurantName || 'ZESTRO Partner',
        issueType,
        subject: subject.trim() || issueType,
        description: description.trim(),
        priority,
      });

      showToast(`Support Ticket #${newIssue.id} created! Our team is reviewing it.`, 'success');
      setSubject('');
      setDescription('');
      setSelectedOrderId('');
      setSelectedBookingId('');
      setActiveTab('my-issues');
      loadMyIssues();
    } catch (err) {
      console.error(err);
      showToast('Failed to submit ticket. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '10px 0 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '26px' }}>❓ Help &amp; Support Center</h1>
        <p className="muted" style={{ margin: 0 }}>
          Find quick answers, report dining or delivery issues, and track resolutions.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="chip-row"
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px',
        }}
      >
        <button
          type="button"
          className={`chip ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveTab('faq')}
          style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '20px' }}
        >
          📖 Frequently Asked Questions
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
          style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '20px' }}
        >
          ⚠️ Report a Problem
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'my-issues' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('my-issues');
            loadMyIssues();
          }}
          style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '20px' }}
        >
          🛡️ My Issues {myIssues.length > 0 && `(${myIssues.length})`}
        </button>
      </div>

      {/* TAB 1: FAQ ACCORDION */}
      {activeTab === 'faq' && (
        <div>
          {FAQS.map((f, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: '16px',
                marginBottom: '10px',
                cursor: 'pointer',
                borderRadius: '10px',
                transition: 'background 0.2s',
              }}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '15px' }}>{f.q}</strong>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  {openFaq === i ? '▲' : '▼'}
                </span>
              </div>
              {openFaq === i && (
                <p className="muted" style={{ marginTop: '10px', fontSize: '14px', lineHeight: '1.5' }}>
                  {f.a}
                </p>
              )}
            </div>
          ))}

          <div
            className="card"
            style={{
              padding: '20px',
              marginTop: '20px',
              textAlign: 'center',
              background: 'rgba(255, 123, 0, 0.05)',
              border: '1px solid rgba(255, 123, 0, 0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0' }}>Need personal assistance?</h3>
            <p className="muted" style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
              Have an issue with your meal, payment, or delivery? Our Operations team is ready to assist.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveTab('report')}
            >
              Report a Problem Now →
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: REPORT A PROBLEM FORM */}
      {activeTab === 'report' && (
        <div className="card" style={{ padding: '24px', borderRadius: '12px' }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>Report an Issue</h2>
          <p className="muted" style={{ margin: '0 0 20px 0', fontSize: '13px' }}>
            Submit details regarding an order, reservation, or payment for Admin review.
          </p>

          <form onSubmit={handleSubmitProblem}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              {/* Issue Type */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Problem Category *
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="input"
                  style={{ width: '100%', height: '40px', borderRadius: '8px', padding: '0 10px' }}
                >
                  {ISSUE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Urgency Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="input"
                  style={{ width: '100%', height: '40px', borderRadius: '8px', padding: '0 10px' }}
                >
                  {ISSUE_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Related Order or Booking Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Connected Order (Optional)
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="input"
                  style={{ width: '100%', height: '40px', borderRadius: '8px', padding: '0 10px' }}
                >
                  <option value="">None / Not an order issue</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.id} — {o.restaurantName} (₹{o.grandTotal})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Connected Booking (Optional)
                </label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="input"
                  style={{ width: '100%', height: '40px', borderRadius: '8px', padding: '0 10px' }}
                >
                  <option value="">None / Not a booking issue</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.id} — {b.restaurantName} ({b.date})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Summary / Subject
              </label>
              <input
                type="text"
                placeholder="e.g. Order delayed / missing item / cold food"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input"
                style={{ width: '100%', height: '40px', borderRadius: '8px', padding: '0 12px' }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Detailed Description *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Please describe what occurred so we can resolve this swiftly..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontWeight: 700, borderRadius: '8px' }}
            >
              {submitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MY ISSUES */}
      {activeTab === 'my-issues' && (
        <div>
          {loadingIssues ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <p className="muted">Loading support tickets...</p>
            </div>
          ) : myIssues.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛡️</div>
              <h3 style={{ margin: '0 0 6px 0' }}>No customer issues yet.</h3>
              <p className="muted" style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
                You have not reported any issues. If you encounter any problems, we are here to help!
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setActiveTab('report')}
              >
                Report a Problem
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {myIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="card"
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>
                          Ticket #{issue.id}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background:
                              issue.status === 'Resolved' || issue.status === 'Closed'
                                ? 'rgba(46, 204, 113, 0.15)'
                                : 'rgba(251, 133, 0, 0.15)',
                            color:
                              issue.status === 'Resolved' || issue.status === 'Closed'
                                ? '#2ecc71'
                                : '#fb8500',
                          }}
                        >
                          ● {issue.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>
                        {issue.subject || issue.issueType}
                      </div>
                      <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                        Created: {new Date(issue.reportedAt).toLocaleDateString()} • {issue.restaurantName}
                        {issue.orderId && ` • Order #${issue.orderId}`}
                        {issue.bookingId && ` • Booking #${issue.bookingId}`}
                      </div>
                    </div>
                    {issue.resolvedAt && (
                      <span className="muted" style={{ fontSize: '12px' }}>
                        Resolved: {new Date(issue.resolvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '12px 0', fontSize: '14px', lineHeight: '1.5', color: 'var(--text-muted)' }}>
                    {issue.description}
                  </p>

                  {/* Admin Responses */}
                  {issue.adminResponses && issue.adminResponses.length > 0 && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255, 123, 0, 0.06)',
                        border: '1px solid rgba(255, 123, 0, 0.2)',
                        marginTop: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#ff7b00' }}>
                          💬 Admin Response
                        </span>
                        <span className="muted" style={{ fontSize: '11px' }}>
                          {new Date(issue.adminResponses[issue.adminResponses.length - 1].sentAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text)' }}>
                        {issue.adminResponses[issue.adminResponses.length - 1].message}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
