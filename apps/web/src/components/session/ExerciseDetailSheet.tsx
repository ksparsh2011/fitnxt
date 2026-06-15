'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X, Minus, Plus, Check } from 'lucide-react';
import { useExerciseStats } from '@/hooks/useExerciseStats';
import { TrendChart } from './TrendChart';
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
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Focus trap: keep Tab key cycling within the sheet
  useEffect(() => {
    if (!dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelectors));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Backdrop */}
      <motion.div
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
        ref={dialogRef}
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
              <p className="text-xs text-t2 mt-0.5">
                {exercise.muscleGroup
                  .split('_')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')}
              </p>
            </div>
            <button
              onClick={onClose}
              autoFocus
              className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center text-t2 flex-shrink-0 mt-0.5"
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
  );
}
