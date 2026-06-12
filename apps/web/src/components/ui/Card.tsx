import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "violet" | "coral" | "gold" | "flat";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
}

const variants: Record<CardVariant, string> = {
  default:
    "bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-2)]",
  violet:
    "bg-[var(--violet-tint)] border border-[var(--violet-border)]",
  coral:
    "bg-[var(--coral-tint)] border border-[var(--coral-border)]",
  gold:
    "bg-[var(--gold-tint)] border border-[var(--gold-border)]",
  flat:
    "bg-[var(--surface-2)]",
};

const paddings = {
  none: "",
  sm:   "p-3",
  md:   "p-4",
  lg:   "p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl transition-colors duration-150",
        variants[variant],
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
Card.displayName = "Card";

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center justify-between mb-3", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn("font-display font-semibold text-base text-t1", className)}
    {...props}
  />
);

export const CardBody = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("text-t2 text-sm leading-relaxed", className)} {...props} />
);
