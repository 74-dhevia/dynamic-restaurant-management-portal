import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Icon from '../Icon';
import SafeImage from '../SafeImage';
import BookingDetailsModal from './BookingDetailsModal';
import CustomerDetailsModal from './CustomerDetailsModal';
import Pagination from '../Pagination';
import {
  BOOKING_STATUSES,
  resetBookings,
} from '../../redux/slices/bookingSlice';
import {
  DEFAULT_TABLES,
  computeLiveTableStatusMatrix,
} from '../../services/tableBookingService';

export default function BookingManagement({
  subId,
  isHistory = false,
  onOpenOrder,
  onAddTable,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux Store Subscriptions
  const bookings = useSelector(s => s.booking?.bookings || []);
  const restaurantsList = useSelector(s => s.restaurant?.restaurants || []);
  const users = useSelector(s => s.auth?.users || []);
  const orders = useSelector(s => s.order?.orders || []);
  const incidents = useSelector(s => s.chef?.incidents || []);

  // UI & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'tomorrow' | 'this-week' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [seatingFilter, setSeatingFilter] = useState('all');
  const [guestsFilter, setGuestsFilter] = useState('all'); // 'all' | '1-2' | '3-4' | '5-6' | '7+'

  const [activeTab, setActiveTab] = useState(isHistory ? 'history' : 'live'); // 'live' | 'schedule' | 'tables' | 'history'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetailsModalOpen, setBookingDetailsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, restaurantFilter, dateFilter, customDate, seatingFilter, guestsFilter, activeTab]);

  // Loading & Error States (Requirement 23)
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);

  // Quick Action notification modal for kitchen incident
  const [incidentActionBanner, setIncidentActionBanner] = useState(null);

  // Sync /admin/bookings/:bookingId from URL parameter
  useEffect(() => {
    if (subId && bookings.length > 0) {
      const match = bookings.find(b => b.id.toUpperCase() === subId.toUpperCase());
      if (match) {
        setSelectedBooking(match);
        setBookingDetailsModalOpen(true);
      }
    }
  }, [subId, bookings]);

  // Keep activeTab synced with URL route
  useEffect(() => {
    if (isHistory) {
      setActiveTab('history');
    }
  }, [isHistory]);

  // Date constants
  const todayStr = '2026-09-26'; // Current synchronized local date

  // 19. Kitchen Incident Connection: Find active open incidents
  const openIncidents = useMemo(() => {
    return incidents.filter(inc => inc.status === 'open');
  }, [incidents]);

  // For demonstration and operations center: find primary incident
  const primaryIncident = openIncidents[0] || (incidents.length > 0 ? incidents[0] : null);

  // Affected bookings for the incident's restaurant
  const affectedIncidentBookings = useMemo(() => {
    if (!primaryIncident) return [];
    return bookings.filter(b => {
      if (['Cancelled', 'Completed', 'No Show'].includes(b.status)) return false;
      const matchRest = (b.restaurantId === primaryIncident.restaurantId || b.restaurantName === primaryIncident.restaurantName);
      return matchRest;
    });
  }, [bookings, primaryIncident]);

  // 2. Booking Summary KPI Calculations
  const summaryKPIs = useMemo(() => {
    const totalBookings = bookings.length;
    const todayBookings = bookings.filter(b => (b.date === todayStr || b.dateFormatted === '26 Sep')).length;
    const upcomingBookings = bookings.filter(b => !['Cancelled', 'Completed', 'No Show'].includes(b.status)).length;
    const pendingBookings = bookings.filter(b => b.status === 'Requested').length;
    const confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
    const arrivedBookings = bookings.filter(b => b.status === 'Customer Arrived').length;
    const completedBookings = bookings.filter(b => b.status === 'Completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;

    return {
      totalBookings,
      todayBookings,
      upcomingBookings,
      pendingBookings,
      confirmedBookings,
      arrivedBookings,
      completedBookings,
      cancelledBookings,
    };
  }, [bookings, todayStr]);

  const formatKpi = (val) => {
    if (summaryKPIs.totalBookings === 0) return 'No data yet';
    return val !== undefined ? val : 0;
  };

  // 13. Today's Dining Schedule (Sorted by Time)
  const todayDiningSchedule = useMemo(() => {
    const todayList = bookings.filter(b => {
      const isToday = b.date === todayStr || b.dateFormatted === '26 Sep';
      return isToday && !['Cancelled', 'No Show'].includes(b.status);
    });

    // Sort chronologically by time
    const timeToMinutes = (tStr) => {
      if (!tStr) return 999;
      const parts = tStr.trim().split(' ');
      if (parts.length < 2) return 999;
      const [hStr, mStr] = parts[0].split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr || '0', 10);
      const isPM = parts[1].toUpperCase() === 'PM';
      if (isPM && h < 12) h += 12;
      if (!isPM && h === 12) h = 0;
      return h * 60 + m;
    };

    return [...todayList].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }, [bookings, todayStr]);

  // 14. Live Table Status Matrix
  const liveTableMatrix = useMemo(() => {
    return computeLiveTableStatusMatrix({
      tables: DEFAULT_TABLES,
      bookings,
      restaurantId: restaurantFilter !== 'all' ? restaurantFilter : null,
      date: todayStr,
    });
  }, [bookings, restaurantFilter, todayStr]);

  // Filter & Search Engine (Requirements 11, 12, 20)
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // History Mode Filter (/admin/booking-history)
      if (activeTab === 'history') {
        if (!['Completed', 'Cancelled', 'No Show'].includes(b.status)) {
          return false;
        }
      } else {
        // In Live Bookings view, show all active unless specifically filtered
        if (statusFilter !== 'all' && b.status !== statusFilter) {
          return false;
        }
      }

      // Restaurant Filter
      if (restaurantFilter !== 'all') {
        const matchRestId = b.restaurantId === restaurantFilter;
        const matchRestName = b.restaurantName?.toLowerCase() === restaurantFilter.toLowerCase();
        if (!matchRestId && !matchRestName) return false;
      }

      // Date Filter
      if (dateFilter === 'today') {
        if (b.date !== todayStr && b.dateFormatted !== '26 Sep') return false;
      } else if (dateFilter === 'tomorrow') {
        if (b.date !== '2026-09-27' && b.dateFormatted !== '27 Sep') return false;
      } else if (dateFilter === 'this-week') {
        // bookings within 7 days
        if (!b.date?.startsWith('2026-09')) return false;
      } else if (dateFilter === 'custom' && customDate) {
        if (b.date !== customDate) return false;
      }

      // Seating Filter (Indoor, Outdoor, Window, Family)
      if (seatingFilter !== 'all') {
        const bSeating = (b.seating || '').toLowerCase();
        if (!bSeating.includes(seatingFilter.toLowerCase())) return false;
      }

      // Guests Filter
      if (guestsFilter === '1-2' && (b.guests < 1 || b.guests > 2)) return false;
      if (guestsFilter === '3-4' && (b.guests < 3 || b.guests > 4)) return false;
      if (guestsFilter === '5-6' && (b.guests < 5 || b.guests > 6)) return false;
      if (guestsFilter === '7+' && b.guests < 7) return false;

      // 11. Search Query (Booking ID, Customer Name, Email, Phone, Restaurant, Table number)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = (b.id || '').toLowerCase().includes(q);
        const matchName = (b.customerName || b.userName || '').toLowerCase().includes(q);
        const matchEmail = (b.userEmail || b.customerEmail || '').toLowerCase().includes(q);
        const matchPhone = (b.customerPhone || '').includes(q);
        const matchRest = (b.restaurantName || '').toLowerCase().includes(q);
        const matchTable = (b.tableNumber || b.tableId || '').toLowerCase().includes(q);

        if (!matchId && !matchName && !matchEmail && !matchPhone && !matchRest && !matchTable) {
          return false;
        }
      }

      return true;
    });
  }, [
    bookings,
    activeTab,
    statusFilter,
    restaurantFilter,
    dateFilter,
    customDate,
    seatingFilter,
    guestsFilter,
    searchQuery,
    todayStr,
  ]);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  const handleOpenBookingDetails = (b) => {
    setSelectedBooking(b);
    setBookingDetailsModalOpen(true);
    navigate(`/admin/bookings/${b.id}`);
  };

  const handleOpenCustomerModal = (customerData) => {
    setSelectedCustomer(customerData);
    setCustomerModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setRestaurantFilter('all');
    setDateFilter('all');
    setCustomDate('');
    setSeatingFilter('all');
    setGuestsFilter('all');
  };

  const handleRetry = () => {
    setIsLoading(true);
    setErrorState(null);
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="admin-view-fade booking-management-hub">
      {/* 1. Header Row */}
      <div className="view-header-row" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', marginBottom: 4 }}>
            <Icon name="calendar" size={14} />
            <span>Restaurant Reservation Operations Center</span>
          </div>
          <h1 className="view-title" style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>
            {activeTab === 'history' ? 'Booking History Archive' : 'Table Bookings'}
          </h1>
          <p className="view-sub" style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--text-muted)' }}>
            Manage customer reservations, tables and dining schedules.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="tab-pill-group" style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 10, padding: 3, border: '1px solid var(--border)' }}>
            <button
              type="button"
              className={`pill-btn ${activeTab === 'live' ? 'active' : ''}`}
              onClick={() => { setActiveTab('live'); navigate('/admin/bookings'); }}
            >
              Active Reservations
            </button>
            <button
              type="button"
              className={`pill-btn ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              Today's Schedule
            </button>
            <button
              type="button"
              className={`pill-btn ${activeTab === 'tables' ? 'active' : ''}`}
              onClick={() => setActiveTab('tables')}
            >
              Table Availability
            </button>
            <button
              type="button"
              className={`pill-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => { setActiveTab('history'); navigate('/admin/booking-history'); }}
            >
              Archive History
            </button>
          </div>

          {onAddTable && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onAddTable}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              title="Add a new dining table station"
            >
              <Icon name="add" size={14} color="#ffffff" />
              <span>+ Add Table</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => dispatch(resetBookings())}
            title="Reset to verified seed reservations"
          >
            <Icon name="refresh" size={13} /> Reset Seeds
          </button>
        </div>
      </div>

      {/* 19. Kitchen Incident Emergency Connection Banner */}
      {primaryIncident && (
        <div className="card incident-connection-card" style={{ marginBottom: 20, padding: '14px 18px', background: 'linear-gradient(135deg, color-mix(in srgb, var(--danger) 10%, var(--bg-elevated)), var(--bg-elevated))', border: '1px solid color-mix(in srgb, var(--danger) 30%, var(--border))', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="incident-badge-icon" style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--danger)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="alert-triangle" size={20} />
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 15, color: 'var(--danger)' }}>🚨 Kitchen Incident Connection</strong>
                  <span className="status-pill danger" style={{ fontSize: 11 }}>{primaryIncident.severity} Severity</span>
                  <span className="muted" style={{ fontSize: 12 }}>Restaurant: <strong>{primaryIncident.restaurantName}</strong></span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text)', marginTop: 2 }}>
                  {primaryIncident.description}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--danger)' }}>
                Affected Today's Bookings:
              </span>
              {affectedIncidentBookings.length === 0 ? (
                <span className="muted" style={{ fontSize: 12.5 }}>None directly scheduled</span>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  {affectedIncidentBookings.map(ab => (
                    <button
                      key={ab.id}
                      type="button"
                      className="btn btn-xs btn-outline-danger"
                      onClick={() => handleOpenBookingDetails(ab)}
                      style={{ fontWeight: 800 }}
                    >
                      {ab.id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Bar for Incident */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid color-mix(in srgb, var(--danger) 20%, var(--border))', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Admin Incident Decision:</span>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={() => {
                setIncidentActionBanner('Notifying all diners affected by this restaurant incident with alternative slots.');
                setTimeout(() => setIncidentActionBanner(null), 4000);
              }}
            >
              <Icon name="notifications" size={12} /> Notify All Affected Customers
            </button>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={() => {
                if (affectedIncidentBookings[0]) handleOpenBookingDetails(affectedIncidentBookings[0]);
              }}
            >
              <Icon name="clock" size={12} /> Reschedule Affected Bookings
            </button>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={() => {
                if (affectedIncidentBookings[0]) {
                  const cust = users.find(u => u.email === affectedIncidentBookings[0].userEmail);
                  if (cust) handleOpenCustomerModal(cust);
                }
              }}
            >
              <Icon name="users" size={12} /> Contact Customer
            </button>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              * System does not automatically cancel. Admin makes all operational decisions.
            </span>
          </div>

          {incidentActionBanner && (
            <div style={{ marginTop: 8, padding: '6px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontSize: 12, color: 'var(--success)' }}>
              ✓ {incidentActionBanner}
            </div>
          )}
        </div>
      )}

      {/* 2. BOOKING SUMMARY KPI CARDS */}
      <div className="booking-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        {/* Total Bookings */}
        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
              <Icon name="calendar" size={16} color="var(--accent)" />
            </span>
            <span className="kpi-trend neutral">All Time</span>
          </div>
          <div className="kpi-num">{formatKpi(summaryKPIs.totalBookings)}</div>
          <div className="kpi-lbl">Total Bookings</div>
        </div>

        {/* Today's Bookings */}
        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, #0284c7 15%, transparent)' }}>
              <Icon name="clock" size={16} color="#0284c7" />
            </span>
            <span className="kpi-trend positive">Today</span>
          </div>
          <div className="kpi-num" style={{ color: '#0284c7' }}>
            {formatKpi(summaryKPIs.todayBookings)}
          </div>
          <div className="kpi-lbl">Today's Bookings</div>
        </div>

        {/* Upcoming Bookings */}
        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)' }}>
              <Icon name="sparkles" size={16} color="var(--success)" />
            </span>
            <span className="kpi-trend positive">Active</span>
          </div>
          <div className="kpi-num" style={{ color: 'var(--success)' }}>
            {formatKpi(summaryKPIs.upcomingBookings)}
          </div>
          <div className="kpi-lbl">Upcoming Bookings</div>
        </div>

        {/* Pending (Requested) */}
        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, #fb8500 15%, transparent)' }}>
              <Icon name="pulse" size={16} color="#fb8500" />
            </span>
            <span className="kpi-trend positive" style={{ color: '#fb8500' }}>Requires Review</span>
          </div>
          <div className="kpi-num" style={{ color: '#fb8500' }}>
            {formatKpi(summaryKPIs.pendingBookings)}
          </div>
          <div className="kpi-lbl">Pending</div>
        </div>

        {/* Confirmed */}
        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, #4361ee 15%, transparent)' }}>
              <Icon name="check" size={16} color="#4361ee" />
            </span>
            <span className="kpi-trend neutral">Locked</span>
          </div>
          <div className="kpi-num" style={{ color: '#4361ee' }}>
            {formatKpi(summaryKPIs.confirmedBookings)}
          </div>
          <div className="kpi-lbl">Confirmed</div>
        </div>

        {/* Customer Arrived */}
        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, #f72585 15%, transparent)' }}>
              <Icon name="users" size={16} color="#f72585" />
            </span>
            <span className="kpi-trend neutral">At Host Stand</span>
          </div>
          <div className="kpi-num" style={{ color: '#f72585' }}>
            {formatKpi(summaryKPIs.arrivedBookings)}
          </div>
          <div className="kpi-lbl">Customer Arrived</div>
        </div>

        {/* Completed */}
        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)' }}>
              <Icon name="check" size={16} color="var(--success)" />
            </span>
            <span className="kpi-trend neutral">Fulfilled</span>
          </div>
          <div className="kpi-num">
            {formatKpi(summaryKPIs.completedBookings)}
          </div>
          <div className="kpi-lbl">Completed</div>
        </div>

        {/* Cancelled */}
        <div className="card kpi-card">
          <div className="kpi-top">
            <span className="kpi-icon-wrap" style={{ background: 'color-mix(in srgb, var(--danger) 15%, transparent)' }}>
              <Icon name="close" size={16} color="var(--danger)" />
            </span>
            <span className="kpi-trend negative">Cancelled</span>
          </div>
          <div className="kpi-num" style={{ color: 'var(--danger)' }}>
            {formatKpi(summaryKPIs.cancelledBookings)}
          </div>
          <div className="kpi-lbl">Cancelled</div>
        </div>
      </div>

      {/* SUB-VIEW A: TODAY'S DINING SCHEDULE (Requirement 13) */}
      {activeTab === 'schedule' && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="clock" size={18} color="var(--accent)" />
                <span>Today's Dining Schedule</span>
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                Chronologically ordered floor service schedule to assess real-time dining load.
              </p>
            </div>
            <span className="operational-tag" style={{ background: 'var(--accent)', color: '#fff' }}>
              {todayDiningSchedule.length} Reservations Scheduled Today
            </span>
          </div>

          {todayDiningSchedule.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Icon name="calendar" size={40} color="var(--text-muted)" />
              <h4 style={{ margin: '12px 0 4px' }}>No dining schedules for today yet.</h4>
              <p style={{ fontSize: 13, margin: 0 }}>Reservations made for today will immediately appear in this timeline.</p>
            </div>
          ) : (
            <div className="schedule-timeline" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayDiningSchedule.map((b, idx) => (
                <div
                  key={b.id}
                  onClick={() => handleOpenBookingDetails(b)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'var(--bg)',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 85, fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>
                      {b.time}
                    </div>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />
                    <div>
                      <strong style={{ fontSize: 14 }}>#{b.id}</strong> — <span>{b.customerName || b.userName || 'Diner'}</span>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {b.restaurantName} • Table {b.tableNumber || b.tableId || 'T-12'} • {b.seating}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                      {b.guests} Guests
                    </span>
                    {b.preOrderItems && b.preOrderItems.length > 0 && (
                      <span className="preorder-cell-pill" style={{ fontSize: 11 }}>
                        <Icon name="food" size={11} color="var(--accent)" />
                        <span>Pre-Order ({b.preOrderItems.length})</span>
                      </span>
                    )}
                    <span className={`status-pill ${b.status === 'Cancelled' ? 'danger' : b.status === 'Dining' ? 'warning' : 'success'}`}>
                      {b.status}
                    </span>
                    <button type="button" className="btn btn-xs btn-primary">
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW B: TABLE AVAILABILITY MATRIX (Requirement 14) */}
      {activeTab === 'tables' && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="table" size={18} color="var(--success)" />
                <span>Table Availability Matrix</span>
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                Current live operational state of restaurant floor stations.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {onAddTable && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onAddTable}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                >
                  <Icon name="add" size={14} color="#ffffff" />
                  <span>+ Add Table</span>
                </button>
              )}
              <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} /> Available</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4361ee' }} /> Reserved</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f72585' }} /> Occupied</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fb8500' }} /> Cleaning</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} /> Maintenance</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {liveTableMatrix.map(t => {
              const statusColor = t.currentStatus === 'Available' ? 'var(--success)'
                : t.currentStatus === 'Reserved' ? '#4361ee'
                : t.currentStatus === 'Occupied' ? '#f72585'
                : t.currentStatus === 'Cleaning' ? '#fb8500'
                : 'var(--text-muted)';

              return (
                <div
                  key={t.id}
                  style={{
                    padding: 14,
                    background: 'var(--bg)',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${statusColor}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 16 }}>Table {t.number}</strong>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: statusColor,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: `color-mix(in srgb, ${statusColor} 14%, transparent)`,
                      }}
                    >
                      {t.currentStatus}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Capacity: <strong>{t.capacity} Guests</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Type: <strong>{t.seatingType}</strong> ({t.location})
                  </div>

                  {t.activeBooking && (
                    <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed var(--border)', fontSize: 11.5 }}>
                      <span className="muted">Booked: </span>
                      <strong
                        onClick={() => handleOpenBookingDetails(t.activeBooking)}
                        style={{ cursor: 'pointer', color: 'var(--accent)' }}
                      >
                        {t.activeBooking.id} ({t.activeBooking.time})
                      </strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 11 & 12. SEARCH AND FILTER CONTROL BAR */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        {/* Search Input Row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-wrap" style={{ flex: '1 1 280px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              className="admin-form-input"
              placeholder="Search by Booking ID, Customer name, Email, Phone, Restaurant, Table number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 38, width: '100%' }}
            />
          </div>

          {/* Quick Clear Button */}
          {(searchQuery || statusFilter !== 'all' || restaurantFilter !== 'all' || dateFilter !== 'all' || seatingFilter !== 'all' || guestsFilter !== 'all') && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* 12. Detailed Filter Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 14 }}>
          {/* Status Filter */}
          <div className="filter-field-col">
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Status</label>
            <select
              className="admin-form-select small"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {BOOKING_STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Restaurant Filter */}
          <div className="filter-field-col">
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Restaurant</label>
            <select
              className="admin-form-select small"
              value={restaurantFilter}
              onChange={e => setRestaurantFilter(e.target.value)}
            >
              <option value="all">All Restaurants</option>
              <option value="r2">ABC Restaurant</option>
              {restaurantsList.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="filter-field-col">
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Date</label>
            <select
              className="admin-form-select small"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            >
              <option value="all">All Dates</option>
              <option value="today">Today (26 Sep)</option>
              <option value="tomorrow">Tomorrow (27 Sep)</option>
              <option value="this-week">This Week</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <div className="filter-field-col">
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Select Date</label>
              <input
                type="date"
                className="admin-form-input small"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
              />
            </div>
          )}

          {/* Seating Filter */}
          <div className="filter-field-col">
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Seating</label>
            <select
              className="admin-form-select small"
              value={seatingFilter}
              onChange={e => setSeatingFilter(e.target.value)}
            >
              <option value="all">All Seating</option>
              <option value="Indoor">Indoor</option>
              <option value="Outdoor">Outdoor</option>
              <option value="Window">Window</option>
              <option value="Family">Family</option>
            </select>
          </div>

          {/* Guests Count Filter */}
          <div className="filter-field-col">
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Guests</label>
            <select
              className="admin-form-select small"
              value={guestsFilter}
              onChange={e => setGuestsFilter(e.target.value)}
            >
              <option value="all">Any Guest Count</option>
              <option value="1-2">1 - 2 Guests</option>
              <option value="3-4">3 - 4 Guests</option>
              <option value="5-6">5 - 6 Guests</option>
              <option value="7+">7+ Guests</option>
            </select>
          </div>
        </div>
      </div>

      {/* 23. Loading & Error States */}
      {isLoading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 14px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Refreshing reservation feeds and table states...</p>
        </div>
      ) : errorState ? (
        <div className="card" style={{ padding: 36, textAlign: 'center', borderColor: 'var(--danger)' }}>
          <Icon name="alert-triangle" size={38} color="var(--danger)" />
          <h3 style={{ margin: '12px 0 6px', color: 'var(--danger)' }}>Failed to load bookings</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>An operational sync error occurred.</p>
          <button type="button" className="btn btn-sm btn-primary" onClick={handleRetry}>
            Retry
          </button>
        </div>
      ) : (
        /* 3. BOOKINGS TABLE VIEW */
        <div className="card table-container-card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Guests</th>
                  <th>Table</th>
                  <th>Seating Preference</th>
                  <th>Food Pre-order</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <Icon name="calendar" size={40} color="var(--text-muted)" />
                      <h4 style={{ margin: '12px 0 6px', fontSize: 16 }}>
                        {bookings.length === 0
                          ? 'No table bookings yet.'
                          : searchQuery.trim()
                          ? 'No matching bookings found.'
                          : activeTab !== 'history' && summaryKPIs.upcomingBookings === 0
                          ? 'No upcoming bookings.'
                          : 'No matching bookings found.'}
                      </h4>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                        {bookings.length === 0
                          ? 'Reservations will automatically populate here as diners book tables.'
                          : searchQuery.trim()
                          ? 'Try adjusting your search criteria or resetting filters.'
                          : activeTab !== 'history' && summaryKPIs.upcomingBookings === 0
                          ? 'There are currently no active upcoming table reservations scheduled.'
                          : 'Try adjusting your search criteria or resetting filters.'}
                      </p>
                      {(searchQuery || statusFilter !== 'all' || restaurantFilter !== 'all') && (
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={handleResetFilters}
                          style={{ marginTop: 12 }}
                        >
                          Clear Active Filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map(b => {
                    const custName = b.customerName || b.userName || 'Customer';
                    const hasPreOrder = b.preOrderItems && b.preOrderItems.length > 0;

                    return (
                      <tr key={b.id} className="booking-table-row">
                        {/* Booking ID */}
                        <td>
                          <button
                            type="button"
                            className="btn btn-link btn-xs"
                            style={{ fontWeight: 800, padding: 0 }}
                            onClick={() => handleOpenBookingDetails(b)}
                          >
                            {b.id}
                          </button>
                        </td>

                        {/* Customer */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                              <SafeImage
                                image={b.customerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                alt={custName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                            <div>
                              <strong
                                style={{ cursor: 'pointer', color: 'var(--text)' }}
                                onClick={() => {
                                  const custObj = users.find(u => u.email === b.userEmail);
                                  if (custObj) handleOpenCustomerModal(custObj);
                                }}
                              >
                                {custName}
                              </strong>
                              {b.userEmail && <div className="muted" style={{ fontSize: 11 }}>{b.userEmail}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Restaurant */}
                        <td>
                          <strong>{b.restaurantName}</strong>
                        </td>

                        {/* Date */}
                        <td>{b.dateFormatted || b.date}</td>

                        {/* Time */}
                        <td style={{ fontWeight: 700 }}>{b.time}</td>

                        {/* Guests */}
                        <td>
                          <span style={{ fontWeight: 700 }}>{b.guests} Guests</span>
                        </td>

                        {/* Table */}
                        <td>
                          <span className="badge-station" style={{ padding: '3px 8px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', fontWeight: 800, fontSize: 12 }}>
                            {b.tableNumber || b.tableId || 'T-12'}
                          </span>
                        </td>

                        {/* Seating Preference */}
                        <td>{b.seating || 'Standard'}</td>

                        {/* Food Pre-order */}
                        <td>
                          {hasPreOrder ? (
                            <div
                              className="preorder-cell-pill"
                              onClick={() => handleOpenBookingDetails(b)}
                              title="Click to view food pre-orders"
                              style={{ cursor: 'pointer' }}
                            >
                              <Icon name="food" size={12} color="var(--accent)" />
                              <span>Yes</span>
                            </div>
                          ) : (
                            <span className="muted" style={{ fontSize: 12 }}>No</span>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`status-pill ${
                            b.status === 'Cancelled' ? 'danger'
                            : b.status === 'Completed' ? 'success'
                            : b.status === 'Confirmed' ? 'primary'
                            : b.status === 'Customer Arrived' ? 'warning'
                            : b.status === 'Dining' ? 'info'
                            : 'neutral'
                          }`}>
                            {b.status}
                          </span>
                        </td>

                        {/* Action */}
                        <td>
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            onClick={() => handleOpenBookingDetails(b)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredBookings.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50]}
            itemName="bookings"
          />
        </div>
      )}

      {/* 5. Booking Details Modal */}
      {bookingDetailsModalOpen && selectedBooking && (
        <BookingDetailsModal
          isOpen={bookingDetailsModalOpen}
          onClose={() => {
            setBookingDetailsModalOpen(false);
            setSelectedBooking(null);
            navigate(activeTab === 'history' ? '/admin/booking-history' : '/admin/bookings');
          }}
          booking={bookings.find(b => b.id === selectedBooking.id) || selectedBooking}
          onSelectBooking={(b) => handleOpenBookingDetails(b)}
          onViewLinkedOrder={(orderId) => {
            setBookingDetailsModalOpen(false);
            if (onOpenOrder) onOpenOrder(orderId);
            else navigate(`/admin/orders/${orderId}`);
          }}
          onOpenCustomer={(c) => {
            setSelectedCustomer(c);
            setCustomerModalOpen(true);
          }}
        />
      )}

      {/* 4 & 21. Customer Details Modal with Customer Booking History */}
      {customerModalOpen && selectedCustomer && (
        <CustomerDetailsModal
          isOpen={customerModalOpen}
          onClose={() => {
            setCustomerModalOpen(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          orders={orders}
          bookings={bookings}
          onSelectOrder={(ord) => {
            setCustomerModalOpen(false);
            if (onOpenOrder) onOpenOrder(ord.id);
            else navigate(`/admin/orders/${ord.id}`);
          }}
          onSelectBooking={(bk) => {
            setCustomerModalOpen(false);
            handleOpenBookingDetails(bk);
          }}
        />
      )}
    </div>
  );
}
