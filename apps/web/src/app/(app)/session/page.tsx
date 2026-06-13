'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { apiGet, apiPost } from '@/lib/api';
import type { ActiveSessionResponse } from '@/types/today';

export default function SessionEntryPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const initiated = useRef(false);

  useEffect(() => {
    if (!accessToken) { router.replace('/login'); return; }
    if (initiated.current) return;
    initiated.current = true;

    void (async () => {
      try {
        let active = await apiGet<ActiveSessionResponse | null>('/workouts/sessions/active');

        if (!active?.sessionId) {
          const trainingDayId = new URLSearchParams(window.location.search).get('trainingDayId');
          active = await apiPost<ActiveSessionResponse>('/workouts/sessions', {
            training_day_id: trainingDayId ?? null,
          }).catch(() =>
            apiGet<ActiveSessionResponse | null>('/workouts/sessions/active'),
          );
        }

        if (active?.sessionId) {
          router.replace(`/session/${active.sessionId}`);
        } else {
          router.replace('/today');
        }
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
