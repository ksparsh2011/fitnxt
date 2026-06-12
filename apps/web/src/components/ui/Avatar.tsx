import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizes: Record<AvatarSize, { px: number; text: string }> = {
  sm: { px: 32, text: "text-xs" },
  md: { px: 40, text: "text-sm" },
  lg: { px: 56, text: "text-base" },
  xl: { px: 80, text: "text-xl" },
};

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const { px, text } = sizes[size];

  return (
    <div
      style={{ width: px, height: px }}
      className={cn(
        "relative flex-shrink-0 rounded-full overflow-hidden",
        "bg-[var(--violet-tint)] border border-[var(--violet-border)]",
        className,
      )}
    >
      {src ? (
        <Image src={src} alt={name ?? "Avatar"} fill className="object-cover" />
      ) : (
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "font-display font-semibold text-violet",
            text,
          )}
          aria-label={name}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}
