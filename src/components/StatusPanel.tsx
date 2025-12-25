import { getStatusSummary, getHeadCommit } from '../game/simulator'
import { useGameStore } from '../store/gameStore'

export const StatusPanel = () => {
  const repo = useGameStore((state) => state.repo)
  const headCommit = getHeadCommit(repo)
  const status = getStatusSummary(repo)
  const branch = repo.headRef ?? 'main'

  return (
    <section className="panel status-panel">
      <div className="panel-header compact">
        <h2>Working Waters</h2>
        <p className="subtitle">Repo status snapshot</p>
      </div>

      <div className="status-grid">
        <div>
          <p className="label">Branch</p>
          <p className="value">{repo.isInitialized ? branch : 'Uninitialized'}</p>
        </div>
        <div>
          <p className="label">HEAD</p>
          <p className="value">{headCommit?.id ?? 'No commits yet'}</p>
        </div>
      </div>

      <div className="status-block">
        <p className="section-title">Conflicts</p>
        <ul>
          {status.conflicts.length > 0 ? (
            status.conflicts.map((file) => <li key={`conflict-${file}`}>Conflict: {file}</li>)
          ) : (
            <li className="muted">No conflicts</li>
          )}
        </ul>
      </div>

      <div className="status-block">
        <p className="section-title">Staged</p>
        <ul>
          {status.staged.length > 0 ? (
            status.staged.map((file) => <li key={file}>{file}</li>)
          ) : (
            <li className="muted">Nothing staged</li>
          )}
        </ul>
      </div>

      <div className="status-block">
        <p className="section-title">Working Directory</p>
        <ul>
          {status.modified.map((file) => (
            <li key={`modified-${file}`}>Modified: {file}</li>
          ))}
          {status.untracked.map((file) => (
            <li key={`untracked-${file}`}>Untracked: {file}</li>
          ))}
          {status.clean.length > 0 && status.modified.length === 0 && status.untracked.length === 0 ? (
            status.clean.map((file) => <li key={`clean-${file}`}>Clean: {file}</li>)
          ) : null}
          {status.modified.length === 0 && status.untracked.length === 0 && status.clean.length === 0 ? (
            <li className="muted">No files yet</li>
          ) : null}
        </ul>
      </div>
    </section>
  )
}
