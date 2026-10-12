import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import SafeImage from '../components/SafeImage';
import Pagination from '../components/Pagination';
import { useToast } from '../contexts/ToastContext';
import { logout, syncChefAvailability } from '../redux/slices/authSlice';
import { updateChefKitchenStatus, reportKitchenIncident } from '../redux/slices/chefSlice';
import { updateOrderStatusChef, attachIncidentToOrders } from '../redux/slices/orderSlice';
import KitchenIncidentModal from '../components/chef/KitchenIncidentModal';
import KitchenWorkloadInsights from '../components/chef/KitchenWorkloadInsights';
import FoodQualityCheckpointModal from '../components/chef/FoodQualityCheckpointModal';
import KitchenPerformanceSummary from '../components/chef/KitchenPerformanceSummary';
import { orderApiService } from '../services/orderApiService';
import { incidentApiService } from '../services/incidentApiService';
import {
  calculateOrderPrepEstimate,
  getOrderSuggestedPriority,
  calculateKitchenWorkload,
} from '../utils/chefWorkloadUtils';

export default function ChefDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const currentUser = useSelector(s => s.auth?.currentUser);
  const chefs = useSelector(s => s.chef?.chefs || []);
  const allOrders = useSelector(s => s.order?.orders || []);

  // Match current chef object from Redux
  const currentChef = useMemo(() => {
    if (!currentUser) return null;
    return (
      chefs.find(c => c.id === currentUser.id || c.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
      currentUser
    );
  }, [currentUser, chefs]);

  const assignedRestaurantId = currentChef?.restaurantId || 'r2';
  const assignedRestaurantName = currentChef?.restaurantName || 'Dindigul Thalappakatti';

  // Filter orders strictly for chef's kitchen station
  const stationOrders = useMemo(() => {
    return allOrders.filter(o => o.restaurantId === assignedRestaurantId);
  }, [allOrders, assignedRestaurantId]);

  // Status metrics
  const pendingOrders = useMemo(() =>
    stationOrders.filter(o => !o.cancelled && (o.status === 'Placed' || o.status === 'Confirmed')),
    [stationOrders]
  );

  const preparingOrders = useMemo(() =>
    stationOrders.filter(o => !o.cancelled && o.status === 'Preparing'),
    [stationOrders]
  );

  const readyOrders = useMemo(() =>
    stationOrders.filter(o => !o.cancelled && o.status === 'Ready'),
    [stationOrders]
  );

  const delayedOrders = useMemo(() =>
    stationOrders.filter(o => !o.cancelled && (o.kitchenStatus === 'Delayed' || (o.incident && o.incident.paused))),
    [stationOrders]
  );

  // Active tickets needing attention (excluding Delivered/Cancelled)
  const activeKitchenOrders = useMemo(() => {
    return stationOrders.filter(o => !o.cancelled && o.status !== 'Delivered');
  }, [stationOrders]);

  // Aggregated Food Preparation List
  const prepList = useMemo(() => {
    const map = {};
    stationOrders.forEach(ord => {
      if (ord.cancelled || ord.status === 'Delivered') return;
      (ord.items || []).forEach(it => {
        if (!map[it.name]) {
          map[it.name] = {
            name: it.name,
            totalQty: 0,
            image: it.image,
            preparingQty: 0,
            pendingQty: 0,
            readyQty: 0,
          };
        }
        map[it.name].totalQty += (it.qty || 1);
        if (ord.status === 'Preparing') {
          map[it.name].preparingQty += (it.qty || 1);
        } else if (ord.status === 'Ready') {
          map[it.name].readyQty += (it.qty || 1);
        } else {
          map[it.name].pendingQty += (it.qty || 1);
        }
      });
    });
    return Object.values(map).sort((a, b) => b.totalQty - a.totalQty);
  }, [stationOrders]);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'preparing' | 'ready' | 'delayed'
  const [searchQuery, setSearchQuery] = useState('');
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [qualityModalOpen, setQualityModalOpen] = useState(false);
  const [selectedOrderForReady, setSelectedOrderForReady] = useState(null);

  // Incidents from Redux
  const incidents = useSelector(s => s.chef?.incidents || []);
  const openCriticalIncidents = useMemo(() => {
    return incidents.filter(
      i => (i.restaurantId === assignedRestaurantId || !i.restaurantId) &&
           (i.status === 'open' || !i.status) &&
           (i.severity === 'Critical' || i.incidentType === 'Fire or Safety Incident')
    );
  }, [incidents, assignedRestaurantId]);

  // Kitchen Status: 'Available' | 'Busy' | 'Temporarily Unavailable'
  const currentKitchenStatus = currentChef?.availability || 'Available';

  // Workload data calculated from actual available orders
  const workloadData = useMemo(() => {
    return calculateKitchenWorkload(stationOrders, currentKitchenStatus);
  }, [stationOrders, currentKitchenStatus]);

  const handleKitchenStatusChange = (newStatus) => {
    if (currentChef?.id) {
      dispatch(updateChefKitchenStatus({ id: currentChef.id, status: newStatus }));
      dispatch(syncChefAvailability({ id: currentChef.id, availability: newStatus }));
    }
    showToast(`Kitchen Status updated to ${newStatus}`, 'success');
  };

  const handleUpdateOrderStatus = (orderId, nextStatus) => {
    dispatch(updateOrderStatusChef({ id: orderId, nextStatus }));
    showToast(`Order #${orderId} stage updated to ${nextStatus}`, 'success');
  };

  const handleInitiateMarkReady = (order) => {
    setSelectedOrderForReady(order);
    setQualityModalOpen(true);
  };

  const handleConfirmQualityReady = (orderId, qualityCheckData) => {
    dispatch(updateOrderStatusChef({
      id: orderId,
      nextStatus: 'Ready',
      qualityCheck: qualityCheckData,
    }));
    orderApiService.updateQualityCheck(orderId, qualityCheckData).catch(err => {
      console.warn('Backend quality check sync note:', err.message);
    });
    showToast(`Order #${orderId} quality verified & marked Ready for service!`, 'success');
  };

  const handleReportIncident = (incidentData) => {
    dispatch(reportKitchenIncident(incidentData));
    if (incidentData.affectedOrders && incidentData.affectedOrders.length > 0) {
      dispatch(attachIncidentToOrders({
        orderIds: incidentData.affectedOrders,
        incidentId: `INC-${Date.now()}`,
        incidentType: incidentData.incidentType,
        severity: incidentData.severity,
        message: incidentData.description,
        chefName: currentChef?.name || currentChef?.fullName || 'Station Chef',
      }));
    }
    incidentApiService.createIncident(incidentData).catch(err => {
      console.warn('Backend incident sync note:', err.message);
    });
    showToast(`🚨 Incident report dispatched to Admin Operations`, 'error');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/', { replace: true });
  };

  // Filtered orders for the display table / cards
  const filteredOrders = useMemo(() => {
    return stationOrders.filter(ord => {
      // Tab filter
      if (activeTab === 'pending' && !(ord.status === 'Placed' || ord.status === 'Confirmed')) return false;
      if (activeTab === 'preparing' && ord.status !== 'Preparing') return false;
      if (activeTab === 'ready' && ord.status !== 'Ready') return false;
      if (activeTab === 'delayed' && !(ord.kitchenStatus === 'Delayed' || (ord.incident && ord.incident.paused))) return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = ord.id?.toLowerCase().includes(q);
        const matchesItem = (ord.items || []).some(i => i.name?.toLowerCase().includes(q));
        if (!matchesId && !matchesItem) return false;
      }

      return true;
    });
  }, [stationOrders, activeTab, searchQuery]);

  // Main scroll ref for independent scrolling
  const contentBodyRef = useRef(null);
  useEffect(() => {
    if (contentBodyRef.current) {
      contentBodyRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Pagination for kitchen tickets
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(10);

  useEffect(() => {
    setOrderPage(1);
  }, [activeTab, searchQuery]);

  const paginatedTickets = useMemo(() => {
    const start = (orderPage - 1) * orderPageSize;
    return filteredOrders.slice(start, start + orderPageSize);
  }, [filteredOrders, orderPage, orderPageSize]);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="portal-layout-wrapper">
      {/* Mobile Backdrop */}
      {mobileNavOpen && (
        <div
          className="portal-mobile-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ================= CHEF LEFT SIDE PANEL ================= */}
      <aside className={`portal-sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="portal-sidebar-header">
          <div className="portal-brand">
            <span className="portal-brand-icon">👨‍🍳</span>
            <div className="portal-brand-text">
              <span className="portal-brand-title">ZESTRO</span>
              <span className="portal-brand-badge">Kitchen Terminal</span>
            </div>
          </div>
          <button
            type="button"
            className="portal-sidebar-close-btn"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close sidebar menu"
          >
            ✕
          </button>
        </div>

        {/* Chef Profile Card */}
        <div className="portal-user-card">
          <div className="portal-avatar-ring">
            {currentChef?.photo || currentChef?.avatar ? (
              <SafeImage
                image={currentChef.photo || currentChef.avatar}
                alt={currentChef.name || currentChef.fullName}
                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div className="chef-fallback-circle" style={{ width: 44, height: 44 }}>
                <Icon name="chef" size={20} color="#f72585" />
              </div>
            )}
            <span className={`status-indicator ${currentKitchenStatus === 'Available' ? 'online' : 'busy'}`} />
          </div>
          <div className="portal-user-meta">
            <strong className="portal-user-name">{currentChef?.name || currentChef?.fullName || 'Master Chef'}</strong>
            <span className="portal-user-role">{assignedRestaurantName}</span>
          </div>
        </div>

        {/* Live Kitchen Status Selector in Sidebar */}
        <div className="portal-sidebar-action-box">
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Kitchen Status:
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              type="button"
              className={`duty-toggle-btn ${currentKitchenStatus === 'Available' ? 'duty-online' : ''}`}
              onClick={() => handleKitchenStatusChange('Available')}
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              <span className="duty-dot" />
              <span>Available (Accepting Orders)</span>
            </button>
            <button
              type="button"
              className={`duty-toggle-btn ${currentKitchenStatus === 'Busy' ? 'duty-online' : ''}`}
              onClick={() => handleKitchenStatusChange('Busy')}
              style={{ padding: '6px 12px', fontSize: 12, borderColor: '#fb8500', color: currentKitchenStatus === 'Busy' ? '#fb8500' : 'inherit' }}
            >
              <span className="duty-dot" style={{ background: '#fb8500' }} />
              <span>Kitchen Busy (Peak Time)</span>
            </button>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="portal-nav">
          <div className="portal-nav-group-title">KITCHEN QUEUE</div>
          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Icon name="orders" size={18} />
            <span>Today's Tickets</span>
            <span className="nav-badge info">{stationOrders.length}</span>
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'preparing' ? 'active' : ''}`}
            onClick={() => setActiveTab('preparing')}
          >
            <Icon name="fire" size={18} />
            <span>In Preparation</span>
            {preparingOrders.length > 0 && <span className="nav-badge alert">{preparingOrders.length}</span>}
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'ready' ? 'active' : ''}`}
            onClick={() => setActiveTab('ready')}
          >
            <Icon name="check" size={18} />
            <span>Ready for Pickup</span>
            {readyOrders.length > 0 && <span className="nav-badge success">{readyOrders.length}</span>}
          </button>

          <button
            type="button"
            className={`portal-nav-item ${activeTab === 'delayed' ? 'active' : ''}`}
            onClick={() => setActiveTab('delayed')}
          >
            <Icon name="warning" size={18} />
            <span>Delayed / Paused</span>
            {delayedOrders.length > 0 && <span className="nav-badge alert">{delayedOrders.length}</span>}
          </button>

          <div className="portal-nav-group-title">EMERGENCY</div>
          <button
            type="button"
            className="portal-nav-item"
            style={{ color: 'var(--danger)', fontWeight: 700 }}
            onClick={() => setIncidentModalOpen(true)}
          >
            <Icon name="warning" size={18} color="var(--danger)" />
            <span>Report Kitchen Incident</span>
          </button>
        </nav>

        {/* Footer Logout */}
        <div className="portal-sidebar-footer">
          <button type="button" className="portal-logout-btn" onClick={handleLogout}>
            <Icon name="logout" size={18} />
            <span>Sign Out Kitchen</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT BODY ================= */}
      <div ref={contentBodyRef} className="portal-content-body">
        {/* Top Header */}
        <header className="portal-top-header">
          <div className="portal-header-left">
            <button
              type="button"
              className="portal-mobile-menu-btn"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open Kitchen Menu"
              title="Open Menu"
            >
              <Icon name="menu" size={18} />
              <span>Menu</span>
            </button>
            <h1 className="portal-page-title">
              {currentChef?.name || currentChef?.fullName || 'Master Chef'} — Kitchen Display (KDS)
            </h1>
            <p className="portal-page-subtitle">
              Assigned: <strong>{assignedRestaurantName}</strong> • Station ID: {assignedRestaurantId}
            </p>
          </div>

          <div className="portal-header-right">
            <div className="portal-stat-pill">
              <span className="stat-pill-label">Queue</span>
              <strong className="stat-pill-value">{activeKitchenOrders.length} active</strong>
            </div>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setIncidentModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <Icon name="warning" size={14} />
              <span>Alert Incident</span>
            </button>
          </div>
        </header>

      {/* Critical Safety Alert Banner if open incidents exist */}
      {openCriticalIncidents.length > 0 && (
        <div
          className="critical-safety-alert-banner"
          style={{ margin: '16px 0', cursor: 'pointer' }}
          onClick={() => setIncidentModalOpen(true)}
        >
          <Icon name="warning" size={20} color="#dc2626" />
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#dc2626', display: 'block' }}>
              CRITICAL KITCHEN SAFETY ALERT: {openCriticalIncidents[0].incidentType}
            </strong>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text)' }}>
              {openCriticalIncidents[0].description} • Standby protocol active for {assignedRestaurantName}.
            </p>
          </div>
          <button type="button" className="btn btn-danger btn-xs" style={{ fontWeight: 700 }}>
            Inspect &amp; Resolve
          </button>
        </div>
      )}

      {/* Main KPI Counter Grid (Section 2) */}
      <section className="chef-kpi-grid">
        <div
          className={`card chef-kpi-card ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <div className="kpi-icon-badge" style={{ background: 'rgba(232, 84, 42, 0.15)', color: 'var(--accent)' }}>
            <Icon name="orders" size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-val">{stationOrders.length}</span>
            <span className="kpi-title">Today's Orders</span>
          </div>
        </div>

        <div
          className={`card chef-kpi-card ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <div className="kpi-icon-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <Icon name="clock" size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-val">{pendingOrders.length}</span>
            <span className="kpi-title">Pending Orders</span>
          </div>
        </div>

        <div
          className={`card chef-kpi-card ${activeTab === 'preparing' ? 'active' : ''}`}
          onClick={() => setActiveTab('preparing')}
        >
          <div className="kpi-icon-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Icon name="flame" size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-val">{preparingOrders.length}</span>
            <span className="kpi-title">Preparing Orders</span>
          </div>
        </div>

        <div
          className={`card chef-kpi-card ${activeTab === 'ready' ? 'active' : ''}`}
          onClick={() => setActiveTab('ready')}
        >
          <div className="kpi-icon-badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
            <Icon name="check" size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-val">{readyOrders.length}</span>
            <span className="kpi-title">Ready Orders</span>
          </div>
        </div>

        <div
          className={`card chef-kpi-card ${activeTab === 'delayed' ? 'active' : ''}`}
          onClick={() => setActiveTab('delayed')}
        >
          <div className="kpi-icon-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <Icon name="alert-circle" size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-val">{delayedOrders.length}</span>
            <span className="kpi-title">Delayed Orders</span>
          </div>
        </div>
      </section>

      {/* Smart Kitchen Workload Balancer & Kitchen Performance Summary */}
      <div
        className="chef-insights-performance-row"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
          margin: '20px 0',
        }}
      >
        <KitchenWorkloadInsights workloadData={workloadData} />
        <KitchenPerformanceSummary stationOrders={stationOrders} assignedRestaurantName={assignedRestaurantName} />
      </div>

      {/* Two Column Layout: Food Prep List (Left) + Live Orders Ticket Grid (Right) */}
      <div className="chef-split-workbench">
        {/* Left Column: Today's Food Preparation List (Section 2) */}
        <aside className="card chef-preplist-panel">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="utensils" size={17} color="var(--accent)" />
              <h3 style={{ margin: 0, fontSize: 16 }}>Today's Food Preparation List</h3>
            </div>
            <span className="mini-badge-outline">{prepList.length} Items</span>
          </div>
          <p className="panel-desc">
            Aggregated portion requirements across all active kitchen tickets.
          </p>

          <div className="preplist-items-scroll">
            {prepList.length === 0 ? (
              <div className="empty-prep-state">
                <Icon name="check" size={32} color="var(--text-muted)" />
                <p>All scheduled portions prepared or no active orders.</p>
              </div>
            ) : (
              prepList.map((item, idx) => {
                const isComplete = item.readyQty >= item.totalQty && item.totalQty > 0;
                return (
                  <div key={idx} className={`prep-item-row ${isComplete ? 'complete' : ''}`}>
                    <div className="prep-item-left">
                      <div className="prep-item-thumb">
                        {item.image ? (
                          <SafeImage image={item.image} alt={item.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                        ) : (
                          <Icon name="food" size={20} color="var(--text-muted)" />
                        )}
                      </div>
                      <div className="prep-item-info">
                        <strong className="dish-name">{item.name}</strong>
                        <div className="portion-status-breakdown">
                          {item.pendingQty > 0 && <span className="portion-chip pending">{item.pendingQty} waiting</span>}
                          {item.preparingQty > 0 && <span className="portion-chip prep">{item.preparingQty} on stove</span>}
                          {item.readyQty > 0 && <span className="portion-chip ready">{item.readyQty} plated</span>}
                        </div>
                      </div>
                    </div>
                    <div className="prep-item-right">
                      <div className="portion-total-badge">
                        <span>× {item.totalQty}</span>
                        <small>portions</small>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Column: Live Kitchen Order Tickets (Section 3) */}
        <div className="chef-tickets-panel">
          {/* Controls Bar */}
          <div className="ticket-controls-bar">
            <div className="ticket-filter-tabs">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All ({stationOrders.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending ({pendingOrders.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'preparing' ? 'active' : ''}`}
                onClick={() => setActiveTab('preparing')}
              >
                Preparing ({preparingOrders.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'ready' ? 'active' : ''}`}
                onClick={() => setActiveTab('ready')}
              >
                Ready ({readyOrders.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'delayed' ? 'active' : ''}`}
                onClick={() => setActiveTab('delayed')}
              >
                Delayed ({delayedOrders.length})
              </button>
            </div>

            <div className="ticket-search-box">
              <Icon name="search" size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search ticket # or dish..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="clear-btn" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>
          </div>

          {/* Order Cards Grid */}
          <div className="chef-tickets-grid">
            {filteredOrders.length === 0 ? (
              <div className="card empty-tickets-card">
                <Icon name="chef" size={44} color="var(--text-muted)" />
                <h4>No matching kitchen tickets found</h4>
                <p>There are no active orders under this filter for {assignedRestaurantName}.</p>
              </div>
            ) : (
              paginatedTickets.map(order => {
                const isDelayed = order.kitchenStatus === 'Delayed' || (order.incident && order.incident.paused);
                const isReady = order.status === 'Ready';
                const isPreparing = order.status === 'Preparing';
                const isConfirmed = order.status === 'Confirmed' || order.status === 'Placed';
                const timeAgo = order.placedAt || order.createdAt ? new Date(order.placedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';

                // Section 1 & 2: Calculate rule-based prep estimate & suggested priority
                const prepEstimate = calculateOrderPrepEstimate(order, stationOrders, currentKitchenStatus);
                const suggestedPriorityInfo = getOrderSuggestedPriority(order, stationOrders, currentKitchenStatus);

                return (
                  <div
                    key={order.id}
                    className={`card chef-order-card ${isDelayed ? 'delayed-card' : ''} ${isReady ? 'ready-card' : ''} ${isPreparing ? 'preparing-card' : ''}`}
                  >
                    {/* Header */}
                    <div className="ticket-header">
                      <div className="ticket-title-col">
                        <div className="order-id-badge">
                          <span>Order #{order.id}</span>
                          <span className="order-type-tag">{order.orderType || 'Delivery'}</span>
                        </div>
                        <div className="order-timestamp">
                          <Icon name="clock" size={13} />
                          <span>Placed: {timeAgo}</span>
                        </div>
                      </div>

                      <div className="ticket-status-col">
                        <span className={`kitchen-stage-pill ${order.status?.toLowerCase()}`}>
                          {order.status}
                        </span>
                        {/* Section 1: Suggested Priority Indicator */}
                        {!isReady && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                            <span
                              className={`suggested-priority-indicator ${suggestedPriorityInfo.priority.toLowerCase()}`}
                              title={`Reason: ${suggestedPriorityInfo.reason}`}
                            >
                              <Icon name="sparkles" size={10} />
                              <span>Suggested Priority: {suggestedPriorityInfo.priority}</span>
                            </span>
                            {suggestedPriorityInfo.reason && (
                              <small style={{ fontSize: 10.5, color: 'var(--text-muted)', maxWidth: 190, textAlign: 'right', lineHeight: 1.2 }}>
                                {suggestedPriorityInfo.reason}
                              </small>
                            )}
                          </div>
                        )}
                        {order.priority && order.priority !== 'Normal' && (
                          <span className={`priority-pill ${order.priority.toLowerCase()}`}>
                            {order.priority}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Incident Delayed Warning */}
                    {isDelayed && (
                      <div className="ticket-incident-banner">
                        <Icon name="warning" size={14} color="#dc2626" />
                        <div>
                          <strong>Kitchen Delayed / Paused</strong>
                          <p>{order.incident?.message || 'Incident reported. Standby for Admin dispatch.'}</p>
                        </div>
                      </div>
                    )}

                    {/* Food Items List (Section 3 Requirement) */}
                    <div className="ticket-items-body">
                      <div className="items-list-header">
                        <span>Items to Prepare</span>
                        <span className="item-count">{(order.items || []).length} dishes</span>
                      </div>
                      <ul className="ticket-items-list">
                        {(order.items || []).map((item, iIdx) => (
                          <li key={iIdx} className="ticket-item-row">
                            <span className="item-qty-badge">× {item.qty}</span>
                            <span className="item-dish-name">{item.name}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Customer / Prep Instructions */}
                      {order.deliveryInstruction && (
                        <div className="ticket-instruction-box">
                          <Icon name="sparkles" size={13} color="var(--accent)" />
                          <span>Note: "{order.deliveryInstruction}"</span>
                        </div>
                      )}
                    </div>

                    {/* Section 2: Preparation Time Predictor Strip */}
                    <div className="est-ready-time-strip">
                      <div className="est-time-row">
                        <span className="est-time-label">
                          <Icon name="clock" size={11} />
                          <span>Order Placed Time:</span>
                        </span>
                        <span className="est-time-val">{prepEstimate.placedTimeStr}</span>
                      </div>
                      <div className="est-time-row">
                        <span className="est-time-label">
                          <Icon name="clock" size={11} />
                          <span>Estimated Prep Duration:</span>
                        </span>
                        <span className="est-time-val">{prepEstimate.prepMinutes} mins</span>
                      </div>
                      <div className="est-time-row">
                        <span className="est-time-label">
                          <Icon name="clock" size={11} />
                          <span>Estimated Ready Time:</span>
                        </span>
                        <span className="est-time-val">{prepEstimate.estReadyTimeStr}</span>
                      </div>
                      {prepEstimate.actualReadyTimeStr && (
                        <div className="est-time-row">
                          <span className="est-time-label" style={{ color: 'var(--success)' }}>
                            <Icon name="check" size={11} />
                            <span>Actual Completion Time:</span>
                          </span>
                          <span className="est-time-val" style={{ color: 'var(--success)' }}>
                            {prepEstimate.actualReadyTimeStr}
                          </span>
                        </div>
                      )}
                      {prepEstimate.isDelayed && !isReady && order.status !== 'Delivered' && (
                        <div className="delay-warning-badge">
                          <Icon name="warning" size={11} color="#dc2626" />
                          <span>Preparation Delay — Please review this order.</span>
                        </div>
                      )}
                    </div>

                    {/* Action Footer: Confirmed -> Preparing -> Quality Checkpoint -> Ready */}
                    <div className="ticket-actions-footer">
                      {isConfirmed && (
                        <button
                          type="button"
                          className="btn btn-warning btn-block btn-stage-action"
                          onClick={() => handleUpdateOrderStatus(order.id, 'Preparing')}
                          id={`btn-prep-${order.id}`}
                        >
                          <Icon name="flame" size={15} />
                          <span>Start Preparing Food</span>
                        </button>
                      )}

                      {isPreparing && (
                        <button
                          type="button"
                          className="btn btn-success btn-block btn-stage-action"
                          onClick={() => handleInitiateMarkReady(order)}
                          id={`btn-ready-${order.id}`}
                        >
                          <Icon name="shield" size={15} />
                          <span>Mark Food as Ready</span>
                        </button>
                      )}

                      {isReady && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div className="food-ready-badge">
                            <Icon name="check" size={16} color="var(--success)" />
                            <span>✓ Food Ready for Dispatch / Table Service</span>
                          </div>
                          {order.qualityCheck && order.qualityCheck.verified && (
                            <div className="quality-verified-badge">
                              <Icon name="shield" size={13} color="#16a34a" />
                              <span>✓ Quality Verified ({order.qualityCheck.verifiedBy || 'Chef'})</span>
                            </div>
                          )}
                        </div>
                      )}

                      {order.status === 'Delivered' && (
                        <div className="food-completed-badge">
                          <span>✓ Handed Over / Delivered</span>
                        </div>
                      )}

                      {order.status === 'Cancelled' && (
                        <div className="food-cancelled-badge">
                          <span>✕ Order Cancelled</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Pagination
            currentPage={orderPage}
            totalItems={filteredOrders.length}
            pageSize={orderPageSize}
            onPageChange={setOrderPage}
            onPageSizeChange={(sz) => {
              setOrderPageSize(sz);
              setOrderPage(1);
            }}
            itemName="orders"
          />
        </div>
      </div>
    </div>

    {/* Section 4: Incident Modal */}
    <KitchenIncidentModal
      isOpen={incidentModalOpen}
      onClose={() => setIncidentModalOpen(false)}
      onSubmitIncident={handleReportIncident}
      chef={currentChef}
      restaurantName={assignedRestaurantName}
      restaurantId={assignedRestaurantId}
      activeOrders={activeKitchenOrders}
    />

    {/* Section 3: Food Quality Checkpoint Modal */}
    <FoodQualityCheckpointModal
      isOpen={qualityModalOpen}
      order={selectedOrderForReady}
      chef={currentChef}
      restaurantName={assignedRestaurantName}
      onConfirmReady={handleConfirmQualityReady}
      onClose={() => {
        setQualityModalOpen(false);
        setSelectedOrderForReady(null);
      }}
    />
  </div>
);
}
