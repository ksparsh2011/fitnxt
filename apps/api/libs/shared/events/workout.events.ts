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

export type WorkoutSessionCompletedEvent = {
  sessionId: string;
  userId: string;
  totalVolumeKg: number;
  durationMinutes: number | null;
  prCount: number;
  totalSets: number;
};
