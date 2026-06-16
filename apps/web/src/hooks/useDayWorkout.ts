'use client';
import { useAuthQuery } from './useAuthQuery';
import { apiGet } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { TodayWorkout } from '@/types/today';

/** Returns the training plan for the specified day number (1=Monday, 7=Sunday). */
export function useDayWorkout(dayNumber: number) {
  return useAuthQuery<TodayWorkout | null>({
    queryKey: QUERY_KEYS.workouts.day(dayNumber),
    queryFn: () => apiGet<TodayWorkout>(`/workouts/day/${dayNumber}`),
    staleTime: 60_000,
  });
}
