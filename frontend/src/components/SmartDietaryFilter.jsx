import React from 'react';
import { DIETARY_PREFERENCES } from '../services/aiApiService';

export default function SmartDietaryFilter({ activePreferences = [], onTogglePreference, onClearAll }) {
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '12px 16px',
      margin: '14px 0',
      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13.5 }}>
          <span>🥗</span>
          <span>Smart Food Preferences:</span>
          {activePreferences.length > 0 && (
            <span style={{
              background: 'color-mix(in srgb, var(--accent) 15%, var(--bg))',
              color: 'var(--accent)',
              fontSize: 11,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 12,
            }}>
              {activePreferences.length} active
            </span>
          )}
        </div>

        {activePreferences.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--danger)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              padding: '2px 6px',
            }}
          >
            ✕ Clear All Preferences
          </button>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 4,
        scrollbarWidth: 'none',
      }}>
        {DIETARY_PREFERENCES.map(pref => {
          const isActive = activePreferences.includes(pref.id);
          return (
            <button
              key={pref.id}
              type="button"
              onClick={() => onTogglePreference(pref.id)}
              title={pref.desc}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 700,
                border: isActive ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                background: isActive ? 'color-mix(in srgb, var(--accent) 12%, var(--bg-elevated))' : 'var(--bg)',
                color: isActive ? 'var(--accent)' : 'var(--text)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              <span>{pref.emoji}</span>
              <span>{pref.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
        ℹ️ Preference-based culinary filtering. Not presented as medical or clinical allergen advice.
      </div>
    </div>
  );
}
