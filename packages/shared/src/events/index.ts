export const EVENTS = {
  WORKOUT_SESSION_STARTED: 'workout.session.started',
  WORKOUT_SESSION_COMPLETED: 'workout.session.completed',
  PERSONAL_RECORD_ACHIEVED: 'workout.pr.achieved',
  SET_LOGGED: 'workout.set.logged',
} as const;

export type WorkoutSessionStartedEvent = {
  sessionId: string;
  userId: string;
  planId?: string;
  startedAt: Date;
};

export type WorkoutSessionCompletedEvent = {
  sessionId: string;
  userId: string;
  totalVolumeKg: number;
  durationMinutes: number | null;
  prCount: number;
  totalSets: number;
};

export type PersonalRecordAchievedEvent = {
  prId: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  prType: '1rm' | '3rm' | '5rm' | '8rm' | '10rm' | 'max_reps';
  value: number;
  previousValue: number | null;
  achievedAt: Date;
};

export type SetLoggedEvent = {
  setId: string;
  sessionId: string;
  userId: string;
  exerciseId: string;
  reps: number;
  weightKg: number | null;
};
