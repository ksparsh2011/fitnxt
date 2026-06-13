export interface TodayWorkout {
  trainingDayId: string;
  name: string;
  focus: string[];
  exercises: Array<{
    exerciseId: string;
    name: string;
    muscleGroup: string;
    sets: number;
    reps: number;
    restSeconds: number | null;
  }>;
}

export interface TodayNutrition {
  logged: { calories: number; protein: number; carbs: number; fat: number };
  targets: { calories: number; protein: number; carbs: number; fat: number } | null;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  fitnessGoal: string;
  createdAt: string;
}

export interface ActiveSessionResponse {
  sessionId: string;
  trainingDayId: string | null;
  checkedInAt: string;
  totalSets: number | null;
  totalVolumeKg: number | null;
}
