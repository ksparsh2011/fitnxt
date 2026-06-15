'use client';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { ExerciseStats } from '@/types/today';

export function useExerciseStats(exerciseId: string | null) {
  const isAuthenticated = useAuthStore((s) => s.accessToken !== null);

  return useQuery<ExerciseStats | null>({
    queryKey: ['exercises', exerciseId, 'stats'],
    queryFn: () => apiGet<ExerciseStats>(`/workouts/exercises/${exerciseId}/stats`),
    staleTime: 60_000,
    enabled: !!exerciseId && isAuthenticated,
  });
}
