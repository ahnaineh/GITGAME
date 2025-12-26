import { getCommandHelp } from '../game/commandHelp'
import { getLevelById } from '../game/levels'
import { evaluateSteps, findNextStepIndex } from '../game/progress'
import { useGameStore } from '../store/gameStore'

export const CommandCoach = () => {
  const levelId = useGameStore((state) => state.levelId)
  const repo = useGameStore((state) => state.repo)
  const actions = useGameStore((state) => state.actions)
  const commandHistory = useGameStore((state) => state.commandHistory)
  const explainedCommands = useGameStore((state) => state.explainedCommands)
  const dismissedCommandHelp = useGameStore((state) => state.dismissedCommandHelp)
  const dismissCommandHelp = useGameStore((state) => state.dismissCommandHelp)

  const level = getLevelById(levelId)
  const snapshot = { repo, actions, commandHistory }
  const steps = evaluateSteps(level, snapshot)
  const nextStepIndex = findNextStepIndex(steps)
  const nextCommand = nextStepIndex >= 0 ? level.suggestedCommands[nextStepIndex] ?? null : null
  const commandKey = nextCommand && nextCommand.startsWith('git ') ? nextCommand.split(' ')[1] ?? null : null
  const help = getCommandHelp(commandKey)

  if (!help || !commandKey) {
    return null
  }

  if (explainedCommands.includes(commandKey) || dismissedCommandHelp.includes(commandKey)) {
    return null
  }

  return (
    <div className="command-overlay" role="dialog" aria-modal="true" aria-label={`About git ${commandKey}`}>
      <div className="command-banner">
        <p className="banner-eyebrow">Before you run</p>
        <h3>git {commandKey}</h3>
        <p className="banner-desc">{help.description}</p>
        {help.example ? <code className="banner-code">{help.example}</code> : null}
        <div className="banner-actions">
          <button type="button" onClick={() => dismissCommandHelp(commandKey)}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
