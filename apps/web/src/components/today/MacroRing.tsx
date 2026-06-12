'use client';
import { useToday } from '@/hooks/useToday';
import { Card, CardHeader, CardTitle } from '@/components/ui';

function pct(logged: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((logged / target) * 100));
}

interface MacroBarProps {
  label: string;
  logged: number;
  target: number;
  unit: string;
  barClass: string;
}

function MacroBar({ label, logged, target, unit, barClass }: MacroBarProps) {
  const progress = pct(logged, target);
  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between text-xs text-t2 mb-1">
        <span>{label}</span>
        <span className="font-mono text-t1">{logged}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${progress}%`, transition: 'width 0.6s cubic-bezier(0.0, 0.0, 0.2, 1)' }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export function MacroRing() {
  const { nutrition } = useToday();

  const logged = nutrition?.logged ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const targets = nutrition?.targets ?? { calories: 2600, protein: 180, carbs: 280, fat: 80 };

  const caloriePct = pct(logged.calories, targets.calories);

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle>Macros Today</CardTitle>
        <span className="text-xs text-violet cursor-pointer">Log food</span>
      </CardHeader>

      {/* Calorie main bar */}
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="font-mono text-t1">
            {logged.calories.toLocaleString()}
            <span className="text-xs text-t2 font-sans ml-1">/ {targets.calories.toLocaleString()} kcal</span>
          </span>
          <span className="text-xs text-t2">{caloriePct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden mb-3">
          <div
            className="h-full rounded-full"
            style={{
              width: `${caloriePct}%`,
              background: 'linear-gradient(90deg, var(--violet), var(--coral))',
              transition: 'width 0.6s cubic-bezier(0.0, 0.0, 0.2, 1)',
            }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Macro bars row */}
      <div className="flex gap-3">
        <MacroBar label="Protein" logged={logged.protein} target={targets.protein} unit="g" barClass="bg-violet" />
        <MacroBar label="Carbs"   logged={logged.carbs}   target={targets.carbs}   unit="g" barClass="bg-coral" />
        <MacroBar label="Fat"     logged={logged.fat}     target={targets.fat}     unit="g" barClass="bg-[var(--text-2)]" />
      </div>
    </Card>
  );
}
