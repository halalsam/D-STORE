/**
 * JS mirror of the motion and layout tokens in src/styles/tokens.css.
 * Use for JS-driven animation (Web Animations API, gesture handlers)
 * so timing matches the CSS utilities exactly.
 */

export const duration = {
  instant: 90,
  fast: 180,
  base: 280,
  slow: 450,
  snappy: 450,
  spring: 600,
  sheet: 520,
  bounce: 900,
  media: 900,
} as const

export const ease = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  ios: "cubic-bezier(0.32, 0.72, 0, 1)",
  spring: "var(--ease-spring)",
  springSnappy: "var(--ease-spring-snappy)",
  springBounce: "var(--ease-spring-bounce)",
} as const

/** Spring physics behind the linear() curves, for gesture-driven code. */
export const spring = {
  default: { stiffness: 170, damping: 20, mass: 1 },
  snappy: { stiffness: 400, damping: 34, mass: 1 },
  bounce: { stiffness: 260, damping: 15, mass: 1 },
} as const

/** Stagger step for list reveals (multiply by index). */
export const stagger = 45

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
  "3xl": 1920,
} as const
