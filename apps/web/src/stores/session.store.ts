import { create } from 'zustand';
import type { PREvent } from '@fitnxt/shared';

export interface LocalSet {
  localId: string;
  setId?: string;
  reps: number;
  weightKg: number | null;
  rpe: number | null;
  isPr: boolean;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface SessionExerciseLocal {
  exerciseId: string;
  name: string;
  prescribedSets: number;
  prescribedReps: number;
  sets: LocalSet[];
}

interface SessionState {
  sessionId: string | null;
  trainingDayId: string | null;
  startedAt: Date | null;
  exercises: SessionExerciseLocal[];
  activeExerciseIndex: number;
  showRestTimer: boolean;
  restSecondsRemaining: number;
  restTotalSeconds: number;
  prCelebration: PREvent | null;
}

interface SessionActions {
  initSession: (params: {
    sessionId: string;
    trainingDayId: string | null;
    startedAt: Date;
    exercises: Omit<SessionExerciseLocal, 'sets'>[];
  }) => void;
  addExercise: (exercise: Omit<SessionExerciseLocal, 'sets'>) => void;
  setActiveExercise: (index: number) => void;
  optimisticAddSet: (exerciseIndex: number, set: LocalSet) => void;
  confirmSet: (exerciseIndex: number, localId: string, setId: string, isPr: boolean) => void;
  rollbackSet: (exerciseIndex: number, localId: string) => void;
  startRestTimer: (totalSeconds: number) => void;
  tickRest: () => void;
  skipRest: () => void;
  addRestSeconds: (seconds: number) => void;
  setPrCelebration: (pr: PREvent | null) => void;
  clearPR: () => void;
  clearSession: () => void;
}

const initialState: SessionState = {
  sessionId: null,
  trainingDayId: null,
  startedAt: null,
  exercises: [],
  activeExerciseIndex: 0,
  showRestTimer: false,
  restSecondsRemaining: 0,
  restTotalSeconds: 0,
  prCelebration: null,
};

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  ...initialState,

  initSession: ({ sessionId, trainingDayId, startedAt, exercises }) =>
    set({
      sessionId,
      trainingDayId,
      startedAt,
      exercises: exercises.map((ex) => ({ ...ex, sets: [] })),
      activeExerciseIndex: 0,
      showRestTimer: false,
      prCelebration: null,
    }),

  addExercise: (exercise) =>
    set((state) => ({
      exercises: [...state.exercises, { ...exercise, sets: [] }],
      activeExerciseIndex: state.exercises.length,
    })),

  setActiveExercise: (index) => set({ activeExerciseIndex: index }),

  optimisticAddSet: (exerciseIndex, newSet) =>
    set((state) => {
      const exercises = [...state.exercises];
      exercises[exerciseIndex] = {
        ...exercises[exerciseIndex],
        sets: [...exercises[exerciseIndex].sets, newSet],
      };
      return { exercises };
    }),

  confirmSet: (exerciseIndex, localId, setId, isPr) =>
    set((state) => {
      const exercises = [...state.exercises];
      exercises[exerciseIndex] = {
        ...exercises[exerciseIndex],
        sets: exercises[exerciseIndex].sets.map((s) =>
          s.localId === localId ? { ...s, setId, isPr, status: 'confirmed' as const } : s,
        ),
      };
      return { exercises };
    }),

  rollbackSet: (exerciseIndex, localId) =>
    set((state) => {
      const exercises = [...state.exercises];
      exercises[exerciseIndex] = {
        ...exercises[exerciseIndex],
        sets: exercises[exerciseIndex].sets.filter((s) => s.localId !== localId),
      };
      return { exercises };
    }),

  startRestTimer: (totalSeconds) =>
    set({ showRestTimer: true, restSecondsRemaining: totalSeconds, restTotalSeconds: totalSeconds }),

  tickRest: () =>
    set((state) => {
      const next = state.restSecondsRemaining - 1;
      if (next <= 0) return { showRestTimer: false, restSecondsRemaining: 0 };
      return { restSecondsRemaining: next };
    }),

  skipRest: () => set({ showRestTimer: false, restSecondsRemaining: 0 }),

  addRestSeconds: (seconds) =>
    set((state) => ({
      restSecondsRemaining: state.restSecondsRemaining + seconds,
      restTotalSeconds: state.restTotalSeconds + seconds,
    })),

  setPrCelebration: (pr) => set({ prCelebration: pr }),
  clearPR: () => set({ prCelebration: null }),
  clearSession: () => set(initialState),
}));
