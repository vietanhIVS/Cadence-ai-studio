"use client";
import { Scale, ArrowUpRight, ArrowDownRight, Minus, Plus, ChevronRight } from 'lucide-react';
import { BodyMetricLog } from '@/lib/cadence';

interface BodyMetricsSummaryCardProps {
  metrics: BodyMetricLog[];
  unit: 'kg' | 'lb';
  onLogWeight: () => void;
  onNavigateToHistory: () => void;
}

export default function BodyMetricsSummaryCard({
  metrics,
  unit,
  onLogWeight,
  onNavigateToHistory,
}: BodyMetricsSummaryCardProps) {
  const sorted = [...(metrics || [])].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const latest = sorted[0];
  const previous = sorted[1];

  let delta: number | null = null;
  if (latest && previous) {
    delta = Math.round((latest.weight - previous.weight) * 10) / 10;
  }

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return `Today · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="body-metrics-summary-widget panel" role="region" aria-label="Body Metrics Summary">
      <div className="widget-header" onClick={onNavigateToHistory} tabIndex={0} role="button">
        <div className="flex items-center gap-2">
          <div className="widget-icon-plate">
            <Scale size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="widget-title">Body Metrics</h3>
            <span className="widget-subtitle">
              {latest ? formatTimestamp(latest.timestamp) : 'Track weight & measurements'}
            </span>
          </div>
        </div>
        <div className="widget-history-link flex items-center gap-1 text-xs font-semibold text-blue-600">
          <span>View Trends</span>
          <ChevronRight size={14} />
        </div>
      </div>

      <div className="widget-body">
        {latest ? (
          <div className="widget-stat-row">
            <div className="widget-main-stat" onClick={onNavigateToHistory}>
              <div className="flex items-baseline gap-1.5">
                <span className="widget-value">{latest.weight.toFixed(1)}</span>
                <span className="widget-unit">{unit === 'lb' ? 'lbs' : 'kg'}</span>
              </div>
              <div className="widget-delta-row">
                {delta !== null ? (
                  <span
                    className={`widget-delta-badge ${
                      delta < 0 ? 'delta-drop' : delta > 0 ? 'delta-gain' : 'delta-even'
                    }`}
                  >
                    {delta < 0 ? (
                      <ArrowDownRight size={14} className="inline mr-0.5" />
                    ) : delta > 0 ? (
                      <ArrowUpRight size={14} className="inline mr-0.5" />
                    ) : (
                      <Minus size={14} className="inline mr-0.5" />
                    )}
                    {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} {unit === 'lb' ? 'lbs' : 'kg'}
                  </span>
                ) : (
                  <span className="widget-delta-badge delta-neutral">First entry</span>
                )}
                {latest.bodyFatPercentage && (
                  <span className="widget-secondary-tag">
                    {latest.bodyFatPercentage}% BF
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="widget-quick-btn primary"
              onClick={e => {
                e.stopPropagation();
                onLogWeight();
              }}
              title="Log new weight measurement"
            >
              <Plus size={16} />
              <span>Log Weight</span>
            </button>
          </div>
        ) : (
          <div className="widget-empty-state">
            <p className="widget-empty-text">No body metrics recorded yet.</p>
            <button
              type="button"
              className="widget-quick-btn primary"
              onClick={e => {
                e.stopPropagation();
                onLogWeight();
              }}
            >
              <Plus size={16} />
              <span>Log Weight</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
