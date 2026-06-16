'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { ActiveSessionResponse } from '@/types/today';

/** Starts a new workout session and redirects to the active session screen on success. */
export function useStartSession() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (trainingDayId: string | null) =>
      apiPost<ActiveSessionResponse>('/workouts/sessions', { training_day_id: trainingDayId }),
    onSuccess: async (session) => {
      if (session?.sessionId) {
        // Prefix invalidation — dayNumber not known here, so invalidate all today keys
        await queryClient.invalidateQueries({ queryKey: ['workouts', 'today'] });
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workouts.week() });
        router.replace(`/session/${session.sessionId}`);
      }
    },
  });
}
