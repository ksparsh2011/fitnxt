'use client';
import { Minus, Plus } from 'lucide-react';

interface StepperControlProps {
  label: string;
  displayValue: string;
  onIncrement: () => void;
  onDecrement: () => void;
  decrementDisabled?: boolean;
}

export function StepperControl({
  label,
  displayValue,
  onIncrement,
  onDecrement,
  decrementDisabled = false,
}: StepperControlProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-widest text-t2">{label}</span>
      <div className="flex items-center">
        <button
          onClick={onDecrement}
          disabled={decrementDisabled}
          className="w-12 h-12 rounded-l-xl bg-surface-3 border border-border text-t1 flex items-center justify-center active:bg-surface-4 transition-colors disabled:opacity-40"
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <Minus className="w-4 h-4" strokeWidth={1.8} />
        </button>
        <div className="w-24 h-12 bg-surface-2 border-t border-b border-border flex items-center justify-center font-mono text-base font-medium text-t1">
          {displayValue}
        </div>
        <button
          onClick={onIncrement}
          className="w-12 h-12 rounded-r-xl bg-surface-3 border border-border text-t1 flex items-center justify-center active:bg-surface-4 transition-colors"
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <Plus className="w-4 h-4" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
