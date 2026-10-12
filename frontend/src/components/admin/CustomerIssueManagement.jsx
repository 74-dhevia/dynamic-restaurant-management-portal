import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../Icon';
import Pagination from '../Pagination';
import IssueDetailsModal from './IssueDetailsModal';
import {
  issueApiService,
  ISSUE_TYPES,
  ISSUE_PRIORITIES,
  ISSUE_STATUS_SEQUENCE,
} from '../../services/issueApiService';
import { useToast } from '../../contexts/ToastContext';

export default function CustomerIssueManagement({
  subId,
  onOpenOrder,
  onOpenBooking,
  onOpenIncident,
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'this-week' | 'this-month' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'priority'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, priorityFilter, typeFilter, restaurantFilter, dateFilter, customDate, sortBy]);

  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return issues.slice(start, start + pageSize);
  }, [issues, currentPage, pageSize]);
  const [summary, setSummary] = useState({
    open: 0,
    highPriority: 0,
    processing: 0,
    waitingForCustomer: 0,
    resolved: 0,
    closed: 0,
    total: 0,
  });

  // Selected issue for modal inspection (/admin/issues/:issueId)
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Load issues and summary
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [issueList, summaryData] = await Promise.all([
        issueApiService.getIssues({
          search: searchQuery,
          status: statusFilter,
          priority: priorityFilter,
          issueType: typeFilter,
          restaurant: restaurantFilter,
          date: dateFilter,
          customDate: customDate,
          sort: sortBy,
        }),
        issueApiService.getIssueSummary(),
      ]);

      setIssues(issueList);
      setSummary(summaryData);

      // Handle subId from URL (/admin/issues/:issueId)
      if (subId) {
        const found = issueList.find((i) => i.id.toLowerCase() === subId.toLowerCase());
        if (found) {
          const detailed = await issueApiService.getIssueById(found.id);
          setSelectedIssue(detailed || found);
        } else {
          const direct = await issueApiService.getIssueById(subId);
          if (direct) setSelectedIssue(direct);
        }
      }
    } catch (err) {
      console.error('Failed to load customer issues:', err);
      setError('Unable to load customer issues. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    statusFilter,
    priorityFilter,
    typeFilter,
    restaurantFilter,
    dateFilter,
    customDate,
    sortBy,
    subId,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Unique restaurants for filter dropdown
  const restaurantOptions = useMemo(() => {
    const rests = new Set();
    issues.forEach((i) => {
      if (i.restaurantName) rests.add(i.restaurantName);
    });
    return Array.from(rests).sort();
  }, [issues]);

  // Handle open issue details
  const handleOpenIssue = async (issue) => {
    const detailed = await issueApiService.getIssueById(issue.id);
    setSelectedIssue(detailed || issue);
    navigate(`/admin/issues/${issue.id}`, { replace: false });
  };

  // Handle close issue details
  const handleCloseIssue = () => {
    setSelectedIssue(null);
    navigate('/admin/issues', { replace: false });
  };

  // Handle Status Change
  const handleStatusChange = async (issueId, newStatus) => {
    try {
      const updated = await issueApiService.updateIssueStatus(issueId, newStatus);
      showToast(`Issue #${issueId} status updated to ${newStatus}`, 'success');

      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i))
      );

      if (selectedIssue && selectedIssue.id === issueId) {
        const detailed = await issueApiService.getIssueById(issueId);
        setSelectedIssue(detailed);
      }

      // Re-fetch summary
      const updatedSummary = await issueApiService.getIssueSummary();
      setSummary(updatedSummary);
    } catch (err) {
      console.error(err);
      showToast('Failed to update issue status', 'error');
    }
  };

  // Handle Send Admin Response
  const handleSendResponse = async (issueId, responseText) => {
    try {
      const updated = await issueApiService.sendIssueResponse(issueId, responseText);
      showToast('Response sent to customer', 'success');

      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? updated : i))
      );

      if (selectedIssue && selectedIssue.id === issueId) {
        const detailed = await issueApiService.getIssueById(issueId);
        setSelectedIssue(detailed);
      }

      // Re-fetch summary
      const updatedSummary = await issueApiService.getIssueSummary();
      setSummary(updatedSummary);
    } catch (err) {
      console.error(err);
      showToast('Failed to send response', 'error');
    }
  };

  // Handle Notify Affected Customer
  const handleNotifyAffectedCustomer = async (issueId) => {
    try {
      await issueApiService.notifyAffectedCustomer(issueId);
      showToast('Affected customer alert sent successfully', 'success');

      if (selectedIssue && selectedIssue.id === issueId) {
        const detailed = await issueApiService.getIssueById(issueId);
        setSelectedIssue(detailed);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to notify customer', 'error');
    }
  };

  // Handle Start Refund
  const handleStartRefund = async (issueId) => {
    try {
      await issueApiService.startIssueRefund(issueId);
      showToast('Refund initiated. Status set to Processing.', 'success');

      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, refundStatus: 'Processing' } : i))
      );

      if (selectedIssue && selectedIssue.id === issueId) {
        const detailed = await issueApiService.getIssueById(issueId);
        setSelectedIssue(detailed);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to start refund', 'error');
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTypeFilter('all');
    setRestaurantFilter('all');
    setDateFilter('all');
    setCustomDate('');
    setSortBy('newest');
  };

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    typeFilter !== 'all' ||
    restaurantFilter !== 'all' ||
    dateFilter !== 'all' ||
    sortBy !== 'newest';

  // Priority badge styling
  const renderPriorityBadge = (p) => {
    let bg = 'rgba(56, 189, 248, 0.15)';
    let color = '#38bdf8';
    let border = 'rgba(56, 189, 248, 0.3)';

    if (p === 'Critical') {
      bg = 'rgba(239, 68, 68, 0.15)';
      color = '#ef4444';
      border = 'rgba(239, 68, 68, 0.35)';
    } else if (p === 'High') {
      bg = 'rgba(249, 115, 22, 0.15)';
      color = '#f97316';
      border = 'rgba(249, 115, 22, 0.35)';
    } else if (p === 'Medium') {
      bg = 'rgba(234, 179, 8, 0.15)';
      color = '#eab308';
      border = 'rgba(234, 179, 8, 0.35)';
    }

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 700,
          background: bg,
          color,
          border: `1px solid ${border}`,
        }}
      >
        {p}
      </span>
    );
  };

  // Status badge styling
  const renderStatusBadge = (st) => {
    let bg = 'rgba(255, 255, 255, 0.08)';
    let color = 'var(--text-muted, #8b949e)';
    let border = 'var(--border, #333a4d)';

    if (st === 'Open') {
      bg = 'rgba(56, 189, 248, 0.15)';
      color = '#38bdf8';
      border = 'rgba(56, 189, 248, 0.3)';
    } else if (st === 'Processing') {
      bg = 'rgba(251, 133, 0, 0.15)';
      color = '#fb8500';
      border = 'rgba(251, 133, 0, 0.3)';
    } else if (st === 'Waiting for Customer') {
      bg = 'rgba(168, 85, 247, 0.15)';
      color = '#a855f7';
      border = 'rgba(168, 85, 247, 0.3)';
    } else if (st === 'Resolved') {
      bg = 'rgba(46, 204, 113, 0.15)';
      color = '#2ecc71';
      border = 'rgba(46, 204, 113, 0.3)';
    } else if (st === 'Closed') {
      bg = 'rgba(149, 165, 166, 0.15)';
      color = '#95a5a6';
      border = 'rgba(149, 165, 166, 0.3)';
    }

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '3px 9px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          background: bg,
          color,
          border: `1px solid ${border}`,
          whiteSpace: 'nowrap',
        }}
      >
        ● {st}
      </span>
    );
  };

  return (
    <div className="admin-view-fade customer-issues-container" style={{ paddingBottom: '40px' }}>
      {/* 1. Header */}
      <div className="view-header-row" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🛡️</span> Customer Issues
          </h1>
          <p className="view-sub" style={{ marginTop: '4px' }}>
            Review and resolve customer-reported problems.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadData}
            title="Refresh Issues"
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* 2. Issue Summary (6 Metrics) */}
      <div
        className="kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {/* Open Issues */}
        <div className="card kpi-card" style={{ padding: '16px', background: 'rgba(56, 189, 248, 0.05)' }}>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: '#38bdf8' }}>
            Open Issues
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#38bdf8' }}>
            {summary.open}
          </div>
        </div>

        {/* High Priority */}
        <div className="card kpi-card" style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: '#ef4444' }}>
            High Priority
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#ef4444' }}>
            {summary.highPriority}
          </div>
        </div>

        {/* Processing */}
        <div className="card kpi-card" style={{ padding: '16px', background: 'rgba(251, 133, 0, 0.05)' }}>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: '#fb8500' }}>
            Processing
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#fb8500' }}>
            {summary.processing}
          </div>
        </div>

        {/* Waiting for Customer */}
        <div className="card kpi-card" style={{ padding: '16px', background: 'rgba(168, 85, 247, 0.05)' }}>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: '#a855f7' }}>
            Waiting for Customer
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#a855f7' }}>
            {summary.waitingForCustomer}
          </div>
        </div>

        {/* Resolved */}
        <div className="card kpi-card" style={{ padding: '16px', background: 'rgba(46, 204, 113, 0.05)' }}>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: '#2ecc71' }}>
            Resolved
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#2ecc71' }}>
            {summary.resolved}
          </div>
        </div>

        {/* Closed */}
        <div className="card kpi-card" style={{ padding: '16px' }}>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
            Closed
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#95a5a6' }}>
            {summary.closed}
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #8b949e)',
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search Issue ID, Customer, Order ID, Booking ID, Restaurant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-input"
              style={{
                width: '100%',
                paddingLeft: '36px',
                height: '38px',
                borderRadius: '8px',
                background: 'var(--bg, #141721)',
                border: '1px solid var(--border, #333a4d)',
                color: 'var(--text, #fff)',
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted, #8b949e)', fontWeight: 600 }}>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
              style={{
                height: '38px',
                borderRadius: '8px',
                background: 'var(--bg, #141721)',
                border: '1px solid var(--border, #333a4d)',
                color: 'var(--text, #fff)',
                padding: '0 10px',
              }}
            >
              <option value="all">All Statuses</option>
              {ISSUE_STATUS_SEQUENCE.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted, #8b949e)', fontWeight: 600 }}>Priority:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="admin-select"
              style={{
                height: '38px',
                borderRadius: '8px',
                background: 'var(--bg, #141721)',
                border: '1px solid var(--border, #333a4d)',
                color: 'var(--text, #fff)',
                padding: '0 10px',
              }}
            >
              <option value="all">All Priorities</option>
              {ISSUE_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Issue Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted, #8b949e)', fontWeight: 600 }}>Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="admin-select"
              style={{
                height: '38px',
                borderRadius: '8px',
                background: 'var(--bg, #141721)',
                border: '1px solid var(--border, #333a4d)',
                color: 'var(--text, #fff)',
                padding: '0 10px',
                maxWidth: '160px',
              }}
            >
              <option value="all">All Types</option>
              {ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted, #8b949e)', fontWeight: 600 }}>Date:</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="admin-select"
              style={{
                height: '38px',
                borderRadius: '8px',
                background: 'var(--bg, #141721)',
                border: '1px solid var(--border, #333a4d)',
                color: 'var(--text, #fff)',
                padding: '0 10px',
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="admin-input"
              style={{
                height: '38px',
                borderRadius: '8px',
                background: 'var(--bg, #141721)',
                border: '1px solid var(--border, #333a4d)',
                color: 'var(--text, #fff)',
                padding: '0 10px',
              }}
            />
          )}

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted, #8b949e)', fontWeight: 600 }}>Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="admin-select"
              style={{
                height: '38px',
                borderRadius: '8px',
                background: 'var(--bg, #141721)',
                border: '1px solid var(--border, #333a4d)',
                color: 'var(--text, #fff)',
                padding: '0 10px',
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Highest Priority</option>
            </select>
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleResetFilters}
              style={{ borderRadius: '8px' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Table / Loading / Empty State */}
      {loading ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <h3 style={{ margin: 0 }}>Loading customer issues...</h3>
          <p className="muted" style={{ marginTop: '6px' }}>
            Synchronizing support tickets and operational incident connections.
          </p>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', color: 'var(--danger)', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ margin: 0 }}>{error}</h3>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginTop: '16px' }}
            onClick={loadData}
          >
            Retry Loading
          </button>
        </div>
      ) : issues.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛡️</div>
          <h3 style={{ margin: 0 }}>
            {hasActiveFilters ? 'No matching records found.' : 'No customer issues yet.'}
          </h3>
          <p className="muted" style={{ marginTop: '6px' }}>
            {hasActiveFilters
              ? 'Try modifying your search query or reset the applied filters.'
              : 'Customer support tickets and reported problems will appear here.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ marginTop: '16px' }}
              onClick={handleResetFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="card table-container-card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '100px' }}>Issue ID</th>
                  <th style={{ minWidth: '160px' }}>Customer</th>
                  <th style={{ minWidth: '160px' }}>Order / Booking</th>
                  <th style={{ minWidth: '150px' }}>Issue Type</th>
                  <th style={{ minWidth: '110px' }}>Priority</th>
                  <th style={{ minWidth: '110px' }}>Date</th>
                  <th style={{ minWidth: '140px' }}>Status</th>
                  <th style={{ minWidth: '120px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedIssues.map((issue) => (
                  <tr key={issue.id}>
                    {/* Issue ID */}
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text, #fff)' }}>
                        #{issue.id}
                      </span>
                      {issue.isKitchenIncidentRelated && (
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#ef4444',
                            fontWeight: 700,
                            marginTop: '2px',
                          }}
                        >
                          ⚠️ Kitchen Incident
                        </div>
                      )}
                    </td>

                    {/* Customer */}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text, #fff)' }}>
                        {issue.customerName || 'Customer'}
                      </div>
                      {issue.customerEmail && (
                        <div className="muted" style={{ fontSize: '11px' }}>
                          {issue.customerEmail}
                        </div>
                      )}
                    </td>

                    {/* Order / Booking */}
                    <td>
                      {issue.orderId ? (
                        <div>
                          <div style={{ fontWeight: 600, color: '#38bdf8', fontSize: '13px' }}>
                            📦 Order #{issue.orderId}
                          </div>
                          <div className="muted" style={{ fontSize: '11px' }}>
                            {issue.restaurantName}
                          </div>
                        </div>
                      ) : issue.bookingId ? (
                        <div>
                          <div style={{ fontWeight: 600, color: '#2ecc71', fontSize: '13px' }}>
                            📅 Booking #{issue.bookingId}
                          </div>
                          <div className="muted" style={{ fontSize: '11px' }}>
                            {issue.restaurantName}
                          </div>
                        </div>
                      ) : (
                        <span className="muted" style={{ fontSize: '12px' }}>
                          General / Account
                        </span>
                      )}
                    </td>

                    {/* Issue Type */}
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {issue.issueType}
                      </span>
                    </td>

                    {/* Priority */}
                    <td>{renderPriorityBadge(issue.priority)}</td>

                    {/* Date */}
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {issue.reportedAt
                        ? new Date(issue.reportedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>

                    {/* Status */}
                    <td>{renderStatusBadge(issue.status)}</td>

                    {/* Action */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-xs btn-primary"
                        onClick={() => handleOpenIssue(issue)}
                        style={{ borderRadius: '6px', fontWeight: 600 }}
                      >
                        View &amp; Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={issues.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
            itemName="issues"
          />
        </div>
      )}

      {/* 5. Issue Details Modal (/admin/issues/:issueId) */}
      {selectedIssue && (
        <IssueDetailsModal
          issue={selectedIssue}
          onClose={handleCloseIssue}
          onStatusChange={handleStatusChange}
          onSendResponse={handleSendResponse}
          onNotifyAffectedCustomer={handleNotifyAffectedCustomer}
          onStartRefund={handleStartRefund}
          onViewOrder={(orderId) => {
            handleCloseIssue();
            if (onOpenOrder) onOpenOrder(orderId);
            else navigate(`/admin/orders/${orderId}`);
          }}
          onViewBooking={(bookingId) => {
            handleCloseIssue();
            if (onOpenBooking) onOpenBooking(bookingId);
            else navigate(`/admin/bookings/${bookingId}`);
          }}
          onViewIncident={(incidentId) => {
            handleCloseIssue();
            if (onOpenIncident) onOpenIncident(incidentId);
            else navigate(`/admin/kitchen`);
          }}
        />
      )}
    </div>
  );
}
