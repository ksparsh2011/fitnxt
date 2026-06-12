'use client';
import { Button } from '@/components/ui';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function TodayError({ error, reset }: ErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 gap-4 text-center">
      <p className="font-display font-semibold text-lg text-t1">Something went wrong</p>
      <p className="text-base text-t2">{error.message}</p>
      <Button variant="secondary" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
