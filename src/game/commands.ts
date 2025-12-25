import { CommandResult, RepoState } from './types'
import {
  applyAdd,
  applyBranch,
  applyCommit,
  applyFetch,
  applyInit,
  applyMerge,
  applyMergeAbort,
  applyPull,
  applyPush,
  applySwitch,
  buildBranchOutput,
  buildLogOutput,
  buildStatusOutput
} from './simulator'

const tokenize = (input: string): string[] => {
  const tokens: string[] = []
  let current = ''
  let inQuotes = false
  let quoteChar = '"'

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]

    if ((char === '"' || char === "'") && (!inQuotes || char === quoteChar)) {
      if (inQuotes) {
        inQuotes = false
        quoteChar = '"'
      } else {
        inQuotes = true
        quoteChar = char
      }
      continue
    }

    if (char === ' ' && !inQuotes) {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += char
  }

  if (current) {
    tokens.push(current)
  }

  return tokens
}

const buildHelpOutput = (): string[] => [
  'Available commands:',
  '  git init',
  '  git status',
  '  git add <file>|.',
  '  git commit -m "message"',
  '  git branch <name>',
  '  git switch <name>',
  '  git checkout <name>',
  '  git merge <branch>',
  '  git merge --abort',
  '  git fetch',
  '  git pull',
  '  git push',
  '  git log',
  '  help',
  '  hint',
  '  clear'
]

export const executeCommand = (input: string, repo: RepoState): CommandResult => {
  const tokens = tokenize(input)
  if (tokens.length === 0) {
    return { ok: false, output: [], repo, actions: [] }
  }

  const [command, ...args] = tokens

  if (command === 'help') {
    return { ok: true, output: buildHelpOutput(), repo, actions: ['help'] }
  }

  if (command !== 'git') {
    return {
      ok: false,
      output: ['Unknown command. Try git status or type help.'],
      repo,
      actions: []
    }
  }

  const [subcommand, ...rest] = args

  switch (subcommand) {
    case 'init': {
      const result = applyInit(repo)
      return { ok: true, ...result }
    }
    case 'status': {
      return {
        ok: true,
        output: buildStatusOutput(repo),
        repo,
        actions: ['status']
      }
    }
    case 'add': {
      const result = applyAdd(repo, rest)
      return { ok: result.output.length === 0 || !result.output[0].startsWith('fatal'), ...result }
    }
    case 'commit': {
      const messageIndex = rest.findIndex((value) => value === '-m')
      const message = messageIndex >= 0 ? rest[messageIndex + 1] ?? null : null
      const result = applyCommit(repo, message)
      return { ok: result.actions.length > 0, ...result }
    }
    case 'branch': {
      if (rest.length === 0) {
        return {
          ok: true,
          output: buildBranchOutput(repo),
          repo,
          actions: ['branch:list']
        }
      }
      const name = rest.find((value) => !value.startsWith('-')) ?? null
      const force = rest.includes('-f') || rest.includes('--force')
      const result = applyBranch(repo, name, force)
      const ok = result.output.length === 0 || !result.output[0].startsWith('fatal')
      return { ok, ...result }
    }
    case 'switch': {
      const createIndex = rest.findIndex((value) => value === '-c' || value === '-C')
      if (createIndex >= 0) {
        const name = rest[createIndex + 1] ?? null
        const force = rest[createIndex] === '-C'
        const branchResult = applyBranch(repo, name, force)
        if (branchResult.output[0]?.startsWith('fatal')) {
          return { ok: false, ...branchResult }
        }
        const switchResult = applySwitch(branchResult.repo, name)
        const ok = switchResult.output.length === 0 || !switchResult.output[0].startsWith('fatal')
        return {
          ok,
          repo: switchResult.repo,
          output: [...branchResult.output, ...switchResult.output],
          actions: [...branchResult.actions, ...switchResult.actions]
        }
      }
      const name = rest[0] ?? null
      const result = applySwitch(repo, name)
      const ok = result.output.length === 0 || !result.output[0].startsWith('fatal')
      return { ok, ...result }
    }
    case 'checkout': {
      const createIndex = rest.findIndex((value) => value === '-b' || value === '-B')
      if (createIndex >= 0) {
        const name = rest[createIndex + 1] ?? null
        const force = rest[createIndex] === '-B'
        const branchResult = applyBranch(repo, name, force)
        if (branchResult.output[0]?.startsWith('fatal')) {
          return { ok: false, ...branchResult }
        }
        const switchResult = applySwitch(branchResult.repo, name)
        const ok = switchResult.output.length === 0 || !switchResult.output[0].startsWith('fatal')
        return {
          ok,
          repo: switchResult.repo,
          output: [...branchResult.output, ...switchResult.output],
          actions: [...branchResult.actions, ...switchResult.actions]
        }
      }
      const name = rest[0] ?? null
      const result = applySwitch(repo, name)
      const ok = result.output.length === 0 || !result.output[0].startsWith('fatal')
      return { ok, ...result }
    }
    case 'merge': {
      if (rest.includes('--abort')) {
        const result = applyMergeAbort(repo)
        const ok = result.output.length === 0 || !result.output[0].startsWith('fatal')
        return { ok, ...result }
      }
      const name = rest[0] ?? null
      const result = applyMerge(repo, name)
      const ok = result.output.length === 0 || !result.output[0].startsWith('fatal')
      return { ok, ...result }
    }
    case 'fetch': {
      const result = applyFetch(repo)
      const ok = result.output.length === 0 || !result.output[0].startsWith('fatal')
      return { ok, ...result }
    }
    case 'pull': {
      const result = applyPull(repo)
      const ok = result.output.length === 0 || !result.output[0].startsWith('fatal')
      return { ok, ...result }
    }
    case 'push': {
      const result = applyPush(repo)
      const ok = result.output.length === 0 || !result.output[0].startsWith('fatal')
      return { ok, ...result }
    }
    case 'log': {
      return {
        ok: true,
        output: buildLogOutput(repo),
        repo,
        actions: ['log']
      }
    }
    case 'help':
    case '--help': {
      return { ok: true, output: buildHelpOutput(), repo, actions: ['help'] }
    }
    default: {
      return {
        ok: false,
        output: [`git ${subcommand ?? ''}: command not taught yet.`],
        repo,
        actions: []
      }
    }
  }
}
