'use client';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Trophy, Share2, Star } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useSession } from '@/hooks/useSession';
import { useSessionStore } from '@/stores/session.store';

interface PageProps {
  params: Promise<{ id: string }>;
}

const CONFETTI = [
  { x: '10%', y: '7%',  size: 8, color: 'var(--gold)',   delay: 0    },
  { x: '20%', y: '9%',  size: 6, color: 'var(--coral)',  delay: 0.05 },
  { x: '33%', y: '14%', size: 5, color: 'var(--violet)', delay: 0.1  },
  { x: '85%', y: '11%', size: 7, color: 'var(--gold)',   delay: 0.07 },
  { x: '77%', y: '16%', size: 5, color: 'var(--coral)',  delay: 0.12 },
  { x: '92%', y: '9%',  size: 6, color: 'var(--gold)',   delay: 0.03 },
];

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  gold?: boolean;
}

function StatCard({ label, value, unit, gold }: StatCardProps) {
  return (
    <div
      className="rounded-2xl px-4 py-4 text-center"
      style={
        gold
          ? { background: 'var(--gold-tint)', border: '1px solid var(--gold-border)' }
          : { background: 'var(--surface-2)', border: '1px solid var(--border)' }
      }
    >
      <div className={`font-mono text-3xl font-medium ${gold ? 'text-gold' : 'text-t1'}`}>
        {value}
        {unit && <span className="text-sm font-sans text-t2 ml-0.5">{unit}</span>}
      </div>
      <div
        className={`text-xs uppercase tracking-wider mt-1 ${gold ? 'text-gold' : 'text-t2'}`}
      >
        {label}
      </div>
    </div>
  );
}

export default function WorkoutCompletePage({ params }: PageProps) {
  const { id: sessionId } = use(params);
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { session, isLoading } = useSession(sessionId);
  const { clearSession } = useSessionStore();
  const prefersReducedMotion = useReducedMotion();

  if (!accessToken) {
    router.replace('/login');
    return null;
  }

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

  const durationMin = session?.durationMinutes ?? 0;
  const volumeKg = session?.totalVolumeKg ?? 0;
  const totalSets = session?.totalSets ?? 0;
  const prCount = session?.prCount ?? 0;

  const volumeDisplay =
    volumeKg >= 1000 ? `${(volumeKg / 1000).toFixed(1)}K` : String(Math.round(volumeKg));

  const prExercise = session?.exercises.find((ex) => ex.sets.some((s) => s.isPr));
  const prSet = prExercise?.sets.find((s) => s.isPr);

  return (
    <div className="relative flex flex-col items-center min-h-dvh bg-bg px-6 pt-8 pb-[env(safe-area-inset-bottom)]">
      {/* Confetti dots — hidden when user prefers reduced motion */}
      {!prefersReducedMotion && CONFETTI.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            background: dot.color,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ delay: dot.delay, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        />
      ))}

      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Trophy */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
          style={{ background: 'var(--gold-tint)', border: '1px solid var(--gold-border)' }}
        >
          <Trophy className="w-10 h-10 text-gold" strokeWidth={1.6} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <h1 className="font-display font-extrabold text-2xl text-t1 mb-1">Workout Done!</h1>
          <p className="text-sm text-t2 mb-8">Great work. Keep the momentum going.</p>
        </motion.div>

        {/* 2x2 stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="grid grid-cols-2 gap-2.5 w-full mb-4"
        >
          <StatCard label="Duration" value={`${Math.round(durationMin)}m`} />
          <StatCard label="Volume" value={volumeDisplay} unit="kg" />
          <StatCard label="Total Sets" value={String(totalSets)} />
          <StatCard label="New PRs" value={String(prCount)} gold={prCount > 0} />
        </motion.div>

        {/* PR highlight card */}
        {prCount > 0 && prExercise && prSet && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 mb-6"
            style={{ background: 'var(--gold-tint)', border: '1px solid var(--gold-border)' }}
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

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="flex gap-3 w-full"
        >
          <button
            className="flex-1 h-[52px] rounded-2xl bg-surface-2 border border-border text-t1 text-sm font-medium flex items-center justify-center gap-2"
            aria-label="Share workout"
          >
            <Share2 className="w-4 h-4" strokeWidth={1.8} />
            Share
          </button>
          <button
            onClick={() => {
              clearSession();
              router.push('/today');
            }}
            className="flex-[2] h-[52px] rounded-2xl bg-violet text-bg font-display font-bold text-base"
          >
            Done
          </button>
        </motion.div>
      </div>
    </div>
  );
}
