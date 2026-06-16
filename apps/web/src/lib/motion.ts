// Shared Framer Motion variants for auth screens
// Import in any auth page that needs entrance stagger animations.

export const EASE_OUT = [0.0, 0.0, 0.2, 1] as const;
export const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;

export const authContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
} as const;

export const authItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
} as const;

// Shared variants for Today screen and other app screens
export const pageContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
} as const;

export const cardItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
} as const;
