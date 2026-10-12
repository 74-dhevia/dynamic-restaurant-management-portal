import React from 'react';
import Icon from '../Icon';

export default function KitchenWorkloadInsights({ workloadData }) {
  if (!workloadData || !workloadData.hasData) {
    return (
      <div className="card kitchen-workload-card">
        <div className="workload-header">
          <div className="workload-title-col">
            <Icon name="sparkles" size={17} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Kitchen Workload Insights</h3>
          </div>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          Insufficient data to calculate workload.
        </p>
      </div>
    );
  }

  const {
    workloadLevel,
    totalDishesAwaiting,
    estimatedDurationMinutes,
    suggestedDish,
    suggestionReason,
  } = workloadData;

  const levelColor =
    workloadLevel === 'High' ? 'var(--danger, #ef4444)' :
    workloadLevel === 'Moderate' ? '#f59e0b' :
    'var(--success, #22c55e)';

  const levelBg =
    workloadLevel === 'High' ? 'rgba(239, 68, 68, 0.12)' :
    workloadLevel === 'Moderate' ? 'rgba(245, 158, 11, 0.12)' :
    'rgba(34, 197, 94, 0.12)';

  return (
    <div className="card kitchen-workload-card">
      <div className="workload-header">
        <div className="workload-title-col">
          <Icon name="sparkles" size={17} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Kitchen Workload Insights</h3>
          <span className="workload-rule-badge">Rule-Based Estimation</span>
        </div>
        <div
          className="workload-level-pill"
          style={{
            background: levelBg,
            color: levelColor,
            border: `1px solid ${levelColor}40`,
          }}
        >
          <span className="dot" style={{ background: levelColor }} />
          <span>Workload: <strong>{workloadLevel.toUpperCase()}</strong></span>
        </div>
      </div>

      <div className="workload-metrics-strip">
        <div className="workload-mini-metric">
          <span className="metric-label">Dishes Awaiting Prep</span>
          <strong className="metric-num">{totalDishesAwaiting} portions</strong>
        </div>
        <div className="workload-mini-metric">
          <span className="metric-label">Estimated Queue Duration</span>
          <strong className="metric-num">~{estimatedDurationMinutes} mins</strong>
        </div>
      </div>

      {suggestedDish ? (
        <div className="workload-suggestion-box">
          <div className="suggestion-lead">
            <span className="suggestion-badge">Suggested Preparation Priority</span>
            <span
              className={`priority-chip ${suggestedDish.priority.toLowerCase()}`}
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                fontWeight: 700,
              }}
            >
              Priority: {suggestedDish.priority}
            </span>
          </div>

          <div className="suggestion-dish-line">
            <strong>{suggestedDish.name}</strong>
            <span>— {suggestedDish.portions} portions pending</span>
          </div>

          <div className="suggestion-est-line">
            <span>Estimated preparation: <strong>{suggestedDish.prepMinutes} minutes</strong></span>
          </div>

          <div className="suggestion-reason-row">
            <Icon name="info" size={13} color="var(--text-muted)" />
            <span>Reason: {suggestionReason}</span>
          </div>
        </div>
      ) : (
        <div className="workload-empty-state">
          <Icon name="check" size={16} color="var(--success)" />
          <span>All pending dishes currently prepared or scheduled.</span>
        </div>
      )}
    </div>
  );
}
