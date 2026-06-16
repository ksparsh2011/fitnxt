'use client';
import { useAuthQuery } from './useAuthQuery';
import { apiGet } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { ExerciseStats } from '@/types/today';

/** Returns historical performance stats for the specified exercise. */
export function useExerciseStats(exerciseId: string | null) {
  return useAuthQuery<ExerciseStats | null>({
    queryKey: QUERY_KEYS.workouts.exerciseStats(exerciseId ?? ''),
    queryFn: () => apiGet<ExerciseStats>(`/workouts/exercises/${exerciseId}/stats`),
    staleTime: 60_000,
    enabled: !!exerciseId,
  });
}
