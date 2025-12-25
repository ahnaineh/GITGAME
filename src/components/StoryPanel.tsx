import { motion } from 'framer-motion'
import { getLevelById, levels } from '../game/levels'
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
  const objectives = level.objectives.map((objective) => ({
    ...objective,
    done: objective.check(snapshot)
  }))
  const completedCount = objectives.filter((objective) => objective.done).length
  const isComplete = completedCount === objectives.length
  const levelIndex = levels.findIndex((entry) => entry.id === level.id)
  const hasNextLevel = levelIndex >= 0 && levelIndex < levels.length - 1
  const revealedHints = level.hints.slice(0, hintIndex)
  const currentHint = hintIndex > 0 ? level.hints[hintIndex - 1] : null
  const nextObjectiveIndex = objectives.findIndex((objective) => !objective.done)
  const nextObjective = nextObjectiveIndex >= 0 ? objectives[nextObjectiveIndex] : null
  const nextCommand =
    nextObjectiveIndex >= 0 ? level.suggestedCommands[nextObjectiveIndex] ?? null : null
  const showCommand = nextCommand && nextCommand.startsWith('git ') ? nextCommand : null

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
        <p className="progress">Objectives {completedCount}/{objectives.length}</p>
      </motion.div>

      <div className="story-lines">
        {level.story.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p className="callout">Type commands in the Command Console to progress.</p>
      </div>

      <div className="objective-list">
        <p className="section-title">Objectives</p>
        <ul>
          {objectives.map((objective) => (
            <li key={objective.id} className={objective.done ? 'done' : ''}>
              <span className="marker" aria-hidden="true">
                {objective.done ? '◆' : '◇'}
              </span>
              {objective.text}
            </li>
          ))}
        </ul>
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
        {nextObjective ? (
          <p>{nextObjective.text}</p>
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
