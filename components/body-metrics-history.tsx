"use client";
import { useState, useMemo } from 'react';
import {
  Scale,
  Plus,
  Activity,
  Edit2,
  Trash2,
  Calendar,
  Info,
  ArrowDownRight,
  ArrowUpRight,
  Minus
} from 'lucide-react';
import { BodyMetricLog } from '@/lib/cadence';

interface BodyMetricsHistoryProps {
  metrics: BodyMetricLog[];
  unit: 'kg' | 'lb';
  lengthUnit: 'cm' | 'in';
  onLogNew: () => void;
  onEdit: (metric: BodyMetricLog) => void;
  onDelete: (metric: BodyMetricLog) => void;
}

export default function BodyMetricsHistory({
  metrics,
  unit,
  lengthUnit,
  onLogNew,
  onEdit,
  onDelete,
}: BodyMetricsHistoryProps) {
  const [activeChartMetric, setActiveChartMetric] = useState<'weight' | 'bodyFat'>('weight');
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '90d'>('all');
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  // Chronological ascending for charts, descending for history list
  const chronological = useMemo(() => {
    return [...(metrics || [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [metrics]);

  const sortedDescending = useMemo(() => {
    return [...chronological].reverse();
  }, [chronological]);

  // Filter by time range for chart
  const filteredForChart = useMemo(() => {
    if (timeRange === 'all' || chronological.length <= 1) return chronological;
    const now = Date.now();
    const daysLimit = timeRange === '30d' ? 30 : 90;
    const cutoff = now - daysLimit * 86400000;
    const filtered = chronological.filter(m => new Date(m.timestamp).getTime() >= cutoff);
    return filtered.length > 0 ? filtered : chronological;
  }, [chronological, timeRange]);

  // Chart data extraction
  const chartPoints = useMemo(() => {
    if (activeChartMetric === 'weight') {
      return filteredForChart.map(m => ({
        id: m.id,
        timestamp: m.timestamp,
        value: m.weight,
        log: m,
      }));
    } else {
      return filteredForChart
        .filter(m => m.bodyFatPercentage != null)
        .map(m => ({
          id: m.id,
          timestamp: m.timestamp,
          value: m.bodyFatPercentage!,
          log: m,
        }));
    }
  }, [filteredForChart, activeChartMetric]);

  // Overall stats
  const latestMetric = sortedDescending[0];
  const earliestMetric = chronological[0];
  const totalWeightChange =
    latestMetric && earliestMetric && latestMetric.id !== earliestMetric.id
      ? Math.round((latestMetric.weight - earliestMetric.weight) * 10) / 10
      : null;

  // Min/Max for chart scaling
  const { minVal, maxVal, svgPoints } = useMemo(() => {
    if (chartPoints.length === 0) return { minVal: 0, maxVal: 100, svgPoints: [] };
    const values = chartPoints.map(p => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      min = Math.max(0, min - 2);
      max = max + 2;
    } else {
      const padding = (max - min) * 0.15;
      min = Math.max(0, min - padding);
      max = max + padding;
    }

    const width = 600;
    const height = 200;
    const paddingX = 40;
    const paddingY = 24;

    const availableW = width - paddingX * 2;
    const availableH = height - paddingY * 2;

    const points = chartPoints.map((p, idx) => {
      const x =
        chartPoints.length === 1
          ? width / 2
          : paddingX + (idx / (chartPoints.length - 1)) * availableW;
      const y = height - paddingY - ((p.value - min) / (max - min)) * availableH;
      return { x, y, ...p };
    });

    return { minVal: min, maxVal: max, svgPoints: points };
  }, [chartPoints]);

  const pathD = useMemo(() => {
    if (svgPoints.length === 0) return '';
    if (svgPoints.length === 1) return `M ${svgPoints[0].x} ${svgPoints[0].y}`;
    return svgPoints.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');
  }, [svgPoints]);

  const areaD = useMemo(() => {
    if (svgPoints.length < 2) return '';
    const height = 200;
    const first = svgPoints[0];
    const last = svgPoints[svgPoints.length - 1];
    return `${pathD} L ${last.x} ${height} L ${first.x} ${height} Z`;
  }, [pathD, svgPoints]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="body-metrics-history-view">
      {/* Top Header & Quick Log Action */}
      <div className="metrics-header-row">
        <div>
          <h2 className="metrics-section-title">Body Metrics & Composition</h2>
          <p className="muted text-sm">
            Track weight trends, body fat %, and tape circumferences.
          </p>
        </div>
        <button
          type="button"
          className="primary flex items-center gap-1.5"
          onClick={onLogNew}
        >
          <Plus size={16} />
          <span>Log Entry</span>
        </button>
      </div>

      {sortedDescending.length > 0 ? (
        <>
          {/* Summary Stat Cards */}
          <div className="metrics-stats-grid">
            <div className="metric-stat-card panel">
              <span className="metric-stat-label">Current Weight</span>
              <div className="flex items-baseline gap-1 mt-1">
                <b className="metric-stat-value">{latestMetric.weight.toFixed(1)}</b>
                <span className="text-xs text-slate-500 font-semibold">{unit === 'lb' ? 'lbs' : 'kg'}</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                {formatDate(latestMetric.timestamp)}
              </span>
            </div>

            <div className="metric-stat-card panel">
              <span className="metric-stat-label">Total Change</span>
              <div className="flex items-baseline gap-1 mt-1">
                {totalWeightChange !== null ? (
                  <>
                    <b
                      className={`metric-stat-value ${
                        totalWeightChange < 0
                          ? 'text-emerald-600'
                          : totalWeightChange > 0
                          ? 'text-blue-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {totalWeightChange > 0 ? `+${totalWeightChange.toFixed(1)}` : totalWeightChange.toFixed(1)}
                    </b>
                    <span className="text-xs text-slate-500 font-semibold">{unit === 'lb' ? 'lbs' : 'kg'}</span>
                  </>
                ) : (
                  <b className="metric-stat-value text-slate-400">0.0</b>
                )}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                Since {earliestMetric ? formatDate(earliestMetric.timestamp) : 'start'}
              </span>
            </div>

            <div className="metric-stat-card panel">
              <span className="metric-stat-label">Body Fat %</span>
              <div className="flex items-baseline gap-1 mt-1">
                {latestMetric.bodyFatPercentage != null ? (
                  <>
                    <b className="metric-stat-value text-amber-600">
                      {latestMetric.bodyFatPercentage.toFixed(1)}
                    </b>
                    <span className="text-xs text-slate-500 font-semibold">%</span>
                  </>
                ) : (
                  <b className="metric-stat-value text-slate-400">--</b>
                )}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                {latestMetric.muscleMass ? `${latestMetric.muscleMass} ${unit} muscle` : 'Latest recorded'}
              </span>
            </div>
          </div>

          {/* Interactive Trend Chart */}
          <section className="metric-chart-card panel">
            <div className="chart-controls-row">
              <div className="chart-tab-pills">
                <button
                  type="button"
                  className={`chart-pill ${activeChartMetric === 'weight' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveChartMetric('weight');
                    setActivePointIndex(null);
                  }}
                >
                  <Scale size={14} className="inline mr-1" />
                  Weight ({unit === 'lb' ? 'lbs' : 'kg'})
                </button>
                <button
                  type="button"
                  className={`chart-pill ${activeChartMetric === 'bodyFat' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveChartMetric('bodyFat');
                    setActivePointIndex(null);
                  }}
                >
                  <Activity size={14} className="inline mr-1" />
                  Body Fat (%)
                </button>
              </div>

              <div className="chart-range-pills">
                {(['all', '90d', '30d'] as const).map(range => (
                  <button
                    key={range}
                    type="button"
                    className={`range-pill ${timeRange === range ? 'active' : ''}`}
                    onClick={() => {
                      setTimeRange(range);
                      setActivePointIndex(null);
                    }}
                  >
                    {range === 'all' ? 'All' : range === '90d' ? '90 Days' : '30 Days'}
                  </button>
                ))}
              </div>
            </div>

            {svgPoints.length > 0 ? (
              <div className="chart-svg-container">
                <svg
                  viewBox="0 0 600 200"
                  className="metric-line-chart-svg"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="metricAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={activeChartMetric === 'weight' ? '#2563EB' : '#D97706'}
                        stopOpacity="0.25"
                      />
                      <stop
                        offset="100%"
                        stopColor={activeChartMetric === 'weight' ? '#2563EB' : '#D97706'}
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid guide lines */}
                  <line x1="30" y1="30" x2="570" y2="30" stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="3 3" />
                  <line x1="30" y1="100" x2="570" y2="100" stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="3 3" />
                  <line x1="30" y1="170" x2="570" y2="170" stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="3 3" />

                  {/* Area fill */}
                  {areaD && <path d={areaD} fill="url(#metricAreaGrad)" />}

                  {/* Line path */}
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={activeChartMetric === 'weight' ? '#2563EB' : '#D97706'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data points */}
                  {svgPoints.map((pt, idx) => (
                    <g
                      key={pt.id || idx}
                      onClick={() => setActivePointIndex(idx === activePointIndex ? null : idx)}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={idx === activePointIndex ? 6 : 4}
                        fill={idx === activePointIndex ? '#FFFFFF' : activeChartMetric === 'weight' ? '#2563EB' : '#D97706'}
                        stroke={activeChartMetric === 'weight' ? '#1D4ED8' : '#B45309'}
                        strokeWidth="2.5"
                      />
                    </g>
                  ))}
                </svg>

                {/* Point Inspection tooltip */}
                {activePointIndex !== null && svgPoints[activePointIndex] && (
                  <div className="chart-tooltip-bubble">
                    <b>
                      {svgPoints[activePointIndex].value.toFixed(1)}{' '}
                      {activeChartMetric === 'weight' ? (unit === 'lb' ? 'lbs' : 'kg') : '%'}
                    </b>
                    <span>{formatDate(svgPoints[activePointIndex].timestamp)}</span>
                    {svgPoints[activePointIndex].log.note && (
                      <span className="italic text-slate-600 truncate max-w-xs block">
                        &ldquo;{svgPoints[activePointIndex].log.note}&rdquo;
                      </span>
                    )}
                  </div>
                )}

                <div className="chart-axis-labels">
                  <span>{formatDate(svgPoints[0].timestamp)}</span>
                  <span>{formatDate(svgPoints[svgPoints.length - 1].timestamp)}</span>
                </div>
              </div>
            ) : (
              <div className="chart-empty">
                <Info size={18} className="text-slate-400 mb-1" />
                <p className="text-xs text-slate-500">
                  No {activeChartMetric === 'weight' ? 'weight' : 'body fat'} records in this time range.
                </p>
              </div>
            )}
          </section>

          {/* Itemized Chronological History */}
          <div className="itemized-history-section">
            <h3 className="itemized-history-title">
              Measurement History ({sortedDescending.length})
            </h3>

            <div className="metrics-log-list">
              {sortedDescending.map((m, idx) => {
                // Compare with previous chronological log (which is next in descending array)
                const prev = sortedDescending[idx + 1];
                const weightDelta = prev ? Math.round((m.weight - prev.weight) * 10) / 10 : null;

                const circumferences = [
                  { label: 'Chest', val: m.chest },
                  { label: 'Waist', val: m.waist },
                  { label: 'Hips', val: m.hips },
                  { label: 'Neck', val: m.neck },
                  { label: 'Shoulders', val: m.shoulders },
                  { label: 'Arms', val: m.leftArm || m.rightArm ? `L:${m.leftArm || '--'} R:${m.rightArm || '--'}` : null },
                  { label: 'Thighs', val: m.leftThigh || m.rightThigh ? `L:${m.leftThigh || '--'} R:${m.rightThigh || '--'}` : null },
                  { label: 'Calves', val: m.leftCalf || m.rightCalf ? `L:${m.leftCalf || '--'} R:${m.rightCalf || '--'}` : null },
                ].filter(c => c.val != null);

                return (
                  <div key={m.id} className="metric-entry-card panel">
                    <div className="entry-header-row">
                      <div className="flex items-center gap-2">
                        <Calendar size={15} className="text-blue-500" />
                        <span className="entry-date">{formatDate(m.timestamp)}</span>
                        <span className="entry-time">{formatTime(m.timestamp)}</span>
                      </div>
                      <div className="entry-actions">
                        <button
                          type="button"
                          className="iconbtn"
                          onClick={() => onEdit(m)}
                          title="Edit this log"
                          aria-label="Edit entry"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="iconbtn text-red-500"
                          onClick={() => onDelete(m)}
                          title="Delete this log"
                          aria-label="Delete entry"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="entry-core-stats">
                      <div className="flex items-baseline gap-2">
                        <span className="entry-weight-val">
                          {m.weight.toFixed(1)} {unit === 'lb' ? 'lbs' : 'kg'}
                        </span>
                        {weightDelta !== null ? (
                          <span
                            className={`entry-delta ${
                              weightDelta < 0 ? 'text-emerald-600' : weightDelta > 0 ? 'text-blue-600' : 'text-slate-500'
                            }`}
                          >
                            {weightDelta < 0 ? (
                              <ArrowDownRight size={13} className="inline mr-0.5" />
                            ) : weightDelta > 0 ? (
                              <ArrowUpRight size={13} className="inline mr-0.5" />
                            ) : (
                              <Minus size={13} className="inline mr-0.5" />
                            )}
                            {weightDelta > 0 ? `+${weightDelta.toFixed(1)}` : weightDelta.toFixed(1)}
                          </span>
                        ) : (
                          <span className="entry-delta text-slate-400">First entry</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        {m.bodyFatPercentage != null && (
                          <span className="entry-tag-pill bg-amber-50 text-amber-700 border-amber-200">
                            {m.bodyFatPercentage}% Body Fat
                          </span>
                        )}
                        {m.muscleMass != null && (
                          <span className="entry-tag-pill bg-blue-50 text-blue-700 border-blue-200">
                            {m.muscleMass} {unit === 'lb' ? 'lbs' : 'kg'} Muscle
                          </span>
                        )}
                      </div>
                    </div>

                    {circumferences.length > 0 && (
                      <div className="entry-circumference-chips">
                        {circumferences.map((c, cIdx) => (
                          <span key={cIdx} className="entry-circ-chip">
                            <span className="chip-label">{c.label}:</span>{' '}
                            <span className="chip-val">
                              {c.val} {typeof c.val === 'number' ? lengthUnit : ''}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}

                    {m.note && (
                      <p className="entry-note-quote">
                        &ldquo;{m.note}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <section className="panel metrics-empty-panel">
          <div className="iconplate">
            <Scale size={28} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-bold mt-2">No body measurements recorded yet</h3>
          <p className="muted text-sm max-w-md mx-auto mt-1">
            Log your body weight, body composition, and circumferences to visualize physical changes alongside your workout history.
          </p>
          <button
            type="button"
            className="primary mt-4 flex items-center gap-2 mx-auto"
            onClick={onLogNew}
          >
            <Plus size={18} />
            <span>Log Your First Entry</span>
          </button>
        </section>
      )}
    </div>
  );
}
