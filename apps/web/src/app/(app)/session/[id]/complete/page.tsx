'use client';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Trophy, Share2, Star } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useSessionStore } from '@/stores/session.store';
import { Button } from '@/components/ui/Button';

interface PageProps {
  params: { id: string };
}

const CONFETTI = [
  { x: '10%', y: '7%',  size: 8, color: 'var(--gold)',   delay: 0    },
  { x: '20%', y: '9%',  size: 6, color: 'var(--coral)',  delay: 0.05 },
  { x: '33%', y: '14%', size: 5, color: 'var(--violet)', delay: 0.1  },
  { x: '85%', y: '11%', size: 7, color: 'var(--gold)',   delay: 0.07 },
  { x: '77%', y: '16%', size: 5, color: 'var(--coral)',  delay: 0.12 },
  { x: '92%', y: '9%',  size: 6, color: 'var(--gold)',   delay: 0.03 },
] as const;

const popIn = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 400, damping: 20 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  // delay passed via `custom` prop
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.3 },
  }),
};

const confettiDot = {
  hidden: { opacity: 0, scale: 0 },
  visible: (delay: number) => ({
    opacity: 0.6,
    scale: 1,
    transition: {
      delay,
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
    },
  }),
};

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  gold?: boolean;
}

function StatCard({ label, value, unit, gold }: StatCardProps) {
  return (
    <div
      className={`rounded-2xl px-4 py-4 text-center border ${
        gold ? 'bg-gold-tint border-gold-border' : 'bg-surface-2 border-border'
      }`}
    >
      <div className={`font-mono text-3xl font-medium ${gold ? 'text-gold' : 'text-t1'}`}>
        {value}
        {unit && <span className="text-sm font-sans text-t2 ml-0.5">{unit}</span>}
      </div>
      <div className={`text-xs uppercase tracking-wider mt-1 ${gold ? 'text-gold' : 'text-t2'}`}>
        {label}
      </div>
    </div>
  );
}

export default function WorkoutCompletePage({ params }: PageProps) {
  const { id: sessionId } = params;
  const router = useRouter();
  const { session, isLoading } = useSession(sessionId);
  const { clearSession } = useSessionStore();
  const prefersReducedMotion = useReducedMotion();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-bg">
        <div
          className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"
          aria-label="Loading results..."
          role="status"
        />
      </div>
    );
  }

  const durationMin  = session?.durationMinutes ?? 0;
  const volumeKg     = session?.totalVolumeKg ?? 0;
  const totalSets    = session?.totalSets ?? 0;
  const prCount      = session?.prCount ?? 0;
  const volumeDisplay =
    volumeKg >= 1000 ? `${(volumeKg / 1000).toFixed(1)}K` : String(Math.round(volumeKg));

  const prExercise = session?.exercises.find((ex) => ex.sets.some((s) => s.isPr));
  const prSet      = prExercise?.sets.find((s) => s.isPr);

  return (
    <div className="relative flex flex-col items-center min-h-dvh bg-bg px-6 pt-8 pb-[env(safe-area-inset-bottom)]">
      {!prefersReducedMotion && CONFETTI.map((dot, i) => (
        <motion.div
          key={i}
          variants={confettiDot}
          custom={dot.delay}
          initial="hidden"
          animate="visible"
          className="absolute rounded-full pointer-events-none"
          style={{
            left: dot.x,
            top: dot.y,
            /* numeric px values — React appends 'px' automatically */
            width: dot.size,
            height: dot.size,
            background: dot.color,
          }}
        />
      ))}

      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Trophy */}
        <motion.div
          variants={popIn}
          initial="hidden"
          animate="visible"
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 bg-gold-tint border border-gold-border"
        >
          <Trophy className="w-10 h-10 text-gold" strokeWidth={1.6} />
        </motion.div>

        <motion.div
          variants={fadeUp}
          custom={0.15}
          initial="hidden"
          animate="visible"
        >
          <h1 className="font-display font-extrabold text-2xl text-t1 mb-1">Workout Done!</h1>
          <p className="text-sm text-t2 mb-8">Great work. Keep the momentum going.</p>
        </motion.div>

        {/* 2×2 stats grid */}
        <motion.div
          variants={fadeUp}
          custom={0.2}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-2.5 w-full mb-4"
        >
          <StatCard label="Duration" value={`${Math.round(durationMin)}m`} />
          <StatCard label="Volume" value={volumeDisplay} unit="kg" />
          <StatCard label="Total Sets" value={String(totalSets)} />
          <StatCard label="New PRs" value={String(prCount)} gold={prCount > 0} />
        </motion.div>

        {/* PR highlight */}
        {prCount > 0 && prExercise && prSet && (
          <motion.div
            variants={fadeUp}
            custom={0.3}
            initial="hidden"
            animate="visible"
            className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 mb-6 bg-gold-tint border border-gold-border"
          >
            <Star className="w-7 h-7 text-gold flex-shrink-0" strokeWidth={1.8} />
            <div className="text-left">
              <div className="font-display font-bold text-sm text-gold">Personal Record</div>
              <div className="text-sm text-t2">
                {prExercise.exerciseName} · {prSet.weightKg ?? 0} kg × {prSet.reps} reps
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          variants={fadeUp}
          custom={0.4}
          initial="hidden"
          animate="visible"
          className="flex gap-3 w-full"
        >
          <Button variant="surface" size="lg" className="flex-1" aria-label="Share workout">
            <Share2 className="w-4 h-4" strokeWidth={1.8} />
            Share
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-[2] font-display font-bold"
            onClick={() => { clearSession(); router.push('/today'); }}
          >
            Done
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
