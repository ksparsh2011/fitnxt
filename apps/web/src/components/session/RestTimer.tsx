'use client';
import { useReducedMotion, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useInterval } from '@/hooks/useInterval';
import { useSessionStore } from '@/stores/session.store';
import { Button } from '@/components/ui/Button';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function RestTimer() {
  const {
    restSecondsRemaining,
    restTotalSeconds,
    tickRest,
    skipRest,
    addRestSeconds,
    exercises,
    activeExerciseIndex,
  } = useSessionStore();
  const prefersReducedMotion = useReducedMotion();

  useInterval(
    () => {
      tickRest();
    },
    restSecondsRemaining > 0 ? 1000 : null,
  );

  const progress = restTotalSeconds > 0 ? restSecondsRemaining / restTotalSeconds : 0;
  const ARC_RADIUS = 95;

  const activeExercise = exercises[activeExerciseIndex];
  const confirmedSets = activeExercise?.sets.filter((s) => s.status === 'confirmed') ?? [];
  const lastSet = confirmedSets[confirmedSets.length - 1];
  const nextSetNumber = confirmedSets.length + 1;

  return (
    <div className="flex flex-col items-center px-7 pt-4 pb-8 gap-4 h-full overflow-y-auto">
      {/* Set logged confirmation */}
      {lastSet && (
        <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-full px-4 py-2">
          <Check className="w-4 h-4 text-success" strokeWidth={1.8} />
          <span className="text-base font-medium text-success">
            Set {nextSetNumber - 1} logged
          </span>
        </div>
      )}

      {/* What was logged */}
      {lastSet && activeExercise && (
        <div className="text-center">
          <div className="font-display font-bold text-lg text-t1">{activeExercise.name}</div>
          <div className="font-mono text-base text-t2">
            {lastSet.weightKg ?? 0} kg × {lastSet.reps} reps
          </div>
        </div>
      )}

      {/* Timer display */}
      <div className="text-center mt-4">
        <div className="text-xs uppercase tracking-widest text-t2 mb-3">Rest</div>
        <div
          className="font-display font-extrabold text-coral leading-none text-[80px] tracking-[-3px]"
          aria-live="polite"
          aria-label={`Rest timer: ${formatTime(restSecondsRemaining)}`}
        >
          {formatTime(restSecondsRemaining)}
        </div>
        <div className="text-base text-t2 mt-2">of {formatTime(restTotalSeconds)}</div>
      </div>

      {/* Arc SVG */}
      {!prefersReducedMotion && (
        <svg
          width="220"
          height="220"
          viewBox="0 0 220 220"
          className="-mt-6"
          aria-hidden="true"
        >
          <circle
            cx="110"
            cy="110"
            r={ARC_RADIUS}
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth="8"
          />
          <motion.circle
            cx="110"
            cy="110"
            r={ARC_RADIUS}
            fill="none"
            stroke="var(--coral)"
            strokeWidth="8"
            strokeLinecap="round"
            pathLength={1}
            animate={{ pathLength: progress }}
            transition={{ duration: 1, ease: 'linear' }}
            transform="rotate(-90 110 110)"
            opacity="0.4"
          />
        </svg>
      )}

      {/* Buttons */}
      <div className="flex gap-3 w-full mt-4">
        <Button
          variant="surface"
          size="md"
          className="flex-1 rounded-xl"
          onClick={() => addRestSeconds(30)}
        >
          +30s
        </Button>
        <Button
          variant="ghost"
          size="md"
          className="flex-1 rounded-xl text-coral hover:bg-coral/10"
          onClick={skipRest}
        >
          Skip Rest
        </Button>
      </div>

      {/* Up next card */}
      {activeExercise && (
        <div className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3.5">
          <div className="text-xs uppercase tracking-widest text-t3 mb-1.5">Up next</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-t1">
              Set {nextSetNumber} of {activeExercise.prescribedSets}
            </span>
            <span className="font-mono text-sm text-t2">
              {lastSet?.weightKg ?? 60} kg × {activeExercise.repsMax}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
