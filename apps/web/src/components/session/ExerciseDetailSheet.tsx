'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Minus, Plus, Check } from 'lucide-react';
import { useExerciseStats } from '@/hooks/useExerciseStats';
import type { TodayWorkout } from '@/types/today';

interface ExerciseDetailSheetProps {
  exercise: TodayWorkout['exercises'][number];
  sessionOverrideSets: number | null;
  onSetOverride: (sets: number) => void;
  onClose: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function TrendChart({ trend }: { trend: Array<{ date: string; maxWeightKg: number }> }) {
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

  const pctChange =
    trend.length >= 2
      ? (((trend[trend.length - 1].maxWeightKg - trend[0].maxWeightKg) / trend[0].maxWeightKg) *
          100).toFixed(1)
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
          {isPositive ? '↑' : '↓'} {Math.abs(parseFloat(pctChange))}%
        </span>
      </div>
      <span className="sr-only">Strength trend: {trend.length} sessions tracked</span>
      <div className="bg-surface-2 rounded-xl pt-3 pb-2 px-2.5">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--coral)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--coral)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[H / 4, H / 2, (H * 3) / 4].map((y) => (
            <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="var(--surface-3)" strokeWidth="1" />
          ))}
          {/* Fill area */}
          <path d={fillPath} fill="url(#trendGrad)" />
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

export function ExerciseDetailSheet({
  exercise,
  sessionOverrideSets,
  onSetOverride,
  onClose,
}: ExerciseDetailSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const { data: stats, isLoading, isError, refetch } = useExerciseStats(exercise.exerciseId);
  const currentSets = sessionOverrideSets ?? exercise.sets;
  const [editingSets, setEditingSets] = useState(false);
  const [draftSets, setDraftSets] = useState(currentSets);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          className="fixed inset-0 bg-black/60 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
        {/* Sheet */}
        <motion.div
          key="sheet"
          initial={prefersReducedMotion ? {} : { y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.38, ease: [0.0, 0.0, 0.2, 1] }
          }
          className="fixed inset-x-0 bottom-0 z-50 bg-surface-3 rounded-t-3xl overflow-y-auto max-h-[85dvh]"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`Exercise details for ${exercise.name}`}
        >
          {/* Handle */}
          <div className="w-10 h-1 rounded-full bg-border-2 mx-auto mt-3" aria-hidden="true" />

          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-2.5 pb-1">
            <div>
              <h2 className="font-display font-bold text-xl text-t1">{exercise.name}</h2>
              <p className="text-xs text-t2 mt-0.5">{exercise.muscleGroup}</p>
            </div>
            <button
              onClick={onClose}
              autoFocus
              className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-t2 flex-shrink-0 mt-0.5 min-h-[44px] min-w-[44px]"
              aria-label="Close exercise details"
            >
              <X className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>

          <div className="px-5 pb-[env(safe-area-inset-bottom,20px)] flex flex-col gap-4 mt-2">
            {/* Stats error state */}
            {isError && (
              <div className="px-5 py-4 text-center text-sm text-t2">
                Could not load stats.{' '}
                <button className="text-coral underline" onClick={() => void refetch()}>
                  Retry
                </button>
              </div>
            )}

            {/* 3-stat row */}
            {!isError && (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface-2 rounded-xl p-3 text-center">
                  {isLoading ? (
                    <div className="h-6 w-10 mx-auto rounded bg-surface-3 animate-pulse" />
                  ) : (
                    <div className="font-mono text-xl text-t1">
                      {stats?.lastWeightKg ?? '--'}
                    </div>
                  )}
                  <div className="text-xs text-t2 uppercase tracking-wide mt-1">Last kg</div>
                </div>
                <div className="bg-coral/10 border border-coral/20 rounded-xl p-3 text-center">
                  {isLoading ? (
                    <div className="h-6 w-10 mx-auto rounded bg-surface-3 animate-pulse" />
                  ) : (
                    <div className="font-mono text-xl text-coral">
                      {stats?.estOneRm ?? '--'}
                    </div>
                  )}
                  <div className="text-xs text-coral uppercase tracking-wide mt-1">Est. 1RM</div>
                </div>
                <div className="bg-surface-2 rounded-xl p-3 text-center">
                  {isLoading ? (
                    <div className="h-6 w-10 mx-auto rounded bg-surface-3 animate-pulse" />
                  ) : (
                    <div className="font-mono text-xl text-t1">{stats?.sessionCount ?? 0}</div>
                  )}
                  <div className="text-xs text-t2 uppercase tracking-wide mt-1">Sessions</div>
                </div>
              </div>
            )}

            {/* Strength trend */}
            {!isError && (isLoading ? (
              <div className="h-28 rounded-xl bg-surface-2 animate-pulse" />
            ) : (
              <TrendChart trend={stats?.trend ?? []} />
            ))}

            {/* Edit sets section */}
            <div className="bg-surface-2 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-t2 uppercase tracking-wide mb-0.5">
                    Sets Prescribed
                  </div>
                  <div className="font-mono text-xl text-t1">{currentSets}</div>
                </div>
                {!editingSets && (
                  <button
                    onClick={() => { setEditingSets(true); setDraftSets(currentSets); }}
                    className="px-4 h-9 rounded-lg bg-coral/10 border border-coral/20 text-sm text-coral font-medium min-h-[44px]"
                  >
                    Edit
                  </button>
                )}
              </div>

              {editingSets && (
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => setDraftSets((n) => clamp(n - 1, 1, 10))}
                    className="w-11 h-11 rounded-xl bg-surface-3 border border-border text-t1 flex items-center justify-center"
                    aria-label="Decrease sets"
                  >
                    <Minus className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                  <div className="flex-1 text-center font-mono text-xl text-t1">
                    {draftSets}
                  </div>
                  <button
                    onClick={() => setDraftSets((n) => clamp(n + 1, 1, 10))}
                    className="w-11 h-11 rounded-xl bg-surface-3 border border-border text-t1 flex items-center justify-center"
                    aria-label="Increase sets"
                  >
                    <Plus className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                  <button
                    onClick={() => { onSetOverride(draftSets); setEditingSets(false); }}
                    className="w-11 h-11 rounded-xl bg-coral flex items-center justify-center text-white flex-shrink-0"
                    aria-label="Apply set count"
                  >
                    <Check className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
