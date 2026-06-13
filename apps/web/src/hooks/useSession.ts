'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { WorkoutSessionDetail, PREvent } from '@fitnxt/shared';
import type { ActiveSessionResponse } from '@/types/today';

interface StartSessionInput {
  training_day_id?: string | null;
}

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
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const sessionQuery = useQuery<WorkoutSessionDetail>({
    queryKey: ['sessions', sessionId],
    queryFn: () =>
      apiGet<WorkoutSessionDetail>(`/workouts/sessions/${sessionId}`, accessToken ?? undefined),
    enabled: !!sessionId && !!accessToken,
    staleTime: 0,
  });

  const startSessionMutation = useMutation({
    mutationFn: (input: StartSessionInput) =>
      apiPost<ActiveSessionResponse>('/workouts/sessions', input, accessToken ?? undefined),
  });

  const logSetMutation = useMutation({
    mutationFn: (input: LogSetInput) =>
      apiPost<LogSetResponse>(`/workouts/sessions/${sessionId}/sets`, input, accessToken ?? undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] });
    },
  });

  const finishSessionMutation = useMutation({
    mutationFn: (input: FinishSessionInput) =>
      apiPatch<WorkoutSessionDetail>(
        `/workouts/sessions/${sessionId}/finish`,
        input,
        accessToken ?? undefined,
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(['sessions', sessionId], data);
    },
  });

  return {
    session: sessionQuery.data,
    isLoading: sessionQuery.isLoading,
    isError: sessionQuery.isError,
    startSession: startSessionMutation.mutate,
    startSessionAsync: startSessionMutation.mutateAsync,
    logSet: logSetMutation.mutate,
    logSetAsync: logSetMutation.mutateAsync,
    isLoggingSet: logSetMutation.isPending,
    finishSession: finishSessionMutation.mutate,
    finishSessionAsync: finishSessionMutation.mutateAsync,
    isFinishing: finishSessionMutation.isPending,
  };
}
