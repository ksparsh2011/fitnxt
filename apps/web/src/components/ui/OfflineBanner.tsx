'use client';
import { useReducedMotion, AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={prefersReducedMotion ? {} : { y: -40 }}
          animate={{ y: 0 }}
          exit={prefersReducedMotion ? {} : { y: -40 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.2, ease: [0.0, 0.0, 0.2, 1] }
          }
          className="fixed top-0 inset-x-0 z-[60] h-10 bg-danger flex items-center justify-center gap-2"
          role="status"
          aria-live="polite"
        >
          <WifiOff className="w-4 h-4 text-white" strokeWidth={1.8} />
          <span className="text-white text-base font-medium">No internet connection</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
