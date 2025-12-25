import { levels } from '../game/levels'
import { useGameStore } from '../store/gameStore'

const groupByChapter = () => {
  const groups: Record<string, typeof levels> = {}
  levels.forEach((level) => {
    if (!groups[level.chapter]) {
      groups[level.chapter] = []
    }
    groups[level.chapter].push(level)
  })
  return groups
}

export const LevelMap = () => {
  const levelId = useGameStore((state) => state.levelId)
  const unlockedLevelIds = useGameStore((state) => state.unlockedLevelIds)
  const completedLevels = useGameStore((state) => state.completedLevels)
  const selectLevel = useGameStore((state) => state.selectLevel)
  const setView = useGameStore((state) => state.setView)

  const chapters = groupByChapter()

  return (
    <section className="panel map-panel">
      <div className="map-header">
        <div>
          <p className="eyebrow">Map</p>
          <h2>Chronicle Isles</h2>
          <p className="subtitle">Select a destination to continue your voyage.</p>
        </div>
        <button type="button" onClick={() => setView('game')}>
          Return to Mission
        </button>
      </div>

      <div className="map-grid">
        {Object.entries(chapters).map(([chapter, chapterLevels]) => (
          <div key={chapter} className="map-chapter">
            <p className="chapter-title">{chapter}</p>
            <div className="map-nodes">
              {chapterLevels.map((level) => {
                const isUnlocked = unlockedLevelIds.includes(level.id)
                const isCompleted = completedLevels.includes(level.id)
                const isCurrent = levelId === level.id
                const status = isCompleted ? 'complete' : isCurrent ? 'active' : isUnlocked ? 'open' : 'locked'
                return (
                  <button
                    key={level.id}
                    type="button"
                    className={`map-node ${status}`}
                    onClick={() => selectLevel(level.id)}
                    disabled={!isUnlocked}
                  >
                    <span className="map-index">{String(level.id).padStart(2, '0')}</span>
                    <span className="map-title">{level.title}</span>
                    <span className="map-status">{status}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
