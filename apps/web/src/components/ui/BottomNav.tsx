"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Zap, Sparkles, BarChart2, User } from "lucide-react";

const tabs = [
  { href: "/today",    label: "Today",    Icon: Home     },
  { href: "/session",  label: "Train",    Icon: Zap      },
  { href: "/coach",    label: "Coach",    Icon: Sparkles },
  { href: "/progress", label: "Progress", Icon: BarChart2 },
  { href: "/profile",  label: "Profile",  Icon: User     },
] as const;

export function BottomNav() {
  const path = usePathname();
  const isSessionPath = path.startsWith('/session');

  return (
    <nav
      aria-label="Main navigation"
      className={
        "fixed bottom-0 inset-x-0 z-40 " +
        "bg-[var(--surface)]/80 backdrop-blur-xl " +
        "border-t border-[var(--border)] " +
        "pb-[env(safe-area-inset-bottom)]"
      }
    >
      <ul className="flex">
        {tabs.map(({ href, label, Icon }) => {
          const active =
            href === "/today"
              ? path === "/today" || path === "/"
              : path.startsWith(href);

          // Train tab uses coral when on session pages, violet otherwise
          const activeColor =
            active && href === "/session" && isSessionPath
              ? "text-coral focus-visible:ring-coral"
              : active
              ? "text-violet focus-visible:ring-violet"
              : "text-t3 hover:text-t2 focus-visible:ring-[var(--border-2)]";

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 px-1",
                  "transition-colors duration-150 min-h-[56px] justify-center",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
                  activeColor,
                )}
              >
                <Icon
                  className="w-6 h-6"
                  strokeWidth={1.8}
                  aria-hidden="true"
                  fill={active ? "currentColor" : "none"}
                />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
