'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { apiGet, apiPost } from '@/lib/api';
import type { ActiveSessionResponse } from '@/types/today';

export default function SessionEntryPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }

    void (async () => {
      try {
        // Check for existing active session
        const active = await apiGet<ActiveSessionResponse | null>(
          '/workouts/sessions/active',
          accessToken,
        );
        if (active?.sessionId) {
          router.replace(`/session/${active.sessionId}`);
          return;
        }

        // Start a new session, optionally with trainingDayId from query params
        const params = new URLSearchParams(window.location.search);
        const trainingDayId = params.get('trainingDayId');
        const newSession = await apiPost<ActiveSessionResponse>('/workouts/sessions', {
          training_day_id: trainingDayId ?? null,
        }, accessToken);
        router.replace(`/session/${newSession.sessionId}`);
      } catch {
        router.replace('/today');
      }
    })();
  }, [accessToken, router]);

  return (
    <div className="flex items-center justify-center min-h-dvh bg-bg">
      <div
        className="w-10 h-10 border-2 border-coral border-t-transparent rounded-full animate-spin"
        role="status"
        aria-label="Starting session..."
      />
    </div>
  );
}
