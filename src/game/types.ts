export type Commit = {
  id: string
  message: string
  tree: Record<string, string>
  timestamp: number
  parents: string[]
}

export type MergeConflict = {
  base?: string
  ours?: string
  theirs?: string
}

export type MergeState = {
  inProgress: boolean
  target: string | null
  targetBranch: string | null
}

export type RemoteState = {
  branches: Record<string, string | null>
  commits: Commit[]
}

export type RepoState = {
  isInitialized: boolean
  branches: Record<string, string | null>
  headRef: string | null
  head: string | null
  commits: Commit[]
  workingTree: Record<string, string>
  index: Record<string, string>
  conflicts: Record<string, MergeConflict>
  merge: MergeState
  remote: RemoteState
}

export type GameSnapshot = {
  repo: RepoState
  actions: string[]
  commandHistory: string[]
}

export type Step = {
  id: string
  text: string
  success?: string
  check: (state: GameSnapshot) => boolean
}

export type Level = {
  id: number
  title: string
  chapter: string
  story: string[]
  completion: string[]
  steps: Step[]
  hints: string[]
  suggestedCommands: string[]
  referenceCommands: string[]
  xpReward: number
  initialRepo: RepoState
}

export type TerminalLine = {
  id: number
  type: 'input' | 'output' | 'system'
  text: string
}

export type GameState = GameSnapshot & {
  levelId: number
  output: TerminalLine[]
  hintIndex: number
  achievements: string[]
  explainedCommands: string[]
  dismissedCommandHelp: string[]
  completedLevels: number[]
  unlockedLevelIds: number[]
  view: 'game' | 'map'
}

export type CommandResult = {
  ok: boolean
  output: string[]
  repo: RepoState
  actions: string[]
}
