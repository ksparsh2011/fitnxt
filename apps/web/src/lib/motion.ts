// Shared Framer Motion variants for auth screens
// Import in any auth page that needs entrance stagger animations.

export const authContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
} as const;

export const authItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] as const },
  },
} as const;
