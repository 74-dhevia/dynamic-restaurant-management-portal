import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addReview, deleteReview } from '../../redux/slices/reviewSlice';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/Icon';
import Pagination from '../../components/Pagination';
import { RESTAURANTS, FOODS } from '../../data/mockData';

export default function CustomerReviews() {
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const currentUser = useSelector(s => s.auth?.currentUser);
  const allReviews = useSelector(s => s.review?.reviews || []);
  const customerOrders = useSelector(s => s.order?.orders || []);

  const [activeTab, setActiveTab] = useState('my-reviews');
  const [selectedRestaurant, setSelectedRestaurant] = useState(RESTAURANTS[0]?.name || 'Dindigul Thalappakatti');
  const [selectedFood, setSelectedFood] = useState(FOODS[0]?.name || 'Chicken Biryani');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  // Pagination states
  const [myReviewsPage, setMyReviewsPage] = useState(1);
  const [myReviewsPageSize, setMyReviewsPageSize] = useState(10);
  const [communityPage, setCommunityPage] = useState(1);
  const [communityPageSize, setCommunityPageSize] = useState(10);

  // Filter My Reviews
  const myReviews = useMemo(() => {
    if (!currentUser) return allReviews.slice(0, 3);
    const matched = allReviews.filter(r => 
      r.userId === currentUser.id ||
      r.userEmail === currentUser.email ||
      r.customerEmail === currentUser.email ||
      (r.userName && currentUser.fullName && r.userName.toLowerCase().includes(currentUser.fullName.toLowerCase()))
    );
    return matched.length > 0 ? matched : allReviews.filter(r => r.userId === 'u_dheiva' || r.userName === 'Dheiva');
  }, [allReviews, currentUser]);

  const ratingHistory = useMemo(() => {
    const count = myReviews.length;
    const avg = count > 0 
      ? (myReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / count).toFixed(1)
      : '5.0';
    const fiveStars = myReviews.filter(r => r.rating === 5).length;
    return { count, avg, fiveStars };
  }, [myReviews]);

  const paginatedMyReviews = useMemo(() => {
    const start = (myReviewsPage - 1) * myReviewsPageSize;
    return myReviews.slice(start, start + myReviewsPageSize);
  }, [myReviews, myReviewsPage, myReviewsPageSize]);

  const paginatedCommunityReviews = useMemo(() => {
    const start = (communityPage - 1) * communityPageSize;
    return allReviews.slice(start, start + communityPageSize);
  }, [allReviews, communityPage, communityPageSize]);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast('Please enter your review feedback', 'error');
      return;
    }

    const newRev = {
      id: `rev_${Date.now()}`,
      userId: currentUser?.id || 'u_dheiva',
      userName: currentUser?.fullName || 'Valued Foodie',
      customerName: currentUser?.fullName || 'Valued Foodie',
      userEmail: currentUser?.email || 'dheiva@example.com',
      restaurantName: selectedRestaurant,
      foodName: selectedFood,
      rating,
      comment: comment.trim(),
      date: new Date().toISOString().slice(0, 10),
      dateFormatted: 'Today',
      status: 'Published',
    };

    dispatch(addReview(newRev));
    showToast('Review submitted and published successfully!', 'success');
    setComment('');
    setActiveTab('my-reviews');
  };

  const handleDelete = (id) => {
    dispatch(deleteReview(id));
    showToast('Review removed', 'info');
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="reviews" size={26} color="var(--accent)" />
            <span>Reviews, Ratings &amp; Culinary Accolades</span>
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
            Share authentic feedback on dishes, service quality, and chef craft.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setActiveTab('write')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
        >
          <Icon name="edit" size={16} color="#fff" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Rating History Summary Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14,
        marginBottom: 24,
      }}>
        <div className="card" style={{ padding: '16px 20px', borderRadius: 14 }}>
          <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Reviews Authored</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', marginTop: 4 }}>
            {ratingHistory.count}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderRadius: 14 }}>
          <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Average Rating Given</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{ratingHistory.avg}</span>
            <Icon name="ratings" size={22} color="var(--accent)" filled />
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderRadius: 14 }}>
          <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>5-Star Honors</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#10b981', marginTop: 4 }}>
            {ratingHistory.fiveStars}
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="tab-row" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={activeTab === 'my-reviews' ? 'active' : ''}
          onClick={() => setActiveTab('my-reviews')}
        >
          My Reviews ({myReviews.length})
        </button>
        <button
          type="button"
          className={activeTab === 'write' ? 'active' : ''}
          onClick={() => setActiveTab('write')}
        >
          Write a Review
        </button>
        <button
          type="button"
          className={activeTab === 'community' ? 'active' : ''}
          onClick={() => setActiveTab('community')}
        >
          Restaurant &amp; Food Reviews
        </button>
        <button
          type="button"
          className={activeTab === 'chefs' ? 'active' : ''}
          onClick={() => setActiveTab('chefs')}
        >
          Chef Reviews
        </button>
      </div>

      {/* Tab Content: My Reviews */}
      {activeTab === 'my-reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {myReviews.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>⭐</span>
              <h3>No reviews yet</h3>
              <p className="muted">You haven't written any reviews yet. Share your experience with local restaurants!</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setActiveTab('write')}
                style={{ marginTop: 12 }}
              >
                Write Your First Review
              </button>
            </div>
          ) : (
            <>
              {paginatedMyReviews.map(r => (
                <div key={r.id} className="card" style={{ padding: 18, borderRadius: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <strong style={{ fontSize: 16, color: 'var(--text)' }}>{r.restaurantName}</strong>
                      {r.foodName && (
                        <span className="muted" style={{ fontSize: 13, marginLeft: 8 }}>
                          • {r.foodName}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Icon
                            key={star}
                            name="ratings"
                            size={16}
                            color={star <= r.rating ? '#ffb703' : 'var(--border)'}
                            filled={star <= r.rating}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => handleDelete(r.id)}
                        title="Delete Review"
                        style={{ color: 'var(--danger)', padding: 4 }}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>

                  <p style={{ margin: '6px 0 10px', fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
                    "{r.comment}"
                  </p>

                  <div className="muted" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>📅 {r.dateFormatted || r.date}</span>
                    {r.orderId && <span>• Order #{r.orderId}</span>}
                    <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Verified Diner</span>
                  </div>
                </div>
              ))}

              <Pagination
                currentPage={myReviewsPage}
                totalItems={myReviews.length}
                pageSize={myReviewsPageSize}
                onPageChange={setMyReviewsPage}
                onPageSizeChange={(sz) => {
                  setMyReviewsPageSize(sz);
                  setMyReviewsPage(1);
                }}
                itemName="reviews"
              />
            </>
          )}
        </div>
      )}

      {/* Tab Content: Write a Review Form */}
      {activeTab === 'write' && (
        <form onSubmit={handleSubmitReview} className="card" style={{ padding: 24, borderRadius: 16 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 800 }}>
            Share Your Dining Experience
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                Select Restaurant
              </label>
              <select
                value={selectedRestaurant}
                onChange={e => setSelectedRestaurant(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)' }}
              >
                {RESTAURANTS.map(r => (
                  <option key={r.id} value={r.name}>{r.name} ({r.location || 'Local'})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                Dish / Menu Item
              </label>
              <select
                value={selectedFood}
                onChange={e => setSelectedFood(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)' }}
              >
                {FOODS.map(f => (
                  <option key={f.id} value={f.name}>{f.name} (₹{f.price})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Star Rating Picker */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
              Overall Rating: {rating} of 5 Stars
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                  title={`${star} Star`}
                >
                  <Icon
                    name="ratings"
                    size={28}
                    color={(hoverRating || rating) >= star ? '#ffb703' : 'var(--border)'}
                    filled={(hoverRating || rating) >= star}
                  />
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Review Comments &amp; Taste Notes
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Describe the aroma, taste, temperature, table presentation, or staff service..."
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setActiveTab('my-reviews')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ fontWeight: 700 }}
            >
              Publish Review
            </button>
          </div>
        </form>
      )}

      {/* Tab Content: Community Reviews */}
      {activeTab === 'community' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paginatedCommunityReviews.map(r => (
            <div key={r.id} className="card" style={{ padding: 16, borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: 15 }}>{r.restaurantName}</strong>
                  {r.foodName && <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>• {r.foodName}</span>}
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Icon key={star} name="ratings" size={14} color={star <= r.rating ? '#ffb703' : 'var(--border)'} filled={star <= r.rating} />
                  ))}
                </div>
              </div>
              <p style={{ margin: '6px 0', fontSize: 13.5, color: 'var(--text)' }}>"{r.comment}"</p>
              <div className="muted" style={{ fontSize: 11 }}>By {r.userName || 'Diner'} • {r.dateFormatted || r.date}</div>
            </div>
          ))}

          <Pagination
            currentPage={communityPage}
            totalItems={allReviews.length}
            pageSize={communityPageSize}
            onPageChange={setCommunityPage}
            onPageSizeChange={(sz) => {
              setCommunityPageSize(sz);
              setCommunityPage(1);
            }}
            itemName="community reviews"
          />
        </div>
      )}

      {/* Tab Content: Chef Reviews */}
      {activeTab === 'chefs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { name: 'Chef Murugesan P.', restaurant: 'Dindigul Thalappakatti', spec: 'Biriyani Master & Woodfire Grills', rating: 4.9, quote: 'Celebrated for traditional woodfire Seeraga Samba dum biryani.' },
            { name: 'Chef S. Meenakshi Sundaram', restaurant: 'A2B - Adyar Ananda Bhavan', spec: 'Traditional South Indian Tiffin & Filter Coffee', rating: 4.8, quote: 'Revered for pillowy Ghee Podi Idlis and artisanal Madras filter brews.' },
            { name: 'Chef Arulmozhi Nathan', restaurant: 'Sree Annapoorna', spec: 'Tirunelveli Halwa & Traditional Sweets', rating: 5.0, quote: 'Master confectioner creating slow-stirred wheat halwa.' },
            { name: 'Chef David Raj', restaurant: 'Junior Kuppanna', spec: 'Kothu Parotta & Midnight Street Wok', rating: 4.9, quote: 'Precision iron wok rhythmic shredding and aromatic salna.' },
          ].map(c => (
            <div key={c.name} className="card" style={{ padding: 18, borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 15%, var(--bg))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="chef" size={22} color="var(--accent)" />
                </div>
                <div>
                  <strong style={{ fontSize: 14, display: 'block' }}>{c.name}</strong>
                  <span className="muted" style={{ fontSize: 11 }}>{c.spec}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>
                ⭐ {c.rating} / 5.0 • {c.restaurant}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                "{c.quote}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
