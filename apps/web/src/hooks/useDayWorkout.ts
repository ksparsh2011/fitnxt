'use client';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { TodayWorkout } from '@/types/today';

export function useDayWorkout(dayNumber: number) {
  const isAuthenticated = useAuthStore((s) => s.accessToken !== null);

  return useQuery<TodayWorkout | null>({
    queryKey: ['workouts', 'day', dayNumber],
    queryFn: () => apiGet<TodayWorkout>(`/workouts/day/${dayNumber}`),
    staleTime: 60_000,
    enabled: isAuthenticated,
  });
}
