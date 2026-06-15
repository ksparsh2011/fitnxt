'use client';
import { useId } from 'react';

interface TrendChartProps {
  trend: Array<{ date: string; maxWeightKg: number }>;
}

export function TrendChart({ trend }: TrendChartProps) {
  const gradientId = useId();

  if (trend.length < 2) {
    return (
      <div className="bg-surface-2 rounded-xl p-4 text-center text-sm text-t2">
        No history yet
      </div>
    );
  }

  const weights = trend.map((t) => t.maxWeightKg);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;
  const W = 310;
  const H = 80;
  const PAD = 10;
  const innerW = W - PAD * 2;

  const points = trend.map((t, i) => ({
    x: PAD + (i / (trend.length - 1)) * innerW,
    y: H - PAD - ((t.maxWeightKg - minW) / range) * (H - PAD * 2),
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const fillPath =
    `M ${points[0].x},${H} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x},${H} Z`;

  // Fix 13: guard against zero baseline to avoid division by zero
  const baseline = trend[0].maxWeightKg;
  const pctChange =
    trend.length >= 2
      ? baseline === 0
        ? '0'
        : (((trend[trend.length - 1].maxWeightKg - baseline) / baseline) * 100).toFixed(1)
      : '0';
  const isPositive = parseFloat(pctChange) >= 0;

  const xLabels = trend.map((_, i) => {
    const stepsBack = trend.length - 1 - i;
    return stepsBack === 0 ? 'Last' : `${stepsBack}w`;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-t2 uppercase tracking-widest">
          Strength Trend
        </span>
        <span
          className={
            'font-mono text-xs font-medium ' + (isPositive ? 'text-success' : 'text-danger')
          }
        >
          {/* Fix 22: sr-only text for screen readers */}
          <span aria-hidden="true">{isPositive ? '↑' : '↓'}</span>
          <span className="sr-only">{isPositive ? 'Increased by' : 'Decreased by'}</span>
          {' '}{Math.abs(parseFloat(pctChange))}%
        </span>
      </div>
      <span className="sr-only">Strength trend: {trend.length} sessions tracked</span>
      <div className="bg-surface-2 rounded-xl pt-3 pb-2 px-2.5">
        {/* SVG uses CSS custom properties directly — approved exception; Tailwind classes cannot set SVG fill/stroke */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            {/* Fix 14: unique gradient id via useId to avoid collisions when multiple instances render */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--coral)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--coral)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[H / 4, H / 2, (H * 3) / 4].map((y) => (
            <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="var(--surface-3)" strokeWidth="1" />
          ))}
          {/* Fill area */}
          <path d={fillPath} fill={`url(#${gradientId})`} />
          {/* Trend line */}
          <polyline
            points={polyline}
            fill="none"
            stroke="var(--coral)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dots */}
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            return isLast ? (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="5"
                fill="var(--coral)"
                stroke="var(--bg)"
                strokeWidth="2"
              />
            ) : (
              <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--coral)" />
            );
          })}
        </svg>
        <div className="flex justify-between mt-1">
          {xLabels.map((label, i) => (
            <span
              key={i}
              className={
                'font-mono text-[9px] ' +
                (i === xLabels.length - 1 ? 'text-coral' : 'text-t3')
              }
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
