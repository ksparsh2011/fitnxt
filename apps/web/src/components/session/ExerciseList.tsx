'use client';
import { Check, Plus } from 'lucide-react';
import { useSessionStore } from '@/stores/session.store';
import { cn } from '@/lib/utils';

interface ExerciseListProps {
  onExerciseTap: (index: number) => void;
  onAddExercise: () => void;
  compact?: boolean;
}

export function ExerciseList({ onExerciseTap, onAddExercise, compact }: ExerciseListProps) {
  const { exercises, activeExerciseIndex } = useSessionStore();

  return (
    <div className={cn('flex flex-col gap-2', compact && 'max-h-48 overflow-y-auto')}>
      {exercises.map((exercise, index) => {
        const isActive = index === activeExerciseIndex;
        const completedSets = exercise.sets.filter((s) => s.status === 'confirmed').length;
        const totalSets = exercise.prescribedSets;

        return (
          <button
            key={exercise.exerciseId}
            onClick={() => onExerciseTap(index)}
            className={cn(
              'flex items-center gap-3 w-full text-left rounded-2xl p-4 border transition-all duration-150',
              isActive
                ? 'bg-coral/10 border-coral/20'
                : 'bg-surface-2 border-border hover:border-border-2',
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-medium flex-shrink-0',
                isActive ? 'bg-coral text-white' : 'bg-surface-3 text-t2',
              )}
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="font-display font-bold text-base text-t1 truncate">
                  {exercise.name}
                </div>
                {completedSets >= totalSets && (
                  <Check className="w-4 h-4 text-success flex-shrink-0" strokeWidth={1.8} />
                )}
              </div>
              <div className={cn('text-xs', isActive ? 'text-coral' : 'text-t2')}>
                {exercise.prescribedSets}×{exercise.prescribedReps} reps
              </div>
            </div>
            <div className={cn('font-mono text-sm flex-shrink-0', isActive ? 'text-coral' : 'text-t3')}>
              {completedSets}/{totalSets}
            </div>
          </button>
        );
      })}

      <button
        onClick={onAddExercise}
        className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl border border-dashed border-border-2 text-t2 text-base hover:text-t1 transition-colors"
      >
        <Plus className="w-4 h-4" strokeWidth={1.8} />
        Add exercise
      </button>
    </div>
  );
}
