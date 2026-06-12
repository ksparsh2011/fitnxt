import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}

const rounding = {
  sm:   "rounded",
  md:   "rounded-xl",
  lg:   "rounded-2xl",
  full: "rounded-full",
};

export function Skeleton({ className, rounded = "md" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-[var(--surface-3)] animate-skeleton",
        rounding[rounded],
        className,
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}
