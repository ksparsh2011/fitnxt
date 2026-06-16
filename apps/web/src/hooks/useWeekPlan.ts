'use client';
import { useAuthQuery } from './useAuthQuery';
import { apiGet } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { WeekPlanDay } from '@/types/today';

/** Returns the 7-day training plan overview for the authenticated user. */
export function useWeekPlan() {
  return useAuthQuery<WeekPlanDay[] | null>({
    queryKey: QUERY_KEYS.workouts.week(),
    queryFn: () => apiGet<WeekPlanDay[]>('/workouts/week'),
    staleTime: 60_000,
  });
}
