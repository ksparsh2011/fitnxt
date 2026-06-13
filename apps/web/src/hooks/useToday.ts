'use client';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { UserProfile, TodayWorkout, TodayNutrition } from '@/types/today';

export function useToday() {
  const isAuthenticated = useAuthStore((s) => s.accessToken !== null);

  const userQuery = useQuery<UserProfile>({
    queryKey: ['user', 'me'],
    queryFn: () => apiGet<UserProfile>('/users/me'),
    staleTime: Infinity,
    enabled: isAuthenticated,
  });

  const workoutQuery = useQuery<TodayWorkout | null>({
    queryKey: ['workouts', 'today'],
    queryFn: () => apiGet<TodayWorkout | null>('/workouts/today'),
    staleTime: 60_000,
    enabled: isAuthenticated,
  });

  const nutritionQuery = useQuery<TodayNutrition>({
    queryKey: ['nutrition', 'today'],
    queryFn: () => apiGet<TodayNutrition>('/nutrition/today'),
    staleTime: 30_000,
    enabled: isAuthenticated,
  });

  return {
    user: userQuery.data,
    workout: workoutQuery.data,
    nutrition: nutritionQuery.data,
    isLoading: userQuery.isLoading || workoutQuery.isLoading || nutritionQuery.isLoading,
    isError: userQuery.isError || workoutQuery.isError || nutritionQuery.isError,
    error: userQuery.error ?? workoutQuery.error ?? nutritionQuery.error,
  };
}
