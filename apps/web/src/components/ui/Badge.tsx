import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "violet" | "coral" | "gold" | "success" | "danger" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  violet:  "bg-[var(--violet-tint)] text-violet  border-[var(--violet-border)]",
  coral:   "bg-[var(--coral-tint)]  text-coral   border-[var(--coral-border)]",
  gold:    "bg-[var(--gold-tint)]   text-gold    border-[var(--gold-border)]",
  success: "bg-[var(--success-tint)] text-[var(--success)] border-[var(--success)]",
  danger:  "bg-[var(--danger-tint)]  text-[var(--danger)]  border-[var(--danger)]",
  neutral: "bg-[var(--surface-3)]    text-t2      border-[var(--border-2)]",
};

export function Badge({ variant = "neutral", dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full " +
        "text-xs font-medium border",
        variants[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
