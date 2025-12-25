import { useEffect, useMemo, useState } from 'react'
import { getStatusSummary } from '../game/simulator'
import { useGameStore } from '../store/gameStore'

export const WorkingDirectoryPanel = () => {
  const repo = useGameStore((state) => state.repo)
  const createFile = useGameStore((state) => state.createFile)
  const updateFile = useGameStore((state) => state.updateFile)

  const status = getStatusSummary(repo)
  const files = useMemo(
    () =>
      Array.from(
        new Set([...status.staged, ...status.modified, ...status.untracked, ...status.clean])
      ).sort(),
    [status]
  )
  const [selectedFile, setSelectedFile] = useState<string | null>(files[0] ?? null)
  const [showCreate, setShowCreate] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileContent, setNewFileContent] = useState('')

  useEffect(() => {
    if (files.length === 0) {
      setSelectedFile(null)
      return
    }
    if (!selectedFile || !files.includes(selectedFile)) {
      setSelectedFile(files[0])
    }
  }, [files, selectedFile])

  const handleCreate = () => {
    const trimmedName = newFileName.trim()
    if (!trimmedName) {
      return
    }
    createFile(trimmedName, newFileContent)
    setSelectedFile(trimmedName)
    setNewFileName('')
    setNewFileContent('')
    setShowCreate(false)
  }

  return (
    <section className="panel workdir-panel">
      <div className="panel-header compact">
        <h2>Working Directory</h2>
        <p className="subtitle">Track file states before you commit</p>
      </div>

      <div className="workdir-body">
        <div className="workdir-sections">
          <div className="status-section">
            <div className="status-header">
              <p className="section-title">Conflicts</p>
              <span className="status-count">{status.conflicts.length}</span>
            </div>
            <ul className="status-list conflicts">
              {status.conflicts.length > 0 ? (
                status.conflicts.map((file) => (
                  <li key={`conflict-${file}`}>
                    <button
                      type="button"
                      className={`status-item ${selectedFile === file ? 'active' : ''}`}
                      onClick={() => setSelectedFile(file)}
                    >
                      {file}
                    </button>
                  </li>
                ))
              ) : (
                <li className="muted">No conflicts.</li>
              )}
            </ul>
          </div>

          <div className="status-section">
            <div className="status-header">
              <p className="section-title">Staged</p>
              <span className="status-count">{status.staged.length}</span>
            </div>
            <ul className="status-list staged">
              {status.staged.length > 0 ? (
                status.staged.map((file) => (
                  <li key={`staged-${file}`}>
                    <button
                      type="button"
                      className={`status-item ${selectedFile === file ? 'active' : ''}`}
                      onClick={() => setSelectedFile(file)}
                    >
                      {file}
                    </button>
                  </li>
                ))
              ) : (
                <li className="muted">Nothing staged.</li>
              )}
            </ul>
          </div>

          <div className="status-section">
            <div className="status-header">
              <p className="section-title">Modified</p>
              <span className="status-count">{status.modified.length}</span>
            </div>
            <ul className="status-list modified">
              {status.modified.length > 0 ? (
                status.modified.map((file) => (
                  <li key={`modified-${file}`}>
                    <button
                      type="button"
                      className={`status-item ${selectedFile === file ? 'active' : ''}`}
                      onClick={() => setSelectedFile(file)}
                    >
                      {file}
                    </button>
                  </li>
                ))
              ) : (
                <li className="muted">No modified files.</li>
              )}
            </ul>
          </div>

          <div className="status-section">
            <div className="status-header">
              <p className="section-title">Untracked</p>
              <span className="status-count">{status.untracked.length}</span>
            </div>
            <ul className="status-list untracked">
              {status.untracked.length > 0 ? (
                status.untracked.map((file) => (
                  <li key={`untracked-${file}`}>
                    <button
                      type="button"
                      className={`status-item ${selectedFile === file ? 'active' : ''}`}
                      onClick={() => setSelectedFile(file)}
                    >
                      {file}
                    </button>
                  </li>
                ))
              ) : (
                <li className="muted">No untracked files.</li>
              )}
            </ul>
          </div>

          <div className="status-section">
            <div className="status-header">
              <p className="section-title">Clean</p>
              <span className="status-count">{status.clean.length}</span>
            </div>
            <ul className="status-list clean">
              {status.clean.length > 0 ? (
                status.clean.map((file) => (
                  <li key={`clean-${file}`}>
                    <button
                      type="button"
                      className={`status-item ${selectedFile === file ? 'active' : ''}`}
                      onClick={() => setSelectedFile(file)}
                    >
                      {file}
                    </button>
                  </li>
                ))
              ) : (
                <li className="muted">No clean files.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="file-editor">
          <p className="section-title">Preview</p>
          {selectedFile ? (
            <div className="editor-stack">
              <p className="editor-title">Editing {selectedFile}</p>
              <textarea
                className="field editor"
                value={repo.workingTree[selectedFile] ?? ''}
                onChange={(event) => updateFile(selectedFile, event.target.value)}
                spellCheck={false}
                aria-label={`Edit ${selectedFile}`}
              />
            </div>
          ) : (
            <p className="muted">Select a file to view or edit.</p>
          )}
        </div>
      </div>

      <div className="new-file">
        <div className="new-file-header">
          <p className="section-title">New File</p>
          <button
            className="secondary"
            type="button"
            onClick={() => setShowCreate((current) => !current)}
          >
            {showCreate ? 'Hide form' : '+ New file'}
          </button>
        </div>
        {showCreate ? (
          <>
            <div className="new-file-row">
              <input
                className="field"
                value={newFileName}
                onChange={(event) => setNewFileName(event.target.value)}
                placeholder="logbook.md"
                spellCheck={false}
                aria-label="New file name"
              />
              <button type="button" onClick={handleCreate}>
                Add file
              </button>
            </div>
            <textarea
              className="field"
              value={newFileContent}
              onChange={(event) => setNewFileContent(event.target.value)}
              placeholder="Optional starter text..."
              rows={4}
              aria-label="New file contents"
            />
          </>
        ) : null}
      </div>
    </section>
  )
}
