'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Plus } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import type { ActiveSessionResponse } from '@/types/today';

type Status = 'checking' | 'idle' | 'starting';

export default function SessionEntryPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('checking');
  const checked = useRef(false);

  const startSession = useCallback(async (trainingDayId?: string | null) => {
    setStatus('starting');
    try {
      const session = await apiPost<ActiveSessionResponse>('/workouts/sessions', {
        training_day_id: trainingDayId ?? null,
      });
      if (session?.sessionId) {
        router.replace(`/session/${session.sessionId}`);
      } else {
        setStatus('idle');
      }
    } catch {
      setStatus('idle');
    }
  }, [router]);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const trainingDayId = new URLSearchParams(window.location.search).get('trainingDayId');

    apiGet<ActiveSessionResponse>('/workouts/sessions/active')
      .then((active) => {
        if (active?.sessionId) {
          router.replace(`/session/${active.sessionId}`);
        } else if (trainingDayId) {
          void startSession(trainingDayId);
        } else {
          setStatus('idle');
        }
      })
      .catch(() => setStatus('idle'));
  }, [router, startSession]);

  if (status === 'checking' || status === 'starting') {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-bg">
        <div
          className="w-10 h-10 border-2 border-coral border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label={status === 'starting' ? 'Starting session…' : 'Loading…'}
        />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh bg-bg px-6">
      {/* radial-gradient not expressible in Tailwind without custom config */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none bg-coral/[0.12] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-xs w-full gap-6">
        <div className="w-20 h-20 rounded-3xl bg-coral/10 flex items-center justify-center">
          <Dumbbell size={36} className="text-coral" strokeWidth={1.8} />
        </div>

        <div>
          <p className="font-display text-2xl font-extrabold text-t1 mb-1">Ready to train?</p>
          <p className="text-base text-t2">Start a new session and log your sets as you go.</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Button
            variant="coral"
            size="lg"
            className="w-full"
            onClick={() => void startSession(null)}
          >
            <Plus size={18} strokeWidth={1.8} />
            Start Session
          </Button>

          <Button
            variant="ghost"
            size="md"
            className="w-full"
            onClick={() => router.push('/today')}
          >
            Not today
          </Button>
        </div>
      </div>
    </div>
  );
}
