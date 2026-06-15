'use client';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToday } from '@/hooks/useToday';
import { Badge, Button } from '@/components/ui';
import { RestDayCard } from './RestDayCard';
import { cardItemVariants } from '@/lib/motion';
import type { TodayWorkout } from '@/types/today';

const SHOW_EXERCISE_LIMIT = 3;

interface ExerciseListProps {
  exercises: TodayWorkout['exercises'];
}

function ExerciseList({ exercises }: ExerciseListProps) {
  const visible = exercises.slice(0, SHOW_EXERCISE_LIMIT);
  const hiddenCount = exercises.length - SHOW_EXERCISE_LIMIT;

  return (
    <ul className="space-y-1 mb-4" aria-label="Exercise list">
      {visible.map((ex) => (
        <li key={ex.exerciseId} className="flex items-center gap-2 text-sm text-white/80">
          <span className="w-1 h-1 rounded-full bg-coral flex-shrink-0" aria-hidden="true" />
          <span>{ex.name}</span>
          <span className="font-mono text-white/50 text-xs ml-auto">{ex.sets}×{ex.repsMax}</span>
        </li>
      ))}
      {hiddenCount > 0 && (
        <li className="text-xs text-white/40 pl-3">+ {hiddenCount} more exercises</li>
      )}
    </ul>
  );
}

interface WorkoutCardProps {
  tomorrowName?: string;
}

export function WorkoutCard({ tomorrowName }: WorkoutCardProps) {
  const { workout } = useToday();
  const router = useRouter();

  if (workout === null) return <RestDayCard />;
  if (workout === undefined) return null;

  if (workout.completed) {
    return (
      <motion.div
        variants={cardItemVariants}
        className="relative overflow-hidden bg-surface-2 border border-success/20 rounded-2xl p-5"
      >
        {/* Top strip accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-success" aria-hidden="true" />

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-4 h-4 text-success" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-base text-t1 leading-tight">
              {workout.name} — Done
            </h2>
            <p className="text-xs text-t2 mt-0.5">Completed today</p>
            <p className="text-sm text-t2 mt-2">Well done! Come back tomorrow.</p>
            {tomorrowName && (
              <div className="mt-2.5 inline-flex items-center px-3 py-1 rounded-full bg-surface-3 text-xs text-t2">
                Tomorrow: <span className="text-t1 font-medium ml-1">{tomorrowName}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={cardItemVariants}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      style={{
        background:
          'radial-gradient(ellipse 70% 60% at 90% 10%, var(--coral) 0%, color-mix(in srgb, var(--coral-deep) 80%, transparent) 45%, transparent 75%), linear-gradient(160deg, var(--bg) 0%, color-mix(in srgb, var(--coral-deep) 40%, var(--bg)) 50%, color-mix(in srgb, var(--coral-deep) 70%, var(--bg)) 100%)',
        borderRadius: '20px',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <p className="text-xs font-semibold text-coral/80 uppercase tracking-wide mb-1.5">
        TODAY&apos;S WORKOUT
      </p>
      <h2 className="font-display font-extrabold text-2xl text-white mb-1">{workout.name}</h2>
      <p className="text-sm text-white/60 mb-3">
        {workout.exercises.length} exercises · {workout.focus.join(', ')}
      </p>

      {workout.focus.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3" aria-label="Muscle focus">
          {workout.focus.map((f) => (
            <Badge key={f} variant="coral">{f}</Badge>
          ))}
        </div>
      )}

      <ExerciseList exercises={workout.exercises} />

      <Button
        variant="coral"
        size="lg"
        className="w-full rounded-xl"
        onClick={() => router.push(`/session?trainingDayId=${workout.trainingDayId}`)}
        aria-label={`Start ${workout.name} workout session`}
      >
        Start Workout
      </Button>
    </motion.div>
  );
}
