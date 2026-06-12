import { Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui';

export function RestDayCard() {
  return (
    <Card
      variant="violet"
      className="relative overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 90% 0%, var(--violet) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--violet-tint)] flex items-center justify-center">
            <Zap className="h-4 w-4 text-violet" strokeWidth={1.8} aria-hidden="true" />
          </div>
          <CardTitle>Rest &amp; Recover</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        Today is a scheduled rest day. Focus on sleep, hydration, and light movement.
        Your muscles rebuild stronger during recovery — this day counts as much as your training days.
      </CardBody>
    </Card>
  );
}
