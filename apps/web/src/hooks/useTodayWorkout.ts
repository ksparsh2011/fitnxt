'use client';
import { useAuthQuery } from './useAuthQuery';
import { apiGet } from '@/lib/api';
import { computeTodayDayNumber } from '@/lib/dates';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { TodayWorkout } from '@/types/today';

/** Returns today's scheduled workout for the authenticated user's local timezone. */
export function useTodayWorkout() {
  const localDayNumber = computeTodayDayNumber();
  return useAuthQuery<TodayWorkout | null>({
    queryKey: QUERY_KEYS.workouts.today(localDayNumber),
    queryFn: () => apiGet<TodayWorkout>(`/workouts/today?dayNumber=${localDayNumber}`),
    staleTime: 60_000,
  });
}
