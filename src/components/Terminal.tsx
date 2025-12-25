import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { useGameStore } from '../store/gameStore'

export const Terminal = () => {
  const output = useGameStore((state) => state.output)
  const runCommand = useGameStore((state) => state.runCommand)
  const commandHistory = useGameStore((state) => state.commandHistory)
  const outputRef = useRef<HTMLDivElement | null>(null)
  const [input, setInput] = useState('')
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!input.trim()) {
      return
    }
    runCommand(input)
    setInput('')
    setHistoryIndex(-1)
    setDraft('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (commandHistory.length === 0) {
        return
      }
      if (historyIndex === -1) {
        setDraft(input)
      }
      const nextIndex = historyIndex < 0 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(nextIndex)
      setInput(commandHistory[nextIndex] ?? '')
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (commandHistory.length === 0) {
        return
      }
      const nextIndex = historyIndex + 1
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1)
        setInput(draft)
        return
      }
      setHistoryIndex(nextIndex)
      setInput(commandHistory[nextIndex] ?? '')
    }
  }

  return (
    <section className="panel terminal-panel">
      <div className="panel-header compact">
        <h2>Command Console</h2>
        <p className="subtitle">Type a git command and press Enter</p>
      </div>

      <div className="terminal-output" ref={outputRef} aria-live="polite">
        {output.map((line) => (
          <div key={line.id} className={`line ${line.type}`}>
            {line.type === 'input' ? <span className="prompt">›</span> : null}
            <span>{line.text}</span>
          </div>
        ))}
      </div>

      <form className="terminal-input" onSubmit={handleSubmit}>
        <span className="prompt" aria-hidden="true">
          ›
        </span>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a git command..."
          spellCheck={false}
          autoComplete="off"
          aria-label="Command line"
        />
        <button type="submit">Send</button>
      </form>
    </section>
  )
}
