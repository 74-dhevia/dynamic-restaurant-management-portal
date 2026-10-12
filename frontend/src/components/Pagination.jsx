import React from 'react';
import Icon from './Icon';

/**
 * Universal Production Pagination Component
 * Supports:
 * - Active page highlight
 * - Previous / Next navigation with disabled states
 * - Page number buttons with intelligent ellipsis
 * - Rows per page selector (10 / 20 / 50)
 * - "Showing X–Y of Z items" descriptor
 * - Responsive layout
 */
export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemName = 'records',
  className = '',
}) {
  if (totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (safeCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages];
  };

  const handlePrev = () => {
    if (safeCurrentPage > 1 && onPageChange) {
      onPageChange(safeCurrentPage - 1);
    }
  };

  const handleNext = () => {
    if (safeCurrentPage < totalPages && onPageChange) {
      onPageChange(safeCurrentPage + 1);
    }
  };

  const handlePageClick = (p) => {
    if (typeof p === 'number' && p !== safeCurrentPage && onPageChange) {
      onPageChange(p);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`admin-pagination-bar ${className}`}>
      <div className="admin-pagination-info">
        <span>Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalItems}</strong> {itemName}</span>
      </div>

      <div className="admin-pagination-actions">
        {onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 0 && (
          <div className="pagination-page-size-wrap">
            <span className="page-size-label">Rows per page:</span>
            <select
              className="admin-form-select small pagination-page-size-select"
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
                if (onPageChange) onPageChange(1);
              }}
              aria-label="Rows per page"
            >
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}

        <div className="admin-pagination-controls">
          <button
            type="button"
            className="pagination-btn pagination-nav-btn prev"
            disabled={safeCurrentPage <= 1}
            onClick={handlePrev}
            aria-label="Previous Page"
            title="Previous Page"
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>←</span>
            <span>Previous</span>
          </button>

          <div className="pagination-number-list">
            {pageNumbers.map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                    …
                  </span>
                );
              }
              const isSelected = p === safeCurrentPage;
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  className={`pagination-btn pagination-num-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => handlePageClick(p)}
                  aria-current={isSelected ? 'page' : undefined}
                  aria-label={`Page ${p}`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="pagination-btn pagination-nav-btn next"
            disabled={safeCurrentPage >= totalPages}
            onClick={handleNext}
            aria-label="Next Page"
            title="Next Page"
          >
            <span>Next</span>
            <span style={{ fontSize: 13, lineHeight: 1 }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
