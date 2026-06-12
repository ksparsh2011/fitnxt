import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Stat {
  label: string;
  value: string | number;
  unit?: string;
  accent?: "violet" | "coral" | "gold" | "success";
}

interface StatRowProps extends HTMLAttributes<HTMLDivElement> {
  stats: Stat[];
}

const accentText: Record<NonNullable<Stat["accent"]>, string> = {
  violet:  "text-violet",
  coral:   "text-coral",
  gold:    "text-gold",
  success: "text-[var(--success)]",
};

export function StatRow({ stats, className, ...props }: StatRowProps) {
  return (
    <div
      className={cn("grid divide-x divide-[var(--border)]", className)}
      style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
      {...props}
    >
      {stats.map(({ label, value, unit, accent }) => (
        <div key={label} className="flex flex-col items-center gap-0.5 px-2 first:pl-0 last:pr-0">
          <span
            className={cn(
              "font-mono font-medium text-xl leading-none",
              accent ? accentText[accent] : "text-t1",
            )}
          >
            {value}
            {unit && (
              <span className="text-xs text-t2 ml-0.5 font-sans">{unit}</span>
            )}
          </span>
          <span className="text-[10px] text-t2 uppercase tracking-wider">{label}</span>
        </div>
      ))}
    </div>
  );
}
