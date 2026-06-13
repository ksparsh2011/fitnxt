import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  avatarUrl: z.string().url().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const UserProfileSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().max(500).nullable(),
  updatedAt: z.coerce.date(),
});

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

export const SetSchema = z.object({
  id: z.string().uuid(),
  exerciseEntryId: z.string().uuid(),
  setNumber: z.number().int().positive(),
  weightKg: z.number().nonnegative(),
  reps: z.number().int().positive(),
  rpe: z.number().min(1).max(10).optional(),
  completedAt: z.coerce.date(),
});

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

export const PersonalRecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  prType: z.enum(['1rm', '3rm', '5rm', '8rm', '10rm', 'max_reps']),
  value: z.number().nonnegative(),
  achievedAt: z.coerce.date(),
  previousValue: z.number().nonnegative().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
  .object({
    displayName: z.string().min(2).max(100),
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .max(72)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof RegisterSchema>;
