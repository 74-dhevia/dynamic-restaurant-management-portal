import React, { useState, useMemo } from 'react';
import { CATEGORIES, FOODS } from '../data/mockData';
import FoodCard from '../components/FoodCard';

export default function Categories() {
  const [active, setActive] = useState(CATEGORIES[0].id);
  const items = useMemo(() => FOODS.filter(f => f.category === active), [active]);

  return (
    <div>
      <h1>Categories</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', marginBottom: 20 }}>
        {CATEGORIES.map(c => (
          <div key={c.id} className={`card`} style={{ padding: 14, textAlign: 'center', cursor: 'pointer', borderColor: active === c.id ? 'var(--accent)' : undefined }}
            onClick={() => setActive(c.id)}>
            <div style={{ fontSize: 28 }}>{c.emoji}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 4 }}>{c.name}</div>
          </div>
        ))}
      </div>
      <h2>{CATEGORIES.find(c => c.id === active)?.name}</h2>
      <div className="grid">{items.map(f => <FoodCard key={f.id} food={f} />)}</div>
    </div>
  );
}
