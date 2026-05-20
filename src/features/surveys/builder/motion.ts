import type { Transition } from 'motion/react'

/** Builder 动效基准：短、轻，仅作点缀 */
export const surveyMotionTransition: Transition = {
  duration: 0.16,
  ease: [0.25, 0.1, 0.25, 1],
}

export const surveyMotionReveal = {
  initial: { opacity: 0, scale: 0.985 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.985 },
  transition: surveyMotionTransition,
} as const

export const surveyMotionLift = {
  initial: { opacity: 0.88, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  transition: surveyMotionTransition,
} as const
