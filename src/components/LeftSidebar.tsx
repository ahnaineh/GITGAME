import { useState } from 'react'
import { achievements } from '../game/achievements'
import { getLevelById, levels } from '../game/levels'
import { countCompletedSteps, evaluateSteps } from '../game/progress'
import { useGameStore } from '../store/gameStore'

const padLevel = (index: number) => String(index + 1).padStart(2, '0')

export const LeftSidebar = () => {
  const levelId = useGameStore((state) => state.levelId)
  const repo = useGameStore((state) => state.repo)
  const actions = useGameStore((state) => state.actions)
  const commandHistory = useGameStore((state) => state.commandHistory)
  const earnedAchievements = useGameStore((state) => state.achievements)
  const completedLevels = useGameStore((state) => state.completedLevels)
  const unlockedLevelIds = useGameStore((state) => state.unlockedLevelIds)
  const selectLevel = useGameStore((state) => state.selectLevel)
  const setView = useGameStore((state) => state.setView)

  const currentLevel = getLevelById(levelId)
  const snapshot = { repo, actions, commandHistory }
  const currentSteps = evaluateSteps(currentLevel, snapshot)
  const completedCount = countCompletedSteps(currentSteps)
  const totalCount = currentSteps.length
  const xpPerStep = Math.max(1, Math.round(currentLevel.xpReward / totalCount))
  const xpFromCompleted = completedLevels.reduce((sum, id) => {
    const level = getLevelById(id)
    return sum + level.xpReward
  }, 0)
  const currentXp = xpFromCompleted + completedCount * xpPerStep
  const maxXp = xpFromCompleted + currentLevel.xpReward
  const xpPercent = Math.min(100, Math.round((currentXp / maxXp) * 100))
  const unlocked = achievements.filter((achievement) => earnedAchievements.includes(achievement.id))
  const [activeTab, setActiveTab] = useState<'momentum' | 'achievements' | 'progress'>('momentum')
  const totalLevels = levels.length
  const chapterLabel = currentLevel.chapter
  const commandsTyped = commandHistory.length

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

      <section className="panel tabs-panel">
        <div className="tab-list" role="tablist" aria-label="Player stats">
          <button
            className={`tab ${activeTab === 'momentum' ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'momentum'}
            onClick={() => setActiveTab('momentum')}
          >
            Momentum
          </button>
          <button
            className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'achievements'}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements
          </button>
          <button
            className={`tab ${activeTab === 'progress' ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'progress'}
            onClick={() => setActiveTab('progress')}
          >
            Progress
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'momentum' ? (
            <div className="tab-panel">
              <div className="panel-header compact">
                <h2>XP & Momentum</h2>
                <p className="subtitle">Earn XP by completing steps.</p>
              </div>
              <div className="xp-row">
                <p className="xp-value">{currentXp} XP</p>
                <p className="muted">{maxXp} XP</p>
              </div>
              <div
                className="xp-bar"
                role="progressbar"
                aria-valuenow={xpPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span className="xp-fill" style={{ width: `${xpPercent}%` }} />
              </div>
              <p className="muted">Step streak: {completedCount}/{totalCount}</p>
            </div>
          ) : null}

          {activeTab === 'achievements' ? (
            <div className="tab-panel">
              <div className="panel-header compact">
                <h2>Achievements</h2>
                <p className="subtitle">{unlocked.length}/{achievements.length} unlocked</p>
              </div>
              <div className="achievement-list">
                {achievements.map((achievement) => {
                  const isUnlocked = earnedAchievements.includes(achievement.id)
                  return (
                    <div key={achievement.id} className={`achievement ${isUnlocked ? 'unlocked' : 'locked'}`}>
                      <p className="achievement-title">{achievement.title}</p>
                      <p className="achievement-desc">{achievement.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}

          {activeTab === 'progress' ? (
            <div className="tab-panel">
              <div className="panel-header compact">
                <h2>Progress</h2>
                <p className="subtitle">{completedLevels.length}/{totalLevels} levels cleared</p>
              </div>
              <div className="progress-grid">
                <div>
                  <p className="progress-label">Current chapter</p>
                  <p className="progress-value">{chapterLabel}</p>
                </div>
                <div>
                  <p className="progress-label">Commands typed</p>
                  <p className="progress-value">{commandsTyped}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  )
}
