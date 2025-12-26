type CommandHelp = {
  title: string
  description: string
  example?: string
}

export const commandHelp: Record<string, CommandHelp> = {
  init: {
    title: 'Initialize a repository',
    description: 'Creates a new git repository and starts tracking history.',
    example: 'git init'
  },
  status: {
    title: 'Check working tree status',
    description: 'Shows staged, modified, and untracked files.',
    example: 'git status'
  },
  add: {
    title: 'Stage changes',
    description: 'Moves file content into the index so it will be committed.',
    example: 'git add map.txt'
  },
  commit: {
    title: 'Record a snapshot',
    description: 'Creates a new commit from what is staged in the index.',
    example: 'git commit -m "Message"'
  },
  branch: {
    title: 'Manage branches',
    description: 'Creates a new branch pointer or lists branches.',
    example: 'git branch feature'
  },
  switch: {
    title: 'Switch branches',
    description: 'Moves HEAD to another branch.',
    example: 'git switch feature'
  },
  checkout: {
    title: 'Checkout branches',
    description: 'Moves HEAD to another branch (legacy form).',
    example: 'git checkout feature'
  },
  merge: {
    title: 'Merge histories',
    description: 'Combines another branch into the current branch.',
    example: 'git merge feature'
  },
  reset: {
    title: 'Move HEAD and branch',
    description: 'Resets the current branch to a specific commit.',
    example: 'git reset --hard c002'
  },
  'cherry-pick': {
    title: 'Copy a commit',
    description: 'Applies one commit from elsewhere onto the current branch.',
    example: 'git cherry-pick c003'
  },
  revert: {
    title: 'Undo with a new commit',
    description: 'Creates a new commit that reverses a prior commit.',
    example: 'git revert c003'
  },
  log: {
    title: 'View history',
    description: 'Lists commits with their ids and messages.',
    example: 'git log'
  },
  fetch: {
    title: 'Fetch from origin',
    description: 'Downloads remote commits and updates origin/* tracking.',
    example: 'git fetch'
  },
  pull: {
    title: 'Fetch + integrate',
    description: 'Downloads from origin and fast-forwards local branches when possible.',
    example: 'git pull'
  },
  push: {
    title: 'Send commits',
    description: 'Uploads local commits to origin.',
    example: 'git push'
  }
}

export const getCommandHelp = (command: string | null): CommandHelp | null => {
  if (!command) {
    return null
  }
  const key = command.trim()
  return commandHelp[key] ?? null
}
