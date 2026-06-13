'use client';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSessionStore } from '@/stores/session.store';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ui/Toast';

interface FinishModalProps {
  sessionId: string;
  onClose: () => void;
  onComplete: () => void;
}

export function FinishModal({ sessionId, onClose, onComplete }: FinishModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const { exercises, startedAt } = useSessionStore();
  const { finishSessionAsync, isFinishing } = useSession(sessionId);
  const { toast } = useToast();

  const totalSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.status === 'confirmed').length,
    0,
  );
  const totalVolumeKg = exercises.reduce(
    (acc, ex) =>
      acc +
      ex.sets
        .filter((s) => s.status === 'confirmed')
        .reduce((setAcc, s) => setAcc + (s.weightKg ?? 0) * s.reps, 0),
    0,
  );
  const elapsedMinutes = startedAt
    ? Math.floor((Date.now() - startedAt.getTime()) / 60000)
    : 0;

  const volumeDisplay =
    totalVolumeKg >= 1000
      ? `${(totalVolumeKg / 1000).toFixed(1)}K`
      : String(Math.round(totalVolumeKg));

  const handleFinish = async () => {
    try {
      await finishSessionAsync({});
      onComplete();
    } catch {
      toast('Failed to finish session. Please try again.', 'error');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={prefersReducedMotion ? {} : { y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.38, ease: [0, 0, 0.2, 1] }}
          className="w-full bg-surface rounded-t-4xl px-6 pt-6 pb-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 rounded-full bg-border-2 mx-auto mb-6" />

          <h3 className="font-display font-bold text-xl text-t1 mb-2">Finish Workout?</h3>
          <p className="text-sm text-t2 mb-6">Your progress will be saved.</p>

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-surface-2 rounded-xl p-3 text-center">
              <div className="font-mono text-xl font-medium text-t1">{elapsedMinutes}</div>
              <div className="text-xs text-t2 uppercase tracking-wide mt-0.5">min</div>
            </div>
            <div className="bg-surface-2 rounded-xl p-3 text-center">
              <div className="font-mono text-xl font-medium text-t1">{totalSets}</div>
              <div className="text-xs text-t2 uppercase tracking-wide mt-0.5">sets</div>
            </div>
            <div className="bg-surface-2 rounded-xl p-3 text-center">
              <div className="font-mono text-xl font-medium text-t1">{volumeDisplay}</div>
              <div className="text-xs text-t2 uppercase tracking-wide mt-0.5">kg vol</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-[52px] rounded-2xl bg-surface-2 border border-border text-t1 text-sm font-medium"
            >
              Keep Going
            </button>
            <button
              onClick={() => void handleFinish()}
              disabled={isFinishing}
              className="flex-[2] h-[52px] rounded-2xl bg-violet text-bg font-display font-bold text-base disabled:opacity-50"
            >
              {isFinishing ? 'Saving...' : 'Finish Workout'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
