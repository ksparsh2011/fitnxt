"use client";

interface ProgressRingProps {
  /** 0–100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: "violet" | "coral" | "gold" | "success";
  label?: string;
  sublabel?: string;
  className?: string;
}

const colorMap = {
  violet:  "var(--violet)",
  coral:   "var(--coral)",
  gold:    "var(--gold)",
  success: "var(--success)",
};

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  color = "violet",
  label,
  sublabel,
  className,
}: ProgressRingProps) {
  const clamp   = Math.max(0, Math.min(100, value));
  const r       = (size - strokeWidth) / 2;
  const circ    = 2 * Math.PI * r;
  const dashoff = circ * (1 - clamp / 100);
  const cx      = size / 2;
  const stroke  = colorMap[color];

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clamp}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashoff}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.0,0.0,0.2,1)" }}
        />
      </svg>
      {(label || sublabel) && (
        <div className="absolute flex flex-col items-center leading-none text-center">
          {label && (
            <span className="font-display font-bold text-t1" style={{ fontSize: size * 0.18 }}>
              {label}
            </span>
          )}
          {sublabel && (
            <span className="text-t2 mt-0.5" style={{ fontSize: size * 0.10 }}>
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
