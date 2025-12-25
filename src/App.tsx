import { motion } from 'framer-motion'
import './App.css'
import { CommitTree } from './components/CommitTree'
import { LeftSidebar } from './components/LeftSidebar'
import { LevelMap } from './components/LevelMap'
import { StoryPanel } from './components/StoryPanel'
import { Terminal } from './components/Terminal'
import { WorkingDirectoryPanel } from './components/WorkingDirectoryPanel'
import { useGameStore } from './store/gameStore'

function App() {
  const view = useGameStore((state) => state.view)

  return (
    <div className="app">
      <motion.div
        className={`shell ${view === 'map' ? 'map-view' : ''}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <aside className="sidebar left">
          <LeftSidebar />
        </aside>
        <main className="main-area">
          {view === 'map' ? (
            <LevelMap />
          ) : (
            <div className="game-area">
              <div className="game-grid">
                <WorkingDirectoryPanel />
                <CommitTree />
              </div>
              <Terminal />
            </div>
          )}
        </main>
        {view === 'game' ? (
          <aside className="sidebar right">
            <StoryPanel />
          </aside>
        ) : null}
      </motion.div>
    </div>
  )
}

export default App
