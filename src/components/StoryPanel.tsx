import { motion } from 'framer-motion'
import { getLevelById, levels } from '../game/levels'
import { countCompletedSteps, evaluateSteps, findNextStepIndex } from '../game/progress'
import { useGameStore } from '../store/gameStore'

export const StoryPanel = () => {
  const levelId = useGameStore((state) => state.levelId)
  const repo = useGameStore((state) => state.repo)
  const actions = useGameStore((state) => state.actions)
  const commandHistory = useGameStore((state) => state.commandHistory)
  const hintIndex = useGameStore((state) => state.hintIndex)
  const advanceLevel = useGameStore((state) => state.advanceLevel)
  const resetLevel = useGameStore((state) => state.resetLevel)

  const level = getLevelById(levelId)
  const snapshot = { repo, actions, commandHistory }
  const steps = evaluateSteps(level, snapshot)
  const completedCount = countCompletedSteps(steps)
  const isComplete = completedCount === steps.length
  const levelIndex = levels.findIndex((entry) => entry.id === level.id)
  const hasNextLevel = levelIndex >= 0 && levelIndex < levels.length - 1
  const revealedHints = level.hints.slice(0, hintIndex)
  const currentHint = hintIndex > 0 ? level.hints[hintIndex - 1] : null
  const nextStepIndex = findNextStepIndex(steps)
  const nextStep = nextStepIndex >= 0 ? steps[nextStepIndex] : null
  const nextCommand = nextStepIndex >= 0 ? level.suggestedCommands[nextStepIndex] ?? null : null
  const showCommand = nextCommand && nextCommand.startsWith('git ') ? nextCommand : null
  const lastCompleted = [...steps].reverse().find((step) => step.done)

  return (
    <section className="panel guide-panel">
      <motion.div
        className="panel-header"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="chapter">{level.chapter}</p>
        <h2>{level.title}</h2>
        <p className="progress">Steps {completedCount}/{steps.length}</p>
      </motion.div>

      <div className="story-lines">
        {level.story.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p className="callout">Steps unlock in order. Type commands in the Command Console to progress.</p>
      </div>

      <div className="objective-list">
        <p className="section-title">Steps</p>
        <ul>
          {steps.map((step) => {
            const className = step.done ? 'done' : step.locked ? 'locked' : 'active'
            const marker = step.done ? '◆' : step.locked ? '•' : '▶'
            return (
            <li key={step.id} className={className}>
              <span className="marker" aria-hidden="true">
                {marker}
              </span>
              {step.text}
            </li>
          )})}
        </ul>
      </div>

      <div className="momentum">
        <p className="section-title">Momentum</p>
        {lastCompleted?.success ? (
          <p>{lastCompleted.success}</p>
        ) : (
          <p className="muted">Complete the first step to build momentum.</p>
        )}
      </div>

      {isComplete ? (
        <div className="completion">
          <p className="section-title">Completion</p>
          {level.completion.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}

      <div className="suggestions">
        <p className="section-title">Next Step</p>
        {nextStep ? (
          <p>{nextStep.text}</p>
        ) : (
          <p className="muted">All steps completed.</p>
        )}
        {showCommand ? (
          <div className="chip-row">
            <span className="chip" aria-label={`Suggested command: ${showCommand}`}>
              {showCommand}
            </span>
          </div>
        ) : null}
      </div>

      <div className="references">
        <p className="section-title">Quick Reference</p>
        <ul>
          {level.referenceCommands.map((command) => (
            <li key={command}>
              <code>{command}</code>
            </li>
          ))}
        </ul>
      </div>

      <div className="hints">
        <p className="section-title">Hint</p>
        {currentHint ? (
          <p>{currentHint}</p>
        ) : revealedHints.length > 0 ? (
          <p>{revealedHints[revealedHints.length - 1]}</p>
        ) : (
          <p className="muted">Type `hint` in the console.</p>
        )}
      </div>

      <div className="hint-row">
        <button className="secondary" type="button" onClick={resetLevel}>
          Reset level
        </button>
        {isComplete && hasNextLevel ? (
          <button type="button" onClick={advanceLevel}>
            Sail to the next chapter
          </button>
        ) : null}
      </div>
    </section>
  )
}
