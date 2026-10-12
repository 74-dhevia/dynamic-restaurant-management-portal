import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Icon from '../Icon';
import SafeImage from '../SafeImage';
import ConfirmationModal from '../ConfirmationModal';
import Pagination from '../Pagination';
import ChefModal from './ChefModal';
import ChefProfileModal from './ChefProfileModal';
import ChefPerformanceModal from './ChefPerformanceModal';
import { useToast } from '../../contexts/ToastContext';
import {
  addChef,
  updateChef,
  deleteChef,
  toggleChefStatus,
  assignChefRestaurant,
} from '../../redux/slices/chefSlice';

export default function ChefManagement({ subId = null, extraId = null }) {
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const chefs = useSelector(s => s.chef?.chefs || []);
  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants || []);

  const [searchQuery, setSearchQuery] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [viewLayout, setViewLayout] = useState('cards'); // 'cards' | 'table'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, restaurantFilter, statusFilter, availabilityFilter]);

  // Modals state
  const [chefModalOpen, setChefModalOpen] = useState(false);
  const [editingChef, setEditingChef] = useState(null);
  const [selectedChefForProfile, setSelectedChefForProfile] = useState(null);
  const [selectedChefForPerf, setSelectedChefForPerf] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Status counts for top summary bar
  const metrics = useMemo(() => {
    return {
      total: chefs.length,
      available: chefs.filter(c => c.availability === 'Available').length,
      busy: chefs.filter(c => c.availability === 'Busy').length,
      unavailable: chefs.filter(c => c.availability === 'Temporarily Unavailable').length,
      inactive: chefs.filter(c => c.status === 'Inactive').length,
    };
  }, [chefs]);

  // Filtered chefs list
  const filteredChefs = useMemo(() => {
    return chefs.filter(c => {
      // Restaurant filter
      if (restaurantFilter !== 'all' && c.restaurantId !== restaurantFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;

      // Availability filter
      if (availabilityFilter !== 'all' && c.availability !== availabilityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesSpec = c.specialization?.toLowerCase().includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);
        const matchesRest = c.restaurantName?.toLowerCase().includes(q);
        if (!matchesName && !matchesSpec && !matchesEmail && !matchesRest) return false;
      }

      return true;
    });
  }, [chefs, restaurantFilter, statusFilter, availabilityFilter, searchQuery]);

  const paginatedChefs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredChefs.slice(start, start + pageSize);
  }, [filteredChefs, currentPage, pageSize]);

  const handleSaveChef = (chefData) => {
    if (editingChef) {
      dispatch(updateChef({ id: editingChef.id, ...chefData }));
      showToast(`Chef "${chefData.name}" updated successfully.`, 'success');
    } else {
      dispatch(addChef(chefData));
      showToast(`Master Chef "${chefData.name}" onboarded and assigned to ${chefData.restaurantName}.`, 'success');
    }
    setChefModalOpen(false);
    setEditingChef(null);
  };

  const handleToggleStatus = (cId, cName) => {
    dispatch(toggleChefStatus(cId));
    showToast(`Chef "${cName}" status toggled.`, 'info');
  };

  const handleQuickRestaurantChange = (cId, newRestId) => {
    const foundRest = reduxRestaurants.find(r => r.id === newRestId);
    if (foundRest) {
      dispatch(assignChefRestaurant({
        chefId: cId,
        restaurantId: foundRest.id,
        restaurantName: foundRest.name,
      }));
      showToast(`Assigned chef to ${foundRest.name}.`, 'success');
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      dispatch(deleteChef(deleteTarget.id));
      showToast(`Chef "${deleteTarget.name}" deleted.`, 'info');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="admin-view-fade chef-management-view">
      {/* View Header (Section 8) */}
      <div className="view-header-row">
        <div>
          <h1 className="view-title">Master Chefs &amp; Kitchen Artisans ({chefs.length})</h1>
          <p className="view-sub">
            Manage culinary masters, live kitchen statuses, branch station assignments, and emergency incident logs
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingChef(null);
              setChefModalOpen(true);
            }}
            id="btn-add-master-chef"
          >
            <Icon name="add" size={14} />
            <span>Add Master Chef</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner (Section 8) */}
      <div className="chef-metrics-banner">
        <div className="card chef-stat-card">
          <span className="stat-label">Total Chefs</span>
          <span className="stat-num">{metrics.total}</span>
        </div>
        <div className="card chef-stat-card">
          <span className="stat-label">🟢 Available</span>
          <span className="stat-num" style={{ color: 'var(--success)' }}>{metrics.available}</span>
        </div>
        <div className="card chef-stat-card">
          <span className="stat-label">🟡 Busy</span>
          <span className="stat-num" style={{ color: '#f59e0b' }}>{metrics.busy}</span>
        </div>
        <div className="card chef-stat-card">
          <span className="stat-label">🔴 Temporarily Unavailable</span>
          <span className="stat-num" style={{ color: 'var(--danger)' }}>{metrics.unavailable}</span>
        </div>
        <div className="card chef-stat-card">
          <span className="stat-label">Inactive</span>
          <span className="stat-num" style={{ color: 'var(--text-muted)' }}>{metrics.inactive}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card chef-filter-bar" style={{ marginTop: 16 }}>
        <div className="filter-group-left">
          <div className="search-input-wrap">
            <Icon name="search" size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search chef by name, specialization, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="btn-clear" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>

          <div className="filter-dropdown-wrap">
            <label>Station:</label>
            <select
              value={restaurantFilter}
              onChange={e => setRestaurantFilter(e.target.value)}
              className="admin-form-select small"
            >
              <option value="all">All Restaurants</option>
              {reduxRestaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-dropdown-wrap">
            <label>Kitchen Status:</label>
            <select
              value={availabilityFilter}
              onChange={e => setAvailabilityFilter(e.target.value)}
              className="admin-form-select small"
            >
              <option value="all">All Kitchen Statuses</option>
              <option value="Available">🟢 Available</option>
              <option value="Busy">🟡 Busy</option>
              <option value="Temporarily Unavailable">🔴 Temporarily Unavailable</option>
            </select>
          </div>

          <div className="filter-dropdown-wrap">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="admin-form-select small"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="filter-group-right">
          <div className="layout-toggle-group">
            <button
              type="button"
              className={`layout-btn ${viewLayout === 'cards' ? 'active' : ''}`}
              onClick={() => setViewLayout('cards')}
              title="Card Grid Layout"
            >
              <Icon name="image" size={15} />
            </button>
            <button
              type="button"
              className={`layout-btn ${viewLayout === 'table' ? 'active' : ''}`}
              onClick={() => setViewLayout('table')}
              title="Dense Table Layout"
            >
              <Icon name="reports" size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chef Views: Grid vs Table */}
      {filteredChefs.length === 0 ? (
        <div className="card empty-chefs-card" style={{ marginTop: 18, padding: 36, textAlign: 'center' }}>
          <Icon name="chef" size={48} color="var(--text-muted)" />
          <h3 style={{ marginTop: 12 }}>No master chefs found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search criteria or add a new master chef.</p>
        </div>
      ) : viewLayout === 'cards' ? (
        /* Cards Layout */
        <div className="admin-cards-grid chef-admin-cards-grid" style={{ marginTop: 18 }}>
          {paginatedChefs.map(ch => (
            <div key={ch.id} className="card chef-admin-card">
              <div className="chef-card-header">
                <div className="chef-card-avatar">
                  {ch.photo ? (
                    <SafeImage
                      image={ch.photo}
                      alt={ch.name}
                      style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="chef-initials-avatar">
                      <Icon name="chef" size={28} />
                    </div>
                  )}
                </div>
                <div className="chef-card-title-col">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong className="name">{ch.name}</strong>
                    <span className={`status-pill mini ${ch.status?.toLowerCase()}`}>{ch.status}</span>
                  </div>
                  <div className="role">{ch.specialization}</div>
                  <div className="rest" style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 600 }}>
                    {ch.restaurantName}
                  </div>
                </div>
              </div>

              <div className="chef-card-body">
                {/* Kitchen Status Badge (Section 4) */}
                <div className="chef-kitchen-status-row">
                  <span className="row-label">Kitchen Status:</span>
                  <span className={`kitchen-status-chip ${ch.availability?.toLowerCase() || 'available'}`}>
                    <span className="dot" />
                    <span>{ch.availability || 'Available'}</span>
                  </span>
                </div>

                {/* Contact & Station Info (Section 8) */}
                <div className="chef-contact-row" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  <div>📧 {ch.email}</div>
                  <div>📞 {ch.phone || '+91 98400 00000'}</div>
                </div>

                <div className="chef-stats-row" style={{ marginTop: 8 }}>
                  <span><strong>{ch.experience}</strong> Exp</span>
                  <span><strong>★ {ch.rating}</strong> Rating</span>
                  <span className={`workload-pill ${ch.workload?.toLowerCase() || 'normal'}`}>
                    {ch.workload || 'Normal'}
                  </span>
                </div>

                {/* Quick Restaurant Assignment (Section 8) */}
                <div className="chef-station-assign-row" style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Assigned Restaurant:</label>
                  <select
                    value={ch.restaurantId}
                    onChange={e => handleQuickRestaurantChange(ch.id, e.target.value)}
                    className="admin-form-select extra-small"
                    style={{ width: '100%', marginTop: 2, fontSize: 12 }}
                  >
                    {reduxRestaurants.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="chef-card-footer">
                <button
                  type="button"
                  className="btn btn-xs btn-primary"
                  onClick={() => setSelectedChefForProfile(ch)}
                  title="View complete chef profile and incident dossier"
                >
                  Profile
                </button>

                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={() => setSelectedChefForPerf(ch)}
                  title="View cooking speed and guest ratings"
                >
                  Performance
                </button>

                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={() => {
                    setEditingChef(ch);
                    setChefModalOpen(true);
                  }}
                  title="Edit chef details"
                >
                  Edit
                </button>

                <button
                  type="button"
                  className={`btn btn-xs ${ch.status === 'Active' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                  onClick={() => handleToggleStatus(ch.id, ch.name)}
                  title={ch.status === 'Active' ? 'Deactivate chef' : 'Activate chef'}
                >
                  {ch.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  type="button"
                  className="btn btn-xs btn-outline-danger"
                  onClick={() => setDeleteTarget(ch)}
                  title="Remove chef"
                >
                  <Icon name="delete" size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Dense Table Layout (Section 8) */
        <div className="card table-responsive" style={{ marginTop: 18 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Master Chef</th>
                <th>Contact Info</th>
                <th>Specialization &amp; Exp</th>
                <th>Assigned Restaurant</th>
                <th>Kitchen Status</th>
                <th>Account Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedChefs.map(ch => (
                <tr key={ch.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {ch.photo ? (
                        <SafeImage image={ch.photo} alt={ch.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div className="chef-initials-avatar mini"><Icon name="chef" size={16} /></div>
                      )}
                      <div>
                        <strong>{ch.name}</strong>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Rating: ★ {ch.rating}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12.5 }}>{ch.email}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{ch.phone || '--'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{ch.specialization}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ch.experience}</div>
                  </td>
                  <td>
                    <select
                      value={ch.restaurantId}
                      onChange={e => handleQuickRestaurantChange(ch.id, e.target.value)}
                      className="admin-form-select extra-small"
                      style={{ fontSize: 12 }}
                    >
                      {reduxRestaurants.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`kitchen-status-chip ${ch.availability?.toLowerCase() || 'available'}`}>
                      <span className="dot" />
                      <span>{ch.availability || 'Available'}</span>
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill mini ${ch.status?.toLowerCase()}`}>{ch.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-xs btn-primary"
                        onClick={() => setSelectedChefForProfile(ch)}
                      >
                        Profile
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() => {
                          setEditingChef(ch);
                          setChefModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`btn btn-xs ${ch.status === 'Active' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        onClick={() => handleToggleStatus(ch.id, ch.name)}
                      >
                        {ch.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-danger"
                        onClick={() => setDeleteTarget(ch)}
                      >
                        <Icon name="delete" size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredChefs.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredChefs.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50]}
          itemName="chefs"
        />
      )}

      {/* Chef Profile Modal (Section 9 - Does NOT display password) */}
      {selectedChefForProfile && (
        <ChefProfileModal
          isOpen={!!selectedChefForProfile}
          onClose={() => setSelectedChefForProfile(null)}
          chef={selectedChefForProfile}
        />
      )}

      {/* Chef Performance Modal */}
      {selectedChefForPerf && (
        <ChefPerformanceModal
          isOpen={!!selectedChefForPerf}
          onClose={() => setSelectedChefForPerf(null)}
          chef={selectedChefForPerf}
        />
      )}

      {/* Add / Edit Chef Modal (Section 8) */}
      <ChefModal
        isOpen={chefModalOpen}
        onClose={() => {
          setChefModalOpen(false);
          setEditingChef(null);
        }}
        onSave={handleSaveChef}
        chef={editingChef}
        restaurants={reduxRestaurants}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmationModal
          isOpen={!!deleteTarget}
          title="Delete Master Chef"
          message={`Are you sure you want to remove "${deleteTarget.name}" from ${deleteTarget.restaurantName}? Their kitchen access credentials will also be revoked.`}
          confirmLabel="Delete Chef"
          confirmVariant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
