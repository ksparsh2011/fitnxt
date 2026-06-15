'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { WeekStrip } from '@/components/session/WeekStrip';
import { PreSessionExerciseCard } from '@/components/session/PreSessionExerciseCard';
import { ExerciseDetailSheet } from '@/components/session/ExerciseDetailSheet';
import { useWeekPlan } from '@/hooks/useWeekPlan';
import { useDayWorkout } from '@/hooks/useDayWorkout';
import { useSessionStore } from '@/stores/session.store';
import { apiGet, apiPost } from '@/lib/api';
import { computeTodayDayNumber } from '@/lib/dates';
import type { ActiveSessionResponse, TodayWorkout } from '@/types/today';

function estimateMinutes(
  exercises: TodayWorkout['exercises'],
  overrideSets: Record<string, number>,
): number {
  const totalSeconds = exercises.reduce((sum, ex) => {
    const sets = overrideSets[ex.exerciseId] ?? ex.sets;
    return sum + sets * ((ex.restSeconds ?? 90) + 30);
  }, 0);
  const raw = totalSeconds / 60;
  return Math.round(raw / 5) * 5;
}

export default function SessionEntryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const todayDayNumber = computeTodayDayNumber();

  const [selectedDayNumber, setSelectedDayNumber] = useState(todayDayNumber);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [detailExercise, setDetailExercise] = useState<TodayWorkout['exercises'][number] | null>(
    null,
  );
  const [overrideSets, setOverrideSets] = useState<Record<string, number>>({});
  const [isStarting, setIsStarting] = useState(false);

  const weekPlan = useWeekPlan();
  const dayWorkout = useDayWorkout(selectedDayNumber);
  const setSkippedExercises = useSessionStore((s) => s.setSkippedExercises);

  const handleRemove = useCallback((id: string) => {
    setSkippedIds((prev) => new Set(prev).add(id));
  }, []);

  const handleRestore = useCallback((id: string) => {
    setSkippedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
  }, []);

  // Check for active session via TanStack Query and redirect if found
  const activeSessionQuery = useQuery({
    queryKey: ['workouts', 'sessions', 'active'],
    queryFn: () => apiGet<{ sessionId: string } | null>('/workouts/sessions/active'),
    staleTime: 0,
    retry: false,
  });
  useEffect(() => {
    if (activeSessionQuery.data?.sessionId) {
      router.replace(`/session/${activeSessionQuery.data.sessionId}`);
    }
  }, [activeSessionQuery.data, router]);

  const exercises = dayWorkout.data?.exercises ?? [];
  const isToday = selectedDayNumber === todayDayNumber;
  const estMin = estimateMinutes(exercises, overrideSets);

  const handleStartSession = async () => {
    if (!isToday) return;
    setSkippedExercises(Array.from(skippedIds));
    setIsStarting(true);
    try {
      const session = await apiPost<ActiveSessionResponse>('/workouts/sessions', {
        training_day_id: dayWorkout.data?.trainingDayId ?? null,
      });
      if (session?.sessionId) {
        await queryClient.invalidateQueries({ queryKey: ['workouts', 'today'] });
        await queryClient.invalidateQueries({ queryKey: ['workouts', 'week'] });
        router.replace(`/session/${session.sessionId}`);
      } else {
        setIsStarting(false);
      }
    } catch {
      setIsStarting(false);
    }
  };

  const hasActivePlan = (weekPlan.data ?? []).some((d) => d.hasWorkout);

  // Only show full-page skeleton on initial weekPlan load (before we know if a plan exists).
  // dayWorkout loading is handled inline so WeekStrip stays visible during day switches.
  if (weekPlan.isLoading) {
    return (
      <div className="flex flex-col h-dvh bg-bg px-5 pt-5 pb-[84px]">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 w-16 rounded-lg bg-surface-3 animate-pulse" />
          <div className="h-8 w-20 rounded-lg bg-surface-3 animate-pulse" />
        </div>
        {/* WeekStrip skeleton */}
        <div className="flex gap-1.5 mb-5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 h-[52px] rounded-[13px] bg-surface-3 animate-pulse" />
          ))}
        </div>
        {/* Label skeleton */}
        <div className="h-5 w-40 rounded bg-surface-3 animate-pulse mb-1" />
        <div className="h-4 w-24 rounded bg-surface-3 animate-pulse mb-4" />
        {/* Exercise card skeletons */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-surface-3 animate-pulse mb-2" />
        ))}
        {/* CTA skeleton */}
        <div className="absolute bottom-[calc(84px+env(safe-area-inset-bottom,0px))] left-5 right-5 h-14 rounded-xl bg-coral/30 animate-pulse" />
      </div>
    );
  }

  if (dayWorkout.isError) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
        <p className="text-t2">Could not load today&apos;s workout. Please try again.</p>
        <button
          onClick={() => void dayWorkout.refetch()}
          className="text-coral text-sm underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!weekPlan.isLoading && !hasActivePlan) {
    return (
      <div className="flex flex-col h-dvh bg-bg items-center justify-center px-8 pb-[84px]">
        <Dumbbell className="w-12 h-12 text-t3 mb-4" strokeWidth={1.8} />
        <h2 className="font-display font-bold text-xl text-t1 mb-2 text-center">No active plan</h2>
        <p className="text-sm text-t2 text-center mb-6">
          Set up a training plan to get started
        </p>
        <Link href="/plan">
          <Button variant="coral" size="lg" className="rounded-xl px-8">
            Set up a plan
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-dvh bg-bg">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display font-extrabold text-[22px] text-t1">Train</h1>
          <button
            disabled
            className="px-3.5 py-1.5 rounded-[10px] border border-border-2 text-t2 text-xs font-medium opacity-50 cursor-not-allowed"
          >
            Edit Plan
          </button>
        </div>

        {/* WeekStrip */}
        <div className="mb-4">
          <WeekStrip
            todayDayNumber={todayDayNumber}
            selectedDayNumber={selectedDayNumber}
            onSelectDay={setSelectedDayNumber}
            weekPlan={weekPlan.data ?? []}
          />
        </div>

        {/* Day label */}
        {dayWorkout.isLoading ? (
          <div className="mb-3.5">
            <div className="h-5 w-36 rounded bg-surface-3 animate-pulse mb-1.5" />
            <div className="h-4 w-28 rounded bg-surface-3 animate-pulse" />
          </div>
        ) : dayWorkout.data ? (
          <div className="mb-3.5">
            <h2 className="font-display font-bold text-[17px] text-t1">
              {dayWorkout.data.name}
            </h2>
            <p className="font-mono text-xs text-t2 mt-0.5">
              {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} · ~{estMin} min
            </p>
          </div>
        ) : !dayWorkout.isError && !dayWorkout.data ? (
          <div className="mb-3.5">
            <h2 className="font-display font-bold text-[17px] text-t2">Rest day</h2>
            <p className="font-mono text-xs text-t2 mt-0.5">No workout scheduled</p>
          </div>
        ) : null}

        {/* Exercise list */}
        <div className="flex flex-col gap-2">
          {dayWorkout.isLoading && exercises.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-surface-3 animate-pulse" />
            ))
          ) : exercises.map((ex) => (
            <PreSessionExerciseCard
              key={ex.exerciseId}
              exercise={{ ...ex, overrideSets: overrideSets[ex.exerciseId] }}
              isSkipped={skippedIds.has(ex.exerciseId)}
              onTap={() => setDetailExercise(ex)}
              onRemove={() => handleRemove(ex.exerciseId)}
              onRestore={() => handleRestore(ex.exerciseId)}
            />
          ))}

          {/* Add exercise (static, disabled for now) */}
          {dayWorkout.data && (
            <button
              disabled
              className="flex items-center justify-center gap-2 h-12 border border-dashed border-border-2 rounded-[14px] text-t2 text-sm opacity-50 cursor-not-allowed"
            >
              <Plus className="w-4 h-4" strokeWidth={1.8} />
              Add exercise
            </button>
          )}
        </div>
      </div>

      {/* Pinned CTA — flex child, never overlaps scroll content */}
      <div className="px-5 pt-3 pb-[calc(84px+env(safe-area-inset-bottom,0px)+14px)] border-t border-border/40 bg-bg">
        <div>
          {isToday ? (
            <motion.div whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>
              <Button
                variant="coral"
                size="lg"
                className="w-full rounded-xl font-display font-bold text-[17px] tracking-[0.02em] h-14"
                loading={isStarting}
                onClick={() => void handleStartSession()}
                disabled={isStarting || !dayWorkout.data}
              >
                {!isStarting && (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
                Start Session
              </Button>
            </motion.div>
          ) : (
            <Button
              variant="ghost"
              size="lg"
              className="w-full rounded-xl h-14 cursor-not-allowed"
              disabled
            >
              Can only start today&apos;s workout
            </Button>
          )}
        </div>
      </div>

      {/* Exercise detail sheet — AnimatePresence must be in the parent to enable exit animation */}
      <AnimatePresence>
        {detailExercise && (
          <ExerciseDetailSheet
            key={detailExercise.exerciseId}
            exercise={detailExercise}
            sessionOverrideSets={overrideSets[detailExercise.exerciseId] ?? null}
            onSetOverride={(sets) => {
              setOverrideSets((prev) => ({ ...prev, [detailExercise.exerciseId]: sets }));
            }}
            onClose={() => setDetailExercise(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
