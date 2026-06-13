'use client';
import { useReducer, useCallback } from 'react';
import { useSessionStore } from '@/stores/session.store';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import type { SessionExerciseLocal } from '@/stores/session.store';

interface SetLoggerProps {
  exerciseIndex: number;
  exercise: SessionExerciseLocal;
  sessionId: string;
}

interface LoggerState {
  weightKg: number;
  reps: number;
}

type LoggerAction =
  | { type: 'INCREMENT_WEIGHT' }
  | { type: 'DECREMENT_WEIGHT' }
  | { type: 'INCREMENT_REPS' }
  | { type: 'DECREMENT_REPS' }
  | { type: 'SET_WEIGHT'; value: number }
  | { type: 'SET_REPS'; value: number };

const WEIGHT_STEP = 2.5;

function loggerReducer(state: LoggerState, action: LoggerAction): LoggerState {
  switch (action.type) {
    case 'INCREMENT_WEIGHT':
      return { ...state, weightKg: Math.round((state.weightKg + WEIGHT_STEP) * 10) / 10 };
    case 'DECREMENT_WEIGHT':
      return { ...state, weightKg: Math.max(0, Math.round((state.weightKg - WEIGHT_STEP) * 10) / 10) };
    case 'INCREMENT_REPS':
      return { ...state, reps: state.reps + 1 };
    case 'DECREMENT_REPS':
      return { ...state, reps: Math.max(1, state.reps - 1) };
    case 'SET_WEIGHT':
      return { ...state, weightKg: Math.max(0, action.value) };
    case 'SET_REPS':
      return { ...state, reps: Math.max(1, action.value) };
    default:
      return state;
  }
}

function getInitialWeight(exercise: SessionExerciseLocal): number {
  const lastConfirmed = [...exercise.sets].reverse().find((s) => s.status === 'confirmed');
  return lastConfirmed?.weightKg ?? 60;
}

export function SetLogger({ exerciseIndex, exercise, sessionId }: SetLoggerProps) {
  const { optimisticAddSet, confirmSet, rollbackSet, startRestTimer, setPrCelebration } =
    useSessionStore();
  const { logSetAsync, isLoggingSet } = useSession(sessionId);
  const { toast } = useToast();

  const confirmedSets = exercise.sets.filter((s) => s.status === 'confirmed');
  const pendingSets = exercise.sets.filter((s) => s.status === 'pending');
  const currentSetNumber = confirmedSets.length + 1;
  const totalSets = exercise.prescribedSets;

  const initialLoggerState: LoggerState = {
    weightKg: getInitialWeight(exercise),
    reps: exercise.prescribedReps,
  };
  const [state, dispatch] = useReducer(loggerReducer, initialLoggerState);

  // SVG progress ring math
  const RING_RADIUS = 85;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const progress = Math.min(confirmedSets.length / totalSets, 1);
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  const tickPositions = Array.from({ length: totalSets }, (_, i) => {
    const angle = (i / totalSets) * 2 * Math.PI - Math.PI / 2;
    return {
      x: 100 + RING_RADIUS * Math.cos(angle),
      y: 100 + RING_RADIUS * Math.sin(angle),
      completed: i < confirmedSets.length,
    };
  });

  const handleLogSet = useCallback(async () => {
    if (pendingSets.length > 0) return; // wait for previous

    const localId = crypto.randomUUID();
    optimisticAddSet(exerciseIndex, {
      localId,
      reps: state.reps,
      weightKg: state.weightKg,
      rpe: null,
      isPr: false,
      status: 'pending',
    });

    if ('vibrate' in navigator) navigator.vibrate(50);

    try {
      const result = await logSetAsync({
        exercise_id: exercise.exerciseId,
        reps: state.reps,
        weight_kg: state.weightKg,
        is_warmup: false,
      });

      confirmSet(exerciseIndex, localId, result.setId, result.isPr);

      if (result.isPr && result.pr) {
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        setPrCelebration(result.pr);
      }

      startRestTimer(90);
    } catch {
      rollbackSet(exerciseIndex, localId);
      toast('Failed to log set. Please try again.', 'error');
    }
  }, [
    state,
    exercise,
    exerciseIndex,
    pendingSets.length,
    logSetAsync,
    optimisticAddSet,
    confirmSet,
    rollbackSet,
    startRestTimer,
    setPrCelebration,
    toast,
  ]);

  const hasPending = pendingSets.length > 0;
  const weightDisplay =
    state.weightKg % 1 === 0 ? String(state.weightKg) : state.weightKg.toFixed(1);

  return (
    <div className="flex flex-col py-4 gap-6">
      {/* Exercise name + set indicator */}
      <div className="text-center">
        <h2 className="font-display font-extrabold text-xl text-t1 mb-1">{exercise.name}</h2>
        <p className="text-sm text-t2">
          Set <span className="font-mono text-coral">{currentSetNumber}</span> of {totalSets}
        </p>
      </div>

      {/* Progress ring */}
      <div className="flex justify-center">
        <div className="relative w-[200px] h-[200px] flex items-center justify-center">
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            className="absolute inset-0"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--coral-deep)" />
                <stop offset="100%" stopColor="var(--coral)" />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle
              cx="100"
              cy="100"
              r={RING_RADIUS}
              fill="none"
              stroke="var(--surface-3)"
              strokeWidth="12"
            />
            {/* Progress arc */}
            <circle
              cx="100"
              cy="100"
              r={RING_RADIUS}
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 100 100)"
            />
            {/* Set tick dots */}
            {tickPositions.map((tick, i) => (
              <circle
                key={i}
                cx={tick.x}
                cy={tick.y}
                r="5"
                fill={tick.completed ? 'var(--coral)' : 'var(--surface-4)'}
              />
            ))}
          </svg>

          {/* Center display */}
          <div className="text-center z-10">
            <div className="font-mono text-4xl font-medium text-t1 leading-none">
              {weightDisplay}
            </div>
            <div className="text-xs text-t2 mb-1">kg</div>
            <div className="font-mono text-3xl font-medium text-coral leading-none">
              ×{state.reps}
            </div>
            <div className="text-xs text-t2">reps</div>
          </div>
        </div>
      </div>

      {/* Weight stepper */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-t2">Weight</span>
        <div className="flex items-center">
          <button
            onClick={() => dispatch({ type: 'DECREMENT_WEIGHT' })}
            className="w-12 h-12 rounded-l-xl bg-surface-3 border border-border text-t1 text-xl flex items-center justify-center active:bg-surface-4 transition-colors"
            aria-label="Decrease weight"
          >
            −
          </button>
          <div className="w-24 h-12 bg-surface-2 border-t border-b border-border flex items-center justify-center font-mono text-base font-medium text-t1">
            {weightDisplay} kg
          </div>
          <button
            onClick={() => dispatch({ type: 'INCREMENT_WEIGHT' })}
            className="w-12 h-12 rounded-r-xl bg-surface-3 border border-border text-t1 text-xl flex items-center justify-center active:bg-surface-4 transition-colors"
            aria-label="Increase weight"
          >
            +
          </button>
        </div>
      </div>

      {/* Reps stepper */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-t2">Reps</span>
        <div className="flex items-center">
          <button
            onClick={() => dispatch({ type: 'DECREMENT_REPS' })}
            className="w-12 h-12 rounded-l-xl bg-surface-3 border border-border text-t1 text-xl flex items-center justify-center active:bg-surface-4 transition-colors"
            aria-label="Decrease reps"
          >
            −
          </button>
          <div className="w-24 h-12 bg-surface-2 border-t border-b border-border flex items-center justify-center font-mono text-base font-medium text-t1">
            {state.reps}
          </div>
          <button
            onClick={() => dispatch({ type: 'INCREMENT_REPS' })}
            className="w-12 h-12 rounded-r-xl bg-surface-3 border border-border text-t1 text-xl flex items-center justify-center active:bg-surface-4 transition-colors"
            aria-label="Increase reps"
          >
            +
          </button>
        </div>
      </div>

      {/* LOG SET button */}
      <button
        onClick={() => void handleLogSet()}
        disabled={hasPending || isLoggingSet}
        className="w-full h-14 rounded-2xl bg-coral text-white font-display font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
      >
        {hasPending || isLoggingSet ? 'Logging...' : 'LOG SET'}
      </button>

      {/* Previous sets */}
      {exercise.sets.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-widest text-t3 mb-3">Previous sets</div>
          <div className="flex flex-col gap-2">
            {exercise.sets.map((set, i) => (
              <div
                key={set.localId}
                className={cn(
                  'flex items-center justify-between rounded-xl px-4 py-2.5 border',
                  set.status === 'pending'
                    ? 'bg-coral/10 border-coral/20'
                    : 'bg-surface-2 border-border',
                )}
              >
                <span className={`text-sm ${set.status === 'pending' ? 'text-coral' : 'text-t2'}`}>
                  Set {i + 1}
                </span>
                <span
                  className={`font-mono text-sm ${set.status === 'pending' ? 'text-coral' : 'text-success'}`}
                >
                  {set.weightKg ?? 0} kg × {set.reps}
                  {set.status === 'confirmed' ? ' ✓' : ' →'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

