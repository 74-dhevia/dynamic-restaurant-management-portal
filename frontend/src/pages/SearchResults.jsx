import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FOODS, RESTAURANTS } from '../data/mockData';
import { useDebounce } from '../hooks/useDebounce';
import { useLocalStorage } from '../hooks/useLocalStorage';
import FoodCard from '../components/FoodCard';
import RestaurantCard from '../components/RestaurantCard';

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const debouncedQuery = useDebounce(query, 300);
  const [recentSearches, setRecentSearches] = useLocalStorage('zestro_recentSearches', []);

  useEffect(() => { setQuery(initialQ); }, [initialQ]);

  useEffect(() => {
    if (debouncedQuery.trim().length > 1) {
      setParams({ q: debouncedQuery });
      setRecentSearches(prev => [debouncedQuery, ...prev.filter(s => s !== debouncedQuery)].slice(0, 8));
    }
    // eslint-disable-next-line
  }, [debouncedQuery]);

  const q = debouncedQuery.trim().toLowerCase();
  const foods = useMemo(() => q ? FOODS.filter(f => (f?.name || '').toLowerCase().includes(q) || (f?.category || '').includes(q)) : [], [q]);
  const restaurants = useMemo(() => q ? RESTAURANTS.filter(r => (r?.name || '').toLowerCase().includes(q) || (Array.isArray(r?.categories) && r.categories.some(c => (c || '').includes(q)))) : [], [q]);

  const clearHistory = useCallback(() => setRecentSearches([]), [setRecentSearches]);

  return (
    <div>
      <h1>Search</h1>
      <div className="input-group">
        <input placeholder="Search food, restaurants, cuisines..." value={query} onChange={e => setQuery(e.target.value)} autoFocus />
      </div>

      {!q && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>Recent Searches</h3>
            {recentSearches.length > 0 && <button className="btn btn-sm btn-secondary" onClick={clearHistory}>Clear</button>}
          </div>
          <div className="chip-row">
            {recentSearches.length === 0 && <p className="muted">No recent searches yet.</p>}
            {recentSearches.map(s => <button key={s} className="chip" onClick={() => setQuery(s)}>{s}</button>)}
          </div>
        </div>
      )}

      {q && (
        <>
          <h3>Restaurants ({restaurants.length})</h3>
          {restaurants.length ? <div className="grid">{restaurants.map(r => <RestaurantCard key={r.id} r={r} />)}</div> : <p className="muted">No restaurants matched.</p>}
          <h3 style={{ marginTop: 20 }}>Food ({foods.length})</h3>
          {foods.length ? <div className="grid">{foods.map(f => <FoodCard key={f.id} food={f} />)}</div> : <p className="muted">No food items matched.</p>}
        </>
      )}
    </div>
  );
}
