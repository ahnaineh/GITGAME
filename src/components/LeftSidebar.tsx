import { getLevelById, levels } from '../game/levels'
import { useGameStore } from '../store/gameStore'

const padLevel = (index: number) => String(index + 1).padStart(2, '0')

export const LeftSidebar = () => {
  const levelId = useGameStore((state) => state.levelId)
  const repo = useGameStore((state) => state.repo)
  const actions = useGameStore((state) => state.actions)
  const commandHistory = useGameStore((state) => state.commandHistory)
  const completedLevels = useGameStore((state) => state.completedLevels)
  const unlockedLevelIds = useGameStore((state) => state.unlockedLevelIds)
  const selectLevel = useGameStore((state) => state.selectLevel)
  const setView = useGameStore((state) => state.setView)

  const currentLevel = getLevelById(levelId)
  const snapshot = { repo, actions, commandHistory }
  const currentObjectives = currentLevel.objectives.map((objective) => ({
    ...objective,
    done: objective.check(snapshot)
  }))
  const completedCount = currentObjectives.filter((objective) => objective.done).length
  const totalCount = currentObjectives.length
  const xpPerObjective = Math.max(1, Math.round(currentLevel.xpReward / totalCount))
  const xpFromCompleted = completedLevels.reduce((sum, id) => {
    const level = getLevelById(id)
    return sum + level.xpReward
  }, 0)
  const currentXp = xpFromCompleted + completedCount * xpPerObjective
  const maxXp = xpFromCompleted + currentLevel.xpReward
  const xpPercent = Math.min(100, Math.round((currentXp / maxXp) * 100))

  return (
    <>
      <section className="panel nav-panel">
        <div className="brand-block">
          <p className="eyebrow">Gitgame</p>
          <h1 className="brand">Islands & Currents</h1>
          <p className="muted">Timeline Restoration Corps</p>
          <button className="secondary map-button" type="button" onClick={() => setView('map')}>
            Map
          </button>
        </div>

        <div className="nav-section">
          <p className="section-title">Levels</p>
          <div className="level-list">
            {levels.map((level, index) => {
              const isCurrent = level.id === levelId
              const isUnlocked = unlockedLevelIds.includes(level.id)
              const isComplete = completedLevels.includes(level.id) || (isCurrent && completedCount === totalCount)
              const status = isComplete
                ? 'complete'
                : isCurrent
                  ? 'active'
                  : isUnlocked
                    ? 'open'
                    : 'locked'
              const statusLabel = isComplete ? 'Done' : isCurrent ? 'Active' : isUnlocked ? 'Open' : 'Locked'

              return (
                <button
                  key={level.id}
                  type="button"
                  className={`level-item ${status} ${isCurrent ? 'current' : ''}`}
                  onClick={() => selectLevel(level.id)}
                  disabled={!isUnlocked}
                >
                  <span className="level-index">{padLevel(index)}</span>
                  <span className="level-meta">
                    <span className="level-title">{level.title}</span>
                    <span className="level-chapter">{level.chapter}</span>
                  </span>
                  <span className={`level-state ${status}`}>{statusLabel}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="panel xp-panel">
        <div className="panel-header compact">
          <h2>XP & Momentum</h2>
          <p className="subtitle">Earn XP by completing objectives.</p>
        </div>
        <div className="xp-row">
          <p className="xp-value">{currentXp} XP</p>
          <p className="muted">{maxXp} XP</p>
        </div>
        <div className="xp-bar" role="progressbar" aria-valuenow={xpPercent} aria-valuemin={0} aria-valuemax={100}>
          <span className="xp-fill" style={{ width: `${xpPercent}%` }} />
        </div>
        <p className="muted">Objective streak: {completedCount}/{totalCount}</p>
      </section>

    </>
  )
}
