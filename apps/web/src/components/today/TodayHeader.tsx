'use client';
import Link from 'next/link';
import { useToday } from '@/hooks/useToday';
import { Badge } from '@/components/ui';
import { Flame } from 'lucide-react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTodayString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function TodayHeader() {
  const { user } = useToday();
  const displayName = user?.displayName ?? '...';
  const greeting = getGreeting();

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-t1 leading-tight">
          {greeting},<br />{displayName}
        </h1>
        <p className="text-sm text-t2 mt-1">{getTodayString()}</p>
        <div className="mt-2">
          {/* TODO Phase 3: derive streak count from workout_sessions consecutive day count */}
          <Badge variant="gold" dot>
            <Flame className="h-3 w-3" strokeWidth={1.8} aria-hidden="true" />
            12 day streak
          </Badge>
        </div>
      </div>
      <Link
        href="/profile"
        className="w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-base flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, var(--violet-deep), var(--coral))' }}
        aria-label={`Avatar for ${displayName}`}
      >
        {displayName.charAt(0).toUpperCase()}
      </Link>
    </div>
  );
}
