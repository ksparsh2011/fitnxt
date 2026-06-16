'use client';
import { useCurrentUser } from './useCurrentUser';
import { useTodayWorkout } from './useTodayWorkout';
import { useTodayNutrition } from './useTodayNutrition';

/** Aggregates user profile, today's workout, and today's nutrition into a single data shape for the Today screen. */
export function useToday() {
  const userQuery = useCurrentUser();
  const workoutQuery = useTodayWorkout();
  const nutritionQuery = useTodayNutrition();

  return {
    user: userQuery.data,
    workout: workoutQuery.data,
    nutrition: nutritionQuery.data,
    isLoading: userQuery.isLoading || workoutQuery.isLoading || nutritionQuery.isLoading,
    isError: userQuery.isError || workoutQuery.isError || nutritionQuery.isError,
    error: userQuery.error ?? workoutQuery.error ?? nutritionQuery.error,
  };
}
