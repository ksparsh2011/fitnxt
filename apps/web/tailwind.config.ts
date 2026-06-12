import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        bg:      "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          2:       "var(--surface-2)",
          3:       "var(--surface-3)",
          4:       "var(--surface-4)",
        },
        border: {
          DEFAULT: "var(--border)",
          2:       "var(--border-2)",
        },
        violet: {
          DEFAULT: "var(--violet)",
          deep:    "var(--violet-deep)",
          tint:    "var(--violet-tint)",
          border:  "var(--violet-border)",
          glow:    "var(--violet-glow)",
        },
        coral: {
          DEFAULT: "var(--coral)",
          deep:    "var(--coral-deep)",
          tint:    "var(--coral-tint)",
          border:  "var(--coral-border)",
          glow:    "var(--coral-glow)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          tint:    "var(--gold-tint)",
          border:  "var(--gold-border)",
        },
        success: {
          DEFAULT: "var(--success)",
          tint:    "var(--success-tint)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          tint:    "var(--danger-tint)",
        },
        t1: "var(--text-1)",
        t2: "var(--text-2)",
        t3: "var(--text-3)",
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        sans:    ["var(--font-dm-sans)", "sans-serif"],
        mono:    ["var(--font-jetbrains)", "monospace"],
      },
      fontSize: {
        'xs':   ['11px', { lineHeight: '16px' }],
        'sm':   ['13px', { lineHeight: '20px' }],
        'base': ['15px', { lineHeight: '22px' }],
        'md':   ['16px', { lineHeight: '24px' }],
        'lg':   ['18px', { lineHeight: '26px' }],
        'xl':   ['22px', { lineHeight: '30px' }],
        '2xl':  ['28px', { lineHeight: '34px' }],
        '3xl':  ['36px', { lineHeight: '40px' }],
        '4xl':  ['48px', { lineHeight: '52px' }],
      },
      borderRadius: {
        "xl":   "16px",
        "2xl":  "20px",
        "3xl":  "28px",
        "4xl":  "28px",
        phone:  "44px",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        "nav":         "72px",
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease infinite",
        "skeleton":  "skeleton 1.5s ease-in-out infinite",
        "slide-up":  "slide-up 0.38s cubic-bezier(0.0,0.0,0.2,1)",
        "fade-in":   "fade-in 0.2s ease",
        "scale-in":  "scale-in 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.5", transform: "scale(0.8)" },
        },
        "skeleton": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.4" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.8)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
