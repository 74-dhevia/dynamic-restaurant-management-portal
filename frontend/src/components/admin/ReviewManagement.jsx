import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Icon from '../Icon';
import ReviewDetailsModal from './ReviewDetailsModal';
import Pagination from '../Pagination';
import { reviewApiService } from '../../services/reviewApiService';
import { updateReviewStatus } from '../../redux/slices/reviewSlice';
import { useToast } from '../../contexts/ToastContext';

export default function ReviewManagement({ subId, onOpenOrder }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  // Redux sync
  const reduxReviews = useSelector((s) => s.review?.reviews || []);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all' | '5' | '4' | '3' | '2' | '1'
  const [verificationFilter, setVerificationFilter] = useState('all'); // 'all' | 'verified' | 'not-verified'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Published' | 'Hidden' | 'Flagged'
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [foodFilter, setFoodFilter] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reviews & Summary data
  const [reviews, setReviews] = useState([]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, ratingFilter, verificationFilter, statusFilter, restaurantFilter, foodFilter]);

  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return reviews.slice(start, start + pageSize);
  }, [reviews, currentPage, pageSize]);
  const [summary, setSummary] = useState({
    total: 0,
    avgRating: '0.0',
    star5: 0,
    star4: 0,
    star3: 0,
    star2: 0,
    star1: 0,
    verifiedCount: 0,
    distribution: [],
  });

  // Selected review for details modal (/admin/reviews/:reviewId)
  const [selectedReview, setSelectedReview] = useState(null);

  // Load reviews and summary
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [reviewList, summaryData] = await Promise.all([
        reviewApiService.getReviews({
          search: searchQuery,
          rating: ratingFilter,
          verification: verificationFilter,
          status: statusFilter,
          restaurant: restaurantFilter,
          food: foodFilter,
        }),
        reviewApiService.getReviewSummary(),
      ]);

      setReviews(reviewList);
      setSummary(summaryData);

      // Handle direct subId route
      if (subId) {
        const found = reviewList.find((r) => r.id === subId);
        if (found) {
          setSelectedReview(found);
        } else {
          // If not in filtered list, try fetching directly
          const direct = await reviewApiService.getReviewById(subId);
          if (direct) setSelectedReview(direct);
        }
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setError('Unable to load reviews. Please verify network and try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, ratingFilter, verificationFilter, statusFilter, restaurantFilter, foodFilter, subId]);

  useEffect(() => {
    loadData();
  }, [loadData, reduxReviews]);

  // Distinct restaurant and food options for dropdown filters
  const filterOptions = useMemo(() => {
    const rawAll = reviewApiService.getStoredReviews ? reviewApiService.getStoredReviews() : reviews;
    const rests = new Set();
    const foods = new Set();

    (rawAll || []).forEach((r) => {
      if (r.restaurantName) rests.add(r.restaurantName);
      if (r.foodName) foods.add(r.foodName);
    });

    return {
      restaurants: Array.from(rests).sort(),
      foods: Array.from(foods).sort(),
    };
  }, [reviews]);

  // Handle status update (Hide / Restore / Flag)
  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      await reviewApiService.updateReviewStatus(reviewId, newStatus);
      dispatch(updateReviewStatus({ id: reviewId, status: newStatus }));

      showToast(`Review marked as ${newStatus}`, 'success');

      // Update local state
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r))
      );

      if (selectedReview && selectedReview.id === reviewId) {
        setSelectedReview((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      // Re-fetch summary
      const updatedSummary = await reviewApiService.getReviewSummary();
      setSummary(updatedSummary);
    } catch (err) {
      console.error(err);
      showToast('Failed to update review status', 'error');
    }
  };

  // Open details modal
  const handleOpenDetails = (review) => {
    setSelectedReview(review);
    navigate(`/admin/reviews/${review.id}`, { replace: false });
  };

  // Close details modal
  const handleCloseDetails = () => {
    setSelectedReview(null);
    navigate('/admin/reviews', { replace: false });
  };

  // Handle navigate to order
  const handleNavigateOrder = (orderId) => {
    if (onOpenOrder) {
      onOpenOrder(orderId);
    } else {
      navigate(`/admin/orders/${orderId}`);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setRatingFilter('all');
    setVerificationFilter('all');
    setStatusFilter('all');
    setRestaurantFilter('all');
    setFoodFilter('all');
  };

  const hasActiveFilters =
    searchQuery ||
    ratingFilter !== 'all' ||
    verificationFilter !== 'all' ||
    statusFilter !== 'all' ||
    restaurantFilter !== 'all' ||
    foodFilter !== 'all';

  return (
    <div className="admin-view-fade review-management-container" style={{ paddingBottom: '40px' }}>
      {/* 1. Page Header */}
      <div className="view-header-row" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⭐</span> Reviews &amp; Ratings
          </h1>
          <p className="view-sub" style={{ marginTop: '4px' }}>
            Monitor customer feedback across restaurants and food items.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadData}
            title="Refresh Reviews"
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* 2. Review Summary (8 Metric Cards) */}
      <div
        className="kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {/* Total Reviews */}
        <div className="card kpi-card" style={{ padding: '16px' }}>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Reviews
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: 'var(--text, #fff)' }}>
            {summary.total}
          </div>
        </div>

        {/* Average Rating */}
        <div className="card kpi-card" style={{ padding: '16px', background: 'rgba(255, 183, 3, 0.06)' }}>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: '#ffb703' }}>
            Average Rating
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: '#ffb703' }}>
            {summary.avgRating} ★
          </div>
        </div>

        {/* 5 Star */}
        <div className="card kpi-card" style={{ padding: '16px' }}>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
            5 Star
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: '#2ecc71' }}>
            {summary.star5}
          </div>
        </div>

        {/* 4 Star */}
        <div className="card kpi-card" style={{ padding: '16px' }}>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
            4 Star
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: '#38bdf8' }}>
            {summary.star4}
          </div>
        </div>

        {/* 3 Star */}
        <div className="card kpi-card" style={{ padding: '16px' }}>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
            3 Star
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: '#f59e0b' }}>
            {summary.star3}
          </div>
        </div>

        {/* 2 Star */}
        <div className="card kpi-card" style={{ padding: '16px' }}>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
            2 Star
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: '#fb923c' }}>
            {summary.star2}
          </div>
        </div>

        {/* 1 Star */}
        <div className="card kpi-card" style={{ padding: '16px' }}>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
            1 Star
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: '#ef4444' }}>
            {summary.star1}
          </div>
        </div>

        {/* Verified Reviews */}
        <div className="card kpi-card" style={{ padding: '16px', background: 'rgba(46, 204, 113, 0.06)' }}>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: '#2ecc71' }}>
            Verified Reviews
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: '#2ecc71' }}>
            {summary.verifiedCount}
          </div>
        </div>
      </div>

      {/* 3. Rating Distribution Card */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📊</span> Rating Distribution
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {summary.distribution && summary.distribution.length > 0 ? (
            summary.distribution.map((dist) => (
              <div
                key={dist.star}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '13px',
                }}
              >
                <div style={{ width: '45px', fontWeight: 700, color: '#ffb703', textAlign: 'right' }}>
                  {dist.star} ★
                </div>
                <div
                  style={{
                    flex: 1,
                    height: '14px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '7px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${dist.percentage}%`,
                      background:
                        dist.star === 5
                          ? '#2ecc71'
                          : dist.star === 4
                          ? '#38bdf8'
                          : dist.star === 3
                          ? '#f59e0b'
                          : dist.star === 2
                          ? '#fb923c'
                          : '#ef4444',
                      borderRadius: '7px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <div style={{ width: '90px', fontSize: '12px', color: 'var(--text-muted, #8b949e)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text, #fff)' }}>{dist.count}</span> ({dist.percentage}%)
                </div>
              </div>
            ))
          ) : (
            <div className="muted" style={{ fontSize: '13px' }}>Calculating rating distribution...</div>
          )}
        </div>
      </div>

      {/* 4. Search and Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          {/* Search Box */}
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
              placeholder="Search by Customer, Restaurant, Food, Review, or Order ID..."
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

          {/* Rating Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted, #8b949e)', fontWeight: 600 }}>Rating:</label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
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
              <option value="all">All Stars</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {/* Verification Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted, #8b949e)', fontWeight: 600 }}>Verification:</label>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
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
              <option value="all">All</option>
              <option value="verified">Verified Only</option>
              <option value="not-verified">Not Verified</option>
            </select>
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
              <option value="Published">Published</option>
              <option value="Hidden">Hidden</option>
              <option value="Flagged">Flagged</option>
            </select>
          </div>

          {/* Restaurant Filter */}
          {filterOptions.restaurants.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted, #8b949e)', fontWeight: 600 }}>Restaurant:</label>
              <select
                value={restaurantFilter}
                onChange={(e) => setRestaurantFilter(e.target.value)}
                className="admin-select"
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  background: 'var(--bg, #141721)',
                  border: '1px solid var(--border, #333a4d)',
                  color: 'var(--text, #fff)',
                  padding: '0 10px',
                  maxWidth: '180px',
                }}
              >
                <option value="all">All Restaurants</option>
                {filterOptions.restaurants.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

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

      {/* 5. Review Table / Loading / Empty State */}
      {loading ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <h3 style={{ margin: 0 }}>Loading reviews &amp; ratings...</h3>
          <p className="muted" style={{ marginTop: '6px' }}>
            Aggregating customer feedback and verification signals.
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
      ) : reviews.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>💬</div>
          <h3 style={{ margin: 0 }}>
            {hasActiveFilters ? 'No matching records found.' : 'No reviews available.'}
          </h3>
          <p className="muted" style={{ marginTop: '6px' }}>
            {hasActiveFilters
              ? 'Try adjusting your search query or clear the active filters.'
              : 'Customer feedback submitted in-app will appear here.'}
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
                  <th style={{ minWidth: '150px' }}>Customer</th>
                  <th style={{ minWidth: '180px' }}>Restaurant / Food</th>
                  <th style={{ minWidth: '120px' }}>Rating</th>
                  <th style={{ minWidth: '220px' }}>Review</th>
                  <th style={{ minWidth: '140px' }}>Verified</th>
                  <th style={{ minWidth: '90px' }}>Date</th>
                  <th style={{ minWidth: '100px' }}>Status</th>
                  <th style={{ minWidth: '140px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReviews.map((r) => {
                  const ratingStars = r.rating || r.stars || 5;
                  const isVerified = r.verified === true;
                  const status = r.status || 'Published';

                  return (
                    <tr key={r.id}>
                      {/* Customer */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text, #fff)' }}>
                          {r.userName || r.customerName || r.author || 'Customer'}
                        </div>
                        {r.userEmail && (
                          <div className="muted" style={{ fontSize: '11px' }}>
                            {r.userEmail}
                          </div>
                        )}
                      </td>

                      {/* Restaurant / Food */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text, #fff)' }}>
                          {r.foodName || 'Meal'}
                        </div>
                        <div className="muted" style={{ fontSize: '12px' }}>
                          🏪 {r.restaurantName || 'ZESTRO Partner'}
                        </div>
                      </td>

                      {/* Rating */}
                      <td>
                        <div style={{ color: '#ffb703', fontSize: '15px', letterSpacing: '1px' }}>
                          {'★'.repeat(ratingStars)}
                          <span style={{ color: 'rgba(255, 183, 3, 0.25)' }}>
                            {'★'.repeat(5 - ratingStars)}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted, #8b949e)' }}>
                          {ratingStars}.0 / 5
                        </span>
                      </td>

                      {/* Review Text */}
                      <td>
                        <div
                          style={{
                            fontSize: '13px',
                            color: 'var(--text, #e6edf3)',
                            lineHeight: '1.4',
                            maxHeight: '44px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          "{r.comment || r.text || r.review || ''}"
                        </div>
                        {r.orderId && (
                          <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>
                            Order: #{r.orderId}
                          </div>
                        )}
                      </td>

                      {/* Verified Badge */}
                      <td>
                        {isVerified ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: 'rgba(46, 204, 113, 0.15)',
                              color: '#2ecc71',
                              border: '1px solid rgba(46, 204, 113, 0.3)',
                            }}
                          >
                            ✓ Verified Purchase
                          </span>
                        ) : (
                          <span className="muted" style={{ fontSize: '11px' }}>
                            —
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {r.dateFormatted || r.date || '—'}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 9px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background:
                              status === 'Published'
                                ? 'rgba(46, 204, 113, 0.12)'
                                : status === 'Hidden'
                                ? 'rgba(149, 165, 166, 0.15)'
                                : 'rgba(231, 76, 60, 0.15)',
                            color:
                              status === 'Published'
                                ? '#2ecc71'
                                : status === 'Hidden'
                                ? '#95a5a6'
                                : '#e74c3c',
                            border: `1px solid ${
                              status === 'Published'
                                ? 'rgba(46, 204, 113, 0.25)'
                                : status === 'Hidden'
                                ? 'rgba(149, 165, 166, 0.25)'
                                : 'rgba(231, 76, 60, 0.25)'
                            }`,
                          }}
                        >
                          {status}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => handleOpenDetails(r)}
                            style={{ borderRadius: '6px' }}
                          >
                            View
                          </button>

                          {status === 'Published' ? (
                            <button
                              type="button"
                              className="btn btn-xs"
                              style={{
                                background: 'rgba(234, 179, 8, 0.12)',
                                color: '#eab308',
                                border: '1px solid rgba(234, 179, 8, 0.3)',
                                borderRadius: '6px',
                              }}
                              onClick={() => handleStatusChange(r.id, 'Hidden')}
                              title="Hide Review"
                            >
                              Hide
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-xs"
                              style={{
                                background: 'rgba(46, 204, 113, 0.12)',
                                color: '#2ecc71',
                                border: '1px solid rgba(46, 204, 113, 0.3)',
                                borderRadius: '6px',
                              }}
                              onClick={() => handleStatusChange(r.id, 'Published')}
                              title="Restore Review"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {reviews.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={reviews.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50]}
              itemName="reviews"
            />
          )}
        </div>
      )}

      {/* 6. Review Details Modal (/admin/reviews/:reviewId) */}
      {selectedReview && (
        <ReviewDetailsModal
          review={selectedReview}
          onClose={handleCloseDetails}
          onStatusChange={handleStatusChange}
          onNavigateOrder={handleNavigateOrder}
        />
      )}
    </div>
  );
}
