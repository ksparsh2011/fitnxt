import { BottomNav } from '@/components/ui';
import { AuthGuard } from '@/components/AuthGuard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-dvh bg-bg">
        <main className="pb-[calc(72px+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
