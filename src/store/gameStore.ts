import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { executeCommand } from '../game/commands'
import { achievements } from '../game/achievements'
import { getLevelById, levels } from '../game/levels'
import { evaluateSteps } from '../game/progress'
import { cloneRepoState } from '../game/simulator'
import { GameState, TerminalLine } from '../game/types'

type GameActions = {
  runCommand: (input: string) => void
  resetLevel: () => void
  advanceLevel: () => void
  selectLevel: (levelId: number) => void
  createFile: (name: string, content: string) => void
  updateFile: (name: string, content: string) => void
  setView: (view: 'game' | 'map') => void
  dismissCommandHelp: (command: string) => void
}

let lineCounter = 1

const makeLine = (type: TerminalLine['type'], text: string): TerminalLine => ({
  id: lineCounter++,
  type,
  text
})

const syncLineCounter = (state?: GameState) => {
  if (!state?.output || state.output.length === 0) {
    lineCounter = 1
    return
  }
  const maxId = state.output.reduce((max, line) => Math.max(max, line.id), 0)
  lineCounter = maxId + 1
}

const buildInitialOutput = (): TerminalLine[] => {
  lineCounter = 1
  return []
}

const buildActions = (existing: string[], additions: string[]): string[] => {
  const next = new Set(existing)
  additions.forEach((action) => next.add(action))
  return Array.from(next)
}

const isLevelComplete = (levelId: number, snapshot: GameState): boolean => {
  const level = getLevelById(levelId)
  return evaluateSteps(level, snapshot).every((step) => step.done)
}

const getNextLevelId = (levelId: number): number | null => {
  const index = levels.findIndex((level) => level.id === levelId)
  if (index < 0 || index >= levels.length - 1) {
    return null
  }
  return levels[index + 1].id
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => {
      const initialLevel = getLevelById(1)

      return {
        levelId: initialLevel.id,
        repo: cloneRepoState(initialLevel.initialRepo),
        output: buildInitialOutput(),
        commandHistory: [],
        actions: [],
        hintIndex: 0,
        achievements: [],
        explainedCommands: [],
        dismissedCommandHelp: [],
        completedLevels: [],
        unlockedLevelIds: [initialLevel.id],
        view: 'game',
        runCommand: (input: string) => {
          const trimmed = input.trim()
          if (!trimmed) {
            return
          }

          const {
            levelId,
            repo,
            hintIndex,
            commandHistory,
            actions,
            achievements: earnedAchievements,
            explainedCommands,
            dismissedCommandHelp,
            completedLevels,
            unlockedLevelIds,
            view
          } = get()
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
          let commandOk = false
          let commandKey: string | null = null

          if (trimmed === 'hint') {
            if (hintIndex >= level.hints.length) {
              output = ['No more hints for this level.']
            } else {
              output = [level.hints[hintIndex]]
              nextHintIndex = hintIndex + 1
            }
          } else {
            const result = executeCommand(trimmed, repo)
            commandOk = result.ok
            output = result.output
            nextRepo = result.repo
            nextActions = buildActions(actions, result.actions)
            const parts = trimmed.split(/\s+/)
            if (parts[0] === 'git') {
              commandKey = parts[1] ?? null
            }
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
            achievements: earnedAchievements,
            explainedCommands,
            dismissedCommandHelp,
            completedLevels,
            unlockedLevelIds,
            view
          }
          let nextExplainedCommands = explainedCommands
          if (commandOk && commandKey && !explainedCommands.includes(commandKey)) {
            nextExplainedCommands = [...explainedCommands, commandKey]
          }
          let nextCompletedLevels = completedLevels
          let nextUnlockedLevelIds = unlockedLevelIds
          let nextAchievements = earnedAchievements
          const unlockedAchievements = achievements.filter(
            (achievement) => achievement.check(snapshot) && !earnedAchievements.includes(achievement.id)
          )
          if (unlockedAchievements.length > 0) {
            nextAchievements = [...earnedAchievements, ...unlockedAchievements.map((achievement) => achievement.id)]
          }
          if (isLevelComplete(levelId, snapshot) && !completedLevels.includes(levelId)) {
            nextCompletedLevels = [...completedLevels, levelId]
            const nextLevelId = getNextLevelId(levelId)
            if (nextLevelId && !unlockedLevelIds.includes(nextLevelId)) {
              nextUnlockedLevelIds = [...unlockedLevelIds, nextLevelId]
            }
          }

          set({
            repo: nextRepo,
            output: [...get().output, ...lines],
            actions: nextActions,
            hintIndex: nextHintIndex,
            commandHistory: nextCommandHistory,
            achievements: nextAchievements,
            explainedCommands: nextExplainedCommands,
            completedLevels: nextCompletedLevels,
            unlockedLevelIds: nextUnlockedLevelIds
          })
        },
        resetLevel: () => {
          const level = getLevelById(get().levelId)
          set({
            repo: cloneRepoState(level.initialRepo),
            output: buildInitialOutput(),
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
            output: buildInitialOutput(),
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
            output: buildInitialOutput(),
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
          const { repo, actions } = get()
          if (Object.prototype.hasOwnProperty.call(repo.workingTree, trimmedName)) {
            return
          }
          const nextRepo = cloneRepoState(repo)
          nextRepo.workingTree[trimmedName] = content
          set({
            repo: nextRepo,
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
        },
        dismissCommandHelp: (command) => {
          const { dismissedCommandHelp } = get()
          if (dismissedCommandHelp.includes(command)) {
            return
          }
          set({ dismissedCommandHelp: [...dismissedCommandHelp, command] })
        }
      }
    },
    {
      name: 'gitgame-state',
      version: 2,
      partialize: (state) => ({
        levelId: state.levelId,
        repo: state.repo,
        output: state.output,
        commandHistory: state.commandHistory,
        actions: state.actions,
        hintIndex: state.hintIndex,
        achievements: state.achievements,
        explainedCommands: state.explainedCommands,
        dismissedCommandHelp: state.dismissedCommandHelp,
        completedLevels: state.completedLevels,
        unlockedLevelIds: state.unlockedLevelIds,
        view: state.view
      }),
      migrate: (state) => {
        if (!state || typeof state !== 'object') {
          return state
        }
        const persisted = state as GameState & { repo?: { staging?: string[]; index?: Record<string, string> } }
        if (persisted.repo && !persisted.repo.index) {
          const staging = Array.isArray(persisted.repo.staging) ? persisted.repo.staging : []
          const index: Record<string, string> = {}
          staging.forEach((file) => {
            const content = persisted.repo?.workingTree?.[file]
            if (typeof content === 'string') {
              index[file] = content
            }
          })
          persisted.repo.index = index
        }
        if (!Array.isArray(persisted.explainedCommands)) {
          persisted.explainedCommands = []
        }
        if (!Array.isArray(persisted.dismissedCommandHelp)) {
          persisted.dismissedCommandHelp = []
        }
        return persisted
      },
      onRehydrateStorage: () => (state) => {
        syncLineCounter(state)
      }
    }
  )
)
