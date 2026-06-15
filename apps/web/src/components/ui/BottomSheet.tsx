'use client';
import { useReducedMotion, AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            initial={prefersReducedMotion ? {} : { y: '100%' }}
            animate={{ y: 0 }}
            exit={prefersReducedMotion ? {} : { y: '100%' }}
            transition={
              prefersReducedMotion ? { duration: 0 } : { duration: 0.38, ease: [0.0, 0.0, 0.2, 1] }
            }
            drag={prefersReducedMotion ? false : 'y'}
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-3xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 rounded-full bg-border-2 mx-auto mt-3 mb-1 flex-shrink-0" />

            {/* Title row */}
            {title !== undefined && (
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                <h3 className="font-display font-bold text-lg text-t1">{title}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label={`Close ${title}`}
                >
                  <X className="w-5 h-5" strokeWidth={1.8} />
                </Button>
              </div>
            )}

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
