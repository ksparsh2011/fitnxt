'use client';
import { motion } from 'framer-motion';
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
          <span className="font-mono text-white/50 text-xs ml-auto">{ex.sets}×{ex.reps}</span>
        </li>
      ))}
      {hiddenCount > 0 && (
        <li className="text-xs text-white/40 pl-3">+ {hiddenCount} more exercises</li>
      )}
    </ul>
  );
}

export function WorkoutCard() {
  const { workout } = useToday();
  const router = useRouter();

  if (workout === null) return <RestDayCard />;
  if (workout === undefined) return null;

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
