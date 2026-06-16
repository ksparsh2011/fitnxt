'use client';
import { useAuthQuery } from './useAuthQuery';
import { apiGet } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { TodayNutrition } from '@/types/today';

/** Returns today's macro totals and targets for the authenticated user. */
export function useTodayNutrition() {
  return useAuthQuery<TodayNutrition | null>({
    queryKey: QUERY_KEYS.nutrition.today(),
    queryFn: () => apiGet<TodayNutrition>('/nutrition/today'),
    staleTime: 30_000,
  });
}
