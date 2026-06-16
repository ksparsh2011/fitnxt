'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthQuery } from './useAuthQuery';
import { apiGet, apiPost, apiPatch } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/query-keys';
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

/** Returns the full session detail and exposes logSet / finishSession mutations. */
export function useSession(sessionId: string | null) {
  const queryClient = useQueryClient();

  const sessionQuery = useAuthQuery<WorkoutSessionDetail | null>({
    queryKey: QUERY_KEYS.workouts.sessions.detail(sessionId ?? ''),
    queryFn: () => apiGet<WorkoutSessionDetail>(`/workouts/sessions/${sessionId}`),
    enabled: !!sessionId,
    staleTime: 0,
  });

  const logSetMutation = useMutation({
    mutationFn: (input: LogSetInput) =>
      apiPost<LogSetResponse>(`/workouts/sessions/${sessionId}/sets`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workouts.sessions.detail(sessionId ?? ''),
      });
    },
  });

  const finishSessionMutation = useMutation({
    mutationFn: (input: FinishSessionInput) =>
      apiPatch<WorkoutSessionDetail>(`/workouts/sessions/${sessionId}/finish`, input),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.workouts.sessions.detail(sessionId ?? ''), data);
      // Prefix invalidation — dayNumber not known here, so invalidate all today keys
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
