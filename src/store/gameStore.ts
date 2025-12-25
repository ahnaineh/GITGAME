import { create } from 'zustand'
import { executeCommand } from '../game/commands'
import { getLevelById, levels } from '../game/levels'
import { cloneRepoState } from '../game/simulator'
import { GameState, Level, TerminalLine } from '../game/types'

type GameActions = {
  runCommand: (input: string) => void
  resetLevel: () => void
  advanceLevel: () => void
  selectLevel: (levelId: number) => void
  createFile: (name: string, content: string) => void
  updateFile: (name: string, content: string) => void
  setView: (view: 'game' | 'map') => void
}

let lineCounter = 1

const makeLine = (type: TerminalLine['type'], text: string): TerminalLine => ({
  id: lineCounter++,
  type,
  text
})

const buildInitialOutput = (level: Level, header?: string): TerminalLine[] => {
  lineCounter = 1
  const lines: TerminalLine[] = []
  if (header) {
    lines.push(makeLine('system', header))
  }
  lines.push(makeLine('system', `Mission: ${level.title}.`))
  level.story.slice(0, 2).forEach((line) => lines.push(makeLine('system', line)))
  lines.push(makeLine('system', 'Type help for commands or hint for guidance.'))
  return lines
}

const buildActions = (existing: string[], additions: string[]): string[] => {
  const next = new Set(existing)
  additions.forEach((action) => next.add(action))
  return Array.from(next)
}

const isLevelComplete = (levelId: number, snapshot: GameState): boolean => {
  const level = getLevelById(levelId)
  return level.objectives.every((objective) => objective.check(snapshot))
}

const getNextLevelId = (levelId: number): number | null => {
  const index = levels.findIndex((level) => level.id === levelId)
  if (index < 0 || index >= levels.length - 1) {
    return null
  }
  return levels[index + 1].id
}

export const useGameStore = create<GameState & GameActions>((set, get) => {
  const initialLevel = getLevelById(1)

  return {
    levelId: initialLevel.id,
    repo: cloneRepoState(initialLevel.initialRepo),
    output: buildInitialOutput(initialLevel),
    commandHistory: [],
    actions: [],
    hintIndex: 0,
    completedLevels: [],
    unlockedLevelIds: [initialLevel.id],
    view: 'game',
    runCommand: (input: string) => {
      const trimmed = input.trim()
      if (!trimmed) {
        return
      }

      const { levelId, repo, hintIndex, commandHistory, actions, completedLevels, unlockedLevelIds, view } = get()
      const level = getLevelById(levelId)

      if (trimmed === 'clear') {
        set({ output: [], commandHistory: [...commandHistory, trimmed] })
        return
      }

      const lines: TerminalLine[] = [makeLine('input', trimmed)]
      let nextRepo = repo
      let nextActions = actions
      let nextHintIndex = hintIndex
      let output: string[] = []

      if (trimmed === 'hint') {
        if (hintIndex >= level.hints.length) {
          output = ['No more hints for this level.']
        } else {
          output = [level.hints[hintIndex]]
          nextHintIndex = hintIndex + 1
        }
      } else {
        const result = executeCommand(trimmed, repo)
        output = result.output
        nextRepo = result.repo
        nextActions = buildActions(actions, result.actions)
      }

      output.forEach((text) => lines.push(makeLine('output', text)))

      const nextCommandHistory = [...commandHistory, trimmed]
      const snapshot: GameState = {
        levelId,
        repo: nextRepo,
        output: [],
        commandHistory: nextCommandHistory,
        actions: nextActions,
        hintIndex: nextHintIndex,
        completedLevels,
        unlockedLevelIds,
        view
      }
      let nextCompletedLevels = completedLevels
      let nextUnlockedLevelIds = unlockedLevelIds
      if (isLevelComplete(levelId, snapshot) && !completedLevels.includes(levelId)) {
        nextCompletedLevels = [...completedLevels, levelId]
        const nextLevelId = getNextLevelId(levelId)
        if (nextLevelId && !unlockedLevelIds.includes(nextLevelId)) {
          nextUnlockedLevelIds = [...unlockedLevelIds, nextLevelId]
        }
        lines.push(makeLine('system', `Level complete: ${level.title}.`))
        level.completion.forEach((entry) => lines.push(makeLine('system', entry)))
        lines.push(makeLine('system', `XP +${level.xpReward}`))
      }

      set({
        repo: nextRepo,
        output: [...get().output, ...lines],
        actions: nextActions,
        hintIndex: nextHintIndex,
        commandHistory: nextCommandHistory,
        completedLevels: nextCompletedLevels,
        unlockedLevelIds: nextUnlockedLevelIds
      })
    },
    resetLevel: () => {
      const level = getLevelById(get().levelId)
      set({
        repo: cloneRepoState(level.initialRepo),
        output: buildInitialOutput(level, `Returning to ${level.title}.`),
        commandHistory: [],
        actions: [],
        hintIndex: 0
      })
    },
    advanceLevel: () => {
      const { levelId, unlockedLevelIds } = get()
      const nextLevelId = getNextLevelId(levelId)
      if (!nextLevelId) {
        return
      }
      const nextLevel = getLevelById(nextLevelId)
      const nextUnlocked = unlockedLevelIds.includes(nextLevel.id)
        ? unlockedLevelIds
        : [...unlockedLevelIds, nextLevel.id]
      set({
        levelId: nextLevel.id,
        repo: cloneRepoState(nextLevel.initialRepo),
        output: buildInitialOutput(nextLevel, `Entering ${nextLevel.chapter}.`),
        commandHistory: [],
        actions: [],
        hintIndex: 0,
        unlockedLevelIds: nextUnlocked
      })
    },
    selectLevel: (levelId: number) => {
      const { unlockedLevelIds } = get()
      if (!unlockedLevelIds.includes(levelId)) {
        return
      }
      const targetLevel = getLevelById(levelId)
      set({
        levelId: targetLevel.id,
        repo: cloneRepoState(targetLevel.initialRepo),
        output: buildInitialOutput(targetLevel, `Entering ${targetLevel.chapter}.`),
        commandHistory: [],
        actions: [],
        hintIndex: 0,
        view: 'game'
      })
    },
    createFile: (name: string, content: string) => {
      const trimmedName = name.trim()
      if (!trimmedName) {
        return
      }
      const { repo, output, actions } = get()
      if (Object.prototype.hasOwnProperty.call(repo.workingTree, trimmedName)) {
        set({ output: [...output, makeLine('system', `File '${trimmedName}' already exists.`)] })
        return
      }
      const nextRepo = cloneRepoState(repo)
      nextRepo.workingTree[trimmedName] = content
      set({
        repo: nextRepo,
        output: [...output, makeLine('system', `Created ${trimmedName}.`)],
        actions: buildActions(actions, [`worktree:create:${trimmedName}`])
      })
    },
    updateFile: (name: string, content: string) => {
      const { repo, actions } = get()
      if (!Object.prototype.hasOwnProperty.call(repo.workingTree, name)) {
        return
      }
      const nextRepo = cloneRepoState(repo)
      nextRepo.workingTree[name] = content
      set({
        repo: nextRepo,
        actions: buildActions(actions, [`worktree:update:${name}`])
      })
    },
    setView: (view) => {
      set({ view })
    }
  }
})
