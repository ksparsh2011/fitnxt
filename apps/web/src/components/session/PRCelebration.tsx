'use client';
import { useReducedMotion, motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useSessionStore } from '@/stores/session.store';
import { Button } from '@/components/ui/Button';

const PR_TYPE_LABELS: Record<string, string> = {
  '1rm': '1 Rep Max',
  '3rm': '3 Rep Max',
  '5rm': '5 Rep Max',
  '8rm': '8 Rep Max',
  '10rm': '10 Rep Max',
  'max_reps': 'Max Reps',
};

const CONFETTI_DOTS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: 15 + (i * 7) % 70,
  y: 5 + (i * 6) % 55,
  size: 4 + (i % 3) * 3,
  color: i % 3 === 0 ? 'var(--gold)' : i % 3 === 1 ? 'var(--coral)' : 'var(--violet)',
  delay: i * 0.05,
}));

export function PRCelebration() {
  const { prCelebration, clearPR } = useSessionStore();
  const prefersReducedMotion = useReducedMotion();

  if (!prCelebration) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/90 backdrop-blur-md px-6"
      >
        {/* Confetti dots */}
        {!prefersReducedMotion &&
          CONFETTI_DOTS.map((dot) => (
            <motion.div
              key={dot.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                width: dot.size,
                height: dot.size,
                background: dot.color,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.8, 0.6], scale: [0, 1.2, 1] }}
              transition={{ delay: dot.delay, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            />
          ))}

        {/* Trophy */}
        <motion.div
          initial={prefersReducedMotion ? {} : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 bg-gold-tint border border-gold-border"
        >
          <Trophy className="w-10 h-10 text-gold" strokeWidth={1.6} />
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-center"
        >
          <div className="text-xs uppercase tracking-widest text-gold mb-2">Personal Record</div>
          <h2 className="font-display font-extrabold text-2xl text-t1 mb-1">
            {prCelebration.exerciseName}
          </h2>
          <div className="font-mono text-lg text-t2 mb-1">
            {PR_TYPE_LABELS[prCelebration.prType] ?? prCelebration.prType}
          </div>
          <div className="font-mono text-3xl font-medium text-gold mb-1">
            {prCelebration.value} kg
          </div>
          {prCelebration.previousValue !== null && (
            <div className="text-sm text-t2">Previous: {prCelebration.previousValue} kg</div>
          )}
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="mt-8"
        >
          <Button
            variant="gold"
            size="lg"
            className="px-10 font-display font-bold"
            aria-label="Dismiss personal record celebration"
            onClick={clearPR}
          >
            Continue
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
