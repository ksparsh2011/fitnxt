'use client';
import { useReducer, useCallback, useState } from 'react';
import { ArrowRight, Check, ChevronRight, Minus, Plus } from 'lucide-react';
import { useSessionStore } from '@/stores/session.store';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { useLongPress } from '@/hooks/useLongPress';
import { EditSetModal } from './EditSetModal';
import type { SessionExerciseLocal, LocalSet } from '@/stores/session.store';

interface SetLoggerProps {
  exerciseIndex: number;
  exercise: SessionExerciseLocal;
  sessionId: string;
  onNextExercise?: () => void;
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

interface SetRowProps {
  set: LocalSet;
  index: number;
  exerciseIndex: number;
  onLongPress: (localId: string) => void;
}

function ConfirmedSetRow({ set, index, onLongPress }: SetRowProps) {
  const longPress = useLongPress({ onLongPress: () => onLongPress(set.localId) });

  return (
    <div
      {...longPress}
      className="flex items-center justify-between rounded-xl px-4 py-3 border bg-surface-2 border-border cursor-pointer select-none min-h-[44px]"
      role="button"
      aria-label={`Set ${index + 1}: ${set.weightKg ?? 0} kg × ${set.reps} reps. Long press to edit.`}
    >
      <span className="text-base text-t2">Set {index + 1}</span>
      <span className="flex items-center gap-1.5 font-mono text-base">
        <span className="text-success">
          {set.weightKg ?? 0} kg × {set.reps}
        </span>
        <Check className="w-3.5 h-3.5 text-success" strokeWidth={1.8} />
      </span>
    </div>
  );
}

export function SetLogger({ exerciseIndex, exercise, sessionId, onNextExercise }: SetLoggerProps) {
  const { optimisticAddSet, confirmSet, rollbackSet, startRestTimer, setPrCelebration, editSet, deleteSet } =
    useSessionStore();
  const { logSetAsync, isLoggingSet } = useSession(sessionId);
  const { toast } = useToast();
  const [editTarget, setEditTarget] = useState<string | null>(null);

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

  const allSetsDone = confirmedSets.length >= totalSets;

  const handleLogSet = useCallback(async () => {
    if (pendingSets.length > 0 || confirmedSets.length >= totalSets) return;

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

      if (!result) throw new Error('No response from server');

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
    confirmedSets.length,
    totalSets,
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

  const editTargetSet =
    editTarget !== null ? exercise.sets.find((s) => s.localId === editTarget) : null;

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
            className="w-12 h-12 rounded-l-xl bg-surface-3 border border-border text-t1 flex items-center justify-center active:bg-surface-4 transition-colors"
            aria-label="Decrease weight"
          >
            <Minus className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <div className="w-24 h-12 bg-surface-2 border-t border-b border-border flex items-center justify-center font-mono text-base font-medium text-t1">
            {weightDisplay} kg
          </div>
          <button
            onClick={() => dispatch({ type: 'INCREMENT_WEIGHT' })}
            className="w-12 h-12 rounded-r-xl bg-surface-3 border border-border text-t1 flex items-center justify-center active:bg-surface-4 transition-colors"
            aria-label="Increase weight"
          >
            <Plus className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Reps stepper */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-t2">Reps</span>
        <div className="flex items-center">
          <button
            onClick={() => dispatch({ type: 'DECREMENT_REPS' })}
            className="w-12 h-12 rounded-l-xl bg-surface-3 border border-border text-t1 flex items-center justify-center active:bg-surface-4 transition-colors"
            aria-label="Decrease reps"
          >
            <Minus className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <div className="w-24 h-12 bg-surface-2 border-t border-b border-border flex items-center justify-center font-mono text-base font-medium text-t1">
            {state.reps}
          </div>
          <button
            onClick={() => dispatch({ type: 'INCREMENT_REPS' })}
            className="w-12 h-12 rounded-r-xl bg-surface-3 border border-border text-t1 flex items-center justify-center active:bg-surface-4 transition-colors"
            aria-label="Increase reps"
          >
            <Plus className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* LOG SET / NEXT EXERCISE button */}
      {allSetsDone ? (
        <div className="flex flex-col gap-2">
          <div className="w-full h-10 flex items-center justify-center gap-1.5 rounded-xl bg-coral/10 border border-coral/20">
            <Check className="w-4 h-4 text-coral" strokeWidth={1.8} />
            <span className="text-sm font-medium text-coral">All {totalSets} sets complete</span>
          </div>
          {onNextExercise && (
            <Button
              variant="coral"
              size="lg"
              className="w-full rounded-2xl font-display font-bold"
              onClick={onNextExercise}
            >
              Next Exercise
              <ArrowRight className="w-5 h-5" strokeWidth={1.8} />
            </Button>
          )}
        </div>
      ) : (
        <Button
          variant="coral"
          size="lg"
          className="w-full rounded-2xl font-display font-bold"
          loading={hasPending || isLoggingSet}
          onClick={() => void handleLogSet()}
        >
          LOG SET
        </Button>
      )}

      {/* Previous sets */}
      {exercise.sets.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-widest text-t3 mb-3">Previous sets</div>
          <div className="flex flex-col gap-2">
            {exercise.sets.map((set, i) =>
              set.status === 'confirmed' ? (
                <ConfirmedSetRow
                  key={set.localId}
                  set={set}
                  index={i}
                  exerciseIndex={exerciseIndex}
                  onLongPress={(localId) => setEditTarget(localId)}
                />
              ) : (
                <div
                  key={set.localId}
                  className="flex items-center justify-between rounded-xl px-4 py-2.5 border bg-coral/10 border-coral/20"
                >
                  <span className="text-sm text-coral">Set {i + 1}</span>
                  <span className="flex items-center gap-1.5 font-mono text-sm">
                    <span className="text-coral">
                      {set.weightKg ?? 0} kg × {set.reps}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-coral" strokeWidth={1.8} />
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Edit set modal */}
      {editTarget !== null && editTargetSet != null && (
        <EditSetModal
          set={editTargetSet}
          onSave={(weightKg, reps) => {
            editSet(exerciseIndex, editTarget, weightKg, reps);
            setEditTarget(null);
          }}
          onDelete={() => {
            deleteSet(exerciseIndex, editTarget);
            setEditTarget(null);
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
