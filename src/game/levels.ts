import { Level, RepoState } from './types'

const createBaseRepo = (overrides: Partial<RepoState>): RepoState => ({
  isInitialized: false,
  branches: {},
  headRef: null,
  head: null,
  commits: [],
  workingTree: {},
  staging: [],
  conflicts: {},
  merge: { inProgress: false, target: null, targetBranch: null },
  remote: { branches: {}, commits: [] },
  ...overrides
})

const levelOne: Level = {
  id: 1,
  title: 'First Commit Island',
  chapter: 'Chapter 1: Boot Camp',
  story: [
    'Welcome to the Archipelago. The Timeline shattered into drifting islands.',
    'Your first task is to anchor this island by recording the map you found.',
    'Initialize the timeline, inspect the shoreline, and seal your first record.'
  ],
  completion: ['The island stabilizes. A true timeline now exists.', 'New currents appear on the horizon.'],
  objectives: [
    {
      id: 'init',
      text: 'Initialize the timeline with git init.',
      check: (state) => state.actions.includes('init')
    },
    {
      id: 'status',
      text: 'Inspect the shoreline with git status.',
      check: (state) => state.actions.includes('status')
    },
    {
      id: 'add-map',
      text: 'Stage map.txt using git add.',
      check: (state) => state.actions.includes('add:map.txt')
    },
    {
      id: 'commit',
      text: 'Record your first repair with git commit -m "message".',
      check: (state) => state.actions.includes('commit')
    }
  ],
  hints: [
    'Try: git init',
    'git status shows what is staged, modified, or untracked.',
    'Use git add map.txt to stage the map.',
    'Commit with git commit -m "your message".'
  ],
  suggestedCommands: [
    'git init',
    'git status',
    'git add map.txt',
    'git commit -m "Anchor the island"'
  ],
  referenceCommands: ['git init', 'git status', 'git add <file>', 'git commit -m "message"', 'git log'],
  xpReward: 100,
  initialRepo: createBaseRepo({
    isInitialized: false,
    workingTree: {
      'map.txt': 'A rough chart of currents and islands.'
    }
  })
}

const levelTwo: Level = {
  id: 2,
  title: 'Tide Notes',
  chapter: 'Chapter 1: Boot Camp',
  story: [
    'The first record holds, but the map needs precision.',
    'Update the chart, check your status, and record a second entry.'
  ],
  completion: ['The chart sharpens. The currents obey the new record.', 'You are ready to explore branching routes.'],
  objectives: [
    {
      id: 'edit-map',
      text: 'Update map.txt in the working directory.',
      check: (state) => state.actions.includes('worktree:update:map.txt')
    },
    {
      id: 'status',
      text: 'Check git status after editing.',
      check: (state) => state.actions.includes('status')
    },
    {
      id: 'add-map',
      text: 'Stage the updated map.txt.',
      check: (state) => state.actions.includes('add:map.txt')
    },
    {
      id: 'commit',
      text: 'Commit the updated map.',
      check: (state) => state.actions.includes('commit')
    }
  ],
  hints: [
    'Edit map.txt in the Working Directory panel.',
    'Use git status to confirm the file is modified.',
    'Stage with git add map.txt.',
    'Commit with git commit -m "message".'
  ],
  suggestedCommands: ['', 'git status', 'git add map.txt', 'git commit -m "Refine the currents"'],
  referenceCommands: ['git status', 'git add <file>', 'git commit -m "message"', 'git log'],
  xpReward: 100,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c001' },
    headRef: 'main',
    head: 'c001',
    commits: [
      {
        id: 'c001',
        message: 'Anchor the island',
        tree: { 'map.txt': 'A rough chart of currents and islands.' },
        timestamp: 1710000000000,
        parents: []
      }
    ],
    workingTree: { 'map.txt': 'A rough chart of currents and islands.' }
  })
}

const levelThree: Level = {
  id: 3,
  title: 'Branch Canyon',
  chapter: 'Chapter 2: Forked Paths',
  story: [
    'Two currents split around a jagged canyon. You need a safer path for new work.',
    'Create a new branch called "feature" and chart a fresh route.',
    'Record a new note in your logbook before you return.'
  ],
  completion: ['A new route is secured. The feature branch holds its own history.', 'Now return to the main current and set your next beacon.'],
  objectives: [
    {
      id: 'branch',
      text: 'Create a new branch named feature.',
      check: (state) => Object.prototype.hasOwnProperty.call(state.repo.branches, 'feature')
    },
    {
      id: 'switch',
      text: 'Switch to the feature branch.',
      check: (state) => state.repo.headRef === 'feature'
    },
    {
      id: 'logbook',
      text: 'Create logbook.md in the working directory.',
      check: (state) => Object.prototype.hasOwnProperty.call(state.repo.workingTree, 'logbook.md')
    },
    {
      id: 'add-logbook',
      text: 'Stage logbook.md with git add.',
      check: (state) => state.actions.includes('add:logbook.md')
    },
    {
      id: 'commit-logbook',
      text: 'Commit your logbook entry on the feature branch.',
      check: (state) => state.actions.includes('commit') && state.repo.headRef === 'feature'
    }
  ],
  hints: [
    'Use git branch feature to create a new branch.',
    'Switch branches with git switch feature.',
    'Create a file in the Working Directory panel, then stage it.',
    'Commit with git commit -m "message".'
  ],
  suggestedCommands: [
    'git branch feature',
    'git switch feature',
    '',
    'git add logbook.md',
    'git commit -m "Map the canyon"'
  ],
  referenceCommands: [
    'git branch <name>',
    'git switch <name>',
    'git checkout -b <name>',
    'git status',
    'git log'
  ],
  xpReward: 100,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c002' },
    headRef: 'main',
    head: 'c002',
    commits: [
      {
        id: 'c001',
        message: 'Chart the shoals',
        tree: { 'map.txt': 'Currents marked with charcoal strokes.' },
        timestamp: 1710000000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Reinforce the harbor',
        tree: { 'map.txt': 'Currents marked with charcoal strokes. New anchor points added.' },
        timestamp: 1710003600000,
        parents: ['c001']
      }
    ],
    workingTree: { 'map.txt': 'Currents marked with charcoal strokes. New anchor points added.' }
  })
}

const levelFour: Level = {
  id: 4,
  title: 'Return to Mainline',
  chapter: 'Chapter 2: Forked Paths',
  story: [
    'The canyon route is recorded. Return to the main current.',
    'Drop a new beacon on main to guide future crews.'
  ],
  completion: ['Main is fortified with a fresh beacon.', 'You are ready to learn how currents converge.'],
  objectives: [
    {
      id: 'switch-main',
      text: 'Switch back to the main branch.',
      check: (state) => state.repo.headRef === 'main'
    },
    {
      id: 'beacon-file',
      text: 'Create beacon.txt in the working directory.',
      check: (state) => Object.prototype.hasOwnProperty.call(state.repo.workingTree, 'beacon.txt')
    },
    {
      id: 'add-beacon',
      text: 'Stage beacon.txt.',
      check: (state) => state.actions.includes('add:beacon.txt')
    },
    {
      id: 'commit-beacon',
      text: 'Commit the beacon on main.',
      check: (state) => state.actions.includes('commit') && state.repo.headRef === 'main'
    }
  ],
  hints: [
    'Use git switch main to return to the main branch.',
    'Create a new file called beacon.txt.',
    'Stage it with git add beacon.txt.',
    'Commit with git commit -m "message".'
  ],
  suggestedCommands: [
    'git switch main',
    '',
    'git add beacon.txt',
    'git commit -m "Light the beacon"'
  ],
  referenceCommands: ['git switch <name>', 'git add <file>', 'git commit -m "message"', 'git log'],
  xpReward: 100,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c002', feature: 'c003' },
    headRef: 'feature',
    head: 'c003',
    commits: [
      {
        id: 'c001',
        message: 'Chart the shoals',
        tree: { 'map.txt': 'Currents marked with charcoal strokes.' },
        timestamp: 1710000000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Reinforce the harbor',
        tree: { 'map.txt': 'Currents marked with charcoal strokes. New anchor points added.' },
        timestamp: 1710003600000,
        parents: ['c001']
      },
      {
        id: 'c003',
        message: 'Map the canyon',
        tree: {
          'map.txt': 'Currents marked with charcoal strokes. New anchor points added.',
          'logbook.md': 'Feature route notes and tide warnings.'
        },
        timestamp: 1710007200000,
        parents: ['c002']
      }
    ],
    workingTree: {
      'map.txt': 'Currents marked with charcoal strokes. New anchor points added.',
      'logbook.md': 'Feature route notes and tide warnings.'
    }
  })
}

const levelFive: Level = {
  id: 5,
  title: 'Confluence Gate',
  chapter: 'Chapter 3: Convergence',
  story: [
    'The feature route is safe. Merge it into the main current.',
    'A fast-forward merge should carry main forward.'
  ],
  completion: ['The currents converge cleanly.', 'Your crew is ready for tougher merges.'],
  objectives: [
    {
      id: 'merge-feature',
      text: 'Merge feature into main with git merge feature.',
      check: (state) => state.actions.includes('merge:ff')
    },
    {
      id: 'log',
      text: 'Inspect the updated history with git log.',
      check: (state) => state.actions.includes('log')
    }
  ],
  hints: ['Switch to main if needed, then run git merge feature.', 'Use git log to confirm the merge.'],
  suggestedCommands: ['git merge feature', 'git log'],
  referenceCommands: ['git merge <branch>', 'git switch <name>', 'git log'],
  xpReward: 120,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c002', feature: 'c003' },
    headRef: 'main',
    head: 'c002',
    commits: [
      {
        id: 'c001',
        message: 'Anchor the mainline',
        tree: { 'map.txt': 'Mainline routes marked.' },
        timestamp: 1710010000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Add supply drops',
        tree: { 'map.txt': 'Mainline routes marked. Supply drops added.' },
        timestamp: 1710013600000,
        parents: ['c001']
      },
      {
        id: 'c003',
        message: 'Feature scouting',
        tree: { 'map.txt': 'Mainline routes marked. Supply drops added. Feature scouting.' },
        timestamp: 1710017200000,
        parents: ['c002']
      }
    ],
    workingTree: { 'map.txt': 'Mainline routes marked. Supply drops added.' }
  })
}

const levelSix: Level = {
  id: 6,
  title: 'Stormy Merge',
  chapter: 'Chapter 3: Convergence',
  story: [
    'Two crews updated the same map in different ways.',
    'Merge the branches, resolve the conflict, and commit the fix.'
  ],
  completion: ['The storm passes. A single, clean record remains.', 'Your crew trusts you with harder timelines.'],
  objectives: [
    {
      id: 'merge',
      text: 'Attempt to merge feature into main.',
      check: (state) => state.actions.includes('merge:conflict')
    },
    {
      id: 'resolve',
      text: 'Resolve the conflict in map.txt and stage it.',
      check: (state) => state.actions.includes('add:map.txt') && state.repo.conflicts['map.txt'] === undefined
    },
    {
      id: 'commit',
      text: 'Commit the merge resolution.',
      check: (state) => state.actions.includes('commit')
    }
  ],
  hints: [
    'Run git merge feature and look for conflict markers.',
    'Edit map.txt to keep the best parts of both changes.',
    'Stage the resolved file with git add map.txt.',
    'Commit the merge with git commit -m "message".'
  ],
  suggestedCommands: ['git merge feature', 'git add map.txt', 'git commit -m "Calm the storm"'],
  referenceCommands: ['git merge <branch>', 'git add <file>', 'git commit -m "message"', 'git merge --abort'],
  xpReward: 150,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c002', feature: 'c003' },
    headRef: 'main',
    head: 'c002',
    commits: [
      {
        id: 'c001',
        message: 'Base chart',
        tree: { 'map.txt': 'Base currents and reefs.' },
        timestamp: 1710020000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Mainline adjustments',
        tree: { 'map.txt': 'Base currents and reefs. Mainline adjustments.' },
        timestamp: 1710023600000,
        parents: ['c001']
      },
      {
        id: 'c003',
        message: 'Feature adjustments',
        tree: { 'map.txt': 'Base currents and reefs. Feature adjustments.' },
        timestamp: 1710027200000,
        parents: ['c001']
      }
    ],
    workingTree: { 'map.txt': 'Base currents and reefs. Mainline adjustments.' }
  })
}

const levelSeven: Level = {
  id: 7,
  title: 'Signal Relay',
  chapter: 'Chapter 4: Distant Currents',
  story: [
    'A distant crew pushed new updates to origin.',
    'Fetch the signal, then pull to sync main.'
  ],
  completion: ['The relay is secure. You are in sync with the fleet.'],
  objectives: [
    {
      id: 'fetch',
      text: 'Fetch the latest updates from origin.',
      check: (state) => state.actions.includes('fetch')
    },
    {
      id: 'pull',
      text: 'Pull to fast-forward main.',
      check: (state) => state.actions.includes('pull') && state.repo.head === 'c003'
    }
  ],
  hints: ['Use git fetch to update remote tracking.', 'Use git pull to fast-forward main.'],
  suggestedCommands: ['git fetch', 'git pull'],
  referenceCommands: ['git fetch', 'git pull', 'git log'],
  xpReward: 120,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c002' },
    headRef: 'main',
    head: 'c002',
    commits: [
      {
        id: 'c001',
        message: 'Initial relay',
        tree: { 'signal.txt': 'Relay established.' },
        timestamp: 1710030000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Local adjustments',
        tree: { 'signal.txt': 'Relay established. Local adjustments.' },
        timestamp: 1710033600000,
        parents: ['c001']
      }
    ],
    workingTree: { 'signal.txt': 'Relay established. Local adjustments.' },
    remote: {
      branches: { main: 'c003' },
      commits: [
        {
          id: 'c001',
          message: 'Initial relay',
          tree: { 'signal.txt': 'Relay established.' },
          timestamp: 1710030000000,
          parents: []
        },
        {
          id: 'c002',
          message: 'Local adjustments',
          tree: { 'signal.txt': 'Relay established. Local adjustments.' },
          timestamp: 1710033600000,
          parents: ['c001']
        },
        {
          id: 'c003',
          message: 'Remote update',
          tree: { 'signal.txt': 'Relay established. Local adjustments. Remote update.' },
          timestamp: 1710037200000,
          parents: ['c002']
        }
      ]
    }
  })
}

const levelEight: Level = {
  id: 8,
  title: 'Push the Beacon',
  chapter: 'Chapter 4: Distant Currents',
  story: [
    'You have new local changes ready for the fleet.',
    'Push your commits so origin stays aligned.'
  ],
  completion: ['Beacon pushed. The fleet sees your work.'],
  objectives: [
    {
      id: 'push',
      text: 'Push your local commits to origin.',
      check: (state) => state.actions.includes('push') && state.repo.remote.branches.main === state.repo.head
    }
  ],
  hints: ['Use git push to send your commits to origin.'],
  suggestedCommands: ['git push'],
  referenceCommands: ['git push', 'git log'],
  xpReward: 120,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c004' },
    headRef: 'main',
    head: 'c004',
    commits: [
      {
        id: 'c001',
        message: 'Initial relay',
        tree: { 'signal.txt': 'Relay established.' },
        timestamp: 1710040000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Local adjustments',
        tree: { 'signal.txt': 'Relay established. Local adjustments.' },
        timestamp: 1710043600000,
        parents: ['c001']
      },
      {
        id: 'c003',
        message: 'Remote update',
        tree: { 'signal.txt': 'Relay established. Local adjustments. Remote update.' },
        timestamp: 1710047200000,
        parents: ['c002']
      },
      {
        id: 'c004',
        message: 'Beacon calibration',
        tree: { 'signal.txt': 'Relay established. Local adjustments. Remote update. Beacon calibration.' },
        timestamp: 1710050800000,
        parents: ['c003']
      }
    ],
    workingTree: { 'signal.txt': 'Relay established. Local adjustments. Remote update. Beacon calibration.' },
    remote: {
      branches: { main: 'c003' },
      commits: [
        {
          id: 'c001',
          message: 'Initial relay',
          tree: { 'signal.txt': 'Relay established.' },
          timestamp: 1710040000000,
          parents: []
        },
        {
          id: 'c002',
          message: 'Local adjustments',
          tree: { 'signal.txt': 'Relay established. Local adjustments.' },
          timestamp: 1710043600000,
          parents: ['c001']
        },
        {
          id: 'c003',
          message: 'Remote update',
          tree: { 'signal.txt': 'Relay established. Local adjustments. Remote update.' },
          timestamp: 1710047200000,
          parents: ['c002']
        }
      ]
    }
  })
}

export const levels: Level[] = [
  levelOne,
  levelTwo,
  levelThree,
  levelFour,
  levelFive,
  levelSix,
  levelSeven,
  levelEight
]

export const getLevelById = (levelId: number): Level => {
  return levels.find((level) => level.id === levelId) ?? levels[0]
}
