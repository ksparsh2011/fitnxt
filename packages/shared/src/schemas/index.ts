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
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name is too long'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password is too long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and a number',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password is too long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and a number',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const PatchOnboardingSchema = z.object({
  fitness_goal: z.enum(['lean_bulk', 'cut', 'recomp', 'strength', 'endurance']),
  activity_level: z.enum([
    'sedentary',
    'lightly_active',
    'moderately_active',
    'very_active',
    'extremely_active',
  ]),
  target_weight_kg: z.number().positive().nullable().optional(),
});
export type PatchOnboardingInput = z.infer<typeof PatchOnboardingSchema>;

export const LogSetSchema = z.object({
  exercise_id: z.string().uuid(),
  reps: z.number().int().positive(),
  weight_kg: z.number().positive().nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  is_warmup: z.boolean().optional().default(false),
});
export type LogSetInput = z.infer<typeof LogSetSchema>;

export const StartSessionSchema = z.object({
  training_day_id: z.string().uuid().nullable().optional(),
});
export type StartSessionInput = z.infer<typeof StartSessionSchema>;

export const FinishSessionSchema = z.object({
  fatigue_rating: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
});
export type FinishSessionInput = z.infer<typeof FinishSessionSchema>;
