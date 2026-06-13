'use client';

import { User } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet/10">
        <User className="h-10 w-10 text-violet" strokeWidth={1.8} />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-t1">Profile</h1>
        <p className="text-t2">Chef is cooking — this screen is coming soon.</p>
      </div>
    </div>
  );
}
