import { Commit, RepoState } from './types'

export type StatusSummary = {
  staged: string[]
  modified: string[]
  untracked: string[]
  clean: string[]
  conflicts: string[]
}

export const cloneRepoState = (repo: RepoState): RepoState => {
  if (typeof structuredClone === 'function') {
    return structuredClone(repo)
  }
  return JSON.parse(JSON.stringify(repo)) as RepoState
}

export const getHeadCommit = (repo: RepoState): Commit | null => {
  if (!repo.head) {
    return null
  }
  return repo.commits.find((commit) => commit.id === repo.head) ?? null
}

export const formatCommitId = (index: number): string => {
  return `c${index.toString().padStart(3, '0')}`
}

export const getStatusSummary = (repo: RepoState): StatusSummary => {
  const headCommit = getHeadCommit(repo)
  const headTree = headCommit?.tree ?? {}
  const conflictSet = new Set(Object.keys(repo.conflicts))
  const indexFiles = Object.keys(repo.index)
  const allFiles = new Set([
    ...Object.keys(headTree),
    ...Object.keys(repo.workingTree),
    ...indexFiles
  ])

  const summary: StatusSummary = {
    staged: [],
    modified: [],
    untracked: [],
    clean: [],
    conflicts: []
  }

  allFiles.forEach((file) => {
    if (conflictSet.has(file)) {
      summary.conflicts.push(file)
      return
    }
    const headValue = headTree[file]
    const workHasFile = Object.prototype.hasOwnProperty.call(repo.workingTree, file)
    const workValue = repo.workingTree[file]
    const indexHasFile = Object.prototype.hasOwnProperty.call(repo.index, file)
    const indexValue = repo.index[file]

    if (!Object.prototype.hasOwnProperty.call(headTree, file) && !indexHasFile && workHasFile) {
      summary.untracked.push(file)
      return
    }

    const stagedChanged = indexHasFile && indexValue !== headValue
    if (stagedChanged) {
      summary.staged.push(file)
    }

    const compareBase = indexHasFile ? indexValue : headValue
    const unstagedChanged = workHasFile && compareBase !== undefined && workValue !== compareBase
    if (unstagedChanged) {
      summary.modified.push(file)
    }

    if (!stagedChanged && !unstagedChanged && workHasFile && headValue !== undefined) {
      summary.clean.push(file)
    }
  })

  return summary
}

export const buildStatusOutput = (repo: RepoState): string[] => {
  if (!repo.isInitialized) {
    return ['fatal: not a git repository. Run "git init" to begin.']
  }

  const output: string[] = []
  const headCommit = getHeadCommit(repo)
  const branchName = repo.headRef ?? 'main'
  output.push(`On branch ${branchName}`)
  if (repo.merge.inProgress) {
    output.push(`You are currently merging ${repo.merge.targetBranch ?? 'a branch'}.`)
  }

  if (!headCommit) {
    output.push('No commits yet.')
  }

  const summary = getStatusSummary(repo)
  const headTree = getHeadCommit(repo)?.tree ?? {}

  if (summary.conflicts.length > 0) {
    output.push('Unmerged paths:')
    summary.conflicts.forEach((file) => {
      output.push(`  both modified: ${file}`)
    })
  }

  if (summary.staged.length > 0) {
    output.push('Changes to be committed:')
    summary.staged.forEach((file) => {
      const isNew = !Object.prototype.hasOwnProperty.call(headTree, file)
      output.push(`  ${isNew ? 'new file' : 'modified'}: ${file}`)
    })
  }

  if (summary.modified.length > 0) {
    output.push('Changes not staged for commit:')
    summary.modified.forEach((file) => {
      output.push(`  modified: ${file}`)
    })
  }

  if (summary.untracked.length > 0) {
    output.push('Untracked files:')
    summary.untracked.forEach((file) => {
      output.push(`  ${file}`)
    })
  }

  if (
    summary.conflicts.length === 0 &&
    summary.staged.length === 0 &&
    summary.modified.length === 0 &&
    summary.untracked.length === 0
  ) {
    output.push('nothing to commit, working tree clean')
  }

  return output
}

export const buildLogOutput = (repo: RepoState): string[] => {
  if (!repo.isInitialized) {
    return ['fatal: not a git repository. Run "git init" to begin.']
  }

  if (repo.commits.length === 0) {
    return ['No commits yet.']
  }

  return [...repo.commits]
    .reverse()
    .flatMap((commit) => [`commit ${commit.id}`, `    ${commit.message}`])
}

export const buildBranchOutput = (repo: RepoState): string[] => {
  if (!repo.isInitialized) {
    return ['fatal: not a git repository. Run "git init" to begin.']
  }

  return Object.keys(repo.branches).map((name) => {
    const prefix = repo.headRef === name ? '* ' : '  '
    return `${prefix}${name}`
  })
}

const getCommitById = (repo: RepoState, id: string | null): Commit | null => {
  if (!id) {
    return null
  }
  return repo.commits.find((commit) => commit.id === id) ?? null
}

const applyTreeDiff = (
  currentTree: Record<string, string>,
  baseTree: Record<string, string>,
  targetTree: Record<string, string>,
  reverse = false
): Record<string, string> => {
  const nextTree = { ...currentTree }
  const files = new Set([...Object.keys(baseTree), ...Object.keys(targetTree)])
  files.forEach((file) => {
    const baseValue = baseTree[file]
    const targetValue = targetTree[file]
    if (baseValue === targetValue) {
      return
    }
    if (reverse) {
      if (baseValue === undefined) {
        delete nextTree[file]
      } else {
        nextTree[file] = baseValue
      }
      return
    }
    if (targetValue === undefined) {
      delete nextTree[file]
    } else {
      nextTree[file] = targetValue
    }
  })
  return nextTree
}

const hasUncommittedChanges = (repo: RepoState): boolean => {
  const summary = getStatusSummary(repo)
  return summary.staged.length > 0 || summary.modified.length > 0 || summary.conflicts.length > 0
}

export const applyInit = (repo: RepoState): { repo: RepoState; output: string[]; actions: string[] } => {
  const nextRepo = cloneRepoState(repo)
  if (nextRepo.isInitialized) {
    return { repo: nextRepo, output: ['Repository already initialized.'], actions: [] }
  }

  nextRepo.isInitialized = true
  nextRepo.branches = { main: null }
  nextRepo.headRef = 'main'
  nextRepo.head = null
  nextRepo.index = {}
  nextRepo.conflicts = {}
  nextRepo.merge = { inProgress: false, target: null, targetBranch: null }
  nextRepo.remote = { branches: {}, commits: [] }

  return {
    repo: nextRepo,
    output: ['Initialized empty Git repository on branch main.'],
    actions: ['init']
  }
}

export const applyAdd = (
  repo: RepoState,
  files: string[]
): { repo: RepoState; output: string[]; actions: string[] } => {
  const nextRepo = cloneRepoState(repo)
  if (!nextRepo.isInitialized) {
    return {
      repo: nextRepo,
      output: ['fatal: not a git repository. Run "git init" to begin.'],
      actions: []
    }
  }

  if (files.length === 0) {
    return { repo: nextRepo, output: ['Nothing specified, nothing added.'], actions: [] }
  }

  const output: string[] = []
  const actions: string[] = []
  const workingFiles = Object.keys(nextRepo.workingTree)

  const targets = files.includes('.') ? workingFiles : files

  targets.forEach((file) => {
    if (!Object.prototype.hasOwnProperty.call(nextRepo.workingTree, file)) {
      output.push(`fatal: pathspec '${file}' did not match any files`)
      return
    }
    if (Object.prototype.hasOwnProperty.call(nextRepo.conflicts, file)) {
      delete nextRepo.conflicts[file]
      actions.push(`resolve:${file}`)
    }
    nextRepo.index[file] = nextRepo.workingTree[file]
    actions.push('add')
    actions.push(`add:${file}`)
  })

  return { repo: nextRepo, output, actions }
}

export const applyCommit = (
  repo: RepoState,
  message: string | null
): { repo: RepoState; output: string[]; actions: string[] } => {
  const nextRepo = cloneRepoState(repo)
  if (!nextRepo.isInitialized) {
    return {
      repo: nextRepo,
      output: ['fatal: not a git repository. Run "git init" to begin.'],
      actions: []
    }
  }

  if (!message) {
    return { repo: nextRepo, output: ['Aborting commit: message required.'], actions: [] }
  }

  if (nextRepo.merge.inProgress && Object.keys(nextRepo.conflicts).length > 0) {
    return {
      repo: nextRepo,
      output: ['Cannot commit while merge conflicts remain. Resolve and git add them.'],
      actions: []
    }
  }

  if (Object.keys(nextRepo.index).length === 0) {
    return { repo: nextRepo, output: ['No changes staged for commit.'], actions: [] }
  }

  const headCommit = getHeadCommit(nextRepo)
  const newTree = { ...(headCommit?.tree ?? {}) }
  Object.entries(nextRepo.index).forEach(([file, content]) => {
    newTree[file] = content
  })

  const parents: string[] = []
  if (nextRepo.head) {
    parents.push(nextRepo.head)
  }
  if (nextRepo.merge.inProgress && nextRepo.merge.target) {
    parents.push(nextRepo.merge.target)
  }

  const commit: Commit = {
    id: formatCommitId(nextRepo.commits.length + 1),
    message,
    tree: newTree,
    timestamp: Date.now(),
    parents
  }

  nextRepo.commits.push(commit)
  nextRepo.head = commit.id
  if (nextRepo.headRef) {
    nextRepo.branches[nextRepo.headRef] = commit.id
  }
  nextRepo.index = {}
  if (nextRepo.merge.inProgress) {
    nextRepo.merge = { inProgress: false, target: null, targetBranch: null }
    nextRepo.conflicts = {}
  }

  return {
    repo: nextRepo,
    output: [`[${nextRepo.headRef ?? 'main'} ${commit.id}] ${message}`],
    actions: ['commit']
  }
}

export const applyBranch = (
  repo: RepoState,
  name: string | null,
  force = false
): { repo: RepoState; output: string[]; actions: string[] } => {
  const nextRepo = cloneRepoState(repo)
  if (!nextRepo.isInitialized) {
    return {
      repo: nextRepo,
      output: ['fatal: not a git repository. Run "git init" to begin.'],
      actions: []
    }
  }

  if (!name) {
    return { repo: nextRepo, output: ['fatal: branch name required.'], actions: [] }
  }

  const exists = Object.prototype.hasOwnProperty.call(nextRepo.branches, name)
  if (exists && !force) {
    return { repo: nextRepo, output: [`fatal: A branch named '${name}' already exists.`], actions: [] }
  }

  nextRepo.branches[name] = nextRepo.head

  return {
    repo: nextRepo,
    output: [`Branch '${name}' created.`],
    actions: ['branch', `branch:${name}`]
  }
}

export const applySwitch = (
  repo: RepoState,
  name: string | null
): { repo: RepoState; output: string[]; actions: string[] } => {
  const nextRepo = cloneRepoState(repo)
  if (!nextRepo.isInitialized) {
    return {
      repo: nextRepo,
      output: ['fatal: not a git repository. Run "git init" to begin.'],
      actions: []
    }
  }

  if (!name) {
    return { repo: nextRepo, output: ['fatal: branch name required.'], actions: [] }
  }

  const exists = Object.prototype.hasOwnProperty.call(nextRepo.branches, name)
  if (!exists) {
    return { repo: nextRepo, output: [`fatal: invalid reference: ${name}`], actions: [] }
  }

  if (nextRepo.headRef === name) {
    return { repo: nextRepo, output: [`Already on '${name}'.`], actions: [] }
  }

  if (nextRepo.merge.inProgress || Object.keys(nextRepo.conflicts).length > 0) {
    return {
      repo: nextRepo,
      output: ['Cannot switch branches while a merge is in progress.'],
      actions: []
    }
  }

  if (hasUncommittedChanges(nextRepo)) {
    return {
      repo: nextRepo,
      output: ['Please commit or discard changes before switching branches.'],
      actions: []
    }
  }

  nextRepo.headRef = name
  const targetHead = nextRepo.branches[name]
  nextRepo.head = targetHead ?? null
  if (targetHead) {
    const commit = nextRepo.commits.find((item) => item.id === targetHead)
    if (commit) {
      nextRepo.workingTree = { ...commit.tree }
    }
  }
  nextRepo.index = {}

  return {
    repo: nextRepo,
    output: [`Switched to branch '${name}'.`],
    actions: ['switch', `switch:${name}`]
  }
}

export const applyReset = (
  repo: RepoState,
  targetId: string | null,
  hard = false
): { repo: RepoState; output: string[]; actions: string[] } => {
  const nextRepo = cloneRepoState(repo)
  if (!nextRepo.isInitialized) {
    return {
      repo: nextRepo,
      output: ['fatal: not a git repository. Run "git init" to begin.'],
      actions: []
    }
  }
  if (!targetId) {
    return { repo: nextRepo, output: ['fatal: commit id required.'], actions: [] }
  }
  if (!hard) {
    return { repo: nextRepo, output: ['Only --hard reset is supported.'], actions: [] }
  }
  const commit = getCommitById(nextRepo, targetId)
  if (!commit) {
    return { repo: nextRepo, output: [`fatal: unknown commit ${targetId}`], actions: [] }
  }
  nextRepo.head = commit.id
  if (nextRepo.headRef) {
    nextRepo.branches[nextRepo.headRef] = commit.id
  }
  nextRepo.workingTree = { ...commit.tree }
  nextRepo.index = {}
  nextRepo.conflicts = {}
  nextRepo.merge = { inProgress: false, target: null, targetBranch: null }

  return {
    repo: nextRepo,
    output: [`HEAD is now at ${commit.id} ${commit.message}`],
    actions: ['reset', `reset:${commit.id}`]
  }
}

export const applyCherryPick = (
  repo: RepoState,
  targetId: string | null
): { repo: RepoState; output: string[]; actions: string[] } => {
  const nextRepo = cloneRepoState(repo)
  if (!nextRepo.isInitialized) {
    return {
      repo: nextRepo,
      output: ['fatal: not a git repository. Run "git init" to begin.'],
      actions: []
    }
  }
  if (!targetId) {
    return { repo: nextRepo, output: ['fatal: commit id required.'], actions: [] }
  }
  if (hasUncommittedChanges(nextRepo)) {
    return {
      repo: nextRepo,
      output: ['Please commit or discard changes before cherry-picking.'],
      actions: []
    }
  }
  const targetCommit = getCommitById(nextRepo, targetId)
  if (!targetCommit) {
    return { repo: nextRepo, output: [`fatal: unknown commit ${targetId}`], actions: [] }
  }
  const baseCommit = getCommitById(nextRepo, targetCommit.parents[0] ?? null)
  const baseTree = baseCommit?.tree ?? {}
  const headCommit = getHeadCommit(nextRepo)
  const currentTree = headCommit?.tree ?? {}
  const newTree = applyTreeDiff(currentTree, baseTree, targetCommit.tree)

  const parents = nextRepo.head ? [nextRepo.head] : []
  const commit: Commit = {
    id: formatCommitId(nextRepo.commits.length + 1),
    message: `Cherry-pick: ${targetCommit.message}`,
    tree: newTree,
    timestamp: Date.now(),
    parents
  }

  nextRepo.commits.push(commit)
  nextRepo.head = commit.id
  if (nextRepo.headRef) {
    nextRepo.branches[nextRepo.headRef] = commit.id
  }
  nextRepo.workingTree = { ...newTree }
  nextRepo.index = {}

  return {
    repo: nextRepo,
    output: [`[${nextRepo.headRef ?? 'main'} ${commit.id}] ${commit.message}`],
    actions: ['cherry-pick', `cherry-pick:${targetCommit.id}`]
  }
}

export const applyRevert = (
  repo: RepoState,
  targetId: string | null
): { repo: RepoState; output: string[]; actions: string[] } => {
  const nextRepo = cloneRepoState(repo)
  if (!nextRepo.isInitialized) {
    return {
      repo: nextRepo,
      output: ['fatal: not a git repository. Run "git init" to begin.'],
      actions: []
    }
  }
  if (!targetId) {
    return { repo: nextRepo, output: ['fatal: commit id required.'], actions: [] }
  }
  if (hasUncommittedChanges(nextRepo)) {
    return {
      repo: nextRepo,
      output: ['Please commit or discard changes before reverting.'],
      actions: []
    }
  }
  const targetCommit = getCommitById(nextRepo, targetId)
  if (!targetCommit) {
    return { repo: nextRepo, output: [`fatal: unknown commit ${targetId}`], actions: [] }
  }
  const baseCommit = getCommitById(nextRepo, targetCommit.parents[0] ?? null)
  const baseTree = baseCommit?.tree ?? {}
  const headCommit = getHeadCommit(nextRepo)
  const currentTree = headCommit?.tree ?? {}
  const newTree = applyTreeDiff(currentTree, baseTree, targetCommit.tree, true)

  const parents = nextRepo.head ? [nextRepo.head] : []
  const commit: Commit = {
    id: formatCommitId(nextRepo.commits.length + 1),
    message: `Revert: ${targetCommit.message}`,
    tree: newTree,
    timestamp: Date.now(),
    parents
  }

  nextRepo.commits.push(commit)
  nextRepo.head = commit.id
  if (nextRepo.headRef) {
    nextRepo.branches[nextRepo.headRef] = commit.id
  }
  nextRepo.workingTree = { ...newTree }
  nextRepo.index = {}

  return {
    repo: nextRepo,
    output: [`[${nextRepo.headRef ?? 'main'} ${commit.id}] ${commit.message}`],
    actions: ['revert', `revert:${targetCommit.id}`]
  }
}

const getCommitMap = (commits: Commit[]): Map<string, Commit> => {
  const map = new Map<string, Commit>()
  commits.forEach((commit) => {
    map.set(commit.id, commit)
  })
  return map
}

const collectAncestors = (commitMap: Map<string, Commit>, startId: string | null): Set<string> => {
  const visited = new Set<string>()
  if (!startId) {
    return visited
  }
  const stack = [startId]
  while (stack.length > 0) {
    const id = stack.pop()
    if (!id || visited.has(id)) {
      continue
    }
    visited.add(id)
    const commit = commitMap.get(id)
    commit?.parents.forEach((parent) => stack.push(parent))
  }
  return visited
}

const isAncestor = (commitMap: Map<string, Commit>, ancestorId: string | null, descendantId: string | null): boolean => {
  if (!ancestorId || !descendantId) {
    return false
  }
  if (ancestorId === descendantId) {
    return true
  }
  const visited = collectAncestors(commitMap, descendantId)
  return visited.has(ancestorId)
}

const findCommonAncestor = (
  commitMap: Map<string, Commit>,
  aId: string,
  bId: string
): string | null => {
  const aAncestors = collectAncestors(commitMap, aId)
  const queue = [bId]
  const seen = new Set<string>()
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || seen.has(current)) {
      continue
    }
    if (aAncestors.has(current)) {
      return current
    }
    seen.add(current)
    const commit = commitMap.get(current)
    commit?.parents.forEach((parent) => queue.push(parent))
  }
  return null
}

const buildConflictMarker = (ours = '', theirs = '', branchName = 'theirs'): string => {
  return `<<<<<<< HEAD\n${ours}\n=======\n${theirs}\n>>>>>>> ${branchName}`
}

const mergeCommitLists = (local: Commit[], remote: Commit[]): Commit[] => {
  const map = getCommitMap(local)
  remote.forEach((commit) => {
    if (!map.has(commit.id)) {
      map.set(commit.id, commit)
    }
  })
  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp)
}

export const applyMerge = (
  repo: RepoState,
  branchName: string | null
): { repo: RepoState; output: string[]; actions: string[] } => {
  const nextRepo = cloneRepoState(repo)
  if (!nextRepo.isInitialized) {
    return {
      repo: nextRepo,
      output: ['fatal: not a git repository. Run "git init" to begin.'],
      actions: []
    }
  }

  if (!branchName) {
    return { repo: nextRepo, output: ['fatal: branch name required.'], actions: [] }
  }

  if (nextRepo.merge.inProgress) {
    return { repo: nextRepo, output: ['Merge already in progress.'], actions: [] }
  }

  if (hasUncommittedChanges(nextRepo)) {
    return {
      repo: nextRepo,
      output: ['Please commit or discard changes before merging.'],
      actions: []
    }
  }

  const targetHead = nextRepo.branches[branchName]
  if (!targetHead) {
    return { repo: nextRepo, output: [`fatal: invalid reference: ${branchName}`], actions: [] }
  }

  const currentHead = nextRepo.head
  if (!currentHead) {
    nextRepo.head = targetHead
    if (nextRepo.headRef) {
      nextRepo.branches[nextRepo.headRef] = targetHead
    }
    const targetCommit = nextRepo.commits.find((commit) => commit.id === targetHead)
    if (targetCommit) {
      nextRepo.workingTree = { ...targetCommit.tree }
    }
    nextRepo.index = {}
    return {
      repo: nextRepo,
      output: ['Fast-forward merge completed.'],
      actions: ['merge', 'merge:ff']
    }
  }

  const commitMap = getCommitMap(nextRepo.commits)
  if (isAncestor(commitMap, targetHead, currentHead)) {
    return { repo: nextRepo, output: ['Already up to date.'], actions: ['merge'] }
  }

  if (isAncestor(commitMap, currentHead, targetHead)) {
    nextRepo.head = targetHead
    if (nextRepo.headRef) {
      nextRepo.branches[nextRepo.headRef] = targetHead
    }
    const targetCommit = commitMap.get(targetHead)
    if (targetCommit) {
      nextRepo.workingTree = { ...targetCommit.tree }
    }
    nextRepo.index = {}
    return {
      repo: nextRepo,
      output: ['Fast-forward', `Updated ${nextRepo.headRef ?? 'main'} to ${targetHead}.`],
      actions: ['merge', 'merge:ff']
    }
  }

  const baseId = findCommonAncestor(commitMap, currentHead, targetHead)
  const baseTree = baseId ? commitMap.get(baseId)?.tree ?? {} : {}
  const oursTree = commitMap.get(currentHead)?.tree ?? {}
  const theirsTree = commitMap.get(targetHead)?.tree ?? {}
  const mergedTree: Record<string, string> = { ...oursTree }
  const conflicts: Record<string, { base?: string; ours?: string; theirs?: string }> = {}
  const allFiles = new Set([...Object.keys(baseTree), ...Object.keys(oursTree), ...Object.keys(theirsTree)])

  allFiles.forEach((file) => {
    const base = baseTree[file]
    const ours = oursTree[file]
    const theirs = theirsTree[file]

    if (ours === theirs) {
      if (ours === undefined) {
        delete mergedTree[file]
      } else {
        mergedTree[file] = ours
      }
      return
    }

    if (base === ours) {
      if (theirs === undefined) {
        delete mergedTree[file]
      } else {
        mergedTree[file] = theirs
      }
      return
    }

    if (base === theirs) {
      if (ours === undefined) {
        delete mergedTree[file]
      } else {
        mergedTree[file] = ours
      }
      return
    }

    conflicts[file] = { base, ours, theirs }
    mergedTree[file] = buildConflictMarker(ours ?? '', theirs ?? '', branchName)
  })

  nextRepo.workingTree = mergedTree
  nextRepo.index = {}

  if (Object.keys(conflicts).length > 0) {
    nextRepo.conflicts = conflicts
    nextRepo.merge = { inProgress: true, target: targetHead, targetBranch: branchName }
    return {
      repo: nextRepo,
      output: ['Automatic merge failed; fix conflicts and then commit the result.'],
      actions: ['merge', 'merge:conflict']
    }
  }

  nextRepo.conflicts = {}
  nextRepo.merge = { inProgress: false, target: null, targetBranch: null }

  const mergeCommit: Commit = {
    id: formatCommitId(nextRepo.commits.length + 1),
    message: `Merge branch '${branchName}'`,
    tree: mergedTree,
    timestamp: Date.now(),
    parents: [currentHead, targetHead]
  }
  nextRepo.commits.push(mergeCommit)
  nextRepo.head = mergeCommit.id
  if (nextRepo.headRef) {
    nextRepo.branches[nextRepo.headRef] = mergeCommit.id
  }

  return {
    repo: nextRepo,
    output: [`Merge made by the 'ort' strategy.`, `[${nextRepo.headRef ?? 'main'} ${mergeCommit.id}] ${mergeCommit.message}`],
    actions: ['merge']
  }
}

export const applyMergeAbort = (
  repo: RepoState
): { repo: RepoState; output: string[]; actions: string[] } => {
  const nextRepo = cloneRepoState(repo)
  if (!nextRepo.merge.inProgress) {
    return { repo: nextRepo, output: ['No merge to abort.'], actions: [] }
  }
  const headCommit = getHeadCommit(nextRepo)
  nextRepo.workingTree = headCommit ? { ...headCommit.tree } : {}
  nextRepo.index = {}
  nextRepo.conflicts = {}
  nextRepo.merge = { inProgress: false, target: null, targetBranch: null }

  return { repo: nextRepo, output: ['Merge aborted.'], actions: ['merge:abort'] }
}

export const applyFetch = (
  repo: RepoState
): { repo: RepoState; output: string[]; actions: string[] } => {
  const nextRepo = cloneRepoState(repo)
  if (!nextRepo.isInitialized) {
    return {
      repo: nextRepo,
      output: ['fatal: not a git repository. Run "git init" to begin.'],
      actions: []
    }
  }

  nextRepo.commits = mergeCommitLists(nextRepo.commits, nextRepo.remote.commits)
  const remoteBranches = Object.keys(nextRepo.remote.branches)
  if (remoteBranches.length === 0) {
    return { repo: nextRepo, output: ['Nothing to fetch.'], actions: ['fetch'] }
  }

  const output = ['Fetched origin.']
  remoteBranches.forEach((branch) => {
    const head = nextRepo.remote.branches[branch] ?? 'no commits'
    output.push(`  origin/${branch} -> ${head}`)
  })

  return { repo: nextRepo, output, actions: ['fetch'] }
}

export const applyPush = (
  repo: RepoState
): { repo: RepoState; output: string[]; actions: string[] } => {
  const nextRepo = cloneRepoState(repo)
  if (!nextRepo.isInitialized) {
    return {
      repo: nextRepo,
      output: ['fatal: not a git repository. Run "git init" to begin.'],
      actions: []
    }
  }

  if (!nextRepo.headRef || !nextRepo.head) {
    return { repo: nextRepo, output: ['Nothing to push.'], actions: [] }
  }

  const commitMap = getCommitMap(mergeCommitLists(nextRepo.commits, nextRepo.remote.commits))
  const remoteHead = nextRepo.remote.branches[nextRepo.headRef] ?? null

  if (remoteHead && !isAncestor(commitMap, remoteHead, nextRepo.head)) {
    return {
      repo: nextRepo,
      output: ['rejected: remote contains work that you do not have.'],
      actions: ['push:rejected']
    }
  }

  nextRepo.remote.commits = mergeCommitLists(nextRepo.remote.commits, nextRepo.commits)
  nextRepo.remote.branches[nextRepo.headRef] = nextRepo.head

  return {
    repo: nextRepo,
    output: [`Pushed ${nextRepo.headRef} to origin/${nextRepo.headRef}.`],
    actions: ['push']
  }
}

export const applyPull = (
  repo: RepoState
): { repo: RepoState; output: string[]; actions: string[] } => {
  const fetchResult = applyFetch(repo)
  const nextRepo = fetchResult.repo
  if (!nextRepo.headRef) {
    return { repo: nextRepo, output: ['Nothing to pull.'], actions: ['pull'] }
  }

  const remoteHead = nextRepo.remote.branches[nextRepo.headRef] ?? null
  if (!remoteHead) {
    return { repo: nextRepo, output: ['Already up to date.'], actions: ['pull'] }
  }

  const commitMap = getCommitMap(nextRepo.commits)
  if (!nextRepo.head || isAncestor(commitMap, nextRepo.head, remoteHead)) {
    nextRepo.head = remoteHead
    nextRepo.branches[nextRepo.headRef] = remoteHead
    const commit = commitMap.get(remoteHead)
    if (commit) {
      nextRepo.workingTree = { ...commit.tree }
    }
    nextRepo.index = {}
    return {
      repo: nextRepo,
      output: [...fetchResult.output, 'Fast-forward pull completed.'],
      actions: ['pull']
    }
  }

  if (isAncestor(commitMap, remoteHead, nextRepo.head)) {
    return { repo: nextRepo, output: [...fetchResult.output, 'Already up to date.'], actions: ['pull'] }
  }

  return {
    repo: nextRepo,
    output: [...fetchResult.output, 'Pull requires a merge. Run git merge to continue.'],
    actions: ['pull']
  }
}
