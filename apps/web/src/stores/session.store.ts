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
  repsMin: number;
  repsMax: number;
  restSeconds: number | null;
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
  skippedExerciseIds: string[];
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
  editSet: (exerciseIndex: number, localId: string, weightKg: number, reps: number) => void;
  deleteSet: (exerciseIndex: number, localId: string) => void;
  setSkippedExercises: (ids: string[]) => void;
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
  skippedExerciseIds: [],
};

export const useSessionStore = create<SessionState & SessionActions>((set, get) => ({
  ...initialState,

  initSession: ({ sessionId, trainingDayId, startedAt, exercises }) => {
    const skipped = get().skippedExerciseIds;
    const filtered = exercises.filter((ex) => !skipped.includes(ex.exerciseId));
    set({
      sessionId,
      trainingDayId,
      startedAt,
      exercises: filtered.map((ex) => ({ ...ex, sets: [] })),
      activeExerciseIndex: 0,
      showRestTimer: false,
      prCelebration: null,
      skippedExerciseIds: [],
    });
  },

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

  editSet: (exerciseIndex, localId, weightKg, reps) =>
    set((state) => {
      const exercises = [...state.exercises];
      exercises[exerciseIndex] = {
        ...exercises[exerciseIndex],
        sets: exercises[exerciseIndex].sets.map((s) =>
          s.localId === localId ? { ...s, weightKg, reps } : s,
        ),
      };
      return { exercises };
    }),

  deleteSet: (exerciseIndex, localId) =>
    set((state) => {
      const exercises = [...state.exercises];
      exercises[exerciseIndex] = {
        ...exercises[exerciseIndex],
        sets: exercises[exerciseIndex].sets.filter((s) => s.localId !== localId),
      };
      return { exercises };
    }),

  setSkippedExercises: (ids) => set({ skippedExerciseIds: ids }),
}));
