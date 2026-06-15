'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSessionStore } from '@/stores/session.store';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

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
          role="dialog"
          aria-modal="true"
          aria-labelledby="finish-modal-title"
        >
          <div className="w-10 h-1 rounded-full bg-border-2 mx-auto mb-6" />

          <h3 id="finish-modal-title" className="font-display font-bold text-xl text-t1 mb-2">Finish Workout?</h3>
          <p className="text-base text-t2 mb-6">Your progress will be saved.</p>

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
            <Button variant="surface" size="lg" className="flex-1" onClick={onClose}>
              Keep Going
            </Button>
            <Button
              variant="coral"
              size="lg"
              className="flex-[2] font-display font-bold"
              loading={isFinishing}
              autoFocus
              onClick={() => void handleFinish()}
            >
              Finish Workout
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
