'use client';

import { Dumbbell } from 'lucide-react';

export default function SessionPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-coral/10">
        <Dumbbell className="h-10 w-10 text-coral" strokeWidth={1.8} />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-t1">Session Logging</h1>
        <p className="text-t2">Chef is cooking — this screen is coming soon.</p>
      </div>
    </div>
  );
}
