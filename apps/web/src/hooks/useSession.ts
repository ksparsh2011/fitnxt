'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { WorkoutSessionDetail, PREvent } from '@fitnxt/shared';

interface LogSetInput {
  exercise_id: string;
  reps: number;
  weight_kg?: number | null;
  rpe?: number | null;
  is_warmup?: boolean;
}

interface LogSetResponse {
  setId: string;
  isPr: boolean;
  pr?: PREvent;
}

interface FinishSessionInput {
  fatigue_rating?: number;
  notes?: string;
}

export function useSession(sessionId: string | null) {
  const isAuthenticated = useAuthStore((s) => s.accessToken !== null);
  const queryClient = useQueryClient();

  const sessionQuery = useQuery<WorkoutSessionDetail | null>({
    queryKey: ['sessions', sessionId],
    queryFn: () => apiGet<WorkoutSessionDetail>(`/workouts/sessions/${sessionId}`),
    enabled: !!sessionId && isAuthenticated,
    staleTime: 0,
  });

  const logSetMutation = useMutation({
    mutationFn: (input: LogSetInput) =>
      apiPost<LogSetResponse>(`/workouts/sessions/${sessionId}/sets`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] });
    },
  });

  const finishSessionMutation = useMutation({
    mutationFn: (input: FinishSessionInput) =>
      apiPatch<WorkoutSessionDetail>(`/workouts/sessions/${sessionId}/finish`, input),
    onSuccess: (data) => {
      queryClient.setQueryData(['sessions', sessionId], data);
      void queryClient.invalidateQueries({ queryKey: ['workouts', 'today'] });
    },
  });

  return {
    session: sessionQuery.data,
    isLoading: sessionQuery.isLoading,
    isError: sessionQuery.isError,
    logSetAsync: logSetMutation.mutateAsync,
    isLoggingSet: logSetMutation.isPending,
    finishSessionAsync: finishSessionMutation.mutateAsync,
    isFinishing: finishSessionMutation.isPending,
  };
}
