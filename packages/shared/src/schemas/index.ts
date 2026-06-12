import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  avatarUrl: z.string().url().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof UserSchema>;

export const UserProfileSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().max(500).nullable(),
  updatedAt: z.coerce.date(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const WorkoutSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  trainingDayId: z.string().uuid().optional(),
  name: z.string().min(1),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  totalVolume: z.number().nonnegative().optional(),
});
export type WorkoutSession = z.infer<typeof WorkoutSessionSchema>;

export const SetSchema = z.object({
  id: z.string().uuid(),
  exerciseEntryId: z.string().uuid(),
  setNumber: z.number().int().positive(),
  weightKg: z.number().nonnegative(),
  reps: z.number().int().positive(),
  rpe: z.number().min(1).max(10).optional(),
  completedAt: z.coerce.date(),
});
export type Set = z.infer<typeof SetSchema>;

export const MealLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  loggedAt: z.coerce.date(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout']),
  foodName: z.string().min(1),
  calories: z.number().int().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});
export type MealLog = z.infer<typeof MealLogSchema>;

export const PersonalRecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  prType: z.enum(['1rm', '3rm', '5rm', '8rm', '10rm', 'max_reps']),
  value: z.number().nonnegative(),
  achievedAt: z.coerce.date(),
  previousValue: z.number().nonnegative().optional(),
});
export type PersonalRecord = z.infer<typeof PersonalRecordSchema>;
