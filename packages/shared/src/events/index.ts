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
  durationSeconds: number;
  totalVolume: number;
  completedAt: Date;
};

export type PersonalRecordAchievedEvent = {
  prId: string;
  userId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  previousWeightKg?: number;
  previousReps?: number;
  achievedAt: Date;
};

export type SetLoggedEvent = {
  setId: string;
  sessionId: string;
  userId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
};
