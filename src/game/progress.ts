import type { GameSnapshot, Level } from './types'

export type StepProgress = {
  id: string
  text: string
  success?: string
  done: boolean
  locked: boolean
}

export const evaluateSteps = (level: Level, snapshot: GameSnapshot): StepProgress[] => {
  const progress: StepProgress[] = []
  let unlocked = true

  level.steps.forEach((step) => {
    const done = unlocked && step.check(snapshot)
    progress.push({
      id: step.id,
      text: step.text,
      success: step.success,
      done,
      locked: !unlocked
    })
    if (!done) {
      unlocked = false
    }
  })

  return progress
}

export const countCompletedSteps = (steps: StepProgress[]): number =>
  steps.reduce((count, step) => (step.done ? count + 1 : count), 0)

export const findNextStepIndex = (steps: StepProgress[]): number =>
  steps.findIndex((step) => !step.done)
