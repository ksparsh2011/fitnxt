/** fitNXT — Ignite design tokens (TypeScript source of truth) */

export const tokens = {
  color: {
    dark: {
      bg: "#06060D", surface: "#0D0D1A", surface2: "#141426",
      surface3: "#1C1C32", surface4: "#23233C",
      border: "rgba(255,255,255,0.055)", border2: "rgba(255,255,255,0.10)",
      violet: "#A78BFA", violetDeep: "#7C3AED",
      coral: "#F97066",  coralDeep: "#C4361A",
      gold: "#FCD34D",
      success: "#4ADE80", danger: "#EF4444",
      text1: "#EEEEF8",  text2: "#76768E", text3: "#36364E",
    },
    light: {
      bg: "#EEEDF8", surface: "#FFFFFF", surface2: "#F2F1FA",
      surface3: "#E9E7F5", surface4: "#DDDAF0",
      border: "rgba(0,0,0,0.07)", border2: "rgba(0,0,0,0.11)",
      violet: "#6D28D9", violetDeep: "#5B21B6",
      coral: "#C4361A",  coralDeep: "#9A2B1F",
      gold: "#92400E",
      success: "#15803D", danger: "#DC2626",
      text1: "#16162A",  text2: "#606080", text3: "#ABABC8",
    },
  },
  font: {
    display: "var(--font-syne)",
    sans:    "var(--font-dm-sans)",
    mono:    "var(--font-jetbrains)",
  },
  radius: {
    xs: "6px", sm: "8px", md: "12px", lg: "14px",
    xl: "16px", "2xl": "20px", "3xl": "28px",
    phone: "44px", full: "9999px",
  },
  motion: {
    duration: {
      instant: 100, fast: 150, base: 200, slow: 300, modal: 380, long: 500,
    },
    easing: {
      out:    [0.0, 0.0, 0.2, 1] as const,
      in:     [0.4, 0.0, 1.0, 1] as const,
      spring: [0.34, 1.56, 0.64, 1] as const,
      smooth: [0.4, 0.0, 0.2, 1] as const,
    },
  },
} as const;

export type AccentVariant = "violet" | "coral" | "gold" | "success" | "danger";
export type SizeVariant   = "xs" | "sm" | "md" | "lg" | "xl";
