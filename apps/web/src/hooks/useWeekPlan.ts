'use client';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { WeekPlanDay } from '@/types/today';

export function useWeekPlan() {
  const isAuthenticated = useAuthStore((s) => s.accessToken !== null);

  return useQuery<WeekPlanDay[] | null>({
    queryKey: ['workouts', 'week'],
    queryFn: () => apiGet<WeekPlanDay[]>('/workouts/week'),
    staleTime: 60_000,
    enabled: isAuthenticated,
  });
}
