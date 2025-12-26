import { CommandResult, RepoState } from './types'
import {
  applyAdd,
  applyBranch,
  applyCommit,
  applyCherryPick,
  applyFetch,
  applyInit,
  applyMerge,
  applyMergeAbort,
  applyPull,
  applyPush,
  applyReset,
  applyRevert,
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
  'usage: git [--version] [--help] [-C <path>] [-c <name>=<value>]',
  '   or: git <command> [<args>]',
  '',
  'These are common Git commands used in various situations:',
  '   init         Create an empty Git repository',
  '   status       Show the working tree status',
  '   add          Add file contents to the index',
  '   commit       Record changes to the repository',
  '   branch       List, create, or delete branches',
  '   switch       Switch branches',
  '   checkout     Switch branches or restore files',
  '   merge        Join two or more development histories together',
  '   reset        Reset current HEAD to a specified state',
  '   cherry-pick  Apply the changes introduced by some existing commits',
  '   revert       Revert some existing commits',
  '   log          Show commit logs',
  '   fetch        Download objects and refs from another repository',
  '   pull         Fetch from and integrate with another repository',
  '   push         Update remote refs along with associated objects',
  '',
  "See 'git help <command>' to read about a specific subcommand."
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
      output: [`bash: ${command}: command not found`],
      repo,
      actions: []
    }
  }

  const [subcommand, ...rest] = args
  if (!subcommand) {
    return {
      ok: true,
      output: buildHelpOutput(),
      repo,
      actions: ['help']
    }
  }

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
      if (rest.length === 0) {
        return {
          ok: false,
          output: ['Nothing specified, nothing added.', "Maybe you wanted to say 'git add .'?"],
          repo,
          actions: []
        }
      }
      const result = applyAdd(repo, rest)
      return { ok: result.output.length === 0 || !result.output[0].startsWith('fatal'), ...result }
    }
    case 'commit': {
      const messageIndex = rest.findIndex((value) => value === '-m')
      const message = messageIndex >= 0 ? rest[messageIndex + 1] ?? null : null
      if (!message) {
        return {
          ok: false,
          output: ['Aborting commit due to empty commit message.'],
          repo,
          actions: []
        }
      }
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
      if (!name) {
        return {
          ok: false,
          output: ['fatal: missing branch name; try -c <name>'],
          repo,
          actions: []
        }
      }
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
      if (!name) {
        return {
          ok: false,
          output: ['fatal: missing branch name; try -b <name>'],
          repo,
          actions: []
        }
      }
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
      if (!name) {
        return {
          ok: false,
          output: ['fatal: no branch specified'],
          repo,
          actions: []
        }
      }
      const result = applyMerge(repo, name)
      const ok = result.output.length === 0 || !result.output[0].startsWith('fatal')
      return { ok, ...result }
    }
    case 'reset': {
      const isHard = rest.includes('--hard')
      const target = rest.find((value) => !value.startsWith('-')) ?? null
      if (!target) {
        return {
          ok: false,
          output: ['fatal: Need a revision to reset to.'],
          repo,
          actions: []
        }
      }
      const result = applyReset(repo, target, isHard)
      const ok = result.output.length === 0 || !result.output[0].startsWith('fatal')
      return { ok, ...result }
    }
    case 'cherry-pick': {
      const target = rest[0] ?? null
      if (!target) {
        return {
          ok: false,
          output: ['fatal: no commit specified'],
          repo,
          actions: []
        }
      }
      const result = applyCherryPick(repo, target)
      const ok = result.output.length === 0 || !result.output[0].startsWith('fatal')
      return { ok, ...result }
    }
    case 'revert': {
      const target = rest[0] ?? null
      if (!target) {
        return {
          ok: false,
          output: ['fatal: no commit specified'],
          repo,
          actions: []
        }
      }
      const result = applyRevert(repo, target)
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
        output: [`git: '${subcommand ?? ''}' is not a git command. See 'git --help'.`],
        repo,
        actions: []
      }
    }
  }
}
