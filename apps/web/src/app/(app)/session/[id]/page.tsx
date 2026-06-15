'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { List, ChevronRight, Dumbbell, X } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useSessionStore } from '@/stores/session.store';
import { Button } from '@/components/ui/Button';
import {
  SessionHeader,
  ExerciseList,
  SetLogger,
  RestTimer,
  PRCelebration,
  ExerciseSearch,
  FinishModal,
} from '@/components/session';

interface PageProps {
  params: { id: string };
}

export default function SessionPage({ params }: PageProps) {
  const { id: sessionId } = params;
  const router = useRouter();
  const { session, isLoading, isError } = useSession(sessionId);
  const prefersReducedMotion = useReducedMotion();

  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showExercisesDrawer, setShowExercisesDrawer] = useState(false);

  const {
    exercises,
    activeExerciseIndex,
    showRestTimer,
    prCelebration,
    startedAt,
    initSession,
    setActiveExercise,
  } = useSessionStore();
  const storeSessionId = useSessionStore((s) => s.sessionId);

  // Initialize store from API data when session changes or store is for a different session
  useEffect(() => {
    if (session && storeSessionId !== session.sessionId) {
      initSession({
        sessionId: session.sessionId,
        trainingDayId: session.trainingDayId,
        startedAt: new Date(session.checkedInAt),
        exercises: session.exercises.map((ex) => {
          const prescribedSets: number = ex.prescribedSets ?? ex.sets.length;
          const repsMin: number = ex.repsMin ?? 8;
          const repsMax: number = ex.repsMax ?? 12;
          return {
            exerciseId: ex.exerciseId,
            name: ex.exerciseName,
            prescribedSets,
            repsMin,
            repsMax,
            restSeconds: ex.restSeconds,
          };
        }),
      });
    }
  }, [session, storeSessionId, initSession]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-bg px-6 text-center">
        <p className="text-t1 font-display font-bold text-xl mb-2">Session unavailable</p>
        <p className="text-t2 text-base mb-6">Could not load this session. It may have ended.</p>
        <Button variant="ghost" size="md" onClick={() => router.push('/today')}>
          Go to Today
        </Button>
      </div>
    );
  }

  const activeExercise = exercises[activeExerciseIndex];
  const nextExercise = exercises[activeExerciseIndex + 1];

  return (
    <div className="relative flex flex-col h-dvh bg-bg overflow-hidden">
      {/* Coral ambient glow — always present in guided view */}
      <div
        className="absolute top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none z-0 bg-coral/[0.08] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col h-full">
        <SessionHeader
          startedAt={startedAt}
          onFinish={() => setShowFinishModal(true)}
        />

        {showRestTimer ? (
          <div className="flex-1 overflow-hidden">
            <RestTimer />
          </div>
        ) : exercises.length === 0 && !isLoading ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
            <Dumbbell className="w-12 h-12 text-t3" strokeWidth={1.8} />
            <p className="text-t2 text-sm">No exercises yet</p>
            <Button variant="coral" size="md" onClick={() => setShowExerciseSearch(true)}>
              Add first exercise
            </Button>
          </div>
        ) : activeExercise !== undefined ? (
          <>
            {/* Exercise header row */}
            <div className="px-5 pt-3 pb-2 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-t2 font-mono">
                  Exercise {activeExerciseIndex + 1} of {exercises.length}
                </span>
                <button
                  onClick={() => setShowExercisesDrawer(true)}
                  className="text-xs text-violet font-medium flex items-center gap-1 min-h-[44px] min-w-[44px] px-1"
                  aria-label="Show all exercises"
                >
                  <List className="w-3.5 h-3.5" strokeWidth={1.8} />
                  All exercises
                </button>
              </div>
              <h1 className="font-display font-extrabold text-2xl text-t1 leading-tight">
                {activeExercise.name}
              </h1>
            </div>

            {/* SetLogger — scrollable section */}
            <div className="flex-1 overflow-y-auto px-5 min-h-0">
              <SetLogger
                exerciseIndex={activeExerciseIndex}
                exercise={activeExercise}
                sessionId={sessionId}
                onNextExercise={
                  activeExerciseIndex < exercises.length - 1
                    ? () => setActiveExercise(activeExerciseIndex + 1)
                    : undefined
                }
              />
            </div>

            {/* Next Up card — pinned bottom */}
            <div className="px-5 pb-[env(safe-area-inset-bottom,12px)] flex-shrink-0">
              {nextExercise !== undefined ? (
                <motion.button
                  onClick={() => setActiveExercise(activeExerciseIndex + 1)}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.1 }}
                  className="w-full h-[72px] bg-surface-2 border border-border rounded-2xl px-4 flex items-center gap-3 text-left active:bg-surface-3"
                  aria-label={`Next exercise: ${nextExercise.name}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-t3 font-medium uppercase tracking-wide mb-0.5">
                      Next up
                    </p>
                    <p className="font-display font-bold text-base text-t1 truncate">
                      {nextExercise.name}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-t2 flex-shrink-0" strokeWidth={1.8} />
                </motion.button>
              ) : (
                <div className="w-full bg-surface-2 border border-border rounded-2xl px-4 py-3 flex flex-col gap-2">
                  <p className="text-sm text-t2">Last exercise — finish strong</p>
                  {(() => {
                    const lastEx = exercises[exercises.length - 1];
                    const allSetsDone =
                      lastEx !== undefined &&
                      lastEx.sets.filter((s) => s.status === 'confirmed').length >= lastEx.prescribedSets;
                    return allSetsDone ? (
                      <Button
                        variant="coral"
                        size="md"
                        className="w-full rounded-xl"
                        onClick={() => setShowFinishModal(true)}
                      >
                        Finish Workout
                      </Button>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </>
        ) : isLoading ? (
          /* Loading skeleton */
          <div className="flex-1 px-5 pt-4 flex flex-col gap-3">
            <div className="h-4 w-32 rounded-full bg-surface-3 animate-pulse" />
            <div className="h-7 w-48 rounded-full bg-surface-3 animate-pulse" />
            <div className="h-[200px] w-full rounded-2xl bg-surface-3 animate-pulse mt-4" />
          </div>
        ) : null}
      </div>

      {/* Overlays */}
      {prCelebration && <PRCelebration />}

      {/* All exercises drawer */}
      <AnimatePresence>
        {showExercisesDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowExercisesDrawer(false)}
              aria-hidden="true"
            />
            {/* Sheet */}
            <motion.div
              initial={prefersReducedMotion ? {} : { y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={
                prefersReducedMotion ? { duration: 0 } : { duration: 0.38, ease: [0.0, 0.0, 0.2, 1] }
              }
              className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-4xl flex flex-col max-h-[70dvh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-border-2 mx-auto mt-3 mb-1 flex-shrink-0" />

              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                <h3 className="font-display font-bold text-lg text-t1">Exercises</h3>
                <button
                  onClick={() => setShowExercisesDrawer(false)}
                  className="w-11 h-11 flex items-center justify-center rounded-full text-t2 hover:text-t1 hover:bg-surface-2 transition-colors"
                  aria-label="Close exercises drawer"
                >
                  <X className="w-5 h-5" strokeWidth={1.8} />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto px-5 pb-[env(safe-area-inset-bottom,16px)] pt-1">
                <ExerciseList
                  onExerciseTap={(i) => {
                    setActiveExercise(i);
                    setShowExercisesDrawer(false);
                  }}
                  onAddExercise={() => {
                    setShowExercisesDrawer(false);
                    setShowExerciseSearch(true);
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showExerciseSearch && (
        <ExerciseSearch onClose={() => setShowExerciseSearch(false)} />
      )}
      {showFinishModal && (
        <FinishModal
          sessionId={sessionId}
          onClose={() => setShowFinishModal(false)}
          onComplete={() => router.push(`/session/${sessionId}/complete`)}
        />
      )}
    </div>
  );
}
