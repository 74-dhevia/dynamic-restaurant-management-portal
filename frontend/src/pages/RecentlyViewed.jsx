import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FOODS, RESTAURANTS } from '../data/mockData';
import FoodCard from '../components/FoodCard';
import RestaurantCard from '../components/RestaurantCard';
import Pagination from '../components/Pagination';
import { clearRecentlyViewed } from '../redux/slices/recentlyViewedSlice';

export default function RecentlyViewed() {
  const items = useSelector(s => s.recentlyViewed.items);
  const dispatch = useDispatch();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  if (!items.length) return <div className="empty-state"><span className="emoji">👀</span>Nothing viewed yet — browse some food or restaurants!</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>👀 Recently Viewed</h1>
        <button className="btn btn-sm btn-secondary" onClick={() => dispatch(clearRecentlyViewed())}>Clear</button>
      </div>
      <div className="grid">
        {paginatedItems.map(item => item.type === 'restaurant'
          ? <RestaurantCard key={item.id} r={RESTAURANTS.find(r => r.id === item.id) || item} />
          : <FoodCard key={item.id} food={FOODS.find(f => f.id === item.id) || item} />
        )}
      </div>
      <Pagination
        currentPage={currentPage}
        totalItems={items.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        }}
        itemName="viewed items"
      />
    </div>
  );
}
