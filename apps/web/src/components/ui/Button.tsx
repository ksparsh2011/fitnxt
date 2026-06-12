"use client";
import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "coral" | "gold";
type Size    = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-medium rounded-full " +
  "transition-all duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-[var(--bg)] disabled:opacity-40 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-violet text-[var(--bg)] hover:opacity-90 focus-visible:ring-violet",
  secondary:
    "bg-[var(--violet-tint)] text-violet border border-[var(--violet-border)] " +
    "hover:bg-[var(--violet-tint)] hover:border-violet focus-visible:ring-violet",
  ghost:
    "bg-transparent text-t2 hover:text-t1 hover:bg-[var(--surface-2)] focus-visible:ring-[var(--border-2)]",
  danger:
    "bg-[var(--danger-tint)] text-[var(--danger)] border border-[var(--danger)] " +
    "hover:bg-[var(--danger)] hover:text-white focus-visible:ring-[var(--danger)]",
  coral:
    "bg-coral text-white hover:opacity-90 focus-visible:ring-coral",
  gold:
    "bg-gold text-[var(--bg)] hover:opacity-90 focus-visible:ring-gold",
};

const sizes: Record<Size, string> = {
  sm:   "h-8  px-4  text-sm",
  md:   "h-11 px-5  text-sm",
  lg:   "h-14 px-7  text-base",
  icon: "h-11 w-11",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  ),
);
Button.displayName = "Button";

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
      />
    </svg>
  );
}
