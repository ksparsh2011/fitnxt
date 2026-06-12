'use client';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { UserProfile, TodayWorkout, TodayNutrition } from '@/types/today';

export function useToday() {
  const accessToken = useAuthStore((s) => s.accessToken);

  const userQuery = useQuery<UserProfile>({
    queryKey: ['user', 'me'],
    queryFn: () => apiGet<UserProfile>('/users/me', accessToken ?? undefined),
    staleTime: Infinity,
    enabled: !!accessToken,
  });

  const workoutQuery = useQuery<TodayWorkout | null>({
    queryKey: ['workouts', 'today'],
    queryFn: () => apiGet<TodayWorkout | null>('/workouts/today', accessToken ?? undefined),
    staleTime: 60_000,
    enabled: !!accessToken,
  });

  const nutritionQuery = useQuery<TodayNutrition>({
    queryKey: ['nutrition', 'today'],
    queryFn: () => apiGet<TodayNutrition>('/nutrition/today', accessToken ?? undefined),
    staleTime: 30_000,
    enabled: !!accessToken,
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
