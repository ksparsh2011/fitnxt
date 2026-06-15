'use client';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useInterval } from '@/hooks/useInterval';
import { Button } from '@/components/ui/Button';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface SessionHeaderProps {
  startedAt: Date | null;
  onFinish: () => void;
  onBack?: () => void;
  workoutName?: string;
}

export function SessionHeader({ startedAt, onFinish, onBack, workoutName }: SessionHeaderProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0,
  );

  useInterval(() => {
    setElapsedSeconds((prev) => prev + 1);
  }, 1000);

  return (
    <header className="px-5 pt-4 pb-2">
      <OfflineBanner />
      {/* Top row: back (optional) / name / finish */}
      <div className="flex items-center justify-between mb-3">
        {onBack !== undefined ? (
          <button
            onClick={onBack}
            className="w-11 h-11 flex items-center justify-center rounded-full text-t2 hover:text-t1 hover:bg-surface-2 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={1.8} />
          </button>
        ) : (
          <div className="w-11" aria-hidden="true" />
        )}

        {workoutName ? (
          <span className="font-display font-bold text-base text-t1 truncate max-w-[160px]">
            {workoutName}
          </span>
        ) : (
          <div />
        )}

        <Button
          variant="coral"
          size="md"
          className="bg-coral/20 border border-coral/30 text-coral hover:bg-coral/30"
          onClick={onFinish}
        >
          Finish
        </Button>
      </div>

      {/* Session active pill — full width */}
      <div className="flex items-center justify-between bg-coral/10 border border-coral/20 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full bg-coral animate-pulse-dot flex-shrink-0"
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-coral">Session Active</span>
        </div>
        <div
          className="font-mono text-base font-medium text-coral"
          aria-live="polite"
          aria-label={`Session time: ${formatTime(elapsedSeconds)}`}
        >
          {formatTime(elapsedSeconds)}
        </div>
      </div>
    </header>
  );
}
