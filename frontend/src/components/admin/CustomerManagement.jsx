import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Icon from '../Icon';
import SafeImage from '../SafeImage';
import ConfirmationModal from '../ConfirmationModal';
import Pagination from '../Pagination';
import CustomerContactModal from './CustomerContactModal';
import CustomerIssueModal from './CustomerIssueModal';
import { customerApiService } from '../../services/customerApiService';
import { setCustomerStatus } from '../../redux/slices/authSlice';
import { logActivity } from '../../redux/slices/activitySlice';
import { useToast } from '../../contexts/ToastContext';

export default function CustomerManagement({
  subId,
  onOpenOrder,
  onOpenBooking,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Redux Subscriptions
  const reduxUsers = useSelector(s => s.auth?.users || []);
  const reduxOrders = useSelector(s => s.order?.orders || []);
  const reduxBookings = useSelector(s => s.booking?.bookings || []);
  const reduxReviews = useSelector(s => s.review?.reviews || []);

  // UI State: Loading, Error, Retry
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [activityFilter, setActivityFilter] = useState('all'); // 'all' | 'has-orders' | 'has-bookings' | 'both' | 'no-activity'
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'this-week' | 'this-month' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Customer List Data
  const [customers, setCustomers] = useState([]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, activityFilter, dateFilter, customDate]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return customers.slice(start, start + pageSize);
  }, [customers, currentPage, pageSize]);

  // Selected Customer for 360° View
  const [selectedCustomerId, setSelectedCustomerId] = useState(subId || null);
  const [activeCustomerData, setActiveCustomerData] = useState(null);
  const [detailsTab, setDetailsTab] = useState('orders'); // 'orders' | 'bookings' | 'timeline' | 'recently_accessed' | 'wishlists' | 'reviews' | 'issues' | 'notifications'

  // Customer 360° Data States
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [customerReviews, setCustomerReviews] = useState([]);
  const [customerIssues, setCustomerIssues] = useState([]);
  const [customerActivity, setCustomerActivity] = useState([]);
  const [customerRecent, setCustomerRecent] = useState([]);
  const [customerWishlist, setCustomerWishlist] = useState({ foodWishlist: [], restaurantWishlist: [] });
  const [customerNotifs, setCustomerNotifs] = useState([]);

  // Modals
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [customerToToggle, setCustomerToToggle] = useState(null);

  // Fetch / Sync Customers
  const loadCustomersData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerApiService.getCustomers({
        search: searchQuery,
        status: statusFilter,
        activity: activityFilter,
        date: dateFilter,
        customDate,
      });
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, activityFilter, dateFilter, customDate]);

  // Initial and reactive load
  useEffect(() => {
    loadCustomersData();
  }, [loadCustomersData, reduxUsers, reduxOrders, reduxBookings]);

  // Synchronize subId parameter from URL (/admin/customers/:customerId)
  useEffect(() => {
    if (subId) {
      setSelectedCustomerId(subId);
    } else {
      setSelectedCustomerId(null);
    }
  }, [subId]);

  // Load individual Customer 360° data when a customer is selected
  useEffect(() => {
    let isMounted = true;
    async function load360Data() {
      if (!selectedCustomerId) {
        setActiveCustomerData(null);
        return;
      }
      try {
        const cust = await customerApiService.getCustomerById(selectedCustomerId);
        if (!isMounted) return;
        setActiveCustomerData(cust);

        if (cust) {
          const [ords, bks, revs, isss, acts, recs, wls, notifs] = await Promise.all([
            customerApiService.getCustomerOrders(cust.id),
            customerApiService.getCustomerBookings(cust.id),
            customerApiService.getCustomerReviews(cust.id),
            customerApiService.getCustomerIssues(cust.id),
            customerApiService.getCustomerActivity(cust.id),
            customerApiService.getCustomerRecentlyAccessed(cust.id),
            customerApiService.getCustomerWishlist(cust.id),
            customerApiService.getCustomerNotifications(cust.id),
          ]);
          if (!isMounted) return;
          setCustomerOrders(ords);
          setCustomerBookings(bks);
          setCustomerReviews(revs);
          setCustomerIssues(isss);
          setCustomerActivity(acts);
          setCustomerRecent(recs);
          setCustomerWishlist(wls);
          setCustomerNotifs(notifs);
        }
      } catch (err) {
        console.error('Error loading Customer 360 data:', err);
      }
    }
    load360Data();
    return () => { isMounted = false; };
  }, [selectedCustomerId, reduxOrders, reduxBookings, reduxReviews]);

  // Summary KPIs (Requirement 2) - Calculated from actual data, shows '--' if unavailable
  const summaryKPIs = useMemo(() => {
    if (customers.length === 0) {
      return { total: '--', newCust: '--', active: '--', withOrders: '--', withBookings: '--' };
    }
    const total = customers.length;
    const now = new Date();
    const thirtyDaysAgo = now.getTime() - 30 * 86400000;
    const newCust = customers.filter(c => new Date(c.createdAt || 0).getTime() >= thirtyDaysAgo).length;
    const active = customers.filter(c => (c.status || 'Active').toLowerCase() === 'active').length;
    const withOrders = customers.filter(c => c.ordersCount > 0).length;
    const withBookings = customers.filter(c => c.bookingsCount > 0).length;

    return {
      total: total > 0 ? total : '--',
      newCust: newCust > 0 ? newCust : (total > 0 ? 0 : '--'),
      active: active > 0 ? active : (total > 0 ? 0 : '--'),
      withOrders: withOrders > 0 ? withOrders : (total > 0 ? 0 : '--'),
      withBookings: withBookings > 0 ? withBookings : (total > 0 ? 0 : '--'),
    };
  }, [customers]);

  // Handle Opening Customer 360° Profile
  const handleOpenCustomer = (customer) => {
    setSelectedCustomerId(customer.id);
    navigate(`/admin/customers/${customer.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Returning to Customers List
  const handleBackToList = () => {
    setSelectedCustomerId(null);
    setActiveCustomerData(null);
    navigate('/admin/customers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Customer Status Toggle (Deactivate / Activate with confirmation)
  const handlePromptToggleStatus = (cust) => {
    setCustomerToToggle(cust);
    if ((cust.status || 'Active').toLowerCase() === 'active') {
      setDeactivateConfirmOpen(true);
    } else {
      executeToggleStatus(cust, 'Active');
    }
  };

  const executeToggleStatus = async (cust, nextStatus) => {
    try {
      await customerApiService.updateCustomerStatus(cust.id, nextStatus);
      dispatch(setCustomerStatus({ customerId: cust.id, status: nextStatus }));
      dispatch(logActivity({
        action: `${nextStatus === 'Active' ? 'Activated' : 'Deactivated'} Customer Account`,
        entity: cust.fullName,
        entityType: 'Customer',
        prevValue: cust.status || 'Active',
        newValue: nextStatus,
      }));
      showToast(`Customer account for ${cust.fullName} is now ${nextStatus}`, 'success');
      setDeactivateConfirmOpen(false);
      setCustomerToToggle(null);
      loadCustomersData();
      if (activeCustomerData && activeCustomerData.id === cust.id) {
        setActiveCustomerData(prev => ({ ...prev, status: nextStatus }));
      }
    } catch {
      showToast('Failed to update customer status', 'error');
    }
  };

  // Handle Dispatching Customer In-App / Simulated Message
  const handleSendMessage = async (msgData) => {
    if (!activeCustomerData) return;
    await customerApiService.sendCustomerMessage(activeCustomerData.id, msgData);
    dispatch(logActivity({
      action: `Sent ${msgData.channel} Message to Customer`,
      entity: activeCustomerData.fullName,
      entityType: 'Customer Communication',
      prevValue: 'None',
      newValue: msgData.subject,
    }));
    // Refresh notifications and timeline
    const updatedNotifs = await customerApiService.getCustomerNotifications(activeCustomerData.id);
    setCustomerNotifs(updatedNotifs);
    const updatedActs = await customerApiService.getCustomerActivity(activeCustomerData.id);
    setCustomerActivity(updatedActs);
    showToast(`Message logged to ${activeCustomerData.fullName}'s communication history`, 'success');
  };

  // Handle Updating Customer Issue Status
  const handleUpdateIssueStatus = async (issueId, newStatus, adminNote) => {
    await customerApiService.updateIssueStatus(issueId, newStatus, adminNote);
    dispatch(logActivity({
      action: `Updated Support Issue #${issueId}`,
      entity: activeCustomerData?.fullName || issueId,
      entityType: 'Customer Support',
      prevValue: 'Status Update',
      newValue: newStatus,
    }));
    if (activeCustomerData) {
      const updatedIssues = await customerApiService.getCustomerIssues(activeCustomerData.id);
      setCustomerIssues(updatedIssues);
      const updatedActs = await customerApiService.getCustomerActivity(activeCustomerData.id);
      setCustomerActivity(updatedActs);
    }
    showToast(`Issue #${issueId} status updated to ${newStatus}`, 'success');
  };

  // Export Customer List as CSV
  const handleExportCSV = () => {
    if (customers.length === 0) {
      showToast('No customers available to export', 'error');
      return;
    }
    const headers = ['Customer ID', 'Full Name', 'Email', 'Phone', 'Orders', 'Bookings', 'Total Spent', 'Tier', 'Status', 'Last Active'];
    const rows = customers.map(c => [
      c.id,
      `"${c.fullName || ''}"`,
      c.email,
      c.phone || '',
      c.ordersCount,
      c.bookingsCount,
      c.totalSpent,
      c.tier || 'Member',
      c.status || 'Active',
      `"${c.lastActive || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zestro_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Customer directory exported successfully!', 'success');
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setActivityFilter('all');
    setDateFilter('all');
    setCustomDate('');
    showToast('Customer filters reset', 'info');
  };

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) +
    (activityFilter !== 'all' ? 1 : 0) +
    (dateFilter !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0);

  // =========================================================================
  // VIEW A: CUSTOMER 360° OVERVIEW (Requirements 6-23)
  // =========================================================================
  if (selectedCustomerId && activeCustomerData) {
    const cust = activeCustomerData;
    const completedOrdersCount = customerOrders.filter(o => o.status === 'Delivered').length;
    const cancelledOrdersCount = customerOrders.filter(o => o.cancelled || o.status === 'Cancelled').length;
    const completedBookingsCount = customerBookings.filter(b => b.status === 'Completed').length;
    const cancelledBookingsCount = customerBookings.filter(b => b.status === 'Cancelled' || b.status === 'No Show').length;
    const totalSpentAmount = customerOrders.reduce((sum, o) => sum + (o.cancelled ? 0 : (o.grandTotal || 0)), 0);

    return (
      <div className="admin-view-fade customer-360-view">
        {/* Breadcrumb Navigation */}
        <div className="view-header-row" style={{ alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
              <button
                type="button"
                className="btn btn-link btn-xs"
                onClick={handleBackToList}
                style={{ padding: 0, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <Icon name="chevron-left" size={14} /> Back to Customers
              </button>
              <span>/</span>
              <span>Customer 360°</span>
              <span>/</span>
              <strong style={{ color: 'var(--text)' }}>{cust.fullName}</strong>
            </div>
            <h1 className="view-title" style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
              {cust.fullName} — 360° Profile
            </h1>
            <p className="view-sub" style={{ margin: '4px 0 0', fontSize: 13.5 }}>
              Comprehensive dining history, orders, reservations, live activity, and support tickets
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setContactModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <Icon name="mail" size={16} color="var(--accent)" />
              <span>Contact Customer</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm ${(cust.status || 'Active').toLowerCase() === 'active' ? 'btn-danger-outline' : 'btn-success'}`}
              onClick={() => handlePromptToggleStatus(cust)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <Icon name={(cust.status || 'Active').toLowerCase() === 'active' ? 'close' : 'check'} size={15} />
              <span>{(cust.status || 'Active').toLowerCase() === 'active' ? 'Deactivate Customer' : 'Activate Customer'}</span>
            </button>
          </div>
        </div>

        {/* 7. CUSTOMER PROFILE CARD */}
        <div className="card customer-profile-hero" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="cust-avatar-large" style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '3px solid var(--border)' }}>
              {cust.avatar ? (
                <SafeImage
                  image={cust.avatar}
                  alt={cust.fullName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: '#fff', fontSize: 32, fontWeight: 900 }}>
                  {(cust.fullName?.[0] || 'C').toUpperCase()}
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>{cust.fullName}</h2>
                <span className={`status-pill ${(cust.status || 'Active').toLowerCase() === 'active' ? 'success' : 'danger'}`}>
                  {cust.status || 'Active'}
                </span>
                <span className="tier-badge-pill" style={{ background: '#4361ee', color: '#fff', fontWeight: 800 }}>
                  ★ {cust.tier || 'Gold'} Member
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)' }}>
                  {cust.dinePoints || 100} DinePoints
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                <div>
                  <strong style={{ color: 'var(--text)' }}>Email:</strong> {cust.email}
                </div>
                <div>
                  <strong style={{ color: 'var(--text)' }}>Phone:</strong> {cust.phone || '—'}
                </div>
                <div>
                  <strong style={{ color: 'var(--text)' }}>Joined:</strong> {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Jan 2024'}
                </div>
                <div>
                  <strong style={{ color: 'var(--text)' }}>Last Active:</strong> {cust.lastActive || 'Today'}
                </div>
              </div>

              {/* Saved Delivery Addresses */}
              {cust.addresses && cust.addresses.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12.5, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>Saved Addresses: </span>
                  {cust.addresses.map(a => `${a.label || a.type || 'Home'} (${typeof a === 'string' ? a : (a.text || a.address || '')})`).join(' • ')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 8. CUSTOMER STATISTICS (7-Card Live Metrics) */}
        <div className="perf-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div className="card perf-metric-card" style={{ padding: 14 }}>
            <div className="metric-val" style={{ color: 'var(--accent)', fontSize: 20, fontWeight: 900 }}>
              ₹{totalSpentAmount.toLocaleString('en-IN')}
            </div>
            <div className="metric-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Spent</div>
          </div>
          <div className="card perf-metric-card" style={{ padding: 14 }}>
            <div className="metric-val" style={{ fontSize: 20, fontWeight: 900 }}>{customerOrders.length}</div>
            <div className="metric-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Orders</div>
          </div>
          <div className="card perf-metric-card" style={{ padding: 14 }}>
            <div className="metric-val" style={{ color: 'var(--success)', fontSize: 20, fontWeight: 900 }}>
              {completedOrdersCount}
            </div>
            <div className="metric-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Completed Orders</div>
          </div>
          <div className="card perf-metric-card" style={{ padding: 14 }}>
            <div className="metric-val" style={{ color: cancelledOrdersCount > 0 ? 'var(--danger)' : 'var(--text-muted)', fontSize: 20, fontWeight: 900 }}>
              {cancelledOrdersCount}
            </div>
            <div className="metric-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cancelled Orders</div>
          </div>
          <div className="card perf-metric-card" style={{ padding: 14 }}>
            <div className="metric-val" style={{ fontSize: 20, fontWeight: 900 }}>{customerBookings.length}</div>
            <div className="metric-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Bookings</div>
          </div>
          <div className="card perf-metric-card" style={{ padding: 14 }}>
            <div className="metric-val" style={{ color: 'var(--success)', fontSize: 20, fontWeight: 900 }}>
              {completedBookingsCount}
            </div>
            <div className="metric-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Completed Bookings</div>
          </div>
          <div className="card perf-metric-card" style={{ padding: 14 }}>
            <div className="metric-val" style={{ color: cancelledBookingsCount > 0 ? 'var(--danger)' : 'var(--text-muted)', fontSize: 20, fontWeight: 900 }}>
              {cancelledBookingsCount}
            </div>
            <div className="metric-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cancelled Bookings</div>
          </div>
        </div>

        {/* 360° Navigation Tabs */}
        <div className="admin-tabs-nav" style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--border)', marginBottom: 20, overflowX: 'auto', paddingBottom: 6 }}>
          {[
            { id: 'orders', label: `Order History (${customerOrders.length})`, icon: 'orders' },
            { id: 'bookings', label: `Booking History (${customerBookings.length})`, icon: 'calendar' },
            { id: 'timeline', label: `Activity Timeline (${customerActivity.length})`, icon: 'pulse' },
            { id: 'recently_accessed', label: `Recently Accessed (${customerRecent.length})`, icon: 'clock' },
            { id: 'wishlists', label: `Wishlists (${(customerWishlist.foodWishlist?.length || 0) + (customerWishlist.restaurantWishlist?.length || 0)})`, icon: 'heart' },
            { id: 'reviews', label: `Customer Reviews (${customerReviews.length})`, icon: 'reviews' },
            { id: 'issues', label: `Support Issues (${customerIssues.length})`, icon: 'alert-triangle' },
            { id: 'notifications', label: `Notification History (${customerNotifs.length})`, icon: 'notifications' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`btn btn-sm ${detailsTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setDetailsTab(tab.id)}
              style={{
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: detailsTab === tab.id ? 800 : 600,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name={tab.icon} size={15} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: ORDER HISTORY (Requirement 9 & 22) */}
        {detailsTab === 'orders' && (
          <div className="card table-container-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Order History</h3>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Click any Order ID to open full order operations
              </span>
            </div>

            {customerOrders.length === 0 ? (
              <div className="empty-state" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Icon name="orders" size={32} color="var(--text-muted)" />
                <p style={{ marginTop: 8, fontWeight: 700 }}>This customer has no orders yet</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Restaurant</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerOrders.map(o => {
                      const isAffectedByIncident = o.incident && o.incident.reported;
                      return (
                        <React.Fragment key={o.id}>
                          <tr>
                            <td>
                              <button
                                type="button"
                                className="btn btn-link btn-xs"
                                style={{ fontWeight: 800, padding: 0 }}
                                onClick={() => onOpenOrder ? onOpenOrder(o.id) : navigate(`/admin/orders/${o.id}`)}
                              >
                                #{o.id}
                              </button>
                            </td>
                            <td><strong>{o.restaurantName}</strong></td>
                            <td style={{ maxWidth: 220, fontSize: 12.5 }} className="truncate-cell">
                              {o.items?.map(i => `${i.name} × ${i.qty || i.quantity || 1}`).join(', ') || 'Dishes'}
                            </td>
                            <td><strong style={{ color: 'var(--accent)' }}>₹{o.grandTotal}</strong></td>
                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {o.placedAt || o.createdAt ? new Date(o.placedAt || o.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                            </td>
                            <td>
                              <span className={`status-pill ${o.cancelled ? 'danger' : isAffectedByIncident ? 'warning' : 'success'}`}>
                                {o.status}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                onClick={() => onOpenOrder ? onOpenOrder(o.id) : navigate(`/admin/orders/${o.id}`)}
                              >
                                Details
                              </button>
                            </td>
                          </tr>

                          {/* 22. Kitchen Incident Warning Row */}
                          {isAffectedByIncident && (
                            <tr style={{ background: '#fffbeb' }}>
                              <td colSpan={7} style={{ padding: '10px 16px', borderLeft: '4px solid #f59e0b' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Icon name="alert-triangle" size={18} color="#b45309" />
                                    <div>
                                      <strong style={{ color: '#b45309', fontSize: 13 }}>
                                        Kitchen Incident Affected This Order
                                      </strong>
                                      <div style={{ fontSize: 12, color: '#92400e' }}>
                                        Status: <strong>Temporarily Paused</strong> • Reason: {o.incident.reason || 'Unexpected kitchen incident'} • Admin Action: <strong>Customer notification required</strong>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-primary"
                                    onClick={() => setContactModalOpen(true)}
                                    style={{ borderRadius: 6, fontWeight: 700 }}
                                  >
                                    Notify Diner
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BOOKING HISTORY (Requirement 10) */}
        {detailsTab === 'bookings' && (
          <div className="card table-container-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Booking History</h3>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Clicking a booking opens its reservation details
              </span>
            </div>

            {customerBookings.length === 0 ? (
              <div className="empty-state" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Icon name="calendar" size={32} color="var(--text-muted)" />
                <p style={{ marginTop: 8, fontWeight: 700 }}>This customer has no table bookings yet</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Restaurant</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Guests</th>
                      <th>Table</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerBookings.map(b => (
                      <tr key={b.id}>
                        <td>
                          <button
                            type="button"
                            className="btn btn-link btn-xs"
                            style={{ fontWeight: 800, padding: 0 }}
                            onClick={() => onOpenBooking ? onOpenBooking(b.id) : navigate(`/admin/bookings/${b.id}`)}
                          >
                            #{b.id}
                          </button>
                        </td>
                        <td><strong>{b.restaurantName}</strong></td>
                        <td style={{ fontSize: 12.5 }}>{b.date}</td>
                        <td style={{ fontSize: 12.5 }}>{b.time}</td>
                        <td>{b.guests} Guests</td>
                        <td><strong>{b.tableNumber || b.tableId || 'T-12'}</strong></td>
                        <td>
                          <span className={`status-pill ${b.status === 'Cancelled' ? 'danger' : 'success'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => onOpenBooking ? onOpenBooking(b.id) : navigate(`/admin/bookings/${b.id}`)}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACTIVITY TIMELINE (Requirement 12) */}
        {detailsTab === 'timeline' && (
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Activity Timeline</h3>

            {customerActivity.length === 0 ? (
              <div className="empty-state" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Icon name="pulse" size={32} color="var(--text-muted)" />
                <p style={{ marginTop: 8, fontWeight: 700 }}>No recent activity</p>
              </div>
            ) : (
              <div className="customer-timeline-wrapper" style={{ paddingLeft: 10, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 24, width: 2, background: 'var(--border)' }} />
                {customerActivity.map((evt, idx) => (
                  <div key={evt.id || idx} style={{ display: 'flex', gap: 16, marginBottom: 18, position: 'relative' }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'var(--bg-elevated)',
                        border: '2px solid var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={evt.icon || 'pulse'} size={15} color="var(--accent)" />
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <strong style={{ fontSize: 13.5 }}>{evt.title}</strong>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)' }}>
                          {evt.dayHeader} • {evt.timeLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{evt.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RECENTLY ACCESSED (Requirement 11) */}
        {detailsTab === 'recently_accessed' && (
          <div className="card table-container-card" style={{ padding: 18 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Recently Accessed ZESTRO Content</h3>

            {customerRecent.length === 0 ? (
              <div className="empty-state" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Icon name="clock" size={32} color="var(--text-muted)" />
                <p style={{ marginTop: 8, fontWeight: 700 }}>No recent activity</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Type</th>
                      <th>Restaurant</th>
                      <th>Date / Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerRecent.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td><strong>{item.name}</strong></td>
                        <td>
                          <span className="tier-badge-pill" style={{ textTransform: 'capitalize' }}>
                            {item.type || 'Item'}
                          </span>
                        </td>
                        <td>{item.restaurantName || item.name}</td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                          {item.viewedAt || 'Recently'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: WISHLISTS (Requirement 13) */}
        {detailsTab === 'wishlists' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon name="food" size={18} color="var(--accent)" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Food Wishlist</h3>
              </div>
              {(!customerWishlist.foodWishlist || customerWishlist.foodWishlist.length === 0) ? (
                <p className="muted" style={{ fontSize: 13 }}>No dishes saved in wishlist yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Food Name</th>
                        <th>Restaurant</th>
                        <th>Added Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerWishlist.foodWishlist.map((f, i) => (
                        <tr key={f.id || i}>
                          <td><strong>{f.name}</strong></td>
                          <td>{f.restaurantName || 'Menu Item'}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.addedAt || 'Recent'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon name="restaurant" size={18} color="var(--accent)" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Restaurant Wishlist</h3>
              </div>
              {(!customerWishlist.restaurantWishlist || customerWishlist.restaurantWishlist.length === 0) ? (
                <p className="muted" style={{ fontSize: 13 }}>No restaurants saved in wishlist yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Restaurant</th>
                        <th>Added Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerWishlist.restaurantWishlist.map((r, i) => (
                        <tr key={r.id || i}>
                          <td><strong>{r.name}</strong></td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.addedAt || 'Recent'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: CUSTOMER REVIEWS (Requirement 14 & 15) */}
        {detailsTab === 'reviews' && (
          <div className="card table-container-card" style={{ padding: 18 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Reviews Written by Customer</h3>

            {customerReviews.length === 0 ? (
              <div className="empty-state" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Icon name="reviews" size={32} color="var(--text-muted)" />
                <p style={{ marginTop: 8, fontWeight: 700 }}>No reviews submitted yet</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Restaurant / Food</th>
                      <th>Rating</th>
                      <th>Review</th>
                      <th>Date</th>
                      <th>Verified Order</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerReviews.map(r => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.foodName || r.restaurantName}</strong>
                          {r.foodName && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{r.restaurantName}</div>}
                        </td>
                        <td style={{ color: '#ffb703', fontSize: 15 }}>
                          {'★'.repeat(r.rating || 5)}
                        </td>
                        <td style={{ maxWidth: 320, fontSize: 13 }}>"{r.comment}"</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.date}</td>
                        <td>
                          {r.isVerified ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: '#ecfdf5',
                                color: '#047857',
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              ✓ Verified Purchase
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className="status-pill success">{r.status || 'Approved'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: CUSTOMER ISSUES & SUPPORT (Requirement 16 & 17) */}
        {detailsTab === 'issues' && (
          <div className="card table-container-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Customer Issues &amp; Support Tickets</h3>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Click any issue to inspect details and update status
              </span>
            </div>

            {customerIssues.length === 0 ? (
              <div className="empty-state" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Icon name="alert-triangle" size={32} color="var(--text-muted)" />
                <p style={{ marginTop: 8, fontWeight: 700 }}>No reported issues</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Issue ID</th>
                      <th>Order</th>
                      <th>Issue</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Reported</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerIssues.map(iss => (
                      <tr key={iss.id}>
                        <td><strong>#{iss.id}</strong></td>
                        <td>
                          {iss.orderId ? (
                            <button
                              type="button"
                              className="btn btn-link btn-xs"
                              onClick={() => onOpenOrder ? onOpenOrder(iss.orderId) : navigate(`/admin/orders/${iss.orderId}`)}
                              style={{ padding: 0, fontWeight: 800 }}
                            >
                              #{iss.orderId}
                            </button>
                          ) : '—'}
                        </td>
                        <td>
                          <strong>{iss.issue}</strong>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', maxWidth: 220 }} className="truncate-cell">
                            {iss.description}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: iss.priority === 'Urgent' || iss.priority === 'High' ? '#fef2f2' : '#f0fdf4',
                              color: iss.priority === 'Urgent' || iss.priority === 'High' ? '#b91c1c' : '#15803d',
                            }}
                          >
                            {iss.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${iss.status === 'Resolved' || iss.status === 'Closed' ? 'success' : 'warning'}`}>
                            {iss.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {iss.reportedAt ? new Date(iss.reportedAt).toLocaleDateString('en-IN') : 'Recent'}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => {
                              setSelectedIssue(iss);
                              setIssueModalOpen(true);
                            }}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: NOTIFICATION HISTORY (Requirement 23) */}
        {detailsTab === 'notifications' && (
          <div className="card table-container-card" style={{ padding: 18 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Notification History</h3>

            {customerNotifs.length === 0 ? (
              <div className="empty-state" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Icon name="notifications" size={32} color="var(--text-muted)" />
                <p style={{ marginTop: 8, fontWeight: 700 }}>No notifications recorded</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Notification Type</th>
                      <th>Message</th>
                      <th>Channel</th>
                      <th>Date / Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerNotifs.map((n, idx) => (
                      <tr key={n.id || idx}>
                        <td><strong>{n.type}</strong></td>
                        <td style={{ fontSize: 13, maxWidth: 340 }}>{n.message}</td>
                        <td>
                          <span className="tier-badge-pill">{n.channel || 'In-App'}</span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {n.timestamp ? new Date(n.timestamp).toLocaleString('en-IN') : 'Recent'}
                        </td>
                        <td>
                          <span className={`status-pill ${n.status === 'Sent' ? 'success' : n.status === 'Pending' ? 'warning' : 'danger'}`}>
                            {n.status || 'Sent'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Contact Modal */}
        <CustomerContactModal
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          customer={cust}
          onSendMessage={handleSendMessage}
        />

        {/* Issue Modal */}
        <CustomerIssueModal
          isOpen={issueModalOpen}
          onClose={() => {
            setIssueModalOpen(false);
            setSelectedIssue(null);
          }}
          issue={selectedIssue}
          onUpdateStatus={handleUpdateIssueStatus}
          onOpenOrder={onOpenOrder}
        />

        {/* Deactivation Confirmation Modal */}
        <ConfirmationModal
          isOpen={deactivateConfirmOpen}
          title="Deactivate Customer Account"
          message="Are you sure you want to deactivate this customer account? Deactivating this account will prevent new order and booking placements. All historical order and booking records will remain fully preserved and accessible in the system."
          confirmText="Yes, Deactivate Account"
          confirmVariant="danger"
          onConfirm={() => executeToggleStatus(customerToToggle, 'Inactive')}
          onClose={() => {
            setDeactivateConfirmOpen(false);
            setCustomerToToggle(null);
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW B: CUSTOMERS DIRECTORY & SUMMARY LIST (Requirements 1-5)
  // =========================================================================
  return (
    <div className="admin-view-fade customer-management-view">
      {/* 1. Header with Title and Subtitle */}
      <div className="view-header-row" style={{ alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 className="view-title" style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
            Customers
          </h1>
          <p className="view-sub" style={{ margin: '4px 0 0', fontSize: 13.5 }}>
            Manage ZESTRO customers and view their activity.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            className={`btn btn-sm ${filterPanelOpen ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterPanelOpen(v => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Icon name="filter" size={15} />
            <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={handleExportCSV}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Icon name="download" size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. CUSTOMER SUMMARY KPI CARDS */}
      <div className="perf-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 18 }}>
        <div className="card perf-metric-card" style={{ padding: 14 }}>
          <div className="metric-val" style={{ color: 'var(--accent)', fontSize: 22, fontWeight: 900 }}>
            {summaryKPIs.total}
          </div>
          <div className="metric-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Customers</div>
        </div>

        <div className="card perf-metric-card" style={{ padding: 14 }}>
          <div className="metric-val" style={{ color: 'var(--success)', fontSize: 22, fontWeight: 900 }}>
            {summaryKPIs.newCust}
          </div>
          <div className="metric-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>New Customers</div>
        </div>

        <div className="card perf-metric-card" style={{ padding: 14 }}>
          <div className="metric-val" style={{ color: '#4361ee', fontSize: 22, fontWeight: 900 }}>
            {summaryKPIs.active}
          </div>
          <div className="metric-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active Customers</div>
        </div>

        <div className="card perf-metric-card" style={{ padding: 14 }}>
          <div className="metric-val" style={{ color: '#ffb703', fontSize: 22, fontWeight: 900 }}>
            {summaryKPIs.withOrders}
          </div>
          <div className="metric-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Customers with Orders</div>
        </div>

        <div className="card perf-metric-card" style={{ padding: 14 }}>
          <div className="metric-val" style={{ color: '#8338ec', fontSize: 22, fontWeight: 900 }}>
            {summaryKPIs.withBookings}
          </div>
          <div className="metric-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Customers with Bookings</div>
        </div>
      </div>

      {/* 4 & 5. SEARCH & FILTER PANEL */}
      <div className="card" style={{ padding: 14, marginBottom: 18 }}>
        {/* Search Input Bar */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="admin-search-input-wrap" style={{ flex: 1 }}>
            <span className="search-icon"><Icon name="search" size={16} /></span>
            <input
              type="text"
              className="admin-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search customers by Name, Email, Phone, Order ID (e.g. ZST-1024), Booking ID (e.g. BK-2048)..."
              style={{ width: '100%' }}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <Icon name="close" size={13} />
              </button>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-link"
              onClick={handleResetFilters}
              style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Collapsible Clean Filter Panel */}
        {filterPanelOpen && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14,
            }}
          >
            {/* Status Filter */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Account Status
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {['all', 'active', 'inactive'].map(st => (
                  <button
                    key={st}
                    type="button"
                    className={`btn btn-xs ${statusFilter === st ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setStatusFilter(st)}
                    style={{ textTransform: 'capitalize', borderRadius: 6, fontWeight: 700 }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Filter */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Activity Filter
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'has-orders', label: 'Has Orders' },
                  { id: 'has-bookings', label: 'Has Bookings' },
                  { id: 'both', label: 'Both' },
                  { id: 'no-activity', label: 'No Activity' },
                ].map(act => (
                  <button
                    key={act.id}
                    type="button"
                    className={`btn btn-xs ${activityFilter === act.id ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActivityFilter(act.id)}
                    style={{ borderRadius: 6, fontWeight: 700 }}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Registration / Activity Date
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today' },
                  { id: 'this-week', label: 'This Week' },
                  { id: 'this-month', label: 'This Month' },
                  { id: 'custom', label: 'Custom' },
                ].map(dt => (
                  <button
                    key={dt.id}
                    type="button"
                    className={`btn btn-xs ${dateFilter === dt.id ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setDateFilter(dt.id)}
                    style={{ borderRadius: 6, fontWeight: 700 }}
                  >
                    {dt.label}
                  </button>
                ))}
              </div>
              {dateFilter === 'custom' && (
                <input
                  type="date"
                  className="admin-search-input"
                  style={{ marginTop: 8, width: '100%', borderRadius: 6, padding: '4px 8px' }}
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ERROR STATE WITH RETRY */}
      {error && (
        <div className="card" style={{ padding: 18, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b91c1c' }}>
              <Icon name="alert-triangle" size={18} />
              <span style={{ fontWeight: 700 }}>{error}</span>
            </div>
            <button type="button" className="btn btn-sm btn-outline" onClick={loadCustomersData}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* 3. CUSTOMER TABLE */}
      <div className="card table-container-card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 700 }}>Loading ZESTRO Customer Accounts...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Icon name="users" size={40} color="var(--text-muted)" />
            <h3 style={{ margin: '12px 0 4px', fontSize: 16 }}>No customers yet</h3>
            <p style={{ fontSize: 13, margin: 0 }}>
              {searchQuery || activeFiltersCount > 0
                ? 'No customer records match your active search or filter criteria.'
                : 'Customer registrations and guest dining accounts will appear here.'}
            </p>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={handleResetFilters}
                style={{ marginTop: 12 }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Profile</th>
                    <th>Customer Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Orders</th>
                    <th>Bookings</th>
                    <th>Total Spent</th>
                    <th>Last Active</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map(c => (
                    <tr key={c.id}>
                      {/* Profile Avatar */}
                      <td>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden' }}>
                          {c.avatar ? (
                            <SafeImage
                              image={c.avatar}
                              alt={c.fullName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'var(--accent)',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: 14,
                              }}
                            >
                              {(c.fullName?.[0] || 'C').toUpperCase()}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Customer Name */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ fontSize: 13.5 }}>{c.fullName}</strong>
                          <span className="tier-badge-pill" style={{ fontSize: 10.5, marginTop: 2 }}>
                            {c.tier || 'Member'} Tier
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ fontSize: 12.5 }}>{c.email}</td>

                      {/* Phone */}
                      <td style={{ fontSize: 12.5 }}>{c.phone || '—'}</td>

                      {/* Orders Count */}
                      <td>
                        <strong style={{ color: 'var(--accent)', fontSize: 13 }}>{c.ordersCount}</strong>
                      </td>

                      {/* Bookings Count */}
                      <td>
                        <strong style={{ color: '#4361ee', fontSize: 13 }}>{c.bookingsCount}</strong>
                      </td>

                      {/* Total Spent */}
                      <td>
                        <strong style={{ color: 'var(--accent)', fontSize: 13.5 }}>
                          ₹{c.totalSpent.toLocaleString('en-IN')}
                        </strong>
                      </td>

                      {/* Last Active */}
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {c.lastActive}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-pill ${(c.status || 'Active').toLowerCase() === 'active' ? 'success' : 'danger'}`}>
                          {c.status || 'Active'}
                        </span>
                      </td>

                      {/* Action */}
                      <td>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => handleOpenCustomer(c)}
                          style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Icon name="eye" size={13} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalItems={customers.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50]}
              itemName="customers"
            />
          </>
        )}
      </div>

      {/* Confirmation Modal for Customer Deactivation */}
      <ConfirmationModal
        isOpen={deactivateConfirmOpen}
        title="Deactivate Customer Account"
        message="Are you sure you want to deactivate this customer account? Deactivating this account will prevent new order and booking placements. All historical order and booking records will remain fully preserved and accessible in the system."
        confirmText="Yes, Deactivate Account"
        confirmVariant="danger"
        onConfirm={() => executeToggleStatus(customerToToggle, 'Inactive')}
        onClose={() => {
          setDeactivateConfirmOpen(false);
          setCustomerToToggle(null);
        }}
      />
    </div>
  );
}
