export enum Goal {
  LEAN_BULK = 'lean_bulk',
  CUT = 'cut',
  RECOMP = 'recomp',
  STRENGTH = 'strength',
  ENDURANCE = 'endurance',
}

export enum ExperienceLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum WorkoutPlanStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
}

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
  PRE_WORKOUT = 'pre_workout',
  POST_WORKOUT = 'post_workout',
}

export enum AIMessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
}

export interface User {
  id: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  updatedAt: Date;
}

export interface UserGoal {
  userId: string;
  goal: Goal;
  experienceLevel: ExperienceLevel;
  weeklyFrequency: number;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  durationWeeks: number;
  currentWeek: number;
  status: WorkoutPlanStatus;
  createdAt: Date;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  /** FK to training_days.id — NULL for unplanned sessions */
  trainingDayId?: string;
  name: string;
  startedAt: Date;
  completedAt?: Date;
  durationSeconds?: number;
  notes?: string;
  totalVolume?: number;
}

export interface ExerciseEntry {
  id: string;
  sessionId: string;
  exerciseName: string;
  muscleGroup: string;
  orderIndex: number;
}

export interface Set {
  id: string;
  exerciseEntryId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  completedAt: Date;
}

export interface PersonalRecord {
  id: string;
  userId: string;
  /** FK to exercises.id */
  exerciseId: string;
  /** Matches personal_records.pr_type CHECK constraint in DATA-MODEL.md */
  prType: '1rm' | '3rm' | '5rm' | '8rm' | '10rm' | 'max_reps';
  /** Weight (kg) for strength PRs; reps for max_reps PRs */
  value: number;
  achievedAt: Date;
  previousValue?: number;
}

export interface MealLog {
  id: string;
  userId: string;
  loggedAt: Date;
  mealType: MealType;
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  quantity: number;
  unit: string;
}

export interface MacroTarget {
  userId: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  updatedAt: Date;
}

export interface AIConversation {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: AIMessageRole;
  content: string;
  createdAt: Date;
}
