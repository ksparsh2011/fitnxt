import { Card } from '@/components/ui';

// TODO Phase 4: replace with /ai-coach/daily-tip API call

export function TodayAITip() {
  return (
    <Card variant="violet" className="flex items-start gap-3">
      <div className="mt-0.5 flex-shrink-0 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse-dot" aria-hidden="true" />
      </div>
      <div>
        <p className="font-sans font-semibold text-sm text-violet mb-1">AI Coach</p>
        <p className="text-sm text-t1 leading-relaxed">
          Progressive overload is the key driver of strength gains. Aim to add 2.5–5 kg
          to your main lifts every 2–3 weeks. Prioritise sleep and protein on training days
          for maximum muscle protein synthesis.
        </p>
      </div>
    </Card>
  );
}
