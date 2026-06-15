'use client';
import { useState, useCallback } from 'react';
import { motion, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { GripVertical, ChevronRight, MoreVertical, Trash2 } from 'lucide-react';
import { useLongPress } from '@/hooks/useLongPress';
import type { TodayWorkout } from '@/types/today';

interface PreSessionExerciseCardProps {
  exercise: TodayWorkout['exercises'][number] & { overrideSets?: number };
  isSkipped: boolean;
  onTap: () => void;
  onRemove: () => void;
  onRestore: () => void;
}

const SWIPE_THRESHOLD = -60;

export function PreSessionExerciseCard({
  exercise,
  isSkipped,
  onTap,
  onRemove,
  onRestore,
}: PreSessionExerciseCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const sets = exercise.overrideSets ?? exercise.sets;
  const repsLabel =
    exercise.repsMin === exercise.repsMax
      ? `${exercise.repsMax} reps`
      : `${exercise.repsMin}–${exercise.repsMax}`;

  const snapBack = useCallback(() => {
    void animate(x, 0, { duration: prefersReducedMotion ? 0 : 0.25, ease: 'easeOut' });
    setShowConfirm(false);
  }, [x, prefersReducedMotion]);

  const handleDragEnd = useCallback(() => {
    if (x.get() < SWIPE_THRESHOLD) {
      setShowConfirm(true);
      void animate(x, SWIPE_THRESHOLD, { duration: prefersReducedMotion ? 0 : 0.15 });
    } else {
      snapBack();
    }
  }, [x, snapBack, prefersReducedMotion]);

  const longPress = useLongPress({
    onLongPress: () => {
      setShowConfirm(true);
    },
  });

  if (showConfirm) {
    return (
      <div className="h-16 rounded-xl bg-danger/10 border border-danger/30 px-4 flex items-center gap-3">
        <span className="flex-1 text-sm text-t1 truncate">
          Remove <span className="font-medium">{exercise.name}</span>?
        </span>
        <button
          onClick={snapBack}
          className="px-3 h-9 rounded-lg text-sm text-t2 bg-surface-3 flex-shrink-0 min-w-[44px]"
        >
          Cancel
        </button>
        <button
          onClick={() => { onRemove(); setShowConfirm(false); }}
          className="px-3 h-9 rounded-lg text-sm font-medium text-white bg-danger flex-shrink-0 min-w-[44px]"
        >
          Remove
        </button>
      </div>
    );
  }

  if (isSkipped) {
    return (
      <div className="h-16 rounded-xl bg-surface-2 border border-border px-4 flex items-center gap-2.5 opacity-50">
        <GripVertical className="w-4 h-4 text-t3 flex-shrink-0" strokeWidth={1.8} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-t1 line-through truncate">{exercise.name}</div>
          <div className="text-xs text-t2 mt-0.5">{exercise.muscleGroup} · {sets} sets × {repsLabel}</div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRestore(); }}
          className="text-sm text-violet font-medium min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-16 rounded-xl overflow-hidden">
      {/* Delete zone behind card */}
      <div className="absolute inset-0 bg-danger rounded-xl flex items-center justify-end pr-4">
        <div className="flex flex-col items-center gap-1">
          <Trash2 className="w-4 h-4 text-white" strokeWidth={1.8} />
          <span className="text-[9px] text-white font-semibold tracking-[0.03em]">REMOVE</span>
        </div>
      </div>

      {/* Draggable card */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        {...longPress}
        className="absolute inset-0 bg-surface-2 border border-border rounded-xl px-3.5 flex items-center gap-2.5 cursor-pointer active:opacity-90"
        onClick={onTap}
        role="button"
        aria-label={`${exercise.name}, ${sets} sets, ${repsLabel}`}
      >
        <GripVertical className="w-4 h-4 text-t3 flex-shrink-0" strokeWidth={1.8} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-t1 truncate">{exercise.name}</div>
          <div className="text-xs text-t2 mt-0.5">
            {exercise.muscleGroup} · {sets} sets × {repsLabel}
          </div>
        </div>
        <div className="flex items-center flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirm(true);
            }}
            aria-label="Remove exercise options"
            className="w-8 h-8 flex items-center justify-center text-t3"
          >
            <MoreVertical className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <ChevronRight className="w-4 h-4 text-t3" strokeWidth={1.8} />
        </div>
      </motion.div>
    </div>
  );
}
