'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useSessionStore } from '@/stores/session.store';
import {
  SessionHeader,
  ExerciseList,
  SetLogger,
  RestTimer,
  PRCelebration,
  ExerciseSearch,
  FinishModal,
} from '@/components/session';

type View = 'list' | 'logger';

interface PageProps {
  params: { id: string };
}

export default function SessionPage({ params }: PageProps) {
  const { id: sessionId } = params;
  const router = useRouter();
  const { session, isLoading, isError } = useSession(sessionId);
  const [view, setView] = useState<View>('list');
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  const {
    exercises,
    activeExerciseIndex,
    showRestTimer,
    prCelebration,
    startedAt,
    initSession,
    setActiveExercise,
  } = useSessionStore();

  // Initialize store from API data on first load (exercises not yet populated)
  useEffect(() => {
    if (session && exercises.length === 0) {
      initSession({
        sessionId: session.sessionId,
        trainingDayId: session.trainingDayId,
        startedAt: new Date(session.checkedInAt),
        exercises: session.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.exerciseName,
          prescribedSets: ex.sets.length > 0 ? ex.sets.length : 4,
          prescribedReps: 8,
        })),
      });
    }
  }, [session, exercises.length, initSession]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-bg px-6 text-center">
        <p className="text-t1 font-display font-bold text-xl mb-2">Session unavailable</p>
        <p className="text-t2 text-sm mb-6">Could not load this session. It may have ended.</p>
        <a
          href="/today"
          className="px-6 h-11 rounded-full bg-violet text-bg font-medium text-sm flex items-center"
        >
          Go to Today
        </a>
      </div>
    );
  }

  const handleExerciseTap = (index: number) => {
    setActiveExercise(index);
    setView('logger');
  };

  const handleBack = () => {
    setView('list');
  };

  return (
    <div className="relative flex flex-col h-dvh bg-bg overflow-hidden">
      {/* Coral ambient glow — visible on logger view */}
      {view === 'logger' && (
        <div
          className="absolute top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none z-0"
          style={{ background: 'radial-gradient(circle, var(--coral-tint) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 flex flex-col h-full">
        <SessionHeader
          startedAt={startedAt}
          onFinish={() => setShowFinishModal(true)}
          onBack={view === 'logger' ? handleBack : undefined}
        />

        {showRestTimer ? (
          <div className="flex-1 overflow-hidden">
            <RestTimer />
          </div>
        ) : view === 'logger' && exercises[activeExerciseIndex] ? (
          <div className="flex-1 overflow-y-auto px-5">
            <SetLogger
              exerciseIndex={activeExerciseIndex}
              exercise={exercises[activeExerciseIndex]}
              sessionId={sessionId}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 pt-2">
            {view === 'list' && exercises.length === 0 && !isLoading && (
              <p className="text-sm text-t2 text-center py-6">
                No exercises yet — tap &ldquo;Add exercise&rdquo; to begin.
              </p>
            )}
            <ExerciseList
              onExerciseTap={handleExerciseTap}
              onAddExercise={() => setShowExerciseSearch(true)}
            />
          </div>
        )}
      </div>

      {/* Overlays */}
      {prCelebration && <PRCelebration />}
      {showExerciseSearch && (
        <ExerciseSearch
          onClose={() => setShowExerciseSearch(false)}
        />
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
